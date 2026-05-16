import { MONTHS_IT } from './types';

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatLiters(liters: number): string {
  return `${liters.toFixed(2).replace('.', ',')} L`;
}

export function formatConsumption(lper100km: number): string {
  return `${lper100km.toFixed(1).replace('.', ',')} L/100km`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_IT[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

export function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getMonthLabel(date: Date = new Date()): string {
  return `${MONTHS_IT[date.getMonth()]} ${date.getFullYear()}`;
}

export function groupByWeek<T extends { date: string }>(items: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const d = new Date(item.date);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const key = startOfWeek.toISOString().slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

export function groupByMonth<T extends { date: string }>(items: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const d = new Date(item.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

export function getWeekLabel(isoDate: string): string {
  const start = new Date(isoDate);
  const end = new Date(isoDate);
  end.setDate(start.getDate() + 6);
  return `${start.getDate()} – ${end.getDate()} ${MONTHS_IT[end.getMonth()].slice(0, 3)}`;
}

export function getMonthKeyLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTHS_IT[parseInt(month) - 1]} ${year}`;
}
