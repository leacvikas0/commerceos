# CommerceOS — agent-to-agent procurement, with a human in the loop

CommerceOS is a working demo of a procurement flow where **buyer and supplier
agents negotiate automatically**, **a human vendor decides the borderline
offers**, and the **buyer authorizes and confirms the order**. There is no
payment layer: "completing the transaction" means the order is confirmed.

The point of the demo is the division of labour:

- the supplier agent auto-accepts offers at or above a threshold and
  auto-rejects offers below another threshold — no human involved;
- offers that fall **between** those thresholds are genuinely borderline, so
  they go to a vendor review desk where a person clicks ACCEPT / REJECT /
  COUNTER;
- the buyer only sees the buyer side, and must explicitly authorize and then
  confirm the resulting order;
- when a negotiation reaches agreement, its terms are frozen. If the supplier
  reprices afterwards, confirmation is **blocked** and the changed values are
  shown side by side.

All pricing and decision logic is deterministic TypeScript. No LLM is used for
pricing, accepting, or confirming.

## The interface

The app is a tabbed workspace, not a dashboard with a sidebar. The top strip is
the navigation model:

- **Requisition** — the buyer home: raise a requirement, see what is in flight,
  the catalogue, and what has settled.
- **One tab per recent negotiation** — each tab carries the item's status dot
  and SKU; two negotiations for the same item are told apart by their filed
  time.
- **Review desk** (pinned) — the vendor queue, with a count of offers waiting
  for a human decision.

Each screen is built from modules on a 12-column grid (suppliers, deal, order,
rounds, transcript; queue, offer review, decision, settled offers, listings).
Colour is used only for state: a 6px dot plus a word — amber waiting, red
blocked or declined, green agreed or confirmed. No gradients, no shadows, no
icons.

## Features

- **Deterministic negotiation engine** — every active listing for an item is
  negotiated in parallel; the buyer opens at its target, clamped to the
  supplier floor and to the per-unit budget, and counters rejected offers by
  closing half the gap to list price (max 3 rounds).
- **Auto-accept / auto-reject thresholds** — supplier-agent decisions are made
  from two per-listing thresholds, with a borderline band in between.
- **Vendor review desk** — pending offers show item, supplier floor, offered
  price and buyer, with the policy band drawn as a scale (floor / reject /
  accept / list) and ACCEPT / REJECT / COUNTER. Countered offers return to the
  buyer, who can accept the counter.
- **Buyer workspace** — pick an item, set quantity / target unit price / budget
  cap / deadline, run the negotiation, and see every round per supplier with
  the recommended deal.
- **Order flow** — the order is created server-side when a deal is agreed, with
  `totalMinor` computed on the server. The buyer authorizes, then confirms. No
  payment states exist.
- **Terms-verification gate** — price, delivery days, item spec version and
  listing terms version are frozen at agreement. On confirm they are re-read;
  any change sets the order to `BLOCKED` and shows old → new values. A vendor
  control ("Simulate supplier repricing") edits a listing so this can be
  demonstrated.
- **Buyer-safe read models** — floors and thresholds are never sent to buyer
  pages; they exist only on the vendor desk.

## Tech stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS v4
- Prisma 6 + SQLite
- Vitest for unit tests
- Server Actions for every mutation (no API routes needed)

## Project structure

```
commerceos/
├─ src/
│  ├─ app/                       Next.js App Router
│  │  ├─ layout.tsx              shell: tab strip, fonts, metadata
│  │  ├─ globals.css             design tokens and module styles
│  │  ├─ page.tsx                buyer workspace (requisition + negotiations)
│  │  ├─ actions.ts              server actions (start, vendor decisions,
│  │  │                          authorize, confirm, simulate repricing)
│  │  ├─ vendor/page.tsx         vendor review desk
│  │  └─ negotiation/[id]/page.tsx  buyer suppliers, deal, order, transcript
│  ├─ components/
│  │  ├─ shell/                  tab bar, page head
│  │  ├─ storefront/             requisition form, in flight, catalogue, settled
│  │  ├─ vendor/                 queue, offer review, decision, settled, listings
│  │  ├─ negotiation/            suppliers, deal, order gate, rounds, transcript
│  │  └─ ui.tsx, status.ts       shared primitives and status wording
│  └─ lib/
│     ├─ negotiation.ts          pure engine: decision bands, counters,
│     │                          status roll-up, recommendDeal
│     ├─ negotiation.test.ts     unit tests for the engine
│     ├─ negotiation-service.ts  DB orchestration: rounds, status, order,
│     │                          confirm gate, repricing simulation
│     ├─ queries.ts              read models (buyer DTOs exclude floors)
│     ├─ db.ts                   Prisma client singleton
│     └─ format.ts               integer-minor money parsing/formatting
├─ prisma/
│  ├─ schema.prisma              Item, Supplier, Listing, Buyer,
│  │                             Negotiation, Offer, Order
│  ├─ seed.ts                    catalogue + three driven demo negotiations
│  └─ migrations/
└─ scripts/
   ├─ smoke.ts                   runs one negotiation and prints its rounds
   └─ e2e.ts                     server-flow checks: accept → authorize →
                                 confirm, reprice → BLOCKED, vendor counter →
                                 buyer accepts counter
```

