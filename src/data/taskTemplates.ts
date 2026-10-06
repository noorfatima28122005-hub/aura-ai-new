import { TaskTemplate } from '../types';

export const DEFAULT_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'tmpl_web_dev_setup',
    name: 'Web Development Setup',
    description: 'Standard technical initialization and environment architecture with 5 pre-configured subtasks.',
    defaultTitle: 'Web Development Environment & Architecture Setup',
    defaultCategory: 'Operations',
    defaultPriority: 'High',
    estimatedHours: 6,
    subtasks: [
      { id: 'st_wd_1', title: 'Initialize Git repository, define branch protections & .gitignore', completed: false },
      { id: 'st_wd_2', title: 'Configure TypeScript, Vite, Tailwind CSS & styling design tokens', completed: false },
      { id: 'st_wd_3', title: 'Set up automated test suite, linting & CI/CD deployment pipeline', completed: false },
      { id: 'st_wd_4', title: 'Configure environment variables, API secrets & secure proxy routing', completed: false },
      { id: 'st_wd_5', title: 'Deploy initial production staging build & verify health endpoints', completed: false },
    ],
    isCustom: false,
    createdAt: '2026-09-01',
  },
  {
    id: 'tmpl_client_onboarding',
    name: 'Client Project Onboarding',
    description: 'Comprehensive milestone setup, stakeholder alignment, and contract execution.',
    defaultTitle: 'Client Onboarding & Project Discovery Kickoff',
    defaultCategory: 'Client Deliverable',
    defaultPriority: 'Urgent',
    estimatedHours: 4,
    subtasks: [
      { id: 'st_co_1', title: 'Distribute comprehensive client intake brief & design questionnaire', completed: false },
      { id: 'st_co_2', title: 'Host 45-minute discovery alignment meeting & record transcript', completed: false },
      { id: 'st_co_3', title: 'Set up shared asset folder, client dashboard & communication channels', completed: false },
      { id: 'st_co_4', title: 'Draft project roadmap, sprint deliverables & target acceptance criteria', completed: false },
      { id: 'st_co_5', title: 'Execute Master Services Agreement & verify initial retainer deposit', completed: false },
    ],
    isCustom: false,
    createdAt: '2026-09-02',
  },
  {
    id: 'tmpl_uiux_design_sprint',
    name: 'UI/UX Design Sprint',
    description: 'Complete user flow exploration, design token specification, and high-fidelity prototype.',
    defaultTitle: 'UI/UX Interactive Prototyping & Design System Sprint',
    defaultCategory: 'Strategic',
    defaultPriority: 'High',
    estimatedHours: 8,
    subtasks: [
      { id: 'st_ui_1', title: 'Synthesize core user personas, key decision journeys & edge cases', completed: false },
      { id: 'st_ui_2', title: 'Generate responsive wireframes for primary and secondary screen flows', completed: false },
      { id: 'st_ui_3', title: 'Refine design token scale (typography, dark-mode neutrals, accent hues)', completed: false },
      { id: 'st_ui_4', title: 'Build interactive click-through prototype in Figma with micro-animations', completed: false },
      { id: 'st_ui_5', title: 'Conduct design review walkthrough & collect client milestone sign-off', completed: false },
    ],
    isCustom: false,
    createdAt: '2026-09-03',
  },
  {
    id: 'tmpl_security_audit',
    name: 'Security & Compliance Audit',
    description: 'Rigorous zero-trust access control, API secret isolation, and compliance report.',
    defaultTitle: 'Security, Access Control & API Compliance Audit',
    defaultCategory: 'Urgent',
    defaultPriority: 'Urgent',
    estimatedHours: 5,
    subtasks: [
      { id: 'st_sec_1', title: 'Audit database security rules, RBAC roles & access tokens', completed: false },
      { id: 'st_sec_2', title: 'Perform automated dependency vulnerability scan & patch critical CVEs', completed: false },
      { id: 'st_sec_3', title: 'Validate server-side proxy isolation to prevent client secret leakage', completed: false },
      { id: 'st_sec_4', title: 'Review audit log tamper-resistance & operational logging pipeline', completed: false },
      { id: 'st_sec_5', title: 'Compile executive vulnerability assessment report & action items', completed: false },
    ],
    isCustom: false,
    createdAt: '2026-09-04',
  },
];

const LOCAL_STORAGE_KEY = 'aura_task_templates_v1';

export function getSavedTaskTemplates(): TaskTemplate[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_TASK_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_TASK_TEMPLATES;
    }
    // Merge any custom templates with default templates if not present
    const defaultIds = new Set(DEFAULT_TASK_TEMPLATES.map((t) => t.id));
    const customOnes = parsed.filter((p) => !defaultIds.has(p.id));
    return [...DEFAULT_TASK_TEMPLATES, ...customOnes];
  } catch (e) {
    console.error('Failed to parse saved task templates:', e);
    return DEFAULT_TASK_TEMPLATES;
  }
}

export function saveTaskTemplate(template: Omit<TaskTemplate, 'id' | 'createdAt'>): TaskTemplate {
  const current = getSavedTaskTemplates();
  const newTemplate: TaskTemplate = {
    ...template,
    id: `tmpl_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    isCustom: true,
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updated = [...current, newTemplate];
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save task template to localStorage:', e);
  }
  return newTemplate;
}

export function deleteTaskTemplate(templateId: string): TaskTemplate[] {
  const current = getSavedTaskTemplates();
  const updated = current.filter((t) => t.id !== templateId || !t.isCustom);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete task template from localStorage:', e);
  }
  return updated;
}
