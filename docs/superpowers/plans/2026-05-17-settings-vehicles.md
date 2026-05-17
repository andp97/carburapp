# Settings, Vehicle Management & App Reload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Settings bottom sheet (triggered by the existing gear icon on Dashboard) that lets users manage vehicles, update their account, force a PWA reload, and delete their account.

**Architecture:** A new `Settings.tsx` component follows the exact same sheet pattern as `SheetAddFuel.tsx` (fixed overlay + slide-up panel + sub-sheets stacked on top). AppShell owns `settingsOpen` state and the vehicle list mutations; Settings receives callbacks for add/delete/select. Three new API routes handle server-side operations.

**Tech Stack:** Next.js 16 App Router, Prisma 7, iron-session, bcryptjs, React inline styles (no Tailwind)

---

## File Map

| Action | File |
|---|---|
| Create | `app/api/vehicles/[id]/route.ts` |
| Create | `app/api/user/route.ts` |
| Create | `components/screens/Settings.tsx` |
| Modify | `components/AppShell.tsx` |
| Modify | `components/screens/Dashboard.tsx` |
| Create | `tests/e2e/04-settings.spec.ts` |

---

## Task 1: Feature branch

- [ ] **Create and switch to the feature branch**

```bash
git checkout -b feature/settings-vehicles
```

- [ ] **Verify you are on the branch**

```bash
git branch --show-current
# Expected: feature/settings-vehicles
```

---

## Task 2: DELETE /api/vehicles/[id]

**Files:**
- Create: `app/api/vehicles/[id]/route.ts`

- [ ] **Create the file**

```ts
// app/api/vehicles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { id } = await params;
    const prisma = await getPrisma();

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!vehicle) return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });

    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error('DELETE /api/vehicles/[id] error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
```

- [ ] **Typecheck**

```bash
pnpm typecheck
# Expected: no errors
```

- [ ] **Commit**

```bash
git add app/api/vehicles/[id]/route.ts
git commit -m "feat(api): add DELETE /api/vehicles/[id]"
```

---

## Task 3: PUT and DELETE /api/user

**Files:**
- Create: `app/api/user/route.ts`

- [ ] **Create the file**

```ts
// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

/** PUT /api/user — update email or password. Requires currentPassword in both cases. */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await req.json();
    const { currentPassword, newEmail, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json({ error: 'Password attuale richiesta' }, { status: 400 });
    }
    if (!newEmail && !newPassword) {
      return NextResponse.json({ error: 'Nessuna modifica richiesta' }, { status: 400 });
    }

    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });

    const passwordOk = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordOk) {
      return NextResponse.json({ error: 'Password attuale non corretta' }, { status: 400 });
    }

    if (newEmail) {
      if (typeof newEmail !== 'string' || !newEmail.includes('@') || newEmail.length > 254) {
        return NextResponse.json({ error: 'Email non valida' }, { status: 400 });
      }
      const normalized = newEmail.toLowerCase().trim();
      const existing = await prisma.user.findUnique({ where: { email: normalized } });
      if (existing) {
        return NextResponse.json({ error: 'Email già in uso' }, { status: 409 });
      }
      await prisma.user.update({ where: { id: user.id }, data: { email: normalized } });
      session.user = { ...session.user, email: normalized };
      await session.save();
    }

    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return NextResponse.json({ error: 'La password deve contenere almeno 8 caratteri' }, { status: 400 });
      }
      const hash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error('PUT /api/user error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}

/** DELETE /api/user — delete account and all data. Requires password confirmation. */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await req.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password richiesta' }, { status: 400 });
    }

    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return NextResponse.json({ error: 'Password non corretta' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: user.id } });
    await session.destroy();

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error('DELETE /api/user error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
```

- [ ] **Typecheck**

```bash
pnpm typecheck
# Expected: no errors
```

- [ ] **Commit**

