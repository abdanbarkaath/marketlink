# MarketLink Copilot Instructions

## Project Overview

**MarketLink** is a two-tier marketplace platform connecting service providers (marketers, developers, agencies) with customers seeking services. The backend (Fastify + Prisma + PostgreSQL) manages authentication, provider data, and admin operations. The frontend (Next.js 15 with React 19) provides customer search, provider profiles, and admin dashboards.

**Key URLs (local):**

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

---

## Architecture & Key Components

### Backend Structure (Fastify)

**Entry point** - [marketlink-backend/src/server.ts](../marketlink-backend/src/server.ts) registering all route plugins:

- CORS restricted to `localhost:3000` (dev) + credentials mode enabled
- Signed httpOnly cookies for session management
- Rate-limiting available (disabled globally, per-route opt-in)

**Route Plugins** - in [marketlink-backend/src/routes/](../marketlink-backend/src/routes/):

- `auth.ts` - Magic-link login flow + credential-based auth
- `providers.ts` - Public provider search/listing (filterable by name, city, service, rating, verified status); detailed provider profiles by slug
- `account.ts` - Authenticated user endpoints (profile, settings)
- `inquiries.ts` - Customer inquiries/leads to providers
- `admin.ts` - Admin-only operations (provider moderation, stats, user management)

**Database** - [marketlink-backend/prisma/schema.prisma](../marketlink-backend/prisma/schema.prisma):

- `User` (role: provider|admin) - tracks password, disabled status, mustChangePassword flag
- `Provider` - marketplace listing (businessName, slug, city/state/zip as CITEXT for case-insensitive search), rating/verified flags, plan tier (free|pro)
- `Session` - DB-backed tokens with expiry, indexed by userId and expiresAt for cleanup
- `Inquiry` - customer leads sent to providers
- `AdminAction` - audit log of admin moderation events

**Session Management** - [marketlink-backend/src/lib/session.ts](../marketlink-backend/src/lib/session.ts):

- Sessions stored in DB (`Session` model) with signed httpOnly cookies
- TTL via `SESSION_TTL_DAYS` env var (defaults to 7 days)
- Magic-link tokens in-memory (15 min TTL) - used in invite/self-serve auth modes
- Auth helper: `getUserFromRequest(fastify, req)` → returns User or null

### Frontend Structure (Next.js 15 App Router)

**Main routes** - [marketlink-frontend/src/app/](../marketlink-frontend/src/app/):

- `/` - Landing page with service categories (SEO, social, ads, web, branding, email, content, video)
- `/providers` - Search/filter page (server-rendered with API fetch)
- `/providers/[slug]` - Provider detail page with inquiry form
- `/login` & `/login/verify` - Auth flow
- `/dashboard` - Provider dashboard (redirects to onboarding if needed)
- `/dashboard/onboarding` - Create provider profile + slug
- `/dashboard/profile`, `/dashboard/inquiries` - Provider tools
- `/admin`, `/admin/providers` - Admin panels (role-gated)

**API Utilities** - [marketlink-frontend/src/lib/serverApi.ts](../marketlink-frontend/src/lib/serverApi.ts):

- `apiFetch(path, init)` - Server-only fetch to backend with session cookie forwarded
- `apiJSON<T>(path, init)` - Convenience wrapper that throws on non-2xx

**Styling:**

- Tailwind CSS v4.1.14 + theme system (via `ThemeToggle` component)
- Theme tokens: `t.pageBg`, `t.surfaceMuted`, `t.primaryBtn`, `t.mutedText`, etc.

---

## Critical Developer Workflows

### Local Setup

1. **Backend:**

   ```bash
   cd marketlink-backend
   npm install
   # Create .env with DATABASE_URL, COOKIE_SECRET=dev_secret_key, SESSION_TTL_DAYS=7, WEB_URL=http://localhost:3000
   npx prisma migrate dev      # Apply migrations
   npx prisma db seed          # Seed data (optional)
   npm run dev                 # Starts on :4000
   ```

2. **Frontend:**
   ```bash
   cd marketlink-frontend
   npm install
   # Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:4000
   npm run dev                 # Starts on :3000
   ```

### Building & Running

- **Backend:** `npm run build` (tsc) → `npm start` (node dist/server.js)
- **Frontend:** `npm run build` → `npm start`
- **Linting:** Frontend has ESLint configured; run with `npm run lint`

### Database Workflows

- `npx prisma migrate dev` - Create & apply new migrations after schema changes
- `npx prisma studio` - GUI for inspecting/editing data
- Migrations auto-run on server start in dev mode

---

## Project-Specific Conventions

### Authentication & Authorization

