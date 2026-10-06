import React, { useState } from 'react';
import { Task, TaskSubtask } from '../../types';
import { Check, Plus, Trash2, ListChecks, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface TaskSubtasksSectionProps {
  task: Task;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onCompleteParentTask?: (taskId: string) => void;
}

export const TaskSubtasksSection: React.FC<TaskSubtasksSectionProps> = ({
  task,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onCompleteParentTask,
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const completionPercentage =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    onAddSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
    setIsAdding(false);
  };

  return (
    <div
      id={`task-subtasks-section-${task.id}`}
      className="mt-3 pt-3 border-t border-white/5 space-y-2.5"
    >
      {/* Header with Progress Bar & Collapse Toggle */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1.5 text-gray-300 min-w-0">
          <ListChecks className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold text-white truncate">
            Subtasks
            {totalSubtasks > 0 && (
              <span className="ml-1.5 text-[11px] font-mono text-gray-400 font-normal">
                ({completedSubtasks}/{totalSubtasks})
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {totalSubtasks > 0 && (
            <span
              id={`task-subtask-pct-${task.id}`}
              className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                completionPercentage === 100
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : completionPercentage > 0
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                  : 'bg-white/5 text-gray-400'
              }`}
            >
              {completionPercentage}% complete
            </span>
          )}

          {totalSubtasks > 0 && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand subtasks' : 'Collapse subtasks'}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Percentage Completion Progress Bar for the Parent Task */}
      {totalSubtasks > 0 && (
        <div className="space-y-1">
          <div
            id={`task-subtasks-progress-${task.id}`}
            role="progressbar"
            aria-valuenow={completionPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full bg-[#080B14] rounded-full h-2 overflow-hidden border border-white/5 relative"
          >
            <div
              style={{ width: `${completionPercentage}%` }}
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                completionPercentage === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                  : completionPercentage > 50
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                  : 'bg-gradient-to-r from-indigo-500 to-cyan-500'
              }`}
            />
          </div>

          {/* 100% Subtask Completion Callout */}
          {completionPercentage === 100 && task.status !== 'Completed' && onCompleteParentTask && (
            <div className="flex items-center justify-between text-[10px] bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-2 py-1 text-emerald-300 animate-fade-in">
              <span className="flex items-center space-x-1 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>All subtasks checked! Ready to mark parent completed?</span>
              </span>
              <button
                type="button"
                onClick={() => onCompleteParentTask(task.id)}
                className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-[10px] transition-colors cursor-pointer"
              >
                Mark Task Done
              </button>
            </div>
          )}
        </div>
      )}

      {/* Nested Checkbox List */}
      {!isCollapsed && (
        <div className="space-y-1.5 pl-1">
          {subtasks.length > 0 ? (
            subtasks.map((st) => (
              <div
                key={st.id}
                id={`subtask-item-${st.id}`}
                className="group flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all text-xs"
              >
                <label className="flex items-center space-x-2 min-w-0 flex-1 cursor-pointer select-none">
                  {/* Subtask Checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleSubtask(task.id, st.id)}
                    title={st.completed ? 'Mark subtask incomplete' : 'Mark subtask complete'}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                      st.completed
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/30'
                        : 'border-white/20 hover:border-cyan-400 bg-[#080B14]'
                    }`}
                  >
                    <Check
                      className={`w-2.5 h-2.5 transition-transform ${
                        st.completed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                      }`}
                      strokeWidth={3}
                    />
                  </button>

                  {/* Subtask Title */}
                  <span
                    className={`text-xs transition-colors truncate ${
                      st.completed
                        ? 'line-through text-gray-500'
                        : 'text-gray-200 group-hover:text-white'
                    }`}
                  >
                    {st.title}
                  </span>
                </label>

                {/* Delete Subtask Button */}
                <button
                  type="button"
                  onClick={() => onDeleteSubtask(task.id, st.id)}
                  title="Remove subtask"
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-all cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          ) : (
            !isAdding && (
              <p className="text-[11px] text-gray-500 italic pl-1">
                No subtasks added yet. Add breakdown steps below.
              </p>
            )
          )}

          {/* Inline Add Subtask Input Form */}
          {isAdding ? (
            <form onSubmit={handleAddSubmit} className="flex items-center space-x-1.5 pt-1">
              <input
                type="text"
                autoFocus
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Type subtask step & press Enter..."
                className="flex-1 bg-[#080B14] border border-cyan-500/40 rounded-lg px-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black disabled:opacity-40 transition-colors cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewSubtaskTitle('');
                }}
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center space-x-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium py-1 px-1.5 rounded hover:bg-indigo-950/30 transition-colors cursor-pointer mt-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Subtask</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
