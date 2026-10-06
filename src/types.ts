export type NavigationTab =
  | 'overview'
  | 'clients'
  | 'projects'
  | 'tasks'
  | 'calendar'
  | 'finance'
  | 'invoices'
  | 'leads'
  | 'analytics'
  | 'ask-aura'
  | 'ai-insights'
  | 'business-brain'
  | 'unified-inbox'
  | 'email'
  | 'follow-ups'
  | 'proposals'
  | 'contracts'
  | 'services'
  | 'portfolio'
  | 'automations'
  | 'approvals'
  | 'connected-accounts'
  | 'activity-log'
  | 'documents'
  | 'settings'
  | 'features';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName: string;
  businessDomain?: string;
  teamSize?: string;
  primaryServices?: string[];
  averageProjectValue?: string;
  aiAssistanceLevel?: 'conservative' | 'balanced' | 'autonomous_with_approval' | string;
  currency?: string;
  isAuthenticated?: boolean;
  avatarUrl?: string;
  photoUrl?: string;
  industry?: string;
  primaryGoal?: string;
  accountType?: string;
  workspaceType?: string;
  skills?: string[];
  bio?: string;
  country?: string;
  timezone?: string;
  workingHours?: string;
}

export type ProjectStatus = 'Planning' | 'In Progress' | 'Review' | 'Completed' | 'On Hold';
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Completed';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  status: 'Active' | 'Lead' | 'Archived';
  source?: 'Direct' | 'Fiverr' | 'Referral' | 'Email Inquiry';
  totalBilled: number;
  openProjectsCount: number;
  rating?: number;
  notes?: string;
  tags?: string[];
  createdAt: string;
  lastInteraction?: string;
  nextFollowUp?: string;
  notesList?: string[];
  files?: string[];
  communicationHistory?: { date: string; channel: string; summary: string }[];
}

export interface ProjectMilestone {
  id: string;
  title: string;
  deadline: string;
  completed: boolean;
}

export interface ProjectComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  description: string;
  status: ProjectStatus;
  progress: number; // 0 to 100
  startDate?: string;
  endDate?: string;
  deadline: string;
  budget: number;
  expenses?: number;
  revenue?: number;
  profit?: number;
  totalLoggedHours?: number;
  hourlyRate?: number;
  laborCost?: number;
  priority: PriorityLevel;
  tasksCount: number;
  completedTasksCount: number;
  filesCount: number;
  notes?: string;
  files?: string[];
  dependencies?: string[]; // Project IDs this project depends on (for Gantt)
  milestones?: ProjectMilestone[];
  comments?: ProjectComment[];
  health?: 'Healthy' | 'At Risk' | 'Critical';
  healthExplanation?: string;
  aiRiskAssessment?: {
    level: 'low' | 'moderate' | 'high';
    explanation: string;
  };
  createdAt: string;
}

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskActivityEntry {
  timestamp: string;
  action: string;
  user?: string;
}

export type TaskCategory =
  | 'Urgent'
  | 'Strategic'
  | 'Routine'
  | 'Client Deliverable'
  | 'Operations'
  | 'Admin'
  | string;

export interface Task {
  id: string;
  title: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  status: TaskStatus;
  priority: PriorityLevel;
  category?: TaskCategory;
  label?: string;
  labels?: string[];
  aiCategoryReasoning?: string;
  deadline?: string;
  completedAt?: string;
  createdAt: string;
  notes?: string;
  tags?: string[];
  aiSuggested?: boolean;
  source?: 'manual' | 'fiverr' | 'email' | 'ai';
  subtasks?: TaskSubtask[];
  recurring?: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  dependencies?: string[]; // array of Task IDs or titles
  attachments?: string[];
  reminders?: string[];
  activityHistory?: TaskActivityEntry[];
  estimatedHours?: number;
  actualHours?: number;
  hourlyRate?: number;
  isTimerRunning?: boolean;
  timerStartedAt?: string;
  blockingTaskId?: string; // ID of the task blocking this task
  blockedByTaskId?: string; // Alias for blockingTaskId
  isBlocked?: boolean;
  isArchived?: boolean; // archived automatically or manually
  archivedAt?: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  defaultTitle?: string;
  defaultCategory?: TaskCategory;
  defaultPriority?: PriorityLevel;
  estimatedHours?: number;
  subtasks: { id: string; title: string; completed: boolean }[];
  isCustom?: boolean;
  createdAt?: string;
}
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';

