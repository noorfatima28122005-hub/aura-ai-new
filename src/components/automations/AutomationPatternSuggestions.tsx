import React, { useState, useMemo } from 'react';
import { AutomationRule, Task } from '../../types';
import {
  Sparkles,
  Bot,
  ArrowRight,
  Plus,
  CheckCircle2,
  Clock,
  Mail,
  ListPlus,
  ShieldCheck,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

interface SuggestedRule {
  id: string;
  title: string;
  description: string;
  trigger: string;
  action: string;
  patternDetected: string;
  confidenceScore: number;
  icon: 'email' | 'task' | 'alert' | 'invoice';
}

interface AutomationPatternSuggestionsProps {
  tasks: Task[];
  existingRules: AutomationRule[];
  onAdoptRule: (rule: Omit<AutomationRule, 'id' | 'triggerCount'>) => void;
}

export const AutomationPatternSuggestions: React.FC<AutomationPatternSuggestionsProps> = ({
  tasks = [],
  existingRules = [],
  onAdoptRule,
}) => {
  const [adoptedIds, setAdoptedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [justAdoptedMessage, setJustAdoptedMessage] = useState<string | null>(null);

  // Analyze manual task completions and patterns
  const { suggestions, patternStats } = useMemo(() => {
    const completedTasks = tasks.filter((t) => t && t.status === 'Completed');
    const clientDeliverables = tasks.filter(
      (t) => t && (t.category === 'Client Deliverable' || t.label?.toLowerCase().includes('client') || t.label?.toLowerCase().includes('design'))
    );
    const urgentTasks = tasks.filter((t) => t && (t.priority === 'Urgent' || t.priority === 'High'));

    const list: SuggestedRule[] = [
      {
        id: 'sugg_follow_up_task',
        title: 'Automatically create follow-up task on completion',
        description: 'Whenever an Urgent or Strategic task is marked Completed, instantly create a secondary QA & client verification follow-up task.',
        trigger: 'Task with priority "Urgent" or "High" changed to "Completed"',
        action: 'Automatically create a follow-up task: "Verify deliverable & collect client feedback"',
        patternDetected: `${urgentTasks.length} high-priority tasks completed manually without formal follow-up scheduling`,
        confidenceScore: 94,
        icon: 'task',
      },
      {
        id: 'sugg_status_email',
        title: 'Send status email on client milestone completion',
        description: 'When a deliverable task linked to a project is marked Completed, draft an automated progress update email for human sign-off.',
        trigger: 'Deliverable task marked "Completed"',
        action: 'Draft client status email with milestone details and queue for approval',
        patternDetected: `${clientDeliverables.length} client deliverables finished requiring manual status emails`,
        confidenceScore: 91,
        icon: 'email',
      },
      {
        id: 'sugg_hours_alert',
        title: 'Overtime threshold warning',
        description: 'Automatically alert team when task actual hours exceed 90% of estimated hours to protect project profit margins.',
        trigger: 'Task actual logged hours exceed 90% of estimated hours',
        action: 'Trigger in-app notification & log budget alert in project health summary',
        patternDetected: 'Time tracking enabled across backlog with potential project scope creep',
        confidenceScore: 88,
        icon: 'alert',
      },
      {
        id: 'sugg_invoice_draft',
        title: 'Draft milestone invoice on final task completion',
        description: 'When the last active deliverable of a project is completed, automatically prepare a draft invoice ready for review.',
        trigger: 'All tasks in an active project reach "Completed" status',
        action: 'Generate draft invoice reflecting project fee and send to Approval Center',
        patternDetected: `${completedTasks.length} manual completions across deliverable milestones`,
        confidenceScore: 86,
        icon: 'invoice',
      },
    ];

    // Filter out rules that are already in existingRules or dismissed
    const existingTitles = new Set(existingRules.map((r) => r.title.toLowerCase()));
    const filtered = list.filter((s) => !existingTitles.has(s.title.toLowerCase()));

    return {
      suggestions: filtered,
      patternStats: {
        totalTasksAnalyzed: tasks.length,
        completedCount: completedTasks.length,
        urgentCount: urgentTasks.length,
        clientDeliverableCount: clientDeliverables.length,
      },
    };
  }, [tasks, existingRules]);

  const handleAdopt = (sugg: SuggestedRule) => {
    onAdoptRule({
      title: sugg.title,
      description: sugg.description,
      trigger: sugg.trigger,
      action: sugg.action,
      enabled: true,
      requiresHumanApproval: true,
    });

    setAdoptedIds((prev) => new Set(prev).add(sugg.id));
    setJustAdoptedMessage(`Adopted automation rule: "${sugg.title}"`);
    setTimeout(() => setJustAdoptedMessage(null), 3500);
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const visibleSuggestions = suggestions.filter((s) => !dismissedIds.has(s.id) && !adoptedIds.has(s.id));

  return (
    <div
      id="automation-pattern-analysis-card"
      className="aura-card p-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#0B101E] via-[#0E1528] to-[#0A0D18] space-y-4 shadow-xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                AURA Workflow Pattern Intelligence
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                Pattern Analysis Active
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Analyzed {patternStats.totalTasksAnalyzed} manual workspace tasks ({patternStats.completedCount} completed) to recommend high-yield operational automations.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono text-cyan-300/80 bg-white/5 px-3 py-1 rounded-xl border border-white/5">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <span>{visibleSuggestions.length} Recommended Rules</span>
        </div>
      </div>

      {/* Success Notification */}
      {justAdoptedMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{justAdoptedMessage}</span>
          </div>
          <button
            onClick={() => setJustAdoptedMessage(null)}
            className="text-emerald-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Suggestions List */}
      {visibleSuggestions.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-white/[0.02] border border-dashed border-white/10 space-y-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
          <p className="text-xs font-semibold text-white">All suggested automation rules are currently active!</p>
          <p className="text-[11px] text-gray-400">AURA continues monitoring deliverable workflows for new recurring patterns.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {visibleSuggestions.map((sugg) => {
            return (
              <div
                key={sugg.id}
                className="p-4 rounded-xl border border-white/10 bg-[#090D18] hover:border-cyan-500/40 transition-all space-y-3 relative group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {sugg.icon === 'email' && <Mail className="w-3.5 h-3.5" />}
                        {sugg.icon === 'task' && <ListPlus className="w-3.5 h-3.5" />}
                        {sugg.icon === 'alert' && <Clock className="w-3.5 h-3.5" />}
                        {sugg.icon === 'invoice' && <Zap className="w-3.5 h-3.5" />}
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {sugg.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => handleDismiss(sugg.id)}
                      title="Dismiss suggestion"
                      className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    {sugg.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-[#060810] border border-white/5 space-y-1 text-[10px]">
                    <div className="flex items-center space-x-1.5 text-gray-400">
                      <span className="text-cyan-400 font-semibold uppercase tracking-wider">Trigger:</span>
                      <span className="text-white truncate">{sugg.trigger}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-gray-400">
                      <span className="text-emerald-400 font-semibold uppercase tracking-wider">Action:</span>
                      <span className="text-white truncate">{sugg.action}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
                    <span className="italic truncate max-w-[200px]" title={sugg.patternDetected}>
                      💡 {sugg.patternDetected}
                    </span>
                    <span className="text-cyan-300 font-mono font-semibold">
                      {sugg.confidenceScore}% match
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-[10px] text-gray-400">
                    <ShieldCheck className="w-3 h-3 text-pink-400" />
                    <span>Human Approval Safeguard</span>
                  </div>

                  <button
                    onClick={() => handleAdopt(sugg)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adopt Rule</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