- **Magic-link auth:** Email requested → token sent (logged to console in dev) → user clicks/supplies token → account created/authenticated
- **Credential auth:** Optional mode (invite-only vs self-serve) via `AUTH_MODE` env var
- **Session enforcement:** Use `requireAdmin` helper pattern in admin routes (see [admin.ts](../marketlink-backend/src/routes/admin.ts#L6))
  ```typescript
  const gate = await requireAdmin(fastify, req);
  if (!gate.ok) return reply.code(gate.code).send({ error: gate.error });
  ```

### Query Parameter Validation

- Use **Fastify JSON Schema** for input validation (see [providers.ts](../marketlink-backend/src/routes/providers.ts#L30) `listQuerySchema`)
- Type-safe parsers for limits, pages, sort keys:
  ```typescript
  const limit = parseLimit(query.limit, 20); // clamps 1–50
  const page = parsePage(query.page, 1); // >= 1
  const sort = asSortKey(query.sort); // validates enum
  ```

### Search & Filtering

- **Providers search** (public endpoint):
  - Filters: name, city, state (case-insensitive via CITEXT), services (comma-separated, any/all match)
  - Sorts: newest, name, rating, verified (asc/desc configurable)
  - Response: paginated with limit (1–50, default 20) & page (1-indexed)
- **Admin provider list:** Similar query structure, returns admin-specific fields (notes, disabledReason, status)

### Naming Conventions

- **Slug normalization:** lowercase, alphanumeric + hyphens only, deduped hyphens (see [admin.ts](../marketlink-backend/src/routes/admin.ts#L32))
- **Email validation:** Loose regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (avoid tight validation for UX)
- **Status enums:** Provider status (pending, active, disabled, suspended); Inquiry status (new, responded, closed, spam)

### Prisma Patterns

- **Reusable `select` objects:** Define query shapes as `satisfies Prisma.<Model>Select` for type safety and consistency (see [providers.ts](../marketlink-backend/src/routes/providers.ts#L45))
- **Index strategy:** Status + timestamp indexes for filtering/sorting; slug/email unique constraints
- **Seed scripts:** [seed.js](../marketlink-backend/prisma/seed.js) and [seed_owners.js](../marketlink-backend/prisma/seed_owners.js) populate test data

### Frontend Component Patterns

- **Use React 19 hooks:** No class components
- **Theme system:** `useMarketLinkTheme()` hook provides theme tokens for consistent styling
- **Server vs Client Components:** Use `'use client'` sparingly; prefer Server Components for data fetching
- **Error handling:** `apiJSON()` throws on non-2xx; wrap in try/catch for user-facing error messages

---

## Integration Points & Data Flows

### Provider Onboarding

1. User lands on `/` → clicks category or "Browse all providers"
2. If provider, navigates to `/dashboard/onboarding`
3. Form creates `Provider` row + associates with authenticated `User`
4. Slug auto-generated from businessName (or user-supplied)
5. Provider profile editable at `/dashboard/profile`

### Customer Inquiry Flow

1. Customer views provider at `/providers/[slug]`
2. Fills InquiryForm → POSTs to `/inquiries` (backend)
3. Backend creates `Inquiry` row + triggers notification (mailer stub in [mailer.ts](../marketlink-backend/src/lib/mailer.ts))
4. Provider sees inquiry in `/dashboard/inquiries`
5. Admin can moderate inquiries at `/admin`

### Admin Moderation

1. Admin logs in, navigates to `/admin/providers` (role-gated)
2. Can filter/sort providers by status (pending/active/disabled/suspended)
3. Actions: verify, disable, update notes, delete (all logged to `AdminAction` table)
4. Stats endpoint (`GET /admin/stats`) returns counts by status for dashboard

---

## Common Gotchas & Best Practices

1. **CORS & Credentials:** Frontend → backend requests must include credentials; backend CORS must allow `credentials: true`. Cookie forwarding in `apiFetch()` is critical for server components.

2. **Signed Cookies:** Session cookies are signed with `COOKIE_SECRET`. Don't share secrets across environments; rotate periodically in prod.

3. **Database Case-Sensitivity:** City/state fields are CITEXT (case-insensitive). Use them for filters but preserve original case in UI.

4. **Env Vars (Backend):**

   - `DATABASE_URL` - PostgreSQL connection string
   - `COOKIE_SECRET` - >= 32 chars for signing cookies
   - `SESSION_TTL_DAYS` - session expiry (default 7)
   - `AUTH_MODE` - "invite" or "selfserve"
   - `WEB_URL` - frontend URL for redirects/emails
   - `PORT` - API port (default 4000)

5. **Env Vars (Frontend):**

   - `NEXT_PUBLIC_API_URL` - backend URL (must be public; baked into bundle)

6. **Magic-Link Tokens:** In-memory Map; tokens lost on server restart. For production, migrate to DB-backed tokens.

7. **Admin Action Auditing:** All admin operations logged to `AdminAction` table. Always include `adminUserId` and relevant metadata for compliance.

---

## File Reference Guide

| File                                                                                                        | Purpose                                     |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| [marketlink-backend/src/server.ts](../marketlink-backend/src/server.ts)                                     | Fastify setup, plugins, routes registration |
| [marketlink-backend/src/lib/session.ts](../marketlink-backend/src/lib/session.ts)                           | Session & magic-link token management       |
| [marketlink-backend/src/routes/auth.ts](../marketlink-backend/src/routes/auth.ts)                           | Login, verify, logout endpoints             |
| [marketlink-backend/src/routes/providers.ts](../marketlink-backend/src/routes/providers.ts)                 | Public & protected provider CRUD            |
| [marketlink-backend/src/routes/admin.ts](../marketlink-backend/src/routes/admin.ts)                         | Admin moderation & stats                    |
| [marketlink-backend/prisma/schema.prisma](../marketlink-backend/prisma/schema.prisma)                       | Database schema                             |
| [marketlink-frontend/src/lib/serverApi.ts](../marketlink-frontend/src/lib/serverApi.ts)                     | Backend API fetch helpers                   |
| [marketlink-frontend/src/app/page.tsx](../marketlink-frontend/src/app/page.tsx)                             | Landing page with categories                |
| [marketlink-frontend/src/components/ThemeToggle.tsx](../marketlink-frontend/src/components/ThemeToggle.tsx) | Theme system & hook                         |

---

## Next Steps for Agents

- **Adding a feature:** Identify which layer (frontend route, backend endpoint, DB model) is affected. Update schema → migrate → add route → add frontend component.
- **Debugging:** Check backend logs (console output from npm run dev) for API errors; frontend Network tab for request/response details.
- **Testing:** Run migrations in isolation; manually test flows via browser/curl before integrating.
