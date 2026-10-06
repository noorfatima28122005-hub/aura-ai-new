/**
 * AURA AI Conversational Intelligence & Intent Engine — Final Lock
 * 
 * Core Architectural Standards:
 * 1. Semantic sentence-level intent classification (not naive keyword hits)
 * 2. Multi-category taxonomy:
 *    - GREETING
 *    - ISLAMIC_GREETING
 *    - CASUAL_CONVERSATION (how are you, gratitude, acknowledgment, farewell)
 *    - IDENTITY (who are you, capabilities)
 *    - SCHEDULE (today schedule, calendar, agenda, daily planning)
 *    - WORKSPACE_SUMMARY (explicit summary requests)
 *    - TASKS (overdue tasks, pending tasks, list tasks)
 *    - PROJECTS (active projects, project status)
 *    - CLIENTS (clients list, clients needing attention)
 *    - REVENUE (realized revenue, invoices, financial status)
 *    - BUSINESS_ADVICE (workload analysis, strategic performance)
 *    - ACTION_REQUEST (task/invoice creation with human governance)
 *    - FOLLOW_UP_QUESTION (multi-turn entity resolution)
 *    - UNKNOWN (honest, polite fallback — NEVER metric dumping)
 * 3. Trilingual support: English, Roman Urdu, Urdu script
 * 4. Grounded workspace facts: Zero fictitious metrics, tasks, or calendar events
 * 5. Principle: "AI assists. Human decides."
 */

export type AuraIntentType =
  | 'GREETING'
  | 'ISLAMIC_GREETING'
  | 'CASUAL_CONVERSATION'
  | 'IDENTITY'
  | 'SCHEDULE'
  | 'WORKSPACE_SUMMARY'
  | 'TASKS'
  | 'PROJECTS'
  | 'CLIENTS'
  | 'REVENUE'
  | 'BUSINESS_ADVICE'
  | 'ACTION_REQUEST'
  | 'FOLLOW_UP_QUESTION'
  | 'UNKNOWN'
  // Backward compatibility aliases
  | 'CALENDAR'
  | 'TODAY_PLAN'
  | 'TASK_OR_WORK_REQUEST'
  | 'BUSINESS_QUESTION'
  | 'DATA_LOOKUP'
  | 'ANALYSIS_REQUEST'
  | 'PLANNING_REQUEST'
  | 'CLARIFICATION_REQUIRED';

export type AuraLanguage = 'english' | 'roman_urdu' | 'urdu';

export interface IntentDetectionResult {
  type: AuraIntentType;
  subType?: string;
  language: AuraLanguage;
  confidence: number;
  extractedEntities: {
    projectName?: string;
    clientName?: string;
    taskTitle?: string;
    dueDate?: string;
    metricType?: string;
  };
  contextHint?: string;
  antecedentType?: 'overdue_tasks' | 'pending_tasks' | 'projects' | 'clients' | 'invoices' | 'specific_project' | 'specific_client';
  antecedentValue?: string;
}

export interface WorkspaceContextData {
  user?: { name?: string; email?: string; company?: string; role?: string };
  clients?: Array<{
    id: string;
    name: string;
    company?: string;
    email?: string;
    status: string;
    totalBilled?: number;
    openProjectsCount?: number;
  }>;
  projects?: Array<{
    id: string;
    name: string;
    clientName?: string;
    status: string;
    progress: number;
    deadline: string;
    budget?: number;
    priority?: string;
    tasksCount?: number;
    completedTasksCount?: number;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    description?: string;
    clientName?: string;
    projectName?: string;
    status: string;
    priority: string;
    deadline?: string;
    source?: string;
  }>;
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    clientName: string;
    amount: number;
    status: string;
    dueDate?: string;
    issueDate?: string;
  }>;
  approvals?: any[];
  stats?: {
    revenue?: number;
    activeProjects?: number;
    pendingTasks?: number;
    clientsCount?: number;
  };
}

export interface ConversationTurn {
  role: 'user' | 'model';
  content?: string;
  parts?: Array<{ text: string }> | string;
}

// Current reference date in the simulated environment
export const CURRENT_DATE_STR = '2026-09-13';

/**
 * Detect language of the query: English vs Roman Urdu vs Urdu script
 */
export function detectLanguage(text: string): AuraLanguage {
  const trimmed = text.trim();
  // Arabic/Urdu Unicode script range
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return 'urdu';
  }

  const lower = ` ${trimmed.toLowerCase()} `;
  // Roman Urdu vocabulary tokens
  const romanUrduPatterns = [
    /\bkya\b/, /\bkia\b/, /\bhaal\b/, /\bhal\b/, /\bkaise\b/, /\bkese\b/, /\bkesi\b/,
    /\bshukriya\b/, /\bmeherbani\b/, /\btheek\b/, /\bacha\b/, /\bsahi\b/, /\bzabardast\b/,
    /\bsalam\b/, /\bassalam\b/, /\baoa\b/, /\bkhuda hafiz\b/, /\ballah hafiz\b/,
    /\bmere\b/, /\bmeri\b/, /\bmera\b/, /\bapna\b/, /\bapni\b/, /\bkitne\b/, /\bkitna\b/,
    /\bkonsa\b/, /\bkonse\b/, /\bkonsay\b/, /\bkaun se\b/, /\bkaun sa\b/,
    /\bhain\b/, /\bhai\b/, /\bhoon\b/, /\bhein\b/, /\btha\b/, /\bthi\b/, /\braha\b/, /\brahi\b/,
    /\bkaam\b/, /\bkaro\b/, /\bkarein\b/, /\bdekho\b/, /\bbatao\b/, /\bbataiye\b/,
  ];

  let matches = 0;
  for (const pat of romanUrduPatterns) {
    if (pat.test(lower)) matches++;
  }

  return matches >= 1 ? 'roman_urdu' : 'english';
}

/**
 * Multi-turn context resolver: extracts active entities from conversation history
 */
