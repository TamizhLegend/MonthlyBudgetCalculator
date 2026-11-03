import React, { useState, useMemo } from 'react';
import { MonthExpenseData, ExpenseItem, ExpenseCategory, RecurringExpense } from '../types';
import { MONTH_NAMES, CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../constants';
import { downloadMonthJsonFile } from '../services/storageService';
import { 
  X, Plus, Trash2, Calendar, Download, DollarSign, 
  Tag, FileText, CheckCircle2, AlertCircle, ArrowUpDown,
  Sliders, AlertTriangle, ShieldAlert, RefreshCw, Sparkles, Check
} from 'lucide-react';

interface MonthEditorModalProps {
  initialData?: MonthExpenseData | null;
  selectedYear: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedData: MonthExpenseData) => void;
  existingMonthIds: string[];
  recurringExpenses?: RecurringExpense[];
  onOpenRecurringManager?: () => void;
}

export const MonthEditorModal: React.FC<MonthEditorModalProps> = ({
  initialData,
  selectedYear,
  isOpen,
  onClose,
  onSave,
  existingMonthIds,
  recurringExpenses = [],
  onOpenRecurringManager,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(initialData);

  // Modal Form States
  const [year, setYear] = useState<number>(initialData ? initialData.year : selectedYear);
  const [month, setMonth] = useState<number>(initialData ? initialData.month : new Date().getMonth() + 1);
  const [budget, setBudget] = useState<string>(initialData?.budget ? String(initialData.budget) : '');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [items, setItems] = useState<ExpenseItem[]>(initialData?.items ? [...initialData.items] : []);

  // Category Budgets State: Record<categoryName, budgetNumber>
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(
    initialData?.categoryBudgets ? { ...initialData.categoryBudgets } : {}
  );
  const [showBudgetConfig, setShowBudgetConfig] = useState<boolean>(false);

  // New Item Row Inputs
  const defaultDateStr = () => {
    const mm = String(month).padStart(2, '0');
    return `${year}-${mm}-01`;
  };

  const [newItemDate, setNewItemDate] = useState<string>(defaultDateStr());
  const [newItemCategory, setNewItemCategory] = useState<string>(ExpenseCategory.FOOD);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [newItemAmount, setNewItemAmount] = useState<string>('');
  const [newItemDesc, setNewItemDesc] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [autofillNotice, setAutofillNotice] = useState<string>('');

  // Sorting state for table
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Calculate live totals
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [items]
  );
  const monthName = MONTH_NAMES[month - 1];

  // Calculate live category totals
  const categorySpends = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((item) => {
      const cat = item.category || 'Other';
      map[cat] = (map[cat] || 0) + (Number(item.amount) || 0);
    });
    return map;
  }, [items]);

  // All known categories in this month (presets + existing items + configured category budgets)
  const allCategoriesList = useMemo(() => {
    const set = new Set<string>(Object.values(ExpenseCategory));
    items.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    Object.keys(categoryBudgets).forEach((cat) => set.add(cat));
    return Array.from(set);
  }, [items, categoryBudgets]);

  const activeCategoryForNew = newItemCategory === 'CUSTOM' ? (customCategory.trim() || 'Other') : newItemCategory;
  const currentCategorySpend = categorySpends[activeCategoryForNew] || 0;
  const currentCategoryBudget = categoryBudgets[activeCategoryForNew];
  const parsedNewAmount = parseFloat(newItemAmount) || 0;
  const projectedCategorySpend = currentCategorySpend + parsedNewAmount;

  // Active recurring items available to autofill
  const activeRecurringItems = useMemo(
    () => recurringExpenses.filter((r) => r.isActive),
    [recurringExpenses]
  );

  const handleCategoryBudgetChange = (catName: string, valueStr: string) => {
    const val = parseFloat(valueStr);
    setCategoryBudgets((prev) => {
      const copy = { ...prev };
      if (isNaN(val) || val <= 0) {
        delete copy[catName];
      } else {
        copy[catName] = val;
      }
      return copy;
    });
  };

  /**
   * Autofill logic:
   * Translates active recurring expenses into monthly expense entries
   * using the current month/year and matching days, avoiding duplicate descriptions.
   */
  const handleAutofillRecurring = () => {
    if (activeRecurringItems.length === 0) {
      setErrorMsg('No active recurring expenses found. Please configure them in the Recurring tab first.');
      return;
    }

    const mm = String(month).padStart(2, '0');
    // Calculate total days in current month
    const daysInCurrentMonth = new Date(year, month, 0).getDate();

    let addedCount = 0;
    const newGeneratedItems: ExpenseItem[] = [];

    activeRecurringItems.forEach((rec) => {
      // Check if already present in items list by matching description
      const alreadyExists = items.some(
        (it) => it.description.toLowerCase().trim() === rec.name.toLowerCase().trim()
      );

      if (!alreadyExists) {
        const safeDay = Math.min(rec.dayOfMonth || 1, daysInCurrentMonth);
        const dayStr = String(safeDay).padStart(2, '0');
        const entryDate = `${year}-${mm}-${dayStr}`;

        newGeneratedItems.push({
          id: 'item-rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          date: entryDate,
          category: rec.category,
          amount: Number(rec.amount),
          description: rec.name,
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setItems((prev) => [...newGeneratedItems, ...prev]);
      setAutofillNotice(`Autofilled ${addedCount} recurring item${addedCount !== 1 ? 's' : ''}!`);
      setTimeout(() => setAutofillNotice(''), 4000);
    } else {
      setAutofillNotice('All active recurring items are already present in this month.');
      setTimeout(() => setAutofillNotice(''), 3000);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = parseFloat(newItemAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than $0.');
      return;
    }

    if (!newItemDate) {
      setErrorMsg('Please specify a date for the expense item.');
      return;
    }

    const finalCategory = newItemCategory === 'CUSTOM' ? (customCategory.trim() || 'Other') : newItemCategory;

    const newItem: ExpenseItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      date: newItemDate,
      category: finalCategory,
      amount: parsedAmount,
      description: newItemDesc.trim() || `${finalCategory} expense`,
    };

    setItems((prev) => [newItem, ...prev]);

    // Reset inputs for rapid sequential entry
    setNewItemAmount('');
    setNewItemDesc('');
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveMonth = () => {
    setErrorMsg('');
    const monthId = `${year}-${String(month).padStart(2, '0')}`;

    // If new creation, check for collision
    if (!isEditing && existingMonthIds.includes(monthId)) {
      setErrorMsg(`A sheet for ${monthName} ${year} already exists. Please choose a different month or edit the existing one.`);
      return;
    }

    const cleanCategoryBudgets: Record<string, number> = {};
    Object.entries(categoryBudgets).forEach(([k, v]) => {
      if (v > 0) cleanCategoryBudgets[k] = v;
    });

    const savedMonth: MonthExpenseData = {
      id: monthId,
      year: Number(year),
      month: Number(month),
      monthName,
      budget: budget ? parseFloat(budget) : undefined,
      categoryBudgets: Object.keys(cleanCategoryBudgets).length > 0 ? cleanCategoryBudgets : undefined,
      notes: notes.trim(),
      items: items,
      lastUpdated: new Date().toISOString(),
    };

    onSave(savedMonth);
    onClose();
  };

  const handleSaveAndDownloadJson = () => {
    const monthId = `${year}-${String(month).padStart(2, '0')}`;
    const cleanCategoryBudgets: Record<string, number> = {};
    Object.entries(categoryBudgets).forEach(([k, v]) => {
      if (v > 0) cleanCategoryBudgets[k] = v;
    });

    const savedMonth: MonthExpenseData = {
      id: monthId,
      year: Number(year),
      month: Number(month),
      monthName,
      budget: budget ? parseFloat(budget) : undefined,
      categoryBudgets: Object.keys(cleanCategoryBudgets).length > 0 ? cleanCategoryBudgets : undefined,
      notes: notes.trim(),
      items: items,
      lastUpdated: new Date().toISOString(),
    };
    downloadMonthJsonFile(savedMonth);
    onSave(savedMonth);
    onClose();
  };

  // Sorted items
  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    }
    if (sortBy === 'amount') {
      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
    return sortOrder === 'asc' ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
  });

  const toggleSort = (field: 'date' | 'amount' | 'category') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Helper function to pick color and status for a budget percentage
  const getBudgetStatus = (percentage: number) => {
    if (percentage > 100) {
      return {
        barColor: 'bg-rose-500',
        textColor: 'text-rose-700',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-200',
        status: 'exceeded',
        label: 'Over Budget',
      };
    }
    if (percentage >= 80) {
      return {
        barColor: 'bg-amber-500',
        textColor: 'text-amber-800',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        status: 'warning',
        label: 'Near Limit',
      };
    }
    return {
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      status: 'good',
      label: 'On Track',
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-600" />
              {isEditing ? `Edit Expense Sheet: ${monthName} ${year}` : 'Add New Month Expense Sheet'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Target JSON output: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 font-semibold">{monthName}_{year}.json</code>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {autofillNotice && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center font-medium animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
              <span>{autofillNotice}</span>
            </div>
          )}

          {/* Month & Overall Budget Settings */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Month
                </label>
                <select
                  disabled={isEditing}
                  value={month}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setMonth(m);
                    setNewItemDate(`${year}-${String(m).padStart(2, '0')}-01`);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Year
                </label>
                <input
                  disabled={isEditing}
                  type="number"
                  value={year}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setYear(y);
                    setNewItemDate(`${y}-${String(month).padStart(2, '0')}-01`);
                  }}
                  min={2000}
                  max={2099}
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Total Month Budget (Optional $)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 3500.00"
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Category Budget Limits Toggle & Autofill Button */}
            <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowBudgetConfig(!showBudgetConfig)}
                className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-brand-50 hover:bg-brand-100 transition-colors border border-brand-200"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>
                  {showBudgetConfig ? 'Hide Category Budget Limits' : 'Configure Category Budget Limits'}
                </span>
                <span className="text-[10px] bg-brand-200 text-brand-800 px-1.5 py-0.2 rounded-full ml-1">
                  {Object.keys(categoryBudgets).length} set
                </span>
              </button>

              {/* Recurring Autofill Trigger */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleAutofillRecurring}
                  className="flex items-center space-x-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                  title="Insert fixed monthly overheads like rent and subscriptions"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Autofill Recurring ({activeRecurringItems.length})</span>
                </button>

                {onOpenRecurringManager && (
                  <button
                    type="button"
                    onClick={onOpenRecurringManager}
                    className="text-[11px] text-slate-500 hover:text-brand-600 underline font-medium"
                  >
                    Manage
                  </button>
                )}
              </div>
            </div>

            {/* Expandable Category Budget Settings Panel */}
            {showBudgetConfig && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 mt-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Set Monthly Budget Limit Per Category
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Leave blank or 0 for unlimited / unmonitored categories.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {allCategoriesList.map((catName) => {
                    const colorDef = CATEGORY_COLORS[catName] || DEFAULT_CATEGORY_COLOR;
                    const curLimit = categoryBudgets[catName] !== undefined ? categoryBudgets[catName] : '';
                    const curSpend = categorySpends[catName] || 0;

                    return (
                      <div
                        key={catName}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center space-x-1.5 truncate max-w-[150px]">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorDef.hex }} />
                            <span className="text-xs font-semibold text-slate-800 truncate">{catName}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Spent: ${curSpend.toFixed(0)}
                          </span>
                        </div>

                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="No limit"
                            value={curLimit}
                            onChange={(e) => handleCategoryBudgetChange(catName, e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md py-1 pl-6 pr-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Expense Item Form */}
          <div className="bg-brand-50/50 border border-brand-200/80 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span className="flex items-center">
                <Plus className="h-4 w-4 mr-1 text-brand-600" />
                Add Expense Item
              </span>

              {activeRecurringItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutofillRecurring}
                  className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 border border-emerald-200"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Autofill {activeRecurringItems.length} Fixed Expenses</span>
                </button>
              )}
            </h3>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Date Input */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newItemDate}
                    onChange={(e) => setNewItemDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Category Dropdown */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
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

                {/* Amount */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Submit button */}
                <div className="sm:col-span-2 flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-3 rounded-lg text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Custom category input if selected */}
              {newItemCategory === 'CUSTOM' && (
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Type custom category name (e.g., Gym & Fitness, Travel)..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-white border border-brand-300 rounded-lg py-1.5 px-3 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Description Input */}
              <div>
                <input
                  type="text"
                  placeholder="Notes or description (e.g., Pharmacy receipt, Whole Foods, Electricity bill)..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-3 text-xs sm:text-sm font-normal focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Real-time Category Budget Live Feedback Pill */}
              {currentCategoryBudget !== undefined && currentCategoryBudget > 0 && (
                <div className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <span>Budget for {activeCategoryForNew}:</span>
                      <span className="text-slate-500">${currentCategoryBudget.toFixed(2)}</span>
                    </span>
                    {(() => {
                      const pct = Math.round((projectedCategorySpend / currentCategoryBudget) * 100);
                      const status = getBudgetStatus(pct);
                      return (
                        <span className={`font-bold flex items-center gap-1 ${status.textColor}`}>
                          {status.status === 'exceeded' && <ShieldAlert className="h-3.5 w-3.5" />}
                          {status.status === 'warning' && <AlertTriangle className="h-3.5 w-3.5" />}
                          <span>{pct}% ({status.label})</span>
                        </span>
                      );
                    })()}
                  </div>

                  {(() => {
                    const projectedPct = Math.min(Math.round((projectedCategorySpend / currentCategoryBudget) * 100), 100);
                    const status = getBudgetStatus(Math.round((projectedCategorySpend / currentCategoryBudget) * 100));

                    return (
                      <div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${status.barColor}`}
                            style={{ width: `${projectedPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                          <span>Currently: ${currentCategorySpend.toFixed(2)}</span>
                          {parsedNewAmount > 0 && (
                            <span className="font-medium text-slate-700">
                              + ${parsedNewAmount.toFixed(2)} &rarr; New Total: ${projectedCategorySpend.toFixed(2)}
                            </span>
                          )}
                          <span>Limit: ${currentCategoryBudget.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </form>
          </div>

          {/* Active Category Budget Progress Cards */}
          {Object.keys(categoryBudgets).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-brand-600" />
                  Category Budget Tracker
                </h3>
                <span className="text-xs text-slate-500">
                  Real-time budget utilization
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(categoryBudgets)
                  .filter(([_, limit]) => limit > 0)
                  .map(([catName, limit]) => {
                    const spent = categorySpends[catName] || 0;
                    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                    const status = getBudgetStatus(pct);
                    const colorDef = CATEGORY_COLORS[catName] || DEFAULT_CATEGORY_COLOR;
                    const remaining = limit - spent;

                    return (
                      <div
                        key={catName}
                        className={`p-3 rounded-xl border ${status.borderColor} ${status.bgColor} flex flex-col justify-between transition-all`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorDef.hex }} />
                            <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">{catName}</span>
                          </span>

                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${status.borderColor} bg-white ${status.textColor} flex items-center gap-1`}>
                            {status.status === 'exceeded' && <ShieldAlert className="h-3 w-3" />}
                            {status.status === 'warning' && <AlertTriangle className="h-3 w-3" />}
                            {pct}%
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="mt-2.5">
                          <div className="w-full bg-white/80 rounded-full h-2 overflow-hidden shadow-inner">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${status.barColor}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Spend vs Limit info */}
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-800">
                            ${spent.toFixed(2)} <span className="text-slate-500 font-normal">/ ${limit.toFixed(2)}</span>
                          </span>
                          <span className={`font-semibold ${status.textColor}`}>
                            {remaining >= 0 ? `$${remaining.toFixed(2)} left` : `-$${Math.abs(remaining).toFixed(2)} over`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Items Table List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800">
                Monthly Expense List ({items.length} items)
              </h3>
              <span className="text-sm font-black text-brand-700">
                Total: ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <FileText className="h-8 w-8 text-slate-300 mx-auto mb-1" />
                <p className="text-sm text-slate-500 font-medium">No expenses added for this month yet.</p>
                <p className="text-xs text-slate-400 mb-3">
                  Log your expenses manually or autofill your recurring bills with one click.
                </p>
                {activeRecurringItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAutofillRecurring}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Autofill {activeRecurringItems.length} Fixed Monthly Expenses</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[11px] sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th
                          className="py-2.5 px-3 cursor-pointer hover:text-slate-900"
                          onClick={() => toggleSort('date')}
                        >
                          <div className="flex items-center gap-1">
                            Date <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th
                          className="py-2.5 px-3 cursor-pointer hover:text-slate-900"
                          onClick={() => toggleSort('category')}
                        >
                          <div className="flex items-center gap-1">
                            Category <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="py-2.5 px-3">Description</th>
                        <th
                          className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900"
                          onClick={() => toggleSort('amount')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Amount <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedItems.map((item) => {
                        const colorDef = CATEGORY_COLORS[item.category] || DEFAULT_CATEGORY_COLOR;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-3 font-medium text-slate-600 whitespace-nowrap">
                              {item.date}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colorDef.bg} ${colorDef.text} border ${colorDef.border}`}
                              >
                                {item.category}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-700 max-w-xs truncate">
                              {item.description || '—'}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                              ${item.amount.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                title="Remove item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Month Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              General Notes for this Month (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Any special occasions, trip expenses, or notes to remember..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm font-normal focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Per-category budgets and total limits are saved directly inside <span className="font-mono font-semibold text-slate-800">{monthName}_{year}.json</span>.
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveAndDownloadJson}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 shadow-xs"
              title="Save & Download Month_Year.json"
            >
              <Download className="h-4 w-4" />
              <span>Save & Download JSON</span>
            </button>

            <button
              type="button"
              onClick={handleSaveMonth}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
