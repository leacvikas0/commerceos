# STATE — CommerceOS demo

Updated: 2026-10-24 (Asia/Calcutta)

## Increment log

- **Increment 0 — DONE.** Audit: `C:\Users\silen\Downloads\commerceos` did not
  exist; nothing to preserve. Built from scratch on the scaffold stack.
- **Increment 1 — DONE.** Next.js 16 + TS + Tailwind scaffold; Prisma schema
  (Item, Supplier, Listing, Buyer, Negotiation, Offer, Order); migration
  `20261024135016_init`; seed (2 items, 3 suppliers, 5 listings, 1 buyer);
  `npm run dev` starts.
- **Increment 2 — DONE.** `src/lib/negotiation.ts` deterministic engine;
  `src/lib/negotiation.test.ts` 17 passing Vitest tests; DB orchestration in
  `src/lib/negotiation-service.ts` (rounds, status roll-up, recommended deal).
- **Increment 3 — DONE (UI restructure in progress).** `/vendor` review desk:
  pending offers with ACCEPT / REJECT / COUNTER, auto-decided offers
  read-only; accepting creates the order with a server-computed total.
- **Increment 4 — DONE (UI restructure in progress).** `/` buyer workspace and
  `/negotiation/[id]` transcript; AUTHORIZE → CONFIRM order flow; buyer DTOs
  exclude floors and thresholds.
- **Increment 5 — DONE (UI restructure in progress).** Terms frozen at
  agreement; confirm re-reads listing/item and sets order `BLOCKED` with
  old → new values; vendor "Simulate supplier repricing" control.
- **Increment 6 — DONE.** This README + STATE.

Server flow is verified independently of the UI by `scripts/e2e.ts`
(accept → authorize → confirm, and reprice → BLOCKED); unit tests cover the
pure engine. UI layout is being restructured to a modern workspace shell after
design feedback; functionality is unchanged by that work.

## How to resume

```bash
cd C:\Users\silen\Downloads\commerceos
npm run dev            # http://localhost:3000
npm run test           # engine unit tests
npx tsx scripts/e2e.ts # server flow: confirm + reprice block
npx prisma migrate status
```

## What works

- Full browser happy path: requirement → deterministic negotiation rounds →
  borderline offers on the vendor desk → vendor accept → buyer authorize →
  confirm.
- Auto-accept / auto-reject bands visible in the negotiation and vendor desk.
- Vendor counter-offer → buyer accepts counter → order.
- Repricing after agreement blocks confirmation with old vs new values.
- Money is integer minor units end to end; totals computed server-side only.

## Partial / known limitations

- No auth or roles: one seeded buyer, one open vendor desk. Anyone can open
  `/vendor`.
- No payment layer (by design). No inventory reservation beyond `stock` being
  displayed.
- Single-tenant demo data; no concurrency protection on simultaneous vendor
  clicks beyond the order's unique `negotiationId`.
- Seed resets all demo rows (`prisma/seed.ts` deletes then recreates).

## Backups

Files edited after the scaffold were copied to `<name>.bak.<timestamp>` before
editing, and a git checkpoint commit captures the working data layer plus the
first UI pass. The original create-next-app shell was moved to
`_boilerplate_app/` (not deleted) when the app moved under `src/`.
