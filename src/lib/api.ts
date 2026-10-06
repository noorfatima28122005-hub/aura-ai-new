import {
  Client,
  Project,
  Task,
  TaskCategory,
  Invoice,
  Lead,
  WorkspaceData,
  UserProfile,
  ConnectedAccount,
} from '../types';
import { emptyWorkspace } from '../data/initialData';

// ==========================================
// CONFIGURATION & DYNAMIC BASE URL
// ==========================================

export function getApiBaseUrl(): string {
  // 1. Vite environment variables if configured
  const metaEnv = (import.meta as any)?.env;
  const envUrl =
    (metaEnv?.VITE_API_BASE_URL as string | undefined) ||
    (metaEnv?.VITE_APP_URL as string | undefined);
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. In browser, relative URLs (/api/...) automatically resolve to window.location.origin
  // Returning empty string preserves origin-relative routing, which handles both local dev and production proxied origins
  return '';
}

// ==========================================
// ERROR HANDLING & TYPING
// ==========================================

export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_DUPLICATE_EMAIL'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN_ERROR';

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  data?: any;

  constructor(message: string, code: ApiErrorCode = 'UNKNOWN_ERROR', status = 0, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

/**
 * Returns a human-friendly user message based on the API error.
 * Accurately surfaces status codes (401, 403, etc.) without defaulting to generic connection error.
 */
export function getFriendlyErrorMessage(err: unknown, fallbackMessage = 'An unexpected error occurred.'): string {
  // Firebase Auth Error Code Handling
  const firebaseCode = (err as any)?.code || '';
  if (typeof firebaseCode === 'string' && firebaseCode.startsWith('auth/')) {
    switch (firebaseCode) {
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing authentication. Please try again.';
      case 'auth/popup-blocked':
        return 'Google Sign-In popup was blocked by your browser. Please allow popups for aura-ai-by-noor-green.vercel.app and try again.';
      case 'auth/unauthorized-domain':
        return 'Domain not authorized (auth/unauthorized-domain): Please ensure aura-ai-by-noor-green.vercel.app is added to Firebase Authentication > Settings > Authorized domains.';
      case 'auth/operation-not-allowed':
        return 'Google sign-in is not enabled in Firebase Console (auth/operation-not-allowed). Please enable it under Authentication > Sign-in method.';
      case 'auth/network-request-failed':
        return 'Network connection error contacting Firebase Authentication. Please check your internet connection and try again.';
      case 'auth/invalid-api-key':
        return 'Firebase configuration error: Invalid API key (auth/invalid-api-key).';
      case 'auth/app-not-authorized':
        return 'This app is not authorized to use Firebase Authentication with the provided API key.';
      case 'auth/invalid-oauth-client-id':
        return 'Google OAuth Client ID is invalid or not registered for this project in Google Cloud Console.';
      case 'auth/cancelled-popup-request':
        return 'Another authentication popup is already active. Please finish or close the open popup.';
      case 'auth/user-disabled':
        return 'This user account has been disabled. Please contact workspace support.';
      default:
        return (err as any)?.message || 'Firebase authentication failed.';
    }
  }

  if (err instanceof ApiError) {
    // Specific HTTP Status Code Handling
    if (err.status === 401) {
      if (err.code === 'AUTH_INVALID_CREDENTIALS' || err.message.toLowerCase().includes('password') || err.message.toLowerCase().includes('credential')) {
        return 'Invalid email or password (401). Please check your credentials and try again.';
      }
      return 'Session expired or unauthorized (401). Please sign in again.';
    }
    if (err.status === 403 || err.code === 'AUTH_FORBIDDEN') {
      return 'Access forbidden (403). You do not have permission to access this resource.';
    }
    if (err.status === 404 || err.code === 'NOT_FOUND') {
      return 'Requested resource not found (404).';
    }
    if (err.status === 409 || err.code === 'AUTH_DUPLICATE_EMAIL' || err.code === 'CONFLICT') {
      return 'This email address is already registered. Please sign in instead.';
    }
    if (err.status === 422) {
      return err.message || 'Please check the information you entered (422).';
    }
    if (err.status === 429 || err.code === 'RATE_LIMITED') {
      return 'Too many requests (429). Please wait a moment before trying again.';
    }
    if (err.status >= 500) {
      return `Server error (${err.status}): ${err.message || 'Please try again shortly.'}`;
    }

    // Specific Client Error Codes
    if (err.code === 'TIMEOUT') {
      return 'The request timed out (15s). Please check your connection and try again.';
    }
    if (err.code === 'NETWORK_ERROR') {
      return 'Unable to reach the server. Please check your internet connection.';
    }
    if (err.code === 'VALIDATION_ERROR' && err.message) {
      return err.message;
    }
    if (err.message && !err.message.includes('<!DOCTYPE') && !err.message.includes('JSON')) {
      return err.message;
    }
  }

  if (err instanceof Error) {
    const msg = err.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
      return 'Unable to reach the server. Please check your connection and try again.';
    }
    if (msg.includes('Unexpected token') || msg.includes('is not valid JSON')) {
      return 'The server returned an unexpected response. Please try again shortly.';
    }
    if (msg && !msg.includes('<!DOCTYPE')) {
      return msg;
    }
  }

  return fallbackMessage;
}

