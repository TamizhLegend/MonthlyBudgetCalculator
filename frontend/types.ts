export enum ExpenseCategory {
  ENTERTAINMENT = 'Entertainment',
  FOOD = 'Food & Groceries',
  UTILITY = 'Utility & Bills',
  DRESS = 'Dress & Apparel',
  NEW_ITEMS = 'New Items & Gadgets',
  BABY_NEEDS = 'Baby Needs & Kids',
  MEDICAL = 'Medical & Health',
  OTHER = 'Other Expenses'
}

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD format
  category: ExpenseCategory | string;
  amount: number;
  description: string;
}

export interface MonthExpenseData {
  id: string; // e.g., "2025-01"
  year: number;
  month: number; // 1 to 12
  monthName: string; // e.g., "January"
  budget?: number; // Overall monthly budget
  categoryBudgets?: Record<string, number>; // Optional budget limit per category
  items: ExpenseItem[];
  notes?: string;
  lastUpdated: string;
}

export interface RecurringExpense {
  id: string;
  name: string; // e.g. "Apartment Rent", "Netflix & Spotify", "Gym Membership"
  category: ExpenseCategory | string;
  amount: number;
  dayOfMonth: number; // 1 to 31
  description?: string;
  isActive: boolean;
}

/** Global default budget ceiling for a category — applied to monthly sheets on demand. */
export interface CategoryLimit {
  id: string;
  category: ExpenseCategory | string;
  budgetLimit: number;
  isActive: boolean;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  percentage: number;
  color: string;
  budgetLimit?: number;
}

export type ViewTab = 'months' | 'yearly' | 'compare' | 'recurring' | 'limits' | 'json-hub';
