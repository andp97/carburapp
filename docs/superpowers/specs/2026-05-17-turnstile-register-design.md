# Cloudflare Turnstile — Register Page Design

**Date:** 2026-05-17  
**Scope:** Register page only (`app/register/page.tsx` + `app/api/auth/register/route.ts`)

---

## Problem

The public registration endpoint is unprotected against automated account creation. A bot can POST `/api/auth/register` in a tight loop with generated emails and create unlimited accounts, exhausting database capacity and enabling downstream abuse.

## Solution

Add Cloudflare Turnstile to the register form. Turnstile issues a short-lived, cryptographically-signed challenge token on the client. The server verifies that token before doing any database work. Bots cannot obtain valid tokens at scale.

---

## Architecture

```
Browser (register page)
  └─ <Turnstile> widget (client-side, @marsidev/react-turnstile)
       └─ on success → cfToken stored in React state
            └─ form submit → POST /api/auth/register { email, password, cfToken }

Server (register route)
  └─ extract cfToken from body
  └─ POST https://challenges.cloudflare.com/turnstile/v0/siteverify
       { secret: TURNSTILE_SECRET_KEY, response: cfToken, remoteip: req.ip }
  └─ if !success → 400 "Verifica di sicurezza fallita"
  └─ if success → proceed with existing registration logic (email uniqueness, bcrypt, session)
```

---

## Components

### 1. Package
`@marsidev/react-turnstile` — lightweight React wrapper (~3 kB). Handles script loading, widget lifecycle, and cleanup.

### 2. Environment variables

| Variable | Visibility | Purpose |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public (client) | Renders the widget |
| `TURNSTILE_SECRET_KEY` | Private (server) | Verifies tokens with Cloudflare |

Both added to `.env.example` with placeholder values.

For local development, Cloudflare provides always-pass test keys:
- Site key: `1x00000000000000000000AA`
- Secret key: `1x0000000000000000000000000000000AA`

### 3. Frontend changes — `app/register/page.tsx`

- Import `Turnstile` from `@marsidev/react-turnstile`
- Add `token` state: `useState<string>('')`
- Render `<Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} theme="auto" onSuccess={setToken} onExpire={() => setToken('')} />` directly above the submit button
- Pass `cfToken: token` in the POST body
- Disable submit button when `token` is empty (widget hasn't been solved)
- After a failed API response, call `turnstileRef.current?.reset()` to force a new challenge

### 4. Backend changes — `app/api/auth/register/route.ts`

At the top of the POST handler, before any validation or DB access:

```ts
const { cfToken } = body;
if (!cfToken) {
  return NextResponse.json({ error: 'Verifica di sicurezza richiesta' }, { status: 400 });
}

const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    secret: process.env.TURNSTILE_SECRET_KEY,
    response: cfToken,
  }),
});
const verifyData = await verifyRes.json();
if (!verifyData.success) {
  return NextResponse.json({ error: 'Verifica di sicurezza fallita. Riprova.' }, { status: 400 });
}
```

---

## Error handling

| Scenario | Behaviour |
|---|---|
| Widget not yet solved | Submit button disabled (token is empty string) |
| Token expired (widget fires `onExpire`) | `token` reset to `''`, button re-disabled |
| Cloudflare verification fails (server) | 400 returned, displayed as inline error, widget reset client-side |
| Cloudflare unreachable (network error in route) | Caught by existing try/catch, 500 returned |
| `TURNSTILE_SECRET_KEY` not set | Request reaches `siteverify` with empty secret → Cloudflare returns `success: false` → safe 400 |

---

## What is NOT changing

- Login page — no Turnstile (out of scope)
- Existing registration validation logic (email format, password length, uniqueness check)
- Session handling after successful registration
- Any other route or component
