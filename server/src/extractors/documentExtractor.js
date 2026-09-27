import fs from 'fs';
import path from 'path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import { performOcr } from './ocrExtractor.js';

/**
 * Checks if a string contains structured tabular data
 */
function detectTableInText(text) {
  const lines = text.split('\n');
  let tableRowCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Checks pipe separated table
    if (trimmed.includes('|') && trimmed.split('|').length >= 3) {
      tableRowCount++;
      continue;
    }
    // Checks tabs or 2+ consecutive spaces separating words/numbers
    const segments = trimmed.split(/\s{2,}|\t/).map(s => s.trim()).filter(Boolean);
    if (segments.length >= 3 && segments.some(s => /[\d$,.₹€£%]/.test(s))) {
      tableRowCount++;
    }
  }

  return tableRowCount >= 2;
}

/**
 * Extracts content from PDF files page-by-page
 */
async function extractPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = new Uint8Array(buffer);

  const loadingTask = pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true
  });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let metadata = { pages: numPages };
  try {
    const meta = await pdfDoc.getMetadata();
    if (meta && meta.info) {
      metadata = {
        ...metadata,
        title: meta.info.Title || '',
        author: meta.info.Author || '',
        creator: meta.info.Creator || '',
        creationDate: meta.info.CreationDate || ''
      };
    }
  } catch (e) {
    // Ignore metadata retrieval error
  }

  const pages = [];
  let fullTextParts = [];
  let totalChars = 0;
  let tablesCount = 0;
  let sparsePagesCount = 0;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    
    // Sort text items by vertical position (Y descending) then horizontal (X ascending)
    const items = textContent.items.map(item => ({
      str: item.str,
      x: item.transform ? item.transform[4] : 0,
      y: item.transform ? item.transform[5] : 0
    }));

    // Group items into lines
    let lines = [];
    let currentY = null;
    let currentLine = [];

    for (const item of items) {
      if (currentY === null || Math.abs(item.y - currentY) > 4) {
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
        }
        currentLine = [item.str];
        currentY = item.y;
      } else {
        currentLine.push(item.str);
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }

    const pageText = lines.join('\n').trim();
    const charCount = pageText.length;
    totalChars += charCount;

    if (charCount < 50) {
      sparsePagesCount++;
    }

    const hasTable = detectTableInText(pageText);
    if (hasTable) tablesCount++;

    pages.push({
      pageNumber: i,
      text: pageText,
      charCount,
      tableDetected: hasTable,
      ocrUsed: false
    });

    if (pageText) {
      fullTextParts.push(`--- Page ${i} ---\n${pageText}`);
    }
  }

  const isScannedOrSparse = numPages > 0 && (sparsePagesCount === numPages || (totalChars / numPages) < 40);

  return {
    fileType: 'pdf',
    pageCount: numPages,
    metadata,
    pages,
    fullText: fullTextParts.join('\n\n'),
    tablesDetected: tablesCount,
    ocrUsed: false,
    ocrRequired: isScannedOrSparse,
    isScanned: isScannedOrSparse
  };
}

/**
 * Extracts content from Word documents (.docx)
 */
async function extractDocx(filePath) {
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  const rawText = result.value || '';

  // Approximate pages by splitting into ~350 word chunks
  const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim());
  const pages = [];
  let currentPageText = [];
  let currentWordCount = 0;
  let pageNum = 1;
  let tablesCount = 0;

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).length;
    currentPageText.push(para.trim());
    currentWordCount += words;

    if (detectTableInText(para)) {
      tablesCount++;
    }

    if (currentWordCount >= 350) {
      const pText = currentPageText.join('\n\n');
      pages.push({
        pageNumber: pageNum++,
        text: pText,
        charCount: pText.length,
        tableDetected: detectTableInText(pText),
        ocrUsed: false
      });
      currentPageText = [];
      currentWordCount = 0;
    }
  }

  if (currentPageText.length > 0 || pages.length === 0) {
    const pText = currentPageText.join('\n\n');
    pages.push({
      pageNumber: pageNum,
      text: pText,
      charCount: pText.length,
      tableDetected: detectTableInText(pText),
      ocrUsed: false
    });
  }

  const fullText = pages.map(p => `--- Page ${p.pageNumber} ---\n${p.text}`).join('\n\n');

  return {
    fileType: 'docx',
    pageCount: pages.length,
    metadata: { pages: pages.length },
    pages,
    fullText,
    tablesDetected: tablesCount,
    ocrUsed: false,
    ocrRequired: false,
    isScanned: false
  };
}

/**
 * Extracts content from Image files using OCR
 */
async function extractImage(filePath, ext) {
  const ocrRes = await performOcr(filePath);
  const text = (ocrRes.text || '').trim();
  const hasTable = detectTableInText(text);

  const pages = [{
    pageNumber: 1,
    text,
    charCount: text.length,
    tableDetected: hasTable,
    ocrUsed: true,
    confidence: ocrRes.confidence
  }];

  return {
    fileType: ext.replace('.', ''),
    pageCount: 1,
    metadata: { pages: 1, ocrConfidence: ocrRes.confidence },
    pages,
    fullText: `--- Page 1 (OCR) ---\n${text}`,
    tablesDetected: hasTable ? 1 : 0,
    ocrUsed: true,
    ocrRequired: true,
    isScanned: true
  };
}

/**
 * Universal document extraction dispatcher
 */
export async function extractDocument(filePath, originalFilename) {
  const ext = path.extname(originalFilename || filePath).toLowerCase();

  switch (ext) {
    case '.pdf':
      return await extractPdf(filePath);
    case '.docx':
    case '.doc':
      return await extractDocx(filePath);
    case '.png':
    case '.jpg':
    case '.jpeg':
      return await extractImage(filePath, ext);
    default:
      throw new Error(`Unsupported document extension for extraction: ${ext}`);
  }
}
