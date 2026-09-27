import fs from 'fs';
import path from 'path';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Checks magic bytes of the file buffer to verify true file type
 */
function checkMagicBytes(buffer, ext) {
  if (!buffer || buffer.length < 4) return false;

  const hex4 = buffer.slice(0, 4).toString('hex').toUpperCase();
  const asciiHeader = buffer.slice(0, 8).toString('ascii');

  switch (ext) {
    case '.pdf':
      return asciiHeader.startsWith('%PDF-');
    case '.png':
      return hex4 === '89504E47';
    case '.jpg':
    case '.jpeg':
      return hex4.startsWith('FFD8');
    case '.docx':
      return hex4 === '504B0304'; // Zip archive used by docx
    case '.doc':
      return hex4 === 'D0CF11E0' || hex4 === '504B0304';
    default:
      return false;
  }
}

/**
 * Validates an uploaded file.
 * Returns { valid: boolean, error?: string, details?: any }
 */
export async function validateUploadedFile(filePath, originalFilename) {
  try {
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'File was not saved properly or does not exist.' };
    }

    const stats = fs.statSync(filePath);

    // 1. Check empty file
    if (stats.size === 0) {
      return { valid: false, error: 'Empty file. Uploaded document contains 0 bytes.' };
    }

    // 2. Check maximum size
    if (stats.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File is too large (${(stats.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 50MB.`
      };
    }

    // 3. Check extension
    const ext = path.extname(originalFilename || filePath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported file type "${ext}". Supported formats are PDF, DOC, DOCX, PNG, JPG, and JPEG.`
      };
    }

    // 4. Check magic bytes
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    const matchesMagic = checkMagicBytes(buffer, ext);
    if (!matchesMagic) {
      return {
        valid: false,
        error: `Corrupted file or mismatched file extension. File header does not match expected format for ${ext.toUpperCase()}.`
      };
    }

    return {
      valid: true,
      size: stats.size,
      extension: ext,
      originalFilename
    };
  } catch (err) {
    return {
      valid: false,
      error: `Unable to read this document: ${err.message}`
    };
  }
}
