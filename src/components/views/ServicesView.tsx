import React, { useState } from 'react';
import { Service, ServicePricingModel, NavigationTab } from '../../types';
import {
  Package,
  Plus,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  Edit2,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';

interface ServicesViewProps {
  services: Service[];
  onAddService: (service: Service) => void;
  onUpdateService: (service: Service) => void;
  onDeleteService: (id: string) => void;
  onNavigateToTab?: (tab: NavigationTab) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  onAddService,
  onUpdateService,
  onDeleteService,
  onNavigateToTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Software Engineering');
  const [pricing, setPricing] = useState('5000');
  const [pricingModel, setPricingModel] = useState<ServicePricingModel>('Fixed');
  const [estimatedDelivery, setEstimatedDelivery] = useState('3-4 Weeks');
  const [featuresInput, setFeaturesInput] = useState('');

  const categories = Array.from(new Set(services.map((s) => s.category))).filter(Boolean);

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const featuresList = featuresInput
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    if (editingService) {
      const updated: Service = {
        ...editingService,
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        pricing: parseFloat(pricing) || 0,
        pricingModel,
        estimatedDelivery: estimatedDelivery.trim(),
        features: featuresList.length > 0 ? featuresList : editingService.features,
      };
      onUpdateService(updated);
    } else {
      const newService: Service = {
        id: `srv_${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        pricing: parseFloat(pricing) || 0,
        pricingModel,
        estimatedDelivery: estimatedDelivery.trim(),
        features:
          featuresList.length > 0
            ? featuresList
            : ['Discovery & Scope Spec', 'Milestone Delivery', 'Source Code Handover'],
        status: 'Active',
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddService(newService);
    }

    setIsAddModalOpen(false);
    setEditingService(null);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('Software Engineering');
    setPricing('5000');
    setPricingModel('Fixed');
    setEstimatedDelivery('3-4 Weeks');
    setFeaturesInput('');
  };

  const handleStartEdit = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description);
    setCategory(service.category);
    setPricing(service.pricing.toString());
    setPricingModel(service.pricingModel);
    setEstimatedDelivery(service.estimatedDelivery);
    setFeaturesInput(service.features.join('\n'));
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
              Services & Packages
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {services.length} Offerings
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Standardized productized services, retainers, and architectural consulting packages.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingService(null);
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service Package</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search offerings by name or skill..."
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500/60"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-medium text-neutral-200">No services cataloged</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1 mb-6">
            Define your core productized offerings, pricing models, and delivery timelines.
          </p>
          <button
            onClick={() => {
              setEditingService(null);
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Service</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                    {service.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(service)}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteService(service.id)}
                      className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-neutral-100 mt-3">{service.name}</h3>

                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  {service.description}
                </p>

                {/* Features List */}
                <div className="mt-4 space-y-2">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                    INCLUDED DELIVERABLES
                  </span>
                  {service.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-neutral-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase">
                    {service.pricingModel} PRICING
                  </span>
                  <div className="text-lg font-bold text-neutral-100">
                    ${service.pricing.toLocaleString()}
                    <span className="text-xs font-normal text-neutral-400 ml-1">
                      {service.pricingModel === 'Monthly Retainer' ? '/ mo' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs mr-1">
                    <span className="text-[10px] text-neutral-500 block">EST. DELIVERY</span>
                    <span className="text-neutral-300 font-medium">{service.estimatedDelivery}</span>
                  </div>

                  {onNavigateToTab && (
                    <button
                      onClick={() => onNavigateToTab('proposals')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors cursor-pointer border border-neutral-700"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
                      <span>Draft SOW</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <form
            onSubmit={handleSaveService}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-semibold text-neutral-100">
                {editingService ? 'Edit Service Package' : 'Create Service Offering'}
              </h3>
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
                <label className="block text-neutral-400 mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AI Workflow & Agent Automation Suite"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Software Engineering"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Pricing Model</label>
                  <select
                    value={pricingModel}
                    onChange={(e) => setPricingModel(e.target.value as ServicePricingModel)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Fixed">Fixed Price</option>
                    <option value="Milestone-based">Milestone-based</option>
                    <option value="Monthly Retainer">Monthly Retainer</option>
                    <option value="Hourly">Hourly Rate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    value={pricing}
                    onChange={(e) => setPricing(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Estimated Delivery</label>
                  <input
                    type="text"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    placeholder="e.g. 3-4 Weeks"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline value proposition, technological stack, and business outcomes..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">
                  Deliverables / Key Features (1 per line)
                </label>
                <textarea
                  rows={4}
                  value={featuresInput}
                  onChange={(e) => setFeaturesInput(e.target.value)}
                  placeholder="Gemini API Integration&#10;Automated Approval Flows&#10;Custom Database Webhooks"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500 font-mono"
                />
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                {editingService ? 'Update Service' : 'Save Package'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
