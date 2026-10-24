# CommerceOS — design plan

Status: round 1 draft for critic review.
Owner: design-lead. Scope: `src/app/**` + `src/components/**` only.
Every claim about the current app below is backed by a file path or a screenshot I
took from the running app (listed in §0).

---

## 0. What I inspected (evidence base)

| Evidence | What it establishes |
|---|---|
| `_shots/cur-home-1440.png`, `cur-home-390.png` | Current home: topbar + white card strip, 3 stacked right-rail cards, ledger table clipping at 390. |
| `_shots/cur-neg-1440.png` + DOM measure | Negotiation content ends at **y=425 of 900** → 475px (53%) of empty canvas at 1440. |
| `_shots/cur-neg-390.png` | Rounds table clipped to "ROUND 1"; Delivery/Reliability columns unreachable (no scroll container). |
| `_shots/cur-blocked-1440.png` | Blocked order rendered as two 12px lines inside a 336px rail card, two thirds down the page. |
| `_shots/cur-vendor-1440.png`, `cur-vendor-390.png` | 4 KPI tiles; band legend; 380px queue; three unnormalized bars; two big tables below the fold (page = 1594px tall). |
| DOM measure on `/vendor` | `.bar-row__fill` widths are 89% / 75% / 100% of **list price** — three absolute bars, not a band position. |
| `src/app/globals.css` | Body 14px/1.5 Inter; `.card` radius 8px on `#f7f8fa`; `.pill` pastel fills; `.kpi`; `.bars`; `.matrix__*`; `min-width: 560px` tables. |
| `src/app/page.tsx:99-111` | Home = form card + 2/3 table + 1/3 column of 2 cards; right rail duplicates account. |
| `src/components/storefront/requisition-form.tsx:40-60` | Item chosen through a **native `<select>`**; 5 fields; no catalogue information visible. |
| `src/components/shell/page-header.tsx:38-53` + `storefront/account-card.tsx:29-33` | Budget cap printed **twice** (topbar chip + Account card). |
| `src/app/vendor/page.tsx:51-83` | Four `.kpi` tiles: awaiting / auto-accepted / auto-rejected / counters. |
| `src/components/vendor/offer-detail.tsx:22-46` | Offered / Floor / List as three bars scaled to list price. |
| `src/components/negotiation/rounds-matrix.tsx` | Supplier × round spreadsheet; no target reference; state as nested pills. |
| `src/components/negotiation/order-gate.tsx:143-176` | Block reason rendered as a `<ul>` of raw `old → new` strings at 12px. |
| `src/lib/queries.ts`, `src/app/actions.ts`, `src/lib/negotiation.ts`, `src/lib/negotiation-service.ts`, `prisma/seed.ts` | Exact fields, action names, form field names, block-reason format, seed values. |
| `_shots/seed-states.ts` (ran once) | Created one CONFIRMED (`cmvmhw4390001cde0gftbh6xg`) and one BLOCKED (`cmvmhw471000dcde09k0ugpez`) negotiation so the blocked state could be seen. Listing restored afterwards. |

Seed reality I designed against: 2 items, 3 suppliers, 5 listings, 1 buyer, budget cap
$2,500.00, all listings in stock (`prisma/seed.ts`). Block reason format is
`"list price $7.80 → $8.97; terms AT-terms-2026.04 → AT-terms-2026.04-R1"`
(`src/lib/negotiation-service.ts:337-359`).

---

## 1. Concept and point of view

**CommerceOS is an instrument, not a dashboard.** The product is a record of money
moving through a decision: an agent opens at a price, a supplier answers, a human
adjudicates, and a gate at the end can still kill the deal. So the interface is built
like a well-set financial statement: one continuous warm-white plane, hairline rules
instead of boxes, three text inks instead of six greys, money set in tabular figures at
a size that earns it, and exactly two visual instruments — a **price lane** (buyer side)
and a **policy band** (vendor side) — that turn "what happened across rounds and
suppliers" into one horizontal read. Nothing is elevated, nothing glows, nothing is
rounded except the four corners of a control. Hierarchy is typographic, not spatial.
That is the premium: restraint plus precision, with every number aligned and every state
carried by a word.

### Directions I killed

