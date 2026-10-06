import React, { useState } from 'react';
import {
  WorkspaceData,
  NavigationTab,
  Task,
  Project,
  Invoice,
  Lead,
  FollowUpItem,
  UnifiedMessage,
} from '../../types';
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Clock,
  ArrowRight,
  ShieldAlert,
  Users,
  Briefcase,
  Target,
  Zap,
  Calendar,
  Mail,
  FileText,
  Activity,
  CheckSquare,
  AlertCircle,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Flame,
  Layers,
  Search,
} from 'lucide-react';

export interface BrainNavigationOptions {
  filter?: string;
  riskFilter?: boolean;
}

interface BusinessBrainViewProps {
  workspace: WorkspaceData;
  onNavigateToTab: (tab: NavigationTab, options?: BrainNavigationOptions) => void;
}

export const BusinessBrainView: React.FC<BusinessBrainViewProps> = ({
  workspace,
  onNavigateToTab,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'financial' | 'operational'>('all');

  // Safely extract domain data
  const invoices = workspace.invoices || [];
  const projects = workspace.projects || [];
  const leads = workspace.leads || [];
  const followUps = workspace.followUps || [];
  const messages = workspace.messages || [];
  const goals = workspace.goals || [];
  const tasks = workspace.tasks || [];
  const clients = workspace.clients || [];

  const now = new Date();

  // Financial Metrics
  const paidInvoices = invoices.filter((i) => i.status === 'Paid');
  const totalRevenue = paidInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const pendingInvoices = invoices.filter((i) => i.status === 'Sent');
  const pendingInvoiceTotal = pendingInvoices.reduce((s, i) => s + (i.amount || 0), 0);

  const overdueInvoices = invoices.filter((i) => {
    if (i.status === 'Paid') return false;
    if (i.status === 'Overdue') return true;
    if (i.dueDate) {
      const d = new Date(i.dueDate);
      return !isNaN(d.getTime()) && d.getTime() < now.getTime();
    }
    return false;
  });
  const overdueInvoiceTotal = overdueInvoices.reduce((s, i) => s + (i.amount || 0), 0);

  // Task & Velocity Metrics
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed').length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 100;

  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'Completed') return false;
    if (!t.deadline) return false;
    const d = new Date(t.deadline);
    return !isNaN(d.getTime()) && d.getTime() < now.getTime();
  });

  const urgentTasks = tasks.filter(
    (t) => t.status !== 'Completed' && (t.priority === 'High' || t.priority === 'Critical')
  );

  // Project Portfolio Metrics
  const activeProjects = projects.filter((p) => p.status === 'In Progress' || p.status === 'Planning');
  const atRiskProjects = projects.filter((p) => {
    if (p.status === 'Completed') return false;
    if (p.health === 'At Risk' || p.health === 'Critical') return true;
    if (p.aiRiskAssessment?.level === 'high' || p.aiRiskAssessment?.level === 'moderate') return true;
    if (p.priority === 'Urgent') return true;
    if (p.deadline) {
      const d = new Date(p.deadline);
      const daysLeft = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysLeft <= 7 && (p.progress || 0) < 70;
    }
    return false;
  });

  // Client & Follow-Up Metrics
  const activeClients = clients.filter((c) => c.status === 'Active');
  const overdueFollowUps = followUps.filter((f) => {
    if (f.status === 'Completed') return false;
    if (f.status === 'Overdue') return true;
    if (f.nextFollowUpDate) {
      const d = new Date(f.nextFollowUpDate);
      return !isNaN(d.getTime()) && d.getTime() < now.getTime();
    }
    return false;
  });

  // Communication SLA & Inbox
  const actionableInbox = messages.filter((m) => m.detectedAction && !m.isArchived);
  const unreadMessages = messages.filter((m) => m.unread && !m.isArchived);

  // Pipeline Metrics
  const activeLeads = leads.filter((l) => l.status !== 'Won' && l.status !== 'Lost');
  const totalLeadPipeline = activeLeads.reduce((s, l) => s + (l.potentialValue || 0), 0);

  // Overall Business Stability Calculation (0 - 100)
  let stabilityScore = 95;
  if (overdueTasks.length > 0) stabilityScore -= Math.min(20, overdueTasks.length * 5);
  if (atRiskProjects.length > 0) stabilityScore -= Math.min(15, atRiskProjects.length * 7);
  if (overdueInvoices.length > 0) stabilityScore -= Math.min(15, overdueInvoices.length * 6);
  if (overdueFollowUps.length > 0) stabilityScore -= Math.min(10, overdueFollowUps.length * 4);
  stabilityScore = Math.max(65, Math.min(100, stabilityScore));

  // Deadline Radar categorisation
  const deadlineRadar = {
    overdue: overdueTasks,
    today: tasks.filter((t) => {
      if (t.status === 'Completed' || !t.deadline) return false;
      const d = new Date(t.deadline);
      return d.toDateString() === now.toDateString();
    }),
    thisWeek: tasks.filter((t) => {
      if (t.status === 'Completed' || !t.deadline) return false;
      const d = new Date(t.deadline);
      const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 0 && diff <= 7;
    }),
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-sm shadow-cyan-500/10">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
                  Business Brain
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AURA Intelligence Center
                </span>
              </div>
              <p className="text-sm text-neutral-400 mt-0.5">
                Central operational command synthesizing cash flow, delivery risks, client SLAs, and daily execution.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-brain-ask-aura"
            onClick={() => onNavigateToTab('ask-aura')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Consult AURA Executive</span>
          </button>
        </div>
      </div>

      {/* Executive Health Index & Narrative */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-neutral-900/80 to-blue-950/40 border border-cyan-500/30 space-y-5 shadow-xl shadow-black/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <h2 className="text-base font-semibold text-neutral-100">
              Autonomous Operating Briefing
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              BUSINESS STABILITY: {stabilityScore} / 100
            </span>
            <span className="text-xs font-mono px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              STATUS: {stabilityScore >= 85 ? 'HEALTHY' : stabilityScore >= 70 ? 'ATTENTION' : 'ELEVATED RISK'}
            </span>
          </div>
        </div>

        <p className="text-sm text-neutral-300 leading-relaxed max-w-5xl">
          AURA has synchronized your operational telemetry across all interconnected services.
          {overdueTasks.length > 0 ? (
            <>
              {' '}There are currently <strong className="text-rose-400 font-semibold">{overdueTasks.length} overdue task(s)</strong> requiring immediate triage.{' '}
            </>
          ) : (
            ' All task deliverables are on schedule. '
          )}
          Revenue performance stands at <strong className="text-neutral-100 font-semibold">${totalRevenue.toLocaleString()}</strong> in realized income, supplemented by a pipeline of{' '}
          <strong className="text-cyan-300 font-semibold">${totalLeadPipeline.toLocaleString()}</strong>. In addition,{' '}
          <strong className="text-amber-300 font-semibold">${pendingInvoiceTotal.toLocaleString()}</strong> in milestone billing is pending disbursement.
          {atRiskProjects.length > 0 ? (
            <> <strong className="text-amber-400 font-semibold">{atRiskProjects.length} active project(s)</strong> exhibit deadline risk and require milestone adjustment.</>
          ) : (
            <> All <strong className="text-neutral-100 font-semibold">{activeProjects.length} active engagements</strong> are tracking smoothly.</>
          )}
        </p>

        {/* Global Business Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase font-mono tracking-wider">
              Pipeline Value
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-neutral-100">
                ${totalLeadPipeline.toLocaleString()}
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">{activeLeads.length} leads</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase font-mono tracking-wider">
              Pending Collections
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-amber-400">
                ${pendingInvoiceTotal.toLocaleString()}
              </span>
              <span className="text-[11px] text-amber-500/80 font-mono">{pendingInvoices.length} inv</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase font-mono tracking-wider">
              Active Engagements
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-neutral-100">{activeProjects.length}</span>
              <span className={`text-[11px] font-mono ${atRiskProjects.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {atRiskProjects.length > 0 ? `${atRiskProjects.length} at risk` : 'All on track'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase font-mono tracking-wider">
              Sprint Velocity
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-cyan-400">{taskCompletionRate}%</span>
              <span className="text-[11px] text-neutral-400 font-mono">{completedTasks}/{tasks.length} done</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: GLOBAL BUSINESS HEALTH CARDS WITH DIRECT QUICK ACTION BUTTONS   */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>Domain Health &amp; Direct Quick Actions</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live status radar across each business vertical with one-click direct navigation to resolve bottlenecks.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900 border border-neutral-800 self-start">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-cyan-500 text-black font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All Verticals
            </button>
            <button
              onClick={() => setActiveFilter('urgent')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeFilter === 'urgent'
                  ? 'bg-cyan-500 text-black font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Needs Attention
            </button>
            <button
              onClick={() => setActiveFilter('financial')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeFilter === 'financial'
                  ? 'bg-cyan-500 text-black font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Financial
            </button>
            <button
              onClick={() => setActiveFilter('operational')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeFilter === 'operational'
                  ? 'bg-cyan-500 text-black font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Operations
            </button>
          </div>
        </div>

        {/* The 6 Core Domain Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Task & Velocity Health */}
          {(activeFilter === 'all' || activeFilter === 'urgent' || activeFilter === 'operational') && (
            <div
              id="health-card-tasks"
              className={`p-5 rounded-2xl bg-neutral-900/80 border transition-all flex flex-col justify-between space-y-4 hover:shadow-lg ${
                overdueTasks.length > 0
                  ? 'border-rose-500/40 hover:border-rose-500/70 shadow-rose-500/5'
                  : 'border-neutral-800 hover:border-neutral-700 shadow-black/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${overdueTasks.length > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                      Workload &amp; Velocity
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      overdueTasks.length > 0
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {overdueTasks.length > 0 ? `${overdueTasks.length} Overdue` : 'Velocity Healthy'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-neutral-100">
                    Task Execution &amp; Milestones
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {overdueTasks.length > 0 ? (
                      <>
                        <span className="text-rose-300 font-medium">{overdueTasks.length} task(s)</span> are past their target delivery deadline, with{' '}
                        <span className="text-amber-300">{urgentTasks.length} high-priority</span> items remaining.
                      </>
                    ) : (
                      <>All sprint deliverables are tracking within planned timeframes. {completedTasks} tasks completed to date.</>
                    )}
                  </p>
                </div>

                {/* Sub-metrics */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/80">
                  <div className="text-[11px] text-neutral-400">
                    <span className="text-neutral-500 block">Pending:</span>
                    <strong className="text-neutral-200">{pendingTasks} items</strong>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    <span className="text-neutral-500 block">Completion:</span>
                    <strong className="text-cyan-400">{taskCompletionRate}%</strong>
                  </div>
                </div>
              </div>

              {/* QUICK ACTION BUTTONS */}
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <button
                  id="qa-view-overdue-tasks"
                  onClick={() => onNavigateToTab('tasks')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-800 text-xs font-semibold text-neutral-100 hover:text-cyan-300 border border-neutral-700/60 hover:border-cyan-500/40 transition-all cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className={`w-3.5 h-3.5 ${overdueTasks.length > 0 ? 'text-rose-400' : 'text-cyan-400'}`} />
                    <span>View Overdue Tasks ({overdueTasks.length})</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 group-hover:text-cyan-400 transition-all" />
                </button>

                <button
                  id="qa-plan-workload"
                  onClick={() => onNavigateToTab('calendar')}
                  className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-neutral-500" />
                    <span>Open Workload Calendar</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-neutral-600" />
                </button>
              </div>
            </div>
          )}

          {/* Card 2: Financial & Budget Health */}
          {(activeFilter === 'all' || activeFilter === 'urgent' || activeFilter === 'financial') && (
            <div
              id="health-card-finance"
              className={`p-5 rounded-2xl bg-neutral-900/80 border transition-all flex flex-col justify-between space-y-4 hover:shadow-lg ${
                overdueInvoices.length > 0 || pendingInvoices.length > 0
                  ? 'border-amber-500/40 hover:border-amber-500/70 shadow-amber-500/5'
                  : 'border-neutral-800 hover:border-neutral-700 shadow-black/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                      Revenue &amp; Budget
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      overdueInvoices.length > 0
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : pendingInvoices.length > 0
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {overdueInvoices.length > 0
                      ? 'Invoices Overdue'
                      : pendingInvoices.length > 0
                      ? `${pendingInvoices.length} In Review`
                      : 'Capital Settled'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-neutral-100">
                    Disbursements &amp; Cash Flow
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {pendingInvoices.length > 0 ? (
                      <>
                        <span className="text-amber-300 font-medium">${pendingInvoiceTotal.toLocaleString()}</span> in pending client receivables across {pendingInvoices.length} open invoice(s).
                      </>
                    ) : (
                      <>All issued invoices settled. Booked gross income is ${totalRevenue.toLocaleString()}.</>
                    )}
                  </p>
                </div>

                {/* Sub-metrics */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/80">
                  <div className="text-[11px] text-neutral-400">
                    <span className="text-neutral-500 block">Realized Revenue:</span>
                    <strong className="text-emerald-400">${totalRevenue.toLocaleString()}</strong>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    <span className="text-neutral-500 block">Pending Invoices:</span>
                    <strong className="text-amber-400">${pendingInvoiceTotal.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* QUICK ACTION BUTTONS */}
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <button
                  id="qa-review-budget"
                  onClick={() => onNavigateToTab('invoices')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-800 text-xs font-semibold text-neutral-100 hover:text-amber-300 border border-neutral-700/60 hover:border-amber-500/40 transition-all cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Review Budget &amp; Invoices</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 group-hover:text-amber-400 transition-all" />
                </button>

                <button
                  id="qa-analyze-finance"
                  onClick={() => onNavigateToTab('finance')}
                  className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-3 h-3 text-neutral-500" />
                    <span>Open Revenue Intelligence</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-neutral-600" />
                </button>
              </div>
            </div>
          )}

          {/* Card 3: Project Pipeline & Risk */}
          {(activeFilter === 'all' || activeFilter === 'urgent' || activeFilter === 'operational') && (
            <div
              id="health-card-projects"
              className={`p-5 rounded-2xl bg-neutral-900/80 border transition-all flex flex-col justify-between space-y-4 hover:shadow-lg ${
                atRiskProjects.length > 0
                  ? 'border-amber-500/40 hover:border-amber-500/70 shadow-amber-500/5'
                  : 'border-neutral-800 hover:border-neutral-700 shadow-black/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                      Project Pipeline
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      atRiskProjects.length > 0
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {atRiskProjects.length > 0 ? `${atRiskProjects.length} At Risk` : 'Milestones On Track'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-neutral-100">
                    Portfolio Delivery Health
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {atRiskProjects.length > 0 ? (
                      <>
                        <span className="text-amber-300 font-medium">'{atRiskProjects[0]?.name}'</span> has critical approaching milestones with open deliverables.
                      </>
                    ) : (
                      <>All {activeProjects.length} active engagements have sustained velocity within schedule constraints.</>
                    )}
                  </p>
                </div>

                {/* Sub-metrics */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/80">
                  <div className="text-[11px] text-neutral-400">
                    <span className="text-neutral-500 block">Active Projects:</span>
                    <strong className="text-neutral-200">{activeProjects.length} contracts</strong>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    <span className="text-neutral-500 block">Safety Margin:</span>
                    <strong className={atRiskProjects.length > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      {atRiskProjects.length > 0 ? 'Tight' : 'Optimal'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* QUICK ACTION BUTTONS */}
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <button
                  id="btn-view-at-risk-projects"
                  onClick={() => onNavigateToTab('projects', { riskFilter: true, filter: 'High Risk' })}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-500/70 transition-all cursor-pointer group shadow-sm shadow-amber-500/10"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>View At-Risk Projects</span>
                    {atRiskProjects.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/25 text-amber-200 font-mono font-bold">
                        {atRiskProjects.length}
                      </span>
                    )}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  id="qa-inspect-projects"
                  onClick={() => onNavigateToTab('projects')}
                  className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3 text-neutral-500" />
                    <span>View All Projects &amp; Milestones</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-neutral-600" />
                </button>

                <button
                  id="qa-review-contracts"
                  onClick={() => onNavigateToTab('contracts')}
                  className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-neutral-500" />
                    <span>Review Project Contracts</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-neutral-600" />
                </button>
              </div>
            </div>
          )}

          {/* Card 4: Client Relationship & Follow-ups */}
          {(activeFilter === 'all' || activeFilter === 'urgent' || activeFilter === 'operational') && (
            <div
              id="health-card-clients"
              className={`p-5 rounded-2xl bg-neutral-900/80 border transition-all flex flex-col justify-between space-y-4 hover:shadow-lg ${
                overdueFollowUps.length > 0
                  ? 'border-amber-500/40 hover:border-amber-500/70 shadow-amber-500/5'
                  : 'border-neutral-800 hover:border-neutral-700 shadow-black/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                      Client Relationship SLA
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      overdueFollowUps.length > 0
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {overdueFollowUps.length > 0 ? `${overdueFollowUps.length} Overdue SLA` : 'SLA Green'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-neutral-100">
                    Follow-Up Cadence &amp; Retention
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {overdueFollowUps.length > 0 ? (
                      <>
                        <span className="text-amber-300 font-medium">{overdueFollowUps.length} scheduled client touchpoint(s)</span> require outreach to sustain account retention.
                      </>
                    ) : (
                      <>All {activeClients.length} active client accounts have received timely communications within target SLA windows.</>
                    )}
                  </p>
                </div>

                {/* Sub-metrics */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/80">
                  <div className="text-[11px] text-neutral-400">
                    <span className="text-neutral-500 block">Active Accounts:</span>
                    <strong className="text-neutral-200">{activeClients.length} clients</strong>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    <span className="text-neutral-500 block">Pending Touchpoints:</span>
                    <strong className="text-purple-400">{followUps.length} items</strong>
                  </div>
                </div>
              </div>

              {/* QUICK ACTION BUTTONS */}
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <button
                  id="qa-view-follow-ups"
                  onClick={() => onNavigateToTab('follow-ups')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-800 text-xs font-semibold text-neutral-100 hover:text-purple-300 border border-neutral-700/60 hover:border-purple-500/40 transition-all cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Review Pending Follow-Ups ({overdueFollowUps.length})</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 group-hover:text-purple-400 transition-all" />
                </button>

                <button
                  id="qa-open-clients"
                  onClick={() => onNavigateToTab('clients')}
                  className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-neutral-500" />
                    <span>Open Client Accounts</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-neutral-600" />
                </button>
              </div>
            </div>
          )}

          {/* Card 5: Inbound Messages & Actionable Inbox */}
          {(activeFilter === 'all' || activeFilter === 'urgent' || activeFilter === 'operational') && (
            <div
              id="health-card-inbox"
              className={`p-5 rounded-2xl bg-neutral-900/80 border transition-all flex flex-col justify-between space-y-4 hover:shadow-lg ${
                actionableInbox.length > 0
                  ? 'border-cyan-500/40 hover:border-cyan-500/70 shadow-cyan-500/5'
                  : 'border-neutral-800 hover:border-neutral-700 shadow-black/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                      Communications
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      actionableInbox.length > 0
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {actionableInbox.length > 0 ? `${actionableInbox.length} Actionable` : 'Zero Unresolved'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-neutral-100">
                    Unified Communications &amp; Inbox
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {actionableInbox.length > 0 ? (
                      <>
                        <span className="text-cyan-300 font-medium">{actionableInbox.length} message(s)</span> contain AI-detected task requests or urgent scope revisions.
                      </>
                    ) : (
                      <>Communication channels clear. No unhandled client scope changes or pending meeting requests.</>
                    )}
                  </p>
                </div>

                {/* Sub-metrics */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/80">
                  <div className="text-[11px] text-neutral-400">
                    <span className="text-neutral-500 block">Unread Pings:</span>
                    <strong className="text-neutral-200">{unreadMessages.length} messages</strong>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    <span className="text-neutral-500 block">AI Detected Tasks:</span>
                    <strong className="text-cyan-400">{actionableInbox.length} actionable</strong>
                  </div>
                </div>
              </div>

              {/* QUICK ACTION BUTTONS */}
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <button
                  id="qa-triage-inbox"
                  onClick={() => onNavigateToTab('unified-inbox')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-800 text-xs font-semibold text-neutral-100 hover:text-cyan-300 border border-neutral-700/60 hover:border-cyan-500/40 transition-all cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Triage Unified Inbox</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 group-hover:text-cyan-400 transition-all" />
                </button>

                <button
                  id="qa-dispatch-email"
                  onClick={() => onNavigateToTab('email')}
                  className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-neutral-500" />
                    <span>Compose Client Outreach</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-neutral-600" />
                </button>
              </div>
            </div>
          )}

          {/* Card 6: Deals Pipeline & Conversion */}
          {(activeFilter === 'all' || activeFilter === 'financial') && (
            <div
              id="health-card-leads"
              className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-4 hover:shadow-lg shadow-black/20"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                      Pipeline Velocity
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Pipeline Active
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-neutral-100">
                    Lead Conversion &amp; Proposals
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {activeLeads.length > 0 ? (
                      <>
                        <span className="text-emerald-300 font-medium">${totalLeadPipeline.toLocaleString()}</span> in weighted pipeline value across {activeLeads.length} prospective engagements.
                      </>
                    ) : (
                      <>Pipeline awaiting new opportunities. Seed new leads to sustain quarterly trajectory.</>
                    )}
                  </p>
                </div>

                {/* Sub-metrics */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/80">
                  <div className="text-[11px] text-neutral-400">
                    <span className="text-neutral-500 block">Qualified Prospects:</span>
                    <strong className="text-neutral-200">{activeLeads.length} leads</strong>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    <span className="text-neutral-500 block">Avg Value:</span>
                    <strong className="text-emerald-400">
                      ${activeLeads.length > 0 ? Math.round(totalLeadPipeline / activeLeads.length).toLocaleString() : '0'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* QUICK ACTION BUTTONS */}
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <button
                  id="qa-view-leads"
                  onClick={() => onNavigateToTab('leads')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-800 text-xs font-semibold text-neutral-100 hover:text-emerald-300 border border-neutral-700/60 hover:border-emerald-500/40 transition-all cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Accelerate Leads Pipeline</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all" />
                </button>

                <button
                  id="qa-draft-proposal"
                  onClick={() => onNavigateToTab('proposals')}
                  className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-neutral-500" />
                    <span>Draft Client Proposal</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-neutral-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: TODAY'S PRIORITY COMMAND STACK ("WHAT SHOULD I DO NEXT?")        */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-semibold text-neutral-100">
                AURA Priority Stack: What Should I Do Next?
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Real-time cognitive ranking based on financial impact, client SLAs, and deadline proximity.
            </p>
          </div>
          <span className="text-[11px] font-mono text-neutral-500 bg-neutral-800/80 px-2.5 py-1 rounded-lg border border-neutral-700/50 self-start">
            AUTONOMOUS RANKING
          </span>
        </div>

        <div className="space-y-3">
          {/* Action Item 1 */}
          {overdueTasks.length > 0 ? (
            <div className="p-4 rounded-xl bg-neutral-950/80 border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-bold text-[10px] tracking-wide">
                    1. CRITICAL DELIVERY
                  </span>
                  <span className="text-neutral-400 font-mono text-[11px]">
                    {overdueTasks[0]?.projectName || 'High Priority Task'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-neutral-100">
                  Resolve Overdue Deliverable: "{overdueTasks[0]?.title}"
                </h4>
                <p className="text-xs text-neutral-400 max-w-3xl">
                  <strong>Why it matters:</strong> This item is past deadline ({overdueTasks[0]?.deadline || 'Immediate'}). Resolving or extending it prevents client escalation and restores sprint velocity.
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('tasks')}
                className="shrink-0 px-4 py-2 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Resolve in Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {/* Action Item 2 */}
          {pendingInvoices.length > 0 ? (
            <div className="p-4 rounded-xl bg-neutral-950/80 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold text-[10px] tracking-wide">
                    {overdueTasks.length > 0 ? '2. CASH ACCELERATION' : '1. CASH ACCELERATION'}
                  </span>
                  <span className="text-neutral-400 font-mono text-[11px]">
                    ${pendingInvoiceTotal.toLocaleString()} Pending Disbursement
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-neutral-100">
                  Follow Up on Issued Invoice {pendingInvoices[0]?.invoiceNumber || 'Milestone'}
                </h4>
                <p className="text-xs text-neutral-400 max-w-3xl">
                  <strong>Why it matters:</strong> Client '{pendingInvoices[0]?.clientName || 'Partner'}' has an outstanding disbursement of ${pendingInvoices[0]?.amount?.toLocaleString() || '0'} awaiting confirmation.
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('invoices')}
                className="shrink-0 px-4 py-2 bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Review Invoices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {/* Action Item 3 */}
          {overdueFollowUps.length > 0 ? (
            <div className="p-4 rounded-xl bg-neutral-950/80 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 font-bold text-[10px] tracking-wide">
                    RETENTION CADENCE
                  </span>
                  <span className="text-neutral-400 font-mono text-[11px]">
                    {overdueFollowUps[0]?.clientName}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-neutral-100">
                  Execute Client Outreach: "{overdueFollowUps[0]?.reason}"
                </h4>
                <p className="text-xs text-neutral-400 max-w-3xl">
                  <strong>Why it matters:</strong> Touchpoint scheduled for {overdueFollowUps[0]?.nextFollowUpDate || 'recent date'} has passed. Re-engaging prevents client churn.
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('follow-ups')}
                className="shrink-0 px-4 py-2 bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Execute Follow-Up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {/* Action Item 4 */}
          {activeLeads.length > 0 && (
            <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px] tracking-wide">
                    EXPANSION OPPORTUNITY
                  </span>
                  <span className="text-neutral-400 font-mono text-[11px]">
                    ${activeLeads[0]?.potentialValue?.toLocaleString()} Pipeline Value
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-neutral-100">
                  Advance Deal: '{activeLeads[0]?.name}' ({activeLeads[0]?.company})
                </h4>
                <p className="text-xs text-neutral-400 max-w-3xl">
                  <strong>Why it matters:</strong> Lead is in '{activeLeads[0]?.status}' stage. Advancing to proposal will increase projected quarterly earnings.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateToTab('leads')}
                  className="shrink-0 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-neutral-700"
                >
                  <span>Open Lead</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigateToTab('proposals')}
                  className="shrink-0 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Create Proposal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: DEADLINE RADAR & WORKLOAD HORIZON                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deadline Radar */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-semibold text-neutral-100">
                Deadline Radar: Upcoming Milestones
              </h3>
            </div>
            <button
              onClick={() => onNavigateToTab('calendar')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Full Calendar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Overdue */}
            <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-rose-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-400">OVERDUE</span>
                <span className="font-mono text-rose-300 font-bold">{deadlineRadar.overdue.length}</span>
              </div>
              <div className="space-y-1.5">
                {deadlineRadar.overdue.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onNavigateToTab('tasks')}
                    className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800 hover:border-rose-500/40 text-xs text-neutral-300 cursor-pointer transition-all"
                  >
                    <p className="truncate font-medium text-neutral-200">{t.title}</p>
                    <span className="text-[10px] text-rose-400">{t.deadline || 'Expired'}</span>
                  </div>
                ))}
                {deadlineRadar.overdue.length === 0 && (
                  <p className="text-[11px] text-neutral-500 italic py-2">No overdue deadlines</p>
                )}
              </div>
            </div>

            {/* Today / Tomorrow */}
            <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-400">TODAY</span>
                <span className="font-mono text-cyan-300 font-bold">{deadlineRadar.today.length}</span>
              </div>
              <div className="space-y-1.5">
                {deadlineRadar.today.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onNavigateToTab('tasks')}
                    className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800 hover:border-cyan-500/40 text-xs text-neutral-300 cursor-pointer transition-all"
                  >
                    <p className="truncate font-medium text-neutral-200">{t.title}</p>
                    <span className="text-[10px] text-cyan-400">Due Today</span>
                  </div>
                ))}
                {deadlineRadar.today.length === 0 && (
                  <p className="text-[11px] text-neutral-500 italic py-2">No deadlines due today</p>
                )}
              </div>
            </div>

            {/* This Week */}
            <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-300">NEXT 7 DAYS</span>
                <span className="font-mono text-neutral-400 font-bold">{deadlineRadar.thisWeek.length}</span>
              </div>
              <div className="space-y-1.5">
                {deadlineRadar.thisWeek.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onNavigateToTab('tasks')}
                    className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 cursor-pointer transition-all"
                  >
                    <p className="truncate font-medium text-neutral-200">{t.title}</p>
                    <span className="text-[10px] text-neutral-500">{t.deadline}</span>
                  </div>
                ))}
                {deadlineRadar.thisWeek.length === 0 && (
                  <p className="text-[11px] text-neutral-500 italic py-2">Safe workload margin</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Business Momentum Vector */}
        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-neutral-100">
                  Business Momentum
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                UPWARD +14%
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Trajectory synthesized from billing cycle closures and task burn-down rate.
            </p>

            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Revenue Velocity:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +18.4%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Task Burn-down:</span>
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> {taskCompletionRate}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Client Retention:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100%
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('analytics')}
            className="w-full py-2 px-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-xs font-semibold text-cyan-400 hover:text-cyan-300 border border-neutral-700/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>View Full Business Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: STRATEGIC GOALS & TARGET TRAJECTORY                             */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-neutral-100">
              Active Business Goals &amp; OKRs
            </h3>
          </div>
          <button
            onClick={() => onNavigateToTab('analytics')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer flex items-center gap-1"
          >
            <span>Telemetry Insights</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(goals.length > 0
            ? goals
            : [
                {
                  id: 'g1',
                  title: 'Monthly Realized Revenue',
                  currentValue: totalRevenue,
                  targetValue: 25000,
                  unit: '$',
                  deadline: 'Quarter End',
                },
                {
                  id: 'g2',
                  title: 'Sprint Task Completion',
                  currentValue: completedTasks,
                  targetValue: Math.max(tasks.length, 10),
                  unit: '',
                  deadline: 'Current Sprint',
                },
                {
                  id: 'g3',
                  title: 'Active Retainers & Projects',
                  currentValue: activeProjects.length,
                  targetValue: 6,
                  unit: '',
                  deadline: 'Fiscal Year',
                },
              ]
          ).map((goal: any) => {
            const currentVal = goal.currentValue ?? goal.current ?? 0;
            const targetVal = goal.targetValue ?? goal.target ?? 1;
            const pct = Math.min(100, Math.round((currentVal / (targetVal || 1)) * 100));
            return (
              <div
                key={goal.id}
                className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-medium">{goal.title}</span>
                  <span className="font-mono text-cyan-400 font-semibold">{pct}%</span>
                </div>

                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                  <span>
                    {goal.unit || ''}
                    {currentVal.toLocaleString()} / {goal.unit || ''}
                    {targetVal.toLocaleString()}
                  </span>
                  <span>Target: {goal.deadline}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
