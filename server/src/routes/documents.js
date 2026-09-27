import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validateUploadedFile } from '../validators/fileValidator.js';
import { extractDocument } from '../extractors/documentExtractor.js';
import { checkDocumentQuality } from '../services/qualityChecker.js';
import { chunkDocument } from '../services/chunker.js';
import { vectorStore } from '../services/vectorStore.js';
import { analyzeDocument } from '../services/analysisEngine.js';
import { askDocument } from '../services/chatService.js';

const router = express.Router();

// Enforce authentication on all document operations
router.use(requireAuth);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize }
});

// 1. Upload Document (Belongs to req.user)
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please select a valid document.' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // Validate file
    const validation = await validateUploadedFile(filePath, originalName);
    if (!validation.valid) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ error: validation.error });
    }

    const docId = uuidv4();
    const docRecord = {
      id: docId,
      userId: req.user.id,
      originalName,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      extension: validation.extension,
      pageCount: null,
      status: 'uploaded', // 'uploaded' | 'processing' | 'completed' | 'failed'
      progress: 10,
      stage: 'Uploaded successfully',
      uploadedAt: new Date().toISOString(),
      analyzedAt: null,
      error: null
    };

    db.addDocument(docRecord);

    res.status(201).json({
      success: true,
      document: docRecord,
      message: 'File validated and uploaded successfully.'
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: `File upload failed: ${err.message}` });
  }
});

