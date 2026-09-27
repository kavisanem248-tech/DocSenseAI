/**
 * Performs automated document quality validation before AI analysis
 */
export function checkDocumentQuality(extractionResult) {
  const {
    pageCount,
    pages,
    fullText,
    tablesDetected,
    ocrRequired,
    ocrUsed,
    isScanned
  } = extractionResult;

  const totalChars = (fullText || '').trim().length;
  const wordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;

  const checks = {
    textExtracted: totalChars > 0,
    isEmpty: totalChars === 0,
    isTooShort: wordCount < 10,
    isImageOnly: isScanned && !ocrUsed,
    pagesPresent: pageCount > 0,
    tablesPresent: tablesDetected > 0,
    ocrRequired: Boolean(ocrRequired),
    ocrUsed: Boolean(ocrUsed),
    wordCount,
    totalChars,
    pageCount
  };

  let qualityScore = 100;
  let status = 'passed';
  let message = 'Document passed text quality checks and is ready for AI analysis.';

  if (checks.isEmpty) {
    qualityScore = 0;
    status = 'failed';
    message = 'No readable text could be extracted from this document. It may be a blank file or a flat scanned image requiring high-resolution OCR.';
  } else if (checks.isTooShort) {
    qualityScore = 30;
    status = 'warning';
    message = 'Extracted text is very brief (less than 10 words). Analysis results may be limited.';
  } else if (checks.isImageOnly) {
    qualityScore = 40;
    status = 'warning';
    message = 'Document appears to be image-only / scanned. OCR fallback was flagged.';
  } else {
    // Check page density
    const avgWordsPerPage = wordCount / Math.max(pageCount, 1);
    if (avgWordsPerPage < 20) {
      qualityScore = 75;
      message = 'Document has low text density on several pages.';
    }
  }

  return {
    status,
    qualityScore,
    message,
    checks
  };
}
