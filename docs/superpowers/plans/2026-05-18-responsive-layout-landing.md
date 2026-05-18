# Responsive Layout + Public Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive sidebar layout on screens ≥768px and expose a public landing page at `/` while moving the authenticated app shell to `/app`.

**Architecture:** CSS media queries at 768px hide/show `TabBar` vs `Sidebar` without JS. The `/` → `/app` restructuring uses Next.js App Router with `middleware.ts` for auth-based redirects — reading the `carburapp_session` iron-session cookie via `unsealData`.

**Tech Stack:** Next.js 16 App Router, React 19, iron-session 8 (`unsealData`), CSS custom properties.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `app/globals.css` | Modify | Add `--content-padding-bottom` var + sidebar layout at 768px+ |
| `components/Sidebar.tsx` | Create | Fixed left nav for desktop/tablet |
| `components/TabBar.tsx` | Modify | Add `className="tab-bar"` to root div |
| `components/AppShell.tsx` | Modify | Import + render `<Sidebar>`, add `className="main-content"` to `<main>` |
| `components/screens/Dashboard.tsx` | Modify | Use `var(--content-padding-bottom)` |
| `components/screens/Storico.tsx` | Modify | Use `var(--content-padding-bottom)` |
| `components/screens/Scadenze.tsx` | Modify | Use `var(--content-padding-bottom)` |
| `components/screens/Statistiche.tsx` | Modify | Use `var(--content-padding-bottom)` |
| `components/screens/Onboarding.tsx` | Modify | Remove `'landing'` step; always render form |
| `lib/session.ts` | Modify | Export `SESSION_OPTIONS` (needed by middleware) |
| `middleware.ts` | Create | Protect `/app` and redirect `/` for authenticated users |
| `app/app/page.tsx` | Create | Authenticated app entry point (renders `<AppShell>`) |
| `app/page.tsx` | Rewrite | Public landing page — server component, no auth required |
| `app/login/page.tsx` | Modify | Redirect to `/app` on success (line 27) |
| `app/register/page.tsx` | Modify | Redirect to `/app` on success (line 37) |

---

### Task 1: Add responsive CSS rules to globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add `--content-padding-bottom` to `:root`**

In `app/globals.css`, inside the existing `:root { ... }` block, add this line before the closing `}`:

```css
  --content-padding-bottom: calc(var(--tab-bar-height) + 16px);
```

- [ ] **Step 2: Add sidebar defaults and desktop breakpoint rules**

At the very end of `app/globals.css`, append:

```css
/* Sidebar hidden on mobile by default */
.sidebar { display: none; }

/* ≥768px: full-width app with sidebar, no bottom tab bar */
@media (min-width: 768px) {
  /* Remove the 480px phone-column constraint from the 600px rule */
  body {
    display: block;
    background: var(--bg);
  }
  .app-root {
    max-width: none;
    box-shadow: none;
  }

  /* Swap nav: hide tab bar, show sidebar */
  .tab-bar  { display: none !important; }
  .sidebar  { display: flex !important; }

  /* Content area: shift right of sidebar, remove tab bar bottom gap */
  .main-content { margin-left: 220px; }
  :root { --content-padding-bottom: 24px; }
}
```

- [ ] **Step 3: Confirm no parse errors**

```bash
pnpm build 2>&1 | head -30
```

Expected: build succeeds (or fails only on unrelated issues). CSS parse errors would surface here.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: add responsive CSS — sidebar layout at 768px+, --content-padding-bottom var"
```

---

### Task 2: Create `components/Sidebar.tsx`

**Files:**
- Create: `components/Sidebar.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import React from 'react';
import { Icon } from './Icon';
import type { TabId } from './TabBar';

const NAV_ITEMS: { id: TabId; label: string; icon: string }[] = [
  { id: 'riepilogo',   label: 'Riepilogo',   icon: 'home'    },
  { id: 'storico',     label: 'Storico',     icon: 'receipt' },
  { id: 'scadenze',   label: 'Scadenze',   icon: 'bell'    },
  { id: 'statistiche', label: 'Statistiche', icon: 'chart'   },
];

interface SidebarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  onAdd: () => void;
}

