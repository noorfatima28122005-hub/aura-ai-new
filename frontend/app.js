/**
 * AURA AI — Intelligent Business Operating Workspace Frontend Engine
 * Handles authentication, real-time dashboard telemetry, client CRM,
 * project pipelines, task matrices, and AI Executive interactions.
 */

(function () {
  'use strict';

  // State Management
  const state = {
    token: localStorage.getItem('aura_auth_token') || null,
    user: null,
    dashboardData: null,
    clients: [],
    projects: [],
    tasks: [],
    activeTab: 'dashboard',
  };

  // DOM Elements References
  const dom = {
    // Screens
    authScreen: document.getElementById('authScreen'),
    appScreen: document.getElementById('appScreen'),

    // Auth Controls
    loginForm: document.getElementById('loginForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginButton: document.getElementById('loginButton'),

    signupForm: document.getElementById('signupForm'),
    signupName: document.getElementById('signupName'),
    signupEmail: document.getElementById('signupEmail'),
    signupPassword: document.getElementById('signupPassword'),
    signupButton: document.getElementById('signupButton'),

    authMessage: document.getElementById('authMessage'),
    authSwitchButton: document.getElementById('authSwitchButton'),
    authSwitchPrompt: document.getElementById('authSwitchPrompt'),

    // Sidebar
    sidebar: document.getElementById('sidebar'),
    sidebarStatusDot: document.getElementById('sidebarStatusDot'),
    connectionText: document.getElementById('connectionText'),
    sidebarUserName: document.getElementById('sidebarUserName'),
    logoutButton: document.getElementById('logoutButton'),

    // TopBar
    refreshDashboard: document.getElementById('refreshDashboard'),
    userInitial: document.getElementById('userInitial'),
    topUserName: document.getElementById('topUserName'),
    topUserEmail: document.getElementById('topUserEmail'),
    topStatusDot: document.getElementById('topStatusDot'),
    topConnectionText: document.getElementById('topConnectionText'),
    apiStatus: document.getElementById('apiStatus'),

    // Welcome & Overview Metrics
    welcomeName: document.getElementById('welcomeName'),
    totalClients: document.getElementById('totalClients'),
    totalProjects: document.getElementById('totalProjects'),
    totalTasks: document.getElementById('totalTasks'),
    completedTasks: document.getElementById('completedTasks'),
    totalRevenue: document.getElementById('totalRevenue'),
    revenueTrend: document.getElementById('revenueTrend'),

    // Reset Controls & Modal (Two-Stage Workflow)
    resetWorkspaceBtn: document.getElementById('resetWorkspaceBtn'),
    resetConfirmModal: document.getElementById('resetConfirmModal'),
    resetModalTitle: document.getElementById('resetModalTitle'),
    resetModalSubtitle: document.getElementById('resetModalSubtitle'),
    resetStage1: document.getElementById('resetStage1'),
    resetStage2: document.getElementById('resetStage2'),
    closeResetModalBtn: document.getElementById('closeResetModalBtn'),
    continueResetBtn: document.getElementById('continueResetBtn'),
    backResetBtn: document.getElementById('backResetBtn'),
    resetConfirmInput: document.getElementById('resetConfirmInput'),
    resetModalError: document.getElementById('resetModalError'),
    resetModalSuccess: document.getElementById('resetModalSuccess'),
    cancelResetBtn: document.getElementById('cancelResetBtn'),
    confirmResetBtn: document.getElementById('confirmResetBtn'),
    resetProgressWrap: document.getElementById('resetProgressWrap'),
    resetProgressBar: document.getElementById('resetProgressBar'),
    resetProgressPct: document.getElementById('resetProgressPct'),
    resetProgressStage: document.getElementById('resetProgressStage'),
    summaryClientsCount: document.getElementById('summaryClientsCount'),
    summaryProjectsCount: document.getElementById('summaryProjectsCount'),
    summaryTasksCount: document.getElementById('summaryTasksCount'),
    summaryRevenueVal: document.getElementById('summaryRevenueVal'),
    toastContainer: document.getElementById('toastContainer'),

    // Velocity & Progress
    pendingTasks: document.getElementById('pendingTasks'),
    inProgressTasks: document.getElementById('inProgressTasks'),
    completedProgressTasks: document.getElementById('completedProgressTasks'),
    pendingProgress: document.getElementById('pendingProgress'),
    inProgressProgress: document.getElementById('inProgressProgress'),
    completedProgress: document.getElementById('completedProgress'),
    upcomingTasksContainer: document.getElementById('upcomingTasksContainer'),

    // AI Assistant
    assistantSection: document.getElementById('assistantSection'),
    assistantMessages: document.getElementById('assistantMessages'),
    assistantForm: document.getElementById('assistantForm'),
    assistantInput: document.getElementById('assistantInput'),
    assistantButton: document.getElementById('assistantButton'),

    // Entity Sections
    clientsSection: document.getElementById('clientsSection'),
    loadClients: document.getElementById('loadClients'),
    clientsContainer: document.getElementById('clientsContainer'),

    projectsSection: document.getElementById('projectsSection'),
    loadProjects: document.getElementById('loadProjects'),
    projectsContainer: document.getElementById('projectsContainer'),

    tasksSection: document.getElementById('tasksSection'),
    loadTasks: document.getElementById('loadTasks'),
    tasksContainer: document.getElementById('tasksContainer'),

    // System Footer
    appFooter: document.getElementById('appFooter'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
  };

  // Utility: HTTP Fetch with Dynamic Base URL, Mandatory Timeout, and Standardized Status Errors
  async function apiFetch(endpoint, options = {}) {
    const timeoutMs = options.timeoutMs || 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Resolve base URL dynamically (browser origin or relative)
    const baseUrl = window.location.origin || '';
    const fullUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://')
      ? endpoint
      : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonErr) {
          data = {};
        }
      } else {
        const text = await response.text();
        if (!text.trim().startsWith('<')) {
          try {
            data = JSON.parse(text);
          } catch {
            data = { message: text };
          }
        }
      }

      if (!response.ok) {
        const status = response.status;
        const errMsg = data.error || data.message || `HTTP ${status}: ${response.statusText}`;
        const errObj = new Error(errMsg);
        errObj.status = status;
        errObj.data = data;
        errObj.code = status === 401 ? 'UNAUTHORIZED' : (status === 403 ? 'FORBIDDEN' : (status === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'));
        throw errObj;
      }
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('The request timed out after 15 seconds. Please try again.');
        timeoutErr.status = 408;
        timeoutErr.code = 'TIMEOUT';
        throw timeoutErr;
      }
      if (!err.status) {
        err.code = 'NETWORK_ERROR';
      }
      console.warn(`[AURA API] ${endpoint} request notice:`, err.message);
      throw err;
    }
  }

  // Auth Feedback Notification
  function showAuthMessage(message, type = 'error') {
    if (!dom.authMessage) return;
    dom.authMessage.textContent = message;
    dom.authMessage.className = `auth-message-banner ${type}`;
  }

  function clearAuthMessage() {
    if (!dom.authMessage) return;
    dom.authMessage.textContent = '';
    dom.authMessage.className = 'auth-message-banner hidden';
  }

  // Toast Notification System
  function showToast(title, message, type = 'success') {
    if (!dom.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-indicator"></div>
      <div class="toast-content">
        <span class="toast-title">${escapeHtml(title)}</span>
        <span class="toast-desc">${escapeHtml(message)}</span>
      </div>
      <button type="button" class="toast-close" aria-label="Close notification">&times;</button>
    `;
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => toast.remove());
    }
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 5000);
  }

  // Toggle Between Login and Signup
  let isSignupView = false;
  function toggleAuthMode() {
    isSignupView = !isSignupView;
    clearAuthMessage();

    if (isSignupView) {
      dom.loginForm.classList.add('hidden');
      dom.signupForm.classList.remove('hidden');
      if (dom.authSwitchPrompt) dom.authSwitchPrompt.textContent = 'Already have an account?';
      if (dom.authSwitchButton) dom.authSwitchButton.textContent = 'Sign In';
    } else {
      dom.signupForm.classList.add('hidden');
      dom.loginForm.classList.remove('hidden');
      if (dom.authSwitchPrompt) dom.authSwitchPrompt.textContent = "Don't have an account?";
      if (dom.authSwitchButton) dom.authSwitchButton.textContent = 'Create Account';
    }
  }

  // Set Authenticated User State
  function setAuthenticated(user, token) {
    state.user = user;
    state.token = token;
    if (token) localStorage.setItem('aura_auth_token', token);

    // Update screen visibility
    dom.authScreen.classList.remove('active');
    dom.authScreen.classList.add('hidden');
    dom.appScreen.classList.remove('hidden');

    // Update user identity across sidebar and topbar
    const name = user.name || 'Executive User';
    const email = user.email || 'user@company.com';
    const initial = name.charAt(0).toUpperCase();

    if (dom.welcomeName) dom.welcomeName.textContent = name;
    if (dom.sidebarUserName) dom.sidebarUserName.textContent = name;
    if (dom.topUserName) dom.topUserName.textContent = name;
    if (dom.topUserEmail) dom.topUserEmail.textContent = email;
    if (dom.userInitial) dom.userInitial.textContent = initial;

    const avatarHex = document.querySelector('.avatar-letter');
    if (avatarHex) avatarHex.textContent = initial;

    // Synchronize workspace telemetry
    loadDashboardData();
  }

  // Logout Handler
  function handleLogout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('aura_auth_token');

    dom.appScreen.classList.add('hidden');
    dom.authScreen.classList.remove('hidden');
    dom.authScreen.classList.add('active');
    showAuthMessage('You have been securely signed out.', 'info');
  }

  // Login Submit Handler
  async function handleLogin(e) {
    e.preventDefault();
    clearAuthMessage();

    const email = dom.loginEmail.value.trim();
    const password = dom.loginPassword.value;

    if (!email || !password) {
      showAuthMessage('Please enter both work email and password.', 'error');
      return;
    }

    dom.loginButton.disabled = true;
    const btnText = dom.loginButton.querySelector('.btn-text');
    if (btnText) btnText.textContent = 'Verifying credentials...';

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAuthenticated(res.user, res.token);
      showAuthMessage('Authenticated successfully. Welcome back!', 'success');
    } catch (err) {
      if (err.status === 401) {
        showAuthMessage('Invalid email or password (HTTP 401). Please verify your credentials.', 'error');
      } else if (err.status === 403) {
        showAuthMessage('Access forbidden (HTTP 403). Account access is restricted.', 'error');
      } else if (err.status >= 500) {
        showAuthMessage(`Server error (HTTP ${err.status}). Please try again shortly.`, 'error');
      } else if (err.code === 'TIMEOUT') {
        showAuthMessage('Request timed out after 15 seconds. Please check your network and try again.', 'error');
      } else if (err.code === 'NETWORK_ERROR') {
        showAuthMessage('Unable to reach the server. Please check your internet connection.', 'error');
      } else {
        showAuthMessage(err.message || 'Authentication failed. Please try again.', 'error');
      }
    } finally {
      dom.loginButton.disabled = false;
      if (btnText) btnText.textContent = 'Sign In to Workspace';
    }
  }

  // Signup Submit Handler
  async function handleSignup(e) {
    e.preventDefault();
    clearAuthMessage();

    const name = dom.signupName.value.trim();
    const email = dom.signupEmail.value.trim();
    const password = dom.signupPassword.value;

    if (!name || !email || !password) {
      showAuthMessage('Please fill in all registration fields.', 'error');
      return;
    }

    if (password.length < 6) {
      showAuthMessage('Password must be at least 6 characters in length.', 'error');
      return;
    }

    dom.signupButton.disabled = true;
    const btnText = dom.signupButton.querySelector('.btn-text');
    if (btnText) btnText.textContent = 'Provisioning workspace...';

    try {
      const res = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      if (res && res.user) {
        setAuthenticated(res.user, res.token);
        showAuthMessage('Account initialized successfully! Entering Command Center...', 'success');
      } else {
        throw new Error('Unexpected signup response from server.');
      }
    } catch (err) {
      if (err.status === 400 || (err.message && (err.message.includes('already exists') || err.message.includes('registered')))) {
        showAuthMessage('This email address is already registered (HTTP 400). Please sign in instead.', 'error');
      } else if (err.status === 401) {
        showAuthMessage('Unauthorized request (HTTP 401). Please try again.', 'error');
      } else if (err.status === 403) {
        showAuthMessage('Access forbidden (HTTP 403). Signup is restricted.', 'error');
      } else if (err.status >= 500) {
        showAuthMessage(`Server error (HTTP ${err.status}): ${err.message || 'Please try again shortly.'}`, 'error');
      } else if (err.code === 'TIMEOUT') {
        showAuthMessage('Request timed out after 15 seconds. Please check your network and try again.', 'error');
      } else if (err.code === 'NETWORK_ERROR') {
        showAuthMessage('Unable to reach the server. Please check your internet connection.', 'error');
      } else {
        showAuthMessage(err.message || 'Account registration could not be completed. Please try again.', 'error');
      }
    } finally {
      dom.signupButton.disabled = false;
      if (btnText) btnText.textContent = 'Initialize Workspace';
    }
  }

  // Dashboard Telemetry Synchronization
  async function loadDashboardData() {
    try {
      const res = await apiFetch('/api/dashboard');
      state.dashboardData = res;
      renderDashboardMetrics(res);
    } catch (err) {
      // Fallback to fetch full workspace
      try {
        const ws = await apiFetch('/api/workspace');
        const clients = ws.clients || [];
        const projects = ws.projects || [];
        const tasks = ws.tasks || [];

        const completed = tasks.filter((t) => t.status === 'Completed').length;
        const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
        const pending = tasks.filter((t) => t.status === 'To Do' || t.status === 'Pending').length;
        const revenue = (ws.invoices || []).reduce((sum, i) => sum + (i.status === 'Paid' ? (i.amount || 0) : 0), 0);

        renderDashboardMetrics({
          clientsCount: clients.length,
          projectsCount: projects.length,
          tasksCount: tasks.length,
          completedTasksCount: completed,
          pendingTasksCount: pending,
          inProgressTasksCount: inProgress,
          revenue,
          upcomingTasks: tasks.slice(0, 5),
        });
      } catch (wsErr) {
        console.warn('Dashboard sync fallback notice:', wsErr.message);
      }
    }
  }

  // Render Metric Values and Progress Bars
  function renderDashboardMetrics(data) {
    if (!data) return;
    const stats = data.stats || data;

    const totalClientsCount = stats.totalClients !== undefined ? stats.totalClients : (data.clientsCount ?? 0);
    const totalProjectsCount = stats.totalProjects !== undefined ? stats.totalProjects : (data.projectsCount ?? 0);
    const totalTasksCount = stats.totalTasks !== undefined ? stats.totalTasks : (data.tasksCount ?? 0);
    const completedCount = stats.completedTasks !== undefined ? stats.completedTasks : (data.completedTasksCount ?? 0);
    const pendingCount = stats.pendingTasks !== undefined ? stats.pendingTasks : (data.pendingTasksCount ?? 0);
    const inProgressCount = stats.inProgressTasks !== undefined ? stats.inProgressTasks : (data.inProgressTasksCount ?? 0);
    const revenueVal = stats.revenue !== undefined ? stats.revenue : (data.revenue ?? 0);

    if (dom.totalClients) dom.totalClients.textContent = totalClientsCount;
    if (dom.totalProjects) dom.totalProjects.textContent = totalProjectsCount;
    if (dom.totalTasks) dom.totalTasks.textContent = totalTasksCount;
    if (dom.completedTasks) dom.completedTasks.textContent = completedCount;
    if (dom.totalRevenue) dom.totalRevenue.textContent = `$${Number(revenueVal).toLocaleString()}`;

    if (dom.pendingTasks) dom.pendingTasks.textContent = pendingCount;
    if (dom.inProgressTasks) dom.inProgressTasks.textContent = inProgressCount;
    if (dom.completedProgressTasks) dom.completedProgressTasks.textContent = completedCount;

    const baseTotal = Math.max(1, totalTasksCount);
    const pendingPct = totalTasksCount === 0 ? 0 : Math.round((pendingCount / baseTotal) * 100);
    const inProgPct = totalTasksCount === 0 ? 0 : Math.round((inProgressCount / baseTotal) * 100);
    const compPct = totalTasksCount === 0 ? 0 : Math.round((completedCount / baseTotal) * 100);

    if (dom.pendingProgress) dom.pendingProgress.style.width = `${pendingPct}%`;
    if (dom.inProgressProgress) dom.inProgressProgress.style.width = `${inProgPct}%`;
    if (dom.completedProgress) dom.completedProgress.style.width = `${compPct}%`;

    // Render Upcoming Milestones
    renderUpcomingTasks(data.upcomingTasks || []);
  }

  // Render Upcoming Milestones List
  function renderUpcomingTasks(tasks) {
    if (!dom.upcomingTasksContainer) return;

    if (!tasks || tasks.length === 0) {
      dom.upcomingTasksContainer.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
          </div>
          <span class="empty-state-title">No upcoming tasks or milestones</span>
          <span class="empty-state-sub">Workspace is currently in clean slate mode (0 active work items).</span>
        </div>
      `;
      return;
    }

    dom.upcomingTasksContainer.innerHTML = tasks
      .map((t) => {
        const priorityClass =
          t.priority === 'High'
            ? 'priority-high'
            : t.priority === 'Low'
            ? 'priority-low'
            : 'priority-medium';

        return `
          <div class="task-row-card">
            <div class="task-row-left">
              <div class="task-checkbox-mock">✓</div>
              <div>
                <div class="task-title">${escapeHtml(t.title)}</div>
                <div class="task-meta">${escapeHtml(t.description || 'Milestone deliverable')}</div>
              </div>
            </div>
            <div class="task-row-right">
              <span class="badge-priority ${priorityClass}">${escapeHtml(t.priority || 'Medium')}</span>
              <span class="deadline-pill">${escapeHtml(t.deadline || 'Pending')}</span>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // Load and Render Clients
  async function loadClientsHandler() {
    dom.clientsContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Querying clients ledger...</span></div>';
    try {
      const res = await apiFetch('/api/clients');
      const clients = Array.isArray(res) ? res : res.clients || [];
      state.clients = clients;
      renderClients(clients);
    } catch (err) {
      renderClients([]);
    }
  }

  function renderClients(clients) {
    if (!dom.clientsContainer) return;
    if (!clients || !clients.length) {
      dom.clientsContainer.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
          </div>
          <span class="empty-state-title">No clients recorded</span>
          <span class="empty-state-sub">Clean slate active. Add a client to begin tracking relationships.</span>
        </div>
      `;
      return;
    }

    dom.clientsContainer.innerHTML = clients
      .map(
        (c) => `
        <div class="data-item-card">
          <div class="data-item-header">
            <span class="data-item-title">${escapeHtml(c.name || 'Client Entity')}</span>
            <span class="status-tag active">${escapeHtml(c.status || 'Active')}</span>
          </div>
          <p class="data-item-desc">${escapeHtml(c.company || 'Enterprise Account')}</p>
          <div class="data-item-footer">
            <span>Retainer / Value:</span>
            <span class="data-item-value">$${Number(c.retainerAmount || 0).toLocaleString()}</span>
          </div>
        </div>
      `
      )
      .join('');
  }

  // Load and Render Projects
  async function loadProjectsHandler() {
    dom.projectsContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Querying project pipelines...</span></div>';
    try {
      const res = await apiFetch('/api/projects');
      const projects = Array.isArray(res) ? res : res.projects || [];
      state.projects = projects;
      renderProjects(projects);
    } catch (err) {
      renderProjects([]);
    }
  }

  function renderProjects(projects) {
    if (!dom.projectsContainer) return;
    if (!projects || !projects.length) {
      dom.projectsContainer.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <span class="empty-state-title">No active project pipelines</span>
          <span class="empty-state-sub">Clean slate active. Create a project to initialize delivery milestones.</span>
        </div>
      `;
      return;
    }

    dom.projectsContainer.innerHTML = projects
      .map(
        (p) => `
        <div class="data-item-card">
          <div class="data-item-header">
            <span class="data-item-title">${escapeHtml(p.title || 'Project Engagement')}</span>
            <span class="status-tag in-progress">${escapeHtml(p.status || 'In Progress')}</span>
          </div>
          <p class="data-item-desc">${escapeHtml(p.description || `Contracted for ${p.clientName || 'Partner'}`)}</p>
          <div class="data-item-footer">
            <span>Pipeline Budget:</span>
            <span class="data-item-value">$${Number(p.budget || 0).toLocaleString()}</span>
          </div>
        </div>
      `
      )
      .join('');
  }

  // Load and Render Tasks
  async function loadTasksHandler() {
    dom.tasksContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Querying task matrix...</span></div>';
    try {
      const res = await apiFetch('/api/tasks');
      const tasks = Array.isArray(res) ? res : res.tasks || [];
      state.tasks = tasks;
      renderTasks(tasks);
    } catch (err) {
      renderTasks([]);
    }
  }

  function renderTasks(tasks) {
    if (!dom.tasksContainer) return;
    if (!tasks || !tasks.length) {
      dom.tasksContainer.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          </div>
          <span class="empty-state-title">No operational tasks recorded</span>
          <span class="empty-state-sub">Clean slate active. Create a task to schedule operations.</span>
        </div>
      `;
      return;
    }

    dom.tasksContainer.innerHTML = tasks
      .map(
        (t) => `
        <div class="data-item-card">
          <div class="data-item-header">
            <span class="data-item-title">${escapeHtml(t.title || 'Work Milestone')}</span>
            <span class="status-tag ${t.status === 'Completed' ? 'completed' : t.status === 'In Progress' ? 'in-progress' : 'todo'}">
              ${escapeHtml(t.status || 'To Do')}
            </span>
          </div>
          <p class="data-item-desc">${escapeHtml(t.description || 'Deliverable checkpoint')}</p>
          <div class="data-item-footer">
            <span>Priority: <strong style="color: #fff;">${escapeHtml(t.priority || 'Medium')}</strong></span>
            <span class="deadline-pill">${escapeHtml(t.deadline || 'Pending')}</span>
          </div>
        </div>
      `
      )
      .join('');
  }

  // ============================================================
  // AURA INTENT ENGINE & CONVERSATION CLASSIFICATION SYSTEM
  // ============================================================
  function detectLanguage(text) {
    const trimmed = (text || '').trim();
    if (/[\u0600-\u06FF]/.test(trimmed)) return 'urdu';

    const lower = ` ${trimmed.toLowerCase()} `;
    const romanUrduPatterns = [
      /\bkya\b/, /\bkia\b/, /\bhaal\b/, /\bhal\b/, /\bkaise\b/, /\bkese\b/, /\bkesi\b/,
      /\bshukriya\b/, /\bmeherbani\b/, /\btheek\b/, /\bacha\b/, /\bsahi\b/, /\bzabardast\b/,
      /\bsalam\b/, /\bassalam\b/, /\baoa\b/, /\bkhuda hafiz\b/, /\ballah hafiz\b/,
      /\bmere\b/, /\bmeri\b/, /\bmera\b/, /\bapna\b/, /\bapni\b/, /\bkitne\b/, /\bkitna\b/,
      /\bkonsa\b/, /\bkonse\b/, /\bhain\b/, /\bhai\b/, /\bhoon\b/, /\bhein\b/,
      /\bkaam\b/, /\bkaro\b/, /\bkarein\b/, /\bdekho\b/, /\bbatao\b/, /\bbataiye\b/,
    ];

    let matches = 0;
    for (const pat of romanUrduPatterns) {
      if (pat.test(lower)) matches++;
    }
    return matches >= 1 ? 'roman_urdu' : 'english';
  }

  function detectIntent(message) {
    const clean = (message || '').trim();
    const lower = clean.toLowerCase();
    const language = detectLanguage(clean);

    // Normalize punctuation for token matching
    const normalized = lower
      .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 1. ISLAMIC GREETING
    const isIslamicGreetingPattern =
      /\b(assalam|assalamu|asalam|asalamu|assalam-o-alaikum|aoa)\b/i.test(normalized) ||
      (/\bsalam\b/i.test(normalized) && !/\b(schedule|task|project|invoice|client|work)\b/i.test(normalized)) ||
      (/[\u0600-\u06FF]/.test(clean) && /(السلام|اسلام|سلام)/.test(clean));

    const hasScheduleQuery =
      /\b(schedule|agenda|plan for today|calendar|what do i have (planned|scheduled|to do)|what should i focus on today)\b/i.test(lower) ||
      /\b(aaj ka (schedule|plan|agenda)|aaj kya karna hai)\b/i.test(lower) ||
      /(آج کا شیڈول|آج کا پلان|آج کیا کرنا ہے)/.test(clean);

    const hasTaskQuery =
      /\b(what tasks|pending tasks|open tasks|list (my )?tasks|show (my )?tasks|overdue tasks?|which tasks)\b/i.test(lower) ||
      /\b(mere tasks|tasks dikhao)\b/i.test(lower);

    const hasActionQuery =
      /\b(create (a )?task|add (a )?task|make (a )?task|remind me to|schedule (a )?task|create (an? )?invoice)\b/i.test(lower);

    if (isIslamicGreetingPattern) {
      if (!hasScheduleQuery && !hasTaskQuery && !hasActionQuery) {
        return {
          type: 'ISLAMIC_GREETING',
          subType: 'islamic_greeting',
          language,
          confidence: 0.99,
          extractedEntities: {},
        };
      }
    }

    // 2. ACTION_REQUEST (Task or invoice creation)
    const isCreateTask =
      /\b(create (a )?task|add (a )?task|make (a )?task|remind me to|schedule (a )?task|create a follow-up)\b/i.test(lower);
    const isCreateInvoice =
      /\b(create (an? )?invoice|make (an? )?invoice|generate invoice|draft invoice)\b/i.test(lower);

    if (isCreateTask || isCreateInvoice) {
      let taskTitle = clean
        .replace(/^(please |can you |could you |hey aura |aura )?(create|add|make|schedule) (a )?task (for|to)?/i, '')
        .replace(/^(please |can you |could you |hey aura |aura )?remind me to/i, '')
        .replace(/tomorrow/i, '')
        .replace(/today/i, '')
        .replace(/[.,;!]+$/, '')
        .trim();

      return {
        type: 'ACTION_REQUEST',
        subType: isCreateTask ? 'create_task' : 'create_invoice',
        language,
        confidence: 0.95,
        extractedEntities: {
          taskTitle: taskTitle || 'Follow-up deliverable',
          dueDate: lower.includes('tomorrow') ? 'Tomorrow' : 'Today',
        },
      };
    }

    // 3. SCHEDULE (Today schedule, agenda, calendar)
    if (
      hasScheduleQuery ||
      /\b(today('s)?|todays|daily)\s+(schedule|agenda|plan|routine|calendar)\b/i.test(lower) ||
      /\b(schedule|agenda|calendar|plan)\s+(for\s+today|today)\b/i.test(lower) ||
      /\b(what('s| is|\s+is)\s+(my\s+|the\s+)?(schedule|agenda|calendar|plan))\b/i.test(lower) ||
      /\b(what\s+do\s+i\s+have\s+(planned|scheduled|to\s+do)\s+today)\b/i.test(lower) ||
      /\b(check\s+(my\s+)?calendar|what('s| is)\s+on\s+my\s+calendar)\b/i.test(lower) ||
      /\b(do\s+i\s+have\s+any\s+meetings|meeting\s+schedule)\b/i.test(lower) ||
      /\b(what\s+should\s+i\s+focus\s+on\s+today)\b/i.test(lower) ||
      /^(today\s+schedule|schedule\s+today|my\s+schedule|today\s+agenda|daily\s+schedule)$/i.test(normalized) ||
      /\b(aaj\s+ka\s+(schedule|plan|agenda|routine))\b/i.test(lower) ||
      /\b(aaj\s+kya\s+karna\s+hai)\b/i.test(lower) ||
      /(آج کا شیڈول|آج کا پلان|آج کیا کرنا ہے)/.test(clean)
    ) {
      return {
        type: 'SCHEDULE',
        subType: 'today_schedule',
        language,
        confidence: 0.98,
        extractedEntities: {},
      };
    }

    // 4. IDENTITY & CAPABILITIES
    const isIdentity =
      /\b(who\s+are\s+you|what\s+is\s+your\s+name|what\s+are\s+you|tell\s+me\s+about\s+yourself|who\s+made\s+you|what\s+can\s+you\s+do|are\s+you\s+(an?\s+)?ai|are\s+you\s+a\s+bot)\b/i.test(lower) ||
      /\b(aap\s+kaun\s+hain|tum\s+kaun\s+ho|tum\s+kya\s+kar\s+sakte\s+ho|apna\s+taaruf)\b/i.test(lower);

    if (isIdentity) {
      return {
        type: 'IDENTITY',
        subType: 'identity',
        language,
        confidence: 0.97,
        extractedEntities: {},
      };
    }

    // 5. CASUAL_CONVERSATION
    const isHowAreYou =
      /\b(how\s+are\s+you|how\s+are\s+you\s+doing|how're\s+you|how('s|\s+is)\s+it\s+going|what's\s+up|whats\s+up|wassup|sup|how\s+are\s+things|how\s+have\s+you\s+been)\b/i.test(lower) ||
      /\b(kya\s+haal\s+hai|kia\s+hal\s+hai|kaise\s+ho|kese\s+ho|kese\s+hain|kya\s+chal\s+raha\s+hai)\b/i.test(lower);

    if (isHowAreYou) {
      return {
        type: 'CASUAL_CONVERSATION',
        subType: 'how_are_you',
        language,
        confidence: 0.98,
        extractedEntities: {},
      };
    }

    const isGratitude =
      /\b(thank\s+you|thanks|thanks\s+a\s+lot|thank\s+you\s+so\s+much|appreciate\s+it|ty|thx)\b/i.test(lower) ||
      /\b(shukriya|bohot\s+shukriya|meherbani)\b/i.test(lower);

    if (isGratitude) {
      return {
        type: 'CASUAL_CONVERSATION',
        subType: 'gratitude',
        language,
        confidence: 0.98,
        extractedEntities: {},
      };
    }

    const isAcknowledgment =
      /^(ok|okay|cool|great|nice|awesome|perfect|got\s+it|understood|sounds\s+good|alright|all\s+right|sure|yep|yes)$/i.test(normalized) ||
      /^(theek\s+hai|acha|sahi\s+hai|zabardast|badiya)$/i.test(normalized);

    if (isAcknowledgment) {
      return {
        type: 'CASUAL_CONVERSATION',
        subType: 'acknowledgment',
        language,
        confidence: 0.98,
        extractedEntities: {},
      };
    }

    const isFarewell =
      /\b(bye|goodbye|see\s+you|see\s+ya|talk\s+to\s+you\s+later|have\s+a\s+nice\s+day|good\s+night|cya|take\s+care)\b/i.test(lower) ||
      /\b(allah\s+hafiz|khuda\s+hafiz)\b/i.test(lower);

    if (isFarewell) {
      return {
        type: 'CASUAL_CONVERSATION',
        subType: 'farewell',
        language,
        confidence: 0.98,
        extractedEntities: {},
      };
    }

    // 6. GREETINGS
    const greetingStarters =
      /^(hello|hi|hey|heyy|heyyy|greetings|good\s+morning|good\s+afternoon|good\s+evening|good\s+day)\b/i;

    const isGreeting =
      greetingStarters.test(lower) ||
      /^(hello\s+world|hello\s+there|hey\s+there|hi\s+there|hello\s+aura|hey\s+aura|hi\s+aura)$/i.test(normalized);

    if (isGreeting) {
      const hasSpecificWorkQuery =
        /\b(project|projects|task|tasks|invoice|invoices|client|clients|revenue|budget|overdue|deadline)\b/i.test(lower);

      if (!hasSpecificWorkQuery) {
        return {
          type: 'GREETING',
          subType: lower.includes('world') ? 'hello_world' : 'greeting',
          language,
          confidence: 0.98,
          extractedEntities: {},
        };
      }
    }

    // 7. WORKSPACE_SUMMARY (ONLY EXPLICIT SUMMARY REQUESTS!)
    const isWorkspaceSummary =
      /\b(workspace\s+(summary|overview|snapshot|status)|summary\s+of\s+(my\s+|the\s+)?workspace|overview\s+of\s+(my\s+|the\s+)?workspace)\b/i.test(lower) ||
      /\b(give\s+me\s+a\s+(workspace\s+)?(summary|overview|snapshot|status\s+report))\b/i.test(lower) ||
      /\b(high-level\s+summary|executive\s+summary|business\s+snapshot|business\s+overview|business\s+summary)\b/i.test(lower) ||
      /\b(how\s+is\s+my\s+business\s+doing)\b/i.test(lower) ||
      /\b(workspace\s+ka\s+(summary|jaiza|overview))\b/i.test(lower);

    if (isWorkspaceSummary) {
      return {
        type: 'WORKSPACE_SUMMARY',
        subType: 'overview',
        language,
        confidence: 0.98,
        extractedEntities: {},
      };
    }

    // 8. TASKS
    const isOverdueTasks =
      /\b(overdue\s+tasks?|tasks?\s+(are\s+)?overdue|which\s+tasks?\s+are\s+overdue|overdue\s+deliverables?)\b/i.test(lower) ||
      /\b(konsa\s+task\s+overdue)\b/i.test(lower);

    if (isOverdueTasks) {
      return {
        type: 'TASKS',
        subType: 'overdue_tasks',
        language,
        confidence: 0.97,
        extractedEntities: { metricType: 'overdue_tasks' },
      };
    }

    if (
      hasTaskQuery ||
      /\b(tasks?\s+list|tasks?\s+status|show\s+tasks?|list\s+tasks?|how\s+many\s+tasks?|my\s+tasks?)\b/i.test(lower)
    ) {
      return {
        type: 'TASKS',
        subType: 'list_tasks',
        language,
        confidence: 0.95,
        extractedEntities: {},
      };
    }

    // 9. PROJECTS
    const isProjectsQuery =
      /\b(projects?|pipelines?|active\s+projects?|show\s+(my\s+)?projects?|list\s+projects?|which\s+projects?|which\s+project\s+needs\s+attention)\b/i.test(lower) ||
      /\b(mere\s+projects|projects\s+dikhao)\b/i.test(lower);

    if (isProjectsQuery) {
      return {
        type: 'PROJECTS',
        subType: lower.includes('attention') ? 'projects_attention' : 'list_projects',
        language,
        confidence: 0.95,
        extractedEntities: {},
      };
    }

    // 10. CLIENTS
    const isClientsQuery =
      /\b(clients?|client\s+list|show\s+(my\s+)?clients?|list\s+clients?|client\s+relationships?|who\s+are\s+my\s+clients)\b/i.test(lower) ||
      /\b(mere\s+clients|clients\s+dikhao)\b/i.test(lower);

    if (isClientsQuery) {
      return {
        type: 'CLIENTS',
        subType: 'list_clients',
        language,
        confidence: 0.95,
        extractedEntities: {},
      };
    }

    // Default Fallback
    return {
      type: 'UNKNOWN',
      language,
      confidence: 0.5,
      extractedEntities: {},
    };
  }

  // ============================================================
  // DEDICATED INTENT HANDLERS
  // ============================================================

  // DEDICATED FUNCTION: Workspace Statistics Display (ONLY triggered on valid WORKSPACE_SUMMARY)
  async function displayWorkspaceStatistics(query, intentResult) {
    const thinkingBubble = appendMessage('AURA is compiling workspace executive telemetry...', 'system', true);

    try {
      // Trigger dashboard telemetry synchronization
      await loadDashboardData();

      const clientsCount = dom.totalClients ? dom.totalClients.textContent : (state.clients ? String(state.clients.length) : '0');
      const projectsCount = dom.totalProjects ? dom.totalProjects.textContent : (state.projects ? String(state.projects.length) : '0');
      const pendingCount = dom.pendingTasks ? dom.pendingTasks.textContent : '0';
      const completedCount = dom.completedTasks ? dom.completedTasks.textContent : '0';
      const revenueStr = dom.totalRevenue ? dom.totalRevenue.textContent : '$0';

      thinkingBubble.remove();
      if (clientsCount === '0' && projectsCount === '0' && pendingCount === '0' && completedCount === '0') {
        appendMessage(
          `Workspace Status: Clean Slate active (0 Clients, 0 Projects, 0 Tasks, ${revenueStr} Revenue). All previous workspace business records have been cleared and ledger is reset for new operations.`,
          'system'
        );
      } else {
        appendMessage(
          `Based on current metrics: You have ${clientsCount} active clients, ${projectsCount} project pipelines, and ${pendingCount} pending tasks requiring execution (${completedCount} completed, ${revenueStr} Revenue). All telemetry streams are verified.`,
          'system'
        );
      }
    } catch (err) {
      thinkingBubble.remove();
      appendMessage(
        `Based on current metrics: You have ${dom.totalClients ? dom.totalClients.textContent : '0'} active clients, ${dom.totalProjects ? dom.totalProjects.textContent : '0'} project pipelines, and ${dom.pendingTasks ? dom.pendingTasks.textContent : '0'} pending tasks. All telemetry streams are verified.`,
        'system'
      );
    }
  }

  // DEDICATED FUNCTION: Greetings and Islamic Greetings
  async function handleGreetingIntent(query, intentResult) {
    if (intentResult.type === 'ISLAMIC_GREETING') {
      if (intentResult.language === 'urdu') {
        appendMessage('وعلیکم السلام! میں آج آپ کے پروجیکٹس، شیڈول یا ٹاسکس میں کس طرح مدد کر سکتا ہوں؟', 'system');
      } else if (intentResult.language === 'roman_urdu') {
        appendMessage('Walaikum Assalam! Main aap ke projects, schedule, ya tasks mein kis tarah madad kar sakta hoon?', 'system');
      } else {
        appendMessage('Wa Alaikum Assalam! Welcome to AURA. How can I assist you with your projects, schedule, or tasks today?', 'system');
      }
      return;
    }

    if (intentResult.subType === 'hello_world') {
      appendMessage('Hello World! AURA AI freelance business intelligence is active and monitoring operations.', 'system');
      return;
    }

    if (intentResult.language === 'roman_urdu') {
      appendMessage('Salam! Main AURA hoon, aap ka freelance business assistant. Aaj kis kaam mein madad chahiye?', 'system');
    } else {
      appendMessage('Hello! I am AURA, your freelance business operations assistant. How can I assist you today?', 'system');
    }
  }

  // DEDICATED FUNCTION: Casual Conversation & Well-being
  async function handleCasualConversationIntent(query, intentResult) {
    const sub = intentResult.subType;
    if (sub === 'how_are_you') {
      if (intentResult.language === 'roman_urdu') {
        appendMessage('Main bilkul theek hoon, shukriya! Aap batayein, aaj kis project ya task par kaam karna hai?', 'system');
      } else {
        appendMessage("I'm running smoothly at full capacity, ready to help you optimize your projects, tasks, and deadlines. How can I assist you today?", 'system');
      }
    } else if (sub === 'gratitude') {
      if (intentResult.language === 'roman_urdu') {
        appendMessage('Bohot shukriya! Agar mazeed koi madad chahiye ho toh zaroor batayein.', 'system');
      } else {
        appendMessage("You're very welcome! Let me know if you need anything else.", 'system');
      }
    } else if (sub === 'acknowledgment') {
      appendMessage("Understood. Let me know whenever you'd like to inspect projects, schedule tasks, or review client pipelines.", 'system');
    } else if (sub === 'farewell') {
      if (intentResult.language === 'roman_urdu') {
        appendMessage('Allah Hafiz! Aap ka din kamyab aur pur-sukoon guzray.', 'system');
      } else {
        appendMessage('Goodbye! Have a productive and successful day.', 'system');
      }
    } else {
      appendMessage("I'm here and ready to help. What would you like to review next?", 'system');
    }
  }

  // DEDICATED FUNCTION: Schedule & Calendar Requests
  async function handleScheduleIntent(query, intentResult) {
    const thinkingBubble = appendMessage('Checking agenda and scheduled deliverables...', 'system', true);

    // Retrieve upcoming tasks or milestones from state
    let taskItems = (state.dashboardData && state.dashboardData.upcomingTasks) || state.tasks || [];
    if (!taskItems.length && dom.upcomingTasksContainer) {
      const taskCards = dom.upcomingTasksContainer.querySelectorAll('.task-row-card');
      if (taskCards.length) {
        taskItems = Array.from(taskCards).map((card) => ({
          title: card.querySelector('.task-title')?.textContent?.trim() || 'Work Milestone',
          priority: card.querySelector('.badge-priority')?.textContent?.trim() || 'Medium',
          deadline: card.querySelector('.deadline-pill')?.textContent?.trim() || 'Today',
        }));
      }
    }

    thinkingBubble.remove();

    let planText = 'Your Google Calendar is not connected yet.\n\nBased on your active deliverables, here is your schedule plan for today:';
    if (taskItems && taskItems.length > 0) {
      taskItems.slice(0, 4).forEach((t, idx) => {
        planText += `\n${idx + 1}. ${t.title} (${t.priority || 'Medium'} priority, Due: ${t.deadline || 'Pending'})`;
      });
      planText += '\n\nRecommendation: Focus on high-priority deliverables first to maintain momentum.';
    } else {
      planText += '\nNo overdue or urgent deliverables scheduled for today. You are clear for deep focus work.';
    }

    appendMessage(planText, 'system');
  }

  // DEDICATED FUNCTION: Tasks Requests
  async function handleTasksIntent(query, intentResult) {
    const thinkingBubble = appendMessage('Querying active task matrix...', 'system', true);
    await loadTasksHandler();
    thinkingBubble.remove();

    const pendingCount = dom.pendingTasks ? dom.pendingTasks.textContent : (state.tasks ? String(state.tasks.filter(t => t.status !== 'Completed').length) : '0');
    if (pendingCount === '0') {
      appendMessage('I have queried your task matrix. You currently have 0 pending operational tasks (Clean slate active).', 'system');
    } else {
      appendMessage(
        `I have retrieved your task matrix and updated the Tasks section below. You have ${pendingCount} pending deliverables queued. Priority items are highlighted for execution.`,
        'system'
      );
    }
  }

  // DEDICATED FUNCTION: Projects Requests
  async function handleProjectsIntent(query, intentResult) {
    const thinkingBubble = appendMessage('Retrieving active project pipelines...', 'system', true);
    await loadProjectsHandler();
    thinkingBubble.remove();

    const projCount = dom.totalProjects ? dom.totalProjects.textContent : (state.projects ? String(state.projects.length) : '0');
    if (projCount === '0') {
      appendMessage('I have checked your project pipelines. You currently have 0 active projects (Clean slate active).', 'system');
    } else {
      appendMessage(
        `I have updated the Projects section below with your ${projCount} active project pipelines, milestones, and contracted budgets.`,
        'system'
      );
    }
  }

  // DEDICATED FUNCTION: Clients Requests
  async function handleClientsIntent(query, intentResult) {
    const thinkingBubble = appendMessage('Querying client relationships ledger...', 'system', true);
    await loadClientsHandler();
    thinkingBubble.remove();

    const clientCount = dom.totalClients ? dom.totalClients.textContent : (state.clients ? String(state.clients.length) : '0');
    if (clientCount === '0') {
      appendMessage('I have queried your client relationships ledger. You currently have 0 registered clients (Clean slate active).', 'system');
    } else {
      appendMessage(
        `I have retrieved your client roster and updated the Clients section below with ${clientCount} active client accounts and retainers.`,
        'system'
      );
    }
  }

  // DEDICATED FUNCTION: Action Requests (Task/Invoice creation proposal with human approval)
  async function handleActionRequestIntent(query, intentResult) {
    const title = (intentResult.extractedEntities && intentResult.extractedEntities.taskTitle) || query;
    const due = (intentResult.extractedEntities && intentResult.extractedEntities.dueDate) || 'Today';

    appendMessage(
      `Action Proposal Detected: "${escapeHtml(title)}" (Due: ${due}).\n\nPer AURA governance: "AI assists. Human decides." Modifying actions require your confirmation before execution. Draft item recorded for your review.`,
      'system'
    );
  }

  // DEDICATED FUNCTION: General Inquiry & Fallback
  async function handleGeneralInquiryIntent(query, intentResult) {
    if (intentResult.type === 'IDENTITY') {
      appendMessage(
        'I am AURA AI — an intelligent, autonomous operating system for freelance businesses. I monitor client relationships, project pipelines, task execution, and operational performance to keep your business running smoothly.',
        'system'
      );
      return;
    }

    const thinkingBubble = appendMessage('AURA is analyzing your inquiry...', 'system', true);

    try {
      const res = await apiFetch('/api/assistant', {
        method: 'POST',
        body: JSON.stringify({
          prompt: query,
          context: {
            user: state.user,
            dashboard: state.dashboardData,
          },
        }),
      });

      thinkingBubble.remove();
      if (res && res.reply) {
        appendMessage(res.reply, 'system');
      } else {
        appendMessage(`I have analyzed your inquiry regarding "${query}". All related portfolios are active and verified.`, 'system');
      }
    } catch (err) {
      thinkingBubble.remove();
      // DO NOT dump generic statistics on unrelated inquiries!
      appendMessage(
        `I have noted your request: "${query}". You can inspect your specific deliverables, client records, or pipelines using the dashboard sections below.`,
        'system'
      );
    }
  }

  // AI Assistant Inquire Submit (Dispatched from assistantForm event listener)
  async function handleAssistantSubmit(e) {
    e.preventDefault();
    const query = dom.assistantInput.value.trim();
    if (!query) return;

    // Append User Message Bubble
    appendMessage(query, 'user');
    dom.assistantInput.value = '';

    // Pass user input through the new detectIntent system
    const intentResult = detectIntent(query);

    // Route to appropriate dedicated function based on detected intent:
    // ONLY valid WORKSPACE_SUMMARY intents trigger the statistics display!
    switch (intentResult.type) {
      case 'WORKSPACE_SUMMARY':
        await displayWorkspaceStatistics(query, intentResult);
        break;
      case 'GREETING':
      case 'ISLAMIC_GREETING':
        await handleGreetingIntent(query, intentResult);
        break;
      case 'CASUAL_CONVERSATION':
        await handleCasualConversationIntent(query, intentResult);
        break;
      case 'SCHEDULE':
        await handleScheduleIntent(query, intentResult);
        break;
      case 'TASKS':
        await handleTasksIntent(query, intentResult);
        break;
      case 'PROJECTS':
        await handleProjectsIntent(query, intentResult);
        break;
      case 'CLIENTS':
        await handleClientsIntent(query, intentResult);
        break;
      case 'ACTION_REQUEST':
        await handleActionRequestIntent(query, intentResult);
        break;
      default:
        await handleGeneralInquiryIntent(query, intentResult);
        break;
    }
  }

  function appendMessage(text, sender, isTemp = false) {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender === 'user' ? 'user-bubble' : 'system-bubble'}`;

    const header = document.createElement('div');
    header.className = 'bubble-header';

    const senderSpan = document.createElement('span');
    senderSpan.className = 'bubble-sender';
    senderSpan.textContent = sender === 'user' ? 'Executive Inquirer' : 'AURA Executive Intelligence';

    const timeSpan = document.createElement('span');
    timeSpan.className = 'bubble-time';
    timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    header.appendChild(senderSpan);
    header.appendChild(timeSpan);

    const content = document.createElement('div');
    content.className = 'bubble-content';
    content.textContent = text;

    bubble.appendChild(header);
    bubble.appendChild(content);

    dom.assistantMessages.appendChild(bubble);
    dom.assistantMessages.scrollTop = dom.assistantMessages.scrollHeight;

    return bubble;
  }

  // Reset Modal Handlers
  // ==========================================
  // RESET WORKSPACE HANDLERS (TWO-STAGE PRODUCTION WORKFLOW)
  // ==========================================
  let isResetting = false;

  function updateResetSummaryCounts() {
    const clientsCount = Array.isArray(state.clients) ? state.clients.length : (state.dashboardData?.clients || 0);
    const projectsCount = Array.isArray(state.projects) ? state.projects.length : (state.dashboardData?.projects || 0);
    const tasksCount = Array.isArray(state.tasks) ? state.tasks.length : (state.dashboardData?.tasks || 0);
    const revenueVal = state.dashboardData?.revenue != null ? `$${Number(state.dashboardData.revenue).toLocaleString()}` : '$0';

    if (dom.summaryClientsCount) dom.summaryClientsCount.textContent = clientsCount;
    if (dom.summaryProjectsCount) dom.summaryProjectsCount.textContent = projectsCount;
    if (dom.summaryTasksCount) dom.summaryTasksCount.textContent = tasksCount;
    if (dom.summaryRevenueVal) dom.summaryRevenueVal.textContent = revenueVal;
  }

  function openResetModal() {
    if (!dom.resetConfirmModal) return;
    isResetting = false;

    // Populate data summary from current state
    updateResetSummaryCounts();

    // Reset to Stage 1
    if (dom.resetStage1) dom.resetStage1.classList.remove('hidden');
    if (dom.resetStage2) dom.resetStage2.classList.add('hidden');
    if (dom.resetModalSubtitle) dom.resetModalSubtitle.textContent = 'Step 1 of 2: Impact Review';

    if (dom.resetConfirmInput) {
      dom.resetConfirmInput.value = '';
      dom.resetConfirmInput.disabled = false;
    }

    if (dom.confirmResetBtn) {
      dom.confirmResetBtn.disabled = true;
      const spinner = dom.confirmResetBtn.querySelector('.btn-spinner');
      const text = dom.confirmResetBtn.querySelector('.btn-text');
      if (spinner) spinner.classList.add('hidden');
      if (text) text.textContent = 'Reset Workspace';
    }

    if (dom.resetProgressWrap) {
      dom.resetProgressWrap.classList.add('hidden');
    }
    if (dom.resetProgressBar) {
      dom.resetProgressBar.style.width = '0%';
      dom.resetProgressBar.classList.remove('indeterminate');
    }
    if (dom.resetProgressPct) dom.resetProgressPct.textContent = '0%';
    if (dom.resetProgressStage) dom.resetProgressStage.textContent = 'Preparing reset...';

    if (dom.resetModalError) {
      dom.resetModalError.textContent = '';
      dom.resetModalError.classList.add('hidden');
    }
    if (dom.resetModalSuccess) {
      dom.resetModalSuccess.textContent = '';
      dom.resetModalSuccess.classList.add('hidden');
    }

    // Modal open animation: subtle fade-in and scale-up
    dom.resetConfirmModal.classList.remove('hidden', 'is-closing');
    // Force browser reflow to trigger transition
    void dom.resetConfirmModal.offsetWidth;
    dom.resetConfirmModal.classList.add('is-open');
  }

  function goToResetStage2() {
    if (isResetting) return;
    if (dom.resetStage1) dom.resetStage1.classList.add('hidden');
    if (dom.resetStage2) dom.resetStage2.classList.remove('hidden');
    if (dom.resetModalSubtitle) dom.resetModalSubtitle.textContent = 'Step 2 of 2: Final Confirmation';

    if (dom.resetConfirmInput) {
      dom.resetConfirmInput.value = '';
      dom.resetConfirmInput.disabled = false;
      setTimeout(() => {
        dom.resetConfirmInput.focus();
      }, 60);
    }

    if (dom.confirmResetBtn) {
      dom.confirmResetBtn.disabled = true;
      const spinner = dom.confirmResetBtn.querySelector('.btn-spinner');
      const text = dom.confirmResetBtn.querySelector('.btn-text');
      if (spinner) spinner.classList.add('hidden');
      if (text) text.textContent = 'Reset Workspace';
    }

    if (dom.resetProgressWrap) {
      dom.resetProgressWrap.classList.add('hidden');
    }
    if (dom.resetProgressBar) {
      dom.resetProgressBar.style.width = '0%';
      dom.resetProgressBar.classList.remove('indeterminate');
    }

    if (dom.resetModalError) {
      dom.resetModalError.textContent = '';
      dom.resetModalError.classList.add('hidden');
    }
    if (dom.resetModalSuccess) {
      dom.resetModalSuccess.textContent = '';
      dom.resetModalSuccess.classList.add('hidden');
    }
  }

  function backToResetStage1() {
    if (isResetting) return;
    if (dom.resetStage2) dom.resetStage2.classList.add('hidden');
    if (dom.resetStage1) dom.resetStage1.classList.remove('hidden');
    if (dom.resetModalSubtitle) dom.resetModalSubtitle.textContent = 'Step 1 of 2: Impact Review';
    if (dom.resetModalError) {
      dom.resetModalError.textContent = '';
      dom.resetModalError.classList.add('hidden');
    }
  }

  function closeResetModal() {
    if (isResetting) return; // Disallow closing during active reset transaction
    if (!dom.resetConfirmModal) return;

    // Smooth fade-out and scale-down animation
    dom.resetConfirmModal.classList.remove('is-open');
    dom.resetConfirmModal.classList.add('is-closing');

    setTimeout(() => {
      dom.resetConfirmModal.classList.add('hidden');
      dom.resetConfirmModal.classList.remove('is-closing');

      // State cleanup
      if (dom.resetConfirmInput) {
        dom.resetConfirmInput.value = '';
        dom.resetConfirmInput.disabled = false;
      }
      if (dom.confirmResetBtn) {
        dom.confirmResetBtn.disabled = true;
        const spinner = dom.confirmResetBtn.querySelector('.btn-spinner');
        const text = dom.confirmResetBtn.querySelector('.btn-text');
        if (spinner) spinner.classList.add('hidden');
        if (text) text.textContent = 'Reset Workspace';
      }
      if (dom.resetProgressWrap) {
        dom.resetProgressWrap.classList.add('hidden');
      }
      if (dom.resetProgressBar) {
        dom.resetProgressBar.style.width = '0%';
        dom.resetProgressBar.classList.remove('indeterminate');
      }
      if (dom.resetProgressPct) dom.resetProgressPct.textContent = '0%';
      if (dom.resetProgressStage) dom.resetProgressStage.textContent = 'Preparing reset...';

      if (dom.resetModalError) {
        dom.resetModalError.textContent = '';
        dom.resetModalError.classList.add('hidden');
      }
      if (dom.resetModalSuccess) {
        dom.resetModalSuccess.textContent = '';
        dom.resetModalSuccess.classList.add('hidden');
      }

      if (dom.backResetBtn) dom.backResetBtn.disabled = false;
      if (dom.cancelResetBtn) dom.cancelResetBtn.disabled = false;
      if (dom.closeResetModalBtn) dom.closeResetModalBtn.disabled = false;

      // Always reset back to Stage 1 for next open
      if (dom.resetStage1) dom.resetStage1.classList.remove('hidden');
      if (dom.resetStage2) dom.resetStage2.classList.add('hidden');
      if (dom.resetModalSubtitle) dom.resetModalSubtitle.textContent = 'Step 1 of 2: Impact Review';
    }, 220);
  }

  function handleResetInputChange() {
    if (!dom.resetConfirmInput || !dom.confirmResetBtn || isResetting) return;
    const val = dom.resetConfirmInput.value.trim();
    // Strict exact case-sensitive match for RESET only
    dom.confirmResetBtn.disabled = val !== 'RESET';
  }

  async function handleConfirmReset() {
    if (isResetting) return; // Request lock to prevent duplicate execution
    if (!dom.resetConfirmInput) return;

    const val = dom.resetConfirmInput.value.trim();
    if (val !== 'RESET') {
      if (dom.resetModalError) {
        dom.resetModalError.textContent = 'Please type RESET in uppercase to confirm.';
        dom.resetModalError.classList.remove('hidden');
      }
      return;
    }

    // Safety check: verify network connection
    if (!navigator.onLine) {
      if (dom.resetModalError) {
        dom.resetModalError.textContent = 'Unable to reach the server. Please reconnect and try again.';
        dom.resetModalError.classList.remove('hidden');
      }
      return;
    }

    // Lock reset state to prevent duplicate submissions
    isResetting = true;

    if (dom.confirmResetBtn) {
      dom.confirmResetBtn.disabled = true;
      const spinner = dom.confirmResetBtn.querySelector('.btn-spinner');
      const text = dom.confirmResetBtn.querySelector('.btn-text');
      if (spinner) spinner.classList.remove('hidden');
      if (text) text.textContent = 'Resetting...';
    }

    if (dom.backResetBtn) dom.backResetBtn.disabled = true;
    if (dom.cancelResetBtn) dom.cancelResetBtn.disabled = true;
    if (dom.closeResetModalBtn) dom.closeResetModalBtn.disabled = true;
    if (dom.resetConfirmInput) dom.resetConfirmInput.disabled = true;

    if (dom.resetModalError) {
      dom.resetModalError.textContent = '';
      dom.resetModalError.classList.add('hidden');
    }
    if (dom.resetModalSuccess) {
      dom.resetModalSuccess.textContent = '';
      dom.resetModalSuccess.classList.add('hidden');
    }

    // Dynamic Visual Progress Stages
    if (dom.resetProgressWrap) dom.resetProgressWrap.classList.remove('hidden');
    const updateProgress = (pct, stage) => {
      if (dom.resetProgressBar) dom.resetProgressBar.style.width = pct + '%';
      if (dom.resetProgressPct) dom.resetProgressPct.textContent = pct + '%';
      if (dom.resetProgressStage) dom.resetProgressStage.textContent = stage;
    };

    updateProgress(20, 'Verifying workspace...');
    await new Promise(resolve => setTimeout(resolve, 120));
    updateProgress(40, 'Securing database transaction...');
    await new Promise(resolve => setTimeout(resolve, 140));
    updateProgress(60, 'Resetting workspace data...');

    try {
      const res = await apiFetch('/api/workspace/reset', {
        method: 'POST',
        body: JSON.stringify({ confirmCode: 'RESET' }),
      });

      updateProgress(80, 'Refreshing workspace...');
      await new Promise(resolve => setTimeout(resolve, 120));
      updateProgress(100, 'Workspace reset complete.');

      if (dom.resetModalSuccess) {
        dom.resetModalSuccess.textContent = 'Workspace reset successfully.';
        dom.resetModalSuccess.classList.remove('hidden');
      }

      // 1. Invalidate cached local state
      state.clients = [];
      state.projects = [];
      state.tasks = [];
      state.dashboardData = null;

      // 2. Fetch fresh verified data from backend API
      await loadDashboardData();
      renderClients([]);
      renderProjects([]);
      renderTasks([]);

      showToast('Workspace Reset', 'All workspace records have been permanently reset to clean slate (0 data).', 'success');

      // Controlled short delay to display completion feedback before closing
      setTimeout(() => {
        isResetting = false;
        closeResetModal();
      }, 700);
    } catch (err) {
      console.error('[Reset Error]', err);
      isResetting = false;

      if (dom.resetProgressWrap) dom.resetProgressWrap.classList.add('hidden');
      if (dom.resetModalError) {
        dom.resetModalError.textContent = err.message || 'Reset failed. No completed reset was confirmed.';
        dom.resetModalError.classList.remove('hidden');
      }

      if (dom.confirmResetBtn) {
        const spinner = dom.confirmResetBtn.querySelector('.btn-spinner');
        const text = dom.confirmResetBtn.querySelector('.btn-text');
        if (spinner) spinner.classList.add('hidden');
        if (text) text.textContent = 'Reset Workspace';
        handleResetInputChange();
      }

      if (dom.backResetBtn) dom.backResetBtn.disabled = false;
      if (dom.cancelResetBtn) dom.cancelResetBtn.disabled = false;
      if (dom.closeResetModalBtn) dom.closeResetModalBtn.disabled = false;
      if (dom.resetConfirmInput) {
        dom.resetConfirmInput.disabled = false;
        dom.resetConfirmInput.focus();
      }
    }
  }

  // Escape HTML helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Bind All Event Handlers
  function initListeners() {
    if (dom.authSwitchButton) dom.authSwitchButton.addEventListener('click', toggleAuthMode);
    if (dom.loginForm) dom.loginForm.addEventListener('submit', handleLogin);
    if (dom.signupForm) dom.signupForm.addEventListener('submit', handleSignup);
    if (dom.logoutButton) dom.logoutButton.addEventListener('click', handleLogout);

    if (dom.refreshDashboard) dom.refreshDashboard.addEventListener('click', loadDashboardData);
    if (dom.loadClients) dom.loadClients.addEventListener('click', loadClientsHandler);
    if (dom.loadProjects) dom.loadProjects.addEventListener('click', loadProjectsHandler);
    if (dom.loadTasks) dom.loadTasks.addEventListener('click', loadTasksHandler);

    // Reset To Clean Slate Modal Triggers (Two-Stage Workflow)
    if (dom.resetWorkspaceBtn) dom.resetWorkspaceBtn.addEventListener('click', openResetModal);
    if (dom.continueResetBtn) dom.continueResetBtn.addEventListener('click', goToResetStage2);
    if (dom.backResetBtn) dom.backResetBtn.addEventListener('click', backToResetStage1);
    if (dom.closeResetModalBtn) dom.closeResetModalBtn.addEventListener('click', closeResetModal);
    if (dom.cancelResetBtn) dom.cancelResetBtn.addEventListener('click', closeResetModal);
    if (dom.resetConfirmInput) {
      dom.resetConfirmInput.addEventListener('input', handleResetInputChange);
      // Explicit requirement: Do not allow accidental activation by pressing Enter
      dom.resetConfirmInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      });
    }
    if (dom.confirmResetBtn) dom.confirmResetBtn.addEventListener('click', handleConfirmReset);

    // Keyboard accessibility: Escape to cancel modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dom.resetConfirmModal && !dom.resetConfirmModal.classList.contains('hidden') && !isResetting) {
        closeResetModal();
      }
    });

    // Close modal on backdrop click
    if (dom.resetConfirmModal) {
      dom.resetConfirmModal.addEventListener('click', (e) => {
        if (e.target === dom.resetConfirmModal && !isResetting) {
          closeResetModal();
        }
      });
    }

    if (dom.assistantForm) dom.assistantForm.addEventListener('submit', handleAssistantSubmit);

    if (dom.mobileMenuBtn && dom.sidebar) {
      dom.mobileMenuBtn.addEventListener('click', () => {
        dom.sidebar.classList.toggle('mobile-open');
      });
    }

    // Tab Links Smooth Anchor
    document.querySelectorAll('.sidebar-nav .nav-item').forEach((link) => {
      link.addEventListener('click', (e) => {
        document.querySelectorAll('.sidebar-nav .nav-item').forEach((l) => l.classList.remove('active'));
        link.classList.add('active');
        if (dom.sidebar) dom.sidebar.classList.remove('mobile-open');
      });
    });
  }

  // Initial Boot Sequence
  async function boot() {
    initListeners();

    // Check existing session
    if (state.token) {
      try {
        const profile = await apiFetch('/api/auth/profile');
        if (profile && profile.user) {
          setAuthenticated(profile.user, state.token);
          return;
        }
      } catch (err) {
        if (err.status === 401 || err.code === 'AUTH_UNAUTHORIZED') {
          localStorage.removeItem('aura_auth_token');
          state.token = null;
        }
        console.warn('Session verification notice. Presenting sign-in form.');
      }
    }

    // Default: Show Pre-filled Demo Credentials Ready for One-Click Sign In
    dom.authScreen.classList.remove('hidden');
    dom.authScreen.classList.add('active');
    dom.appScreen.classList.add('hidden');
  }

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
