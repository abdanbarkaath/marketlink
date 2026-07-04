# MM-117 Signed-In UX Polish Design

## Goal

Improve MarketLink's signed-in experience and public homepage clarity so the app feels easier to scan, more intentional, and more usable for older or less technical users without changing backend behavior.

The work should make dashboards, inboxes, request/proposal surfaces, and chat feel like one coherent system instead of a set of similar-looking cards. The homepage should also explain what MarketLink does in simpler language before asking the user to search.

## Scope

This design covers:

- signed-in provider pages
- signed-in customer pages
- shared signed-in UI patterns
- public homepage simplification
- light public expert-page consistency adjustments if needed

This design does **not** cover:

- the browse experts directory page
- backend routes, schema, auth, or business logic changes
- new search/discovery rules
- taxonomy changes

## Product Intent

The visual direction should stay inside the current MarketLink brand language:

- keep the two-color base theme
- preserve the current clean, local-marketplace tone
- avoid introducing a totally new style system

But the UI should become:

- more obvious
- more eye-catching
- easier to understand at a glance
- clearer on mobile
- friendlier for older users through stronger hierarchy, contrast, and action emphasis

The reference behavior from Drive Haus is not about copying their styling literally. The useful pattern is:

- explain the product quickly
- use stronger card differentiation
- make important actions feel obvious
- keep supporting information quieter

## Problems To Solve

### 1. Repetitive card treatment

Right now wrapper sections, inbox rows, stat blocks, and action cards often share almost the same visual treatment. That makes screens feel flat and harder to parse quickly.

### 2. Weak action hierarchy

Buttons, pills, badges, and stat surfaces are visually too close to each other. Important actions do not stand out enough from metadata.

### 3. Duplicate information blocks

Some signed-in pages repeat high-level summaries in more than one section. That adds noise without improving understanding.

### 4. Weak navigation affordance

Subpages rely on inconsistent back links or local page-specific buttons. There is no shared top-level back pattern.

### 5. Homepage message is too layered

The homepage already has the right structural pieces, but the explanation is still more "marketplace language" than plain "what this app does for me" language.

### 6. Accessibility and age-friendly clarity

The current UI is usable, but several surfaces would be easier for older users if they had:

- stronger contrast
- clearer labels
- larger tap targets
- more obvious state color
- simpler scan paths

## Recommended Approach

Use a **shared shell + card system polish** instead of a full redesign.

This means:

- keep current routes and overall page purposes
- improve page headers, back navigation, card hierarchy, and status treatment
- make the same pattern reusable across provider, customer, and public homepage surfaces

This is preferable to a light color-only pass because color-only changes would leave the app feeling repetitive. It is also preferable to a full redesign because the ticket should stay frontend-only and low-risk.

## UX System Changes

### 1. Shared page header pattern

Create one reusable signed-in page header pattern for subpages.

It should support:

- eyebrow label
- main title
- short explainer
- shared top-level back control
- optional secondary action slot

The back control should:

- include an arrow
- read like "Back to dashboard", "Back to requests", or "Back to messages"
- be large enough for mobile use
- fall back sensibly if the previous route label is not available

The goal is consistency first, not browser-history cleverness. If a fully dynamic previous-page label is not reliable, a route-driven contextual label is acceptable.

### 2. Card hierarchy system

Introduce clearer visual separation between these surface types:

#### Shell/header card

Use for:

- top page framing
- summary intro areas
- high-level section container

It should feel broader, calmer, and less clickable than row cards.

#### Stat card

Use for:

- counts
- lightweight metrics
- "active", "needs proposal", "unread", "pending"

It should be compact, numeric, and visually distinct from action cards.

#### Action card

Use for:

- quick links
- dashboard shortcuts
- next-step prompts

It should feel more clickable and directional than stat cards.

#### Inbox/list item card

Use for:

- requests
- proposals
- inquiries
- conversations

It should prioritize:

- status
- title/person/business
- why it matters
- next action

Wrapper sections for inboxes should not look like the same card repeated one level up.

### 3. Status and metadata roles

Make each UI token type serve a distinct purpose:

- **Primary buttons**: most important action on the screen
- **Secondary buttons**: navigation or alternate action
- **Pills**: neutral metadata such as role, category, service fit, or locality
- **Badges**: meaningful state such as unread, accepted, declined, active, warning
- **Stat cards**: counts and summary numbers

Add selective accent use:

- green for success/completed/accepted/check states
- amber for waiting/needs attention
- red only for destructive or negative states
- blue/navy remains the core anchor color

Add small supporting icons only where they help scan speed:

- back arrow
- unread indicator
- check/success
- warning/attention
- message/request direction

Do not add icons everywhere.

## Page-Level Design

### Homepage (`src/app/page.tsx`)

Keep the existing search flow and taxonomy wiring, but simplify the explanation.

The hero should communicate:

1. what MarketLink is
2. what the visitor does next
3. why that is useful

