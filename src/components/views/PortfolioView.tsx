import React, { useState } from 'react';
import { PortfolioItem, BrandProfile } from '../../types';
import {
  Award,
  Plus,
  Globe,
  ExternalLink,
  Sparkles,
  Quote,
  TrendingUp,
  Search,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
  Sliders,
  Shield,
  FileText,
} from 'lucide-react';

interface PortfolioViewProps {
  portfolio: PortfolioItem[];
  brandProfile: BrandProfile;
  onAddPortfolioItem: (item: PortfolioItem) => void;
  onUpdatePortfolioItem: (item: PortfolioItem) => void;
  onDeletePortfolioItem: (id: string) => void;
  onUpdateBrandProfile: (profile: BrandProfile) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  portfolio,
  brandProfile,
  onAddPortfolioItem,
  onUpdatePortfolioItem,
  onDeletePortfolioItem,
  onUpdateBrandProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'case-studies' | 'brand-profile' | 'preview'>(
    'case-studies'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Web Application');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [completionDate, setCompletionDate] = useState('2026-08-15');
  const [skillsInput, setSkillsInput] = useState('React, TypeScript, Tailwind CSS');
  const [metrics, setMetrics] = useState('');
  const [testimonialQuote, setTestimonialQuote] = useState('');
  const [testimonialAuthor, setTestimonialAuthor] = useState('');
  const [testimonialRole, setTestimonialRole] = useState('');

  // Editable Brand Profile
  const [localBrand, setLocalBrand] = useState<BrandProfile>(brandProfile);
  const [brandSavedNotice, setBrandSavedNotice] = useState(false);

  const filteredPortfolio = portfolio.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.clientName && p.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreatePortfolioItem = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newItem: PortfolioItem = {
      id: `port_${Date.now()}`,
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      clientName: clientName.trim() || undefined,
      completionDate,
      skills: skills.length > 0 ? skills : ['TypeScript', 'Full-Stack'],
      metrics: metrics.trim() || undefined,
      testimonial: testimonialQuote.trim()
        ? {
            quote: testimonialQuote.trim(),
            clientName: testimonialAuthor.trim() || 'Client Representative',
            role: testimonialRole.trim() || 'Executive',
          }
        : undefined,
      published: true,
    };

    onAddPortfolioItem(newItem);
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setCategory('Web Application');
    setDescription('');
    setClientName('');
    setSkillsInput('React, TypeScript, Tailwind CSS');
    setMetrics('');
    setTestimonialQuote('');
    setTestimonialAuthor('');
    setTestimonialRole('');
  };

  const handleSaveBrandProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBrandProfile(localBrand);
    setBrandSavedNotice(true);
    setTimeout(() => setBrandSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
              Portfolio & Brand Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {portfolio.length} Projects Live
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Showcase enterprise case studies, validated outcomes, client testimonials, and brand voice.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('case-studies')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'case-studies'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Case Studies
            </button>
            <button
              onClick={() => setActiveTab('brand-profile')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'brand-profile'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Brand Identity
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'preview'
                  ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Client Preview
            </button>
          </div>

          {activeTab === 'case-studies' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-medium rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Case Study</span>
            </button>
          )}
        </div>
      </div>

      {brandSavedNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center justify-between">
          <span>Brand guidelines and business positioning updated successfully.</span>
          <button onClick={() => setBrandSavedNotice(false)}>✕</button>
        </div>
      )}

