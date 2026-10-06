import React, { useState } from 'react';
import { NavigationTab } from '../../types';
import {
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  LayoutDashboard,
  CheckSquare,
  Briefcase,
  Users,
  DollarSign,
  Bot,
  Mic,
  Compass,
} from 'lucide-react';

export interface ProductTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

interface TourStep {
  title: string;
  subtitle: string;
  tag: string;
  icon: any;
  targetTab: NavigationTab;
  highlightPoints: string[];
  imageCaption: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Command Center & Overview',
    subtitle: 'Your daily operational cockpit at a glance',
    tag: 'Step 1 of 8',
    icon: LayoutDashboard,
    targetTab: 'overview',
    highlightPoints: [
      'Real-time KPI metrics: Monthly Run-Rate, Active Clients, and Task Completion Velocity.',
      'Urgent 24h deadline alert engine surfaces approaching deliverables immediately.',
      'Quick action shortcuts (⌘⇧A for Quick Add, ⌘⇧K for Voice Companion).',
    ],
    imageCaption: 'The central nerve center coordinating your freelance workflow daily.',
  },
  {
    title: 'Task Matrix & Inline Controls',
    subtitle: 'Rapid deliverable execution with zero friction',
    tag: 'Step 2 of 8',
    icon: CheckSquare,
    targetTab: 'tasks',
    highlightPoints: [
      'Interactive Priority Badges: Click ● LOW, ● MEDIUM, or ● HIGH directly on the card.',
      'Inline Task Descriptions: Edit acceptance criteria and notes in seconds without page reloads.',
      'Estimated vs Actual Hours: Visual gradient progress bar guards your billable profit margins.',
      'Built-in stopwatch timer and quick-log buttons (+15m, +30m, +1h).',
    ],
    imageCaption: 'Execute deliverables with crystal-clear priorities and accurate time tracking.',
  },
  {
    title: 'Project Pipelines & Margin Health',
    subtitle: 'Protect profit margins across all client engagements',
    tag: 'Step 3 of 8',
    icon: Briefcase,
    targetTab: 'projects',
    highlightPoints: [
      'Labor cost vs fixed budget tracking warns you when expenses exceed 90%.',
      'Automated AI Risk Assessment flags bottlenecks before clients become unhappy.',
      'Milestone checklists ensure multi-phase contracts stay on schedule.',
    ],
    imageCaption: 'Never let scope creep destroy your hard-earned project profits.',
  },
  {
    title: 'Client Relationships & CRM',
    subtitle: 'Cultivate profitable, long-term freelance accounts',
    tag: 'Step 4 of 8',
    icon: Users,
    targetTab: 'clients',
    highlightPoints: [
      'Complete contact directory with hourly billing rates and retainers.',
      '6-Month Interactive Activity Charts visualize deliverable volume over time.',
      'Quick-filter active relationships, prospective leads, and past clients.',
    ],
    imageCaption: 'All client communications and financial history centralized in one place.',
  },
  {
    title: 'Invoices & Billing Ledger',
    subtitle: 'Professional itemized invoices with quick print preview',
    tag: 'Step 5 of 8',
    icon: DollarSign,
    targetTab: 'invoices',
    highlightPoints: [
      'Generate professional branded invoices with tax calculation and itemized breakdowns.',
      'Quick Preview modal renders a clean, printable PDF ready for client sending.',
      'Real-time status tracking for Draft, Sent, Paid, and Overdue balances.',
    ],
    imageCaption: 'Get paid faster with crisp, polished invoices tailored for your clients.',
  },
  {
    title: 'Ask AURA AI & Strategic Advisor',
    subtitle: 'Your 24/7 business copilot trained on your data',
    tag: 'Step 6 of 8',
    icon: Bot,
    targetTab: 'ask-aura',
    highlightPoints: [
      'Ask strategic questions: "Which projects have highest profit margin?" or "Draft scope of work".',
      'One-click convert AI suggestions directly into actionable backlog task cards.',
      'Proactively flags high-risk contracts and suggests retainer renegotiation scripts.',
    ],
    imageCaption: 'Solo freelancing without feeling alone — your strategic AI partner.',
  },
  {
    title: 'AURA Live Voice Companion',
    subtitle: 'Hands-free spoken conversations powered by Gemini Live',
    tag: 'Step 7 of 8',
    icon: Mic,
    targetTab: 'overview',
    highlightPoints: [
      'Debrief after client calls using natural spoken voice anytime (Cmd/Ctrl + Shift + K).',
      'Dynamic audio waveform visualizer and low-latency audio response.',
      'Automatic real-time transcription saved to your session history panel.',
    ],
    imageCaption: 'Think out loud and organize your day while on the move.',
  },
  {
    title: 'AURA Feature Center & Sandbox',
    subtitle: 'Continuous learning, guides, and safe sandbox testing',
    tag: 'Step 8 of 8',
    icon: Compass,
    targetTab: 'features',
    highlightPoints: [
      'Interactive Safe Sandbox: Test priority toggles, inline descriptions, and time logging.',
      '7-Step Onboarding guide and structured "How AURA Works" 5-stage lifecycle.',
      'Searchable feature catalog with in-depth step-by-step documentation.',
    ],
    imageCaption: 'Self-serve mastery of every capability inside the AURA workspace.',
  },
];

export const ProductTourModal: React.FC<ProductTourModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const IconComponent = currentStep.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
      onNavigate('overview');
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleJumpToTab = () => {
    onClose();
    onNavigate(currentStep.targetTab);
  };

  return (
    <div
      id="modal-product-tour"
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="aura-card max-w-2xl w-full p-6 sm:p-8 rounded-3xl border border-cyan-500/40 bg-[#0B0F1C] shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        {/* Top bar: Step tag & close */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              {currentStep.tag}
            </span>
            <span className="text-xs text-gray-400">Interactive Product Tour</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            title="Skip Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/80 to-indigo-950/80 border border-cyan-500/40 text-cyan-300 shrink-0 shadow-lg">
              <IconComponent className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                {currentStep.title}
              </h2>
              <p className="text-xs sm:text-sm text-cyan-300/90 mt-0.5">{currentStep.subtitle}</p>
            </div>
          </div>

          {/* Highlights */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Key Capabilities
            </span>
            <div className="space-y-2">
              {currentStep.highlightPoints.map((pt, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-gray-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{pt}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-gray-400 italic text-center">
            "{currentStep.imageCaption}"
          </p>
        </div>

        {/* Progress dots & Navigation buttons */}
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Step dots */}
          <div className="flex items-center space-x-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                title={`Go to step ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-cyan-400'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleJumpToTab}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-cyan-300 hover:bg-white/5 transition-colors cursor-pointer"
            >
              Open This View
            </button>

            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="aura-gradient-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <span>{isLast ? 'Complete Tour' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
