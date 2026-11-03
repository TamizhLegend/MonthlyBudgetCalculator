import React, { useState } from 'react';
import { RecurringExpense, ExpenseCategory } from '../types';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../constants';
import { 
  RefreshCw, Plus, Trash2, CheckCircle2, DollarSign, 
  Calendar, Layers, ShieldCheck, Tag, Sparkles, Check, Edit2 
} from 'lucide-react';

interface RecurringManagerViewProps {
  recurringExpenses: RecurringExpense[];
  onSaveRecurring: (updated: RecurringExpense[]) => void;
  onOpenCreateMonthWithAutofill?: () => void;
}

export const RecurringManagerView: React.FC<RecurringManagerViewProps> = ({
  recurringExpenses,
  onSaveRecurring,
  onOpenCreateMonthWithAutofill,
}) => {
  // Form state for creating a new recurring item
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>(ExpenseCategory.UTILITY);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [description, setDescription] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  const activeItems = recurringExpenses.filter((item) => item.isActive);
  const totalMonthlyCommitment = activeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalAnnualCommitment = totalMonthlyCommitment * 12;

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleToggleActive = (id: string) => {
    const updated = recurringExpenses.map((it) =>
      it.id === id ? { ...it, isActive: !it.isActive } : it
    );
    onSaveRecurring(updated);
  };

  const handleDeleteItem = (id: string) => {
    const target = recurringExpenses.find((it) => it.id === id);
    if (!target) return;
    if (window.confirm(`Remove "${target.name}" from recurring expenses?`)) {
      const updated = recurringExpenses.filter((it) => it.id !== id);
      onSaveRecurring(updated);
      showNotification(`Removed "${target.name}".`);
      if (editingId === id) resetForm();
    }
  };

  const handleEditClick = (item: RecurringExpense) => {
    setEditingId(item.id);
    setName(item.name);
    if (Object.values(ExpenseCategory).includes(item.category as ExpenseCategory)) {
      setCategory(item.category);
      setCustomCategory('');
    } else {
      setCategory('CUSTOM');
      setCustomCategory(item.category);
    }
    setAmount(String(item.amount));
    setDayOfMonth(item.dayOfMonth || 1);
    setDescription(item.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory(ExpenseCategory.UTILITY);
    setCustomCategory('');
    setAmount('');
    setDayOfMonth(1);
    setDescription('');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please specify a title or provider name (e.g., Home Rent, Netflix, Internet).');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid expense amount greater than $0.');
      return;
    }

    const finalCategory = category === 'CUSTOM' ? (customCategory.trim() || 'Other') : category;
    const safeDay = Math.min(Math.max(1, Number(dayOfMonth) || 1), 31);

    if (editingId) {
      const updated = recurringExpenses.map((it) => {
        if (it.id === editingId) {
          return {
            ...it,
            name: name.trim(),
            category: finalCategory,
            amount: parsedAmount,
            dayOfMonth: safeDay,
            description: description.trim(),
          };
        }
        return it;
      });
      onSaveRecurring(updated);
      showNotification(`Updated "${name.trim()}" successfully.`);
    } else {
      const newItem: RecurringExpense = {
        id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        name: name.trim(),
        category: finalCategory,
        amount: parsedAmount,
        dayOfMonth: safeDay,
        description: description.trim(),
        isActive: true,
      };
      onSaveRecurring([newItem, ...recurringExpenses]);
      showNotification(`Added "${newItem.name}" to recurring expenses.`);
    }

    resetForm();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Recurring Monthly Expenses Manager
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Save fixed overheads like Rent, Wi-Fi, Gym, and Subscriptions. Autofill them in 1-click whenever you create a new monthly sheet.
              </p>
            </div>
          </div>
        </div>

        {onOpenCreateMonthWithAutofill && (
          <button
            onClick={onOpenCreateMonthWithAutofill}
            className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-xs transition-colors shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            <span>Create Month with Autofill</span>
          </button>
        )}
      </div>

      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* KPI Cards: Fixed Monthly Burden */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Fixed Monthly Overhead</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ${totalMonthlyCommitment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">
            Across {activeItems.length} active recurring item{activeItems.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Projected Annual Fixed Cost</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-brand-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ${totalAnnualCommitment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">
            12 months of predictable commitments
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Autofill Status</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 mt-2">
            {activeItems.length} Ready to Populate
          </p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
            Always inserted on designated day of month
          </span>
        </div>
      </div>

      {/* Grid: Form on Left, List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form to Add / Edit Recurring Item (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="h-4 w-4 text-brand-600" />
              {editingId ? 'Edit Recurring Item' : 'Add New Recurring Expense'}
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
                Expense Name / Service
              </label>
              <input
                type="text"
                placeholder="e.g. Apartment Rent, Netflix, Internet, Gym"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Day of Month (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="1"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value={ExpenseCategory.UTILITY}>Utility & Bills</option>
                <option value={ExpenseCategory.ENTERTAINMENT}>Entertainment & Subs</option>
                <option value={ExpenseCategory.FOOD}>Food & Groceries</option>
                <option value={ExpenseCategory.MEDICAL}>Medical & Health</option>
                <option value={ExpenseCategory.DRESS}>Dress & Apparel</option>
                <option value={ExpenseCategory.BABY_NEEDS}>Baby Needs & Kids</option>
                <option value={ExpenseCategory.NEW_ITEMS}>New Items & Gadgets</option>
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
                Notes / Account Details (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Due every 1st via bank autopay, contract expires in Dec..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs sm:text-sm font-normal focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-2"
            >
              {editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{editingId ? 'Save Changes' : 'Save Recurring Expense'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Recurring Items List (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Fixed Monthly Overheads ({recurringExpenses.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Toggle on/off which items get populated on autofill.
                </p>
              </div>
              <span className="text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                ${totalMonthlyCommitment.toFixed(2)}/mo
              </span>
            </div>

            {recurringExpenses.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <RefreshCw className="h-8 w-8 text-slate-300 mx-auto mb-2 animate-spin-slow" />
                <p className="text-sm text-slate-600 font-bold">No recurring expenses saved</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Add your rent, internet, and recurring subscriptions on the left to easily populate future monthly sheets.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {recurringExpenses.map((item) => {
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
                        {/* Checkbox toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item.id)}
                          className={`mt-0.5 h-5 w-5 rounded-md flex items-center justify-center transition-colors border ${
                            item.isActive
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300 text-transparent'
                          }`}
                          title={item.isActive ? 'Active (Will autofill)' : 'Disabled (Will not autofill)'}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {item.name}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${colorDef.bg} ${colorDef.text} ${colorDef.border}`}
                            >
                              {item.category}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                              Day {item.dayOfMonth} of month
                            </span>
                            {item.description && (
                              <span className="text-slate-400 truncate max-w-[200px]">
                                &bull; {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <div className="text-right">
                          <span className="text-base font-black text-slate-900 block">
                            ${item.amount.toFixed(2)}
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
            <span>Enabled items will be inserted into the expense list when you click "Autofill Recurring".</span>
            <span className="font-semibold text-slate-700">Autofill Feature: Ready</span>
          </div>
        </div>

      </div>

    </div>
  );
};
