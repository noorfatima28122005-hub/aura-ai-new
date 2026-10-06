import React, { useState, useMemo } from 'react';
import { Invoice, Client, InvoiceStatus } from '../../types';
import { downloadInvoicePDF } from '../../lib/invoicePdf';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Printer,
  Edit2,
  Trash2,
  X,
  Copy,
  ExternalLink,
  Check,
  Calendar,
  DollarSign,
  Building,
  Mail,
  HelpCircle,
  Download,
  Eye,
} from 'lucide-react';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { InvoicePrintPreviewModal } from '../invoices/InvoicePrintPreviewModal';

interface InvoicesViewProps {
  invoices: Invoice[];
  clients: Client[];
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<void> | void;
  onEditInvoice: (invoice: Invoice) => Promise<void> | void;
  onDeleteInvoice: (invoiceId: string) => Promise<void> | void;
  onUpdateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => Promise<void> | void;
  onSendReminderNotification?: (invoice: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  clients,
  onAddInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onUpdateInvoiceStatus,
  onSendReminderNotification,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Deletion state
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Print state for PDF export
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [pdfDownloadedNotice, setPdfDownloadedNotice] = useState<string | null>(null);

  // Details modal state
  const [detailsInvoice, setDetailsInvoice] = useState<Invoice | null>(null);

  // Quick Preview modal state (CSS-styled print view mirroring PDF export)
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Send Reminder modal state
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [reminderSentNotice, setReminderSentNotice] = useState<string | null>(null);

  // Form inputs for Create / Edit
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState<number>(3500);
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [status, setStatus] = useState<InvoiceStatus>('Sent');
  const [itemsStr, setItemsStr] = useState('Enterprise Cloud Integration, 1, 3500');
  const [notes, setNotes] = useState('');

  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const safeClients = Array.isArray(clients) ? clients : [];

  // Helper to test if an invoice is overdue
  const isInvoiceOverdue = (inv: Invoice): boolean => {
    if (!inv) return false;
    if (inv.status === 'Overdue') return true;
    if (inv.status === 'Paid') return false;
    if (!inv.dueDate) return false;

    // Compare with current local date
    const dueTime = new Date(inv.dueDate).setHours(23, 59, 59, 999);
    const nowTime = new Date().getTime();
    return dueTime < nowTime;
  };

  // Helper to calculate days overdue
  const getDaysOverdue = (dueDateStr: string): number => {
    if (!dueDateStr) return 0;
    const dueTime = new Date(dueDateStr).getTime();
    const nowTime = new Date().getTime();
    const diff = nowTime - dueTime;
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return safeInvoices.filter((inv) => {
      if (!inv) return false;
      const q = search.toLowerCase();
      const matchesSearch =
        (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.clientName || '').toLowerCase().includes(q) ||
        (inv.notes || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'All') return true;
      if (statusFilter === 'Overdue') {
        return isInvoiceOverdue(inv);
      }
      return inv.status === statusFilter;
    });
  }, [safeInvoices, search, statusFilter]);

