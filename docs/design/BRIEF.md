# CommerceOS — design brief for the plan/critique loop

This file is the shared source of truth for the design lead and the design
critic. It is written by the Lead from the actual repository. Do not assume
anything not stated here; verify against the code and the running app.

## Product

CommerceOS is a working demo of agent-to-agent procurement with a human in the
loop:

1. A buyer raises a requirement (item, quantity, target unit price, budget cap,
   deadline).
2. A deterministic engine negotiates with every active supplier listing in
   parallel. Supplier policy auto-accepts at/above a threshold, auto-rejects
   below another, and leaves a borderline band.
3. Borderline offers go to a vendor desk where a human clicks ACCEPT / REJECT /
   COUNTER (counter takes a price).
4. When any offer is accepted the deal is agreed and an order is created
   server-side (total = unit price × quantity, integer minor units).
5. The buyer AUTHORIZES, then CONFIRMS the order. Confirmation re-reads the
   listing/item: if price, delivery, item spec version or listing terms version
   changed since agreement, the order becomes BLOCKED and shows old → new.
6. No payment layer exists. "Done" = order CONFIRMED.

## Routes and what each must show

- `/` Buyer workspace. Raise a requisition; see open negotiations; account +
  catalogue context.
- `/vendor` Vendor review desk. Pending offers (item, quantity, offered price,
  supplier floor, buyer) with ACCEPT / REJECT / COUNTER; auto-decided offers
  read-only; listings with a "Simulate supplier repricing" control.
- `/negotiation/[id]` Buyer transcript. Every round per supplier, the
  recommended deal, vendor counter banner (accept), and the order gate
  (authorize → confirm → confirmed / blocked with old vs new).

## Data actually available (do not invent fields)

From `src/lib/queries.ts`:

- `getStorefront()` → buyer { name, currency, budgetCapMinor }, items
  [{ id, sku, name, description, specVersion, offers: [{ supplierName,
  reliabilityScore, listPriceMinor, deliveryDays, currency, inStock }] }].
- `getNegotiationDetail(id)` → { id, status, quantity, targetUnitPriceMinor,
  budgetCapMinor, deadline, createdAt, buyerName, item { name, sku, specVersion },
  rounds: [{ listingId, supplierName, reliabilityScore, deliveryDays,
  listPriceMinor, currency, offers: [{ id, round, unitPriceMinor, decision, note,
  createdAt }] }], order: null | { id, status, agreedUnitPriceMinor, quantity,
  totalMinor, currency, blockReason, authorizedAt, createdAt } }.
- `getVendorDashboard()` → pending offers + decided offers (same offer shape:
  id, round, unitPriceMinor, note, createdAt, negotiation { quantity, deadline,
  buyer { name }, item { name, sku } }, listing { id, listPriceMinor,
  floorPriceMinor, currency, deliveryDays, autoAcceptFloorMinor,
  autoRejectBelowMinor, supplier { name, reliabilityScore } }), listings with
  the same listing fields + termsVersion.
- `getRecentNegotiations(limit)` → negotiations with item + order.

Server actions (all FormData, in `src/app/actions.ts`): startNegotiationAction
(itemId, quantity, targetPrice, budgetCap, deadlineDays), vendorAcceptAction
(offerId), vendorRejectAction (offerId), vendorCounterAction (offerId,
counterPrice), buyerAcceptCounterAction (offerId, negotiationId),
authorizeOrderAction (orderId, negotiationId), confirmOrderAction (orderId,
negotiationId), simulateRepricingAction (listingId).

Errors and notices arrive as `?error=` / `?notice=` query params.

Hard rule: supplier floors and auto-decision thresholds must never render on
buyer-facing pages (`/`, `/negotiation/[id]`). They belong on `/vendor` only.

## Current implementation (what you are judging)

- Next.js 16 App Router, Tailwind v4, TypeScript, server components; no client
  JS except what Next needs.
- App shell with a 240px sidebar (wordmark, nav, recent list) and a top header
  per page; pages use a 12-column grid with white cards, 1px borders, neutral
  gray page background.
- Fonts: Inter (UI) + IBM Plex Mono (numbers). Tokens in `src/app/globals.css`.
- Screenshots of the current state: `_shots/v2-home-1440.png` and the live app
  at http://localhost:3000 (dev server already running; do not start a second
  one on port 3000).

## What the human said (verbatim, in order)

1. On the first editorial/paper-ledger direction: "too artistic and not very
   useful, modern, actually bad choices."
2. On the next pass: "it's still very bad — you have to rethink it or start it;
   it just changed the CSS, the layout is still the older stupid one."
3. On the current pass: "we need the UI UX to be better; this is very very bad
   right now, too generic, too unthought, not at all premium."
4. Standing constraints: "avoid gradients and shitty UI at all costs, no tech
   themes, logo is shit" (the icon mark is gone; the wordmark is plain text).

Interpretation: he wants a considered, premium, modern product interface with a
real point of view — not a generic admin template, not an editorial art piece,
not a tech/cyber theme. Useful first, beautiful second, never decorative filler.

## Non-negotiables

- No gradients, glassmorphism, glows, neon, cyber/tech themes, icon logo marks,
  fake telemetry, decorative sci-fi chrome.
- No invented data, no fake numbers, no components that do not exist in the
  data model.
- Buyer pages never show floors or thresholds.
- The app must keep working: `npx tsc --noEmit` clean and `npm run build` clean.
- All server logic (`src/lib/**`, `src/app/actions.ts`, `prisma/**`) is owned by
  the Lead. Design work touches `src/app/**` (pages/layout/globals.css) and
  `src/components/**` only.
- If you need a running app: the Lead's dev server is on port 3000. If it is
  down, start `npm run dev` on 3000 yourself and kill it when you finish.

## Process (must be followed exactly)

Round structure, repeated:

1. Design lead writes/revises `docs/design/PLAN.md`.
2. Design critic reviews it against this brief and the actual running app, then
   writes `docs/design/CRITIQUE.md` ending with exactly one verdict line:
   `VERDICT: APPROVED` or `VERDICT: CHANGES REQUIRED`.
3. If changes are required, the lead revises and the critic re-reviews.
4. Maximum 4 rounds; if not approved by then, report to the Lead.

After the critic approves the plan, the lead implements it and the critic
reviews the implemented screens (screenshots at 1440px and 390px plus code)
with the same verdict format. The lead fixes until approved.

## Anti-hallucination rules for both agents

- Every claim about the app must be backed by something you actually read
  (file path) or actually saw (screenshot or DOM snapshot). Say which.
- Do not describe components, fields, routes or actions that do not exist.
- Do not claim a visual problem without looking at the rendered page.
- Do not claim a fix without re-rendering and re-checking.
- When uncertain, inspect instead of guessing.
