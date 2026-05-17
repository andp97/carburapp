# Push Notification & Expense Alert System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Web Push notifications (VAPID, self-hosted), an in-app bell icon with badge visible on all tabs, and a "Segna come pagata" flow that converts a deadline into an expense history record.

**Architecture:** A `PushSubscription` Prisma model stores device subscriptions per user. Three new API routes manage subscriptions, resolve deadlines, and run the daily cron. The existing service worker gains push event listeners. AppShell gets a fixed-position bell button + `NotificationDrawer` sheet. The `bell` icon already exists in `ICON_PATHS` — no new icon asset needed.

**Tech Stack:** `web-push` (npm), VAPID key pair (generated once), Vercel Cron (`vercel.json`), Next.js 16 App Router, Prisma 7 with PrismaPg adapter.

**Spec:** `docs/superpowers/specs/2026-05-17-notification-system-design.md`

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `lib/push.ts` | Initialise web-push with VAPID; export `sendPush` helper |
| Create | `lib/deadlineUtils.ts` | Pure functions: `deadlineKindToExpenseType`, `isApproaching`, `isExpired` |
| Create | `hooks/useNotifications.ts` | Browser permission state + PushManager subscribe/unsubscribe |
| Create | `components/NotificationDrawer.tsx` | Alert sheet: lists urgent deadlines + "Segna come pagata" |
| Create | `app/api/push/subscribe/route.ts` | POST save / DELETE remove push subscription |
| Create | `app/api/deadlines/[id]/resolve/route.ts` | POST mark-as-paid: creates Refuel, deletes Deadline |
| Create | `app/api/cron/notify/route.ts` | GET daily cron: find approaching/expired deadlines, send push |
| Create | `vercel.json` | Cron schedule 9 AM daily |
| Create | `tests/unit/notifications.test.ts` | Unit tests for pure deadline logic |
| Modify | `prisma/schema.prisma` | Add `PushSubscription` model |
| Modify | `lib/types.ts` | Add `PushSubscriptionRecord` type |
| Modify | `.env.example` | Add VAPID + CRON_SECRET vars |
| Modify | `public/sw.js` | Add `push` + `notificationclick` event listeners |
| Modify | `components/AppShell.tsx` | Fixed bell button, badge count, `NotificationDrawer` wiring |
| Modify | `components/screens/Scadenze.tsx` | "Segna come pagata" button on deadline cards |
| Modify | `components/screens/Settings.tsx` | Notification permission section |

---

## Task 1: Install dependency + env setup

**Files:**
- Modify: `.env.example`
- Run: `pnpm add web-push && pnpm add -D @types/web-push`

- [ ] **Step 1: Install web-push**

```bash
cd /path/to/carburapp
pnpm add web-push
pnpm add -D @types/web-push
```

Expected: `web-push` appears in `package.json` dependencies.

- [ ] **Step 2: Generate VAPID keys**

```bash
npx web-push generate-vapid-keys
```

Copy the output. It looks like:
```
Public Key: BExamplePublicKeyBase64url...
Private Key: ExamplePrivateKeyBase64url...
```

- [ ] **Step 3: Add env vars to `.env.example` and `.env`**

Add to `.env.example` (after existing vars):
```
# Web Push (VAPID) — generate with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:me@andreapavone.dev
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # same value as VAPID_PUBLIC_KEY

# Cron protection — random 32+ char string
CRON_SECRET=
```

Fill the same vars in `.env` with the generated keys and a random `CRON_SECRET`.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml .env.example
git commit -m "feat(notifications): install web-push, add VAPID env vars"
```

---

## Task 2: Pure deadline logic + unit tests

**Files:**
- Create: `lib/deadlineUtils.ts`
- Create: `tests/unit/notifications.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/notifications.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm exec vitest run tests/unit/notifications.test.ts
```

Expected: `FAIL` — module `@/lib/deadlineUtils` not found.

- [ ] **Step 3: Create `lib/deadlineUtils.ts`**

```ts
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
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm exec vitest run tests/unit/notifications.test.ts
```

Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/deadlineUtils.ts tests/unit/notifications.test.ts
git commit -m "feat(notifications): add pure deadline logic with tests"
```

