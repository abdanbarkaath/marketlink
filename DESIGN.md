# MarketLink design contract

## Product and audience

MarketLink helps local business owners find nearby marketing providers, compare their work and services, and contact them directly. The parties arrange the work and payment themselves. Providers may be agencies, freelancers, creators, or specialists. Users do not need to know marketing terminology to begin.

## Direction

A practical local marketplace: plain explanations, readable filters, comparable evidence, and direct actions. The founder approved homepage preview B: a navy introduction, modern bold Manrope typography, restrained peach search action, provider showcase, and an Explore section with real results and the existing map. Winnie informs warmth and clarity; Thumbtack informs local discovery and scanability. Do not copy their visual identities.

Public display headings may use Fraunces; operational dashboards, forms, and controls use Manrope. The same neutral surfaces, navy actions, borders, input treatment, and focus rules apply across all routes. Avoid treating each page as an independent design exercise.

## Color and surfaces

- Primary action: blue `#2455B5` (`--ml-primary` in the default theme), with white contrast text. Navy `#192A48` remains the identity and heading color. This brighter direction replaces the overly restrained navy-only pass following user feedback.
- Main surface: white; default page canvas `#F5F7FB`. Supporting surfaces: pale blue `#EDF3FF`, with warm gold `#FFCF68` used in illustrations and highlights. Use defined roles rather than adding a different color for each category.
- Text: slate-900/950 for headings, slate-600 or the tested muted token for supporting copy.
- Borders: `--ml-border`; visible enough to identify inputs without relying on a shadow.
- Gold supports brand illustration and highlights; status colors retain explicit labels: green for success, red for failure, amber for a genuine warning. Never rely on color alone.
- Solid surfaces instead of decorative gradients, frosted panels, glow, dotted backgrounds, or floating pill containers. Shadows are reserved for useful overlay separation, not every card.

These public surfaces use scoped styles. Global theme tokens, auth pages, and dashboard styles are outside this change.

## Type and spacing

Use sentence-case labels and ordinary letter spacing. Avoid tracked uppercase eyebrows and decorative numbers. Use 14px labels/supporting copy, at least 16px for primary reading content where appropriate, and clear section headings. Compact supporting metadata may be 12px, never faint placeholder-like text.

Use 8px corners for inputs/buttons and about 12px for contained sections. Do not force all round elements to share a radius; circular map pins and avatars retain their purpose. Prefer a divider and spacing to unnecessary boxes inside boxes.

## Discovery

Let owners start with a business goal or a known service. Location, distance, and service controls need enough width for their labels and values. Keep less-common refinements in an explicit disclosure. Selected filters wrap rather than clip. Preserve existing query keys, sorting, pagination, matching, and radius behavior unless a separate task changes them.

Provider cards prioritize name, location, relevant services, evidence/summary, price guidance, and opening the profile. Use real images where provided and readable initials when no usable logo exists; never invent proof. No fake preview statistics, automatic quality scores, or locality claims.

## Accessibility and verification

Keep visible keyboard focus, semantic controls, readable placeholder text, 44px primary touch targets, and reduced-motion support. Searchable dropdowns share one combobox implementation with arrow keys, Enter, and Escape. Preserve native form submission semantics.

Check desktop and mobile screenshots and actual interactions. A clean scanner is only code evidence; it is not proof of good design or accessibility compliance. Fixture previews do not replace a real-account end-to-end test.

## Landing page

The founder selected preview B, including its lower Explore demonstration. Treat `marketlink-frontend/src/components/HomeMarketplace.css` as the visual authority: navy #192A48, peach #EFC3AA, Manrope, white search module, agency identity banners, and sample map. The scoped implementation lives in HomeMarketplace.css. Preserve its typography weights, navbar, spacing, colors, and input composition.

The landing page explains the marketplace using clearly labeled fictional agency profiles and an illustrative map. Actual listings, live map, richer filters, pagination, and provider contact belong to Browse experts at /experts. Search routes there with the existing supported query parameters. Blank location means general browsing. Five expertise choices filter only the fictional examples and never carry demo service selections into real discovery. Only the search form’s ZIP and agency name are passed to real discovery.

On mobile, retain Browse experts and Sign in without wrapping their labels. Provider subscriptions and direct business/provider arrangements remain the product model.

## Browse Experts — approved C

The founder approved refined preview C for the live directory: navy search area, searchable All marketing services, a live map on the left, and comparable provider rows on the right. The catalog uses the existing taxonomy. Keep All marketing services visibly actionable with a navy background and grid icon. Use real project/hourly prices; ongoing service pricing is quoted by providers. Match any/all selected services explicitly on the server. Preserve URL filters, sorting, pagination, real profile links and mobile map access. See docs/product/browse-c-implementation.md.


## Agency detail � approved refined C

Use `marketlink-frontend/src/app/experts/[slug]/profile.css` as the visual authority for `/experts/[slug]`: navy introduction, peach single contact CTA, Instagram at right, Manrope, sage overview facts, service rows with clear deliverables, projects and reviews, and a pricing/location sidebar. Only the hero links to the enquiry form; form submission remains a separate action. Populate all content from provider data. No sample project art, client names, prices or Instagram tiles ship into real profiles. Preserve missing-data states, approximate location labels, real enquiry handling and external social links.

Agency detail Instagram previews prioritize the saved account URL. Saved post media is used only when no account preview exists; do not replace the account preview with unrelated seeded post examples.