```bash
git add app/api/user/route.ts
git commit -m "feat(api): add PUT and DELETE /api/user"
```

---

## Task 4: Wire settings state into AppShell

**Files:**
- Modify: `components/AppShell.tsx`

- [ ] **Add settingsOpen state and vehicle mutation handlers**

Replace the existing `AppShell` function body. Changes: add `settingsOpen` state, `handleVehicleAdded`, `handleVehicleDeleted`, pass `onOpenSettings` to Dashboard, and render the Settings sheet.

```tsx
// components/AppShell.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TabBar, TabId } from './TabBar';
import { Dashboard } from './screens/Dashboard';
import { Storico } from './screens/Storico';
import { Scadenze } from './screens/Scadenze';
import { Statistiche } from './screens/Statistiche';
import { Onboarding } from './screens/Onboarding';
import { Settings } from './screens/Settings';
import { SheetAddFuel } from './SheetAddFuel';
import { Vehicle } from '@/lib/types';

export function AppShell() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('riepilogo');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (res.ok) {
        const data: Vehicle[] = await res.json();
        setVehicles(data);
        if (data.length > 0 && !selectedVehicle) {
          setSelectedVehicle(data[0]);
        }
      }
    } catch {
      // DB might not be available — show onboarding anyway but with no vehicles
    } finally {
      setLoading(false);
    }
  }, [selectedVehicle]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleOnboardingComplete = (vehicle: Vehicle) => {
    setVehicles([vehicle]);
    setSelectedVehicle(vehicle);
  };

  const handleTabChange = (tab: TabId) => {
    if (tab === 'aggiungi') {
      setSheetOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleRefuelSuccess = () => {
    setSheetOpen(false);
    setRefreshKey(k => k + 1);
  };

  const handleVehicleAdded = (vehicle: Vehicle) => {
    setVehicles(prev => [...prev, vehicle]);
    setSelectedVehicle(vehicle);
  };

  const handleVehicleDeleted = (id: string) => {
    setVehicles(prev => {
      const next = prev.filter(v => v.id !== id);
      if (selectedVehicle?.id === id) {
        setSelectedVehicle(next[0] ?? null);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 21h11M5 12h11M16 9l2.5 2.5a1.5 1.5 0 0 1 .5 1.1V17a1.5 1.5 0 0 0 3 0V8.4a1.5 1.5 0 0 0-.4-1L19 5"/>
          </svg>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'riepilogo':
        return (
          <Dashboard
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={setSelectedVehicle}
            onOpenAddFuel={() => setSheetOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onNavigate={setActiveTab}
            refreshKey={refreshKey}
          />
        );
      case 'storico':
        return (
          <Storico
            vehicle={selectedVehicle}
            onOpenAddFuel={() => setSheetOpen(true)}
            refreshKey={refreshKey}
          />
        );
      case 'scadenze':
        return <Scadenze vehicle={selectedVehicle} />;
      case 'statistiche':
        return <Statistiche vehicle={selectedVehicle} refreshKey={refreshKey} />;
      default:
        return null;
    }
  };

  return (
    <>
      <main style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
        {renderScreen()}
      </main>
      <TabBar active={activeTab} onChange={handleTabChange} />
      <SheetAddFuel
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        vehicle={selectedVehicle}
        onSuccess={handleRefuelSuccess}
      />
      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        vehicles={vehicles}
        selectedVehicle={selectedVehicle}
        onSelectVehicle={(v) => { setSelectedVehicle(v); setSettingsOpen(false); }}
        onVehicleAdded={handleVehicleAdded}
        onVehicleDeleted={handleVehicleDeleted}
      />
    </>
  );
}
```

- [ ] **Typecheck (will fail until Settings component exists — that is expected)**

```bash
pnpm typecheck 2>&1 | grep -v "Cannot find module.*Settings"
# Expected: only Settings import error, nothing else
```

- [ ] **Commit**

```bash
git add components/AppShell.tsx
git commit -m "feat: wire settings state and callbacks into AppShell"
```

