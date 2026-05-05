# AGENTS.md

## Project Identity

MarketLink is a marketplace that connects local businesses with local marketing providers.

This repo has two apps:

- `marketlink-frontend`: Next.js App Router frontend
- `marketlink-backend`: Fastify + Prisma backend

Goal: ship a clean MVP fast with good code, simple UX, and minimal overengineering.

---

## Tech Stack

### Frontend

- Next.js 15 App Router
- React 19
- TypeScript
- TailwindCSS

### Backend

- Fastify
- Prisma ORM
- PostgreSQL
- bcryptjs
- Cookie-based sessions

---

## Package Manager

Use npm only.

Do not use pnpm or yarn.

---

## MVP Philosophy

- Ship useful features before perfect features.
- Prefer simple, readable code over clever abstractions.
- Improve existing code instead of rebuilding from scratch.
- Keep changes small and easy to review.
- Avoid adding new libraries unless there is a clear need.
- Do not build future-proof architecture before the MVP needs it.

---

## Code Quality Rules

Write clean, maintainable, refactored code.

Good code means:

- Clear naming
- Small functions
- Simple conditionals
- No duplicated logic when it can be safely shared
- No unnecessary abstraction
- No unrelated refactors
- No dead code
- No console logs left behind unless needed for debugging and explicitly allowed
- No large rewrites unless requested

Refactor only when it directly improves the requested change.

Do not refactor unrelated files just because they can be improved.

---

## Comment Rules

Use comments only when they add real value.

Good comments explain:

- Why something exists
- A non-obvious business rule
- A temporary workaround
- A risky edge case

Avoid comments that explain obvious code.

Bad comment example:

    // Set loading to true
    setLoading(true);

Good comment example:

    // Preserve existing query params so provider filters remain shareable.

Do not add excessive comments.

Code should mostly explain itself through naming and structure.

---

## Scope Rules

Before making changes:

1. Inspect the existing code.
2. Identify the relevant files.
3. Explain the smallest safe change.
4. Then edit only what is needed.

For pure UI, copy, styling, or layout changes:

- Inspect only the relevant frontend files.
- Do not inspect backend unless API behavior is involved.
- Do not change backend code.

For data, auth, admin, filters, forms, API, or database changes:

- Check backend routes first.
- Check Prisma schema if database fields are involved.
- Then check how the frontend consumes the API.

Backend is the source of truth for:

- Data
- Auth
- Validation
- Permissions
- Business rules

Frontend should handle:

- UI
- Interaction
- Display states
- Client-side UX

---

## Strict Working Rules

- Always verify existing code before changing it.
- Never assume a route, schema field, helper, prop, env var, or UI path exists.
- Do not invent API endpoints.
- Do not invent database fields.
- Do not invent frontend props.
- Do not invent environment variables.
- Do not touch unrelated files.
- Do not browse or research online unless explicitly asked.
- Do not make broad architectural changes unless requested.
- Preserve existing behavior unless the task clearly asks to change it.

---

## Frontend Rules

Frontend lives in `marketlink-frontend`.

Use:

- React functional components
- TypeScript
- TailwindCSS
- Next.js App Router patterns

Frontend code should be:

- Accessible
- Responsive
- Easy to scan
- Componentized only when it helps readability
- Consistent with existing styling

Accessibility expectations:

- Use semantic HTML where possible.
- Use labels for form fields.
- Keep keyboard navigation working.
- Keep focus states visible.
- Use ARIA only when semantic HTML is not enough.
- Do not create clickable `div`s when a `button` or `a` is correct.

Avoid:

- Overcomplicated state
- Large components with mixed responsibilities
- Unnecessary client components
- Heavy animations unless requested
- Duplicating backend validation as the source of truth

---

## Backend Rules

Backend lives in `marketlink-backend`.

Use:

- Fastify
- Prisma
- PostgreSQL

Backend code should be:

- Simple
- Validated server-side
- Easy to debug
- Consistent with existing routes and patterns

Rules:

- Do not change Prisma schema unless explicitly asked.
- Do not create migrations unless explicitly asked.
- Preserve existing filters, sorting, pagination, auth, and admin behavior unless requested.
- Keep route handlers readable.
- Extract helpers only when they reduce real duplication.
- Do not hide simple logic behind unnecessary abstractions.

---

## Auth Rules

Current auth system:

- Email + password
- Session-based auth
- bcryptjs password hashing

Known endpoints:

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /me/summary`

Rules:

- Always verify authorization server-side.
- Never rely only on hidden frontend routes.
- Never rely only on UI protection.
- Keep protected dashboard and admin behavior secure.

---

## Admin Rules

Admin UI lives in `/dashboard/admin`.

Admin actions must validate:

    user.role === "admin"

Existing provider admin route:

    PATCH /admin/providers/:id

Prefer extending existing admin behavior instead of creating new admin patterns.

---

## Email Rules

Email is not implemented yet.

When adding email:

- Use Resend only if explicitly requested.
- First check if an email helper already exists.
- If no helper exists, create one clean helper file.
- Never send permanent passwords.
- If temporary passwords or invited users are added, verify or create a `mustChangePassword` flow explicitly.

Do not assume `mustChangePassword` exists unless verified in the schema.

---

## Refactoring Rules

Refactor when:

- It reduces duplication directly related to the task.
- It makes the changed code easier to understand.
- It removes dead or confusing code from the touched area.
- It improves safety without changing behavior.

Do not refactor when:

- The refactor is unrelated to the task.
- It touches many files for a small UX change.
- It changes behavior accidentally.
- It delays MVP progress.

Small cleanup is good. Random renovation is not.

---

## Commands

Frontend:

    cd marketlink-frontend
    npm install
    npm run dev
    npm run build
    npm run lint

Backend:

    cd marketlink-backend
    npm install
    npm run dev
    npm run build
    npx prisma generate

Run Prisma migrations only when schema changes are explicitly requested:

    cd marketlink-backend
    npx prisma migrate dev

---

## Response Style

Keep responses short and practical.

After changes, include:

- Files changed
- What changed
- How to verify
- Any risk or follow-up

Do not write long explanations unless asked.

---

## Done Means

A task is done only when:

- The requested behavior works.
- The change is scoped.
- Code is clean and readable.
- Comments are useful but not excessive.
- No unrelated files are changed.
- Existing behavior is preserved unless explicitly changed.
- TypeScript/build/lint issues are not introduced.
- Verification steps are provided.

---

## Final Principle

Ship fast. Keep it simple. Leave the code cleaner than you found it.
