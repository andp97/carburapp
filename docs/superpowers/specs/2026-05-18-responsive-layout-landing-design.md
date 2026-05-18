# Design: Responsive Layout + Public Landing Page

**Date:** 2026-05-18  
**Status:** Approved  
**Branch:** feat/responsive-layout-landing

---

## Overview

Two independent improvements to CarburApp:

1. **Responsive layout (A1):** Make the app usable on desktop and tablet by introducing a sidebar navigation on screens ≥768px, replacing the bottom tab bar.
2. **Public landing page (B1):** Extract the "CarburApp — Il tracker spese auto pensato per gli italiani" splash from the authenticated `Onboarding.tsx` and expose it as a public route at `/`. Move the authenticated app shell to `/app`.

A future phase (A3) will restructure tabs into per-route Next.js App Router pages. This spec does not cover that.

---

## Section 1: Responsive Layout (A1)

### Approach

CSS-only media query breakpoint at `768px`. No JS breakpoint detection, no resize listeners, no layout flash.

### Components

**New: `components/Sidebar.tsx`**
- Fixed left sidebar, width 220px, height 100vh
- Renders the same tab list as `TabBar` (from shared `TABS` constant)
- "Aggiungi spesa" accent CTA button at the top (opens `SheetAddFuel`, same as the `+` tab)
- Below the CTA: nav items for Riepilogo, Storico, Scadenze, Statistiche
- Active item highlighted with `var(--accent)` text and a left-border indicator
- Hidden on mobile via `.sidebar { display: none }` (default); shown via `@media (min-width: 768px) { .sidebar { display: flex } }`
- Same theme variables as `TabBar` — no new design tokens needed

**Modified: `components/TabBar.tsx`**
- Unchanged functionally
- Gets a CSS class `tab-bar` so it can be hidden at the breakpoint

**Modified: `components/AppShell.tsx`**
- Renders both `<TabBar>` and `<Sidebar>` (one is always hidden via CSS)
- `<main>` element gets a CSS class `main-content` to receive the desktop left margin

**Modified: `app/globals.css`**
```css
@media (min-width: 768px) {
  .tab-bar    { display: none !important; }
  .sidebar    { display: flex !important; }
  .main-content { margin-left: 220px; }
}
/* Mobile default */
.sidebar { display: none; }
```

### "Aggiungi" button treatment

- **Mobile:** Circular orange `+` button in the center of the bottom tab bar (unchanged)
- **Desktop sidebar:** Full-width accent button labeled "➕ Aggiungi spesa" at the top of the sidebar, triggers the same `SheetAddFuel` sheet

### Top bar on desktop

The fixed top bar (VehicleChip + theme toggle + settings + bell) spans full width on all screen sizes. On desktop, the content to its left naturally starts after the sidebar — no changes needed to the top bar itself.

### Screen padding

All screens currently set `paddingTop: 'calc(env(safe-area-inset-top, 0px) + 76px)'` and `paddingBottom: 'calc(var(--tab-bar-height) + 16px)'`. On desktop, `paddingBottom` should reduce to a simple `24px` since there is no bottom tab bar. This is handled via a CSS class on `<main>` toggled by the media query.

---

## Section 2: Public Landing Page (B1)

### Route structure

| Route | Component | Auth |
|-------|-----------|------|
| `/` | `app/page.tsx` — new public landing | Public |
| `/app` | `app/app/page.tsx` — `<AppShell>` | Auth required |
| `/login` | `app/login/page.tsx` | Public |
| `/register` | `app/register/page.tsx` | Public |

### Middleware (`middleware.ts`)

Two redirect rules:
- Unauthenticated user requests `/app` → redirect to `/login`
- Authenticated user requests `/` → redirect to `/app`

Session check: the existing `getSession()` helper uses `cookies()` from `next/headers` and cannot be called in middleware. Instead, middleware reads the `carburapp_session` cookie directly from `request.cookies` and passes it to `getIronSession<SessionData>(request.cookies, SESSION_OPTIONS)` — iron-session's middleware-compatible signature. `SESSION_OPTIONS` is extracted to a shared constant in `lib/session.ts` to avoid duplication.

### Landing page content (`app/page.tsx`)

Server component (no `'use client'`). Static HTML — no JS required.

Content (extracted from `Onboarding.tsx`):
- Logo mark (gas station SVG icon, same as loading spinner)
- Wordmark: "CarburApp"
- Headline: "Il tracker spese auto pensato per gli italiani."
- Body: "Rifornimenti, scadenze, statistiche — tutto in un posto."
- Feature pills: Rifornimenti · Scadenze · Statistiche
- Two CTA buttons:
  - Primary: "Accedi" → `/login`
  - Secondary: "Registrati gratis" → `/register`

Styled with the same CSS variables (`var(--bg)`, `var(--accent)`, etc.) and fonts loaded globally. The page respects the system theme via the existing CSS `prefers-color-scheme` fallback.

### `Onboarding.tsx` changes

The splash hero (logo, headline, feature pills) is removed. `Onboarding.tsx` becomes a focused "add your first vehicle" form only — shown inside the authenticated app when `vehicles.length === 0`.

### Auth redirect after login/register

`app/login/page.tsx` and `app/register/page.tsx` currently redirect to `/` on success. These are updated to redirect to `/app`.

---

## Out of scope

- A3 (per-route Next.js layouts for each tab) — future phase
- Full marketing landing page (screenshots, testimonials) — not requested
- Sidebar collapse / icon-only mode on medium screens

---

## Files touched

| File | Change |
|------|--------|
| `components/Sidebar.tsx` | New |
| `components/TabBar.tsx` | Add CSS class |
| `components/AppShell.tsx` | Add Sidebar, CSS classes on main |
| `components/screens/Onboarding.tsx` | Remove splash hero section |
| `app/globals.css` | Responsive layout CSS rules |
| `app/page.tsx` | Rewrite as public landing page |
| `app/app/page.tsx` | New — move AppShell here |
| `app/login/page.tsx` | Update redirect to /app |
| `app/register/page.tsx` | Update redirect to /app |
| `middleware.ts` | New or update with auth redirect rules |
