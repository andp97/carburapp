# MVP Completion — Settings, Vehicle Management & App Reload

**Date:** 2026-05-17
**Scope:** Settings sheet, multi-vehicle management, account actions, force app reload
**Branch:** feature/settings-vehicles

---

## Problem

The app has no way to manage the account (change email/password, delete account) or add more than one vehicle after onboarding. The gear icon on the Dashboard is wired to nothing. The app also lacks a manual reload path for users who need to get a fresh PWA build.

---

## Solution Overview

A bottom sheet triggered by the existing gear icon on the Dashboard header becomes the single entry point for all management actions. No new tab is added to the TabBar. Three new API routes handle the server-side operations.

---

## Architecture

### New files

| File | Purpose |
|---|---|
| `components/screens/Settings.tsx` | Full settings sheet UI (rendered inside AppShell) |
| `app/api/vehicles/[id]/route.ts` | DELETE a single vehicle |
| `app/api/user/route.ts` | PUT (update email/password), DELETE (delete account) |

### Changed files

| File | Change |
|---|---|
| `components/AppShell.tsx` | Add `settingsOpen` state; pass `onOpenSettings` + `onVehicleDeleted` to Dashboard; handle vehicle list refresh after add/delete |
| `components/screens/Dashboard.tsx` | Wire gear icon `onClick` → `onOpenSettings()` |
| `lib/types.ts` | No changes needed |

### State flow

```
AppShell
  └─ settingsOpen: boolean
  └─ vehicles: Vehicle[]        ← already fetched
  └─ selectedVehicle: Vehicle | null

Settings sheet receives:
  - vehicles, selectedVehicle
  - onSelectVehicle(v)          ← switch active vehicle + close sheet
  - onVehicleAdded(v)           ← append to vehicles, set as selected
  - onVehicleDeleted(id)        ← remove from list, select first remaining
  - onClose()
  - currentUserEmail (fetched inside Settings from GET /api/auth/me)
```

---

## Settings Sheet Layout

Four sections rendered as grouped rows (same visual style as iOS Settings):

### 1. Veicoli
- Each vehicle shows name + plate + year. Active vehicle has an "Attivo" accent label; no delete button.
- Non-active vehicles have a red "Elimina" button on the right. Tapping it replaces the row with an inline confirm banner: *"Eliminare [nome] e tutti i dati?"* with [Annulla] and [Elimina] buttons. Confirmed → `DELETE /api/vehicles/:id` → `onVehicleDeleted(id)`.
- Tapping anywhere else on a non-active row switches to it: `onSelectVehicle(v)` + close sheet.
- Bottom of section: "＋ Aggiungi veicolo" row → opens add-vehicle sub-sheet.

### 2. Account
- **Email row**: shows current email. "Modifica" button → opens email-change sub-sheet.
- **Password row**: "Cambia" button → opens password-change sub-sheet.

### 3. App
- **Aggiorna app**: calls `navigator.serviceWorker.getRegistration()?.then(r => r?.update())` then `window.location.reload()`. No version number shown — keeps the button simple and avoids a new env var.
- **Esci**: `POST /api/auth/logout` → `window.location.href = '/login'`.

### 4. Zona pericolosa (separate card with red border)
- **Elimina account**: opens account-delete sub-sheet.

---

## Sub-Sheets

Sub-sheets slide in on top of the settings sheet using the same `SheetAddFuel` pattern (fixed overlay, `data-open` attribute, same close-button + header style).

### Aggiungi veicolo
- Fields: Nome (text), Targa (text, auto-uppercase), Anno (number)
- Same validation as Onboarding step 2
- `POST /api/vehicles` → on success: `onVehicleAdded(newVehicle)`, close sub-sheet

### Modifica email
- Fields: Nuova email, Password attuale
- `PUT /api/user { newEmail, currentPassword }` → on success: update displayed email, show inline success message, close sub-sheet
- On error: show inline error (e.g. email already taken)

### Cambia password
- Fields: Password attuale, Nuova password (≥ 8 chars), Conferma nuova password
- Client-side match validation before submit
- `PUT /api/user { currentPassword, newPassword }` → on success: inline "Password aggiornata" message, close sub-sheet

### Elimina account
- Warning text: *"Questa azione è irreversibile. Tutti i tuoi veicoli, rifornimenti e scadenze verranno eliminati."*
- Field: Password (conferma identità)
- `DELETE /api/user { password }` → on success: session destroyed → `window.location.href = '/login'`

---

## API Routes

### `DELETE /api/vehicles/[id]`
```
1. getSession() → 401 if unauthenticated
2. Verify vehicle.userId === session.user.id → 404 if not found/owned
3. prisma.vehicle.delete({ where: { id } })   ← cascades to Refuel + Deadline
4. Return 200 { ok: true }
```

### `PUT /api/user`
Body: `{ currentPassword, newEmail? | newPassword? }`
```
1. getSession() → 401
2. prisma.user.findUnique(session.user.id)
3. bcrypt.compare(currentPassword, user.passwordHash) → 400 if wrong
4. If newEmail: check uniqueness → 409 if taken; update email; update session.user.email
5. If newPassword: validate ≥ 8 chars; bcrypt.hash(newPassword, 12); update hash
6. Return 200 { ok: true }
```

### `DELETE /api/user`
Body: `{ password }`
```
1. getSession() → 401
2. prisma.user.findUnique(session.user.id)
3. bcrypt.compare(password, user.passwordHash) → 400 if wrong
4. prisma.user.delete({ where: { id } })   ← cascades to Vehicle → Refuel + Deadline
5. session.destroy()
6. Return 200 { ok: true }
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Vehicle delete fails (network) | Inline error in the confirm banner, row reverts to normal |
| Email already taken | Inline error in email sub-sheet |
| Wrong current password | Inline error in the relevant sub-sheet |
| Account delete wrong password | Inline error in account-delete sub-sheet |
| Last vehicle deleted | AppShell falls back to Onboarding screen |
| Logout API fails | Still redirect to /login (session expired anyway) |

---

## What is NOT changing

- TabBar — no new tab added
- Onboarding flow — unchanged; still shown when vehicle count reaches 0
- VehicleChip on Dashboard — stays for quick in-app switching (no "add vehicle" entry point there)
- Login / Register pages
- Any expense or deadline logic
