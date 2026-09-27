import { createWorker } from 'tesseract.js';

let workerInstance = null;

async function getWorker() {
  if (!workerInstance) {
    workerInstance = await createWorker('eng');
  }
  return workerInstance;
}

/**
 * Runs OCR on an image file or buffer using Tesseract.js
 */
export async function performOcr(imageSource) {
  try {
    const worker = await getWorker();
    const ret = await worker.recognize(imageSource);
    return {
      success: true,
      text: ret.data.text || '',
      confidence: ret.data.confidence || 0,
      lines: ret.data.lines ? ret.data.lines.map(l => l.text) : []
    };
  } catch (err) {
    console.error('OCR Extraction error:', err);
    return {
      success: false,
      text: '',
      confidence: 0,
      error: err.message
    };
  }
}
