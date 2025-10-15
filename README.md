# MarketLink

MarketLink connects small businesses (salons, restaurants, gyms) with verified local marketing pros and agencies.  
Think “Yelp x Upwork” for marketing. MVP ships with city/name search. Proximity comes later.

## Status
- Phases 1–4 done (core UI, backend, auth + DB sessions).
- Proximity is deferred. Admin Panel is next.

## Stack
- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Backend: Fastify (Node.js)
- ORM: Prisma
- DB: PostgreSQL (Neon)
- Auth: Magic link (passwordless)
- Sessions: Cookie + DB `Session` model (persistent)
- Email: Resend or SendGrid
- Hosting: Vercel (frontend), Render (backend)

## Features (MVP)
- Search providers by name or city
- Filters: service, min rating, verified only
- Provider profiles with details and contact form (stub)
- Provider dashboard: onboarding, profile editor, inquiries inbox
- Auth modes
  - `invite` (prod): only existing users can request login links
  - `selfserve` (dev): upsert user on link request

## Repo structure
```
marketlink/
├─ marketlink-frontend/           # Next.js app
│  └─ src/{app,components,...}
└─ marketlink-backend/            # Fastify API
   ├─ src/{server.ts,routes,lib}
   └─ prisma/schema.prisma
```

## Local setup

### 1) Clone
```bash
git clone https://github.com/abdanbarkaath/marketlink.git
cd marketlink
```

### 2) Frontend
```bash
cd marketlink-frontend
npm install
npm run dev
# http://localhost:3000
```

### 3) Backend
```bash
cd ../marketlink-backend
npm install
# create .env (see below)
npm run dev
# http://localhost:4000
```

## Backend .env (example)
```env
# Database
DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"

# Auth + sessions
COOKIE_SECRET=dev_secret_key
SESSION_TTL_DAYS=7
AUTH_MODE=invite           # invite (prod default) or selfserve (dev)
WEB_URL=http://localhost:3000

# Email (choose one)
RESEND_API_KEY=your_resend_key
# or
SENDGRID_API_KEY=your_sendgrid_key
```

## Database
```bash
cd marketlink-backend
npx prisma migrate dev --name init
npx prisma generate
```
Key models: `User`, `Provider`, `Session`. Sessions live in DB so login survives server restarts.

## Auth flow
1) `POST /auth/magic-link`
   - invite: only existing users get a token (response always `{ ok: true }`)
   - selfserve: upsert user, then create token (still `{ ok: true }`)
2) `POST /auth/verify` with `{ token }` → creates DB session and sets signed httpOnly cookie
3) `GET /auth/me` → returns user if authenticated
4) `POST /auth/logout` → deletes current DB session

Notes:
- Magic tokens are in memory. If the server restarts before verify, request a new link.
- After verify, the session is persistent in DB.

## Current API (high level)
- `POST /auth/magic-link`
- `POST /auth/verify`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /providers` (filters: q, city, service, minRating, verified)
- `GET /providers/:slug`
- `POST /providers` and `PUT /providers` (auth required)
- `POST /inquiries` (saves + email stub)

## Roadmap
- Phase 5: Admin Panel (approve, verify toggle, disable, stats)
- Phase 6: Discovery enhancements (sorting, multi-service, favorites)
- Phase 7: Proximity search (geocode, radius, distance sort)
- Phase 8: Monetization (Stripe subscriptions and gating)
- Phase 9: Polish and scale (SEO, sitemap/schema, performance, analytics)

## Author
Abdan Zafar Barkaath  
Senior Front-End Developer  
Email: abdanbarkaath10@gmail.com  
LinkedIn: https://www.linkedin.com/in/abdan-barkaath

## License
MIT
