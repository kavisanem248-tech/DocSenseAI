import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config.js';
import { db } from './db.js';
import documentsRouter from './routes/documents.js';
import settingsRouter from './routes/settings.js';
import testsRouter from './routes/tests.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static route for uploaded files
app.use('/uploads', express.static(config.uploadDir));

// System Health Check
app.get('/api/health', (req, res) => {
  const settings = db.getSettings();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    storageDir: config.uploadDir,
    aiProvider: settings.provider,
    hasApiKey: settings.hasGeminiApiKey || settings.hasOpenaiApiKey
  });
});

// API Routes
app.use('/api/documents', documentsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/tests', testsRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error occurred',
    status: 'error'
  });
});

app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(` AI REPORT ANALYZER BACKEND SERVER RUNNING`);
  console.log(` Port: ${config.port}`);
  console.log(` Health: http://localhost:${config.port}/api/health`);
  console.log(` Documents API: http://localhost:${config.port}/api/documents`);
  console.log(`===============================================`);
});

export default app;
