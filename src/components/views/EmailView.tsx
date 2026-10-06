import React, { useState } from 'react';
import { UnifiedMessage, Client } from '../../types';
import {
  Mail,
  Send,
  Inbox,
  FileEdit,
  Sparkles,
  Search,
  CheckCircle,
  Plus,
  ArrowRight,
  Clock,
  Trash2,
  Paperclip,
  Check,
  AlertCircle,
  User,
} from 'lucide-react';

interface EmailViewProps {
  messages: UnifiedMessage[];
  clients: Client[];
  onSendMessage: (msg: UnifiedMessage) => void;
}

export const EmailView: React.FC<EmailViewProps> = ({
  messages,
  clients,
  onSendMessage,
}) => {
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<UnifiedMessage | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Compose form state
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<'Professional' | 'Courteous' | 'Urgent' | 'Direct'>('Professional');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [sendSuccessNotice, setSendSuccessNotice] = useState<string | null>(null);

  const emailMessages = messages.filter((m) => m.source === 'email');

  const folderMessages = emailMessages.filter((m) => {
    const matchesFolder =
      activeFolder === 'inbox'
        ? !m.folder || m.folder === 'inbox'
        : m.folder === activeFolder;

    const matchesSearch =
      m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.body.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFolder && matchesSearch;
  });

  const handleGenerateAiDraft = () => {
    if (!aiPrompt.trim() && !subject.trim()) return;
    setIsGeneratingAi(true);

    setTimeout(() => {
      let draftText = '';
      const clientName = recipientName || 'there';

      if (aiPrompt.toLowerCase().includes('invoice') || subject.toLowerCase().includes('invoice')) {
        draftText = `Hi ${clientName},\n\nI hope your week is going well.\n\nThis is a brief follow-up regarding your recent invoice for our active deliverables. Everything on staging has reached the agreed milestone. Could you kindly check with your finance department on the disbursement schedule?\n\nIf you need any updated receipts or paperwork, I am happy to provide them immediately.\n\nWarm regards,\nNoor A.\nAura Studio`;
      } else if (aiPrompt.toLowerCase().includes('milestone') || subject.toLowerCase().includes('update')) {
        draftText = `Hi ${clientName},\n\nI wanted to give you a quick executive update on our project progress.\n\nOur engineering team completed Milestone 2 ahead of schedule, with all automated tests passing cleanly. Staging is currently live for your team's review.\n\nPlease take a look when convenient and share any initial notes.\n\nBest regards,\nNoor A.\nAura Studio`;
      } else {
        draftText = `Hi ${clientName},\n\nFollowing up on our recent discussion regarding "${subject || 'our active collaboration'}".\n\nBased on your specifications, we have calibrated our execution plan to ensure the deliverable is completed with high precision and performance.\n\nPlease review and let me know if you would like to schedule a 10-minute touchpoint this week.\n\nRespectfully,\nNoor A.\nAura Studio`;
      }

      setBody(draftText);
      setIsGeneratingAi(false);
    }, 600);
  };

  const handleSelectClientPreset = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setRecipientName(found.name);
      setRecipientEmail(found.email);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim() || !subject.trim() || !body.trim()) return;

    const newSentMessage: UnifiedMessage = {
      id: `email_${Date.now()}`,
      source: 'email',
      senderName: 'Noor A. (You)',
      senderEmail: 'workingbynoor@gmail.com',
      clientName: recipientName || recipientEmail,
      subject,
      body,
      timestamp: 'Just now',
      unread: false,
      isImportant: false,
      isArchived: false,
      folder: 'sent',
    };

    onSendMessage(newSentMessage);
    setIsComposeOpen(false);
    setRecipientEmail('');
    setRecipientName('');
    setSubject('');
    setBody('');
    setAiPrompt('');
    setSendSuccessNotice(`Email dispatched to ${recipientEmail}.`);
    setTimeout(() => setSendSuccessNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">Email Workspace</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              workingbynoor@gmail.com
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Dedicated Gmail & Google Workspace communication hub with AI draft synthesis.
          </p>
        </div>

        <button
          onClick={() => setIsComposeOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Compose with AI</span>
        </button>
      </div>

      {sendSuccessNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center justify-between">
          <span>{sendSuccessNotice}</span>
          <button onClick={() => setSendSuccessNotice(null)}>✕</button>
        </div>
      )}

      {/* Main Mail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px] rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
        {/* Sidebar Folders & List (5 cols) */}
        <div className="lg:col-span-5 border-r border-neutral-800 flex flex-col bg-neutral-950/40">
          {/* Folders */}
          <div className="p-3 border-b border-neutral-800 flex items-center gap-2">
            <button
              onClick={() => setActiveFolder('inbox')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFolder === 'inbox'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Inbox ({emailMessages.filter((m) => !m.folder || m.folder === 'inbox').length})</span>
            </button>
            <button
              onClick={() => setActiveFolder('sent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFolder === 'sent'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Sent ({emailMessages.filter((m) => m.folder === 'sent').length})</span>
            </button>
            <button
              onClick={() => setActiveFolder('drafts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFolder === 'drafts'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Drafts ({emailMessages.filter((m) => m.folder === 'drafts').length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-neutral-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search email threads..."
                className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500/60"
              />
            </div>
          </div>

          {/* Email Item List */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60">
            {folderMessages.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                No emails in {activeFolder} folder.
              </div>
            ) : (
              folderMessages.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-950/20 border-l-2 border-blue-400'
                        : email.unread
                        ? 'bg-neutral-900/80 font-medium'
                        : 'hover:bg-neutral-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-100">{email.senderName}</span>
                      <span className="text-[10px] text-neutral-500">{email.timestamp}</span>
                    </div>
                    <h4 className="text-xs text-neutral-200 mt-1 line-clamp-1 font-medium">
                      {email.subject}
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {email.body}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Email Reading View (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-neutral-900/20">
          {selectedEmail ? (
            <div className="flex-1 flex flex-col h-full overflow-y-auto">
              <div className="p-5 border-b border-neutral-800 bg-neutral-900/60">
                <h2 className="text-base font-semibold text-neutral-100">
                  {selectedEmail.subject}
                </h2>
                <div className="flex items-center justify-between text-xs text-neutral-400 mt-2">
                  <div>
                    <span className="text-neutral-200 font-medium">
                      {selectedEmail.senderName}
                    </span>{' '}
                    &lt;{selectedEmail.senderEmail}&gt;
                  </div>
                  <span>{selectedEmail.timestamp}</span>
                </div>
              </div>

              <div className="p-6 flex-1 text-neutral-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {selectedEmail.body}
              </div>

              <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  Google Workspace connected via OAuth 2.0 (Read/Send enabled)
                </span>
                <button
                  onClick={() => {
                    setRecipientEmail(selectedEmail.senderEmail);
                    setRecipientName(selectedEmail.senderName);
                    setSubject(`Re: ${selectedEmail.subject}`);
                    setIsComposeOpen(true);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Reply to Thread
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-neutral-500">
              Select an email from the left panel to inspect the thread.
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal with AI Draft Synthesis */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <form
            onSubmit={handleSend}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <h3 className="text-base font-semibold text-neutral-100">Compose Email</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            {/* Client quick select */}
            {clients.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-neutral-500 shrink-0">Quick Fill Client:</span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectClientPreset(c.id)}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] whitespace-nowrap transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recipients */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">To Email *</label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-neutral-400 mb-1">Subject Line *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Milestone 2 Verification & Production Staging Review"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* AI Assistant Drawer */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/30 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>AURA DRAFT ASSISTANT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-400 text-[11px]">Tone:</span>
                  {(['Professional', 'Courteous', 'Direct', 'Urgent'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAiTone(t)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        aiTone === t
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="What would you like to communicate? (e.g. Ask for payment on invoice #002, or send milestone 2 update)"
                  className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleGenerateAiDraft}
                  disabled={isGeneratingAi}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingAi ? 'Drafting...' : 'Generate'}</span>
                </button>
              </div>
            </div>

            {/* Email Body */}
            <div className="text-xs">
              <label className="block text-neutral-400 mb-1">Message Content *</label>
              <textarea
                rows={8}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email here..."
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Human in the loop footer */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <div className="text-[11px] text-neutral-500">
                Governance: Human review required before transmission.
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-neutral-200 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
