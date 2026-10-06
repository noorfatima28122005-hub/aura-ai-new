import React, { useState } from 'react';
import { Contract, ContractStatus, Client, Project } from '../../types';
import {
  FileCheck2,
  Plus,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Download,
  Trash2,
} from 'lucide-react';

interface ContractsViewProps {
  contracts: Contract[];
  clients: Client[];
  projects: Project[];
  onAddContract: (contract: Contract) => void;
  onUpdateContract: (contract: Contract) => void;
  onDeleteContract: (id: string) => void;
}

export const ContractsView: React.FC<ContractsViewProps> = ({
  contracts,
  clients,
  projects,
  onAddContract,
  onUpdateContract,
  onDeleteContract,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [clauseModalOpen, setClauseModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [scope, setScope] = useState('');
  const [paymentTerms, setPaymentTerms] = useState(
    'Net 15 days upon milestone submission and sign-off.'
  );
  const [milestones, setMilestones] = useState(
    'Phase 1: Architecture Signoff | Phase 2: Beta Staging | Phase 3: Production Release'
  );
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('2026-11-30');
  const [totalValue, setTotalValue] = useState('10000');
  const [status, setStatus] = useState<ContractStatus>('Active');

  const statuses: ContractStatus[] = ['Active', 'Draft', 'Expiring', 'Expired', 'Cancelled'];

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.projectName && c.projectName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeContractValue = contracts
    .filter((c) => c.status === 'Active')
    .reduce((s, c) => s + (c.totalValue || 0), 0);

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === selectedClientId);
    const project = projects.find((p) => p.id === selectedProjectId);

    const newContract: Contract = {
      id: `cnt_${Date.now()}`,
      title: title.trim(),
      clientId: selectedClientId || 'client_direct',
      clientName: client ? client.name : 'Direct Client',
      projectId: project ? project.id : undefined,
      projectName: project ? project.name : undefined,
      scope: scope.trim(),
      paymentTerms: paymentTerms.trim(),
      milestones: milestones.trim(),
      startDate,
      endDate,
      status,
      totalValue: parseFloat(totalValue) || 0,
      createdAt: new Date().toISOString().split('T')[0],
      signedDate: status === 'Active' ? new Date().toISOString().split('T')[0] : undefined,
    };

    onAddContract(newContract);
    setIsCreateModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setSelectedClientId('');
    setSelectedProjectId('');
    setScope('');
    setPaymentTerms('Net 15 days upon milestone submission and sign-off.');
    setMilestones(
      'Phase 1: Architecture Signoff | Phase 2: Beta Staging | Phase 3: Production Release'
    );
    setTotalValue('10000');
    setStatus('Active');
  };

  const handleInsertStandardClause = (clauseType: string) => {
    let text = '';
    if (clauseType === 'ip') {
      text = `\n[Intellectual Property Transfer]\nAll code, designs, and deliverables created hereunder shall become the exclusive property of the Client upon receipt of final settlement payment. Prior to final payment, Provider retains limited licensing rights.`;
    } else if (clauseType === 'nda') {
      text = `\n[Confidentiality & Non-Disclosure]\nBoth parties agree to hold all proprietary trade secrets, user data, and system architectures in strict confidence for a period of no less than 3 years following contract completion.`;
    } else if (clauseType === 'liability') {
      text = `\n[Limitation of Liability]\nIn no event shall Provider be liable for any indirect, incidental, or consequential damages. Maximum aggregate liability shall not exceed the total fees paid under this Agreement.`;
    }
    setScope((prev) => prev + text);
  };

  const getStatusBadge = (s: ContractStatus) => {
    switch (s) {
      case 'Active':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'Draft':
        return 'bg-neutral-800 text-neutral-300 border border-neutral-700';
      case 'Expiring':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'Expired':
        return 'bg-neutral-800 text-neutral-500 border border-neutral-700';
      case 'Cancelled':
        return 'bg-red-500/10 text-red-400 border border-red-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
              Contracts & MSAs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {contracts.filter((c) => c.status === 'Active').length} Active
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Master service agreements, statements of work, and milestone disbursement covenants.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Contract</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>ACTIVE CONTRACT VALUE</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-semibold text-emerald-400 mt-2">
            ${activeContractValue.toLocaleString()}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Legally binding active client agreements</p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>ACTIVE AGREEMENTS</span>
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-semibold text-neutral-100 mt-2">
            {contracts.filter((c) => c.status === 'Active').length}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Across corporate & retainer clients</p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>AVERAGE TERM LENGTH</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-semibold text-neutral-100 mt-2">90 Days</p>
          <p className="text-xs text-neutral-500 mt-1">Quarterly milestone covenants</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contracts..."
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
        >
          <option value="all">All Contract Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-medium text-neutral-200">No contracts yet</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1 mb-6">
            Register and monitor active contracts, milestone schedules, and legal scopes.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Contract</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredContracts.map((contract) => (
            <div
              key={contract.id}
              onClick={() => setSelectedContract(contract)}
              className="p-5 rounded-xl bg-neutral-900/70 border border-neutral-800 hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusBadge(
                      contract.status
                    )}`}
                  >
                    {contract.status}
                  </span>
                  <span className="font-mono text-xs font-semibold text-emerald-400">
                    ${contract.totalValue?.toLocaleString()}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-neutral-100 mt-3 line-clamp-1">
                  {contract.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                  <Building className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{contract.clientName}</span>
                  {contract.projectName && (
                    <>
                      <span>•</span>
                      <Briefcase className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="truncate">{contract.projectName}</span>
                    </>
                  )}
                </div>

                <p className="text-xs text-neutral-500 mt-3 line-clamp-2 leading-relaxed">
                  {contract.scope}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <span>
                    {contract.startDate} → {contract.endDate}
                  </span>
                </div>
                {contract.signedDate && (
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Signed: {contract.signedDate}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-neutral-100">
                    {selectedContract.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(
                      selectedContract.status
                    )}`}
                  >
                    {selectedContract.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Parties: Noor A. (Provider) &amp;{' '}
                  <span className="text-neutral-200">{selectedContract.clientName}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            {/* Spec breakdown */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-neutral-950/50 border border-neutral-800">
                <span className="text-neutral-500">Contract Total</span>
                <p className="text-base font-semibold text-emerald-400 mt-0.5">
                  ${selectedContract.totalValue?.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950/50 border border-neutral-800">
                <span className="text-neutral-500">Duration</span>
                <p className="text-xs font-medium text-neutral-200 mt-1">
                  {selectedContract.startDate} → {selectedContract.endDate}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950/50 border border-neutral-800">
                <span className="text-neutral-500">Signed Date</span>
                <p className="text-xs font-medium text-neutral-200 mt-1">
                  {selectedContract.signedDate || 'Pending Signatures'}
                </p>
              </div>
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Statement of Work & Scope
              </h4>
              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-200 leading-relaxed whitespace-pre-line font-mono">
                {selectedContract.scope}
              </div>
            </div>

            {/* Milestones */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Milestone Schedule
              </h4>
              <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300">
                {selectedContract.milestones}
              </div>
            </div>

            {/* Payment terms */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Disbursement & Payment Terms
              </h4>
              <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300">
                {selectedContract.paymentTerms}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <button
                onClick={() => {
                  onDeleteContract(selectedContract.id);
                  setSelectedContract(null);
                }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Delete Contract
              </button>

              <button
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Contract Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <form
            onSubmit={handleCreateContract}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-semibold text-neutral-100">Create Contract Agreement</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Contract Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Services Agreement (MSA) - Enterprise AI Architecture"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Client *</label>
                  <select
                    required
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Project Link (Optional)</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">None / Retainer</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Total Value ($)</label>
                  <input
                    type="number"
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-400">Scope of Agreement *</label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-neutral-500">Insert Standard Clause:</span>
                    <button
                      type="button"
                      onClick={() => handleInsertStandardClause('ip')}
                      className="text-emerald-400 hover:underline cursor-pointer"
                    >
                      +IP Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertStandardClause('nda')}
                      className="text-emerald-400 hover:underline cursor-pointer"
                    >
                      +NDA
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  required
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  placeholder="Detail work scope, deliverables, intellectual property covenants..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Milestone Tranches</label>
                <input
                  type="text"
                  value={milestones}
                  onChange={(e) => setMilestones(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Payment & Invoice Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
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
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Create Contract
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
