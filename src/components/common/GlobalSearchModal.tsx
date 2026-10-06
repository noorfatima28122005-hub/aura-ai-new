import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  CheckSquare,
  Briefcase,
  Users,
  Award,
  FolderKanban,
  Sparkles,
  ArrowRight,
  Clock,
  Flame,
  FileText,
  CornerDownLeft,
} from 'lucide-react';
import { WorkspaceData, NavigationTab } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WorkspaceData;
  onNavigate: (tab: NavigationTab) => void;
}

type SearchCategory = 'All' | 'Tasks' | 'Projects' | 'Clients' | 'Work' | 'Documents' | 'Features';

interface SearchResultItem {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  targetTab: NavigationTab;
  badge?: string;
  badgeColor?: string;
}

const FEATURE_SEARCH_ITEMS: { title: string; subtitle: string; tab: NavigationTab }[] = [
  { title: 'Interactive Feature Center & Guide', subtitle: 'Explore all AURA features, workflows, and use cases', tab: 'features' },
  { title: 'Task Matrix & Sprint Board', subtitle: 'Manage tasks with priority dropdowns, progress, and inline notes', tab: 'tasks' },
  { title: 'Client Relationships & CRM', subtitle: 'Client pipeline, billing totals, and communication timeline', tab: 'clients' },
  { title: 'Project Pipelines & Milestones', subtitle: 'Track active project stages, budgets, and milestones', tab: 'projects' },
  { title: 'Ask AURA AI Intelligence', subtitle: 'Conversational assistant with grounding, research, and planning', tab: 'ask-aura' },
  { title: 'Finance & Cashflow Dashboard', subtitle: 'Revenue, burn rate, profit margins, and financial tracking', tab: 'finance' },
  { title: 'Invoices & Billing Ledger', subtitle: 'Create, send, and preview print-ready PDF invoices', tab: 'invoices' },
  { title: 'Leads & Business Acquisition', subtitle: 'Manage incoming prospects, estimates, and conversion rate', tab: 'leads' },
  { title: 'AURA Work Vault & Portfolio', subtitle: 'Store completed work, case studies, and generate client showcases', tab: 'portfolio' },
  { title: 'Knowledge Vault & Files', subtitle: 'Store client briefs, requirements, contracts, and proposals', tab: 'documents' },
  { title: 'Executive AI Insights', subtitle: 'Strategic business intelligence and profitability analysis', tab: 'ai-insights' },
  { title: 'Calendar & Timelines', subtitle: 'Visualize deliverable deadlines and client milestones', tab: 'calendar' },
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  data,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const results: SearchResultItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: SearchResultItem[] = [];

    // 1. Tasks
    (data.tasks || []).forEach((t) => {
      if (
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.priority && t.priority.toLowerCase().includes(q)) ||
        (t.projectName && t.projectName.toLowerCase().includes(q))
      ) {
        items.push({
          id: `task_${t.id}`,
          category: 'Tasks',
          title: t.title,
          subtitle: `${t.projectName || 'Unassigned'} • Due ${t.deadline || 'No date'} • ${t.status}`,
          targetTab: 'tasks',
          badge: t.priority,
          badgeColor:
            t.priority === 'High' || t.priority === 'Urgent'
              ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
              : t.priority === 'Medium'
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
        });
      }
    });

    // 2. Projects
    (data.projects || []).forEach((p) => {
      const projName = p.name || '';
      const clientName = p.clientName || '';
      if (
        !q ||
        projName.toLowerCase().includes(q) ||
        clientName.toLowerCase().includes(q) ||
        (p.status && p.status.toLowerCase().includes(q))
      ) {
        items.push({
          id: `project_${p.id}`,
          category: 'Projects',
          title: projName,
          subtitle: `Client: ${clientName} • Budget: $${(p.budget || 0).toLocaleString()} • ${p.status}`,
          targetTab: 'projects',
          badge: p.status,
          badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
        });
      }
    });

    // 3. Clients
    (data.clients || []).forEach((c) => {
      if (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      ) {
        items.push({
          id: `client_${c.id}`,
          category: 'Clients',
          title: c.name,
          subtitle: `${c.company} • ${c.email} • $${(c.totalBilled || 0).toLocaleString()} billed`,
          targetTab: 'clients',
          badge: c.status,
          badgeColor:
            c.status === 'Active'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
              : 'bg-blue-950/80 text-blue-300 border-blue-500/40',
        });
      }
    });

    // 4. Work Vault / Portfolio
    (data.portfolio || []).forEach((port) => {
      if (
        !q ||
        port.title.toLowerCase().includes(q) ||
        port.category.toLowerCase().includes(q) ||
        (port.skills && port.skills.some((s) => s.toLowerCase().includes(q)))
      ) {
        items.push({
          id: `work_${port.id}`,
          category: 'Work',
          title: port.title,
          subtitle: `${port.category} • Client: ${port.clientName || 'Showcase'}`,
          targetTab: 'portfolio',
          badge: 'Work Vault',
          badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
        });
      }
    });

    // 5. Documents / Knowledge
    (data.documents || []).forEach((doc) => {
      const docTitle = doc.title || doc.fileName || 'Document';
      if (
        !q ||
        docTitle.toLowerCase().includes(q) ||
        (doc.category && doc.category.toLowerCase().includes(q))
      ) {
        items.push({
          id: `doc_${doc.id}`,
          category: 'Documents',
          title: docTitle,
          subtitle: `${doc.category} • ${doc.fileSize || 'PDF/Doc'}`,
          targetTab: 'documents',
          badge: 'Knowledge',
          badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
        });
      }
    });

    // 6. Features
    FEATURE_SEARCH_ITEMS.forEach((f, idx) => {
      if (!q || f.title.toLowerCase().includes(q) || f.subtitle.toLowerCase().includes(q)) {
        items.push({
          id: `feature_${idx}`,
          category: 'Features',
          title: f.title,
          subtitle: f.subtitle,
          targetTab: f.tab,
          badge: 'AURA OS',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        });
      }
    });

    // Filter by selected category tab
    if (selectedCategory === 'All') {
      return items.slice(0, 30);
    }
    return items.filter((item) => item.category === selectedCategory).slice(0, 30);
  }, [query, selectedCategory, data]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          onNavigate(results[selectedIndex].targetTab);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onNavigate, onClose]);

  if (!isOpen) return null;

  const categories: SearchCategory[] = ['All', 'Tasks', 'Projects', 'Clients', 'Work', 'Documents', 'Features'];

  const getCategoryIcon = (cat: SearchCategory) => {
    switch (cat) {
      case 'Tasks':
        return <CheckSquare className="w-4 h-4 text-cyan-400" />;
      case 'Projects':
        return <Briefcase className="w-4 h-4 text-indigo-400" />;
      case 'Clients':
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'Work':
        return <Award className="w-4 h-4 text-purple-400" />;
      case 'Documents':
        return <FolderKanban className="w-4 h-4 text-amber-400" />;
      case 'Features':
      default:
        return <Sparkles className="w-4 h-4 text-cyan-300" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#080B14] border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/10 flex items-center space-x-3 bg-[#0A0E1A]">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tasks, projects, clients, work vault, documents, features... (Ctrl+K)"
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold text-gray-400 bg-white/5 border border-white/10 rounded">
            ESC
          </kbd>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 px-4 py-2.5 border-b border-white/5 overflow-x-auto bg-[#060810] text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm space-y-2">
              <Search className="w-8 h-8 text-gray-600 mx-auto" />
              <p>No matches found for &quot;{query}&quot;</p>
              <p className="text-xs text-gray-600">Try searching for deliverables, client names, or AURA features.</p>
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.targetTab);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-950/40 border border-cyan-500/40 text-white'
                      : 'hover:bg-white/5 text-gray-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-white/5 shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm font-semibold text-white truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                              item.badgeColor || 'bg-white/10 text-gray-300 border-white/20'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-3 shrink-0">
                    <span className="text-[10px] text-gray-500 hidden sm:inline uppercase tracking-wider font-semibold">
                      {item.targetTab}
                    </span>
                    <ArrowRight className="w-4 h-4 text-cyan-400 opacity-70" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-3 border-t border-white/10 bg-[#060810] flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 font-mono">↑↓</kbd>{' '}
              to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 font-mono">↵</kbd>{' '}
              to select
            </span>
          </div>
          <span className="text-cyan-400/80 font-medium">AURA Intelligent Workspace Search</span>
        </div>
      </div>
    </div>
  );
};
