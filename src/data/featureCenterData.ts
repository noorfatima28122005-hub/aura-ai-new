import { NavigationTab } from '../types';
import {
  Flame,
  Edit3,
  Clock,
  Sparkles,
  Bot,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  BarChart3,
  Zap,
  Mic,
  ShieldCheck,
  Send,
  Mail,
  Bookmark,
  Layers,
  CheckSquare,
  TrendingUp,
  FolderKanban,
  Target,
  Brain,
  Inbox,
  Award,
  Terminal,
  Palette,
  Lightbulb,
  Building2,
  Store,
  UserCheck,
  CheckCircle2,
  Link2,
} from 'lucide-react';

export type FeatureCategory =
  | 'All Features'
  | 'Productivity'
  | 'Tasks'
  | 'Projects'
  | 'Clients'
  | 'AI'
  | 'Business'
  | 'Communication'
  | 'Content'
  | 'Analytics'
  | 'Finance'
  | 'Automation'
  | 'Knowledge';

export interface FeatureItem {
  id: string;
  name: string;
  category: FeatureCategory;
  categoryLabel: string;
  icon: any;
  targetTab: NavigationTab;
  badge?: string;
  whatItDoes: string;
  whyItMatters: string;
  howToUse: string;
  benefit: string;
  detailedSteps: string[];
  proTip: string;
}

