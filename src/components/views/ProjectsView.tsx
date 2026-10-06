import React, { useState } from 'react';
import { Project, Client, Task, Invoice, PriorityLevel, ProjectStatus } from '../../types';
import { ProjectTimelineVisualization } from '../projects/ProjectTimelineVisualization';
import { ProjectGanttChart } from '../projects/ProjectGanttChart';
import {
  Briefcase,
  Plus,
  Search,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Filter,
  Loader2,
  X,
  AlertCircle,
  Layers,
  BarChart3,
  GitBranch,
  TrendingUp,
} from 'lucide-react';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  tasks?: Task[];
  invoices?: Invoice[];
  initialRiskFilter?: boolean;
  onClearRiskFilter?: () => void;
  onAddProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void> | void;
  onEditProject: (project: Project) => Promise<void> | void;
  onDeleteProject: (projectId: string) => Promise<void> | void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  clients,
  tasks = [],
  invoices = [],
  initialRiskFilter = false,
  onClearRiskFilter,
  onAddProject,
  onEditProject,
  onDeleteProject,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialRiskFilter ? 'High Risk' : 'All');
  const [showTimeline, setShowTimeline] = useState(true);
  const [timelineMode, setTimelineMode] = useState<'gantt' | 'milestones'>('gantt');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  React.useEffect(() => {
    if (initialRiskFilter) {
      setStatusFilter('High Risk');
    }
  }, [initialRiskFilter]);

  // Deletion state
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('In Progress');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [progress, setProgress] = useState(30);
  const [deadline, setDeadline] = useState('2026-09-30');
  const [budget, setBudget] = useState(5000);
  const [notes, setNotes] = useState('');

  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeClients = Array.isArray(clients) ? clients : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  // Budget vs Actual Cost Tracker calculation
  const getProjectCostMetrics = (prj: Project) => {
    if (!prj) {
      return {
        actualCost: 0,
        budget: 0,
        utilizationPct: 0,
        isBudgetWarning: false,
        costSource: 'None',
        invoicedTotal: 0,
        laborCost: 0,
      };
    }

    // 1. Invoiced amount
    const projectInvoices = safeInvoices.filter(
      (inv) =>
        inv &&
        (inv.projectId === prj.id ||
          (inv.clientName === prj.clientName && prj.name && inv.notes?.toLowerCase().includes(prj.name.toLowerCase())))
    );
    const invoicedTotal = projectInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

    // 2. Logged hours labor cost
    const projectTasks = safeTasks.filter((t) => t && t.projectId === prj.id);
    const tasksLoggedHours = projectTasks.reduce((sum, t) => sum + (Number(t.actualHours) || 0), 0);
    const effectiveLoggedHours = Math.max(Number(prj.totalLoggedHours) || 0, tasksLoggedHours);
    const hourlyRate = Number(prj.hourlyRate) || 85;
    const laborCost = Number(prj.laborCost) || effectiveLoggedHours * hourlyRate;
    const expenses = Number(prj.expenses) || 0;

    // Actual cost based on invoiced amounts or logged hours
    let actualCost = invoicedTotal > 0 ? invoicedTotal + expenses : laborCost + expenses;
    let costSource =
      invoicedTotal > 0
        ? `Invoiced: $${invoicedTotal.toLocaleString()}`
        : effectiveLoggedHours > 0
        ? `${effectiveLoggedHours}h logged @ $${hourlyRate}/h`
        : 'Scope labor';

    if (actualCost === 0 && (prj.progress || 0) > 0 && prj.budget > 0) {
      actualCost = Math.round((prj.budget * (prj.progress || 0)) / 100);
      costSource = `${prj.progress}% scope delivered`;
    }

    const budget = Number(prj.budget) || 0;
    const utilizationPct = budget > 0 ? Math.round((actualCost / budget) * 100) : 0;
    const isBudgetWarning = utilizationPct >= 90;

    return {
      actualCost,
      budget,
      utilizationPct,
      isBudgetWarning,
      costSource,
      invoicedTotal,
      laborCost,
    };
  };

  const isProjectHighRisk = (p: Project) => {
    if (!p) return false;
    if (p.status === 'Completed') return false;
    if (p.health === 'At Risk' || p.health === 'Critical') return true;
    if (p.aiRiskAssessment?.level === 'high' || p.aiRiskAssessment?.level === 'moderate') return true;
    if (p.priority === 'Urgent') return true;
    if (p.deadline) {
      const d = new Date(p.deadline);
      const now = new Date();
      const daysLeft = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysLeft <= 7 && (p.progress || 0) < 70) return true;
    }
    return false;
  };

  // Milestone & Deadline Health Status for Project Pipeline Cards
  const getProjectDeliveryStatus = (prj: Project) => {
    if (prj.status === 'Completed' || prj.progress === 100) {
      return {
        label: 'Completed' as const,
        badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40',
        Icon: CheckCircle,
        reason: 'All project deliverables signed off',
      };
    }

    const now = Date.now();
    const deadlineTime = prj.deadline ? new Date(prj.deadline).getTime() : 0;
    const isPastDeadline = deadlineTime > 0 && deadlineTime < now;

    // Check overdue milestones
    const overdueMilestones = (prj.milestones || []).filter(
      (m) => !m.completed && m.deadline && new Date(m.deadline).getTime() < now
    );

    // Days until deadline
    const daysLeft = deadlineTime > 0 ? Math.ceil((deadlineTime - now) / 86400000) : 999;

    if (isPastDeadline) {
      return {
        label: 'Delayed' as const,
        badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-950/40',
        Icon: AlertTriangle,
        reason: `Past contractual deadline (${Math.abs(daysLeft)}d overdue)`,
      };
    }

    if (
      overdueMilestones.length > 0 ||
      prj.health === 'Critical' ||
      prj.health === 'At Risk' ||
      prj.aiRiskAssessment?.level === 'high' ||
      (daysLeft <= 5 && prj.progress < 70)
    ) {
      const reason =
        overdueMilestones.length > 0
          ? `${overdueMilestones.length} milestone past due`
          : daysLeft <= 5 && prj.progress < 70
          ? `${daysLeft}d left with only ${prj.progress}% progress`
          : prj.aiRiskAssessment?.explanation || 'Delivery timeline is at risk';

      return {
        label: 'At Risk' as const,
        badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-950/40',
        Icon: AlertTriangle,
        reason,
      };
    }

    return {
      label: 'On Track' as const,
      badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40',
      Icon: CheckCircle,
      reason: `${daysLeft < 900 ? `${daysLeft}d remaining` : 'On schedule'} · Velocity aligned`,
    };
  };

  const highRiskCount = safeProjects.filter(
    (p) => isProjectHighRisk(p) || getProjectDeliveryStatus(p).label === 'At Risk'
  ).length;

  const budgetWarningCount = safeProjects.filter(
    (p) => getProjectCostMetrics(p).isBudgetWarning
  ).length;

  const filteredProjects = safeProjects.filter((p) => {
    if (!p) return false;
    const matchesSearch =
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.clientName || '').toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'All') return true;

    if (statusFilter === 'Budget Warning') {
      return getProjectCostMetrics(p).isBudgetWarning;
    }

    const delivery = getProjectDeliveryStatus(p);

    if (statusFilter === 'High Risk' || statusFilter === 'At Risk') {
      return delivery.label === 'At Risk' || isProjectHighRisk(p);
    }
    if (statusFilter === 'On Track') {
      return delivery.label === 'On Track';
    }
    if (statusFilter === 'Delayed') {
      return delivery.label === 'Delayed';
    }
    if (statusFilter === 'Completed') {
      return delivery.label === 'Completed' || p.status === 'Completed' || p.progress === 100;
    }

    return p.status === statusFilter;
  });

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormError(null);
    setName('');
    setClientId(safeClients[0]?.id || '');
    setDescription('');
    setStatus('In Progress');
    setPriority('High');
    setProgress(0);
    setDeadline(new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0]);
    setBudget(5000);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setEditingProject(p);
    setFormError(null);
    setName(p.name);
    setClientId(p.clientId);
    setDescription(p.description);
    setStatus(p.status);
    setPriority(p.priority);
    setProgress(p.progress);
    setDeadline(p.deadline);
    setBudget(p.budget);
    setNotes(p.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Project title is required.');
      return;
    }
    if (!deadline) {
      setFormError('Please select a target deadline.');
      return;
    }

    const client = clients.find((c) => c.id === clientId);
    const clientName = client ? client.name : editingProject?.clientName || 'Independent Client';

    setIsSaving(true);
    try {
      if (editingProject) {
        await onEditProject({
          ...editingProject,
          name: name.trim(),
          clientId,
          clientName,
          description: description.trim(),
          status,
          priority,
          progress: Math.min(100, Math.max(0, Number(progress))),
          deadline,
          budget: Number(budget) || 0,
          notes: notes.trim(),
        });
      } else {
        await onAddProject({
          name: name.trim(),
          clientId,
          clientName,
          description: description.trim(),
          status,
          priority,
          progress: Math.min(100, Math.max(0, Number(progress))),
          deadline,
          budget: Number(budget) || 0,
          tasksCount: 0,
          completedTasksCount: 0,
          filesCount: 1,
          notes: notes.trim(),
          aiRiskAssessment: {
            level: 'low',
            explanation: 'Initial milestones established. Monitoring delivery progress.',
          },
        });
      }
      setIsModalOpen(false);
      setEditingProject(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save project.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProject) return;
    setIsDeleting(true);
    try {
      await onDeleteProject(deletingProject.id);
      setDeletingProject(null);
    } catch (err: any) {
      console.error('Delete project failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate linked tasks for deletion warning
  const linkedTasksCount = deletingProject
    ? safeTasks.filter((t) => t && t.projectId === deletingProject.id).length
    : 0;

  return (
    <div id="view-projects" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">
            Project Pipelines
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Track active deliverables, completion velocities, budgets, and AI risk assessments with persistent backend storage.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-toggle-project-timeline"
            onClick={() => setShowTimeline(!showTimeline)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all cursor-pointer ${
              showTimeline
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'bg-[#0D1220] text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{showTimeline ? 'Hide Timeline' : 'Show Timeline'}</span>
          </button>

          <button
            id="btn-new-project"
            onClick={handleOpenCreate}
            className="aura-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center space-x-1.5 shadow-sm shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects or clients..."
              className="w-full bg-[#0D1220] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center space-x-2 bg-[#0D1220] border border-white/10 rounded-xl px-3 py-2 shrink-0 focus-within:border-indigo-500 transition-colors">
            <Filter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <label htmlFor="select-project-status-filter" className="text-xs text-gray-400 whitespace-nowrap font-medium">
              Filter Status:
            </label>
            <select
              id="select-project-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                if (e.target.value !== 'At Risk' && e.target.value !== 'High Risk' && onClearRiskFilter) {
                  onClearRiskFilter();
                }
              }}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1 font-semibold"
            >
              <option value="All" className="bg-[#080B14] text-white">All Projects</option>
              <optgroup label="Delivery & Health Status" className="bg-[#080B14] text-cyan-400 font-semibold">
                <option value="At Risk" className="bg-[#080B14] text-rose-300">⚠️ At Risk</option>
                <option value="On Track" className="bg-[#080B14] text-emerald-300">✓ On Track</option>
                <option value="Delayed" className="bg-[#080B14] text-rose-400">⏱ Delayed</option>
                <option value="Completed" className="bg-[#080B14] text-cyan-300">✓ Completed</option>
              </optgroup>
              <optgroup label="Lifecycle Phase" className="bg-[#080B14] text-gray-400 font-semibold">
                <option value="In Progress" className="bg-[#080B14] text-white">In Progress</option>
                <option value="Planning" className="bg-[#080B14] text-white">Planning</option>
                <option value="Review" className="bg-[#080B14] text-white">Review</option>
                <option value="On Hold" className="bg-[#080B14] text-white">On Hold</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0">
          {['All', 'Budget Warning', 'At Risk', 'On Track', 'Completed', 'In Progress'].map((st) => {
            const isRiskTab = st === 'At Risk' || st === 'High Risk';
            const isWarningTab = st === 'Budget Warning';
            const isActive =
              statusFilter === st ||
              (isRiskTab && (statusFilter === 'At Risk' || statusFilter === 'High Risk'));
            return (
              <button
                key={st}
                id={
                  isRiskTab
                    ? 'filter-projects-high-risk'
                    : isWarningTab
                    ? 'filter-projects-budget-warning'
                    : `filter-pill-${st.toLowerCase().replace(/\s+/g, '-')}`
                }
                onClick={() => {
                  setStatusFilter(st);
                  if (!isRiskTab && onClearRiskFilter) {
                    onClearRiskFilter();
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                  isActive
                    ? isRiskTab
                      ? 'bg-rose-950/80 border border-rose-500/60 text-rose-300 font-semibold shadow-sm shadow-rose-500/20'
                      : isWarningTab
                      ? 'bg-amber-950/80 border border-amber-500/60 text-amber-300 font-semibold shadow-sm shadow-amber-500/20'
                      : 'bg-indigo-950/70 border border-indigo-500/50 text-cyan-300 font-semibold'
                    : isRiskTab
                    ? 'bg-rose-950/20 border border-rose-500/20 text-rose-400 hover:text-rose-300'
                    : isWarningTab
                    ? 'bg-amber-950/20 border border-amber-500/30 text-amber-400 hover:text-amber-300'
                    : 'bg-[#0D1220] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {isRiskTab && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                {isWarningTab && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                <span>{st}</span>
                {isRiskTab && highRiskCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-300 font-mono font-bold">
                    {highRiskCount}
                  </span>
                )}
                {isWarningTab && budgetWarningCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-amber-300 font-mono font-bold">
                    {budgetWarningCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* High-Risk Pre-Applied Filter Banner */}
      {statusFilter === 'High Risk' && (
        <div
          id="high-risk-filter-banner"
          className="flex items-center justify-between p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Showing <strong>High-Risk &amp; Approaching Milestone Projects</strong> ({filteredProjects.length} engagement{filteredProjects.length === 1 ? '' : 's'} flagged by AURA intelligence).
            </span>
          </div>
          <button
            id="btn-clear-risk-filter"
            onClick={() => {
              setStatusFilter('All');
              if (onClearRiskFilter) onClearRiskFilter();
            }}
            className="text-[11px] font-semibold text-rose-300 hover:text-white px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 transition-colors cursor-pointer"
          >
            Show All Projects
          </button>
        </div>
      )}

      {/* Project Timeline & Gantt Visualization Section */}
      {showTimeline && safeProjects.length > 0 && (
        <div className="space-y-3">
          {/* Sub-toggle between Gantt and Milestones */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-400">Timeline View:</span>
              <div className="flex bg-[#080B14] border border-white/10 rounded-xl p-0.5 text-xs">
                <button
                  id="btn-view-mode-gantt"
                  onClick={() => setTimelineMode('gantt')}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    timelineMode === 'gantt'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Interactive Gantt &amp; Dependencies</span>
                </button>
                <button
                  id="btn-view-mode-milestones"
                  onClick={() => setTimelineMode('milestones')}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    timelineMode === 'milestones'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                  <span>Milestone Tracks</span>
                </button>
              </div>
            </div>

            <span className="text-[11px] text-gray-500 hidden sm:inline">
              {timelineMode === 'gantt' ? 'Drag project bars to adjust schedule' : 'Chronological milestones & deliverables'}
            </span>
          </div>

          {timelineMode === 'gantt' ? (
            <ProjectGanttChart
              projects={safeProjects}
              tasks={safeTasks}
              onEditProject={onEditProject}
              onSelectProject={(projectId) => {
                const prj = safeProjects.find((p) => p.id === projectId);
                if (prj) setSearch(prj.name);
              }}
            />
          ) : (
            <ProjectTimelineVisualization
              projects={safeProjects}
              tasks={safeTasks}
              onSelectProject={(projectId) => {
                const prj = safeProjects.find((p) => p.id === projectId);
                if (prj) {
                  setSearch(prj.name);
                }
              }}
            />
          )}
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="aura-card py-16 text-center rounded-2xl border border-dashed border-white/10 p-6 space-y-3">
          <Briefcase className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No projects found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {search || statusFilter !== 'All'
              ? 'No projects match your current filter parameters.'
              : 'Create your primary project to monitor milestones and receive AI delivery risk alerts.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-2 px-4 py-2 rounded-xl aura-gradient-btn text-xs font-semibold text-white"
          >
            + Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map((prj) => {
            const deliveryStatus = getProjectDeliveryStatus(prj);
            const costMetrics = getProjectCostMetrics(prj);
            const totalMilestones = prj.milestones?.length || 0;
            const completedMilestones = (prj.milestones || []).filter((m) => m.completed).length;

            return (
              <div
                key={prj.id}
                className="aura-card p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all space-y-4 relative group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Milestone & Deadline Health Status Pill */}
                      <span
                        id={`pill-project-health-${prj.id}`}
                        title={deliveryStatus.reason}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${deliveryStatus.badgeClass}`}
                      >
                        <deliveryStatus.Icon className="w-3 h-3 flex-shrink-0" />
                        <span>{deliveryStatus.label}</span>
                      </span>

                      {/* Yellow Budget Warning Status Indicator if > 90% */}
                      {costMetrics.isBudgetWarning && (
                        <span
                          id={`pill-budget-warning-${prj.id}`}
                          title={`Budget Alert: Actual costs ($${costMetrics.actualCost.toLocaleString()}) have reached ${costMetrics.utilizationPct}% of the $${costMetrics.budget.toLocaleString()} budget.`}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/50 bg-amber-950/80 text-amber-300 flex items-center space-x-1 shadow-sm shadow-amber-950/40"
                        >
                          <AlertTriangle className="w-3 h-3 flex-shrink-0 text-amber-400 animate-pulse" />
                          <span>Budget Warning ({costMetrics.utilizationPct}%)</span>
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          prj.status === 'In Progress'
                            ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                            : prj.status === 'Review'
                            ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                            : prj.status === 'Completed'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                            : prj.status === 'Planning'
                            ? 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
                            : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        {prj.status}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          prj.priority === 'Urgent'
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                            : prj.priority === 'High'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-950/40 text-blue-300'
                        }`}
                      >
                        {prj.priority}
                      </span>

                      {totalMilestones > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/5">
                          {completedMilestones}/{totalMilestones} Milestones
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white mt-1.5 group-hover:text-cyan-300 transition-colors">
                      {prj.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Client: <span className="text-gray-200">{prj.clientName}</span>
                    </p>
                  </div>

                <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                  <button
                    id={`btn-edit-project-${prj.id}`}
                    onClick={() => handleOpenEdit(prj)}
                    title="Edit Project"
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id={`btn-delete-project-${prj.id}`}
                    onClick={() => setDeletingProject(prj)}
                    title="Delete Project"
                    className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-300 line-clamp-2">
                {prj.description || 'No detailed scope description entered.'}
              </p>

              {/* Progress & Deadlines */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Deliverable Progress</span>
                  <span className="font-bold text-white">{prj.progress}%</span>
                </div>
                <div className="w-full bg-[#080B14] h-2 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 rounded-full"
                    style={{ width: `${prj.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/5">
                <div className="flex items-center space-x-2 text-gray-300">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Due {prj.deadline}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300 justify-end">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-white">
                    ${prj.budget.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Budget vs Actual Cost Tracker */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-gray-300 font-medium">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Budget vs. Actual Cost</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-white">${costMetrics.actualCost.toLocaleString()}</span>
                    <span className="text-[11px] text-gray-400"> / ${prj.budget.toLocaleString()}</span>
                    <span
                      className={`ml-1.5 text-[10px] font-bold ${
                        costMetrics.isBudgetWarning ? 'text-amber-300' : 'text-cyan-300'
                      }`}
                    >
                      ({costMetrics.utilizationPct}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar for cost utilization */}
                <div className="w-full bg-[#080B14] h-2 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      costMetrics.utilizationPct > 100
                        ? 'bg-rose-500'
                        : costMetrics.isBudgetWarning
                        ? 'bg-amber-400'
                        : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                    }`}
                    style={{ width: `${Math.min(100, costMetrics.utilizationPct)}%` }}
                  />
                </div>

                {/* Yellow 'budget warning' status indicator if actual cost exceeds 90% */}
                {costMetrics.isBudgetWarning ? (
                  <div
                    id={`budget-warning-alert-${prj.id}`}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[11px] font-medium shadow-sm shadow-amber-950/40"
                  >
                    <div className="flex items-center space-x-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                      <span>Budget Warning: Exceeds 90% threshold</span>
                    </div>
                    <span className="text-[10px] text-amber-200/90 font-mono">
                      {costMetrics.costSource}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] text-gray-400 px-0.5">
                    <span className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      <span>On Track &lt; 90%</span>
                    </span>
                    <span className="font-mono text-gray-400">{costMetrics.costSource}</span>
                  </div>
                )}
              </div>

              {/* AI Risk Assessment Card */}
              {prj.aiRiskAssessment && (
                <div className="p-3 rounded-xl bg-[#080B14] border border-white/5 text-[11px] space-y-1">
                  <div className="flex items-center space-x-1.5 font-semibold text-cyan-300">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>AURA Delivery Analysis:</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded uppercase ${
                        prj.aiRiskAssessment.level === 'high'
                          ? 'bg-rose-950 text-rose-300'
                          : prj.aiRiskAssessment.level === 'moderate'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-emerald-950 text-emerald-300'
                      }`}
                    >
                      {prj.aiRiskAssessment.level} risk
                    </span>
                  </div>
                  <p className="text-gray-400 leading-relaxed">
                    {prj.aiRiskAssessment.explanation}
                  </p>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="aura-card max-w-md w-full p-6 rounded-2xl border border-indigo-500/30 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingProject ? `Edit Project: ${editingProject.name}` : 'Create New Project'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingProject(null);
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AI Workflow Telemetry Dashboard"
                  className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Client Organization
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {safeClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                  {safeClients.length === 0 && (
                    <option value="">Independent Internal Project</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Scope & Deliverable Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="High-level milestones, target deliverables..."
                  className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Private Notes & Client Nuances
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions or deliverable conditions..."
                  className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProject(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="aura-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm flex items-center space-x-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>{editingProject ? 'Save Changes' : 'Create Project'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingProject)}
        title="Delete Project"
        itemName={deletingProject?.name || 'Project'}
        itemType="Project"
        warningMessage="Are you sure you want to delete this project pipeline? This action cannot be undone."
        relatedNotice={
          linkedTasksCount > 0
            ? `⚠️ Notice: This project currently has ${linkedTasksCount} associated task(s). Deleting will remove this project and unlink those tasks.`
            : undefined
        }
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingProject(null)}
      />
    </div>
  );
};
