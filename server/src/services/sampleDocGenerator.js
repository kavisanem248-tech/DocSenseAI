import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

/**
 * Generates a realistic multi-page test PDF document containing deadlines,
 * financial values with an intentional discrepancy, obligations, and a missing appendix.
 */
export async function generateSampleTestPdf(outputPath) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawHeader = (page, title, pageNum) => {
    page.drawText(title, { x: 50, y: 740, font: boldFont, size: 16, color: rgb(0.1, 0.2, 0.5) });
    page.drawText(`Page ${pageNum} of 3`, { x: 500, y: 740, font, size: 10, color: rgb(0.4, 0.4, 0.4) });
    page.drawLine({
      start: { x: 50, y: 730 },
      end: { x: 550, y: 730 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
  };

  // --- PAGE 1: Parties, Purpose, Obligations ---
  const page1 = pdfDoc.addPage([600, 800]);
  drawHeader(page1, 'MASTER SERVICES & PROCUREMENT AGREEMENT', 1);

  let y = 700;
  const writeLine = (page, text, isBold = false, size = 11) => {
    page.drawText(text, { x: 50, y, font: isBold ? boldFont : font, size, color: rgb(0.1, 0.1, 0.1) });
    y -= size + 8;
  };

  writeLine(page1, 'Section 1.1 Parties and Effective Date', true, 13);
  writeLine(page1, 'This Agreement is entered into on 15 October 2026 between:');
  writeLine(page1, 'Acme Global Enterprises ("Client") and Zenith Solutions Corp ("Vendor").');
  y -= 10;

  writeLine(page1, 'Section 1.2 Core Scope and Binding Obligations', true, 13);
  writeLine(page1, '1. Zenith Solutions Corp shall deliver the cloud report analysis platform within 30 days.');
  writeLine(page1, '2. Acme Global Enterprises must provide secure server access credentials within 10 days.');
  writeLine(page1, '3. Vendor agrees to maintain ISO-27001 data compliance standards at all times.');
  writeLine(page1, '4. Client is required to review and approve intermediate milestone deliverables within 5 business days.');
  y -= 10;

  writeLine(page1, 'Section 1.3 Confidentiality and Intellectual Property', true, 13);
  writeLine(page1, 'Both parties shall protect proprietary business data and trade secrets.');
  writeLine(page1, 'Zenith Solutions Corp agrees to indemnify Client against third-party infringement claims.');

  // --- PAGE 2: Deadlines, Milestones, and Missing Appendix ---
  const page2 = pdfDoc.addPage([600, 800]);
  y = 700;
  drawHeader(page2, 'SCHEDULE A - MILESTONES & OPERATIONAL TIMELINE', 2);

  writeLine(page2, 'Section 2.1 Critical Deadlines and Schedule', true, 13);
  writeLine(page2, 'The parties agree to the following firm milestone schedule:');
  writeLine(page2, '- Phase 1 Architecture Submission Deadline: 15 November 2026');
  writeLine(page2, '- Phase 2 Deployment Due Date: 15 December 2026');
  writeLine(page2, '- Annual Support Renewal Date: 15 October 2027');
  writeLine(page2, '- Initial Deposit Payment Deadline: 30 October 2026');
  y -= 10;

  writeLine(page2, 'Section 2.2 Technical Specifications and Referenced Documentation', true, 13);
  writeLine(page2, 'Detailed infrastructure guidelines are set forth in Appendix B.');
  writeLine(page2, '(Note: Referenced Appendix B contains the technical security specification).');
  y -= 10;

  writeLine(page2, 'Section 2.3 Service Level Commitments', true, 13);
  writeLine(page2, 'Vendor must guarantee 99.9% platform availability during business hours.');
  writeLine(page2, 'Vendor shall respond to critical priority incidents within 2 hours.');

  // --- PAGE 3: Financial Summary Table and Signatures ---
  const page3 = pdfDoc.addPage([600, 800]);
  y = 700;
  drawHeader(page3, 'SCHEDULE B - FINANCIAL TERMS & EXECUTION', 3);

  writeLine(page3, 'Section 3.1 Financial Compensation and Invoicing', true, 13);
  writeLine(page3, 'The agreed commercial pricing is summarized in the table below:');
  y -= 10;

  // Draw financial breakdown
  writeLine(page3, 'Fee Description                     Amount (USD)', true, 11);
  writeLine(page3, '---------------------------------------------------------');
  writeLine(page3, 'Software Development Subtotal:     USD 120,000.00');
  writeLine(page3, 'Applicable Statutory Tax:           USD 12,000.00');
  writeLine(page3, 'Total Contract Value:              USD 140,000.00', true); // Intentional mismatch: 120k + 12k = 132k != 140k
  writeLine(page3, 'Late Payment Penalty:                USD 1,500.00');
  y -= 15;

  writeLine(page3, 'Section 3.2 Invoicing Schedule', true, 13);
  writeLine(page3, 'Client shall remit payments via electronic wire transfer within 30 days of invoice.');
  y -= 15;

  writeLine(page3, 'Section 3.3 Signatures and Counterparts', true, 13);
  writeLine(page3, 'IN WITNESS WHEREOF, the parties hereto have executed this Agreement:');
  y -= 20;

  writeLine(page3, 'For Acme Global Enterprises:              For Zenith Solutions Corp:');
  writeLine(page3, 'Signature: ______________________         Signature: ______________________');
  writeLine(page3, 'Name:                                     Name:');
  writeLine(page3, 'Date:                                     Date:');

  const pdfBytes = await pdfDoc.save();
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, pdfBytes);
  return outputPath;
}