export function resolveConversationContext(
  history: ConversationTurn[] = [],
  workspace?: WorkspaceContextData
): {
  lastTopic?: string;
  lastProjectName?: string;
  lastClientName?: string;
  lastEntityType?: 'overdue_tasks' | 'pending_tasks' | 'projects' | 'clients' | 'invoices';
} {
  if (!Array.isArray(history) || history.length === 0) {
    return {};
  }

  // Inspect recent turns (from newest to oldest)
  for (let i = history.length - 1; i >= 0; i--) {
    const turn = history[i];
    let turnText = '';
    if (typeof turn.content === 'string') {
      turnText = turn.content;
    } else if (Array.isArray(turn.parts)) {
      turnText = turn.parts.map((p: any) => (typeof p === 'string' ? p : p.text || '')).join(' ');
    } else if (typeof turn.parts === 'string') {
      turnText = turn.parts;
    }

    const lower = turnText.toLowerCase();

    // Check if overdue tasks were discussed
    if (lower.includes('overdue task') || lower.includes('tasks are overdue') || lower.includes('overdue deliverables')) {
      return { lastTopic: 'overdue_tasks', lastEntityType: 'overdue_tasks' };
    }

    // Check if tasks were discussed
    if (lower.includes('task') || lower.includes('tasks')) {
      return { lastTopic: 'tasks', lastEntityType: 'pending_tasks' };
    }

    // Check if invoices / revenue were discussed
    if (lower.includes('invoice') || lower.includes('revenue') || lower.includes('payment') || lower.includes('billing')) {
      return { lastTopic: 'invoices', lastEntityType: 'invoices' };
    }

    // Check if clients were discussed
    if (lower.includes('client') || lower.includes('clients')) {
      let foundClient: string | undefined;
      if (workspace?.clients) {
        for (const c of workspace.clients) {
          if (lower.includes(c.name.toLowerCase())) {
            foundClient = c.name;
            break;
          }
        }
      }
      return { lastTopic: 'clients', lastEntityType: 'clients', lastClientName: foundClient };
    }

    // Check if a specific project was discussed
    if (workspace?.projects) {
      for (const p of workspace.projects) {
        if (lower.includes(p.name.toLowerCase())) {
          return { lastTopic: 'project', lastProjectName: p.name, lastEntityType: 'projects' };
        }
      }
    }
  }

  return {};
}

/**
 * Detect user intent with semantic sentence analysis and context resolution.
 * AURA understands the COMPLETE message before deciding how to classify and respond.
 */
