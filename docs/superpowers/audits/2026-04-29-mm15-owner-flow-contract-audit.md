# MM-36 Owner Flow Contract Audit

Date: 2026-04-29
Epic: `MM-15` Provider Schema and Read-Model Extension for Unified Expert Model

## Purpose

Document the current owner-facing data contracts before reshaping onboarding, dashboard, profile, and inquiry surfaces under the unified expert model.

This audit reflects the live code paths in:

- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-backend\src\routes\account.ts`
- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-backend\src\routes\providers.ts`
- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-backend\src\routes\inquiries.ts`
- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-frontend\src\app\dashboard\page.tsx`
- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-frontend\src\app\dashboard\onboarding\page.tsx`
- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-frontend\src\app\dashboard\profile\page.tsx`

## Backend Source Of Truth

### `GET /me/summary`

Route file:
- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-backend\src\routes\account.ts`

Behavior:
- Requires authenticated session.
- Returns:
  - `user: { id, email, role }`
  - `expert`
  - `provider`

Important detail:
- `provider` is currently an alias of `expert` for compatibility.
- Owner-facing frontend screens still rely on `expert ?? provider`.

Current expert summary shape includes:
- identity and location: `id`, `slug`, `businessName`, `city`, `state`, `zip`
- expert model fields: `expertType`, `creatorPlatforms`, `creatorAudienceSize`, `creatorProofSummary`
- profile content: `tagline`, `shortDescription`, `overview`, `logo`, `services`
- contact and social: `websiteUrl`, `phone`, `linkedinUrl`, `instagramUrl`, `facebookUrl`
- business details: `foundedYear`, `hourlyRateMin`, `hourlyRateMax`, `minProjectBudget`, `currencyCode`
- fit fields: `languages`, `industries`, `clientSizes`, `specialties`, `remoteFriendly`, `servesNationwide`, `responseTimeHours`
- owner lifecycle: `status`, `disabledReason`
- proof collections: `projects`, `clients`, `media`

### `POST /experts`

Route file:
- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-backend\src\routes\providers.ts`

Behavior:
- Requires authenticated session.
- Creates the owned expert profile for that user.
- `/providers` remains a compatibility alias, but `/experts` is the primary route.

Required fields:
- `businessName`
- `city`
- `state`

Optional fields already accepted:
- `zip`
- `tagline`
- `logo`
- `expertType`
- `creatorPlatforms`
- `creatorAudienceSize`
- `creatorProofSummary`
- `services`

Create response:
- `{ ok: true, expert, provider }`
- `provider` is currently an alias of `expert`

### `PUT /experts`

Route file:
- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-backend\src\routes\providers.ts`

Behavior:
- Requires authenticated session.
- Updates the existing expert owned by the logged-in user.
- `/providers` remains a compatibility alias.

Editable fields currently accepted:
- base identity: `businessName`, `city`, `state`, `zip`, `tagline`, `logo`
- model fields: `expertType`, `creatorPlatforms`, `creatorAudienceSize`, `creatorProofSummary`
- narrative fields: `shortDescription`, `overview`
- contact/social: `websiteUrl`, `phone`, `linkedinUrl`, `instagramUrl`, `facebookUrl`
- commercial fields: `foundedYear`, `hourlyRateMin`, `hourlyRateMax`, `minProjectBudget`, `currencyCode`
- fit fields: `languages`, `industries`, `clientSizes`, `specialties`, `remoteFriendly`, `servesNationwide`, `responseTimeHours`
- services: `services`
- proof collections:
  - `projects`
  - `clients`
  - `media`

Validation already in place:
- `expertType` must match enum values
- creator fields are normalized server-side
- numeric creator audience must be numeric and non-negative
- token arrays are normalized to lowercase de-duplicated arrays

### `GET /inquiries`

Route file:
- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-backend\src\routes\inquiries.ts`

Behavior:
- Requires authenticated session.
- Resolves the logged-in user’s owned expert.
- Returns the latest inquiries for that expert.

Returned inquiry shape:
- `id`
- `name`
- `email`
- `phone`
- `message`
- `status`
- `createdAt`

