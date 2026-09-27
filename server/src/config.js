import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(rootDir, '.env') });

const UPLOAD_DIR = path.join(rootDir, 'uploads');
const DATA_DIR = path.join(rootDir, 'data');

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const config = {
  port: process.env.PORT || 5000,
  uploadDir: UPLOAD_DIR,
  dataDir: DATA_DIR,
  dbPath: path.join(DATA_DIR, 'db.json'),
  maxFileSize: 50 * 1024 * 1024, // 50MB
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini', // 'gemini' | 'openai' | 'builtin'
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.AI_MODEL || 'gemini-1.5-flash',
  },
  jwtSecret: process.env.JWT_SECRET || 'docsenseai-super-secret-jwt-key-2026-secure'
};
