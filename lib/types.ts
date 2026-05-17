export interface SessionUser {
  id: string;
  email: string;
}

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  year: number;
  createdAt: string;
}

export type ExpenseType = 'carburante' | 'manutenzione' | 'altro';

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  carburante: 'Carburante',
  manutenzione: 'Manutenzione',
  altro: 'Altro',
};

export const EXPENSE_TYPE_ICONS: Record<ExpenseType, string> = {
  carburante: 'fuel',
  manutenzione: 'wrench',
  altro: 'document',
};

export interface Refuel {
  id: string;
  vehicleId: string;
  date: string;
  expenseType: ExpenseType;
  fuelType?: 'benzina' | 'diesel' | 'gpl' | 'metano' | 'elettrico' | null;
  liters?: number | null;
  total: number;
  odometer?: number | null;
  station?: string | null;
  notes?: string | null;
  isFull: boolean;
  createdAt: string;
}

export interface Deadline {
  id: string;
  vehicleId: string;
  title: string;
  subtitle?: string | null;
  dueDate: string;
  kind: 'assicurazione' | 'bollo' | 'revisione' | 'tagliando' | 'altro';
  amount?: number | null;
  createdAt: string;
}

export interface DashboardData {
  currentMonth: {
    total: number;
    fuel: number;
    maint: number;
    other: number;
  };
  prevMonth: {
    total: number;
  };
  avgConsumption: number | null;
  lastRefuel: Refuel | null;
  upcomingDeadlines: Deadline[];
}

export type FuelType = 'benzina' | 'diesel' | 'gpl' | 'metano' | 'elettrico';
export type DeadlineKind = 'assicurazione' | 'bollo' | 'revisione' | 'tagliando' | 'altro';
export type ThemeMode = 'notte' | 'giorno';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceHi: string;
  surfaceLo: string;
  border: string;
  borderHi: string;
  text: string;
  textSec: string;
  textTer: string;
  textInv: string;
  scrim?: string;
  ok: string;
  warn: string;
  danger: string;
  info: string;
}

export const DARK_THEME: ThemeColors = {
  bg: '#0B0F17',
  surface: '#131A26',
  surfaceHi: '#1A2332',
  surfaceLo: '#0F1521',
  border: 'rgba(255,255,255,0.06)',
  borderHi: 'rgba(255,255,255,0.10)',
  text: '#F2F4F8',
  textSec: '#9AA3B5',
  textTer: '#5E6678',
  textInv: '#0B0F17',
  scrim: 'rgba(11,15,23,0.96)',
  ok: '#4ADE80',
  warn: '#F4B740',
  danger: '#F87171',
  info: '#6FA8FF',
};

export const LIGHT_THEME: ThemeColors = {
  bg: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceHi: '#ECEFF5',
  surfaceLo: '#F8FAFC',
  border: 'rgba(15,21,33,0.07)',
  borderHi: 'rgba(15,21,33,0.13)',
  text: '#0B0F17',
  textSec: '#5A6478',
  textTer: '#98A0AE',
  textInv: '#FFFFFF',
  ok: '#16A34A',
  warn: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',
};

export const ACCENT = '#FF7A3D';

export const FUEL_COLORS: Record<FuelType, string> = {
  benzina: '#6FA8FF',
  diesel: '#F4B740',
  gpl: '#4ADE80',
  metano: '#A78BFA',
  elettrico: '#34D399',
};

export const FUEL_LABELS: Record<FuelType, string> = {
  benzina: 'Benzina',
  diesel: 'Diesel',
  gpl: 'GPL',
  metano: 'Metano',
  elettrico: 'Elettrico',
};

export const DEADLINE_LABELS: Record<DeadlineKind, string> = {
  assicurazione: 'Assicurazione',
  bollo: 'Bollo',
  revisione: 'Revisione',
  tagliando: 'Tagliando',
  altro: 'Altro',
};

export const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

// Named PushSubscriptionRecord to avoid collision with the browser built-in PushSubscription type
export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}
