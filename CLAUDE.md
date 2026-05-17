# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev             # Start dev server (Turbopack)
pnpm build           # prisma generate + migrate + next build
pnpm lint            # ESLint
pnpm typecheck       # tsc --noEmit
pnpm test            # Vitest unit tests (run once)
pnpm test:watch      # Vitest in watch mode
pnpm test:e2e        # Playwright e2e (requires running server on :3000)
pnpm db:seed         # Seed the database
pnpm exec prisma migrate dev --name <name>  # Create and apply a new migration
pnpm exec prisma studio                     # Visual DB browser
```

Start the local database before running the app:

```bash
docker compose up -d
```

## Architecture

CarburApp is a **single-page PWA** that renders all views client-side. There is exactly one Next.js page (`app/page.tsx`) which renders `<AppShell>`. AppShell owns all top-level state (selected vehicle, active tab, sheet open/close) and renders one of four screen components based on `activeTab`. The `<TabBar>` drives navigation; the "aggiungi" tab opens `<SheetAddFuel>` rather than switching screens.

### Data flow

All data fetching is done via `fetch()` calls to the REST API routes in `app/api/`. API routes import `prisma` from `lib/prisma.ts` and talk directly to PostgreSQL. There is no server-side rendering or RSC data fetching — every screen fetches its own data on mount.

**Prisma 7 note:** The client is initialised with a driver adapter (`PrismaPg`). Do not remove the adapter — Prisma 7 requires it for PostgreSQL. Always run `prisma generate` before accessing the client.

### Theme system

Themes are CSS custom properties. The root CSS defines the dark theme (`notte`) by default; `[data-theme='giorno']` overrides them. `ThemeProvider` (`contexts/ThemeContext.tsx`) sets the `data-theme` attribute on `<html>` and persists the choice to `localStorage`. All components consume CSS variables directly (`var(--bg)`, `var(--accent)`, etc.) rather than using theme objects at runtime. `DARK_THEME` and `LIGHT_THEME` in `lib/types.ts` are TypeScript mirrors of the CSS variables and are used when inline styles are unavoidable.

### Styling conventions

- CSS Modules for component-scoped styles; global CSS custom properties for tokens.
- Inline styles are acceptable for dynamic/theme-driven values that cannot be expressed with static class names.
- Fonts: Manrope (UI) and JetBrains Mono (numeric/code), both injected as Next.js font variables.

### Environment

Requires `DATABASE_URL` (see `.env.example`). Set `NEXT_PUBLIC_APP_URL` for production OG metadata.

### Tests

- **Unit:** Vitest + jsdom, files in `tests/unit/`. Run a single file: `pnpm exec vitest run tests/unit/utils.test.ts`.
- **E2E:** Playwright, files in `tests/e2e/`. Requires a built and running production server (`npm run build && npm run start`). The config starts the server automatically via `webServer`.

### Localisation

The UI is in Italian. Enum values for `fuelType` and `kind` (deadlines) are Italian strings defined in `lib/types.ts`. Use `FUEL_LABELS`, `DEADLINE_LABELS`, and `MONTHS_IT` from that file for display strings.
