import React, { useState } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Briefcase,
  Mail,
  User,
  Building,
  Calendar,
  DollarSign,
  Phone,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { saveClientInquiryToFirestore } from '../lib/firebase';
import { apiCreateLead } from '../lib/api';

export interface ClientProjectIntakeProps {
  onBackToLogin?: () => void;
  onSuccess?: () => void;
  standalone?: boolean;
}

const PROJECT_TYPES = [
  'AI / LLM Application',
  'Backend Development',
  'API Development',
  'Web Application',
  'Automation',
  'Data / Analytics',
  'AI Integration',
  'Other',
];

const BUDGET_RANGES = [
  'Flexible / Undecided',
  'Under $2,500',
  '$2,500 - $5,000',
  '$5,000 - $10,000',
  '$10,000 - $25,000',
  '$25,000+',
];

const TIMELINES = [
  'Flexible',
  'Urgent (< 2 weeks)',
  '2 - 4 weeks',
  '1 - 2 months',
  '2 - 3 months',
  '3+ months',
];

const CONTACT_METHODS = [
  'Email',
  'Phone / WhatsApp',
  'Google Meet',
];

export const ClientProjectIntake: React.FC<ClientProjectIntakeProps> = ({
  onBackToLogin,
  onSuccess,
  standalone = false,
}) => {
  // Form input states (preserved across validation errors and network issues)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [description, setDescription] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [budget, setBudget] = useState(BUDGET_RANGES[0]);
  const [timeline, setTimeline] = useState(TIMELINES[0]);
  const [preferredContact, setPreferredContact] = useState(CONTACT_METHODS[0]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Field validation errors
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    projectType?: string;
    description?: string;
  }>({});

  const validate = (): boolean => {
    const nextErrors: typeof errors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Full Name is required.';
    } else if (fullName.trim().length < 2) {
      nextErrors.fullName = 'Name must be at least 2 characters.';
    }

    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed) {
      nextErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(emailTrimmed)) {
      nextErrors.email = 'Please provide a valid email format (e.g. name@company.com).';
    }

    if (!projectType) {
      nextErrors.projectType = 'Please select a project category.';
    }

    if (!description.trim()) {
      nextErrors.description = 'Please describe your project or requirements.';
    } else if (description.trim().length < 15) {
      nextErrors.description = 'Please provide at least 15 characters describing what you need built.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate concurrent submissions
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const inquiryPayload = {
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      company: company.trim() || undefined,
      projectType,
      description: description.trim(),
      goal: mainGoal.trim() || undefined,
      budget: budget !== 'Flexible / Undecided' ? budget : undefined,
      timeline: timeline !== 'Flexible' ? timeline : undefined,
      preferredContact,
      additionalNotes: additionalNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'New' as const,
    };

    try {
      // 1. Submit securely to Firestore client_inquiries collection
      let firestoreSuccess = false;
      let lastFirestoreError: string | null = null;
      try {
        const firestoreResult = await saveClientInquiryToFirestore(inquiryPayload);
        firestoreSuccess = firestoreResult.success;
        if (!firestoreResult.success && firestoreResult.error) {
          lastFirestoreError = firestoreResult.error;
        }
      } catch (fsErr: any) {
        lastFirestoreError = fsErr?.message || 'Firestore connection issue';
        console.warn('[Client Intake Firestore Warning]:', fsErr);
      }

      // 2. Also notify backend API lead intake if server is active
      let apiSuccess = false;
      try {
        await apiCreateLead({
          name: inquiryPayload.name,
          email: inquiryPayload.email,
          company: inquiryPayload.company || 'Direct Client Inquiry',
          source: 'Client Intake Form',
          potentialValue: budget.includes('10,000') ? 10000 : budget.includes('5,000') ? 5000 : 2500,
          status: 'New',
          priority: timeline.includes('Urgent') ? 'Urgent' : 'High',
          notes: `Project Type: ${projectType}\nTimeline: ${timeline}\nDescription: ${inquiryPayload.description}\nGoal: ${inquiryPayload.goal || 'N/A'}\nContact Preference: ${preferredContact}`,
        });
        apiSuccess = true;
      } catch (apiErr) {
        console.info('[Client Intake Backend Sync Note]: Backend notified or standalone mode active.');
      }

      // If neither Firestore nor API succeeded, raise error so client knows and can retry
      if (!firestoreSuccess && !apiSuccess) {
        throw new Error(
          lastFirestoreError ||
            'Could not submit project inquiry to the database. Please check your network and try again.'
        );
      }

      // Successful completion confirmed
      setIsSubmitting(false);
      setIsSubmittedSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('[Client Intake Submission Error]:', err);
      setIsSubmitting(false);
      setGeneralError(
        err?.message ||
          'Unable to send project details due to a temporary connection issue. Your form details are preserved below. Please click retry.'
      );
    }
  };

  const handleResetForm = () => {
    setFullName('');
    setEmail('');
    setCompany('');
    setProjectType(PROJECT_TYPES[0]);
    setDescription('');
    setMainGoal('');
    setBudget(BUDGET_RANGES[0]);
    setTimeline(TIMELINES[0]);
    setPreferredContact(CONTACT_METHODS[0]);
    setAdditionalNotes('');
    setErrors({});
    setGeneralError(null);
    setIsSubmittedSuccess(false);
  };

  // SUCCESS SCREEN (Section 14: Client Success Screen)
  if (isSubmittedSuccess) {
    return (
      <div className="w-full max-w-xl mx-auto p-6 sm:p-8 bg-[#0B101E] border border-cyan-500/30 rounded-2xl shadow-2xl text-white space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center mx-auto text-cyan-300 shadow-lg shadow-cyan-950/60">
          <CheckCircle2 className="w-8 h-8 text-cyan-400" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-white">
            Project request received
          </h2>
          <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
            AURA has received your project details. <span className="font-semibold text-cyan-300">Noor Fatima</span> will review your requirements and follow up with you promptly.
          </p>
        </div>

        <div className="bg-[#060913] rounded-xl p-4 border border-white/5 space-y-2 text-xs text-gray-400">
          <div className="flex justify-between items-center py-1 border-b border-white/5">
            <span>Client</span>
            <span className="font-semibold text-white">{fullName}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-white/5">
            <span>Email</span>
            <span className="font-semibold text-cyan-300">{email}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-white/5">
            <span>Project Category</span>
            <span className="font-semibold text-indigo-300">{projectType}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span>Contact Preference</span>
            <span className="font-semibold text-white">{preferredContact}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleResetForm}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Submit Another Project</span>
          </button>
          {onBackToLogin && (
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full sm:w-1/2 aura-gradient-btn py-2.5 px-4 rounded-xl text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <span>Return to Sign In</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // INTAKE FORM (Section 11, 12, 13)
  return (
    <div className="w-full max-w-xl mx-auto p-6 sm:p-8 bg-[#090D1A] border border-white/10 rounded-2xl shadow-2xl text-white space-y-6">
      {/* Header */}
      <div>
        {onBackToLogin && (
          <button
            type="button"
            onClick={onBackToLogin}
            className="inline-flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium mb-3 cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Sign In</span>
          </button>
        )}
        <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Discuss Your Project</span>
        </div>
        <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">
          Work with Noor Fatima
        </h2>
        <p className="mt-1 text-xs text-gray-400 leading-relaxed">
          Provide your project objectives below. Whether you need full-stack AI engineering, high-throughput backend systems, or bespoke automation, AURA will direct your request directly to Noor.
        </p>
      </div>

      {/* General Submission Error Banner */}
      {generalError && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{generalError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Full Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Full Name <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                }}
                placeholder="Alex Morgan"
                className={`w-full bg-[#05070D] border ${
                  errors.fullName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-white/10'
                } rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors`}
              />
            </div>
            {errors.fullName && (
              <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Work Email <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="alex@company.com"
                className={`w-full bg-[#05070D] border ${
                  errors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-white/10'
                } rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Row 2: Company & Project Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Company / Organization <span className="text-gray-500 text-[10px] lowercase">(optional)</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Systems Inc."
                className="w-full bg-[#05070D] border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Project Category <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <select
                value={projectType}
                onChange={(e) => {
                  setProjectType(e.target.value);
                  if (errors.projectType) setErrors({ ...errors, projectType: undefined });
                }}
                className="w-full bg-[#05070D] border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#090D1A] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>
            {errors.projectType && (
              <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.projectType}</p>
            )}
          </div>
        </div>

        {/* Project Description (Required) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Project Description & Requirements <span className="text-cyan-400">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors({ ...errors, description: undefined });
            }}
            placeholder="Tell us about the application, architecture, or features you want to build (e.g., custom AI agent, multi-tenant API, high-concurrency pipeline)..."
            className={`w-full bg-[#05070D] border ${
              errors.description ? 'border-rose-500 ring-1 ring-rose-500' : 'border-white/10'
            } rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors resize-y`}
          />
          {errors.description && (
            <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.description}</p>
          )}
        </div>

        {/* Main Problem / Goal (Optional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Main Problem or Strategic Goal <span className="text-gray-500 text-[10px] lowercase">(optional)</span>
          </label>
          <input
            type="text"
            value={mainGoal}
            onChange={(e) => setMainGoal(e.target.value)}
            placeholder="e.g. Cut API latency in half, automate customer email ingestion, launch MVP in 4 weeks"
            className="w-full bg-[#05070D] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Row 3: Budget Range & Timeline (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Estimated Budget <span className="text-gray-500 text-[10px] lowercase">(optional)</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-[#05070D] border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                {BUDGET_RANGES.map((b) => (
                  <option key={b} value={b} className="bg-[#090D1A] text-white">
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Target Timeline <span className="text-gray-500 text-[10px] lowercase">(optional)</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full bg-[#05070D] border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                {TIMELINES.map((t) => (
                  <option key={t} value={t} className="bg-[#090D1A] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Row 4: Preferred Contact Method */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Preferred Communication Channel
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CONTACT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPreferredContact(m)}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  preferredContact === m
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-sm'
                    : 'border-white/10 bg-[#05070D] text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Notes (Optional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Additional Notes / Existing Repositories <span className="text-gray-500 text-[10px] lowercase">(optional)</span>
          </label>
          <input
            type="text"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Links to existing architecture docs, GitHub repos, or specific tech stack requirements"
            className="w-full bg-[#05070D] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full aura-gradient-btn text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Sending project details...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-white" />
                <span>Submit Project Request to Noor Fatima</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-gray-500 text-center">
          Submissions are received securely in AURA AI. Noor Fatima typically replies within 24 hours.
        </p>
      </form>
    </div>
  );
};
