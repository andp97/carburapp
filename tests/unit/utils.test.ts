import { describe, it, expect } from 'vitest';
import {
  formatEuro,
  formatLiters,
  formatConsumption,
  getDaysUntil,
  groupByMonth,
  groupByWeek,
} from '../../lib/utils';

describe('formatEuro', () => {
  it('formats zero correctly', () => {
    const result = formatEuro(0);
    expect(result).toMatch(/0,00/);
  });

  it('formats large number with correct value and euro symbol', () => {
    const result = formatEuro(1234.5);
    expect(result).toContain('€');
    // Thousands separator is locale/ICU-dependent in test environments
    expect(result).toMatch(/1[.,\s]?234/);
  });

  it('includes euro symbol', () => {
    const result = formatEuro(10);
    expect(result).toContain('€');
  });
});

describe('formatLiters', () => {
  it('formats liters with comma decimal and L suffix', () => {
    expect(formatLiters(30.5)).toBe('30,50 L');
  });

  it('formats whole numbers with two decimal places', () => {
    expect(formatLiters(10)).toBe('10,00 L');
  });
});

describe('formatConsumption', () => {
  it('formats consumption with comma and L/100km suffix', () => {
    expect(formatConsumption(6.5)).toBe('6,5 L/100km');
  });

  it('formats whole number consumption', () => {
    expect(formatConsumption(7)).toBe('7,0 L/100km');
  });
});

describe('getDaysUntil', () => {
  it('returns 1 for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    expect(getDaysUntil(dateStr)).toBe(1);
  });

  it('returns -1 for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);
    expect(getDaysUntil(dateStr)).toBe(-1);
  });

  it('returns 0 for today', () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    expect(getDaysUntil(dateStr)).toBe(0);
  });
});

describe('groupByMonth', () => {
  it('groups two items with same month together', () => {
    const items = [
      { date: '2024-03-10' },
      { date: '2024-03-25' },
    ];
    const result = groupByMonth(items);
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['2024-03']).toHaveLength(2);
  });

  it('groups items from different months separately', () => {
    const items = [
      { date: '2024-03-10' },
      { date: '2024-04-01' },
    ];
    const result = groupByMonth(items);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result['2024-03']).toHaveLength(1);
    expect(result['2024-04']).toHaveLength(1);
  });

  it('returns empty object for empty array', () => {
    expect(groupByMonth([])).toEqual({});
  });
});

describe('groupByWeek', () => {
  it('groups items in the same week together', () => {
    // Monday and Wednesday of the same week (2024-03-11 to 2024-03-17)
    const items = [
      { date: '2024-03-11' }, // Monday
      { date: '2024-03-13' }, // Wednesday
    ];
    const result = groupByWeek(items);
    expect(Object.keys(result)).toHaveLength(1);
    const keys = Object.keys(result);
    expect(result[keys[0]]).toHaveLength(2);
  });

  it('groups items in different weeks separately', () => {
    const items = [
      { date: '2024-03-11' }, // week of 2024-03-10
      { date: '2024-03-18' }, // week of 2024-03-17
    ];
    const result = groupByWeek(items);
    expect(Object.keys(result)).toHaveLength(2);
  });

  it('returns empty object for empty array', () => {
    expect(groupByWeek([])).toEqual({});
  });
});
