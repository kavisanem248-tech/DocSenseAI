import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { config } from '../src/config.js';

const BASE_URL = 'http://localhost:5000';

async function runAuthIsolationTests() {
  console.log('================================================================');
  console.log(' STARTING DOCSENSEAI AUTHENTICATION & MULTI-TENANT ISOLATION TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let total = 15;

  // 1. User A Registration
  const userAData = {
    name: 'Alice Johnson',
    email: `alice_${Date.now()}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  const regARes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userAData)
  });
  const regA = await regARes.json();
  const t1 = regARes.status === 201 && regA.token && regA.user.name === userAData.name;
  if (t1) passed++;
  console.log(`[${t1 ? 'PASS' : 'FAIL'}] 1. User A Registration: ${regA.user?.email || 'Failed'}`);

  // 2. User B Registration
  const userBData = {
    name: 'Bob Smith',
    email: `bob_${Date.now()}@example.com`,
    password: 'Password456!',
    confirmPassword: 'Password456!'
  };

  const regBRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userBData)
  });
  const regB = await regBRes.json();
  const t2 = regBRes.status === 201 && regB.token && regB.user.name === userBData.name;
  if (t2) passed++;
  console.log(`[${t2 ? 'PASS' : 'FAIL'}] 2. User B Registration: ${regB.user?.email || 'Failed'}`);

  // 3. Invalid Login Handling (wrong password)
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAData.email, password: 'WrongPassword!' })
  });
  const t3 = badLoginRes.status === 401;
  if (t3) passed++;
  console.log(`[${t3 ? 'PASS' : 'FAIL'}] 3. Invalid Password Handling: Blocked with 401`);

  // 4. Invalid Login Handling (unknown email)
  const badEmailRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent@example.com', password: 'Password123!' })
  });
  const t4 = badEmailRes.status === 401;
  if (t4) passed++;
  console.log(`[${t4 ? 'PASS' : 'FAIL'}] 4. Unknown User Handling: Blocked with 401`);

  // 5. Valid Login for User A
  const loginARes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAData.email, password: userAData.password })
  });
  const loginA = await loginARes.json();
  const tokenA = loginA.token;
  const t5 = loginARes.status === 200 && Boolean(tokenA);
  if (t5) passed++;
  console.log(`[${t5 ? 'PASS' : 'FAIL'}] 5. User A Login: Token issued successfully`);

  const tokenB = regB.token;

  // 6. Unauthenticated Access Protection
  const unauthRes = await fetch(`${BASE_URL}/api/documents`);
  const t6 = unauthRes.status === 401;
  if (t6) passed++;
  console.log(`[${t6 ? 'PASS' : 'FAIL'}] 6. Unauthenticated Access Protection: Blocked with 401`);

  // Create a genuine test PDF for User A
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  page.drawText('CONFIDENTIAL CONTRACT FOR ALICE JOHNSON', { x: 50, y: 350, font, size: 14 });
  page.drawText('Total value: USD 500,000 payable by 15 December 2026.', { x: 50, y: 320, font, size: 11 });
  const pdfBytes = await pdfDoc.save();
  const tempPdfPath = path.join(config.uploadDir, `alice_contract_${Date.now()}.pdf`);
  fs.writeFileSync(tempPdfPath, pdfBytes);

  // 7. User A Uploads Document
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const fileContent = fs.readFileSync(tempPdfPath);
  const bodyHeader = `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="Alice_Confidential.pdf"\r\nContent-Type: application/pdf\r\n\r\n`;
  const bodyFooter = `\r\n--${boundary}--\r\n`;
  const multipartBody = Buffer.concat([
    Buffer.from(bodyHeader, 'utf8'),
    fileContent,
    Buffer.from(bodyFooter, 'utf8')
  ]);

  const uploadRes = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenA}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: multipartBody
  });
  const uploadData = await uploadRes.json();
  const docAId = uploadData.document?.id;
  const t7 = uploadRes.status === 201 && docAId && uploadData.document.userId === regA.user.id;
  if (t7) passed++;
  console.log(`[${t7 ? 'PASS' : 'FAIL'}] 7. User A Upload: Document associated with User A (${docAId})`);

  // Run analysis for User A's document
  await fetch(`${BASE_URL}/api/documents/${docAId}/analyze`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  // Wait briefly for analysis pipeline
  await new Promise(r => setTimeout(r, 1200));

  // 8. User A Lists Documents (Should include docAId)
  const listARes = await fetch(`${BASE_URL}/api/documents`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const listA = await listARes.json();
  const t8 = listA.documents && listA.documents.some(d => d.id === docAId);
  if (t8) passed++;
  console.log(`[${t8 ? 'PASS' : 'FAIL'}] 8. User A Document List: Contains User A's document (${listA.documents?.length || 0} doc)`);

  // 9. User B Lists Documents (MUST NOT contain User A's document)
  const listBRes = await fetch(`${BASE_URL}/api/documents`, {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const listB = await listBRes.json();
  const t9 = listB.documents && !listB.documents.some(d => d.id === docAId) && listB.documents.length === 0;
  if (t9) passed++;
  console.log(`[${t9 ? 'PASS' : 'FAIL'}] 9. Multi-Tenant List Isolation: User B cannot see User A's document`);

  // 10. User B Tries to View User A's Document (Must return 404)
  const viewBRes = await fetch(`${BASE_URL}/api/documents/${docAId}`, {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const t10 = viewBRes.status === 404;
  if (t10) passed++;
  console.log(`[${t10 ? 'PASS' : 'FAIL'}] 10. Multi-Tenant Metadata Isolation: User B blocked from User A metadata (404)`);

  // 11. User B Tries to Download User A's File (Must return 404)
  const fileBRes = await fetch(`${BASE_URL}/api/documents/${docAId}/file`, {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const t11 = fileBRes.status === 404;
  if (t11) passed++;
  console.log(`[${t11 ? 'PASS' : 'FAIL'}] 11. Multi-Tenant File Download Isolation: User B blocked from User A file (404)`);

  // 12. User B Tries to Retrieve User A's Analysis (Must return 404)
  const analysisBRes = await fetch(`${BASE_URL}/api/documents/${docAId}/analysis`, {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const t12 = analysisBRes.status === 404;
  if (t12) passed++;
  console.log(`[${t12 ? 'PASS' : 'FAIL'}] 12. Multi-Tenant Analysis Isolation: User B blocked from User A analysis (404)`);

  // 13. User B Tries to Ask Questions on User A's Document (Must return 404)
  const askBRes = await fetch(`${BASE_URL}/api/documents/${docAId}/ask`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenB}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question: 'What is the contract value?' })
  });
  const t13 = askBRes.status === 404;
  if (t13) passed++;
  console.log(`[${t13 ? 'PASS' : 'FAIL'}] 13. Multi-Tenant RAG Q&A Isolation: User B blocked from asking User A doc (404)`);

  // 14. User B Tries to Delete User A's Document (Must return 404)
  const delBRes = await fetch(`${BASE_URL}/api/documents/${docAId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const t14 = delBRes.status === 404;
  if (t14) passed++;
  console.log(`[${t14 ? 'PASS' : 'FAIL'}] 14. Multi-Tenant Delete Protection: User B cannot delete User A document (404)`);

  // 15. User A Deletes Their Own Document (Should return 200 and purge)
  const delARes = await fetch(`${BASE_URL}/api/documents/${docAId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const delA = await delARes.json();
  const listAAfter = await (await fetch(`${BASE_URL}/api/documents`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  })).json();
  const t15 = delARes.status === 200 && delA.success && !listAAfter.documents.some(d => d.id === docAId);
  if (t15) passed++;
  console.log(`[${t15 ? 'PASS' : 'FAIL'}] 15. User A Deletes Own Document: Purged successfully`);

  try { fs.unlinkSync(tempPdfPath); } catch (e) {}

  console.log('\n================================================================');
  console.log(` AUTH ISOLATION TEST RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log('================================================================\n');

  if (passed === total) {
    console.log(' ALL 15 AUTHENTICATION & MULTI-TENANT ISOLATION TESTS PASSED!');
    process.exit(0);
  } else {
    console.error(` Only ${passed} of ${total} tests passed.`);
    process.exit(1);
  }
}

runAuthIsolationTests().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
