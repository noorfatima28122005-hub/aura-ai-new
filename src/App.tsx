import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  WorkspaceData,
  NavigationTab,
  Client,
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
  Invoice,
  AiApprovalItem,
  InvoiceStatus,
  Lead,
  UnifiedMessage,
  FollowUpItem,
  Proposal,
  Contract,
  Service,
  PortfolioItem,
  BrandProfile,
  DocumentItem,
} from './types';
import { emptyWorkspace, sampleBusinessWorkspace } from './data/initialData';
import { AuthScreen } from './components/AuthScreen';
import { AuraOrb } from './components/AuraOrb';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ToastNotification, ToastMessage } from './components/common/ToastNotification';
import { GlobalQuickAddBar } from './components/common/GlobalQuickAddBar';
import { Mic, Sparkles } from 'lucide-react';

export type AuthState = 'loading' | 'unauthenticated' | 'authenticated';

// Views
import { OverviewView } from './components/views/OverviewView';
import { ClientsView } from './components/views/ClientsView';
import { ProjectsView } from './components/views/ProjectsView';
import { TasksView } from './components/views/TasksView';
import { AskAuraView } from './components/views/AskAuraView';
import { VoiceConversation } from './components/VoiceConversation';
import { ApprovalCenterView } from './components/views/ApprovalCenterView';
import { ConnectedAccountsView } from './components/views/ConnectedAccountsView';
import { FinanceView } from './components/views/FinanceView';
import { InvoicesView } from './components/views/InvoicesView';
import { AutomationsView } from './components/views/AutomationsView';
import { AiInsightsView } from './components/views/AiInsightsView';
import { CalendarView } from './components/views/CalendarView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { BusinessBrainView } from './components/views/BusinessBrainView';
import { LeadsView } from './components/views/LeadsView';
import { UnifiedInboxView } from './components/views/UnifiedInboxView';
import { EmailView } from './components/views/EmailView';
import { FollowUpsView } from './components/views/FollowUpsView';
import { ProposalsView } from './components/views/ProposalsView';
import { ContractsView } from './components/views/ContractsView';
import { ServicesView } from './components/views/ServicesView';
import { PortfolioView } from './components/views/PortfolioView';
import { DocumentCenterView } from './components/views/DocumentCenterView';
import { AuditLogView } from './components/views/AuditLogView';
import { FeatureCenterView } from './components/views/FeatureCenterView';
import { ProductTourModal } from './components/common/ProductTourModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';

// Backend API
import {
  apiFetchWorkspace,
  apiResetWorkspace,
  apiCreateClient,
  apiUpdateClient,
  apiDeleteClient,
  apiCreateProject,
  apiUpdateProject,
  apiDeleteProject,
  apiCreateTask,
  apiUpdateTask,
  apiDeleteTask,
  apiCreateInvoice,
  apiUpdateInvoice,
  apiDeleteInvoice,
  apiGetMe,
  apiLogout,
  apiConnectIntegration,
  apiDisconnectIntegration,
  apiSyncIntegration,
  getFriendlyErrorMessage,
} from './lib/api';

import {
  saveWorkspaceToFirestore,
  loadWorkspaceFromFirestore,
  signOutFirebase,
  testFirestoreConnection,
  auth,
  onAuthStateChanged,
} from './lib/firebase';
import { ClientProjectIntake } from './components/ClientProjectIntake';

const STORAGE_KEY_USER = 'aura_user_profile';
const STORAGE_KEY_DATA = 'aura_workspace_data';
const STORAGE_KEY_IS_SAMPLE = 'aura_is_sample_dataset';

