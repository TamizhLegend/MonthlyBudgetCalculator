import React, { useState, useEffect } from 'react';
import { MonthExpenseData, RecurringExpense, ViewTab } from './types';
import { 
  loadStoredExpenses, 
  saveStoredExpenses, 
  loadStoredRecurringExpenses,
  saveStoredRecurringExpenses,
  downloadMonthJsonFile 
} from './services/storageService';
import { Navbar } from './components/Navbar';
import { MonthCard } from './components/MonthCard';
import { MonthEditorModal } from './components/MonthEditorModal';
import { YearlyAnalyticsView } from './components/YearlyAnalyticsView';
import { MultiYearComparisonView } from './components/MultiYearComparisonView';
import { RecurringManagerView } from './components/RecurringManagerView';
import { JsonHubView } from './components/JsonHubView';
import { Plus, Calendar, Sparkles, RefreshCw, GitCompare } from 'lucide-react';

export default function App() {
  const [monthsData, setMonthsData] = useState<MonthExpenseData[]>(() => loadStoredExpenses());
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => loadStoredRecurringExpenses());
  const [currentTab, setCurrentTab] = useState<ViewTab>('months');
  
  // Year filter: Default to 2025 or current year
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const years = monthsData.map((m) => m.year);
    return years.length > 0 ? Math.max(...years) : new Date().getFullYear();
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMonth, setEditingMonth] = useState<MonthExpenseData | null>(null);

  // Sync to local storage whenever monthsData changes
  useEffect(() => {
    saveStoredExpenses(monthsData);
  }, [monthsData]);

  // Sync recurring expenses
  useEffect(() => {
    saveStoredRecurringExpenses(recurringExpenses);
  }, [recurringExpenses]);

  // Derived available years list
  const availableYears = Array.from(
    new Set([...monthsData.map((m) => m.year), new Date().getFullYear(), 2024, 2025])
  ).sort((a, b) => b - a);

  // Filter months for the selected year and sort by month index
  const filteredMonths = monthsData
    .filter((m) => m.year === selectedYear)
    .sort((a, b) => a.month - b.month);

  const existingMonthIds = monthsData.map((m) => m.id);
  const activeRecurringCount = recurringExpenses.filter((it) => it.isActive).length;

  // Handlers
  const handleAddNewMonth = () => {
    setEditingMonth(null);
    setIsModalOpen(true);
  };

  const handleEditMonth = (month: MonthExpenseData) => {
    setEditingMonth(month);
    setIsModalOpen(true);
  };

  const handleDeleteMonth = (id: string) => {
    const target = monthsData.find((m) => m.id === id);
    if (!target) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the expense record for ${target.monthName} ${target.year}?`
    );
    if (confirmDelete) {
      setMonthsData((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleSaveMonth = (saved: MonthExpenseData) => {
    setMonthsData((prev) => {
      const idx = prev.findIndex((m) => m.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });

    if (saved.year !== selectedYear) {
      setSelectedYear(saved.year);
    }
  };

  const handleImportSingleMonth = (imported: MonthExpenseData) => {
    handleSaveMonth(imported);
  };

  const handleImportAllBackup = (importedList: MonthExpenseData[]) => {
    setMonthsData(importedList);
    if (importedList.length > 0) {
      setSelectedYear(importedList[0].year);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        availableYears={availableYears}
        onAddNewMonth={handleAddNewMonth}
        activeRecurringCount={activeRecurringCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tab 1: Monthly Expense Sheets */}
        {currentTab === 'months' && (
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {selectedYear} Monthly Expense Sheets
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Manage categorized expenses by month and generate individual <span className="font-mono text-xs bg-slate-200 px-1 py-0.5 rounded text-slate-800">Month_Year.json</span> files.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentTab('compare')}
                  className="flex items-center space-x-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-xs"
                >
                  <GitCompare className="h-4 w-4 text-brand-600" />
                  <span>Compare Years</span>
                </button>

                <button
                  onClick={() => setCurrentTab('recurring')}
                  className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-xs"
                >
                  <RefreshCw className="h-4 w-4 text-emerald-600" />
                  <span>Manage Recurring ({activeRecurringCount})</span>
                </button>

                <button
                  onClick={handleAddNewMonth}
                  className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-xs transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Month Sheet</span>
                </button>
              </div>
            </div>

            {/* Months Grid */}
            {filteredMonths.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  No monthly sheets for {selectedYear}
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
                  Click the button below to add your first month for {selectedYear}. You can log expenses across entertainment, food, utilities, clothing, medical, and more, or autofill recurring items.
                </p>
                <button
                  onClick={handleAddNewMonth}
                  className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create {selectedYear} Month Expense Sheet</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMonths.map((m) => (
                  <MonthCard
                    key={m.id}
                    data={m}
                    onEdit={handleEditMonth}
                    onDelete={handleDeleteMonth}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Yearly Analytics Dashboard */}
        {currentTab === 'yearly' && (
          <YearlyAnalyticsView
            selectedYear={selectedYear}
            availableYears={availableYears}
            onYearChange={setSelectedYear}
            monthsData={monthsData}
            onSelectMonthForEdit={handleEditMonth}
          />
        )}

        {/* Tab 3: Multi-Year Comparison */}
        {currentTab === 'compare' && (
          <MultiYearComparisonView
            monthsData={monthsData}
            availableYears={availableYears}
            onAddNewMonthForYear={(yr) => {
              setSelectedYear(yr);
              handleAddNewMonth();
            }}
          />
        )}

        {/* Tab 4: Recurring Expenses Manager */}
        {currentTab === 'recurring' && (
          <RecurringManagerView
            recurringExpenses={recurringExpenses}
            onSaveRecurring={setRecurringExpenses}
            onOpenCreateMonthWithAutofill={handleAddNewMonth}
          />
        )}

        {/* Tab 5: JSON Hub & Backup Center */}
        {currentTab === 'json-hub' && (
          <JsonHubView
            monthsData={monthsData}
            onImportData={handleImportSingleMonth}
            onImportAllBackup={handleImportAllBackup}
          />
        )}

      </main>

      {/* Month Editor Modal */}
      <MonthEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingMonth}
        selectedYear={selectedYear}
        onSave={handleSaveMonth}
        existingMonthIds={existingMonthIds}
        recurringExpenses={recurringExpenses}
        onOpenRecurringManager={() => {
          setIsModalOpen(false);
          setCurrentTab('recurring');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          Yearly Expense Sheet Calculator &bull; Auto-saves locally to browser &bull; Standalone Month_Year.json file exporter &bull; Multi-Year YoY Comparison
        </div>
      </footer>
    </div>
  );
}
