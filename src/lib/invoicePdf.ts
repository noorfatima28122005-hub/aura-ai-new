import jsPDF from 'jspdf';
import { Invoice, Client } from '../types';

export interface InvoicePdfOptions {
  invoice: Invoice;
  client?: Client | null;
  companyInfo?: {
    name?: string;
    tagline?: string;
    email?: string;
    website?: string;
    address?: string;
    taxId?: string;
  };
}

export function generateInvoicePDF({
  invoice,
  client,
  companyInfo = {
    name: 'AURA Digital Systems',
    tagline: 'Enterprise AI Strategy & Digital Product Engineering',
    email: 'billing@aura-ops.io',
    website: 'https://aura-studio.io',
    address: '100 Innovation Boulevard, Tech District',
    taxId: 'US-EIN-94-2819401',
  },
}: InvoicePdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor = [15, 23, 42]; // Dark slate #0F172A
  const accentColor = [14, 165, 233]; // Cyan / Electric blue #0EA5E9
  const mutedColor = [100, 116, 139]; // Slate #64748B
  const lightBgColor = [248, 250, 252]; // Light grayish white #F8FAFC
  const borderColor = [226, 232, 240]; // Slate border #E2E8F0

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(companyInfo.name || 'AURA Digital Systems', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(186, 230, 253);
  doc.text(companyInfo.tagline || 'Enterprise AI Strategy & Engineering', margin, 19);

  // Document Title on right of banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('OFFICIAL INVOICE', pageWidth - margin, 14, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253);
  doc.text(invoice.invoiceNumber, pageWidth - margin, 20, { align: 'right' });

  // 2. Meta Information Bar (Issue Date, Due Date, Status)
  let y = 38;

  // Invoice Details Block
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('INVOICE NUMBER', margin, y);
  doc.text('ISSUE DATE', margin + 45, y);
  doc.text('PAYMENT DUE DATE', margin + 90, y);
  doc.text('STATUS', margin + 135, y);

  y += 5;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(invoice.invoiceNumber, margin, y);
  doc.text(invoice.issueDate || new Date().toISOString().split('T')[0], margin + 45, y);
  doc.text(invoice.dueDate || 'Upon Receipt', margin + 90, y);

  // Status Badge
  const status = (invoice.status || 'Draft').toUpperCase();
  if (status === 'PAID') {
    doc.setTextColor(16, 185, 129); // Green
  } else if (status === 'OVERDUE') {
    doc.setTextColor(225, 29, 72); // Rose / Red
  } else {
    doc.setTextColor(2, 132, 199); // Blue
  }
  doc.text(status, margin + 135, y);

  // Divider Line
  y += 6;
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  // 3. Billing & Client Parties Grid
  y += 9;
  const colWidth = (contentWidth - 10) / 2;

  // Left Column: Bill From
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('ISSUED FROM:', margin, y);

  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(companyInfo.name || 'AURA Digital Systems', margin, y + 5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(companyInfo.address || '100 Innovation Boulevard', margin, y + 10);
  doc.text(`Email: ${companyInfo.email || 'billing@aura-ops.io'}`, margin, y + 14);
  doc.text(`Tax ID: ${companyInfo.taxId || 'US-EIN-94-2819401'}`, margin, y + 18);

  // Right Column: Bill To (Client Details)
  const rightColX = margin + colWidth + 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('BILLED TO (CLIENT):', rightColX, y);

  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(invoice.clientName || 'Client Recipient', rightColX, y + 5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  if (client?.company && client.company !== invoice.clientName) {
    doc.text(`Company: ${client.company}`, rightColX, y + 10);
  } else {
    doc.text('Accounts Payable Department', rightColX, y + 10);
  }
  doc.text(`Email: ${client?.email || 'accounts@client.com'}`, rightColX, y + 14);
  if (client?.phone) {
    doc.text(`Phone: ${client.phone}`, rightColX, y + 18);
  } else {
    doc.text('Terms: Net 30 Days Standard', rightColX, y + 18);
  }

  // 4. Line Items Table Header
  y += 28;
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.rect(margin, y, contentWidth, 8, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('ITEM DESCRIPTION', margin + 3, y + 5.5);
  doc.text('QTY', margin + contentWidth - 65, y + 5.5, { align: 'center' });
  doc.text('RATE / UNIT', margin + contentWidth - 35, y + 5.5, { align: 'right' });
  doc.text('AMOUNT', margin + contentWidth - 4, y + 5.5, { align: 'right' });

  // 5. Line Items
  y += 8;
  const items = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : [{ description: 'Professional Engineering & Consulting Services', quantity: 1, unitPrice: invoice.amount, amount: invoice.amount }];

  let subtotal = 0;

  items.forEach((item, index) => {
    const qty = item.quantity || 1;
    const rate = item.unitPrice ?? item.rate ?? (item.amount ? item.amount / qty : invoice.amount);
    const lineTotal = item.amount ?? qty * rate;
    subtotal += lineTotal;

    // Check if new page needed
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    // Row alternating background
    if (index % 2 === 1) {
      doc.setFillColor(252, 253, 254);
      doc.rect(margin, y, contentWidth, 8, 'F');
    }

    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(margin, y + 8, margin + contentWidth, y + 8);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

    // Truncate long descriptions if needed
    const desc = item.description || `Service Item #${index + 1}`;
    doc.text(desc, margin + 3, y + 5.5, { maxWidth: contentWidth - 75 });

    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(String(qty), margin + contentWidth - 65, y + 5.5, { align: 'center' });

    doc.text(`$${Number(rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + contentWidth - 35, y + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`$${Number(lineTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + contentWidth - 4, y + 5.5, { align: 'right' });

    y += 8;
  });

  // Ensure subtotal matches invoice amount if zero items or discrepancy
  if (subtotal === 0) {
    subtotal = invoice.amount;
  }

  // 6. Summary / Totals Box
  y += 6;
  const totalsBoxWidth = 75;
  const totalsBoxX = margin + contentWidth - totalsBoxWidth;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Subtotal:', totalsBoxX, y + 4);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`$${Number(subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + contentWidth - 4, y + 4, { align: 'right' });

  y += 7;
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Tax (0.0%):', totalsBoxX, y + 4);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('$0.00', margin + contentWidth - 4, y + 4, { align: 'right' });

  y += 7;
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(totalsBoxX - 2, y, totalsBoxWidth + 2, 9, 'F');
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.rect(totalsBoxX - 2, y, totalsBoxWidth + 2, 9, 'S');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Total Amount Due:', totalsBoxX, y + 6);
  doc.setTextColor(14, 165, 233); // Cyan/blue
  doc.text(`$${Number(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + contentWidth - 4, y + 6, { align: 'right' });

  // 7. Payment Instructions & Notes
  y += 18;
  if (y > 235) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('PAYMENT INSTRUCTIONS & REMITTANCE', margin, y);

  y += 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Bank Wire / ACH: First Silicon Commercial Bank', margin, y);
  doc.text('Account Name: AURA Digital Systems LLC', margin, y + 4);
  doc.text(`Reference / Memo: ${invoice.invoiceNumber} - ${invoice.clientName}`, margin, y + 8);

  if (invoice.notes) {
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('MEMORANDUM & NOTES:', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(invoice.notes, margin, y, { maxWidth: contentWidth });
  }

  // 8. Footer with page stamp
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, 282, pageWidth - margin, 282);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(
      `Authorized Billing Document · AURA Financial Ledger · Generated on ${new Date().toLocaleDateString()}`,
      margin,
      286
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 286, { align: 'right' });
  }

  return doc;
}

export function downloadInvoicePDF(options: InvoicePdfOptions): void {
  const doc = generateInvoicePDF(options);
  const fileName = `Invoice_${(options.invoice.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(fileName);
}
