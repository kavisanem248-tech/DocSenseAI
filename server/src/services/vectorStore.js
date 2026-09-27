/**
 * Tokenizes text and cleans punctuation for vector scoring
 */
function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s$€£%.-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

/**
 * Creates a term frequency vector for lightweight semantic/lexical similarity
 */
function createTermVector(text, vocabulary) {
  const tokens = tokenize(text);
  const tf = {};
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }

  const vec = new Float32Array(vocabulary.length);
  for (let i = 0; i < vocabulary.length; i++) {
    const word = vocabulary[i];
    if (tf[word]) {
      // Log-scaled term frequency
      vec[i] = 1 + Math.log(tf[word]);
    }
  }
  return normalizeVector(vec);
}

function normalizeVector(vec) {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) {
      vec[i] /= norm;
    }
  }
  return vec;
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
  }
  return dot;
}

export class VectorStore {
  constructor() {
    this.indexes = new Map(); // docId -> { vocabulary, chunkVectors, chunks }
  }

  /**
   * Builds an index for a document's chunks
   */
  buildIndex(docId, chunks) {
    // Build vocabulary from all chunks
    const wordDocFreq = new Map();
    for (const chunk of chunks) {
      const words = new Set(tokenize(chunk.text));
      for (const w of words) {
        wordDocFreq.set(w, (wordDocFreq.get(w) || 0) + 1);
      }
    }

    // Keep words that appear in at least 1 chunk
    const vocabulary = Array.from(wordDocFreq.keys());

    const chunkVectors = chunks.map(chunk => ({
      chunkId: chunk.id,
      vector: createTermVector(chunk.text, vocabulary)
    }));

    this.indexes.set(docId, {
      vocabulary,
      chunkVectors,
      chunks
    });

    return {
      indexedChunks: chunks.length,
      vocabSize: vocabulary.length
    };
  }

  /**
   * Searches for top-k chunks relevant to the query
   */
  search(docId, query, topK = 4) {
    const index = this.indexes.get(docId);
    if (!index || !index.chunks || index.chunks.length === 0) {
      return [];
    }

    const queryVec = createTermVector(query, index.vocabulary);
    const queryTokens = new Set(tokenize(query));

    const scored = index.chunks.map((chunk, i) => {
      const vec = index.chunkVectors[i].vector;
      const sim = cosineSimilarity(queryVec, vec);

      // Exact term overlap bonus for specific terms, numbers, dates
      const chunkTokens = tokenize(chunk.text);
      let exactMatches = 0;
      for (const t of chunkTokens) {
        if (queryTokens.has(t)) exactMatches++;
      }
      const overlapScore = queryTokens.size > 0 ? (exactMatches / (queryTokens.size + 5)) : 0;

      const finalScore = (sim * 0.7) + (overlapScore * 0.3);

      return {
        ...chunk,
        score: Math.min(1.0, finalScore)
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

export const vectorStore = new VectorStore();
