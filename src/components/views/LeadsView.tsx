import React, { useState } from 'react';
import { Lead, LeadStatus, PriorityLevel, Client } from '../../types';
import {
  Target,
  Plus,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  ChevronRight,
  MoreHorizontal,
  FileText,
  UserCheck,
} from 'lucide-react';

interface LeadsViewProps {
  leads: Lead[];
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onConvertToClient: (lead: Lead) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  onConvertToClient,
}) => {
  const [activeView, setActiveView] = useState<'pipeline' | 'list'>('pipeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('Direct');
  const [potentialValue, setPotentialValue] = useState('5000');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [notes, setNotes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');

  const statuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPipelineValue = leads
    .filter((l) => l.status !== 'Lost' && l.status !== 'Won')
    .reduce((sum, l) => sum + (l.potentialValue || 0), 0);

  const wonValue = leads
    .filter((l) => l.status === 'Won')
    .reduce((sum, l) => sum + (l.potentialValue || 0), 0);

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newLead: Lead = {
      id: `lead_${Date.now()}`,
      name: name.trim(),
      company: company.trim() || 'Independent',
      email: email.trim(),
      phone: phone.trim() || undefined,
      source: source.trim() || 'Direct',
      potentialValue: parseFloat(potentialValue) || 0,
      status,
      priority,
      notes: notes.trim() || undefined,
      nextFollowUp: nextFollowUp.trim() || undefined,
      lastContact: 'Just now',
      createdAt: new Date().toISOString().split('T')[0],
      assignedTo: 'Lead Executive',
      activityTimeline: [
        {
          id: `la_${Date.now()}`,
          timestamp: new Date().toISOString().split('T')[0],
          action: 'Lead recorded in CRM pipeline',
        },
      ],
    };

    onAddLead(newLead);
    setIsCreateModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setSource('Direct');
    setPotentialValue('5000');
    setPriority('Medium');
    setStatus('New');
    setNotes('');
    setNextFollowUp('');
  };

  const handleStatusChange = (lead: Lead, newStatus: LeadStatus) => {
    const updated = {
      ...lead,
      status: newStatus,
      activityTimeline: [
        ...(lead.activityTimeline || []),
        {
          id: `la_${Date.now()}`,
          timestamp: new Date().toISOString().split('T')[0],
          action: `Status transitioned to ${newStatus}`,
        },
      ],
    };
    onUpdateLead(updated);
    if (selectedLead && selectedLead.id === lead.id) {
      setSelectedLead(updated);
    }
  };

  const getPriorityBadge = (p: PriorityLevel) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'High':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'Medium':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'Low':
        return 'bg-neutral-800 text-neutral-400 border border-neutral-700';
    }
  };

  const getStatusBadge = (s: LeadStatus) => {
    switch (s) {
      case 'New':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30';
      case 'Contacted':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'Qualified':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30';
      case 'Proposal':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      case 'Won':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'Lost':
        return 'bg-neutral-800 text-neutral-400 border border-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">Leads & CRM</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {leads.length} Opportunities
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Track potential client relationships, pipeline velocity, and conversion handoffs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setActiveView('pipeline')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeView === 'pipeline'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeView === 'list'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              List View
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-medium rounded-lg shadow-sm shadow-cyan-900/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>ACTIVE PIPELINE</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-semibold text-neutral-100 mt-2">
            ${totalPipelineValue.toLocaleString()}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {leads.filter((l) => l.status !== 'Lost' && l.status !== 'Won').length} qualified deals in progress
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>CONVERTED (WON)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-semibold text-emerald-400 mt-2">
            ${wonValue.toLocaleString()}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {leads.filter((l) => l.status === 'Won').length} deals closed & transitioned
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>ACTION REQUIRED</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-semibold text-neutral-100 mt-2">
            {leads.filter((l) => l.nextFollowUp && l.status !== 'Won' && l.status !== 'Lost').length}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Scheduled follow-up commitments</p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>AVERAGE DEAL SIZE</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-semibold text-neutral-100 mt-2">
            $
            {leads.length > 0
              ? Math.round(
                  leads.reduce((s, l) => s + (l.potentialValue || 0), 0) / leads.length
                ).toLocaleString()
              : '0'}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Across all qualified opportunities</p>
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
            placeholder="Search leads by name, company, email..."
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-cyan-500/60"
          >
            <option value="all">All Stages</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-cyan-500/60"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {leads.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-medium text-neutral-200">No leads yet</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1 mb-6">
            Track inquiries, qualify prospective engagements, and monitor contract pipelines in one
            central place.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Lead</span>
          </button>
        </div>
      ) : activeView === 'pipeline' ? (
        /* Kanban Pipeline View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
          {statuses.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage);
            const stageTotal = stageLeads.reduce((acc, curr) => acc + (curr.potentialValue || 0), 0);

            return (
              <div
                key={stage}
                className="flex flex-col bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-3 min-w-[210px]"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-neutral-200">{stage}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                      {stageLeads.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    ${(stageTotal / 1000).toFixed(0)}k
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 min-h-[160px]">
                  {stageLeads.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-4 text-center text-xs text-neutral-600 border border-dashed border-neutral-800/50 rounded-lg">
                      Empty stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="group p-3 rounded-lg bg-neutral-900 border border-neutral-800/90 hover:border-cyan-500/50 hover:bg-neutral-850 transition-all cursor-pointer shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold text-neutral-100 group-hover:text-cyan-400 transition-colors line-clamp-1">
                            {lead.name}
                          </h4>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-medium ${getPriorityBadge(
                              lead.priority
                            )}`}
                          >
                            {lead.priority}
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                          {lead.company}
                        </p>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-800/60 text-[11px]">
                          <span className="font-semibold text-neutral-200">
                            ${lead.potentialValue?.toLocaleString()}
                          </span>
                          <span className="text-neutral-500 text-[10px]">{lead.source}</span>
                        </div>

                        {lead.nextFollowUp && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-400/90">
                            <Clock className="w-3 h-3" />
                            <span className="truncate">{lead.nextFollowUp}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/80 text-neutral-400 font-medium border-b border-neutral-800">
              <tr>
                <th className="px-4 py-3">Lead / Contact</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Est. Value</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Next Step</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/70 text-neutral-300">
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="hover:bg-neutral-850/60 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-neutral-100">
                    <div>{lead.name}</div>
                    <div className="text-[11px] text-neutral-500 font-normal">{lead.email}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">{lead.company}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusBadge(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getPriorityBadge(
                        lead.priority
                      )}`}
                    >
                      {lead.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-200">
                    ${lead.potentialValue?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{lead.source}</td>
                  <td className="px-4 py-3 text-neutral-400">
                    {lead.nextFollowUp || <span className="text-neutral-600">None</span>}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Detail Drawer / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-neutral-100">{selectedLead.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(
                      selectedLead.status
                    )}`}
                  >
                    {selectedLead.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">{selectedLead.company}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-neutral-950/60 rounded-xl border border-neutral-800">
              <span className="text-xs text-neutral-400 font-medium mr-1">Move stage:</span>
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(selectedLead, s)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                    selectedLead.status === s
                      ? 'bg-cyan-600 text-white'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Opportunity Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-neutral-950/40 border border-neutral-800/80">
                <span className="text-neutral-500">Estimated Value</span>
                <p className="text-base font-semibold text-neutral-100 mt-0.5">
                  ${selectedLead.potentialValue?.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950/40 border border-neutral-800/80">
                <span className="text-neutral-500">Priority Level</span>
                <p className="text-base font-semibold text-neutral-100 mt-0.5">
                  {selectedLead.priority}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950/40 border border-neutral-800/80">
                <span className="text-neutral-500">Contact Email</span>
                <p className="text-xs font-medium text-neutral-200 mt-0.5 truncate">
                  {selectedLead.email}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950/40 border border-neutral-800/80">
                <span className="text-neutral-500">Source</span>
                <p className="text-xs font-medium text-neutral-200 mt-0.5">
                  {selectedLead.source}
                </p>
              </div>
            </div>

            {/* Notes & Follow-up */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Notes & Intelligence
              </h4>
              <p className="text-xs text-neutral-300 p-3 rounded-lg bg-neutral-950/50 border border-neutral-800 leading-relaxed">
                {selectedLead.notes || 'No specific notes recorded yet.'}
              </p>
              {selectedLead.nextFollowUp && (
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Next planned follow-up: {selectedLead.nextFollowUp}</span>
                </div>
              )}
            </div>

            {/* Timeline */}
            {selectedLead.activityTimeline && selectedLead.activityTimeline.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Activity Timeline
                </h4>
                <div className="space-y-2">
                  {selectedLead.activityTimeline.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs p-2 rounded bg-neutral-950/40 border border-neutral-800/60"
                    >
                      <span className="text-neutral-300">{item.action}</span>
                      <span className="text-[10px] text-neutral-500">{item.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <button
                onClick={() => {
                  onDeleteLead(selectedLead.id);
                  setSelectedLead(null);
                }}
                className="text-xs text-red-400 hover:text-red-300 hover:underline cursor-pointer"
              >
                Delete Opportunity
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    onConvertToClient(selectedLead);
                    setSelectedLead(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Convert to Active Client</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form
            onSubmit={handleCreateLead}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-semibold text-neutral-100">Add New Lead</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@acme.com"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Lead Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Direct">Direct Inbound</option>
                  <option value="Referral">Referral</option>
                  <option value="Fiverr">Fiverr Pro</option>
                  <option value="Email Inquiry">Email Inquiry</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Potential Value ($)</label>
                <input
                  type="number"
                  value={potentialValue}
                  onChange={(e) => setPotentialValue(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Initial Stage</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-neutral-400 mb-1">Next Follow-Up Note / Target Date</label>
              <input
                type="text"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                placeholder="e.g. Tomorrow at 10:00 AM"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="text-xs">
              <label className="block text-neutral-400 mb-1">Requirement Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key deliverables discussed, tech preferences, budget considerations..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
              />
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
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Create Lead
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
