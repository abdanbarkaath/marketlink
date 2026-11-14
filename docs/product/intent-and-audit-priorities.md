# MarketLink — Product intent and audit decisions

**Status:** Standing instructions for Codex when planning, auditing, or implementing MarketLink tickets. This is public product-engineering guidance, not a legal document.

## Mission and current product decisions

Help U.S. small businesses identify relevant marketing services, compare suitable marketing providers, and reach them with clear expectations. Help independent marketers and agencies present truthful expertise and receive qualified inquiries. Build a useful marketplace; do not optimize for superficial appearance or unsupported impact claims.

- Preserve the existing public directory and direct search, including shareable service, buyer-goal, location, sort, and filter parameters where supported.
- An optional guided-discovery entry is a **future approved direction**, not evidence that a questionnaire is shipped. Never replace direct search or force a quiz.
- Preserve existing guest inquiry, provider onboarding, location privacy, publication consent, and other working flows unless a ticket explicitly authorizes a change.
- The homepage intentionally demonstrates how agency cards, example filters, and an illustrative map work using **fictional, disclosed** profiles. These are teaching/demo content, not actual supply or matching results. Do not remove, replace, or treat them as a product defect solely because they are not real. Check whether the visitor can distinguish samples from live search, and propose a small clarification only if there is an evidenced usability concern.
- The marketplace includes agencies and individual marketing providers. Do not conduct a wholesale rename of provider/expert/agency/team terminology before an owner-approved terminology decision.

## Audit workflow: understand intent before proposing changes

Read `AGENTS.md`, the Jira ticket, relevant code, and available product reference documents. Use source links and actual behavior, not what you assume a perfect product would do.

Every audit finding must be classified as one of:

1. **Confirmed defect:** reproducible broken functionality, incorrect route/role, loss of data, privacy/security issue, or proven accessibility barrier.
2. **Intentional/approved:** deliberate demonstration, workflow, or design choice. Preserve unless the owner elects to change it.
3. **Unverified risk:** possible issue requiring browser/runtime reproduction or product-intent clarification. State the missing evidence.
4. **Optional enhancement:** a plausible improvement without evidence the current behavior is defective.

Provide **keep as is** as a legitimate recommendation. A verified code observation is not automatically a verified user problem. Proposed benefits remain hypotheses until measured.

## Priority and ordering

- **P0:** Confirmed major security, privacy, data-loss, or serious trust harm.
- **P1:** Confirmed disruption or misdirection of a core buyer/provider task (registration into the wrong role, discovery, matching, profile/contact).
- **P2:** Testable friction in choosing a suitable service/provider, trust/price comprehension, recovery, or qualified contact.
- **P3:** Cosmetic differences, speculative label preferences, and low-impact refinements.

Never elevate a cosmetic or intentional demo change to P1 merely because it looks different from a model-generated ideal.

Within the same severity, prioritize **real small-business/provider value, a lawful and credible way to observe outcomes, dependencies, effort, and regression risk**. Useful future measures may include reaching a relevant results page, correctly identifying service fit, fewer misdirected journeys, successfully returning to filtered results, and valid inquiry completion. Instrumentation and user studies require separately approved scope and proper privacy/authorization safeguards. Do not fabricate results.

## Audit handoff format

For each actionable finding, provide:

- Source evidence: file/line, observed behavior, source/test version, and VERIFIED/PARTIAL/UNVERIFIED status.
- Intent classification and affected buyer/provider task.
- Business consequence: actual observed harm versus an expected, unmeasured benefit.
- Exact recommended approach, touched files/routes, preserve-as-is alternative, dependencies, and downstream effects.
- Severity with concrete rationale, plus recommended order.
- Acceptance criteria, regression cases (including mobile/keyboard/guest/direct links), and optional *planned* measurement.
- Decision: **APPROVED EXISTING RULE / OWNER DECISION REQUIRED / DEFER / KEEP**.

An audit is **not** permission to implement every recommendation. The follow-up instruction `implement the approved audit` means implement only the owner-approved scope. For major copy, role, provider-type, pricing, verification, trust, or marketplace behavior changes, pause for a decision before modifying code. Produce focused tests and PR references for implemented behavior.

## Concrete calibration examples

- **`For agencies` navigating to a customer signup:** possible P1 buyer/provider misdirection, when verified. Report the route and registration role; propose alternatives; ask owner to choose the provider journey.
- **Fictional homepage agencies/map clearly labeled as examples:** intentional demonstration; **keep**, unless evidence shows the demo conceals real listings or visitors cannot tell the difference. Heading copy is at most a proposed minor adjustment without user evidence.
- **New service/goal shortcuts:** potentially valuable P2 enhancement using existing filters; do not call their absence a broken flow without evidence.
- **Provider terminology:** an owner-level product-positioning decision, not a reason to rename every string during an audit.

## Boundaries

Protect existing feature and route compatibility, meaningful design intent, accessibility, privacy, and truthful public representation. Do not introduce new business models or new industries based on an audit. Do not add private immigration/petition materials to product code, tickets, reports, or agent guidance. Escalate actual security/privacy defects regardless of any prioritization goal.