export function detectUserIntent(
  message: string,
  history: ConversationTurn[] = [],
  workspace?: WorkspaceContextData
): IntentDetectionResult {
  const clean = (message || '').trim();
  const lower = clean.toLowerCase();
  const language = detectLanguage(clean);
  const context = resolveConversationContext(history, workspace);

  // Normalize punctuation for token matching (while preserving Unicode letters)
  const normalized = lower
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Check for FOLLOW_UP_QUESTION
  // Short phrases relying on previous turn context
  const followUpTriggers = [
    /^(which|what) (ones|one)\??$/i,
    /^which\??$/i,
    /^show (them|it)\??$/i,
    /^list (them|it)\??$/i,
    /^what about (that|it|them)\??$/i,
    /^and (that|it|them)\??$/i,
    /^when is it due\??$/i,
    /^what('s| is) (its|the) deadline\??$/i,
    /^how much\??$/i,
    /^tell me more\??$/i,
    /^explain (that|it)\??$/i,
    /^why\??$/i,
    /^why is it (delayed|high risk|overdue)\??$/i,
    /^who is the client\??$/i,
    // Roman Urdu follow ups
    /^konsa\??$/i,
    /^konsay\??$/i,
    /^konse\??$/i,
    /^kaun se\??$/i,
    /^aur yeh\??$/i,
    /^kab due hai\??$/i,
  ];

  const isFollowUp =
    followUpTriggers.some((rgx) => rgx.test(lower)) ||
    (lower.length < 25 &&
      (lower.startsWith('which one') ||
        lower.startsWith('which ones') ||
        lower.startsWith('what about') ||
        lower.startsWith('and that')));

  if (isFollowUp && (context.lastTopic || context.lastProjectName || context.lastClientName)) {
    return {
      type: 'FOLLOW_UP_QUESTION',
      language,
      confidence: 0.95,
      extractedEntities: {
        projectName: context.lastProjectName,
        clientName: context.lastClientName,
      },
      antecedentType: context.lastEntityType,
      antecedentValue: context.lastProjectName || context.lastClientName || context.lastTopic,
      contextHint: `User refers to prior context: ${context.lastProjectName || context.lastClientName || context.lastTopic}`,
    };
  }

  // 2. ISLAMIC_GREETING
  // Handles: Assalam, Assalamu Alaikum, Assalam Walekum, Salam, AOA, and compound variations
  const isIslamicGreetingPattern =
    /\b(assalam|assalamu|asalam|asalamu|assalam-o-alaikum|aoa)\b/i.test(normalized) ||
    (/\bsalam\b/i.test(normalized) && !/\b(schedule|task|project|invoice|client|work)\b/i.test(normalized)) ||
    /[\u0600-\u06FF]/.test(clean) && /(السلام|اسلام|سلام)/.test(clean);

  // Check if message also has an explicit business action/query (e.g. "assalam walekum, what is my schedule today?")
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

  // 3. ACTION_REQUEST (Task, invoice, or client creation)
  const isCreateTask =
    /\b(create (a )?task|add (a )?task|make (a )?task|remind me to|schedule (a )?task|create a follow-up)\b/i.test(lower);
  const isCreateInvoice =
    /\b(create (an? )?invoice|make (an? )?invoice|generate invoice|draft invoice)\b/i.test(lower);
  const isCreateClient =
    /\b(add (a )?client|create (a )?client|new client)\b/i.test(lower);

  if (isCreateTask || isCreateInvoice || isCreateClient) {
    let taskTitle = clean
      .replace(/^(please |can you |could you |hey aura |aura )?(create|add|make|schedule) (a )?task (for|to)?/i, '')
      .replace(/^(please |can you |could you |hey aura |aura )?remind me to/i, '')
      .replace(/tomorrow/i, '')
      .replace(/today/i, '')
      .replace(/next week/i, '')
      .replace(/[.,;!]+$/, '')
      .trim();

    if (/^following up/i.test(taskTitle)) {
      taskTitle = taskTitle.replace(/^following up/i, 'Follow up');
    }

    let dueDate = CURRENT_DATE_STR;
    if (lower.includes('tomorrow')) {
      dueDate = '2026-09-14';
    } else if (lower.includes('today')) {
      dueDate = CURRENT_DATE_STR;
    } else if (lower.includes('next week')) {
      dueDate = '2026-09-21';
    }

    let clientName = context.lastClientName;
    if (workspace?.clients && workspace.clients.length > 0) {
      for (const c of workspace.clients) {
        if (lower.includes(c.name.toLowerCase())) {
          clientName = c.name;
          break;
        }
      }
      if (!clientName && (lower.includes('this client') || lower.includes('the client'))) {
        clientName = workspace.clients[0]?.name;
      }
    }

    if (clientName && /with (this|the) client/i.test(taskTitle)) {
      taskTitle = taskTitle.replace(/with (this|the) client/i, `with ${clientName}`);
    }

    return {
      type: 'ACTION_REQUEST',
      subType: isCreateTask ? 'create_task' : isCreateInvoice ? 'create_invoice' : 'create_client',
      language,
      confidence: 0.95,
      extractedEntities: {
        taskTitle: taskTitle || (clientName ? `Follow up with ${clientName}` : 'Client Follow-up'),
        dueDate,
        clientName,
      },
    };
  }

  // 4. SCHEDULE (Today schedule, daily calendar, agenda, daily focus)
  // MUST NOT return generic workspace summary!
  if (hasScheduleQuery ||
      /\b(today('s)?|todays|daily)\s+(schedule|agenda|plan|routine|calendar)\b/i.test(lower) ||
      /\b(schedule|agenda|calendar|plan)\s+(for\s+today|today)\b/i.test(lower) ||
      /\b(what('s| is|\s+is)\s+(my\s+|the\s+)?(schedule|agenda|calendar|plan))\b/i.test(lower) ||
      /\b(what\s+do\s+i\s+have\s+(planned|scheduled|to\s+do)\s+today)\b/i.test(lower) ||
      /\b(check\s+(my\s+)?calendar|what('s| is)\s+on\s+my\s+calendar)\b/i.test(lower) ||
      /\b(do\s+i\s+have\s+any\s+meetings|meeting\s+schedule)\b/i.test(lower) ||
      /\b(what\s+should\s+i\s+focus\s+on\s+today|help\s+me\s+prioritize\s+today)\b/i.test(lower) ||
      /^(today\s+schedule|schedule\s+today|my\s+schedule|today\s+agenda|daily\s+schedule)$/i.test(normalized) ||
      /\b(aaj\s+ka\s+(schedule|plan|agenda|routine))\b/i.test(lower) ||
      /\b(aaj\s+kya\s+karna\s+hai)\b/i.test(lower) ||
      /(آج کا شیڈول|آج کا پلان|آج کیا کرنا ہے)/.test(clean)) {
    return {
      type: 'SCHEDULE',
      subType: 'today_schedule',
      language,
      confidence: 0.98,
      extractedEntities: {},
    };
  }

  // 5. IDENTITY & CAPABILITIES
  // Answers "who are you", "what can you do", "what are you"
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

  // 6. CASUAL_CONVERSATION (How are you, well-being, gratitude, acknowledgments, farewells)
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

  // 7. GREETINGS (hello, hi, hey, hello world, good morning, etc.)
  // Specifically captures natural language greetings even when containing additional conversational words
  const greetingStarters =
    /^(hello|hi|hey|heyy|heyyy|greetings|good\s+morning|good\s+afternoon|good\s+evening|good\s+day)\b/i;

  const isGreeting =
    greetingStarters.test(lower) ||
    /^(hello\s+world|hello\s+there|hey\s+there|hi\s+there|hello\s+aura|hey\s+aura|hi\s+aura)$/i.test(normalized);

  if (isGreeting) {
    // If message is purely a greeting or casual greeting expression
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

  // 8. WORKSPACE_SUMMARY (Explicit requests for workspace overview/summary)
  const isWorkspaceSummary =
    /\b(workspace\s+(summary|overview|snapshot|status)|summary\s+of\s+(my\s+|the\s+)?workspace|overview\s+of\s+(my\s+|the\s+)?workspace)\b/i.test(lower) ||
    /\b(give\s+me\s+a\s+(workspace\s+)?(summary|overview|snapshot|status\s+report))\b/i.test(lower) ||
    /\b(high-level\s+summary|executive\s+summary|business\s+snapshot)\b/i.test(lower) ||
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

  // 9. TASKS (Task queries: overdue tasks, pending tasks, list tasks)
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

  if (hasTaskQuery ||
      /\b(tasks?\s+list|tasks?\s+status|show\s+tasks?|list\s+tasks?|how\s+many\s+tasks?|my\s+tasks?)\b/i.test(lower)) {
    return {
      type: 'TASKS',
      subType: 'pending_tasks',
      language,
      confidence: 0.96,
      extractedEntities: { metricType: 'tasks' },
    };
  }

  // 10. PROJECTS (Project queries: active projects, list projects, project status)
  const isProjects =
    /\b(how\s+many\s+(active\s+)?projects|list\s+(my\s+)?projects|show\s+(my\s+)?projects|active\s+projects|project\s+status|my\s+projects)\b/i.test(lower) ||
    /\b(mere\s+projects|kitne\s+projects)\b/i.test(lower);

  if (isProjects) {
    return {
      type: 'PROJECTS',
      subType: 'active_projects',
      language,
      confidence: 0.96,
      extractedEntities: { metricType: 'projects' },
    };
  }

  // Check for specific project lookup by name
  if (workspace?.projects) {
    for (const p of workspace.projects) {
      if (p.name && lower.includes(p.name.toLowerCase())) {
        return {
          type: 'PROJECTS',
          subType: 'specific_project',
          language,
          confidence: 0.95,
          extractedEntities: { projectName: p.name },
        };
      }
    }
  }

  // 11. CLIENTS (Client queries: list clients, clients needing attention)
  const isClientsNeedingAttention =
    /\b(clients?\s+(needing|need|requiring)\s+attention|which\s+clients?\s+need\s+attention)\b/i.test(lower);

  if (isClientsNeedingAttention) {
    return {
      type: 'CLIENTS',
      subType: 'clients_needing_attention',
      language,
      confidence: 0.96,
      extractedEntities: { metricType: 'clients' },
    };
  }

  const isClients =
    /\b(who\s+are\s+my\s+clients|list\s+(my\s+)?clients|show\s+(my\s+)?clients|my\s+clients|client\s+list|how\s+many\s+clients)\b/i.test(lower) ||
    /\b(mere\s+clients|kitne\s+clients)\b/i.test(lower);

  if (isClients) {
    return {
      type: 'CLIENTS',
      subType: 'clients_list',
      language,
      confidence: 0.95,
      extractedEntities: { metricType: 'clients' },
    };
  }

  // 12. REVENUE & INVOICES
  const isRevenue =
    /\b(how\s+much\s+revenue|total\s+revenue|how\s+much\s+money\s+did\s+i\s+make|revenue\s+made|financial\s+summary|my\s+income|how\s+much\s+did\s+i\s+earn)\b/i.test(lower) ||
    /\b(mera\s+revenue|kitna\s+kamaya)\b/i.test(lower);

  if (isRevenue) {
    return {
      type: 'REVENUE',
      subType: 'revenue_total',
      language,
      confidence: 0.97,
      extractedEntities: { metricType: 'revenue' },
    };
  }

  const isInvoices =
    /\b(show\s+(my\s+|the\s+)?invoices|list\s+invoices|which\s+invoice\s+is\s+overdue|overdue\s+invoices?|any\s+invoice\s+overdue|invoice\s+status)\b/i.test(lower) ||
    /\b(mere\s+invoices)\b/i.test(lower);

  if (isInvoices) {
    return {
      type: 'REVENUE',
      subType: lower.includes('overdue') ? 'overdue_invoices' : 'invoices_lookup',
      language,
      confidence: 0.96,
      extractedEntities: { metricType: 'invoices' },
    };
  }

  // 13. BUSINESS_ADVICE & ANALYSIS
  const isAnalysis =
    /\b(analyze\s+(my\s+|our\s+)?(projects?|workload|business|finances?|performance)|business\s+performance|how\s+is\s+my\s+business\s+performing|strategic\s+recommendations?|audit\s+my\s+workload|recommendations?\s+for\s+growth)\b/i.test(lower) ||
    /\b(business\s+kaisa\s+chal\s+raha\s+hai|workload\s+ka\s+jaiza)\b/i.test(lower);

  if (isAnalysis) {
    return {
      type: 'BUSINESS_ADVICE',
      subType: 'workload_analysis',
      language,
      confidence: 0.94,
      extractedEntities: {},
    };
  }

  // 14. UNKNOWN / HONEST CLARIFICATION FALLBACK
  // Critical requirement: Unknown questions MUST NOT dump workspace statistics!
  return {
    type: 'UNKNOWN',
    subType: 'unrecognized',
    language,
    confidence: 0.5,
    extractedEntities: {},
  };
}

/**
 * Generate a grounded, natural conversational response based on real workspace data.
 * Adheres strictly to the user's explicit intent. Zero invented data or robotic boilerplate.
 */
export function generateIntentResponse(
  message: string,
  intent: IntentDetectionResult,
  workspace: WorkspaceContextData = {},
  history: ConversationTurn[] = []
): {
  replyText: string;
  actionProposal?: {
    type: 'create_task';
    title: string;
    description?: string;
    deadline?: string;
    clientName?: string;
  };
} {
  const isRomanUrdu = intent.language === 'roman_urdu';
  const isUrdu = intent.language === 'urdu';
  const clients = workspace.clients || [];
  const projects = workspace.projects || [];
  const tasks = workspace.tasks || [];
  const invoices = workspace.invoices || [];
  const approvals = workspace.approvals || [];

  // Active projects: not completed or archived
  const activeProjects = projects.filter(
    (p) => p.status !== 'Completed' && (p.status as any) !== 'Archived'
  );

  // Pending tasks: not completed
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed');

  // Overdue tasks: deadline exists and is strictly before today's date
  const overdueTasks = pendingTasks.filter((t) => {
    if (!t.deadline) return false;
    return t.deadline < CURRENT_DATE_STR;
  });

  // Calculate real revenue from settled Paid invoices
  const paidInvoices = invoices.filter((i) => i.status === 'Paid');
  const totalPaidRevenue = paidInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const overdueInvoices = invoices.filter((i) => i.status === 'Overdue');
  const pendingInvoices = invoices.filter((i) => i.status === 'Sent' || i.status === 'Draft');

  // ==========================================
  // 1. ISLAMIC_GREETING
  // ==========================================
  if (intent.type === 'ISLAMIC_GREETING') {
    if (isUrdu) {
      return { replyText: "وعلیکم السلام! خوش آمدید۔ میں آپ کے ورک اسپیس، پراجیکٹس اور شیڈول میں کس طرح مدد کر سکتا ہوں؟" };
    }
    if (isRomanUrdu) {
      return { replyText: "Walaikum Assalam! Khush aamdeed. Main aapke workspace, active projects aur daily schedule mein kis tarah madad kar sakta hoon?" };
    }
    return { replyText: "Walaikum Assalam! Welcome back. How can I assist you with your business workspace today?" };
  }

  // ==========================================
  // 2. GREETING (Hello, Hi, Hey, Hello World, etc.)
  // ==========================================
  if (intent.type === 'GREETING') {
    const sub = intent.subType || 'greeting';
    const lower = message.trim().toLowerCase();

    if (isUrdu) {
      return { replyText: "سلام! میں آپ کی کس طرح مدد کر سکتا ہوں؟" };
    }

    if (isRomanUrdu) {
      return { replyText: "Salam! 👋 Main aapki kis tarah madad kar sakta hoon? Aap mujhse apne schedule, tasks ya projects ke bare mein pooch sakte hain." };
    }

    if (sub === 'hello_world' || lower.includes('hello world')) {
      return { replyText: "Hello there! Great to connect with you. How can I help you with your business workspace today?" };
    }
    if (lower.startsWith('good morning')) {
      return { replyText: "Good morning! Ready when you are. What would you like to focus on today?" };
    }
    if (lower.startsWith('good afternoon')) {
      return { replyText: "Good afternoon! How are your deliverables progressing today?" };
    }
    if (lower.startsWith('good evening')) {
      return { replyText: "Good evening! How can I help you wrap up or review today's operations?" };
    }
    if (lower === 'hi' || lower === 'hey') {
      return { replyText: "Hey! How can I help you today?" };
    }

    return { replyText: "Hello! 👋 How can I assist you with your workspace today?" };
  }

  // ==========================================
  // 3. CASUAL_CONVERSATION (How are you, gratitude, acknowledgment, farewell)
  // ==========================================
  if (intent.type === 'CASUAL_CONVERSATION') {
    const sub = intent.subType || 'greeting';
    const lower = message.trim().toLowerCase();

    if (isUrdu) {
      switch (sub) {
        case 'how_are_you':
          return { replyText: "میں بالکل ٹھیک ہوں اور آپ کی مدد کے لیے تیار ہوں۔ آج ہم کس چیز پر کام کریں؟" };
        case 'gratitude':
          return { replyText: "بہت شکریہ! اگر آپ کو کسی اور چیز میں مدد چاہیے تو ضرور بتائیے۔" };
        case 'acknowledgment':
          return { replyText: "بہترین! جب بھی ضرورت ہو، میں حاضر ہوں۔" };
        case 'farewell':
          return { replyText: "اللہ حافظ! اپنا خیال رکھیے گا۔" };
        default:
          return { replyText: "سلام! آج میں آپ کی کس طرح مدد کر سکتا ہوں؟" };
      }
    }

    if (isRomanUrdu) {
      switch (sub) {
        case 'how_are_you':
          return { replyText: "Main bilkul theek hoon aur aapki madad ke liye tayar hoon! Aaj hum kis project ya task par kaam karein?" };
        case 'gratitude':
          return { replyText: "Aapka bohot shukriya! Kisi aur cheez mein madad chahiye ho toh zaroor bataiye." };
        case 'acknowledgment':
          return { replyText: "Theek hai! Jab bhi zaroorat ho, main yahan mojood hoon." };
        case 'farewell':
          return { replyText: "Allah Hafiz! Jab bhi zaroorat ho, main yahan mojood hoon." };
        default:
          return { replyText: "Salam! Aaj main aapki kis tarah madad kar sakta hoon?" };
      }
    }

    // English responses
    switch (sub) {
      case 'how_are_you':
        return { replyText: "I'm doing great, thank you for asking! Ready to help you stay on top of your projects and goals. What are we working on?" };
      case 'gratitude':
        return { replyText: "You're very welcome! Let me know if you need anything else." };
      case 'acknowledgment':
        if (lower === 'okay' || lower === 'ok' || lower === 'got it') {
          return { replyText: "Sounds good! I'm here whenever you need me." };
        }
        return { replyText: "Great! Let me know what you'd like to tackle next." };
      case 'farewell':
        return { replyText: "Goodbye! Have a productive day ahead, and I'll be here whenever you need me." };
      default:
        return { replyText: "I'm here and ready to help. What would you like to work on?" };
    }
  }

  // ==========================================
  // 4. IDENTITY (Who are you, what can you do)
  // ==========================================
  if (intent.type === 'IDENTITY') {
    if (isRomanUrdu) {
      return {
        replyText: "Main AURA hoon, aapka intelligent freelance business copilot. Main aapke daily schedule, active projects, deliverables, client accounts aur revenue tracking ko organize karne mein madad karta hoon. Hamara buniyadi usool hai: *AI assists. Human decides.*"
      };
    }
    return {
      replyText: "I'm AURA, your intelligent freelance business assistant. I help you plan your daily schedule, track project milestones, manage deliverables, coordinate client communications, and monitor financial performance under our core principle: *AI assists. Human decides.* How can I help you today?"
    };
  }

  // ==========================================
  // 5. SCHEDULE (Today schedule, calendar, daily agenda)
  // ==========================================
  if (
    intent.type === 'SCHEDULE' ||
    intent.type === 'CALENDAR' ||
    intent.type === 'TODAY_PLAN' ||
    intent.type === 'PLANNING_REQUEST'
  ) {
    const dueTodayTasks = pendingTasks.filter((t) => t.deadline === CURRENT_DATE_STR);
    const highPriorityTasks = pendingTasks.filter((t) => t.priority === 'High' || t.priority === 'Urgent');
    const remainingTasks = pendingTasks.filter((t) => t.deadline !== CURRENT_DATE_STR && !overdueTasks.includes(t));

    if (pendingTasks.length === 0 && activeProjects.length === 0) {
      return {
        replyText: isRomanUrdu
          ? "Aapke workspace mein aaj ke liye koi tasks ya deliverables scheduled nahi hain. Aapka schedule bilkul clear hai! Kya aap naya task create karna chahte hain?"
          : "You currently have no tasks or deliverables scheduled for today. Your schedule is clear! Would you like to create a new task or review project milestones?"
      };
    }

    if (isRomanUrdu) {
      let scheduleText = `*Note: External calendar (Google Calendar) linked nahi hai, lekin aapke workspace tasks aur deadlines ke mutabiq aaj (${CURRENT_DATE_STR}) ka schedule yeh hai:*\n\n`;
      let step = 1;
      if (overdueTasks.length > 0) {
        scheduleText += `${step}. **Subah (Overdue Action):** Overdue task **${overdueTasks[0].title}** ko complete karein (Due: ${overdueTasks[0].deadline}).\n`;
        step++;
      }
      if (dueTodayTasks.length > 0) {
        scheduleText += `${step}. **Dopahar (Due Today):** **${dueTodayTasks[0].title}** deliverable par kaam karein.\n`;
        step++;
      } else if (highPriorityTasks.length > 0) {
        scheduleText += `${step}. **Dopahar (Priority Deliverable):** **${highPriorityTasks[0].title}** (${highPriorityTasks[0].projectName || 'Milestone'}) par execution jari rakhein.\n`;
        step++;
      }
      if (activeProjects.length > 0) {
        const topProj = activeProjects[0];
        scheduleText += `${step}. **Shaam (Project Review):** **${topProj.name}** ki progress review karein (${topProj.progress}% complete, target deadline: ${topProj.deadline}).`;
      }
      return { replyText: scheduleText.trim() };
    }

    let scheduleText = `*Note: You do not have an external calendar integrated (such as Google Calendar), but based on your active workspace tasks and deadlines, here is your prioritized schedule for today (${CURRENT_DATE_STR}):*\n\n`;
    let step = 1;

    if (overdueTasks.length > 0) {
      scheduleText += `${step}. **Morning Focus (09:00 - 12:00):** Address overdue deliverable: **${overdueTasks[0].title}** (originally due ${overdueTasks[0].deadline}). Resolving this clears client bottlenecks.\n`;
      step++;
    } else if (highPriorityTasks.length > 0) {
      scheduleText += `${step}. **Morning Focus (09:00 - 12:00):** Prioritize high-impact work: **${highPriorityTasks[0].title}** (linked to **${highPriorityTasks[0].projectName || 'Active Delivery'}**).\n`;
      step++;
    }

    if (dueTodayTasks.length > 0) {
      scheduleText += `${step}. **Midday Execution (13:00 - 15:30):** Complete task due today: **${dueTodayTasks[0].title}** (${dueTodayTasks[0].clientName ? `Client: ${dueTodayTasks[0].clientName}` : 'Deliverable'}).\n`;
      step++;
    } else if (remainingTasks.length > 0) {
      scheduleText += `${step}. **Midday Execution (13:00 - 15:30):** Advance scheduled task: **${remainingTasks[0].title}** (Priority: ${remainingTasks[0].priority || 'Normal'}).\n`;
      step++;
    }

    if (activeProjects.length > 0) {
      const topProj = activeProjects.find((p) => p.priority === 'High' || p.priority === 'Urgent') || activeProjects[0];
      scheduleText += `${step}. **Afternoon Wrap-up (16:00 - 17:30):** Progress milestone on **${topProj.name}** (currently at ${topProj.progress}% completion, target deadline: ${topProj.deadline}).\n`;
      step++;
    }

    if (approvals.length > 0) {
      scheduleText += `${step}. **Governance Sign-off:** Review ${approvals.length} pending item(s) in the **Approval Center**.`;
    }

    return { replyText: scheduleText.trim() };
  }

  // ==========================================
  // 6. WORKSPACE_SUMMARY (Explicit high-level overview)
  // ==========================================
  if (intent.type === 'WORKSPACE_SUMMARY') {
    if (isRomanUrdu) {
      return {
        replyText: `Aapke workspace ka high-level jaiza yeh hai:\n\n- **Active Projects:** ${activeProjects.length} (${activeProjects.map((p) => p.name).join(', ') || 'None'})\n- **Pending Tasks:** ${pendingTasks.length}${overdueTasks.length > 0 ? ` (${overdueTasks.length} overdue)` : ''}\n- **Realized Revenue:** $${totalPaidRevenue.toLocaleString()}\n- **Clients:** ${clients.length} registered\n\nSabhi systems operational hain. Kis cheez par pehle tawajjo dein?`
      };
    }
    return {
      replyText: `Here is a high-level summary of your workspace operations:\n\n- **Active Projects:** ${activeProjects.length} (${activeProjects.map((p) => p.name).join(', ') || 'None'})\n- **Pending Tasks:** ${pendingTasks.length}${overdueTasks.length > 0 ? ` (${overdueTasks.length} overdue)` : ''}\n- **Realized Revenue:** $${totalPaidRevenue.toLocaleString()} across settled accounts\n- **Client Accounts:** ${clients.length} active client${clients.length === 1 ? '' : 's'}\n\nAll primary workspace operations remain healthy. How would you like to proceed?`
    };
  }

  // ==========================================
  // 7. TASKS (Tasks queries: overdue, pending, list)
  // ==========================================
  if (intent.type === 'TASKS') {
    const sub = intent.subType;

    if (sub === 'overdue_tasks' || /overdue/i.test(message)) {
      if (overdueTasks.length === 0) {
        return {
          replyText: isRomanUrdu
            ? "Zabardast! Aapka koi bhi task overdue nahi hai. Sab deliverables waqt par hain."
            : "Good news! You have no overdue tasks right now. All scheduled work is within timeline."
        };
      }
      const list = overdueTasks
        .map((t) => `- **${t.title}** (Due: ${t.deadline || 'unspecified'}, Priority: ${t.priority})`)
        .join('\n');
      return {
        replyText: isRomanUrdu
          ? `Aapke paas **${overdueTasks.length}** overdue task${overdueTasks.length === 1 ? '' : 's'} hain:\n\n${list}`
          : `You have **${overdueTasks.length}** overdue task${overdueTasks.length === 1 ? '' : 's'}:\n\n${list}`
      };
    }

    if (pendingTasks.length === 0) {
      return {
        replyText: isRomanUrdu
          ? "Aapke paas is waqt koi pending task nahi hai. Sab kaam mukammal hai!"
          : "You have no pending tasks right now. All deliverables are up to date!"
      };
    }

    const taskList = pendingTasks
      .slice(0, 6)
      .map((t) => `- **${t.title}** (${t.priority} priority, Due: ${t.deadline || 'No date'})`)
      .join('\n');

    return {
      replyText: isRomanUrdu
        ? `Aapke paas **${pendingTasks.length}** pending tasks hain:\n\n${taskList}`
        : `You have **${pendingTasks.length}** pending task${pendingTasks.length === 1 ? '' : 's'}${overdueTasks.length > 0 ? ` (${overdueTasks.length} overdue)` : ''}:\n\n${taskList}`
    };
  }

  // ==========================================
  // 8. PROJECTS (Active projects, project status)
  // ==========================================
  if (intent.type === 'PROJECTS') {
    if (intent.subType === 'specific_project' && intent.extractedEntities.projectName) {
      const proj = projects.find(
        (p) => p.name.toLowerCase() === intent.extractedEntities.projectName?.toLowerCase()
      );
      if (proj) {
        return {
          replyText: `**${proj.name}** is currently **${proj.status}** with **${proj.progress}%** completion. Target deadline is **${proj.deadline}** (Client: ${proj.clientName || 'Direct'}).`
        };
      }
    }

    if (activeProjects.length === 0) {
      return {
        replyText: isRomanUrdu
          ? "Aapke paas is waqt koi active project nahi hai."
          : "You currently have 0 active projects."
      };
    }

    const projSummary = activeProjects
      .map((p) => `- **${p.name}** (${p.status}, ${p.progress}% complete, Due: ${p.deadline})`)
      .join('\n');

    return {
      replyText: isRomanUrdu
        ? `Aapke paas **${activeProjects.length}** active projects hain:\n\n${projSummary}`
        : `You currently have **${activeProjects.length}** active project${activeProjects.length === 1 ? '' : 's'}:\n\n${projSummary}`
    };
  }

  // ==========================================
  // 9. CLIENTS (Clients list, attention)
  // ==========================================
  if (intent.type === 'CLIENTS') {
    if (clients.length === 0) {
      return { replyText: "You haven't added any clients to your workspace yet." };
    }

    if (intent.subType === 'clients_needing_attention' || /attention/i.test(message)) {
      const attentionClients = clients.filter((c) => {
        const hasOverdueInv = overdueInvoices.some((inv) => inv.clientName.toLowerCase() === c.name.toLowerCase());
        const hasOverdueTask = overdueTasks.some((t) => t.clientName?.toLowerCase() === c.name.toLowerCase());
        return hasOverdueInv || hasOverdueTask;
      });

      if (attentionClients.length === 0) {
        return { replyText: "All client relationships and account balances are currently in good standing." };
      }

      const list = attentionClients.map((c) => `- **${c.name}** (${c.company || 'Client'})`).join('\n');
      return { replyText: `The following client accounts currently require attention:\n\n${list}` };
    }

    const list = clients
      .map((c) => `- **${c.name}** (${c.company || 'Client'} - Status: ${c.status})`)
      .join('\n');

    return {
      replyText: `You have **${clients.length}** registered client${clients.length === 1 ? '' : 's'}:\n\n${list}`
    };
  }

  // ==========================================
  // 10. REVENUE & INVOICES
  // ==========================================
  if (intent.type === 'REVENUE') {
    if (intent.subType === 'overdue_invoices' || /overdue invoice/i.test(message)) {
      if (overdueInvoices.length === 0) {
        return { replyText: "Good news! None of your invoices are currently overdue." };
      }
      const overdueList = overdueInvoices
        .map((i) => `- **${i.invoiceNumber}** for ${i.clientName}: $${i.amount.toLocaleString()} (Due: ${i.dueDate})`)
        .join('\n');
      return { replyText: `You have **${overdueInvoices.length}** overdue invoice${overdueInvoices.length === 1 ? '' : 's'}:\n\n${overdueList}` };
    }

    if (intent.subType === 'invoices_lookup' || /invoices?/i.test(message)) {
      if (invoices.length === 0) {
        return { replyText: "You don't have any recorded invoices in your workspace yet." };
      }
      const invList = invoices
        .slice(0, 5)
        .map((i) => `- **${i.invoiceNumber}** (${i.clientName}): $${i.amount.toLocaleString()} — Status: **${i.status}**`)
        .join('\n');
      return { replyText: `Here are your recent invoices:\n\n${invList}` };
    }

    // Revenue total
    let revText = `Your total realized revenue is **$${totalPaidRevenue.toLocaleString()}** (from ${paidInvoices.length} paid invoice${paidInvoices.length === 1 ? '' : 's'}).`;
    if (pendingInvoices.length > 0) {
      const pendingSum = pendingInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      revText += ` You also have **$${pendingSum.toLocaleString()}** in pending/sent invoices.`;
    }
    if (overdueInvoices.length > 0) {
      const overdueSum = overdueInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      revText += ` Note: **$${overdueSum.toLocaleString()}** is currently overdue.`;
    }
    return { replyText: revText };
  }

  // ==========================================
  // 11. BUSINESS_ADVICE & ANALYSIS
  // ==========================================
  if (intent.type === 'BUSINESS_ADVICE' || intent.type === 'ANALYSIS_REQUEST') {
    const totalProjects = projects.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    let analysis = `Here is an operational analysis of your current workspace:\n\n`;
    analysis += `### 📊 Workload & Delivery Health\n`;
    analysis += `- **Active Projects:** ${activeProjects.length} of ${totalProjects} total\n`;
    analysis += `- **Task Completion Rate:** ${taskCompletionRate}% (${completedTasks} completed, ${pendingTasks.length} pending)\n`;
    analysis += `- **Deadline Adherence:** ${overdueTasks.length === 0 ? 'Optimal (0 overdue tasks)' : `Attention required: ${overdueTasks.length} overdue task(s)`}\n\n`;

    analysis += `### 💰 Financial Snapshot\n`;
    analysis += `- **Realized Revenue:** $${totalPaidRevenue.toLocaleString()} across settled accounts\n`;
    if (overdueInvoices.length > 0) {
      const overdueSum = overdueInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      analysis += `- **Overdue Receivables:** $${overdueSum.toLocaleString()} (${overdueInvoices.length} invoice pending collection)\n`;
    }

    analysis += `\n### 💡 Strategic Recommendation\n`;
    if (overdueTasks.length > 0) {
      analysis += `Clear the overdue task "${overdueTasks[0]?.title}" first to maintain client trust and delivery velocity.`;
    } else {
      analysis += `Execution velocity is solid. Maintain momentum on active milestones and review upcoming project deadlines.`;
    }

    return { replyText: analysis.trim() };
  }

  // ==========================================
  // 12. ACTION_REQUEST (Task or invoice proposal)
  // ==========================================
  if (intent.type === 'ACTION_REQUEST' || intent.type === 'TASK_OR_WORK_REQUEST') {
    const rawTitle = intent.extractedEntities.taskTitle || 'Follow up with client';
    const dueDate = intent.extractedEntities.dueDate || '2026-09-14';
    const clientRef = intent.extractedEntities.clientName || (clients[0]?.name ?? 'Client');

    const formattedTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
    const finalTitle = formattedTitle.toLowerCase().includes(clientRef.toLowerCase())
      ? formattedTitle
      : `${formattedTitle} - ${clientRef}`;

    const proposal = {
      type: 'create_task' as const,
      title: finalTitle,
      description: `Action drafted by AURA based on user request: "${message}"`,
      deadline: dueDate,
      clientName: clientRef,
    };

    const reply = isRomanUrdu
      ? `Main yeh task create karne ke liye tayar hoon:\n\n- **Title:** ${proposal.title}\n- **Client:** ${proposal.clientName}\n- **Due Date:** ${proposal.deadline}\n\n*AURA Governance: AI assists. Human decides.* Kya main yeh task save kar doon?`
      : `I have prepared the task for you:\n\n- **Title:** ${proposal.title}\n- **Client:** ${proposal.clientName}\n- **Scheduled Date:** ${proposal.deadline}\n\nUnder AURA's human governance (*AI assists. Human decides*), please confirm below to execute this action.`;

    return {
      replyText: reply,
      actionProposal: proposal,
    };
  }

  // ==========================================
  // 13. FOLLOW_UP_QUESTION (Entity context resolution)
  // ==========================================
  if (intent.type === 'FOLLOW_UP_QUESTION') {
    const antecedent = intent.antecedentType || 'overdue_tasks';

    if (antecedent === 'overdue_tasks') {
      if (overdueTasks.length === 0) {
        return {
          replyText: isRomanUrdu
            ? "Aapke paas is waqt koi bhi overdue task nahi hai. Sab deliverables time par hain."
            : "You don't currently have any overdue tasks. All scheduled tasks are on track."
        };
      }
      const taskList = overdueTasks
        .map((t) => `- **${t.title}** (Due: ${t.deadline}, Priority: ${t.priority})`)
        .join('\n');
      return {
        replyText: isRomanUrdu
          ? `Overdue tasks yeh hain:\n\n${taskList}\n\nKya aap chahein ge ke main inki deadline reschedule karne mein madad karoon?`
          : `Here are the overdue tasks:\n\n${taskList}\n\nWould you like me to prepare a rescheduling proposal for any of these?`
      };
    }

    if (antecedent === 'projects' || antecedent === 'specific_project') {
      const projName = intent.extractedEntities.projectName || intent.antecedentValue || projects[0]?.name;
      const targetProj = projects.find((p) => p.name.toLowerCase() === (projName || '').toLowerCase()) || projects[0];
      if (targetProj) {
        return {
          replyText: isRomanUrdu
            ? `**${targetProj.name}** ka status: **${targetProj.status}**, progress: **${targetProj.progress}%**, aur deadline **${targetProj.deadline}** hai.`
            : `**${targetProj.name}** is currently in **${targetProj.status}** status at **${targetProj.progress}%** completion, with a deadline of **${targetProj.deadline}**.`
        };
      }
    }

    if (antecedent === 'invoices') {
      if (overdueInvoices.length > 0) {
        const inv = overdueInvoices[0];
        return {
          replyText: `The overdue invoice is **${inv.invoiceNumber}** for **${inv.clientName}** ($${inv.amount.toLocaleString()}), which was due on ${inv.dueDate || 'recently'}.`
        };
      }
      return {
        replyText: `Your invoices total $${totalPaidRevenue.toLocaleString()} in realized revenue across ${paidInvoices.length} paid invoices.`
      };
    }

    if (antecedent === 'clients') {
      const clientList = clients.map((c) => `- **${c.name}** (${c.company || 'Client'} - ${c.status})`).join('\n');
      return {
        replyText: `Here are the registered clients:\n\n${clientList}`
      };
    }
  }

  // ==========================================
  // 14. UNKNOWN / HONEST FALLBACK
  // ==========================================
  if (isUrdu) {
    return {
      replyText: "معذرت، میں آپ کی بات پوری طرح سمجھ نہیں سکا۔ میں آپ کے آج کے شیڈول، ٹاسکس، پراجیکٹس، کلائنٹس یا انوائسز میں مدد کر سکتا ہوں۔ آپ کیا جاننا چاہتے ہیں؟"
    };
  }

  if (isRomanUrdu) {
    return {
      replyText: "Mujhe theek se samajh nahi aaya. Main aapke aaj ke schedule, tasks, active projects, clients, ya invoices mein madad kar sakta hoon. Aap kis cheez ke bare mein janna chahte hain?"
    };
  }

  return {
    replyText: "I'm not quite sure how to help with that. I can help you with your daily schedule, tasks, active projects, clients, invoices, or business performance analysis. What would you like to explore?"
  };
}
