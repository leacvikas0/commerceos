# CommerceOS — agent-to-agent procurement, with a human in the loop

CommerceOS is a working demo of a procurement flow where **buyer and supplier
agents negotiate automatically**, **a human vendor decides the borderline
offers**, and the **buyer authorizes and confirms the order**. There is no
payment layer: "completing the transaction" means the order is confirmed.

The point of the demo is the division of labour:

- the supplier agent auto-accepts offers at or above a threshold and
  auto-rejects offers below another threshold — no human involved;
- offers that fall **between** those thresholds are genuinely borderline, so
  they go to a vendor dashboard where a person clicks ACCEPT / REJECT /
  COUNTER;
- the buyer only sees the buyer side, and must explicitly authorize and then
  confirm the resulting order;
- when a negotiation reaches agreement, its terms are frozen. If the supplier
  reprices afterwards, confirmation is **blocked** and the changed values are
  shown side by side.

All pricing and decision logic is deterministic TypeScript. No LLM is used for
pricing, accepting, or confirming.

## Features

- **Deterministic negotiation engine** — every active listing for an item is
  negotiated in parallel; the buyer opens at its target, clamped to the
  supplier floor and to the per-unit budget, and counters rejected offers by
  closing half the gap to list price (max 3 rounds).
- **Auto-accept / auto-reject thresholds** — supplier-agent decisions are made
  from two per-listing thresholds, with a borderline band in between.
- **Vendor dashboard** — pending offers show item, quantity, offered price,
  supplier floor and buyer, with ACCEPT / REJECT / COUNTER (counter takes a
  price). Auto-decided offers are listed read-only so the threshold behaviour
  is visible.
- **Buyer storefront** — pick an item, set quantity / target unit price /
  budget cap / deadline, run the negotiation, see every round per supplier and
  the recommended deal.
- **Order confirmation** — the order is created server-side when a deal is
  agreed, with `totalMinor` computed on the server. The buyer authorizes, then
  confirms. No payment states exist.
- **Terms-verification gate** — price, delivery days, item spec version and
  listing terms version are frozen at agreement. On confirm they are re-read;
  any change sets the order to `BLOCKED` and shows old → new values. A vendor
  control ("Simulate supplier repricing") edits a listing so this can be
  demonstrated.

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
│  │  ├─ layout.tsx              app shell, fonts, navigation
│  │  ├─ globals.css             design tokens and base styles
│  │  ├─ page.tsx                buyer workspace (requisition + negotiations)
│  │  ├─ actions.ts              server actions (start, vendor decisions,
│  │  │                          authorize, confirm, simulate repricing)
│  │  ├─ vendor/page.tsx         vendor review desk
│  │  └─ negotiation/[id]/page.tsx  buyer transcript, deal, order flow
│  ├─ components/                shared UI (storefront, vendor, negotiation)
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
│  ├─ seed.ts                    small readable seed (2 items, 3 suppliers,
│  │                             5 listings, 1 buyer)
│  └─ migrations/
└─ scripts/
   ├─ smoke.ts                   runs one negotiation and prints its rounds
   └─ e2e.ts                     server-flow check: accept → authorize →
                                 confirm, and reprice → BLOCKED
```

## Setup

Prerequisites: Node.js 20.9+ (tested on Node 24), npm.

```bash
cd commerceos
npm install                 # also runs `prisma generate`

cp .env.example .env        # DATABASE_URL="file:./dev.db"
                            # PowerShell: Copy-Item .env.example .env

npx prisma migrate dev      # creates prisma/dev.db and applies migrations
npx prisma db seed          # seeds 2 items, 3 suppliers, 5 listings, 1 buyer

npm run dev                 # http://localhost:3000
```

`npm run dev` starts the buyer storefront. The vendor desk is at `/vendor`
(linked in the top navigation).

Useful commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server (Turbopack) |
| `npm run build` | production build |
| `npm run test` | Vitest unit tests for the negotiation engine |
| `npx prisma db seed` | re-seed the demo data |
| `npx prisma migrate status` | check migration state |
| `npx tsx scripts/smoke.ts` | run one negotiation and print its rounds |
| `npx tsx scripts/e2e.ts` | server-flow check: accept → authorize → confirm, then reprice → BLOCKED (cleans up after itself) |

## Demo walkthrough

### Happy path — requirement → negotiation → vendor review → confirmed order

1. Open **http://localhost:3000**. The buyer is "Acme Facilities Group".
2. Pick **A4 Copy Paper, 80 gsm**, set quantity `100`, target unit price
   `27.00`, budget cap `4,000.00`, deadline `7` days. Submit.
3. The negotiation page opens with one row per supplier. Each row shows its
   rounds and decisions. With the seed data the opening offers land in the
   borderline band, so the status is **Awaiting vendor**.
4. Click **Vendor desk** in the navigation (`/vendor`). The pending offers are
   listed with the supplier floor next to the offered price.
5. On one offer click **Accept**. The offer is stamped accepted, the
   negotiation becomes **Agreed**, and an order is created with a
   server-computed total.
6. Go back to the negotiation (link from the buyer page's recent ledger, or
   the browser back button). The recommended deal is shown. Click
   **Authorize order**, then **Confirm order**.
7. The order is **Confirmed**. The page shows the confirmed total and the
   frozen terms.

To see the other decision bands on the same page, try a very low target (the
supplier agent auto-rejects, then the buyer counters) or a high target (the
supplier agent auto-accepts without vendor involvement). The vendor desk lists
both kinds read-only.

### Repricing-block demo (terms verification gate)

1. Run the happy path up to the point where the vendor **accepts** an offer
   (step 5 above). Do not confirm yet.
2. On `/vendor`, find the listing for that supplier under **Listings** and
   click **Simulate supplier repricing**. The list price rises 15% and the
   terms version gets a new revision.
3. Return to the negotiation page, click **Authorize order**, then
   **Confirm order**.
4. Confirmation is blocked: the order shows **Blocked — terms changed** and
   lists the frozen value next to the live value for each changed term.

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
through vendor accept → authorize → confirm and then a supplier repricing →
blocked confirmation, asserting the totals and the old → new block reason. It
deletes the rows it created and restores any listing it repriced.

## What works / what is partial

See `STATE.md` for the live status log. In short: increments 1–4 and the
terms-verification gate (increment 5) are implemented, seeded, and runnable
from the browser. There is no payment layer by design, no authentication
(single seeded buyer and a single vendor desk), and no multi-tenant data
isolation — this is a demo, not a production procurement system.
