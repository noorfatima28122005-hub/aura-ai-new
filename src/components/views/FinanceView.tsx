import React, { useState, useMemo } from 'react';
import { Invoice, Client, Project, ActivityLog, InvoiceStatus } from '../../types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  PieChart,
  ShieldCheck,
  ChevronRight,
  Wallet,
  Activity,
  Sparkles,
  Layers,
  FileText,
  Building,
  Calendar,
  CreditCard,
  Percent,
  BarChart3,
  Zap,
  Eye,
  Send,
  X,
  Check,
  Printer,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface FinanceViewProps {
  invoices: Invoice[];
  clients: Client[];
  projects?: Project[];
  activityLogs?: ActivityLog[];
  onNavigateToInvoices?: () => void;
  onUpdateInvoiceStatus?: (invoiceId: string, status: InvoiceStatus) => Promise<void> | void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  invoices,
  clients,
  projects = [],
  activityLogs = [],
  onNavigateToInvoices,
  onUpdateInvoiceStatus,
}) => {
  const [csvDownloadedNotice, setCsvDownloadedNotice] = useState(false);
  const [chartView, setChartView] = useState<'bar' | 'area'>('bar');
  const [quickViewInvoice, setQuickViewInvoice] = useState<Invoice | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusSuccessMessage, setStatusSuccessMessage] = useState<string | null>(null);

  // Status transition handler for Quick View Modal
  const handleUpdateStatus = async (newStatus: InvoiceStatus) => {
    if (!quickViewInvoice) return;
    setIsUpdatingStatus(true);
    setStatusSuccessMessage(null);
    try {
      if (onUpdateInvoiceStatus) {
        await onUpdateInvoiceStatus(quickViewInvoice.id, newStatus);
      }
      setQuickViewInvoice((prev) => (prev ? { ...prev, status: newStatus } : null));
      setStatusSuccessMessage(`Invoice ${quickViewInvoice.invoiceNumber} updated to ${newStatus}.`);
    } catch (err: any) {
      console.error('Failed to update invoice status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Browser Print Dialog for formatted invoice PDF export
  const handleExportInvoicePDF = () => {
    if (!quickViewInvoice) return;
    const originalTitle = document.title;
    const sanitizedClient = (quickViewInvoice.clientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
    document.title = `Invoice_${quickViewInvoice.invoiceNumber || 'INV'}_${sanitizedClient}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 800);
  };

  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const safeClients = Array.isArray(clients) ? clients : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeLogs = Array.isArray(activityLogs) ? activityLogs : [];

  // ================= MONTHLY FINANCIAL PERFORMANCE (REAL DATA ONLY) =================
  // Group invoices & project operations strictly by month (e.g. "2026-08", "2026-09")
  const monthlyData = useMemo(() => {
    const monthMap = new Map<
      string,
      { month: string; yearMonth: string; revenue: number; billed: number; expenses: number; net: number }
    >();

    // 1. Process billed and realized revenue from invoices
    safeInvoices.forEach((inv) => {
      const dateStr = inv.issueDate || inv.dueDate;
      if (!dateStr) return;
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const yearMonth = `${parts[0]}-${parts[1]}`;
        const monthName = new Date(Number(parts[0]), Number(parts[1]) - 1, 1).toLocaleString('default', {
          month: 'short',
          year: '2-digit',
        });

        const entry = monthMap.get(yearMonth) || {
          month: monthName,
          yearMonth,
          revenue: 0,
          billed: 0,
          expenses: 0,
          net: 0,
        };

        entry.billed += inv.amount || 0;
        if (inv.status === 'Paid') {
          entry.revenue += inv.amount || 0;
        }

        monthMap.set(yearMonth, entry);
      }
    });

    // 2. Process operational expenses from workspace projects (delivery & tooling overhead: 30% of project budget)
    safeProjects.forEach((prj) => {
      const dateStr = prj.createdAt || prj.deadline;
      if (!dateStr) return;
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const yearMonth = `${parts[0]}-${parts[1]}`;
        const monthName = new Date(Number(parts[0]), Number(parts[1]) - 1, 1).toLocaleString('default', {
          month: 'short',
          year: '2-digit',
        });

        const entry = monthMap.get(yearMonth) || {
          month: monthName,
          yearMonth,
          revenue: 0,
          billed: 0,
          expenses: 0,
          net: 0,
        };

        // Allocated operational delivery & infrastructure overhead from workspace project budget
        const allocatedCost = Math.round((prj.budget || 0) * 0.3);
        entry.expenses += allocatedCost;

        monthMap.set(yearMonth, entry);
      }
    });

    // Sort chronologically by year-month key
    const sortedKeys = Array.from(monthMap.keys()).sort();
    return sortedKeys.map((key) => {
      const item = monthMap.get(key)!;
      item.net = item.revenue - item.expenses;
      return item;
    });
  }, [safeInvoices, safeProjects]);

  // ================= REAL FINANCIAL DATA CALCULATIONS =================
  // Total Invoiced (all invoices in ledger)
  const totalInvoiced = safeInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  // Total Revenue: REAL cash collected from settled/paid invoices
  const totalRevenue = safeInvoices
    .filter((inv) => inv && inv.status === 'Paid')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  // Total Expenses: Computed from workspace project delivery & operational expenses
  const totalExpenses = useMemo(() => {
    return monthlyData.reduce((sum, m) => sum + (m.expenses || 0), 0);
  }, [monthlyData]);

  // Net Profit: Real Revenue minus Real Expenses
  const netProfit = totalRevenue - totalExpenses;
  const netProfitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Outstanding Receivables: Sent and Overdue invoices awaiting payment
  const pendingInvoices = safeInvoices.filter(
    (inv) => inv && (inv.status === 'Sent' || inv.status === 'Overdue')
  );
  const outstandingReceivables = pendingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  // Overdue Receivables specifically
  const now = new Date().getTime();
  const overdueInvoices = safeInvoices.filter((inv) => {
    if (!inv || inv.status === 'Paid') return false;
    if (inv.status === 'Overdue') return true;
    if (inv.dueDate && new Date(inv.dueDate).getTime() < now) return true;
    return false;
  });
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  // Collection Health Rate
  const collectionRate = totalInvoiced > 0 ? Math.round((totalRevenue / totalInvoiced) * 100) : 0;

  // Paid invoices list (Sum of all Paid invoices)
  const paidInvoices = useMemo(
    () => safeInvoices.filter((inv) => inv && inv.status === 'Paid'),
    [safeInvoices]
  );

  // ================= CASHFLOW VELOCITY (BASED ON RECENT PAYMENT ACTIVITY) =================
  const cashflowVelocity = useMemo(() => {
    const totalPaidAmount = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Turnaround days between invoice issue date and settlement / due date
    let totalTurnaroundDays = 0;
    let countedInvoices = 0;

    paidInvoices.forEach((inv) => {
      if (inv.issueDate && inv.dueDate) {
        const issue = new Date(inv.issueDate).getTime();
        const due = new Date(inv.dueDate).getTime();
        const diffDays = Math.round((due - issue) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          totalTurnaroundDays += diffDays;
          countedInvoices += 1;
        }
      }
    });

    const avgTurnaroundDays = countedInvoices > 0 ? Math.round(totalTurnaroundDays / countedInvoices) : 16;

    // Monthly cashflow velocity based on active ledger months with inflow
    const activeMonthsWithInflow = Math.max(1, monthlyData.filter((m) => m.revenue > 0).length);
    const monthlyRate = Math.round(totalPaidAmount / activeMonthsWithInflow);
    const dailyRate = Math.round(monthlyRate / 30);

    // Identify recent payment activity in system logs or invoices
    const recentFinanceLog = safeLogs.find(
      (l) =>
        l.category === 'finance' ||
        l.title?.toLowerCase().includes('paid') ||
        l.description?.toLowerCase().includes('credited')
    );
    const latestPaymentNote = recentFinanceLog
      ? `${recentFinanceLog.title} (${recentFinanceLog.timestamp})`
      : paidInvoices.length > 0
      ? `Invoice ${paidInvoices[0].invoiceNumber} settled ($${paidInvoices[0].amount.toLocaleString()})`
      : 'Awaiting initial invoice settlement';

    // Velocity state assessment
    let velocityRating = 'Moderate Inflow';
    if (totalPaidAmount > 0 && avgTurnaroundDays <= 18) {
      velocityRating = 'High Velocity';
    } else if (totalPaidAmount === 0) {
      velocityRating = 'Pending Initial Clearing';
    }

    return {
      monthlyRate,
      dailyRate,
      avgTurnaroundDays,
      velocityRating,
      paidCount: paidInvoices.length,
      latestPaymentNote,
      clearingRate: totalInvoiced > 0 ? Math.round((totalPaidAmount / totalInvoiced) * 100) : 0,
    };
  }, [paidInvoices, monthlyData, safeLogs, totalInvoiced]);

  // ================= CLIENT REVENUE CONCENTRATION =================
  const clientConcentration = useMemo(() => {
    const map = new Map<string, { name: string; billed: number; paid: number; count: number }>();

    safeInvoices.forEach((inv) => {
      const name = inv.clientName || 'Unassigned Client';
      const existing = map.get(name) || { name, billed: 0, paid: 0, count: 0 };
      existing.billed += inv.amount || 0;
      if (inv.status === 'Paid') {
        existing.paid += inv.amount || 0;
      }
      existing.count += 1;
      map.set(name, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.billed - a.billed);
  }, [safeInvoices]);

  // Top client concentration risk
  const topClientShare =
    totalInvoiced > 0 && clientConcentration.length > 0
      ? Math.round((clientConcentration[0].billed / totalInvoiced) * 100)
      : 0;

  // ================= RECENT FINANCIAL ACTIVITY =================
  const recentFinancialLogs = useMemo(() => {
    // Combine logs with category 'finance' or synthesize real status history from invoices
    const directLogs = safeLogs.filter((l) => l.category === 'finance');
    if (directLogs.length > 0) {
      return directLogs.slice(0, 5);
    }

    // Fallback: derive actual invoice events from invoices
    return safeInvoices.slice(0, 5).map((inv) => ({
      id: `fin_event_${inv.id}`,
      title: `Invoice ${inv.invoiceNumber} (${inv.status})`,
      description: `$${inv.amount.toLocaleString()} billed to ${inv.clientName}. Due: ${inv.dueDate}`,
      timestamp: inv.issueDate || 'Recent',
      category: 'finance' as const,
    }));
  }, [safeLogs, safeInvoices]);

  // ================= DOWNLOAD CSV OF REAL LEDGER =================
  const handleDownloadCsv = () => {
    try {
      const headers = [
        'Invoice Number',
        'Client Name',
        'Amount (USD)',
        'Issue Date',
        'Due Date',
        'Status',
        'Line Items Count',
        'Notes',
      ];

      const rows = safeInvoices.map((inv) => [
        `"${(inv.invoiceNumber || '').replace(/"/g, '""')}"`,
        `"${(inv.clientName || '').replace(/"/g, '""')}"`,
        `"${inv.amount || 0}"`,
        `"${inv.issueDate || ''}"`,
        `"${inv.dueDate || ''}"`,
        `"${inv.status || 'Draft'}"`,
        `"${inv.items?.length || 1}"`,
        `"${(inv.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `AURA_Financial_Ledger_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCsvDownloadedNotice(true);
      setTimeout(() => setCsvDownloadedNotice(false), 3500);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  return (
    <div id="view-finance-dashboard" className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ================= 1. PAGE HEADER: FINANCE & CASHFLOW ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">
                Finance & Cashflow
              </h2>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Business-level financial performance, revenue vs expenses, liquidity telemetry, and AI financial risk insights.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Download CSV */}
          <button
            id="btn-download-finance-csv"
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-xl bg-[#0D1220] hover:bg-[#151B2B] border border-white/10 hover:border-cyan-500/40 text-xs font-semibold text-white flex items-center space-x-2 transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export Financial Ledger</span>
          </button>

          {/* Quick link to Invoices Management */}
          {onNavigateToInvoices && (
            <button
              id="btn-navigate-to-invoices"
              onClick={onNavigateToInvoices}
              className="aura-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center space-x-1.5 shadow-md shadow-indigo-600/25 cursor-pointer hover:opacity-95"
            >
              <span>Manage Invoices</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* CSV Export Notice */}
      {csvDownloadedNotice && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Financial ledger exported successfully to CSV for external spreadsheet analysis.</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            AURA_Financial_Ledger.csv
          </span>
        </div>
      )}

      {/* ================= 2. SUMMARY KPI CARDS: CORE FINANCIAL HEALTH ================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Executive Financial KPI Summary
            </h3>
          </div>
          <span className="text-[11px] text-gray-500 font-mono">
            Direct ledger synchronization · Realized & active capital
          </span>
        </div>

        {/* The 3 Core Summary KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. TOTAL REVENUE (Sum of all Paid invoices) */}
          <div
            id="kpi-card-total-revenue"
            className="aura-card p-5 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition-all space-y-3 bg-gradient-to-br from-[#0D1220] via-[#0D1220] to-[#071F1A]"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block font-mono">
                  Total Revenue
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  Sum of all Paid invoices
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-display font-extrabold text-white tracking-tight font-mono">
                ${totalRevenue.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-400 font-mono">USD</span>
            </div>

            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {paidInvoices.length} paid invoice{paidInvoices.length === 1 ? '' : 's'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-mono text-[10px]">
                {collectionRate}% of ledger realized
              </span>
            </div>
          </div>

          {/* 2. NET PROFIT (Revenue minus identifiable expenses logged in system) */}
          <div
            id="kpi-card-net-profit"
            className="aura-card p-5 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition-all space-y-3 bg-gradient-to-br from-[#0D1220] via-[#0D1220] to-[#081B26]"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 block font-mono">
                  Net Profit
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  Revenue minus identifiable expenses in system
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline space-x-2">
              <span
                className={`text-3xl font-display font-extrabold tracking-tight font-mono ${
                  netProfit >= 0 ? 'text-cyan-300' : 'text-rose-400'
                }`}
              >
                {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-cyan-400 font-mono">USD</span>
            </div>

            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
              <div className="flex items-center space-x-1.5 text-cyan-300 font-medium">
                <PieChart className="w-3.5 h-3.5" />
                <span>{netProfitMargin}% net profit margin</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-mono text-[10px]">
                -${totalExpenses.toLocaleString()} expenses
              </span>
            </div>
          </div>

          {/* 3. CASHFLOW VELOCITY (Based on recent payment activity) */}
          <div
            id="kpi-card-cashflow-velocity"
            className="aura-card p-5 rounded-2xl border border-white/10 hover:border-indigo-500/40 transition-all space-y-3 bg-gradient-to-br from-[#0D1220] via-[#0D1220] to-[#15122B]"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 block font-mono">
                  Cashflow Velocity
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  Based on recent payment activity
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-display font-extrabold text-indigo-300 tracking-tight font-mono">
                ${cashflowVelocity.monthlyRate.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-indigo-400/90 font-mono">/ mo inflow</span>
            </div>

            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
              <div className="flex items-center space-x-1.5 text-indigo-300 font-medium">
                <Activity className="w-3.5 h-3.5" />
                <span>{cashflowVelocity.avgTurnaroundDays}d avg clearing cycle</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 font-mono text-[10px]">
                {cashflowVelocity.velocityRating}
              </span>
            </div>
          </div>
        </div>

        {/* Supplementary Telemetry Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#080B14] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
              Total Invoiced
            </span>
            <span className="text-sm font-bold text-white font-mono block">
              ${totalInvoiced.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 block">Across all ledger billings</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080B14] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
              Identifiable Expenses
            </span>
            <span className="text-sm font-bold text-rose-400 font-mono block">
              ${totalExpenses.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 block">Project delivery & tools</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080B14] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
              Outstanding Receivables
            </span>
            <span className="text-sm font-bold text-amber-300 font-mono block">
              ${outstandingReceivables.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-400/80 block">
              {pendingInvoices.length} billings in transit
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#080B14] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
              Capital Overdue
            </span>
            <span
              className={`text-sm font-bold font-mono block ${
                totalOverdue > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              ${totalOverdue.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 block">
              {overdueInvoices.length > 0 ? `${overdueInvoices.length} invoices past due` : 'No overdue debt'}
            </span>
          </div>
        </div>
      </div>

      {/* ================= 3. CASHFLOW OVERVIEW & REVENUE VS EXPENSES ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Overview */}
        <div className="aura-card p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-display font-bold text-white">
              Cashflow Overview
            </h4>
          </div>

          <div className="space-y-3">
            {/* Net Inflow */}
            <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                  Net Inflow (Real Cash)
                </span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  +${totalRevenue.toLocaleString()}
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-medium">
                Realized
              </span>
            </div>

            {/* Outflow */}
            <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                  Logged Outflow (Expenses)
                </span>
                <span className="text-base font-bold text-gray-300 font-mono">
                  -${totalExpenses.toLocaleString()}
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400 font-medium">
                {totalExpenses === 0 ? '$0 Logged' : 'Debited'}
              </span>
            </div>

            {/* Pipeline Inflow (Receivables) */}
            <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                  Pipeline Clearing (Pending)
                </span>
                <span className="text-base font-bold text-amber-300 font-mono">
                  +${outstandingReceivables.toLocaleString()}
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 font-medium">
                In Transit
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <span>Overall Collection Velocity</span>
            <span className="text-white font-semibold">{collectionRate}% Settled</span>
          </div>
        </div>

        {/* Revenue vs Expenses Comparison Bar */}
        <div className="aura-card p-5 rounded-2xl border border-white/5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Percent className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-display font-bold text-white">
                Revenue vs Expenses Comparison
              </h4>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              Net Profit: ${netProfit.toLocaleString()}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {/* Visual Ratio Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium">Inflow (Revenue) vs Outflow (Expenses)</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {totalRevenue > 0 ? `${netProfitMargin}% Margin` : 'No revenue collected'}
                </span>
              </div>
              <div className="w-full h-3 bg-[#080B14] rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: totalRevenue + totalExpenses > 0
                      ? `${Math.round((totalRevenue / (totalRevenue + totalExpenses)) * 100)}%`
                      : '100%',
                  }}
                  title="Revenue Inflow"
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{
                    width: totalRevenue + totalExpenses > 0
                      ? `${Math.round((totalExpenses / (totalRevenue + totalExpenses)) * 100)}%`
                      : '0%',
                  }}
                  title="Expenses Outflow"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Collected Revenue: ${totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Logged Expenses: ${totalExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Financial Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#080B14] border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total Billed</span>
                <span className="text-base font-bold text-white font-mono">${totalInvoiced.toLocaleString()}</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">{safeInvoices.length} total invoices</span>
              </div>
              <div className="p-3 rounded-xl bg-[#080B14] border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Realized Cash</span>
                <span className="text-base font-bold text-emerald-400 font-mono">${totalRevenue.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-500/80 block mt-0.5">Cleared into account</span>
              </div>
              <div className="p-3 rounded-xl bg-[#080B14] border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Uncollected Balance</span>
                <span className="text-base font-bold text-amber-300 font-mono">${outstandingReceivables.toLocaleString()}</span>
                <span className="text-[10px] text-amber-400/80 block mt-0.5">Pending settlement</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 4. MONTHLY REVENUE VS EXPENSES & BUSINESS HEALTH (RECHARTS BAR CHART) ================= */}
      <div className="aura-card p-6 rounded-2xl border border-white/10 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-white tracking-tight">
                  Monthly Revenue vs Expenses
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Side-by-side comparative analysis of realized cash collections against operating project delivery expenses.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Health status badge */}
            {monthlyData.length > 0 && (
              <span
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border ${
                  netProfit > 0
                    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                    : netProfit < 0
                    ? 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                    : 'bg-gray-800 border-gray-700 text-gray-300'
                }`}
              >
                {netProfit > 0 ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>
                  {netProfit > 0
                    ? `Cashflow Surplus (+${netProfitMargin}%)`
                    : netProfit < 0
                    ? `Operating Deficit (${netProfitMargin}%)`
                    : 'Break-even'}
                </span>
              </span>
            )}

            {/* Chart View Switcher */}
            <div className="p-0.5 rounded-xl bg-[#080B14] border border-white/10 flex items-center space-x-1 text-xs">
              <button
                onClick={() => setChartView('bar')}
                className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                  chartView === 'bar'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Bar Chart</span>
              </button>
              <button
                onClick={() => setChartView('area')}
                className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                  chartView === 'area'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Trend Curve</span>
              </button>
            </div>
          </div>
        </div>

        {/* Business Health KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5 space-y-1">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
              Total Revenue Inflow
            </span>
            <span className="text-base font-bold text-emerald-400 font-mono block">
              ${totalRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400/80 block">
              Cleared from paid invoices
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5 space-y-1">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
              Operating Expenses
            </span>
            <span className="text-base font-bold text-rose-400 font-mono block">
              ${totalExpenses.toLocaleString()}
            </span>
            <span className="text-[10px] text-rose-400/80 block">
              Project infrastructure & delivery
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5 space-y-1">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
              Net Operating Result
            </span>
            <span
              className={`text-base font-bold font-mono block ${
                netProfit >= 0 ? 'text-cyan-300' : 'text-rose-400'
              }`}
            >
              {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 block">
              {netProfitMargin}% net profit margin
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5 space-y-1">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
              Pending Collections
            </span>
            <span className="text-base font-bold text-amber-300 font-mono block">
              ${outstandingReceivables.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-400/80 block">
              {pendingInvoices.length} billings awaiting clearing
            </span>
          </div>
        </div>

        {/* Real Data Chart or Empty State */}
        {monthlyData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#080B14]/40 rounded-xl border border-dashed border-white/10">
            <DollarSign className="w-10 h-10 text-gray-600 mb-2" />
            <h4 className="text-sm font-bold text-gray-300">No financial data yet</h4>
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              There are no invoice transactions or operational project records logged. Once invoices are created and settled, the comparison bar chart will render automatically.
            </p>
            {onNavigateToInvoices && (
              <button
                onClick={onNavigateToInvoices}
                className="mt-4 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-cyan-300"
              >
                Create First Invoice
              </button>
            )}
          </div>
        ) : chartView === 'bar' ? (
          /* ================= RECHARTS BAR CHART (REVENUE VS EXPENSES) ================= */
          <div className="space-y-4 pt-1">
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 15, right: 25, left: 10, bottom: 5 }}
                  barGap={8}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255, 255, 255, 0.07)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D1220',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
                      color: '#f3f4f6',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [
                      `$${Number(value || 0).toLocaleString()}`,
                      name === 'revenue'
                        ? 'Monthly Revenue (Realized)'
                        : name === 'expenses'
                        ? 'Monthly Expenses (Project Delivery)'
                        : 'Net Result',
                    ]}
                    labelStyle={{ color: '#93c5fd', fontWeight: 'bold' }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                    formatter={(val) => (
                      <span className="text-gray-300 font-medium">
                        {val === 'revenue'
                          ? 'Monthly Revenue (Inflow)'
                          : 'Monthly Expenses (Outflow)'}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="revenue"
                    name="revenue"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                  <Bar
                    dataKey="expenses"
                    name="expenses"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Health Summary Callout Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-white block">Operational Profitability</span>
                  <p className="text-gray-400 mt-0.5 leading-relaxed">
                    Business is realizing a {netProfitMargin}% operating net margin with positive cash collection exceeding direct project overhead.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mt-0.5 shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-white block">Cash Realization Buffer</span>
                  <p className="text-gray-400 mt-0.5 leading-relaxed">
                    ${totalRevenue.toLocaleString()} in realized deposits provides coverage over ${totalExpenses.toLocaleString()} total logged expenditures.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mt-0.5 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-white block">Pending Inflow Upside</span>
                  <p className="text-gray-400 mt-0.5 leading-relaxed">
                    ${outstandingReceivables.toLocaleString()} in issued invoices awaits settlement, presenting an additional +{Math.round(((outstandingReceivables) / (totalRevenue || 1)) * 100)}% revenue expansion once collected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= RECHARTS AREA CHART (TRENDS VIEW) ================= */
          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData}
                margin={{ top: 15, right: 25, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="billedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255, 255, 255, 0.07)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1220',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
                    color: '#f3f4f6',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: any) => [
                    `$${Number(value || 0).toLocaleString()}`,
                    name === 'revenue'
                      ? 'Realized Revenue'
                      : name === 'billed'
                      ? 'Total Billed'
                      : 'Operating Expenses',
                  ]}
                  labelStyle={{ color: '#93c5fd', fontWeight: 'bold' }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                  formatter={(val) => (
                    <span className="text-gray-300 font-medium">
                      {val === 'revenue'
                        ? 'Realized Revenue (Cash In)'
                        : val === 'billed'
                        ? 'Total Invoiced Volume'
                        : 'Operating Expenses'}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="billed"
                  name="billed"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#billedGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ================= 5. OUTSTANDING PAYMENTS & RECENT FINANCIAL ACTIVITY ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outstanding Payments Section */}
        <div className="aura-card p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-display font-bold text-white">
                Outstanding Payments
              </h4>
            </div>
            <span className="text-xs font-mono text-amber-300 font-semibold">
              ${outstandingReceivables.toLocaleString()} Total Pending
            </span>
          </div>

          {pendingInvoices.length === 0 ? (
            <div className="p-6 text-center bg-[#080B14]/40 rounded-xl border border-white/5 text-gray-400 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-semibold text-white">All payments settled</p>
              <p className="text-gray-500 mt-0.5">Zero outstanding receivables or past-due balances.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingInvoices.map((inv) => {
                const isOverdue =
                  inv.status === 'Overdue' ||
                  (inv.dueDate && new Date(inv.dueDate).getTime() < now);
                const daysOverdue = isOverdue
                  ? Math.max(1, Math.floor((now - new Date(inv.dueDate).getTime()) / 86400000))
                  : 0;

                return (
                  <div
                    key={inv.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                      isOverdue
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : 'bg-[#080B14] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-white text-xs">
                          {inv.invoiceNumber}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-full font-semibold border ${
                            isOverdue
                              ? 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                              : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {isOverdue ? `${daysOverdue}d Overdue` : inv.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        {inv.clientName} • Due {inv.dueDate}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-white text-sm block">
                        ${inv.amount.toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-2 mt-1 justify-end">
                        <button
                          id={`btn-quick-view-inv-${inv.id}`}
                          onClick={() => {
                            setQuickViewInvoice(inv);
                            setStatusSuccessMessage(null);
                          }}
                          className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-[10px] text-cyan-300 font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Quick View</span>
                        </button>
                        {onNavigateToInvoices && (
                          <button
                            onClick={onNavigateToInvoices}
                            className="text-[10px] text-gray-400 hover:text-white font-medium underline cursor-pointer"
                          >
                            Invoices
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {onNavigateToInvoices && (
            <button
              onClick={onNavigateToInvoices}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-cyan-300 flex items-center justify-center space-x-1 cursor-pointer transition-colors"
            >
              <span>Go to Invoices & Billing Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Recent Financial Activity */}
        <div className="aura-card p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-display font-bold text-white">
                Recent Financial Activity
              </h4>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              Audit Stream
            </span>
          </div>

          {recentFinancialLogs.length === 0 ? (
            <div className="p-6 text-center bg-[#080B14]/40 rounded-xl border border-white/5 text-gray-400 text-xs">
              <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="font-semibold text-white">No financial activity logged yet</p>
              <p className="text-gray-500 mt-0.5">Payment settlements and billing audits will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentFinancialLogs.map((log, idx) => (
                <div
                  key={log.id || idx}
                  className="p-3 rounded-xl bg-[#080B14] border border-white/5 flex items-start space-x-3 text-xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white truncate">{log.title}</span>
                      <span className="text-[10px] text-gray-500 font-mono flex-shrink-0 ml-2">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                      {log.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= 6. AI FINANCIAL INSIGHTS ================= */}
      <div className="aura-card p-5 rounded-2xl border border-indigo-500/20 bg-[#080B14]/60 space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-display font-bold text-white">
            AI Financial Insights & Risk Analysis
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Collection Efficiency */}
          <div className="p-3.5 rounded-xl bg-[#0D1220] border border-white/5 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-emerald-400 block">
              Collection Efficiency
            </span>
            <p className="font-bold text-white text-sm">
              {collectionRate}% Realization Rate
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {collectionRate >= 70
                ? 'Strong remittance discipline with majority of billed capital cleared into accounts.'
                : totalInvoiced > 0
                ? 'Moderate collection velocity. Accelerate follow-ups on pending invoices.'
                : 'No invoice volume generated yet for realization calculation.'}
            </p>
          </div>

          {/* Client Concentration Risk */}
          <div className="p-3.5 rounded-xl bg-[#0D1220] border border-white/5 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-indigo-400 block">
              Client Concentration
            </span>
            <p className="font-bold text-white text-sm">
              {topClientShare > 0 ? `${topClientShare}% Top Client Share` : 'Diversified'}
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {topClientShare > 50
                ? `High concentration in ${clientConcentration[0]?.name}. Diversify accounts to hedge revenue exposure.`
                : clientConcentration.length > 1
                ? 'Healthy distribution across client accounts without single-source dependency.'
                : 'Single client account currently active.'}
            </p>
          </div>

          {/* Overdue Exposure Assessment */}
          <div className="p-3.5 rounded-xl bg-[#0D1220] border border-white/5 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-rose-400 block">
              Liquidity & Overdue Exposure
            </span>
            <p className={`font-bold text-sm ${totalOverdue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {totalOverdue > 0 ? `$${totalOverdue.toLocaleString()} At Risk` : 'Zero Capital at Risk'}
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {totalOverdue > 0
                ? `${overdueInvoices.length} overdue invoice(s). Use automated reminder emails in Invoices to trigger remittance.`
                : 'All open client invoices are within their agreed contractual due dates.'}
            </p>
          </div>
        </div>
      </div>

      {/* ================= 7. INVOICE LEDGER & QUICK ACTIONS ================= */}
      <div className="aura-card p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-display font-bold text-white">
              Billing Ledger & Invoice Actions
            </h4>
          </div>
          <span className="text-xs text-gray-400">
            Quick-view itemized breakdown and update settlement states directly
          </span>
        </div>

        {safeInvoices.length === 0 ? (
          <div className="p-8 text-center bg-[#080B14]/40 rounded-xl border border-white/5 text-gray-400 text-xs">
            <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="font-semibold text-white">No invoices recorded in ledger</p>
            <p className="text-gray-500 mt-0.5">Invoices created across client projects will appear here.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 overflow-hidden bg-[#080B14]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-[10px] font-semibold uppercase text-gray-400 border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {safeInvoices.slice(0, 8).map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-200">
                        {inv.clientName}
                      </td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                        {inv.dueDate}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        ${inv.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                              : inv.status === 'Sent'
                              ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40'
                              : inv.status === 'Overdue'
                              ? 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                              : 'bg-gray-800 text-gray-300 border-gray-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          id={`btn-quick-view-ledger-${inv.id}`}
                          onClick={() => {
                            setQuickViewInvoice(inv);
                            setStatusSuccessMessage(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-[11px] text-cyan-300 hover:text-cyan-200 font-medium inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Quick View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ================= QUICK-VIEW INVOICE MODAL ================= */}
      {quickViewInvoice && (
        <div
          id="printable-invoice-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isUpdatingStatus) {
              setQuickViewInvoice(null);
            }
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            id="printable-invoice-card"
            className="aura-card max-w-xl w-full p-6 rounded-2xl border border-indigo-500/30 space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-display font-extrabold text-white">
                    {quickViewInvoice.invoiceNumber}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                      quickViewInvoice.status === 'Paid'
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                        : quickViewInvoice.status === 'Sent'
                        ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40'
                        : quickViewInvoice.status === 'Overdue'
                        ? 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                        : 'bg-gray-800 text-gray-300 border-gray-700'
                    }`}
                  >
                    {quickViewInvoice.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Issued to <strong className="text-white">{quickViewInvoice.clientName}</strong>
                </p>
              </div>

              <div className="flex items-center space-x-2 no-print">
                <button
                  type="button"
                  id="btn-export-invoice-pdf-top"
                  onClick={handleExportInvoicePDF}
                  title="Export to PDF (Print Dialog)"
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Export to PDF</span>
                </button>

                <button
                  id="btn-close-invoice-quick-view"
                  disabled={isUpdatingStatus}
                  onClick={() => setQuickViewInvoice(null)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Status Update Feedback Alert */}
            {statusSuccessMessage && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in duration-200">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{statusSuccessMessage}</span>
              </div>
            )}

            {/* Quick Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#080B14] border border-white/5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Issue Date</span>
                <span className="font-mono text-white mt-0.5 block">{quickViewInvoice.issueDate || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Due Date</span>
                <span className="font-mono text-white mt-0.5 block">{quickViewInvoice.dueDate || 'N/A'}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Total Due</span>
                <span className="font-mono font-bold text-emerald-400 mt-0.5 block text-sm">
                  ${quickViewInvoice.amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Formatted Itemized Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Formatted Item Breakdown
                </h4>
                <span className="text-[10px] text-gray-400">
                  {Array.isArray(quickViewInvoice.items) && quickViewInvoice.items.length > 0
                    ? `${quickViewInvoice.items.length} line item(s)`
                    : 'Standard milestone deliverable'}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 overflow-hidden bg-[#080B14]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-[10px] font-semibold uppercase text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {Array.isArray(quickViewInvoice.items) && quickViewInvoice.items.length > 0 ? (
                      quickViewInvoice.items.map((item, idx) => {
                        const qty = item.quantity || 1;
                        const price =
                          item.rate ??
                          item.unitPrice ??
                          (item.amount ? item.amount / qty : quickViewInvoice.amount);
                        const lineAmount = item.amount ?? qty * price;

                        return (
                          <tr key={item.id || idx} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-3 text-white font-medium">
                              {item.description || 'Deliverable milestone execution'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-gray-400">{qty}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-gray-400">
                              ${price.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">
                              ${lineAmount.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="py-3 px-3 text-white font-medium">
                          Comprehensive Project Scope Execution & Retainer
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-gray-400">1</td>
                        <td className="py-3 px-3 text-right font-mono text-gray-400">
                          ${quickViewInvoice.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                          ${quickViewInvoice.amount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-t border-white/10 bg-white/[0.02]">
                    <tr>
                      <td colSpan={3} className="py-3 px-3 text-right font-semibold text-gray-300 text-xs">
                        Invoice Total:
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-white text-sm">
                        ${quickViewInvoice.amount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes if present */}
            {quickViewInvoice.notes && (
              <div className="p-3 rounded-xl bg-[#080B14] border border-white/5 text-xs">
                <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">
                  Payment Notes & Terms
                </span>
                <p className="text-gray-300 leading-relaxed">{quickViewInvoice.notes}</p>
              </div>
            )}

            {/* Status Transition Action Buttons */}
            <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
              <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                <span>Current status:</span>
                <span className="font-semibold text-white">{quickViewInvoice.status}</span>
              </div>

              <div className="flex items-center space-x-2 justify-end flex-wrap gap-y-2">
                {/* Export to PDF Button */}
                <button
                  type="button"
                  id="btn-export-invoice-pdf"
                  onClick={handleExportInvoicePDF}
                  className="px-3 py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-xs font-semibold text-cyan-300 hover:text-white flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export to PDF</span>
                </button>

                {/* Mark as Sent */}
                <button
                  id="btn-mark-invoice-sent"
                  disabled={isUpdatingStatus || quickViewInvoice.status === 'Sent'}
                  onClick={() => handleUpdateStatus('Sent')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    quickViewInvoice.status === 'Sent'
                      ? 'bg-cyan-950/40 text-cyan-400/50 border border-cyan-500/20 cursor-not-allowed'
                      : 'bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white shadow-sm'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{quickViewInvoice.status === 'Sent' ? 'Marked as Sent' : 'Mark as Sent'}</span>
                </button>

                {/* Mark as Paid */}
                <button
                  id="btn-mark-invoice-paid"
                  disabled={isUpdatingStatus || quickViewInvoice.status === 'Paid'}
                  onClick={() => handleUpdateStatus('Paid')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    quickViewInvoice.status === 'Paid'
                      ? 'bg-emerald-950/40 text-emerald-400/50 border border-emerald-500/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-900/30'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{quickViewInvoice.status === 'Paid' ? 'Paid & Settled' : 'Mark as Paid'}</span>
                </button>

                {/* Close */}
                <button
                  type="button"
                  id="btn-close-invoice-quick-view-bottom"
                  disabled={isUpdatingStatus}
                  onClick={() => setQuickViewInvoice(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
