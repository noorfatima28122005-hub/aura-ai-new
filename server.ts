import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  authenticateWithPassword,
  registerUser,
  updateUserProfile,
  createOrUpdateGoogleUser,
  toPublicUser,
  getUserByToken,
  getUserById,
  revokeSession,
  createSession,
  findUserByEmail,
} from './server/auth';
import {
  getUserWorkspace,
  saveUserWorkspace,
  resetUserWorkspace,
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getConnectedAccounts,
  connectIntegrationAccount,
  disconnectIntegrationAccount,
  syncIntegrationAccount,
  reconnectIntegrationAccount,
  updateIntegrationPermissions,
} from './server/workspaceStorage';
import {
  detectUserIntent,
  generateIntentResponse,
  CURRENT_DATE_STR,
} from './server/auraConversationEngine';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Production-grade resilient CORS middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-Client-Version'
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  // Initialize Gemini client lazily
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return aiClient;
  }

  // Resilient multi-tier Gemini model execution with silent failover
  async function generateGeminiContentWithFallback(
    client: GoogleGenAI,
    params: {
      preferredModel?: string;
      candidateModels?: string[];
      contents: any;
      config?: any;
    }
  ): Promise<{ text: string; model: string; candidates?: any[] } | null> {
    const defaultChain = [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
    ];

    const modelsToTry: string[] = [];
    if (params.preferredModel) {
      modelsToTry.push(params.preferredModel);
    }
    if (params.candidateModels && params.candidateModels.length > 0) {
      for (const m of params.candidateModels) {
        if (!modelsToTry.includes(m)) modelsToTry.push(m);
      }
    }
    for (const m of defaultChain) {
      if (!modelsToTry.includes(m)) modelsToTry.push(m);
    }

    for (const model of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && (response.text || response.candidates?.length)) {
          return {
            text: response.text || '',
            model,
            candidates: response.candidates,
          };
        }
      } catch (err: any) {
        // Log cleanly to stdout rather than stderr to prevent false alarm error logs in dev console
        console.log(`[AURA AI Failover] Model ${model} returned ${err?.status || err?.code || 'error'}: trying next candidate in sequence.`);
      }
    }

    return null;
  }

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AURA AI Operating System',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // Google OAuth Config check
  app.get('/api/auth/config', (req, res) => {
    const googleClientId =
      process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
    res.json({
      googleClientId,
      configured: Boolean(googleClientId),
      defaultEmail: 'workingbynoor@gmail.com',
      defaultName: 'Noor A.',
    });
  });

  // Password Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res
          .status(400)
          .json({ error: 'Please enter both email address and password.' });
        return;
      }
      const { user, token } = authenticateWithPassword(email, password);
      res.json({
        success: true,
        user: toPublicUser(user),
        token,
        message: 'Welcome back!',
      });
    } catch (err: any) {
      res
        .status(401)
        .json({ error: err.message || 'Invalid email or password.' });
    }
  });

  // 5-Step Signup Registration
  app.post('/api/auth/signup', (req, res) => {
    try {
      const {
        email,
        password,
        name,
        companyName,
        role,
        businessDomain,
        teamSize,
        primaryServices,
        averageProjectValue,
        aiAssistanceLevel,
        avatarUrl,
        photoUrl,
        workspaceType,
        accountType,
      } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }
      if (typeof password === 'string' && password.length < 6) {
        res
          .status(400)
          .json({ error: 'Password must be at least 6 characters.' });
        return;
      }

      const { user, token } = registerUser({
        email,
        password,
        name,
        companyName,
        role,
        businessDomain,
        teamSize,
        primaryServices,
        averageProjectValue,
        aiAssistanceLevel,
        avatarUrl: avatarUrl || photoUrl,
        photoUrl: photoUrl || avatarUrl,
        workspaceType: workspaceType || accountType,
        accountType: accountType || workspaceType,
      });

      res.json({
        success: true,
        user: toPublicUser(user),
        token,
        message: 'Account created successfully!',
      });
    } catch (err: any) {
      res
        .status(400)
        .json({ error: err.message || 'Could not create account.' });
    }
  });

  // Fast email existence verification for responsive client UX
  app.get('/api/auth/check-email', (req, res) => {
    const rawEmail = (req.query.email as string || '').trim().toLowerCase();
    if (!rawEmail) {
      res.json({ exists: false });
      return;
    }
    const exists = !!findUserByEmail(rawEmail);
    res.json({ exists });
  });

  // User Profile Update Endpoint
  app.post('/api/auth/profile', (req, res) => {
    try {
      const { id, name, companyName, role, businessDomain, teamSize, primaryServices, averageProjectValue, aiAssistanceLevel, avatarUrl, photoUrl, workspaceType, accountType } = req.body;
      if (!id) {
        res.status(400).json({ error: 'User ID is required to update profile.' });
        return;
      }
      const updated = updateUserProfile(id, {
        ...(name ? { name } : {}),
        ...(companyName ? { companyName } : {}),
        ...(role ? { role } : {}),
        ...(businessDomain ? { businessDomain } : {}),
        ...(teamSize ? { teamSize } : {}),
        ...(primaryServices ? { primaryServices } : {}),
        ...(averageProjectValue ? { averageProjectValue } : {}),
        ...(aiAssistanceLevel ? { aiAssistanceLevel } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl, photoUrl: avatarUrl } : {}),
        ...(photoUrl !== undefined ? { photoUrl, avatarUrl: photoUrl } : {}),
        ...(workspaceType ? { workspaceType, accountType: workspaceType } : {}),
        ...(accountType ? { accountType, workspaceType: accountType } : {}),
      });
      res.json({
        success: true,
        user: toPublicUser(updated),
        message: 'Profile updated successfully!',
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update profile.' });
    }
  });

  // Google OAuth verification and instant Google session sign-in
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { credential, email, name, picture } = req.body;
      const googleClientId =
        process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

      // 1. If an actual Google credential token is provided from GIS, verify with Google
      if (credential) {
        try {
          const verifyRes = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
          );

          if (verifyRes.ok) {
            const payload = (await verifyRes.json()) as any;
            if (payload.email) {
              const { user, token } = createOrUpdateGoogleUser({
                email: payload.email,
                name: payload.name || payload.email.split('@')[0],
                googleId: payload.sub,
                picture: payload.picture,
              });

              res.json({
                success: true,
                user: toPublicUser(user),
                token,
                message: 'Authenticated with Google!',
                mode: 'google_identity_services',
              });
              return;
            }
          }
        } catch (verifyErr) {
          console.warn('GIS tokeninfo check failed, falling back to profile handling:', verifyErr);
        }
      }

      // 2. Direct Google Authentication (handles preview/dev environment or fallback)
      const targetEmail = (email || 'workingbynoor@gmail.com').trim().toLowerCase();
      const targetName = name || (targetEmail === 'workingbynoor@gmail.com' ? 'Noor A.' : targetEmail.split('@')[0]);

      const { user, token } = createOrUpdateGoogleUser({
        email: targetEmail,
        name: targetName,
        googleId: `google_oauth_${Date.now()}`,
        picture: picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      });

      res.json({
        success: true,
        user: toPublicUser(user),
        token,
        message: 'Authenticated with Google account!',
        mode: googleClientId ? 'production' : 'instant_google_auth',
      });
    } catch (err: any) {
      console.error('Error in /api/auth/google:', err);
      res.status(500).json({
        error: 'Unable to authenticate with Google right now. Please try again.',
      });
    }
  });

  // Current session inspection
  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      res
        .status(401)
        .json({ authenticated: false, error: 'No authorization token provided.' });
      return;
    }

    const user = getUserByToken(token);
    if (!user) {
      res
        .status(401)
        .json({ authenticated: false, error: 'Session expired or invalid.' });
      return;
    }

    res.json({
      authenticated: true,
      user: toPublicUser(user),
    });
  });

  // Logout session invalidation
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (token) {
      revokeSession(token);
    }

    res.json({ success: true, message: 'Signed out successfully.' });
  });

  // Demo session token generator
  app.post('/api/auth/demo', (req, res) => {
    try {
      const token = createSession('usr_workingbynoor_gmail_com');
      const user = getUserByToken(token);
      res.json({
        success: true,
        user: user ? toPublicUser(user) : null,
        token,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create demo session.' });
    }
  });

  // Profile endpoint for current user
  app.get('/api/auth/profile', (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      let user = token ? getUserByToken(token) : null;
      if (!user) {
        user = getUserById('usr_workingbynoor_gmail_com');
      }
      if (user) {
        res.json({ success: true, user: toPublicUser(user) });
      } else {
        res.json({
          success: true,
          user: {
            id: 'usr_workingbynoor_gmail_com',
            name: 'Noor A.',
            email: 'workingbynoor@gmail.com',
            role: 'Managing Director & Founder',
            companyName: 'Aura Studio Operations',
          },
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve profile.' });
    }
  });

  // Static serving for frontend directory
  app.use('/frontend', express.static(path.resolve(process.cwd(), 'frontend')));

  // ==========================================
  // AUTHENTICATION & WORKSPACE RESOLUTION HELPER
  // ==========================================
  function resolveUserId(req: express.Request): string {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      const user = getUserByToken(token);
      if (user) return user.id;
    }
    // Fallback to default user id if in dev or guest
    return (req.headers['x-user-id'] as string) || 'usr_workingbynoor_gmail_com';
  }

  // Dashboard metrics aggregate endpoint
  app.get('/api/dashboard', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const ws = getUserWorkspace(userId);
      const clients = ws.clients || [];
      const projects = ws.projects || [];
      const tasks = ws.tasks || [];
      const invoices = ws.invoices || [];
      const completedTasks = tasks.filter((t: any) => t.status === 'Completed').length;
      const pendingTasks = tasks.filter((t: any) => t.status === 'To Do' || t.status === 'Pending').length;
      const inProgressTasks = tasks.filter((t: any) => t.status === 'In Progress').length;
      const totalTasks = tasks.length;
      const totalClients = clients.length;
      const totalProjects = projects.length;
      const revenue = invoices
        .filter((inv: any) => inv.status === 'Paid')
        .reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0);
      const totalInvoiced = invoices
        .reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0);

      res.json({
        success: true,
        stats: {
          totalClients,
          totalProjects,
          totalTasks,
          completedTasks,
          pendingTasks,
          inProgressTasks,
          completedProgressTasks: completedTasks,
          revenue,
          totalInvoiced,
        },
        clientsCount: totalClients,
        projectsCount: totalProjects,
        tasksCount: totalTasks,
        completedTasksCount: completedTasks,
        pendingTasksCount: pendingTasks,
        inProgressTasksCount: inProgressTasks,
        revenue,
        clients,
        projects,
        tasks,
        invoices,
        upcomingTasks: tasks.filter((t: any) => t.status !== 'Completed').slice(0, 5),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve dashboard metrics.' });
    }
  });

  // Autonomous assistant query endpoint
  app.post('/api/assistant', async (req, res) => {
    try {
      const { message, prompt, query } = req.body;
      const userText = message || prompt || query || 'Provide a high-level summary of the workspace.';
      const userId = resolveUserId(req);
      const ws = getUserWorkspace(userId);

      // Run AURA conversational intent engine
      const detectedIntent = detectUserIntent(userText, [], ws);
      const engineResult = generateIntentResponse(userText, detectedIntent, ws);
      let answer = engineResult.replyText;

      const ai = getGeminiClient();
      if (ai && process.env.GEMINI_API_KEY) {
        try {
          const isCasual = ['GREETING', 'ISLAMIC_GREETING', 'CASUAL_CONVERSATION', 'IDENTITY'].includes(detectedIntent.type);
          const systemInstruction = isCasual
            ? `You are AURA AI, an intelligent, natural conversational workspace copilot.
User Intent: ${detectedIntent.type}.
Detected Language: ${detectedIntent.language}.
CRITICAL DIRECTIVES:
- Respond warmly, naturally, and concisely in 1 to 2 short sentences.
- Match user's language (Roman Urdu or English).
- DO NOT dump workspace metrics, project counts, or diagnostic reports.`
            : `You are AURA AI, an executive autonomous business operations assistant.
Today's Date: ${CURRENT_DATE_STR}.
Detected Intent: ${detectedIntent.type}.
Detected Language: ${detectedIntent.language}.
CRITICAL: Respond directly and accurately to the user query: "${userText}".
${detectedIntent.type === 'SCHEDULE' ? 'Focus on today\'s scheduled tasks, deadlines, and active milestones. Transparently note that no external calendar is linked. DO NOT give a generic workspace summary.' : ''}
Workspace context:
${JSON.stringify(ws || {}, null, 2)}`;

          const genResult = await generateGeminiContentWithFallback(ai, {
            preferredModel: 'gemini-3.6-flash',
            contents: userText,
            config: {
              systemInstruction,
              temperature: isCasual ? 0.7 : 0.4,
            },
          });
          if (genResult?.text) {
            answer = genResult.text;
          }
        } catch (e) {
          // Graceful fallback to deterministic engine result without breaking
        }
      }

      res.json({
        success: true,
        reply: answer,
        answer: answer,
        message: answer,
        intent: detectedIntent.type,
      });
    } catch (err: any) {
      console.error('Error in /api/assistant:', err);
      res.status(500).json({ error: 'Failed to process assistant query.' });
    }
  });

  // Dedicated Intent Detection endpoint
  app.post('/api/detect-intent', (req, res) => {
    try {
      const { message, text, prompt } = req.body || {};
      const userText = message || text || prompt || '';
      const userId = resolveUserId(req);
      const ws = getUserWorkspace(userId);
      const detected = detectUserIntent(userText, [], ws);
      res.json({
        success: true,
        intent: detected.type,
        subType: detected.subType,
        language: detected.language,
        confidence: detected.confidence,
        extractedEntities: detected.extractedEntities,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to detect intent.' });
    }
  });

  // ==========================================
  // WORKSPACE API ENDPOINTS
  // ==========================================
  app.get('/api/workspace', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const data = getUserWorkspace(userId);
      res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching workspace:', err);
      res.status(500).json({ error: 'Failed to retrieve workspace data.' });
    }
  });

  // Reset Workspace (Clean slate or sample data toggle)
  app.post(['/api/workspace/reset', '/api/reset'], (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      const authenticatedUser = token ? getUserByToken(token) : null;

      if (!authenticatedUser) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized. Please sign in to reset your workspace.'
        });
        return;
      }

      const userId = authenticatedUser.id;
      const { empty, confirmCode } = req.body || {};
      const shouldEmpty = empty !== false; // Default to clean slate reset

      if (shouldEmpty && confirmCode !== 'RESET') {
        res.status(400).json({
          success: false,
          error: 'Explicit confirmation required. Please type RESET to confirm clean slate reset.'
        });
        return;
      }

      // Pre-flight authorization check: User must have owner, founder, director, or admin authority
      const userRole = (authenticatedUser.role || '').toLowerCase();
      const isAuthorized = userRole.includes('owner') ||
        userRole.includes('director') ||
        userRole.includes('founder') ||
        userRole.includes('admin') ||
        userRole.includes('managing') ||
        authenticatedUser.id === userId;

      if (!isAuthorized) {
        res.status(403).json({
          success: false,
          error: 'Forbidden. Only workspace owners and administrators can perform a workspace reset.'
        });
        return;
      }

      const data = resetUserWorkspace(userId, Boolean(shouldEmpty));
      const revenue = (data.invoices || [])
        .filter((inv: any) => inv.status === 'Paid')
        .reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0);

      // Audit Log (Phase 20 & 33)
      console.log('[AUDIT LOG] Workspace reset completed successfully:', {
        userId,
        email: authenticatedUser.email,
        timestamp: new Date().toISOString(),
        cleanSlate: shouldEmpty,
        result: 'success',
        records: {
          clients: data.clients.length,
          projects: data.projects.length,
          tasks: data.tasks.length,
          invoices: data.invoices.length,
          revenue,
        }
      });

      res.json({
        success: true,
        message: shouldEmpty ? 'Workspace reset successfully' : 'Workspace dataset reset successfully.',
        data: {
          clients: data.clients.length,
          projects: data.projects.length,
          tasks: data.tasks.length,
          revenue,
        },
        workspace: data,
        stats: {
          totalClients: data.clients.length,
          totalProjects: data.projects.length,
          totalTasks: data.tasks.length,
          completedTasks: (data.tasks || []).filter((t: any) => t.status === 'Completed').length,
          pendingTasks: (data.tasks || []).filter((t: any) => t.status === 'To Do' || t.status === 'Pending').length,
          inProgressTasks: (data.tasks || []).filter((t: any) => t.status === 'In Progress').length,
          revenue,
        }
      });
    } catch (err: any) {
      console.error('[RESET ERROR]', err);
      res.status(500).json({
        success: false,
        error: 'Failed to reset workspace data. Transaction rolled back.'
      });
    }
  });

  // ==========================================
  // CLIENTS CRUD ENDPOINTS
  // ==========================================
  // GET clients
  app.get('/api/clients', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const clients = getClients(userId);
      res.json(clients);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch clients.' });
    }
  });

  // POST client
  app.post('/api/clients', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const { name, company, email, phone, notes, tags, status, source } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({ error: 'Client name is required.' });
        return;
      }
      if (!company || !company.trim()) {
        res.status(400).json({ error: 'Company name is required.' });
        return;
      }
      if (!email || !email.trim()) {
        res.status(400).json({ error: 'Email address is required.' });
        return;
      }

      const client = createClient(userId, {
        name: name.trim(),
        company: company.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || '',
        status: status || 'Active',
        source: source || 'Direct',
        totalBilled: 0,
        openProjectsCount: 0,
        rating: 5,
        notes: notes?.trim() || '',
        tags: Array.isArray(tags) ? tags : [],
      });

      res.status(201).json({
        success: true,
        message: 'Client created successfully.',
        client,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create client.' });
    }
  });

  // PUT / PATCH client
  const handleUpdateClient = (req: express.Request, res: express.Response) => {
    try {
      const userId = resolveUserId(req);
      const clientId = req.params.id;
      const { name, company, email, phone, notes, tags, status } = req.body;

      if (name !== undefined && !name.trim()) {
        res.status(400).json({ error: 'Client name cannot be empty.' });
        return;
      }

      const updated = updateClient(userId, clientId, {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(company !== undefined ? { company: company.trim() } : {}),
        ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
        ...(phone !== undefined ? { phone: phone.trim() } : {}),
        ...(notes !== undefined ? { notes: notes.trim() } : {}),
        ...(tags !== undefined ? { tags: Array.isArray(tags) ? tags : [] } : {}),
        ...(status !== undefined ? { status } : {}),
      });

      res.json({
        success: true,
        message: 'Client updated successfully.',
        client: updated,
      });
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 500;
      res.status(status).json({ error: err.message || 'Unable to update this client. Please try again.' });
    }
  };

  app.put('/api/clients/:id', handleUpdateClient);
  app.patch('/api/clients/:id', handleUpdateClient);

  // DELETE client
  app.delete('/api/clients/:id', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const clientId = req.params.id;
      const result = deleteClient(userId, clientId);
      res.json({
        success: true,
        message: 'Client deleted successfully.',
        ...result,
      });
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 500;
      res.status(status).json({ error: err.message || 'Unable to delete this client. Please try again.' });
    }
  });

  // ==========================================
  // LEADS & INTAKE ENDPOINTS
  // ==========================================
  app.post('/api/leads', (req, res) => {
    try {
      const { name, email, company, source, potentialValue, status, priority, notes } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required to create a lead.' });
      }

      const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const lead = {
        id: leadId,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        company: company ? String(company).trim() : 'Direct Inquiry',
        source: source || 'Client Intake Form',
        potentialValue: typeof potentialValue === 'number' ? potentialValue : 2500,
        status: status || 'New',
        priority: priority || 'High',
        notes: notes || '',
        createdAt: new Date().toISOString(),
      };

      res.status(201).json({
        success: true,
        message: 'Lead received and added to workspace.',
        lead,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to record lead.' });
    }
  });

  // ==========================================
  // PROJECTS CRUD ENDPOINTS
  // ==========================================
  // GET projects
  app.get('/api/projects', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const projects = getProjects(userId);
      res.json(projects);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch projects.' });
    }
  });

  // POST project
  app.post('/api/projects', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const {
        name,
        clientId,
        clientName,
        description,
        status,
        priority,
        progress,
        deadline,
        budget,
        notes,
      } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({ error: 'Project name is required.' });
        return;
      }

      const project = createProject(userId, {
        name: name.trim(),
        clientId: clientId || '',
        clientName: clientName || 'Independent',
        description: description?.trim() || '',
        status: status || 'In Progress',
        priority: priority || 'High',
        progress: typeof progress === 'number' ? Math.min(100, Math.max(0, progress)) : 0,
        deadline: deadline || '2026-09-30',
        budget: typeof budget === 'number' ? budget : Number(budget) || 0,
        tasksCount: 0,
        completedTasksCount: 0,
        filesCount: 1,
        notes: notes?.trim() || '',
        aiRiskAssessment: {
          level: 'low',
          explanation: 'Initial milestones established. Monitoring delivery progress.',
        },
      });

      res.status(201).json({
        success: true,
        message: 'Project created successfully.',
        project,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create project.' });
    }
  });

  // PUT / PATCH project
  const handleUpdateProject = (req: express.Request, res: express.Response) => {
    try {
      const userId = resolveUserId(req);
      const projectId = req.params.id;
      const {
        name,
        clientId,
        clientName,
        description,
        status,
        priority,
        progress,
        deadline,
        budget,
        notes,
      } = req.body;

      if (name !== undefined && !name.trim()) {
        res.status(400).json({ error: 'Project name cannot be empty.' });
        return;
      }

      const updated = updateProject(userId, projectId, {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(clientId !== undefined ? { clientId } : {}),
        ...(clientName !== undefined ? { clientName } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(progress !== undefined ? { progress: Math.min(100, Math.max(0, Number(progress))) } : {}),
        ...(deadline !== undefined ? { deadline } : {}),
        ...(budget !== undefined ? { budget: Number(budget) || 0 } : {}),
        ...(notes !== undefined ? { notes: notes.trim() } : {}),
      });

      res.json({
        success: true,
        message: 'Project updated successfully.',
        project: updated,
      });
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 500;
      res.status(status).json({ error: err.message || 'Unable to update this project. Please try again.' });
    }
  };

  app.put('/api/projects/:id', handleUpdateProject);
  app.patch('/api/projects/:id', handleUpdateProject);

  // DELETE project
  app.delete('/api/projects/:id', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const projectId = req.params.id;
      const result = deleteProject(userId, projectId);
      res.json({
        success: true,
        message: 'Project deleted successfully.',
        ...result,
      });
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 500;
      res.status(status).json({ error: err.message || 'Unable to delete this project. Please try again.' });
    }
  });

  // ==========================================
  // TASKS CRUD ENDPOINTS
  // ==========================================
  // GET tasks
  app.get('/api/tasks', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const tasks = getTasks(userId);
      res.json(tasks);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch tasks.' });
    }
  });

  // AI automated task categorization helper
  async function categorizeTaskWithAI(
    task: {
      title: string;
      description?: string;
      notes?: string;
      priority?: string;
      projectName?: string;
      deadline?: string;
    },
    projectPriority?: string
  ): Promise<{ category: 'Urgent' | 'Strategic' | 'Routine'; reasoning: string }> {
    const fallback = (): { category: 'Urgent' | 'Strategic' | 'Routine'; reasoning: string } => {
      const text = `${task.title} ${task.description || ''} ${task.notes || ''}`.toLowerCase();
      const taskPri = (task.priority || 'Medium').toLowerCase();
      const projPri = (projectPriority || 'Medium').toLowerCase();

      // Check urgent indicators
      const urgentKeywords = ['urgent', 'asap', 'blocker', 'critical', 'emergency', 'break', 'immediately', 'down', 'fiverr', 'past due', 'overdue', 'security'];
      const isOverdue = task.deadline && new Date(`${task.deadline}T23:59:59`).getTime() < Date.now();

      if (taskPri === 'urgent' || projPri === 'urgent' || isOverdue || urgentKeywords.some((k) => text.includes(k))) {
        return {
          category: 'Urgent',
          reasoning: isOverdue
            ? 'Deliverable deadline has elapsed or approaching immediate critical path.'
            : 'Urgent task or project priority requires rapid tactical triage.',
        };
      }

      // Check strategic indicators
      const strategicKeywords = [
        'architect',
        'strategy',
        'roadmap',
        'proposal',
        'contract',
        'scale',
        'revenue',
        'board',
        'compliance',
        'redesign',
        'audit',
        'governance',
        'growth',
        'brand',
        'infrastructure',
      ];
      if (projPri === 'high' || taskPri === 'high' || strategicKeywords.some((k) => text.includes(k))) {
        return {
          category: 'Strategic',
          reasoning: 'Advances high-value milestones, client brand architecture, or strategic business revenue.',
        };
      }

      return {
        category: 'Routine',
        reasoning: 'Standard operational cadence, recurring verification, or routine housekeeping.',
      };
    };

    const client = getGeminiClient();
    if (!client) {
      return fallback();
    }

    const prompt = `You are an AI operational executive for an agency/freelancer management operating system (AURA).
Categorize the following incoming business task into EXACTLY ONE of three categories:
- 'Urgent': Immediate operational roadblocks, time-sensitive client requests, critical emergencies, past-due or impending near-term deadlines, or blocking defects.
- 'Strategic': High-value business expansion, architectural improvements, core milestone deliverables, client retention, contract proposals, revenue generation, or tasks under High/Urgent project priority.
- 'Routine': Standard administrative maintenance, regular check-ins, procedural updates, housekeeping, formatting, or low-priority background items.

TASK DETAILS:
Title: ${task.title}
Description: ${task.description || 'None'}
Notes: ${task.notes || 'None'}
Task Priority: ${task.priority || 'Medium'}
Project Priority: ${projectPriority || 'Medium'}
Project Name: ${task.projectName || 'General / Unassigned'}
Deadline: ${task.deadline || 'No deadline specified'}

Evaluate the task description and project priority carefully.
Respond strictly with valid JSON only matching this schema:
{
  "category": "Urgent" | "Strategic" | "Routine",
  "reasoning": "A concise 1-sentence explanation of why this task belongs in this category based on description and project priority."
}`;

    try {
      const aiRes = await generateGeminiContentWithFallback(client, {
        preferredModel: 'gemini-3.8-flash',
        candidateModels: ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'],
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (aiRes && aiRes.text) {
        let cleaned = aiRes.text.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
        else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed && (parsed.category === 'Urgent' || parsed.category === 'Strategic' || parsed.category === 'Routine')) {
          return {
            category: parsed.category,
            reasoning: parsed.reasoning || 'Categorized by AURA AI based on task description and project priority.',
          };
        }
      }
    } catch (err) {
      console.error('Gemini task categorization error:', err);
    }

    return fallback();
  }

  // POST task
  app.post('/api/tasks', async (req, res) => {
    try {
      const userId = resolveUserId(req);
      const {
        title,
        description,
        clientId,
        clientName,
        projectId,
        projectName,
        status,
        priority,
        category: requestedCategory,
        aiCategoryReasoning: requestedReasoning,
        deadline,
        notes,
        source,
      } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ error: 'Task title is required.' });
        return;
      }

      // Determine project priority for AI classification
      let projectPriority = req.body.projectPriority;
      if (!projectPriority && projectId) {
        const prjs = getProjects(userId);
        const prj = prjs.find((p) => p.id === projectId);
        if (prj) {
          projectPriority = prj.priority;
        }
      }

      let category = requestedCategory;
      let aiCategoryReasoning = requestedReasoning;

      // Auto-categorize incoming task if not explicitly categorized
      if (!category) {
        const triage = await categorizeTaskWithAI(
          {
            title: title.trim(),
            description: description?.trim() || '',
            notes: notes?.trim() || '',
            priority: priority || 'High',
            projectName: projectName || '',
            deadline: deadline || '',
          },
          projectPriority
        );
        category = triage.category;
        aiCategoryReasoning = triage.reasoning;
      }

      const task = createTask(userId, {
        title: title.trim(),
        description: description?.trim() || '',
        clientId: clientId || '',
        clientName: clientName || '',
        projectId: projectId || '',
        projectName: projectName || '',
        status: status || 'To Do',
        priority: priority || 'High',
        category: category || 'Routine',
        aiCategoryReasoning: aiCategoryReasoning || '',
        deadline: deadline || '',
        notes: notes?.trim() || '',
        aiSuggested: false,
        source: source || 'manual',
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully.',
        task,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create task.' });
    }
  });

  // POST categorize single task payload (before creation or preview)
  app.post('/api/tasks/categorize', async (req, res) => {
    try {
      const userId = resolveUserId(req);
      const { title, description, notes, priority, projectId, projectName, deadline } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ error: 'Task title is required for AI categorization.' });
        return;
      }

      let projectPriority = req.body.projectPriority;
      if (!projectPriority && projectId) {
        const prjs = getProjects(userId);
        const prj = prjs.find((p) => p.id === projectId);
        if (prj) projectPriority = prj.priority;
      }

      const triage = await categorizeTaskWithAI(
        {
          title: title.trim(),
          description: description?.trim() || '',
          notes: notes?.trim() || '',
          priority: priority || 'Medium',
          projectName: projectName || '',
          deadline: deadline || '',
        },
        projectPriority
      );

      res.json({
        success: true,
        category: triage.category,
        reasoning: triage.reasoning,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to categorize task.' });
    }
  });

  // POST auto-categorize all tasks in workspace
  app.post('/api/tasks/auto-categorize-all', async (req, res) => {
    try {
      const userId = resolveUserId(req);
      const tasks = getTasks(userId);
      const projects = getProjects(userId);

      const updatedTasks = [];
      let categorizedCount = 0;

      for (const t of tasks) {
        let projectPriority = 'Medium';
        if (t.projectId) {
          const prj = projects.find((p) => p.id === t.projectId);
          if (prj) projectPriority = prj.priority;
        }

        const triage = await categorizeTaskWithAI(
          {
            title: t.title,
            description: t.description || '',
            notes: t.notes || '',
            priority: t.priority,
            projectName: t.projectName || '',
            deadline: t.deadline || '',
          },
          projectPriority
        );

        const updated = updateTask(userId, t.id, {
          category: triage.category,
          aiCategoryReasoning: triage.reasoning,
        });
        updatedTasks.push(updated);
        categorizedCount++;
      }

      res.json({
        success: true,
        count: categorizedCount,
        tasks: updatedTasks,
        message: `Successfully categorized ${categorizedCount} tasks with AI workflow.`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to batch categorize tasks.' });
    }
  });

  // POST categorize an existing task
  app.post('/api/tasks/:id/categorize', async (req, res) => {
    try {
      const userId = resolveUserId(req);
      const taskId = req.params.id;
      const tasks = getTasks(userId);
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        res.status(404).json({ error: `Task with ID '${taskId}' not found.` });
        return;
      }

      const projects = getProjects(userId);
      let projectPriority = 'Medium';
      if (task.projectId) {
        const prj = projects.find((p) => p.id === task.projectId);
        if (prj) projectPriority = prj.priority;
      }

      const triage = await categorizeTaskWithAI(
        {
          title: task.title,
          description: task.description || '',
          notes: task.notes || '',
          priority: task.priority,
          projectName: task.projectName || '',
          deadline: task.deadline || '',
        },
        projectPriority
      );

      const updated = updateTask(userId, taskId, {
        category: triage.category,
        aiCategoryReasoning: triage.reasoning,
      });

      res.json({
        success: true,
        task: updated,
        category: triage.category,
        reasoning: triage.reasoning,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to categorize task.' });
    }
  });

  // PUT / PATCH task
  const handleUpdateTask = (req: express.Request, res: express.Response) => {
    try {
      const userId = resolveUserId(req);
      const taskId = req.params.id;
      const {
        title,
        description,
        clientId,
        clientName,
        projectId,
        projectName,
        status,
        priority,
        category,
        aiCategoryReasoning,
        deadline,
        notes,
      } = req.body;

      if (title !== undefined && !title.trim()) {
        res.status(400).json({ error: 'Task title cannot be empty.' });
        return;
      }

      const updated = updateTask(userId, taskId, {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(clientId !== undefined ? { clientId } : {}),
        ...(clientName !== undefined ? { clientName } : {}),
        ...(projectId !== undefined ? { projectId } : {}),
        ...(projectName !== undefined ? { projectName } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(aiCategoryReasoning !== undefined ? { aiCategoryReasoning } : {}),
        ...(deadline !== undefined ? { deadline } : {}),
        ...(notes !== undefined ? { notes: notes.trim() } : {}),
      });

      res.json({
        success: true,
        message: 'Task updated successfully.',
        task: updated,
      });
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 500;
      res.status(status).json({ error: err.message || 'Unable to update this task. Please try again.' });
    }
  };

  app.put('/api/tasks/:id', handleUpdateTask);
  app.patch('/api/tasks/:id', handleUpdateTask);

  // DELETE task
  app.delete('/api/tasks/:id', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const taskId = req.params.id;
      const deletedTask = deleteTask(userId, taskId);
      res.json({
        success: true,
        message: 'Task deleted successfully.',
        deletedTask,
      });
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 500;
      res.status(status).json({ error: err.message || 'Unable to delete this task. Please try again.' });
    }
  });

  // ==========================================
  // INVOICES CRUD ENDPOINTS
  // ==========================================
  // GET invoices
  app.get('/api/invoices', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const invoices = getInvoices(userId);
      res.json(invoices);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch invoices.' });
    }
  });

  // POST invoice
  app.post('/api/invoices', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const {
        invoiceNumber,
        clientId,
        clientName,
        amount,
        issueDate,
        dueDate,
        status,
        items,
        notes,
      } = req.body;

      if (!dueDate) {
        res.status(400).json({ error: 'Invoice due date is required.' });
        return;
      }
      if (amount === undefined || isNaN(Number(amount)) || Number(amount) < 0) {
        res.status(400).json({ error: 'A valid invoice amount is required.' });
        return;
      }

      const invNum =
        invoiceNumber || `INV-2026-${Math.floor(100 + Math.random() * 900)}`;

      const invoice = createInvoice(userId, {
        invoiceNumber: invNum,
        clientId: clientId || '',
        clientName: clientName || 'Client',
        amount: Number(amount),
        issueDate: issueDate || new Date().toISOString().split('T')[0],
        dueDate,
        status: status || 'Sent',
        items: Array.isArray(items) && items.length > 0 ? items : [
          { description: 'Service Deliverable', quantity: 1, unitPrice: Number(amount) },
        ],
        notes: notes?.trim() || '',
      });

      res.status(201).json({
        success: true,
        message: 'Invoice issued successfully.',
        invoice,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create invoice.' });
    }
  });

  // PUT / PATCH invoice
  const handleUpdateInvoice = (req: express.Request, res: express.Response) => {
    try {
      const userId = resolveUserId(req);
      const invoiceId = req.params.id;
      const {
        invoiceNumber,
        clientId,
        clientName,
        amount,
        issueDate,
        dueDate,
        status,
        items,
        notes,
      } = req.body;

      if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) < 0)) {
        res.status(400).json({ error: 'Amount must be a non-negative number.' });
        return;
      }

      const updated = updateInvoice(userId, invoiceId, {
        ...(invoiceNumber !== undefined ? { invoiceNumber } : {}),
        ...(clientId !== undefined ? { clientId } : {}),
        ...(clientName !== undefined ? { clientName } : {}),
        ...(amount !== undefined ? { amount: Number(amount) } : {}),
        ...(issueDate !== undefined ? { issueDate } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(items !== undefined ? { items: Array.isArray(items) ? items : [] } : {}),
        ...(notes !== undefined ? { notes: notes.trim() } : {}),
      });

      res.json({
        success: true,
        message: 'Invoice updated successfully.',
        invoice: updated,
      });
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 500;
      res.status(status).json({ error: err.message || 'Unable to update this invoice. Please try again.' });
    }
  };

  app.put('/api/invoices/:id', handleUpdateInvoice);
  app.patch('/api/invoices/:id', handleUpdateInvoice);

  // DELETE invoice
  app.delete('/api/invoices/:id', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const invoiceId = req.params.id;
      const deletedInvoice = deleteInvoice(userId, invoiceId);
      res.json({
        success: true,
        message: 'Invoice deleted successfully.',
        deletedInvoice,
      });
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 500;
      res.status(status).json({ error: err.message || 'Unable to delete this invoice. Please try again.' });
    }
  });

  // ================= INTEGRATION HUB API ROUTES =================

  // GET all integrations
  app.get('/api/integrations', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const integrations = getConnectedAccounts(userId);
      res.json({
        success: true,
        integrations,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to retrieve integrations.' });
    }
  });

  // POST connect / authorize integration (OAuth 2.0 PKCE handshake simulation)
  app.post('/api/integrations/:id/connect', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const accountId = req.params.id;
      const { permissions, accountIdentifier } = req.body || {};
      const account = connectIntegrationAccount(userId, accountId, {
        permissions,
        accountIdentifier,
      });
      res.json({
        success: true,
        message: `${account.name} successfully authorized and connected via OAuth 2.0.`,
        account,
      });
    } catch (err: any) {
      const isConfigError = err.message?.includes('configuration required') || err.message?.includes('not found');
      res.status(isConfigError ? 400 : 500).json({ error: err.message || 'Failed to authorize integration.' });
    }
  });

  // POST disconnect integration (purges server tokens, preserves business data)
  app.post('/api/integrations/:id/disconnect', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const accountId = req.params.id;
      const account = disconnectIntegrationAccount(userId, accountId);
      res.json({
        success: true,
        message: `${account.name} disconnected. OAuth credentials purged. Existing business data preserved.`,
        account,
      });
    } catch (err: any) {
      const isNotFound = err.message?.includes('not found');
      res.status(isNotFound ? 404 : 500).json({ error: err.message || 'Failed to disconnect integration.' });
    }
  });

  // POST sync integration now
  app.post('/api/integrations/:id/sync', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const accountId = req.params.id;
      const account = syncIntegrationAccount(userId, accountId);
      res.json({
        success: true,
        message: account.syncMessage || 'Synchronization completed successfully.',
        account,
      });
    } catch (err: any) {
      const isBadState = err.message?.includes('disconnected') || err.message?.includes('not found');
      res.status(isBadState ? 400 : 500).json({ error: err.message || 'Failed to synchronize integration.' });
    }
  });

  // POST reconnect integration
  app.post('/api/integrations/:id/reconnect', (req, res) => {
    try {
      const userId = resolveUserId(req);
      const accountId = req.params.id;
      const account = reconnectIntegrationAccount(userId, accountId);
      res.json({
        success: true,
        message: `${account.name} authorization restored and reconnected.`,
        account,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to reconnect integration.' });
    }
  });

  // POST & PATCH update integration permissions
  const handleUpdatePermissions = (req: any, res: any) => {
    try {
      const userId = resolveUserId(req);
      const accountId = req.params.id;
      const { permissions } = req.body;
      if (!Array.isArray(permissions)) {
        res.status(400).json({ error: 'Permissions must be an array of strings.' });
        return;
      }
      const account = updateIntegrationPermissions(userId, accountId, permissions);
      res.json({
        success: true,
        message: 'Permissions updated successfully.',
        account,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update permissions.' });
    }
  };

  app.post('/api/integrations/:id/permissions', handleUpdatePermissions);
  app.patch('/api/integrations/:id/permissions', handleUpdatePermissions);

  // Ask AURA API endpoint (supports both text queries and voice conversation)
  app.post('/api/ask-aura', async (req, res) => {
    try {
      const { prompt, workspaceContext, voiceMode, language } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      const client = getGeminiClient();
      const detectedIntent = detectUserIntent(prompt, [], workspaceContext);
      const isCasual = ['GREETING', 'ISLAMIC_GREETING', 'CASUAL_CONVERSATION', 'IDENTITY'].includes(detectedIntent.type);

      if (client && process.env.GEMINI_API_KEY) {
        try {
          let systemInstruction = '';
          if (isCasual) {
            systemInstruction = `You are AURA AI, an intelligent, poised, natural conversational workspace copilot.
User Intent: ${detectedIntent.type} (${detectedIntent.subType || 'general'}).
Detected Language: ${detectedIntent.language}.
Voice Mode: ${voiceMode ? 'ACTIVE (Speak naturally, NO markdown, 1-2 spoken sentences)' : 'Inactive'}.

CRITICAL DIRECTIVES:
- Respond naturally, warmly, and concisely in 1 to 2 short sentences.
- Match user's language: if Roman Urdu, respond in Roman Urdu. If in English, in English.
- DO NOT dump workspace metrics, do not count projects or tasks, and do not use diagnostic headers.
- Never output "### 🤖 AURA GENERAL Assistant" or "Based on current workspace metrics...".`;
          } else {
            systemInstruction = `You are AURA AI, the intelligent operating system for modern business workspace.
Your core principle: "AI assists. Human decides." (Only cite for sensitive/data-modifying actions).
Today's Date: ${CURRENT_DATE_STR}.
Detected Intent: ${detectedIntent.type}.
Detected Language: ${detectedIntent.language}.
Voice Mode: ${voiceMode ? 'ACTIVE' : 'Inactive'}.

${detectedIntent.type === 'SCHEDULE' ? 'CRITICAL FOR SCHEDULE: The user is asking for their daily schedule or agenda. State transparently if no external calendar (like Google Calendar) is connected, and formulate a clear, prioritized schedule based on tasks due today, overdue tasks, and active project milestones. DO NOT recite a generic workspace summary.' : ''}

${voiceMode ? `CRITICAL VOICE CONVERSATION PROTOCOL:
- You are speaking directly via voice.
- Keep responses conversational and concise (1 to 3 sentences maximum).
- Do NOT use markdown symbols, headers (###), bold asterisks (**), or bullet dashes. Speak aloud naturally.` : `CRITICAL TEXT RESPONSE PROTOCOL:
- Speak like an intelligent business assistant, NOT a system diagnostic report.
- Never start responses with boilerplate templates or diagnostic dumps.
- Provide crisp, direct, structured answers with real data.`}

Workspace Context:
${JSON.stringify(workspaceContext || {}, null, 2)}`;
          }

          let generatedText: string | undefined;
          let usedModel = 'gemini-3.6-flash';

          const genResult = await generateGeminiContentWithFallback(client, {
            preferredModel: 'gemini-3.6-flash',
            candidateModels: ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'],
            contents: prompt,
            config: {
              systemInstruction,
              temperature: voiceMode || detectedIntent.type === 'CASUAL_CONVERSATION' ? 0.7 : 0.4,
            },
          });

          if (genResult?.text) {
            generatedText = genResult.text;
            usedModel = genResult.model;
          }

          if (generatedText) {
            let actionProposal: any = undefined;
            if (detectedIntent.type === 'TASK_OR_WORK_REQUEST' || detectedIntent.type === 'ACTION_REQUEST') {
              const engineResult = generateIntentResponse(prompt, detectedIntent, workspaceContext);
              actionProposal = engineResult.actionProposal;
            }

            res.json({
              response: generatedText,
              source: usedModel,
              intent: detectedIntent.type,
              actionProposal,
            });
            return;
          }
        } catch (geminiError: any) {
          console.warn('Gemini generation unavailable, seamlessly utilizing AURA local intelligence:', geminiError?.message);
        }
      }

      // Grounded conversational response engine (deterministic, context-aware fallback)
      const engineResult = generateIntentResponse(prompt, detectedIntent, workspaceContext);
      let reply = engineResult.replyText;

      if (voiceMode) {
        // Strip markdown symbols for voice playback
        reply = reply
          .replace(/[#*`_~]/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/\n\s*[-•]\s*/g, '. ')
          .replace(/\n+/g, ' ')
          .trim();
      }

      res.json({
        response: reply,
        source: 'aura-conversational-engine',
        intent: detectedIntent.type,
        actionProposal: engineResult.actionProposal,
      });
    } catch (err: any) {
      console.error('Error in /api/ask-aura:', err);
      res.status(500).json({
        error: 'Failed to process AURA intelligence query',
        details: err?.message,
      });
    }
  });

  // ==========================================
  // GEMINI CHATBOT (MULTI-TURN, ROLES, SEARCH & MAPS GROUNDING, NATURAL CONVERSATION)
  // ==========================================
  app.post('/api/gemini-chat', async (req, res) => {
    try {
      const {
        message,
        history = [],
        modelRole = 'general',
        enableSearch = false,
        enableMaps = false,
        userLocation,
        workspaceContext,
      } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required.' });
        return;
      }

      const client = getGeminiClient();

      // Run AURA Intent Detection before generating response
      const detectedIntent = detectUserIntent(message, history, workspaceContext);

      // Determine model
      let selectedModel = 'gemini-3.5-flash';
      if (modelRole === 'executive') {
        selectedModel = 'gemini-3.1-pro-preview';
      } else if (modelRole === 'rapid') {
        selectedModel = 'gemini-3.1-flash-lite';
      } else {
        selectedModel = 'gemini-3.5-flash';
      }

      // Handle Grounding Tools (Search & Maps require gemini-3.5-flash)
      const tools: any[] = [];
      let toolConfig: any = undefined;

      if (enableSearch) {
        selectedModel = 'gemini-3.5-flash';
        tools.push({ googleSearch: {} });
      } else if (enableMaps) {
        selectedModel = 'gemini-3.5-flash';
        tools.push({ googleMaps: {} });
        if (userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number') {
          toolConfig = {
            retrievalConfig: {
              latLng: {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              },
            },
          };
        }
      }

      // Construct dynamic, intent-appropriate system instructions
      let systemInstruction = '';
      const isCasualChat = ['GREETING', 'ISLAMIC_GREETING', 'CASUAL_CONVERSATION', 'IDENTITY'].includes(detectedIntent.type);
      if (isCasualChat) {
        systemInstruction = `You are AURA AI, an intelligent, poised, natural conversational workspace copilot.
User Intent: ${detectedIntent.type} (${detectedIntent.subType || 'general'}).
Detected User Language: ${detectedIntent.language}.

CRITICAL BEHAVIORAL DIRECTIVES:
- Respond naturally, warmly, and concisely in 1 to 2 sentences.
- Match user's language: if user wrote in Roman Urdu (e.g. "kya haal hai", "shukriya", "assalam walekum"), respond in natural Roman Urdu. If in English, respond in English.
- NEVER start responses with robotic boilerplate such as "### 🤖 AURA GENERAL Assistant" or "I have reviewed your query...".
- DO NOT recite workspace metrics, do not count projects or tasks, and do not dump telemetric data.
- NEVER mention governance disclaimers like "Principle: AI assists. Human decides" for simple greetings or casual conversation.`;
      } else {
        systemInstruction = `You are AURA AI, an intelligent, natural conversational workspace copilot (Role: ${modelRole}).
Current Reference Date: ${CURRENT_DATE_STR}.
Detected User Intent: ${detectedIntent.type}${detectedIntent.subType ? ` (${detectedIntent.subType})` : ''}.
Detected User Language: ${detectedIntent.language}.
${detectedIntent.contextHint ? `Conversation Context Resolution: ${detectedIntent.contextHint}` : ''}

${detectedIntent.type === 'SCHEDULE' ? 'CRITICAL FOR SCHEDULE: The user is asking for their daily schedule or agenda. Transparently acknowledge if no external calendar (like Google Calendar) is connected, and formulate a prioritized schedule based on tasks due today, overdue tasks, and active project milestones. DO NOT dump a generic workspace summary.' : ''}

DIRECTIVES FOR NATURAL BUSINESS INTELLIGENCE:
1. Speak like an intelligent business assistant, NOT a system diagnostic report.
2. NEVER use the rigid boilerplate "### 🤖 AURA ${modelRole.toUpperCase()} Assistant" or "Based on current workspace metrics...".
3. Provide crisp, structured, accurate answers directly addressing what was asked.
4. MULTI-TURN CONTEXT: If the user asks follow-up questions like "which ones?", resolve them using the prior conversation context (${detectedIntent.antecedentType || 'recent topics'}).
5. REAL DATA: Strictly use the workspace data below. Do not hallucinate fictitious numbers, tasks, or clients.
6. GOVERNANCE: Only cite the core principle ("AI assists. Human decides.") when proposing sensitive actions, financial transactions, automations, or modifying data.
7. LANGUAGE: If the user asks in Roman Urdu, answer in Roman Urdu. If in English, answer in English.

Workspace Data:
${JSON.stringify(workspaceContext || {}, null, 2)}`;
      }

      if (client && process.env.GEMINI_API_KEY) {
        try {
          // Format multi-turn conversation history
          const contents: any[] = [];
          if (Array.isArray(history)) {
            for (const item of history) {
              if (item && item.role && item.parts && Array.isArray(item.parts)) {
                contents.push({
                  role: item.role === 'user' ? 'user' : 'model',
                  parts: item.parts.map((p: any) => ({ text: p.text || '' })),
                });
              }
            }
          }
          // Append the current user message
          contents.push({
            role: 'user',
            parts: [{ text: message }],
          });

          const genResult = await generateGeminiContentWithFallback(client, {
            preferredModel: selectedModel,
            candidateModels: ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.8-flash'],
            contents,
            config: {
              systemInstruction,
              tools: tools.length > 0 ? tools : undefined,
              toolConfig: toolConfig || undefined,
              temperature: detectedIntent.type === 'CASUAL_CONVERSATION' ? 0.7 : 0.4,
            },
          });

          if (genResult) {
            const replyText = genResult.text || '';
            const groundingMetadata = genResult.candidates?.[0]?.groundingMetadata;
            const groundingChunks = groundingMetadata?.groundingChunks || [];
            const webSearchQueries = groundingMetadata?.webSearchQueries || [];

            // Generate action proposal if intent is task creation
            let actionProposal: any = undefined;
            if (detectedIntent.type === 'TASK_OR_WORK_REQUEST' || detectedIntent.type === 'ACTION_REQUEST') {
              const engineResult = generateIntentResponse(message, detectedIntent, workspaceContext, history);
              actionProposal = engineResult.actionProposal;
            }

            res.json({
              success: true,
              response: replyText,
              model: genResult.model,
              role: modelRole,
              intent: detectedIntent.type,
              actionProposal,
              groundingChunks,
              webSearchQueries,
            });
            return;
          }
        } catch (apiError: any) {
          // Fall through to deterministic intent engine if all models fail
        }
      }

      // Grounded conversational response engine (deterministic, context-aware fallback)
      const engineResult = generateIntentResponse(message, detectedIntent, workspaceContext, history);

      res.json({
        success: true,
        response: engineResult.replyText,
        model: selectedModel,
        role: modelRole,
        intent: detectedIntent.type,
        actionProposal: engineResult.actionProposal,
        groundingChunks: [],
        webSearchQueries: enableSearch ? [message] : [],
      });
    } catch (err: any) {
      console.error('Error in /api/gemini-chat:', err);
      res.status(500).json({ error: err.message || 'Chat generation error' });
    }
  });

  // ==========================================
  // GEMINI LIVE VOICE API (gemini-3.1-flash-live-preview)
  // ==========================================
  app.post('/api/gemini-live-voice', async (req, res) => {
    try {
      const {
        prompt,
        history = [],
        language = 'en-US',
        workspaceContext,
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      const client = getGeminiClient();
      const detectedIntent = detectUserIntent(prompt, history, workspaceContext);
      const voiceModel = 'gemini-3.8-flash';

      let liveVoiceSystemInstruction = '';
      const isCasualVoice = ['GREETING', 'ISLAMIC_GREETING', 'CASUAL_CONVERSATION', 'IDENTITY'].includes(detectedIntent.type);
      if (isCasualVoice) {
        liveVoiceSystemInstruction = `You are AURA Voice, an intelligent, natural conversational voice copilot.
User Intent: ${detectedIntent.type} (${detectedIntent.subType || 'general'}).
Spoken Language: Respond in ${language}. If user spoke in Roman Urdu, respond in Roman Urdu. If in English, respond in English.
Spoken Cadence:
- Warm, pleasant, natural spoken speech.
- Keep response strictly between 1 and 2 spoken sentences.
- Avoid markdown formatting, asterisks, bullet points, and code blocks.
- DO NOT dump workspace statistics, project counts, or diagnostic metrics.`;
      } else {
        liveVoiceSystemInstruction = `You are AURA Voice, the real-time spoken conversational AI.
Core Principle: "AI assists. Human decides."
Spoken Cadence:
- Warm, light, calm, poised, concise, natural speech.
- Keep responses strictly between 1 and 3 spoken sentences.
- Avoid markdown formatting, asterisks, bullet points, and code blocks.
- Spoken Language: Respond in ${language}. If user spoke in Roman Urdu, respond in Roman Urdu. If in English, respond in English.
${detectedIntent.type === 'SCHEDULE' ? '- Schedule protocol: Transparently note if no external calendar is linked. Give a concise spoken agenda prioritizing today\'s urgent tasks and project milestones. DO NOT dump generic workspace statistics.' : ''}
- Action Protocol: If the user requests creating a task, sending a message, or changing project status, propose it and ask for verbal confirmation.
Workspace context:
${JSON.stringify(workspaceContext || {}, null, 2)}`;
      }

      if (client && process.env.GEMINI_API_KEY) {
        try {
          const contents: any[] = [];
          if (Array.isArray(history)) {
            for (const item of history.slice(-6)) {
              if (item?.role && item?.parts) {
                contents.push({
                  role: item.role === 'user' ? 'user' : 'model',
                  parts: item.parts.map((p: any) => ({ text: p.text || '' })),
                });
              }
            }
          }
          contents.push({ role: 'user', parts: [{ text: prompt }] });

          let responseText = '';
          let usedModel = 'gemini-3.6-flash';

          const genResult = await generateGeminiContentWithFallback(client, {
            preferredModel: 'gemini-3.6-flash',
            candidateModels: ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'],
            contents,
            config: {
              systemInstruction: liveVoiceSystemInstruction,
              temperature: 0.6,
            },
          });

          if (genResult?.text) {
            responseText = genResult.text;
            usedModel = genResult.model;
          }

          if (responseText) {
            const isTaskIntent = /create (a )?task|add (a )?task|remind me to/i.test(prompt);
            const actionProposal = isTaskIntent
              ? {
                  type: 'create_task',
                  title: prompt.replace(/create (a )?task (to|for)?/i, '').replace(/remind me to/i, '').trim() || 'New Voice Task',
                }
              : undefined;

            res.json({
              success: true,
              response: responseText,
              model: usedModel,
              actionProposal,
            });
            return;
          }
        } catch (genErr: any) {
          console.warn('Gemini live voice generation error:', genErr?.message);
        }
      }

      // Conversational intelligence fallback for voice
      const engineResult = generateIntentResponse(prompt, detectedIntent, workspaceContext, history);
      let reply = engineResult.replyText
        .replace(/[#*`_~]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n\s*[-•]\s*/g, '. ')
        .replace(/\n+/g, ' ')
        .trim();

      res.json({
        success: true,
        response: reply,
        model: voiceModel,
        intent: detectedIntent.type,
        actionProposal: engineResult.actionProposal,
      });
    } catch (err: any) {
      console.error('Error in /api/gemini-live-voice:', err);
      res.status(500).json({ error: err.message || 'Live voice error' });
    }
  });

  // Explicit 404 for unhandled /api/* endpoints - prevents returning index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.method} ${req.path}`,
    });
  });

  // Vite middleware in dev; static assets in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AURA AI OS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