// ==========================================
// CORE REQUEST HELPER
// ==========================================

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { timeoutMs = 15000, params, ...fetchOptions } = options;

  // Build target URL
  const baseUrl = getApiBaseUrl();
  let fullUrl = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const query = searchParams.toString();
    if (query) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + query;
    }
  }

  // Setup headers with auth token and json default
  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('aura_auth_token') : null;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Abort controller with timeout protection and external signal cancellation
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  if (fetchOptions.signal) {
    if (fetchOptions.signal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      fetchOptions.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        controller.abort();
      }, { once: true });
    }
  }

  try {
    const res = await fetch(fullUrl, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response safely
    const contentType = res.headers.get('content-type') || '';
    let responseData: any = null;

    if (contentType.includes('application/json')) {
      try {
        responseData = await res.json();
      } catch (jsonErr) {
        console.warn('[API] Failed to parse JSON response:', jsonErr);
        responseData = null;
      }
    } else {
      const text = await res.text();
      // If response is HTML, do not treat text as valid error payload
      if (!text.trim().startsWith('<')) {
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = { message: text };
        }
      } else {
        responseData = { error: `Server returned unexpected format (${res.status})` };
      }
    }

    if (!res.ok) {
      const status = res.status;
      let errorCode: ApiErrorCode = 'SERVER_ERROR';
      let errorMessage = responseData?.error || responseData?.message || `Request failed with status ${status}`;

      if (status === 401) {
        errorCode = errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('credentials')
          ? 'AUTH_INVALID_CREDENTIALS'
          : 'AUTH_UNAUTHORIZED';
      } else if (status === 403) {
        errorCode = 'AUTH_FORBIDDEN';
      } else if (status === 400) {
        if (errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('registered')) {
          errorCode = 'AUTH_DUPLICATE_EMAIL';
        } else {
          errorCode = 'VALIDATION_ERROR';
        }
      } else if (status === 409) {
        errorCode = 'AUTH_DUPLICATE_EMAIL';
      } else if (status === 422) {
        errorCode = 'VALIDATION_ERROR';
      } else if (status === 404) {
        errorCode = 'NOT_FOUND';
      } else if (status === 429) {
        errorCode = 'RATE_LIMITED';
      } else if (status === 502 || status === 503 || status === 504) {
        errorCode = 'SERVICE_UNAVAILABLE';
      }

      throw new ApiError(errorMessage, errorCode, status, responseData);
    }

    return responseData as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      if (timedOut) {
        throw new ApiError(
          'The server took too long to respond (15s timeout).',
          'TIMEOUT',
          408
        );
      }
      throw new ApiError('Request was cancelled.', 'UNKNOWN_ERROR', 0);
    }

    // Network failures or CORS rejections
    console.warn('[API Network Note]:', err?.message || err);
    throw new ApiError(
      err?.message || 'Unable to connect to the server. Please verify your connection.',
      'NETWORK_ERROR',
      0
    );
  }
}

// ==========================================
// CENTRAL REQUEST EXPORTS & HTTP METHODS
// ==========================================

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
  code?: ApiErrorCode;
}

/**
 * Standard normalized request helper returning { ok, status, data, error, code }
 */
export async function request<T = any>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  try {
    const data = await apiRequest<T>(path, options);
    return {
      ok: true,
      status: 200,
      data,
    };
  } catch (err: any) {
    if (err instanceof ApiError) {
      return {
        ok: false,
        status: err.status || 0,
        code: err.code,
        error: err.message,
        data: err.data,
      };
    }
    return {
      ok: false,
      status: 0,
      code: 'UNKNOWN_ERROR',
      error: err?.message || 'An unexpected error occurred.',
      data: null as any,
    };
  }
}

export const api = {
  request,
  get: <T = any>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T = any>(path: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    }),
  put: <T = any>(path: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    }),
  patch: <T = any>(path: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    }),
  delete: <T = any>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};

// ==========================================
// AUTHENTICATION API
// ==========================================

export async function apiCheckEmail(email: string): Promise<boolean> {
  if (!email || !email.includes('@')) return false;
  try {
    const res = await apiRequest<{ exists: boolean }>('/api/auth/check-email', {
      method: 'GET',
      params: { email: email.trim().toLowerCase() },
      timeoutMs: 5000,
    });
    return !!res.exists;
  } catch {
    return false;
  }
}