export function Sidebar({ active, onChange, onAdd }: SidebarProps) {
  return (
    <div
      className="sidebar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 220,
        zIndex: 50,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        flexDirection: 'column',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 64px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Aggiungi CTA */}
      <div style={{ padding: '12px 12px 8px' }}>
        <button
          onClick={onAdd}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minHeight: '44px',
            touchAction: 'manipulation',
          }}
        >
          <Icon name="plus" size={18} color="#fff" strokeWidth={2.5} />
          Aggiungi spesa
        </button>
      </div>

      {/* Nav items */}
      <nav style={{
        flex: 1,
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: isActive ? 'rgba(255,122,61,0.1)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-sec)',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.15s',
                touchAction: 'manipulation',
              }}
            >
              <Icon
                name={item.icon as any}
                size={18}
                color={isActive ? 'var(--accent)' : 'var(--text-sec)'}
                strokeWidth={isActive ? 2.2 : 1.75}
              />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/Sidebar.tsx
git commit -m "feat: add Sidebar component for desktop/tablet navigation"
```

---

### Task 3: Wire Sidebar into AppShell; add CSS class to TabBar

**Files:**
- Modify: `components/TabBar.tsx` (line 29 — root `<div>`)
- Modify: `components/AppShell.tsx`

- [ ] **Step 1: Add `className="tab-bar"` to TabBar's root div**

In `components/TabBar.tsx`, the `return` statement starts with a `<div style={{...}}>`. Add `className="tab-bar"` to it:

```tsx
    <div
      className="tab-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        // ... rest of the style object unchanged