1. **Editorial ledger** (serif display, paper grain, ruled columns, pull quotes). Killed
   twice over: the human already rejected it verbatim ("too artistic and not very
   useful"), and it optimises for reading, not deciding — a procurement desk needs
   comparison and action density, not an essay. It is the *safe art-school* answer.
2. **Dark trading terminal** (near-black ground, monospaced grid, amber/cyan data glow).
   Killed: it is the banned tech theme in disguise, it fails the demo setting (a laptop
   in a lit room, screen-shared), and glow/neon is explicitly out. It is the *safe
   impressive-looking* answer that is actually a costume.
3. **Soft SaaS cards** (16px radii, pastel status chips, KPI tiles, 3-up bento). Killed:
   it is precisely the current look the human called "too generic, too unthought"; it
   spends space on padding instead of information and hides the negotiation's structure
   behind containers. It is the *safe default* answer.
4. **Bento dashboard** (hero KPI row + equal modules). Killed separately from (3) because
   it is the specific trap in this app: the vendor desk's four equal KPI tiles are the
   single most template-looking element on screen and they answer no question the vendor
   has. Numbers that matter here are *comparisons*, never solo tiles.

**Committed direction: "statement, not dashboard."** One plane, rules, tabular money,
typographic status, two instruments.

---

## 2. Information architecture

### What each page is for

| Route | Job (one line) | The single most important thing | Secondary |
|---|---|---|---|
| `/` | Set the terms of a purchase and see what is in flight | The requisition composer (the only write action) | The in-flight ledger: state, price, how many rounds |
| `/vendor` | Decide the offers that policy would not | The selected offer's position in the review band + the three decisions | Queue triage, recent decisions, listing terms (the demo control) |
| `/negotiation/[id]` | Read what the agent did, then authorize → confirm | The order gate's current step | Price lanes across rounds/suppliers; the deal summary; the transcript |

### Navigation model

- **Persistent:** a 208px left rail — wordmark, two workspace links, recent negotiations,
  a static demo note. It is the only persistent chrome. On `<768px` it becomes a 56px
  top bar with the same two links (no drawer; two destinations do not justify one).
- **Contextual:** everything else. The vendor queue is contextual to `/vendor`; the deal
  and order rail are contextual to a negotiation.
- **Removed:** the per-page topbar. Page identity moves into the page head (eyebrow + H1 +
  one meta line). The account chip is deleted: buyer identity appears once, in the head
  meta of `/` and `/negotiation/[id]`. The rail never shows account data, so the vendor
  surface cannot leak the buyer's budget cap.
- **Cross-surface:** the same item name, the same `formatMoney` output, the same status
  inks, the same type scale. The vendor's offer detail links to the buyer record
  (`/negotiation/{id}`, quiet link "Buyer record →") so the two surfaces read as one
  deal seen from two sides. That link is the only navigation between surfaces and it is
  the demo's mental model.

### One product, two roles

Both surfaces are the same record at different privileges. The vendor sees the band the
buyer must never see; the buyer sees the round history the vendor does not care about.
Shared vocabulary: *offer, round, vendor, terms, authorize, confirm, blocked*. Buyer
pages use "awaiting vendor / agreed / blocked"; vendor pages use "in band / accepted /
declined". No page uses the word "AI".

---

## 3. Page-by-page layout

Global grid at 1440: rail 208px; main padding 40px top, 48px sides; content max-width
1136px (fills 256→1392). Vertical rhythm: sections are separated by a 40px gap and a
1px `--rule` top border; section head is a 40px row; section body padding 20px 0.
No container has a radius or a shadow.

### 3.1 `/` — Buyer workspace

**Above the fold at 1440×900:** page head (y 40–118), composer band (y 140–400), ledger
head + 2 rows (y 440–620). Nothing below 640 is required to understand the page.

```
┌ rail 208 ┬──────────────────────────────────────────────────────────────────────────┐
│          │ BUYER WORKSPACE                           3 in flight · 1 blocked         │ 40
│ Commerce │ Requisition                                                              │ 64
│ OS       │ Acme Facilities Group · cap $2,500.00 · USD                              │ 92
│ Procure… │──────────────────────────────────────────────────────────────────────────│118
│          │ NEW REQUISITION                              Sets the terms for every    │
│ WORKSP…  │                                              active supplier              │140
│ Requisit…│ ITEM                                                                     │
│ Review…  │ ┌───────────────────────────────┐ ┌───────────────────────────────┐      │
│          │ │ (•) A4 Copy Paper, 80 gsm     │ │ ( ) Nitrile Gloves, Medium    │      │
│ RECENT   │ │ 500 sheets per ream, FSC-cer… │ │ Powder-free examination glo…  │      │
│          │ │ 3 suppliers · 3-day delivery  │ │ 2 suppliers · 4-day delivery  │      │
│ PAP-A4-80│ │ spec-2026.1        from $30.50│ │ spec-2026.3        from $7.80 │      │
│ Awaiting │ └───────────────────────────────┘ └───────────────────────────────┘      │
│          │  QTY        TARGET / UNIT    BUDGET CAP      DEADLINE          (button) │
│ GLV-NIT-M│  ┌──────┐   ┌───────────┐   ┌───────────┐   ┌────────────┐  ┌─────────┐│
│ Blocked  │  │ 50   │   │ $ 25.93   │   │ $ 2500.00 │   │ 14  days   │  │ Start   ││
│          │  └──────┘   └───────────┘   └───────────┘   └────────────┘  │ negotia…││
│ PAP-A4-80│  The cap covers the whole purchase, so the per-unit ceiling  └─────────┘│
│ Confirmed│  depends on quantity. Set the target under the lowest list price.        │
│          │──────────────────────────────────────────────────────────────────────────│
│ ──────── │ IN FLIGHT                                            2 open               │
│ Demo —   │ ITEM                                QTY   ROUNDS   PRICE    STATE    FILED│
│ no pay…  │▏A4 Copy Paper, 80 gsm              100   2        $27.00   ● Awaiting…   │
│          │ PAP-A4-80                                                                 │
│          │▏Nitrile Gloves, Medium             100   1        $7.00    ● Blocked      │
│          │ GLV-NIT-M                                                                 │
└──────────┴──────────────────────────────────────────────────────────────────────────┘
```

Regions and dimensions:

1. **Page head** — eyebrow 11px uppercase, H1 24px/600, meta 12px; right side is a single
   state line ("3 in flight · 1 blocked"), never a chip. 78px tall.
2. **Composer band** — starts with a 1px `--ink` top rule (the only heavy rule on the
   page; it marks the one write action). Three rows:
   - *Item picker*: two `<label>` radio rows side by side (gap 16), each 96px tall,
     padding 14/16, 1px `--rule` border, 4px radius, white. Selected = 2px ink left rule
     + `--sunk` background + 6px ink square in the radio slot. Right side of each row is
     a price stack: `from` 11px `--ink-3` above `$30.50` at 20px tabular 600.
   - *Terms row*: CSS grid `104px 152px 152px 120px minmax(160px,1fr)` gap 16, labels
     above controls, button right-aligned to the control baseline (40px tall).
   - *Helper*: one 11.5px line, max 96ch.
   Total 260px.
3. **In-flight ledger** — section head (title + count) then rows.
   Grid `minmax(0,1fr) 56px 84px 120px 156px 92px`, row height 64px, 1px bottom rule,
   2px transparent left rule that becomes the status hue on hover/focus and 3px on the
   row that needs the buyer. Row is a `<li><a>`; the anchor's stretched `::after` makes
   the whole row clickable and keyboard-focusable. Two lines: item name 15px/600 +
   SKU mono 11px; numbers right-aligned, price 17px tabular 600.
   Empty state: one 11.5px line, no illustration, no card.
4. **Right rail: deleted.** Catalogue lives inside the picker (that is what the catalogue
   is for); the account lives in the head meta; the recent list lives in the app rail.
   This is what removes the 53% dead canvas and the three stacked cards.

**Why it beats the current page:** the current page asks you to choose an item from a
native select that hides the catalogue, then shows a table whose only useful column is
the price, then fills the right third with information already stated in the topbar. The
new page makes the item a visible comparison (2 options, with price, supplier count,
delivery and spec), puts the four terms on one ruled line like a form, and spends the
rest of the page on the only thing the buyer returns for: what is in flight.

### 3.2 `/vendor` — Review desk

**Above the fold at 1440×900:** head (40–130), queue + offer review (150–690). Recent
decisions begin at ~730. Listing terms below.

```
┌ rail 208 ┬──────────────────────────────────────────────────────────────────────────┐
│          │ VENDOR CONSOLE                                  3 need a decision          │ 40
│          │ Review desk                                                              │ 64
│          │ Offers inside the supplier's review band wait here. Policy settles the    │ 92
│          │ rest.                                                                    │
│          │──────────────────────────────────────────────────────────────────────────│130
│          │ AWAITING DECISION                                              3 open    │
│          │ ┌─ 320 ─────────────────┐  ┌─ 776 ──────────────────────────────────────┐│
│          │ │ A4 Copy Paper, 80 gsm │  │ A4 Copy Paper, 80 gsm     PAP-A4-80  ●IN BAND│
│          │ │ $27.00            /un │  │ Meridian Office Goods · 5-day · 85 reliable ││
│          │ │ Meridian · floor $23  │  │                                             ││
│          │ │ ├──▮═══════╪───┤      │  │ OFFERED UNIT PRICE                          ││
│          │ │ 2m ago                │  │ $27.00 /unit                                ││
│          │ │───────────────────────│  │ 100 units · $2,700.00 total                 ││
│          │ │ A4 Copy Paper, 80 gsm │  │                                             ││
│          │ │ $27.00            /un │  │  floor   reject   ACCEPT      list          ││
│          │ │ Northwind · floor $24 │  │  $23.00  $25.00   $28.00      $30.50        ││
│          │ │ ├──▮═══════╪───┤      │  │  ├────────┬═════════┬───────────┤           ││
│          │ │ 2m ago                │  │            ▲ $27.00                         ││
│          │ │───────────────────────│  │ $1.00 over the reject floor, $1.00 under    ││
│          │ │ Nitrile Gloves, Medium│  │ the accept floor.                           ││
│          │ │ $30.50            /un │  │                                             ││
│          │ │ Atlas · floor $26.00  │  │ QUANTITY 100   BUYER Acme   DELIVERY 5 days ││
│          │ │ ├──▮═══════╪───┤      │  │ RELIABILITY 85 DEADLINE 31 Oct  FILED 19:21 ││
│          │ │ 2m ago                │  │─────────────────────────────────────────────││
│          │ └───────────────────────┘  │ DECISION                                    ││
│          │                            │ ┌──────────┬────────┬────────────────────┐  ││
│          │                            │ │ Accept   │ Reject │ Counter $25.00 →   │  ││
│          │                            │ │ at $27.00│        │ [Send counter]     │  ││
│          │                            │ │Locks     │Ends it │Floor $23.00        │  ││
│          │                            │ │$2,700.00 │no deal │                    │  ││
│          │                            │ └──────────┴────────┴────────────────────┘  ││
│          │                            └────────────────────────────────────────────┘│
│          │ RECENT DECISIONS                                              7 shown    │
│          │ ● Accepted  A4 Copy Paper · Meridian      $27.00      24 Oct 19:21       │
│          │ ● Declined  A4 Copy Paper · Atlas         $30.50      24 Oct 19:21       │
│          │ LISTING TERMS                                          5 listings        │
│          │ Meridian Office Goods  A4 Copy Paper   list $30.50  floor $23.00  …      │
└──────────┴──────────────────────────────────────────────────────────────────────────┘
```

Regions and dimensions:

1. **Page head** — eyebrow "VENDOR CONSOLE", H1, sub line 13px. Right side: "3 need a
   decision" in `--waiting` with a waiting square (not a pill, not a KPI tile).
2. **Queue** — 320px fixed column, one 88px row per pending offer, 1px rules, selected
   row = 2px ink left rule + `--sunk`. Each row: item name 15/600 + offered price
   17/600 right; "supplier · floor $23.00" 11.5px; then a **3px band strip** (the same
   geometry as the detail's band, miniature) so triage happens in the list; then age.
   Rows are links to `?offer={id}` (server-side selection, no client JS).
3. **Offer review** — 776px column, no card:
   - Header row: item 22px/600 + SKU mono + status mark right.
   - Price block: label "OFFERED UNIT PRICE", `$27.00` at 44px/1.02/600/-0.035em with
     `/unit` 13px, then "100 units · $2,700.00 total" 11.5px.
   - **Policy band instrument** (§4.3) + one computed sentence.
   - Meta grid: 3 columns × 2 rows, label 11px above value 13px, 1px top rule.
   - **Decision block**: three equal columns separated by 1px vertical rules; each has a
     label, a control, and a consequence line at 11.5px. Accept = primary ink button;
     Reject = secondary outline; Counter = input + secondary button.
4. **Recent decisions** — ruled list, not a table: grid `92px 1fr 120px 132px`, 36px rows,
   decision word with status mark, item · supplier, price, time. 12 rows max (query cap).
5. **Listing terms** — 5 rows, 64px each, grid `minmax(0,1fr) 96px 96px 1fr 132px 150px`:
   supplier + item, list, floor, policy sentence, terms version (mono), quiet
   "Simulate repricing" text button. Section helper explains the gate in one sentence.

**Why it beats the current page:** the current page answers "how many" four times
(KPI tiles), then shows three bars whose only shared scale is list price — the vendor
still has to do the subtraction to know whether an offer is comfortable. The band puts
the offer *inside* the policy geometry, states the distance in words, and the decision
sits directly under it with its consequence spelled out. The queue keeps its band strips,
so triage no longer requires opening every offer.

### 3.3 `/negotiation/[id]` — Buyer transcript

**Above the fold at 1440×900:** head (40–150), price lanes (180–470), transcript head +
3 rows (500–700); rail: deal (180–390) + order gate (410–690).

```
┌ rail 208 ┬──────────────────────────────────────────────────────────────────────────┐
│          │ BUYER · PAP-A4-80                                    ● AWAITING VENDOR    │ 40
│          │ A4 Copy Paper, 80 gsm                                                    │ 64
│          │ Acme Facilities Group · 100 units · spec-2026.1                          │ 96
│          │ target $27.00/unit · budget $4,000.00 ($40.00/unit) · due 31 Oct 2026     │112
│          │──────────────────────────────────────────────────────────────────────────│150
│          │ ROUNDS            3 suppliers · 2 rounds │ DEAL                            │
│          │ ┌──────────────────────────────────────┐ │ $27.00 /unit                   │
│          │ │            │      │target│            │ │ Meridian Office Goods          │
│          │ │ Meridian   │●─────●─────┼──○          │ │ ───────────────────────────    │
│          │ │ 85 · 5-day │R1    R2    │  list       │ │ QUANTITY           100 units   │
│          │ │────────────┼────────────┼─────────────│ │ TOTAL            $2,700.00     │
│          │ │ Northwind  │●───────────┼──○          │ │ DELIVERY            5 days     │
│          │ │ 92 · 3-day │R1          │  list       │ │ RELIABILITY        85 / 100    │
│          │ │────────────┼────────────┼─────────────│ │ ───────────────────────────    │
│          │ │ Atlas      │●────●──────┼──○          │ │ ORDER          ● Awaiting auth │
│          │ │ 78 · 2-day │R1   R2     │  list       │ │ ① Agreed      24 Oct 19:21  ✓  │
│          │ └──────────────────────────────────────┘ │ ② Authorize  [Authorize →]     │
│          │ TRANSCRIPT                    5 offers   │ ③ Confirm    after authorize   │
│          │ 19:21  Meridian   R1  $27.00  ● Awaiting vendor                           │
│          │ 19:21  Northwind  R1  $27.00  ● Awaiting vendor                           │
│          │ 19:21  Atlas      R1  $27.00  ○ Declined                                  │
│          │ 19:21  Atlas      R2  $30.50  ● Awaiting vendor                           │
└──────────┴──────────────────────────────────────────────────────────────────────────┘
```

Regions and dimensions:

1. **Page head** — eyebrow "BUYER · {SKU}", H1 item name 26px/600, two meta lines
   (identity/quantity/spec, then target/budget/per-unit ceiling/due/filed), status mark
   top-right. 110px.
2. **Conditional strip** (below head, full width, 0 or 1 of these):
   - *Blocked strip* (§4.4) — 2px `--blocked` left rule, `--blocked-wash` background,
     headline 15/600, 3-column old→new table, actions right.
   - *Counter strip* — 2px `--waiting` left rule, `--waiting-wash`, "Vendor counter-offer"
     label, `$30.50` at 30px, total, primary "Accept $30.50".
   These sit above the grid because they are the page's news, not a detail.
3. **Main grid** — `minmax(0,1fr) 376px`, gap 40. Left = Rounds + Transcript; right =
   Deal + Order, `position: sticky; top: 40px`.
4. **Price lanes** (left, 260px tall) — the signature instrument, §4.2.
5. **Transcript** — a real `<table>`, 40px rows, grid-equivalent columns
   `56px 132px 48px 96px 1fr`: time (mono 11), supplier 13/500, round label 11 `--ink-3`,
   price 13 tabular, decision + buyer-facing note 12 `--ink-2`. Grouped in chronological
   order (that is what a transcript is).
6. **Deal rail** — 200px: `$27.00` 34px tabular, `/unit` 13, supplier name, 4 label/value
   rows with 1px rules. If no accepted offer: "No price agreed yet." + 13px line.
7. **Order rail** — the gate, §4.5.

**Why it beats the current page:** the current page puts a supplier×round spreadsheet in
a 2/3 column, then leaves 475px of nothing below it, and hides the page's actual state
(blocked) in a 12px list in the corner. The new page spends the whole left column on the
one question that matters — *where did each supplier move, relative to my target* — and
puts the state machine where the eye goes last: the right rail, as three numbered steps.

---

## 4. Information presentation

### 4.1 Money, quantity, identifiers

- Money is always `formatMoney(minor, currency)` from `src/lib/format.ts` — never a
  recomputed string. Rendered in the display face with `font-variant-numeric:
  tabular-nums`, weight 600 for headline values, 400/500 in prose.
- Money gets four sizes and no others: **44** (vendor offered price), **34** (deal price
  in the negotiation rail), **22** (order total, block-strip new values), **17** (row
  price in the ledger/queue), **13** (inline in transcript and prose).
- Quantity always carries its unit: "100 units". Never a bare "100" in a money context.
- Identifiers — SKU, spec version, terms version, timestamps, negotiation id — are the
  **only** things set in IBM Plex Mono, at 11px/1.3 with +0.01em. This is the rule that
  stops the app reading like a developer console (today money is mono too:
  `globals.css:550-554`).
- Currency is stated once per page, in the head meta, and never repeated per row.

### 4.2 The core information-design problem: rounds × suppliers

The current matrix (`rounds-matrix.tsx`) puts round number on the x-axis and supplier on
the y-axis, so cells are mostly empty and the reader must mentally join prices across
columns to see movement. The negotiation's real shape is *price over time, per supplier,
against my target* — so the axis must be **price**, and the rows must be **suppliers**.

**Price lanes** (buyer, `/negotiation/[id]`):

- One shared horizontal scale for all suppliers. Domain `lo = min(target, every offer
  price)`, `hi = max(every list price)`, padded 6% each side, snapped to whole cents. If
  `lo === hi`, expand by ±5%.
- Each supplier is a 56px lane: left 168px block (name 13/600, "85 · 5-day" 11.5
  `--ink-3`, "list $30.50" 11 `--ink-3`), then the plot.
- One vertical **target rule** at `targetUnitPriceMinor` across the whole plot, 1px dashed
  `--rule-strong`, labelled above in 10.5px uppercase `--ink-3` ("TARGET $27.00"),
  label anchored left when x < 8% or right when x > 92%.
- Each offer is a 9px dot on the lane's 1px baseline: filled `--ink` = accepted, hollow
  (1.5px `--ink` ring, canvas fill) = declined/rejected, `--waiting` = pending/awaiting
  vendor, `--ink-3` = superseded. Price label 11px tabular above the dot; round tag
  "R1" 10px `--ink-3` below. When two dots are within 44px, the second label flips below
  its dot (deterministic, decided in JSX).
- The recommended supplier's lane gets a 2px `--agreed` left rule, `RECOMMENDED` 10.5px
  uppercase in `--agreed` under the name, and its accepted dot gets a 2px `--agreed` ring.
- Axis end labels only: `lo` left, `hi` right, 10.5px `--ink-3`. No tick ladder — fewer
  numbers, cleaner read.
- The lane graphics are `aria-hidden`; the transcript table is the text alternative, and
  the section carries a one-line caption: "Each dot is one offer. The dashed line is your
  target."

Why this reads at a glance: distance-to-target is horizontal distance; direction of
movement is left→right; agreement is fill; supplier quality is in the row label. No
legend needed beyond the caption because the shapes are one per state.

### 4.3 The vendor problem: offered price vs floor vs policy

The vendor must answer "is this offer comfortable?" in under a second. Three absolute
bars (current) cannot: they share only the list price as a scale and require mental
subtraction.

**Policy band instrument** (`/vendor`, detail + miniature in queue):

- One horizontal track, 8px tall, domain `lo = floor × 0.9` (rounded down to the cent),
  `hi = listPriceMinor`.
- Three flat zones: below `autoRejectBelowMinor` = `--sunk`; between the two thresholds
  (the review band) = `--waiting-wash` with 1px `--waiting` top/bottom rules; at/above
  `autoAcceptFloorMinor` = `--agreed-wash`.
- Markers on the track: floor = 1px `--ink-3` tick (full height + 4px); reject/accept
  boundaries are the zone edges, labelled under the track; **offer = 3px × 18px `--ink`
  bar with the value above it** (that is the thing being decided).
- Labels row under the track, positioned at each marker's x, 10.5px: `floor $23.00`,
  `review $25.00–$28.00`, `list $30.50`. Values come from the listing, so they are true
  per row.
- One computed caption sentence (arithmetic on vendor-only fields):
  - in band: "Offer sits $1.00 over the reject floor and $1.00 under the accept floor."
  - above accept: "Offer clears the accept floor by $1.00 — policy would have accepted
    this without you."
  - below reject: "Offer is $2.00 under the reject floor — policy would have declined this."
- Miniature in the queue: same geometry at 3px tall, no labels, 96px wide, so the list
  itself is triageable.

### 4.4 Blocked order: old vs new, instantly

`blockReason` is a display string, so the block report is a parser plus a table, not new
data. `parseBlockReason()` lives in `src/components/status.ts` (my file): split on `"; "`,
split each on `" → "`, strip the known label prefixes (`list price`, `delivery`,
`item spec`, `terms`), return `{label, from, to}[]`; anything unparsed falls back to
`{label: "", from: line, to: ""}` and renders as a single line. Never drop a line.

Presentation — a full-width strip directly under the page head:

```
▌ BLOCKED AT CONFIRMATION
▌ The listing changed after you authorized. Nothing was charged, and the
▌ agreed price is void.
▌
▌ TERM          AT AGREEMENT        NOW
▌ List price    $7.80           →   $8.97
▌ Terms         AT-terms-2026.04 → AT-terms-2026.04-R1
▌
▌ [Raise a new requisition]                    [Buyer record] → (quiet)
```

- 2px `--blocked` left rule, `--blocked-wash` background, 20px padding.
- Label 11px uppercase `--blocked`; headline 15px/600 `--ink`; body 13px `--ink-2`.
- The table: 3 columns `120px 1fr 1fr`; header 10.5px uppercase `--ink-3`; values
  tabular; **from** in `--ink-3`, arrow `→` in `--ink-3`, **to** in `--ink` 600 at 15px.
  The "now" column is the largest type in the strip so the new state wins the scan.
- The gate in the rail then reads "Blocked at confirmation" with the same 2px rule, no
  duplicate table (the strip is the single place old→new appears).

### 4.5 Order gate

A 3-step rail, not a card with a status pill:

```
① AGREED       24 Oct 19:21   ✓   (ink number in a filled square)
② AUTHORIZE    [ Authorize purchase ]           ← active step
③ CONFIRM      Opens after you authorize        (muted)
```

- Step number: 20px square, 1px `--rule-strong` border, 11px 600; completed = filled
  `--ink`, white numeral, `✓` after the title; active = 2px ink border + button.
- Titles 13/600; details 11.5 `--ink-3`; 1px rules between steps.
- State → content mapping (exhaustive, from `orderStatus`/`negotiationStatus`):
  - no order, negotiation `AWAITING_VENDOR`: step 1 detail "Waiting on the vendor desk",
    quiet link "Open review desk →".
  - no order, `REJECTED`: "No supplier accepted a price inside the budget. Nothing was
    ordered." + secondary "New requisition".
  - `AWAITING_AUTHORIZATION`, not authorized: steps 1 ✓, 2 active with primary
    "Authorize purchase", 3 muted. Under it: "Authorization records your approval.
    Confirmation is a separate step against live terms."
  - authorized: step 2 ✓, 3 active with primary "Confirm order", note "Confirming
    re-reads the live listing. If a term changed, the order blocks instead of
    confirming."
  - `CONFIRMED`: all ✓, total 22px, "Confirmed 24 Oct, 19:12. The purchase is complete in
    this demo — no payment was processed." + secondary "Raise another requisition".
  - `BLOCKED`: step 3 shown as failed (oxblood square), no table (the strip owns it),
    secondary "Raise a new requisition".
- The active button is the only filled ink control on the page. There is exactly one
  filled button per screen.

### 4.6 Status language

Status is **typographic**: a 6px square in the tone colour + the word in 11px/600
uppercase +0.08em, colour = tone. No filled pastel chips anywhere (today: `.pill--green`
etc. with background fills, `globals.css:391-430`).

| Tone | Ink | Wash | Used for |
|---|---|---|---|
| neutral | `--ink-2` | `--sunk` | Open, Cancelled, superseded |
| waiting | `--waiting` #8A5A12 | `--waiting-wash` | Awaiting vendor, Pending, In band, Counter-offer |
| agreed | `--agreed` #2E5C3C | `--agreed-wash` | Agreed, Authorized, Confirmed, Accepted |
| blocked | `--blocked` #9A2B21 | `--blocked-wash` | Blocked, Declined, Rejected, No deal |

Washes are only used for full-width state surfaces (block strip, counter strip, band
zones, selected row) — never for inline labels, never as a chip. Every status is a word;
colour never carries meaning alone.

### 4.7 Terms and policy

- Terms version (`AT-terms-2026.04`) is mono 11px `--ink-2`; when it changes, the block
  strip shows both versions.
- Policy is a **sentence**, not two columns: "accept ≥ $28.00 · reject < $25.00" on the
  listing row, with the actual numbers. Vendor-only, never on buyer pages.
- Round count is "2 rounds" (max round observed). Never "R2/3": a vendor counter can
  push a negotiation past the engine's 3-round buyer cap
  (`negotiation-service.ts:248-253`), so a fixed denominator would lie.

---

## 5. Visual system

Implementable in Tailwind v4: tokens in `@theme`, component classes in plain CSS in
`src/app/globals.css` (the current file's approach), layout in JSX utilities. No new
dependencies. Fonts via `next/font/google` (already used).

### 5.1 Type

Faces: **Archivo** (display + body; weights 400/500/600/700, `--font-archivo`) and
**IBM Plex Mono** (identifiers only; 400/500). Archivo replaces Inter: same legibility at
small sizes, more character at display sizes (flat terminals, tighter apertures, a
slightly condensed cut that lets 44px numbers sit in a 320px rail). Fallback if the build
cannot fetch it: keep Inter, everything else in this plan is unchanged.
`font-variant-numeric: tabular-nums` on every money/number element.

| Class | Size / line-height | Weight | Tracking | Face | Where |
|---|---|---|---|---|---|
| `.t-hero` | 44 / 1.02 | 600 | −0.035em | display | vendor offered price |
| `.t-display` | 34 / 1.05 | 600 | −0.03em | display | deal price in rail |
| `.t-h1` | 26 / 1.15 | 600 | −0.025em | display | negotiation item name |
| `.t-h1-sm` | 24 / 1.2 | 600 | −0.02em | display | `/` and `/vendor` H1 |
| `.t-h2` | 22 / 1.2 | 600 | −0.02em | display | vendor offer item name |
| `.t-h3` | 15 / 1.3 | 600 | −0.01em | display | ledger item name, step titles |
| `.t-body` | 13 / 1.55 | 400 | 0 | body | paragraphs, gate copy |
| `.t-row` | 13 / 1.4 | 400 | 0 | body | transcript, meta values |
| `.t-label` | 11 / 1.2 | 600 | +0.08em | body | uppercase: eyebrows, column heads, field labels |
| `.t-meta` | 11.5 / 1.4 | 400 | 0 | body | secondary meta, helper lines |
| `.t-micro` | 10.5 / 1.2 | 600 | +0.06em | body | axis labels, band labels |
| `.t-id` | 11 / 1.3 | 400 | +0.01em | mono | SKU, spec, terms, timestamps |
| `.t-money-row` | 17 / 1.15 | 600 | −0.02em | display tabular | ledger price, queue price |
| `.t-money-lg` | 22 / 1.1 | 600 | −0.02em | display tabular | order total, block "now" |

Rules: three text inks only (`--ink`, `--ink-2`, `--ink-3`); no 14/16px sizes exist; no
weight below 400; no italics; no letter-spacing on lowercase; uppercase is only ever
`.t-label`/`.t-micro`.

### 5.2 Colour tokens (exact)

```css
@theme {
  --color-canvas:       #FAF9F6;  /* page ground */
  --color-rail:         #F2F0EA;  /* left rail, sunk tracks, hover */
  --color-surface:      #FFFFFF;  /* inputs, item-picker rows */
  --color-sunk:         #F2F0EA;
  --color-ink:          #1A1917;  /* primary text, primary button, markers */
  --color-ink-2:        #56524A;  /* secondary text */
  --color-ink-3:        #6E6A61;  /* labels, meta (5.2:1 on canvas) */
  --color-rule:         #E3DFD6;
  --color-rule-strong:  #C8C3B7;
  --color-agreed:       #2E5C3C;  /* 7.5:1 */
  --color-waiting:      #8A5A12;  /* 5.7:1 */
  --color-blocked:      #9A2B21;  /* 7.4:1 */
  --color-agreed-wash:  #EEF3EC;
  --color-waiting-wash: #F7F1E4;
  --color-blocked-wash: #F9EDEA;
  --color-focus:        #1A1917;
}
```

Usage rules: chromatic ink is **only** status. The primary button is `--ink`. There is no
brand colour. Washes are only full-bleed state surfaces. No token is ever used at an
opacity below 1 except disabled controls (0.45).

### 5.3 Spacing, radii, borders, elevation

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 56, 72. Page padding 40/48; section gap 40;
  section head height 40; section body 20 0; field gap 16; row padding 0.
- Radii: `--radius-control: 4px` (buttons, inputs, item rows, band track, block strip).
  `--radius-panel: 0`. Status squares 0. Nothing else is rounded; `999px` is banned.
- Borders: 1px `--rule` for all separators; 1px `--rule-strong` for input borders and
  track edges; 1px `--ink` only as the composer's top rule; 2px tone rules only on state
  surfaces (blocked strip, counter strip, selected rows, completed steps).
- Elevation: **none**. `box-shadow` is used only for the focus ring. No sticky header
  shadow — the rail uses `border-right`, the sticky rail column uses a 1px left rule.

### 5.4 Density

| Element | Height | Notes |
|---|---|---|
| Section head | 40 | title left, count right |
| Ledger row (`/`) | 64 | 2 lines |
| Queue row (`/vendor`) | 88 | 3 lines + mini band |
| Price lane | 56 | name block + plot |
| Transcript row | 40 | 1 line |
| Recent decision row | 36 | 1 line |
| Listing term row | 64 | 2 lines |
| Step row (gate) | 64 | number + title + detail/action |
| Field | label 16 + control 40 = 62 | |
| Button | 40 (32 compact, 44 on mobile) | |
| Item picker row | 96 | |

### 5.5 Controls

- **Primary**: 40px, `--ink` fill, `#FFFFFF` text 13/600, radius 4, padding 0 18; hover
  `#2A2824`; active `#000`; focus `outline: 2px solid var(--color-focus); outline-offset: 2px`.
  One per screen, maximum.
- **Secondary**: 40px, transparent, 1px `--rule-strong`, `--ink` text; hover `--sunk`.
- **Quiet**: 32px, no border, `--ink-2`; hover `--ink` + `text-decoration: underline`,
  `text-underline-offset: 3px`. Used for row actions ("Simulate repricing") and links.
- **Danger-quiet**: 40px, 1px `--rule-strong`, `--blocked` text; hover `--blocked-wash`.
  Used only for Reject — never a filled red button.
- **Disabled**: opacity 0.45, `cursor: not-allowed`, no hover change.
- **Inputs**: 40px, 1px `--rule-strong`, radius 4, `--surface` bg, 13px `--ink`,
  padding 0 10 (22 when a currency prefix is present). Hover border `--ink-3`. Focus
  `border-color: --ink` + `outline: 2px solid --ink; outline-offset: 1px`. No placeholder
  as label; every control has a visible `<label>`.
- **Selects**: none. Any option set of ≤6 renders as radio rows; anything numeric is an
  input with a suffix (`days`) or prefix (`$`).
- **Status mark**: 6×6 square + 8px gap + `.t-label` text. `quiet` variant keeps the
  square in tone and the word in `--ink-2`.

### 5.6 Motion

One beat, CSS-only, 220ms `cubic-bezier(.2,.7,.3,1)`: sections rise 4px and fade in with
a 30ms stagger on load (`nth-of-type` delays up to 4). Hover/focus transitions 120ms
colour only. No infinite animation, no parallax, no counters ticking. All of it is
disabled under `prefers-reduced-motion: reduce`. Rationale: the page should *settle*, not
perform — the content is the point.

---

## 6. Components inventory

Server components unless marked **client**. All props are plain serializable data.

| Component | File | Props | States | Pages |
|---|---|---|---|---|
| `AppRail` | `shell/app-rail.tsx` | `recent: {id, sku, state, tone}[]` | default, active item, empty recent | all |
| `RailNav` **client** | `shell/rail-nav.tsx` | none | default, hover, active (`aria-current`) | all |
| `MobileBar` **client** | `shell/mobile-bar.tsx` | none | default, active | all `<768` |
| `PageHead` | `shell/page-head.tsx` | `eyebrow, title, meta?: string[], right?: ReactNode` | default | all |
| `SectionHead` | `shell/section-head.tsx` | `title, count?, aside?` | default | all |
| `StatusMark` | `primitives/status-mark.tsx` | `status: {label, tone}`, `quiet?` | 4 tones × quiet | all |
| `NoticeStrip` | `primitives/notice-strip.tsx` | `error?, notice?` | error (role=alert), notice (role=status), none | all |
| `EmptyLine` | `primitives/empty-line.tsx` | `children` | default | all |
| `ItemPicker` | `buyer/item-picker.tsx` | `items: StorefrontItem[]`, `selectedId` | selected, unselected, hover, focus, empty (no items) | `/` |
| `RequisitionForm` | `buyer/requisition-form.tsx` | `buyer, items` | default, invalid (server error via strip) | `/` |
| `InFlightLedger` | `buyer/in-flight-ledger.tsx` | `rows: LedgerRow[]` | default, hover, focus, empty, needs-you row | `/` |
| `PriceLanes` | `negotiation/price-lanes.tsx` | `rounds, target, currency, recommendedOfferId` | agreed/pending/declined/superseded dots, single-supplier, all-same-price | `/negotiation` |
| `Transcript` | `negotiation/transcript.tsx` | `rows: {time, supplier, round, price, decision, note}[]` | default, empty (never), long (scrolls) | `/negotiation` |
| `DealSummary` | `negotiation/deal-summary.tsx` | `detail, currency, recommended` | agreed, provisional, empty | `/negotiation` |
| `OrderGate` | `negotiation/order-gate.tsx` | `detail, currency` | 6 states (§4.5) | `/negotiation` |
| `BlockReport` | `negotiation/block-report.tsx` | `blockReason, orderId` | 1–4 rows, unparsed fallback | `/negotiation` |
| `CounterStrip` | `negotiation/counter-strip.tsx` | `negotiationId, offerId, unitPriceMinor, quantity, currency` | default | `/negotiation` |
| `VendorQueue` | `vendor/vendor-queue.tsx` | `offers, selectedId, now` | default, selected, hover, focus, empty | `/vendor` |
| `BandMeter` | `vendor/band-meter.tsx` | `list, floor, reject, accept, offer, size: "full" \| "mini"` | full, mini, out-of-band | `/vendor` |
| `OfferReview` | `vendor/offer-review.tsx` | `offer` | default | `/vendor` |
| `DecisionBlock` | `vendor/decision-block.tsx` | `offer` | accept/reject/counter columns, hover, focus, error (strip) | `/vendor` |
| `DecisionsLog` | `vendor/decisions-log.tsx` | `offers` | default, empty | `/vendor` |
| `ListingTerms` | `vendor/listing-terms.tsx` | `listings` | default, empty | `/vendor` |
| `PolicyNote` | `vendor/policy-note.tsx` | none | default | `/vendor` |

Helpers in `src/components/status.ts` (mine): `negotiationStatus`, `orderStatus`,
`headlineStatus`, `offerDecision`, `isVendorCounter`, `buyerOfferNote` (keep, they are
good), plus **new**: `parseBlockReason`, `bandPosition(list, floor, reject, accept, offer)`
→ `{lo, hi, pct(n)}`, `laneScale(offers, target, lists)` → `{lo, hi, pct(n)}`,
`bandCaption(...)`.

Loading states: the only async shell piece is the rail's recent list — it keeps the
existing `<Suspense>` + skeleton rows pattern (`sidebar-recent.tsx` fallback), restyled.
Forms have no client pending state (server actions redirect); feedback is the notice
strip on the next render. That is honest — no fake spinner.

Error states: server `?error=` strings render verbatim in `NoticeStrip` with the label
"That didn't work". `?notice=` renders with "Done". `notFound()` unchanged.

---

## 7. Copy

Voice: plain, declarative, present tense, second person only for instructions. No
exclamation marks, no "seamless", no "AI-powered", no invented metrics. Numbers are real.

### `/`

- Eyebrow: `Buyer workspace`
- H1: `Requisition`
- Meta: `Acme Facilities Group · cap $2,500.00 · USD`
- Head right: `3 in flight` / `3 in flight · 1 blocked` (only when >0 blocked)
- Section: `New requisition` — aside: `Sets the terms for every active supplier`
- Item label: `Item`
- Picker meta per item: `3 suppliers · 3-day delivery · spec-2026.1` and right stack
  `from` / `$30.50` (label `per unit` for screen readers)
- Fields: `Quantity`, `Target / unit`, `Budget cap`, `Deadline` (+ suffix `days`)
- Helper: `The cap covers the whole purchase, so the per-unit ceiling depends on quantity.
  Set the target under the lowest list price to make the agent work.`
- Submit: `Start negotiation`
- Section: `In flight` — aside: `2 open`
- Column heads: `Item`, `Qty`, `Rounds`, `Price`, `State`, `Filed`
- Row price when no offer yet: `—` + sr-only `No offer yet`
- Empty: `Nothing in flight. Raise a requisition above — the agent opens on every active
  listing at once.`

### `/vendor`

- Eyebrow: `Vendor console`; H1: `Review desk`
- Sub: `Offers inside the supplier's review band wait here. Policy settles everything
  outside it.`
- Head right: `3 need a decision` (waiting tone) / `Nothing waiting`
- Section: `Awaiting decision` — aside: `3 open`
- Queue row: item name; `$27.00` + `/unit`; `Meridian Office Goods · floor $23.00`;
  `2m ago`
- Detail: `Offered unit price`; `100 units · $2,700.00 total`
- Band caption (one of three, §4.3)
- Meta labels: `Quantity`, `Buyer`, `Delivery`, `Reliability`, `Deadline`, `Filed`
- Decision label: `Decision`
- Buttons: `Accept at $27.00`, `Reject`, `Send counter`
- Consequences: `Locks the deal at $2,700.00 total.` / `Ends this negotiation with no
  deal.` / `Floor $23.00 — a counter below it is refused.`
- Section: `Recent decisions` — aside: `7 shown`
- Section: `Listing terms` — aside: `5 listings`
- Section helper: `Repricing a listing bumps its terms revision. An order authorized
  before the change blocks at confirmation — that is how the blocked state is produced.`
- Policy text per row: `accept ≥ $28.00 · reject < $25.00`
- Row action: `Simulate repricing` (title attr: `Adds 15% to the list price and bumps the
  terms revision`)
- Empty queue: `Nothing needs you. Every offer in flight was settled by policy.`
- Empty decisions: `No decisions recorded yet.`

### `/negotiation/[id]`

- Eyebrow: `Buyer · PAP-A4-80`
- H1: `A4 Copy Paper, 80 gsm`
- Meta line 1: `Acme Facilities Group · 100 units · spec-2026.1`
- Meta line 2: `target $27.00/unit · budget $4,000.00 ($40.00/unit) · due 31 Oct 2026 ·
  filed 24 Oct, 19:21`
- Section: `Rounds` — aside: `3 suppliers · 2 rounds`; caption: `Each dot is one offer.
  The dashed line is your target.`
- Section: `Transcript` — aside: `5 offers`
- Rail: `Deal` (aside `Agreed` / `Provisional`), rows `Quantity`, `Total`, `Delivery`,
  `Reliability`
- Provisional deal: `No price agreed yet. The agent is still working the rounds.`
- Rail: `Order`; steps `Agreed`, `Authorize`, `Confirm`
- Gate copy per state: see §4.5
- Counter strip: label `Vendor counter-offer`; body `$30.50 per unit · $3,050.00 total.
  The vendor declined your last price and set this one.`; button `Accept $30.50`
- Block strip: label `Blocked at confirmation`; body `The listing changed after you
  authorized. Nothing was charged, and the agreed price is void.`; table heads
  `Term`, `At agreement`, `Now`; actions `Raise a new requisition`, `Buyer record`
- Buyer-facing offer notes come from `buyerOfferNote()` unchanged (it already avoids
  thresholds): `Supplier policy accepted this price automatically.`, `Supplier policy
  declined this price automatically.`, `Inside the supplier's review band — sent to the
  vendor desk.`, `Buyer counter sent — awaiting the vendor's decision.`, `Vendor
  counter-offer — awaiting your decision.`
- Errors (from server, rendered verbatim): `Target unit price must be a valid amount.`,
  `Deadline must be between 1 and 90 days.`, `Enter a valid counter price.`, `The counter
  is below the supplier's floor price.`

---

## 8. Responsive and accessibility

### Breakpoints

| Token | Width | Shell | `/` | `/vendor` | `/negotiation` |
|---|---|---|---|---|---|
| `xl` | ≥1280 | rail 208 | single column, 1136 max | queue 320 + review 1fr | lanes 1fr + rail 376 |
| `lg` | 1024–1279 | rail 176 | single column | queue 288 + review 1fr | lanes 1fr + rail 320 |
| `md` | 768–1023 | top bar 56 | single column | queue above review (queue first) | single column |
| `sm` | <768 | top bar 56 | stacked fields | **review first, queue second** | gate first |
| `xs` | <480 | top bar 56, 16px padding | 1-col fields | same | same |

### 390px stacking order (explicit)

`/` → head → composer (item rows stacked full width, fields 1 per row: Quantity, Target,
Budget cap, Deadline, then full-width `Start negotiation`) → in-flight ledger (each row:
item name, then `100 units · 2 rounds · $27.00` on one line, then status + filed on the
next; 88px rows, no horizontal scroll) → nothing else.

`/vendor` → head → **offer review first** (selected offer, band, meta, decision block with
the three actions stacked full-width) → queue (`3 open`, rows link to `?offer=`) → recent
decisions (stacked: decision word, item · supplier, price, time) → listing terms (each
listing as a 4-line block: supplier + item, `list $30.50 · floor $23.00`, policy sentence,
terms + full-width `Simulate repricing`).

`/negotiation/[id]` → head → block/counter strip → **Order gate** (the action) → Deal →
Rounds (lanes keep the plot; the name block drops to its own line above the lane so the
plot gets full width) → Transcript (table becomes stacked rows: `R1 · Meridian · $27.00`
then the decision + note).

Rationale for detail-before-queue on mobile: selection is a query param, so the page
re-renders with the chosen offer; putting the review first means the tap lands on the
thing you can act on, not on a list you already chose from.

### Accessibility

- Landmarks: `<aside aria-label="Workspaces">`, `<nav aria-label="Workspaces">`,
  `<main id="desk">` (skip link kept from `layout.tsx:42-47`), one `<h1>` per page, `<h2>`
  per section, `<h3>` for rail blocks.
- Contrast targets: body text ≥7:1 (`--ink`, `--ink-2`), labels/meta ≥4.5:1 (`--ink-3`
  measured 5.2:1 on canvas), status inks 5.7–7.5:1, focus ring `--ink` 16:1.
- Colour is never the only signal: every status has its word; every dot has a price and
  round label; the band's zones are labelled with values.
- Keyboard: all rows are links or buttons (no click-only divs). Focus is visible on
  everything (`:focus-visible` 2px ink outline, offset 2). Tab order follows visual order;
  the mobile bar comes before main content; the skip link jumps to `#desk`.
- The price-lane and band graphics are `aria-hidden="true"`; the transcript table and the
  band's caption sentence carry the same information in text.
- The item picker is a fieldset of native radios inside `<label>` rows — arrow-key
  navigation and screen-reader grouping work without JS.
- Touch targets: 44px minimum on `<768` (buttons 44, row links 88, field 44); 8px minimum
  gap between adjacent targets.
- Tables: real `<table>` with `<th scope="col">` for the transcript and listing terms;
  ledger/queue/log lists use `<ul>`/`<li>` with `<a>` and sr-only column labels.
- Forms: every input has a `<label for>`; errors come back from the server and are
  announced by the `role="alert"` strip; `required`, `min`, `max`, `inputMode` preserved
  from the current markup.
- `prefers-reduced-motion`: entrance animation off; no transitions over 120ms.
- No horizontal scrolling at any width; no `min-w-[...]` table (today:
  `rounds-matrix.tsx:22`, `open-negotiations.tsx:35`).

---

## 9. What NOT to do (and the rule that prevents it)

| Trap | Why it is wrong here | Rule |
|---|---|---|
| KPI tiles (4 equal number boxes) | They answer no question; the vendor needs a comparison, not a count. Current: `vendor/page.tsx:51-83`. | A number may only appear alone if it is a **position** (dot on a lane, marker on a band) or is followed by the word that qualifies it. No `.kpi` component exists. |
| Card soup (white boxes on grey) | It is the current generic look; containers add padding instead of information. | Sections are separated by 1px rules only. A surface may be tinted **only** to mark a state (blocked, counter, selected). `--radius-panel: 0`. |
| Duplicated account/budget | Currently printed in topbar chip and Account card (`page-header.tsx:38-53`, `account-card.tsx:29-33`). | Account facts appear exactly once per page, in the page-head meta line. Never in the rail, never on `/vendor`. |
| Hero marketing copy | This is a tool, not a landing page. | H1 is a workspace name of ≤2 words. The only sentence under it is the sub line, ≤22 words, describing the page's job. |
| Native unstyled `<select>` | Hides the catalogue and looks like a form generator. Current: `requisition-form.tsx:40-60`. | Option sets ≤6 render as radio rows. No `<select>` in the codebase. |
| Decorative icons / icon library | No icon dependency exists; glyphs would be invented. | Only `→`, `·`, `✓` and the status square are allowed. No SVG icons. |
| Oversized empty canvas | 475px (53% of the viewport) is empty on the current negotiation page. | Every page's content column must fill ≥70% of 1440×900 without scrolling. If it does not, add information or density — never filler. |
| Mono everywhere | Makes money read like code. Current: `.table__mono`, `.price-lg` etc. | Mono is reserved for identifiers (SKU, spec, terms, timestamps, ids). Money uses the display face with tabular figures. |
| Pastel status pills | The single strongest "AI dashboard" tell. Current: `.pill--green/amber/red` fills. | Status = 6px square + uppercase word. Fill only for state surfaces, never inline. |
| Three bars scaled to list price | Requires mental subtraction; hides the band. Current: `offer-detail.tsx:22-46`. | One shared scale per instrument, with the decision threshold drawn as geometry. |
| Gradient / glass / glow / shadow | Banned by the human; also reads as costume. | `box-shadow` only for the focus ring; no `linear-gradient` anywhere; no backdrop-filter. |
| Fake telemetry ("live", "AI thinking", spinners) | There is no such data; the engine is deterministic. | Only real timestamps, real states, real counts. No pending spinner (server actions redirect). |
| Hiding the primary action below the fold on mobile | Current: vendor actions sit under all queue rows at 390. | On `<768`, the action precedes the record on every page. |
| Tables that scroll horizontally | Current: rounds matrix, listings table. | Every data table has a stacked representation below 768; `min-width` on tables is banned. |
| Six levels of grey | Current file has `ink`, `ink-soft`, `ink-faint`, plus 5 ad-hoc greys. | Exactly three text inks. A fourth needs a new token and a reason. |

---

## 10. Implementation order

Each step ends with the app building and rendering; no step leaves a page broken for more
than its own scope.

1. **Foundation** — rewrite `src/app/globals.css` (tokens, type classes, primitives:
   buttons, inputs, status mark, section head, strips, ledger rows) and `src/app/layout.tsx`
   (Archivo + Plex Mono, rail, mobile bar, skip link). Add `shell/app-rail.tsx`,
   `shell/rail-nav.tsx`, `shell/mobile-bar.tsx`, `shell/page-head.tsx`,
   `shell/section-head.tsx`, `primitives/*`. Existing pages keep working because the old
   class names are kept as aliases in this step (`.card`, `.table`, `.btn` etc. redefined
   on the new tokens), so nothing is visually orphaned mid-build.
2. **Buyer page** — `buyer/item-picker.tsx`, rewrite `requisition-form.tsx` (same field
   names: `itemId`, `quantity`, `targetPrice`, `budgetCap`, `deadlineDays`),
   `buyer/in-flight-ledger.tsx`, rewrite `src/app/page.tsx`. Verify: submit creates a
   negotiation and lands on `/negotiation/[id]`; empty state with 0 rows.
3. **Negotiation page** — `negotiation/price-lanes.tsx`, `transcript.tsx`,
   `deal-summary.tsx`, `order-gate.tsx`, `block-report.tsx`, `counter-strip.tsx`; rewrite
   the page (keep `connection()`, `instant = false`, `recommendDeal`, `isVendorCounter`,
   `buyerOfferNote`). Verify all four states: awaiting vendor, agreed → authorized →
   confirmed, blocked, rejected.
4. **Vendor page** — `vendor/band-meter.tsx`, `vendor-queue.tsx`, `offer-review.tsx`,
   `decision-block.tsx`, `decisions-log.tsx`, `listing-terms.tsx`, `policy-note.tsx`;
   rewrite the page (keep `?offer=` selection, `isVendorCounter` filtering, all five
   actions and their hidden field names). Verify accept / reject / counter / reprice.
5. **Responsive + a11y pass** — 390 and 768 layouts, focus rings, landmarks, sr-only
   labels, `prefers-reduced-motion`, no horizontal scroll.
6. **Cleanup + verification** — delete the dead components (`page-header`, `side-nav`,
   `sidebar-recent`, `account-card`, `catalogue-card`, `open-negotiations`,
   `rounds-matrix`, `deal-card`, `counter-banner`, `pending-list`, `offer-detail`,
   `decided-feed`, `listings-panel`, `band-legend`, old `ui.tsx`), remove dead CSS, then
   `npx tsc --noEmit`, `npm run build`, screenshots at 1440 and 390 of all three pages in
   their four key states into `_shots/design-*.png`.

**Open decision for the Lead (UI-only, reversible):** the composer's default target
becomes 85% of the lowest active list price for the default item (paper: $30.50 →
`25.93`) instead of the hard-coded `27.00`, so the default demo produces a real
negotiation (a counter round) instead of an instant auto-accept at list-adjacent prices.
It changes no server logic and no field names; say the word and I keep `27.00`.

**Demo data note:** two negotiations now exist from my inspection run — confirmed
`cmvmhw4390001cde0gftbh6xg`, blocked `cmvmhw471000dcde09k0ugpez` (block reason
`list price $7.80 → $8.97; terms AT-terms-2026.04 → AT-terms-2026.04-R1`). The listing
they touched was restored. Delete them if you want a clean ledger.
