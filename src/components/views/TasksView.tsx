import React, { useState, useEffect } from 'react';
import { Task, Project, PriorityLevel, TaskStatus, TaskCategory, TaskSubtask, TaskTemplate } from '../../types';
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  X,
  AlertCircle,
  Download,
  Tag,
  Check,
  Filter,
  CheckCheck,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Minus,
  Flame,
  Briefcase,
  RotateCcw,
  Folder,
  Play,
  Pause,
  Square,
  Timer,
  CircleDollarSign,
  Layers,
  Bookmark,
  Link2,
  ListChecks,
  Edit3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { exportTasksToCSV } from '../../lib/taskExport';
import { getSavedTaskTemplates, saveTaskTemplate, deleteTaskTemplate } from '../../data/taskTemplates';
import { TaskSubtasksSection } from '../tasks/TaskSubtasksSection';
import { TaskBlockingBadge } from '../tasks/TaskBlockingBadge';
import { TaskTemplatesModal } from '../tasks/TaskTemplatesModal';
import { SaveTemplateModal } from '../tasks/SaveTemplateModal';

interface TasksViewProps {
  tasks: Task[];
  projects: Project[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void> | void;
  onEditTask: (task: Task) => Promise<void> | void;
  onDeleteTask: (taskId: string) => Promise<void> | void;
  onToggleComplete: (taskId: string) => Promise<void> | void;
  onReorderTasks?: (reorderedTasks: Task[]) => void;
  onToast?: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  onEditProject?: (project: Project) => Promise<void> | void;
}

const CATEGORY_OPTIONS: { label: string; value: string; color: string }[] = [
  { label: 'All Categories', value: 'All', color: 'border-white/10 text-gray-300' },
  { label: 'Urgent', value: 'Urgent', color: 'border-rose-500/40 text-rose-300 bg-rose-950/30' },
  { label: 'Strategic', value: 'Strategic', color: 'border-purple-500/40 text-purple-300 bg-purple-950/30' },
  { label: 'Routine', value: 'Routine', color: 'border-blue-500/40 text-blue-300 bg-blue-950/30' },
  { label: 'Client Deliverable', value: 'Client Deliverable', color: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/30' },
  { label: 'Operations', value: 'Operations', color: 'border-amber-500/40 text-amber-300 bg-amber-950/30' },
  { label: 'Admin', value: 'Admin', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30' },
];

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  projects,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  onReorderTasks,
  onToast,
  onEditProject,
}) => {
  // Master Ordered Tasks State for Drag-and-Drop Reordering
  const [localTasks, setLocalTasks] = useState<Task[]>(Array.isArray(tasks) ? tasks : []);

  useEffect(() => {
    if (Array.isArray(tasks)) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  // Real-time Search and Filter States
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'custom' | 'priority' | 'deadline' | 'title'>('custom');

  // Drag and Drop States
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  // Live Timer State
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [timerElapsedSeconds, setTimerElapsedSeconds] = useState<number>(0);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // Modal Form State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [category, setCategory] = useState<TaskCategory>('Routine');
  const [label, setLabel] = useState<string>('');
  const [deadline, setDeadline] = useState('2026-09-25');
  const [notes, setNotes] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number>(4);
  const [actualHours, setActualHours] = useState<number>(0);
  const [hourlyRate, setHourlyRate] = useState<number>(85);
  const [blockingTaskId, setBlockingTaskId] = useState<string>('');
  const [modalSubtasks, setModalSubtasks] = useState<TaskSubtask[]>([]);
  const [newModalSubtaskInput, setNewModalSubtaskInput] = useState('');

  // Task Templates State
  const [templates, setTemplates] = useState<TaskTemplate[]>(() => getSavedTaskTemplates());
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);

  // Delete Confirmation Dialog State
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Interactive Priority Dropdown & In-Flight State
  const [priorityDropdownTaskId, setPriorityDropdownTaskId] = useState<string | null>(null);
  const [updatingPriorityTaskId, setUpdatingPriorityTaskId] = useState<string | null>(null);

  // Interactive Due Date Quick-Picker & In-Flight State
  const [dueDateDropdownTaskId, setDueDateDropdownTaskId] = useState<string | null>(null);
  const [updatingDueDateTaskId, setUpdatingDueDateTaskId] = useState<string | null>(null);

  // Inline Task Description Editing State
  const [editingDescriptionTaskId, setEditingDescriptionTaskId] = useState<string | null>(null);
  const [draftDescription, setDraftDescription] = useState<string>('');
  const [isSavingDescription, setIsSavingDescription] = useState<boolean>(false);

  const safeProjects = Array.isArray(projects) ? projects : [];

  // Live stopwatch ticking effect
  useEffect(() => {
    if (!activeTimerTaskId || isTimerPaused) return;
    const interval = setInterval(() => {
      setTimerElapsedSeconds((sec) => sec + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimerTaskId, isTimerPaused]);

  // Timer format display
  const formatTimerDisplay = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Sync task logged hours directly to the project's financial reports
  const syncTaskHoursToProjectFinancials = async (
    targetTask: Task,
    newActualHours: number
  ) => {
    if (!targetTask.projectId || !onEditProject) return;
    const targetProject = safeProjects.find((p) => p.id === targetTask.projectId);
    if (!targetProject) return;

    // Calculate aggregated project actual hours from all tasks for this project
    const allProjectTasks = localTasks.map((t) =>
      t.id === targetTask.id ? { ...t, actualHours: newActualHours } : t
    ).filter((t) => t.projectId === targetProject.id);

    const totalHours = allProjectTasks.reduce((acc, t) => acc + (Number(t.actualHours) || 0), 0);
    const rate = Number(targetTask.hourlyRate) || Number(targetProject.hourlyRate) || 85;
    const laborCost = Math.round(totalHours * rate);

    try {
      await onEditProject({
        ...targetProject,
        totalLoggedHours: Math.round(totalHours * 10) / 10,
        laborCost,
        hourlyRate: rate,
      });
      if (onToast) {
        onToast(
          'Financials Synchronized',
          `Logged ${newActualHours}h on "${targetTask.title}". Updated ${targetProject.name} total labor to ${totalHours.toFixed(1)}h ($${laborCost.toLocaleString()}).`,
          'success'
        );
      }
    } catch (err) {
      console.error('Failed to sync project financials:', err);
    }
  };

  // Stopwatch controls
  const handleStartTimer = (taskId: string) => {
    if (activeTimerTaskId && activeTimerTaskId !== taskId) {
      if (onToast) {
        onToast('Timer Switched', 'Switched active time recording to current task.', 'info');
      }
    }
    setActiveTimerTaskId(taskId);
    setIsTimerPaused(false);
    setTimerElapsedSeconds(0);
  };

  const handleTogglePauseTimer = () => {
    setIsTimerPaused((prev) => !prev);
  };

  const handleStopAndSaveTimer = async (task: Task) => {
    const elapsedMinutes = Math.max(1, Math.round(timerElapsedSeconds / 60));
    const loggedHours = Math.max(0.1, Math.round((elapsedMinutes / 60) * 10) / 10);
    const currentActual = Number(task.actualHours) || 0;
    const updatedActual = Math.round((currentActual + loggedHours) * 10) / 10;

    const updatedTask = {
      ...task,
      actualHours: updatedActual,
      isTimerRunning: false,
    };

    setLocalTasks((prev) =>
      prev.map((t) => (t.id === task.id ? updatedTask : t))
    );

    try {
      await onEditTask(updatedTask);
      await syncTaskHoursToProjectFinancials(updatedTask, updatedActual);
    } catch (err) {
      console.error('Failed to log time:', err);
    }

    setActiveTimerTaskId(null);
    setTimerElapsedSeconds(0);
    setIsTimerPaused(false);
  };

  const handleQuickAddTime = async (task: Task, hours: number) => {
    const currentActual = Number(task.actualHours) || 0;
    const updatedActual = Math.round((currentActual + hours) * 10) / 10;

    const updatedTask = {
      ...task,
      actualHours: updatedActual,
    };

    setLocalTasks((prev) =>
      prev.map((t) => (t.id === task.id ? updatedTask : t))
    );

    try {
      await onEditTask(updatedTask);
      await syncTaskHoursToProjectFinancials(updatedTask, updatedActual);
    } catch (err) {
      console.error('Failed to add quick time:', err);
    }
  };

  // 24-Hour Urgent Deadline Helpers
  const isTaskOverdue = (t: Task) => {
    if (!t || !t.deadline || t.status === 'Completed') return false;
    return new Date(`${t.deadline}T23:59:59`).getTime() < Date.now();
  };

  const isTaskDueWithin24h = (t: Task) => {
    if (!t || !t.deadline || t.status === 'Completed') return false;
    const now = Date.now();
    const deadlineTime = new Date(`${t.deadline}T23:59:59`).getTime();
    const diff = deadlineTime - now;
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  };

  const getHoursLeft = (t: Task) => {
    if (!t.deadline) return 0;
    const diff = new Date(`${t.deadline}T23:59:59`).getTime() - Date.now();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60)));
  };

  const overdueCount = localTasks.filter(isTaskOverdue).length;
  const dueWithin24hTasks = localTasks.filter(isTaskDueWithin24h);
  const dueWithin24hCount = dueWithin24hTasks.length;

  // Real-time Search and Filter Logic
  const filteredTasks = localTasks.filter((t) => {
    if (!t) return false;

    // Search by title (or matching label, project, or category)
    const matchesSearch =
      !search.trim() ||
      (t.title || '').toLowerCase().includes(search.toLowerCase().trim()) ||
      (t.projectName && t.projectName.toLowerCase().includes(search.toLowerCase().trim())) ||
      (t.label && t.label.toLowerCase().includes(search.toLowerCase().trim())) ||
      (t.category && t.category.toLowerCase().includes(search.toLowerCase().trim()));

    // Filter by Priority Level (High, Medium, Low, Urgent)
    const matchesPriority =
      priorityFilter === 'All'
        ? true
        : t.priority.toLowerCase() === priorityFilter.toLowerCase();

    // Filter by Project Association
    const matchesProject =
      projectFilter === 'All'
        ? true
        : projectFilter === 'Unassigned'
        ? !t.projectId
        : t.projectId === projectFilter;

    // Filter by Status
    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Overdue'
        ? isTaskOverdue(t)
        : statusFilter === 'Due in 24h'
        ? isTaskDueWithin24h(t)
        : statusFilter === 'Pending'
        ? t.status !== 'Completed'
        : t.status === statusFilter;

    // Filter by Category
    const matchesCategory =
      categoryFilter === 'All'
        ? true
        : (t.category || '').toLowerCase() === categoryFilter.toLowerCase() ||
          (t.label || '').toLowerCase() === categoryFilter.toLowerCase() ||
          (categoryFilter === 'Urgent' && t.priority === 'Urgent');

    return matchesSearch && matchesPriority && matchesProject && matchesStatus && matchesCategory;
  });

  // Sorted Tasks
  const sortedAndFilteredTasks = React.useMemo(() => {
    const list = [...filteredTasks];
    if (sortBy === 'priority') {
      const priorityWeight: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      return list.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
    }
    if (sortBy === 'deadline') {
      return list.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      });
    }
    if (sortBy === 'title') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [filteredTasks, sortBy]);

  // AURA Intelligent Recommendation Engine
  const intelligentRecommendation = React.useMemo(() => {
    const incompleteTasks = localTasks.filter((t) => t.status !== 'Completed');
    if (incompleteTasks.length === 0) return null;

    // 1. Check for overdue tasks
    const overdue = incompleteTasks.filter(isTaskOverdue);
    if (overdue.length > 0) {
      const topOverdue = [...overdue].sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))[0];
      return {
        task: topOverdue,
        message: `Action Required: Complete "${topOverdue.title}" immediately — deadline has passed (${topOverdue.deadline}).`,
        badge: 'Overdue Alert',
        color: 'rose',
      };
    }

    // 2. Check for tasks due within 24h
    const dueSoon = incompleteTasks.filter(isTaskDueWithin24h);
    if (dueSoon.length > 0) {
      const topDue = dueSoon[0];
      return {
        task: topDue,
        message: `Urgent Focus: Complete "${topDue.title}" first — due within 24 hours (${topDue.deadline}).`,
        badge: 'Due in <24h',
        color: 'amber',
      };
    }

    // 3. Check for Urgent or High priority tasks
    const highUrgent = incompleteTasks.filter((t) => t.priority === 'Urgent' || t.priority === 'High');
    if (highUrgent.length > 0) {
      const topHigh = highUrgent[0];
      return {
        task: topHigh,
        message: `AURA Recommendation: Complete "${topHigh.title}" first because it is ${topHigh.priority} Priority.`,
        badge: `${topHigh.priority} Priority`,
        color: topHigh.priority === 'Urgent' ? 'red' : 'indigo',
      };
    }

    // 4. Default suggestion
    return {
      task: incompleteTasks[0],
      message: `AURA Recommendation: Complete "${incompleteTasks[0].title}" first to maintain momentum in your sprint.`,
      badge: 'Sprint Focus',
      color: 'cyan',
    };
  }, [localTasks]);

  const isAnyFilterActive =
    Boolean(search.trim()) ||
    priorityFilter !== 'All' ||
    projectFilter !== 'All' ||
    statusFilter !== 'All' ||
    categoryFilter !== 'All' ||
    sortBy !== 'custom';

  const handleResetFilters = () => {
    setSearch('');
    setPriorityFilter('All');
    setProjectFilter('All');
    setStatusFilter('All');
    setCategoryFilter('All');
    setSortBy('custom');
  };

  // Drag and Drop Reordering Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTaskId && draggedTaskId !== targetId) {
      setDragOverTaskId(targetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTaskId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetId) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    const currentList = [...localTasks];
    const sourceIdx = currentList.findIndex((t) => t.id === draggedTaskId);
    const targetIdx = currentList.findIndex((t) => t.id === targetId);

    if (sourceIdx === -1 || targetIdx === -1) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    const [movedItem] = currentList.splice(sourceIdx, 1);
    currentList.splice(targetIdx, 0, movedItem);

    setLocalTasks(currentList);
    setDraggedTaskId(null);
    setDragOverTaskId(null);

    if (onReorderTasks) {
      onReorderTasks(currentList);
    }

    if (onToast) {
      onToast(
        'Backlog Reordered',
        `"${movedItem.title}" moved to position #${targetIdx + 1} in your sprint backlog.`,
        'info'
      );
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  // Keyboard / Touch Reorder Up / Down Helpers
  const handleMoveTask = (taskId: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const currentList = [...localTasks];
    const idx = currentList.findIndex((t) => t.id === taskId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= currentList.length) return;

    const [movedItem] = currentList.splice(idx, 1);
    currentList.splice(newIdx, 0, movedItem);

    setLocalTasks(currentList);
    if (onReorderTasks) {
      onReorderTasks(currentList);
    }
    if (onToast) {
      onToast(
        'Backlog Updated',
        `Moved "${movedItem.title}" ${direction === 'up' ? 'up' : 'down'} in backlog.`,
        'info'
      );
    }
  };

  // Priority Update with Optimistic UI, in-flight lock, and rollback
  const handleUpdateTaskPriority = async (task: Task, newPriority: PriorityLevel) => {
    if (task.priority === newPriority || updatingPriorityTaskId === task.id) return;
    setPriorityDropdownTaskId(null);
    setUpdatingPriorityTaskId(task.id);

    const prevPriority = task.priority;
    const updatedTask: Task = { ...task, priority: newPriority };

    // Optimistic UI update
    setLocalTasks((prev) => prev.map((item) => (item.id === task.id ? updatedTask : item)));

    try {
      if (onEditTask) {
        await onEditTask(updatedTask);
      }
      if (onToast) {
        onToast('Priority Updated', `Priority set to ${newPriority} for "${task.title}".`, 'success');
      }
    } catch (err: any) {
      // Rollback on failure
      setLocalTasks((prev) =>
        prev.map((item) => (item.id === task.id ? { ...task, priority: prevPriority } : item))
      );
      if (onToast) {
        onToast('Update Failed', err?.message || 'Failed to update priority', 'error');
      }
    } finally {
      setUpdatingPriorityTaskId(null);
    }
  };

  // Due Date Update with Optimistic UI, in-flight lock, and rollback
  const handleUpdateTaskDueDate = async (task: Task, newDeadline: string) => {
    if (task.deadline === newDeadline || updatingDueDateTaskId === task.id) return;
    setDueDateDropdownTaskId(null);
    setUpdatingDueDateTaskId(task.id);

    const prevDeadline = task.deadline;
    const updatedTask: Task = { ...task, deadline: newDeadline };

    // Optimistic UI update
    setLocalTasks((prev) => prev.map((item) => (item.id === task.id ? updatedTask : item)));

    try {
      if (onEditTask) {
        await onEditTask(updatedTask);
      }
      if (onToast) {
        onToast(
          'Due Date Updated',
          newDeadline
            ? `Due date for "${task.title}" updated to ${newDeadline}.`
            : `Due date cleared for "${task.title}".`,
          'success'
        );
      }
    } catch (err: any) {
      // Rollback on failure
      setLocalTasks((prev) =>
        prev.map((item) => (item.id === task.id ? { ...task, deadline: prevDeadline } : item))
      );
      if (onToast) {
        onToast('Update Failed', err?.message || 'Failed to update due date', 'error');
      }
    } finally {
      setUpdatingDueDateTaskId(null);
    }
  };

  // Inline Task Description Editing Handlers
  const handleStartEditingDescription = (task: Task) => {
    setEditingDescriptionTaskId(task.id);
    setDraftDescription(task.description || task.notes || '');
  };

  const handleCancelEditingDescription = () => {
    setEditingDescriptionTaskId(null);
    setDraftDescription('');
  };

  const handleSaveInlineDescription = async (task: Task) => {
    if (isSavingDescription) return;
    setIsSavingDescription(true);
    const prevDesc = task.description;
    const prevNotes = task.notes;

    const trimmed = draftDescription.trim();
    const updatedTask: Task = {
      ...task,
      description: trimmed,
      notes: trimmed,
    };

    // Optimistic UI update
    setLocalTasks((prev) => prev.map((item) => (item.id === task.id ? updatedTask : item)));

    try {
      if (onEditTask) {
        await onEditTask(updatedTask);
      }
      if (onToast) {
        onToast('Description Saved', `Updated deliverable notes for "${task.title}".`, 'success');
      }
      setEditingDescriptionTaskId(null);
    } catch (err: any) {
      // Rollback on failure
      setLocalTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...task, description: prevDesc, notes: prevNotes } : item
        )
      );
      if (onToast) {
        onToast('Save Failed', err?.message || 'Failed to save description', 'error');
      }
    } finally {
      setIsSavingDescription(false);
    }
  };

  // Interactive Color-coded Priority Badge with Dropdown
  const renderPriorityBadge = (p: PriorityLevel | string, taskOrId: Task | string) => {
    const task = typeof taskOrId === 'string' ? localTasks.find((x) => x.id === taskOrId) : taskOrId;
    const taskId = task ? task.id : String(taskOrId);
    const isUpdating = updatingPriorityTaskId === taskId;
    const isDropdownOpen = priorityDropdownTaskId === taskId;

    let badgeClass = '';
    let dotColor = '';
    const labelText = String(p).toUpperCase();

    switch (p) {
      case 'Urgent':
        badgeClass = 'bg-red-950/80 text-red-200 border-red-500/60 hover:bg-red-900/80 shadow-sm shadow-red-950/40';
        dotColor = 'bg-red-400';
        break;
      case 'High':
        badgeClass = 'bg-rose-950/80 text-rose-300 border-rose-500/50 hover:bg-rose-900/80 shadow-sm shadow-rose-950/30';
        dotColor = 'bg-rose-400';
        break;
      case 'Medium':
        badgeClass = 'bg-amber-950/70 text-amber-300 border-amber-500/40 hover:bg-amber-900/70 shadow-sm shadow-amber-950/20';
        dotColor = 'bg-amber-400';
        break;
      case 'Low':
      default:
        badgeClass = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60 shadow-sm shadow-emerald-950/20';
        dotColor = 'bg-emerald-400';
        break;
    }

    const priorityOptions: { level: PriorityLevel; label: string; desc: string; dot: string }[] = [
      { level: 'Low', label: '● LOW', desc: 'Standard deliverable timeline', dot: 'bg-emerald-400' },
      { level: 'Medium', label: '● MEDIUM', desc: 'Normal project deliverable', dot: 'bg-amber-400' },
      { level: 'High', label: '● HIGH', desc: 'Immediate sprint priority', dot: 'bg-rose-400' },
      { level: 'Urgent', label: '● URGENT', desc: 'Critical deadline attention', dot: 'bg-red-400' },
    ];

    return (
      <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
        <button
          id={`task-priority-toggle-${taskId}`}
          data-testid={`task-priority-badge-${taskId}`}
          type="button"
          disabled={isUpdating || !task}
          onClick={(e) => {
            e.stopPropagation();
            if (task) {
              setPriorityDropdownTaskId((prev) => (prev === taskId ? null : taskId));
            }
          }}
          title="Click to toggle or change task priority"
          className={`inline-flex items-center space-x-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${badgeClass} ${
            isUpdating ? 'opacity-70 cursor-wait' : ''
          }`}
        >
          {isUpdating ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin text-cyan-300 shrink-0" />
          ) : (
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
          )}
          <span>● {labelText}</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-0.5 shrink-0" />
        </button>

        {/* Priority Dropdown Popover */}
        {isDropdownOpen && task && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setPriorityDropdownTaskId(null);
              }}
            />
            <div
              id={`task-priority-dropdown-${taskId}`}
              className="absolute left-0 mt-1 w-44 rounded-xl bg-[#090D18] border border-cyan-500/40 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div className="text-[9px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">
                Set Priority
              </div>
              {priorityOptions.map((opt) => {
                const isCurrent = task.priority === opt.level;
                return (
                  <button
                    key={opt.level}
                    id={`task-priority-opt-${taskId}-${opt.level.toLowerCase()}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateTaskPriority(task, opt.level);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${opt.dot} shrink-0`} />
                      <span>{opt.label}</span>
                    </span>
                    {isCurrent && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  // Interactive Due Date Quick-Picker with Presets and Custom Calendar Picker
  const renderDueDateQuickPicker = (task: Task) => {
    const isUpdating = updatingDueDateTaskId === task.id;
    const isOpen = dueDateDropdownTaskId === task.id;
    const isCompleted = task.status === 'Completed';
    const deadlineTime = task.deadline ? new Date(`${task.deadline}T23:59:59`).getTime() : 0;
    const isOverdue = !!task.deadline && !isCompleted && deadlineTime < Date.now();
    const isDueSoon = isTaskDueWithin24h(task);

    // Quick shortcut dates in YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const in3DaysStr = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    return (
      <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
        <button
          id={`task-duedate-picker-btn-${task.id}`}
          type="button"
          disabled={isUpdating}
          onClick={(e) => {
            e.stopPropagation();
            setDueDateDropdownTaskId((prev) => (prev === task.id ? null : task.id));
          }}
          title="Click to pick or modify due date"
          className={`inline-flex items-center space-x-1.5 text-[10px] font-medium px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
            task.deadline
              ? isOverdue
                ? 'bg-rose-950/70 text-rose-300 border-rose-500/50 hover:bg-rose-900/70 font-semibold shadow-sm'
                : isDueSoon
                ? 'bg-amber-950/70 text-amber-300 border-amber-500/50 hover:bg-amber-900/70 font-semibold shadow-sm'
                : 'bg-white/5 text-gray-300 border-white/10 hover:border-cyan-500/40 hover:text-cyan-300'
              : 'bg-white/[0.03] text-gray-400 border-dashed border-white/15 hover:border-cyan-500/40 hover:text-cyan-300'
          } ${isUpdating ? 'opacity-70 cursor-wait' : ''}`}
        >
          {isUpdating ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin text-cyan-300 shrink-0" />
          ) : (
            <Calendar
              className={`w-3 h-3 ${
                isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-cyan-400'
              }`}
            />
          )}
          <span>{task.deadline ? `Due: ${task.deadline}` : '+ Due Date'}</span>
          {isOverdue && <span className="text-[9px] text-rose-400 font-bold ml-0.5">(Overdue)</span>}
          {isDueSoon && <span className="text-[9px] text-amber-400 font-bold ml-0.5">(&lt;24h)</span>}
          <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-0.5 shrink-0" />
        </button>

        {/* Due Date Dropdown Popover */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setDueDateDropdownTaskId(null);
              }}
            />
            <div
              id={`task-duedate-dropdown-${task.id}`}
              className="absolute left-0 mt-1 w-56 rounded-xl bg-[#090D18] border border-cyan-500/40 shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 space-y-2"
            >
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-white/10">
                <span>Quick Due Date</span>
                {task.deadline && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateTaskDueDate(task, '');
                    }}
                    className="text-rose-400 hover:text-rose-300 normal-case font-semibold cursor-pointer text-[10px]"
                  >
                    Clear Date
                  </button>
                )}
              </div>

              {/* Preset Quick Options */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  id={`btn-duedate-today-${task.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateTaskDueDate(task, todayStr);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer flex items-center justify-between ${
                    task.deadline === todayStr
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>Today</span>
                  {task.deadline === todayStr && <Check className="w-3 h-3 text-cyan-400" />}
                </button>

                <button
                  type="button"
                  id={`btn-duedate-tomorrow-${task.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateTaskDueDate(task, tomorrowStr);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer flex items-center justify-between ${
                    task.deadline === tomorrowStr
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>Tomorrow</span>
                  {task.deadline === tomorrowStr && <Check className="w-3 h-3 text-cyan-400" />}
                </button>

                <button
                  type="button"
                  id={`btn-duedate-3days-${task.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateTaskDueDate(task, in3DaysStr);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer flex items-center justify-between ${
                    task.deadline === in3DaysStr
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>In 3 Days</span>
                  {task.deadline === in3DaysStr && <Check className="w-3 h-3 text-cyan-400" />}
                </button>

                <button
                  type="button"
                  id={`btn-duedate-nextweek-${task.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateTaskDueDate(task, nextWeekStr);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer flex items-center justify-between ${
                    task.deadline === nextWeekStr
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>Next Week</span>
                  {task.deadline === nextWeekStr && <Check className="w-3 h-3 text-cyan-400" />}
                </button>
              </div>

              {/* Custom Calendar Date Input */}
              <div className="pt-1.5 border-t border-white/10 space-y-1">
                <span className="text-[10px] text-gray-400 font-medium">Custom Calendar Date:</span>
                <input
                  type="date"
                  id={`input-duedate-custom-${task.id}`}
                  value={task.deadline || ''}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.target.value) {
                      handleUpdateTaskDueDate(task, e.target.value);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#05070D] border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Bulk Selection Handlers
  const handleToggleSelectTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const tasksToExport =
      selectedTaskIds.size > 0
        ? localTasks.filter((t) => selectedTaskIds.has(t.id))
        : filteredTasks;

    if (tasksToExport.length === 0) {
      if (onToast) {
        onToast('Export Notice', 'No tasks available to export.', 'info');
      }
      return;
    }

    const exportResult = exportTasksToCSV(tasksToExport);
    if (onToast) {
      onToast(
        'CSV Export Complete',
        `Successfully downloaded ${exportResult.count} deliverable task${exportResult.count === 1 ? '' : 's'} as CSV (${exportResult.filename}).`,
        'success'
      );
    }
  };

  // Open Modal Handlers
  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormError(null);
    setTitle('');
    setProjectId(safeProjects[0]?.id || '');
    setStatus('To Do');
    setPriority('High');
    setCategory('Routine');
    setLabel('');
    setDeadline(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setNotes('');
    setEstimatedHours(4);
    setActualHours(0);
    setHourlyRate(85);
    setBlockingTaskId('');
    setModalSubtasks([]);
    setNewModalSubtaskInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Task) => {
    setEditingTask(t);
    setFormError(null);
    setTitle(t.title);
    setProjectId(t.projectId || '');
    setStatus(t.status);
    setPriority(t.priority);
    setCategory(t.category || (t.priority === 'Urgent' ? 'Urgent' : 'Routine'));
    setLabel(t.label || '');
    setDeadline(t.deadline || new Date().toISOString().split('T')[0]);
    setNotes(t.notes || '');
    setEstimatedHours(Number(t.estimatedHours) || 4);
    setActualHours(Number(t.actualHours) || 0);
    setHourlyRate(Number(t.hourlyRate) || 85);
    setBlockingTaskId(t.blockingTaskId || t.blockedByTaskId || '');
    setModalSubtasks(Array.isArray(t.subtasks) ? [...t.subtasks] : []);
    setNewModalSubtaskInput('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Task title is required.');
      return;
    }

    const prj = safeProjects.find((p) => p.id === projectId);

    setIsSaving(true);
    try {
      if (editingTask) {
        const updated: Task = {
          ...editingTask,
          title: title.trim(),
          projectId: projectId || undefined,
          projectName: prj ? prj.name : undefined,
          status,
          priority,
          category,
          label: label.trim() || undefined,
          deadline,
          notes: notes.trim(),
          estimatedHours: Number(estimatedHours) || 4,
          actualHours: Number(actualHours) || 0,
          hourlyRate: Number(hourlyRate) || 85,
          blockingTaskId: blockingTaskId || undefined,
          blockedByTaskId: blockingTaskId || undefined,
          subtasks: modalSubtasks,
        };
        await onEditTask(updated);
        await syncTaskHoursToProjectFinancials(updated, Number(actualHours) || 0);
      } else {
        await onAddTask({
          title: title.trim(),
          projectId: projectId || undefined,
          projectName: prj ? prj.name : undefined,
          status,
          priority,
          category,
          label: label.trim() || undefined,
          deadline,
          notes: notes.trim(),
          estimatedHours: Number(estimatedHours) || 4,
          actualHours: Number(actualHours) || 0,
          hourlyRate: Number(hourlyRate) || 85,
          blockingTaskId: blockingTaskId || undefined,
          blockedByTaskId: blockingTaskId || undefined,
          subtasks: modalSubtasks,
        });
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save task.');
    } finally {
      setIsSaving(false);
    }
  };

  // Subtask Handlers on Task Card
  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = localTasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const updatedSubtasks = currentSubtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const updatedTask: Task = { ...task, subtasks: updatedSubtasks };
    setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    try {
      await onEditTask(updatedTask);
      const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);
      if (allDone && task.status !== 'Completed' && onToast) {
        onToast('All Subtasks Checked', `All ${updatedSubtasks.length} subtasks for "${task.title}" are complete!`, 'success');
      }
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const handleAddSubtaskToCard = async (taskId: string, subtaskTitle: string) => {
    const task = localTasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const newSt: TaskSubtask = {
      id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: subtaskTitle.trim(),
      completed: false,
    };

    const updatedTask: Task = { ...task, subtasks: [...currentSubtasks, newSt] };
    setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    try {
      await onEditTask(updatedTask);
      if (onToast) {
        onToast('Subtask Added', `Added "${newSt.title}" to ${task.title}.`, 'info');
      }
    } catch (err) {
      console.error('Failed to add subtask:', err);
    }
  };

  const handleDeleteSubtaskFromCard = async (taskId: string, subtaskId: string) => {
    const task = localTasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const updatedSubtasks = currentSubtasks.filter((st) => st.id !== subtaskId);

    const updatedTask: Task = { ...task, subtasks: updatedSubtasks };
    setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    try {
      await onEditTask(updatedTask);
    } catch (err) {
      console.error('Failed to delete subtask:', err);
    }
  };

  const handleClearBlocking = async (taskId: string) => {
    const task = localTasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTask: Task = { ...task, blockingTaskId: undefined, blockedByTaskId: undefined };
    setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    try {
      await onEditTask(updatedTask);
      if (onToast) {
        onToast('Dependency Cleared', `Removed blocking link from "${task.title}".`, 'info');
      }
    } catch (err) {
      console.error('Failed to clear blocking:', err);
    }
  };

  // Template Handlers
  const handleApplyTemplate = (template: TaskTemplate) => {
    setTitle(template.defaultTitle || template.name);
    if (template.defaultPriority) setPriority(template.defaultPriority);
    if (template.defaultCategory) setCategory(template.defaultCategory);
    if (template.estimatedHours) setEstimatedHours(template.estimatedHours);
    const clonedSubtasks: TaskSubtask[] = (template.subtasks || []).map((st, idx) => ({
      id: `st_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
      title: st.title,
      completed: false,
    }));
    setModalSubtasks(clonedSubtasks);
    if (template.description) {
      setNotes((prev) => (prev ? `${prev}\n${template.description}` : template.description || ''));
    }
    if (onToast) {
      onToast(
        'Template Loaded',
        `Applied "${template.name}" with ${clonedSubtasks.length} pre-filled subtasks.`,
        'success'
      );
    }
  };

  const handleSaveCurrentAsTemplate = (name: string, description: string) => {
    saveTaskTemplate({
      name,
      description,
      defaultTitle: title,
      defaultPriority: priority,
      defaultCategory: category,
      estimatedHours,
      subtasks: modalSubtasks,
    });
    setTemplates(getSavedTaskTemplates());
    if (onToast) {
      onToast('Template Saved', `"${name}" with ${modalSubtasks.length} subtasks saved to templates library.`, 'success');
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updated = deleteTaskTemplate(templateId);
    setTemplates(updated);
    if (onToast) {
      onToast('Template Removed', 'Custom template was deleted.', 'info');
    }
  };

  // Confirmation Delete Handlers
  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    try {
      await onDeleteTask(deletingTask.id);
      setLocalTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(deletingTask.id);
        return next;
      });
      setDeletingTask(null);
      if (onToast) {
        onToast('Task Deleted', `"${deletingTask.title}" was removed from your sprint backlog.`, 'info');
      }
    } catch (err: any) {
      console.error('Delete task failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const completedCount = localTasks.filter((t) => t && t.status === 'Completed').length;
  const pendingCount = localTasks.length - completedCount;

  return (
    <div id="view-tasks" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Task Matrix</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Sprint Deliverables
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Prioritize deliverables, search & filter by project, and drag to reorder your backlog.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* CSV Export Button */}
          <button
            id="btn-export-tasks-csv"
            onClick={handleExportCSV}
            title={
              selectedTaskIds.size > 0
                ? `Export ${selectedTaskIds.size} selected tasks to CSV`
                : `Export all ${filteredTasks.length} tasks to CSV`
            }
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#0D1220] border border-white/10 text-cyan-300 hover:text-white hover:bg-white/5 transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {selectedTaskIds.size > 0
                ? `Export Selected (${selectedTaskIds.size})`
                : 'Export CSV'}
            </span>
          </button>

          {/* Task Templates Library Button */}
          <button
            id="btn-task-templates"
            type="button"
            onClick={() => setIsTemplatesModalOpen(true)}
            title="Browse, load, and manage pre-filled deliverable task templates"
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#0D1220] border border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-950/40 transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Templates</span>
          </button>

          {/* Add Task Button */}
          <button
            id="btn-add-task"
            onClick={handleOpenCreate}
            className="aura-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center space-x-1.5 shadow-sm shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Automated 24-Hour Urgent Deadline Alert Banner */}
      {dueWithin24hCount > 0 && (
        <div
          id="banner-urgent-deadline-alert"
          className="p-4 rounded-xl bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-amber-950/60 border border-amber-500/40 shadow-lg shadow-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300"
        >
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex-shrink-0 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-amber-200">
                  Urgent Deadline Alert: {dueWithin24hCount} deliverable{dueWithin24hCount > 1 ? 's' : ''} due in &lt; 24 hours!
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/30 text-amber-200 border border-amber-500/40">
                  Critical
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Immediate team action required: {dueWithin24hTasks.map((t) => `"${t.title}"`).slice(0, 2).join(', ')}
                {dueWithin24hCount > 2 ? ` and ${dueWithin24hCount - 2} more.` : '.'}
              </p>
            </div>
          </div>

          <button
            id="btn-filter-urgent-24h"
            onClick={() => {
              setStatusFilter('Due in 24h');
              setPriorityFilter('All');
              setCategoryFilter('All');
            }}
            className="self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            Filter Due in &lt;24h ({dueWithin24hCount})
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="aura-card p-4 rounded-xl border border-white/5">
          <span className="text-[11px] text-gray-400 block font-medium">
            Total Backlog
          </span>
          <span className="text-xl font-display font-bold text-white">
            {localTasks.length}
          </span>
        </div>
        <div className="aura-card p-4 rounded-xl border border-white/5">
          <span className="text-[11px] text-gray-400 block font-medium">
            Pending / In Progress
          </span>
          <span className="text-xl font-display font-bold text-amber-400">
            {pendingCount}
          </span>
        </div>
        <div className="aura-card p-4 rounded-xl border border-white/5">
          <span className="text-[11px] text-gray-400 block font-medium">
            Completed
          </span>
          <span className="text-xl font-display font-bold text-emerald-400">
            {completedCount}
          </span>
        </div>
        <div className="aura-card p-4 rounded-xl border border-white/5">
          <span className="text-[11px] text-gray-400 block font-medium">
            Completion Rate
          </span>
          <span className="text-xl font-display font-bold text-indigo-400">
            {localTasks.length > 0
              ? `${Math.round((completedCount / localTasks.length) * 100)}%`
              : '0%'}
          </span>
        </div>
      </div>

      {/* Real-Time Search and Filter Bar */}
      <div className="aura-card p-4 rounded-2xl border border-white/10 space-y-3.5 bg-[#0B0F19]/90 shadow-xl">
        {/* Row 1: Search Input + Priority Filter Dropdown + Project Filter Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Real-time Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              id="task-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title, deliverables, tags..."
              className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 pl-10 pr-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {search && (
              <button
                id="btn-clear-task-search"
                onClick={() => setSearch('')}
                title="Clear search"
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Priority Level Filter Dropdown */}
          <div className="md:col-span-3">
            <div className="relative">
              <select
                id="filter-priority-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none pr-8"
              >
                <option value="All">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
                <option value="Urgent">Urgent Priority</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400">
                <Filter className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Project Association Filter Dropdown */}
          <div className="md:col-span-3">
            <div className="relative">
              <select
                id="filter-project-select"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none pr-8"
              >
                <option value="All">All Projects</option>
                <option value="Unassigned">Unassociated / General</option>
                {safeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.clientName})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400">
                <Briefcase className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          {['All', 'Due in 24h', 'Overdue', 'Pending', 'To Do', 'In Progress', 'Completed'].map((st) => {
            const isOverdueTab = st === 'Overdue';
            const is24hTab = st === 'Due in 24h';
            const isActive = statusFilter === st;

            return (
              <button
                key={st}
                id={
                  isOverdueTab
                    ? 'filter-tasks-overdue'
                    : is24hTab
                    ? 'filter-tasks-due-24h'
                    : `filter-task-${st.toLowerCase().replace(/\s+/g, '-')}`
                }
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                  isActive
                    ? isOverdueTab
                      ? 'bg-rose-950/80 border border-rose-500/60 text-rose-300 font-semibold shadow-sm shadow-rose-500/20'
                      : is24hTab
                      ? 'bg-amber-950/80 border border-amber-500/60 text-amber-300 font-semibold shadow-sm shadow-amber-500/20'
                      : 'bg-indigo-950/70 border border-indigo-500/50 text-cyan-300 font-semibold'
                    : isOverdueTab
                    ? 'bg-rose-950/20 border border-rose-500/20 text-rose-400 hover:text-rose-300'
                    : is24hTab
                    ? 'bg-amber-950/20 border border-amber-500/20 text-amber-400 hover:text-amber-300'
                    : 'bg-[#080B14] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {isOverdueTab && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                {is24hTab && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                <span>{st}</span>
                {isOverdueTab && overdueCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-300 font-mono font-bold">
                    {overdueCount}
                  </span>
                )}
                {is24hTab && dueWithin24hCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-amber-300 font-mono font-bold">
                    {dueWithin24hCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Row 3: Priority Quick Filter Chips & Category Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-white/5">
          {/* Priority Quick Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-gray-400 flex items-center space-x-1 mr-1">
              <Filter className="w-3 h-3 text-cyan-400" />
              <span>Priority:</span>
            </span>
            {[
              { label: 'All', value: 'All' },
              { label: 'High', value: 'High' },
              { label: 'Medium', value: 'Medium' },
              { label: 'Low', value: 'Low' },
              { label: 'Urgent', value: 'Urgent' },
            ].map((p) => {
              const isPActive = priorityFilter === p.value;
              return (
                <button
                  key={p.value}
                  id={`filter-priority-${p.value.toLowerCase()}`}
                  onClick={() => setPriorityFilter(p.value)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer border ${
                    isPActive
                      ? 'bg-indigo-500/20 border-indigo-400 text-cyan-200 font-bold shadow-sm'
                      : 'border-white/5 bg-[#080B14] text-gray-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Active Filter Info, Sort Selector & Reset Button */}
          <div className="flex items-center space-x-3 text-xs flex-wrap gap-y-2">
            <span className="text-gray-400 text-[11px]">
              Showing <span className="text-white font-semibold">{sortedAndFilteredTasks.length}</span> of {localTasks.length} tasks
            </span>

            {/* Task Sorting Dropdown */}
            <div className="flex items-center space-x-1 pl-2 border-l border-white/10 text-xs">
              <span className="text-gray-400 text-[11px]">Sort:</span>
              <select
                id="select-task-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#080B14] border border-white/10 rounded-lg px-2 py-0.5 text-[11px] text-cyan-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
              >
                <option value="custom">Backlog Order</option>
                <option value="priority">Priority — High to Low</option>
                <option value="deadline">Deadline — Upcoming First</option>
                <option value="title">Alphabetical — A to Z</option>
              </select>
            </div>

            {isAnyFilterActive && (
              <button
                id="btn-reset-task-filters"
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
            {sortedAndFilteredTasks.length > 0 && (
              <button
                id="btn-toggle-select-all"
                onClick={handleToggleSelectAll}
                className="text-[11px] font-medium text-gray-400 hover:text-cyan-300 cursor-pointer flex items-center space-x-1 pl-2 border-l border-white/10"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>
                  {selectedTaskIds.size === sortedAndFilteredTasks.length
                    ? 'Deselect All'
                    : `Select All (${sortedAndFilteredTasks.length})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AURA Intelligent Task Recommendation Banner */}
      {intelligentRecommendation && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/25 to-[#080B14] border border-cyan-500/30 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400">
                  AURA Intelligent Recommendation
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full font-mono font-semibold bg-white/5 text-gray-300 border border-white/10">
                  {intelligentRecommendation.badge}
                </span>
              </div>
              <p className="text-xs text-gray-200 mt-0.5">
                {intelligentRecommendation.message}
              </p>
            </div>
          </div>
          {intelligentRecommendation.task && (
            <button
              onClick={() => {
                const el = document.getElementById(`task-card-${intelligentRecommendation.task.id}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              Focus Task →
            </button>
          )}
        </div>
      )}

      {/* Task List with Drag and Drop Reordering */}
      {sortedAndFilteredTasks.length === 0 ? (
        <div className="aura-card py-16 text-center rounded-2xl border border-dashed border-white/10 p-6 space-y-3">
          <CheckSquare className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No tasks found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {isAnyFilterActive
              ? 'No deliverables match your search and filter criteria. Try resetting filters.'
              : 'Add your first task to plan work sprints and drag to prioritize backlog.'}
          </p>
          {isAnyFilterActive ? (
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-cyan-300 cursor-pointer transition-colors border border-white/10"
            >
              Reset All Filters
            </button>
          ) : (
            <button
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 rounded-xl aura-gradient-btn text-xs font-semibold text-white cursor-pointer"
            >
              + Add First Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedAndFilteredTasks.map((t, index) => {
            const isCompleted = t.status === 'Completed';
            const deadlineTime = t.deadline ? new Date(`${t.deadline}T23:59:59`).getTime() : 0;
            const isOverdue = !!t.deadline && !isCompleted && deadlineTime < Date.now();
            const isDueSoon = isTaskDueWithin24h(t);
            const hoursUntilDeadline = getHoursLeft(t);
            const daysOverdue = isOverdue
              ? Math.max(1, Math.ceil((Date.now() - deadlineTime) / 86400000))
              : 0;
            const isSelected = selectedTaskIds.has(t.id);
            const isBeingDragged = draggedTaskId === t.id;
            const isDragOver = dragOverTaskId === t.id;

            return (
              <div
                key={t.id}
                id={`task-card-${t.id}`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, t.id)}
                onDragOver={(e) => handleDragOver(e, t.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, t.id)}
                onDragEnd={handleDragEnd}
                className={`aura-card p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 group ${
                  isBeingDragged
                    ? 'opacity-40 border-dashed border-indigo-500 scale-[0.99] bg-[#080B14]'
                    : isDragOver
                    ? 'border-t-2 border-t-cyan-400 border-indigo-500/60 bg-cyan-950/20 shadow-lg'
                    : isSelected
                    ? 'border-cyan-500/50 bg-cyan-950/15 shadow-sm shadow-cyan-950/40'
                    : isCompleted
                    ? 'border-white/5 opacity-75 bg-[#080B14]/40'
                    : isOverdue
                    ? 'border-rose-500/50 bg-rose-950/20 shadow-sm shadow-rose-950/30 hover:border-rose-400'
                    : isDueSoon
                    ? 'border-amber-500/40 bg-amber-950/15 shadow-sm shadow-amber-950/30 hover:border-amber-400'
                    : 'border-white/5 hover:border-indigo-500/30'
                }`}
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {/* Drag-and-Drop Grip Handle */}
                  <div
                    id={`task-drag-handle-${t.id}`}
                    title="Drag to reorder deliverable backlog"
                    className="mt-0.5 text-gray-500 hover:text-cyan-400 cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors p-0.5"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Reorder Up/Down buttons for touch or keyboard accessibility */}
                  <div className="hidden sm:flex flex-col space-y-0.5 mt-0.5 flex-shrink-0">
                    <button
                      type="button"
                      id={`btn-move-task-up-${t.id}`}
                      disabled={index === 0}
                      onClick={(e) => handleMoveTask(t.id, 'up', e)}
                      title="Move up in backlog"
                      className="text-gray-500 hover:text-white disabled:opacity-20 disabled:hover:text-gray-500 p-0.5 cursor-pointer"
                    >
                      <ArrowUp className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      id={`btn-move-task-down-${t.id}`}
                      disabled={index === filteredTasks.length - 1}
                      onClick={(e) => handleMoveTask(t.id, 'down', e)}
                      title="Move down in backlog"
                      className="text-gray-500 hover:text-white disabled:opacity-20 disabled:hover:text-gray-500 p-0.5 cursor-pointer"
                    >
                      <ArrowDown className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Selection Checkbox for CSV Export */}
                  <button
                    type="button"
                    title={isSelected ? 'Deselect task' : 'Select task for export'}
                    onClick={(e) => handleToggleSelectTask(t.id, e)}
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 cursor-pointer flex-shrink-0 ${
                      isSelected
                        ? 'bg-cyan-500 border-cyan-400 text-black shadow-sm'
                        : 'border-white/20 hover:border-cyan-400 bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  {/* Task Completion Toggle Button with checkmark transition */}
                  <button
                    id={`task-complete-btn-${t.id}`}
                    type="button"
                    onClick={() => onToggleComplete(t.id)}
                    title={isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}
                    className={`relative mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300 ease-out cursor-pointer flex-shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/40 scale-105'
                        : isOverdue
                        ? 'border-rose-400 hover:bg-rose-950/40'
                        : isDueSoon
                        ? 'border-amber-400 hover:bg-amber-950/40'
                        : 'border-white/20 hover:border-cyan-400 hover:bg-white/5'
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 transition-all duration-300 transform ${
                        isCompleted ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-45'
                      }`}
                      strokeWidth={3}
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      {/* Task Title with animated strike-through transition */}
                      <div className="relative inline-flex items-center max-w-full overflow-hidden">
                        <span
                          className={`text-xs font-semibold transition-colors duration-300 ${
                            isCompleted
                              ? 'text-gray-500'
                              : isOverdue
                              ? 'text-white group-hover:text-rose-200'
                              : isDueSoon
                              ? 'text-white group-hover:text-amber-200'
                              : 'text-white group-hover:text-cyan-300'
                          }`}
                        >
                          {t.title}
                        </span>
                        <span
                          aria-hidden="true"
                          className={`absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-gradient-to-r from-emerald-400 via-teal-400 to-gray-500 rounded-full transition-all duration-300 ease-out pointer-events-none ${
                            isCompleted ? 'w-full opacity-100' : 'w-0 opacity-0'
                          }`}
                        />
                      </div>

                      {/* Color-coded Priority Toggle Dropdown */}
                      {renderPriorityBadge(t.priority, t)}

                      {/* Project Badge */}
                      {t.projectName && (
                        <span
                          id={`task-project-badge-${t.id}`}
                          className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 truncate max-w-[160px] flex items-center space-x-1"
                        >
                          <Briefcase className="w-2.5 h-2.5 opacity-70" />
                          <span>{t.projectName}</span>
                        </span>
                      )}

                      {/* Category Badge */}
                      {t.category && (
                        <span
                          id={`task-category-${t.id}`}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                            t.category === 'Urgent'
                              ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                              : t.category === 'Strategic'
                              ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                              : t.category === 'Routine'
                              ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                              : t.category === 'Client Deliverable'
                              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                              : 'bg-white/5 text-gray-300 border-white/10'
                          }`}
                        >
                          {t.category}
                        </span>
                      )}

                      {/* Custom Label Tag */}
                      {t.label && (
                        <span
                          id={`task-label-${t.id}`}
                          className="inline-flex items-center space-x-0.5 text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-indigo-300 border border-indigo-500/30 font-mono"
                        >
                          <span>#{t.label}</span>
                        </span>
                      )}

                      {/* Workflow Dependency Blocking Warning Badge with Tooltip */}
                      <TaskBlockingBadge
                        task={t}
                        allTasks={localTasks}
                        onClearBlocking={handleClearBlocking}
                      />

                      {/* Urgent <24h Alert Warning Badge */}
                      {isDueSoon && (
                        <span
                          id={`task-due-soon-indicator-${t.id}`}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide bg-amber-950/90 text-amber-300 border border-amber-500/60 shadow-sm shadow-amber-500/20 animate-pulse"
                          title={`Deadline approaching in <24h on ${t.deadline}`}
                        >
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Due Soon ({hoursUntilDeadline}h)</span>
                        </span>
                      )}

                      {/* Overdue Visual Warning Indicator Badge */}
                      {isOverdue && (
                        <span
                          id={`task-warning-indicator-${t.id}`}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-rose-950/90 text-rose-300 border border-rose-500/60 shadow-sm shadow-rose-500/20 animate-pulse"
                          title={`Deadline passed on ${t.deadline}. Urgent deliverable attention required.`}
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>Overdue ({daysOverdue}d)</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-[10px] text-gray-400 mt-1 flex-wrap gap-y-1">
                      {/* Interactive Due Date Quick-Picker */}
                      {renderDueDateQuickPicker(t)}

                      <span className="text-gray-500">
                        Status: <span className="text-gray-300 font-medium">{t.status}</span>
                      </span>
                    </div>

                    {/* Inline Task Description Section (View & Edit Modes) */}
                    <div className="mt-2 text-xs" onClick={(e) => e.stopPropagation()}>
                      {editingDescriptionTaskId === t.id ? (
                        <div
                          id={`edit-desc-container-${t.id}`}
                          className="p-3 rounded-xl bg-[#080B14] border border-cyan-500/50 shadow-xl space-y-2.5 animate-in fade-in duration-150"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-cyan-300 flex items-center space-x-1.5">
                              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Edit Deliverable Description</span>
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              ⌘+Enter to save • Esc to cancel
                            </span>
                          </div>

                          <textarea
                            id={`textarea-task-desc-${t.id}`}
                            value={draftDescription}
                            onChange={(e) => setDraftDescription(e.target.value)}
                            onKeyDown={(e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveInlineDescription(t);
                              } else if (e.key === 'Escape') {
                                handleCancelEditingDescription();
                              }
                            }}
                            rows={3}
                            placeholder="Add scope details, deliverable criteria, client specifications, or notes..."
                            className="w-full bg-[#05070D] border border-white/15 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors resize-y min-h-[64px]"
                            autoFocus
                          />

                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={handleCancelEditingDescription}
                              className="px-2.5 py-1 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isSavingDescription}
                              onClick={() => handleSaveInlineDescription(t)}
                              className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                            >
                              {isSavingDescription ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  <span>Save</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : t.description || t.notes ? (
                        <div className="group/desc relative bg-white/[0.02] hover:bg-white/[0.04] p-2.5 rounded-xl border border-white/5 transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <p className="whitespace-pre-wrap leading-relaxed text-gray-300 font-sans text-xs">
                              {t.description || t.notes}
                            </p>
                            <button
                              type="button"
                              id={`btn-edit-desc-${t.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditingDescription(t);
                              }}
                              className="opacity-0 group-hover/desc:opacity-100 px-2 py-0.5 rounded bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 text-[10px] font-semibold flex items-center space-x-1 transition-all cursor-pointer shrink-0"
                              title="Edit description inline (⌘+Enter to save)"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id={`btn-add-desc-${t.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditingDescription(t);
                          }}
                          className="text-[11px] text-gray-500 hover:text-cyan-300 flex items-center space-x-1.5 py-1 px-2.5 rounded-lg border border-dashed border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.02] transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>+ Add description / notes...</span>
                        </button>
                      )}
                    </div>

                    {/* Integrated Task Timer, Estimated vs Actual Display & Financial Sync */}
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      {/* Left: Estimated vs Actual Hours with Visual Progress Bar */}
                      <div className="flex-1 min-w-[190px] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center space-x-1.5 text-gray-300">
                            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="font-medium text-gray-300">
                              Estimated vs Actual:{' '}
                              <strong className="text-white font-mono font-bold">
                                {Number(t.actualHours) || 0}h
                              </strong>{' '}
                              /{' '}
                              <span className="text-gray-300 font-mono">
                                {Number(t.estimatedHours) || 4}h est
                              </span>
                            </span>
                          </span>
                          {(Number(t.actualHours) || 0) > (Number(t.estimatedHours) || 4) ? (
                            <span className="text-[10px] text-amber-400 font-semibold font-mono bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-500/40 flex items-center space-x-1 shadow-sm">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                              <span>+{(Number(t.actualHours) - (Number(t.estimatedHours) || 4)).toFixed(1)}h over budget</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-cyan-300/90 font-mono font-medium">
                              {Math.round(((Number(t.actualHours) || 0) / (Number(t.estimatedHours) || 4)) * 100)}% consumed
                            </span>
                          )}
                        </div>

                        {/* High-Contrast Progress Bar */}
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/5">
                          <div
                            style={{
                              width: `${Math.min(100, Math.round(((Number(t.actualHours) || 0) / (Number(t.estimatedHours) || 4)) * 100))}%`,
                            }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              (Number(t.actualHours) || 0) > (Number(t.estimatedHours) || 4)
                                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Right: Stopwatch Timer, Quick Log Buttons, and Project Financial Sync */}
                      <div className="flex items-center space-x-1.5 shrink-0 flex-wrap">
                        {activeTimerTaskId === t.id ? (
                          <div className="flex items-center space-x-1 bg-cyan-950/90 border border-cyan-500/60 rounded-xl px-2.5 py-1 shadow-sm shadow-cyan-500/30 animate-fade-in">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping mr-1" />
                            <span className="font-mono font-bold text-xs text-cyan-200 tracking-wider">
                              {formatTimerDisplay(timerElapsedSeconds)}
                            </span>
                            <button
                              type="button"
                              onClick={handleTogglePauseTimer}
                              title={isTimerPaused ? 'Resume Timer' : 'Pause Timer'}
                              className="p-1 rounded-lg text-cyan-300 hover:text-white hover:bg-cyan-500/20 transition-colors cursor-pointer ml-1"
                            >
                              {isTimerPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStopAndSaveTimer(t)}
                              title="Stop & Log Time to Task & Project Financials"
                              className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-500/30 transition-colors cursor-pointer"
                            >
                              <Square className="w-3 h-3 fill-current" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartTimer(t.id)}
                            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 text-[11px] font-semibold text-gray-300 flex items-center space-x-1.5 transition-all cursor-pointer"
                          >
                            <Play className="w-3 h-3 text-cyan-400" />
                            <span>Start Timer</span>
                          </button>
                        )}

                        {/* Quick Log (+15m, +30m, +1h) */}
                        <div className="flex items-center space-x-0.5 bg-[#080B14] border border-white/10 rounded-lg p-0.5 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() => handleQuickAddTime(t, 0.25)}
                            title="Log 15 minutes"
                            className="px-1.5 py-0.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            +15m
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAddTime(t, 0.5)}
                            title="Log 30 minutes"
                            className="px-1.5 py-0.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            +30m
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAddTime(t, 1)}
                            title="Log 1 hour"
                            className="px-1.5 py-0.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            +1h
                          </button>
                        </div>

                        {/* Project Financials Sync Button */}
                        {t.projectId && (
                          <button
                            type="button"
                            onClick={() => syncTaskHoursToProjectFinancials(t, Number(t.actualHours) || 0)}
                            title={`Sync to project financials: $${Math.round((Number(t.actualHours) || 0) * (Number(t.hourlyRate) || 85))} total labor expense`}
                            className="p-1 text-emerald-400 hover:text-emerald-200 bg-emerald-950/40 border border-emerald-500/30 rounded-lg hover:bg-emerald-950/80 transition-all cursor-pointer"
                          >
                            <CircleDollarSign className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Nested Subtasks Checkbox List & Percentage Completion Progress Bar */}
                    <TaskSubtasksSection
                      task={t}
                      onToggleSubtask={handleToggleSubtask}
                      onAddSubtask={handleAddSubtaskToCard}
                      onDeleteSubtask={handleDeleteSubtaskFromCard}
                      onCompleteParentTask={onToggleComplete}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    id={`btn-edit-task-${t.id}`}
                    onClick={() => handleOpenEdit(t)}
                    title="Edit Task"
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {/* Delete Task Button - opens confirmation dialog to prevent accidental deletion */}
                  <button
                    id={`btn-delete-task-${t.id}`}
                    onClick={() => setDeletingTask(t)}
                    title="Delete Task"
                    className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Task Modal with Priority Level Selector (High, Medium, Low) */}
      {isModalOpen && (
        <div
          id="modal-add-task"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) {
              setIsModalOpen(false);
              setEditingTask(null);
            }
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="aura-card max-w-lg w-full p-6 rounded-2xl border border-indigo-500/30 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                  <span>{editingTask ? `Edit Task: ${editingTask.title}` : 'Add Deliverable Task'}</span>
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Configure title, priority level (High, Medium, Low), category, and project association.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTask(null);
                }}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Load Task Template Selector */}
              <div className="p-3 rounded-xl bg-[#080B14] border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Task Templates</span>
                    <span className="text-[10px] text-gray-400 block">Quickly load pre-filled subtask structures</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    id="select-load-template"
                    onChange={(e) => {
                      const found = templates.find((tmpl) => tmpl.id === e.target.value);
                      if (found) handleApplyTemplate(found);
                    }}
                    defaultValue=""
                    className="bg-[#0D1220] border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-cyan-300 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[210px]"
                  >
                    <option value="" disabled>Choose template...</option>
                    {templates.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name} ({tmpl.subtasks.length} subtasks)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsTemplatesModalOpen(true)}
                    title="Browse Template Library"
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Task Title <span className="text-rose-400">*</span>
                </label>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Conduct user review on staging branch"
                  className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Priority Level Selector (High, Medium, Low) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-300">
                    Priority Level <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400">
                    Current: <span className="text-cyan-300 font-bold">{priority}</span>
                  </span>
                </div>

                {/* Interactive Priority Selector Pill Grid */}
                <div className="grid grid-cols-4 gap-2" id="task-priority-select">
                  {[
                    {
                      level: 'Low',
                      icon: <ArrowDown className="w-3 h-3" />,
                      color: 'border-slate-600 bg-slate-800/90 text-slate-200 ring-2 ring-slate-400/40',
                      btnId: 'task-priority-low',
                    },
                    {
                      level: 'Medium',
                      icon: <Minus className="w-3 h-3" />,
                      color: 'border-cyan-500/60 bg-cyan-950/70 text-cyan-200 ring-2 ring-cyan-500/40',
                      btnId: 'task-priority-medium',
                    },
                    {
                      level: 'High',
                      icon: <ArrowUp className="w-3 h-3" />,
                      color: 'border-amber-500/60 bg-amber-950/70 text-amber-200 ring-2 ring-amber-500/40',
                      btnId: 'task-priority-high',
                    },
                    {
                      level: 'Urgent',
                      icon: <Flame className="w-3 h-3" />,
                      color: 'border-rose-500/60 bg-rose-950/70 text-rose-200 ring-2 ring-rose-500/40',
                      btnId: 'task-priority-urgent',
                    },
                  ].map(({ level, icon, color, btnId }) => {
                    const isSelected = priority === level;
                    return (
                      <button
                        key={level}
                        id={btnId}
                        type="button"
                        onClick={() => setPriority(level as PriorityLevel)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                          isSelected
                            ? `${color} shadow-md`
                            : 'border-white/5 bg-[#080B14] text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          {icon}
                          <span>{level}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Synchronized accessible select dropdown */}
                <select
                  id="task-priority-dropdown"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="sr-only"
                  aria-label="Priority Level"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              {/* Associated Project & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Associated Project
                  </label>
                  <select
                    id="task-project-select"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">(No specific project)</option>
                    {safeProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.clientName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    id="task-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Blocking Prerequisite Dependency */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <label className="block text-xs font-semibold text-gray-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Blocking Prerequisite Dependency (Optional)</span>
                  </span>
                  {blockingTaskId && (
                    <button
                      type="button"
                      onClick={() => setBlockingTaskId('')}
                      className="text-[10px] text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Clear dependency
                    </button>
                  )}
                </label>
                <select
                  id="task-blocking-select"
                  value={blockingTaskId}
                  onChange={(e) => setBlockingTaskId(e.target.value)}
                  className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="">(No blocking dependency - Task is ready to start)</option>
                  {localTasks
                    .filter((other) => (!editingTask || other.id !== editingTask.id))
                    .map((otherTask) => (
                      <option key={otherTask.id} value={otherTask.id}>
                        [{otherTask.status}] {otherTask.title} {otherTask.projectName ? `• ${otherTask.projectName}` : ''}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-gray-400">
                  {blockingTaskId ? (
                    <span className="text-amber-300 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400 inline shrink-0" />
                      <span>
                        This task will display a warning badge and tooltip showing the blocking task until it reaches 'Completed'.
                      </span>
                    </span>
                  ) : (
                    'Link another deliverable task that must be completed before work on this task can begin.'
                  )}
                </p>
              </div>

              {/* Target Deadline with quick shortcut presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-300">
                    Target Deadline <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    {[
                      { label: 'Today', days: 0 },
                      { label: 'Tomorrow', days: 1 },
                      { label: '+3 Days', days: 3 },
                      { label: '+1 Wk', days: 7 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          const d = new Date(Date.now() + preset.days * 86400000);
                          setDeadline(d.toISOString().split('T')[0]);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-cyan-300 font-medium cursor-pointer transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  id="task-deadline-input"
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Category and Label Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Category Workflow
                  </label>
                  <select
                    id="task-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="Strategic">Strategic</option>
                    <option value="Routine">Routine</option>
                    <option value="Client Deliverable">Client Deliverable</option>
                    <option value="Operations">Operations</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Label Tag (Optional)
                  </label>
                  <input
                    id="task-label-input"
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Design, API, Review, Security"
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Time Estimation, Logged Hours & Hourly Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Estimated (Hours)
                  </label>
                  <input
                    id="task-estimated-hours-input"
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value) || 0)}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl py-1.5 px-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Actual Logged (Hours)
                  </label>
                  <input
                    id="task-actual-hours-input"
                    type="number"
                    min="0"
                    step="0.25"
                    value={actualHours}
                    onChange={(e) => setActualHours(Number(e.target.value) || 0)}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl py-1.5 px-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Rate ($/hour)
                  </label>
                  <input
                    id="task-hourly-rate-input"
                    type="number"
                    min="0"
                    step="5"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                    className="w-full bg-[#080B14] border border-white/10 rounded-xl py-1.5 px-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Deliverable Subtasks Builder */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <ListChecks className="w-4 h-4 text-indigo-400" />
                    <label className="text-xs font-semibold text-gray-200">
                      Subtasks Breakdown ({modalSubtasks.length})
                    </label>
                  </div>
                  {modalSubtasks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsSaveTemplateModalOpen(true)}
                      className="inline-flex items-center space-x-1 text-[11px] text-indigo-300 hover:text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-3 h-3 text-indigo-400" />
                      <span>Save as Template</span>
                    </button>
                  )}
                </div>

                {/* Subtasks List */}
                {modalSubtasks.length > 0 ? (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {modalSubtasks.map((st, idx) => (
                      <div
                        key={st.id || idx}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[#080B14] border border-white/5 text-xs group"
                      >
                        <label className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={st.completed}
                            onChange={() => {
                              setModalSubtasks((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, completed: !item.completed } : item
                                )
                              );
                            }}
                            className="rounded border-white/20 text-indigo-600 focus:ring-0 w-3.5 h-3.5 bg-black cursor-pointer"
                          />
                          <span
                            className={`truncate text-xs ${
                              st.completed ? 'line-through text-gray-500' : 'text-gray-200'
                            }`}
                          >
                            {st.title}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setModalSubtasks((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="text-gray-500 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 italic">
                    No subtasks yet. Add checklist steps below or select a template above.
                  </p>
                )}

                {/* Add Subtask Step Input */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    value={newModalSubtaskInput}
                    onChange={(e) => setNewModalSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newModalSubtaskInput.trim()) {
                          setModalSubtasks((prev) => [
                            ...prev,
                            {
                              id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                              title: newModalSubtaskInput.trim(),
                              completed: false,
                            },
                          ]);
                          setNewModalSubtaskInput('');
                        }
                      }
                    }}
                    placeholder="Add step (e.g. 'Setup database migrations') & press Enter..."
                    className="flex-1 bg-[#080B14] border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    disabled={!newModalSubtaskInput.trim()}
                    onClick={() => {
                      if (newModalSubtaskInput.trim()) {
                        setModalSubtasks((prev) => [
                          ...prev,
                          {
                            id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                            title: newModalSubtaskInput.trim(),
                            completed: false,
                          },
                        ]);
                        setNewModalSubtaskInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                  >
                    Add Step
                  </button>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Scope & Deliverable Checklist (Optional)
                </label>
                <textarea
                  id="task-notes-input"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Checklist items, PR links, verification notes..."
                  className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  id="btn-cancel-task"
                  disabled={isSaving}
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-task"
                  disabled={isSaving}
                  className="aura-gradient-btn px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-md flex items-center space-x-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Task...</span>
                    </>
                  ) : (
                    <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Before Deleting Task (Prevents Accidental Removals) */}
      {deletingTask && (
        <div
          id="modal-delete-task"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="aura-card max-w-md w-full p-6 rounded-2xl border border-rose-500/30 bg-[#0B0F19] space-y-4 shadow-2xl shadow-rose-950/40">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-950/70 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0 shadow-md">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-white tracking-tight">
                    Delete Task Confirmation
                  </h3>
                  <p className="text-xs text-rose-400 font-medium mt-0.5">
                    Irreversible Backlog Action
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingTask(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description & Preview */}
            <div className="space-y-3 py-1 text-xs">
              <p className="text-gray-300">
                Are you sure you want to permanently delete this task? It will be removed from your sprint backlog and associated project progress metrics will be recalculated.
              </p>

              {/* Task Details Preview Card */}
              <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs truncate max-w-[240px]">
                    "{deletingTask.title}"
                  </span>
                  {renderPriorityBadge(deletingTask.priority, `preview-${deletingTask.id}`)}
                </div>
                <div className="flex items-center space-x-3 text-[11px] text-gray-400">
                  {deletingTask.projectName && (
                    <span className="flex items-center space-x-1">
                      <Briefcase className="w-3 h-3 text-indigo-400" />
                      <span>{deletingTask.projectName}</span>
                    </span>
                  )}
                  {deletingTask.deadline && (
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>Due {deletingTask.deadline}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-white/5">
              <button
                type="button"
                id="btn-cancel-delete-task"
                disabled={isDeleting}
                onClick={() => setDeletingTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-task"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 transition-all flex items-center space-x-1.5 shadow-lg shadow-rose-600/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Task...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Templates Modal */}
      <TaskTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        templates={templates}
        onSelectTemplate={(tmpl) => {
          handleApplyTemplate(tmpl);
          setIsModalOpen(true);
        }}
        onDeleteTemplate={handleDeleteTemplate}
      />

      {/* Save Current Task as Template Modal */}
      <SaveTemplateModal
        isOpen={isSaveTemplateModalOpen}
        onClose={() => setIsSaveTemplateModalOpen(false)}
        subtasks={modalSubtasks}
        defaultTitle={title}
        defaultPriority={priority}
        defaultCategory={category}
        estimatedHours={estimatedHours}
        onSaveTemplate={handleSaveCurrentAsTemplate}
      />
    </div>
  );
};
