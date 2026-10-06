import React, { useState } from 'react';
import { FollowUpItem, FollowUpStatus, PriorityLevel, Client, Project } from '../../types';
import {
  Clock,
  Plus,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Send,
  Copy,
  Check,
  Building,
  User,
  RotateCcw,
} from 'lucide-react';

interface FollowUpsViewProps {
  followUps: FollowUpItem[];
  clients: Client[];
  projects: Project[];
  onAddFollowUp: (item: FollowUpItem) => void;
  onUpdateFollowUp: (item: FollowUpItem) => void;
  onDeleteFollowUp: (id: string) => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  followUps,
  clients,
  projects,
  onAddFollowUp,
  onUpdateFollowUp,
  onDeleteFollowUp,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'due' | 'upcoming' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeAiDraft, setActiveAiDraft] = useState<{ id: string; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [reason, setReason] = useState('');
  const [relatedProjectId, setRelatedProjectId] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [notes, setNotes] = useState('');

  const filteredFollowUps = followUps.filter((item) => {
    const matchesSearch =
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.relatedProjectName &&
        item.relatedProjectName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;

    let matchesTab = true;
    if (activeTab === 'due') {
      matchesTab = item.status === 'Due' || item.status === 'Overdue';
    } else if (activeTab === 'upcoming') {
      matchesTab = item.status === 'Upcoming';
    } else if (activeTab === 'completed') {
      matchesTab = item.status === 'Completed';
    }

    return matchesSearch && matchesPriority && matchesTab;
  });

  const overdueCount = followUps.filter((f) => f.status === 'Overdue').length;
  const dueCount = followUps.filter((f) => f.status === 'Due').length;
  const upcomingCount = followUps.filter((f) => f.status === 'Upcoming').length;

  const handleCreateFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === selectedClientId);
    const clientName = client ? client.name : 'Prospective Client';
    const project = projects.find((p) => p.id === relatedProjectId);

    const newItem: FollowUpItem = {
      id: `fu_${Date.now()}`,
      clientId: selectedClientId || 'general',
      clientName,
      reason: reason.trim(),
      relatedProjectId: project ? project.id : undefined,
      relatedProjectName: project ? project.name : undefined,
      lastContact: 'Today',
      nextFollowUpDate: nextFollowUpDate || new Date().toISOString().split('T')[0],
      priority,
      status: 'Upcoming',
      notes: notes.trim() || undefined,
      aiSuggested: false,
    };

    onAddFollowUp(newItem);
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedClientId('');
    setReason('');
    setRelatedProjectId('');
    setNextFollowUpDate('');
    setPriority('High');
    setNotes('');
  };

  const handleToggleComplete = (item: FollowUpItem) => {
    const updated: FollowUpItem = {
      ...item,
      status: item.status === 'Completed' ? 'Upcoming' : 'Completed',
      completedAt: item.status === 'Completed' ? undefined : new Date().toISOString().split('T')[0],
    };
    onUpdateFollowUp(updated);
  };

  const handleGenerateAiMessage = (item: FollowUpItem) => {
    const draft = `Hi ${item.clientName.split(' ')[0]},\n\nI hope your week is going smoothly. Following up on ${item.reason.toLowerCase()}.\n\nEverything is aligned on our end, and I wanted to confirm if you had any updates or if there are any questions I can address for you today.\n\nBest regards,\nNoor A. | Aura Studio`;
    setActiveAiDraft({ id: item.id, text: draft });
  };

  const handleCopyAiMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getStatusBadge = (status: FollowUpStatus) => {
    switch (status) {
      case 'Overdue':
        return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'Due':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'Upcoming':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'Urgent':
        return 'text-red-400 font-semibold';
      case 'High':
        return 'text-amber-400 font-semibold';
      case 'Medium':
        return 'text-blue-400';
      case 'Low':
        return 'text-neutral-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
              Follow-ups & Outreach
            </h1>
            {overdueCount + dueCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {overdueCount + dueCount} Actionable
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Ensure no client inquiry, milestone check-in, or proposal follow-up slips through the cracks.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-medium rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Follow-up</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>OVERDUE TOUCHPOINTS</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-semibold text-red-400 mt-2">{overdueCount}</p>
          <p className="text-xs text-neutral-500 mt-1">Require immediate courteous outreach</p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>DUE TODAY</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-semibold text-amber-400 mt-2">{dueCount}</p>
          <p className="text-xs text-neutral-500 mt-1">Scheduled for delivery today</p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>UPCOMING SCHEDULED</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-semibold text-neutral-100 mt-2">{upcomingCount}</p>
          <p className="text-xs text-neutral-500 mt-1">Inquiries & milestone reviews on calendar</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client or topic..."
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-neutral-800 text-neutral-100 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('due')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'due'
                  ? 'bg-neutral-800 text-amber-400 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Actionable ({overdueCount + dueCount})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-neutral-800 text-neutral-100 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'completed'
                  ? 'bg-neutral-800 text-neutral-100 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Completed
            </button>
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Follow-up Cards List */}
      {followUps.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-medium text-neutral-200">No follow-ups scheduled</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1 mb-6">
            Track client re-engagements, pending invoice checks, and proposal nudges with proactive
            AI assistance.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Follow-up</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFollowUps.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                item.status === 'Completed'
                  ? 'bg-neutral-900/30 border-neutral-800/60 opacity-60'
                  : item.status === 'Overdue'
                  ? 'bg-red-950/10 border-red-900/30 hover:border-red-500/40'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleComplete(item)}
                    className={`mt-0.5 p-1 rounded-md border transition-colors cursor-pointer ${
                      item.status === 'Completed'
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-neutral-700 hover:border-neutral-500 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-100">
                        {item.clientName}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                      <span className={`text-[10px] ${getPriorityBadge(item.priority)}`}>
                        {item.priority} Priority
                      </span>
                      {item.aiSuggested && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                          <Sparkles className="w-2.5 h-2.5" /> AI Recommended
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm mt-1 text-neutral-200 ${
                        item.status === 'Completed' ? 'line-through text-neutral-500' : ''
                      }`}
                    >
                      {item.reason}
                    </h4>

                    {item.relatedProjectName && (
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Project:{' '}
                        <span className="text-neutral-300">{item.relatedProjectName}</span>
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-xs text-neutral-500 mt-1 italic">"{item.notes}"</p>
                    )}
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                  <div className="text-right text-xs mr-2">
                    <span className="text-neutral-500 block text-[10px]">TARGET DATE</span>
                    <span
                      className={`font-mono font-medium ${
                        item.status === 'Overdue' ? 'text-red-400' : 'text-neutral-300'
                      }`}
                    >
                      {item.nextFollowUpDate}
                    </span>
                  </div>

                  <button
                    onClick={() => handleGenerateAiMessage(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-xs font-medium transition-colors cursor-pointer border border-neutral-700"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Draft AI Ping</span>
                  </button>

                  <button
                    onClick={() => onDeleteFollowUp(item.id)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* In-place AI draft view */}
              {activeAiDraft && activeAiDraft.id === item.id && (
                <div className="mt-3 p-3 rounded-lg bg-neutral-950/80 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs text-cyan-300 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Suggested Courteous Outreach Message</span>
                    </div>
                    <button
                      onClick={() => setActiveAiDraft(null)}
                      className="text-neutral-500 hover:text-neutral-300"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-neutral-200 whitespace-pre-line leading-relaxed font-mono bg-neutral-900 p-2.5 rounded border border-neutral-800">
                    {activeAiDraft.text}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-neutral-500">
                      Copy or customize before dispatching.
                    </span>
                    <button
                      onClick={() => handleCopyAiMessage(activeAiDraft.text, item.id)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Follow-up Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form
            onSubmit={handleCreateFollowUp}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-semibold text-neutral-100">Schedule Follow-up</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Associated Client *</label>
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Reason / Intent *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Check status of sent proposal, verify invoice payment, milestone signoff"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Target Follow-Up Date *</label>
                  <input
                    type="date"
                    required
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Related Project (Optional)</label>
                <select
                  value={relatedProjectId}
                  onChange={(e) => setRelatedProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">None / General</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Context Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific talking points or commitments made..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-neutral-400 hover:text-neutral-200 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Schedule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
