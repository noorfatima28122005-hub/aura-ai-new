import React, { useState } from 'react';
import { TaskSubtask, PriorityLevel, TaskCategory } from '../../types';
import { Bookmark, X, Check, Layers, AlertCircle } from 'lucide-react';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtasks: TaskSubtask[];
  defaultTitle: string;
  defaultPriority: PriorityLevel;
  defaultCategory: TaskCategory;
  estimatedHours: number;
  onSaveTemplate: (name: string, description: string) => void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  subtasks,
  defaultTitle,
  defaultPriority,
  defaultCategory,
  estimatedHours,
  onSaveTemplate,
}) => {
  const [templateName, setTemplateName] = useState(defaultTitle || '');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      setError('Please provide a template name.');
      return;
    }
    onSaveTemplate(templateName.trim(), description.trim());
    onClose();
  };

  return (
    <div
      id="modal-save-task-template"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="aura-card max-w-md w-full p-6 rounded-2xl border border-indigo-500/30 bg-[#0B0F19] space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Save Task Template</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Save this task structure and its {subtasks.length} subtask{subtasks.length === 1 ? '' : 's'} for reuse.
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

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-gray-300 mb-1">
              Template Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Web Development Setup or Security Audit"
              className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this workflow covers..."
              className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Subtasks to be bundled */}
          <div className="p-3 rounded-xl bg-[#080B14] border border-white/5 space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Bundled Subtasks ({subtasks.length}):
            </span>
            {subtasks.length > 0 ? (
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {subtasks.map((st, idx) => (
                  <div key={st.id || idx} className="text-[11px] text-gray-300 flex items-center space-x-1.5 truncate">
                    <span className="text-indigo-400 font-mono text-[10px]">{idx + 1}.</span>
                    <span className="truncate">{st.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic">No subtasks currently added.</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="aura-gradient-btn px-4 py-1.5 rounded-xl font-semibold text-white shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Template</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
