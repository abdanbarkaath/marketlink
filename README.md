# MarketLink — Admin Guide

This guide explains how the Admin Panel works, what each action does, and how to test it locally.

## Roles & Access
- Only users with `role = admin` can access `/admin/*` endpoints and pages.
- To make yourself admin (one-time), update the `User` row in your DB (Neon or Prisma Studio):
  ```sql
  UPDATE "User" SET "role" = 'admin' WHERE "email" = 'you@example.com';
  ```

## Auth & Sessions
- Auth mode:
  - `AUTH_MODE=invite` (prod): only existing users can request a magic link.
  - `AUTH_MODE=selfserve` (dev): upsert user on magic link request.
- Sessions are DB-backed (`Session` model). Login survives server restarts.
- Frontend forwards the `session` cookie server-side when calling the backend.

## Provider States & Admin Actions
Provider lifecycle uses `status` and an independent `verified` flag:

- **Status**: `pending` → `active` ↔ `disabled`
- **Verified**: `true` / `false` (independent of status)

### What each action does
- **Approve**: sets `status = active` (intended for **pending → active**).
- **Disable**: sets `status = disabled` and optionally records a `disabledReason`.
- **Enable**: sets `status = active` (intended for **disabled → active**).
- **Verify / Unverify**: toggles `verified` (can be changed in any status).

> Note: In the current build, the Approve button appears for any non-active row
> (including `disabled`). Use **Enable** for `disabled → active`. If you prefer
> stricter UX, change the UI to only show **Approve** for `status === 'pending'`.
> (Recommended — see “Recommended UI/API rules” below.)

## Recommended UI/API rules (optional hardening)
To avoid confusion and enforce clean transitions:

**Frontend (Admin Providers Table):**
- Show **Approve** only when `status === 'pending'`.
- Show **Disable** only when `status !== 'disabled'`.
- Show **Enable** only when `status === 'disabled'`.

**Backend (Admin API):**
- `/admin/providers/:id/approve`: return `409` if current status is not `pending`.
- `/admin/providers/:id/enable`: return `409` if current status is not `disabled`.
- `/admin/providers/:id/disable`: allow from `pending` or `active`; no-op if already disabled.

This combination ensures the table reflects intent and the API enforces it.

## Owner Visibility (Public Detail Page)
- **Public** sees only **active** providers.
- **Owners** can view their own **pending/disabled** listing when logged in; the page shows a banner:
  - “Your listing is disabled / pending … Reason: …”

## Endpoints (Admin)
- `GET /admin/stats` — counters (total, active, pending, disabled, verified)
- `GET /admin/providers?q=&status=&verified=&limit=&offset=` — list with filters
- `POST /admin/providers/:id/approve` — status → `active`
- `POST /admin/providers/:id/verify` `{ value?: boolean }` — toggle or set
- `POST /admin/providers/:id/disable` `{ reason?: string }` — status → `disabled`
- `POST /admin/providers/:id/enable` — status → `active`

All endpoints validate params/query/body and return `400` for invalid input.

## Testing Checklist (Local)
1. Log in as admin (magic link) and visit `/admin`.
2. Use `/admin/providers` to:
   - **Approve** a `pending` provider → becomes `active`.
   - **Disable** an `active` provider with a reason → becomes `disabled`.
   - **Enable** a `disabled` provider → becomes `active`.
   - **Verify/Unverify** any provider.
3. Public hardening:
   - Disabled provider’s slug returns **404** publicly.
   - Owner can still open their own disabled slug and see the banner.
4. Validation:
   - `GET /admin/providers?status=banana` → **400** (when called directly to backend).
   - `POST /admin/providers/:id/disable` with `reason` > 200 chars → **400**.

## Environment
Backend `.env` essentials:
```env
DATABASE_URL=postgresql://...
COOKIE_SECRET=dev_secret_key
SESSION_TTL_DAYS=7
AUTH_MODE=invite        # or selfserve (dev)
WEB_URL=http://localhost:3000
```

Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Notes
- Magic tokens are in-memory; request a new link if the server restarted before verify.
- Sessions are persistent in DB; logout invalidates only the current session token.

---

**Questions or improvements?**  
- Want me to **enforce strict transitions** in the API and hide Approve on disabled rows? I can provide the exact one-file patches.
- Prefer to add an **Audit Log** UI for `AdminAction`? Easy to add `/admin/actions` with filters.
