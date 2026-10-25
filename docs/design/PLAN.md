# CommerceOS — design plan (round 2)

Status: revision after `CRITIQUE.md` (round 1, `VERDICT: CHANGES REQUIRED`).
Scope: `src/app/**` and `src/components/**` only. No changes to `src/lib/**`, `src/app/actions.ts`, `prisma/**`, `package.json`.
Every number, name and date in this document comes from the seeded database, dumped with `_shots/dump-state.ts`. Where a figure is computed, the formula is shown.

Round 1's central instrument — the price-lane chart — is **deleted**, not fixed. §1.3 (alternative E) records why, with the data that killed it. The replacement is the order line (§3.2.1) and the supplier board (§3.2.3). The band on the vendor page survives, with its arithmetic corrected (§4.3).

---

## 1. Concept and point of view

### 1.1 The claim

A procurement negotiation is a **paper trail with two irreversible moments in it**: you authorize a purchase, then you confirm it against the live listing. Everything else — offers, counters, rounds, the supplier's own limits — exists to make those two moments safe to take.

So the interface is a **document, not a dashboard**. One plane, hairline rules, money in tabular figures, state as a small square plus a word. No cards, because a card is a container that says "this is a separate thing" and almost nothing here is separate: the supplier comparison is read across, the transcript is read down, the order line is read left to right.