---

## Task 5: Wire gear icon in Dashboard

**Files:**
- Modify: `components/screens/Dashboard.tsx`

- [ ] **Add `onOpenSettings` to the DashboardProps interface**

Find the interface (around line 17) and add the prop:

```tsx
interface DashboardProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (v: Vehicle) => void;
  onOpenAddFuel: () => void;
  onOpenSettings: () => void;
  onNavigate: (tab: TabId) => void;
  refreshKey?: number;
}
```

- [ ] **Destructure the new prop and wire the gear button**

In the function signature, add `onOpenSettings`:

```tsx
export function Dashboard({ vehicles, selectedVehicle, onSelectVehicle, onOpenAddFuel, onOpenSettings, onNavigate, refreshKey }: DashboardProps) {
```

Find the gear button (the one with `aria-label="Impostazioni"`) and add `onClick`:

```tsx
<button
  aria-label="Impostazioni"
  onClick={onOpenSettings}
  style={{
    width: 40, height: 40,
    borderRadius: '50%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}
>
  <Icon name="settings" size={18} color="var(--text-sec)" />
</button>
```

- [ ] **Typecheck**

```bash
pnpm typecheck
# Expected: no errors (Settings module still missing — expected)
```

- [ ] **Commit**

```bash
git add components/screens/Dashboard.tsx
git commit -m "feat: wire gear icon to onOpenSettings in Dashboard"
```

---

## Task 6: Settings component — shell + vehicles section

**Files:**
- Create: `components/screens/Settings.tsx`

This task creates the full component with the backdrop/sheet shell and the Vehicles section. Sub-sheets for account actions come in Task 7.

- [ ] **Create `components/screens/Settings.tsx`**

