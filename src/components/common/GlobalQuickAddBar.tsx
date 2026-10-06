import React, { useState, useEffect, useRef } from 'react';
import { Project, Client, PriorityLevel } from '../../types';
import {
  CheckSquare,
  UserPlus,
  Sparkles,
  CornerDownLeft,
  X,
  Calendar,
  DollarSign,
  Briefcase,
  AlertCircle,
  Command,
} from 'lucide-react';

interface GlobalQuickAddBarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  clients: Client[];
  onAddTask: (task: {
    title: string;
    description?: string;
    priority?: PriorityLevel;
    projectId?: string;
    deadline?: string;
  }) => Promise<void> | void;
  onAddLead: (lead: {
    name: string;
    company: string;
    email: string;
    estimatedValue: number;
    notes?: string;
  }) => void;
}

export const GlobalQuickAddBar: React.FC<GlobalQuickAddBarProps> = ({
  isOpen,
  onClose,
  projects,
  clients,
  onAddTask,
  onAddLead,
}) => {
  const [mode, setMode] = useState<'task' | 'lead'>('task');
  const [query, setQuery] = useState('');
  const [secondaryText, setSecondaryText] = useState(''); // email for lead, or desc for task
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel>('High');
  const [estimatedValue, setEstimatedValue] = useState<number>(5000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSecondaryText('');
      setSuccessMessage(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, mode]);

  // Handle global escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (mode === 'task') {
        const prj = projects.find((p) => p.id === selectedProjectId);
        await onAddTask({
          title: query.trim(),
          description: secondaryText.trim() || undefined,
          priority: selectedPriority,
          projectId: selectedProjectId || undefined,
          deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        });
        setSuccessMessage(`Task "${query.trim()}" created with AI categorization!`);
      } else {
        // Mode is lead
        onAddLead({
          name: query.trim(),
          company: secondaryText.trim() || query.trim(),
          email: secondaryText.includes('@') ? secondaryText.trim() : 'contact@prospect.io',
          estimatedValue: Number(estimatedValue) || 5000,
          notes: 'Captured via Global Quick Add bar.',
        });
        setSuccessMessage(`Lead "${query.trim()}" added to sales pipeline!`);
      }

      setQuery('');
      setSecondaryText('');
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      console.error('Quick Add failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="global-quick-add-overlay"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="global-quick-add-container"
        className="w-full max-w-2xl bg-[#0B0F19] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden ring-1 ring-white/10 transform transition-all animate-in zoom-in-95 duration-150"
      >
        {/* Top bar: Mode toggles and shortcut badge */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#080B14] border-b border-gray-800/80">
          <div className="flex items-center space-x-2">
            <button
              id="quick-add-toggle-task"
              type="button"
              onClick={() => {
                setMode('task');
                inputRef.current?.focus();
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'task'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Quick Task</span>
            </button>

            <button
              id="quick-add-toggle-lead"
              type="button"
              onClick={() => {
                setMode('lead');
                inputRef.current?.focus();
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'lead'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Quick Lead</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs text-gray-400">
            <div className="flex items-center space-x-1 font-mono text-[11px] bg-gray-900 border border-gray-800 px-2 py-0.5 rounded text-gray-300">
              <span className="text-cyan-400">⌘ / Ctrl</span>
              <span>+</span>
              <span className="text-cyan-400">Shift</span>
              <span>+</span>
              <span className="text-cyan-400">A</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Main Primary Input */}
          <div className="relative">
            <input
              id="quick-add-primary-input"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'task'
                  ? 'What task needs doing? (e.g. Audit telemetry streaming API)'
                  : 'Prospect or Company Name (e.g. Acme Robotics or Sarah Connor)'
              }
              className="w-full bg-[#111726] border border-cyan-500/30 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-medium"
            />
          </div>

          {/* Contextual Secondary Inputs Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {mode === 'task' ? (
              <>
                {/* Optional Project Assignment */}
                <div className="flex items-center bg-[#111726] border border-gray-800 rounded-lg px-2.5 py-1.5 text-gray-300">
                  <Briefcase className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                  <select
                    id="quick-add-task-project"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="" className="bg-[#0B0F19] text-gray-400">
                      No Project (General)
                    </option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#0B0F19] text-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Selection */}
                <div className="flex items-center bg-[#111726] border border-gray-800 rounded-lg px-2.5 py-1.5 text-gray-300">
                  <span className="text-gray-400 mr-1.5 font-medium">Priority:</span>
                  <select
                    id="quick-add-task-priority"
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as PriorityLevel)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Urgent" className="bg-[#0B0F19] text-rose-300">Urgent</option>
                    <option value="High" className="bg-[#0B0F19] text-orange-300">High</option>
                    <option value="Medium" className="bg-[#0B0F19] text-blue-300">Medium</option>
                    <option value="Low" className="bg-[#0B0F19] text-gray-300">Low</option>
                  </select>
                </div>

                {/* AI Categorization Notice */}
                <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] ml-auto">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Auto-categorized by AI</span>
                </div>
              </>
            ) : (
              <>
                {/* Lead Contact or Company */}
                <div className="flex-1 min-w-[200px]">
                  <input
                    id="quick-add-lead-secondary"
                    type="text"
                    value={secondaryText}
                    onChange={(e) => setSecondaryText(e.target.value)}
                    placeholder="Company or email address (optional)"
                    className="w-full bg-[#111726] border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Estimated Value */}
                <div className="flex items-center bg-[#111726] border border-gray-800 rounded-lg px-2.5 py-1.5 text-gray-300">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                  <input
                    id="quick-add-lead-value"
                    type="number"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(Number(e.target.value))}
                    className="bg-transparent w-16 text-xs text-white focus:outline-none font-mono"
                    placeholder="5000"
                  />
                </div>
              </>
            )}
          </div>

          {/* Status / Success notice */}
          {successMessage && (
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-xs">
            <div className="flex items-center space-x-3 text-gray-400 text-[11px]">
              <span>
                Press <kbd className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-700 text-gray-300 font-mono">Enter</kbd> to save
              </span>
              <span>
                Press <kbd className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-700 text-gray-300 font-mono">Esc</kbd> to dismiss
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                id="quick-add-submit-btn"
                type="submit"
                disabled={!query.trim() || isSubmitting}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer ${
                  mode === 'task'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-600/30'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Creating...' : `Create ${mode === 'task' ? 'Task' : 'Lead'}`}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
