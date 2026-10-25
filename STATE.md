# STATE — CommerceOS demo

Updated: 2026-10-25 (Asia/Calcutta)

## Status

**Phase 1 complete.** The full flow is implemented, seeded, documented and
verified: deterministic negotiation → vendor review desk → buyer authorize →
confirm, plus the terms-verification gate that blocks confirmation when a
listing changed after agreement. No payment layer by design.

## Increment log

- **Increment 0 — DONE.** Audit: the folder did not exist; built from scratch.
- **Increment 1 — DONE.** Next.js 16 + TS + Tailwind scaffold; Prisma schema
  (Item, Supplier, Listing, Buyer, Negotiation, Offer, Order); migration
  `20261024135016_init`; seed.
- **Increment 2 — DONE.** `src/lib/negotiation.ts` deterministic engine; 17
  passing Vitest tests; DB orchestration in `src/lib/negotiation-service.ts`.
- **Increment 3 — DONE.** `/vendor` review desk: pending offers with ACCEPT /
  REJECT / COUNTER, policy band, auto-decided offers read-only; accepting
  creates the order with a server-computed total.
- **Increment 4 — DONE.** `/` buyer workspace and `/negotiation/[id]`
  transcript; AUTHORIZE → CONFIRM order flow; buyer DTOs exclude floors and
  thresholds.
- **Increment 5 — DONE.** Terms frozen at agreement; confirm re-reads listing
  and item and sets the order `BLOCKED` with old → new values; vendor
  "Simulate supplier repricing" control.
- **Increment 6 — DONE.** README + STATE.
- **Increment 7 — DONE.** UI rebuilt as a tabbed workspace (approved):
  top tab strip as navigation (Requisition, recent negotiations, pinned Review
  desk with pending count), 12-column module screens, state as dot + word,
  mobile stacked tables, tablet breakpoints, per-page metadata, focus styles,
  favicon, linked settled rows, vendor round column.
- **Increment 8 — DONE.** Demo made reproducible: `prisma db seed` now drives
  three negotiations through the real service (awaiting vendor / confirmed /
  blocked), so a fresh clone opens with all three states. `scripts/e2e.ts`
  also covers vendor counter → buyer accepts counter.

## How to resume

```bash
cd C:\Users\silen\Downloads\commerceos
npm run dev            # http://localhost:3000
npm run test           # engine unit tests (17)
npx tsx scripts/e2e.ts # server flows: confirm, reprice block, counter
npx prisma migrate status
npx prisma db seed     # reset to the three seeded demo states
```

## What works

- Full browser happy path: requirement → deterministic negotiation rounds →
  borderline offers on the vendor desk → vendor accept → buyer authorize →
  confirm.
- Auto-accept / auto-reject bands visible in the negotiation and vendor desk.
- Vendor counter-offer → buyer accepts the counter → order.
- Repricing after agreement blocks confirmation with old vs new values.
- Money is integer minor units end to end; totals computed server-side only.
- Buyer pages never render supplier floors or thresholds (checked against the
  served HTML).
- Tabbed workspace shell; responsive at 390 / 768 / 1024 / 1440 with no
  horizontal overflow.

## Verification (last run 2026-10-25)

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | success, `/icon.svg` static, routes dynamic as expected |
| `npm run test` | 17/17 passing |
| `npx tsx scripts/e2e.ts` | confirm path, reprice → BLOCKED, counter path all pass; demo data restored |
| `npx prisma db seed` | reproduces the 3 demo negotiations |
| Buyer HTML floor scan | 0 hits for floor/threshold values on `/` and all 3 negotiations |
| Browser walkthrough | accept → authorize → confirm; counter → accept counter |
| Screenshots | `_shots/final-*` at 1440 / 1024 / 390 |

## Partial / known limitations

- No auth or roles: one seeded buyer, one open vendor desk. Anyone can open
  `/vendor`.
- No payment layer (by design). No inventory reservation beyond `stock` being
  displayed.
- Single-tenant demo data; no concurrency protection on simultaneous vendor
  clicks beyond the order's unique `negotiationId`.
- Seed resets all demo rows (`prisma/seed.ts` deletes then recreates).
- Two negotiations for the same item are told apart by filed time in the tab
  strip (seconds when they were filed in the same minute); the tab strip only
  shows the four most recent negotiations, so an older one has no active tab.

## Artifacts

- `_shots/` — UI screenshots (current build) and `_shots/directions/` — the
  mockup rounds that led to the approved direction.
- `docs/design/` — brief, plan and critique from the design process.
- `_boilerplate_app/` — the original create-next-app shell, moved aside when
  the app moved under `src/` (kept, not deleted).
- `_backup/` — pre-reseed copies of `prisma/dev.db`.
