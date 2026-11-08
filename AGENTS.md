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

## Product Inspiration Rules

When making UX, layout, trust, discovery, or profile-page decisions, use Winnie and Thumbtack as the primary product references unless the user overrides that direction.

Treat:

- Winnie as the reference for warmth, clarity, and trust presentation.
- Thumbtack as the reference for marketplace structure, local discovery, results scanning, and conversion-oriented service flows.
- Landingfolio and Dribbble as secondary references for visual polish, spacing, composition, and component-level styling once the product behavior is already decided.

Do not copy branding or visuals directly.

Borrow:

- Interaction patterns
- Information hierarchy
- Density
- Trust mechanics
- Layout rhythm
- Search module composition
- Illustration usage patterns

When the design needs illustrations or decorative web graphics, prefer free or attribution-safe sources first and verify the license before using assets. Good starting points include Storyset, unDraw, Ouch, Freepik, Pixabay, Vecteezy, and similar free illustration libraries.

See `docs/product/inspiration.md` for the concrete reference guidance.

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

## Product Resources

For UI work, read the root `DESIGN.md` as the shared visual contract. Apply the approved public discovery and profile guidance to the landing page, Browse Experts, and agency details. Preserve semantic status colors and existing behavior; do not equate a clean design scan with completed visual or accessibility verification.

Use the installed `ponytail` skill for coding, reviews, and dependency decisions by default, as requested by the user. Read its actual SKILL.md when available; if it is missing on another machine, say so. Prefer the smallest complete change, reuse existing code, and keep communication concise. Never sacrifice requested behavior, validation, security, accessibility, or necessary verification to reduce tokens. Token savings are not guaranteed.

For every UI change, follow this order:

1. **UI/UX Pro Max** (`ui-ux-pro-max`): review usability, layout, accessibility, typography, and responsive behavior.
2. **Avoid AI Design** (`avoid-ai-design`): review and remove generic AI-looking patterns. "Make it less AI" means use this skill; the user need not recall its name.
3. **Impeccable**: refine visual direction, critique, polish, and presentation. Installed in this project at `.agents/skills/impeccable/SKILL.md`; read it and the relevant command reference. Preserve the user's chosen design instead of inventing more alternatives.
4. **Implement with Ponytail** (`ponytail`): make the smallest complete, maintainable change, reuse existing code, and avoid unnecessary dependencies or repeated work.

Use the depth appropriate to the change; a small UI fix does not require a new design tournament or full-site audit. Preserve approved behavior and product positioning. Review actual desktop/mobile renders and interactions; a clean scanner is not design approval. Treat rejected designs as feedback, not a binding style. Automatic Impeccable hooks were not installed; run checks manually when required. Do not use its live copy-edit fallback with approval/sandbox bypass flags.

When `graphify-out/graph.json` exists, use Graphify for focused questions that span multiple files. Query from the repo root with `./.local-tools/graphify/Scripts/graphify.exe query "<question>" --budget 600`. Set `GRAPHIFY_QUERY_LOG_DISABLE=1` for local queries. Verify the relevant source before editing and use `rg` directly for exact lookups and files the graph does not cover, such as CSS. Refresh the graph on demand with `./.local-tools/graphify/Scripts/graphify.exe update .` and `GRAPHIFY_BACKEND=none`. Keep extraction code-only and the graph output local.

Use `docs/product/resources.md` for the saved Founder's Playbook, MiroFish, and design-skill guidance when relevant to product planning or UI/UX work. These references support the MVP rules; they do not authorize installations, paid simulations, or broader scope.

## Pull Requests and Local Changes

- Keep each PR to the files the user requests. For public-page styling, include only the relevant landing page, Browse Experts, and agency detail styles. Include application logic, login, dashboards, agent files, or dotfiles only when the user includes them in scope.
- If VS Code shows a large change count, check Git's modified and untracked counts and the actual PR diff. Check for previews, tool files, and other checkouts before deciding what belongs in the PR. Preserve unrelated local work while preparing a clean branch from `main`.
- Use descriptive branch names such as `fix/...` or `feature/...`. Keep assistant branding out of PR titles, descriptions, and comments.

## Final Principle

Ship fast. Keep it simple. Leave the code cleaner than you found it.
