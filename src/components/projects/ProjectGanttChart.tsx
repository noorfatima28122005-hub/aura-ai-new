import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Project, Task } from '../../types';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Link2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sliders,
  MoveHorizontal,
  Info,
} from 'lucide-react';

interface ProjectGanttChartProps {
  projects: Project[];
  tasks?: Task[];
  onEditProject?: (project: Project) => Promise<void> | void;
  onSelectProject?: (projectId: string) => void;
}

type ZoomLevel = 'day' | 'week' | 'month';

interface DragState {
  projectId: string;
  type: 'move' | 'resize-start' | 'resize-end';
  startX: number;
  initialStartDate: string;
  initialEndDate: string;
  currentStartDate: string;
  currentEndDate: string;
}

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({
  projects,
  tasks = [],
  onEditProject,
  onSelectProject,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [selectedDependencyTarget, setSelectedDependencyTarget] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Column pixel width based on zoom level
  const dayWidth = zoom === 'day' ? 44 : zoom === 'week' ? 22 : 12;

  // Derive standardized project start and end dates
  const projectSchedule = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return projects.map((p) => {
      // Start date: explicit or from createdAt or 14 days before deadline
      let startStr = p.startDate;
      if (!startStr) {
        if (p.createdAt) {
          startStr = p.createdAt.split('T')[0];
        } else if (p.deadline) {
          const d = new Date(`${p.deadline}T00:00:00`);
          d.setDate(d.getDate() - 14);
          startStr = d.toISOString().split('T')[0];
        } else {
          startStr = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
        }
      }

      // End date: explicit endDate or deadline or 14 days after start
      let endStr = p.endDate || p.deadline;
      if (!endStr) {
        const d = new Date(`${startStr}T00:00:00`);
        d.setDate(d.getDate() + 21);
        endStr = d.toISOString().split('T')[0];
      }

      // Ensure start <= end
      if (new Date(startStr).getTime() > new Date(endStr).getTime()) {
        const temp = startStr;
        startStr = endStr;
        endStr = temp;
      }

      return {
        ...p,
        computedStartDate: startStr,
        computedEndDate: endStr,
      };
    });
  }, [projects]);

  // Determine overall timeline min and max dates
  const { minDate, maxDate, totalDays, datesList } = useMemo(() => {
    let minTime = Number.POSITIVE_INFINITY;
    let maxTime = Number.NEGATIVE_INFINITY;

    projectSchedule.forEach((p) => {
      const s = new Date(`${p.computedStartDate}T00:00:00`).getTime();
      const e = new Date(`${p.computedEndDate}T00:00:00`).getTime();
      if (!isNaN(s) && s < minTime) minTime = s;
      if (!isNaN(e) && e > maxTime) maxTime = e;
    });

    const now = Date.now();
    if (minTime === Number.POSITIVE_INFINITY) minTime = now - 14 * 86400000;
    if (maxTime === Number.NEGATIVE_INFINITY) maxTime = now + 45 * 86400000;

    // Pad 10 days before and 20 days after for comfortable scrolling
    const paddedMin = new Date(minTime);
    paddedMin.setDate(paddedMin.getDate() - 8);
    paddedMin.setHours(0, 0, 0, 0);

    const paddedMax = new Date(maxTime);
    paddedMax.setDate(paddedMax.getDate() + 20);
    paddedMax.setHours(0, 0, 0, 0);

    const daysCount = Math.max(15, Math.ceil((paddedMax.getTime() - paddedMin.getTime()) / 86400000));

    const list: Date[] = [];
    for (let i = 0; i <= daysCount; i++) {
      const d = new Date(paddedMin);
      d.setDate(d.getDate() + i);
      list.push(d);
    }

    return {
      minDate: paddedMin,
      maxDate: paddedMax,
      totalDays: daysCount,
      datesList: list,
    };
  }, [projectSchedule]);

  // Helper to convert date string to pixel X position
  const getXForDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`).getTime();
    const minT = minDate.getTime();
    const daysFromStart = (d - minT) / 86400000;
    return Math.max(0, daysFromStart * dayWidth);
  };

  // Helper to convert pixel offset back to date string
  const getDateForX = (x: number) => {
    const daysFromStart = Math.round(x / dayWidth);
    const d = new Date(minDate);
    d.setDate(d.getDate() + daysFromStart);
    return d.toISOString().split('T')[0];
  };

  // Today marker pixel position
  const todayX = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return getXForDate(todayStr);
  }, [minDate, dayWidth]);

  // Center scroll on today when initialized
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollPos = Math.max(0, todayX - 250);
      scrollContainerRef.current.scrollLeft = scrollPos;
    }
  }, [minDate, dayWidth]);

  // Mouse Drag listeners for Start/End Date adjustment
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaPx = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaPx / dayWidth);

      if (dragState.type === 'move') {
        // Move both start and end dates together
        const s = new Date(`${dragState.initialStartDate}T00:00:00`);
        s.setDate(s.getDate() + deltaDays);
        const eDate = new Date(`${dragState.initialEndDate}T00:00:00`);
        eDate.setDate(eDate.getDate() + deltaDays);

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                currentStartDate: s.toISOString().split('T')[0],
                currentEndDate: eDate.toISOString().split('T')[0],
              }
            : null
        );
      } else if (dragState.type === 'resize-start') {
        // Adjust start date only
        const s = new Date(`${dragState.initialStartDate}T00:00:00`);
        s.setDate(s.getDate() + deltaDays);
        const maxLimit = new Date(`${dragState.initialEndDate}T00:00:00`);
        maxLimit.setDate(maxLimit.getDate() - 1);

        if (s.getTime() <= maxLimit.getTime()) {
          setDragState((prev) =>
            prev
              ? {
                  ...prev,
                  currentStartDate: s.toISOString().split('T')[0],
                }
              : null
          );
        }
      } else if (dragState.type === 'resize-end') {
        // Adjust end date only
        const eDate = new Date(`${dragState.initialEndDate}T00:00:00`);
        eDate.setDate(eDate.getDate() + deltaDays);
        const minLimit = new Date(`${dragState.initialStartDate}T00:00:00`);
        minLimit.setDate(minLimit.getDate() + 1);

        if (eDate.getTime() >= minLimit.getTime()) {
          setDragState((prev) =>
            prev
              ? {
                  ...prev,
                  currentEndDate: eDate.toISOString().split('T')[0],
                }
              : null
          );
        }
      }
    };

    const handleMouseUp = async () => {
      if (!dragState) return;
      const { projectId, currentStartDate, currentEndDate } = dragState;

      // Find original project and call onEditProject
      const targetProject = projects.find((p) => p.id === projectId);
      if (targetProject && onEditProject) {
        try {
          await onEditProject({
            ...targetProject,
            startDate: currentStartDate,
            endDate: currentEndDate,
            deadline: currentEndDate,
          });
          setSuccessToast(`Timeline updated for ${targetProject.name} (${currentStartDate} → ${currentEndDate})`);
          setTimeout(() => setSuccessToast(null), 3500);
        } catch (err) {
          console.error('Failed to update project timeline dates:', err);
        }
      }

      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, dayWidth, projects, onEditProject]);

  const handleStartDrag = (
    e: React.MouseEvent,
    projectId: string,
    type: 'move' | 'resize-start' | 'resize-end',
    startDate: string,
    endDate: string
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setDragState({
      projectId,
      type,
      startX: e.clientX,
      initialStartDate: startDate,
      initialEndDate: endDate,
      currentStartDate: startDate,
      currentEndDate: endDate,
    });
  };

  // Quick navigation controls
  const handleScrollToday = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, todayX - 250),
        behavior: 'smooth',
      });
    }
  };

  const handleScrollBy = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: amount,
        behavior: 'smooth',
      });
    }
  };

  // Calculate dependency curves
  // Each project can have `dependencies?: string[]` pointing to predecessor project IDs
  const dependencyLinks = useMemo(() => {
    const links: {
      fromId: string;
      toId: string;
      fromIndex: number;
      toIndex: number;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      hasConflict: boolean;
    }[] = [];

    const rowHeight = 56;
    const headerOffset = 48;

    projectSchedule.forEach((prj, toIdx) => {
      // Check explicit dependencies or synthesize sensible flow if none
      const depIds = Array.isArray(prj.dependencies) ? prj.dependencies : [];

      depIds.forEach((fromId) => {
        const fromIdx = projectSchedule.findIndex((p) => p.id === fromId);
        if (fromIdx !== -1) {
          const pred = projectSchedule[fromIdx];
          const fromX = getXForDate(pred.computedEndDate);
          const fromY = headerOffset + fromIdx * rowHeight + rowHeight / 2;

          const toX = getXForDate(prj.computedStartDate);
          const toY = headerOffset + toIdx * rowHeight + rowHeight / 2;

          const hasConflict = new Date(pred.computedEndDate).getTime() > new Date(prj.computedStartDate).getTime();

          links.push({
            fromId,
            toId: prj.id,
            fromIndex: fromIdx,
            toIndex: toIdx,
            fromX,
            fromY,
            toX,
            toY,
            hasConflict,
          });
        }
      });
    });

    return links;
  }, [projectSchedule, minDate, dayWidth]);

  // Toggle or add a dependency between projects
  const handleToggleDependency = async (fromId: string, toId: string) => {
    if (fromId === toId || !onEditProject) return;
    const targetPrj = projects.find((p) => p.id === toId);
    if (!targetPrj) return;

    const currentDeps = Array.isArray(targetPrj.dependencies) ? [...targetPrj.dependencies] : [];
    const exists = currentDeps.includes(fromId);
    const updatedDeps = exists ? currentDeps.filter((id) => id !== fromId) : [...currentDeps, fromId];

    try {
      await onEditProject({
        ...targetPrj,
        dependencies: updatedDeps,
      });
      setSuccessToast(
        exists
          ? `Removed dependency link.`
          : `Linked dependency: ${targetPrj.name} now follows predecessor.`
      );
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Failed to toggle dependency:', err);
    }
  };

  const getStatusColor = (status: string, health?: string) => {
    if (health === 'Critical' || health === 'At Risk') {
      return {
        bg: 'from-rose-600 to-rose-700',
        border: 'border-rose-400/80',
        text: 'text-rose-200',
        pill: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
      };
    }
    switch (status) {
      case 'Completed':
        return {
          bg: 'from-emerald-600 to-teal-700',
          border: 'border-emerald-400/80',
          text: 'text-emerald-200',
          pill: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
        };
      case 'Review':
        return {
          bg: 'from-purple-600 to-indigo-700',
          border: 'border-purple-400/80',
          text: 'text-purple-200',
          pill: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
        };
      case 'Planning':
        return {
          bg: 'from-amber-600 to-amber-700',
          border: 'border-amber-400/80',
          text: 'text-amber-200',
          pill: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
        };
      case 'In Progress':
      default:
        return {
          bg: 'from-cyan-600 to-blue-700',
          border: 'border-cyan-400/80',
          text: 'text-cyan-200',
          pill: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
        };
    }
  };

  const totalWidth = datesList.length * dayWidth;

  return (
    <div
      ref={containerRef}
      className="aura-card rounded-2xl border border-white/10 overflow-hidden bg-[#090D18] shadow-2xl transition-all"
    >
      {/* Gantt Header & Toolbar */}
      <div className="p-4 border-b border-white/10 bg-[#0C1222] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <MoveHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Interactive Project Gantt Chart
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
                Drag-and-Drop Enabled
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Drag bars to shift timelines or drag left/right handles to adjust project start &amp; end dates.
            </p>
          </div>
        </div>

        {/* Controls: Zoom, Today, Pan */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center bg-[#080B14] border border-white/10 rounded-xl p-0.5 text-[11px]">
            <button
              onClick={() => setZoom('day')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                zoom === 'day' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Days
            </button>
            <button
              onClick={() => setZoom('week')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                zoom === 'week' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Weeks
            </button>
            <button
              onClick={() => setZoom('month')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                zoom === 'month' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Months
            </button>
          </div>

          <button
            onClick={handleScrollToday}
            title="Center view on Today"
            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center space-x-1 cursor-pointer"
          >
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Today</span>
          </button>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleScrollBy(-200)}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScrollBy(200)}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Split Layout: Left Table + Right Scrollable Gantt Canvas */}
      <div className="flex flex-col md:flex-row relative">
        {/* Left Frozen Panel: Project Details */}
        <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-[#080C16] z-10">
          {/* Header */}
          <div className="h-12 px-3 flex items-center justify-between border-b border-white/10 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <span>Project &amp; Client</span>
            <span>Status</span>
          </div>

          {/* Project Row Labels */}
          <div className="divide-y divide-white/5">
            {projectSchedule.map((prj) => {
              const isHovered = hoveredProjectId === prj.id;
              const hasDependencies = Array.isArray(prj.dependencies) && prj.dependencies.length > 0;

              return (
                <div
                  key={prj.id}
                  onMouseEnter={() => setHoveredProjectId(prj.id)}
                  onMouseLeave={() => setHoveredProjectId(null)}
                  onClick={() => onSelectProject && onSelectProject(prj.id)}
                  className={`h-14 px-3 flex items-center justify-between transition-colors cursor-pointer ${
                    isHovered ? 'bg-white/5' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white truncate max-w-[130px]" title={prj.name}>
                        {prj.name}
                      </span>
                      {hasDependencies && (
                        <span title={`Depends on ${prj.dependencies?.length} project(s)`}>
                          <Link2 className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 truncate block">
                      {prj.clientName}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                      getStatusColor(prj.status, prj.health).pill
                    }`}
                  >
                    {prj.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Scrollable Timeline Canvas */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden select-none relative bg-[#090D18]"
          style={{ cursor: dragState ? 'col-resize' : 'default' }}
        >
          <div style={{ width: totalWidth, position: 'relative' }}>
            {/* Timeline Header Row: Months / Weeks & Days */}
            <div className="h-12 border-b border-white/10 bg-[#0C1222] sticky top-0 z-10 flex">
              {datesList.map((d, i) => {
                const isToday = d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                const dayNum = d.getDate();
                const isFirstOfMonth = dayNum === 1 || i === 0;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                return (
                  <div
                    key={i}
                    style={{ width: dayWidth }}
                    className={`h-full border-r border-white/5 flex flex-col justify-center items-center text-[10px] shrink-0 ${
                      isWeekend ? 'bg-white/[0.015]' : ''
                    } ${isToday ? 'bg-cyan-500/10 border-cyan-500/30' : ''}`}
                  >
                    {isFirstOfMonth && (
                      <span className="text-[9px] font-bold text-cyan-300 truncate uppercase tracking-tighter">
                        {d.toLocaleString('default', { month: 'short' })}
                      </span>
                    )}
                    <span
                      className={`font-mono text-[10px] ${
                        isToday ? 'font-bold text-cyan-300' : isWeekend ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      {dayNum}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Background Grid Lines & Weekend Shading */}
            <div className="absolute top-12 bottom-0 left-0 right-0 flex pointer-events-none">
              {datesList.map((d, i) => {
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const isToday = d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={i}
                    style={{ width: dayWidth }}
                    className={`h-full border-r border-white/[0.03] shrink-0 ${
                      isWeekend ? 'bg-white/[0.01]' : ''
                    } ${isToday ? 'bg-cyan-500/[0.04]' : ''}`}
                  />
                );
              })}
            </div>

            {/* Vertical 'Today' Indicator Line */}
            <div
              style={{ left: todayX + dayWidth / 2 }}
              className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 shadow-md shadow-cyan-400/50 z-20 pointer-events-none"
            >
              <div className="absolute -top-1 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest bg-cyan-500 text-black shadow">
                Today
              </div>
            </div>

            {/* SVG Dependency Connection Arrows Layer */}
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-15"
              style={{ height: 48 + projectSchedule.length * 56 }}
            >
              <defs>
                <marker
                  id="gantt-arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#06B6D4" />
                </marker>
                <marker
                  id="gantt-arrow-conflict"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#F43F5E" />
                </marker>
              </defs>

              {dependencyLinks.map((link, idx) => {
                const isLinkActive =
                  hoveredProjectId === link.fromId || hoveredProjectId === link.toId;

                // Bezier curve path from link.fromX to link.toX
                const midX = (link.fromX + link.toX) / 2;
                const path = `M ${link.fromX} ${link.fromY} C ${midX} ${link.fromY}, ${midX} ${link.toY}, ${link.toX} ${link.toY}`;

                return (
                  <path
                    key={idx}
                    d={path}
                    fill="none"
                    stroke={link.hasConflict ? '#F43F5E' : isLinkActive ? '#38BDF8' : '#0EA5E9'}
                    strokeWidth={isLinkActive ? 2.5 : 1.5}
                    strokeDasharray={link.hasConflict ? '4 3' : 'none'}
                    markerEnd={link.hasConflict ? 'url(#gantt-arrow-conflict)' : 'url(#gantt-arrow)'}
                    opacity={isLinkActive ? 1 : 0.6}
                    className="transition-all"
                  />
                );
              })}
            </svg>

            {/* Project Timeline Rows & Drag-and-Drop Bars */}
            <div className="relative z-10">
              {projectSchedule.map((prj, index) => {
                const isDraggingThis = dragState?.projectId === prj.id;
                const isHovered = hoveredProjectId === prj.id;

                const effectiveStart = isDraggingThis
                  ? dragState.currentStartDate
                  : prj.computedStartDate;
                const effectiveEnd = isDraggingThis
                  ? dragState.currentEndDate
                  : prj.computedEndDate;

                const startX = getXForDate(effectiveStart);
                const endX = getXForDate(effectiveEnd) + dayWidth;
                const barWidth = Math.max(dayWidth * 1.5, endX - startX);

                const statusStyles = getStatusColor(prj.status, prj.health);
                const daysDuration = Math.max(
                  1,
                  Math.round(
                    (new Date(`${effectiveEnd}T00:00:00`).getTime() -
                      new Date(`${effectiveStart}T00:00:00`).getTime()) /
                      86400000
                  )
                );

                return (
                  <div
                    key={prj.id}
                    style={{ height: 56 }}
                    onMouseEnter={() => setHoveredProjectId(prj.id)}
                    onMouseLeave={() => setHoveredProjectId(null)}
                    className="border-b border-white/5 relative flex items-center"
                  >
                    {/* Gantt Bar Element */}
                    <div
                      style={{
                        left: startX,
                        width: barWidth,
                      }}
                      onMouseDown={(e) =>
                        handleStartDrag(e, prj.id, 'move', prj.computedStartDate, prj.computedEndDate)
                      }
                      className={`absolute h-8 rounded-xl bg-gradient-to-r ${
                        statusStyles.bg
                      } border ${
                        statusStyles.border
                      } shadow-lg cursor-grab active:cursor-grabbing transition-shadow flex items-center px-2 group ${
                        isDraggingThis
                          ? 'ring-2 ring-cyan-400 shadow-cyan-500/50 scale-[1.02] z-30'
                          : isHovered
                          ? 'shadow-cyan-950/80 scale-[1.01] z-20'
                          : 'z-10'
                      }`}
                    >
                      {/* Left Resize Handle (Start Date) */}
                      <div
                        onMouseDown={(e) =>
                          handleStartDrag(
                            e,
                            prj.id,
                            'resize-start',
                            prj.computedStartDate,
                            prj.computedEndDate
                          )
                        }
                        title="Drag to change Start Date"
                        className="absolute left-0 top-0 bottom-0 w-2.5 hover:w-3.5 bg-white/20 hover:bg-white/60 rounded-l-xl cursor-ew-resize flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      >
                        <div className="w-0.5 h-3 bg-white/80 rounded" />
                      </div>

                      {/* Progress Fill inside bar */}
                      <div
                        style={{ width: `${Math.min(100, Math.max(0, prj.progress || 0))}%` }}
                        className="absolute top-0 bottom-0 left-0 bg-white/20 rounded-l-xl pointer-events-none"
                      />

                      {/* Bar Content */}
                      <div className="relative z-10 flex items-center justify-between w-full min-w-0 pointer-events-none">
                        <span className="text-xs font-bold text-white truncate drop-shadow-sm">
                          {prj.name}
                        </span>

                        <div className="flex items-center space-x-1 shrink-0 ml-2">
                          <span className="text-[9px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded text-white/90">
                            {prj.progress || 0}%
                          </span>
                        </div>
                      </div>

                      {/* Right Resize Handle (End Date / Deadline) */}
                      <div
                        onMouseDown={(e) =>
                          handleStartDrag(
                            e,
                            prj.id,
                            'resize-end',
                            prj.computedStartDate,
                            prj.computedEndDate
                          )
                        }
                        title="Drag to change Deadline / End Date"
                        className="absolute right-0 top-0 bottom-0 w-2.5 hover:w-3.5 bg-white/20 hover:bg-white/60 rounded-r-xl cursor-ew-resize flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      >
                        <div className="w-0.5 h-3 bg-white/80 rounded" />
                      </div>

                      {/* Drag Floating Tooltip */}
                      {isDraggingThis && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-black/90 border border-cyan-400 text-[10px] font-mono font-bold text-cyan-300 shadow-xl whitespace-nowrap pointer-events-none z-40">
                          {effectiveStart} → {effectiveEnd} ({daysDuration}d)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Quick Link Predecessors */}
      <div className="p-3 border-t border-white/10 bg-[#0C1222] flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>In Progress</span>
          </span>
          <span className="flex items-center space-x-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Review</span>
          </span>
          <span className="flex items-center space-x-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Completed</span>
          </span>
          <span className="flex items-center space-x-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>At Risk</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[11px]">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tip: Hover project bars to reveal dependency links and drag handles.</span>
        </div>
      </div>
    </div>
  );
};
