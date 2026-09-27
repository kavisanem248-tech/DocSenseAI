import { v4 as uuidv4 } from 'uuid';

/**
 * Detects section headings in text
 */
function findSectionHeader(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 90) return null;

  // Patterns for headers:
  // e.g. "Section 4.2 Payment Terms", "Article III: Termination", "1. Introduction", "Schedule B"
  const sectionPatterns = [
    /^(?:section|clause|article|schedule|appendix|exhibit|part)\s+[\w\d.-]+[:\-]?\s*(.*)/i,
    /^(\d+(?:\.\d+)*)\s+([A-Z][\w\s,–-]+)$/,
    /^[A-Z0-9\s,:\-–]{4,60}$/ // Uppercase headings
  ];

  for (const pat of sectionPatterns) {
    if (pat.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

/**
 * Chunks a list of document pages while preserving source page and section metadata
 */
export function chunkDocument(docId, pages, targetChunkWords = 350, overlapWords = 50) {
  const chunks = [];
  let chunkIndex = 0;

  for (const page of pages) {
    const pageNum = page.pageNumber;
    const lines = (page.text || '').split('\n');
    let currentSection = `Page ${pageNum}`;

    // Collect paragraphs
    let paragraphs = [];
    let currentPara = [];

    for (const line of lines) {
      const header = findSectionHeader(line);
      if (header) {
        if (currentPara.length > 0) {
          paragraphs.push({ text: currentPara.join(' '), section: currentSection });
          currentPara = [];
        }
        currentSection = header;
      }
      if (line.trim().length === 0) {
        if (currentPara.length > 0) {
          paragraphs.push({ text: currentPara.join(' '), section: currentSection });
          currentPara = [];
        }
      } else {
        currentPara.push(line.trim());
      }
    }
    if (currentPara.length > 0) {
      paragraphs.push({ text: currentPara.join(' '), section: currentSection });
    }

    if (paragraphs.length === 0 && (page.text || '').trim()) {
      paragraphs = [{ text: page.text.trim(), section: currentSection }];
    }

    // Now chunk paragraphs with word limit and overlap
    let currentChunkWords = [];
    let chunkActiveSection = currentSection;

    for (const para of paragraphs) {
      const words = para.text.split(/\s+/).filter(Boolean);
      if (words.length === 0) continue;

      if (currentChunkWords.length === 0) {
        chunkActiveSection = para.section;
      }

      currentChunkWords.push(...words);

      if (currentChunkWords.length >= targetChunkWords) {
        const chunkText = currentChunkWords.join(' ');
        chunks.push({
          id: `chk_${docId}_${chunkIndex++}`,
          docId,
          page: pageNum,
          section: chunkActiveSection,
          chunkIndex,
          text: chunkText,
          wordCount: currentChunkWords.length
        });

        // Retain overlap for the next chunk
        currentChunkWords = currentChunkWords.slice(-overlapWords);
      }
    }

    // Remaining words for the page
    if (currentChunkWords.length > 0) {
      const chunkText = currentChunkWords.join(' ');
      chunks.push({
        id: `chk_${docId}_${chunkIndex++}`,
        docId,
        page: pageNum,
        section: chunkActiveSection,
        chunkIndex,
        text: chunkText,
        wordCount: currentChunkWords.length
      });
      currentChunkWords = [];
    }
  }

  return chunks;
}