export interface LoginResponse {
  success: boolean;
  user: UserProfile;
  token: string;
  message: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  companyName?: string;
  role?: string;
  businessDomain?: string;
  teamSize?: string;
  primaryServices?: string[];
  averageProjectValue?: string;
  aiAssistanceLevel?: string;
  avatarUrl?: string;
  photoUrl?: string;
  workspaceType?: string;
  accountType?: string;
}

export interface SignupResponse {
  success: boolean;
  user: UserProfile;
  token: string;
  message: string;
}

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
    timeoutMs: 15000,
  });
}

export async function apiSignup(payload: SignupPayload): Promise<SignupResponse> {
  return apiRequest<SignupResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      email: payload.email.trim(),
      name: payload.name.trim() || 'Workspace Director',
    }),
    timeoutMs: 15000,
  });
}

export async function apiGetMe(): Promise<{ authenticated: boolean; user: UserProfile }> {
  return apiRequest<{ authenticated: boolean; user: UserProfile }>('/api/auth/me', {
    method: 'GET',
    timeoutMs: 10000,
  });
}

export async function apiLogout(): Promise<{ success: boolean }> {
  try {
    return await apiRequest<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
      timeoutMs: 5000,
    });
  } catch {
    return { success: true };
  }
}

export async function apiGetAuthConfig(): Promise<{
  googleClientId: string;
  configured: boolean;
  defaultEmail: string;
  defaultName: string;
}> {
  return apiRequest('/api/auth/config', {
    method: 'GET',
    timeoutMs: 10000,
  });
}

export async function apiGoogleAuth(payload: {
  email: string;
  name?: string;
  credential?: string;
  isGoogleAuth?: boolean;
}): Promise<{ success: boolean; user: UserProfile; token: string }> {
  return apiRequest('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: 15000,
  });
}

export async function apiUpdateProfile(payload: Partial<UserProfile> & { id: string }): Promise<{
  success: boolean;
  user: UserProfile;
  message?: string;
}> {
  return apiRequest('/api/auth/profile', {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: 15000,
  });
}

// ==========================================
// WORKSPACE API
// ==========================================

export async function apiFetchWorkspace(): Promise<WorkspaceData> {
  const json = await apiRequest<{ success: boolean; data: WorkspaceData }>('/api/workspace', {
    method: 'GET',
    timeoutMs: 15000,
  });
  return json.data;
}

export async function apiResetWorkspace(
  empty: boolean,
  confirmCode?: string
): Promise<WorkspaceData> {
  const json = await apiRequest<{
    success: boolean;
    data: any;
    workspace?: WorkspaceData;
  }>('/api/workspace/reset', {
    method: 'POST',
    body: JSON.stringify({ empty, confirmCode: confirmCode || (empty ? 'RESET' : undefined) }),
    timeoutMs: 15000,
  });

  if (json.workspace) {
    return json.workspace;
  }
  if (json.data && Array.isArray(json.data.clients)) {
    return json.data;
  }
  return emptyWorkspace;
}

// ==========================================
// CLIENTS API
// ==========================================

export async function apiGetClients(): Promise<Client[]> {
  return apiRequest<Client[]>('/api/clients');
}

export async function apiCreateClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
  const data = await apiRequest<{ success: boolean; client: Client }>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  });
  return data.client;
}

export async function apiUpdateClient(id: string, updates: Partial<Client>): Promise<Client> {
  const data = await apiRequest<{ success: boolean; client: Client }>(`/api/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.client;
}

export async function apiDeleteClient(
  id: string
): Promise<{ deletedClient: Client; affectedProjectsCount: number; affectedInvoicesCount: number }> {
  return apiRequest(`/api/clients/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// LEADS API
// ==========================================

export async function apiCreateLead(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
  const data = await apiRequest<{ success: boolean; lead: Lead }>('/api/leads', {
    method: 'POST',
    body: JSON.stringify(lead),
  });
  return data.lead;
}

// ==========================================
// PROJECTS API
// ==========================================

export async function apiGetProjects(): Promise<Project[]> {
  return apiRequest<Project[]>('/api/projects');
}

export async function apiCreateProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
  const data = await apiRequest<{ success: boolean; project: Project }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });
  return data.project;
}

export async function apiUpdateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const data = await apiRequest<{ success: boolean; project: Project }>(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.project;
}