The primary message should move closer to:

- describe your need
- add your location
- see local experts worth contacting

The goal is less abstraction and less marketing phrasing.

The problem and category cards should also become:

- more visually differentiated
- slightly easier to scan
- more direct in copy density

### Provider dashboard (`src/app/dashboard/page.tsx`)

Simplify the structure so it feels less duplicated.

Desired result:

- one strong top summary area
- one clearer metrics cluster
- one clear next-step/action area

The current "matched requests / inquiries / messages" references should still exist, but not as repeated summary storytelling in multiple places.

The important numbers should stand out more than the helper copy.

### Customer dashboard (`src/app/dashboard/customer/page.tsx`)

Apply the same hierarchy logic:

- tighter hero/summary card
- stronger action emphasis
- clearer stat grouping
- cleaner supporting cards

This page should feel lighter and more direct than the provider dashboard, but use the same visual system.

### Provider requests (`src/app/dashboard/requests/page.tsx`)

This page specifically needs:

- wrapper card that looks different from the request rows
- less visual sameness between "Request inbox" and the rows below it
- clearer "needs proposal / pending / accepted" state treatment
- easier scan order in each row

### Customer requests and proposals

Apply the same logic to:

- `src/app/dashboard/customer/requests/page.tsx`
- `src/app/dashboard/customer/requests/view/page.tsx`
- `src/app/dashboard/customer/proposals/page.tsx`

The key improvement is directness:

- title first
- status next
- key location/fit data next
- action last

The page should avoid looking like a stack of nearly identical cards.

### Provider and customer messages

The message shell should feel more like an inbox workspace and less like generic stacked white blocks.

The conversation list, selected-thread header, and message area should have:

- stronger distinction between navigation and content
- clearer unread treatment
- clearer selected state
- larger tap targets on mobile

The existing workflow remains the same.

### Inquiries

The provider inquiries page should align with the same inbox pattern as messages and requests:

- clearer section shell
- stronger state treatment
- easier-to-spot new/read/archived distinctions

### Public expert page

Do not redesign the expert page heavily in this ticket.

Only make consistency adjustments if needed so public and signed-in surfaces do not feel unrelated. The homepage simplification is the main public-facing change for this ticket.

## Technical Design

### Reusable components

Add one or two reusable frontend helpers rather than rewriting every page independently.

Recommended additions:

- a shared back control component
- a shared signed-in page header component
- a lightweight shared status badge helper or card-role utility if repeated badge logic starts duplicating across pages

The goal is not abstraction for its own sake. The goal is to make the repeated signed-in patterns easier to apply consistently.

## Styling strategy

Stay inside existing Tailwind and current design tokens/classes.

Prefer:

- reuse of current `ml-` utility classes where possible
- targeted new utility patterns only where current ones are too generic
- minimal new complexity in theme handling

Avoid:

- introducing a new component library
- large animation work
- major state-management changes

## Mobile and desktop validation

Every changed page must be checked in both desktop and mobile layouts.

Validation focus:

- no clipped buttons
- no overlapping sections
- visible back control
- readable card hierarchy
- clear active/selected state
- comfortable tap targets
- no regression to existing navigation flows

## Success Criteria

This ticket is done when:

- signed-in shell/header cards are visually distinct from inbox/list item cards
- a shared back pattern exists and is used where appropriate
- duplicated summary sections are reduced
- provider and customer dashboards are easier to scan
- request, proposal, inquiry, and message pages feel more structured and less repetitive
- buttons, pills, badges, and stat surfaces each have distinct roles
- important states use color and icons intentionally
- the homepage explains the product more simply
- mobile and desktop both remain stable
- no backend behavior changes are required

## Files Likely To Change

- `marketlink-frontend/src/app/page.tsx`
- `marketlink-frontend/src/components/AppHeader.tsx`
- `marketlink-frontend/src/app/dashboard/page.tsx`
- `marketlink-frontend/src/app/dashboard/messages/page.tsx`
- `marketlink-frontend/src/app/dashboard/inquiries/page.tsx`
- `marketlink-frontend/src/app/dashboard/requests/page.tsx`
- `marketlink-frontend/src/app/dashboard/customer/page.tsx`
- `marketlink-frontend/src/app/dashboard/customer/requests/page.tsx`
- `marketlink-frontend/src/app/dashboard/customer/requests/view/page.tsx`
- `marketlink-frontend/src/app/dashboard/customer/proposals/page.tsx`
- `marketlink-frontend/src/components/chat/ConversationWorkspace.tsx`

Likely new shared UI files:

- a shared back control component
- a shared signed-in page header component

## Risks and Guardrails

Main risk: turning this into a broad redesign and destabilizing working flows.

Guardrails:

- keep backend untouched
- do not change browse-experts page
- do not change workflow logic
- prefer reusable shell/card improvements over page-specific custom styling
- verify mobile and desktop before calling the ticket complete
