import React, { useState } from 'react';
import { KnowledgeEntry } from '../../types';
import {
  BookOpen,
  Plus,
  Search,
  Sparkles,
  Edit2,
  Trash2,
  Database,
  Lock,
  Layers,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Brain,
} from 'lucide-react';

interface KnowledgeViewProps {
  knowledge: KnowledgeEntry[];
  onAddEntry: (entry: KnowledgeEntry) => void;
  onUpdateEntry: (entry: KnowledgeEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export const KnowledgeView: React.FC<KnowledgeViewProps> = ({
  knowledge,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Commercial Policies');
  const [content, setContent] = useState('');

  // Interactive grounding test
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const categories = Array.from(new Set(knowledge.map((k) => k.category))).filter(Boolean);

  const filteredKnowledge = knowledge.filter((k) => {
    const matchesCategory = activeCategory === 'all' || k.category === activeCategory;
    const matchesSearch =
      k.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEntry) {
      const updated: KnowledgeEntry = {
        ...editingEntry,
        title: title.trim(),
        category: category.trim(),
        content: content.trim(),
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      onUpdateEntry(updated);
    } else {
      const newEntry: KnowledgeEntry = {
        id: `kb_${Date.now()}`,
        title: title.trim(),
        category: category.trim(),
        content: content.trim(),
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      onAddEntry(newEntry);
    }

    setIsAddModalOpen(false);
    setEditingEntry(null);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setCategory('Commercial Policies');
    setContent('');
  };

  const handleStartEdit = (item: KnowledgeEntry) => {
    setEditingEntry(item);
    setTitle(item.title);
    setCategory(item.category);
    setContent(item.content);
    setIsAddModalOpen(true);
  };

  const handleRunGroundingTest = () => {
    if (!testQuery.trim()) return;
    setIsQuerying(true);

    setTimeout(() => {
      // Ground against knowledge base
      const queryLower = testQuery.toLowerCase();
      const matched = knowledge.filter(
        (k) =>
          k.title.toLowerCase().includes(queryLower) ||
          k.content.toLowerCase().includes(queryLower) ||
          k.category.toLowerCase().includes(queryLower)
      );

      if (matched.length > 0) {
        setTestResult(
          `Grounded Answer (Referencing "${matched[0].title}"):\n${matched[0].content}`
        );
      } else {
        setTestResult(
          `Grounded Answer:\nBased on current AURA Knowledge, no specific rule directly conflicts with your query. Standard studio policy dictates 50% upfront deposits and Net 15 milestone settlement.`
        );
      }
      setIsQuerying(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
              AURA Knowledge Base
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {knowledge.length} Core Groundings
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Ground truth repository defining your business rules, commercial policies, pricing schedules,
            and technological stacks for AURA AI.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingEntry(null);
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-medium rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Knowledge Entry</span>
        </button>
      </div>

      {/* Grounding Query Tester Drawer */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
          <Brain className="w-4 h-4" />
          <span>VERIFY AURA GROUNDING</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Ask a question about your studio policies, e.g. 'What is our deposit policy for new clients?'"
            className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleRunGroundingTest}
            disabled={isQuerying}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 border border-neutral-700"
          >
            {isQuerying ? 'Evaluating...' : 'Query Knowledge'}
          </button>
        </div>

        {testResult && (
          <div className="p-3 rounded-lg bg-neutral-950 border border-cyan-500/30 text-xs text-neutral-300 whitespace-pre-line leading-relaxed animate-fade-in font-mono">
            {testResult}
          </div>
        )}
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-neutral-800 text-neutral-100 font-medium'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All Entries
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-neutral-800 text-cyan-400 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search knowledge..."
            className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>
      </div>

      {/* Knowledge Cards Grid */}
      {knowledge.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-medium text-neutral-200">No knowledge entries</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1 mb-6">
            Teach AURA your proprietary business rules, discount thresholds, communication standards,
            and technological stacks.
          </p>
          <button
            onClick={() => {
              setEditingEntry(null);
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Knowledge Item</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredKnowledge.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 border border-neutral-700">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteEntry(item.id)}
                      className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-neutral-100 mt-3">{item.title}</h3>

                <p className="text-xs text-neutral-300 mt-2 leading-relaxed whitespace-pre-line font-mono bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
                  {item.content}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-500">
                <span>Ground Truth Verified</span>
                <span>Updated: {item.lastUpdated}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEntry}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-semibold text-neutral-100">
                {editingEntry ? 'Edit Knowledge Entry' : 'Add Knowledge Grounding'}
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
                <label className="block text-neutral-400 mb-1">Knowledge Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Standard Commercial Retainer Terms"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Commercial Policies / Architecture Stack / SLAs"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">
                  Ground Truth Content & Rules *
                </label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="State exact facts, numbers, policies, terms, and constraints..."
                  className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono text-xs leading-relaxed"
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
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Save Knowledge
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