export async function apiDeleteProject(
  id: string
): Promise<{ deletedProject: Project; affectedTasksCount: number }> {
  return apiRequest(`/api/projects/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// TASKS API
// ==========================================

export async function apiGetTasks(): Promise<Task[]> {
  return apiRequest<Task[]>('/api/tasks');
}

export async function apiCreateTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
  const data = await apiRequest<{ success: boolean; task: Task }>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
  return data.task;
}

export async function apiUpdateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const data = await apiRequest<{ success: boolean; task: Task }>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.task;
}

export async function apiDeleteTask(id: string): Promise<Task> {
  const data = await apiRequest<{ success: boolean; deletedTask: Task }>(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
  return data.deletedTask;
}

export async function apiCategorizeTask(payload: {
  title: string;
  description?: string;
  notes?: string;
  priority?: string;
  projectId?: string;
  projectName?: string;
  projectPriority?: string;
  deadline?: string;
}): Promise<{ category: TaskCategory; reasoning: string }> {
  const data = await apiRequest<{ success: boolean; category: TaskCategory; reasoning: string }>(
    '/api/tasks/categorize',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      timeoutMs: 30000,
    }
  );
  return { category: data.category, reasoning: data.reasoning };
}

export async function apiAutoCategorizeAllTasks(): Promise<{
  success: boolean;
  count: number;
  tasks: Task[];
}> {
  return apiRequest('/api/tasks/auto-categorize-all', {
    method: 'POST',
    timeoutMs: 45000,
  });
}

export async function apiCategorizeExistingTask(
  id: string
): Promise<{ task: Task; category: TaskCategory; reasoning: string }> {
  return apiRequest(`/api/tasks/${id}/categorize`, {
    method: 'POST',
    timeoutMs: 30000,
  });
}

// ==========================================
// INVOICES API
// ==========================================

export async function apiGetInvoices(): Promise<Invoice[]> {
  return apiRequest<Invoice[]>('/api/invoices');
}

export async function apiCreateInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> {
  const data = await apiRequest<{ success: boolean; invoice: Invoice }>('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(invoice),
  });
  return data.invoice;
}

export async function apiUpdateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
  const data = await apiRequest<{ success: boolean; invoice: Invoice }>(`/api/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.invoice;
}

export async function apiDeleteInvoice(id: string): Promise<Invoice> {
  const data = await apiRequest<{ success: boolean; deletedInvoice: Invoice }>(
    `/api/invoices/${id}`,
    {
      method: 'DELETE',
    }
  );
  return data.deletedInvoice;
}

// ==========================================
// AI & INTELLIGENCE API
// ==========================================

export async function apiGeminiChat(payload: {
  message: string;
  history?: Array<{ role: string; parts: Array<{ text: string }> }>;
  modelRole?: string;
  enableSearch?: boolean;
  enableMaps?: boolean;
  userLocation?: { latitude: number; longitude: number };
  workspaceContext?: any;
}): Promise<{
  reply?: string;
  error?: string;
  searchSources?: Array<{ title: string; url: string }>;
  groundingMetadata?: any;
}> {
  return apiRequest('/api/gemini-chat', {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: 60000,
  });
}

export async function apiAskAura(payload: {
  query: string;
  context?: any;
}): Promise<{
  reply?: string;
  actionTaken?: boolean;
  actionSummary?: string;
  updatedEntity?: string;
  dataUpdated?: boolean;
}> {
  return apiRequest('/api/ask-aura', {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: 60000,
  });
}

// ==========================================
// INTEGRATIONS & CONNECTED ACCOUNTS API
// ==========================================

export async function apiGetIntegrations(): Promise<ConnectedAccount[]> {
  const data = await apiRequest<{ success: boolean; accounts: ConnectedAccount[] }>('/api/integrations');
  return data.accounts || [];
}

export async function apiConnectIntegration(
  id: string,
  options?: { permissions?: string[]; accountIdentifier?: string }
): Promise<ConnectedAccount> {
  const data = await apiRequest<{ success: boolean; account: ConnectedAccount }>(
    `/api/integrations/${id}/connect`,
    {
      method: 'POST',
      body: JSON.stringify(options || {}),
    }
  );
  return data.account;
}

export async function apiDisconnectIntegration(id: string): Promise<ConnectedAccount> {
  const data = await apiRequest<{ success: boolean; account: ConnectedAccount }>(
    `/api/integrations/${id}/disconnect`,
    {
      method: 'POST',
    }
  );
  return data.account;
}

export async function apiSyncIntegration(id: string): Promise<ConnectedAccount> {
  const data = await apiRequest<{ success: boolean; account: ConnectedAccount }>(
    `/api/integrations/${id}/sync`,
    {
      method: 'POST',
    }
  );
  return data.account;
}

export async function apiReconnectIntegration(id: string): Promise<ConnectedAccount> {
  const data = await apiRequest<{ success: boolean; account: ConnectedAccount }>(
    `/api/integrations/${id}/reconnect`,
    {
      method: 'POST',
    }
  );
  return data.account;
}

export async function apiUpdateIntegrationPermissions(
  id: string,
  permissions: string[]
): Promise<ConnectedAccount> {
  const data = await apiRequest<{ success: boolean; account: ConnectedAccount }>(
    `/api/integrations/${id}/permissions`,
    {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    }
  );
  return data.account;
}

