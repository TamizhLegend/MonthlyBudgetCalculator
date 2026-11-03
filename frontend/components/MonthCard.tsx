import React from 'react';
import { MonthExpenseData, ExpenseCategory } from '../types';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../constants';
import { downloadMonthJsonFile } from '../services/storageService';
import { formatCurrency } from '../utils/formatCurrency';
import { Download, Edit3, Trash2, Calendar, TrendingUp, AlertCircle, ShieldAlert } from 'lucide-react';

interface MonthCardProps {
  data: MonthExpenseData;
  onEdit: (data: MonthExpenseData) => void;
  onDelete: (id: string) => void;
}

export const MonthCard: React.FC<MonthCardProps> = ({ data, onEdit, onDelete }) => {
  const totalSpend = data.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const budget = data.budget || 0;
  const isOverBudget = budget > 0 && totalSpend > budget;
  const budgetPercent = budget > 0 ? Math.round((totalSpend / budget) * 100) : 0;

  // Aggregate category spends
  const categoryTotals = data.items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryBudgets = data.categoryBudgets || {};

  // Show every expense category (incl. ₹0 spent), plus any custom ones from items/budgets
  const allCategoryNames = Array.from(
    new Set([
      ...Object.values(ExpenseCategory),
      ...Object.keys(categoryTotals),
      ...Object.keys(categoryBudgets),
    ])
  );
  const sortedCategories = allCategoryNames
    .map((name) => [name, categoryTotals[name] || 0] as [string, number])
    .sort((a, b) => b[1] - a[1]);

  // Overall progress bar color
  const getOverallProgressBarColor = (pct: number) => {
    if (pct > 100) return 'bg-rose-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // Category progress bar color
  const getCategoryProgressColor = (pct: number) => {
    if (pct > 100) return 'bg-rose-500 text-rose-700';
    if (pct >= 80) return 'bg-amber-500 text-amber-700';
    return 'bg-emerald-500 text-emerald-700';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-slate-900">
                {data.monthName}
              </span>
              <span className="text-sm font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                {data.year}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {data.items.length} expense entries recorded
            </p>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => downloadMonthJsonFile(data)}
              title={`Download ${data.monthName}_${data.year}.json`}
              className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(data)}
              title="Edit Month Expenses"
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(data.id)}
              title="Delete Month Record"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Spend Amount & Overall Budget Progress */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Spent
            </span>
            {budget > 0 && (
              <span className={`text-xs font-medium ${isOverBudget ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                Budget: {formatCurrency(budget)}
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(totalSpend)}
            </span>
            {budget > 0 && (
              <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border ${
                budgetPercent > 100
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : budgetPercent >= 80
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {budgetPercent > 100 && <AlertCircle className="h-3 w-3 mr-1" />}
                {budgetPercent}% of budget
              </span>
            )}
          </div>

          {budget > 0 && (
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${getOverallProgressBarColor(budgetPercent)}`}
                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Categories Breakdown Preview with per-category budgets */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Categories & Budget Progress
            </span>
            {Object.keys(categoryBudgets).length > 0 && (
              <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-1.5 py-0.5 rounded">
                Budgets active
              </span>
            )}
          </div>

          <div className="space-y-3">
            {sortedCategories.map(([catName, amount]) => {
              const colorDef = CATEGORY_COLORS[catName] || DEFAULT_CATEGORY_COLOR;
              const catBudget = categoryBudgets[catName];
              const hasBudget = catBudget !== undefined && catBudget > 0;
              const catPct = hasBudget ? Math.round((amount / catBudget) * 100) : 0;
              const statusColor = getCategoryProgressColor(catPct);

              return (
                <div key={catName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center space-x-1.5 truncate max-w-[60%]">
                      <span className={`w-2 h-2 rounded-full shrink-0`} style={{ backgroundColor: colorDef.hex }} />
                      <span className="font-medium text-slate-700 truncate">{catName}</span>
                    </span>

                    <div className="flex items-center space-x-1 font-semibold text-slate-900">
                      <span>{formatCurrency(amount)}</span>
                      {hasBudget ? (
                        <span className={`text-[10px] font-bold ${
                          catPct > 100 ? 'text-rose-600' : catPct >= 80 ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          / {formatCurrency(catBudget)} ({catPct}%)
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal text-[11px]">
                          ({totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category progress bar when limit is set */}
                  {hasBudget && (
                    <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${statusColor.split(' ')[0]}`}
                        style={{ width: `${Math.min(catPct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Note or JSON filename tag */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="inline-block bg-slate-100 text-slate-600 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-200">
            {data.monthName}_{data.year}.json
          </span>
          <button
            onClick={() => onEdit(data)}
            className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center group-hover:underline"
          >
            Manage Details &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