Identity comes from two things only: **the order line** (the commit chain, always on screen, always telling you which step you are on) and **the band** (the vendor's own price window, drawn once, to scale). Both are instruments. Neither is decoration.

### 1.2 What each page has to answer, in order

| Page | Question 1 | Question 2 | Question 3 | Question 4 |
| --- | --- | --- | --- | --- |
| `/` Requisition | What am I buying? | What will I ask for? | What is already running? | What closed, and how? |
| `/negotiation/[id]` | Where am I in the commit chain? | Who is still in play, at what price? | What exactly happened? | What do I do now? |
| `/vendor` Review desk | What needs a decision? | What is the offer against my window? | What are my listing terms? | — |

### 1.3 Killed alternatives

**A. Editorial ledger** (serif display, ruled paper, oversized folios).
Killed: it makes a state machine look like a magazine. Serif numerals in a 6-column table slow scanning, and the concept pulls attention to the page rather than to the decision. Kept one thing from it: rules as the only structural device.

**B. Dark trading terminal** (near-black plane, mono tickers, green/red).
Killed: it implies a market with many participants and continuous prices. This is a 3-supplier RFQ with at most 3 rounds. It also violates the brief's "no tech themes" and reads as costume.

**C. Soft SaaS cards** (rounded white cards on grey, shadow, icon + label + number).
Killed: this is what was there. Cards fragment the one thing that must be compared across: the supplier columns. Also generic by construction — the layout survives with any content swapped in, which is the definition of unthought.

**D. Bento / KPI dashboard** (four tiles: open, agreed, blocked, spend).
Killed: four numbers nobody acts on. The old vendor page had exactly this and it occupied the top 380px with information the queue below already contained. Occupancy is not information.

**E. Price-lane chart** (round 1's proposal: one lane per supplier, shared price axis, dots per offer).
Killed on evidence, not taste. On the seeded data:

- 4 offers across 3 suppliers, but only **2 distinct prices** ($27.00 and $30.50).
- 3 of the 4 offers are R1 at the target, so they land on the same x position.
- A shared domain of $26.72–$34.28 puts those dots at **3.7%** and **50.0%** of a 700px track — the right half of every lane is empty canvas.

A plot whose data occupies 5% of its width is a broken instrument, and no amount of tick-tuning fixes it: the engine's opening offer is *by construction* `initialBuyerOfferMinor = min(max(target, floor), cap)`, i.e. the target, for every supplier that does not reject it. The variance in this product lives in **list price, delivery and reliability**, not in a price-over-time axis. So the comparison gets a table of aligned facts (the board, §3.2), and the round sequence is carried by a one-line trail plus the transcript.

This also deletes a large amount of machinery the critique had to fight: lane domains, dot vocabularies, edge-clamped labels, coincident-dot handling, `aria-hidden` plots.

### 1.4 What is kept from round 1

- One warm plane `#FAF9F6`, no cards, hairline rules.
- Archivo for everything; IBM Plex Mono only for identifiers (`PAP-A4-80`, `AT-terms-2026.04-R1`).
- Status = 6px square + uppercase word. One vocabulary everywhere.
- The band, with corrected domain and corrected caption arithmetic.
- The blocked strip: frozen vs live, structurally, never parsed.
- No gradients, no glass, no glow, no shadows except the focus ring. No icon logo — the wordmark is type.

---

## 2. Information architecture

### 2.1 Workspaces and routes

```
/                        Requisition        buyer workspace
/negotiation/[id]        one negotiation    buyer workspace
/vendor                  Review desk        vendor workspace
```

Three routes, no nesting beyond `[id]`, no tabs, no modals, no drawers, no toasts. Everything is a page or a section on a page.

### 2.2 Shell

| Region | ≥1280px | 1024–1279 | <1024 |
| --- | --- | --- | --- |
| Rail | 208px fixed, full height | 176px | hidden |
| Top bar | none | none | 56px sticky, wordmark + 2 links |
| Content | max 1136px, left-aligned, padding 40px 48px | same | padding 24px 20px 56px |

Rail contents, top to bottom: wordmark `CommerceOS` + caption `Procurement desk`; `WORKSPACES` (Requisition / Review desk, the active one marked with a 2px ink left rule and `--sunk` fill); `RECENT` (the 3 seeded negotiations, SKU + state, the current one marked); footer `Demo — no payments processed`.

The rail does not scroll independently and has no collapse control. At <1024 it is replaced by the top bar; `RECENT` is dropped entirely rather than moved into a menu.

### 2.3 Page grammar

Every page is: **head → sections**. A section is:

```
┌ section ──────────────────────────────────────────────────────────┐
│ Title            count/aside                                       │  ← 40px row
├───────────────────────────────────────────────────────────────────┤  ← 1px --rule-strong
│ content                                                            │
└───────────────────────────────────────────────────────────────────┘
```

- Head: eyebrow (`BUYER · PAP-A4-80` / `VENDOR CONSOLE`) with the page status on the same row, right-aligned; `h1` 26px (`t-h1`, 22px under 480); then up to two meta lines at 12px `--ink-3`.
- Section head: `h2` 15px uppercase-tracked (`t-h3`) + a count on the same baseline (`3 suppliers · 4 offers · 2 rounds`), 40px tall, 1px `--rule-strong` bottom border. The only 22px heading on any page is the vendor detail's item name (`t-h2`).
- Sections are separated by 40px of space, never by a card.
- Notices and errors (`?error=`, `?notice=`) render as a single strip directly under the page head: `--blocked-wash` / `--agreed-wash`, 1px left rule in the tone, 13px text, one line of plain language. Never a toast, never a modal.

### 2.4 Navigation truth

- Home lists every negotiation. `In flight` = no order and `status !== "REJECTED"`, or an order in `AWAITING_AUTHORIZATION`. `Settled` = an order in `CONFIRMED` / `BLOCKED` / `CANCELLED`, or no order with `status === "REJECTED"` (every supplier declined and the agent has no round left). (Round 1 filtered `CONFIRMED`/`CANCELLED` out of the list entirely — a page that hides the two states the demo is about.)
- The vendor queue lists only negotiations whose latest offer is `PENDING`. Nothing else appears there.
- The only cross-workspace link is the rail. There is no "view as buyer" mode: the routes are separate, and no component that renders a floor, reject line or accept line is imported by a buyer route.

---

## 3. Page-by-page layout

All wireframes use the seeded data. Money is integer minor units formatted by `formatMoney`; `$27.00` means `2700`.

### 3.1 `/` — Requisition (buyer)

**Seeded facts used:** cap `$2,500.00`; 2 items (A4 paper from `$30.50`, nitrile gloves from `$8.20` — Atlas's gloves listing was repriced to `$8.97`, so Meridian is now the cheapest at `$8.20`); 1 in flight (`cmvmgjd4u0001cdacd6h9lva8`, A4, 100 units, 2 rounds, $27.00, AWAITING_VENDOR, 24 Oct); 2 settled (gloves BLOCKED at $7.00; paper CONFIRMED at $27.00).

```
┌ 208 ───────────┐┌─────────────────────── 1136 ──────────────────────────────────────┐
│ CommerceOS     │  BUYER WORKSPACE                          1 in flight · 2 settled  │
│ Procurement d. │  Requisition                                                      │
│                │  Acme Facilities Group · cap $2,500.00 · USD                       │
│ WORKSPACES     │                                                                    │
│ ▎Requisition   │  New requisition        Sets the terms for every active supplier    │
│  Review desk   │ ══════════════════════════════════════════════════════════════════ │
│                │  ITEM                                                              │
│ RECENT         │ ▎[■] A4 Copy Paper, 80 gsm                          FROM           │
│  PAP-A4-80     │      500 sheets per ream, FSC-certified, 80 gsm      $30.50         │
│  Awaiting v.   │      3 suppliers · fastest 2 days · spec-2026.1    per unit       │
│  GLV-NIT-M     │  ────────────────────────────────────────────────────────────────  │
│  Blocked       │  [ ] Nitrile Gloves, Medium                         FROM           │
│  PAP-A4-80     │      Powder-free examination gloves, 100 per box     $8.20          │
│  Confirmed     │      2 suppliers · fastest 4 days · spec-2026.3    per unit       │
│                │                                                                    │
│                │  QUANTITY   TARGET / UNIT   BUDGET CAP   DEADLINE                  │
│                │  [ 50     ] [ $ 25.93    ] [ $ 2500.00] [ 14  days] [Start negot…] │
│                │  Target is 85% of the lowest list price. The cap covers the whole   │
│                │  purchase, so the per-unit ceiling depends on quantity.             │
│                │                                                                    │
│                │  In flight   1 open                                                │
│                │  ────────────────────────────────────────────────────────────────  │
│                │  ITEM                    QTY  ROUNDS   PRICE  STATE         FILED  │
│                │  A4 Copy Paper, 80 gsm   100       2  $27.00  ▪ AWAITING V.  24 Oct│
│                │  PAP-A4-80                                                         │
│                │                                                                    │
│                │  Settled   2 closed                                                │
│                │  ────────────────────────────────────────────────────────────────  │
│                │ ▎Nitrile Gloves, Medium  100       1   $7.00  ▪ BLOCKED     24 Oct │
│                │  GLV-NIT-M                                                         │
│                │  A4 Copy Paper, 80 gsm   100       2  $27.00  ▪ CONFIRMED    24 Oct │
│ Demo — no      │  PAP-A4-80                                                         │
└────────────────┘└────────────────────────────────────────────────────────────────────┘
```

Layout notes:
- `ITEM` label above the picker, then two **stacked** rows (not a 2-up grid — see §9.7). Each row is `14px · 1fr · auto`: radio, name/description/facts stacked, price block right. The selected row carries a 2px ink left rule and `--sunk` fill via `:has(input:checked)`.
- Terms row is one grid: `104px 152px 152px 120px max-content`. The button is `max-content` so it hugs its label; it does **not** stretch (round 1's plate rendered a 450px-wide button from `minmax(150px, 1fr)`).
- Quantity defaults to `50`; target is computed by the composer island (§6.1) at 85% of the selected item's lowest **live** list price, rounded to the cent: paper `3050 × 0.85 = 2592.5 → $25.93`; gloves `820 × 0.85 = 697 → $6.97` (Meridian's `$8.20`, because Atlas's gloves listing was repriced to `$8.97` by the blocked-order demo).
- The hint line is the only place the 85% default is explained. It is a UI default, not a server rule.

```
390 ─────────────────────────────────┐
│ CommerceOS      Requisition  Review │ 56 sticky
├─────────────────────────────────────┤
│ BUYER WORKSPACE   1 in flight · 2 … │
│ Requisition                         │
│ Acme Facilities Group · cap $2,5…   │
│ New requisition                     │
│ Sets the terms for every active …   │
│ ═══════════════════════════════════ │
│ ITEM                                │
│ ▎[■] A4 Copy Paper, 80 gsm          │
│      500 sheets per ream, FSC-c…    │
│      3 suppliers · fastest 2 days   │
│                       FROM $30.50   │
│                       per unit      │
│ ─────────────────────────────────── │
│ [ ] Nitrile Gloves, Medium          │
│      Powder-free examination gl…    │
│      2 suppliers · fastest 4 days   │
│                       FROM $8.20    │
│ ─────────────────────────────────── │
│ QUANTITY        TARGET / UNIT       │
│ [ 50        ]   [ $ 25.93       ]   │
│ BUDGET CAP      DEADLINE            │
│ [ $ 2500.00 ]   [ 14      days  ]   │
│ [ Start negotiation             ]   │
│ Target is 85% of the lowest list …  │
│ In flight   1 open                  │
│ A4 Copy Paper, 80 gsm       $27.00  │
│ PAP-A4-80                           │
│ ▪ AWAITING VENDOR                   │
│ Settled   2 closed                  │
│ Nitrile Gloves, Medium       $7.00  │
│ GLV-NIT-M                           │
│ ▪ BLOCKED                           │
│ A4 Copy Paper, 80 gsm       $27.00  │
│ ▪ CONFIRMED                         │
└─────────────────────────────────────┘
```

At 390: picker rows stack their price block under the facts (right-aligned); the terms grid becomes 2×2 with the button on its own full-width row; the ledger drops its header, hides QTY / ROUNDS / FILED, and re-lays each row as name+SKU with the price top-right and the state on a second line. The header row is **not** left visible over a different column set.

### 3.2 `/negotiation/[id]` — one negotiation (buyer)

Single column, full 1136px, **no right rail** (the app shell's left rail stays). Round 1 put a 376px right rail beside the content and buried the only action in it; that panel is gone. The order line carries the action, the board carries the comparison, the transcript carries the record.

**Seeded facts used:** `cmvmgjd4u0001cdacd6h9lva8` — A4 paper, 100 units, target `$27.00`, cap `$400,000.00` (`$40.00`/unit), due 31 Oct 2026, filed 24 Oct 19:21. Offers: Northwind R1 `$27.00` PENDING · Meridian R1 `$27.00` PENDING · Atlas R1 `$27.00` REJECTED (auto) · Atlas R2 `$30.50` PENDING. Lists: Meridian `$30.50`, Northwind `$32.00`, Atlas `$34.00`. Delivery 5 / 3 / 2 days. Reliability 85 / 92 / 78.

```
┌ 208 ───────────┐┌─────────────────────── 1136 ──────────────────────────────────────┐
│ CommerceOS     │  BUYER · PAP-A4-80                        ▪ AWAITING VENDOR       │
│ Procurement d. │  A4 Copy Paper, 80 gsm                                             │
│                │  Acme Facilities Group · 100 units · spec-2026.1                    │
│ WORKSPACES     │  target $27.00/unit · budget $4,000.00 ($40.00/unit) · due 31 Oct   │
│  Requisition   │  2026 · filed 24 Oct, 19:21                                        │
│ ▎Review desk   │ ══════════════════════════════════════════════════════════════════ │
│                │  ┌1┐ AGREE              │ ┌2┐ AUTHORIZE     │ ┌3┐ CONFIRM          │
│ RECENT         │  │  No price agreed yet │ │  —             │ │  —                │
│  PAP-A4-80     │  │  Waiting on the      │ │  Opens once a  │ │  Re-reads the     │
│  Awaiting v.   │  │  vendor desk.        │ │  price is      │ │  live listing     │
│  GLV-NIT-M     │  │                      │ │  agreed.       │ │  before it        │
│  Blocked       │  │                      │ │                │ │  commits.         │
│  PAP-A4-80     │  │                      │ │                │ │                   │
│  Confirmed     │ ══════════════════════════════════════════════════════════════════ │
│                │                                                                    │
│                │  Suppliers    3 suppliers · 4 offers · 2 rounds                     │
│                │ ══════════════════════════════════════════════════════════════════ │
│                │  Meridian Office Goods │ Northwind Paper Co. │ Atlas Industrial Sup.│
│                │  $27.00 /unit          │ $27.00 /unit        │ $30.50 /unit        │
│                │  at your target        │ at your target      │ +$3.50 over your t. │
│                │  LIST         $30.50   │ LIST       $32.00   │ LIST         $34.00 │
│                │  DELIVERY     5 days   │ DELIVERY   3 days   │ DELIVERY     2 days │
│                │  RELIABILITY  85 / 100 │ RELIABILITY 92 /100 │ RELIABILITY  78/100 │
│                │  R1 $27.00             │ R1 $27.00           │ R1 $27.00 → R2 $30… │
│                │  ▪ AWAITING VENDOR     │ ▪ AWAITING VENDOR   │ ▪ AWAITING VENDOR   │
│                │                                                                    │
│                │  Transcript    4 offers                                            │
│                │ ══════════════════════════════════════════════════════════════════ │
│                │  TIME  SUPPLIER             ROUND  PRICE    DECISION               │
│                │  19:21 Northwind Paper Co.     R1  $27.00  ▪ AWAITING VENDOR      │
│                │                                            Sent to the supplier — │
│                │                                            awaiting their decision│
│ Demo — no      │  19:21 Meridian Office Goods   R1  $27.00  ▪ AWAITING VENDOR      │
└────────────────┘  …                                                                │
                    └────────────────────────────────────────────────────────────────┘
```

```
390 ─────────────────────────────────┐
│ CommerceOS      Requisition  Review │ 56 sticky
├─────────────────────────────────────┤
│ BUYER · PAP-A4-80   ▪ AWAITING VEND │
│ A4 Copy Paper, 80 gsm               │
│ Acme Facilities Group · 100 units ·  │
│ spec-2026.1                          │
│ target $27.00/unit · budget $4,000…  │
│ ┌1┐ AGREE                           │
│     No price agreed yet             │
│     Waiting on the vendor desk.     │
│ ─────────────────────────────────── │
│ ┌2┐ AUTHORIZE                       │
│     —                               │
│     Opens once a price is agreed.   │
│ ─────────────────────────────────── │
│ ┌3┐ CONFIRM                         │
│     —                               │
│     Re-reads the live listing …     │
│ ─────────────────────────────────── │
│ Suppliers   3 suppliers · 4 offers  │
│ Meridian Office Goods               │
│ $27.00 /unit                        │
│ at your target                      │
│ LIST                        $30.50  │
│ DELIVERY                    5 days  │
│ RELIABILITY               85 / 100  │
│ R1 $27.00                           │
│ ▪ AWAITING VENDOR                   │
│ ─────────────────────────────────── │
│ Northwind Paper Co. …               │
│ ─────────────────────────────────── │
│ Atlas Industrial Supply …           │
│ Transcript   4 offers               │
│ Northwind Paper Co.         $27.00  │
│ R1                           19:21  │
│ ▪ AWAITING VENDOR                   │
│ Sent to the supplier — awaiting …   │
└─────────────────────────────────────┘
```

At <768 the order line becomes three stacked steps separated by rules (top rule `--rule-strong` on step 1, `--rule` between), the board becomes one column per supplier with a bottom rule, and each transcript row becomes a 2-column grid: supplier + price on line 1, round + time on line 2, status + note on line 3. No table header, no horizontal scroll, no `min-width`.

#### 3.2.1 The order line — five states

The order line is the page's spine and the only place an action lives. The steps are labelled `AGREE`, `AUTHORIZE`, `CONFIRM` — actions, constant in all five states, so a label never contradicts the value beneath it (round 2 rendered `AGREED` above `No price agreed yet`). Each step is `24px number · content`; the number is a 22px square with a 1px border, filled ink when done, 2px ink border when active, `--blocked` border when failed, `--rule-strong` numeral when muted.

| Negotiation state | Step 1 | Step 2 | Step 3 | Action in the line |
| --- | --- | --- | --- | --- |
| Offers pending | **active** · `No price agreed yet` · `Waiting on the vendor desk.` | muted · `—` · `Opens once a price is agreed.` | muted · `—` · `Re-reads the live listing before it commits.` | none |
| Supplier countered | **active** · `$27.80 /unit` · `Meridian Office Goods · {formatDateTime(counter offer createdAt)}` | muted | muted | `Accept $27.80` (primary, `buyerAcceptCounterAction`, hidden `offerId` = the counter offer's id + `negotiationId`) |
| Agreed, awaiting authorization | done · `$27.00 /unit` · `Meridian Office Goods · {formatDateTime(accepted offer createdAt)}` | **active** · `$2,700.00 total` · `Records your approval. Confirmation is a separate step.` | muted | `Authorize purchase` (primary, `authorizeOrderAction`, `orderId` + `negotiationId`) |
| Blocked | done · price + supplier | done · `$700.00 total` · `24 Oct, 19:59` | **failed** · `Blocked` in `--blocked` · `The listing changed after you authorized.` | `Raise a new requisition` in the strip |
| Confirmed | done · price + supplier | done · total + `24 Oct, 19:59` | done · `$2,700.00` in `--agreed` · `Order created 24 Oct, 19:59 · no payment processed in this demo.` | none |

The countered row's `$27.80` is illustrative: the seed contains no countered pair, and `$27.80` is the kind of price a supplier returns when the buyer opened at `$27.00` and the supplier's accept line is `$28.00`. The state is detected **structurally** — never from the note text: for a listing, take the latest offer; if its `decision` is `PENDING` and the offer one round earlier has `decision === "COUNTERED"`, the latest offer is the supplier's counter. The displayed price and the button label both come from that offer's `unitPriceMinor`. (`vendorCounterOffer` writes the prior offer as `COUNTERED` and creates the new one as `PENDING`; the note string is display copy only, so a copy change can never reclassify a state.)

Rules:
- The step value is 26px/600 tabular; the sub-value (total) is 15px; notes are 11.5px `--ink-3`, max 34ch.
- The active step is the only one with a 2px border on its number and the only one that can contain a button.
- The live buyer negotiation page renders exactly one `<button type="submit">` at a time — the active step's action. (The Appendix A specimen sheet shows five order lines side by side for comparison; that is a documentation artifact, not a page. The vendor page has its own actions.) Forms are `<form action={...}>` with hidden inputs; no client JS.
- No `confirmedAt` exists on `Order` — confirmed shows `authorizedAt` labelled `Authorized` and `createdAt` labelled `Order created`. Round 1 invented a confirmation timestamp.

#### 3.2.2 The blocked strip

Rendered only when the order is `BLOCKED`, directly under the order line.

```
──────────────────────────────────────────────────────────────────────────────
▌ Blocked at confirmation                        ▪ 2 OF 4 TERMS CHANGED
▌
▌ Nothing was charged. The listing changed after you authorized.
▌
▌ LIST PRICE      $7.80   →   $8.97
▌ TERMS           AT-terms-2026.04 → AT-terms-2026.04-R1
▌ ▸ Show the 2 unchanged terms
▌
▌ [ Raise a new requisition ]
```

- Changed terms are computed **structurally** from `order.frozen*` vs `listing.*`: `frozenListPriceMinor !== liveListPriceMinor`, `frozenTermsVersion !== liveTermsVersion`, `frozenSpecVersion !== liveSpecVersion`, `frozenDeliveryDays !== liveDeliveryDays`. `blockReason` is never parsed, never split, never rendered as a list of claims.
- Unchanged terms sit behind `<details><summary>Show the 2 unchanged terms</summary>` — a native disclosure, no JS.
- If any frozen field is `null` (orders created before freezing existed), the strip renders `blockReason` as a single plain sentence and no diff table.
- The blocked row keeps a 2px `--blocked` left rule in the ledger on `/`, so the state is visible from the list.

#### 3.2.3 The supplier board

Three peer columns, no fill, no border, separated by 1px `--rule` verticals; the last column has no right rule. The data comes from `getNegotiationDetail().rounds`, which is keyed by **listing** (`{supplierName, reliabilityScore, deliveryDays, listPriceMinor, offers[]}`) — so a supplier with two listings for the same item would appear twice, which is the truthful rendering. In the seeded data each supplier has one listing per item, so the board is one column per supplier. Each column:

| Row | Content | Type |
| --- | --- | --- |
| name | supplier name | 15/600 |
| price | the price in play — the **latest** offer's `unitPriceMinor` — + `/unit` | 30/600 `-0.03em`, suffix 12 `--ink-3` |
| delta | `at your target` · `+$3.50 over your target` (`--waiting`) · `−$0.50 under your target` (`--agreed`) | 11.5 `--ink-3` |
| facts | `LIST` / `DELIVERY` / `RELIABILITY` — 3 rows, label 10.5 uppercase left, value 12 right, 1px `--rule` between | definition rows |
| trail | `R1 $27.00` or `R1 $27.00 → R2 $30.50` | 11.5 `--ink-2`, arrow `--ink-3` |
| state | square + word for that supplier's latest offer | status component |

- Recommended column: `box-shadow: inset 0 2px 0 var(--agreed)` plus `Recommended` in the delta line. No badge, no border, no background.
- Delta is computed against the requisition target (`negotiation.targetUnitPriceMinor`), which the buyer typed — it is not a threshold.
- **The price in play is the latest offer's price**, not the minimum: the board's job is to show what each supplier is asking *now*, and the state row describes that same offer. The minimum would pair a rejected `$27.00` with `AWAITING VENDOR` for a live `$30.50` offer — two different offers in one column. History lives in the trail (`R1 $27.00 → R2 $30.50`), so nothing is lost. If a supplier's latest offer is `REJECTED`, the column shows that price with the `Declined` state; the delta is still shown because the price was really offered. The trail lists `R{round} {formatMoney(unitPriceMinor)}` in round order, every offer, joined by ` → `.
- The board is a `<dl>` per column? No: it is a `<section>` with `<h3>` per supplier and a `<dl>` for the facts, so screen readers get name → facts. The grid is CSS, not a table: there is no row-wise relationship to preserve.

### 3.3 `/vendor` — Review desk (vendor)

This is the only page allowed to show a floor, a reject line or an accept line. **Seeded facts used:** 3 pending offers, all A4 paper — Meridian `$27.00` (list `$30.50`, floor `$23.00`, reject `< $25.00`, accept `≥ $28.00`, `MO-terms-2026.01`); Northwind `$27.00` (list `$32.00`, floor `$24.50`, reject `< $26.00`, accept `≥ $29.00`, `NW-terms-2026.02`); Atlas `$30.50` (list `$34.00`, floor `$26.00`, reject `< $27.50`, accept `≥ $31.00`, `AT-terms-2026.04`).

```
┌ 208 ───────────┐┌─────────────────────── 1136 ──────────────────────────────────────┐
│ CommerceOS     │  VENDOR CONSOLE                            ▪ 3 NEED A DECISION     │
│ Procurement d. │  Review desk                                                       │
│                │  Offers inside the supplier's review band wait here. Policy settles │
│ WORKSPACES     │  everything outside it.                                            │
│  Requisition   │                                                                    │
│ ▎Review desk   │  Awaiting decision   3 open                                        │
│                │ ══════════════════════════════════════════════════════════════════ │
│ RECENT         │ ▎A4 Copy Paper, 80 gsm        $27.00 │ A4 Copy Paper, 80 gsm        │
│  PAP-A4-80     │  Meridian · floor $23.00             │ Meridian Office Goods · 5-day│
│  Awaiting v.   │  ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │ 85 reliability               │
│  GLV-NIT-M     │  24 Oct, 19:21                              │              PAP-A4-80       │
│  Blocked       │ ──────────────────────────────────── │        ▪ IN REVIEW BAND      │
│  PAP-A4-80     │  A4 Copy Paper, 80 gsm        $27.00 │                              │
│  Confirmed     │  Northwind · floor $24.50            │ OFFERED UNIT PRICE           │
│                │  ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │ $27.00 /unit                 │
│                │  24 Oct, 19:21                              │ 100 units · $2,700.00 total  │
│                │ ──────────────────────────────────── │                              │
│                │  A4 Copy Paper, 80 gsm        $30.50 │ ░░░░░░▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░ │
│                │  Atlas · floor $26.00                │  │        ┃           │     │
│                │  ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │ FLOOR $23.00  REJECT $25.00 ·  │
│                │  24 Oct, 19:21                              │               ACCEPT $28.00   │
│                │                                      │              LIST $30.50      │
│                │                                      │ Offer is $2.00 over the reject│
│                │                                      │ line and $1.00 under the      │
│                │                                      │ accept line.                  │
│                │                                      │                              │
│                │                                      │ QUANTITY  BUYER   DELIVERY   │
│                │                                      │ 100 units Acme…   5 days     │
│                │                                      │ RELIAB.   DEADLINE FILED     │
│                │                                      │ 85 / 100  31 Oct   24 Oct     │
│                │                                      │ ════════════════════════════ │
│                │                                      │ ACCEPT    │ REJECT  │ COUNTER│
│                │                                      │ [Accept …]│ [Reject]│ [$][→] │
│                │                                      │ Locks the │ Ends…   │ Floor… │
│                │  Listing terms   5 listings                                                │
│ Demo — no      │  Repricing a listing bumps its terms revision. An order authorized before │
└────────────────┘  the change blocks at confirmation.                                          │
```

```
390 ─────────────────────────────────┐
│ CommerceOS      Requisition  Review │
├─────────────────────────────────────┤
│ VENDOR CONSOLE   ▪ 3 NEED A DECISION│
│ Review desk                         │
│ Offers inside the supplier's review │
│ band wait here. Policy settles …    │
│ Awaiting decision   3 open          │
│ A4 Copy Paper, 80 gsm       $27.00  │
│ Meridian Office Goods · 5-day …     │
│ ▪ IN REVIEW BAND                    │
│ OFFERED UNIT PRICE                  │
│ $27.00 /unit                        │
│ 100 units · $2,700.00 total         │
│ ░░░░░░▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░░░░░░ │
│              ┃                      │
│ FLOOR $23.00          LIST $30.50   │
│ REJECT $25.00 · ACCEPT $28.00       │
│ Offer is $2.00 over the reject …    │
│ QUANTITY            BUYER           │
│ 100 units           Acme Facilit…   │
│ DELIVERY            RELIABILITY     │
│ 5 days              85 / 100        │
│ DEADLINE            FILED           │
│ 31 Oct 2026         24 Oct, 19:21   │
│ ACCEPT                              │
│ [ Accept at $27.00              ]   │
│ Locks the deal at $2,700.00 total.  │
│ REJECT                              │
│ [ Reject                        ]   │
│ COUNTER                             │
│ [ $ 25.00 ] [ Send ]                │
│ Floor $23.00 — a counter below it…  │
│ ─── queue follows ───               │
└─────────────────────────────────────┘
```

Layout notes:
- Queue is 320px, review pane is the rest, 40px gap. Queue rows are not cards: 1px bottom rule, 2px transparent left rule that becomes `--ink` on the selected row with `--sunk` fill, no radius, no shadow.
- Each queue row carries a **mini band**: 6px tall, the same three zones at the same scale as the detail band, plus a 3px ink marker at the offer. This is what makes the queue scannable — you see who is close to the accept line without opening them. (A 3px-tall mini band rendered as a plain progress bar; 6px with zone fills reads.)
- Below 1024 the queue flips: review pane first, queue second. The decision is what you came for.
- The detail band is 8px tall with three zones (below floor `--sunk-band` `#E8E5DD`, review band `--waiting-band` `#F3E6CB` with 1px `--waiting` top and bottom rules, above accept `--agreed-band` `#E4EDE1`), 1px ticks at floor and list, and a 3px `--ink` marker at the offer with the price above it.
- Decision block: 3 columns divided by 1px rules. Accept = filled ink button; Reject = outlined button with `--blocked` text and 1px `--blocked` border (`btn--danger`); Counter = `$` prefixed input + `Send` secondary, with the floor stated in the consequence line. Each column has a 11.5px consequence sentence under its control.
- Listing terms: one row per listing — supplier + item, list price, floor, `accept ≥ $X · reject < $Y`, terms revision in mono, `Simulate repricing` quiet button. Below 1024 the policy and terms columns hide; the row keeps supplier, list and floor.
- Empty queue: `No offers waiting. Everything inside the review band has been decided.` plus the count `0 open` — never a bare "no data".

---

## 4. Information presentation

### 4.1 Money

All money is `Int` minor units. Rendering goes through `formatMoney(minor, currency)`; parsing through `parseAmountToMinor`. Nothing is formatted by hand, nothing is divided by 100 in a component.

| Role | Size / weight | Where |
| --- | --- | --- |
| Hero | 44/600, `-0.035em` | vendor detail, offered unit price |
| Step value | 26/600, `-0.025em` | order line, agreed price and total |
| Board price | 30/600, `-0.03em` | supplier column |
| Row price | 17/600, `-0.02em` | ledger, listing row |
| Table price | 13/500, tabular | transcript |
| Inline | 13/400 | notes, captions, consequences |

Rules:
- Every money figure is `font-variant-numeric: tabular-nums`; the currency symbol is part of the string from `formatMoney`, never a separate glyph with its own spacing.
- A unit price is always paired: `$27.00 /unit`, `$2,700.00 total`, `$40.00/unit`. A bare `$27.00` appears only inside a column whose header already says `PRICE`.
- Two decimals always. No abbreviated thousands (`$2.7K`), no rounding of cents away.
- A **delta** is signed and always names its base: `at your target`, `+$3.50 over your target`, `−$0.50 under your target`. Never a bare `+$3.50`.
- The per-unit budget ceiling is derived, and shown next to the cap: `budget $4,000.00 ($40.00/unit)`. It uses the engine's own rule (`floor(budget / quantity)`), so it can never claim more headroom than the engine grants. When the division is not exact, the ceiling is floored and the pair still reads as an approximation of the same number.
- Vendor-only figures (floor, reject line, accept line) never appear in a component that a buyer route imports (§4.3).

### 4.2 Rounds

- The **transcript is the record**. Chronological by `createdAt`, ties broken by `offerId`, one row per offer, no grouping, no collapsing.
- Columns: `TIME 104 · SUPPLIER 180 · ROUND 64 · PRICE 104 · DECISION rest`. Round is plain text `R1`/`R2`/`R3` at 13px tabular — not a badge, not a pill.
- The **trail** on the board is the only summary of movement: `R1 $27.00` when there is one offer, `R1 $27.00 → R2 $30.50` when there are more. It lists every offer price in order, not just the first and last, when there are three.
- Round limits are engine facts (`MAX_BUYER_ROUNDS = 3`) and are never displayed as a progress bar or "round 2 of 3" chrome. When the limit is exhausted and nothing is agreed, the order line's step 1 note says so in words: `No price agreed yet. All 3 rounds are used.`
- Buyer-facing decision words are outcomes only: `Accepted`, `Declined`, `Awaiting vendor`, `Superseded`, `Countered`. The engine's parenthetical reasons (`Auto-accepted (… )`, `Borderline (…)`) are vendor-side vocabulary and are stripped from buyer rows. Vendor rows may append the reason in the 11.5px note.

### 4.3 Thresholds — vendor page only

Three numbers per listing, with fixed names: **Floor** (`floorPriceMinor` — the hard minimum, below which the vendor cannot go), **Reject** (`autoRejectBelowMinor` — an offer *below* this is rejected automatically), **Accept** (`autoAcceptFloorMinor` — an offer *at or above* this is accepted automatically), plus **List** (`listPriceMinor`). These words are used verbatim everywhere; no synonyms ("minimum", "target", "limit") appear on the vendor page.

**Band geometry.** With `offer = latest offer price`, `list`, `floor`, `reject`, `accept`:

```
lo0 = min(floor, offer)          hi0 = max(list, offer)
span = hi0 - lo0                 pad = span * 0.04
lo = max(0, lo0 - pad)           hi = hi0 + pad
pct(v) = clamp((v - lo) / (hi - lo) * 100, 0, 100)
```

Zones run to the track edges: below-floor `0 → pct(reject)`, review band `pct(reject) → pct(accept)`, above-accept `pct(accept) → 100`. Ticks at `pct(floor)` and `pct(list)`. Marker at `pct(offer)` with the price label above it, flipped to a left/right edge class within 6% of either end.

Worked example — Meridian A4 paper: floor 2300, reject 2500, accept 2800, list 3050, offer 2700 → `lo0` 2300, `hi0` 3050, span 750, pad 30 → lo 2270, hi 3080, span 810 → floor 3.7%, reject 28.4%, accept 65.4%, offer 53.1%, list 96.3%. The offer marker lands just right of centre; the review band occupies 37.0% of the track.

Why this domain: round 1 anchored the left edge at `floor × 0.9` against a right edge at the list price, which spent 23.5% of the track (230 of 980 units) on space the buyer cannot be offered. Anchoring on the data (`min(floor, offer)` … `max(list, offer)`) puts the floor, the two lines, the list and the offer inside the track with 4% of air at each end, and it still works when the offer is above the list price (which the engine permits — `vendorCounterOffer` only rejects counters *below* the floor).

**Labels row.** A 3-column grid, independent of the x positions, so it can never overflow or collide:
`FLOOR $23.00` left · `REJECT $25.00 · ACCEPT $28.00` centre · `LIST $30.50` right.
Below 768 it becomes 2 columns: floor left, list right, then `REJECT … · ACCEPT …` spanning both. This is deliberate: the endpoints read as a range, the middle reads as the window.

**Caption.** One sentence, computed from the offer's position, with both differences formatted through `formatMoney`:

| Condition | Copy |
| --- | --- |
| `offer > accept` | `Offer is $2.50 over the accept line — policy accepts it automatically.` |
| `offer === accept` | `Offer sits exactly on the accept line — policy accepts it.` |
| `reject < offer < accept` | `Offer is $2.00 over the reject line and $1.00 under the accept line.` |
| `offer === reject` | `Offer sits exactly on the reject line — inside the band, so it waits for a decision.` |
| `offer < reject` | `Offer is $1.20 under the reject line — policy rejects it automatically.` |

(Worked example, Meridian A4 paper: reject `$25.00`, accept `$28.00`, offer `$27.00` → `$2.00` over the reject line and `$1.00` under the accept line. Round 1's plan claimed `$1.00` over and `$2.00` under — it had the two differences swapped.)

**Accessibility.** The track, zones, ticks and marker are `aria-hidden="true"`. The labels row, the caption and a visually hidden sentence (`Offer $27.00 against a floor of $23.00, a reject line of $25.00 and an accept line of $28.00`) carry the meaning as text.

**Never on buyer pages:** floor, reject line, accept line, band, mini band, "policy", "review band", "auto-accepted". A grep for `floor|rejectLine|autoAccept|autoReject` must return zero hits under the buyer routes' component tree.

### 4.4 Blocked: old → new

Computed structurally, never parsed (§3.2.2). Four comparable terms, in this order, and only the changed ones are shown:

| Term | From | To | Format |
| --- | --- | --- | --- |
| `List price` | `$7.80` | `$8.97` | `formatMoney` |
| `Terms` | `AT-terms-2026.04` | `AT-terms-2026.04-R1` | mono, 12px |
| `Delivery` | `4 days` | `6 days` | `N days` |
| `Item spec` | `spec-2026.3` | `spec-2026.4` | mono, 12px |

The header count (`2 OF 4 TERMS CHANGED`) is the length of that changed list over the number of non-null frozen fields. Unchanged terms live behind a native `<details>`. If every frozen field is `null`, no diff is rendered and `blockReason` is shown as one plain sentence.

### 4.5 State vocabulary

One vocabulary, everywhere. Mark = 6px square, 0 radius, tone colour, 8px gap, then the word at 11px/600, uppercase, `0.08em` tracking, tone colour.

| Word | Tone | Meaning |
| --- | --- | --- |
| `Confirmed` | agreed `#2E5C3C` | order confirmed against a live listing |
| `Accepted` | agreed | an offer accepted |
| `Awaiting authorization` | waiting `#8A5A12` | agreed, not yet authorized |
| `Awaiting vendor` | waiting | offers pending at the vendor desk |
| `In review band` | waiting | vendor page: offer inside the window |
| `Blocked` | blocked `#9A2B21` | confirmation refused |
| `Declined` | blocked | an offer rejected |
| `Cancelled` | faint `#6E6A61` | order cancelled |
| `Superseded` | faint | another offer was accepted |
| `Countered` | ink `#1A1917` | vendor replied with a price |

No pills, no badges, no dots, no icons. The old build's filled/hollow dot vocabulary is dead with the lane chart.

### 4.6 Dates and time

- `formatDate` → `24 Oct 2026`; `formatDateTime` → `24 Oct, 19:21`.
- Absolute timestamps everywhere. No relative time (`24 Oct, 19:21`) anywhere: the demo's clock is not the data's clock, and a relative label is a claim about liveness the app cannot back.
- `authorizedAt` and `createdAt` are labelled `Authorized` and `Order created`. `Order` has no `confirmedAt`; the confirmed step shows those two and never invents a third.

---

## 5. Visual system

Everything below is already implemented in the style plate (`_shots/plate/plate.css`, 488 lines) and rendered in `_shots/plate-neg-1440.png`, `plate-neg-390.png`, `plate-home-1440.png`, `plate-vendor-1440.png`. The plate's CSS becomes `src/app/globals.css` nearly verbatim.

### 5.1 Colour tokens

```
--canvas        #FAF9F6   page plane
--rail          #F2F0EA   rail background
--surface       #FFFFFF   only inside controls (inputs, buttons' hover)
--sunk          #F2F0EA   selected rows, rail hover
--ink           #1A1917   primary text, filled buttons, markers
--ink-2         #56524A   body text
--ink-3         #6E6A61   labels, meta, captions
--rule          #E3DFD6   internal rules, table rows
--rule-strong   #C8C3B7   section boundaries, input borders, ticks
--agreed        #2E5C3C   confirmed / accepted
--waiting       #8A5A12   awaiting / in band
--blocked       #9A2B21   blocked / declined
--agreed-wash   #EEF3EC   notice strip background (positive)
--waiting-wash  #F7F1E4   notice strip background (neutral)
--blocked-wash  #F9EDEA   notice strip background (negative)
--agreed-band   #E4EDE1   band: above the accept line
--waiting-band  #F3E6CB   band: the review band itself
--sunk-band     #E8E5DD   band: below the reject line
```

The three `*-band` tokens are deliberately darker than the `*-wash` tokens: the first band render used `--waiting-wash` for the review zone and it was invisible against `#FAF9F6` (ΔL ≈ 2). Zones are the only large filled areas in the product, so they carry slightly more chroma than any wash.

No gradients. No box-shadows except `inset 0 2px 0` on the recommended board column. No blur, no glass, no glow. No colour outside this list; `#ece9e2` and `#f5f3ee` are the only two hover tints and both are listed in the plate as literals.

### 5.2 Type

Archivo (400/500/600/700) via `next/font/google`, `display: swap`, latin subset. IBM Plex Mono (400/500) for identifiers only.

| Class | Size / line / weight / tracking | Use |
| --- | --- | --- |
| `t-hero` | 44 / 1.02 / 600 / −0.035em | vendor offered unit price |
| `t-display` | 34 / 1.05 / 600 / −0.03em | page `h1` |
| `t-h1` | 26 / 1.15 / 600 / −0.025em | negotiation `h1`, order-line values |
| `t-h1-sm` | 24 / 1.2 / 600 / −0.02em | home and vendor `h1` |
| `t-h2` | 22 / 1.2 / 600 / −0.02em | section `h2`, vendor detail name |
| `t-h3` | 15 / 1.3 / 600 / −0.01em | board supplier name, ledger name, queue name |
| `t-body` | 13 / 1.55 / 400 / 0 | prose, notes |
| `t-row` | 13 / 1.4 / 400 / 0 | table cells |
| `t-money-row` | 17 / 1.15 / 600 / −0.02em | ledger price, listing price |
| `t-money-lg` | 22 / 1.1 / 600 / −0.02em | vendor totals |
| `t-label` | 11 / 1.2 / 600 / 0.08em, uppercase | eyebrows, column heads, field labels |
| `t-meta` | 11.5 / 1.4 / 400 | meta lines, notes, counts |
| `t-micro` | 10.5 / 1.2 / 600 / 0.06em | fact-row labels |
| `t-id` | mono 11 / 1.3 / 400 / 0.01em | SKUs, spec and terms versions |

Base `body` is 13px, line-height 1.5, `font-variant-numeric: tabular-nums` globally — money and dates are tabular everywhere, not per-component.

### 5.3 Spacing, radii, borders

- Spacing scale (4px base): 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 72. Page padding 40/48; section gap 40; section head 40 tall; block gaps 16/20/24.
- Radii: `--radius-control: 4px` on buttons, inputs and the item-picker box only. Everything else 0 — no rounded cards, no rounded rows, no rounded panels.
- Borders: `1px --rule` between rows and inside a block; `1px --rule-strong` for section boundaries, the composer's top rule and input borders; `2px` left rules for a selected row (`--ink`) and a blocked row (`--blocked`); `2px` ink border on the active order-line number; `2px` inset `--agreed` top on the recommended column. The page never draws a border *around* a block; rules are horizontal or a single left edge.

### 5.4 Tables and rows

| Element | Spec |
| --- | --- |
| Section rule | 1px `--rule-strong`, full content width |
| Table header | 34px tall, 11px/600 uppercase `0.08em` `--ink-3`, 1px `--rule` bottom |
| Transcript row | 40px min-height, 13px, 1px `--rule` bottom, `padding-right: 16px` on every cell, none on the last |
| Ledger row | 64px, 17px price, name + mono SKU stacked, 1px `--rule` bottom |
| Listing row | 48px, 6 columns |
| Hover | rows with an action get `--sunk`; rows without an action get nothing (no fake affordance) |
| Numeric cells | right-aligned, tabular, and given `padding-right: 20px` when followed by a status column |

The 16px cell padding is not decorative: without it the `ROUND` and `PRICE` headers rendered as one word in the first plate pass.

### 5.5 Buttons

| Variant | Fill | Border | Text | Height |
| --- | --- | --- | --- | --- |
| `btn--primary` | `--ink` | none | `--canvas` | 40 |
| `btn--secondary` | transparent | 1px `--rule-strong` | `--ink` | 40 |
| `btn--danger` | transparent | 1px `--rule-strong` | `--blocked` | 40 |
| `btn--quiet` | none | none | `--ink-2`, underline on hover | 32 |

Shared: 4px radius, `padding 0 18px`, 13px/600, `white-space: nowrap`, no icons, no arrows in labels. A button is never full-width except in a stacked mobile decision block. Primary actions are filled ink; there is exactly one primary per page.

### 5.6 Pills — there are none

The brief asks for a pill spec; the answer is that the product has no pills. Status is a 6px square plus an uppercase word (§4.5). Counts are plain 11.5px text after a section title (`3 suppliers · 4 offers`). The only rounded shape in the entire product is the 4px control radius. A pill would imply a filter or a removable token, and nothing here is either.

### 5.7 Forms

- Label above control: `t-label` 11px uppercase `--ink-3`, 6px gap.
- Control: 40px, `--surface` fill, 1px `--rule-strong` border, 4px radius, 13px text, `padding 0 10px`.
- Affixes (currency `$`, unit `days`) are absolutely positioned inside the control at 10px, `--ink-3`, `pointer-events: none`; the input gets `padding-left: 22px` / `padding-right: 44px`.
- Hover: border `--ink-3`. Focus: border `--ink` **plus** `outline: 2px solid var(--ink); outline-offset: 1px`.
- Numeric inputs: `inputMode="decimal"` for money, `inputMode="numeric"` for quantity and days. No spinners, no steppers, no sliders, no toggles anywhere in the product.
- Validation is server-side (`?error=`); the UI adds no inline validation messages and no red borders. A field is never disabled — if an action is unavailable, the control is absent, not greyed.

### 5.8 Focus and interaction

- One focus treatment for every interactive element: `outline: 2px solid var(--ink); outline-offset: 2px` (1px for inputs, which already have a border). No `box-shadow` rings, no colour changes on focus.
- The item picker is a `<label>` wrapping a visually hidden radio; focus lands on the radio and the label shows the ring via `:has(input:focus-visible)`.
- Hover states exist only where a click does something. Static rows, statuses and money have no hover.
- No entrance animations, no transitions on layout, no scroll effects. The only permitted transition is a 120ms `background-color` on buttons and rail links, and it is removed under `prefers-reduced-motion: reduce`.

---

## 6. Component inventory

Server components unless marked. All props are plain data; no component fetches.

| # | Component | Props | States / variants |
| --- | --- | --- | --- |
| 1 | `Shell` | `children`, `current: "requisition" \| "vendor"`, `recents: {id, sku, statusWord, tone}[]` | rail ≥1024 · top bar <1024 |
| 2 | `PageHead` | `eyebrow`, `status?: {tone, word}`, `title`, `meta: string[]` | with / without status; 1–3 meta lines |
| 3 | `SectionHead` | `title`, `aside?: string` | — |
| 4 | `Status` | `tone: "agreed"\|"waiting"\|"blocked"\|"ink"\|"faint"`, `word` | 10 words (§4.5) |
| 5 | `OrderLine` | `steps: {label, state: "done"\|"active"\|"muted"\|"failed", value, suffix?, note, action?}[]` | 5 negotiation states (§3.2.1) |
| 6 | `SupplierBoard` | `suppliers: {id, name, priceMinor, delta: {kind, minor}, listMinor, deliveryDays, reliability, trail: string, status}[]`, `recommendedId?` | awaiting · agreed (recommended) · 2 or 3 columns |
| 7 | `Transcript` | `offers: {id, at, supplier, round, priceMinor, status, note}[]` | desktop table · <768 stacked |
| 8 | `BlockStrip` | `order: {frozen*, live*, blockReason}`, `changed: {term, from, to, kind}[]`, `unchanged: same[]` | 1–4 changed · all-null fallback |
| 9 | `RequisitionComposer` **client** | `items`, `currency`, `capMinor`, `defaultQuantity` | target auto · target edited · item changed |
| 10 | `ItemPicker` | `items: {id, name, description, facts, fromMinor, currency}[]`, `selectedId` | selected · unselected · hover |
| 11 | `TermsGrid` | `capMinor`, `currency`, `quantity`, `targetMinor`, `deadlineDays` | — |
| 12 | `Ledger` | `rows: {id, href, name, sku, qty, rounds, priceMinor, status, filedAt}[]`, `variant: "flight"\|"settled"` | with rows · empty |
| 13 | `Queue` | `rows: {offerId, name, supplier, priceMinor, band}[]`, `selectedOfferId` | 0, 1, n rows |
| 14 | `QueueRow` | `row`, `selected` | selected (`--sunk` + 2px ink) · default · hover |
| 15 | `MiniBand` | `floorMinor, rejectMinor, acceptMinor, listMinor, offerMinor` | aria-hidden |
| 16 | `Band` | same as `MiniBand` + `caption` | aria-hidden track; text labels outside |
| 17 | `Metagrid` | `cells: {label, value, mono?}[]` | 3×2 desktop · 2×n mobile |
| 18 | `DecisionBlock` | `offer`, `floorMinor`, `currency`, `actions: {accept, reject, counter}` | vendor only |
| 19 | `ListingRow` | `listing: {id, supplier, item, listMinor, floorMinor, policy, termsVersion}`, `reprice` | desktop 6 cols · <1024 3 cols |
| 20 | `Notice` | `tone`, `message` | error · notice |
| 21 | `EmptyState` | `text` | one sentence, 11.5px `--ink-3`, never a graphic |
| 22 | `Field` | `label`, `name`, `defaultValue`, `prefix?`, `suffix?`, `inputMode?` | — |
| 23 | `Button` | `variant: primary\|secondary\|danger\|quiet`, `type`, `formAction?`, `children` | — |

Deleted from the current build: `AccountCard` (its four facts move into the page head and the composer hint), `CatalogueCard`, the four vendor KPI tiles, the rounds matrix, `OrderGate` (replaced by `OrderLine` + `BlockStrip`), `OfferDetail`'s bar rows (replaced by `Band`).

### 6.1 The composer island — the only client component

The default target is a UI convenience: `85%` of the selected item's lowest list price. It has to update when the item changes, which is the single interaction on `/` that server rendering cannot express. So exactly one client island exists.

- File: `src/components/storefront/requisition-composer.tsx`, `"use client"`.
- State, and only this state: `itemId: string` (initialised to the first item) and `targetInput: string | null` (initialised to `null`, meaning "auto").
- Pure helper in `src/components/storefront/target.ts`, imported by both the server page and the island:
  `defaultTargetMinor(lowestListPriceMinor) = Math.round(lowestListPriceMinor * 85 / 100)`
  `formatMinorInput(minor) = (minor / 100).toFixed(2)`
- Initial HTML is produced on the server with the same helper, so the client's first render matches exactly — no `useEffect`, no hydration mismatch, no flash of an empty field.
- `onChange` of an item: `setItemId(id); setTargetInput(null)` — the target always follows the item, because the target is a function of the item's prices. Typing in the target field sets `targetInput`; the field stays user-owned until the item changes again.
- Everything else (`quantity`, `budgetCap`, `deadlineDays`) is uncontrolled with `defaultValue`; the form submits through `action={startNegotiationAction}` imported directly from `@/app/actions`. No `fetch`, no `onSubmit`, no client validation.
- Paper: `3050 × 0.85 = 2592.5 → 2593 → 25.93`. Gloves: `780 × 0.85 = 663 → 6.63`.
- The 85% figure appears in the hint text, so the number is not a secret rule; it is a starting point the buyer can overwrite.

---

## 7. Copy

Sentence case everywhere except the 11px uppercase labels. No exclamation marks, no "Oops", no "successfully", no "please". A label names the thing; a sentence states a fact or a consequence.

### 7.1 Shell

| Slot | Copy |
| --- | --- |
| Wordmark | `Commerce` + `OS` (the `OS` in `--ink-3`, weight 500 — type only, no icon) |
| Rail caption | `Procurement desk` |
| Rail label | `WORKSPACES` |
| Rail links | `Requisition` · `Review desk` |
| Rail label | `RECENT` |
| Rail footer | `Demo — no payments processed` |
| Top bar (mobile) | wordmark + `Requisition` · `Review desk` |

### 7.2 Home

| Slot | Copy |
| --- | --- |
| Eyebrow | `BUYER WORKSPACE` |
| Head aside | `1 in flight · 2 settled` |
| `h1` | `Requisition` |
| Meta | `Acme Facilities Group · cap $2,500.00 · USD` |
| Section | `New requisition` / aside `Sets the terms for every active supplier` |
| Field label | `ITEM` |
| Item facts | `3 suppliers · 3-day delivery · spec-2026.1` |
| Item price | `FROM` `$30.50` `per unit` |
| Fields | `QUANTITY` · `TARGET / UNIT` · `BUDGET CAP` · `DEADLINE` |
| Button | `Start negotiation` |
| Hint | `Target is 85% of the lowest list price. The cap covers the whole purchase, so the per-unit ceiling depends on quantity.` |
| Section | `In flight` / `1 open` |
| Ledger heads | `ITEM` `QTY` `ROUNDS` `PRICE` `STATE` `FILED` |
| Section | `Settled` / `2 closed` |
| Empty flight | `Nothing is running. Start a requisition above.` |
| Empty settled | `No closed negotiations yet.` |

### 7.3 Negotiation

| Slot | Copy |
| --- | --- |
| Eyebrow | `BUYER · PAP-A4-80` |
| Meta 1 | `Acme Facilities Group · 100 units · spec-2026.1` |
| Meta 2 | `target $27.00/unit · budget $4,000.00 ($40.00/unit) · due 31 Oct 2026 · filed 24 Oct, 19:21` |
| Order line labels | `AGREED` · `AUTHORIZE` · `CONFIRM` |
| Step 1, pending | `No price agreed yet` / `Waiting on the vendor desk. 2 of 3 suppliers are considering your price.` |
| Step 1, exhausted | `No price agreed yet` / `All 3 rounds are used. The suppliers' last prices are final.` |
| Step 1, countered | `$27.00 /unit` / `Meridian Office Goods countered. Accepting agrees the price.` |
| Step 1, agreed | `$27.00 /unit` / `Meridian Office Goods · {formatDateTime(accepted offer createdAt)}` |
| Step 2, muted | `—` / `Opens once a price is agreed.` |
| Step 2, active | `$2,700.00 total` / `Records your approval. Confirmation is a separate step.` / button `Authorize purchase` |
| Step 2, done | `$2,700.00 total` / `24 Oct, 19:59` |
| Step 3, muted | `—` / `Re-reads the live listing before it commits.` |
| Step 3, failed | `Blocked` / `The listing changed after you authorized.` |
| Step 3, done | `$2,700.00` / `Order created 24 Oct, 19:59 · no payment processed in this demo.` |
| Section | `Suppliers` / `3 suppliers · 4 offers · 2 rounds` |
| Board facts | `LIST` · `DELIVERY` · `RELIABILITY` (`85 / 100`) |
| Board delta | `at your target` · `+$3.50 over your target` · `−$0.50 under your target` · `Recommended · at your target` |
| Section | `Transcript` / `4 offers` |
| Table heads | `TIME` `SUPPLIER` `ROUND` `PRICE` `DECISION` |
| Block strip title | `Blocked at confirmation` |
| Block strip status | `2 OF 4 TERMS CHANGED` |
| Block strip body | `Nothing was charged, and the agreed price no longer holds.` |
| Block strip terms | `LIST PRICE` · `TERMS` · `DELIVERY` · `ITEM SPEC` |
| Block strip details | `Show the 2 unchanged terms` |
| Block strip action | `Raise a new requisition` |
| Empty transcript | `No offers yet.` |

Transcript notes, by decision (`isVendorCounter` = the note starts with `Vendor counter at`, i.e. our own engine string, with a fallback of "buyer offer" when it does not match):

| Decision | Word | Note |
| --- | --- | --- |
| PENDING, round 1 | `Awaiting vendor` | `Sent to the supplier — awaiting their decision.` |
| PENDING, round ≥2 | `Awaiting vendor` | `Your counter was sent — awaiting the supplier's decision.` |
| PENDING, vendor counter | `Countered` | `The supplier set a new price. Accept it or let the negotiation close.` |
| ACCEPTED, buyer offer | `Accepted` | `The supplier accepted this price.` |
| ACCEPTED, vendor counter | `Accepted` | `You accepted the supplier's counter-offer.` |
| REJECTED | `Declined` | `The supplier declined this price.` |
| SUPERSEDED | `Superseded` | *(none — the word is the whole fact)* |

The current build gets three of these wrong: it labels a supplier-rejected offer `Supplier policy declined this price automatically.`, labels a buyer-accepted counter `Supplier policy accepted this price automatically.`, and tells buyers that a pending offer is `Inside the supplier's review band` — which leaks a vendor threshold concept onto the buyer page.

### 7.4 Vendor

| Slot | Copy |
| --- | --- |
| Eyebrow | `VENDOR CONSOLE` |
| Head status | `3 need a decision` |
| `h1` | `Review desk` |
| Sub | `Offers inside the supplier's review band wait here. Policy settles everything outside it.` |
| Section | `Awaiting decision` / `3 open` |
| Queue row meta | `Meridian Office Goods · floor $23.00` |
| Detail label | `OFFERED UNIT PRICE` |
| Detail sub | `100 units · $2,700.00 total` |
| Detail status | `In review band` |
| Band labels | `FLOOR $23.00` · `REJECT $25.00 · ACCEPT $28.00` · `LIST $30.50` |
| Band caption | see §4.3 table (5 cases) |
| Metagrid | `QUANTITY` `BUYER` `DELIVERY` / `RELIABILITY` `DEADLINE` `FILED` |
| Decision heads | `ACCEPT` · `REJECT` · `COUNTER` |
| Decision buttons | `Accept at $27.00` · `Reject` · `Send` |
| Consequences | `Locks the deal at $2,700.00 total.` · `Ends this negotiation with no deal.` · `Floor $23.00 — a counter below it is refused.` |
| Section | `Listing terms` / `5 listings` |
| Listings sub | `Repricing a listing bumps its terms revision. An order authorized before the change blocks at confirmation.` |
| Listing policy | `accept ≥ $28.00 · reject < $25.00` |
| Listing action | `Simulate repricing` |
| Empty queue | `No offers waiting. Everything inside the review band has been decided.` |

### 7.5 Notices and errors

The strip renders the `?error=` / `?notice=` value verbatim, prefixed by a 2px tone rule: `--blocked` for errors, `--agreed` for notices. Those strings are owned by `src/app/actions.ts`, which this plan does not modify; the UI does not rewrite them.

---

## 8. Responsive and accessibility

### 8.1 Breakpoints

| Width | Shell | Content |
| --- | --- | --- |
| ≥1280 | rail 208, page padding 40/48, max 1136 | all multi-column layouts |
| 1024–1279 | rail 176, page padding 32/40 | board stays 3-up; queue stays 2-pane; listing drops policy/terms columns |
| 768–1023 | top bar 56 | board 2-up; queue flips (review first); metagrid 2-up |
| 480–767 | top bar 56, padding 24/20 | order line stacks; board 1-up; transcript stacks; ledger re-lays; decision stacks |
| <480 | same | band labels 2-row; terms 2×2; picker price block drops under the facts |

### 8.2 Reflow rules per component

| Component | ≥1024 | <1024 | <768 |
| --- | --- | --- | --- |
| Rail | 208/176 fixed | hidden | hidden |
| Top bar | hidden | 56 sticky | 56 sticky |
| Page head | eyebrow + status on one row | same | status wraps under the eyebrow |
| Picker | 14px · 1fr · auto | same | price block right-aligned under facts |
| Terms grid | `104 152 152 120 max-content` | same | 2×2, button full width |
| Order line | 3 columns with 1px separators | same | 3 stacked steps, rule above each |
| Board | 3 columns, 1px verticals | 2 columns | 1 column, bottom rule each |
| Transcript | table | table | stacked 2-col rows, no header |
| Ledger | 6 columns + header | header hidden, 2-col rows | same |
| Queue | 320 + 1fr | 1 column, review first | same |
| Band | 8px track, 3-col labels | same | labels 2-row (floor / list, then reject·accept) |
| Decision | 3 columns | 3 columns | stacked, buttons full width |
| Listing | 6 columns | 3 columns | 3 columns, tighter |
| Metagrid | 3×2 | 2×n | 2×n |

### 8.3 No horizontal scrolling

There is no `overflow-x: auto` and no `min-width` on any element. Verified by asserting `document.documentElement.scrollWidth === document.documentElement.clientWidth` at 320, 390, 768, 1024, 1280 and 1440. The plate hit three overflows on the way here — a `min-w-[560px]` table, a 320px inline grid, and an 84px ledger column containing a 131px status — so this is checked at every width, not assumed.

### 8.4 Accessibility

- **Landmarks**: `<nav aria-label="Workspaces">` in the rail, `<main>` per page, one `<h1>`, `<h2>` per section, `<h3>` per supplier column and per vendor detail.
- **Order line** is an `<ol>` with `aria-current="step"` on the active step, so the commit chain is announced in order. The step number square is `aria-hidden`; the word `AGREED` / `AUTHORIZE` / `CONFIRM` is the label.
- **Status** is real text: a 6px square (`aria-hidden`) plus the uppercase word. No `aria-label`-only statuses, no colour-only meaning — every tone is paired with a word.
- **Band**: the track, zones, ticks and marker are `aria-hidden="true"`; the labels row and caption are text; a visually hidden sentence restates the numbers (`Offer $27.00 against a floor of $23.00, a reject line of $25.00 and an accept line of $28.00.`).
- **Picker**: `<fieldset><legend class="t-label">Item</legend>` with real radio inputs (visually hidden, not `display: none`), each `<label>` wrapping its input; the selected state is visual only, the input carries it.
- **Forms**: every input has an `id` and a `<label for>`; buttons are `<button type="submit">` inside their `<form>`; hidden inputs carry `itemId`, `offerId`, `orderId`, `negotiationId`, `listingId` as the actions expect.
- **Focus**: visible on every interactive element (§5.8), in DOM order, no traps. The item picker shows the ring on the row via `:has(input:focus-visible)`.
- **Contrast** (WCAG 2.x relative luminance against `#FAF9F6`): `--ink` 16.69:1, `--ink-2` 7.38:1, `--ink-3` 5.12:1, `--waiting` 5.62:1, `--blocked` 7.27:1, `--agreed` 7.35:1. The tightest text token is `--ink-3` at 5.12:1; the smallest text in the product is 10.5px, so the 4.5:1 threshold applies and every token clears it. On the wash backgrounds the same words hold: `--waiting` 5.25:1 on `--waiting-wash`, `--agreed` 6.89:1 on `--agreed-wash`, `--blocked` 6.69:1 on `--blocked-wash`.
- **Motion**: no entrance animation, no transition on layout. `@media (prefers-reduced-motion: reduce)` sets every transition to none.
- **Zoom**: layout survives 200% zoom at 1280 (effective 640) because the only fixed widths are the rail and control heights; the transcript and board reflow at the same breakpoints.
- **Language**: `<html lang="en">`; dates and money are formatted by `format.ts` only, so a locale change is a single-file change.

---

## 9. What not to do

Each trap is one this project actually fell into, with the rule that prevents it.

| # | Trap | Rule |
| --- | --- | --- |
| 1 | **An instrument with no data in it.** The round-1 lane chart put 4 offers at 2 distinct prices into a 700px track; 3 of them sat on the target line and the right half was empty. | Before a chart is drawn, compute its geometry on the real seed data. If the plotted values occupy less than 40% of the track, the data does not support a plot — use a table of aligned facts. |
| 2 | **A control stretched to fill a grid track.** `minmax(150px, 1fr)` on the composer's last column produced a 450px-wide "Start negotiation" button. | Action columns are `max-content`. A button's width is its label plus 36px, never the remainder of a row. |
| 3 | **A fill that disappears into the plane.** The band's review zone rendered at `#F7F1E4` on `#FAF9F6` — a ΔL of about 2, invisible in the screenshot. | Any filled zone must differ from the canvas by at least 6% luminance **or** carry a 1px tone border. Zones use the `*-band` tokens, never the `*-wash` tokens. |
| 4 | **Colliding table headers.** `ROUND` at 48px plus `PRICE` at 104px with no cell padding rendered as `ROUND PRICE`. | 16px `padding-right` on every cell, none on the last, and no column narrower than its longest header word + 16px. |
| 5 | **Invented data.** Round 1 put a gloves row in a paper queue, invented a confirmation timestamp, and wrote "3 in flight" when there was 1. | Every string on screen comes from the database, from a pure helper over the database, or from the copy table in §7. No plausible-looking number is ever typed into a component. |
| 6 | **Threshold leakage.** Floors, reject lines and accept lines are vendor information; a buyer who sees them learns the supplier's negotiating position. | Buyer routes import only buyer components. The band, `MiniBand`, `DecisionBlock` and `ListingRow` live under `src/components/vendor/**`. Grep gate: `floor\|rejectLine\|autoAccept\|autoReject\|review band` must return zero hits under the buyer component tree and in `src/app/page.tsx` / `src/app/negotiation/**`. |
| 7 | **Cards.** The previous build wrapped everything in a bordered, rounded, shadowed container, which fragments a comparison that must be read across. | No `border-radius` above 4px; no `box-shadow` except the recommended column's `inset 0 2px 0`; no element with both a background and a border except form controls. Rules are horizontal lines or a single 2px left edge. |
| 8 | **KPI tiles.** Four numbers at the top of the vendor page, occupying 380px, telling the vendor nothing it can act on. | A number appears only if an action or a comparison depends on it. Counts live as `3 open` beside a section title, at 11.5px. |
| 9 | **Icon logo and icon buttons.** | The wordmark is type. No icon library is installed and none is added. Every button is a word. |
| 10 | **Hiding states.** The current home page filters `CONFIRMED` and `CANCELLED` out of the list, so the two states the demo is about are unreachable from `/`. | Every state in the vocabulary is reachable from `/` and shows its word. Settled rows are never deleted, only sorted below in-flight ones. |
| 11 | **Horizontal scrolling.** The current negotiation page wraps its rounds matrix in `overflow-x-auto` with `min-w-[560px]`. | No `min-width` on any table, no `overflow-x` container anywhere. Assert `scrollWidth === clientWidth` at 320/390/768/1024/1280/1440 before calling a page done. |
| 12 | **Fake liveness.** Relative timestamps ("24 Oct, 19:21"), pulsing dots, counters that tick. The demo's clock is not the data's clock. | Absolute timestamps from `formatDateTime`. No animation on data. The only transition in the product is a 120ms background colour on hover, removed under reduced motion. |
| 13 | **Parsing the block reason.** `blockReason` is a human sentence written by the engine; splitting it to build a diff table is a latent crash on any copy change. | Compare `order.frozen*` against `listing.*` field by field. If the frozen fields are null, print `blockReason` as one sentence and render no diff. |
| 14 | **Two competing action surfaces.** Round 1 had an action strip *and* a rail gate, so the same button appeared twice with different emphasis. | One action per page, in the order line. When a strip is present it carries the action and the order line's failed step stays read-only. |
| 15 | **Buyer-facing engine vocabulary.** "Review band", "policy", "auto-accepted" are the supplier's model, not the buyer's. | Buyer pages state outcomes (`Accepted`, `Declined`, `Awaiting vendor`) and never the mechanism. The word "policy" appears only on `/vendor`. |
| 16 | **Decoration standing in for hierarchy.** Gradients, glow, glass, oversized numerals with no job, 4px-tall progress bars that read as loading. | If an element does not encode a fact, delete it. The page earns its character from type, rules and the two instruments. |

---

## 10. Implementation order

Each step is a commit-sized unit that leaves the app building and every route rendering. Queries (`src/lib/**`), server actions and the schema are untouched throughout.

| Step | Work | Files | Gate |
| --- | --- | --- | --- |
| 1 | **Foundation.** Tokens, type classes, shell, `Status`, `PageHead`, `SectionHead`, `Button`, `Field`, `Notice`, `EmptyState`. Replace `globals.css` with the plate's CSS (trimmed to what is used). | `src/app/globals.css`, `src/app/layout.tsx`, `src/components/shell/**`, `src/components/ui/**` | `npx tsc --noEmit`; `npm run build`; all three routes still render (old page bodies on the new shell) |
| 2 | **Home.** `RequisitionComposer` island + `target.ts` + `ItemPicker` + `TermsGrid` + `Ledger`; delete `AccountCard` / `CatalogueCard`; add the `Settled` section from the same query. | `src/app/page.tsx`, `src/components/storefront/**` | build; `/` shows 1 in flight + 2 settled with real values |
| 3 | **Negotiation.** `OrderLine` (5 states), `SupplierBoard`, `Transcript`, `BlockStrip`; delete `OrderGate`, `RoundsMatrix`, the right rail and the `overflow-x-auto` wrapper. | `src/app/negotiation/[id]/page.tsx`, `src/components/negotiation/**` | build; the seeded open, confirmed and blocked negotiations each render the right order-line state |
| 4 | **Vendor.** `Queue`, `QueueRow`, `MiniBand`, `Band`, `Metagrid`, `DecisionBlock`, `ListingRow`; delete the 4 KPI tiles and `OfferDetail`'s bars. | `src/app/vendor/page.tsx`, `src/components/vendor/**` | build; queue shows the 3 real pending offers; band caption matches the arithmetic in §4.3 |
| 5 | **Vocabulary.** Rewrite `status.ts` to the 10 words and 5 tones; fix the three wrong notes; make the buyer notes mechanism-free. | `src/components/status.ts`, `src/components/types.ts` | grep gate from §9.6 passes; no `policy` / `review band` under buyer routes |
| 6 | **Responsive.** The 5 breakpoints, transcript stacking, ledger re-lay, queue flip, order-line stacking, band label re-order, decision stacking. | `globals.css` + the components touched above | `scrollWidth === clientWidth` at 320/390/768/1024/1280/1440 |
| 7 | **Accessibility.** Landmarks, `<ol>` order line with `aria-current="step"`, fieldset/legend picker, `aria-hidden` band track + hidden sentence, focus ring everywhere, reduced motion. | as above | keyboard pass: tab order follows reading order, every control reachable, focus always visible |
| 8 | **Verification.** `npx tsc --noEmit`, `npm run build`, screenshots at 1440 and 390 for all three pages into `_shots/design-*.png`, overflow assertions, grep gates, and a read of each page against §7 copy. | `_shots/**` | all gates green |
| 9 | **Cleanup.** Delete dead components, dead CSS classes and unused imports; final build; diff review. | repo | `npm run build` clean, no unused exports |

The demo data is not touched: the seeded open, confirmed and blocked negotiations stay as they are, so every state in §3.2.1 and §3.2.2 is visible without clicking anything.

---

## Appendix A — evidence

**Style plate (rendered before implementation, so the critic can judge the system rather than a description):**

| File | What it shows |
| --- | --- |
| `_shots/plate-neg-1440.png` | negotiation page at 1440×900: head, order line, supplier board, transcript |
| `_shots/plate-neg-1440-full.png` | the same page full height: all 5 order-line states + the blocked strip |
| `_shots/plate-neg-390.png`, `plate-neg-390-s0..2.png` | the same page at 390, top / board / transcript-stacking |
| `_shots/plate-home-1440.png`, `plate-home-390.png` | home: composer, picker, terms, in-flight + settled ledger |
| `_shots/plate-vendor-1440.png`, `plate-vendor-390.png` | vendor: queue with mini bands, detail band, decision block |
| `_shots/plate/plate.css` | the intended `globals.css` (488 lines, tokens + components only) |
| `_shots/plate/neg.html`, `plate/pages.html` | the markup behind the renders |

**Verified against the code (line numbers re-checked this round):**

| Claim | Where |
| --- | --- |
| `overflow-x-auto` wrapper on the negotiation page | `src/app/negotiation/[id]/page.tsx:138` |
| Rounds matrix table + `min-w-[560px]` | `src/components/negotiation/rounds-matrix.tsx:24` |
| Order gate BLOCKED branch and `blockReason` list | `src/components/negotiation/order-gate.tsx:116`, `:124–131` |
| Home right rail is 2 cards, not 3 | `src/app/page.tsx:104`, `:109` |
| Home filters out `CONFIRMED`/`CANCELLED` | `src/app/page.tsx:47` |
| Vendor KPI tiles | `src/app/vendor/page.tsx:51–83` |
| `OfferDetail` bar widths | `src/components/vendor/offer-detail.tsx:23–26`, rendered `:53–56` |
| Native `<select>` item picker | `src/components/storefront/requisition-form.tsx:31–49` |
| Account chip in the page header | `src/components/shell/page-header.tsx:37–41` |
| "Budget cap" line | `src/components/storefront/account-card.tsx:25` |
| Buyer budget cap `250000` | `prisma/seed.ts:127` |
| `vendorCounterOffer` has no upper bound | `src/lib/negotiation-service.ts:244–245` |
| Order has no `confirmedAt` | `prisma/schema.prisma`, `model Order` |

**Real data used throughout** (`_shots/dump-state.ts`): 2 items, 5 listings, 3 negotiations. Pending: Meridian `$27.00` (list `$30.50`, floor `$23.00`, reject `$25.00`, accept `$28.00`), Northwind `$27.00` (list `$32.00`, floor `$24.50`), Atlas `$30.50` (list `$34.00`, floor `$26.00`). Open negotiation `cmvmgjd4u0001cdacd6h9lva8`: 4 offers, 2 rounds, target `$27.00`, cap `$400,000.00`. Confirmed `cmvmhw4390001cde0gftbh6xg` (Meridian accepted `$27.00`, authorized and created 24 Oct 19:59). Blocked `cmvmhw471000dcde09k0ugpez`: Atlas accepted `$7.00`; the listing was repriced after authorization to `$8.97` with terms `AT-terms-2026.04-R1`, so the frozen/live diff is genuinely different rather than a restored value.





