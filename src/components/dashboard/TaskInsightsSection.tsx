import React, { useMemo } from 'react';
import { Task, NavigationTab } from '../../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Layers,
} from 'lucide-react';

interface TaskInsightsSectionProps {
  tasks: Task[];
  onNavigate: (tab: NavigationTab) => void;
}

export const TaskInsightsSection: React.FC<TaskInsightsSectionProps> = ({
  tasks = [],
  onNavigate,
}) => {
  // Aggregate tasks by status and priority
  const chartData = useMemo(() => {
    const statuses = ['To Do', 'In Progress', 'Review', 'Completed'];
    return statuses.map((status) => {
      const inStatus = tasks.filter((t) => (t.status || 'To Do') === status);
      const urgent = inStatus.filter((t) => t.priority === 'Urgent').length;
      const high = inStatus.filter((t) => t.priority === 'High').length;
      const medium = inStatus.filter((t) => t.priority === 'Medium').length;
      const low = inStatus.filter((t) => t.priority === 'Low' || !t.priority).length;
      const total = inStatus.length;

      return {
        status,
        Urgent: urgent,
        High: high,
        Medium: medium,
        Low: low,
        total,
      };
    });
  }, [tasks]);

  // Overall metric calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed');
  const urgentCount = pendingTasks.filter((t) => t.priority === 'Urgent').length;
  const highCount = pendingTasks.filter((t) => t.priority === 'High').length;
  const mediumCount = pendingTasks.filter((t) => t.priority === 'Medium').length;
  const lowCount = pendingTasks.filter((t) => t.priority === 'Low' || !t.priority).length;

  // Identify High-Load Bottlenecks
  const highLoadBottleneck = useMemo(() => {
    const activeStatuses = ['To Do', 'In Progress', 'Review'];
    let worstStatus = '';
    let maxHighLoadScore = 0;

    for (const status of activeStatuses) {
      const inStatus = tasks.filter((t) => (t.status || 'To Do') === status);
      const urgent = inStatus.filter((t) => t.priority === 'Urgent').length;
      const high = inStatus.filter((t) => t.priority === 'High').length;
      // High-load score: Urgent = 3pts, High = 2pts, Total = 1pt
      const score = urgent * 3 + high * 2 + inStatus.length;
      if (score > maxHighLoadScore) {
        maxHighLoadScore = score;
        worstStatus = status;
      }
    }

    if (!worstStatus || maxHighLoadScore === 0) return null;

    const inWorst = tasks.filter((t) => (t.status || 'To Do') === worstStatus);
    const urgentCountInWorst = inWorst.filter((t) => t.priority === 'Urgent').length;
    const highCountInWorst = inWorst.filter((t) => t.priority === 'High').length;

    return {
      status: worstStatus,
      total: inWorst.length,
      urgent: urgentCountInWorst,
      high: highCountInWorst,
    };
  }, [tasks]);

  // Custom Recharts Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#080B14] border border-white/10 rounded-xl p-3 shadow-2xl space-y-1.5 text-xs min-w-[170px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1">
            <span className="font-bold text-white">{label}</span>
            <span className="text-[11px] font-mono text-cyan-400">{data.total} tasks</span>
          </div>
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-red-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Urgent:</span>
              </span>
              <span className="font-mono font-bold">{data.Urgent}</span>
            </div>
            <div className="flex items-center justify-between text-amber-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>High:</span>
              </span>
              <span className="font-mono font-bold">{data.High}</span>
            </div>
            <div className="flex items-center justify-between text-indigo-300">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Medium:</span>
              </span>
              <span className="font-mono font-bold">{data.Medium}</span>
            </div>
            <div className="flex items-center justify-between text-cyan-300">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span>Low:</span>
              </span>
              <span className="font-mono font-bold">{data.Low}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="section-task-insights" className="aura-card p-6 rounded-2xl border border-white/5 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-display font-bold text-white text-base sm:text-lg">
                Task Insights
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
                Status & Priority Analysis
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Visualize task distribution across sprint stages to identify high-load bottlenecks.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('tasks')}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 cursor-pointer shrink-0"
        >
          <span>Manage in Tasks Matrix</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* High-Load Area Alert & KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Backlog */}
        <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5 space-y-1">
          <span className="text-[11px] text-gray-400 font-medium">Total Backlog</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-white">{totalTasks}</span>
            <span className="text-xs text-gray-500">deliverables</span>
          </div>
          <span className="text-[10px] text-emerald-400 block">
            {completedTasks} completed ({totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)
          </span>
        </div>

        {/* High-Load Bottleneck Alert */}
        <div
          className={`p-3.5 rounded-xl border space-y-1 ${
            urgentCount + highCount > 0
              ? 'bg-rose-950/20 border-rose-500/30'
              : 'bg-[#080B14] border-white/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-medium">High-Load Area</span>
            {urgentCount > 0 && <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />}
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-red-400">
              {urgentCount + highCount}
            </span>
            <span className="text-xs text-gray-400">urgent / high</span>
          </div>
          <span className="text-[10px] text-gray-400 block truncate">
            {highLoadBottleneck
              ? `${highLoadBottleneck.status}: ${highLoadBottleneck.total} tasks`
              : 'Workload evenly balanced'}
          </span>
        </div>

        {/* In-Flight Pipeline */}
        <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5 space-y-1">
          <span className="text-[11px] text-gray-400 font-medium">In-Flight Tasks</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-cyan-400">
              {tasks.filter((t) => t.status === 'In Progress').length}
            </span>
            <span className="text-xs text-gray-500">active sprint</span>
          </div>
          <span className="text-[10px] text-cyan-300/80 block">
            {tasks.filter((t) => t.status === 'Review').length} pending client review
          </span>
        </div>

        {/* Priority Health Ratio */}
        <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5 space-y-1.5">
          <span className="text-[11px] text-gray-400 font-medium">Priority Distribution</span>
          <div className="flex items-center space-x-1.5 text-[10px] font-mono font-semibold">
            <span className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-500/30">
              {urgentCount}U
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/30">
              {highCount}H
            </span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
              {mediumCount}M
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              {lowCount}L
            </span>
          </div>
          <span className="text-[10px] text-gray-400 block">Pending tasks by tier</span>
        </div>
      </div>

      {/* Recharts Bar Chart: Tasks by Status & Priority */}
      <div className="p-4 rounded-xl bg-[#080B14] border border-white/5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-300">
            Workload Distribution by Sprint Status
          </span>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center space-x-1 text-red-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              <span>Urgent</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span>High</span>
            </span>
            <span className="flex items-center space-x-1 text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
              <span>Medium</span>
            </span>
            <span className="flex items-center space-x-1 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
              <span>Low</span>
            </span>
          </div>
        </div>

        <div className="w-full h-64 sm:h-72">
          {tasks.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
              <Clock className="w-8 h-8 text-gray-500 mb-2" />
              <p className="text-xs text-gray-400">No tasks created yet</p>
              <button
                onClick={() => onNavigate('tasks')}
                className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                + Create Deliverables
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="status"
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="Urgent"
                  stackId="statusStack"
                  fill="#EF4444"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={48}
                />
                <Bar
                  dataKey="High"
                  stackId="statusStack"
                  fill="#F59E0B"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={48}
                />
                <Bar
                  dataKey="Medium"
                  stackId="statusStack"
                  fill="#6366F1"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={48}
                />
                <Bar
                  dataKey="Low"
                  stackId="statusStack"
                  fill="#06B6D4"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* High-Load Insight Note */}
        {highLoadBottleneck && highLoadBottleneck.urgent + highLoadBottleneck.high > 0 && (
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start space-x-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-gray-300">
              <span className="font-semibold text-amber-300">
                High-Load Warning in "{highLoadBottleneck.status}":
              </span>{' '}
              {highLoadBottleneck.urgent + highLoadBottleneck.high} critical deliverables ({highLoadBottleneck.urgent} Urgent, {highLoadBottleneck.high} High) are awaiting progress. Consider prioritizing these to prevent sprint bottlenecks.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
