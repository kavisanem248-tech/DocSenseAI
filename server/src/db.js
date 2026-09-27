import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config.js';

class Database {
  constructor() {
    this.filePath = config.dbPath;
    this.data = {
      users: [],
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
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.data,
          ...parsed,
          users: parsed.users || [],
          documents: parsed.documents || [],
          pages: parsed.pages || [],
          chunks: parsed.chunks || [],
          analyses: parsed.analyses || {},
          chats: parsed.chats || [],
          settings: { ...this.data.settings, ...(parsed.settings || {}) }
        };
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

  // ================= USERS =================
  createUser({ name, email, passwordHash }) {
    const existing = this.getUserByEmail(email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const user = {
      id: uuidv4(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.users.push(user);
    this.save();

    // Return safe user object without password hash
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  getUserById(id) {
    if (!id) return null;
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  getUserWithHashById(id) {
    if (!id) return null;
    return this.data.users.find(u => u.id === id) || null;
  }

  getUserByEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    return this.data.users.find(u => u.email.toLowerCase() === normalized) || null;
  }

  updateUser(id, updates) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;

    if (updates.name) user.name = updates.name.trim();
    if (updates.passwordHash) user.passwordHash = updates.passwordHash;
    user.updatedAt = new Date().toISOString();

    this.save();
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  // ================= DOCUMENTS (MULTI-TENANT) =================
  getDocuments(userId = null) {
    let docs = this.data.documents;
    if (userId) {
      docs = docs.filter(d => d.userId === userId);
    }
    return [...docs].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }

  getDocumentById(id, userId = null) {
    if (!id) return null;
    const doc = this.data.documents.find(d => d.id === id);
    if (!doc) return null;
    if (userId && doc.userId && doc.userId !== userId) {
      return null; // Enforce strict ownership: does not leak existence
    }
    return doc;
  }

  addDocument(doc) {
    this.data.documents = this.data.documents.filter(d => d.id !== doc.id);
    this.data.documents.push(doc);
    this.save();
    return doc;
  }

  updateDocument(id, updates, userId = null) {
    const doc = this.getDocumentById(id, userId);
    if (!doc) return null;
    Object.assign(doc, updates);
    this.save();
    return doc;
  }

  deleteDocument(id, userId = null) {
    const doc = this.getDocumentById(id, userId);
    if (!doc) return false;

    this.data.documents = this.data.documents.filter(d => d.id !== id);
    this.data.pages = this.data.pages.filter(p => p.docId !== id);
    this.data.chunks = this.data.chunks.filter(c => c.docId !== id);
    delete this.data.analyses[id];
    this.data.chats = this.data.chats.filter(c => c.docId !== id);
    this.save();
    return true;
  }

  // ================= PAGES =================
  setPages(docId, pages) {
    this.data.pages = this.data.pages.filter(p => p.docId !== docId);
    this.data.pages.push(...pages);
    this.save();
  }

  getPages(docId, userId = null) {
    if (userId) {
      const doc = this.getDocumentById(docId, userId);
      if (!doc) return [];
    }
    return this.data.pages.filter(p => p.docId === docId).sort((a, b) => a.pageNumber - b.pageNumber);
  }

  getPage(docId, pageNumber, userId = null) {
    if (userId) {
      const doc = this.getDocumentById(docId, userId);
      if (!doc) return null;
    }
    return this.data.pages.find(p => p.docId === docId && p.pageNumber === parseInt(pageNumber, 10)) || null;
  }

  // ================= CHUNKS =================
  setChunks(docId, chunks) {
    this.data.chunks = this.data.chunks.filter(c => c.docId !== docId);
    this.data.chunks.push(...chunks);
    this.save();
  }

  getChunks(docId, userId = null) {
    if (userId) {
      const doc = this.getDocumentById(docId, userId);
      if (!doc) return [];
    }
    return this.data.chunks.filter(c => c.docId === docId).sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  // ================= ANALYSES =================
  setAnalysis(docId, analysis) {
    this.data.analyses[docId] = {
      ...analysis,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.analyses[docId];
  }

  getAnalysis(docId, userId = null) {
    if (userId) {
      const doc = this.getDocumentById(docId, userId);
      if (!doc) return null;
    }
    return this.data.analyses[docId] || null;
  }

  // ================= CHAT =================
  addChatMessage(chatEntry) {
    this.data.chats.push(chatEntry);
    this.save();
    return chatEntry;
  }

  getChatHistory(docId, userId = null) {
    if (userId) {
      const doc = this.getDocumentById(docId, userId);
      if (!doc) return [];
    }
    return this.data.chats.filter(c => c.docId === docId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  // ================= SETTINGS =================
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
