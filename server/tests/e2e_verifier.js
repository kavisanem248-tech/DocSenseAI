import path from 'path';
import fs from 'fs';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { config } from '../src/config.js';
import { db } from '../src/db.js';
import { validateUploadedFile } from '../src/validators/fileValidator.js';
import { extractDocument } from '../src/extractors/documentExtractor.js';
import { checkDocumentQuality } from '../src/services/qualityChecker.js';
import { chunkDocument } from '../src/services/chunker.js';
import { vectorStore } from '../src/services/vectorStore.js';
import { analyzeDocument } from '../src/services/analysisEngine.js';
import { askDocument } from '../src/services/chatService.js';

async function verifyEndToEndPipeline() {
  console.log('================================================================');
  console.log(' STARTING COMPLETE END-TO-END VERIFICATION OF DOCSENSEAI');
  console.log('================================================================\n');

  const testUniqueId = `test_${Date.now()}`;
  const customDocName = `Hyperion_Contract_${testUniqueId}.pdf`;
  const filePath = path.join(config.uploadDir, customDocName);

  // 1. CREATE UNIQUE CUSTOM DOCUMENT (NO SAMPLE DATA, UNIQUE NUMBERS)
  console.log('Step 1: Generating custom dynamic test PDF with unique content...');
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1
  const p1 = pdfDoc.addPage([600, 750]);
  p1.drawText('PROJECT HYPERION: MASTER INFRASTRUCTURE AGREEMENT', { x: 50, y: 700, font: boldFont, size: 14 });
  p1.drawText('Effective Date: 12 January 2027 between Quantum Dynamics LLC and Apex Systems.', { x: 50, y: 670, font, size: 11 });
  p1.drawText('Section 1.1 Scope of Work and Obligations:', { x: 50, y: 640, font: boldFont, size: 11 });
  p1.drawText('1. Quantum Dynamics LLC shall complete the security audit within 45 days of signing.', { x: 50, y: 620, font, size: 11 });
  p1.drawText('2. Apex Systems must furnish database credentials within 7 days, provided that clearance is verified.', { x: 50, y: 600, font, size: 11 });
  p1.drawText('Milestone Delivery Deadline: 18 November 2027 for Phase 2 implementation.', { x: 50, y: 570, font, size: 11 });

  // Page 2
  const p2 = pdfDoc.addPage([600, 750]);
  p2.drawText('SCHEDULE B - COMMERCIAL COMPENSATION & INVOICING', { x: 50, y: 700, font: boldFont, size: 14 });
  p2.drawText('Commercial breakdown for services rendered:', { x: 50, y: 670, font, size: 11 });
  p2.drawText('Professional Services Subtotal:    USD 87,500.00', { x: 50, y: 640, font, size: 11 });
  p2.drawText('Applicable Statutory Tax:          USD 8,750.00', { x: 50, y: 620, font, size: 11 });
  p2.drawText('Total Contract Value:              USD 96,250.00', { x: 50, y: 600, font: boldFont, size: 11 });
  p2.drawText('Payment Deadline: Final invoice payable by 30 December 2027.', { x: 50, y: 570, font, size: 11 });
  p2.drawText('As documented in Appendix C (attached hereto), server specs must meet Tier 4 standards.', { x: 50, y: 540, font, size: 11 });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(filePath, pdfBytes);
  console.log(`✓ Custom PDF created: ${filePath} (${pdfBytes.length} bytes)\n`);

  // 2. VALIDATION CHECK
  console.log('Step 2: Testing file validation & magic byte check...');
  const valResult = await validateUploadedFile(filePath, customDocName);
  if (!valResult.valid) {
    throw new Error(`File validation failed: ${valResult.error}`);
  }
  console.log('✓ Validation passed: Correct magic bytes, format, and non-empty file.\n');

  // 3. EXTRACTION
  console.log('Step 3: Extracting pages, text, and tables...');
  const extraction = await extractDocument(filePath, customDocName);
  if (extraction.pageCount !== 2) {
    throw new Error(`Expected 2 pages, got ${extraction.pageCount}`);
  }
  if (!extraction.fullText.includes('PROJECT HYPERION') || !extraction.fullText.includes('USD 96,250.00')) {
    throw new Error('Extracted text missing expected dynamic content!');
  }
  console.log(`✓ Extraction passed: ${extraction.pageCount} pages, ${extraction.fullText.length} characters extracted.\n`);

  // 4. QUALITY CHECK
  console.log('Step 4: Automated text quality check...');
  const quality = checkDocumentQuality(extraction);
  if (quality.status !== 'passed') {
    throw new Error(`Quality check failed: ${quality.message}`);
  }
  console.log(`✓ Quality check passed with score: ${quality.qualityScore}%\n`);

  // 5. CHUNKING & SOURCE TRACEABILITY
  console.log('Step 5: Traceable document chunking...');
  const chunks = chunkDocument(testUniqueId, extraction.pages);
  if (chunks.length < 2) {
    throw new Error(`Expected at least 2 chunks, got ${chunks.length}`);
  }
  const allHaveSource = chunks.every(c => c.page && c.section && c.text);
  if (!allHaveSource) {
    throw new Error('Some chunks missing page or section source metadata!');
  }
  console.log(`✓ Chunking passed: ${chunks.length} chunks generated with explicit page & section sources.\n`);

  // 6. RAG VECTOR STORE
  console.log('Step 6: Building hybrid vector index...');
  const indexInfo = vectorStore.buildIndex(testUniqueId, chunks);
  console.log(`✓ Vector index built: ${indexInfo.indexedChunks} chunks indexed, vocabulary: ${indexInfo.vocabSize} terms.\n`);

  // 7. AI EXTRACTION & CROSS-CHECKING
  console.log('Step 7: Running AI extraction and mathematical cross-checks...');
  const analysis = await analyzeDocument({ id: testUniqueId, originalName: customDocName }, extraction.pages, chunks);

  // Check deadlines
  console.log(`- Deadlines detected: ${analysis.deadlines.length}`);
  const deadlineMatch = analysis.deadlines.some(d => d.date.includes('2027') || d.date.includes('45 days'));
  if (!deadlineMatch) {
    throw new Error('Failed to extract dynamic deadlines from document!');
  }

  // Check obligations
  console.log(`- Obligations detected: ${analysis.obligations.length}`);
  const oblMatch = analysis.obligations.some(o => o.party.includes('Quantum') || o.party.includes('Apex'));
  if (!oblMatch) {
    throw new Error('Failed to extract dynamic obligations!');
  }

  // Check financial values
  console.log(`- Financial items detected: ${analysis.financialValues.length}`);
  const hasSubtotal = analysis.financialValues.some(f => f.amount.includes('87,500'));
  const hasTotal = analysis.financialValues.some(f => f.amount.includes('96,250'));
  if (!hasSubtotal || !hasTotal) {
    throw new Error('Failed to extract exact dynamic financial values!');
  }

  // Check math cross-checking (87,500 + 8,750 = 96,250 -> Should be consistent!)
  const mathInconsistency = analysis.anomalies.some(a => a.type === 'Financial Discrepancy');
  if (mathInconsistency) {
    throw new Error('Mathematical verification falsely flagged discrepancy on valid math!');
  }
  console.log('✓ Financial Math Cross-Check Passed: 87,500 + 8,750 = 96,250 verified consistent.');

  // Check missing attachment detection (Appendix C mentioned in text but not attached!)
  const missingAppendix = analysis.missingData.some(m => m.item.includes('Appendix C'));
  if (!missingAppendix) {
    throw new Error('Failed to detect missing Appendix C referenced in text!');
  }
  console.log('✓ Missing Data Detection Passed: Correctly identified missing Appendix C.\n');

  // 8. DATABASE STORAGE & PERSISTENCE
  console.log('Step 8: Testing database disk persistence...');
  const docRecord = {
    id: testUniqueId,
    originalName: customDocName,
    storedName: customDocName,
    mimeType: 'application/pdf',
    size: pdfBytes.length,
    status: 'completed',
    uploadedAt: new Date().toISOString(),
    pageCount: 2
  };
  db.addDocument(docRecord);
  db.setAnalysis(testUniqueId, analysis);

  // Read back directly from disk
  const savedDbRaw = JSON.parse(fs.readFileSync(config.dbPath, 'utf-8'));
  const docInDb = savedDbRaw.documents.find(d => d.id === testUniqueId);
  const analysisInDb = savedDbRaw.analyses[testUniqueId];
  if (!docInDb || !analysisInDb) {
    throw new Error('Database persistence failed: Document or analysis not written to db.json!');
  }
  console.log('✓ Database persistence verified: Data confirmed written to disk in db.json.\n');

  // 9. RAG Q&A WITH GROUNDED ANSWER & CITATION
  console.log('Step 9: Testing Ask Your Document RAG query...');
  const answerRes = await askDocument({ id: testUniqueId }, 'What is the security audit deadline?');
  if (!answerRes.answer || !answerRes.answer.includes('45 days')) {
    throw new Error(`RAG answer did not contain expected text! Received: "${answerRes.answer}"`);
  }
  if (!answerRes.sources || answerRes.sources.length === 0 || answerRes.sources[0].page !== 1) {
    throw new Error('RAG answer missing required source citation Page 1!');
  }
  console.log(`✓ RAG Q&A Passed: "${answerRes.answer}" (Source: Page ${answerRes.sources[0].page})\n`);

  // 10. UNANSWERABLE QUESTION HALLUCINATION GUARD
  console.log('Step 10: Testing anti-hallucination guard for unsupported questions...');
  const unanswerableRes = await askDocument({ id: testUniqueId }, 'What is the CEO personal phone number?');
  if (!unanswerableRes.answer.includes('not provide enough information')) {
    throw new Error(`Anti-hallucination guard failed! Unexpected answer: "${unanswerableRes.answer}"`);
  }
  console.log(`✓ Anti-Hallucination Guard Passed: Responded with "${unanswerableRes.answer}"\n`);

  // Cleanup test file & record
  db.deleteDocument(testUniqueId);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  console.log('================================================================');
  console.log(' ALL 10 END-TO-END PIPELINE STEPS VERIFIED WITH 100% SUCCESS!');
  console.log('================================================================');
}

verifyEndToEndPipeline().catch(err => {
  console.error('\n❌ E2E VERIFICATION ERROR:', err.message);
  process.exit(1);
});
