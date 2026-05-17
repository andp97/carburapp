# Expense Notification System — Design Spec

**Date:** 2026-05-17  
**Status:** Approved

---

## Context

CarburApp tracks vehicle deadlines (bollo, assicurazione, tagliando, etc.) but currently has no way to alert users when one is approaching or overdue. Expired deadlines also have no connection to the expense history — they sit silently in the Scadenze screen. Users miss reminders and must manually add separate expense records after paying a deadline.

This feature adds:
1. **Background push notifications** (Web Push / VAPID, fully self-hosted) for deadlines due within 7 days and expired deadlines.
2. **In-app notification center** — a bell icon with badge count accessible from any tab.
3. **"Mark as paid" flow** — converts a deadline directly into an expense record in the history, then removes the deadline.

---

## Architecture

Four layers:

| Layer | What it does |
|---|---|
| **Push infrastructure** | VAPID keys in `.env`, `web-push` library, `PushSubscription` table, SW push event |
| **Daily cron** | `/api/cron/notify` (Vercel Cron, 9 AM) queries approaching/expired deadlines and fires push alerts |
| **In-app center** | Bell icon + badge in AppShell header; `NotificationDrawer` sheet lists urgent deadlines |
| **Mark as paid** | `POST /api/deadlines/[id]/resolve` creates a `Refuel` expense and deletes the deadline |

---

## Data Model

### New Prisma model — `PushSubscription`

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

Add the reverse relation to `User`:
```prisma
pushSubscriptions PushSubscription[]
```

### New environment variables (`.env.example`)

```
VAPID_PUBLIC_KEY=            # generate once: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:me@andreapavone.dev
CRON_SECRET=                 # random 32+ char secret
NEXT_PUBLIC_VAPID_PUBLIC_KEY= # same as VAPID_PUBLIC_KEY, exposed to browser
```

---

## API Routes

### `POST /api/push/subscribe`
Body: `{ endpoint: string, keys: { p256dh: string, auth: string } }`  
- Requires authenticated session.  
- Upserts a `PushSubscription` for the current user (keyed on `endpoint`).  
- Returns `{ success: true }`.

### `DELETE /api/push/subscribe`
Body: `{ endpoint: string }`  
- Deletes the matching subscription for the current user.

### `GET /api/cron/notify`
- Protected: requires `Authorization: Bearer <CRON_SECRET>` header (set by Vercel Cron automatically when `CRON_SECRET` env var is configured).
- Queries all deadlines where:
  - `dueDate >= now AND dueDate <= now + 7 days` → type: **approaching**
  - `dueDate < now` → type: **expired**
- For each deadline, fetches the user's `PushSubscription` records.
- Sends push via `web-push` with payload:
  - Approaching: `{ title: "Scadenza imminente", body: "[title] scade tra N giorni" }`
  - Expired: `{ title: "Scadenza scaduta", body: "[title] è scaduta il [date]" }`
- Removes stale subscriptions (410 Gone response from push service).
- Returns `{ sent: N, failed: M }`.

### `POST /api/deadlines/[id]/resolve`
- Requires authenticated session; verifies deadline belongs to the current user's vehicle.
- Maps deadline `kind` → `expenseType`:

  | kind | expenseType |
  |---|---|
  | `tagliando`, `revisione` | `manutenzione` |
  | `assicurazione`, `bollo`, `altro` | `altro` |

- Creates a `Refuel` record: `{ vehicleId, expenseType, total: deadline.amount ?? 0, notes: deadline.title, date: now }`.
- Deletes the `Deadline`.
- Returns the created `Refuel`.

---

## Service Worker (`public/sw.js`)

Add two new event listeners:

