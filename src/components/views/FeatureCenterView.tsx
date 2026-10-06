import React, { useState, useMemo } from 'react';
import { NavigationTab } from '../../types';
import {
  ALL_FEATURES,
  USE_CASES,
  WORKFLOW_STAGES,
  ONBOARDING_STEPS,
  FAQ_ITEMS,
  FeatureCategory,
  FeatureItem,
} from '../../data/featureCenterData';
import {
  Sparkles,
  ArrowRight,
  Search,
  CheckSquare,
  Briefcase,
  Users,
  Bot,
  DollarSign,
  BarChart3,
  Clock,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  Edit3,
  Play,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Eye,
  FileText,
  TrendingUp,
  FolderKanban,
  Zap,
  Mic,
  ShieldCheck,
  RotateCcw,
  Compass,
  MessageSquare,
  CheckCircle2,
  Bookmark,
  Layers,
  Inbox,
} from 'lucide-react';

export interface FeatureCenterViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenProductTour?: () => void;
  onOpenVoiceModal?: () => void;
}

export const FeatureCenterView: React.FC<FeatureCenterViewProps> = ({
  onNavigate,
  onOpenProductTour,
  onOpenVoiceModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory>('All Features');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalFeature, setActiveModalFeature] = useState<FeatureItem | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Interactive Demo Sandbox State
  const [demoPriority, setDemoPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('High');
  const [isDemoPriorityOpen, setIsDemoPriorityOpen] = useState(false);
  const [demoDescription, setDemoDescription] = useState(
    'Finalize high-fidelity design system tokens and deliver exportable Figma components to client engineering team.'
  );
  const [isEditingDemoDesc, setIsEditingDemoDesc] = useState(false);
  const [draftDemoDesc, setDraftDemoDesc] = useState(demoDescription);
  const [demoStatus, setDemoStatus] = useState<'To Do' | 'In Progress' | 'Completed'>('In Progress');
  const [demoLoggedHours, setDemoLoggedHours] = useState(4.5);
  const demoEstimatedHours = 6;
  const [demoSaveNotice, setDemoSaveNotice] = useState<string | null>(null);

  const showDemoNotice = (msg: string) => {
    setDemoSaveNotice(msg);
    setTimeout(() => setDemoSaveNotice(null), 3000);
  };

  const categories: FeatureCategory[] = [
    'All Features',
    'Productivity',
    'Tasks',
    'Projects',
    'Clients',
    'AI',
    'Business',
    'Communication',
    'Content',
    'Analytics',
    'Finance',
    'Automation',
    'Knowledge',
  ];

  const filteredFeatures = useMemo(() => {
    return ALL_FEATURES.filter((feat) => {
      const matchesCat = selectedCategory === 'All Features' || feat.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCat;
      const matchesSearch =
        feat.name.toLowerCase().includes(query) ||
        feat.whatItDoes.toLowerCase().includes(query) ||
        feat.whyItMatters.toLowerCase().includes(query) ||
        feat.categoryLabel.toLowerCase().includes(query) ||
        feat.benefit.toLowerCase().includes(query);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const scrollToCatalog = () => {
    const el = document.getElementById('section-feature-catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-300">
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0B0F19] via-[#080B14] to-[#05070D] border border-cyan-500/20 p-6 sm:p-10 lg:p-12 shadow-2xl">
        {/* Glow ambient decoration */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-wider uppercase font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>✦ INTERACTIVE PRODUCT GUIDE & FEATURE CENTER</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                AURA AI — Your Intelligent{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                  Freelance & Business
                </span>{' '}
                Workspace
              </h1>
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl">
                Manage your clients, projects, tasks, business activity, communication, and decisions
                from one intelligent workspace. Built with a strict{' '}
                <span className="text-white font-semibold">"AI assists, human decides"</span> architecture
                to give freelancers, consultants, and boutique agencies total clarity and control.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="btn-hero-explore-features"
                onClick={scrollToCatalog}
                className="aura-gradient-btn px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center space-x-2 shadow-lg shadow-cyan-950/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span>Explore Features</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="btn-hero-get-started"
                onClick={() => onNavigate('overview')}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center space-x-2"
              >
                <span>Get Started →</span>
              </button>

              <button
                id="btn-hero-talk-to-aura"
                onClick={() => {
                  if (onOpenVoiceModal) {
                    onOpenVoiceModal();
                  } else {
                    onNavigate('ask-aura');
                  }
                }}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 transition-all cursor-pointer flex items-center space-x-2 shadow-sm"
              >
                <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Talk to AURA (Voice + Chat)</span>
              </button>

              {onOpenProductTour && (
                <button
                  onClick={onOpenProductTour}
                  className="px-4 py-3 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Interactive Walkthrough</span>
                </button>
              )}
            </div>

            {/* Key Value Metric Pills */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-3">
              <div>
                <span className="text-xl sm:text-2xl font-black font-mono text-cyan-400">100%</span>
                <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider">Human Control</p>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black font-mono text-indigo-400">26+</span>
                <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider">Integrated Views</p>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">Real-Time</span>
                <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider">Cloud Synchronized</p>
              </div>
            </div>
          </div>

          {/* Hero Right AI Visual (Orb & Orbital Icons) */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
              {/* Outer pulsing orbit ring */}
              <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-spin duration-[40000ms]" />
              <div className="absolute inset-4 rounded-full border border-dashed border-indigo-500/25" />
              <div className="absolute inset-10 rounded-full bg-gradient-to-tr from-cyan-900/20 via-indigo-900/30 to-purple-900/20 blur-xl animate-pulse" />

              {/* Central Glowing AI Core */}
              <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 p-[2px] shadow-2xl shadow-cyan-500/40">
                <div className="w-full h-full rounded-full bg-[#080B14] flex flex-col items-center justify-center p-3 text-center">
                  <Bot className="w-7 h-7 text-cyan-300 animate-bounce" />
                  <span className="text-xs font-black text-white mt-1">AURA AI</span>
                  <span className="text-[9px] font-mono font-bold text-cyan-400">ONLINE</span>
                </div>
              </div>

              {/* Floating Orbital Feature Nodes */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 p-2.5 rounded-2xl bg-[#0B0F19] border border-cyan-500/40 shadow-lg text-cyan-300 hover:scale-110 transition-transform">
                <Mic className="w-4 h-4" />
              </div>
              <div className="absolute top-1/4 -right-2 p-2.5 rounded-2xl bg-[#0B0F19] border border-indigo-500/40 shadow-lg text-indigo-300 hover:scale-110 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="absolute bottom-6 -right-1 p-2.5 rounded-2xl bg-[#0B0F19] border border-purple-500/40 shadow-lg text-purple-300 hover:scale-110 transition-transform">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 p-2.5 rounded-2xl bg-[#0B0F19] border border-emerald-500/40 shadow-lg text-emerald-300 hover:scale-110 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="absolute bottom-6 -left-1 p-2.5 rounded-2xl bg-[#0B0F19] border border-amber-500/40 shadow-lg text-amber-300 hover:scale-110 transition-transform">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="absolute top-1/4 -left-2 p-2.5 rounded-2xl bg-[#0B0F19] border border-teal-500/40 shadow-lg text-teal-300 hover:scale-110 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE DEMO SANDBOX */}
      <div className="aura-card p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Interactive Practice Sandbox
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
                Safe Mode — No Real Data Affected
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Try Out Core Workflows Live
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Experiment with inline priority changes, description notes editing, and hours logging.
            </p>
          </div>

          <button
            onClick={() => onNavigate('tasks')}
            className="aura-gradient-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center space-x-2 shadow-md cursor-pointer shrink-0 self-start sm:self-center"
          >
            <span>Open Real Tasks Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {demoSaveNotice && (
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-cyan-400" />
            <span>{demoSaveNotice}</span>
          </div>
        )}

        {/* Mock Task Card with Live Controls */}
        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 hover:border-cyan-500/40 transition-all space-y-4">
          {/* Top row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setDemoStatus(demoStatus === 'Completed' ? 'In Progress' : 'Completed');
                  showDemoNotice(
                    demoStatus === 'Completed' ? 'Task marked in progress' : 'Task marked completed!'
                  );
                }}
                className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                  demoStatus === 'Completed'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'border-white/20 text-gray-400 hover:text-white'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>
              <div>
                <h3
                  className={`text-sm sm:text-base font-bold transition-all ${
                    demoStatus === 'Completed' ? 'text-gray-400 line-through' : 'text-white'
                  }`}
                >
                  Acme Design System — Final Component Delivery
                </h3>
                <span className="text-[11px] text-cyan-400/80 font-mono">Client: Acme Corp • Due in 2 days</span>
              </div>
            </div>

            {/* Interactive Priority Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDemoPriorityOpen(!isDemoPriorityOpen)}
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 cursor-pointer shadow-sm transition-all ${
                  demoPriority === 'Urgent'
                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : demoPriority === 'High'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : demoPriority === 'Medium'
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-gray-500/20 border-gray-500/40 text-gray-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>● {demoPriority.toUpperCase()}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {isDemoPriorityOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl bg-[#0E1322] border border-white/10 shadow-xl z-20 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  {(['Low', 'Medium', 'High', 'Urgent'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setDemoPriority(p);
                        setIsDemoPriorityOpen(false);
                        showDemoNotice(`Priority updated to ${p}!`);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer flex items-center justify-between"
                    >
                      <span>{p}</span>
                      {demoPriority === p && <Check className="w-3 h-3 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Description Box */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Deliverable Brief & Criteria
              </span>
              {!isEditingDemoDesc ? (
                <button
                  onClick={() => setIsEditingDemoDesc(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Inline</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setDraftDemoDesc(demoDescription);
                      setIsEditingDemoDesc(false);
                    }}
                    className="text-xs text-gray-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setDemoDescription(draftDemoDesc);
                      setIsEditingDemoDesc(false);
                      showDemoNotice('Task description saved!');
                    }}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    Save (⌘+Enter)
                  </button>
                </div>
              )}
            </div>

            {!isEditingDemoDesc ? (
              <p className="text-xs text-gray-300 leading-relaxed">{demoDescription}</p>
            ) : (
              <textarea
                value={draftDemoDesc}
                onChange={(e) => setDraftDemoDesc(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    setDemoDescription(draftDemoDesc);
                    setIsEditingDemoDesc(false);
                    showDemoNotice('Task description saved!');
                  }
                }}
                rows={2}
                className="w-full bg-[#080B14] border border-cyan-500/40 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            )}
          </div>

          {/* Interactive Hours Progress Bar */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold text-gray-300">
                  Labor: {demoLoggedHours}h / {demoEstimatedHours}h estimated
                </span>
                {demoLoggedHours > demoEstimatedHours && (
                  <span className="text-[10px] font-bold text-amber-400 font-mono">
                    (+{(demoLoggedHours - demoEstimatedHours).toFixed(1)}h over budget)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] text-gray-400">Quick Log:</span>
                <button
                  onClick={() => {
                    setDemoLoggedHours((prev) => Math.round((prev + 0.25) * 100) / 100);
                    showDemoNotice('+15 minutes logged');
                  }}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[11px] text-cyan-300 font-mono cursor-pointer"
                >
                  +15m
                </button>
                <button
                  onClick={() => {
                    setDemoLoggedHours((prev) => Math.round((prev + 0.5) * 100) / 100);
                    showDemoNotice('+30 minutes logged');
                  }}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[11px] text-cyan-300 font-mono cursor-pointer"
                >
                  +30m
                </button>
                <button
                  onClick={() => {
                    setDemoLoggedHours((prev) => Math.round((prev + 1.0) * 100) / 100);
                    showDemoNotice('+1 hour logged');
                  }}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[11px] text-cyan-300 font-mono cursor-pointer"
                >
                  +1h
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  demoLoggedHours > demoEstimatedHours
                    ? 'bg-gradient-to-r from-amber-500 to-red-500'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                }`}
                style={{
                  width: `${Math.min(100, (demoLoggedHours / demoEstimatedHours) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. HOW AURA WORKS — HORIZONTAL 6-STAGE WORKFLOW */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            End-to-End Operational Lifecycle
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How AURA Works</h2>
          <p className="text-xs sm:text-sm text-gray-400">
            A cohesive 6-stage operational cycle that keeps freelancers and growing businesses organized,
            profitable, and stress-free.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {WORKFLOW_STAGES.map((s, idx) => (
            <div
              key={s.step}
              className="aura-card p-4 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-3 relative group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-cyan-400/80">{s.step}</span>
                  <div className={`p-2 rounded-xl border ${s.color}`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {s.title}
                </h3>
                <p className="text-[11px] font-semibold text-gray-300">{s.subtitle}</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">{s.desc}</p>
              </div>

              {idx < WORKFLOW_STAGES.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-cyan-500/40 pointer-events-none">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. FREELANCE + BUSINESS USE CASES (8 Cards) */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            Tailored Workflows
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Built for Freelancers & Businesses
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Whether you operate as an independent specialist, boutique studio, or service business,
            AURA adapts to your business model.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {USE_CASES.map((uc) => (
            <div
              key={uc.role}
              className="aura-card p-5 rounded-2xl border border-white/5 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-300">
                    <uc.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                    {uc.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {uc.role}
                </h3>
                <p className="text-xs font-semibold text-cyan-400/90">{uc.tagline}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{uc.description}</p>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Top Workflows:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {uc.keyFeatures.map((f, fIdx) => (
                    <span
                      key={fIdx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-gray-300 border border-white/5"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. MAIN FEATURE CATALOG & RIGHT-SIDE PANELS */}
      <div id="section-feature-catalog" className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Interactive Feature Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Explore All Workspace Capabilities
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Select a category to view specific workflows, key benefits, and step-by-step guidance.
            </p>
          </div>

          <div className="text-xs text-gray-400">
            Showing <span className="text-white font-bold">{filteredFeatures.length}</span> of{' '}
            {ALL_FEATURES.length} features
          </div>
        </div>

        {/* 13 Category Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-950/40'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Layout: Left Feature Cards Grid + Right Side Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Feature Cards Grid (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {filteredFeatures.length === 0 ? (
              <div className="aura-card p-12 text-center rounded-2xl border border-dashed border-white/10 space-y-3">
                <Search className="w-8 h-8 text-gray-400 mx-auto" />
                <h3 className="text-base font-bold text-white">No features match your query</h3>
                <p className="text-xs text-gray-400">
                  Try adjusting your search keywords or switch to the "All Features" category.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Features');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-cyan-300 border border-white/10 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFeatures.map((feat) => (
                  <div
                    key={feat.id}
                    className="aura-card p-5 rounded-2xl border border-white/5 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 group-hover:scale-105 transition-transform">
                          <feat.icon className="w-5 h-5" />
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {feat.categoryLabel}
                          </span>
                          {feat.badge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                              {feat.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {feat.name}
                      </h3>
                      <p className="text-xs text-gray-300 leading-relaxed">{feat.whatItDoes}</p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-white/5">
                      <div className="text-[11px] text-gray-400">
                        <span className="text-cyan-400 font-semibold">Key Benefit:</span> {feat.benefit}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => setActiveModalFeature(feat)}
                          className="text-xs font-semibold text-gray-300 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Learn More</span>
                        </button>

                        <button
                          onClick={() => onNavigate(feat.targetTab)}
                          className="aura-gradient-btn px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center space-x-1.5 shadow-sm cursor-pointer"
                        >
                          <span>Open View</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Auxiliary Guide Panels (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Panel 1: Search AURA Features */}
            <div className="aura-card p-5 rounded-2xl border border-white/10 space-y-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 block">
                Search AURA Features
              </span>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. invoice, priority, voice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#080B14] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                Filter instantly across {ALL_FEATURES.length} features, workflows, and benefits.
              </p>
            </div>

            {/* Panel 2: Start with AURA (7 Steps) */}
            <div className="aura-card p-5 rounded-2xl border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Start with AURA
                </span>
                <span className="text-[10px] font-mono text-gray-400">7-Step Fast Track</span>
              </div>

              <div className="space-y-2.5">
                {ONBOARDING_STEPS.map((step) => (
                  <div
                    key={step.step}
                    onClick={() => onNavigate(step.tab)}
                    className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-cyan-500/30 transition-all flex items-start space-x-3 cursor-pointer group"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                      {step.step}
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {step.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 leading-tight">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate('overview')}
                className="w-full aura-gradient-btn py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center space-x-2 shadow-md cursor-pointer"
              >
                <span>Get Started →</span>
              </button>
            </div>

            {/* Panel 3: AI Quick Actions */}
            <div className="aura-card p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  AI Quick Actions
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Click any prompt chip to launch direct assistant interactions:
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => onNavigate('ask-aura')}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-cyan-500/30 text-xs text-gray-300 hover:text-white transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>"Ask AURA for today's priority plan"</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                </button>
                <button
                  onClick={() => onNavigate('proposals')}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-cyan-500/30 text-xs text-gray-300 hover:text-white transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>"Generate client proposal draft"</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                </button>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-cyan-500/30 text-xs text-gray-300 hover:text-white transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>"Check overdue deliverables"</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                </button>
                <button
                  onClick={() => {
                    if (onOpenVoiceModal) {
                      onOpenVoiceModal();
                    } else {
                      onNavigate('ask-aura');
                    }
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-500/30 text-xs text-cyan-300 hover:text-cyan-200 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span className="flex items-center space-x-2">
                    <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>Launch hands-free voice companion</span>
                  </span>
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. WHY AURA AI? VALUE PROPOSITIONS */}
      <div className="aura-card p-6 sm:p-10 rounded-3xl border border-white/10 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            Guiding Philosophy
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Why AURA AI?</h2>
          <p className="text-xs sm:text-sm text-gray-400">
            A software system designed specifically around the realities of freelance profitability and
            business execution.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-base font-bold text-white">AI Assists. Human Decides.</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              No black boxes or accidental auto-dispatches. AURA suggests priorities and drafts messages,
              but you remain the sole authoritative decision-maker.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-base font-bold text-white">Zero Context Switching</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Stop juggling 5 disconnected tools. Tasks, client CRM, invoices, documents, messaging, and
              proposals live in one interconnected hub.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="text-base font-bold text-white">Built for Profitability</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Visual hours tracking and labor burn rates alert you before scope creep erodes your hourly
              earnings. Every minute is accounted for.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="text-base font-bold text-white">Cloud Synchronized</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Durable cloud persistence ensures your records, estimates, and tasks remain accessible across
              devices, browser tabs, and work sessions.
            </p>
          </div>
        </div>
      </div>

      {/* 7. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Answers to common questions about workflows, data preservation, and AI operations.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="aura-card rounded-2xl border border-white/5 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between space-x-4 cursor-pointer hover:bg-white/[0.02]"
                >
                  <span className="text-sm font-bold text-white">{item.question}</span>
                  <div className="text-gray-400 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs text-gray-300 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in duration-150">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. FEATURE DETAIL MODAL */}
      {activeModalFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="aura-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-cyan-500/40 bg-[#0A0E1A] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
                  <activeModalFeature.icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                    {activeModalFeature.categoryLabel}
                  </span>
                  <h3 className="text-lg font-bold text-white">{activeModalFeature.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setActiveModalFeature(null)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-cyan-300 uppercase tracking-wider text-[10px]">
                  What It Does
                </span>
                <p className="text-gray-300 leading-relaxed">{activeModalFeature.whatItDoes}</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-cyan-300 uppercase tracking-wider text-[10px]">
                  Why It Matters
                </span>
                <p className="text-gray-400 leading-relaxed">{activeModalFeature.whyItMatters}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="font-bold text-white uppercase tracking-wider text-[10px]">
                  Step-by-Step Workflow
                </span>
                <ol className="space-y-1.5 list-decimal list-inside text-gray-300">
                  {activeModalFeature.detailedSteps.map((step, sIdx) => (
                    <li key={sIdx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200">
                <span className="font-bold block text-[11px]">💡 Pro Tip:</span>
                <p className="text-[11px] mt-0.5 opacity-90">{activeModalFeature.proTip}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-end space-x-3">
              <button
                onClick={() => setActiveModalFeature(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const target = activeModalFeature.targetTab;
                  setActiveModalFeature(null);
                  onNavigate(target);
                }}
                className="aura-gradient-btn px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center space-x-2 shadow-lg cursor-pointer"
              >
                <span>Try {activeModalFeature.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
