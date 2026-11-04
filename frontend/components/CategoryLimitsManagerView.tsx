import React, { useState } from 'react';
import { CategoryLimit, ExpenseCategory } from '../types';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../constants';
import { formatCurrency } from '../utils/formatCurrency';
import {
  Sliders, Plus, Trash2, CheckCircle2, DollarSign,
  Layers, ShieldCheck, Check, Edit2, Tag
} from 'lucide-react';

interface CategoryLimitsManagerViewProps {
  categoryLimits: CategoryLimit[];
  onSaveCategoryLimits: (updated: CategoryLimit[]) => void | Promise<void>;
  onOpenCreateMonthWithLimits?: () => void;
}

export const CategoryLimitsManagerView: React.FC<CategoryLimitsManagerViewProps> = ({
  categoryLimits,
  onSaveCategoryLimits,
  onOpenCreateMonthWithLimits,
}) => {
  const [category, setCategory] = useState<string>(ExpenseCategory.FOOD);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [budgetLimit, setBudgetLimit] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  const activeItems = categoryLimits.filter((item) => item.isActive);
  const totalActiveLimits = activeItems.reduce((sum, item) => sum + (Number(item.budgetLimit) || 0), 0);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const persistLimits = async (updated: CategoryLimit[], successMsg?: string) => {
    try {
      await onSaveCategoryLimits(updated);
      if (successMsg) showNotification(successMsg);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save category limits to database.';
      setErrorMsg(message);
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = categoryLimits.map((it) =>
      it.id === id ? { ...it, isActive: !it.isActive } : it
    );
    void persistLimits(updated);
  };

  const handleDeleteItem = (id: string) => {
    const target = categoryLimits.find((it) => it.id === id);
    if (!target) return;
    if (window.confirm(`Remove budget limit for "${target.category}"?`)) {
      const updated = categoryLimits.filter((it) => it.id !== id);
      void persistLimits(updated, `Removed limit for "${target.category}".`);
      if (editingId === id) resetForm();
    }
  };

  const handleEditClick = (item: CategoryLimit) => {
    setEditingId(item.id);
    if (Object.values(ExpenseCategory).includes(item.category as ExpenseCategory)) {
      setCategory(item.category);
      setCustomCategory('');
    } else {
      setCategory('CUSTOM');
      setCustomCategory(item.category);
    }
    setBudgetLimit(String(item.budgetLimit));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setCategory(ExpenseCategory.FOOD);
    setCustomCategory('');
    setBudgetLimit('');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalCategory = category === 'CUSTOM' ? (customCategory.trim() || '') : category;
    if (!finalCategory) {
      setErrorMsg('Please choose a category or type a custom category name.');
      return;
    }

    const parsedLimit = parseFloat(budgetLimit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setErrorMsg('Please enter a valid budget limit greater than ₹0.');
      return;
    }

    const duplicate = categoryLimits.find(
      (it) =>
        it.id !== editingId &&
        it.category.toLowerCase().trim() === finalCategory.toLowerCase().trim()
    );
    if (duplicate) {
      setErrorMsg(`A limit for "${finalCategory}" already exists. Edit that row instead.`);
      return;
    }

    if (editingId) {
      const updated = categoryLimits.map((it) => {
        if (it.id === editingId) {
          return {
            ...it,
            category: finalCategory,
            budgetLimit: parsedLimit,
          };
        }
        return it;
      });
      await persistLimits(updated, `Updated limit for "${finalCategory}".`);
    } else {
      const newItem: CategoryLimit = {
        id: 'lim-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        category: finalCategory,
        budgetLimit: parsedLimit,
        isActive: true,
      };
      await persistLimits([newItem, ...categoryLimits], `Added limit for "${finalCategory}".`);
    }

    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Category Budget Limits Manager
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set default monthly ceilings per category. Apply them in one click when creating or editing a month sheet.
              </p>
            </div>
          </div>
        </div>

        {onOpenCreateMonthWithLimits && (
          <button
            onClick={onOpenCreateMonthWithLimits}
            className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create Month with Limits</span>
          </button>
        )}
      </div>

      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Active Category Caps</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(totalActiveLimits)}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">
            Across {activeItems.length} active categor{activeItems.length !== 1 ? 'ies' : 'y'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Configured Limits</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-brand-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {categoryLimits.length}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">
            Including disabled rows
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Apply Status</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 mt-2">
            {activeItems.length} Ready to Apply
          </p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
            Inserted into month sheets on demand
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="h-4 w-4 text-brand-600" />
              {editingId ? 'Edit Category Limit' : 'Add Category Limit'}
            </h3>
            {editingId && (
              <button
                onClick={resetForm}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value={ExpenseCategory.ENTERTAINMENT}>Entertainment</option>
                <option value={ExpenseCategory.FOOD}>Food & Groceries</option>
                <option value={ExpenseCategory.UTILITY}>Utility & Bills</option>
                <option value={ExpenseCategory.DRESS}>Dress & Apparel</option>
                <option value={ExpenseCategory.NEW_ITEMS}>New Items & Gadgets</option>
                <option value={ExpenseCategory.BABY_NEEDS}>Baby Needs & Kids</option>
                <option value={ExpenseCategory.MEDICAL}>Medical & Health</option>
                <option value={ExpenseCategory.OTHER}>Other Expenses</option>
                <option value="CUSTOM">+ Custom Category</option>
              </select>
            </div>

            {category === 'CUSTOM' && (
              <div>
                <input
                  type="text"
                  placeholder="Type custom category name..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-white border border-brand-300 rounded-lg py-1.5 px-3 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly Budget Limit ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 500.00"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-2"
            >
              {editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{editingId ? 'Save Changes' : 'Save Category Limit'}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Category Caps ({categoryLimits.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Toggle on/off which limits get applied to month sheets.
                </p>
              </div>
              <span className="text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                {formatCurrency(totalActiveLimits)} active
              </span>
            </div>

            {categoryLimits.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <Tag className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-600 font-bold">No category limits saved</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Add ceilings for Food, Utilities, etc. on the left, then apply them when editing a month sheet.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {categoryLimits.map((item) => {
                  const colorDef = CATEGORY_COLORS[item.category] || DEFAULT_CATEGORY_COLOR;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        item.isActive
                          ? 'bg-white border-slate-200 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item.id)}
                          className={`mt-0.5 h-5 w-5 rounded-md flex items-center justify-center transition-colors border ${
                            item.isActive
                              ? 'bg-amber-600 border-amber-600 text-white'
                              : 'bg-white border-slate-300 text-transparent'
                          }`}
                          title={item.isActive ? 'Active (Will apply)' : 'Disabled (Will not apply)'}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorDef.hex }} />
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {item.category}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${colorDef.bg} ${colorDef.text} ${colorDef.border}`}
                            >
                              Cap
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Applied to monthly sheets when you click Apply Limits
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <div className="text-right">
                          <span className="text-base font-black text-slate-900 block">
                            {formatCurrency(item.budgetLimit)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">per month</span>
                        </div>

                        <div className="flex items-center space-x-1 pl-2 border-l border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleEditClick(item)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Enabled limits fill empty category budgets when you click &quot;Apply Limits&quot; on a month sheet.</span>
            <span className="font-semibold text-slate-700">Apply Feature: Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
