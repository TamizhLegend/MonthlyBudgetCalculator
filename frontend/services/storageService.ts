import { MonthExpenseData, RecurringExpense } from '../types';
import { INITIAL_DATA, INITIAL_RECURRING_EXPENSES } from '../constants';

const STORAGE_KEY = 'yearly_expense_calculator_v1';
const RECURRING_STORAGE_KEY = 'yearly_expense_recurring_v1';

export const loadStoredExpenses = (): MonthExpenseData[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveStoredExpenses(INITIAL_DATA);
      return INITIAL_DATA;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DATA;
  } catch (err) {
    console.error('Failed to load local expenses:', err);
    return INITIAL_DATA;
  }
};

export const saveStoredExpenses = (data: MonthExpenseData[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save expenses:', err);
  }
};

export const loadStoredRecurringExpenses = (): RecurringExpense[] => {
  try {
    const raw = localStorage.getItem(RECURRING_STORAGE_KEY);
    if (!raw) {
      saveStoredRecurringExpenses(INITIAL_RECURRING_EXPENSES);
      return INITIAL_RECURRING_EXPENSES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_RECURRING_EXPENSES;
  } catch (err) {
    console.error('Failed to load recurring expenses:', err);
    return INITIAL_RECURRING_EXPENSES;
  }
};

export const saveStoredRecurringExpenses = (data: RecurringExpense[]): void => {
  try {
    localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save recurring expenses:', err);
  }
};

/**
 * Downloads a single month data as a JSON file named Month_Year.json
 * e.g., "January_2025.json"
 */
export const downloadMonthJsonFile = (monthData: MonthExpenseData): void => {
  const fileName = `${monthData.monthName}_${monthData.year}.json`;
  const jsonContent = JSON.stringify(monthData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports all data backup as a zip/master JSON
 */
export const downloadAllDataBackup = (data: MonthExpenseData[]): void => {
  const fileName = `Expense_Backup_All_${new Date().toISOString().slice(0, 10)}.json`;
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