// 2. List User Documents (Strictly filtered by req.user.id)
router.get('/', (req, res) => {
  try {
    const docs = db.getDocuments(req.user.id);
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Single Document Metadata (Strictly verifies req.user.id)
router.get('/:id', (req, res) => {
  try {
    const doc = db.getDocumentById(req.params.id, req.user.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    const pages = db.getPages(doc.id, req.user.id);
    res.json({ document: doc, pagesCount: pages.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Run Complete Analysis Pipeline (Strictly verifies req.user.id)
router.post('/:id/analyze', async (req, res) => {
  const docId = req.params.id;
  const doc = db.getDocumentById(docId, req.user.id);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const filePath = path.join(config.uploadDir, doc.storedName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Stored document file was not found on disk.' });
  }

  // Update status: Processing started
  db.updateDocument(docId, {
    status: 'processing',
    progress: 15,
    stage: 'Reading document and extracting text'
  }, req.user.id);

  // Respond immediately with processing state
  res.json({
    success: true,
    message: 'Analysis pipeline initiated.',
    documentId: docId
  });

  // Execute processing asynchronously with accurate stage tracking
  (async () => {
    try {
      // Step 1: Extraction
      db.updateDocument(docId, { progress: 25, stage: 'Extracting pages, text, and tables' }, req.user.id);
      const extracted = await extractDocument(filePath, doc.originalName);

      // Step 2: Quality Check
      db.updateDocument(docId, { progress: 40, stage: 'Running automated text quality check' }, req.user.id);
      const quality = checkDocumentQuality(extracted);

      if (quality.status === 'failed') {
        db.updateDocument(docId, {
          status: 'failed',
          progress: 100,
          stage: 'Text extraction failed',
          error: quality.message
        }, req.user.id);
        return;
      }

      // Step 3: Save pages
      const pageRecords = extracted.pages.map(p => ({
        id: `page_${docId}_${p.pageNumber}`,
        docId,
        pageNumber: p.pageNumber,
        text: p.text,
        charCount: p.charCount,
        tableDetected: p.tableDetected,
        ocrUsed: p.ocrUsed
      }));
      db.setPages(docId, pageRecords);

      // Step 4: Chunking
      db.updateDocument(docId, { progress: 55, stage: 'Dividing document into traceable chunks' }, req.user.id);
      const chunks = chunkDocument(docId, extracted.pages);
      db.setChunks(docId, chunks);

      // Step 5: Vector Index
      db.updateDocument(docId, { progress: 70, stage: 'Building semantic RAG vector index' }, req.user.id);
      vectorStore.buildIndex(docId, chunks);

      // Step 6: AI Analysis & Extraction
      db.updateDocument(docId, { progress: 85, stage: 'Analyzing deadlines, obligations, financials, and cross-checks' }, req.user.id);
      const analysisResult = await analyzeDocument(doc, extracted.pages, chunks);

      // Step 7: Store Analysis & Complete
      db.setAnalysis(docId, {
        ...analysisResult,
        qualityCheck: quality,
        analyzedAt: new Date().toISOString()
      });

      db.updateDocument(docId, {
        status: 'completed',
        progress: 100,
        stage: 'Analysis complete',
        pageCount: extracted.pageCount,
        analyzedAt: new Date().toISOString(),
        qualityCheck: quality
      }, req.user.id);
    } catch (pipelineErr) {
      console.error(`Pipeline error for doc ${docId}:`, pipelineErr);
      db.updateDocument(docId, {
        status: 'failed',
        progress: 100,
        stage: 'Analysis encountered an error',
        error: pipelineErr.message
      }, req.user.id);
    }
  })();
});

// 5. Get Analysis Results (Strictly verifies req.user.id)
router.get('/:id/analysis', (req, res) => {
  try {
    const docId = req.params.id;
    const doc = db.getDocumentById(docId, req.user.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const analysis = db.getAnalysis(docId, req.user.id);
    if (!analysis) {
      return res.status(404).json({
        error: 'No analysis results found yet for this document.',
        status: doc.status,
        stage: doc.stage,
        progress: doc.progress
      });
    }

    res.json({
      document: doc,
      analysis
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Get Mapped Sources (Strictly verifies req.user.id)
router.get('/:id/sources', (req, res) => {
  try {
    const docId = req.params.id;
    const doc = db.getDocumentById(docId, req.user.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const chunks = db.getChunks(docId, req.user.id);
    const analysis = db.getAnalysis(docId, req.user.id);

    const sources = {
      chunks: chunks.map(c => ({
        id: c.id,
        page: c.page,
        section: c.section,
        preview: c.text.slice(0, 180) + '...'
      })),
      deadlines: (analysis?.deadlines || []).map(d => ({ item: d.description, date: d.date, page: d.page, sourceText: d.sourceText })),
      obligations: (analysis?.obligations || []).map(o => ({ party: o.party, action: o.action, page: o.page, sourceText: o.sourceText })),
      financials: (analysis?.financialValues || []).map(f => ({ item: f.item, amount: f.amount, page: f.page, sourceText: f.sourceText })),
      anomalies: (analysis?.anomalies || []).map(a => ({ type: a.type, description: a.description, page: a.page, evidence: a.evidence }))
    };

    res.json({ sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Ask Your Document (RAG Q&A - Strictly isolated to user's document)
router.post('/:id/ask', async (req, res) => {
  try {
    const docId = req.params.id;
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const doc = db.getDocumentById(docId, req.user.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Ensure chunks are in vector store strictly for this document
    let chunks = db.getChunks(docId, req.user.id);
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'Document must be analyzed before asking questions.' });
    }

    vectorStore.buildIndex(docId, chunks);

    const history = db.getChatHistory(docId, req.user.id);
    const result = await askDocument(doc, question, history);

    const chatEntry = {
      id: uuidv4(),
      docId,
      question,
      answer: result.answer,
      sources: result.sources,
      confidence: result.confidence,
      timestamp: new Date().toISOString()
    };

    db.addChatMessage(chatEntry);

    res.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      confidence: result.confidence
    });
  } catch (err) {
    console.error('Ask error:', err);
    res.status(500).json({ error: `Unable to process question: ${err.message}` });
  }
});

// 8. Get Chat History (Strictly verifies req.user.id)
router.get('/:id/chat-history', (req, res) => {
  try {
    const doc = db.getDocumentById(req.params.id, req.user.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    const history = db.getChatHistory(req.params.id, req.user.id);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Get Page Content for Document Viewer (Strictly verifies req.user.id)
router.get('/:id/pages/:page', (req, res) => {
  try {
    const docId = req.params.id;
    const doc = db.getDocumentById(docId, req.user.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const pageNum = parseInt(req.params.page, 10);
    const page = db.getPage(docId, pageNum, req.user.id);

    if (!page) {
      return res.status(404).json({ error: `Page ${pageNum} not found for this document.` });
    }

    res.json({ page });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Serve Original Document File (Strictly verifies req.user.id)
router.get('/:id/file', (req, res) => {
  try {
    const doc = db.getDocumentById(req.params.id, req.user.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const filePath = path.join(config.uploadDir, doc.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on storage disk.' });
    }

    res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Delete Document (Strictly verifies req.user.id and purges all assets)
router.delete('/:id', (req, res) => {
  try {
    const docId = req.params.id;
    const doc = db.getDocumentById(docId, req.user.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const filePath = path.join(config.uploadDir, doc.storedName);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }

    db.deleteDocument(docId, req.user.id);
    res.json({ success: true, message: 'Document and all associated analysis deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
