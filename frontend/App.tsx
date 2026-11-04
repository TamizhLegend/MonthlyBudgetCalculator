import React, { useState, useEffect, useCallback } from 'react';
import { AuthLoading, RedirectToSignIn, SignedIn } from '@neondatabase/neon-js/auth/react/ui';
import { CategoryLimit, MonthExpenseData, RecurringExpense, ViewTab } from './types';
import {
  upsertMonth,
  listMonths,
  getMonth,
  deleteMonth as deleteMonthApi,
  listRecurring,
  saveRecurring,
  listCategoryLimits,
  saveCategoryLimits,
  checkApiHealth,
} from './services/monthApi';
import { API_BASE_URL, BACKEND_ORIGIN, SWAGGER_UI_URL } from './config/apiConfig';
import { Navbar } from './components/Navbar';
import { MonthCard } from './components/MonthCard';
import { MonthEditorModal } from './components/MonthEditorModal';
import { YearlyAnalyticsView } from './components/YearlyAnalyticsView';
import { MultiYearComparisonView } from './components/MultiYearComparisonView';
import { RecurringManagerView } from './components/RecurringManagerView';
import { CategoryLimitsManagerView } from './components/CategoryLimitsManagerView';
import { JsonHubView } from './components/JsonHubView';
import { Plus, Calendar, RefreshCw, GitCompare, AlertCircle, ExternalLink, Sliders } from 'lucide-react';