### `PATCH /inquiries/:id`

Route file:
- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-backend\src\routes\inquiries.ts`

Behavior:
- Requires authenticated session.
- Only updates inquiries belonging to the owner’s expert.

Allowed statuses:
- `NEW`
- `READ`
- `ARCHIVED`

### `POST /auth/change-password`

Frontend dependency only in this audit:
- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-frontend\src\app\dashboard\profile\page.tsx`

Behavior used by owner profile:
- body: `{ currentPassword, newPassword }`

## Frontend Dependency Map

### Dashboard

File:
- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-frontend\src\app\dashboard\page.tsx`

Current dependencies:
- `GET /me/summary`
- `GET /inquiries`

Current usage:
- redirects admins away from owner dashboard
- reads `expert ?? provider`
- uses summary fields for:
  - business name
  - city/state
  - `status`
  - creator/expert fields are present in type but not yet central to dashboard messaging
- uses inquiry list only for counts, not full rendering

### Onboarding

File:
- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-frontend\src\app\dashboard\onboarding\page.tsx`

Current dependency:
- `POST /experts`

Current submitted payload:
- `businessName`
- `city`
- `state`
- `zip`
- `tagline`
- `logo`
- `expertType`
- `creatorPlatforms`
- `creatorAudienceSize`
- `creatorProofSummary`
- `services`

Current redirect behavior:
- if response includes slug, redirect to `/experts/:slug`
- otherwise redirect to `/dashboard`

### Profile Editor

File:
- `C:\Users\djabd\Desktop\MarketUs\marketlink\marketlink-frontend\src\app\dashboard\profile\page.tsx`

Current dependencies:
- `GET /me/summary`
- `PUT /experts`
- `POST /auth/change-password`

Current load behavior:
- reads `expert ?? provider`
- normalizes optional arrays and nested collections into editable local state

Current save behavior:
- sends full expert-edit payload back to `PUT /experts`
- includes collection arrays for projects, clients, and media
- clears creator-only fields when `expertType !== 'creator'`

Current password behavior:
- handled entirely from the profile page
- no separate settings route

## Compatibility Layer Still In Play

These compatibility paths/fields still exist and are intentional:

- backend alias route: `/providers`
- backend alias route: `/providers/:slug`
- `GET /me/summary` response includes both `expert` and `provider`
- inquiry create still accepts `providerSlug` as a fallback in addition to `expertSlug`

These should be treated as transition surfaces, not new long-term contracts.

## Current Drift And Risks

1. Owner UI copy is not fully expert-first yet.
   - Example: onboarding headings still say `Provider onboarding` / `Create your provider profile`.

2. Frontend owner screens are still tolerant of the old alias shape.
   - This is good for stability now, but it means later cleanup must be coordinated.

3. The profile editor is already the heaviest owner contract surface.
   - Any UI restructuring must preserve collection payloads for `projects`, `clients`, and `media`.

4. Dashboard uses inquiry count summaries, not a richer inquiry model.
   - Dashboard copy can move faster than backend changes because it is not deeply coupled.

## Constraints For The Next MM-15 Tickets

### For `MM-37`
- Do not change backend required create fields unless the API changes intentionally.
- Onboarding can safely be trimmed because the create contract is already smaller than the profile-edit contract.

### For `MM-38`
- Profile editor can be reorganized visually without changing route structure.
- Keep the existing save payload stable while sections are re-grouped.

### For `MM-39`
- Dashboard language can be updated independently as long as it still respects:
  - `expert.status`
  - inquiry counts
  - owner role redirect behavior

### For `MM-40`
- Validation pass should focus on:
  - onboarding create
  - profile save
  - password change
  - inquiry list/status update

### For `MM-41`
- Cleanup should remove stale provider-facing UI only after the active owner surfaces are confirmed.

## Conclusion

The owner flow is already centered on the new expert model at the backend contract level. The main remaining work in this epic is not backend shape discovery. It is:

- simplifying which fields the owner sees first
- reorganizing the profile editor around clearer sections
- aligning owner-facing language with the expert marketplace direction
- validating that the full owner lifecycle still works after those changes
