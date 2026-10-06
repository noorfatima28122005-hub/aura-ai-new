import React, { useState } from 'react';
import { Task } from '../../types';
import { AlertTriangle, CheckCircle, Link2, ExternalLink, X, ShieldAlert } from 'lucide-react';

interface TaskBlockingBadgeProps {
  task: Task;
  allTasks: Task[];
  onClearBlocking?: (taskId: string) => void;
  onNavigateToTask?: (blockingTaskId: string) => void;
}

export const TaskBlockingBadge: React.FC<TaskBlockingBadgeProps> = ({
  task,
  allTasks,
  onClearBlocking,
  onNavigateToTask,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Collect all dependency IDs from dependencies array and legacy blockingTaskId
  const dependencyIds = Array.from(
    new Set([
      ...(Array.isArray(task.dependencies) ? task.dependencies : []),
      ...(task.blockingTaskId ? [task.blockingTaskId] : []),
      ...(task.blockedByTaskId ? [task.blockedByTaskId] : []),
    ])
  ).filter(Boolean);

  if (dependencyIds.length === 0) return null;

  // Resolve tasks
  const resolvedDeps = dependencyIds
    .map((id) => allTasks.find((t) => t.id === id))
    .filter(Boolean) as Task[];

  // Determine unresolved dependencies (status !== 'Completed')
  const unresolvedDeps = resolvedDeps.filter((t) => t.status !== 'Completed');
  const isBlocked = unresolvedDeps.length > 0;

  const displayTitle =
    unresolvedDeps.length === 1
      ? unresolvedDeps[0].title
      : unresolvedDeps.length > 1
      ? `${unresolvedDeps[0].title} (+${unresolvedDeps.length - 1} more)`
      : resolvedDeps.length === 1
      ? resolvedDeps[0].title
      : `${resolvedDeps.length} prerequisites`;

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {isBlocked ? (
        <div
          id={`task-blocked-badge-${task.id}`}
          title={`Blocked by ${unresolvedDeps.length} unresolved task(s)`}
          className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/60 shadow-sm shadow-amber-950/50 cursor-help transition-all hover:bg-amber-900/90"
        >
          {/* Warning icon */}
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <span className="truncate max-w-[200px]">
            Blocked by: <span className="underline decoration-amber-500/50">{displayTitle}</span>
          </span>
          {onClearBlocking && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearBlocking(task.id);
              }}
              title="Remove dependency links"
              className="ml-1 p-0.5 hover:text-white rounded transition-colors cursor-pointer"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ) : (
        <div
          id={`task-unblocked-badge-${task.id}`}
          title={`All ${resolvedDeps.length} dependencies resolved`}
          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 cursor-help"
        >
          <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="truncate max-w-[180px]">
            Unblocked ({displayTitle})
          </span>
        </div>
      )}

      {/* Rich Dependency Tooltip showing the blocking task's title and status */}
      {showTooltip && (
        <div
          role="tooltip"
          className="absolute left-0 bottom-full mb-2 z-50 w-80 p-3 rounded-xl bg-[#0D1220] border border-amber-500/40 text-white shadow-2xl shadow-black/80 text-xs space-y-2 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Task Dependencies ({dependencyIds.length})</span>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                isBlocked
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isBlocked ? `${unresolvedDeps.length} Blocking` : 'All Cleared'}
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto text-[11px] pr-1">
            {resolvedDeps.map((dep) => {
              const depUnresolved = dep.status !== 'Completed';
              return (
                <div
                  key={dep.id}
                  className={`p-2 rounded-lg border ${
                    depUnresolved
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-emerald-950/20 border-emerald-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-semibold text-white truncate max-w-[180px]">
                      "{dep.title}"
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                        depUnresolved
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {dep.status}
                    </span>
                  </div>
                  {dep.projectName && (
                    <div className="text-[10px] text-indigo-300 truncate mt-0.5">
                      Project: {dep.projectName}
                    </div>
                  )}
                </div>
              );
            })}

            {resolvedDeps.length === 0 && (
              <div className="text-gray-400 text-[10px]">
                {dependencyIds.length} external dependency ID(s) linked
              </div>
            )}
          </div>

          <div className="pt-1.5 border-t border-white/10 text-[10px] text-gray-400 italic">
            {isBlocked
              ? `⚠️ ${unresolvedDeps.length} prerequisite task(s) must be completed first.`
              : '✓ All prerequisite dependencies resolved. Task is ready for execution.'}
          </div>
        </div>
      )}
    </div>
  );
};
