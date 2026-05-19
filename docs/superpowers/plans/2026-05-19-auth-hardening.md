# Auth Hardening — Password Reset & Login Rate Limiting — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship two v0.1 launch blockers: an email-link password reset flow and IP-level brute-force protection on login.

**Architecture:** Two new Prisma models (`PasswordResetToken`, `LoginAttempt`) back both features. Token logic and rate-limit decisions are extracted to pure-function utilities (`lib/token.ts`, `lib/rate-limit.ts`) for testability. Nodemailer sends email via SMTP; Mailpit captures mail in dev/CI. Rate limiting runs inside the existing login route handler (not Edge middleware, because Prisma cannot run at the Edge).

**Tech Stack:** Next.js 16 App Router, Prisma 7 (PostgreSQL), Nodemailer, Mailpit, `@marsidev/react-turnstile`, Vitest (unit), Playwright (E2E).

---

## File Map

| Status | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/token.ts` | `generateToken`, `hashToken`, `isTokenValid` |
| Create | `lib/rate-limit.ts` | `isRateLimited`, rate-limit constants |
| Create | `lib/email.ts` | `sendPasswordResetEmail` via Nodemailer |
| Create | `app/api/auth/password-reset/request/route.ts` | POST — validates Turnstile, generates + emails token |
| Create | `app/api/auth/password-reset/confirm/route.ts` | POST — validates token, updates password |
| Create | `app/reset-password/page.tsx` | New-password form (reads token from URL) |
| Modify | `app/api/auth/login/route.ts` | Add IP rate-limiting before credential check |
| Modify | `app/login/page.tsx` | Add "forgot password" toggle with request form |
| Modify | `prisma/schema.prisma` | Add `PasswordResetToken` and `LoginAttempt` models |
| Modify | `docker-compose.yml` | Add Mailpit service (SMTP :1025, UI :8025) |
| Modify | `.env.example` | Document SMTP_* vars |
| Modify | `playwright.config.ts` | Add SMTP env vars to webServer.env |
| Modify | `.github/workflows/ci.yml` | Add Mailpit service + SMTP env to e2e job |
| Create | `tests/unit/password-reset.test.ts` | Unit tests for token and rate-limit utilities |
| Create | `tests/e2e/06-password-reset.spec.ts` | E2E tests for full reset flow + rate limiting |

---

## Task 1: Install nodemailer

**Files:**
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install the package**

```bash
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

Expected: `package.json` gains `"nodemailer"` in dependencies and `"@types/nodemailer"` in devDependencies.

- [ ] **Step 2: Verify types resolve**

```bash
pnpm typecheck
```

Expected: No errors (nodemailer types available).

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add nodemailer for transactional email"
```

---

## Task 2: Prisma schema + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add both new models to schema**

Append to `prisma/schema.prisma` after the `PushSubscription` model:

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}

model LoginAttempt {
  id        String   @id @default(cuid())
  ip        String
  createdAt DateTime @default(now())

  @@index([ip, createdAt])
}
```

- [ ] **Step 2: Run migration**

```bash
pnpm exec prisma migrate dev --name add-password-reset-and-login-attempts
```

Expected output: `Your database is now in sync with your schema.`

- [ ] **Step 3: Regenerate Prisma client**

```bash
pnpm exec prisma generate
```

Expected: `Generated Prisma Client` line in output.

- [ ] **Step 4: Typecheck**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add PasswordResetToken and LoginAttempt models"
```

---

## Task 3: Token utility + unit tests (TDD)

**Files:**
- Create: `tests/unit/password-reset.test.ts`
- Create: `lib/token.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/password-reset.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { hashToken, isTokenValid } from '../../lib/token';

describe('hashToken', () => {
  it('returns a 64-char hex SHA-256 digest', () => {
    const result = hashToken('abc');
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[a-f0-9]+$/);
  });

  it('is deterministic for the same input', () => {
    expect(hashToken('hello')).toBe(hashToken('hello'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashToken('foo')).not.toBe(hashToken('bar'));
  });
});

