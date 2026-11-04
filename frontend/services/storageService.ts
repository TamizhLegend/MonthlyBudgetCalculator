import { MonthExpenseData } from '../types';

/**
 * Browser download helpers only — app data CRUD goes through the backend API.
 */

/** Downloads a single month data as a JSON file named Month_Year.json */
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

/** Exports all months as a backup JSON file (download only). */
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