---

## Task 3: Schema migration

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `lib/types.ts`

- [ ] **Step 1: Add `PushSubscription` model to schema**

In `prisma/schema.prisma`, add after the `Deadline` model and add the relation to `User`:

```prisma
model User {
  id                String             @id @default(cuid())
  email             String             @unique
  passwordHash      String
  createdAt         DateTime           @default(now())
  vehicles          Vehicle[]
  pushSubscriptions PushSubscription[]
}
```

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
}
```

- [ ] **Step 2: Run migration**

```bash
pnpm exec prisma migrate dev --name add_push_subscription
```

Expected: migration file created, DB table `PushSubscription` created, `prisma generate` runs automatically.

- [ ] **Step 3: Add type to `lib/types.ts`**

Append at the end of `lib/types.ts`:

```ts
// Named PushSubscriptionRecord to avoid collision with the browser built-in PushSubscription type
export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ lib/types.ts
git commit -m "feat(notifications): add PushSubscription schema + type"
```

---

## Task 4: Server-side push helper

**Files:**
- Create: `lib/push.ts`

- [ ] **Step 1: Create `lib/push.ts`**

```ts
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export interface PushPayload {
  title: string;
  body: string;
}

export interface PushTarget {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function sendPush(target: PushTarget, payload: PushPayload): Promise<'sent' | 'stale'> {
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: target.keys },
      JSON.stringify(payload),
    );
    return 'sent';
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) return 'stale';
    throw err;
  }
}

export { webpush };
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/push.ts
git commit -m "feat(notifications): add server-side push helper"
```

---

## Task 5: Push subscription API

**Files:**
- Create: `app/api/push/subscribe/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

// POST /api/push/subscribe — save a push subscription for the current user
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await req.json();
    const { endpoint, keys } = body as { endpoint: string; keys: { p256dh: string; auth: string } };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'endpoint, keys.p256dh, and keys.auth are required' }, { status: 400 });
    }

    const prisma = await getPrisma();
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: { userId: session.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/push/subscribe error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}

// DELETE /api/push/subscribe — remove a push subscription
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await req.json();
    const { endpoint } = body as { endpoint: string };

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
    }

    const prisma = await getPrisma();
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/push/subscribe error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/push/subscribe/route.ts
git commit -m "feat(notifications): add push subscription API"
```

---

## Task 6: Deadline resolve API

**Files:**
- Create: `app/api/deadlines/[id]/resolve/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { deadlineKindToExpenseType } from '@/lib/deadlineUtils';
import type { DeadlineKind } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

