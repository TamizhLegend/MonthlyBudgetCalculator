import { CategoryLimit, MonthExpenseData, RecurringExpense } from '../types';
import { API_BASE_URL } from '../config/apiConfig';

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.error === 'string') return body.error;
    if (typeof body?.message === 'string') return body.message;
  } catch {
    // ignore non-JSON error bodies
  }
  return `Request failed (${res.status})`;
}

/** Create or update a month in the database (PUT upsert). */
export async function upsertMonth(month: MonthExpenseData): Promise<MonthExpenseData> {
  const res = await fetch(`${API_BASE_URL}/months/${encodeURIComponent(month.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(month),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

export async function listMonths(): Promise<MonthExpenseData[]> {
  const res = await fetch(`${API_BASE_URL}/months`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

/** Load one month from the database by id (YYYY-MM). */
export async function getMonth(id: string): Promise<MonthExpenseData> {
  const res = await fetch(`${API_BASE_URL}/months/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

export async function deleteMonth(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/months/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
}

export async function listRecurring(): Promise<RecurringExpense[]> {
  const res = await fetch(`${API_BASE_URL}/recurring`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

/** Replace the full recurring list in the database. */
export async function saveRecurring(expenses: RecurringExpense[]): Promise<RecurringExpense[]> {
  const res = await fetch(`${API_BASE_URL}/recurring`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expenses),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

export async function listCategoryLimits(): Promise<CategoryLimit[]> {
  const res = await fetch(`${API_BASE_URL}/category-limits`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

/** Replace the full category-limits list in the database. */
export async function saveCategoryLimits(limits: CategoryLimit[]): Promise<CategoryLimit[]> {
  const res = await fetch(`${API_BASE_URL}/category-limits`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(limits),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

/** Lightweight connectivity check used by the UI boot screen. */
export async function checkApiHealth(): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) return false;
  const body = await res.json().catch(() => null);
  return body?.status === 'UP';
}
