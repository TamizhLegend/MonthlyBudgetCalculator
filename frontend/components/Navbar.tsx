import React from 'react';
import { ViewTab } from '../types';
import { Calendar, BarChart3, FileJson, PlusCircle, WalletCards, RefreshCw, GitCompare } from 'lucide-react';

interface NavbarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  availableYears: number[];
  onAddNewMonth: () => void;
  activeRecurringCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  selectedYear,
  onYearChange,
  availableYears,
  onAddNewMonth,
  activeRecurringCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 gap-3">
          
          {/* Logo & title */}
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <WalletCards className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                Yearly Expense Sheet
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Monthly categorized tracking & JSON records
              </p>
            </div>
          </div>

          {/* Action Center: Year Selector & Tab Switchers */}
          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
            
            {/* Year Selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-2">
                Year:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="bg-white text-sm font-bold text-slate-800 rounded-md py-1 px-3 border border-slate-300 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* View switcher tabs */}
            <nav className="flex space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto max-w-full">
              <button
                onClick={() => onTabChange('months')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  currentTab === 'months'
                    ? 'bg-white text-brand-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Monthly Sheets</span>
              </button>

              <button
                onClick={() => onTabChange('yearly')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  currentTab === 'yearly'
                    ? 'bg-white text-brand-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Yearly Analytics</span>
              </button>

              <button
                onClick={() => onTabChange('compare')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  currentTab === 'compare'
                    ? 'bg-white text-brand-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitCompare className="h-4 w-4 text-brand-600" />
                <span>Compare Years</span>
              </button>

              <button
                onClick={() => onTabChange('recurring')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
                  currentTab === 'recurring'
                    ? 'bg-white text-brand-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RefreshCw className="h-4 w-4 text-emerald-600" />
                <span>Recurring</span>
                {activeRecurringCount > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-200">
                    {activeRecurringCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onTabChange('json-hub')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  currentTab === 'json-hub'
                    ? 'bg-white text-brand-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileJson className="h-4 w-4" />
                <span className="hidden md:inline">JSON Hub</span>
              </button>
            </nav>

            {/* Quick Add Month Button */}
            <button
              onClick={onAddNewMonth}
              className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-all focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Month</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
