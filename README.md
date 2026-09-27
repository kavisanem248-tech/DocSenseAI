# DocSenseAI — Intelligent Document Analysis Platform

> **"Understand Documents. Discover Insights. Verify Sources."**

A complete, production-grade, end-to-end AI document intelligence platform built with **React**, **Tailwind CSS**, **Node.js/Express**, **PDF.js**, **Tesseract OCR**, and **Grounded RAG**.

---

## 🌟 Official Brand Identity

- **App Name:** `DocSenseAI`
- **Full Title:** `DocSenseAI — Intelligent Document Analysis Platform`
- **Tagline:** `Understand Documents. Discover Insights. Verify Sources.`
- **Design System:** Professional Blue (`#2563eb`) & White light theme with high-contrast accessibility.
- **Logo:** Official `DocSenseAI` emblem integrated into navigation headers, landing hero, upload dropzone, dashboard header, document viewer, Ask Your Document chat, and browser favicon.

---

## 🚀 Key Features

1. **Multi-Format Ingestion & Validation**
   - Supports **PDF, DOC, DOCX, PNG, JPG, and JPEG** up to 50MB.
   - Comprehensive validation: MIME validation, magic byte checking, empty file detection, and corrupted file rejection.

2. **Full Extraction Pipeline with OCR Fallback**
   - Page-by-page text, table detection, and metadata extraction using `pdfjs-dist` and `mammoth`.
   - Automated OCR fallback using pure in-process `tesseract.js` for images and scanned documents with sparse/missing text layers.

3. **Page-Aware Traceable Chunking**
   - Preserves exact `pageNumber`, `sectionHeading`, `chunkIndex`, and character boundaries for every chunk.
   - Enables direct click-to-page navigation throughout the application.

4. **Information Extraction Engine**
   - **Deadlines:** Due dates, submission deadlines, payment terms, renewal dates, and time limits with original sentence context.
   - **Obligations:** Responsible party, binding action (`shall`, `must`, `agrees to`), deadlines, and conditions (`provided that`, `unless`).
   - **Financial Values:** Amounts, currency, subtotal, tax, total, penalties, fees, and deposits.
   - **Mathematical Cross-Checking:** Automatic validation of financial totals (`Subtotal + Tax = Total`). Flags discrepancies as *"Potential financial inconsistency detected"*.
   - **Date Cross-Checking:** Detects contradictory milestone dates across different pages.
   - **Missing Data Detection:** Detects referenced attachments missing from document pages (e.g. *"Appendix B cited in text but not found"*), and unexecuted signature blocks.
   - **Smart Summary:** Executive summary, key points, important dates, obligations, financial overview, potential issues, and key findings.

5. **Integrated Document Viewer with Source Jumps**
   - Native document embed and interactive reader.
   - Responds to `?page=X&highlight=Y` parameters so clicking any **Source Badge** jumps directly to that page and highlights relevant text.

6. **Ask Your Document (Grounded RAG Chat)**
   - Semantic vector retrieval with cosine similarity + BM25 keyword matching.
   - Zero hallucination policy: If information is not in the document, responds with *"The document does not provide enough information to answer this."*
   - Every answer includes clickable source badges linked to the original document pages.

7. **15-Point Automated Health Check Suite**
   - Built-in live test runner accessible from the top navigation bar or via `npm test` verifying all 15 core architectural requirements.

---

## ⚡ Quick Start

### 1. Start Backend Server
```bash
npm run server
# Server starts at http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 2. Start Frontend Client
```bash
npm run client
# Vite dev server runs at http://localhost:5173
```

### 3. Run Automated 15-Point Test Suite
```bash
npm test
# Verifies upload, extraction, OCR, chunking, RAG, deadlines, financials, anomalies, and DB
```