export const ALL_FEATURES: FeatureItem[] = [
  {
    id: 'connected_accounts_hub',
    name: 'Connected Accounts & Official Integrations',
    category: 'Automation',
    categoryLabel: 'Integrations & OAuth',
    icon: Link2,
    targetTab: 'connected-accounts',
    badge: 'OAuth 2.0 PKCE',
    whatItDoes: 'Connect Gmail, Outlook, Fiverr Pro, Google Calendar, Google Drive, and GitHub using official developer APIs and OAuth 2.0 with PKCE verification.',
    whyItMatters: 'Feeds live client inquiries, milestone dates, and active orders directly into AURA without exposing third-party passwords.',
    howToUse: 'Open the Connected Accounts manager, pick any available integration, configure granular permissions, and click Authorize & Connect.',
    benefit: 'Automate milestone tracking and context ingestion across all your communication and workspace tools from a single control panel.',
    detailedSteps: [
      'Navigate to Connected Accounts from the sidebar or Settings.',
      'Review provider status: Connected, Available, or Config Required.',
      'Click Authorize & Connect to launch the official OAuth permission modal.',
      'Verify requested scopes and confirm authorization. Tokens remain encrypted server-side.',
    ],
    proTip: 'Use the "Sync Now" button on any connected card to immediately refresh client communications and order statuses.',
  },
  {
    id: 'task_priority',
    name: 'Smart Task Priority Matrix',
    category: 'Tasks',
    categoryLabel: 'Task Management',
    icon: Flame,
    targetTab: 'tasks',
    badge: 'Core Workflow',
    whatItDoes: 'Set and update tasks as Low, Medium, High, or Urgent with color-coded badges and instant inline dropdown controls.',
    whyItMatters: 'Critical client deliverables and approaching deadlines stand out immediately, eliminating guessing about what to work on next.',
    howToUse: 'Click the colored priority pill (e.g., ● HIGH) directly on any task card to switch levels instantly without opening full modals.',
    benefit: 'Spend zero time organizing backlogs and 100% of your focus executing the highest-value deliverables first.',
    detailedSteps: [
      'Navigate to the Tasks view from the sidebar or press Cmd/Ctrl + Shift + A.',
      'Locate the task card and click its priority badge (e.g., ● LOW, ● MEDIUM, ● HIGH).',
      'Select your desired priority tier from the quick dropdown menu.',
      'The badge updates immediately and synchronizes with your cloud database and project urgency calculations.',
    ],
    proTip: 'Urgent tasks due within 24 hours automatically activate the persistent yellow alert banner in your command bar.',
  },
  {
    id: 'inline_descriptions',
    name: 'Inline Task Description & Notes',
    category: 'Tasks',
    categoryLabel: 'Task Management',
    icon: Edit3,
    targetTab: 'tasks',
    badge: 'Quick Edit',
    whatItDoes: 'Edit deliverable specifications, acceptance criteria, or client links directly on the task card without loading a separate page.',
    whyItMatters: 'Context switching to edit task notes slows down momentum; inline editing keeps your focus in the flow state.',
    howToUse: 'Click the "Edit" button next to any task description, make your changes, and press ⌘+Enter or click Save.',
    benefit: 'Update client feedback, scope adjustments, or checklist notes in seconds directly within your sprint view.',
    detailedSteps: [
      'Hover over or inspect any task card in the Task Matrix.',
      'Click the subtle pencil icon or "Add task description" link.',
      'Type or paste client briefs, URLs, or deliverable criteria into the multiline editor.',
      'Press ⌘+Enter (Cmd/Ctrl + Enter) or tap "Save" to commit the changes immediately.',
    ],
    proTip: 'Use Markdown bullet points inside descriptions to structure multi-part deliverables cleanly.',
  },
  {
    id: 'hours_progress',
    name: 'Estimated vs. Actual Hours Tracker',
    category: 'Productivity',
    categoryLabel: 'Productivity & Time',
    icon: Clock,
    targetTab: 'tasks',
    badge: 'Profit Guard',
    whatItDoes: 'Tracks logged hours against initial labor estimates with visual gradient progress bars and real-time overage indicators.',
    whyItMatters: 'Uncapped scope creep silently destroys freelance profit margins; visual hour tracking alerts you before you go over budget.',
    howToUse: 'Use the built-in stopwatch timer or +15m / +30m / +1h quick-log buttons directly on the task card.',
    benefit: 'Protects hourly earnings, ensures accurate client billing, and prevents project cost overruns.',
    detailedSteps: [
      'Set an estimated labor duration (e.g., 5h) when creating or editing a task.',
      'Start the live stopwatch when beginning work, or tap +30m / +1h as you make progress.',
      'Watch the progress bar fill: cyan indicates on-track pacing; amber highlights budget overages.',
      'Click the dollar coin icon to sync task hours directly to your client project labor costs.',
    ],
    proTip: 'Pair with the stopwatch to log micro-sessions accurately without mental arithmetic.',
  },
  {
    id: 'subtask_progress',
    name: 'Subtask Checklist & Completion Engine',
    category: 'Tasks',
    categoryLabel: 'Task Management',
    icon: CheckSquare,
    targetTab: 'tasks',
    badge: 'Granular Flow',
    whatItDoes: 'Break complex deliverables into manageable micro-steps with individual checkboxes and real-time percentage indicators.',
    whyItMatters: 'Large tasks cause hesitation; subtasks give you immediate momentum and visible milestones.',
    howToUse: 'Click the subtask disclosure chevron on any task card to expand, add micro-steps, and check them off as completed.',
    benefit: 'Eliminates overwhelm and demonstrates measurable progress to clients during review milestones.',
    detailedSteps: [
      'Expand the subtasks section on any task card.',
      'Type a micro-deliverable name and press Enter to append.',
      'Check off items as completed; the progress bar recalculates automatically.',
      'When all subtasks are finished, AURA suggests marking the parent task completed.',
    ],
    proTip: 'Save frequent subtask groups as reusable templates for recurring client onboarding steps.',
  },
  {
    id: 'voice_companion',
    name: 'AURA Live Voice Companion',
    category: 'AI',
    categoryLabel: 'AI & Copilot',
    icon: Mic,
    targetTab: 'ask-aura',
    badge: 'Live Audio',
    whatItDoes: 'Hands-free conversational assistant capable of answering questions, summarizing project statuses, and recording tasks via voice.',
    whyItMatters: 'Speak your thoughts during commutes, creative flow, or while reviewing design comps without typing.',
    howToUse: 'Click the floating glowing orb in the bottom right corner or press Cmd/Ctrl + Shift + K to start talking.',
    benefit: 'Save up to 45 minutes daily by talking through task backlogs, scheduling, and strategic brainstorming.',
    detailedSteps: [
      'Press Cmd/Ctrl + Shift + K anywhere in the workspace to launch the Voice Companion.',
      'Speak naturally (e.g., "Add high priority task for Acme redesign due Friday").',
      'AURA transcribes your speech, extracts entities, and executes the action with voice feedback.',
      'Review the created task or ask AURA follow-up questions about project health.',
    ],
    proTip: 'Works in real-time with ambient wave animations and auto-silence detection.',
  },
  {
    id: 'client_crm',
    name: 'Client Relationship & Pipeline CRM',
    category: 'Clients',
    categoryLabel: 'Client Management',
    icon: Users,
    targetTab: 'clients',
    badge: 'Relationships',
    whatItDoes: 'Centralized directory of all client profiles, default billing rates, active projects, and communication history.',
    whyItMatters: 'Keeps contact information, payment terms, and relationship stages organized in one clean dashboard.',
    howToUse: 'Open the Clients tab to view active pipelines, track stage status (Contacted → Requirements → Delivery), and manage client health.',
    benefit: 'Never lose track of a client conversation or miss an opportunity to follow up on new work.',
    detailedSteps: [
      'Navigate to the Clients view from the sidebar navigation.',
      'Click "+ Add Client" to enter company name, contact person, email, and hourly billing rate.',
      'Assign active projects and track communication stages on the interactive timeline.',
      'Review total lifetime billed value and open invoices per client.',
    ],
    proTip: 'Click any client to see all associated projects, tasks, and invoices aggregated in one card.',
  },
  {
    id: 'project_hub',
    name: 'Project Pipeline & Milestone Hub',
    category: 'Projects',
    categoryLabel: 'Project Management',
    icon: Briefcase,
    targetTab: 'projects',
    badge: 'Delivery',
    whatItDoes: 'Track project scopes, deadlines, milestone stages, labor budgets, and profit margins across your entire portfolio.',
    whyItMatters: 'Prevents scope creep and keeps multi-client deliverables on schedule with clear status indicators.',
    howToUse: 'Access the Projects view to monitor completion percentages, budget burn rates, and automated deadline risk warnings.',
    benefit: 'Clear visibility into project health ensures timely handoffs and healthy profit margins.',
    detailedSteps: [
      'Click Projects in the sidebar to view all active, in-progress, and completed initiatives.',
      'Review progress bars calculated from completed tasks and logged billable hours.',
      'Inspect labor burn rates against project fee caps to prevent margin loss.',
      'Filter projects by client or urgency to focus your daily execution.',
    ],
    proTip: 'Flag projects at risk with 1-click to trigger proactive AI recommendations.',
  },
  {
    id: 'unified_inbox',
    name: 'Unified Client Communication Inbox',
    category: 'Communication',
    categoryLabel: 'Client Communications',
    icon: Inbox,
    targetTab: 'unified-inbox',
    badge: 'Multi-Channel',
    whatItDoes: 'Consolidates inbound client messages across WhatsApp, Email, Instagram, LinkedIn, and Web in one centralized triage feed.',
    whyItMatters: 'Eliminates messy context switching between multiple apps and ensures zero client inquiries slip through the cracks.',
    howToUse: 'Open Unified Inbox to review unread client threads, tag urgency, draft AI responses, and convert messages into tasks.',
    benefit: 'Respond 3x faster to high-paying client requests with structured conversation threading.',
    detailedSteps: [
      'Navigate to Unified Inbox from the sidebar or click the notification bell.',
      'Select any message thread to view the full dialogue and channel badge.',
      'Use "AI Draft Reply" to generate professional, polite responses tailored to your brand voice.',
      'Click "Convert to Task" to turn client feature requests directly into sprint backlog items.',
    ],
    proTip: 'Filter by channel or unread status to prioritize high-value inquiries first.',
  },
  {
    id: 'smart_invoicing',
    name: 'Smart Invoicing & PDF Export',
    category: 'Finance',
    categoryLabel: 'Finance & Cashflow',
    icon: DollarSign,
    targetTab: 'invoices',
    badge: 'Cashflow',
    whatItDoes: 'Generate professional, branded invoices with itemized line items, tax calculations, and 1-click print-ready preview.',
    whyItMatters: 'Fast, accurate invoicing reduces payment delays and maintains predictable business cashflow.',
    howToUse: 'Open the Invoices tab, click "+ Create Invoice", select a client and project, and export or print directly.',
    benefit: 'Get paid faster with polished PDF invoices that reflect your professional standard.',
    detailedSteps: [
      'Go to Invoices view and click "+ New Invoice".',
      'Select the target client; billing rates and details auto-populate.',
      'Add billable task hours or custom project milestone items.',
      'Click "Quick Preview" to inspect the print-ready invoice and save as PDF.',
    ],
    proTip: 'Track status from Draft → Sent → Paid with automatic cashflow updates.',
  },
  {
    id: 'business_brain',
    name: 'Business Brain & Executive Insights',
    category: 'Business',
    categoryLabel: 'Business Intelligence',
    icon: Brain,
    targetTab: 'business-brain',
    badge: 'Strategic AI',
    whatItDoes: 'Analyzes your client concentration, revenue trajectories, hourly yields, and business bottlenecks to advise growth strategy.',
    whyItMatters: 'Transition from reactive task execution to proactive business leadership with data-driven clarity.',
    howToUse: 'Visit Business Brain to review executive metrics, diversification ratios, and actionable AI strategic recommendations.',
    benefit: 'Identify high-margin client services and eliminate unprofitable time sinks.',
    detailedSteps: [
      'Open Business Brain from the sidebar.',
      'Review Client Revenue Concentration charts to avoid over-reliance on a single account.',
      'Examine effective hourly yield across project types to optimize your pricing model.',
      'Review AI-suggested business actions (e.g., raising retainer rates or automating proposals).',
    ],
    proTip: 'Consult the diversification score monthly to safeguard business resilience.',
  },
  {
    id: 'proposals_engine',
    name: 'AI Proposal & Pitch Generator',
    category: 'Content',
    categoryLabel: 'Sales & Proposals',
    icon: FileText,
    targetTab: 'proposals',
    badge: 'Conversion',
    whatItDoes: 'Draft compelling project proposals, labor scopes, and fee schedules with AI assistance tailored to your services.',
    whyItMatters: 'Writing proposals from scratch takes hours; AI drafting lets you send polished pitches in minutes.',
    howToUse: 'Navigate to Proposals, choose a client lead, define project scope, and let AURA generate the structured proposal document.',
    benefit: 'Win more high-ticket clients by delivering impressive, structured proposals before competitors respond.',
    detailedSteps: [
      'Click Proposals in the sidebar and select "+ Draft Proposal".',
      'Specify the client lead, target deliverables, and estimated timeline.',
      'Generate proposal sections: Executive Summary, Deliverable Scope, Timeline, and Pricing.',
      'Export or share directly with the client for sign-off.',
    ],
    proTip: 'Reuse winning proposal sections as building blocks for future sales pitches.',
  },
  {
    id: 'portfolio_vault',
    name: 'Deliverable Vault & Work Showcase',
    category: 'Content',
    categoryLabel: 'Portfolio & Assets',
    icon: Award,
    targetTab: 'portfolio',
    badge: 'Showcase',
    whatItDoes: 'Store completed project deliverables, case studies, technologies used, and generate instant client showcases.',
    whyItMatters: 'Demonstrating proven results is the fastest way to justify premium rates and close new contracts.',
    howToUse: 'Open Portfolio, add completed project milestones with before-and-after metrics, and generate shareable links.',
    benefit: 'Always have high-impact proof of work ready when pitching prospective clients.',
    detailedSteps: [
      'Visit the Portfolio view from the sidebar navigation.',
      'Add completed project case studies with Problem, Solution, and Results achieved.',
      'Tag technologies, industries, and deliverable categories.',
      'Use 1-click Client Showcase generator to present relevant work to prospects.',
    ],
    proTip: 'Include quantitative metrics (e.g., "+40% conversion increase") for maximum impact.',
  },
  {
    id: 'approval_center',
    name: 'AI Approval Center & Human-in-the-Loop',
    category: 'Automation',
    categoryLabel: 'Control & Safety',
    icon: ShieldCheck,
    targetTab: 'approvals',
    badge: 'Safeguard',
    whatItDoes: 'Enforces human review before any automated action is taken, including dispatching emails, sending invoices, or rescheduling.',
    whyItMatters: 'Guarantees AI never sends accidental messages or executes unexpected changes without your explicit approval.',
    howToUse: 'Check the Approval Center to review pending automated actions, preview the exact contents, and Approve or Reject with 1 click.',
    benefit: 'Enjoy the speed of automation with the peace of mind of total human oversight.',
    detailedSteps: [
      'When an automation triggers an action (e.g., invoice follow-up), it routes to Approvals.',
      'Inspect the proposed message, recipient, and timing in the Approval Center.',
      'Click "Approve & Send" to dispatch, or edit the draft directly before releasing.',
      'Reject or dismiss actions that are no longer relevant.',
    ],
    proTip: 'Audit logs track every approved and executed action with timestamps.',
  },
  {
    id: 'document_center',
    name: 'Knowledge Vault & Document Center',
    category: 'Knowledge',
    categoryLabel: 'Knowledge & Docs',
    icon: Bookmark,
    targetTab: 'documents',
    badge: 'Repository',
    whatItDoes: 'Centralized repository for project briefs, client specifications, contracts, brand assets, and deliverable guidelines.',
    whyItMatters: 'Stops wasted time hunting through email attachments and lost drive links.',
    howToUse: 'Open Documents to upload, categorize, and link files directly to specific clients and active projects.',
    benefit: 'Everything you and your clients need accessible in one searchable knowledge hub.',
    detailedSteps: [
      'Navigate to Documents from the sidebar navigation.',
      'Upload project briefs, contracts, style guides, or wireframe links.',
      'Associate files with the corresponding client account and active project.',
      'Search instantly across documents using the global search modal (Cmd/Ctrl + K).',
    ],
    proTip: 'Tag documents with category tags (e.g. #Contract, #Brief) for rapid filtering.',
  },
  {
    id: 'financial_analytics',
    name: 'Financial Yield & Performance Analytics',
    category: 'Analytics',
    categoryLabel: 'Analytics & Yield',
    icon: BarChart3,
    targetTab: 'analytics',
    badge: 'Intelligence',
    whatItDoes: 'Calculates real effective hourly rates, revenue per client, labor margins, and monthly cashflow trends.',
    whyItMatters: 'Gross revenue doesn\'t reflect true profit; analytics shows you which projects actually maximize your take-home pay.',
    howToUse: 'Visit Analytics to review revenue charts, billable utilization percentages, and labor efficiency metrics.',
    benefit: 'Make confident decisions about which clients to keep, which rates to raise, and where to scale.',
    detailedSteps: [
      'Open the Analytics tab to view comprehensive business performance graphs.',
      'Review effective hourly rate across projects (total billed divided by actual hours logged).',
      'Inspect monthly revenue trajectories and payment velocity metrics.',
      'Export financial summaries for tax preparation and quarterly bookkeeping.',
    ],
    proTip: 'Filter by date range or client to compare performance quarter over quarter.',
  },
  {
    id: 'deadline_engine',
    name: 'Automated 24h Deadline Alert Engine',
    category: 'Productivity',
    categoryLabel: 'Alerts & Automation',
    icon: Zap,
    targetTab: 'tasks',
    badge: 'Continuous',
    whatItDoes: 'Continuously monitors deliverable deadlines and surfaces high-visibility warning banners when tasks enter the 24-hour window.',
    whyItMatters: 'Missed deadlines break client trust; proactive alerts ensure you execute on time, every time.',
    howToUse: 'Automations run silently in the background; when a task enters the 24h window, amber badges and notifications guide your focus.',
    benefit: 'Zero forgotten deliverables, stress-free workdays, and punctual client handoffs.',
    detailedSteps: [
      'When a deliverable is due within 24 hours, AURA surfaces an urgent indicator.',
      'Click the banner to isolate and focus on approaching deadlines.',
      'Complete or reschedule deliverables with one click to maintain a pristine sprint record.',
    ],
    proTip: 'Configure automated reminder lead times in the Automations tab anytime.',
  },
];