// POST /api/deadlines/[id]/resolve
// Marks a deadline as paid: creates a Refuel expense record and deletes the deadline.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { id } = await params;

    const prisma = await getPrisma();

    const deadline = await prisma.deadline.findFirst({
      where: { id, vehicle: { userId: session.user.id } },
    });

    if (!deadline) {
      return NextResponse.json({ error: 'Scadenza non trovata' }, { status: 404 });
    }

    const expenseType = deadlineKindToExpenseType(deadline.kind as DeadlineKind);

    const [refuel] = await prisma.$transaction([
      prisma.refuel.create({
        data: {
          vehicleId: deadline.vehicleId,
          expenseType,
          total: deadline.amount ?? 0,
          notes: deadline.title,
          date: new Date(),
        },
      }),
      prisma.deadline.delete({ where: { id } }),
    ]);

    return NextResponse.json(refuel, { status: 201 });
  } catch (error) {
    console.error('POST /api/deadlines/[id]/resolve error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/deadlines/[id]/resolve/route.ts
git commit -m "feat(notifications): add deadline resolve API"
```

---

## Task 7: Cron notify API + Vercel config

**Files:**
- Create: `app/api/cron/notify/route.ts`
- Create: `vercel.json`

- [ ] **Step 1: Create `app/api/cron/notify/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { sendPush } from '@/lib/push';
import { isApproaching, isExpired } from '@/lib/deadlineUtils';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// GET /api/cron/notify — called daily by Vercel Cron at 09:00 UTC
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prisma = await getPrisma();

  const deadlines = await prisma.deadline.findMany({
    include: {
      vehicle: {
        include: {
          user: {
            include: { pushSubscriptions: true },
          },
        },
      },
    },
  });

  let sent = 0;
  let stale = 0;
  const staleEndpoints: string[] = [];

  for (const deadline of deadlines) {
    const dueDate = new Date(deadline.dueDate);
    const subscriptions = deadline.vehicle.user.pushSubscriptions;
    if (subscriptions.length === 0) continue;

    let payload: { title: string; body: string } | null = null;

    if (isExpired(dueDate)) {
      payload = {
        title: 'Scadenza scaduta',
        body: `${deadline.title} è scaduta`,
      };
    } else if (isApproaching(dueDate)) {
      const days = daysUntil(dueDate);
      payload = {
        title: 'Scadenza imminente',
        body: days === 0
          ? `${deadline.title} scade oggi`
          : days === 1
          ? `${deadline.title} scade domani`
          : `${deadline.title} scade tra ${days} giorni`,
      };
    }

    if (!payload) continue;

    for (const sub of subscriptions) {
      const result = await sendPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      if (result === 'sent') sent++;
      if (result === 'stale') staleEndpoints.push(sub.endpoint);
    }
  }

  // Clean up stale subscriptions
  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: staleEndpoints } } });
    stale = staleEndpoints.length;
  }

  return NextResponse.json({ sent, stale });
}
```

- [ ] **Step 2: Create `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/notify",
      "schedule": "0 9 * * *"
    }
  ]
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/notify/route.ts vercel.json
git commit -m "feat(notifications): add cron notify route + Vercel schedule"
```

---

## Task 8: Service worker push handlers

**Files:**
- Modify: `public/sw.js`

- [ ] **Step 1: Append push event listeners to `public/sw.js`**

Add at the end of `public/sw.js` (after the existing `fetch` listener):

```js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? 'CarburApp';
  const options = {
    body: data.body ?? '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat(notifications): add push + notificationclick handlers to service worker"
```

---

## Task 9: `hooks/useNotifications.ts`

**Files:**
- Create: `hooks/useNotifications.ts`

- [ ] **Step 1: Create the hook**

```ts
'use client';

import { useState, useEffect, useCallback } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function useNotifications() {
  const isSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'denied'
  );
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    setPermission(Notification.permission);
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub));
    });
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) return;
    const reg = await navigator.serviceWorker.ready;
    const applicationServerKey = urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
    );
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });
    setSubscribed(true);
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const json = sub.toJSON() as { endpoint: string };
    await sub.unsubscribe();
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: json.endpoint }),
    });
    setSubscribed(false);
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') await subscribe();
  }, [isSupported, subscribe]);

  return { isSupported, permission, subscribed, requestPermission, subscribe, unsubscribe };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useNotifications.ts
git commit -m "feat(notifications): add useNotifications hook"
```

---

## Task 10: `NotificationDrawer` component

**Files:**
- Create: `components/NotificationDrawer.tsx`

The `bell` icon is already in `ICON_PATHS` (`components/Icon.tsx` line 9). No new icon needed.

- [ ] **Step 1: Create the component**

```tsx
'use client';

import React, { useState } from 'react';
import { Icon } from './Icon';
import { IconTile } from './IconTile';
import { Pill } from './Pill';
import { Num } from './Num';
import { Deadline, DEADLINE_LABELS } from '@/lib/types';
import { getDaysUntil, formatDate, formatEuro } from '@/lib/utils';

const DEADLINE_ICON: Record<string, string> = {
  assicurazione: 'shield',
  bollo: 'document',
  revisione: 'check',
  tagliando: 'wrench',
  altro: 'bell',
};

function getDeadlineTone(days: number): 'danger' | 'warn' {
  return days < 0 ? 'danger' : 'warn';
}

function getDaysLabel(days: number): string {
  if (days < 0) return `Scaduto ${Math.abs(days)}g fa`;
  if (days === 0) return 'Oggi';
  if (days === 1) return 'Domani';
  return `Tra ${days} giorni`;
}

