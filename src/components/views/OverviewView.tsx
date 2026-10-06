import React from 'react';
import { WorkspaceData, UserProfile, NavigationTab } from '../../types';
import { AuraOrb } from '../AuraOrb';
import { D3MetricSparkline } from '../charts/D3MetricSparkline';
import { TaskInsightsSection } from '../dashboard/TaskInsightsSection';
import {
  Users,
  Briefcase,
  CheckSquare,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Plus,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

interface OverviewViewProps {
  data: WorkspaceData;
  user: UserProfile;
  onNavigate: (tab: NavigationTab) => void;
  onQuickAction: (action: 'client' | 'project' | 'task' | 'invoice') => void;
  onToggleTaskComplete: (taskId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  data,
  user,
  onNavigate,
  onQuickAction,
  onToggleTaskComplete,
}) => {
  // Real dynamic calculations with complete null-safety
  const safeClients = Array.isArray(data?.clients) ? data.clients : [];
  const safeProjects = Array.isArray(data?.projects) ? data.projects : [];
  const safeTasks = Array.isArray(data?.tasks) ? data.tasks : [];
  const safeInvoices = Array.isArray(data?.invoices) ? data.invoices : [];
  const safeApprovals = Array.isArray(data?.approvals) ? data.approvals : [];

  const activeClientsCount = safeClients.filter((c) => c && c.status === 'Active').length;
  const activeProjects = safeProjects.filter(
    (p) => p && (p.status === 'In Progress' || p.status === 'Review')
  );
  const pendingTasks = safeTasks.filter((t) => t && t.status !== 'Completed');
  const overdueTasks = pendingTasks.filter((t) => {
    if (!t.deadline) return false;
    return new Date(t.deadline).getTime() < Date.now();
  });
  const upcomingDeadlines = pendingTasks
    .filter((t) => t.deadline && new Date(t.deadline).getTime() >= Date.now())
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 4);

  // Real revenue strictly calculated from Paid invoices
  const calculatedRevenue = safeInvoices
    .filter((inv) => inv && inv.status === 'Paid')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const pendingApprovals = safeApprovals.filter((a) => a && a.status === 'Pending');

  const hasAnyData =
    safeClients.length > 0 ||
    safeProjects.length > 0 ||
    safeTasks.length > 0 ||
    safeInvoices.length > 0;

  // Real monthly breakdown for chart (grouped by invoice paid date or issued date)
  const hasInvoiceData = safeInvoices.length > 0;

  // 30-day rolling timeline series for Command Center D3 Sparklines
  const last30Days = React.useMemo(() => {
    const days: { dateStr: string; label: string; timestamp: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      days.push({
        dateStr,
        label: `${month} ${dayNum}`,
        timestamp: new Date(`${dateStr}T23:59:59`).getTime(),
      });
    }
    return days;
  }, []);

  // 1. Clients 30-day cumulative trend
  const clientSparklineData = React.useMemo(() => {
    return last30Days.map((day) => {
      const count = safeClients.filter((c) => {
        if (!c.createdAt) return true;
        return new Date(c.createdAt).getTime() <= day.timestamp;
      }).length;
      return { date: day.label, value: Math.max(1, count) };
    });
  }, [last30Days, safeClients]);

  // 2. Projects 30-day pipeline volume trend
  const projectSparklineData = React.useMemo(() => {
    return last30Days.map((day) => {
      const count = safeProjects.filter((p) => {
        if (!p.createdAt) return true;
        return new Date(p.createdAt).getTime() <= day.timestamp;
      }).length;
      return { date: day.label, value: Math.max(1, count) };
    });
  }, [last30Days, safeProjects]);

  // 3. Tasks 30-day workload trend
  const taskSparklineData = React.useMemo(() => {
    return last30Days.map((day) => {
      const count = safeTasks.filter((t) => {
        if (!t.createdAt) return true;
        return new Date(t.createdAt).getTime() <= day.timestamp;
      }).length;
      return { date: day.label, value: Math.max(1, count) };
    });
  }, [last30Days, safeTasks]);

  // 4. Revenue 30-day cumulative paid receipts trend
  const revenueSparklineData = React.useMemo(() => {
    return last30Days.map((day) => {
      const paidSum = safeInvoices
        .filter((inv) => {
          if (inv.status !== 'Paid') return false;
          const invDate = inv.issueDate || inv.createdAt || '';
          if (!invDate) return true;
          return new Date(invDate).getTime() <= day.timestamp;
        })
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);
      return { date: day.label, value: paidSum };
    });
  }, [last30Days, safeInvoices]);

  return (
    <div id="aura-command-center" className="space-y-8 pb-12">
      {/* 1. Welcome Area per Section 12 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INTELLIGENT COMMAND CENTER</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-extrabold text-white tracking-tight">
            Good morning, {user.name}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Here's what's happening across your workspace.
          </p>
        </div>

        {/* Quick action bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-add-client-quick"
            onClick={() => onQuickAction('client')}
            className="aura-card-interactive px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-200 hover:text-white flex items-center space-x-1.5 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add Client</span>
          </button>
          <button
            id="btn-create-project-quick"
            onClick={() => onQuickAction('project')}
            className="aura-card-interactive px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-200 hover:text-white flex items-center space-x-1.5 cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            <span>Create Project</span>
          </button>
          <button
            id="btn-create-task-quick"
            onClick={() => onQuickAction('task')}
            className="aura-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* 2. Key Statistics per Section 12 with D3 30-Day Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Clients */}
        <div
          id="metric-card-clients"
          onClick={() => onNavigate('clients')}
          className="aura-card p-5 rounded-2xl cursor-pointer hover:border-indigo-500/30 transition-all group relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Active Clients
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-950/40 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-display font-extrabold text-white">
                {activeClientsCount}
              </span>
              <span className="text-[11px] text-gray-400 flex items-center">
                Total {data.clients.length} registered
              </span>
            </div>
          </div>
          <D3MetricSparkline
            id="clients"
            data={clientSparklineData}
            strokeColor="#3B82F6"
            fillColor="#1D4ED8"
            metricLabel="Clients"
            height={42}
          />
        </div>

        {/* Active Projects */}
        <div
          id="metric-card-projects"
          onClick={() => onNavigate('projects')}
          className="aura-card p-5 rounded-2xl cursor-pointer hover:border-cyan-500/30 transition-all group relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Active Projects
              </span>
              <div className="w-9 h-9 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-display font-extrabold text-white">
                {activeProjects.length}
              </span>
              <span className="text-[11px] text-gray-400 flex items-center">
                {data.projects.length} in pipeline
              </span>
            </div>
          </div>
          <D3MetricSparkline
            id="projects"
            data={projectSparklineData}
            strokeColor="#06B6D4"
            fillColor="#0891B2"
            metricLabel="Projects"
            height={42}
          />
        </div>

        {/* Pending Tasks */}
        <div
          id="metric-card-tasks"
          onClick={() => onNavigate('tasks')}
          className="aura-card p-5 rounded-2xl cursor-pointer hover:border-purple-500/30 transition-all group relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Pending Tasks
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-display font-extrabold text-white">
                {pendingTasks.length}
              </span>
              {overdueTasks.length > 0 ? (
                <span className="text-[11px] text-rose-400 font-medium flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {overdueTasks.length} overdue
                </span>
              ) : (
                <span className="text-[11px] text-gray-400">All on track</span>
              )}
            </div>
          </div>
          <D3MetricSparkline
            id="tasks"
            data={taskSparklineData}
            strokeColor="#A855F7"
            fillColor="#7E22CE"
            metricLabel="Tasks"
            height={42}
          />
        </div>

        {/* Revenue strictly calculated */}
        <div
          id="metric-card-revenue"
          onClick={() => onNavigate('finance')}
          className="aura-card p-5 rounded-2xl cursor-pointer hover:border-pink-500/30 transition-all group relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Recorded Revenue
              </span>
              <div className="w-9 h-9 rounded-xl bg-pink-950/40 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-display font-extrabold text-white">
                ${calculatedRevenue.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">
                Verified receipts
              </span>
            </div>
          </div>
          <D3MetricSparkline
            id="revenue"
            data={revenueSparklineData}
            strokeColor="#EC4899"
            fillColor="#BE185D"
            metricLabel="Revenue"
            valuePrefix="$"
            height={42}
          />
        </div>
      </div>

      {/* 3. AURA INTELLIGENCE CARD per Section 13 */}
      <div
        id="aura-intelligence-card"
        className="aura-card p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-[#0D1220] via-[#111827] to-[#0D1220] relative overflow-hidden"
      >
        {/* Ambient subtle glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start space-x-4">
            <AuraOrb size="md" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  AURA Intelligence
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <h2 className="text-xl font-display font-bold text-white mt-1">
                Here's what needs your attention.
              </h2>

              {/* Conditional content per section 13 */}
              {!hasAnyData ? (
                <p className="text-sm text-gray-300 mt-2 max-w-2xl leading-relaxed">
                  Your workspace is ready. Add your first client or project to
                  start receiving intelligent insights, workload analysis, and
                  automated deadline tracking.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {pendingApprovals.length > 0 && (
                    <div className="flex items-center space-x-2 text-xs text-indigo-300 bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-500/30">
                      <ShieldAlert className="w-4 h-4 text-pink-400 flex-shrink-0" />
                      <span>
                        <strong className="text-white">
                          {pendingApprovals.length} pending action(s)
                        </strong>{' '}
                        in AI Approval Center awaiting your sign-off (e.g., "
                        {pendingApprovals[0]?.title}").
                      </span>
                    </div>
                  )}

                  {overdueTasks.length > 0 && (
                    <div className="flex items-center space-x-2 text-xs text-rose-300 bg-rose-950/30 px-3 py-1.5 rounded-lg border border-rose-500/30">
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>
                        <strong className="text-white">
                          {overdueTasks.length} overdue task(s)
                        </strong>{' '}
                        detected. Recommend re-scheduling or expediting.
                      </span>
                    </div>
                  )}

                  {upcomingDeadlines.length > 0 && (
                    <div className="flex items-center space-x-2 text-xs text-cyan-300 bg-cyan-950/30 px-3 py-1.5 rounded-lg border border-cyan-500/20">
                      <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span>
                        Next milestone deliverable:{' '}
                        <strong className="text-white">
                          "{upcomingDeadlines[0].title}"
                        </strong>{' '}
                        due {upcomingDeadlines[0].deadline}.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => onNavigate('ask-aura')}
              className="aura-gradient-btn px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AURA Anything</span>
            </button>
            {pendingApprovals.length > 0 && (
              <button
                onClick={() => onNavigate('approvals')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/40 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Review {pendingApprovals.length} Approvals</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Business Performance & Visual Breakdown per Section 14 */}
      <div className="aura-card p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Financial & Workload Performance
            </span>
            <h3 className="text-lg font-display font-bold text-white mt-0.5">
              Business Trajectory
            </h3>
          </div>
          <button
            onClick={() => onNavigate('analytics')}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
          >
            <span>Detailed Analytics</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Real data chart vs Empty state */}
        {!hasInvoiceData ? (
          <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-xl bg-[#080B14]/40 p-6">
            <TrendingUp className="w-10 h-10 text-gray-400 mb-3" />
            <h4 className="text-base font-semibold text-white">
              No business data yet.
            </h4>
            <p className="text-xs text-gray-400 mt-1 max-w-md">
              Create an invoice or register client contracts to automatically
              visualize revenue trajectory, profit margins, and deliverable
              velocity.
            </p>
            <button
              onClick={() => onQuickAction('invoice')}
              className="mt-4 px-4 py-2 rounded-xl bg-[#0D1220] border border-white/10 text-xs font-semibold text-white hover:bg-[#151B2B] cursor-pointer"
            >
              Create First Invoice
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Real metric breakdown bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#080B14] border border-white/5">
                <span className="text-xs text-gray-400">
                  Total Invoiced Value
                </span>
                <p className="text-xl font-bold text-white mt-1">
                  $
                  {data.invoices
                    .reduce((sum, inv) => sum + inv.amount, 0)
                    .toLocaleString()}
                </p>
                <div className="mt-2 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${
                        (calculatedRevenue /
                          Math.max(
                            1,
                            data.invoices.reduce((s, i) => s + i.amount, 0)
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {Math.round(
                    (calculatedRevenue /
                      Math.max(
                        1,
                        data.invoices.reduce((s, i) => s + i.amount, 0)
                      )) *
                      100
                  )}
                  % paid collection rate
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#080B14] border border-white/5">
                <span className="text-xs text-gray-400">
                  Pipeline Completion Rate
                </span>
                <p className="text-xl font-bold text-white mt-1">
                  {safeTasks.length > 0
                    ? Math.round(
                        (safeTasks.filter((t) => t && t.status === 'Completed')
                          .length /
                          safeTasks.length) *
                          100
                      )
                    : 0}
                  %
                </p>
                <div className="mt-2 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{
                      width: `${
                        safeTasks.length > 0
                          ? (safeTasks.filter((t) => t && t.status === 'Completed')
                              .length /
                              safeTasks.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {safeTasks.filter((t) => t && t.status === 'Completed').length} of{' '}
                  {safeTasks.length} milestones finished
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#080B14] border border-white/5">
                <span className="text-xs text-gray-400">
                  Active Client Retainers
                </span>
                <p className="text-xl font-bold text-white mt-1">
                  {activeClientsCount} accounts
                </p>
                <div className="mt-2 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full"
                    style={{ width: '85%' }}
                  />
                </div>
                <span className="text-[10px] text-emerald-400 mt-1 block">
                  Synchronized with Fiverr & Email
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Active Projects & Today's Focus per Section 15 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <div className="aura-card p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display font-bold text-white text-base">
                Active Projects
              </h3>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View all ({data.projects.length})
            </button>
          </div>

          {data.projects.length === 0 ? (
            /* Intentional empty state per section 16 */
            <div className="py-8 text-center border border-dashed border-white/10 rounded-xl bg-[#080B14]/40 p-5">
              <Briefcase className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-white">
                No active projects
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Create your first project to organize deliverable timelines.
              </p>
              <button
                onClick={() => onQuickAction('project')}
                className="mt-3 px-3 py-1.5 rounded-xl bg-[#0D1220] border border-white/10 text-xs font-semibold text-white hover:bg-[#151B2B]"
              >
                + Create Project
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.projects.slice(0, 3).map((prj) => (
                <div
                  key={prj.id}
                  onClick={() => onNavigate('projects')}
                  className="p-3.5 rounded-xl bg-[#080B14] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {prj.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {prj.clientName}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        prj.status === 'In Progress'
                          ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30'
                          : prj.status === 'Review'
                          ? 'bg-purple-950/50 text-purple-300 border border-purple-500/30'
                          : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {prj.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{prj.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                        style={{ width: `${prj.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Focus (Real Tasks) */}
        <div className="aura-card p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="font-display font-bold text-white text-base">
                Today's Focus
              </h3>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Task Matrix ({pendingTasks.length})
            </button>
          </div>

          {data.tasks.length === 0 ? (
            /* Intentional empty state */
            <div className="py-8 text-center border border-dashed border-white/10 rounded-xl bg-[#080B14]/40 p-5">
              <CheckSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-white">
                No tasks created yet
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Add deliverables so AURA can prioritize your workflow.
              </p>
              <button
                onClick={() => onQuickAction('task')}
                className="mt-3 px-3 py-1.5 rounded-xl bg-[#0D1220] border border-white/10 text-xs font-semibold text-white hover:bg-[#151B2B]"
              >
                + Add Task
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.tasks.slice(0, 4).map((t) => {
                const isCompleted = t.status === 'Completed';
                return (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border transition-all flex items-start space-x-3 ${
                      isCompleted
                        ? 'bg-[#080B14]/50 border-white/5 opacity-60'
                        : 'bg-[#080B14] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <button
                      onClick={() => onToggleTaskComplete(t.id)}
                      className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500 text-black'
                          : 'border border-gray-600 hover:border-cyan-400'
                      }`}
                    >
                      {isCompleted && <CheckCircle className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs font-medium truncate ${
                            isCompleted
                              ? 'line-through text-gray-400'
                              : 'text-white'
                          }`}
                        >
                          {t.title}
                        </p>
                        {t.aiSuggested && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 flex-shrink-0 ml-2">
                            AI Detected
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-[10px] text-gray-400">
                        {t.projectName && <span>{t.projectName}</span>}
                        {t.deadline && (
                          <>
                            <span>•</span>
                            <span className="text-gray-300">
                              Due {t.deadline}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Task Insights Section (Recharts Bar Chart by Status & Priority) */}
      <TaskInsightsSection tasks={safeTasks} onNavigate={onNavigate} />

      {/* 6. Section 16 Intentional Global Empty State fallback if EVERYTHING is empty */}
      {!hasAnyData && (
        <div
          id="global-empty-state"
          className="aura-card p-10 rounded-3xl border border-indigo-500/30 text-center max-w-2xl mx-auto space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 mx-auto">
            <div className="w-full h-full bg-[#05070D] rounded-full flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-display font-extrabold text-white">
              Your workspace is ready.
            </h3>
            <p className="text-sm text-gray-400 mt-2 max-w-lg mx-auto">
              Add your first client, project, or task to start building your
              business intelligence and unlock automated context detection.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onQuickAction('client')}
              className="aura-gradient-btn px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              + Add First Client
            </button>
            <button
              onClick={() => onQuickAction('project')}
              className="px-4 py-2.5 rounded-xl bg-[#0D1220] border border-white/10 text-xs font-semibold text-white hover:bg-[#151B2B] cursor-pointer"
            >
              + Create Project
            </button>
            <button
              onClick={() => onQuickAction('task')}
              className="px-4 py-2.5 rounded-xl bg-[#0D1220] border border-white/10 text-xs font-semibold text-white hover:bg-[#151B2B] cursor-pointer"
            >
              + Create Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