export interface LeadActivity {
  id: string;
  timestamp: string;
  action: string;
  note?: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  source: string;
  potentialValue: number;
  status: LeadStatus;
  priority: PriorityLevel;
  notes?: string;
  lastContact?: string;
  nextFollowUp?: string;
  createdAt: string;
  assignedTo?: string;
  activityTimeline?: LeadActivity[];
}

// 2. Proposals
export type ProposalStatus = 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Expired';

export interface ProposalItem {
  serviceId?: string;
  title: string;
  description: string;
  price: number;
}

export interface Proposal {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  leadId?: string;
  services: ProposalItem[];
  pricing: number;
  timeline: string;
  scope: string;
  terms: string;
  status: ProposalStatus;
  createdAt: string;
  validUntil: string;
  sentAt?: string;
  viewedAt?: string;
  isAiGenerated?: boolean;
}

// 3. Contracts
export type ContractStatus = 'Draft' | 'Active' | 'Expiring' | 'Expired' | 'Cancelled';

export interface Contract {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  scope: string;
  paymentTerms: string;
  milestones: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  totalValue: number;
  createdAt: string;
  signedDate?: string;
}

// 4. Services
export type ServicePricingModel = 'Fixed' | 'Hourly' | 'Monthly Retainer' | 'Milestone-based';

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  pricing: number;
  pricingModel: ServicePricingModel;
  estimatedDelivery: string;
  features: string[];
  status: 'Active' | 'Archived';
  createdAt?: string;
}

// 5. Portfolio & Brand
export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  description: string;
  clientName?: string;
  completionDate?: string;
  skills: string[];
  metrics?: string;
  testimonial?: {
    quote: string;
    clientName: string;
    role: string;
  };
  link?: string;
  published: boolean;
}

export interface BrandProfile {
  about: string;
  skills: string[];
  servicesSummary: string;
  brandVoice: string;
  standardPolicies: string;
  pricingGuidelines: string;
  targetAudience: string;
  isPublic: boolean;
}

// 6. Unified Inbox & Email
export type MessageSource = 'email' | 'fiverr' | 'direct';

export interface DetectedActionProposal {
  clientName?: string;
  request?: string;
  deadline?: string;
  suggestedTaskTitle?: string;
  projectId?: string;
  requiresFollowUp?: boolean;
}

export interface UnifiedMessage {
  id: string;
  source: MessageSource;
  senderName: string;
  senderEmail: string;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  subject: string;
  body: string;
  timestamp: string;
  unread: boolean;
  isImportant: boolean;
  isArchived: boolean;
  requiresFollowUp?: boolean;
  folder?: 'inbox' | 'sent' | 'drafts';
  detectedAction?: DetectedActionProposal;
  replyDraft?: string;
}

// 7. Follow-ups
export type FollowUpStatus = 'Upcoming' | 'Due' | 'Overdue' | 'Completed';

export interface FollowUpItem {
  id: string;
  clientId: string;
  clientName: string;
  reason: string;
  relatedProjectId?: string;
  relatedProjectName?: string;
  lastContact: string;
  nextFollowUpDate: string;
  priority: PriorityLevel;
  status: FollowUpStatus;
  notes?: string;
  aiSuggested?: boolean;
  completedAt?: string;
}

// 8. Documents / File Center
export type DocumentCategory =
  | 'Client Files'
  | 'Project Files'
  | 'Contracts'
  | 'Proposals'
  | 'Invoices'
  | 'Attachments'
  | 'Business Documents'
  | 'Proposal'
  | 'Contract'
  | 'Brief'
  | 'Invoice'
  | 'Deliverable'
  | 'Report'
  | 'Guideline'
  | string;

export type DocumentType = DocumentCategory;

export interface DocumentItem {
  id: string;
  title: string;
  fileName?: string;
  fileSize: string;
  fileType: string;
  type?: string;
  category?: DocumentCategory;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  uploadDate?: string;
  uploadedAt?: string;
  tags?: string[];
  notes?: string;
  aiIndexed?: boolean;
}

// 9. AURA Knowledge Base
export type KnowledgeCategory =
  | 'Business Information'
  | 'Services'
  | 'Pricing'
  | 'Policies'
  | 'FAQs'
  | 'Client Preferences'
  | 'Processes'
  | 'Brand Voice'
  | 'Internal Instructions';

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: KnowledgeCategory;
  content: string;
  lastUpdated: string;
}

// 10. Business Goals
export type GoalCategory =
  | 'Monthly Revenue'
  | 'Profit'
  | 'New Clients'
  | 'Projects'
  | 'Productivity'
  | 'Business Growth';

