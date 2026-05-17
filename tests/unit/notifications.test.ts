import { describe, it, expect } from 'vitest';
import {
  deadlineKindToExpenseType,
  isApproaching,
  isExpired,
} from '@/lib/deadlineUtils';

describe('deadlineKindToExpenseType', () => {
  it('maps tagliando to manutenzione', () => {
    expect(deadlineKindToExpenseType('tagliando')).toBe('manutenzione');
  });
  it('maps revisione to manutenzione', () => {
    expect(deadlineKindToExpenseType('revisione')).toBe('manutenzione');
  });
  it('maps assicurazione to altro', () => {
    expect(deadlineKindToExpenseType('assicurazione')).toBe('altro');
  });
  it('maps bollo to altro', () => {
    expect(deadlineKindToExpenseType('bollo')).toBe('altro');
  });
  it('maps altro to altro', () => {
    expect(deadlineKindToExpenseType('altro')).toBe('altro');
  });
});

describe('isApproaching', () => {
  it('returns true when dueDate is 3 days from now', () => {
    const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    expect(isApproaching(d)).toBe(true);
  });
  it('returns true when dueDate is exactly 7 days from now', () => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    expect(isApproaching(d)).toBe(true);
  });
  it('returns false when dueDate is 8 days from now', () => {
    const d = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
    expect(isApproaching(d)).toBe(false);
  });
  it('returns false when dueDate is in the past', () => {
    const d = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    expect(isApproaching(d)).toBe(false);
  });
});

describe('isExpired', () => {
  it('returns true when dueDate is in the past', () => {
    const d = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    expect(isExpired(d)).toBe(true);
  });
  it('returns false when dueDate is in the future', () => {
    const d = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    expect(isExpired(d)).toBe(false);
  });
});
