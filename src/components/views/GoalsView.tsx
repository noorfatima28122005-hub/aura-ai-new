import React, { useState } from 'react';
import { BusinessGoal } from '../../types';
import {
  Target,
  Plus,
  TrendingUp,
  Award,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';

interface GoalsViewProps {
  goals: BusinessGoal[];
  onAddGoal: (goal: BusinessGoal) => void;
  onUpdateGoal: (goal: BusinessGoal) => void;
  onDeleteGoal: (id: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<BusinessGoal | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('25000');
  const [current, setCurrent] = useState('18400');
  const [unit, setUnit] = useState('$');
  const [deadline, setDeadline] = useState('2026-09-30');
  const [category, setCategory] = useState('Revenue');

  const categories = ['Revenue', 'Growth', 'Client Retention', 'Delivery', 'Productivity'];

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();

    const targetNum = parseFloat(target) || 1;
    const currentNum = parseFloat(current) || 0;
    const pct = (currentNum / targetNum) * 100;
    let status: BusinessGoal['status'] = 'In Progress';
    if (pct >= 100) status = 'Achieved';

    if (editingGoal) {
      const updated: BusinessGoal = {
        ...editingGoal,
        title: title.trim(),
        target: targetNum,
        current: currentNum,
        unit,
        deadline,
        category,
        status,
      };
      onUpdateGoal(updated);
    } else {
      const newGoal: BusinessGoal = {
        id: `goal_${Date.now()}`,
        title: title.trim(),
        target: targetNum,
        current: currentNum,
        unit,
        deadline,
        category,
        status,
      };
      onAddGoal(newGoal);
    }

    setIsAddModalOpen(false);
    setEditingGoal(null);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setTarget('25000');
    setCurrent('18400');
    setUnit('$');
    setDeadline('2026-09-30');
    setCategory('Revenue');
  };

  const handleStartEdit = (goal: BusinessGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setTarget(goal.target.toString());
    setCurrent(goal.current.toString());
    setUnit(goal.unit);
    setDeadline(goal.deadline);
    setCategory(goal.category);
    setIsAddModalOpen(true);
  };

  const handleQuickAdjustCurrent = (goal: BusinessGoal, delta: number) => {
    const newCurrent = Math.max(0, goal.current + delta);
    const pct = (newCurrent / goal.target) * 100;
    const status: BusinessGoal['status'] = pct >= 100 ? 'Achieved' : 'In Progress';
    onUpdateGoal({
      ...goal,
      current: newCurrent,
      status,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
              Business Goals &amp; OKRs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {goals.length} Active Targets
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Track key commercial benchmarks, quarterly revenue targets, and delivery efficiency milestones.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-medium rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Business Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-medium text-neutral-200">No goals configured</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1 mb-6">
            Set quarterly revenue benchmarks, client acquisition objectives, and deliverable targets.
          </p>
          <button
            onClick={() => {
              setEditingGoal(null);
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
            const isAchieved = goal.status === 'Achieved' || pct >= 100;

            return (
              <div
                key={goal.id}
                className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                      {goal.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(goal)}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-neutral-100 mt-2">{goal.title}</h3>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-neutral-100 font-mono">
                        {goal.unit}
                        {goal.current.toLocaleString()}
                      </span>
                      <span className="text-xs text-neutral-400">
                        Target: {goal.unit}
                        {goal.target.toLocaleString()}
                      </span>
                    </div>

                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isAchieved
                            ? 'bg-emerald-500'
                            : pct > 70
                            ? 'bg-cyan-400'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span
                        className={`font-semibold ${
                          isAchieved ? 'text-emerald-400' : 'text-cyan-400'
                        }`}
                      >
                        {pct}% Completed
                      </span>
                      <span className="text-neutral-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Due {goal.deadline}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick adjustments */}
                <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">Update value:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleQuickAdjustCurrent(goal, 500)}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-neutral-300 transition-colors"
                    >
                      +500
                    </button>
                    <button
                      onClick={() => handleQuickAdjustCurrent(goal, 2000)}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-neutral-300 transition-colors"
                    >
                      +2k
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <form
            onSubmit={handleSaveGoal}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-semibold text-neutral-100">
                {editingGoal ? 'Edit Business Goal' : 'Create Business Goal'}
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
                <label className="block text-neutral-400 mb-1">Goal Benchmark Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Studio Gross Revenue"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Unit / Symbol</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="$ or clients"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Current Progress</label>
                  <input
                    type="number"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Target Value</label>
                  <input
                    type="number"
                    required
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-cyan-500"
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
                {editingGoal ? 'Update Goal' : 'Save Goal'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