function AppShell() {
  const [monthsData, setMonthsData] = useState<MonthExpenseData[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>([]);
  const [currentTab, setCurrentTab] = useState<ViewTab>('months');
  const [apiReady, setApiReady] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMonth, setEditingMonth] = useState<MonthExpenseData | null>(null);
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);

  const refreshFromDatabase = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsRefreshing(true);
    try {
      const healthy = await checkApiHealth();
      if (!healthy) {
        throw new Error(`Backend health check failed (${BACKEND_ORIGIN}/api/v1/health).`);
      }
      const [months, recurring, limits] = await Promise.all([
        listMonths(),
        listRecurring(),
        listCategoryLimits(),
      ]);
      setMonthsData(Array.isArray(months) ? months : []);
      setRecurringExpenses(Array.isArray(recurring) ? recurring : []);
      setCategoryLimits(Array.isArray(limits) ? limits : []);
      setApiReady(true);
      setApiError(null);
      if (months.length > 0) {
        setSelectedYear((prev) => {
          const years = months.map((m) => m.year);
          return years.includes(prev) ? prev : Math.max(...years);
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reach the backend API.';
      setApiReady(false);
      setApiError(message);
      throw err;
    } finally {
      setIsRefreshing(false);
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    refreshFromDatabase().catch(() => {
      /* error state set inside */
    });
  }, [refreshFromDatabase]);

  const availableYears = Array.from(
    new Set([...monthsData.map((m) => m.year), new Date().getFullYear(), 2024, 2025])
  ).sort((a, b) => b - a);

  const filteredMonths = monthsData
    .filter((m) => m.year === selectedYear)
    .sort((a, b) => a.month - b.month);

  const existingMonthIds = monthsData.map((m) => m.id);
  const activeRecurringCount = recurringExpenses.filter((it) => it.isActive).length;
  const activeCategoryLimitsCount = categoryLimits.filter((it) => it.isActive).length;

  const applyMonthLocally = (saved: MonthExpenseData) => {
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

  const handleAddNewMonth = () => {
    if (!apiReady) {
      window.alert('Backend is unavailable. Start the API server to add months.');
      return;
    }
    setEditingMonth(null);
    setIsModalOpen(true);
  };

  /** Edit / Manage Details — always load fresh row from the database. */
  const handleEditMonth = async (month: MonthExpenseData) => {
    if (!apiReady) {
      window.alert('Backend is unavailable. Cannot load month from the database.');
      return;
    }
    setIsLoadingMonth(true);
    try {
      const fresh = await getMonth(month.id);
      setEditingMonth(fresh);
      applyMonthLocally(fresh);
      setIsModalOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load month from database.';
      window.alert(message);
    } finally {
      setIsLoadingMonth(false);
    }
  };

  const handleDeleteMonth = async (id: string) => {
    const target = monthsData.find((m) => m.id === id);
    if (!target) return;
    if (!apiReady) {
      window.alert('Backend is unavailable. Cannot delete from the database.');
      return;
    }
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the expense record for ${target.monthName} ${target.year}?`
    );
    if (!confirmDelete) return;

    try {
      await deleteMonthApi(id);
      setMonthsData((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete from database.';
      window.alert(message);
    }
  };

  /** Create/update month in DB only. */
  const handleSaveMonth = async (saved: MonthExpenseData) => {
    const persisted = await upsertMonth(saved);
    applyMonthLocally(persisted);
  };

  const handleImportSingleMonth = async (imported: MonthExpenseData) => {
    await handleSaveMonth(imported);
  };

  const handleImportAllBackup = async (importedList: MonthExpenseData[]) => {
    if (!apiReady) {
      window.alert('Backend is unavailable. Cannot import into the database.');
      return;
    }
    try {
      for (const month of importedList) {
        await upsertMonth(month);
      }
      await refreshFromDatabase({ silent: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import backup into database.';
      window.alert(message);
    }
  };

  /** Persist recurring list to DB, then update UI from API response. */
  const handleSaveRecurring = async (updated: RecurringExpense[]) => {
    if (!apiReady) {
      window.alert('Backend is unavailable. Cannot save recurring expenses.');
      throw new Error('Backend unavailable');
    }
    const persisted = await saveRecurring(updated);
    setRecurringExpenses(persisted);
  };

  /** Persist category limits list to DB, then update UI from API response. */
  const handleSaveCategoryLimits = async (updated: CategoryLimit[]) => {
    if (!apiReady) {
      window.alert('Backend is unavailable. Cannot save category limits.');
      throw new Error('Backend unavailable');
    }
    const persisted = await saveCategoryLimits(updated);
    setCategoryLimits(persisted);
  };

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-sm">
          <RefreshCw className="h-5 w-5 text-brand-600 animate-spin" />
          <div>
            <p className="text-sm font-semibold">Connecting to database…</p>
            <p className="text-xs text-slate-500">Loading months from the backend API</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        availableYears={availableYears}
        onAddNewMonth={handleAddNewMonth}
        activeRecurringCount={activeRecurringCount}
        activeCategoryLimitsCount={activeCategoryLimitsCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {apiError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Database / API unavailable</p>
              <p className="text-xs mt-0.5 opacity-90">{apiError}</p>
              <p className="text-xs mt-1">
                Start backend with <code className="bg-rose-100 px-1 rounded">./gradlew bootRun</code> in{' '}
                <code className="bg-rose-100 px-1 rounded">backend-java</code>, then retry.
                API base: <code className="bg-rose-100 px-1 rounded">{API_BASE_URL}</code>
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => refreshFromDatabase().catch(() => undefined)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-100"
              >
                Retry
              </button>
              <a
                href={SWAGGER_UI_URL}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-100 text-center"
              >
                Open Swagger
              </a>
            </div>
          </div>
        )}

        {currentTab === 'months' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {selectedYear} Monthly Expense Sheets
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  All create / read / update / delete operations go through the PostgreSQL backend.
                </p>
              </div>

              <div className="flex items-center space-x-2 flex-wrap">
                <button
                  onClick={() => refreshFromDatabase().catch(() => undefined)}
                  disabled={isRefreshing}
                  className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors"
                  title="Reload from database"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

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
                  onClick={() => setCurrentTab('limits')}
                  className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-xs"
                >
                  <Sliders className="h-4 w-4 text-amber-600" />
                  <span>Manage Limits ({activeCategoryLimitsCount})</span>
                </button>

                <button
                  onClick={handleAddNewMonth}
                  disabled={!apiReady}
                  className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-xs transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Month Sheet</span>
                </button>
              </div>
            </div>

            {filteredMonths.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  No monthly sheets for {selectedYear}
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
                  {apiReady
                    ? `Click below to create the first ${selectedYear} month in the database.`
                    : 'Connect to the backend to load or create months.'}
                </p>
                <button
                  onClick={handleAddNewMonth}
                  disabled={!apiReady}
                  className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-colors"
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

        {currentTab === 'yearly' && (
          <YearlyAnalyticsView
            selectedYear={selectedYear}
            availableYears={availableYears}
            onYearChange={setSelectedYear}
            monthsData={monthsData}
            onSelectMonthForEdit={handleEditMonth}
          />
        )}

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

        {currentTab === 'recurring' && (
          <RecurringManagerView
            recurringExpenses={recurringExpenses}
            onSaveRecurring={handleSaveRecurring}
            onOpenCreateMonthWithAutofill={handleAddNewMonth}
          />
        )}

        {currentTab === 'limits' && (
          <CategoryLimitsManagerView
            categoryLimits={categoryLimits}
            onSaveCategoryLimits={handleSaveCategoryLimits}
            onOpenCreateMonthWithLimits={handleAddNewMonth}
          />
        )}

        {currentTab === 'json-hub' && (
          <JsonHubView
            monthsData={monthsData}
            onImportData={handleImportSingleMonth}
            onImportAllBackup={handleImportAllBackup}
          />
        )}
      </main>

      {isLoadingMonth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px]">
          <div className="bg-white rounded-2xl shadow-xl px-6 py-5 flex items-center gap-3 border border-slate-200">
            <RefreshCw className="h-5 w-5 text-brand-600 animate-spin" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Loading month details…</p>
              <p className="text-xs text-slate-500">Retrieving from database</p>
            </div>
          </div>
        </div>
      )}

      <MonthEditorModal
        key={editingMonth ? `${editingMonth.id}-${editingMonth.lastUpdated ?? ''}` : 'new-month'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingMonth}
        selectedYear={selectedYear}
        onSave={handleSaveMonth}
        existingMonthIds={existingMonthIds}
        recurringExpenses={recurringExpenses}
        categoryLimits={categoryLimits}
        onOpenRecurringManager={() => {
          setIsModalOpen(false);
          setCurrentTab('recurring');
        }}
        onOpenCategoryLimitsManager={() => {
          setIsModalOpen(false);
          setCurrentTab('limits');
        }}
      />

      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-slate-400">
          <span>
            Yearly Expense Sheet &bull;{' '}
            {apiReady ? `API connected (${API_BASE_URL})` : 'API offline — CRUD disabled'}
          </span>
          <span className="hidden sm:inline">&bull;</span>
          <a
            href={SWAGGER_UI_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 font-medium"
          >
            Swagger UI <ExternalLink className="h-3 w-3" />
          </a>
          <span className="hidden sm:inline">&bull;</span>
          <a
            href={BACKEND_ORIGIN}
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-600"
          >
            {BACKEND_ORIGIN}
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-sm">
            <RefreshCw className="h-5 w-5 text-brand-600 animate-spin" />
            <div>
              <p className="text-sm font-semibold">Checking session…</p>
              <p className="text-xs text-slate-500">Neon Auth</p>
            </div>
          </div>
        </div>
      </AuthLoading>
      <SignedIn>
        <AppShell />
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}