export default function App() {
  // 1. Explicit Authentication State: loading | unauthenticated | authenticated
  const [authStatus, setAuthStatus] = useState<AuthState>('loading');

  // 2. User State - initialized once verified
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    const token = localStorage.getItem('aura_auth_token');
    if (saved && token) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // 2. Is Sample Dataset state
  const [isSampleData, setIsSampleData] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_IS_SAMPLE);
    return saved !== null ? JSON.parse(saved) : true;
  });

  // 3. Workspace Data State
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...sampleBusinessWorkspace,
          ...parsed,
          clients: Array.isArray(parsed.clients) ? parsed.clients : sampleBusinessWorkspace.clients,
          projects: Array.isArray(parsed.projects) ? parsed.projects : sampleBusinessWorkspace.projects,
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks : sampleBusinessWorkspace.tasks,
          invoices: Array.isArray(parsed.invoices) ? parsed.invoices : sampleBusinessWorkspace.invoices,
          approvals: Array.isArray(parsed.approvals) ? parsed.approvals : sampleBusinessWorkspace.approvals,
          connectedAccounts: Array.isArray(parsed.connectedAccounts) ? parsed.connectedAccounts : sampleBusinessWorkspace.connectedAccounts,
          automations: Array.isArray(parsed.automations) ? parsed.automations : sampleBusinessWorkspace.automations,
          activityLogs: Array.isArray(parsed.activityLogs) ? parsed.activityLogs : sampleBusinessWorkspace.activityLogs,
          leads: Array.isArray(parsed.leads) ? parsed.leads : sampleBusinessWorkspace.leads,
          proposals: Array.isArray(parsed.proposals) ? parsed.proposals : sampleBusinessWorkspace.proposals,
          contracts: Array.isArray(parsed.contracts) ? parsed.contracts : sampleBusinessWorkspace.contracts,
          services: Array.isArray(parsed.services) ? parsed.services : sampleBusinessWorkspace.services,
          portfolio: Array.isArray(parsed.portfolio) ? parsed.portfolio : sampleBusinessWorkspace.portfolio,
          brandProfile: parsed.brandProfile || sampleBusinessWorkspace.brandProfile,
          messages: Array.isArray(parsed.messages) ? parsed.messages : sampleBusinessWorkspace.messages,
          followUps: Array.isArray(parsed.followUps) ? parsed.followUps : sampleBusinessWorkspace.followUps,
          documents: Array.isArray(parsed.documents) ? parsed.documents : sampleBusinessWorkspace.documents,
          knowledgeBase: Array.isArray(parsed.knowledgeBase) ? parsed.knowledgeBase : sampleBusinessWorkspace.knowledgeBase,
          goals: Array.isArray(parsed.goals) ? parsed.goals : sampleBusinessWorkspace.goals,
        };
      } catch (e) {
        // fallback
      }
    }
    return sampleBusinessWorkspace;
  });

  // 4. Navigation & UI state
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [projectRiskFilter, setProjectRiskFilter] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const isMicActive = isVoiceModalOpen && voiceState === 'listening';
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isProductTourOpen, setIsProductTourOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);

  // Validate connection to Firestore on initial boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // 5. Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    const newToast: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Global Keyboard Shortcuts:
  // - Cmd/Ctrl + K: Global Search Modal
  // - Cmd/Ctrl + Shift + K: VoiceConversation modal
  // - Cmd/Ctrl + Shift + A: Quick Add modal (Tasks & Leads)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;
      const isKeyK = e.key === 'k' || e.key === 'K' || e.code === 'KeyK';
      const isKeyA = e.key === 'a' || e.key === 'A' || e.code === 'KeyA';

      // Cmd/Ctrl + K without Shift => Global Search
      if (isCmdOrCtrl && !isShift && isKeyK) {
        e.preventDefault();
        e.stopPropagation();
        setIsGlobalSearchOpen((prev) => !prev);
        return;
      }

      // Cmd/Ctrl + Shift + K => Voice Modal
      if (isCmdOrCtrl && isShift && isKeyK) {
        e.preventDefault();
        e.stopPropagation();
        setIsVoiceModalOpen((prev) => !prev);
        return;
      }

      // Cmd/Ctrl + Shift + A => Quick Add
      if (isCmdOrCtrl && isShift && isKeyA) {
        e.preventDefault();
        e.stopPropagation();
        setIsQuickAddOpen((prev) => !prev);
        return;
      }

      // Close modal on Escape
      if (e.key === 'Escape') {
        if (isVoiceModalOpen) setIsVoiceModalOpen(false);
        if (isQuickAddOpen) setIsQuickAddOpen(false);
        if (isGlobalSearchOpen) setIsGlobalSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [isVoiceModalOpen, isQuickAddOpen, isGlobalSearchOpen]);

  // Automated 24h Deadline Alert Notification System
  const alertedDeadlineTaskIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!workspaceData.tasks || workspaceData.tasks.length === 0) return;

    const checkUrgentDeadlines = () => {
      const now = Date.now();
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;

      workspaceData.tasks.forEach((task) => {
        if (!task.deadline || task.status === 'Completed') return;
        const deadlineTime = new Date(`${task.deadline}T23:59:59`).getTime();
        const diff = deadlineTime - now;

        // Deadline is within next 24 hours (and not past/overdue)
        if (diff > 0 && diff <= twentyFourHoursMs) {
          if (!alertedDeadlineTaskIdsRef.current.has(task.id)) {
            alertedDeadlineTaskIdsRef.current.add(task.id);
            const hoursLeft = Math.max(1, Math.ceil(diff / (1000 * 60 * 60)));
            addToast(
              '⚠️ Urgent Deadline Alert (<24h)',
              `Deliverable "${task.title}" is due in ${hoursLeft} hour${hoursLeft === 1 ? '' : 's'} (${task.deadline})! Review deliverable now.`,
              'info'
            );
          }
        }
      });
    };

    checkUrgentDeadlines();
    const interval = setInterval(checkUrgentDeadlines, 60000);
    return () => clearInterval(interval);
  }, [workspaceData.tasks]);

  // Synchronize Firebase Auth state automatically
  useEffect(() => {
    let hasResolved = false;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser) => {
        hasResolved = true;
        if (fbUser) {
          try {
            const idToken = await fbUser.getIdToken();
            localStorage.setItem('aura_auth_token', idToken);

            let profile: UserProfile | null = null;
            const saved = localStorage.getItem(STORAGE_KEY_USER);
            if (saved) {
              try {
                profile = JSON.parse(saved);
              } catch {
                // fall through
              }
            }

            if (!profile || profile.id !== fbUser.uid) {
              profile = {
                id: fbUser.uid,
                name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Workspace Director',
                email: fbUser.email || 'workingbynoor@gmail.com',
                photoUrl: fbUser.photoURL || undefined,
                avatarUrl: fbUser.photoURL || undefined,
                companyName: 'Apex Strategic Studio',
                role: 'Founder & Principal Consultant',
                businessDomain: 'Digital Solutions & Consulting',
                teamSize: '1-5 specialists',
                primaryServices: ['AI Strategy & Development', 'Web & UI/UX Systems'],
                averageProjectValue: '$2,500 - $10,000',
                aiAssistanceLevel: 'autonomous_with_approval',
                currency: 'USD',
                isAuthenticated: true,
              };
            }

            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
            setUser(profile);
            setAuthStatus('authenticated');
          } catch (e: any) {
            const code = e?.code || 'unknown';
            const msg = e?.message || e;
            console.error(`[Firebase Auth State Sync Error] Code: "${code}" | Message: "${msg}"`, e);
            setAuthStatus('authenticated');
          }
        } else {
          // No active Firebase session detected
          const token = localStorage.getItem('aura_auth_token');
          const saved = localStorage.getItem(STORAGE_KEY_USER);
          if (token && saved) {
            try {
              const cachedUser = JSON.parse(saved);
              setUser(cachedUser);
              setAuthStatus('authenticated');
            } catch {
              setUser(null);
              setAuthStatus('unauthenticated');
            }
          } else {
            setUser(null);
            setAuthStatus('unauthenticated');
          }
        }
      },
      (authError: any) => {
        hasResolved = true;
        const code = authError?.code || 'unknown';
        const msg = authError?.message || '';
        console.error(`[Firebase Auth Observer Error] Code: "${code}" | Message: "${msg}"`, authError);
        if (code === 'auth/unauthorized-domain') {
          const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'aura-ai-by-noor-green.vercel.app';
          console.error(
            `[Firebase Auth UNAUTHORIZED DOMAIN]: Domain "${currentHost}" is not in the Firebase Authorized Domains list!\n` +
            `How to add in Firebase Console:\n` +
            `1. Open Firebase Console: https://console.firebase.google.com\n` +
            `2. Select project: gen-lang-client-0655069095\n` +
            `3. Navigate to Build > Authentication\n` +
            `4. Select the "Settings" tab at the top\n` +
            `5. Under "Authorized domains", click "Add domain"\n` +
            `6. Add: aura-ai-by-noor-green.vercel.app\n` +
            `7. Click "Save"`
          );
        }

        const token = localStorage.getItem('aura_auth_token');
        const saved = localStorage.getItem(STORAGE_KEY_USER);
        if (token && saved) {
          try {
            setUser(JSON.parse(saved));
            setAuthStatus('authenticated');
          } catch {
            setUser(null);
            setAuthStatus('unauthenticated');
          }
        } else {
          setUser(null);
          setAuthStatus('unauthenticated');
        }
      }
    );

    // Safety timeout: prevent perpetual loading state if Firebase initialization takes over 1.2s
    const timer = setTimeout(() => {
      if (!hasResolved) {
        const token = localStorage.getItem('aura_auth_token');
        const saved = localStorage.getItem(STORAGE_KEY_USER);
        if (token && saved) {
          try {
            setUser(JSON.parse(saved));
            setAuthStatus('authenticated');
          } catch {
            setAuthStatus('unauthenticated');
          }
        } else {
          setAuthStatus('unauthenticated');
        }
      }
    }, 1200);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // Verify and refresh session with backend on load
  useEffect(() => {
    const token = localStorage.getItem('aura_auth_token');
    if (token) {
      apiGetMe()
        .then((data) => {
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
            setAuthStatus('authenticated');
          }
        })
        .catch((err) => {
          // Only clear session if backend explicitly told us the token is invalid/expired
          if (err?.code === 'AUTH_UNAUTHORIZED' || err?.status === 401) {
            localStorage.removeItem('aura_auth_token');
            localStorage.removeItem(STORAGE_KEY_USER);
            setUser(null);
            setAuthStatus('unauthenticated');
          } else {
            console.warn('[Session Verification Note]: Retaining cached session during network delay/offline state:', err);
          }
        });
    }
  }, []);

  // Fetch persistent workspace from backend and Firestore when authenticated
  useEffect(() => {
    if (user) {
      const userId = user.id || 'workingbynoor@gmail.com';
      // Load from Firestore
      loadWorkspaceFromFirestore(userId).then((cloudData) => {
        if (cloudData && (cloudData.clients?.length || cloudData.projects?.length)) {
          setWorkspaceData((prev) => ({
            ...prev,
            ...cloudData,
          }));
        }
      }).catch((err) => console.warn('Firestore load notice:', err));

      apiFetchWorkspace()
        .then((data) => {
          if (data) {
            setWorkspaceData((prev) => ({
              ...prev,
              ...data,
              clients: Array.isArray(data.clients) ? data.clients : (prev.clients || []),
              projects: Array.isArray(data.projects) ? data.projects : (prev.projects || []),
              tasks: Array.isArray(data.tasks) ? data.tasks : (prev.tasks || []),
              invoices: Array.isArray(data.invoices) ? data.invoices : (prev.invoices || []),
              approvals: Array.isArray(data.approvals) ? data.approvals : (prev.approvals || []),
              connectedAccounts: Array.isArray(data.connectedAccounts) ? data.connectedAccounts : (prev.connectedAccounts || []),
              automations: Array.isArray(data.automations) ? data.automations : (prev.automations || []),
              activityLogs: Array.isArray(data.activityLogs) ? data.activityLogs : (prev.activityLogs || []),
            }));
          }
        })
        .catch((err) => {
          console.warn('Could not sync workspace from server:', err);
        });
    }
  }, [user]);

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOutFirebase();
    } catch (err: any) {
      console.warn('Firebase signout warning:', err?.message || err);
    }
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    localStorage.removeItem('aura_auth_token');
    localStorage.removeItem(STORAGE_KEY_USER);
    setUser(null);
    setAuthStatus('unauthenticated');
  };

  // Persist user
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [user]);

  // Persist workspace data to localStorage as offline cache and Firestore
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(workspaceData));
    if (user) {
      const userId = user.id || 'workingbynoor@gmail.com';
      const debounceTimer = setTimeout(() => {
        saveWorkspaceToFirestore(userId, workspaceData, user);
      }, 1200);
      return () => clearTimeout(debounceTimer);
    }
  }, [workspaceData, user]);

  // Persist dataset mode
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_IS_SAMPLE, JSON.stringify(isSampleData));
  }, [isSampleData]);

  // Toggle Dataset between Pure 0 Data and Active Business
  const handleToggleSampleData = async () => {
    try {
      const nextEmpty = isSampleData;
      const refreshed = await apiResetWorkspace(nextEmpty);
      setWorkspaceData(refreshed);
      setIsSampleData(!nextEmpty);
      addToast(
        nextEmpty ? 'Clean Workspace Activated' : 'Sample Business Pipeline Loaded',
        nextEmpty ? 'Switched to clean zero-data state.' : 'Populated active client pipelines and financials.'
      );
    } catch (e) {
      if (isSampleData) {
        setWorkspaceData(emptyWorkspace);
        setIsSampleData(false);
      } else {
        setWorkspaceData(sampleBusinessWorkspace);
        setIsSampleData(true);
      }
    }
  };

  const handleResetWorkspace = async () => {
    try {
      const refreshed = await apiResetWorkspace(true, 'RESET');
      setWorkspaceData(refreshed);
      setIsSampleData(false);
      localStorage.setItem('aura_is_sample_data', 'false');
      addToast('Workspace Reset', 'All workspace records have been permanently reset to clean slate (0 data).');
    } catch (e) {
      setWorkspaceData(emptyWorkspace);
      setIsSampleData(false);
      localStorage.setItem('aura_is_sample_data', 'false');
      throw e;
    }
  };

  // Quick Action Navigator
  const handleQuickAction = (action: 'client' | 'project' | 'task' | 'invoice') => {
    switch (action) {
      case 'client':
        setCurrentTab('clients');
        break;
      case 'project':
        setCurrentTab('projects');
        break;
      case 'task':
        setCurrentTab('tasks');
        break;
      case 'invoice':
        setCurrentTab('invoices');
        break;
    }
  };

  // ================= TASK HANDLERS & PROJECT METRICS SYNC =================
  const recalculateProjectMetrics = (
    projectId: string,
    allTasks: Task[],
    allProjects: Project[]
  ): { updatedProjects: Project[]; targetProject: Project | null; newProgress: number; completedCount: number; totalCount: number } => {
    const project = allProjects.find((p) => p.id === projectId);
    if (!project) {
      return { updatedProjects: allProjects, targetProject: null, newProgress: 0, completedCount: 0, totalCount: 0 };
    }

    const projectTasks = allTasks.filter((t) => t.projectId === projectId);
    const totalCount = projectTasks.length;
    const completedCount = projectTasks.filter((t) => t.status === 'Completed').length;
    const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const newStatus: ProjectStatus =
      newProgress === 100
        ? 'Completed'
        : project.status === 'Completed'
        ? 'In Progress'
        : project.status;

    const updatedProject: Project = {
      ...project,
      tasksCount: totalCount,
      completedTasksCount: completedCount,
      progress: newProgress,
      status: newStatus,
    };

    const updatedProjects = allProjects.map((p) => (p.id === projectId ? updatedProject : p));
    return { updatedProjects, targetProject: updatedProject, newProgress, completedCount, totalCount };
  };

  const handleAddTask = async (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      const created = await apiCreateTask(newTask);
      const nextTasks = [created, ...workspaceData.tasks];
      let nextProjects = workspaceData.projects;

      if (created.projectId) {
        const calc = recalculateProjectMetrics(created.projectId, nextTasks, workspaceData.projects);
        nextProjects = calc.updatedProjects;
        if (calc.targetProject) {
          apiUpdateProject(created.projectId, {
            progress: calc.newProgress,
            completedTasksCount: calc.completedCount,
            tasksCount: calc.totalCount,
            status: calc.targetProject.status,
          }).catch((e) => console.warn('Project progress sync deferred:', e));
        }
      }

      setWorkspaceData((prev) => ({
        ...prev,
        tasks: nextTasks,
        projects: nextProjects,
      }));
      addToast('Task Created', `"${created.title}" added to your deliverables backlog.`);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to create task', 'error');
      throw err;
    }
  };

  const handleEditTask = async (updatedTask: Task) => {
    try {
      const saved = await apiUpdateTask(updatedTask.id, updatedTask);
      const nextTasks = workspaceData.tasks.map((t) => (t.id === saved.id ? saved : t));
      let nextProjects = workspaceData.projects;

      if (saved.projectId) {
        const calc = recalculateProjectMetrics(saved.projectId, nextTasks, workspaceData.projects);
        nextProjects = calc.updatedProjects;
        if (calc.targetProject) {
          apiUpdateProject(saved.projectId, {
            progress: calc.newProgress,
            completedTasksCount: calc.completedCount,
            tasksCount: calc.totalCount,
            status: calc.targetProject.status,
          }).catch((e) => console.warn('Project progress sync deferred:', e));
        }
      }

      setWorkspaceData((prev) => ({
        ...prev,
        tasks: nextTasks,
        projects: nextProjects,
      }));
      addToast('Task Updated', `Task "${saved.title}" was saved.`);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update task', 'error');
      throw err;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const targetTask = workspaceData.tasks.find((t) => t.id === taskId);
      const deleted = await apiDeleteTask(taskId);
      const nextTasks = (workspaceData.tasks || []).filter((t) => t.id !== taskId);
      let nextProjects = workspaceData.projects;

      if (targetTask?.projectId) {
        const calc = recalculateProjectMetrics(targetTask.projectId, nextTasks, workspaceData.projects);
        nextProjects = calc.updatedProjects;
        if (calc.targetProject) {
          apiUpdateProject(targetTask.projectId, {
            progress: calc.newProgress,
            completedTasksCount: calc.completedCount,
            tasksCount: calc.totalCount,
            status: calc.targetProject.status,
          }).catch((e) => console.warn('Project progress sync deferred:', e));
        }
      }

      setWorkspaceData((prev) => ({
        ...prev,
        tasks: nextTasks,
        projects: nextProjects,
      }));
      addToast('Task Deleted', `"${deleted?.title || 'Task'}" was removed.`);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to delete task', 'error');
      throw err;
    }
  };

  const handleToggleTaskComplete = async (taskId: string) => {
    const existing = workspaceData.tasks.find((t) => t.id === taskId);
    if (!existing) return;
    const nextStatus: TaskStatus = existing.status === 'Completed' ? 'To Do' : 'Completed';
    const nowIso = new Date().toISOString();

    // 1. Calculate next tasks state
    const nextTasks = workspaceData.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'Completed' ? nowIso : undefined,
          }
        : t
    );

    // 2. Automatically trigger progress update in project metrics display
    let nextProjects = workspaceData.projects;
    let targetProject: Project | null = null;
    let newProgress = 0;
    let completedCount = 0;
    let totalCount = 0;

    if (existing.projectId) {
      const calc = recalculateProjectMetrics(existing.projectId, nextTasks, workspaceData.projects);
      nextProjects = calc.updatedProjects;
      targetProject = calc.targetProject;
      newProgress = calc.newProgress;
      completedCount = calc.completedCount;
      totalCount = calc.totalCount;
    }

    // 3. Immediately update state so UI metrics display updates with zero lag
    setWorkspaceData((prev) => ({
      ...prev,
      tasks: nextTasks,
      projects: nextProjects,
    }));

    // 4. Persist to API and notify user with progress details
    try {
      await apiUpdateTask(taskId, {
        status: nextStatus,
        completedAt: nextStatus === 'Completed' ? nowIso : undefined,
      });

      if (existing.projectId && targetProject) {
        await apiUpdateProject(existing.projectId, {
          progress: newProgress,
          completedTasksCount: completedCount,
          tasksCount: totalCount,
          status: targetProject.status,
        }).catch((err) => console.warn('Background project progress sync deferred:', err));

        addToast(
          'Project Progress Updated',
          `"${existing.title}" marked as ${nextStatus}. "${targetProject.name}" progress automatically recalculated to ${newProgress}% (${completedCount}/${totalCount} deliverables completed).`,
          'success'
        );
      } else {
        addToast('Task Status', `Task marked as ${nextStatus}.`);
      }
    } catch (err: any) {
      console.warn('API task update fallback applied:', err);
    }
  };

  const handleReorderTasks = (newTasks: Task[]) => {
    setWorkspaceData((prev) => ({
      ...prev,
      tasks: newTasks,
    }));
  };

  // ================= CLIENT HANDLERS =================
  const handleAddClient = async (newClient: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      const created = await apiCreateClient(newClient);
      setWorkspaceData((prev) => ({
        ...prev,
        clients: [created, ...prev.clients],
      }));
      addToast('Client Added', `${created.name} (${created.company}) registered successfully.`);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to create client', 'error');
      throw err;
    }
  };

  const handleEditClient = async (updatedClient: Client) => {
    try {
      const saved = await apiUpdateClient(updatedClient.id, updatedClient);
      setWorkspaceData((prev) => ({
        ...prev,
        clients: prev.clients.map((c) => (c.id === saved.id ? saved : c)),
        projects: prev.projects.map((p) =>
          p.clientId === saved.id ? { ...p, clientName: saved.name } : p
        ),
        invoices: prev.invoices.map((i) =>
          i.clientId === saved.id ? { ...i, clientName: saved.name } : i
        ),
      }));
      addToast('Client Updated', `Changes to ${saved.name} have been saved.`);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update client', 'error');
      throw err;
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const res = await apiDeleteClient(clientId);
      setWorkspaceData((prev) => ({
        ...prev,
        clients: (prev.clients || []).filter((c) => c.id !== clientId),
      }));
      addToast('Client Removed', `${res.deletedClient?.name || 'Client'} was deleted.`);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to delete client', 'error');
      throw err;
    }
  };

  // ================= PROJECT HANDLERS =================
  const handleAddProject = async (newProject: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      const created = await apiCreateProject(newProject);
      setWorkspaceData((prev) => ({
        ...prev,
        projects: [created, ...(prev.projects || [])],
      }));
      addToast('Project Created', `Project "${created.name}" created.`);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to create project', 'error');
      throw err;
    }
  };

  const handleEditProject = async (updatedProject: Project) => {
    try {
      const saved = await apiUpdateProject(updatedProject.id, updatedProject);
      setWorkspaceData((prev) => ({
        ...prev,
        projects: (prev.projects || []).map((p) => (p.id === saved.id ? saved : p)),
        tasks: (prev.tasks || []).map((t) =>
          t.projectId === saved.id ? { ...t, projectName: saved.name } : t
        ),
      }));
      addToast('Project Updated', `Project "${saved.name}" updated successfully.`);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update project', 'error');
      throw err;
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const res = await apiDeleteProject(projectId);
      setWorkspaceData((prev) => ({
        ...prev,
        projects: (prev.projects || []).filter((p) => p.id !== projectId),
      }));
      addToast('Project Deleted', `Project "${res.deletedProject?.name || 'Project'}" was removed.`);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to delete project', 'error');
      throw err;
    }
  };

  // ================= INVOICE HANDLERS =================
  const handleAddInvoice = async (newInvoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      const created = await apiCreateInvoice(newInvoice);
      setWorkspaceData((prev) => ({
        ...prev,
        invoices: [created, ...(prev.invoices || [])],
      }));
      addToast('Invoice Issued', `Invoice ${created.invoiceNumber} ($${created.amount.toLocaleString()}) created.`);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to create invoice', 'error');
      throw err;
    }
  };

  const handleEditInvoice = async (updatedInvoice: Invoice) => {
    try {
      const saved = await apiUpdateInvoice(updatedInvoice.id, updatedInvoice);
      setWorkspaceData((prev) => ({
        ...prev,
        invoices: (prev.invoices || []).map((inv) =>
          inv.id === saved.id ? saved : inv
        ),
      }));
      addToast('Invoice Saved', `Invoice ${saved.invoiceNumber} updated successfully.`);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update invoice', 'error');
      throw err;
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const deleted = await apiDeleteInvoice(invoiceId);
      setWorkspaceData((prev) => ({
        ...prev,
        invoices: (prev.invoices || []).filter((inv) => inv.id !== invoiceId),
      }));
      addToast('Invoice Removed', `Invoice ${deleted?.invoiceNumber || 'Invoice'} was deleted.`);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to delete invoice', 'error');
      throw err;
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus) => {
    try {
      const updated = await apiUpdateInvoice(invoiceId, { status });
      setWorkspaceData((prev) => ({
        ...prev,
        invoices: prev.invoices.map((inv) =>
          inv.id === invoiceId ? updated : inv
        ),
      }));
      addToast('Invoice Status', `Invoice ${updated.invoiceNumber} marked as ${status}.`);
    } catch (err: any) {
      setWorkspaceData((prev) => ({
        ...prev,
        invoices: prev.invoices.map((inv) =>
          inv.id === invoiceId ? { ...inv, status } : inv
        ),
      }));
    }
  };

  // ================= AI APPROVALS HANDLERS =================
  const handleApproveAiItem = (item: AiApprovalItem) => {
    setWorkspaceData((prev) => {
      const updatedApprovals = prev.approvals.map((a) =>
        a.id === item.id ? { ...a, status: 'Approved' as const } : a
      );

      // Execute action based on item type
      let updatedClients = prev.clients;
      let updatedProjects = prev.projects;
      let updatedInvoices = prev.invoices;

      if (item.source === 'invoice') {
        const newInv: Invoice = {
          id: `inv_ai_${Date.now()}`,
          invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
          clientId: prev.clients[0]?.id || 'client_1',
          clientName: prev.clients[0]?.name || 'Horizon Media Dynamics',
          amount: 4200,
          status: 'Sent',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          items: [{ description: 'AI Automated Milestone Completion', quantity: 1, unitPrice: 4200 }],
          createdAt: new Date().toISOString(),
        };
        updatedInvoices = [newInv, ...updatedInvoices];
      }

      return {
        ...prev,
        approvals: updatedApprovals,
        clients: updatedClients,
        projects: updatedProjects,
        invoices: updatedInvoices,
      };
    });
    addToast('Action Approved', `Autonomous action "${item.title}" executed.`);
  };

  const handleRejectAiItem = (itemId: string) => {
    setWorkspaceData((prev) => ({
      ...prev,
      approvals: prev.approvals.map((a) =>
        a.id === itemId ? { ...a, status: 'Rejected' as const } : a
      ),
    }));
    addToast('Action Dismissed', 'Action proposal rejected.', 'info');
  };

  const handleEditAndApproveAiItem = (item: AiApprovalItem, updatedProposal: string) => {
    setWorkspaceData((prev) => ({
      ...prev,
      approvals: prev.approvals.map((a) =>
        a.id === item.id
          ? {
              ...a,
              whatAuraWantsToDo: updatedProposal,
              status: 'Approved' as const,
            }
          : a
      ),
    }));
    addToast('Modified & Approved', `Updated proposal approved.`);
  };

  // ================= CONNECTED ACCOUNTS HANDLERS =================
  const handleToggleConnectAccount = async (
    accountId: string,
    options?: { permissions?: string[]; accountIdentifier?: string }
  ) => {
    const acc = workspaceData.connectedAccounts.find((a) => a.id === accountId);
    if (!acc) return;

    if (acc.status === 'connected') {
      try {
        const updated = await apiDisconnectIntegration(accountId);
        setWorkspaceData((prev) => ({
          ...prev,
          connectedAccounts: prev.connectedAccounts.map((a) => (a.id === accountId ? updated : a)),
        }));
        addToast('Integration Disconnected', `${updated.name} disconnected. OAuth credentials purged.`);
      } catch (err: any) {
        const msg = getFriendlyErrorMessage(err);
        addToast('Disconnection Failed', msg, 'error');
        throw err;
      }
    } else {
      try {
        const updated = await apiConnectIntegration(accountId, options);
        setWorkspaceData((prev) => ({
          ...prev,
          connectedAccounts: prev.connectedAccounts.map((a) => (a.id === accountId ? updated : a)),
        }));
        addToast('Integration Connected', `${updated.name} authorized via OAuth 2.0 PKCE.`);
      } catch (err: any) {
        const msg = getFriendlyErrorMessage(err);
        addToast('Connection Failed', msg, 'error');
        throw err;
      }
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    try {
      const updated = await apiSyncIntegration(accountId);
      setWorkspaceData((prev) => ({
        ...prev,
        connectedAccounts: prev.connectedAccounts.map((a) => (a.id === accountId ? updated : a)),
      }));
      addToast('Account Synced', `${updated.name} synchronized successfully.`);
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err);
      addToast('Sync Failed', msg, 'error');
    }
  };

  // ================= AUTOMATION RULES =================
  const handleToggleAutomation = (ruleId: string) => {
    setWorkspaceData((prev) => ({
      ...prev,
      automations: prev.automations.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              enabled: !r.enabled,
              status: r.status === 'Active' ? 'Paused' : 'Active',
            }
          : r
      ),
    }));
  };

  const handleAddAutomation = (rule: any) => {
    setWorkspaceData((prev) => ({
      ...prev,
      automations: [
        ...prev.automations,
        {
          ...rule,
          id: `rule_${Date.now()}`,
          triggerCount: 0,
        },
      ],
    }));
    addToast('Automation Created', 'New workflow rule enabled.');
  };

  // ================= LEADS HANDLERS =================
  const handleAddLead = (newLead: Lead) => {
    setWorkspaceData((prev) => ({
      ...prev,
      leads: [newLead, ...(prev.leads || [])],
    }));
    addToast('Lead Created', `Lead "${newLead.name}" added to pipeline.`);
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    setWorkspaceData((prev) => ({
      ...prev,
      leads: (prev.leads || []).map((l) => (l.id === updatedLead.id ? updatedLead : l)),
    }));
    addToast('Lead Updated', `Lead "${updatedLead.name}" updated.`);
  };

  const handleDeleteLead = (id: string) => {
    setWorkspaceData((prev) => ({
      ...prev,
      leads: (prev.leads || []).filter((l) => l.id !== id),
    }));
    addToast('Lead Removed', 'Lead removed from pipeline.', 'info');
  };

  const handleConvertLeadToClient = (lead: Lead) => {
    const newClient: Client = {
      id: `client_${Date.now()}`,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      status: 'Active',
      totalBilled: 0,
      openProjectsCount: 0,
      createdAt: new Date().toISOString(),
    };
    setWorkspaceData((prev) => ({
      ...prev,
      clients: [newClient, ...(prev.clients || [])],
      leads: (prev.leads || []).map((l) =>
        l.id === lead.id ? { ...l, status: 'Won' as const } : l
      ),
    }));
    addToast('Converted to Client', `Lead "${lead.name}" converted to Active Client!`);
  };

  // ================= MESSAGES & INBOX HANDLERS =================
  const handleUpdateMessage = (updatedMsg: UnifiedMessage) => {
    setWorkspaceData((prev) => ({
      ...prev,
      messages: (prev.messages || []).map((m) => (m.id === updatedMsg.id ? updatedMsg : m)),
    }));
  };

  const handleSendMessage = (newMsg: UnifiedMessage) => {
    setWorkspaceData((prev) => ({
      ...prev,
      messages: [newMsg, ...(prev.messages || [])],
    }));
    addToast('Message Dispatched', `Message dispatched to ${newMsg.clientName || newMsg.senderName || 'recipient'}.`);
  };

  // ================= FOLLOW-UPS HANDLERS =================
  const handleAddFollowUp = (item: FollowUpItem) => {
    setWorkspaceData((prev) => ({
      ...prev,
      followUps: [item, ...(prev.followUps || [])],
    }));
    addToast('Follow-up Scheduled', `Follow-up reminder set for ${item.clientName}.`);
  };

  const handleUpdateFollowUp = (item: FollowUpItem) => {
    setWorkspaceData((prev) => ({
      ...prev,
      followUps: (prev.followUps || []).map((f) => (f.id === item.id ? item : f)),
    }));
  };

  const handleDeleteFollowUp = (id: string) => {
    setWorkspaceData((prev) => ({
      ...prev,
      followUps: (prev.followUps || []).filter((f) => f.id !== id),
    }));
    addToast('Follow-up Removed', 'Follow-up removed.', 'info');
  };

  // ================= PROPOSALS HANDLERS =================
  const handleAddProposal = (proposal: Proposal) => {
    setWorkspaceData((prev) => ({
      ...prev,
      proposals: [proposal, ...(prev.proposals || [])],
    }));
    addToast('Proposal Created', `Proposal "${proposal.title}" created.`);
  };

  const handleUpdateProposal = (proposal: Proposal) => {
    setWorkspaceData((prev) => ({
      ...prev,
      proposals: (prev.proposals || []).map((p) => (p.id === proposal.id ? proposal : p)),
    }));
    addToast('Proposal Saved', `Proposal "${proposal.title}" updated.`);
  };

  const handleDeleteProposal = (id: string) => {
    setWorkspaceData((prev) => ({
      ...prev,
      proposals: (prev.proposals || []).filter((p) => p.id !== id),
    }));
    addToast('Proposal Deleted', 'Proposal removed.', 'info');
  };

  // ================= CONTRACTS HANDLERS =================
  const handleAddContract = (contract: Contract) => {
    setWorkspaceData((prev) => ({
      ...prev,
      contracts: [contract, ...(prev.contracts || [])],
    }));
    addToast('Contract Created', `Contract "${contract.title}" created.`);
  };

  const handleUpdateContract = (contract: Contract) => {
    setWorkspaceData((prev) => ({
      ...prev,
      contracts: (prev.contracts || []).map((c) => (c.id === contract.id ? contract : c)),
    }));
    addToast('Contract Updated', `Contract "${contract.title}" saved.`);
  };

  const handleDeleteContract = (id: string) => {
    setWorkspaceData((prev) => ({
      ...prev,
      contracts: (prev.contracts || []).filter((c) => c.id !== id),
    }));
    addToast('Contract Deleted', 'Contract removed.', 'info');
  };

  // ================= SERVICES HANDLERS =================
  const handleAddService = (service: Service) => {
    setWorkspaceData((prev) => ({
      ...prev,
      services: [service, ...(prev.services || [])],
    }));
    addToast('Service Added', `Service package "${service.name}" added.`);
  };

  const handleUpdateService = (service: Service) => {
    setWorkspaceData((prev) => ({
      ...prev,
      services: (prev.services || []).map((s) => (s.id === service.id ? service : s)),
    }));
    addToast('Service Updated', `Service "${service.name}" updated.`);
  };

  const handleDeleteService = (id: string) => {
    setWorkspaceData((prev) => ({
      ...prev,
      services: (prev.services || []).filter((s) => s.id !== id),
    }));
    addToast('Service Removed', 'Service removed from catalog.', 'info');
  };

  // ================= PORTFOLIO & BRAND HANDLERS =================
  const handleAddPortfolioItem = (item: PortfolioItem) => {
    setWorkspaceData((prev) => ({
      ...prev,
      portfolio: [item, ...(prev.portfolio || [])],
    }));
    addToast('Showcase Added', `Portfolio item "${item.title}" added.`);
  };

  const handleUpdatePortfolioItem = (item: PortfolioItem) => {
    setWorkspaceData((prev) => ({
      ...prev,
      portfolio: (prev.portfolio || []).map((p) => (p.id === item.id ? item : p)),
    }));
    addToast('Showcase Saved', `Portfolio item "${item.title}" updated.`);
  };

  const handleDeletePortfolioItem = (id: string) => {
    setWorkspaceData((prev) => ({
      ...prev,
      portfolio: (prev.portfolio || []).filter((p) => p.id !== id),
    }));
    addToast('Showcase Removed', 'Portfolio item removed.', 'info');
  };

  const handleUpdateBrandProfile = (profile: BrandProfile) => {
    setWorkspaceData((prev) => ({
      ...prev,
      brandProfile: profile,
    }));
    addToast('Brand Profile Updated', 'Public studio brand identity updated.');
  };

  // ================= DOCUMENTS HANDLERS =================
  const handleAddDocument = (doc: DocumentItem) => {
    setWorkspaceData((prev) => ({
      ...prev,
      documents: [doc, ...(prev.documents || [])],
    }));
    addToast('Document Uploaded', `Document "${doc.title}" stored.`);
  };

  const handleDeleteDocument = (id: string) => {
    setWorkspaceData((prev) => ({
      ...prev,
      documents: (prev.documents || []).filter((d) => d.id !== id),
    }));
    addToast('Document Removed', 'Document deleted.', 'info');
  };

  // 1. Loading authentication state: never show the workspace briefly before authentication is known
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen w-full bg-[#05070D] flex flex-col items-center justify-center text-white relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center space-y-6 text-center px-4 max-w-sm">
          <AuraOrb size="lg" state="thinking" />
          <div className="space-y-2">
            <h1 className="text-xl font-display font-bold tracking-tight text-white">
              AURA AI
            </h1>
            <p className="text-xs text-cyan-300 font-mono tracking-wider animate-pulse">
              Verifying workspace credentials...
            </p>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-gray-400 bg-[#0d1220]/80 px-3.5 py-1.5 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Firebase Auth & Firestore Synchronization</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state: display full Auth & Onboarding flow
  if (authStatus === 'unauthenticated' || !user) {
    return (
      <AuthScreen
        onAuthenticate={(authenticatedUser) => {
          setUser(authenticatedUser);
          setAuthStatus('authenticated');
          setCurrentTab('overview');
        }}
        onCompleteAuth={(authenticatedUser) => {
          setUser(authenticatedUser);
          setAuthStatus('authenticated');
          setCurrentTab('overview');
        }}
        onExploreDemo={() => {
          const demoUser: UserProfile = {
            id: 'usr_demo',
            name: 'Noor A.',
            email: 'workingbynoor@gmail.com',
            companyName: 'Aura Studio Operations',
            role: 'Managing Director & Founder',
            businessDomain: 'Digital Solutions & Consulting',
            teamSize: '1-5 specialists',
            primaryServices: ['AI Strategy & Development', 'Web & UI/UX Systems'],
            averageProjectValue: '$2,500 - $10,000',
            aiAssistanceLevel: 'autonomous_with_approval',
            currency: 'USD',
            isAuthenticated: true,
          };
          setUser(demoUser);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(demoUser));
          setAuthStatus('authenticated');
          setCurrentTab('overview');
        }}
      />
    );
  }

  const pendingApprovalsCount = (workspaceData?.approvals || []).filter(
    (a) => a && a.status === 'Pending'
  ).length;

  const unreadMessagesCount = (workspaceData?.messages || []).filter(
    (m) => m && m.unread
  ).length;

  const pendingFollowUpsCount = (workspaceData?.followUps || []).filter(
    (f) => f && f.status !== 'Completed'
  ).length;

  const newLeadsCount = (workspaceData?.leads || []).filter(
    (l) => l && l.status === 'New'
  ).length;

  return (
    <div className="min-h-screen bg-[#05070D] text-gray-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />

      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        onSignOut={handleSignOut}
        pendingApprovalsCount={pendingApprovalsCount}
        unreadMessagesCount={unreadMessagesCount}
        pendingFollowUpsCount={pendingFollowUpsCount}
        newLeadsCount={newLeadsCount}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Layout Area */}
      <div className="lg:pl-64 flex-1 flex flex-col">
        {/* Sticky TopBar */}
        <TopBar
          currentTab={currentTab}
          onOpenMobile={() => setMobileOpen(true)}
          onQuickAction={handleQuickAction}
          onToggleSampleData={handleToggleSampleData}
          isSampleData={isSampleData}
          onAskAuraQuick={() => setCurrentTab('ask-aura')}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onOpenFeatureCenter={() => setCurrentTab('features')}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          onOpenClientIntake={() => setIsIntakeModalOpen(true)}
          onNavigate={setCurrentTab}
          user={user}
          onSignOut={handleSignOut}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && (
            <OverviewView
              data={workspaceData}
              user={user}
              onNavigate={setCurrentTab}
              onQuickAction={handleQuickAction}
              onToggleTaskComplete={handleToggleTaskComplete}
            />
          )}

          {currentTab === 'clients' && (
            <ClientsView
              clients={workspaceData.clients}
              projects={workspaceData.projects}
              tasks={workspaceData.tasks}
              invoices={workspaceData.invoices}
              onAddClient={handleAddClient}
              onEditClient={handleEditClient}
              onDeleteClient={handleDeleteClient}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsView
              projects={workspaceData.projects}
              clients={workspaceData.clients}
              tasks={workspaceData.tasks}
              invoices={workspaceData.invoices}
              initialRiskFilter={projectRiskFilter}
              onClearRiskFilter={() => setProjectRiskFilter(false)}
              onAddProject={handleAddProject}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              tasks={workspaceData.tasks}
              projects={workspaceData.projects}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleComplete={handleToggleTaskComplete}
              onReorderTasks={handleReorderTasks}
              onToast={addToast}
              onEditProject={handleEditProject}
            />
          )}

          {currentTab === 'ask-aura' && (
            <AskAuraView
              data={workspaceData}
              user={user}
              onAddTaskFromAi={(title, desc) =>
                handleAddTask({
                  title,
                  description: desc || '',
                  status: 'To Do',
                  priority: 'Medium',
                  deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                })
              }
            />
          )}

          {currentTab === 'approvals' && (
            <ApprovalCenterView
              approvals={workspaceData.approvals}
              onApprove={handleApproveAiItem}
              onReject={handleRejectAiItem}
              onEditAndApprove={handleEditAndApproveAiItem}
            />
          )}

          {currentTab === 'connected-accounts' && (
            <ConnectedAccountsView
              accounts={workspaceData.connectedAccounts}
              onToggleConnect={handleToggleConnectAccount}
              onSyncAccount={handleSyncAccount}
            />
          )}

          {currentTab === 'finance' && (
            <FinanceView
              invoices={workspaceData.invoices}
              clients={workspaceData.clients}
              projects={workspaceData.projects}
              activityLogs={workspaceData.activityLogs}
              onNavigateToInvoices={() => setCurrentTab('invoices')}
              onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
            />
          )}

          {currentTab === 'invoices' && (
            <InvoicesView
              invoices={workspaceData.invoices}
              clients={workspaceData.clients}
              onAddInvoice={handleAddInvoice}
              onEditInvoice={handleEditInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
              onSendReminderNotification={(inv) =>
                addToast(
                  'Reminder Dispatched',
                  `Automated remittance reminder prepared for ${inv.clientName}.`
                )
              }
            />
          )}

          {currentTab === 'automations' && (
            <AutomationsView
              rules={workspaceData.automations}
              tasks={workspaceData.tasks}
              onToggleRule={handleToggleAutomation}
              onAddRule={handleAddAutomation}
            />
          )}

          {currentTab === 'ai-insights' && (
            <AiInsightsView data={workspaceData} user={user} />
          )}

          {currentTab === 'calendar' && (
            <CalendarView data={workspaceData} />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView data={workspaceData} />
          )}

          {currentTab === 'leads' && (
            <LeadsView
              leads={workspaceData.leads || []}
              onAddLead={handleAddLead}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              onConvertToClient={handleConvertLeadToClient}
            />
          )}

          {currentTab === 'business-brain' && (
            <BusinessBrainView
              workspace={workspaceData}
              onNavigateToTab={(tab, options) => {
                if (tab === 'projects') {
                  if (options?.riskFilter || options?.filter === 'High Risk' || options?.filter === 'risk') {
                    setProjectRiskFilter(true);
                  } else {
                    setProjectRiskFilter(false);
                  }
                }
                setCurrentTab(tab);
              }}
            />
          )}

          {currentTab === 'unified-inbox' && (
            <UnifiedInboxView
              messages={workspaceData.messages || []}
              clients={workspaceData.clients || []}
              projects={workspaceData.projects || []}
              onUpdateMessage={handleUpdateMessage}
              onAddTask={handleAddTask}
            />
          )}

          {currentTab === 'email' && (
            <EmailView
              messages={workspaceData.messages || []}
              clients={workspaceData.clients || []}
              onSendMessage={handleSendMessage}
            />
          )}

          {currentTab === 'follow-ups' && (
            <FollowUpsView
              followUps={workspaceData.followUps || []}
              clients={workspaceData.clients || []}
              projects={workspaceData.projects || []}
              onAddFollowUp={handleAddFollowUp}
              onUpdateFollowUp={handleUpdateFollowUp}
              onDeleteFollowUp={handleDeleteFollowUp}
            />
          )}

          {currentTab === 'proposals' && (
            <ProposalsView
              proposals={workspaceData.proposals || []}
              clients={workspaceData.clients || []}
              services={workspaceData.services || []}
              onAddProposal={handleAddProposal}
              onUpdateProposal={handleUpdateProposal}
              onDeleteProposal={handleDeleteProposal}
            />
          )}

          {currentTab === 'contracts' && (
            <ContractsView
              contracts={workspaceData.contracts || []}
              clients={workspaceData.clients || []}
              projects={workspaceData.projects || []}
              onAddContract={handleAddContract}
              onUpdateContract={handleUpdateContract}
              onDeleteContract={handleDeleteContract}
            />
          )}

          {currentTab === 'services' && (
            <ServicesView
              services={workspaceData.services || []}
              onAddService={handleAddService}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
              onNavigateToTab={setCurrentTab}
            />
          )}

          {currentTab === 'portfolio' && (
            <PortfolioView
              portfolio={workspaceData.portfolio || []}
              brandProfile={workspaceData.brandProfile || sampleBusinessWorkspace.brandProfile}
              onAddPortfolioItem={handleAddPortfolioItem}
              onUpdatePortfolioItem={handleUpdatePortfolioItem}
              onDeletePortfolioItem={handleDeletePortfolioItem}
              onUpdateBrandProfile={handleUpdateBrandProfile}
            />
          )}

          {currentTab === 'documents' && (
            <DocumentCenterView
              documents={workspaceData.documents || []}
              clients={workspaceData.clients || []}
              projects={workspaceData.projects || []}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

          {currentTab === 'activity-log' && (
            <AuditLogView
              activities={workspaceData.activityLogs || []}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              user={user}
              onUpdateUser={setUser}
              onResetWorkspace={handleResetWorkspace}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'features' && (
            <FeatureCenterView
              onNavigate={setCurrentTab}
              onOpenProductTour={() => setIsProductTourOpen(true)}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Floating Voice Companion Orb (Quick launch from any view) */}
      {currentTab !== 'ask-aura' && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            id="btn-floating-voice-orb"
            data-mic-active={isMicActive ? "true" : "false"}
            onPointerDown={(e) => {
              const button = e.currentTarget;
              const rect = button.getBoundingClientRect();
              button.style.setProperty('--ripple-x', `${e.clientX - rect.left}px`);
              button.style.setProperty('--ripple-y', `${e.clientY - rect.top}px`);
            }}
            onClick={(e) => {
              const button = e.currentTarget;
              const rect = button.getBoundingClientRect();
              button.style.setProperty('--ripple-x', `${e.clientX - rect.left}px`);
              button.style.setProperty('--ripple-y', `${e.clientY - rect.top}px`);
              button.classList.remove('is-rippling');
              void button.offsetWidth;
              button.classList.add('is-rippling');
              setTimeout(() => {
                button.classList.remove('is-rippling');
              }, 650);
              setIsVoiceModalOpen(true);
            }}
            title={isMicActive ? "Microphone active: Listening to you... (Cmd/Ctrl + Shift + K)" : "Talk to AURA (Cmd/Ctrl + Shift + K)"}
            className={`group relative flex items-center justify-start px-3.5 h-12 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white shadow-xl shadow-cyan-950/60 cursor-pointer overflow-hidden transition-all ${
              isMicActive
                ? 'mic-active is-mic-active ring-2 ring-cyan-300 shadow-cyan-400/50'
                : 'border border-cyan-400/30'
            }`}
          >
            <div
              className={`absolute -inset-1 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full blur pointer-events-none transition-opacity ${
                isMicActive ? 'opacity-90 animate-pulse' : 'opacity-40 group-hover:opacity-75'
              }`}
            />
            <div className="relative flex items-center space-x-2.5 z-10 shrink-0">
              <div className="relative flex items-center justify-center shrink-0">
                <Mic className={`w-5 h-5 text-white shrink-0 transition-transform ${isMicActive ? 'scale-110 text-cyan-200' : ''}`} />
                {isMicActive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-300"></span>
                  </span>
                )}
              </div>
              <span className="voice-orb-label text-xs font-semibold whitespace-nowrap flex items-center space-x-1.5">
                <span>{isMicActive ? 'Listening...' : 'Talk to AURA'}</span>
                {isMicActive && (
                  <span className="flex items-center space-x-0.5 ml-1.5 h-3">
                    <span className="voice-wave-bar" />
                    <span className="voice-wave-bar" />
                    <span className="voice-wave-bar" />
                  </span>
                )}
              </span>
              <kbd className="voice-orb-kbd inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-medium text-cyan-200 bg-black/40 border border-white/20 rounded whitespace-nowrap">
                ⌘⇧K
              </kbd>
            </div>
          </button>
        </div>
      )}

      {/* Global Quick Add Bar (Cmd/Ctrl + Shift + A) */}
      <GlobalQuickAddBar
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        projects={workspaceData.projects}
        clients={workspaceData.clients}
        onAddTask={(taskData) =>
          handleAddTask({
            title: taskData.title,
            description: taskData.description || '',
            priority: taskData.priority || 'Medium',
            status: 'To Do',
            projectId: taskData.projectId,
            deadline: taskData.deadline || new Date(Date.now() + 86400000).toISOString().split('T')[0],
          })
        }
        onAddLead={(leadData) =>
          handleAddLead({
            id: `lead_${Date.now()}`,
            name: leadData.name,
            company: leadData.company,
            email: leadData.email,
            potentialValue: leadData.estimatedValue || 2500,
            status: 'New',
            priority: 'High',
            source: 'Manual Quick Add',
            createdAt: new Date().toISOString(),
            notes: leadData.notes || '',
          })
        }
      />

      {/* Global Voice Modal */}
      <VoiceConversation
        mode="modal"
        isOpen={isVoiceModalOpen}
        onClose={() => {
          setIsVoiceModalOpen(false);
          setVoiceState('idle');
        }}
        onVoiceStateChange={setVoiceState}
        data={workspaceData}
        user={user}
        onAddTask={(title, desc) =>
          handleAddTask({
            title,
            description: desc || '',
            status: 'To Do',
            priority: 'Medium',
            deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          })
        }
      />

      {/* Global Search Modal (Ctrl + K / Cmd + K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        data={workspaceData}
        onNavigate={setCurrentTab}
      />

      {/* Interactive Product Tour Modal */}
      <ProductTourModal
        isOpen={isProductTourOpen}
        onClose={() => setIsProductTourOpen(false)}
        onNavigate={setCurrentTab}
      />

      {/* Client Project Intake Modal */}
      {isIntakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 w-full max-w-xl">
            <ClientProjectIntake
              onBackToLogin={() => setIsIntakeModalOpen(false)}
              onSuccess={() => {
                addToast('Project Request Received', 'Noor Fatima will review your requirements and follow up promptly.');
                setTimeout(() => setIsIntakeModalOpen(false), 2200);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
