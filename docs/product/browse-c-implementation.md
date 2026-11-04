# Browse Experts C implementation

Approved and implemented locally on 2026-11-03. The founder chose refined C, with the real map left and provider rows right. All marketing services is a high-contrast navy button with a grid icon. Homepage B remains unchanged.

## Delivered

- Searchable picker uses 12 existing marketing areas and 46 service groups, with plain-language descriptions, keyboard support, cancellation and draft selection.
- Five shortcuts cover broad marketing areas; precise service selections retain specific capabilities. Search supports catalog suggestions and provider text search.
- Any/all service matching is enforced in the existing backend /experts route. Synonyms within a group use alternatives; all selected groups are joined. Existing legacy service URLs, goal/area URLs, filters, sorting and pagination remain supported.
- ZIP/radius searches and nearest-first sorting work server-side, with distance ordering before pagination. No silent default location.
- Map and list use the same current results. Map pins highlight real provider rows; missing coordinates, loading and tile failures have clear states. Mobile toggles its map without hiding its content.
- Compare up to three providers from the current page. Profile links open existing real profiles.
- Price guidance uses actual minimum project budgets and hourly rates. Monthly fees are not stored, so ongoing support asks for a quote. No fabricated monthly prices, agencies, work examples, ratings or verification claims.
- Header styling matches the approved homepage/preview. Existing authentication and role navigation remain intact.

## Scope

Relevant frontend: src/app/experts/page.tsx; components/ExpertsDirectory.tsx and .css; lib/directory.ts; components/ExpertsDiscoveryMap.tsx; AppHeader.tsx; app/layout.tsx. Backend: routes/providers.ts and lib/providerSearch.ts. No schema changes, migrations, new dependencies, deployment, commit or simulation.

## Verification

Nineteen Playwright cases passed across the main run and two targeted reruns after fixing advanced search submission and synchronizing a resize assertion. Three backend tests cover grouped matching/validation plus actual Fastify route behavior and distance pagination. Backend TypeScript check passes. Targeted frontend lint passes; no TypeScript errors in the changed directory/header/map files. Repository-wide frontend typechecking still has existing errors elsewhere, and Next's existing configuration skips type validation.

Production build passes. Final network-enabled browser verification loaded 30 existing OpenStreetMap tiles, confirmed map readiness and a visible mobile canvas, and reported zero findings for the selected axe WCAG 2 A/AA and 2.1 AA checks. These checks are not a full accessibility certification or customer usability study. Earlier sandboxed browser runs could not fetch external tiles; the network-enabled check confirmed the actual map.

Real provider records determine available services and prices. Legacy broadly tagged providers will not be represented as having a precise specialty that they did not declare. Filtered results can be empty until suitable provider data exists.
