import React, { useState, useMemo } from 'react';
import { Task } from '../../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  CheckCircle2,
  PlusCircle,
  Activity,
  Calendar,
  Layers,
  BarChart3,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';

interface TeamVelocityChartProps {
  tasks: Task[];
}

type TimeframeOption = 30 | 14 | 7;
type ChartMode = 'area' | 'bar' | 'cumulative';

interface VelocityDataPoint {
  date: string;
  displayDate: string;
  fullDate: string;
  tasksCreated: number;
  tasksCompleted: number;
  cumulativeCreated: number;
  cumulativeCompleted: number;
  netVelocity: number;
}

export const TeamVelocityChart: React.FC<TeamVelocityChartProps> = ({ tasks }) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>(30);
  const [chartMode, setChartMode] = useState<ChartMode>('area');
  const [activeSeries, setActiveSeries] = useState<'all' | 'completed' | 'created'>('all');

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Generate date series for the last N days
  const velocityData = useMemo(() => {
    // Standardize reference anchor date (use today or latest task date)
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const points: VelocityDataPoint[] = [];
    let runningCreated = 0;
    let runningCompleted = 0;

    // Build day map for quick lookup
    const createdMap = new Map<string, number>();
    const completedMap = new Map<string, number>();

    safeTasks.forEach((t) => {
      if (t.createdAt) {
        const d = t.createdAt.split('T')[0];
        createdMap.set(d, (createdMap.get(d) || 0) + 1);
      }
      if (t.status === 'Completed') {
        const d = (t.completedAt || t.createdAt || '').split('T')[0];
        if (d) {
          completedMap.set(d, (completedMap.get(d) || 0) + 1);
        }
      }
    });

    for (let i = timeframe - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const displayDate = `${monthNames[d.getMonth()]} ${d.getDate()}`;
      const fullDate = d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const created = createdMap.get(isoDate) || 0;
      const completed = completedMap.get(isoDate) || 0;

      runningCreated += created;
      runningCompleted += completed;

      points.push({
        date: isoDate,
        displayDate,
        fullDate,
        tasksCreated: created,
        tasksCompleted: completed,
        cumulativeCreated: runningCreated,
        cumulativeCompleted: runningCompleted,
        netVelocity: completed - created,
      });
    }

    return points;
  }, [safeTasks, timeframe]);

  // Aggregate summary metrics
  const totals = useMemo(() => {
    const totalCreated = velocityData.reduce((acc, curr) => acc + curr.tasksCreated, 0);
    const totalCompleted = velocityData.reduce((acc, curr) => acc + curr.tasksCompleted, 0);
    const netVelocity = totalCompleted - totalCreated;
    const velocityRatio = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;
    const dailyRunRate = (totalCompleted / timeframe).toFixed(1);

    // Peak velocity day
    const peakDay = [...velocityData].sort((a, b) => b.tasksCompleted - a.tasksCompleted)[0];

    return {
      totalCreated,
      totalCompleted,
      netVelocity,
      velocityRatio,
      dailyRunRate,
      peakDay: peakDay && peakDay.tasksCompleted > 0 ? peakDay : null,
    };
  }, [velocityData, timeframe]);

  // Custom Dark Theme Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload as VelocityDataPoint;
      return (
        <div className="aura-card p-3 rounded-xl border border-white/10 shadow-2xl bg-[#080B14]/95 backdrop-blur-md text-xs space-y-2 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-gray-400">
            <span className="font-semibold text-white flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{dataPoint?.fullDate || label}</span>
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {chartMode === 'cumulative' ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
                    <span className="text-gray-300">Total Completed:</span>
                  </div>
                  <span className="font-bold font-mono text-emerald-400">
                    {dataPoint?.cumulativeCompleted}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-500/50" />
                    <span className="text-gray-300">Total Created:</span>
                  </div>
                  <span className="font-bold font-mono text-indigo-300">
                    {dataPoint?.cumulativeCreated}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
                    <span className="text-gray-300">Tasks Completed:</span>
                  </div>
                  <span className="font-bold font-mono text-emerald-400">
                    +{dataPoint?.tasksCompleted}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-500/50" />
                    <span className="text-gray-300">Tasks Created:</span>
                  </div>
                  <span className="font-bold font-mono text-indigo-300">
                    +{dataPoint?.tasksCreated}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                  <span className="text-gray-400">Daily Delta:</span>
                  <span
                    className={`font-mono font-bold ${
                      dataPoint?.netVelocity > 0
                        ? 'text-emerald-400'
                        : dataPoint?.netVelocity < 0
                        ? 'text-rose-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {dataPoint?.netVelocity > 0
                      ? `+${dataPoint.netVelocity} (surplus)`
                      : dataPoint?.netVelocity < 0
                      ? `${dataPoint.netVelocity} (backlog growth)`
                      : 'Equilibrium (0)'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="team-velocity-chart-card" className="aura-card p-6 rounded-2xl border border-white/5 space-y-6">
      {/* Chart Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Team Velocity: Tasks Completed vs. Created</span>
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Plotted over the last {timeframe} days to visualize throughput velocity, sprint pace, and deliverable momentum.
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-[#080B14] p-1 rounded-xl border border-white/10 text-xs">
            <button
              id="velocity-filter-30d"
              type="button"
              onClick={() => setTimeframe(30)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                timeframe === 30
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              id="velocity-filter-14d"
              type="button"
              onClick={() => setTimeframe(14)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                timeframe === 14
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              14 Days
            </button>
            <button
              id="velocity-filter-7d"
              type="button"
              onClick={() => setTimeframe(7)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                timeframe === 7
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              7 Days
            </button>
          </div>

          {/* Chart Mode Toggle */}
          <div className="flex items-center bg-[#080B14] p-1 rounded-xl border border-white/10 text-xs">
            <button
              id="velocity-mode-area"
              type="button"
              onClick={() => setChartMode('area')}
              title="Smooth Area Velocity Curve"
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                chartMode === 'area'
                  ? 'bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Daily Trend
            </button>
            <button
              id="velocity-mode-bar"
              type="button"
              onClick={() => setChartMode('bar')}
              title="Grouped Side-by-Side Bar Chart"
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                chartMode === 'bar'
                  ? 'bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Bar Comparison
            </button>
            <button
              id="velocity-mode-cumulative"
              type="button"
              onClick={() => setChartMode('cumulative')}
              title="Cumulative Burn-up Velocity Chart"
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                chartMode === 'cumulative'
                  ? 'bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Burn-up Curve
            </button>
          </div>
        </div>
      </div>

      {/* Metric KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#080B14] border border-emerald-500/20">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tasks Completed</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold">
              {totals.totalCompleted} closed
            </span>
          </div>
          <div className="text-2xl font-display font-extrabold text-emerald-400">
            {totals.totalCompleted}
          </div>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            Avg {totals.dailyRunRate} tasks/day
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#080B14] border border-indigo-500/20">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span className="flex items-center space-x-1">
              <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tasks Created</span>
            </span>
            <span className="text-[10px] text-indigo-400 font-mono font-semibold">
              {totals.totalCreated} intake
            </span>
          </div>
          <div className="text-2xl font-display font-extrabold text-indigo-300">
            {totals.totalCreated}
          </div>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            Backlog inflow in {timeframe}d
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span className="flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Velocity Ratio</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-mono font-semibold">
              {totals.velocityRatio}%
            </span>
          </div>
          <div
            className={`text-2xl font-display font-extrabold ${
              totals.velocityRatio >= 100
                ? 'text-cyan-400'
                : totals.velocityRatio >= 75
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {totals.velocityRatio}%
          </div>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            {totals.velocityRatio >= 100 ? 'Resolving faster than created' : 'Accumulating backlog debt'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/5">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span className="flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Net Throughput</span>
            </span>
            <span
              className={`text-[10px] font-mono font-semibold ${
                totals.netVelocity >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totals.netVelocity >= 0 ? `+${totals.netVelocity}` : totals.netVelocity}
            </span>
          </div>
          <div
            className={`text-2xl font-display font-extrabold ${
              totals.netVelocity >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totals.netVelocity >= 0 ? `+${totals.netVelocity}` : totals.netVelocity}
          </div>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            {totals.peakDay ? `Peak on ${totals.peakDay.displayDate}` : 'Steady team output'}
          </span>
        </div>
      </div>

      {/* Visual Chart Container */}
      <div className="w-full h-[320px] bg-[#080B14]/60 p-4 rounded-xl border border-white/5">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'bar' ? (
            <BarChart data={velocityData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                interval={timeframe === 30 ? 3 : timeframe === 14 ? 1 : 0}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12, fontSize: '12px' }}
                formatter={(value) => (
                  <span className="text-gray-300 text-xs font-medium">
                    {value === 'tasksCompleted' ? 'Tasks Completed' : 'Tasks Created'}
                  </span>
                )}
              />
              {(activeSeries === 'all' || activeSeries === 'completed') && (
                <Bar
                  dataKey="tasksCompleted"
                  name="tasksCompleted"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              )}
              {(activeSeries === 'all' || activeSeries === 'created') && (
                <Bar
                  dataKey="tasksCreated"
                  name="tasksCreated"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              )}
            </BarChart>
          ) : chartMode === 'cumulative' ? (
            <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCumCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCumCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                interval={timeframe === 30 ? 3 : timeframe === 14 ? 1 : 0}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12, fontSize: '12px' }}
                formatter={(value) => (
                  <span className="text-gray-300 text-xs font-medium">
                    {value === 'cumulativeCompleted' ? 'Cumulative Completed' : 'Cumulative Created'}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="cumulativeCompleted"
                name="cumulativeCompleted"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCumCompleted)"
              />
              <Area
                type="monotone"
                dataKey="cumulativeCreated"
                name="cumulativeCreated"
                stroke="#6366F1"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorCumCreated)"
              />
            </AreaChart>
          ) : (
            <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                interval={timeframe === 30 ? 3 : timeframe === 14 ? 1 : 0}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12, fontSize: '12px' }}
                formatter={(value) => (
                  <span className="text-gray-300 text-xs font-medium">
                    {value === 'tasksCompleted' ? 'Tasks Completed' : 'Tasks Created'}
                  </span>
                )}
              />
              {(activeSeries === 'all' || activeSeries === 'completed') && (
                <Area
                  type="monotone"
                  dataKey="tasksCompleted"
                  name="tasksCompleted"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                  dot={{ r: 3, fill: '#10B981', strokeWidth: 1, stroke: '#080B14' }}
                  activeDot={{ r: 5, fill: '#34D399', stroke: '#ffffff' }}
                />
              )}
              {(activeSeries === 'all' || activeSeries === 'created') && (
                <Area
                  type="monotone"
                  dataKey="tasksCreated"
                  name="tasksCreated"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCreated)"
                  dot={{ r: 3, fill: '#6366F1', strokeWidth: 1, stroke: '#080B14' }}
                  activeDot={{ r: 5, fill: '#818CF8', stroke: '#ffffff' }}
                />
              )}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Series Filter Legend Buttons */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-gray-500">Filter series:</span>
          <button
            type="button"
            onClick={() => setActiveSeries('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              activeSeries === 'all'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Both
          </button>
          <button
            type="button"
            onClick={() => setActiveSeries('completed')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              activeSeries === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                : 'text-gray-400 hover:text-emerald-300'
            }`}
          >
            Completed Only
          </button>
          <button
            type="button"
            onClick={() => setActiveSeries('created')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              activeSeries === 'created'
                ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                : 'text-gray-400 hover:text-indigo-300'
            }`}
          >
            Created Only
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-4 text-[11px] text-gray-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-gray-300">Resolved Output</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-gray-300">New Work Inflow</span>
          </div>
        </div>
      </div>
    </div>
  );
};
