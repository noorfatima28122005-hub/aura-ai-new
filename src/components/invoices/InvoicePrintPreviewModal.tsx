import React, { useRef } from 'react';
import { Invoice, Client } from '../../types';
import { downloadInvoicePDF } from '../../lib/invoicePdf';
import { Printer, Download, X, FileText, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface InvoicePrintPreviewModalProps {
  invoice: Invoice | null;
  client?: Client | null;
  onClose: () => void;
}

export const InvoicePrintPreviewModal: React.FC<InvoicePrintPreviewModalProps> = ({
  invoice,
  client,
  onClose,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    downloadInvoicePDF({
      invoice,
      client,
      companyInfo: {
        name: 'AURA Digital Systems',
        tagline: 'Enterprise AI Strategy & Digital Product Engineering',
        email: 'billing@aura-ops.io',
        website: 'https://aura-studio.io',
        address: '100 Innovation Boulevard, Tech District',
        taxId: 'US-EIN-94-2819401',
      },
    });
  };

  const items =
    Array.isArray(invoice.items) && invoice.items.length > 0
      ? invoice.items
      : [
          {
            description: 'Professional Engineering & Consulting Services',
            quantity: 1,
            unitPrice: invoice.amount,
            amount: invoice.amount,
          },
        ];

  const subtotal = items.reduce((sum, it) => {
    const qty = it.quantity || 1;
    const rate = it.unitPrice ?? it.rate ?? (it.amount ? it.amount / qty : invoice.amount);
    return sum + (it.amount ?? qty * rate);
  }, 0) || invoice.amount;

  const status = (invoice.status || 'Draft').toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Container */}
      <div className="flex flex-col w-full max-w-4xl max-h-[92vh] bg-[#0A0E1A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Action Bar (Dark Mode AURA UI) */}
        <div className="px-5 py-3.5 bg-[#0D1220] border-b border-white/10 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white font-mono">
                  {invoice.invoiceNumber}
                </span>
                <span className="text-[11px] text-gray-400">Print & PDF Preview</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Matches exported PDF formatting and legal compliance specifications.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-print-invoice-modal"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-gray-400" />
              <span>Print</span>
            </button>

            <button
              id="btn-download-pdf-modal"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-xs font-semibold text-cyan-200 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export PDF</span>
            </button>

            <button
              id="btn-close-invoice-preview"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#070A12] flex justify-center">
          {/* Printable Sheet (Styling mirrors PDF export in A4 portrait proportions) */}
          <div
            ref={printAreaRef}
            id="printable-invoice-sheet"
            className="w-full max-w-[760px] bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden font-sans border border-slate-200 print:border-none print:shadow-none print:m-0 print:p-0"
          >
            {/* 1. Header Banner: Dark Slate #0F172A matching jsPDF header */}
            <div className="bg-[#0F172A] px-8 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  AURA Digital Systems
                </h1>
                <p className="text-xs text-sky-200 mt-0.5 font-medium">
                  Enterprise AI Strategy & Digital Product Engineering
                </p>
              </div>
              <div className="sm:text-right">
                <span className="text-xs font-bold tracking-wider text-sky-300 block uppercase">
                  OFFICIAL INVOICE
                </span>
                <span className="text-sm font-mono font-bold text-white block mt-0.5">
                  {invoice.invoiceNumber}
                </span>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-8 space-y-6">
              {/* 2. Meta Information Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-200 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    INVOICE NUMBER
                  </span>
                  <span className="font-mono font-bold text-slate-900 mt-1 block">
                    {invoice.invoiceNumber}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    ISSUE DATE
                  </span>
                  <span className="font-medium text-slate-800 mt-1 block">
                    {invoice.issueDate || new Date().toISOString().split('T')[0]}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    PAYMENT DUE DATE
                  </span>
                  <span className="font-medium text-slate-800 mt-1 block">
                    {invoice.dueDate || 'Upon Receipt'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    STATUS
                  </span>
                  <span
                    className={`mt-1 inline-flex items-center text-xs font-bold uppercase ${
                      status === 'PAID'
                        ? 'text-emerald-600'
                        : status === 'OVERDUE'
                        ? 'text-rose-600'
                        : 'text-sky-600'
                    }`}
                  >
                    {status === 'PAID' && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                    {status === 'OVERDUE' && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                    {status === 'SENT' && <Clock className="w-3.5 h-3.5 mr-1" />}
                    {status}
                  </span>
                </div>
              </div>

              {/* 3. Billing Parties Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
                {/* Issued From */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    ISSUED FROM:
                  </span>
                  <p className="font-bold text-sm text-slate-900">AURA Digital Systems</p>
                  <p>100 Innovation Boulevard, Tech District</p>
                  <p>Email: billing@aura-ops.io</p>
                  <p>Tax ID: US-EIN-94-2819401</p>
                </div>

                {/* Billed To */}
                <div className="space-y-1 sm:text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    BILLED TO (CLIENT):
                  </span>
                  <p className="font-bold text-sm text-slate-900">{invoice.clientName}</p>
                  <p>
                    {client?.company && client.company !== invoice.clientName
                      ? `Company: ${client.company}`
                      : 'Accounts Payable Department'}
                  </p>
                  <p>Email: {client?.email || 'accounts@client.com'}</p>
                  <p>
                    {client?.phone ? `Phone: ${client.phone}` : 'Terms: Net 30 Days Standard'}
                  </p>
                </div>
              </div>

              {/* 4. Line Items Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2.5 px-4">ITEM DESCRIPTION</th>
                      <th className="py-2.5 px-3 text-center w-16">QTY</th>
                      <th className="py-2.5 px-4 text-right w-28">RATE / UNIT</th>
                      <th className="py-2.5 px-4 text-right w-28">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => {
                      const qty = item.quantity || 1;
                      const rate =
                        item.unitPrice ??
                        item.rate ??
                        (item.amount ? item.amount / qty : invoice.amount);
                      const lineTotal = item.amount ?? qty * rate;

                      return (
                        <tr
                          key={idx}
                          className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}
                        >
                          <td className="py-3 px-4 text-slate-900 font-medium">
                            {item.description || `Service Item #${idx + 1}`}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 font-mono">
                            {qty}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 font-mono">
                            ${Number(rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-900 font-bold font-mono">
                            ${Number(lineTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 5. Summary / Totals Box */}
              <div className="flex justify-end">
                <div className="w-full sm:w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 px-2">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium text-slate-900">
                      ${Number(subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 px-2">
                    <span>Tax (0.0%):</span>
                    <span className="font-mono font-medium text-slate-900">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 font-bold text-sm">
                    <span className="text-slate-900">Total Amount Due:</span>
                    <span className="font-mono text-sky-600 text-base">
                      ${Number(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. Payment Instructions & Remittance */}
              <div className="pt-4 border-t border-slate-200 text-xs space-y-3 text-slate-600">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    PAYMENT INSTRUCTIONS & REMITTANCE
                  </span>
                  <p className="text-slate-700">
                    Bank Wire / ACH: <span className="font-medium">First Silicon Commercial Bank</span>
                  </p>
                  <p className="text-slate-700">
                    Account Name: <span className="font-medium">AURA Digital Systems LLC</span>
                  </p>
                  <p className="text-slate-700">
                    Reference / Memo:{' '}
                    <span className="font-mono font-bold text-slate-900">
                      {invoice.invoiceNumber} - {invoice.clientName}
                    </span>
                  </p>
                </div>

                {invoice.notes && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      MEMORANDUM & NOTES
                    </span>
                    <p className="text-slate-700 leading-relaxed text-[11px]">{invoice.notes}</p>
                  </div>
                )}
              </div>

              {/* 7. Footer Stamp */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
                <span>
                  Authorized Billing Document · AURA Financial Ledger · Generated on{' '}
                  {new Date().toLocaleDateString()}
                </span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
