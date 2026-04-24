# MarketLink - Admin Guide

This guide explains how the Admin Panel works, what each action does, how to run the app locally (frontend + backend) or with the external backend, and the key routes/paths available in the app.

Quick URLs

- Frontend (local): http://localhost:3000
- Backend (local): http://localhost:4000

Deployment (temp/staging)

- Frontend: Vercel
- Backend: Render or Railway
- Database: Neon

Recommended order

1. Push the repo to GitHub
2. Deploy `marketlink-backend`
3. Set backend env vars
4. Run Prisma migrations on the deployed backend
5. Deploy `marketlink-frontend`
6. Set frontend env vars
7. Test public pages first, then auth/dashboard/admin

Frontend deploy

- Root directory: `marketlink-frontend`
- Build command: `npm run build`
- Start command: `npm run start`

Frontend env vars

```env
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL
```

Backend deploy

- Root directory: `marketlink-backend`
- Build command: `npm run build`
- Start command: `npm run start`

Backend env vars

```env
DATABASE_URL=postgresql://...
COOKIE_SECRET=replace-with-a-long-random-secret
SESSION_TTL_DAYS=7
WEB_URL=https://YOUR-FRONTEND-URL
NODE_ENV=production
RESEND_API_KEY=...
MAIL_FROM="Marketus <onboarding@resend.dev>"
APP_NAME=Marketus
```

Prisma on deploy

Run this after the backend has the right env vars:

```bash
npx prisma migrate deploy
npx prisma generate
```

Production auth notes

- The backend now allows CORS from `WEB_URL` plus local dev origins.
- In production, session cookies are set with:
  - `sameSite=none`
  - `secure=true`
- This is required when the frontend and backend are on different domains, such as Vercel + Render.

Deploy test checklist

Public pages

- `/`
- `/providers`
- `/providers/windy-city-growth`

Auth and dashboards

- `/login`
- `/dashboard`
- `/dashboard/admin`
- `/dashboard/inquiries`

Important

- Do not commit real `.env` files.
- Move all secrets into Vercel/Render env settings.
- If any real secret was committed before, rotate it before deploy.

## Branch Naming Strategy

Use one branch per ticket, not one branch per epic.

Format

- `e<epic-issue>-i<ticket-issue>-<short-kebab-task-name>`

Examples

- `e26-i43-provider-to-expert-copy-strategy`
- `e26-i44-direct-services-guided-outcomes-nav`
- `e27-i48-unified-expert-type-support`
- `e30-i65-buyer-role-and-profile`

Rules

- Epic issue = planning container
- Ticket issue = actual work item
- Branch = one ticket only
- Include both epic and ticket numbers in the branch name
- Keep the task name short, lowercase, and kebab-case

GitHub Project workflow

1. Pick the epic you are working in
2. Pick one sub-issue under that epic
3. Create a branch using that ticket's epic number and issue number
4. Do the work for that one ticket only
5. Open a PR for that ticket
6. Move the ticket through the board
7. The epic is done when its sub-issues are done

How to start locally (backend + frontend)

Backend (Fastify)

1. Install dependencies
   cd backend
   npm install

2. Create backend/.env
   DATABASE_URL=postgresql://...
   COOKIE_SECRET=dev_secret_key
   SESSION_TTL_DAYS=7
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

## Creating Users & Providers (Dev Guide)

### 🥇 Recommended (App Flow)

Use this for real usage:

1. Go to:

```
http://localhost:3000/login
```

2. Log in (email + password)

3. Complete onboarding:

```
http://localhost:3000/dashboard/onboarding
```

4. Submit form → backend automatically:

- Creates `Provider`
- Links `userId`
- Generates `slug`
- Sets defaults (`status`, `services`)

---

### 🥈 Manual (Neon / Dev Testing)

Use this when:

- Testing admin panel
- Creating pending providers
- Seeding quick data

---

### Step 1 — Create User

First generate a bcrypt hash (required for password login):

```bash
cd marketlink-backend
node -e "require('bcryptjs').hash('TempAdmin123!', 10).then(console.log)"
```

Then insert into Neon:

```sql
INSERT INTO "User" (
  id,
  email,
  role,
  "passwordHash",
  "mustChangePassword",
  "isDisabled",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'dj.abdan+1@gmail.com',
  'provider',
  '$2b$10$PASTE_HASH_HERE',
  false,
  false,
  NOW(),
  NOW()
)
RETURNING id;
```

👉 Copy the returned `id` (this is `userId`)

---

### Step 2 — Create Provider

```sql
INSERT INTO "Provider" (
  id,
  "userId",
  email,
  "businessName",
  slug,
  city,
  state,
  services,
  rating,
  verified,
  status,
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'PASTE_USER_ID_HERE',
  'dj.abdan+1@gmail.com',
  'Abdan DJ Services',
  'abdan-dj-services',
  'Westmont',
  'IL',
  ARRAY['video', 'social'],
  0,
  false,
  'active',
  NOW(),
  NOW()
);
```

---

### 🔐 Login Credentials

```
Email: dj.abdan+1@gmail.com
Password: TempAdmin123!
```

---

### ⚠️ Notes

- `passwordHash` must be bcrypt (not plain text)
- `slug` must be unique
- `services` must match your frontend tokens:
  ```
  seo, ads, social, video, print
  ```
- `status` options:
  ```
  pending | active | disabled
  ```

---

### 🧪 Quick Test

Visit:

```
http://localhost:3000/admin/providers?status=active
```

You should see your newly created provider.

---

### 🧠 Summary

- Use onboarding UI for real providers
- Use Neon SQL for testing/admin data
- Both methods are valid depending on use case

Key paths (Frontend Routes)
Public

- / Landing page (search + filters entry)
- /providers Provider listing page (SSR fetch from API)
- /providers/[slug] Provider public profile detail (SSR fetch)

Auth

- /login Password login page

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

Auth (Password)

- POST /auth/login Login with email + password
- GET /auth/me Get current user
- POST /auth/logout Logout
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

- Password-based login with bcrypt hashing.
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
3. Log in as admin (email + password) and visit /admin.
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
WEB_URL=http://localhost:3000

Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000

Notes

- Passwords are hashed with bcrypt; mustChangePassword forces change on first login.
- Sessions are persistent in DB; logout invalidates only the current session token.
