import React, { useState, useMemo } from 'react';
import { Project, ProjectMilestone, Task } from '../../types';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flag,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface ProjectTimelineVisualizationProps {
  projects: Project[];
  tasks?: Task[];
  onSelectProject?: (projectId: string) => void;
}

interface DerivedMilestone {
  id: string;
  title: string;
  date: string;
  timestamp: number;
  completed: boolean;
  isDeadline?: boolean;
}

export const ProjectTimelineVisualization: React.FC<ProjectTimelineVisualizationProps> = ({
  projects,
  tasks = [],
  onSelectProject,
}) => {
  const [selectedRange, setSelectedRange] = useState<'30d' | '60d' | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'in_progress' | 'review' | 'planning' | 'at_risk'>('all');
  const [hoveredMilestone, setHoveredMilestone] = useState<{
    milestone: DerivedMilestone;
    projectName: string;
    clientX: number;
    clientY: number;
  } | null>(null);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (!p) return false;
      if (activeFilter === 'in_progress') return p.status === 'In Progress';
      if (activeFilter === 'review') return p.status === 'Review';
      if (activeFilter === 'planning') return p.status === 'Planning';
      if (activeFilter === 'at_risk') {
        return (
          p.health === 'At Risk' ||
          p.health === 'Critical' ||
          p.aiRiskAssessment?.level === 'high' ||
          p.priority === 'Urgent'
        );
      }
      return true;
    });
  }, [projects, activeFilter]);

  // Extract milestones per project
  const projectTimelines = useMemo(() => {
    const now = Date.now();

    return filteredProjects.map((prj) => {
      const milestonesList: DerivedMilestone[] = [];

      // 1. Explicit project milestones if defined
      if (Array.isArray(prj.milestones) && prj.milestones.length > 0) {
        prj.milestones.forEach((m) => {
          if (m && m.deadline) {
            milestonesList.push({
              id: m.id || `m_${Math.random()}`,
              title: m.title || 'Milestone',
              date: m.deadline,
              timestamp: new Date(`${m.deadline}T12:00:00`).getTime(),
              completed: Boolean(m.completed),
            });
          }
        });
      } else {
        // 2. Synthesize milestones from project tasks if any
        const prjTasks = tasks.filter((t) => t.projectId === prj.id && t.deadline);
        if (prjTasks.length > 0) {
          prjTasks.slice(0, 5).forEach((t) => {
            milestonesList.push({
              id: t.id,
              title: t.title,
              date: t.deadline!,
              timestamp: new Date(`${t.deadline}T12:00:00`).getTime(),
              completed: t.status === 'Completed',
            });
          });
        } else {
          // Default sensible milestones based on progress
          const prjStart = prj.createdAt ? new Date(prj.createdAt).getTime() : now - 14 * 86400000;
          const prjEnd = prj.deadline ? new Date(`${prj.deadline}T12:00:00`).getTime() : now + 14 * 86400000;
          const span = prjEnd - prjStart;

          milestonesList.push({
            id: `${prj.id}_m1`,
            title: 'Scope & Architecture Signoff',
            date: new Date(prjStart + span * 0.25).toISOString().split('T')[0],
            timestamp: prjStart + span * 0.25,
            completed: prj.progress >= 30,
          });
          milestonesList.push({
            id: `${prj.id}_m2`,
            title: 'Core Deliverable Review',
            date: new Date(prjStart + span * 0.65).toISOString().split('T')[0],
            timestamp: prjStart + span * 0.65,
            completed: prj.progress >= 70,
          });
        }
      }

      // Add project deadline as final milestone flag
      if (prj.deadline) {
        milestonesList.push({
          id: `${prj.id}_deadline`,
          title: `Final Delivery Deadline: ${prj.name}`,
          date: prj.deadline,
          timestamp: new Date(`${prj.deadline}T12:00:00`).getTime(),
          completed: prj.status === 'Completed' || prj.progress === 100,
          isDeadline: true,
        });
      }

      // Sort chronological
      milestonesList.sort((a, b) => a.timestamp - b.timestamp);

      const startTime = prj.createdAt
        ? new Date(prj.createdAt).getTime()
        : milestonesList[0]?.timestamp
        ? milestonesList[0].timestamp - 7 * 86400000
        : now - 14 * 86400000;

      const endTime = prj.deadline
        ? new Date(`${prj.deadline}T23:59:59`).getTime()
        : milestonesList[milestonesList.length - 1]?.timestamp || now + 14 * 86400000;

      return {
        project: prj,
        startTime,
        endTime,
        milestones: milestonesList,
      };
    });
  }, [filteredProjects, tasks]);

  // Global time domain calculation
  const { minTime, maxTime, totalDuration, todayTime } = useMemo(() => {
    const now = Date.now();
    let min = now - 7 * 86400000; // default start 1 week ago
    let max = now + 30 * 86400000; // default end 30 days ahead

    if (projectTimelines.length > 0) {
      const allStarts = projectTimelines.map((p) => p.startTime).filter(Boolean);
      const allEnds = projectTimelines.map((p) => p.endTime).filter(Boolean);

      if (allStarts.length > 0) min = Math.min(...allStarts);
      if (allEnds.length > 0) max = Math.max(...allEnds);

      // Add small safety padding
      min -= 2 * 86400000;
      max += 4 * 86400000;
    }

    if (selectedRange === '30d') {
      min = now - 3 * 86400000;
      max = now + 30 * 86400000;
    } else if (selectedRange === '60d') {
      min = now - 7 * 86400000;
      max = now + 60 * 86400000;
    }

    return {
      minTime: min,
      maxTime: max,
      totalDuration: Math.max(1, max - min),
      todayTime: now,
    };
  }, [projectTimelines, selectedRange]);

  // Generate date columns / ticks
  const dateTicks = useMemo(() => {
    const ticks: { date: Date; label: string; leftPercent: number; isToday: boolean }[] = [];
    const stepDays = totalDuration > 45 * 86400000 ? 7 : totalDuration > 20 * 86400000 ? 4 : 2;

    const cur = new Date(minTime);
    cur.setHours(0, 0, 0, 0);

    while (cur.getTime() <= maxTime) {
      const t = cur.getTime();
      const leftPercent = Math.max(0, Math.min(100, ((t - minTime) / totalDuration) * 100));
      const month = cur.toLocaleDateString('en-US', { month: 'short' });
      const day = cur.getDate();

      const isToday =
        new Date().toISOString().split('T')[0] === cur.toISOString().split('T')[0];

      ticks.push({
        date: new Date(cur),
        label: `${month} ${day}`,
        leftPercent,
        isToday,
      });

      cur.setDate(cur.getDate() + stepDays);
    }

    return ticks;
  }, [minTime, maxTime, totalDuration]);

  // Today marker percent
  const todayPercent = Math.max(0, Math.min(100, ((todayTime - minTime) / totalDuration) * 100));

  return (
    <div id="project-timeline-visualization" className="aura-card p-5 rounded-2xl mb-8 overflow-hidden">
      {/* Header controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-800/80">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider font-mono">Horizontal Scheduling Matrix</span>
          </div>
          <h3 className="text-lg font-display font-bold text-white tracking-tight flex items-center gap-2">
            <span>Project Milestones & Deliverables Timeline</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono">
              {filteredProjects.length} Active Tracks
            </span>
          </h3>
        </div>

        {/* View & Filter options */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter buttons */}
          <div className="flex items-center p-1 rounded-xl bg-gray-900/60 border border-gray-800 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All Tracks
            </button>
            <button
              onClick={() => setActiveFilter('in_progress')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeFilter === 'in_progress'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setActiveFilter('review')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeFilter === 'review'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Review
            </button>
            <button
              onClick={() => setActiveFilter('at_risk')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeFilter === 'at_risk'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              At Risk
            </button>
          </div>

          {/* Time range toggle */}
          <div className="flex items-center p-1 rounded-xl bg-gray-900/60 border border-gray-800 text-xs">
            <button
              onClick={() => setSelectedRange('30d')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedRange === '30d'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setSelectedRange('60d')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedRange === '60d'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              60 Days
            </button>
            <button
              onClick={() => setSelectedRange('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedRange === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All Span
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 py-3 px-1 text-[11px] text-gray-400 border-b border-gray-800/40">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          <span>Completed Milestone</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-cyan-200 inline-block shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
          <span>Upcoming Milestone</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <span>Overdue Milestone</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Flag className="w-3 h-3 text-pink-400" />
          <span>Project Final Deadline</span>
        </div>
        <div className="flex items-center space-x-1.5 ml-auto text-cyan-400 font-mono">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Vertical line indicates Today</span>
        </div>
      </div>

      {/* Main Gantt Timeline Area */}
      <div className="relative mt-4 overflow-x-auto select-none min-w-[750px]">
        {/* Date Headers Bar */}
        <div className="grid grid-cols-[240px_1fr] border-b border-gray-800/80 pb-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400 pl-2">
            Project & Client
          </div>
          <div className="relative h-6">
            {dateTicks.map((tick, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 text-[10px] font-mono text-gray-400 whitespace-nowrap"
                style={{ left: `${tick.leftPercent}%` }}
              >
                <span className={tick.isToday ? 'text-cyan-400 font-bold' : ''}>
                  {tick.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Timeline Rows */}
        <div className="relative divide-y divide-gray-800/40 min-h-[140px]">
          {/* Vertical "Today" Marker Line */}
          {todayPercent >= 0 && todayPercent <= 100 && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-10 w-[2px] bg-gradient-to-b from-cyan-400 via-cyan-500/80 to-transparent"
              style={{ left: `calc(240px + (100% - 240px) * ${todayPercent / 100})` }}
            >
              <div className="absolute -top-1.5 -translate-x-1/2 px-1.5 py-0.5 rounded bg-cyan-500 text-black font-mono font-extrabold text-[9px] uppercase shadow-lg">
                Today
              </div>
            </div>
          )}

          {projectTimelines.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No projects found matching the selected filter criteria.
            </div>
          ) : (
            projectTimelines.map(({ project: prj, startTime, endTime, milestones }) => {
              // Calculate track bar coordinates
              const barLeft = Math.max(0, Math.min(100, ((startTime - minTime) / totalDuration) * 100));
              const barRight = Math.max(0, Math.min(100, ((endTime - minTime) / totalDuration) * 100));
              const barWidth = Math.max(2, barRight - barLeft);

              const isAtRisk =
                prj.health === 'At Risk' ||
                prj.health === 'Critical' ||
                prj.aiRiskAssessment?.level === 'high';

              return (
                <div
                  key={prj.id}
                  id={`timeline-row-${prj.id}`}
                  onClick={() => onSelectProject?.(prj.id)}
                  className="grid grid-cols-[240px_1fr] py-4 group hover:bg-white/[0.02] transition-colors items-center cursor-pointer"
                >
                  {/* Left Column: Project Info */}
                  <div className="pr-4 pl-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {prj.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-gray-400">
                      <span className="truncate max-w-[140px]">{prj.clientName}</span>
                      <span
                        className={`font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          prj.status === 'Completed'
                            ? 'text-emerald-300 bg-emerald-950/40'
                            : isAtRisk
                            ? 'text-amber-300 bg-amber-950/40'
                            : 'text-cyan-300 bg-cyan-950/40'
                        }`}
                      >
                        {prj.progress}%
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Horizontal Track Bar & Milestones */}
                  <div className="relative h-10 flex items-center">
                    {/* Background track rail */}
                    <div className="w-full h-1.5 bg-gray-800/40 rounded-full" />

                    {/* Active Project Span Bar */}
                    <div
                      className={`absolute h-3 rounded-full transition-all ${
                        prj.status === 'Completed'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-500 opacity-80'
                          : isAtRisk
                          ? 'bg-gradient-to-r from-amber-600 via-orange-500 to-rose-600 opacity-85 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 opacity-85 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      }`}
                      style={{
                        left: `${barLeft}%`,
                        width: `${barWidth}%`,
                      }}
                    >
                      {/* Completed progress fill inside bar */}
                      <div
                        className="h-full rounded-full bg-white/25"
                        style={{ width: `${prj.progress}%` }}
                      />
                    </div>

                    {/* Milestones along track */}
                    {milestones.map((m) => {
                      const mPercent = Math.max(
                        0,
                        Math.min(100, ((m.timestamp - minTime) / totalDuration) * 100)
                      );
                      const isPastDue = !m.completed && m.timestamp < Date.now();

                      return (
                        <div
                          key={m.id}
                          className="absolute -translate-x-1/2 z-20 group/milestone cursor-pointer"
                          style={{ left: `${mPercent}%` }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredMilestone({
                              milestone: m,
                              projectName: prj.name,
                              clientX: rect.x + rect.width / 2,
                              clientY: rect.y,
                            });
                          }}
                          onMouseLeave={() => setHoveredMilestone(null)}
                        >
                          {m.isDeadline ? (
                            // Project Deadline Flag Marker
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform hover:scale-125 shadow-md ${
                                m.completed
                                  ? 'bg-emerald-950 border border-emerald-500 text-emerald-400'
                                  : isPastDue
                                  ? 'bg-rose-950 border border-rose-500 text-rose-400 animate-pulse'
                                  : 'bg-pink-950 border border-pink-500 text-pink-400'
                              }`}
                            >
                              <Flag className="w-3 h-3" />
                            </div>
                          ) : (
                            // Milestone Dot Node
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center transition-all hover:scale-130 shadow-md ${
                                m.completed
                                  ? 'bg-emerald-500 text-black border border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                                  : isPastDue
                                  ? 'bg-rose-500 text-white border border-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                                  : 'bg-[#0B0F19] text-cyan-400 border-2 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                              }`}
                            >
                              {m.completed ? (
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              ) : isPastDue ? (
                                <AlertTriangle className="w-2.5 h-2.5" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredMilestone && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl bg-[#090D16] border border-cyan-500/40 text-xs shadow-2xl shadow-black/80 max-w-xs transition-all"
          style={{
            left: hoveredMilestone.clientX,
            top: hoveredMilestone.clientY - 8,
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="font-bold text-white">{hoveredMilestone.milestone.title}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                hoveredMilestone.milestone.completed
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                  : hoveredMilestone.milestone.timestamp < Date.now()
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                  : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              {hoveredMilestone.milestone.completed
                ? 'Completed'
                : hoveredMilestone.milestone.timestamp < Date.now()
                ? 'Overdue'
                : 'Upcoming'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>Project: {hoveredMilestone.projectName}</span>
            <span className="font-mono text-cyan-300">{hoveredMilestone.milestone.date}</span>
          </div>
        </div>
      )}
    </div>
  );
};
