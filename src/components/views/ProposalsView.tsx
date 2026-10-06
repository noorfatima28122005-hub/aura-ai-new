import React, { useState } from 'react';
import { Proposal, ProposalStatus, Client, Service, ProposalItem } from '../../types';
import {
  FileSpreadsheet,
  Plus,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle2,
  Send,
  Eye,
  FileCheck,
  Building,
  User,
  ArrowRight,
  Download,
  Trash2,
} from 'lucide-react';

interface ProposalsViewProps {
  proposals: Proposal[];
  clients: Client[];
  services: Service[];
  onAddProposal: (proposal: Proposal) => void;
  onUpdateProposal: (proposal: Proposal) => void;
  onDeleteProposal: (id: string) => void;
}

export const ProposalsView: React.FC<ProposalsViewProps> = ({
  proposals,
  clients,
  services,
  onAddProposal,
  onUpdateProposal,
  onDeleteProposal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [pricing, setPricing] = useState('7500');
  const [timeline, setTimeline] = useState('4 Weeks');
  const [scope, setScope] = useState('');
  const [terms, setTerms] = useState(
    '50% upfront deposit upon contract signing. 25% upon staging milestone approval, and 25% upon final production delivery.'
  );
  const [validUntil, setValidUntil] = useState('2026-10-15');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const statuses: ProposalStatus[] = ['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired'];

  const filteredProposals = proposals.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.scope.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAcceptedValue = proposals
    .filter((p) => p.status === 'Accepted')
    .reduce((s, p) => s + (p.pricing || 0), 0);

  const totalPipelineValue = proposals
    .filter((p) => p.status === 'Sent' || p.status === 'Viewed' || p.status === 'Draft')
    .reduce((s, p) => s + (p.pricing || 0), 0);

  const handleAiGenerateProposal = () => {
    if (!aiPrompt.trim() && !title.trim()) return;
    setIsAiGenerating(true);

    setTimeout(() => {
      const generatedTitle = title || 'Enterprise Workflow Automation Architecture';
      const generatedScope = `1. Core Systems Audit & Requirement Architecture\n2. Design System and React Frontend Platform\n3. Gemini AI / LLM Orchestration & Webhooks\n4. Cloud Infrastructure CI/CD & Automated Backups\n5. Quality Assurance, Security Audit & User Documentation`;
      const generatedTerms = `50% deposit before kickoff. 25% on beta staging delivery. 25% upon final production cutover. All intellectual property transfers to client upon final disbursement.`;

      setTitle(generatedTitle);
      setScope(generatedScope);
      setTerms(generatedTerms);
      setPricing('9500');
      setTimeline('4-6 Weeks');
      setIsAiGenerating(false);
    }, 700);
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === selectedClientId);

    const newProposal: Proposal = {
      id: `prop_${Date.now()}`,
      title: title.trim(),
      clientId: selectedClientId || 'client_direct',
      clientName: client ? client.name : 'Prospective Client',
      clientEmail: client ? client.email : undefined,
      pricing: parseFloat(pricing) || 0,
      timeline: timeline.trim(),
      scope: scope.trim(),
      terms: terms.trim(),
      status: 'Draft',
      validUntil,
      createdAt: new Date().toISOString().split('T')[0],
      isAiGenerated: isAiGenerating,
      services: [
        {
          title: 'Primary Deliverables Scope',
          description: scope.trim().slice(0, 120),
          price: parseFloat(pricing) || 0,
        },
      ],
    };

    onAddProposal(newProposal);
    setIsCreateModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setSelectedClientId('');
    setPricing('7500');
    setTimeline('4 Weeks');
    setScope('');
    setTerms(
      '50% upfront deposit upon contract signing. 25% upon staging milestone approval, and 25% upon final production delivery.'
    );
    setValidUntil('2026-10-15');
    setAiPrompt('');
  };

  const handleStatusChange = (proposal: Proposal, newStatus: ProposalStatus) => {
    const updated = { ...proposal, status: newStatus };
    onUpdateProposal(updated);
    if (selectedProposal && selectedProposal.id === proposal.id) {
      setSelectedProposal(updated);
    }
  };

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case 'Accepted':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'Sent':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'Viewed':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30';
      case 'Draft':
        return 'bg-neutral-800 text-neutral-300 border border-neutral-700';
      case 'Rejected':
        return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'Expired':
        return 'bg-neutral-800 text-neutral-500 border border-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
              Proposals & SOWs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {proposals.length} Total
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Generate high-converting statements of work, deliverable scopes, and pricing schedules.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Proposal</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>PIPELINE PROPOSAL VALUE</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-semibold text-neutral-100 mt-2">
            ${totalPipelineValue.toLocaleString()}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Across draft & dispatched proposals</p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>ACCEPTED REVENUE</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-semibold text-emerald-400 mt-2">
            ${totalAcceptedValue.toLocaleString()}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {proposals.filter((p) => p.status === 'Accepted').length} proposals approved by clients
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>WIN CONVERSION RATE</span>
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-semibold text-cyan-400 mt-2">
            {proposals.length > 0
              ? `${Math.round(
                  (proposals.filter((p) => p.status === 'Accepted').length / proposals.length) * 100
                )}%`
              : '0%'}
          </p>
          <p className="text-xs text-neutral-500 mt-1">From proposal delivery to accepted SOW</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search proposals by title or client..."
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500/60"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
        >
          <option value="all">All Stages</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Proposals Grid */}
      {proposals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-medium text-neutral-200">No proposals yet</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1 mb-6">
            Generate polished, structured proposals and contracts from scratch or with AURA AI
            assistance.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Draft First Proposal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProposals.map((proposal) => (
            <div
              key={proposal.id}
              onClick={() => setSelectedProposal(proposal)}
              className="group p-5 rounded-xl bg-neutral-900/70 border border-neutral-800 hover:border-purple-500/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusBadge(
                      proposal.status
                    )}`}
                  >
                    {proposal.status}
                  </span>
                  {proposal.isAiGenerated && (
                    <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-medium">
                      <Sparkles className="w-3 h-3" /> AI Drafted
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-neutral-100 group-hover:text-purple-400 transition-colors mt-3 line-clamp-2">
                  {proposal.title}
                </h3>

                <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                  <Building className="w-3 h-3 text-neutral-500" />
                  <span>{proposal.clientName}</span>
                </p>

                <p className="text-xs text-neutral-500 mt-3 line-clamp-3 leading-relaxed">
                  {proposal.scope}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-500 block text-[10px]">TOTAL VALUE</span>
                  <span className="font-semibold text-neutral-100">
                    ${proposal.pricing?.toLocaleString()}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-neutral-500 block text-[10px]">TIMELINE</span>
                  <span className="text-neutral-300 font-medium">{proposal.timeline}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proposal Detail View Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-neutral-100">
                    {selectedProposal.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(
                      selectedProposal.status
                    )}`}
                  >
                    {selectedProposal.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Prepared for: <span className="text-neutral-200">{selectedProposal.clientName}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            {/* Quick status bar */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-neutral-950/60 rounded-xl border border-neutral-800">
              <span className="text-xs text-neutral-400 font-medium mr-1">Update Status:</span>
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(selectedProposal, s)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                    selectedProposal.status === s
                      ? 'bg-purple-600 text-white'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Proposal Key Specs */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-neutral-950/50 border border-neutral-800">
                <span className="text-neutral-500">Proposed Pricing</span>
                <p className="text-base font-semibold text-neutral-100 mt-0.5">
                  ${selectedProposal.pricing?.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950/50 border border-neutral-800">
                <span className="text-neutral-500">Estimated Timeline</span>
                <p className="text-base font-semibold text-neutral-100 mt-0.5">
                  {selectedProposal.timeline}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950/50 border border-neutral-800">
                <span className="text-neutral-500">Valid Until</span>
                <p className="text-base font-semibold text-neutral-100 mt-0.5">
                  {selectedProposal.validUntil}
                </p>
              </div>
            </div>

            {/* Scope of Work */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Scope of Work & Deliverables
              </h4>
              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-200 leading-relaxed whitespace-pre-line font-mono">
                {selectedProposal.scope}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Payment Terms & Milestones
              </h4>
              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300 leading-relaxed">
                {selectedProposal.terms}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <button
                onClick={() => {
                  onDeleteProposal(selectedProposal.id);
                  setSelectedProposal(null);
                }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Delete Proposal
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleStatusChange(selectedProposal, 'Sent');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Mark as Sent to Client</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Proposal Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <form
            onSubmit={handleCreateProposal}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-semibold text-neutral-100">Create New Proposal</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            {/* AI Assistant Quick Draft */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-purple-300 font-semibold">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>AURA PROPOSAL DRAFTER</span>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Next.js SaaS MVP with Stripe billing and Gemini AI summaries"
                  className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAiGenerateProposal}
                  disabled={isAiGenerating}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiGenerating ? 'Drafting...' : 'Auto-Fill'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Proposal Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Enterprise Workflow Automation Suite"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Client *</label>
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Total Pricing ($)</label>
                  <input
                    type="number"
                    value={pricing}
                    onChange={(e) => setPricing(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Timeline</label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g. 4 Weeks"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Scope of Work & Deliverables *</label>
                <textarea
                  rows={4}
                  required
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  placeholder="Detail milestones, features, deliverables, and integration specifications..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-purple-500 leading-relaxed font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Payment Terms & Milestones</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Deposit requirements, invoice schedule, deliverable sign-offs..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-neutral-400 hover:text-neutral-200 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Save Proposal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