export const USE_CASES = [
  {
    role: 'Freelancers',
    icon: UserCheck,
    tagline: 'Track deliverables, protect profit margins, and manage solo operations.',
    description:
      'Manage client pipelines, estimate labor hours, track billable time, prevent scope creep, and send branded PDF invoices in minutes.',
    keyFeatures: ['Task Priority Matrix', 'Estimated vs Actual Hours', 'Instant PDF Invoices'],
    badge: 'Solo Professional',
  },
  {
    role: 'Agencies',
    icon: Building2,
    tagline: 'Coordinate multiple client pipelines and team deliverables.',
    description:
      'Monitor multi-project deadlines, track labor budget burn rates, oversee client communication across channels, and safeguard deliverables with human approvals.',
    keyFeatures: ['Multi-Project Pipelines', 'Financial Burn Rates', 'AI Approval Center'],
    badge: 'Team & Scale',
  },
  {
    role: 'Consultants',
    icon: Briefcase,
    tagline: 'Structure retainers, executive advisory notes, and strategic insights.',
    description:
      'Leverage Business Brain intelligence, track high-yield advisory hours, generate executive proposals, and optimize client revenue concentration.',
    keyFeatures: ['Business Brain Intelligence', 'High-Yield Advisory Hours', 'AI Proposals'],
    badge: 'Strategic Advisory',
  },
  {
    role: 'Developers',
    icon: Terminal,
    tagline: 'Track technical milestones, engineering labor, and sprint backlogs.',
    description:
      'Break complex coding initiatives into subtask checklists, log precise stopwatch hours, manage blocking dependencies, and export sprint summaries.',
    keyFeatures: ['Subtask Checklists', 'Live Stopwatch Timer', 'Task Dependency Links'],
    badge: 'Code & Deliver',
  },
  {
    role: 'Designers',
    icon: Palette,
    tagline: 'Organize design systems, client feedback, and revision cycles.',
    description:
      'Keep client briefs and Figma links synchronized in the Document Center, track revision rounds, and showcase completed work in the Portfolio Vault.',
    keyFeatures: ['Document Knowledge Vault', 'Portfolio Work Showcase', 'Client Timeline CRM'],
    badge: 'Design & Review',
  },
  {
    role: 'Creators',
    icon: Lightbulb,
    tagline: 'Plan content calendars, sponsor deliverables, and brand assets.',
    description:
      'Coordinate sponsorship deliverables, draft pitch proposals with AI, monitor publishing deadlines, and organize brand kit assets under one roof.',
    keyFeatures: ['Unified Message Inbox', 'AI Pitch Generator', 'Deadline Alert Engine'],
    badge: 'Content & Brand',
  },
  {
    role: 'Small Businesses',
    icon: Store,
    tagline: 'Unify client accounts, cashflow, and day-to-day operations.',
    description:
      'Consolidate leads, track customer orders and invoices, analyze revenue yield per account, and eliminate messy spreadsheets across your team.',
    keyFeatures: ['Client CRM Directory', 'Cashflow Analytics', 'Global Search & Command'],
    badge: 'Business Operations',
  },
  {
    role: 'Service Businesses',
    icon: CheckCircle2,
    tagline: 'Deliver client services on time, on budget, with predictable margins.',
    description:
      'Standardize service packages, track labor costs against fixed fees, maintain audit records of client interactions, and streamline repeat bookings.',
    keyFeatures: ['Service Packages Catalog', 'Labor Cost Sync', 'Audit & Activity Log'],
    badge: 'Client Services',
  },
];

