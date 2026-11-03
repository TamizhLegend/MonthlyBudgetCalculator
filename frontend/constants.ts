import { ExpenseCategory, MonthExpenseData, RecurringExpense } from './types';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  [ExpenseCategory.ENTERTAINMENT]: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', hex: '#a855f7' },
  [ExpenseCategory.FOOD]: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', hex: '#f59e0b' },
  [ExpenseCategory.UTILITY]: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', hex: '#3b82f6' },
  [ExpenseCategory.DRESS]: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', hex: '#f43f5e' },
  [ExpenseCategory.NEW_ITEMS]: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', hex: '#14b8a6' },
  [ExpenseCategory.BABY_NEEDS]: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', hex: '#ec4899' },
  [ExpenseCategory.MEDICAL]: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', hex: '#10b981' },
  [ExpenseCategory.OTHER]: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', hex: '#64748b' },
};

export const DEFAULT_CATEGORY_COLOR = { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', hex: '#6366f1' };

// Distinct palette for differentiating compared years
export const YEAR_PALETTES = [
  { stroke: '#4f46e5', fill: '#4f46e5', light: 'bg-indigo-50 border-indigo-200 text-indigo-700' }, // Year 1 (Indigo)
  { stroke: '#0d9488', fill: '#0d9488', light: 'bg-teal-50 border-teal-200 text-teal-700' },       // Year 2 (Teal)
  { stroke: '#ea580c', fill: '#ea580c', light: 'bg-orange-50 border-orange-200 text-orange-700' },   // Year 3 (Orange)
  { stroke: '#8b5cf6', fill: '#8b5cf6', light: 'bg-purple-50 border-purple-200 text-purple-700' },   // Year 4 (Purple)
  { stroke: '#0284c7', fill: '#0284c7', light: 'bg-sky-50 border-sky-200 text-sky-700' },          // Year 5 (Sky)
];

export const INITIAL_RECURRING_EXPENSES: RecurringExpense[] = [
  {
    id: 'rec-1',
    name: 'Home Rent / Mortgage',
    category: ExpenseCategory.UTILITY,
    amount: 1450.00,
    dayOfMonth: 1,
    description: 'Monthly residential lease payment',
    isActive: true,
  },
  {
    id: 'rec-2',
    name: 'High-speed Fiber Internet & Mobile',
    category: ExpenseCategory.UTILITY,
    amount: 110.00,
    dayOfMonth: 5,
    description: 'Home wifi and family unlimited mobile plan',
    isActive: true,
  },
  {
    id: 'rec-3',
    name: 'Streaming & Music Subscriptions',
    category: ExpenseCategory.ENTERTAINMENT,
    amount: 34.99,
    dayOfMonth: 10,
    description: 'Netflix, Spotify & Disney+ bundle',
    isActive: true,
  },
  {
    id: 'rec-4',
    name: 'Health & Dental Insurance Premium',
    category: ExpenseCategory.MEDICAL,
    amount: 175.00,
    dayOfMonth: 15,
    description: 'Family supplementary health care plan',
    isActive: true,
  },
  {
    id: 'rec-5',
    name: 'Fitness & Gym Membership',
    category: ExpenseCategory.OTHER,
    amount: 45.00,
    dayOfMonth: 18,
    description: 'Monthly health club access',
    isActive: true,
  }
];

export const INITIAL_DATA: MonthExpenseData[] = [
  // 2024 Records (for comparative analysis)
  {
    id: '2024-01',
    year: 2024,
    month: 1,
    monthName: 'January',
    budget: 3000,
    categoryBudgets: {
      [ExpenseCategory.FOOD]: 450,
      [ExpenseCategory.UTILITY]: 1550,
      [ExpenseCategory.DRESS]: 150,
      [ExpenseCategory.MEDICAL]: 150,
      [ExpenseCategory.ENTERTAINMENT]: 80,
    },
    lastUpdated: '2024-01-31T20:00:00.000Z',
    notes: '2024 winter expenses',
    items: [
      { id: 'item-24-1', date: '2024-01-01', category: ExpenseCategory.UTILITY, amount: 1350.00, description: '2024 Rent' },
      { id: 'item-24-2', date: '2024-01-05', category: ExpenseCategory.FOOD, amount: 210.00, description: 'Supermarket Groceries' },
      { id: 'item-24-3', date: '2024-01-10', category: ExpenseCategory.UTILITY, amount: 95.00, description: 'Home Internet' },
      { id: 'item-24-4', date: '2024-01-15', category: ExpenseCategory.DRESS, amount: 110.00, description: 'Winter sweaters' },
      { id: 'item-24-5', date: '2024-01-20', category: ExpenseCategory.MEDICAL, amount: 85.00, description: 'Pharmacy prescriptions' },
      { id: 'item-24-6', date: '2024-01-25', category: ExpenseCategory.ENTERTAINMENT, amount: 65.00, description: 'Cinema & Concert' }
    ]
  },
  {
    id: '2024-02',
    year: 2024,
    month: 2,
    monthName: 'February',
    budget: 2900,
    categoryBudgets: {
      [ExpenseCategory.FOOD]: 400,
      [ExpenseCategory.UTILITY]: 1500,
      [ExpenseCategory.ENTERTAINMENT]: 100,
    },
    lastUpdated: '2024-02-28T20:00:00.000Z',
    notes: 'February 2024',
    items: [
      { id: 'item-24-7', date: '2024-02-01', category: ExpenseCategory.UTILITY, amount: 1350.00, description: 'Rent' },
      { id: 'item-24-8', date: '2024-02-06', category: ExpenseCategory.FOOD, amount: 260.00, description: 'Groceries' },
      { id: 'item-24-9', date: '2024-02-14', category: ExpenseCategory.ENTERTAINMENT, amount: 90.00, description: 'Valentine dinner' },
      { id: 'item-24-10', date: '2024-02-22', category: ExpenseCategory.UTILITY, amount: 120.00, description: 'Electric & Heating' }
    ]
  },
  {
    id: '2024-03',
    year: 2024,
    month: 3,
    monthName: 'March',
    budget: 3100,
    categoryBudgets: {
      [ExpenseCategory.FOOD]: 450,
      [ExpenseCategory.UTILITY]: 1500,
      [ExpenseCategory.NEW_ITEMS]: 180,
    },
    lastUpdated: '2024-03-31T20:00:00.000Z',
    notes: 'March 2024 spring start',
    items: [
      { id: 'item-24-11', date: '2024-03-01', category: ExpenseCategory.UTILITY, amount: 1350.00, description: 'Rent' },
      { id: 'item-24-12', date: '2024-03-08', category: ExpenseCategory.FOOD, amount: 240.00, description: 'Weekly groceries' },
      { id: 'item-24-13', date: '2024-03-15', category: ExpenseCategory.NEW_ITEMS, amount: 160.00, description: 'Desk chair cushion & organizers' },
      { id: 'item-24-14', date: '2024-03-22', category: ExpenseCategory.UTILITY, amount: 105.00, description: 'Gas and water' }
    ]
  },

  // 2025 Records
  {
    id: '2025-01',
    year: 2025,
    month: 1,
    monthName: 'January',
    budget: 3500,
    categoryBudgets: {
      [ExpenseCategory.FOOD]: 500,
      [ExpenseCategory.UTILITY]: 1700,
      [ExpenseCategory.DRESS]: 180,
      [ExpenseCategory.BABY_NEEDS]: 120,
      [ExpenseCategory.ENTERTAINMENT]: 100,
      [ExpenseCategory.MEDICAL]: 250,
      [ExpenseCategory.NEW_ITEMS]: 150,
    },
    lastUpdated: new Date().toISOString(),
    notes: 'New Year kick-off, bought winter clothing & stocked pantry',
    items: [
      { id: 'item-1', date: '2025-01-01', category: ExpenseCategory.UTILITY, amount: 1450.00, description: 'Home Rent / Mortgage' },
      { id: 'item-2', date: '2025-01-02', category: ExpenseCategory.FOOD, amount: 245.50, description: 'Supermarket bulk grocery trip' },
      { id: 'item-3', date: '2025-01-05', category: ExpenseCategory.UTILITY, amount: 110.00, description: 'High-speed Fiber Internet & Mobile' },
      { id: 'item-4', date: '2025-01-10', category: ExpenseCategory.DRESS, amount: 160.00, description: 'Winter coats and thermals' },
      { id: 'item-5', date: '2025-01-10', category: ExpenseCategory.ENTERTAINMENT, amount: 34.99, description: 'Streaming & Music Subscriptions' },
      { id: 'item-6', date: '2025-01-15', category: ExpenseCategory.MEDICAL, amount: 175.00, description: 'Health & Dental Insurance Premium' },
      { id: 'item-7', date: '2025-01-15', category: ExpenseCategory.BABY_NEEDS, amount: 95.00, description: 'Diapers, wipes and baby formula' },
      { id: 'item-8', date: '2025-01-26', category: ExpenseCategory.NEW_ITEMS, amount: 129.99, description: 'Smart desk lamp and humidifier' },
      { id: 'item-9', date: '2025-01-29', category: ExpenseCategory.FOOD, amount: 185.20, description: 'Farmers market & weekly dining' }
    ]
  },
  {
    id: '2025-02',
    year: 2025,
    month: 2,
    monthName: 'February',
    budget: 3200,
    categoryBudgets: {
      [ExpenseCategory.UTILITY]: 1700,
      [ExpenseCategory.ENTERTAINMENT]: 180,
      [ExpenseCategory.MEDICAL]: 300,
      [ExpenseCategory.BABY_NEEDS]: 150,
      [ExpenseCategory.FOOD]: 450,
    },
    lastUpdated: new Date().toISOString(),
    notes: 'Valentine celebration & medical checkups',
    items: [
      { id: 'item-10', date: '2025-02-01', category: ExpenseCategory.UTILITY, amount: 1450.00, description: 'Home Rent / Mortgage' },
      { id: 'item-11', date: '2025-02-05', category: ExpenseCategory.UTILITY, amount: 110.00, description: 'High-speed Fiber Internet & Mobile' },
      { id: 'item-12', date: '2025-02-10', category: ExpenseCategory.ENTERTAINMENT, amount: 34.99, description: 'Streaming & Music Subscriptions' },
      { id: 'item-13', date: '2025-02-14', category: ExpenseCategory.ENTERTAINMENT, amount: 135.00, description: 'Valentine dinner and movie' },
      { id: 'item-14', date: '2025-02-15', category: ExpenseCategory.MEDICAL, amount: 175.00, description: 'Health & Dental Insurance Premium' },
      { id: 'item-15', date: '2025-02-18', category: ExpenseCategory.MEDICAL, amount: 140.00, description: 'Dental cleaning & checkup' },
      { id: 'item-16', date: '2025-02-21', category: ExpenseCategory.BABY_NEEDS, amount: 110.00, description: 'Baby cot bedding & clothes' },
      { id: 'item-17', date: '2025-02-24', category: ExpenseCategory.FOOD, amount: 310.40, description: 'Monthly organic food delivery' }
    ]
  },
  {
    id: '2025-03',
    year: 2025,
    month: 3,
    monthName: 'March',
    budget: 3200,
    categoryBudgets: {
      [ExpenseCategory.FOOD]: 350,
      [ExpenseCategory.NEW_ITEMS]: 250,
      [ExpenseCategory.UTILITY]: 1700,
      [ExpenseCategory.DRESS]: 120,
    },
    lastUpdated: new Date().toISOString(),
    notes: 'Spring transition',
    items: [
      { id: 'item-18', date: '2025-03-01', category: ExpenseCategory.UTILITY, amount: 1450.00, description: 'Home Rent / Mortgage' },
      { id: 'item-19', date: '2025-03-02', category: ExpenseCategory.FOOD, amount: 280.00, description: 'Weekly Groceries' },
      { id: 'item-20', date: '2025-03-05', category: ExpenseCategory.UTILITY, amount: 110.00, description: 'High-speed Fiber Internet & Mobile' },
      { id: 'item-21', date: '2025-03-08', category: ExpenseCategory.NEW_ITEMS, amount: 240.00, description: 'Air Purifier replacement filter & unit' },
      { id: 'item-22', date: '2025-03-20', category: ExpenseCategory.DRESS, amount: 89.00, description: 'Casual shoes' }
    ]
  }
];
