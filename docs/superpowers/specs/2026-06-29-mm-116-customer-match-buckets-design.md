# MM-116 Customer Match Buckets Design

## Goal

Upgrade the customer request detail experience so private request previews explain:

- which experts actually received the request
- which experts are just outside the chosen radius
- which experts are farther away but still look like a strong fit

Provider delivery rules from MM-115 must stay unchanged. This ticket is customer-facing preview logic plus any minimal backend response changes needed to support it.

## Scope

### In scope

- Expand the customer `deliveryPreview` payload returned by `GET /requests/:id`
- Keep provider delivery for unsure requests restricted to in-radius experts only
- Update the customer request detail page to render three match buckets
- Add clear copy explaining which experts actually received the request

### Out of scope

- Changing provider inbox delivery rules
- Creating new public discovery routes
- Changing customer request creation flow
- Changing expert ranking outside the request preview surfaces

## Product Rules

### Unsure requests

For `UNSURE` requests, the private customer preview should show three buckets:

1. `Inside radius`
- Experts within the selected ZIP-centered radius
- These are the experts who actually received the request

2. `Just outside`
- Experts outside the chosen radius but within `radius + 3 miles`
- These are shown only to the customer
- These experts do not receive the request automatically

3. `Strong fit farther away`
- Experts beyond the `radius + 3 miles` band
- These are shown only when they qualify as a strong fit
- Strong fit means `2+` matching service tokens
- These experts do not receive the request automatically

### Specific requests

For `SPECIFIC` requests:

- Keep existing matching behavior intact
- Continue using service-token plus locality logic
- Continue showing the existing preview list unless the updated shared preview shape requires light UI normalization

## Backend Design

### Existing base

MM-115 already introduced:

- strict provider delivery for unsure requests using ZIP-center lookup plus expert coordinates
- `within_radius` matching for unsure requests
- customer request previews for unsure requests

### Required backend change

Extend `buildDeliveryPreview` in `marketlink-backend/src/routes/requests.ts` so customer preview responses for unsure requests include:

- `deliveredExperts`
- `justOutsideExperts`
- `strongFitFartherAwayExperts`
- `totalDelivered`

The backend should continue returning enough shared expert card data for the customer UI:

- `id`
- `slug`
- `businessName`
- `city`
- `state`
- `zip`
- `verified`
- `rating`
- `matchedServiceTokens`
- `distanceMiles`
- `primaryReason`

### Matching logic for unsure requests

1. Resolve the request ZIP to a geocoded center
2. Query active experts with saved coordinates
3. Compute `distanceMiles` from request center to expert coordinates
4. Put experts into one of these mutually exclusive buckets:

- `deliveredExperts`
  - `distanceMiles <= radiusMiles`

- `justOutsideExperts`
  - `distanceMiles > radiusMiles`
  - `distanceMiles <= radiusMiles + 3`

- `strongFitFartherAwayExperts`
  - `distanceMiles > radiusMiles + 3`
  - `matchedServiceTokens.length >= 2`

### Strong-fit token source

For unsure requests, strong-fit token matching needs a token source. Use the request’s saved `serviceTokens` when they exist.

If an unsure request has no service tokens, the strong-fit farther-away bucket should be empty. The inside-radius and just-outside buckets should still work from distance alone.

This keeps the change minimal and consistent with the current request model.

### Delivery clarity

Only `deliveredExperts` represent experts who actually received the request.

The other two buckets are strictly informational and customer-only. They must not affect provider inbox visibility or proposal eligibility.

## Frontend Design

### Page

Update:

- `marketlink-frontend/src/app/dashboard/customer/requests/view/page.tsx`

### UI structure

Replace the single flat “Likely experts” section with three stacked sections for unsure requests:

1. `Received your request`
- Shows in-radius experts
- Plain explanation that these experts were actually notified

2. `Just outside your radius`
- Shows experts up to 3 miles beyond the selected radius
- Plain explanation that they were not notified automatically

3. `Farther away, but may still fit`
- Shows strong-fit farther-away experts
- Plain explanation that these are suggestions only

For specific requests, keep the existing simpler preview presentation unless the backend response shape requires a small compatibility branch.

### UX copy principles

- Keep language simple and direct
- Avoid internal matching jargon
- Make “received the request” explicit only for bucket one
- Make “shown to you only” explicit for buckets two and three

## Testing

### Backend

Add regression tests covering:

- unsure request preview includes in-radius experts in the delivered bucket
- unsure request preview includes near-overflow experts in the just-outside bucket
- unsure request preview includes only `2+` token farther-away experts in the strong-fit bucket
- provider inbox still only includes in-radius unsure requests

### Frontend

Verify customer request detail:

- renders the three buckets for unsure requests
- shows clear copy about who actually received the request
- preserves the existing specific-request view

## Risks

- Unsure requests without service tokens cannot produce strong-fit farther-away results; this is acceptable for this ticket
- The backend preview contract changes, so the customer request detail page must be updated together
- The provider matching path must keep using the strict MM-115 delivery logic without bucket leakage
