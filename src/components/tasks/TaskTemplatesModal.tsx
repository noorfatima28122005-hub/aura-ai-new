import React, { useState } from 'react';
import { TaskTemplate } from '../../types';
import {
  Layers,
  X,
  Check,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  ListChecks,
  Briefcase,
  Flame,
  ArrowUp,
  Minus,
  CheckCircle2,
} from 'lucide-react';

interface TaskTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: TaskTemplate[];
  onSelectTemplate: (template: TaskTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
}

export const TaskTemplatesModal: React.FC<TaskTemplatesModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSelectTemplate,
  onDeleteTemplate,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (t.defaultCategory && t.defaultCategory.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div
      id="modal-task-templates"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="aura-card max-w-2xl w-full p-6 rounded-2xl border border-indigo-500/30 bg-[#0B0F19] space-y-4 max-h-[88vh] overflow-y-auto shadow-2xl shadow-black/80">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/70 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white tracking-tight flex items-center gap-2">
                <span>Task Templates Library</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {templates.length} Available
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Quickly load pre-configured deliverable structures with pre-filled subtasks.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates by name, subtasks, or workflow..."
            className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Templates Grid */}
        <div className="space-y-3 pt-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 space-y-2">
              <p>No task templates match your search.</p>
            </div>
          ) : (
            filtered.map((tmpl) => (
              <div
                key={tmpl.id}
                id={`task-template-card-${tmpl.id}`}
                className="p-4 rounded-xl bg-[#080B14] border border-white/10 hover:border-indigo-500/40 transition-all space-y-3 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {tmpl.name}
                      </h4>
                      {tmpl.isCustom ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                          Custom
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                          Standard
                        </span>
                      )}
                    </div>
                    {tmpl.description && (
                      <p className="text-xs text-gray-400 mt-1">{tmpl.description}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {tmpl.isCustom && onDeleteTemplate && (
                      <button
                        type="button"
                        onClick={() => onDeleteTemplate(tmpl.id)}
                        title="Delete custom template"
                        className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTemplate(tmpl);
                        onClose();
                      }}
                      className="aura-gradient-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Use Template</span>
                    </button>
                  </div>
                </div>

                {/* Attributes Row */}
                <div className="flex items-center space-x-3 text-[11px] text-gray-400 flex-wrap gap-y-1">
                  {tmpl.defaultCategory && (
                    <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10">
                      {tmpl.defaultCategory}
                    </span>
                  )}
                  {tmpl.defaultPriority && (
                    <span className="px-2 py-0.5 rounded bg-white/5 text-amber-300 border border-amber-500/20 font-medium">
                      Priority: {tmpl.defaultPriority}
                    </span>
                  )}
                  {tmpl.estimatedHours && (
                    <span className="flex items-center space-x-1 text-cyan-300 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{tmpl.estimatedHours}h est</span>
                    </span>
                  )}
                  <span className="text-gray-400">
                    <strong className="text-white font-mono">{tmpl.subtasks.length}</strong> pre-filled subtasks
                  </span>
                </div>

                {/* Subtask Preview List */}
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Pre-filled Subtasks Checklist:
                  </span>
                  <div className="space-y-1 pl-1">
                    {tmpl.subtasks.map((st, idx) => (
                      <div key={st.id || idx} className="flex items-start space-x-2 text-xs text-gray-300">
                        <span className="text-indigo-400 font-mono text-[10px] mt-0.5 font-bold">
                          {idx + 1}.
                        </span>
                        <span className="truncate">{st.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