export const WORKFLOW_STAGES = [
  {
    step: '01',
    title: 'PLAN',
    subtitle: 'Organize your work',
    desc: 'Structure backlogs, scope projects, and set realistic labor hour budgets to protect margins.',
    icon: FolderKanban,
    color: 'text-blue-400 border-blue-500/30 bg-blue-950/20',
  },
  {
    step: '02',
    title: 'MANAGE',
    subtitle: 'Clients, projects & tasks',
    desc: 'Connect client CRM accounts, milestone pipelines, and deliverable dependencies in one hub.',
    icon: Briefcase,
    color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/20',
  },
  {
    step: '03',
    title: 'COMMUNICATE',
    subtitle: 'Stay connected with clients',
    desc: 'Consolidate client messages across channels, draft AI responses, and manage follow-ups.',
    icon: Inbox,
    color: 'text-purple-400 border-purple-500/30 bg-purple-950/20',
  },
  {
    step: '04',
    title: 'EXECUTE',
    subtitle: 'Focus on important work',
    desc: 'Tackle high-priority deliverables with stopwatch tracking, inline notes, and subtask checklists.',
    icon: CheckSquare,
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20',
  },
  {
    step: '05',
    title: 'ANALYZE',
    subtitle: 'Understand performance',
    desc: 'Review effective hourly yield, project margins, and automated deadline risk warnings.',
    icon: BarChart3,
    color: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
  },
  {
    step: '06',
    title: 'GROW',
    subtitle: 'Make better business decisions',
    desc: 'Leverage Business Brain recommendations to diversify revenue, scale rates, and grow profitably.',
    icon: Sparkles,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
  },
];

