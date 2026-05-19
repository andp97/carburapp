# Auth Hardening — Password Reset & Login Rate Limiting

**Date:** 2026-05-19
**Status:** Approved
**Blocking:** v0.1 launch (see `docs/v0.1-launch-readiness-issue.md`)

## Overview

Two features required before shipping v0.1:

1. **Password reset flow** — email-link reset using a short-lived token
2. **Login rate limiting** — IP-level brute-force protection on `/api/auth/login`

## Schema Changes

Two new Prisma models added to `prisma/schema.prisma`:

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String    @unique  // SHA-256 hash of the raw token
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

Token security: the raw token is `crypto.randomBytes(32).toString('hex')`. Only its SHA-256 hash is stored in the DB to prevent valid tokens from being exposed in a DB leak.

## Feature 1: Password Reset

### Flow

1. User clicks "Hai dimenticato la password?" on the login screen
2. A request form appears: email field + Cloudflare Turnstile widget + submit
3. `POST /api/auth/password-reset/request` is called
4. Server verifies Turnstile token, then looks up the user — **always returns 200** regardless of whether the email exists (prevents user enumeration)
5. If user found: any existing unused reset tokens for that user are deleted, a new token is generated, its SHA-256 hash is stored in `PasswordResetToken` with a 1-hour expiry, and an email is sent via Nodemailer
6. User sees: "Se l'email è registrata, riceverai un link a breve"
7. User clicks the link in the email → navigates to `/reset-password?token=<raw_token>`
8. The `/reset-password` page shows: new password field + confirm password field + submit
9. `POST /api/auth/password-reset/confirm` is called with `{ token, newPassword }`
10. Server hashes the incoming token (SHA-256), finds the matching `PasswordResetToken` record, validates it is not expired and not already used
11. If valid: updates `User.passwordHash`, sets `PasswordResetToken.usedAt = now()`
12. User is redirected to `/` (main app login screen)

### API Routes

**`POST /api/auth/password-reset/request`**
- Body: `{ email: string, cfToken: string }`
- Verifies Turnstile `cfToken` first (same pattern as `/api/auth/register`)
- Always returns `200 { data: { message: "..." } }` — no user enumeration
- On SMTP failure: logs error, still returns 200 (silent fail to avoid leaking existence)

**`POST /api/auth/password-reset/confirm`**
- Body: `{ token: string, newPassword: string }`
- Validates: token exists, `expiresAt > now()`, `usedAt` is null, `newPassword.length >= 8`
- On any validation failure: `400 { error: 'Token non valido o scaduto' }` (generic, no detail)
- On success: `200 { data: { message: "Password aggiornata" } }`

### New Page

`app/reset-password/page.tsx` — client component:
- Reads `token` from URL search params on mount
- If no token: redirects to `/`
- Renders new password + confirm password form
- On success: redirects to `/` 
- On error: shows error message with link to request a new reset

### Email

Sent via Nodemailer using SMTP credentials from env vars. Plain-text + HTML body containing the reset link: `${NEXT_PUBLIC_APP_URL}/reset-password?token=<raw_token>`.

### Turnstile

The request form includes a Turnstile widget (same `@marsidev/react-turnstile` component already used in the register form). The confirm form does not require Turnstile — the token itself proves the user received the email.

## Feature 2: Login Rate Limiting

Rate limiting is applied inside the existing `POST /api/auth/login` handler (not Edge middleware, since Prisma cannot run at the Edge).

### Algorithm

1. Extract IP: `req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'`
2. Count `LoginAttempt` rows where `ip = <ip> AND createdAt > now() - 15 minutes`
3. If count ≥ 10: return `429 { error: 'Troppi tentativi. Riprova tra qualche minuto.' }`
4. Insert a new `LoginAttempt` row (on every attempt, success or failure)
5. Continue with existing credential check

### Cleanup

Lazy cleanup runs ~1 in 20 requests: delete `LoginAttempt` rows older than 1 hour. This keeps the table small without a dedicated cron job.

```ts
if (Math.random() < 0.05) {
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
  });
}
```

### Window & Threshold

- Window: 15 minutes
- Threshold: 10 attempts
- These are constants at the top of the login route file, easy to tune.

## Environment Variables

New vars to add to `.env.example`:

```
# Nodemailer SMTP
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@carburapp.local
```

`SMTP_USER` and `SMTP_PASS` are optional (empty = no auth, which is correct for Mailpit).

## Testing

### Unit Tests — `tests/unit/password-reset.test.ts`

- Token hashing: SHA-256 of a known hex string produces the expected digest
- Expiry logic: token with `expiresAt` in the past is rejected; future is accepted
- Rate limit window: attempt count at 9 passes, at 10 returns 429

### E2E Tests — `tests/e2e/06-password-reset.spec.ts`

Tests run against a local server with Mailpit capturing outbound email.

- **Happy path:** submit request form with test email → poll Mailpit API (`GET http://localhost:8025/api/v1/messages`) → extract reset link from latest message body → navigate to `/reset-password?token=...` → submit new password → login with new password succeeds
- **Used token:** reuse the same token URL after a successful reset → error message is shown
- **Rate limiting:** send 10 `POST /api/auth/login` requests with wrong password → 11th request returns 429

### Mailpit Setup

**Local development:** add to `docker-compose.yml`:
```yaml
mailpit:
  image: axllent/mailpit
  ports:
    - "1025:1025"   # SMTP
    - "8025:8025"   # Web UI
```

**CI (GitHub Actions):** add as a service container in the workflow:
```yaml
services:
  mailpit:
    image: axllent/mailpit
    ports:
      - 1025:1025
      - 8025:8025
```

`.env.example` default `SMTP_HOST=localhost` and `SMTP_PORT=1025` work for both environments without auth.

## Acceptance Criteria

- [ ] Users can request a password reset email and complete a reset with an expiring token
- [ ] Reset token is single-use and expires after 1 hour
- [ ] Request form is protected by Cloudflare Turnstile
- [ ] `/api/auth/login` rejects more than 10 attempts from the same IP within 15 minutes with a 429
- [ ] All new flows covered by unit and E2E tests
- [ ] Mailpit runs in docker-compose for local dev and as a CI service