```tsx
// components/screens/Settings.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '../Icon';
import { Vehicle } from '@/lib/types';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (v: Vehicle) => void;
  onVehicleAdded: (v: Vehicle) => void;
  onVehicleDeleted: (id: string) => void;
}

type SubSheet = null | 'addVehicle' | 'editEmail' | 'changePassword' | 'deleteAccount';

// ─── Shared primitive components ────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '12px 4px 4px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: 'var(--text-ter)',
    }}>
      {children}
    </div>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface-lo)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      overflow: 'hidden',
      marginBottom: '8px',
    }}>
      {children}
    </div>
  );
}

function SettingsRow({
  children,
  onClick,
  danger,
  noBorder,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  noBorder?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        borderBottom: noBorder ? 'none' : '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
        color: danger ? 'var(--danger)' : 'var(--text)',
        gap: '12px',
      }}
    >
      {children}
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div style={{
      background: 'rgba(248,113,113,0.1)',
      border: '1px solid rgba(248,113,113,0.25)',
      borderRadius: '10px',
      padding: '10px 12px',
      fontSize: '13px',
      color: 'var(--danger)',
      marginTop: '8px',
    }}>
      {message}
    </div>
  );
}

function SubSheetShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Handle */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-hi)' }} />
      </div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px 8px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--accent)',
            fontSize: '15px',
            fontWeight: 600,
            fontFamily: 'var(--font-ui)',
            padding: 0,
          }}
        >
          ← Indietro
        </button>
        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{title}</span>
        <div style={{ width: 70 }} />
      </div>
      {/* Body */}
      <div style={{ padding: '16px 20px 24px' }}>
        {children}
      </div>
    </>
  );
}

function FormInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-ter)',
        marginBottom: '8px',
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: '100%',
          background: 'var(--surface-lo)',
          border: '1px solid var(--border-hi)',
          borderRadius: '14px',
          padding: '14px 16px',
          fontSize: '16px',
          fontWeight: 500,
          color: 'var(--text)',
          fontFamily: 'var(--font-ui)',
          WebkitAppearance: 'none',
          appearance: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function SubmitButton({
  loading,
  disabled,
  children,
  danger,
}: {
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      style={{
        width: '100%',
        padding: '16px',
        borderRadius: '16px',
        background: danger ? 'var(--danger)' : 'var(--accent)',
        color: '#fff',
        fontSize: '16px',
        fontWeight: 800,
        border: 'none',
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        opacity: loading || disabled ? 0.5 : 1,
        fontFamily: 'var(--font-ui)',
        transition: 'opacity 0.15s',
        marginTop: '8px',
      }}
    >
      {loading ? 'Attendere…' : children}
    </button>
  );
}

// ─── Sub-sheet: Add vehicle ──────────────────────────────────────────────────

function AddVehicleSheet({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (v: Vehicle) => void;
}) {
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const yearNum = parseInt(year);
    if (!name.trim() || !plate.trim() || !year) {
      setError('Compila tutti i campi');
      return;
    }
    const currentYear = new Date().getFullYear();
    if (yearNum < 1900 || yearNum > currentYear + 1) {
      setError(`Anno non valido (1900–${currentYear + 1})`);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), plate: plate.trim().toUpperCase(), year: yearNum }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Errore'); return; }
      onSuccess(data);
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubSheetShell title="Nuovo veicolo" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormInput label="Nome" type="text" value={name} onChange={setName} placeholder="es. Panda 1.2, Golf TDI…" autoComplete="off" />
        <FormInput label="Targa" type="text" value={plate} onChange={v => setPlate(v.toUpperCase())} placeholder="es. AB123CD" autoComplete="off" />
        <FormInput label="Anno" type="number" value={year} onChange={setYear} placeholder={String(new Date().getFullYear())} autoComplete="off" />
        {error && <InlineError message={error} />}
        <SubmitButton loading={loading}>Aggiungi veicolo</SubmitButton>
      </form>
    </SubSheetShell>
  );
}

// ─── Sub-sheet: Edit email ───────────────────────────────────────────────────

function EditEmailSheet({
  currentEmail,
  onClose,
  onSuccess,
}: {
  currentEmail: string;
  onClose: () => void;
  onSuccess: (newEmail: string) => void;
}) {
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !currentPassword) { setError('Compila tutti i campi'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Errore'); return; }
      onSuccess(newEmail.toLowerCase().trim());
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubSheetShell title="Modifica email" onClose={onClose}>
      <p style={{ fontSize: '13px', color: 'var(--text-ter)', marginBottom: '16px' }}>
        Email attuale: <strong style={{ color: 'var(--text)' }}>{currentEmail}</strong>
      </p>
      <form onSubmit={handleSubmit}>
        <FormInput label="Nuova email" type="email" value={newEmail} onChange={setNewEmail} placeholder="nuova@email.it" autoComplete="email" />
        <FormInput label="Password attuale" type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="••••••••" autoComplete="current-password" />
        {error && <InlineError message={error} />}
        <SubmitButton loading={loading}>Aggiorna email</SubmitButton>
      </form>
    </SubSheetShell>
  );
}

// ─── Sub-sheet: Change password ──────────────────────────────────────────────

function ChangePasswordSheet({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirm) { setError('Compila tutti i campi'); return; }
    if (newPassword !== confirm) { setError('Le password non coincidono'); return; }
    if (newPassword.length < 8) { setError('La password deve contenere almeno 8 caratteri'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Errore'); return; }
      onSuccess();
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubSheetShell title="Cambia password" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormInput label="Password attuale" type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="••••••••" autoComplete="current-password" />
        <FormInput label="Nuova password" type="password" value={newPassword} onChange={setNewPassword} placeholder="Almeno 8 caratteri" autoComplete="new-password" />
        <FormInput label="Conferma nuova password" type="password" value={confirm} onChange={setConfirm} placeholder="••••••••" autoComplete="new-password" />
        {error && <InlineError message={error} />}
        <SubmitButton loading={loading}>Aggiorna password</SubmitButton>
      </form>
    </SubSheetShell>
  );
}

// ─── Sub-sheet: Delete account ───────────────────────────────────────────────

function DeleteAccountSheet({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setError('Inserisci la password'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Errore'); return; }
      window.location.href = '/login';
    } catch {
      setError('Errore di rete. Riprova.');
      setLoading(false);
    }
  };

  return (
    <SubSheetShell title="Elimina account" onClose={onClose}>
      <div style={{
        background: 'rgba(248,113,113,0.08)',
        border: '1px solid rgba(248,113,113,0.2)',
        borderRadius: '12px',
        padding: '14px',
        fontSize: '13px',
        color: 'var(--text-sec)',
        marginBottom: '20px',
        lineHeight: 1.5,
      }}>
        ⚠️ Questa azione è <strong>irreversibile</strong>. Tutti i tuoi veicoli, rifornimenti e scadenze verranno eliminati definitivamente.
      </div>
      <form onSubmit={handleSubmit}>
        <FormInput label="Conferma con la tua password" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />
        {error && <InlineError message={error} />}
        <SubmitButton loading={loading} danger>Elimina account definitivamente</SubmitButton>
      </form>
    </SubSheetShell>
  );
}

// ─── Main Settings sheet ─────────────────────────────────────────────────────

export function Settings({
  open,
  onClose,
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onVehicleAdded,
  onVehicleDeleted,
}: SettingsProps) {
  const [subSheet, setSubSheet] = useState<SubSheet>(null);
  const [userEmail, setUserEmail] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Fetch user email when sheet opens
  useEffect(() => {
    if (!open) return;
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.data?.email) setUserEmail(d.data.email); })
      .catch(() => {});
  }, [open]);

  // Reset sub-sheet and transient state when main sheet closes
  useEffect(() => {
    if (!open) {
      setSubSheet(null);
      setDeletingId(null);
      setDeleteError(null);
      setPasswordChanged(false);
    }
  }, [open]);

  const handleDeleteVehicle = async (id: string) => {
    setDeleteError(null);
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        setDeleteError(d.error ?? 'Errore');
        setDeletingId(null);
        return;
      }
      setDeletingId(null);
      onVehicleDeleted(id);
    } catch {
      setDeleteError('Errore di rete. Riprova.');
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
  };

  const handleReload = () => {
    navigator.serviceWorker.getRegistration()
      ?.then(r => r?.update())
      .finally(() => window.location.reload());
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 300,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s cubic-bezier(.2,.8,.25,1)',
        }}
      />

      {/* Sheet */}
      <div
        data-testid="settings-sheet"
        data-open={String(open)}
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 0,
          zIndex: 301,
          width: '100%',
          maxWidth: '480px',
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          border: '1px solid var(--border-hi)',
          borderBottom: 'none',
          maxHeight: '92dvh',
          overflowY: 'auto',
          transform: open ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(100%)',
          transition: 'transform 0.4s cubic-bezier(.2,.8,.25,1)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* When a sub-sheet is active, it replaces the entire panel body */}
        {subSheet === 'addVehicle' && (
          <AddVehicleSheet
            onClose={() => setSubSheet(null)}
            onSuccess={v => { onVehicleAdded(v); setSubSheet(null); }}
          />
        )}
        {subSheet === 'editEmail' && (
          <EditEmailSheet
            currentEmail={userEmail}
            onClose={() => setSubSheet(null)}
            onSuccess={email => { setUserEmail(email); setSubSheet(null); }}
          />
        )}
        {subSheet === 'changePassword' && (
          <ChangePasswordSheet
            onClose={() => setSubSheet(null)}
            onSuccess={() => { setPasswordChanged(true); setSubSheet(null); }}
          />
        )}
        {subSheet === 'deleteAccount' && (
          <DeleteAccountSheet onClose={() => setSubSheet(null)} />
        )}

        {/* Main settings view — hidden when sub-sheet is active */}
        {!subSheet && (
          <>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-hi)' }} />
            </div>

            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px 8px',
            }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Impostazioni
              </span>
              <button
                onClick={onClose}
                aria-label="Chiudi"
                style={{
                  width: 32, height: 32,
                  borderRadius: '50%',
                  background: 'var(--surface-lo)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Icon name="close" size={16} color="var(--text-sec)" />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '8px 16px 24px' }}>

              {/* ── Vehicles ── */}
              <SectionLabel>Veicoli</SectionLabel>
              <SettingsGroup>
                {vehicles.map((v, i) => {
                  const isActive = v.id === selectedVehicle?.id;
                  const isConfirming = deletingId === v.id;
                  const isLast = i === vehicles.length - 1;

                  if (isConfirming) {
                    return (
                      <div key={v.id} style={{
                        padding: '12px 16px',
                        borderBottom: isLast ? 'none' : '1px solid var(--border)',
                        background: 'rgba(248,113,113,0.06)',
                      }}>
                        <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '10px', fontWeight: 600 }}>
                          Eliminare <em>{v.name}</em> e tutti i dati?
                        </p>
                        {deleteError && <InlineError message={deleteError} />}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => { setDeletingId(null); setDeleteError(null); }}
                            style={{
                              flex: 1, padding: '10px', borderRadius: '10px',
                              background: 'var(--surface)', border: '1px solid var(--border)',
                              color: 'var(--text)', fontWeight: 600, fontSize: '14px',
                              cursor: 'pointer', fontFamily: 'var(--font-ui)',
                            }}
                          >
                            Annulla
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(v.id)}
                            style={{
                              flex: 1, padding: '10px', borderRadius: '10px',
                              background: 'var(--danger)', border: 'none',
                              color: '#fff', fontWeight: 700, fontSize: '14px',
                              cursor: 'pointer', fontFamily: 'var(--font-ui)',
                            }}
                          >
                            Elimina
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <SettingsRow
                      key={v.id}
                      onClick={isActive ? undefined : () => onSelectVehicle(v)}
                      noBorder={isLast}
                    >
                      <span style={{ fontSize: '20px' }}>🚗</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{v.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-ter)' }}>{v.plate} · {v.year}</div>
                      </div>
                      {isActive ? (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>Attivo</span>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setDeletingId(v.id); setDeleteError(null); }}
                          style={{
                            background: 'rgba(248,113,113,0.12)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'var(--danger)',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '5px 10px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-ui)',
                          }}
                        >
                          Elimina
                        </button>
                      )}
                    </SettingsRow>
                  );
                })}

                <SettingsRow onClick={() => setSubSheet('addVehicle')} noBorder>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>＋</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>Aggiungi veicolo</span>
                </SettingsRow>
              </SettingsGroup>

              {/* ── Account ── */}
              <SectionLabel>Account</SectionLabel>
              <SettingsGroup>
                <SettingsRow onClick={() => setSubSheet('editEmail')}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-ter)', marginBottom: '2px' }}>Email</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userEmail || '…'}
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', flexShrink: 0 }}>Modifica</span>
                </SettingsRow>
                <SettingsRow onClick={() => setSubSheet('changePassword')} noBorder>
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>
                    Password
                    {passwordChanged && <span style={{ color: 'var(--success)', marginLeft: '8px', fontSize: '12px' }}>✓ Aggiornata</span>}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>Cambia</span>
                </SettingsRow>
              </SettingsGroup>

              {/* ── App ── */}
              <SectionLabel>App</SectionLabel>
              <SettingsGroup>
                <SettingsRow onClick={handleReload}>
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>🔄 Aggiorna app</span>
                </SettingsRow>
                <SettingsRow onClick={handleLogout} danger noBorder>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>→ Esci</span>
                </SettingsRow>
              </SettingsGroup>

              {/* ── Danger zone ── */}
              <div style={{
                background: 'rgba(248,113,113,0.05)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: '14px',
                overflow: 'hidden',
                marginTop: '8px',
              }}>
                <SettingsRow onClick={() => setSubSheet('deleteAccount')} danger noBorder>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>🗑 Elimina account</span>
                </SettingsRow>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
```

