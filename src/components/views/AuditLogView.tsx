import React, { useState, useMemo } from 'react';
import { WorkspaceData, ActivityItem } from '../../types';
import {
  History,
  Search,
  Filter,
  Download,
  Shield,
  Bot,
  User,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Sparkles,
  Calendar,
  X,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

interface AuditLogViewProps {
  activities: ActivityItem[];
}

type TimeRangePreset = 'all' | 'today' | '24h' | '7d' | '30d' | 'custom';

export const AuditLogView: React.FC<AuditLogViewProps> = ({ activities }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actorFilter, setActorFilter] = useState<'all' | 'user' | 'ai' | 'system'>('all');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [timeRangePreset, setTimeRangePreset] = useState<TimeRangePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Extract unique action types for filter dropdown
  const uniqueActionTypes = useMemo(() => {
    const types = new Set<string>();
    activities.forEach((act) => {
      if (act.type) types.add(act.type);
    });
    return Array.from(types).sort();
  }, [activities]);

  const parseItemDate = (timestampStr: string): Date | null => {
    if (!timestampStr) return null;
    const directDate = new Date(timestampStr);
    if (!isNaN(directDate.getTime())) return directDate;

    // Support formatted strings like "2026-09-19 14:30"
    const parsed = Date.parse(timestampStr);
    if (!isNaN(parsed)) return new Date(parsed);

    return null;
  };

  const filteredActivities = useMemo(() => {
    const now = new Date();
    const query = searchTerm.trim().toLowerCase();

    return activities.filter((act) => {
      // 1. Search Query filter (checks title, description, actor, type, and all metadata)
      if (query) {
        const metadataString = act.metadata
          ? Object.entries(act.metadata).map(([k, v]) => `${k} ${v}`).join(' ')
          : '';
        const haystack = `${act.title} ${act.description} ${act.actor} ${act.type || ''} ${metadataString}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      // 2. Actor filter
      if (actorFilter !== 'all') {
        if (actorFilter === 'user' && act.actorType !== 'user') return false;
        if (actorFilter === 'ai' && act.actorType !== 'ai') return false;
        if (actorFilter === 'system' && act.actorType !== 'system') return false;
      }

      // 3. Action type filter
      if (actionTypeFilter !== 'all') {
        if (act.type !== actionTypeFilter) return false;
      }

      // 4. Time range filter
      if (timeRangePreset !== 'all') {
        const itemDate = parseItemDate(act.timestamp);
        if (itemDate) {
          const itemTime = itemDate.getTime();
          if (timeRangePreset === 'today') {
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            if (itemTime < startOfToday) return false;
          } else if (timeRangePreset === '24h') {
            const past24h = now.getTime() - 24 * 60 * 60 * 1000;
            if (itemTime < past24h) return false;
          } else if (timeRangePreset === '7d') {
            const past7d = now.getTime() - 7 * 24 * 60 * 60 * 1000;
            if (itemTime < past7d) return false;
          } else if (timeRangePreset === '30d') {
            const past30d = now.getTime() - 30 * 24 * 60 * 60 * 1000;
            if (itemTime < past30d) return false;
          } else if (timeRangePreset === 'custom') {
            if (customStartDate) {
              const start = new Date(`${customStartDate}T00:00:00`).getTime();
              if (itemTime < start) return false;
            }
            if (customEndDate) {
              const end = new Date(`${customEndDate}T23:59:59`).getTime();
              if (itemTime > end) return false;
            }
          }
        }
      }

      return true;
    });
  }, [activities, searchTerm, actorFilter, actionTypeFilter, timeRangePreset, customStartDate, customEndDate]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setActorFilter('all');
    setActionTypeFilter('all');
    setTimeRangePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const isFiltered =
    searchTerm !== '' ||
    actorFilter !== 'all' ||
    actionTypeFilter !== 'all' ||
    timeRangePreset !== 'all';

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredActivities, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aura_audit_log_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActorBadge = (actorType: ActivityItem['actorType']) => {
    switch (actorType) {
      case 'ai':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            <Sparkles className="w-2.5 h-2.5" /> AURA AI
          </span>
        );
      case 'user':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded">
            <User className="w-2.5 h-2.5" /> User (Noor A.)
          </span>
        );
      case 'system':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            <Zap className="w-2.5 h-2.5" /> System Webhook
          </span>
        );
    }
  };

  return (
    <div id="view-audit-log" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0D1220] via-[#111827] to-[#080B14] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
              Activity &amp; Audit Log
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              {filteredActivities.length} / {activities.length} Events
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Tamper-evident audit trail capturing user decisions, autonomous AI triggers, financial events, and external API webhooks.
          </p>
        </div>

        <button
          onClick={handleExportJson}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 transition-colors cursor-pointer self-start md:self-auto shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Filtered Log (JSON)</span>
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3.5 shadow-lg">
        {/* Top Row: Search Box & Action Type Selector & Actor Tabs */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Real-time Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              id="audit-log-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search actions, entities, actors, descriptions or metadata..."
              className="w-full pl-9 pr-8 py-2 bg-neutral-950/90 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action / Event Type Filter */}
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <select
              id="audit-action-type-filter"
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500/60 cursor-pointer"
            >
              <option value="all">All Action Types</option>
              {uniqueActionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Actor Filter Tabs */}
          <div className="flex bg-neutral-950 border border-neutral-800 rounded-xl p-0.5 text-xs self-start lg:self-auto shrink-0">
            <button
              onClick={() => setActorFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                actorFilter === 'all'
                  ? 'bg-neutral-800 text-neutral-100 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All Actors
            </button>
            <button
              onClick={() => setActorFilter('ai')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                actorFilter === 'ai'
                  ? 'bg-neutral-800 text-cyan-400 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              AI System
            </button>
            <button
              onClick={() => setActorFilter('user')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                actorFilter === 'user'
                  ? 'bg-neutral-800 text-neutral-100 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Human User
            </button>
          </div>
        </div>

        {/* Second Row: Time-Range Filters & Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center space-x-1 text-neutral-400 font-semibold mr-1 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Time Range:</span>
            </span>

            {(['all', 'today', '24h', '7d', '30d', 'custom'] as TimeRangePreset[]).map((preset) => {
              const labelMap: Record<TimeRangePreset, string> = {
                all: 'All History',
                today: 'Today',
                '24h': 'Past 24 Hours',
                '7d': 'Past 7 Days',
                '30d': 'Past 30 Days',
                custom: 'Custom Range...',
              };

              return (
                <button
                  key={preset}
                  id={`btn-timerange-${preset}`}
                  onClick={() => setTimeRangePreset(preset)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                    timeRangePreset === preset
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  {labelMap[preset]}
                </button>
              );
            })}
          </div>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Custom Date Range Selectors (visible when 'custom' is active) */}
        {timeRangePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs animate-fade-in">
            <span className="text-neutral-400 text-[11px] font-semibold flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Date Window:</span>
            </span>

            <div className="flex items-center space-x-2">
              <label className="text-[11px] text-neutral-400">From:</label>
              <input
                id="audit-start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-[11px] text-neutral-400">To:</label>
              <input
                id="audit-end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Activities Timeline */}
      {filteredActivities.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto border border-neutral-700">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-200">
            No audit records matching criteria
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Try adjusting your search query, selecting "All History", or choosing a broader actor or action type.
          </p>
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="mt-2 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Active Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((act) => (
            <div
              key={act.id}
              className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">{getActorBadge(act.actorType)}</div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-semibold text-neutral-100">{act.title}</h4>
                    {act.type && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                        {act.type}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {act.description}
                  </p>
                  {act.metadata && Object.keys(act.metadata).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-neutral-500 font-mono">
                      {Object.entries(act.metadata).map(([k, v]) => (
                        <span key={k} className="bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800/80">
                          {k}: <strong className="text-neutral-300">{String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right text-xs text-neutral-500 shrink-0 self-end sm:self-center font-mono">
                <div className="flex items-center space-x-1 text-neutral-400 justify-end">
                  <Clock className="w-3 h-3 text-cyan-500/70" />
                  <span>{act.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