export interface BusinessGoal {
  id: string;
  title: string;
  category: GoalCategory | string;
  targetValue?: number;
  currentValue?: number;
  target?: number;
  current?: number;
  status?: 'In Progress' | 'Achieved' | 'On Track' | 'At Risk' | 'Completed' | 'Behind' | string;
  unit: string;
  period?: 'Monthly' | 'Quarterly' | 'Yearly';
  deadline: string;
  notes?: string;
}

// 11. Smart Notifications
export type NotificationCategory = 'URGENT' | 'ATTENTION' | 'INFORMATION' | 'AI_RECOMMENDATION';

export interface SmartNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
  actionTab?: NavigationTab;
  actionLabel?: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  rate?: number;
  unitPrice?: number;
  amount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes?: string;
  createdAt?: string;
}

export type ConnectionHealth =
  | 'Healthy'
  | 'Needs Attention'
  | 'Disconnected'
  | 'Authorization Expired'
  | 'Sync Error';

export type SyncState = 'Idle' | 'Syncing' | 'Completed' | 'Failed' | 'Never Synced';

export interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  durationMs: number;
  status: 'Completed' | 'Failed';
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  recordsSkipped: number;
  message: string;
  error?: string;
}

export type IntegrationStatus =
  | 'connected'
  | 'available'
  | 'disconnected'
  | 'connecting'
  | 'syncing'
  | 'reauth_required'
  | 'token_expired'
  | 'permission_revoked'
  | 'error'
  | 'not_configured'
  | 'unsupported';

export interface ConnectedAccount {
  id: string;
  provider: 'fiverr' | 'gmail' | 'outlook' | 'gcal' | 'gdrive' | 'github' | 'stripe' | 'slack' | 'notion' | string;
  name: string;
  category?: 'commerce' | 'email' | 'calendar' | 'storage' | 'development' | 'business' | 'communication' | 'productivity' | 'general';
  accountIdentifier: string;
  connectedAt: string;
  lastSync: string;
  status: IntegrationStatus;
  connectionHealth: ConnectionHealth;
  syncStatus: SyncState;
  syncMessage?: string;
  lastSyncDuration?: string;
  errorDetails?: string;
  permissions: string[];
  allAvailablePermissions?: string[];
  capabilities?: string[];
  requiredConfig?: string;
  privacyNotice?: string;
  dataCategories: string[];
  icon: string;
  dataStats?: {
    activeOrders?: number;
    unreadMessages?: number;
    analyzedEmails?: number;
    totalSyncedRecords?: number;
  };
  syncHistory?: SyncHistoryEntry[];
}

export interface AiApprovalItem {
  id: string;
  title: string;
  source: 'fiverr' | 'email' | 'invoice' | 'task_overdue';
  whatHappened: string;
  whyDetected: string;
  whatAuraWantsToDo: string;
  dataUsed: string;
  suggestedAction: 'create_task' | 'send_email_draft' | 'flag_overdue' | 'reprioritize_workload';
  payload?: any;
  proposedActionData?: {
    taskTitle?: string;
    projectId?: string;
    deadline?: string;
    description?: string;
    clientEmail?: string;
  };
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: string;
}

export interface AutomationRule {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  trigger: string;
  action: string;
  requiresHumanApproval?: boolean;
  requiresApproval?: boolean;
  enabled?: boolean;
  status?: 'Active' | 'Paused';
  lastExecution?: string;
  triggerCount?: number;
  executionsCount?: number;
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: 'client' | 'project' | 'task' | 'ai' | 'finance' | 'integration' | 'growth' | 'communication' | 'security' | 'system';
  actor?: 'User' | 'AURA AI' | 'System' | 'Client';
  actorType?: 'user' | 'ai' | 'system' | string;
  relatedEntity?: string;
  result?: string;
  icon?: string;
}

export type ActivityItem = ActivityLog;

export interface WorkspaceData {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  invoices: Invoice[];
  connectedAccounts: ConnectedAccount[];
  approvals: AiApprovalItem[];
  automations: AutomationRule[];
  activityLogs: ActivityLog[];
  leads: Lead[];
  proposals: Proposal[];
  contracts: Contract[];
  services: Service[];
  portfolio: PortfolioItem[];
  brandProfile: BrandProfile;
  messages: UnifiedMessage[];
  followUps: FollowUpItem[];
  documents: DocumentItem[];
  knowledgeBase: KnowledgeEntry[];
  goals: BusinessGoal[];
  notifications: SmartNotification[];
  stats?: any;
}
