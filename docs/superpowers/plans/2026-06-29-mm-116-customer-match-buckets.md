# MM-116 Customer Match Buckets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show customers private match buckets for delivered, near-radius, and strong-fit experts without changing MM-115 provider delivery rules.

**Architecture:** Extend the existing `deliveryPreview` response in `marketlink-backend/src/routes/requests.ts` so unsure requests return bucketed private preview data while provider inbox logic continues using the strict in-radius matcher from MM-115. Update the customer request detail page to render those buckets with plain language that separates who actually received the request from customer-only suggestions.

**Tech Stack:** Fastify, Prisma, Node test runner, Next.js App Router, TypeScript, TailwindCSS

---

### Task 1: Lock The Bucketed Preview Contract In Backend Tests

**Files:**
- Modify: `marketlink-backend/tests/requests.test.js`
- Test: `marketlink-backend/tests/requests.test.js`

- [ ] Add failing coverage for unsure request preview buckets on customer request detail.
- [ ] Verify the new test fails because the current preview is flat and missing bucket fields.

### Task 2: Expand Customer Delivery Preview For Unsure Requests

**Files:**
- Modify: `marketlink-backend/src/routes/requests.ts`
- Test: `marketlink-backend/tests/requests.test.js`

- [ ] Add bucketed preview fields for unsure requests:
  - `deliveredExperts`
  - `justOutsideExperts`
  - `strongFitFartherAwayExperts`
  - `totalDelivered`
- [ ] Keep MM-115 provider matching unchanged for inbox, detail, and proposal access.
- [ ] Re-run request route tests until green.

### Task 3: Update Customer Request Detail UI

**Files:**
- Modify: `marketlink-frontend/src/app/dashboard/customer/requests/view/page.tsx`

- [ ] Update request-detail types to accept the new bucketed preview shape.
- [ ] Replace the flat likely-experts section with three customer-friendly bucket sections for unsure requests.
- [ ] Keep the specific-request preview experience compatible with the existing flat list.

### Task 4: Verify The Full MM-116 Change

**Files:**
- Verify only

- [ ] Run `cd marketlink-backend && node --test tests/requests.test.js`
- [ ] Run `cd marketlink-backend && npm run build`
- [ ] Run `cd marketlink-frontend && npm run build`
