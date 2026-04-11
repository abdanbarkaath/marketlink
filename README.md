# MarketLink - Admin Guide

This guide explains how the Admin Panel works, what each action does, how to run the app locally (frontend + backend) or with the external backend, and the key routes/paths available in the app.

Quick URLs

- Frontend (local): http://localhost:3000
- Backend (local): http://localhost:4000

How to start locally (backend + frontend)

Backend (Fastify)

1. Install dependencies
   cd backend
   npm install

2. Create backend/.env
   DATABASE_URL=postgresql://...
   COOKIE_SECRET=dev_secret_key
   SESSION_TTL_DAYS=7
   AUTH_MODE=invite # or selfserve (dev)
   WEB_URL=http://localhost:3000

3. Prisma setup (first time or after schema changes)
   npx prisma migrate dev
   npx prisma db seed

# optional:

npx prisma studio

4. Start backend
   npm run dev

Frontend (Next.js)

1. Install dependencies
   cd ../frontend
   npm install

2. Create frontend/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:4000

3. Start frontend
   npm run dev

Using the external backend (instead of local backend)

1. Update frontend/.env.local
   NEXT_PUBLIC_API_URL=https://YOUR-EXTERNAL-BACKEND-URL

2. Restart frontend
   npm run dev

External backend notes

- Your external backend must allow requests from your frontend domain (CORS).
- In production (Vercel), set NEXT_PUBLIC_API_URL in Vercel env vars to the external backend URL.
- Make sure the backend WEB_URL matches the frontend URL in that environment.

Key paths (Frontend Routes)
Public

- / Landing page (search + filters entry)
- /providers Provider listing page (SSR fetch from API)
- /providers/[slug] Provider public profile detail (SSR fetch)

Auth

- /login Magic link login request page

Provider Dashboard (Protected)

- /dashboard Dashboard home (redirects to onboarding if needed)
- /dashboard/onboarding First-time onboarding wizard (create Provider + slug)
- /dashboard/profile Profile editor (if implemented)
- /dashboard/inquiries Inquiries inbox (if implemented)

Admin (Protected, role=admin)

- /admin Admin home / overview
- /admin/providers Providers management table
- /admin/stats Stats page (if you have a page wired; API exists)

Key paths (Backend API Endpoints)
Health / misc

- GET /health Backend health check (if present)
- GET /me/summary Session + user + provider ownership summary

Marketplace Providers (Public)

- GET /providers List providers with filters (name/city/service/minRating/verified)
- GET /providers/:slug Provider detail by slug

Auth (Magic link)

- POST /api/auth/magic-link Request magic link (mode depends on AUTH_MODE)
- POST /api/auth/verify Verify magic token -> session cookie
- POST /api/auth/logout Logout (invalidate session)

Providers (Owner / Protected)

- POST /api/providers Create provider (onboarding, ownership enforced)
- PUT /api/providers Update provider (ownership enforced) (if implemented)

Inquiries

- POST /api/inquiries Public create inquiry (DB save + email relay stub)
- GET /api/inquiries Owner-only list inquiries (dashboard inbox)

Admin API (role=admin)

- GET /admin/stats Counters (total, active, pending, disabled, verified)
- GET /admin/providers?q=&status=&verified=&limit=&offset= List with filters
- POST /admin/providers/:id/approve status -> active
- POST /admin/providers/:id/verify { value?: boolean } toggle or set
- POST /admin/providers/:id/disable { reason?: string } status -> disabled
- POST /admin/providers/:id/enable status -> active

Roles & Access

- Only users with role = admin can access /admin/\* endpoints and pages.
- To make yourself admin (one-time), update the User row in your DB (Neon or Prisma Studio):
  UPDATE "User" SET "role" = 'admin' WHERE "email" = 'you@example.com';

Auth & Sessions

- Auth mode:
  - AUTH_MODE=invite (prod): only existing users can request a magic link.
  - AUTH_MODE=selfserve (dev): upsert user on magic link request.
- Sessions are DB-backed (Session model). Login survives server restarts.
- Frontend forwards the session cookie server-side when calling the backend.

Provider States & Admin Actions
Provider lifecycle uses status and an independent verified flag:

- Status: pending -> active <-> disabled
- Verified: true / false (independent of status)

What each action does

- Approve: sets status = active (intended for pending -> active).
- Disable: sets status = disabled and optionally records a disabledReason.
- Enable: sets status = active (intended for disabled -> active).
- Verify / Unverify: toggles verified (can be changed in any status).

Important UI behavior note

- In the current build, the Approve button appears for any non-active row (including disabled).
  Use Enable for disabled -> active.
- Recommended: show Approve only when status === pending.

Recommended UI/API rules (optional hardening)
Frontend (Admin Providers Table):

- Show Approve only when status === pending.
- Show Disable only when status !== disabled.
- Show Enable only when status === disabled.

Backend (Admin API):

- /admin/providers/:id/approve: return 409 if current status is not pending.
- /admin/providers/:id/enable: return 409 if current status is not disabled.
- /admin/providers/:id/disable: allow from pending or active; no-op if already disabled.

Owner Visibility (Public Detail Page)

- Public sees only active providers.
- Owners can view their own pending/disabled listing when logged in; the page shows a banner:
  - “Your listing is disabled / pending … Reason: …”

Testing Checklist (Local)

1. Start backend on http://localhost:4000
2. Start frontend on http://localhost:3000
3. Log in as admin (magic link) and visit /admin.
4. Use /admin/providers to:
   - Approve a pending provider -> becomes active.
   - Disable an active provider with a reason -> becomes disabled.
   - Enable a disabled provider -> becomes active.
   - Verify/Unverify any provider.
5. Public hardening:
   - Disabled provider’s slug returns 404 publicly.
   - Owner can still open their own disabled slug and see the banner.
6. Validation:
   - GET /admin/providers?status=banana -> 400 (when called directly to backend).
   - POST /admin/providers/:id/disable with reason > 200 chars -> 400.

Environment reference
Backend .env essentials
DATABASE_URL=postgresql://...
COOKIE_SECRET=dev_secret_key
SESSION_TTL_DAYS=7
AUTH_MODE=invite # or selfserve (dev)
WEB_URL=http://localhost:3000

Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000

Notes

- Magic tokens are in-memory; request a new link if the server restarted before verify.
- Sessions are persistent in DB; logout invalidates only the current session token.
