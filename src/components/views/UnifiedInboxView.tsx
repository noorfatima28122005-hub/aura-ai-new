import React, { useState } from 'react';
import { UnifiedMessage, MessageSource, Task, PriorityLevel, Client, Project } from '../../types';
import { EntityLinkerModal } from '../common/EntityLinkerModal';
import {
  Inbox,
  Mail,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Archive,
  Star,
  CornerDownLeft,
  CheckSquare,
  Send,
  AlertCircle,
  Tag,
  Link as LinkIcon,
  Building,
  Briefcase,
} from 'lucide-react';

interface UnifiedInboxViewProps {
  messages: UnifiedMessage[];
  clients?: Client[];
  projects?: Project[];
  onUpdateMessage: (message: UnifiedMessage) => void;
  onAddTask: (task: Task) => void;
}

export const UnifiedInboxView: React.FC<UnifiedInboxViewProps> = ({
  messages,
  clients = [],
  projects = [],
  onUpdateMessage,
  onAddTask,
}) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    messages.length > 0 ? messages[0].id : null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | MessageSource>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'actionable'>('all');
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [taskCreatedFeedback, setTaskCreatedFeedback] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.clientName && msg.clientName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSource = sourceFilter === 'all' || msg.source === sourceFilter;
    const matchesMode =
      filterMode === 'all' ||
      (filterMode === 'unread' && msg.unread) ||
      (filterMode === 'actionable' && msg.detectedAction);

    return matchesSearch && matchesSource && matchesMode && !msg.isArchived;
  });

  const selectedMessage = messages.find((m) => m.id === selectedMessageId);

  const handleSelectMessage = (msg: UnifiedMessage) => {
    setSelectedMessageId(msg.id);
    if (msg.unread) {
      onUpdateMessage({ ...msg, unread: false });
    }
  };

  const handleToggleImportant = (msg: UnifiedMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateMessage({ ...msg, isImportant: !msg.isImportant });
  };

  const handleToggleFollowUp = (msg: UnifiedMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateMessage({ ...msg, requiresFollowUp: !msg.requiresFollowUp });
  };

  const handleArchive = (msg: UnifiedMessage) => {
    onUpdateMessage({ ...msg, isArchived: true });
    if (selectedMessageId === msg.id) {
      const remaining = filteredMessages.filter((m) => m.id !== msg.id);
      setSelectedMessageId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleSaveEntityAssociation = (association: {
    clientId?: string;
    clientName?: string;
    projectId?: string;
    projectName?: string;
  }) => {
    if (!selectedMessage) return;
    const updatedMessage: UnifiedMessage = {
      ...selectedMessage,
      clientId: association.clientId,
      clientName: association.clientName,
      projectId: association.projectId,
      projectName: association.projectName,
    };
    onUpdateMessage(updatedMessage);

    const linkedItems = [
      association.clientName ? `Client: ${association.clientName}` : null,
      association.projectName ? `Project: ${association.projectName}` : null,
    ].filter(Boolean);

    setTaskCreatedFeedback(
      linkedItems.length > 0
        ? `Message linked to ${linkedItems.join(' & ')}.`
        : 'Entity association removed from message.'
    );
    setTimeout(() => setTaskCreatedFeedback(null), 3500);
  };

  const handleCreateTaskFromAction = (msg: UnifiedMessage) => {
    if (!msg.detectedAction) return;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: msg.detectedAction.suggestedTaskTitle || msg.subject,
      description: `Action detected from ${msg.senderName} (${msg.source}):\n"${msg.detectedAction.request || msg.body}"`,
      clientId: msg.clientId,
      clientName: msg.clientName,
      projectId: msg.projectId,
      projectName: msg.projectName,
      status: 'To Do',
      priority: 'High' as PriorityLevel,
      deadline: msg.detectedAction.deadline || '2026-09-18',
      createdAt: new Date().toISOString().split('T')[0],
      source: msg.source === 'fiverr' ? 'fiverr' : 'email',
      aiSuggested: true,
      tags: ['Client Request', msg.source.toUpperCase()],
    };

    onAddTask(newTask);
    setTaskCreatedFeedback(`Task "${newTask.title}" created successfully.`);
    setTimeout(() => setTaskCreatedFeedback(null), 4000);
  };

  const handleSendDraftReply = () => {
    if (!selectedMessage || !replyText.trim()) return;
    // Update message state
    onUpdateMessage({
      ...selectedMessage,
      replyDraft: replyText,
    });
    setReplyText('');
    setIsReplying(false);
    setTaskCreatedFeedback(`Response sent to ${selectedMessage.senderName}.`);
    setTimeout(() => setTaskCreatedFeedback(null), 4000);
  };

  const generateAiReplySuggestion = () => {
    if (!selectedMessage) return;
    const clientFirstName = selectedMessage.senderName.split(' ')[0] || 'there';
    const draft = `Hi ${clientFirstName},\n\nThank you for reaching out regarding "${selectedMessage.subject}". I have reviewed your request and our team is already scheduling the execution. We are tracking the deliverable for ${
      selectedMessage.detectedAction?.deadline || 'the upcoming milestone'
    }.\n\nPlease let me know if there are any additional specifications you would like incorporated.\n\nBest regards,\nNoor A. | Aura Studio`;
    setReplyText(draft);
    setIsReplying(true);
  };

  const getSourceBadge = (source: MessageSource) => {
    switch (source) {
      case 'fiverr':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'email':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'direct':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
    }
  };

  const unreadCount = messages.filter((m) => m.unread && !m.isArchived).length;
  const actionCount = messages.filter((m) => m.detectedAction && !m.isArchived).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">Unified Inbox</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {unreadCount} Unread
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Aggregated communication across Gmail, Outlook, Fiverr Pro, and direct client inquiries.
          </p>
        </div>

        {/* Global summary badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{actionCount} AI-detected actions pending review</span>
          </div>
        </div>
      </div>

      {taskCreatedFeedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center justify-between animate-fade-in">
          <span>{taskCreatedFeedback}</span>
          <button onClick={() => setTaskCreatedFeedback(null)} className="text-emerald-400">
            ✕
          </button>
        </div>
      )}

      {/* Main Inbox Layout */}
      {messages.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-medium text-neutral-200">No messages yet</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1 mb-6">
            Incoming communication from connected accounts (Gmail, Outlook, Fiverr) will appear here
            automatically with real-time AI action detection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px] rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
          {/* Messages Column (5 cols) */}
          <div className="lg:col-span-5 border-r border-neutral-800 flex flex-col bg-neutral-950/40">
            {/* Toolbar */}
            <div className="p-3 border-b border-neutral-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search communications..."
                  className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      filterMode === 'all'
                        ? 'bg-neutral-800 text-neutral-100 font-medium'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterMode('unread')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      filterMode === 'unread'
                        ? 'bg-neutral-800 text-neutral-100 font-medium'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('actionable')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      filterMode === 'actionable'
                        ? 'bg-neutral-800 text-cyan-400 font-medium'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Actions ({actionCount})
                  </button>
                </div>

                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as any)}
                  className="bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 text-[11px] text-neutral-300 focus:outline-none"
                >
                  <option value="all">All Channels</option>
                  <option value="email">Gmail / Email</option>
                  <option value="fiverr">Fiverr Pro</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60">
              {filteredMessages.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  No matching messages found in this filter.
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isSelected = msg.id === selectedMessageId;

                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleSelectMessage(msg)}
                      className={`p-3.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-950/20 border-l-2 border-cyan-400'
                          : msg.unread
                          ? 'bg-neutral-900/70 hover:bg-neutral-850'
                          : 'hover:bg-neutral-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold tracking-wider ${getSourceBadge(
                              msg.source
                            )}`}
                          >
                            {msg.source}
                          </span>
                          <span
                            className={`text-xs ${
                              msg.unread ? 'font-semibold text-neutral-100' : 'text-neutral-300'
                            }`}
                          >
                            {msg.senderName}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 shrink-0">
                          {msg.timestamp}
                        </span>
                      </div>

                      <h4
                        className={`text-xs mt-1.5 line-clamp-1 ${
                          msg.unread ? 'font-medium text-neutral-100' : 'text-neutral-300'
                        }`}
                      >
                        {msg.subject}
                      </h4>

                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {msg.body}
                      </p>

                      <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-neutral-800/40 text-[10px]">
                        <div className="flex items-center gap-2">
                          {msg.clientName && (
                            <span className="text-neutral-400 truncate max-w-[140px]">
                              {msg.clientName}
                            </span>
                          )}
                          {msg.detectedAction && (
                            <span className="inline-flex items-center gap-1 text-cyan-400 font-medium">
                              <Sparkles className="w-2.5 h-2.5" /> Action Detected
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleToggleFollowUp(msg, e)}
                            title="Flag for follow-up"
                            className={`p-1 rounded hover:bg-neutral-800 transition-colors ${
                              msg.requiresFollowUp ? 'text-amber-400' : 'text-neutral-600'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleToggleImportant(msg, e)}
                            title="Mark Important"
                            className={`p-1 rounded hover:bg-neutral-800 transition-colors ${
                              msg.isImportant ? 'text-amber-400' : 'text-neutral-600'
                            }`}
                          >
                            <Star className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Message Thread & Action Inspection Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-neutral-900/20">
            {selectedMessage ? (
              <div className="flex-1 flex flex-col h-full overflow-y-auto">
                {/* Message Header */}
                <div className="p-5 border-b border-neutral-800 flex items-start justify-between gap-4 bg-neutral-900/60">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${getSourceBadge(
                          selectedMessage.source
                        )}`}
                      >
                        {selectedMessage.source}
                      </span>
                      {selectedMessage.clientName && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 font-medium">
                          <Building className="w-3 h-3 text-cyan-400" />
                          Client: {selectedMessage.clientName}
                        </span>
                      )}
                      {selectedMessage.projectName && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-purple-950/40 text-purple-300 border border-purple-500/30 font-medium">
                          <Briefcase className="w-3 h-3 text-purple-400" />
                          Project: {selectedMessage.projectName}
                        </span>
                      )}
                      <button
                        id="link-entity-btn"
                        onClick={() => setIsLinkModalOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 transition-colors cursor-pointer"
                        title="Associate message with a client or project"
                      >
                        <LinkIcon className="w-3 h-3 text-cyan-400" />
                        <span>
                          {selectedMessage.clientName || selectedMessage.projectName
                            ? 'Edit Entity Link'
                            : 'Link Entity'}
                        </span>
                      </button>
                    </div>
                    <h2 className="text-base font-semibold text-neutral-100">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 pt-0.5">
                      <span className="font-medium text-neutral-200">
                        {selectedMessage.senderName}
                      </span>
                      <span>&lt;{selectedMessage.senderEmail}&gt;</span>
                      <span>•</span>
                      <span>{selectedMessage.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleArchive(selectedMessage)}
                      title="Archive message"
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Unlinked Notice / Quick Link Action */}
                {!selectedMessage.clientName && !selectedMessage.projectName && (
                  <div className="mx-4 mt-3 p-2.5 rounded-xl bg-neutral-900/60 border border-dashed border-neutral-800 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Unlinked Message: Not associated with any client or project.</span>
                    </div>
                    <button
                      onClick={() => setIsLinkModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>Link Entity</span>
                    </button>
                  </div>
                )}

                {/* AI Action Detector Panel (Human-in-the-loop) */}
                {selectedMessage.detectedAction && (
                  <div className="m-4 p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/30 border border-cyan-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>AURA ACTION DETECTION</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        Human Decision Required
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="text-neutral-300">
                        <span className="text-neutral-500 font-medium mr-1.5">Detected Request:</span>
                        {selectedMessage.detectedAction.request}
                      </div>
                      {selectedMessage.detectedAction.deadline && (
                        <div className="text-neutral-300">
                          <span className="text-neutral-500 font-medium mr-1.5">Target Deadline:</span>
                          <span className="text-amber-400 font-medium">
                            {selectedMessage.detectedAction.deadline}
                          </span>
                        </div>
                      )}
                      {selectedMessage.projectName && (
                        <div className="text-neutral-300">
                          <span className="text-neutral-500 font-medium mr-1.5">Mapped Project:</span>
                          <span className="text-neutral-200">{selectedMessage.projectName}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Execution Button */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cyan-500/20">
                      <button
                        onClick={() => handleCreateTaskFromAction(selectedMessage)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Create Workspace Task</span>
                      </button>

                      <button
                        onClick={generateAiReplySuggestion}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Draft AI Reply</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Body Content */}
                <div className="p-6 flex-1 text-neutral-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line space-y-4">
                  {selectedMessage.body}
                </div>

                {/* Reply Section */}
                <div className="p-4 border-t border-neutral-800 bg-neutral-950/60">
                  {isReplying ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-neutral-400">
                        <span>Replying to {selectedMessage.senderName}...</span>
                        <button
                          onClick={() => setIsReplying(false)}
                          className="text-neutral-500 hover:text-neutral-300"
                        >
                          Cancel
                        </button>
                      </div>
                      <textarea
                        rows={5}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type response or review AI draft..."
                        className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-neutral-500">
                          Human Review: Message will only send upon clicking Send Reply.
                        </span>
                        <button
                          onClick={handleSendDraftReply}
                          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Reply</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setIsReplying(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>

                      <button
                        onClick={generateAiReplySuggestion}
                        className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Contextual Draft</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-neutral-500">
                Select a message from the list to view its full conversation and action suggestions.
              </div>
            )}
          </div>
        </div>
      )}
      {/* Reusable Entity Linker Modal */}
      {selectedMessage && (
        <EntityLinkerModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          itemTitle={`${selectedMessage.senderName}: ${selectedMessage.subject}`}
          initialClientId={selectedMessage.clientId}
          initialProjectId={selectedMessage.projectId}
          clients={clients}
          projects={projects}
          onSave={handleSaveEntityAssociation}
        />
      )}
    </div>
  );
};
