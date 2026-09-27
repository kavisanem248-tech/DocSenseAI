import { vectorStore } from './vectorStore.js';
import { callAiModel } from './aiProvider.js';

/**
 * Handles RAG Q&A for "Ask Your Document"
 */
export async function askDocument(doc, query, chatHistory = []) {
  if (!query || !query.trim()) {
    throw new Error('Question query cannot be empty.');
  }

  // 1. Retrieve top-k relevant chunks from vector store
  const relevantChunks = vectorStore.search(doc.id, query, 4);

  if (!relevantChunks || relevantChunks.length === 0 || (relevantChunks[0].score < 0.08 && !isGeneralSummaryQuery(query))) {
    return {
      answer: 'The document does not provide enough information to answer this.',
      sources: [],
      confidence: 0
    };
  }

  // Check if query is explicitly asking about something not present
  const topScore = relevantChunks[0].score;

  // Build context with source citations
  const contextText = relevantChunks
    .map(c => `[SOURCE: Page ${c.page}, Section: "${c.section}"]\n${c.text}`)
    .join('\n\n---\n\n');

  // Try calling AI LLM if configured
  const systemPrompt = `You are a high-precision document assistant. Answer the user's question using ONLY the provided document excerpts.
CRITICAL RULES:
1. Every answer must be strictly supported by the provided text.
2. If the excerpts do NOT contain enough information to answer accurately, you MUST reply:
   "The document does not provide enough information to answer this."
3. Always include the source page numbers and exact quotes where available.
4. Never speculate or hallucinate outside the given text.`;

  const prompt = `DOCUMENT CONTEXT:
${contextText}

USER QUESTION: ${query}

Provide a concise, direct answer followed by exact source citation.`;

  const aiRes = await callAiModel({ systemPrompt, prompt, temperature: 0.1 });

  if (aiRes.success && aiRes.text) {
    const answer = aiRes.text.trim();
    const sources = relevantChunks.slice(0, 3).map(c => ({
      page: c.page,
      section: c.section,
      quote: c.text.slice(0, 160) + (c.text.length > 160 ? '...' : ''),
      relevanceScore: Math.round(c.score * 100)
    }));

    return {
      answer,
      sources,
      confidence: Math.round(topScore * 100)
    };
  }

  // Deterministic RAG fallback: Extract sentence best matching the query tokens
  return answerWithDeterministicRag(query, relevantChunks);
}

function isGeneralSummaryQuery(query) {
  return /\b(summary|overview|what is this|about|explain|main points|key findings)\b/i.test(query);
}

function answerWithDeterministicRag(query, chunks) {
  const stopWords = new Set([
    'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then',
    'so', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up',
    'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'please', 'tell', 'me'
  ]);

  const queryWords = query.toLowerCase()
    .replace(/[^\w\s$€£%.-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  let bestSentence = '';
  let bestChunk = chunks[0];
  let maxMatches = 0;

  for (const chunk of chunks) {
    // Split on sentence boundaries and newlines
    const sentences = chunk.text.split(/(?<=[.?!])\s+|\n+/);
    for (const s of sentences) {
      const trimmed = s.trim();
      if (trimmed.length < 8) continue;
      const sLower = trimmed.toLowerCase();

      const matches = queryWords.filter(w => sLower.includes(w)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = trimmed;
        bestChunk = chunk;
      }
    }
  }

  // If query had keywords, require at least 1 match (or at least 2 if query had multiple keywords)
  const requiredMatches = queryWords.length >= 2 ? 2 : 1;
  const isMatchValid = queryWords.length > 0 ? (maxMatches >= requiredMatches) : false;

  if (!isMatchValid) {
    if (isGeneralSummaryQuery(query)) {
      bestSentence = chunks[0].text.split(/(?<=[.?!])\s+|\n+/)[0] || chunks[0].text.slice(0, 180);
      bestChunk = chunks[0];
    } else {
      return {
        answer: 'The document does not provide enough information to answer this.',
        sources: [],
        confidence: 0
      };
    }
  }

  const sources = chunks.slice(0, 3).map(c => ({
    page: c.page,
    section: c.section,
    quote: c.text.slice(0, 160) + (c.text.length > 160 ? '...' : ''),
    relevanceScore: Math.round(c.score * 100)
  }));

  return {
    answer: bestSentence,
    sources,
    confidence: Math.round(bestChunk.score * 100)
  };
}