export const ONBOARDING_STEPS = [
  {
    step: 1,
    title: 'Create workspace',
    desc: 'Explore your daily KPI command center and configure your business profile.',
    tab: 'overview' as NavigationTab,
  },
  {
    step: 2,
    title: 'Add clients',
    desc: 'Record your active client accounts, default billing rates, and contact details.',
    tab: 'clients' as NavigationTab,
  },
  {
    step: 3,
    title: 'Create projects',
    desc: 'Define deliverable scopes, target deadlines, and labor budgets to safeguard margins.',
    tab: 'projects' as NavigationTab,
  },
  {
    step: 4,
    title: 'Add tasks',
    desc: 'Break project deliverables into actionable items with estimated hours.',
    tab: 'tasks' as NavigationTab,
  },
  {
    step: 5,
    title: 'Set priorities',
    desc: 'Use color-coded badges (● LOW, ● MEDIUM, ● HIGH, ● URGENT) to guide focus.',
    tab: 'tasks' as NavigationTab,
  },
  {
    step: 6,
    title: 'Talk to AURA',
    desc: 'Consult your AI copilot or Live Voice Companion for strategy and task creation.',
    tab: 'ask-aura' as NavigationTab,
  },
  {
    step: 7,
    title: 'Review analytics',
    desc: 'Inspect cashflow, effective hourly yield, and business insights to optimize growth.',
    tab: 'analytics' as NavigationTab,
  },
];