  // Financial Totals & Counts
  const totalInvoicedAmount = safeInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const verifiedCollectedAmount = safeInvoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const outstandingReceivableAmount = safeInvoices
    .filter((inv) => inv.status === 'Sent' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const overdueReceivableAmount = safeInvoices
    .filter((inv) => isInvoiceOverdue(inv))
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const overdueCount = safeInvoices.filter((inv) => isInvoiceOverdue(inv)).length;
  const sentCount = safeInvoices.filter((inv) => inv.status === 'Sent').length;
  const paidCount = safeInvoices.filter((inv) => inv.status === 'Paid').length;

  const handleOpenCreate = () => {
    setEditingInvoice(null);
    setFormError(null);
    setInvoiceNumber(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
    setClientId(safeClients[0]?.id || '');
    setAmount(4500);
    setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setStatus('Sent');
    setItemsStr('AI Systems Architecture & Deliverables, 1, 4500');
    setNotes('Standard net-14 payment terms via wire transfer or credit card.');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setFormError(null);
    setInvoiceNumber(inv.invoiceNumber);
    setClientId(inv.clientId);
    setAmount(inv.amount);
    setDueDate(inv.dueDate);
    setStatus(inv.status);
    setNotes(inv.notes || '');

    if (inv.items && inv.items.length > 0) {
      setItemsStr(
        inv.items
          .map(
            (it) =>
              `${it.description}, ${it.quantity || 1}, ${it.unitPrice ?? it.rate ?? it.amount ?? inv.amount}`
          )
          .join('\n')
      );
    } else {
      setItemsStr(`Strategic Consulting & Deliverables, 1, ${inv.amount}`);
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!dueDate) {
      setFormError('Please select a valid payment due date.');
      return;
    }

    if (amount <= 0 || isNaN(amount)) {
      setFormError('Invoice amount must be greater than $0.');
      return;
    }

    const client = safeClients.find((c) => c.id === clientId);
    const clientName = client ? client.name : editingInvoice?.clientName || 'Client';

    const items = itemsStr
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(',');
        return {
          description: parts[0]?.trim() || 'Service Item',
          quantity: Number(parts[1]?.trim()) || 1,
          unitPrice: Number(parts[2]?.trim()) || amount,
          amount: (Number(parts[1]?.trim()) || 1) * (Number(parts[2]?.trim()) || amount),
        };
      });

    setIsSaving(true);
    try {
      if (editingInvoice) {
        await onEditInvoice({
          ...editingInvoice,
          invoiceNumber: invoiceNumber.trim() || editingInvoice.invoiceNumber,
          clientId,
          clientName,
          amount: Number(amount),
          dueDate,
          status,
          items: items.length > 0 ? items : [{ description: 'Service Deliverables', quantity: 1, unitPrice: amount, amount }],
          notes: notes.trim(),
        });
      } else {
        await onAddInvoice({
          invoiceNumber: invoiceNumber.trim() || `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
          clientId,
          clientName,
          amount: Number(amount),
          status,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate,
          items: items.length > 0 ? items : [{ description: 'Service Deliverables', quantity: 1, unitPrice: amount, amount }],
          notes: notes.trim(),
        });
      }
      setIsModalOpen(false);
      setEditingInvoice(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save invoice record.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingInvoice) return;
    setIsDeleting(true);
    try {
      await onDeleteInvoice(deletingInvoice.id);
      setDeletingInvoice(null);
    } catch (err: any) {
      console.error('Delete invoice failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // PDF Export handlers
  const handleDownloadPdf = (inv: Invoice) => {
    try {
      const client = safeClients.find((c) => c.id === inv.clientId) || null;
      downloadInvoicePDF({ invoice: inv, client });
      setPdfDownloadedNotice(`Invoice ${inv.invoiceNumber} downloaded as a professional PDF document.`);
      setTimeout(() => setPdfDownloadedNotice(null), 4500);
    } catch (err: any) {
      console.error('PDF export failed:', err);
    }
  };

  const handleExportPdf = (inv: Invoice) => {
    handleDownloadPdf(inv);
  };

  // Send Reminder trigger
  const handleOpenReminder = (inv: Invoice) => {
    setReminderInvoice(inv);
    setCopiedDraft(false);
    setReminderSentNotice(null);
  };

  const handleSendEmailDraft = () => {
    if (!reminderInvoice) return;
    const client = safeClients.find((c) => c.id === reminderInvoice.clientId);
    const clientEmail = client?.email || 'accounts@client.com';
    const daysOverdue = getDaysOverdue(reminderInvoice.dueDate);
    const subject = `Urgent Payment Reminder: Invoice ${reminderInvoice.invoiceNumber} ($${reminderInvoice.amount.toLocaleString()})`;
    const body = `Hi ${reminderInvoice.clientName || 'Valued Client'},\n\nThis is a friendly reminder that invoice ${reminderInvoice.invoiceNumber} for the amount of $${reminderInvoice.amount.toLocaleString()} was due on ${reminderInvoice.dueDate} (${daysOverdue} days past due).\n\nPlease let us know once the remittance has been executed or if you require an updated statement.\n\nThank you,\nAURA Workspace Billing Team`;

    const mailtoUrl = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;

    setReminderSentNotice(`Automated reminder email opened for ${reminderInvoice.clientName}!`);
    if (onSendReminderNotification) {
      onSendReminderNotification(reminderInvoice);
    }
  };

  const handleCopyDraftText = () => {
    if (!reminderInvoice) return;
    const daysOverdue = getDaysOverdue(reminderInvoice.dueDate);
    const text = `Subject: Urgent Payment Reminder: Invoice ${reminderInvoice.invoiceNumber}\n\nHi ${reminderInvoice.clientName},\nThis is a friendly notification that invoice ${reminderInvoice.invoiceNumber} ($${reminderInvoice.amount.toLocaleString()}) was due on ${reminderInvoice.dueDate} (${daysOverdue} days past due).\n\nPlease confirm remittance at your earliest convenience.\n\nBest regards,\nAURA Financial Management`;

    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  return (
    <div id="view-invoices" className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">
              Invoices & Billing Ledger
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950/70 border border-indigo-500/30 text-cyan-300">
              {safeInvoices.length} Total Records
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Detailed invoice management table with automated overdue tracking, print-ready PDF generation, and client remittance workflows.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-create-invoice"
            onClick={handleOpenCreate}
            className="aura-gradient-btn px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center space-x-1.5 shadow-md shadow-indigo-600/25 cursor-pointer hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Downloaded Notification Banner */}
      {pdfDownloadedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-200 shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-medium">{pdfDownloadedNotice}</span>
          </div>
          <button
            onClick={() => setPdfDownloadedNotice(null)}
            className="text-emerald-400 hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Summary Pill Bar: Total Invoiced, Verified Collected, Outstanding Receivable */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="aura-card p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Total Invoiced</span>
            <span className="text-lg font-display font-bold text-white">${totalInvoicedAmount.toLocaleString()}</span>
            <span className="text-[10px] text-gray-500 block">{safeInvoices.length} total invoices</span>
          </div>
          <FileText className="w-5 h-5 text-gray-500" />
        </div>

        <div className="aura-card p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Verified Collected</span>
            <span className="text-lg font-display font-bold text-emerald-400">${verifiedCollectedAmount.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-500/80 block">{paidCount} paid & settled</span>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-500/80" />
        </div>

        <div className="aura-card p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Outstanding Receivable</span>
            <span className="text-lg font-display font-bold text-amber-300">${outstandingReceivableAmount.toLocaleString()}</span>
            <span className="text-[10px] text-amber-400/80 block">{sentCount} awaiting payment</span>
          </div>
          <Clock className="w-5 h-5 text-amber-500/80" />
        </div>

        <div className={`aura-card p-3.5 rounded-xl border flex items-center justify-between ${
          overdueCount > 0 ? 'border-rose-500/30 bg-rose-950/20' : 'border-white/5'
        }`}>
          <div>
            <span className="text-[11px] text-rose-300 block font-medium">Capital Overdue</span>
            <span className="text-lg font-display font-bold text-rose-400">${overdueReceivableAmount.toLocaleString()}</span>
            <span className="text-[10px] text-rose-400/80 block">{overdueCount} past due date</span>
          </div>
          <AlertTriangle className={`w-5 h-5 ${overdueCount > 0 ? 'text-rose-400 animate-pulse' : 'text-gray-500'}`} />
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            id="invoice-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice #, client, or memo..."
            className="w-full bg-[#0D1220] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Paid', 'Sent', 'Overdue', 'Draft'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-indigo-950/80 border border-indigo-500/60 text-cyan-300 font-semibold'
                  : 'bg-[#0D1220] border border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {st}
              {st === 'Overdue' && overdueCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                  {overdueCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <div className="aura-card py-16 text-center rounded-2xl border border-dashed border-white/10 p-6 space-y-3">
          <FileText className="w-10 h-10 text-gray-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No invoices match criteria</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {search || statusFilter !== 'All'
              ? 'Try modifying your search query or status filter.'
              : 'Create your first invoice to generate billing records and exportable PDFs.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-2 px-4 py-2 rounded-xl aura-gradient-btn text-xs font-semibold text-white"
          >
            + Create New Invoice
          </button>
        </div>
      ) : (
        <div className="aura-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#080B14]/90 text-gray-400 uppercase text-[10px] font-semibold border-b border-white/10 tracking-wider">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Invoice #</th>
                  <th scope="col" className="py-3.5 px-4">Client</th>
                  <th scope="col" className="py-3.5 px-4">Issue Date</th>
                  <th scope="col" className="py-3.5 px-4">
                    <div className="flex items-center space-x-1">
                      <span>Due Date</span>
                      <span className="text-[9px] text-gray-400 font-normal">(Status)</span>
                    </div>
                  </th>
                  <th scope="col" className="py-3.5 px-4">Amount</th>
                  <th scope="col" className="py-3.5 px-4">Status</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInvoices.map((inv) => {
                  const isOverdue = isInvoiceOverdue(inv);
                  const daysOverdue = isOverdue ? getDaysOverdue(inv.dueDate) : 0;

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-[#151B2B]/60 transition-colors group ${
                        isOverdue ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Invoice Number */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-[#080B14] border border-white/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-white text-xs block">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {inv.items?.length || 1} line item(s)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <Building className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-200 truncate max-w-[160px]">
                            {inv.clientName}
                          </span>
                        </div>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                        {inv.issueDate || '—'}
                      </td>

                      {/* Due Date with Visual Warning Indicator & Tooltip */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`font-mono text-[11px] ${
                            isOverdue ? 'text-rose-300 font-semibold' : 'text-gray-300'
                          }`}>
                            {inv.dueDate}
                          </span>

                          {/* Visual Warning Indicator with Tooltip for Overdue Invoices */}
                          {isOverdue && (
                            <div className="relative group/tooltip inline-block">
                              <button
                                type="button"
                                aria-label={`Invoice overdue by ${daysOverdue} days`}
                                className="p-1 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-all flex items-center space-x-1 cursor-help"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-rose-300 hidden sm:inline">
                                  +{daysOverdue}d
                                </span>
                              </button>

                              {/* Tooltip Content */}
                              <div
                                role="tooltip"
                                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:flex flex-col z-50 w-56 p-2.5 bg-[#0F172A] border border-rose-500/40 rounded-xl shadow-2xl shadow-black/80 text-left pointer-events-none"
                              >
                                <div className="flex items-center space-x-1.5 text-rose-400 font-semibold text-[11px] mb-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Past Due Date Warning</span>
                                </div>
                                <p className="text-[10px] text-gray-300 leading-relaxed">
                                  This invoice is <span className="text-rose-300 font-bold">{daysOverdue} day(s) overdue</span> (was due on {inv.dueDate}).
                                </p>
                                <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-gray-400">
                                  <span>Action Recommended:</span>
                                  <span className="text-cyan-300 font-medium">Send Reminder</span>
                                </div>
                                {/* Caret arrow */}
                                <div className="w-2 h-2 bg-[#0F172A] border-r border-b border-rose-500/40 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white text-xs">
                        ${inv.amount.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                              : inv.status === 'Overdue' || isOverdue
                              ? 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                              : inv.status === 'Draft'
                              ? 'bg-gray-800 text-gray-300 border-gray-700'
                              : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {inv.status === 'Paid' ? (
                            <Check className="w-2.5 h-2.5 mr-1" />
                          ) : isOverdue ? (
                            <AlertTriangle className="w-2.5 h-2.5 mr-1 text-rose-400" />
                          ) : null}
                          {isOverdue && inv.status !== 'Overdue' ? 'Overdue' : inv.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Send Reminder button (highlighted for overdue, available for unpaid) */}
                          {inv.status !== 'Paid' && (
                            <button
                              id={`btn-remind-${inv.id}`}
                              onClick={() => handleOpenReminder(inv)}
                              title="Send Reminder to Client"
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center space-x-1 transition-all cursor-pointer ${
                                isOverdue
                                  ? 'bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/50 text-rose-200 shadow-sm shadow-rose-900/30'
                                  : 'bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300'
                              }`}
                            >
                              <Send className="w-3 h-3" />
                              <span className="hidden md:inline">Reminder</span>
                            </button>
                          )}

                          {/* Quick Preview Button (CSS-styled print view mirroring PDF export) */}
                          <button
                            id={`btn-quick-preview-${inv.id}`}
                            onClick={() => setPreviewInvoice(inv)}
                            title="Quick Preview Invoice (Print & PDF Layout)"
                            className="px-2.5 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 hover:text-white text-[11px] font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-indigo-400" />
                            <span>Quick Preview</span>
                          </button>

                          {/* Export PDF Button (automatic jsPDF generation) */}
                          <button
                            id={`btn-export-pdf-${inv.id}`}
                            onClick={() => handleExportPdf(inv)}
                            title="Download Professional PDF Invoice"
                            className="px-2.5 py-1 rounded-lg bg-[#0D1220] hover:bg-[#1E293B] border border-cyan-500/30 text-cyan-300 hover:text-white text-[11px] font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                          >
                            <Download className="w-3 h-3 text-cyan-400" />
                            <span>PDF</span>
                          </button>

                          {/* Explicit Mark Paid / Mark Unpaid Button */}
                          <button
                            id={`btn-toggle-paid-${inv.id}`}
                            onClick={() =>
                              onUpdateInvoiceStatus(
                                inv.id,
                                inv.status === 'Paid' ? 'Sent' : 'Paid'
                              )
                            }
                            title={inv.status === 'Paid' ? 'Mark Invoice as Unpaid' : 'Mark Invoice as Paid'}
                            className={`px-2 py-1 rounded-lg border text-[11px] font-medium flex items-center space-x-1 transition-colors cursor-pointer ${
                              inv.status === 'Paid'
                                ? 'bg-[#0D1220] hover:bg-amber-950/40 border-emerald-500/30 hover:border-amber-500/40 text-emerald-400 hover:text-amber-300'
                                : 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-500/40 text-emerald-300'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span className="hidden lg:inline">
                              {inv.status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                            </span>
                          </button>

                          {/* View Details Button */}
                          <button
                            id={`btn-view-details-${inv.id}`}
                            onClick={() => setDetailsInvoice(inv)}
                            title="View Invoice Details"
                            className="p-1.5 rounded-lg bg-[#0D1220] hover:bg-[#1E293B] border border-white/10 text-gray-400 hover:text-cyan-300 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            id={`btn-edit-invoice-${inv.id}`}
                            onClick={() => handleOpenEdit(inv)}
                            title="Edit Invoice"
                            className="p-1.5 rounded-lg bg-[#0D1220] hover:bg-[#1E293B] border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            id={`btn-delete-invoice-${inv.id}`}
                            onClick={() => setDeletingInvoice(inv)}
                            title="Delete Invoice"
                            className="p-1.5 rounded-lg bg-[#0D1220] hover:bg-rose-950/50 border border-white/10 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT INVOICE ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1220] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  {editingInvoice ? 'Edit Billing Invoice' : 'Issue New Invoice'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-medium text-gray-400 block mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-gray-400 block mb-1">
                    Client Relationship
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {safeClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company || 'Client'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-gray-400 block mb-1">
                    Total Amount ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="10"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-gray-400 block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-gray-400 block mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-400 block mb-1">
                  Line Items (Format: Description, Qty, Unit Price)
                </label>
                <textarea
                  rows={3}
                  value={itemsStr}
                  onChange={(e) => setItemsStr(e.target.value)}
                  placeholder="Service Milestone, 1, 3500"
                  className="w-full bg-[#080B14] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-400 block mb-1">
                  Notes & Payment Remittance Instructions
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Wire routing info, Stripe checkout link, or contract milestone reference..."
                  className="w-full bg-[#080B14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="aura-gradient-btn px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving Record...' : editingInvoice ? 'Update Invoice' : 'Create & Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SEND OVERDUE REMINDER ================= */}
      {reminderInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1220] border border-rose-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-rose-950/40 to-transparent">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Send Payment Reminder: {reminderInvoice.invoiceNumber}
                  </h3>
                  <span className="text-[11px] text-rose-300">
                    Recipient: {reminderInvoice.clientName} · ${reminderInvoice.amount.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setReminderInvoice(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {reminderSentNotice && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{reminderSentNotice}</span>
                </div>
              )}

              <div className="p-3.5 bg-[#080B14] border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Due Date Status:</span>
                  <span className="text-rose-400 font-bold font-mono">
                    {getDaysOverdue(reminderInvoice.dueDate)} days past due ({reminderInvoice.dueDate})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Total Outstanding:</span>
                  <span className="text-white font-bold font-mono">
                    ${reminderInvoice.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    Automated Email Draft Preview:
                  </label>
                  <button
                    onClick={handleCopyDraftText}
                    className="text-[11px] text-indigo-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedDraft ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Draft Text</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 bg-[#080B14] border border-white/5 rounded-xl font-mono text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap select-all">
                  {`Subject: Urgent Payment Reminder: Invoice ${reminderInvoice.invoiceNumber}\n\nHi ${reminderInvoice.clientName},\n\nThis is a friendly reminder that invoice ${reminderInvoice.invoiceNumber} for the amount of $${reminderInvoice.amount.toLocaleString()} was due on ${reminderInvoice.dueDate} (${getDaysOverdue(reminderInvoice.dueDate)} days past due).\n\nPlease let us know once the payment remittance has been processed.\n\nThank you,\nAURA Workspace Billing Team`}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setReminderInvoice(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSendEmailDraft}
                  className="aura-gradient-btn px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Open in Email Client (Mailto)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= PRINT-ONLY PDF TEMPLATE ================= */}
      {/* Optimized with CSS print media queries for clean documentation */}
      {printingInvoice && (
        <div className="print-only fixed inset-0 bg-white text-slate-900 p-8 font-sans z-[9999]">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  INVOICE
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ref: <span className="font-mono font-semibold">{printingInvoice.invoiceNumber}</span>
                </p>
              </div>
              <div className="text-right text-xs text-slate-600">
                <p className="font-bold text-slate-900 text-sm">AURA Workspace Systems</p>
                <p>Enterprise Operations & Studio</p>
                <p>billing@aurasystems.io</p>
              </div>
            </div>

            {/* Bill To & Metadata */}
            <div className="grid grid-cols-2 gap-8 text-xs py-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Billed To
                </span>
                <p className="font-bold text-sm text-slate-900">{printingInvoice.clientName}</p>
                <p className="text-slate-600 mt-0.5">Client ID: {printingInvoice.clientId}</p>
              </div>
              <div className="text-right space-y-1">
                <p>
                  <span className="text-slate-500">Issue Date:</span>{' '}
                  <span className="font-mono font-medium text-slate-800">{printingInvoice.issueDate || '2026-09-01'}</span>
                </p>
                <p>
                  <span className="text-slate-500">Payment Due:</span>{' '}
                  <span className="font-mono font-bold text-slate-900">{printingInvoice.dueDate}</span>
                </p>
                <p>
                  <span className="text-slate-500">Current Status:</span>{' '}
                  <span className="font-semibold uppercase tracking-wider text-indigo-700">{printingInvoice.status}</span>
                </p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Item Description</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(printingInvoice.items && printingInvoice.items.length > 0
                    ? printingInvoice.items
                    : [{ description: 'Professional Services & Deliverables', quantity: 1, unitPrice: printingInvoice.amount, amount: printingInvoice.amount }]
                  ).map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 font-medium text-slate-800">{it.description}</td>
                      <td className="py-3 px-4 text-center font-mono">{it.quantity || 1}</td>
                      <td className="py-3 px-4 text-right font-mono">${(it.unitPrice ?? it.rate ?? it.amount ?? printingInvoice.amount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">${(it.amount ?? (it.quantity || 1) * (it.unitPrice || printingInvoice.amount)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">${printingInvoice.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax / VAT (0%):</span>
                  <span className="font-mono">$0.00</span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-2 font-bold text-sm text-slate-900">
                  <span>Total Due:</span>
                  <span className="font-mono">${printingInvoice.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Notes & Remittance */}
            <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">Remittance Instructions:</p>
              <p>{printingInvoice.notes || 'Please remit payment via wire transfer or electronic ACH within net term schedule.'}</p>
              <p className="text-[10px] text-slate-400 mt-2">Generated by AURA Workspace System · Authorized Document</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: INVOICE DETAILS ================= */}
      {detailsInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1220] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#080B14]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    {detailsInvoice.invoiceNumber}
                  </h3>
                  <span className="text-[10px] text-gray-400 block">
                    Issued to {detailsInvoice.clientName}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    detailsInvoice.status === 'Paid'
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30'
                      : isInvoiceOverdue(detailsInvoice)
                      ? 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                      : 'bg-amber-950/70 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isInvoiceOverdue(detailsInvoice) && detailsInvoice.status !== 'Overdue'
                    ? 'Overdue'
                    : detailsInvoice.status}
                </span>
                <button
                  onClick={() => setDetailsInvoice(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Meta details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#080B14] rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block uppercase font-semibold">Issue Date</span>
                  <span className="text-xs font-mono font-medium text-white">{detailsInvoice.issueDate || '—'}</span>
                </div>
                <div className="p-3 bg-[#080B14] rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block uppercase font-semibold">Due Date</span>
                  <span className="text-xs font-mono font-medium text-white">{detailsInvoice.dueDate}</span>
                </div>
                <div className="p-3 bg-[#080B14] rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block uppercase font-semibold">Amount</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">${detailsInvoice.amount.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-[#080B14] rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block uppercase font-semibold">Aging</span>
                  <span className={`text-xs font-medium ${isInvoiceOverdue(detailsInvoice) ? 'text-rose-400 font-bold' : 'text-gray-300'}`}>
                    {isInvoiceOverdue(detailsInvoice)
                      ? `${getDaysOverdue(detailsInvoice.dueDate)}d Past Due`
                      : 'On Schedule'}
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <span className="text-xs font-bold text-white block mb-2">Itemized Breakdown</span>
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#080B14] text-gray-400 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Rate</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {(detailsInvoice.items && detailsInvoice.items.length > 0
                        ? detailsInvoice.items
                        : [{ description: 'Professional Services & Deliverables', quantity: 1, unitPrice: detailsInvoice.amount, amount: detailsInvoice.amount }]
                      ).map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="py-2.5 px-3 text-white font-medium">{item.description}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{item.quantity || 1}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-gray-400">
                            ${(item.unitPrice ?? item.rate ?? item.amount ?? detailsInvoice.amount).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-white font-bold">
                            ${(item.amount ?? (item.quantity || 1) * (item.unitPrice || detailsInvoice.amount)).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Box */}
              <div className="p-3.5 bg-[#080B14] rounded-xl border border-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white">${detailsInvoice.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax (0%):</span>
                  <span className="font-mono text-white">$0.00</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-1.5 font-bold text-sm">
                  <span className="text-white">Total Amount Due:</span>
                  <span className="font-mono text-emerald-400">${detailsInvoice.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Notes */}
              {detailsInvoice.notes && (
                <div className="p-3 bg-[#080B14] rounded-xl border border-white/5 text-xs text-gray-400">
                  <span className="font-bold text-gray-300 block mb-1">Invoice Notes:</span>
                  <p className="leading-relaxed">{detailsInvoice.notes}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-white/10 bg-[#080B14] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const inv = detailsInvoice;
                    handleExportPdf(inv);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-xs font-semibold text-cyan-200 flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download PDF</span>
                </button>

                <button
                  onClick={() => {
                    setPrintingInvoice(detailsInvoice);
                    setTimeout(() => window.print(), 150);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-400" />
                  <span>Print View</span>
                </button>

                {detailsInvoice.status !== 'Paid' && (
                  <button
                    onClick={() => {
                      const inv = detailsInvoice;
                      setDetailsInvoice(null);
                      handleOpenReminder(inv);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-500/30 text-xs font-semibold text-indigo-300 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reminder</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    onUpdateInvoiceStatus(
                      detailsInvoice.id,
                      detailsInvoice.status === 'Paid' ? 'Sent' : 'Paid'
                    );
                    setDetailsInvoice({
                      ...detailsInvoice,
                      status: detailsInvoice.status === 'Paid' ? 'Sent' : 'Paid',
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer border ${
                    detailsInvoice.status === 'Paid'
                      ? 'bg-amber-950/50 hover:bg-amber-900/60 border-amber-500/30 text-amber-300'
                      : 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{detailsInvoice.status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}</span>
                </button>

                <button
                  onClick={() => {
                    const inv = detailsInvoice;
                    setDetailsInvoice(null);
                    handleOpenEdit(inv);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center space-x-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRM MODAL ================= */}
      {deletingInvoice && (
        <DeleteConfirmModal
          isOpen={!!deletingInvoice}
          title="Delete Invoice"
          message={`Are you sure you want to delete invoice "${deletingInvoice.invoiceNumber}" for ${deletingInvoice.clientName}? This transaction will be removed from financial records.`}
          confirmLabel="Delete Invoice"
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingInvoice(null)}
        />
      )}

      {/* ================= QUICK PREVIEW PRINT MODAL ================= */}
      {previewInvoice && (
        <InvoicePrintPreviewModal
          invoice={previewInvoice}
          client={clients.find(
            (c) => c.id === previewInvoice.clientId || c.name === previewInvoice.clientName
          )}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </div>
  );
};