```js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'CarburApp', {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: { url: '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

---

## Frontend

### `lib/push.ts` (new)
Server-side helper: initialises `web-push` with VAPID details. Imported by `/api/push/subscribe` and `/api/cron/notify`.

### `hooks/useNotifications.ts` (new)
Client hook exposing:
- `permission: NotificationPermission` — current browser permission state.
- `requestPermission()` — calls `Notification.requestPermission()`, then subscribes via `navigator.serviceWorker.ready` + `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`, POSTs result to `/api/push/subscribe`.
- `unsubscribe()` — calls `pushManager.getSubscription()`, unsubscribes browser-side, DELETEs from `/api/push/subscribe`.
- `isSupported: boolean` — `'Notification' in window && 'PushManager' in window`.

### `components/NotificationDrawer.tsx` (new)
Bottom sheet (same pattern as existing sheets in the app):
- Receives `deadlines: Deadline[]` and `onResolve(id: string): void` props.
- Filters to expired (`days < 0`) and approaching (`0 ≤ days ≤ 7`).
- Renders each with its urgency pill (danger / warn), title, due date, and two actions:
  - "Segna come pagata" → calls `onResolve(id)` → `POST /api/deadlines/[id]/resolve` → refreshes.
  - "Vai a Scadenze" → switches to the `scadenze` tab.
- Empty state: "Nessun avviso — tutto a posto."

### `components/AppShell.tsx` changes
- When `selectedVehicle` changes, fetch `GET /api/deadlines?vehicleId=xxx` to keep a lightweight `alertDeadlines` state (expired + ≤7-day deadlines only, derived client-side from the full list). Re-fetch after any `resolve` action.
- Derive `alertCount = alertDeadlines.filter(d => getDaysUntil(d.dueDate) <= 7).length`.
- Add a bell icon button in the top-right header area. Shows a red badge when `alertCount > 0`.
- `notificationDrawerOpen` state toggles `NotificationDrawer`.
- Pass `alertDeadlines` and `onResolve` callback to `NotificationDrawer`.

### `components/screens/Scadenze.tsx` changes
- Add "Segna come pagata" button to `DeadlineCard` and `TimelineDeadline`.
- Calls `POST /api/deadlines/[id]/resolve`, then calls `fetchDeadlines()` to refresh.

### `components/screens/Settings.tsx` changes
- Add a "Notifiche" section using `useNotifications`.
- Shows current permission + a toggle button to enable/disable.
- If `!isSupported`: display "Notifiche non supportate dal browser".

### `lib/types.ts` additions
```ts
// Named PushSubscriptionRecord to avoid collision with the browser's built-in PushSubscription type
export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}
```

### `vercel.json` (new)
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

---

## Files to Create

| File | Action |
|---|---|
| `prisma/migrations/<timestamp>_push_subscription/` | Auto-generated via `prisma migrate dev` |
| `lib/push.ts` | New |
| `hooks/useNotifications.ts` | New |
| `components/NotificationDrawer.tsx` | New |
| `app/api/push/subscribe/route.ts` | New |
| `app/api/cron/notify/route.ts` | New |
| `app/api/deadlines/[id]/resolve/route.ts` | New |
| `vercel.json` | New |

## Files to Modify

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `PushSubscription` model + User relation |
| `public/sw.js` | Add `push` + `notificationclick` event listeners |
| `components/AppShell.tsx` | Bell icon, badge count, `NotificationDrawer` toggle |
| `components/screens/Scadenze.tsx` | "Segna come pagata" button on deadline cards |
| `components/screens/Settings.tsx` | Notification permission toggle section |
| `lib/types.ts` | Add `PushSubscription` type |
| `.env.example` | Add VAPID + CRON_SECRET vars |

---

## Verification

1. **VAPID setup**: run `npx web-push generate-vapid-keys`, add to `.env`, confirm `/api/push/subscribe` saves a row in `push_subscriptions`.
2. **Permission flow**: open Settings → tap enable → browser prompts for permission → subscription appears in DB.
3. **Cron dry-run**: call `GET /api/cron/notify` with the correct `Authorization` header locally (with a real subscription in DB) → confirm push arrives on the device.
4. **Mark as paid**: tap "Segna come pagata" on an expired deadline → deadline disappears from Scadenze → expense record appears in Storico manutenzioni.
5. **In-app badge**: create a deadline 3 days in the future → bell icon shows badge count of 1 → tap bell → `NotificationDrawer` lists the deadline.
6. **Stale subscription cleanup**: simulate a 410 response from the push service → confirm subscription is deleted from DB.