- [ ] **Typecheck**

```bash
pnpm typecheck
# Expected: no errors
```

- [ ] **Commit**

```bash
git add components/screens/Settings.tsx
git commit -m "feat: add Settings sheet with vehicles, account, and app sections"
```

---

## Task 7: E2E tests

**Files:**
- Create: `tests/e2e/04-settings.spec.ts`

- [ ] **Create the test file**

```ts
// tests/e2e/04-settings.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Settings sheet', () => {
  test('gear icon opens settings sheet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Impostazioni' }).click();

    await expect(page.getByTestId('settings-sheet')).toHaveAttribute('data-open', 'true', { timeout: 5000 });
    await expect(page.getByText('Impostazioni')).toBeVisible();
  });

  test('settings sheet shows all sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();

    await expect(page.getByText('Veicoli')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Account')).toBeVisible();
    await expect(page.getByText('Aggiorna app')).toBeVisible();
    await expect(page.getByText('Elimina account')).toBeVisible();
  });

  test('settings sheet closes on backdrop click', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await expect(page.getByTestId('settings-sheet')).toHaveAttribute('data-open', 'true', { timeout: 5000 });

    // Click backdrop (outside the sheet) by clicking top-left corner of screen
    await page.mouse.click(10, 10);

    await expect(page.getByTestId('settings-sheet')).toHaveAttribute('data-open', 'false', { timeout: 5000 });
  });

  test('settings sheet closes on X button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await expect(page.getByTestId('settings-sheet')).toHaveAttribute('data-open', 'true', { timeout: 5000 });

    await page.getByRole('button', { name: 'Chiudi' }).click();

    await expect(page.getByTestId('settings-sheet')).toHaveAttribute('data-open', 'false', { timeout: 5000 });
  });

  test('Aggiungi veicolo opens sub-sheet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await expect(page.getByText('Aggiungi veicolo')).toBeVisible({ timeout: 5000 });

    await page.getByText('Aggiungi veicolo').click();

    await expect(page.getByText('Nuovo veicolo')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('es. Panda 1.2, Golf TDI…')).toBeVisible();
  });

  test('add vehicle form validates empty fields', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await page.getByText('Aggiungi veicolo').click();

    await page.getByText('Aggiungi veicolo', { exact: true }).last().click();

    await expect(page.getByText('Compila tutti i campi')).toBeVisible({ timeout: 5000 });
  });

  test('Modifica email opens sub-sheet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await page.getByText('Modifica').click();

    await expect(page.getByText('Modifica email')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('nuova@email.it')).toBeVisible();
  });

  test('Cambia password opens sub-sheet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await page.getByText('Cambia').click();

    await expect(page.getByText('Cambia password')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Password attuale')).toBeVisible();
  });

  test('Elimina account opens sub-sheet with warning', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await page.getByText('Elimina account').click();

    await expect(page.getByText('irreversibile')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Elimina account definitivamente')).toBeVisible();
  });
});
```

- [ ] **Typecheck**

```bash
pnpm typecheck
# Expected: no errors
```

- [ ] **Commit**

```bash
git add tests/e2e/04-settings.spec.ts
git commit -m "test(e2e): add Settings sheet coverage"
```

---

## Task 8: Final check and push

- [ ] **Run unit tests**

```bash
pnpm test
# Expected: all pass
```

- [ ] **Run full typecheck**

```bash
pnpm typecheck
# Expected: no errors
```

- [ ] **Push the feature branch**

```bash
git push -u origin feature/settings-vehicles
```

- [ ] **Verify CI is green** — check GitHub Actions on the `feature/settings-vehicles` branch before merging.