interface NotificationDrawerProps {
  deadlines: Deadline[];
  onClose: () => void;
  onResolve: (id: string) => Promise<void>;
}

export function NotificationDrawer({ deadlines, onClose, onResolve }: NotificationDrawerProps) {
  const [resolving, setResolving] = useState<string | null>(null);

  const urgent = deadlines.filter((d) => getDaysUntil(d.dueDate) <= 7);

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      await onResolve(id);
    } finally {
      setResolving(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 201,
        background: 'var(--surface)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border-hi)',
        borderBottom: 'none',
        maxHeight: '80dvh',
        overflowY: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-hi)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon name="bell" size={20} color="var(--accent)" />
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>Avvisi</h2>
          </div>
          <button
            aria-label="Chiudi"
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--surface-hi)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="x" size={18} color="var(--text-sec)" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {urgent.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '12px', padding: '40px 0', textAlign: 'center',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '18px',
                background: 'var(--surface-hi)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="check" size={26} color="var(--ok)" />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-sec)' }}>
                Tutto a posto
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-ter)' }}>
                Nessuna scadenza urgente
              </div>
            </div>
          ) : (
            urgent.map((d) => {
              const days = getDaysUntil(d.dueDate);
              const tone = getDeadlineTone(days);
              const icon = DEADLINE_ICON[d.kind] || 'bell';
              const isResolving = resolving === d.id;

              return (
                <div
                  key={d.id}
                  style={{
                    background: 'var(--surface-lo)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <IconTile name={icon as any} color={`var(--${tone})`} size={18} tileSize={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                          {d.title}
                        </span>
                        <Pill tone={tone}>{getDaysLabel(days)}</Pill>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-ter)', marginTop: '3px' }}>
                        {DEADLINE_LABELS[d.kind as keyof typeof DEADLINE_LABELS]} · {formatDate(d.dueDate)}
                      </div>
                      {d.amount != null && (
                        <Num size="13px" weight={700} color="var(--text)" style={{ display: 'block', marginTop: '4px' }}>
                          {formatEuro(d.amount)}
                        </Num>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleResolve(d.id)}
                    disabled={isResolving}
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      background: isResolving ? 'var(--surface-hi)' : 'var(--accent)',
                      color: isResolving ? 'var(--text-ter)' : '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: isResolving ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {isResolving ? 'Salvataggio...' : 'Segna come pagata'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/NotificationDrawer.tsx
git commit -m "feat(notifications): add NotificationDrawer component"
```

---

## Task 11: AppShell — bell button + badge + drawer

**Files:**
- Modify: `components/AppShell.tsx`

The bell button uses the existing `Icon` component with `name="bell"` — no new assets needed. The badge is an absolutely-positioned `span` styled with `var(--danger)`, consistent with the app's existing color tokens.

- [ ] **Step 1: Add imports and new state to `AppShell.tsx`**

Add imports at the top (after existing imports):
```tsx
import { Icon } from './Icon';
import { NotificationDrawer } from './NotificationDrawer';
import type { Deadline } from '@/lib/types';
import { getDaysUntil } from '@/lib/utils';
```

Add new state inside `AppShell` function (after existing state declarations):
```tsx
const [alertDeadlines, setAlertDeadlines] = useState<Deadline[]>([]);
const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
```

- [ ] **Step 2: Add deadline fetch effect**

Add after the existing `useEffect` for `fetchVehicles`:
```tsx
useEffect(() => {
  if (!selectedVehicle) { setAlertDeadlines([]); return; }
  fetch(`/api/deadlines?vehicleId=${selectedVehicle.id}`)
    .then((r) => r.ok ? r.json() : [])
    .then((data: Deadline[]) => setAlertDeadlines(data))
    .catch(() => {});
}, [selectedVehicle, refreshKey]);
```

- [ ] **Step 3: Add `handleResolve` callback**

Add after `handleVehicleDeleted`:
```tsx
const handleResolve = async (id: string) => {
  await fetch(`/api/deadlines/${id}/resolve`, { method: 'POST' });
  setRefreshKey((k) => k + 1);
  // re-fetch alert deadlines after resolve
  if (selectedVehicle) {
    const r = await fetch(`/api/deadlines?vehicleId=${selectedVehicle.id}`);
    if (r.ok) setAlertDeadlines(await r.json());
  }
};
```

- [ ] **Step 4: Derive badge count**

Add after state declarations:
```tsx
const alertCount = alertDeadlines.filter((d) => getDaysUntil(d.dueDate) <= 7).length;
```

- [ ] **Step 5: Add the fixed bell button + `NotificationDrawer` to the return JSX**

In the `return (...)` block, add the bell button and drawer alongside the existing `TabBar`, `SheetAddFuel`, and `Settings`:

```tsx
return (
  <>
    <main style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      {renderScreen()}
    </main>
    <TabBar active={activeTab} onChange={handleTabChange} />

    {/* Fixed bell button — visible on all tabs */}
    {vehicles.length > 0 && (
      <button
        aria-label={`Avvisi${alertCount > 0 ? ` (${alertCount})` : ''}`}
        onClick={() => setNotifDrawerOpen(true)}
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          right: '20px',
          zIndex: 100,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Icon name="bell" size={18} color={alertCount > 0 ? 'var(--accent)' : 'var(--text-sec)'} />
        {alertCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            background: 'var(--danger)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1,
          }}>
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        )}
      </button>
    )}

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
    {notifDrawerOpen && (
      <NotificationDrawer
        deadlines={alertDeadlines}
        onClose={() => setNotifDrawerOpen(false)}
        onResolve={handleResolve}
      />
    )}
  </>
);
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/AppShell.tsx
git commit -m "feat(notifications): add bell icon, badge, and NotificationDrawer to AppShell"
```

---

## Task 12: Scadenze — "Segna come pagata" button

**Files:**
- Modify: `components/screens/Scadenze.tsx`

- [ ] **Step 1: Add resolve handler to `Scadenze` component**

In `Scadenze`, add a `handleResolve` function after `handleDelete`:
```tsx
const handleResolve = async (id: string) => {
  try {
    await fetch(`/api/deadlines/${id}/resolve`, { method: 'POST' });
    fetchDeadlines();
  } catch {
    // ignore
  }
};
```

- [ ] **Step 2: Pass `onResolve` to `DeadlineCard` and `TimelineDeadline`**

Update the calls in the JSX:
```tsx
{expired.map(d => <DeadlineCard key={d.id} deadline={d} onDelete={handleDelete} onResolve={handleResolve} />)}
```
```tsx
{items.map((d, idx) => <TimelineDeadline key={d.id} deadline={d} isLast={idx === items.length - 1} onDelete={handleDelete} onResolve={handleResolve} />)}
```

- [ ] **Step 3: Add `onResolve` prop + button to `DeadlineCard`**

Update the `DeadlineCard` component signature and add the button:
```tsx
function DeadlineCard({ deadline, onDelete, onResolve }: { deadline: Deadline; onDelete: (id: string) => void; onResolve: (id: string) => void }) {
```

Add the "Segna come pagata" button inside `DeadlineCard`, after the delete button:
```tsx
<button
  aria-label="Segna come pagata"
  onClick={() => onResolve(deadline.id)}
  style={{
    padding: '6px 12px',
    borderRadius: '10px',
    background: 'color-mix(in srgb, var(--ok) 15%, transparent)',
    color: 'var(--ok)',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  }}
>
  Pagata
</button>
```

- [ ] **Step 4: Add `onResolve` prop + button to `TimelineDeadline`**

Update signature:
```tsx
function TimelineDeadline({ deadline, isLast, onDelete, onResolve }: { deadline: Deadline; isLast: boolean; onDelete: (id: string) => void; onResolve: (id: string) => void }) {
```

Add the "Segna come pagata" button inside the content `div` of `TimelineDeadline`, below the title/pill row and above the delete button:
```tsx
<button
  aria-label="Segna come pagata"
  onClick={() => onResolve(deadline.id)}
  style={{
    marginTop: '10px',
    width: '100%',
    padding: '8px',
    borderRadius: 'var(--radius-md)',
    background: 'color-mix(in srgb, var(--ok) 15%, transparent)',
    color: 'var(--ok)',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  }}
>
  Segna come pagata
</button>
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/screens/Scadenze.tsx
git commit -m "feat(notifications): add Segna come pagata button to Scadenze"
```

---

## Task 13: Settings — notification permission section

**Files:**
- Modify: `components/screens/Settings.tsx`

- [ ] **Step 1: Import `useNotifications` in Settings**

Add to the import block at the top of `Settings.tsx`:
```tsx
import { useNotifications } from '@/hooks/useNotifications';
```

- [ ] **Step 2: Call the hook inside the `Settings` component**

Add inside the main `Settings` function body (near the top with other hooks/state):
```tsx
const { isSupported, permission, subscribed, requestPermission, unsubscribe } = useNotifications();
```

- [ ] **Step 3: Add the notification section in the Settings JSX**

Insert the following block **between** the `{/* ── App ── */}` section and the `{/* ── Versione app ── */}` section:

```tsx
{/* ── Notifiche ── */}
<SectionLabel>Notifiche</SectionLabel>
<SettingsGroup>
  <SettingsRow noBorder>
    <Icon name="bell" size={20} color="var(--text-sec)" />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
        Avvisi scadenze
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-ter)', marginTop: '2px' }}>
        {!isSupported
          ? 'Non supportate dal browser'
          : permission === 'denied'
          ? 'Bloccate nelle impostazioni del browser'
          : subscribed
          ? 'Attive'
          : 'Disattivate'}
      </div>
    </div>
    {isSupported && permission !== 'denied' && (
      <button
        onClick={subscribed ? unsubscribe : requestPermission}
        style={{
          padding: '7px 14px',
          borderRadius: '100px',
          fontSize: '13px',
          fontWeight: 700,
          background: subscribed
            ? 'var(--surface-hi)'
            : 'rgba(255,122,61,0.15)',
          color: subscribed ? 'var(--text-sec)' : 'var(--accent)',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          fontFamily: 'var(--font-ui)',
        }}
      >
        {subscribed ? 'Disattiva' : 'Attiva'}
      </button>
    )}
  </SettingsRow>
</SettingsGroup>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/screens/Settings.tsx
git commit -m "feat(notifications): add notification permission section to Settings"
```

---

## Task 14: End-to-end verification

- [ ] **Step 1: Run unit tests**

```bash
pnpm test
```

Expected: all tests pass including `notifications.test.ts`.

- [ ] **Step 2: Start dev server and open the app**

```bash
docker compose up -d
pnpm dev
```

Open `http://localhost:3000`.

- [ ] **Step 3: Verify bell icon**

- Bell button is visible at top-right on all tabs (Dashboard, Storico, Scadenze, Statistiche).
- Bell uses the app's `Icon` component — same stroke weight and color tokens as all other icons.
- No badge when no deadlines are urgent.

- [ ] **Step 4: Verify badge count**

Create a deadline with a due date 2 days from now. Bell badge shows `1`. Correct danger/warn colour.

- [ ] **Step 5: Verify NotificationDrawer**

Tap the bell. Sheet opens with the approaching deadline. "Segna come pagata" button is visible.

- [ ] **Step 6: Verify resolve flow**

Tap "Segna come pagata". Deadline disappears from the drawer and from Scadenze. Navigate to Storico — an expense record with the deadline's title appears.

- [ ] **Step 7: Verify Settings notification section**

Open Settings. A "Notifiche" section appears between "App" and "Versione app". Tap "Attiva" — browser prompts for notification permission.

- [ ] **Step 8: Verify push subscription in DB (after granting permission)**

```bash
pnpm exec prisma studio
```

Check the `PushSubscription` table — one row for the current user.

- [ ] **Step 9: Dry-run the cron endpoint**

```bash
curl -H "Authorization: Bearer <your_CRON_SECRET>" http://localhost:3000/api/cron/notify
```

Expected response: `{"sent": N, "stale": 0}` (N > 0 if there are approaching/expired deadlines for users with subscriptions).

- [ ] **Step 10: Run linter**

```bash
pnpm lint
```

Expected: no errors.