describe('isTokenValid', () => {
  it('returns true when token is not expired and not used', () => {
    const record = {
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    };
    expect(isTokenValid(record)).toBe(true);
  });

  it('returns false when token is expired', () => {
    const record = {
      expiresAt: new Date(Date.now() - 1),
      usedAt: null,
    };
    expect(isTokenValid(record)).toBe(false);
  });

  it('returns false when token has been used', () => {
    const record = {
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
    };
    expect(isTokenValid(record)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm exec vitest run tests/unit/password-reset.test.ts
```

Expected: FAIL — `Cannot find module '../../lib/token'`.

- [ ] **Step 3: Implement lib/token.ts**

Create `lib/token.ts`:

```typescript
import crypto from 'crypto';

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function isTokenValid(record: { expiresAt: Date; usedAt: Date | null }): boolean {
  return record.usedAt === null && record.expiresAt > new Date();
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm exec vitest run tests/unit/password-reset.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/token.ts tests/unit/password-reset.test.ts
git commit -m "feat: add token utility with SHA-256 hashing"
```

---

## Task 4: Rate limit utility + unit tests (TDD)

**Files:**
- Modify: `tests/unit/password-reset.test.ts`
- Create: `lib/rate-limit.ts`

- [ ] **Step 1: Add rate-limit tests to the existing test file**

In `tests/unit/password-reset.test.ts`, add the import at the top of the file (after the existing `import { hashToken, isTokenValid }` line):

```typescript
import { isRateLimited, RATE_LIMIT_MAX } from '../../lib/rate-limit';
```

Then append this describe block at the bottom of the file:

```typescript
describe('isRateLimited', () => {
  it('returns false when attempt count is below the threshold', () => {
    expect(isRateLimited(RATE_LIMIT_MAX - 1)).toBe(false);
  });

  it('returns true when attempt count equals the threshold', () => {
    expect(isRateLimited(RATE_LIMIT_MAX)).toBe(true);
  });

  it('returns true when attempt count exceeds the threshold', () => {
    expect(isRateLimited(RATE_LIMIT_MAX + 5)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify new tests fail**

```bash
pnpm exec vitest run tests/unit/password-reset.test.ts
```

Expected: FAIL — `Cannot find module '../../lib/rate-limit'`.

- [ ] **Step 3: Implement lib/rate-limit.ts**

Create `lib/rate-limit.ts`:

```typescript
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_MAX = 10;

export function isRateLimited(attemptCount: number): boolean {
  return attemptCount >= RATE_LIMIT_MAX;
}
```

- [ ] **Step 4: Run all unit tests to verify everything passes**

```bash
pnpm test
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/rate-limit.ts tests/unit/password-reset.test.ts
git commit -m "feat: add rate-limit utility and unit tests"
```

---

## Task 5: Email utility + Mailpit setup

**Files:**
- Create: `lib/email.ts`
- Modify: `docker-compose.yml`
- Modify: `.env.example`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Add Mailpit to docker-compose.yml**

In `docker-compose.yml`, add the `mailpit` service after the `db` service:

```yaml
  mailpit:
    image: axllent/mailpit
    ports:
      - "1025:1025"
      - "8025:8025"
```

The final `docker-compose.yml` should look like:

```yaml
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: carburapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  mailpit:
    image: axllent/mailpit
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  pgdata:
```

- [ ] **Step 2: Add SMTP vars to .env.example**

Append to `.env.example`:

```
# Nodemailer SMTP — point to Mailpit for local dev
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@carburapp.local
```

- [ ] **Step 3: Add SMTP vars to playwright.config.ts webServer env**

In `playwright.config.ts`, inside the `webServer.env` object, add:

```typescript
      SMTP_HOST: 'localhost',
      SMTP_PORT: '1025',
      SMTP_FROM: 'noreply@carburapp.local',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
```

The full `webServer` block should look like:

```typescript
  webServer: {
    command: 'pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/carburapp',
      SESSION_SECRET: 'e2e-test-secret-not-used-in-production-padding',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
      TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
      SMTP_HOST: 'localhost',
      SMTP_PORT: '1025',
      SMTP_FROM: 'noreply@carburapp.local',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    },
  },
```

- [ ] **Step 4: Create lib/email.ts**

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: false,
  auth:
    process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
});

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@carburapp.local',
    to,
    subject: 'Reimposta la tua password — CarburApp',
    text: `Hai richiesto il reset della password.\n\nClicca il link per impostare una nuova password (valido per 1 ora):\n\n${resetUrl}\n\nSe non hai richiesto il reset, ignora questa email.`,
    html: `<p>Hai richiesto il reset della password.</p><p><a href="${resetUrl}">Reimposta la password</a> (link valido per 1 ora)</p><p>Se non hai richiesto il reset, ignora questa email.</p>`,
  });
}
```

- [ ] **Step 5: Typecheck**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 6: Start Mailpit locally to verify it works**

```bash
docker compose up -d mailpit
```

Navigate to `http://localhost:8025` — Mailpit web UI should be visible.

- [ ] **Step 7: Commit**

```bash
git add lib/email.ts docker-compose.yml .env.example playwright.config.ts
git commit -m "feat: add Nodemailer email utility and Mailpit for local/test SMTP"
```

---

## Task 6: Password reset request API route

**Files:**
- Create: `app/api/auth/password-reset/request/route.ts`

- [ ] **Step 1: Create the route**

Create `app/api/auth/password-reset/request/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateToken, hashToken } from '@/lib/token';
import { sendPasswordResetEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, cfToken } = body;

    if (!cfToken || typeof cfToken !== 'string') {
      return NextResponse.json({ error: 'Verifica di sicurezza richiesta' }, { status: 400 });
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: cfToken }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json({ error: 'Verifica di sicurezza fallita. Riprova.' }, { status: 400 });
    }

    const ok = NextResponse.json({
      data: { message: "Se l'email è registrata, riceverai un link a breve." },
    });

    if (!email || typeof email !== 'string') return ok;

    const normalizedEmail = email.toLowerCase().trim();
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) return ok;

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const raw = generateToken();
    const token = hashToken(raw);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${raw}`;

    try {
      await sendPasswordResetEmail(normalizedEmail, resetUrl);
    } catch (err) {
      console.error('Failed to send password reset email:', err);
    }

    return ok;
  } catch (error) {
    console.error('POST /api/auth/password-reset/request error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 3: Smoke-test manually**

```bash
curl -s -X POST http://localhost:3000/api/auth/password-reset/request \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","cfToken":"test-bypass-token"}' | jq .
```

Expected: `{"data":{"message":"Se l'email è registrata, riceverai un link a breve."}}` (regardless of whether email exists).

- [ ] **Step 4: Commit**

```bash
git add app/api/auth/password-reset/request/route.ts
git commit -m "feat: add password reset request API route"
```

---

## Task 7: Password reset confirm API route

**Files:**
- Create: `app/api/auth/password-reset/confirm/route.ts`

- [ ] **Step 1: Create the route**

Create `app/api/auth/password-reset/confirm/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { hashToken, isTokenValid } from '@/lib/token';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

const INVALID = NextResponse.json({ error: 'Token non valido o scaduto' }, { status: 400 });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== 'string' || !newPassword || typeof newPassword !== 'string') {
      return INVALID;
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La password deve contenere almeno 8 caratteri' },
        { status: 400 },
      );
    }

    const hashedToken = hashToken(token);
    const prisma = await getPrisma();

    const record = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
    });

    if (!record || !isTokenValid(record)) return INVALID;

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ data: { message: 'Password aggiornata' } });
  } catch (error) {
    console.error('POST /api/auth/password-reset/confirm error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/password-reset/confirm/route.ts
git commit -m "feat: add password reset confirm API route"
```

---

## Task 8: Reset password page

**Files:**
- Create: `app/reset-password/page.tsx`

- [ ] **Step 1: Create the page**

Create `app/reset-password/page.tsx`:

```tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--border-hi)',
  borderRadius: '14px',
  padding: '14px 16px',
  fontSize: '16px',
  fontWeight: 500,
  color: 'var(--text)',
  fontFamily: 'var(--font-ui)',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-ter)',
  marginBottom: '8px',
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  if (!token) return null;

  if (done) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
            Password aggiornata
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-ter)' }}>
            Reindirizzamento al login…
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Errore del server');
        return;
      }
      setDone(true);
      setTimeout(() => router.replace('/login'), 2000);
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 21h11M5 12h11M16 9l2.5 2.5a1.5 1.5 0 0 1 .5 1.1V17a1.5 1.5 0 0 0 3 0V8.4a1.5 1.5 0 0 0-.4-1L19 5" />
            </svg>
          </div>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Nuova password
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-ter)', textAlign: 'center', marginBottom: '36px' }}>
          Scegli una nuova password per il tuo account
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Nuova password</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Nuova password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Conferma password</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Conferma password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '6px', width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, minHeight: '56px', fontFamily: 'var(--font-ui)' }}
          >
            {loading ? 'Aggiornamento…' : 'Imposta password'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-ter)' }}>
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
            Torna al login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/reset-password/page.tsx
git commit -m "feat: add /reset-password page for completing password reset"
```

---

## Task 9: Login page — forgot password UI

**Files:**
- Modify: `app/login/page.tsx`

The login page gains a `view` state (`'login' | 'reset' | 'sent'`) and a Turnstile-protected form for the reset request.

- [ ] **Step 1: Replace the full content of app/login/page.tsx**

```tsx
'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

type View = 'login' | 'reset' | 'sent';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--border-hi)',
  borderRadius: '14px',
  padding: '14px 16px',
  fontSize: '16px',
  fontWeight: 500,
  color: 'var(--text)',
  fontFamily: 'var(--font-ui)',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-ter)',
  marginBottom: '8px',
};

export default function LoginPage() {
  const [view, setView] = useState<View>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Reset request form state
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error ?? 'Errore di accesso');
        return;
      }
      window.location.href = '/app';
    } catch {
      setLoginError('Errore di rete. Riprova.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, cfToken: resetToken }),
      });
      if (!res.ok) {
        const data = await res.json();
        setResetError(data.error ?? 'Errore del server');
        turnstileRef.current?.reset();
        setResetToken('');
        return;
      }
      setView('sent');
    } catch {
      setResetError('Errore di rete. Riprova.');
      turnstileRef.current?.reset();
      setResetToken('');
    } finally {
      setResetLoading(false);
    }
  };

  const logo = (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 21h11M5 12h11M16 9l2.5 2.5a1.5 1.5 0 0 1 .5 1.1V17a1.5 1.5 0 0 0 3 0V8.4a1.5 1.5 0 0 0-.4-1L19 5" />
        </svg>
      </div>
    </div>
  );

  if (view === 'sent') {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {logo}
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Email inviata
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-ter)', textAlign: 'center', marginBottom: '36px' }}>
            {"Se l'email è registrata, riceverai un link a breve."}
          </p>
          <button
            onClick={() => { setView('login'); setResetEmail(''); setResetToken(''); }}
            style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none', cursor: 'pointer', minHeight: '56px', fontFamily: 'var(--font-ui)' }}
          >
            Torna al login
          </button>
        </div>
      </div>
    );
  }

  if (view === 'reset') {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {logo}
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Password dimenticata
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-ter)', textAlign: 'center', marginBottom: '36px' }}>
            Inserisci la tua email e ti invieremo un link per reimpostare la password.
          </p>

          <form onSubmit={handleResetRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                autoComplete="email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="tuaemail@esempio.it"
                required
                style={inputStyle}
              />
            </div>

            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={setResetToken}
              onExpire={() => setResetToken('')}
              options={{ size: 'flexible', theme: 'auto' }}
            />

            {resetError && (
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', color: 'var(--danger)' }}>
                {resetError}
              </div>
            )}

            <button
              type="submit"
              disabled={resetLoading || !resetToken}
              style={{ marginTop: '6px', width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none', cursor: resetLoading || !resetToken ? 'not-allowed' : 'pointer', opacity: resetLoading || !resetToken ? 0.5 : 1, minHeight: '56px', fontFamily: 'var(--font-ui)', transition: 'opacity 0.15s' }}
            >
              {resetLoading ? 'Invio in corso…' : 'Invia link di reset'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-ter)' }}>
            <button
              onClick={() => { setView('login'); setResetError(null); setResetToken(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-ui)' }}
            >
              Torna al login
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {logo}
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          CarburApp
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-ter)', textAlign: 'center', marginBottom: '36px' }}>
          Accedi al tuo account
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tuaemail@esempio.it"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => { setView('reset'); setLoginError(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-ui)' }}
            >
              Hai dimenticato la password?
            </button>
          </div>

          {loginError && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', color: 'var(--danger)' }}>
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            style={{ marginTop: '6px', width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none', cursor: loginLoading ? 'not-allowed' : 'pointer', opacity: loginLoading ? 0.7 : 1, minHeight: '56px', fontFamily: 'var(--font-ui)' }}
          >
            {loginLoading ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-ter)' }}>
          Non hai un account?{' '}
          <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: add forgot password flow to login page"
```

---

## Task 10: Login rate limiting

**Files:**
- Modify: `app/api/auth/login/route.ts`

- [ ] **Step 1: Replace app/api/auth/login/route.ts with rate-limited version**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';
import { isRateLimited, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email non valida' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password non valida' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
    const prisma = await getPrisma();
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

    const attemptCount = await prisma.loginAttempt.count({
      where: { ip, createdAt: { gte: windowStart } },
    });

    if (isRateLimited(attemptCount)) {
      return NextResponse.json(
        { error: 'Troppi tentativi. Riprova tra qualche minuto.' },
        { status: 429 },
      );
    }

    await prisma.loginAttempt.create({ data: { ip } });

    if (Math.random() < 0.05) {
      await prisma.loginAttempt.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    const dummyHash = '$2b$12$invalidhashfortiminguniformity';
    const passwordMatch = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !passwordMatch) {
      return NextResponse.json({ error: 'Email o password non corretti' }, { status: 401 });
    }

    const session = await getSession();
    session.user = { id: user.id, email: user.email };
    await session.save();

    return NextResponse.json({ data: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 3: Run unit tests to ensure nothing is broken**

```bash
pnpm test
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add app/api/auth/login/route.ts
git commit -m "feat: add IP-based rate limiting to login route"
```

---

## Task 11: E2E tests

**Files:**
- Create: `tests/e2e/06-password-reset.spec.ts`

Note on test isolation: these tests use a dedicated test user (`reset-e2e@carburapp.test`) registered within the test suite, separate from the shared `e2e@carburapp.test` user. This avoids mutating the shared test user's password, which would break the `storageState` session used by other test files.

- [ ] **Step 1: Create tests/e2e/06-password-reset.spec.ts**

```typescript
import { test, expect } from '@playwright/test';

const RESET_TEST_EMAIL = 'reset-e2e@carburapp.test';
const RESET_TEST_PASSWORD = 'reset-e2e-initial-123';
const MAILPIT_API = 'http://localhost:8025/api/v1';

test.describe('password reset flow', () => {
  test.beforeAll(async ({ request }) => {
    // Register a dedicated test user for reset tests (409 = already exists, both are fine)
    await request.post('/api/auth/register', {
      data: { email: RESET_TEST_EMAIL, password: RESET_TEST_PASSWORD, cfToken: 'test-bypass-token' },
    });
  });

  test.beforeEach(async ({ request }) => {
    // Clear Mailpit inbox before each test
    await request.delete(`${MAILPIT_API}/messages`);
  });

  test('happy path: request reset → receive email → set new password → login succeeds', async ({ page, request }) => {
    const newPassword = 'reset-e2e-new-456';

    // Step 1: Request a password reset via the API (bypasses browser Turnstile)
    const resetRes = await request.post('/api/auth/password-reset/request', {
      data: { email: RESET_TEST_EMAIL, cfToken: 'test-bypass-token' },
    });
    expect(resetRes.ok()).toBe(true);
    const resetBody = await resetRes.json();
    expect(resetBody.data.message).toContain('email');

    // Step 2: Wait for Mailpit to capture the email (poll up to 5 s)
    let msgId: string | undefined;
    await expect.poll(
      async () => {
        const res = await request.get(`${MAILPIT_API}/messages`);
        const body = await res.json();
        if (body.total > 0) msgId = body.messages[0].ID;
        return body.total;
      },
      { timeout: 5000, intervals: [500] },
    ).toBeGreaterThan(0);

    // Step 3: Extract the reset URL from the plain-text email body
    const msgRes = await request.get(`${MAILPIT_API}/message/${msgId}`);
    const msg = await msgRes.json();
    const match = (msg.Text as string).match(/http:\/\/[^\s]+\/reset-password\?token=[a-f0-9]+/);
    expect(match).not.toBeNull();
    const resetUrl = match![0];

    // Step 4: Navigate to the reset URL and set the new password
    await page.goto(resetUrl);
    await page.fill('input[placeholder="Nuova password"]', newPassword);
    await page.fill('input[placeholder="Conferma password"]', newPassword);
    await page.click('button[type="submit"]');

    // Step 5: Should redirect to login after success
    await page.waitForURL('/login');

    // Step 6: Login with the new password
    await page.fill('input[type="email"]', RESET_TEST_EMAIL);
    await page.fill('input[type="password"]', newPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/app');

    // Restore the original password so beforeAll state is clean for re-runs
    await request.post('/api/auth/password-reset/request', {
      data: { email: RESET_TEST_EMAIL, cfToken: 'test-bypass-token' },
    });
    const res2 = await request.get(`${MAILPIT_API}/messages`);
    const msgs2 = await res2.json();
    const msg2Res = await request.get(`${MAILPIT_API}/message/${msgs2.messages[0].ID}`);
    const msg2 = await msg2Res.json();
    const match2 = (msg2.Text as string).match(/http:\/\/[^\s]+\/reset-password\?token=[a-f0-9]+/);
    if (match2) {
      const restoreToken = match2[0].split('token=')[1];
      await request.post('/api/auth/password-reset/confirm', {
        data: { token: restoreToken, newPassword: RESET_TEST_PASSWORD },
      });
    }
  });

  test('used token shows an error on the reset page', async ({ page, request }) => {
    // Request a reset and get the token
    await request.post('/api/auth/password-reset/request', {
      data: { email: RESET_TEST_EMAIL, cfToken: 'test-bypass-token' },
    });

    await expect.poll(
      async () => {
        const res = await request.get(`${MAILPIT_API}/messages`);
        const body = await res.json();
        return body.total;
      },
      { timeout: 5000, intervals: [500] },
    ).toBeGreaterThan(0);

    const msgsRes = await request.get(`${MAILPIT_API}/messages`);
    const msgs = await msgsRes.json();
    const msgRes = await request.get(`${MAILPIT_API}/message/${msgs.messages[0].ID}`);
    const msg = await msgRes.json();
    const match = (msg.Text as string).match(/http:\/\/[^\s]+\/reset-password\?token=([a-f0-9]+)/);
    expect(match).not.toBeNull();
    const rawToken = match![1];
    const resetUrl = match![0];

    // Use the token once via API
    await request.post('/api/auth/password-reset/confirm', {
      data: { token: rawToken, newPassword: RESET_TEST_PASSWORD },
    });

    // Navigate to the same URL again — should show an error
    await page.goto(resetUrl);
    await page.fill('input[placeholder="Nuova password"]', 'anotherpassword');
    await page.fill('input[placeholder="Conferma password"]', 'anotherpassword');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/non valido o scaduto/i)).toBeVisible();
  });
});

test.describe('login rate limiting', () => {
  test('returns 429 after exceeding the attempt threshold', async ({ request }) => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await request.post('/api/auth/login', {
        data: { email: 'ratelimit-test@carburapp.test', password: 'wrongpassword' },
      });
      statuses.push(res.status());
    }
    // At least one response must be 429
    expect(statuses).toContain(429);
    // The last request (well past the threshold) must be 429
    expect(statuses[statuses.length - 1]).toBe(429);
  });
});
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 3: Build and run E2E tests locally (requires Mailpit running)**

```bash
docker compose up -d
pnpm build
pnpm test:e2e --grep "password reset|rate limiting"
```

Expected: Tests pass. If Mailpit is not reachable, verify `docker compose up -d mailpit`.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/06-password-reset.spec.ts
git commit -m "test(e2e): add password reset and rate limiting tests"
```

---

## Task 12: CI configuration update

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add Mailpit service and SMTP env to the e2e job**

In `.github/workflows/ci.yml`, inside the `e2e` job, add the `mailpit` service under `services:` and add SMTP env vars:

```yaml
  e2e:
    name: E2E tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: carburapp_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      mailpit:
        image: axllent/mailpit
        ports:
          - 1025:1025
          - 8025:8025
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/carburapp_test
      SMTP_HOST: localhost
      SMTP_PORT: "1025"
      SMTP_FROM: noreply@carburapp.local
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec prisma generate
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
        env:
          NEXT_PUBLIC_TURNSTILE_SITE_KEY: 1x00000000000000000000AA
      - run: pnpm test:e2e
```

Note: `playwright.config.ts` already injects `SMTP_HOST`, `SMTP_PORT`, and `SMTP_FROM` into the test server via `webServer.env`, so the job-level env vars shown above are only for any steps that run outside the Next.js server process.

- [ ] **Step 2: Verify CI configuration is valid YAML**

```bash
pnpm exec js-yaml .github/workflows/ci.yml 2>&1 || python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "YAML valid"
```

Expected: No parse errors.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add Mailpit service to e2e job for email testing"
```

---

## Final verification

- [ ] **Run full test suite**

```bash
pnpm test
pnpm typecheck
pnpm lint
```

Expected: All pass, no errors.

- [ ] **Run E2E tests end-to-end**

```bash
docker compose up -d
pnpm build && pnpm test:e2e
```

Expected: All E2E tests pass, including the new `06-password-reset.spec.ts`.

- [ ] **Acceptance criteria check**

- [ ] Users can request a password reset email and complete a reset with an expiring token
- [ ] Reset token is single-use and expires after 1 hour
- [ ] Request form is protected by Cloudflare Turnstile
- [ ] `/api/auth/login` rejects more than 10 attempts from the same IP within 15 minutes with a 429
- [ ] All new flows covered by unit and E2E tests
- [ ] Mailpit runs in docker-compose for local dev and as a CI service