```

- [ ] **Step 2: Import Sidebar in AppShell**

In `components/AppShell.tsx`, add after the existing imports:

```tsx
import { Sidebar } from './Sidebar';
```

- [ ] **Step 3: Render Sidebar and add CSS classes in AppShell**

In `components/AppShell.tsx`, find the `return (` block. Change this section:

```tsx
      <main style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
        {renderScreen()}
      </main>
      <TabBar active={activeTab} onChange={handleTabChange} />
```

To:

```tsx
      <Sidebar active={activeTab} onChange={handleTabChange} onAdd={handleOpenSheet} />
      <main className="main-content" style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
        {renderScreen()}
      </main>
      <TabBar active={activeTab} onChange={handleTabChange} />
```

- [ ] **Step 4: Type-check**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/TabBar.tsx components/AppShell.tsx
git commit -m "feat: wire Sidebar into AppShell; mark TabBar with CSS class for responsive hiding"
```

---

### Task 4: Update screen components to use `--content-padding-bottom`

**Files:**
- Modify: `components/screens/Dashboard.tsx` (line 62)
- Modify: `components/screens/Storico.tsx` (line 83)
- Modify: `components/screens/Scadenze.tsx` (line 112)
- Modify: `components/screens/Statistiche.tsx` (line 148)

Each screen's outermost `<div>` has `paddingBottom: 'calc(var(--tab-bar-height) + 16px)'`. Replace each with the CSS variable so the desktop breakpoint can override it.

- [ ] **Step 1: Update Dashboard.tsx**

Find (line ~62):
```tsx
        paddingBottom: 'calc(var(--tab-bar-height) + 16px)',
```
Replace with:
```tsx
        paddingBottom: 'var(--content-padding-bottom)',
```

- [ ] **Step 2: Update Storico.tsx**

Find (line ~83):
```tsx
        paddingBottom: 'calc(var(--tab-bar-height) + 16px)',
```
Replace with:
```tsx
        paddingBottom: 'var(--content-padding-bottom)',
```

- [ ] **Step 3: Update Scadenze.tsx**

Find (line ~112):
```tsx
        paddingBottom: 'calc(var(--tab-bar-height) + 16px)',
```
Replace with:
```tsx
        paddingBottom: 'var(--content-padding-bottom)',
```

- [ ] **Step 4: Update Statistiche.tsx**

Find (line ~148):
```tsx
        paddingBottom: 'calc(var(--tab-bar-height) + 16px)',
```
Replace with:
```tsx
        paddingBottom: 'var(--content-padding-bottom)',
```

- [ ] **Step 5: Type-check and commit**

```bash
pnpm typecheck
git add components/screens/Dashboard.tsx components/screens/Storico.tsx components/screens/Scadenze.tsx components/screens/Statistiche.tsx
git commit -m "feat: use --content-padding-bottom CSS var in screen components"
```

---

### Task 5: Simplify `Onboarding.tsx` — remove landing step

**Files:**
- Modify: `components/screens/Onboarding.tsx`

The splash hero (`step === 'landing'`) moves to the public landing page. `Onboarding` now always renders the vehicle form directly.

- [ ] **Step 1: Rewrite `components/screens/Onboarding.tsx`**

Replace the entire file with:

```tsx
'use client';

import React, { useState } from 'react';
import { VehicleFormFields } from '../VehicleFormFields';
import { Vehicle } from '@/lib/types';

interface OnboardingProps {
  onComplete: (vehicle: Vehicle) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [name, setName]   = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name || !plate || !year) {
      setError('Compila tutti i campi');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, plate: plate.toUpperCase(), year: parseInt(year) }),
      });
      if (!res.ok) throw new Error('Errore nel salvataggio');
      const vehicle: Vehicle = await res.json();
      onComplete(vehicle);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '60px 24px 32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
          La tua auto
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-ter)', marginTop: '2px' }}>
          Aggiungi i dati del veicolo per iniziare
        </p>
      </div>

      <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column' }}>
        <VehicleFormFields
          name={name}   onNameChange={setName}
          plate={plate} onPlateChange={setPlate}
          year={year}   onYearChange={setYear}
        />
        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '13px',
            color: 'var(--danger)',
          }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ padding: '24px' }}>
        <button
          onClick={handleCreate}
          disabled={loading}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '18px',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 800,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            minHeight: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {loading ? 'Salvataggio…' : 'Crea veicolo'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/screens/Onboarding.tsx
git commit -m "feat: simplify Onboarding to vehicle form only; splash moved to public landing"
```

---

### Task 6: Export `SESSION_OPTIONS` from `lib/session.ts`

**Files:**
- Modify: `lib/session.ts`

Middleware needs `SESSION_OPTIONS` to decrypt the session cookie without calling `cookies()` from `next/headers` (unavailable in middleware).

- [ ] **Step 1: Export `SESSION_OPTIONS`**

In `lib/session.ts`, find:
```ts
const SESSION_OPTIONS: SessionOptions = {
```
Change to:
```ts
export const SESSION_OPTIONS: SessionOptions = {
```

- [ ] **Step 2: Verify `SessionData` is already exported**

`SessionData` should already have `export interface SessionData`. Confirm the line reads:
```ts
export interface SessionData {
```
If it's missing the `export` keyword, add it.

- [ ] **Step 3: Type-check**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/session.ts
git commit -m "feat: export SESSION_OPTIONS from lib/session for middleware"
```

---

### Task 7: Create `middleware.ts`

**Files:**
- Create: `middleware.ts` (at project root, next to `next.config.ts`)

Uses `unsealData` from iron-session (no `cookies()` dependency) to read the session cookie in the Edge runtime.

- [ ] **Step 1: Create `middleware.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { unsealData } from 'iron-session';
import type { SessionData } from '@/lib/session';

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const cookieValue = request.cookies.get('carburapp_session')?.value;
  if (!cookieValue) return false;
  try {
    const data = await unsealData<SessionData>(cookieValue, {
      password: process.env.SESSION_SECRET!,
    });
    return !!data.user;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/app' || pathname.startsWith('/app/')) {
    if (!(await isAuthenticated(request))) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname === '/') {
    if (await isAuthenticated(request)) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/app', '/app/:path*'],
};
```

- [ ] **Step 2: Type-check**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add auth middleware — protect /app, redirect / for logged-in users"
```

---

### Task 8: Create `app/app/page.tsx` and rewrite `app/page.tsx`

**Files:**
- Create: `app/app/page.tsx`
- Modify: `app/page.tsx` (full rewrite)

- [ ] **Step 1: Create `app/app/page.tsx`**

```tsx
import { AppShell } from '@/components/AppShell';

export default function AppPage() {
  return <AppShell />;
}
```

- [ ] **Step 2: Rewrite `app/page.tsx` as public landing**

Full replacement of `app/page.tsx`. This is a server component (no `'use client'`) — SVGs are inlined so no client JS is added for icons:

```tsx
import Link from 'next/link';

const FEATURES = [
  {
    title: 'Rifornimenti',
    desc: 'Tieni traccia di ogni rifornimento',
    rgb: '111,168,255',
    svgPath: 'M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 21h11M5 12h11M16 9l2.5 2.5a1.5 1.5 0 0 1 .5 1.1V17a1.5 1.5 0 0 0 3 0V8.4a1.5 1.5 0 0 0-.4-1L19 5',
  },
  {
    title: 'Scadenze',
    desc: 'Bollo, assicurazione, revisione',
    rgb: '244,183,64',
    svgPath: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M9 21a3 3 0 0 0 6 0',
  },
  {
    title: 'Statistiche',
    desc: 'Analizza i tuoi consumi nel tempo',
    rgb: '74,222,128',
    svgPath: 'M3 21h18M7 17V11M12 17V7M17 17v-4',
  },
];

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Hero */}
      <div style={{
        flex: '1 0 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px 40px',
        position: 'relative',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,122,61,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{
          width: 96,
          height: 96,
          borderRadius: '28px',
          background: 'linear-gradient(135deg, #FF7A3D 0%, #FF5A1A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          boxShadow: '0 12px 40px rgba(255,122,61,0.35)',
          position: 'relative',
          zIndex: 1,
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 21h11M5 12h11M16 9l2.5 2.5a1.5 1.5 0 0 1 .5 1.1V17a1.5 1.5 0 0 0 3 0V8.4a1.5 1.5 0 0 0-.4-1L19 5" />
          </svg>
        </div>

        <h1 style={{
          fontSize: '36px',
          fontWeight: 800,
          color: 'var(--text)',
          textAlign: 'center',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: '16px',
          position: 'relative',
          zIndex: 1,
        }}>
          CarburApp
        </h1>

        <p style={{
          fontSize: '17px',
          color: 'var(--text-sec)',
          textAlign: 'center',
          lineHeight: 1.5,
          maxWidth: '280px',
          marginBottom: '48px',
          position: 'relative',
          zIndex: 1,
        }}>
          Il tracker spese auto pensato per gli italiani.{' '}
          Rifornimenti, scadenze, statistiche — tutto in un posto.
        </p>

        {/* Feature pills */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '320px',
          position: 'relative',
          zIndex: 1,
        }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '14px',
              }}
            >
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: `rgba(${f.rgb},0.12)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={`rgb(${f.rgb})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.svgPath} />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{f.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-ter)', marginTop: '1px' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{
        padding: '16px 24px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px',
        width: '100%',
        margin: '0 auto',
      }}>
        <Link
          href="/login"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
            borderRadius: '18px',
            background: '#FF7A3D',
            color: '#fff',
            fontSize: '17px',
            fontWeight: 800,
            textDecoration: 'none',
            minHeight: '56px',
            boxShadow: '0 8px 24px rgba(255,122,61,0.4)',
          }}
        >
          Accedi
        </Link>
        <Link
          href="/register"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
            borderRadius: '18px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: '17px',
            fontWeight: 700,
            textDecoration: 'none',
            minHeight: '56px',
          }}
        >
          Registrati gratis
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/app/page.tsx app/page.tsx
git commit -m "feat: public landing page at /, move AppShell to /app"
```

---

### Task 9: Update login and register success redirects

**Files:**
- Modify: `app/login/page.tsx` (line 27)
- Modify: `app/register/page.tsx` (line 37)

Both pages currently redirect to `/` on success. They must redirect to `/app` now that the app lives there.

- [ ] **Step 1: Update login redirect**

In `app/login/page.tsx`, find:
```ts
      window.location.href = '/';
```
Change to:
```ts
      window.location.href = '/app';
```

- [ ] **Step 2: Update register redirect**

In `app/register/page.tsx`, find:
```ts
      window.location.href = '/';
```
Change to:
```ts
      window.location.href = '/app';
```

- [ ] **Step 3: Type-check and commit**

```bash
pnpm typecheck
git add app/login/page.tsx app/register/page.tsx
git commit -m "feat: redirect to /app after successful login and registration"
```

---

### Task 10: Smoke-test in the browser

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Verify public landing page (unauthenticated)**

Open `http://localhost:3000`. Expected: CarburApp logo, headline, feature pills, "Accedi" + "Registrati gratis" buttons — no login required.

- [ ] **Step 3: Verify `/app` redirects to login when unauthenticated**

While logged out, navigate to `http://localhost:3000/app`. Expected: immediately redirected to `/login`.

- [ ] **Step 4: Verify login flow**

Log in via the form. Expected: redirected to `http://localhost:3000/app`, app loads with vehicles/dashboard.

- [ ] **Step 5: Verify `/` redirects to `/app` when authenticated**

While logged in, navigate to `http://localhost:3000`. Expected: immediately redirected to `/app`.

- [ ] **Step 6: Verify sidebar on desktop**

Resize browser to ≥768px. Expected:
- Bottom tab bar is gone
- Left sidebar appears: "Aggiungi spesa" button + Riepilogo, Storico, Scadenze, Statistiche nav items
- Active tab highlighted in orange
- Clicking items switches content

- [ ] **Step 7: Verify mobile layout unchanged**

Resize browser to <768px. Expected:
- Sidebar disappears
- Bottom tab bar reappears
- All tab functionality works as before

- [ ] **Step 8: Verify Onboarding flow (new user)**

Log in as a user with no vehicles (or temporarily delete vehicles via Prisma Studio: `pnpm exec prisma studio`). Expected: app shows the "La tua auto / Aggiungi i dati del veicolo" form directly — no splash screen.