export const FAQ_ITEMS = [
  {
    question: 'How do I change a task priority quickly?',
    answer:
      'In the Tasks view, simply click the colored priority badge directly on any task card (e.g. ● LOW, ● MEDIUM, ● HIGH, or ● URGENT). A quick dropdown menu appears allowing you to switch priority in one click, automatically updating your database without opening a modal.',
  },
  {
    question: 'Can I edit task descriptions inline without opening full pages?',
    answer:
      'Yes! Every task card includes an inline description editor. Click the "Edit" button beside any description or click "Add task description", type your notes or criteria, and press ⌘+Enter to save immediately.',
  },
  {
    question: 'How does the Estimated vs Actual Hours tracker work?',
    answer:
      'When you create a task, assign an estimated completion time (e.g. 4 hours). As you work, start the live stopwatch or use the +15m / +30m / +1h quick-log buttons. The visual progress bar tracks your time: cyan when on track, and amber with an overage indicator if you exceed your estimate.',
  },
  {
    question: 'How do projects, tasks, and clients connect together?',
    answer:
      'Clients are the parent accounts. Projects belong to clients and have budgets and deadlines. Tasks belong to projects and represent actionable deliverables. When you log hours or complete tasks, project progress and labor costs automatically recalculate.',
  },
  {
    question: 'Can I print or export invoices to PDF?',
    answer:
      'Yes. In the Invoices view, click the "Quick Preview" button on any invoice to open the print-ready preview modal. You can print directly or use your browser\'s Print to PDF option with optimized clean styles.',
  },
  {
    question: 'How does the AI Approval Center protect my operations?',
    answer:
      'AURA strictly enforces a "Human-in-the-Loop" architecture. Whenever an automated workflow triggers a client-facing email, invoice dispatch, or schedule change, it is placed in the Approval Center for your explicit review and sign-off.',
  },
  {
    question: 'Is my data preserved if I refresh or switch devices?',
    answer:
      'Yes. AURA AI uses persistent cloud data synchronization (Firestore and browser storage), ensuring your tasks, clients, projects, and invoices remain intact across sessions.',
  },
  {
    question: 'How do I access global search and quick actions?',
    answer:
      'Press Cmd/Ctrl + K from anywhere in the app to open the Global Search modal. You can search tasks, clients, projects, documents, and jump directly to any view.',
  },
];
