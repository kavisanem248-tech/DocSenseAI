import fs from 'fs';
import { config } from './config.js';

class Database {
  constructor() {
    this.filePath = config.dbPath;
    this.data = {
      documents: [],
      pages: [],
      chunks: [],
      analyses: {},
      chats: [],
      settings: {
        provider: config.ai.provider,
        geminiApiKey: config.ai.geminiApiKey,
        openaiApiKey: config.ai.openaiApiKey,
        openaiBaseUrl: config.ai.openaiBaseUrl,
        model: config.ai.model
      }
    };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = { ...this.data, ...JSON.parse(raw) };
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error initializing db, resetting to default structure:', err);
      this.save();
    }
  }

  save() {
    try {
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('Failed to save db:', err);
    }
  }

  // Documents
  getDocuments() {
    return this.data.documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }

  getDocumentById(id) {
    return this.data.documents.find(d => d.id === id) || null;
  }

  addDocument(doc) {
    this.data.documents = this.data.documents.filter(d => d.id !== doc.id);
    this.data.documents.push(doc);
    this.save();
    return doc;
  }

  updateDocument(id, updates) {
    const doc = this.getDocumentById(id);
    if (!doc) return null;
    Object.assign(doc, updates);
    this.save();
    return doc;
  }

  deleteDocument(id) {
    this.data.documents = this.data.documents.filter(d => d.id !== id);
    this.data.pages = this.data.pages.filter(p => p.docId !== id);
    this.data.chunks = this.data.chunks.filter(c => c.docId !== id);
    delete this.data.analyses[id];
    this.data.chats = this.data.chats.filter(c => c.docId !== id);
    this.save();
    return true;
  }

  // Pages
  setPages(docId, pages) {
    this.data.pages = this.data.pages.filter(p => p.docId !== docId);
    this.data.pages.push(...pages);
    this.save();
  }

  getPages(docId) {
    return this.data.pages.filter(p => p.docId === docId).sort((a, b) => a.pageNumber - b.pageNumber);
  }

  getPage(docId, pageNumber) {
    return this.data.pages.find(p => p.docId === docId && p.pageNumber === parseInt(pageNumber, 10)) || null;
  }

  // Chunks
  setChunks(docId, chunks) {
    this.data.chunks = this.data.chunks.filter(c => c.docId !== docId);
    this.data.chunks.push(...chunks);
    this.save();
  }

  getChunks(docId) {
    return this.data.chunks.filter(c => c.docId === docId).sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  // Analyses
  setAnalysis(docId, analysis) {
    this.data.analyses[docId] = {
      ...analysis,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.analyses[docId];
  }

  getAnalysis(docId) {
    return this.data.analyses[docId] || null;
  }

  // Chat
  addChatMessage(chatEntry) {
    this.data.chats.push(chatEntry);
    this.save();
    return chatEntry;
  }

  getChatHistory(docId) {
    return this.data.chats.filter(c => c.docId === docId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  // Settings
  getSettings() {
    return {
      provider: this.data.settings.provider || 'gemini',
      geminiApiKey: this.data.settings.geminiApiKey ? '********' : '',
      hasGeminiApiKey: Boolean(this.data.settings.geminiApiKey),
      openaiApiKey: this.data.settings.openaiApiKey ? '********' : '',
      hasOpenaiApiKey: Boolean(this.data.settings.openaiApiKey),
      openaiBaseUrl: this.data.settings.openaiBaseUrl || 'https://api.openai.com/v1',
      model: this.data.settings.model || 'gemini-1.5-flash'
    };
  }

  getRawSettings() {
    return this.data.settings;
  }

  updateSettings(updates) {
    if (updates.geminiApiKey !== undefined) {
      if (updates.geminiApiKey === '') {
        this.data.settings.geminiApiKey = '';
      } else if (updates.geminiApiKey !== '********') {
        this.data.settings.geminiApiKey = updates.geminiApiKey;
      }
    }
    if (updates.openaiApiKey !== undefined) {
      if (updates.openaiApiKey === '') {
        this.data.settings.openaiApiKey = '';
      } else if (updates.openaiApiKey !== '********') {
        this.data.settings.openaiApiKey = updates.openaiApiKey;
      }
    }
    if (updates.provider) this.data.settings.provider = updates.provider;
    if (updates.openaiBaseUrl) this.data.settings.openaiBaseUrl = updates.openaiBaseUrl;
    if (updates.model) this.data.settings.model = updates.model;

    this.save();
    return this.getSettings();
  }
}

export const db = new Database();
