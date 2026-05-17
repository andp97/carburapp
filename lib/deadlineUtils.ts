import type { DeadlineKind, ExpenseType } from '@/lib/types';

export function deadlineKindToExpenseType(kind: DeadlineKind): ExpenseType {
  if (kind === 'tagliando' || kind === 'revisione') return 'manutenzione';
  return 'altro';
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function isApproaching(dueDate: Date): boolean {
  const ms = dueDate.getTime() - Date.now();
  return ms >= 0 && ms <= SEVEN_DAYS_MS;
}

export function isExpired(dueDate: Date): boolean {
  return dueDate.getTime() < Date.now();
}