      {/* Case Studies Tab */}
      {activeTab === 'case-studies' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 flex items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search case studies by name, skill, client..."
                className="w-full pl-9 pr-3 py-1.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
            <span className="text-xs text-neutral-500">
              Showing {filteredPortfolio.length} published case studies
            </span>
          </div>

          {portfolio.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-medium text-neutral-200">No case studies published</h3>
              <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1 mb-6">
                Publish completed projects with business metrics, tech stack tags, and client testimonials.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Case Study</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredPortfolio.map((item) => (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 border border-neutral-700">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.clientName && (
                          <span className="text-xs text-neutral-400 font-medium">
                            Client: {item.clientName}
                          </span>
                        )}
                        <button
                          onClick={() => onDeletePortfolioItem(item.id)}
                          className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-neutral-100 mt-3">{item.title}</h3>

                    <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Metrics Callout */}
                    {item.metrics && (
                      <div className="mt-4 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-2.5">
                        <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-cyan-200">
                          <span className="font-semibold block text-[10px] text-cyan-400 uppercase tracking-wider">
                            MEASURED BUSINESS IMPACT
                          </span>
                          {item.metrics}
                        </div>
                      </div>
                    )}

                    {/* Testimonial Quote */}
                    {item.testimonial && (
                      <div className="mt-4 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start gap-2.5">
                        <Quote className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-neutral-300 italic">
                          "{item.testimonial.quote}"
                          <span className="block mt-1 font-semibold text-neutral-400 not-italic text-[11px]">
                            — {item.testimonial.clientName}, {item.testimonial.role}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Skills tags */}
                  <div className="mt-6 pt-4 border-t border-neutral-800 flex flex-wrap items-center gap-1.5">
                    {item.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Brand Profile Tab */}
      {activeTab === 'brand-profile' && (
        <form
          onSubmit={handleSaveBrandProfile}
          className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-5"
        >
          <div className="border-b border-neutral-800 pb-3">
            <h2 className="text-base font-semibold text-neutral-100">
              Agency & Brand Voice Architecture
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              These brand guidelines power AURA AI's tone calibration during message generation,
              proposal drafting, and client outreach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">
                About Business & Mission
              </label>
              <textarea
                rows={4}
                value={localBrand.about}
                onChange={(e) => setLocalBrand({ ...localBrand, about: e.target.value })}
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 leading-relaxed focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-medium">
                Calibrated Brand Voice & Tone
              </label>
              <textarea
                rows={4}
                value={localBrand.brandVoice}
                onChange={(e) => setLocalBrand({ ...localBrand, brandVoice: e.target.value })}
                placeholder="e.g. Calm, authoritative, lucid, precise, zero-hype, outcome-focused..."
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 leading-relaxed focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Target Audience</label>
              <input
                type="text"
                value={localBrand.targetAudience}
                onChange={(e) => setLocalBrand({ ...localBrand, targetAudience: e.target.value })}
                placeholder="e.g. Venture-backed founders, engineering leads, enterprise operators"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-medium">
                Pricing Guidelines & Minimum Retainers
              </label>
              <input
                type="text"
                value={localBrand.pricingGuidelines}
                onChange={(e) => setLocalBrand({ ...localBrand, pricingGuidelines: e.target.value })}
                placeholder="e.g. Minimum engagement: $2,500. Retainer baseline: $3,500/month."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-neutral-400 mb-1 font-medium">
                Standard Commercial Policies & Deposit Rules
              </label>
              <textarea
                rows={3}
                value={localBrand.standardPolicies}
                onChange={(e) => setLocalBrand({ ...localBrand, standardPolicies: e.target.value })}
                placeholder="e.g. 50% deposit before kickoff. Source code intellectual property transfers upon final payment."
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 leading-relaxed focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Save Brand Positioning
            </button>
          </div>
        </form>
      )}

      {/* Client-Facing Preview Tab */}
      {activeTab === 'preview' && (
        <div className="p-8 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-8 max-w-4xl mx-auto shadow-2xl">
          {/* Header */}
          <div className="border-b border-neutral-800 pb-6 text-center space-y-2">
            <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase">
              STUDIO PORTFOLIO &amp; CAPABILITIES
            </span>
            <h2 className="text-3xl font-bold text-neutral-100">Aura Digital Engineering</h2>
            <p className="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
              {localBrand.about || 'Architecting high-scale intelligent business systems.'}
            </p>
          </div>

          {/* Core metrics strip */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
              <div className="text-2xl font-bold text-cyan-400">{portfolio.length}</div>
              <div className="text-xs text-neutral-400 mt-1">Shipped Case Studies</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
              <div className="text-2xl font-bold text-emerald-400">100%</div>
              <div className="text-xs text-neutral-400 mt-1">Client Satisfaction</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
              <div className="text-2xl font-bold text-purple-400">99.9%</div>
              <div className="text-xs text-neutral-400 mt-1">System Uptime SLA</div>
            </div>
          </div>

          {/* Published Projects */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
              Selected Engagements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.map((p) => (
                <div key={p.id} className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-cyan-400 font-semibold">{p.category}</span>
                    <span className="text-neutral-500">{p.clientName}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-neutral-100">{p.title}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">{p.description}</p>
                  {p.metrics && (
                    <div className="text-xs text-cyan-300 font-medium pt-1">
                      ★ {p.metrics}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Portfolio Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <form
            onSubmit={handleCreatePortfolioItem}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-semibold text-neutral-100">Add Case Study Project</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Autonomous Logistics Dispatch Dashboard"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Web Application / AI Engineering"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Client Name (Optional)</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. SwiftRoute Global"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Project Summary *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain problem statement, engineering solution, and execution craft..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">
                  Skills & Technologies (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="React, TypeScript, Tailwind CSS, Gemini API"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">
                  Measurable Outcome / Metric (e.g. "Saved 18 hrs/week, boosted speed 42%")
                </label>
                <input
                  type="text"
                  value={metrics}
                  onChange={(e) => setMetrics(e.target.value)}
                  placeholder="Reduced dispatch latency by 42%..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <span className="text-[11px] font-semibold text-neutral-300 block">
                  Client Testimonial (Optional)
                </span>
                <input
                  type="text"
                  value={testimonialQuote}
                  onChange={(e) => setTestimonialQuote(e.target.value)}
                  placeholder="Quote (e.g. 'Transformed our operations within 30 days.')"
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={testimonialAuthor}
                    onChange={(e) => setTestimonialAuthor(e.target.value)}
                    placeholder="Author Name"
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                  <input
                    type="text"
                    value={testimonialRole}
                    onChange={(e) => setTestimonialRole(e.target.value)}
                    placeholder="Role & Company"
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-neutral-400 hover:text-neutral-200 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Publish Case Study
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