## Setup

Prerequisites: Node.js 20.9+ (tested on Node 24), npm.

```bash
cd commerceos
npm install                 # also runs `prisma generate`

cp .env.example .env        # DATABASE_URL="file:./dev.db"
                            # PowerShell: Copy-Item .env.example .env

npx prisma migrate dev      # creates prisma/dev.db and applies migrations
npx prisma db seed          # catalogue + three demo negotiations

npm run dev                 # http://localhost:3000
```

The seed is a demo reset: it clears the demo tables and recreates the
catalogue, then drives three negotiations through the real service so the app
opens with all three states worth showing:

| Scenario | State on open |
| --- | --- |
| Paper, target $27.00 | **Awaiting vendor** — three borderline offers on the desk |
| Paper, target $27.00, vendor accepts Meridian | **Confirmed** — authorized and confirmed order |
| Gloves, target $7.00, vendor accepts, supplier reprices | **Blocked** — terms changed before confirmation |

Useful commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server (Turbopack) |
| `npm run build` | production build |
| `npm run test` | Vitest unit tests for the negotiation engine |
| `npx prisma db seed` | reset to the seeded demo state |
| `npx prisma migrate status` | check migration state |
| `npx tsx scripts/smoke.ts` | run one negotiation and print its rounds |
| `npx tsx scripts/e2e.ts` | server-flow checks (cleans up after itself) |

## Demo walkthrough

### The three seeded states

1. **Awaiting vendor** — open the paper negotiation from the **In flight**
   module (or its tab). The supplier table shows two borderline offers and one
   auto-rejected offer; the order module says the desk has the decision.
2. **Review desk** — the pinned tab shows `3`. Pick an offer: the policy band
   places $27.00 between the reject line ($25.00) and the accept line ($28.00),
   with the caption doing the arithmetic. **Accept at $27.00** agrees the deal;
   **Counter** sends a price back to the buyer.
3. **Buyer accepts** — back on the negotiation, **Authorize order**, then
   **Confirm order**. The order is confirmed against the live terms.
4. **Blocked** — open the gloves negotiation. The **Terms changed** module
   compares the frozen terms with the live listing: list price $7.80 → $8.97,
   terms version revised. Confirmation failed; nothing was charged.

### Happy path from scratch

1. On **Requisition**, pick **A4 Copy Paper, 80 gsm**, quantity `100`, target
   `27.00`, budget `4,000.00`, deadline `7` days. Submit.
2. The negotiation opens as **Awaiting vendor**. A new tab appears in the strip.
3. On **Review desk**, accept one offer. The negotiation becomes **Agreed** and
   an order is created with a server-computed total.
4. Return to the tab, **Authorize order**, then **Confirm order**.
5. The order is **Confirmed** and the tab's dot turns green.

### Repricing block from scratch

1. Accept an offer on the review desk, but do not confirm.
2. Under **Listings & terms**, click **Simulate supplier repricing** for that
   supplier's listing. The list price rises 15% and the terms version gets a
   new revision.
3. On the negotiation, **Authorize order**, then **Confirm order**.
4. Confirmation is blocked and the old vs new values are listed.

## Tests

```bash
npm run test
```

The Vitest suite (`lib/negotiation.test.ts`) covers the pure engine:

- the three decision bands (auto-accept at/above the floor, auto-reject below
  the threshold, borderline stays pending), including exact boundary values;
- the buyer's opening offer (never below floor, never above the budget cap);
- the counter-offer maths (half the gap to list, clamped to budget, never
  moving down);
- the status roll-up (agreed / awaiting vendor / rejected);
- `recommendDeal` ordering: lowest price, then earliest delivery, then
  reliability.

The service flow is covered by `scripts/e2e.ts`, which drives the real database
through three paths: vendor accept → authorize → confirm, supplier repricing →
blocked confirmation, and vendor counter → buyer accepts counter. It asserts
totals, the old → new block reason, and the counter price, deletes the rows it
created and restores any listing it repriced.

## What works / what is partial

See `STATE.md` for the live status log. In short: the full flow is implemented,
seeded, and runnable from the browser. There is no payment layer by design, no
authentication (single seeded buyer and a single vendor desk), and no
multi-tenant data isolation — this is a demo, not a production procurement
system.
