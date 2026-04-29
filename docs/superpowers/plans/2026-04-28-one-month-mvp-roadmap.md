# MarketLink One-Month MVP Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a credible public expert marketplace MVP in one month, get real business and expert feedback, and defer heavier marketplace workflow features until after learning from that launch.

**Architecture:** Build only the public-facing discovery and expert-profile foundation needed to help a business owner understand the offer, browse experts, compare basic proof, and send inquiries. Stop before buyer accounts, broadcast requests, proposals, messaging, notifications, and monetization so launch is fast and feedback comes early.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, TailwindCSS, Fastify, Prisma, PostgreSQL, session auth.

---

## MVP Definition

This first launch should prove four things:

1. Businesses understand what MarketLink is.
2. Businesses can find and compare local marketing experts.
3. Businesses are willing to send inquiries.
4. Experts are willing to be listed under the broader expert model.

If those four are not proven yet, building buyer accounts, request broadcasting, proposals, messaging, notifications, or monetization is premature.

## Epic Buckets

### Ship Before Feedback

- `MM-8` Public IA and Terminology Implementation
- `MM-15` Provider Schema and Read-Model Extension for Unified Expert Model
- `MM-22` Homepage and Discovery Implementation
- `MM-29` Expert Card, Detail, and Inquiry Simplification

### Ship After Feedback

- Buyer Accounts and Dashboard Foundation
- Broadcast Request Flow
- Expert Proposal Flow

### Defer Until There Is Clear Traction

- Private Messaging
- Notifications and Delivery Wiring
- Admin Moderation Extension for Buyer-Side Workflows
- Monetization Scaffolding

## What "Done Enough to Launch" Means

The first launch does **not** need a fully structured hiring workflow. It only needs:

- clean homepage positioning
- usable `/experts` discovery
- stronger expert detail pages
- expert model support for agencies, freelancers, creators, and specialists
- inquiry submission that works reliably

That is enough to launch, test demand, and gather qualitative feedback.

## One-Month Roadmap

### Week 1: Finish Expert Model Foundation

- [ ] Finish the remaining required tickets in `MM-15`
- [ ] Treat `MM-18` and `MM-19` as required because the new fields are not usable until read models and validation support them
- [ ] Treat `MM-20` and `MM-21` as required if the new expert fields must be visible in the MVP
- [ ] Defer `MM-36` to `MM-41` unless one of them fixes a direct launch blocker

**Target outcome:** the system can persist, read, validate, and display the unified expert model without broken paths or confusing fallback behavior.

### Week 2: Ship Discovery That Makes Sense

- [ ] Start `MM-22` Homepage and Discovery Implementation
- [ ] Keep scope tight: homepage, category/service entry, expert list framing, and basic filtering clarity
- [ ] Do not expand into advanced recommendation, AI diagnosis, or heavy personalization
- [ ] Make sure the path from homepage to `/experts` feels obvious and fast

**Target outcome:** a local business owner can land on the site and quickly understand where to click to find marketing help.

### Week 3: Improve Expert Comparison and Inquiry Confidence

- [ ] Start `MM-29` Expert Card, Detail, and Inquiry Simplification
- [ ] Focus on proof, scannability, clarity, trust, and contact confidence
- [ ] Make cards easier to compare
- [ ] Make expert detail pages feel more trustworthy and easier to evaluate
- [ ] Make inquiry prompts and CTAs simple and credible

**Target outcome:** a buyer can compare experts and feel comfortable sending an inquiry without needing buyer accounts or proposals.

### Week 4: Launch Readiness and Feedback Setup

- [ ] Run a regression pass across homepage, `/experts`, expert detail, onboarding, and inquiry flow
- [ ] Seed enough representative experts for agency, freelancer, creator, and specialist paths
- [ ] Tighten copy, polish obvious UX friction, and remove unfinished or misleading surfaces
- [ ] Prepare a short feedback loop:
  - who to show it to
  - what questions to ask
  - what signals matter most

**Target outcome:** the product is stable enough to demo and share, and feedback collection is intentional rather than ad hoc.

## MVP Ticket Cut Line

### Must-Have

- `MM-8` completed
- `MM-15` core story set needed to make expert fields real:
  - `MM-16`
  - `MM-17`
  - `MM-18`
  - `MM-19`
  - likely `MM-20`
  - likely `MM-21`
- `MM-22` core discovery tickets
- `MM-29` core card/detail/inquiry tickets

### Nice-to-Have but Not Launch-Critical

- deeper dashboard cleanup
- broader profile-editor polish
- non-blocking internal terminology cleanup
- extra admin/reporting refinements

### Do Not Block Launch On

- buyer account system
- request broadcasting
- proposal workflow
- private messaging
- notification system
- monetization

## Post-Launch Plan

After the first launch, evaluate:

1. Do businesses understand the positioning?
2. Which expert types get the most interest?
3. Are inquiries happening?
4. Are experts willing to participate and maintain profiles?
5. What do buyers complain is missing from the current flow?

Use those answers to decide whether phase 2 should prioritize:

- buyer accounts
- broadcast requests
- proposals

and in what order.

## Recommendation

The correct move is:

- finish the public marketplace MVP
- launch in roughly a month
- get real user feedback
- only then decide how much of the structured marketplace workflow to build next

This keeps the roadmap ambitious without forcing you to build the whole marketplace before learning whether the public expert directory already solves a meaningful problem.
