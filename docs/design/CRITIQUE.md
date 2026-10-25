# CRITIQUE — round 1

**Overall judgement.** The plan is the first pass that answers the human's actual complaint instead of restyling it: it removes the admin chrome, kills the KPI tiles and pastel pills, and replaces the round matrix with two decision instruments that are specific to this product. That is the right direction and it is not merely different. But the thesis — "a statement, not a dashboard" — is only as good as the instruments, and on the seeded data both instruments are wrong: the policy band prints a sentence that is off by a dollar, the price lane's domain can invert or clip a legal offer, and the vendor wireframe invents an offer that does not exist. The negotiation wireframe also mixes two mutually exclusive states (awaiting vendor *and* an agreed order awaiting authorization), the confirmed state invents a timestamp the schema does not store, and the composer's new default turns the second item into a $25.93 instant accept on a $7.80 product. Those are not polish; they are the difference between a premium instrument and a confident-looking lie. Is a "statement" the right container? Yes — if the instruments are the content. No — if the statement becomes the subject, which is exactly what the human rejected twice. The plan's proof of "premium" is ASCII, not a render, so the direction is keepable but the execution is unproven until a style plate is on screen (M15). The plan is not approvable until the math, the state model, the data grounding, and the missing responsive/format decisions are fixed.

**Evidence base.** Read `docs/design/BRIEF.md` and all 874 lines of `docs/design/PLAN.md`; read the DTOs, engine, seed, actions, pages, components and `globals.css` cited below. Inspected the live app at 1440 via Playwright (my captures `_shots/critic-cur-home-1440.png`, `_shots/critic-cur-vendor-390.png`, `_shots/critic-cur-neg-390.png`) plus DOM measurements; also inspected the lead's `_shots/cur-*.png`. Every claim below is checked against the app or the file, not taken from the plan's own prose.

## Axis verdicts

| # | Axis | Verdict | Why |
|---|---|---|---|
| 1 | Fixes the real complaint | **PASS (direction) / UNPROVEN (execution)** | Kills the admin look and the generic cards; the instruments are the right kind of answer, but they are wrong on real data (B1–B3). |
| 2 | IA, page jobs, nav, duplication | **MOSTLY PASS** | Right page jobs, account duplication deleted, native select replaced; home loses the completed deal (M8), cross-surface links are incomplete/contradictory (M10). |
| 3 | Layout, wireframe concreteness, above-fold, 1440/390 | **FAIL** | The negotiation wireframe is a state mash-up (B6); 1024–1279 is unspecified and the vendor order flips between breakpoints (M2). |
| 4a | Price-lane encoding (round, price, decision, delivery, recommendation) | **FAIL** | Domain can invert/clip (B2); coincident dots, `COUNTERED`/superseded states, and the accepted/declined colours are under-defined or contradictory (M3). |
| 4b | Policy band (offered vs floor, understandable without legend) | **FAIL** | Caption arithmetic is false (B1); domain wastes 23% on impossible prices (B3); labels overflow/terminology conflates floors and thresholds (M4). |
| 4c | Blocked-order `blockReason` robustness | **PARTIAL** | Parser is the only in-scope option but the plan doesn't say so, and it mishandles the asymmetric delivery line (M14). |
| 5 | Visual system | **PASS on paper / UNPROVEN on screen** | Tokens, scale, contrast and no-chrome rules are coherent; the item picker breaks "no cards" (M5); no render (M15). |
| 6 | Components and states inventory | **PARTIAL** | Strong inventory, but missing the vendor→buyer link, `COUNTERED`, `OPEN`/`CANCELLED`, and a real confirmed timestamp (B5, M3, M10, m5). |
| 7 | Copy | **FAIL** | The band caption, confirmed timestamp and "inside the budget" line assert things the data doesn't say (B1, B5, m9); the rest is plain and good. |
| 8 | Responsive and a11y | **FAIL** | `lg` gap (M2), blocked strip doesn't fit 390 (M7), aria-hidden lanes drop per-supplier data (M11). |
| 9 | Implementability | **PASS** | Tailwind v4 + `globals.css`, no new deps, no invented data in the plan's own inventory; three decisions still needed (M1, M2, M14). |
| 10 | Scope discipline and order | **PASS with a condition** | The order/cleanup/server boundary are sane; add a rendered checkpoint before the full build (M15). |

## BLOCKERS

**B1. The policy-band caption is arithmetically false on the seeded offer.**
What's wrong: the wireframe labels `floor $23.00 · reject $25.00 · ACCEPT $28.00 · list $30.50` and captions the $27.00 offer "`$1.00 over the reject floor, $1.00 under the accept floor`" (`PLAN.md:209-214`). $27.00 − $25.00 = **$2.00**, not $1.00; $28.00 − $27.00 = $1.00. The caption is the band's only textual explanation, so the one sentence a vendor reads is wrong on the default demo data.
Evidence: `PLAN.md:209-214`; Meridian paper listing `listPriceMinor 3050 / floorPriceMinor 2300 / autoAcceptFloorMinor 2800 / autoRejectBelowMinor 2500` (`prisma/seed.ts:71-77`); the live `/vendor` detail shows the same numbers.
Required fix: compute both distances with `Math.abs` from the listing fields and `formatMoney`; rename to "reject line" / "accept line" (they are thresholds, not floors). Check the three seeded cases (in band, above accept, below reject) before calling §4.3 done.

**B2. The price-lane domain can invert or clip a legal offer.**
What's wrong: `lo = min(target, every offer price)`, `hi = max(every list price)` (`PLAN.md:354-356`). The composer permits a target above every list (e.g. $35.00); `initialBuyerOfferMinor = min(max(target, floor), budgetUnitCap)` returns $35.00, which auto-accepts, so every offer is $35.00 while `hi` is $34.00 → **lo > hi**. Independently, `vendorCounterAction` has no upper bound (`src/app/actions.ts:96-116`; the counter path only enforces `>= floor`), so a $35.00 counter on a $30.50 listing is legal and falls outside `hi = $30.50`.
Evidence: formulas `PLAN.md:354-356`; `src/lib/negotiation.ts:63-69`; no upper bound in `src/app/actions.ts:96-116`; the seeded paper negotiation already produces four offers at $27/$27/$27/$30.50.
Required fix: domain = min/max over `[target, ...offers, ...lists]`; if `hi - lo < 1` cent, expand by `max(1, round(hi*0.05))`; pad 6%; clamp marks to 0–1 with an explicit "outside" chevron so a value outside the domain is never silently drawn at the edge. Put the formula in §4.2 and add the two test cases (target above all lists; vendor counter above list).

**B3. The policy-band domain spends ~23% of the track on impossible prices and can clip an above-list counter.**
What's wrong: `lo = floor × 0.9` (`PLAN.md:387`). For Meridian paper that is $20.70–$30.50; the entire $20.70–$23.00 stretch (230 of 980 cents, 23.5%) can never contain an offer or a counter, because the engine never goes below the floor. The band's job is "where does this offer sit relative to policy", and a fifth of the track is dead. Separately, `hi = listPriceMinor` clips the legal above-list counter from B2.
Evidence: `PLAN.md:387`; floor $23.00 / list $30.50 (`prisma/seed.ts:71-72`); the engine never counters below the floor (`src/lib/negotiation.ts:63-69`; counter path in `src/lib/negotiation-service.ts`).
Required fix: `lo = min(floor, every offer)`, `hi = max(list, every offer)`; keep the floor tick and the two threshold edges; if the offer is outside, clamp the marker and print the value plus an "outside the band" note. This also makes the three seeded states legible without changing the geometry.

**B4. The vendor wireframe invents an offer that does not exist and misattributes the third queue row.**
What's wrong: the queue's third row is "`Nitrile Gloves, Medium` / `$30.50` / `Atlas · floor $26.00`" (`PLAN.md:214-216`). The live `/vendor` queue has three rows, all A4 Copy Paper: Meridian $27.00 floor $23.00, Northwind $27.00 floor $24.50, Atlas $30.50 floor $26.00. There is no pending gloves offer; the gloves negotiation is the blocked/confirmed one. The detail example (Meridian $27.00) is real; the queue is not.
Evidence: my capture `_shots/critic-cur-vendor-390.png` and the live DOM (3 pending queue rows, all `PAP-A4-80`); `prisma/seed.ts:97-116` (gloves listings); blocked negotiation `cmvmhw471000dcde09k0ugpez` (both gloves offers accepted, order BLOCKED).
Required fix: rebuild §3.2 from the actual three pending offers (all A4 paper) and use the gloves state only in the blocked-order example. Every wireframe number must be traceable to a query/seed row.

**B5. The confirmed state invents a timestamp the schema does not store.**
What's wrong: the `CONFIRMED` copy is "`Confirmed 24 Oct, 19:12. The purchase is complete…`" (`PLAN.md:460-461`). The `Order` model has `createdAt` and `authorizedAt` but **no `confirmedAt`** (`prisma/schema.prisma:97-117`), and `getNegotiationDetail` exposes only `id,status,agreedUnitPriceMinor,quantity,totalMinor,currency,blockReason,authorizedAt,createdAt` (`src/lib/queries.ts:130-142`). There is no data from which "Confirmed 24 Oct, 19:12" can be rendered; it would be either the order-creation time mislabeled as confirmation or an invention.
Evidence: `prisma/schema.prisma:97-117`; `src/lib/queries.ts:130-142`; `PLAN.md:460`.
Required fix: drop the time ("Confirmed. The purchase is complete in this demo — no payment was processed.") or label the available timestamp honestly ("Order created 24 Oct, 19:12"). If a confirmation time is genuinely wanted, it is a Lead-owned schema/query change — request it explicitly, don't fake it in copy.

**B6. The negotiation wireframe is a state mash-up: "awaiting vendor" and an agreed order awaiting authorization cannot both be true.**
What's wrong: the head says "`● AWAITING VENDOR`" (`PLAN.md:273`), the transcript rows say "Awaiting vendor / Declined" (`PLAN.md:291-294`), yet the rail shows "`$27.00 /unit Meridian`" and the gate shows "`① Agreed 24 Oct 19:21 ✓` / `② Authorize [Authorize →]`" (`PLAN.md:279-289`). An order exists only when the negotiation is `AGREED`; if the negotiation is `AWAITING_VENDOR`, there is no agreed price and no order. The wireframe also says "`5 offers`" but lists four transcript rows (`PLAN.md:290-294`), and draws Meridian with two dots although the real negotiation has one Meridian offer (the 5th dot is invented).
Evidence: `PLAN.md:273, 279-294`; order creation only on `AGREED` (`src/lib/negotiation-service.ts:138, 143-199`); live negotiation `cmvmgjd4u0001cdacd6h9lva8` is `AWAITING_VENDOR`, 4 offers, no order, "No price agreed yet" (my capture `_shots/critic-cur-neg-390.png`).
Required fix: split §3.3 into the states the page actually has — (a) awaiting vendor: deal "No price agreed yet", gate "Waiting on the vendor desk", no order; (b) agreed: head "AGREED", deal $27.00, gate step 1 ✓ / step 2 active; (c) authorized: step 2 ✓ / step 3 active; (d) blocked: strip + failed step 3; (e) confirmed: all ✓. One wireframe per state, or one wireframe with a labeled state and no contradictions. This is the page the human will judge first; a mixed state reads as a mock, not a product.

## MAJOR

**M1. The item-dependent default target breaks the second item.**
What's wrong: the plan proposes defaulting the target to 85% of the lowest active list for the default item (paper $30.50 → $25.93) (`PLAN.md:865-869`). The composer lets the reviewer switch to Nitrile Gloves (list $7.80, floor $5.40, accept $7.00). A $25.93 target on a $7.80 item makes `initialBuyerOfferMinor = min(max(2593, 540), cap) = 2593`, which is **above the $7.00 auto-accept floor** → instant agreement at $25.93 on a $7.80 product, with no vendor decision. The plan says the change "changes no server logic"; the correct fix does need either a small client component or a Lead-owned server default.
Evidence: `PLAN.md:865-869`; `src/components/storefront/requisition-form.tsx:77` (hard-coded "27.00"); `prisma/seed.ts:97-103` (gloves); `src/lib/negotiation.ts:63-69`; `src/app/actions.ts:32` (target required).
Required fix: pick one and specify it: (a) make the item picker + target field a small client component (the one justified client island) that sets the target when the item changes, defaulting to `round(lowestList * 0.85)` for the selected item; or (b) keep the target empty and have the Lead's action default it from the selected item's lowest list. Do not ship a single static number for a multi-item picker.

**M2. The 1024–1279 layout is unspecified, and the vendor breakpoint order is inconsistent.**
What's wrong: at `lg` 1024–1279 the plan gives lanes `1fr` + rail 320 in a content width of ~768–1023 minus 48px padding (`PLAN.md:752-753`), so the lane name block (168px) plus plot is ~280–380px, but §4.2's label-flip rule assumes 44px between dots and §4.3's three-column decision block has to fit in the vendor review column (~432px at 1024). The plan never says how the band labels, the 3-column decision block, or the 260px lane section fit there. Separately, `<768` puts the review before the queue, `768–1023` puts the queue above the review (`PLAN.md:750-753`), so a tablet user gets the opposite reading order from a phone user for no stated reason.
Evidence: `PLAN.md:357-358` (168px name block), `PLAN.md:750-753`; `PLAN.md:250-252` (3-column decision block).
Required fix: add a `lg` row to the responsive table: lane name block 132px, plot min 240px, rail 300px, decision block 2 rows (Accept/Reject on one line, Counter on the next), band labels 10px with a collision rule. Make the vendor order consistent (`review first` below 1280) or state why it changes.

**M3. The price lane's round/state encoding is under-defined and contradicts the status table.**
What's wrong: (a) round is encoded only by a dot's x-position plus an "R1" tag; when two offers share a price (the seeded paper negotiation has three $27.00 offers, and a vendor counter can land exactly on an earlier price), the dots coincide and the R tags collide — the plan's only collision rule is for *labels* within 44px (`PLAN.md:365-366`), not for coincident dots. (b) The `COUNTERED` decision is never mapped: §4.2 lists accepted/declined/pending/superseded, but `vendorCounterOffer` sets the old offer to `COUNTERED` (`src/lib/negotiation-service.ts:254-269`), so a countered offer has no dot state. (c) §4.2 makes the accepted dot filled `--ink`, while §4.6 says Accepted uses the `--agreed` tone (`PLAN.md:362-364` vs `PLAN.md:477`); the wireframe also draws a hollow `○` at the list position, which is indistinguishable from the hollow "declined" dot (`PLAN.md:281-283` vs `PLAN.md:362-364`).
Evidence: `PLAN.md:281-283, 362-368, 477`; `src/lib/negotiation-service.ts:254-269`; live paper negotiation (3× $27.00, one $30.50).
Required fix: define the mark set as: accepted = `--agreed` filled; declined = `--blocked` hollow ring; pending = `--waiting` filled; countered = `--waiting` hollow ring (or a 2px tick); superseded = `--ink-3` small tick, never a ring; list = a 1px `--rule-strong` tick with no dot (or remove it). When dots coincide, stack them vertically 4px or draw a single dot with a count ("2 offers"), and put round tags in a fixed row below. Update §4.6 to match.

**M4. The band labels overflow at 390 and the label set/terminology is inconsistent.**
What's wrong: labels are positioned at each marker's x (`PLAN.md:395-397`); the right-end label "list $30.50" is centered on the 100% mark, so half of it (~28px at 10.5px) overflows the track; the plan has no anchoring rule (the lane has one at 8%/92%, the band does not). The wireframe shows four labels (`floor`, `reject`, `ACCEPT`, `list`, `PLAN.md:209-210`) while §4.3 specifies three (`floor`, `review $25.00–$28.00`, `list`, `PLAN.md:395-396`); "reject floor" / "accept floor" conflate `autoRejectBelowMinor` / `autoAcceptFloorMinor` with `floorPriceMinor`, which is the one value that is actually a floor.
Evidence: `PLAN.md:209-210, 395-402`; `prisma/seed.ts:71-77`.
Required fix: anchor end labels left/right at 0%/100% (same 8%/92% rule as the lane), keep the three-label set, and rename to "reject line" / "accept line". Make the wireframe and §4.3 use the same labels.

**M5. "No cards" is contradicted by the first above-the-fold element.**
What's wrong: the plan's headline rule is "no cards, no shadows, sections separated by 1px rules only" (`PLAN.md:49-50, 118, 814`), but the item picker is two white `--surface` boxes with 1px borders and 4px radii (`PLAN.md:163-166`), and it is the first thing the reviewer sees on `/`. On a warm-white canvas, two white rounded boxes at the top is exactly the "generic white-card" silhouette the human rejected, even if they are radio controls.
Evidence: `PLAN.md:163-166` vs `PLAN.md:49-50, 118, 814`; `--surface: #FFFFFF` on `--canvas: #FAF9F6` (`PLAN.md:536-539`).
Required fix: make the picker rule-separated rows on the canvas (no white fill, no border, a 2px ink left rule when selected) or explicitly justify the white surface as a control and show it in the style plate. The first screen must not look like the old cards.

**M6. Real-data column widths are too narrow for the strings the app actually renders.**
What's wrong: the transcript supplier column is 132px (`PLAN.md:313`) but "Atlas Industrial Supply" is 23 characters at 13px; the listing-terms terms column is 132px (`PLAN.md:255`) but the repriced version "AT-terms-2026.04-R1" is 20 characters at 11px mono +0.01em (~134px), which wraps mid-identifier; the home "Filed" column is 92px (`PLAN.md:171`) but the plan's own format "24 Oct, 19:21" is 14 characters at 11px mono (~94px).
Evidence: `PLAN.md:171, 255, 313`; `src/lib/negotiation-service.ts:385-388` (terms `-R<n>`); `prisma/seed.ts:50` (Meridian Office Goods) and the Atlas/Northwind names; my 1440 vendor capture.
Required fix: supplier 168px, terms 156px, Filed 104px; or reduce the transcript to "Meridian" / "Northwind" / "Atlas" consistently (but then the queue and detail must match). Verify against the longest real strings, not the shortest.

**M7. The blocked strip's 3-column table does not fit at 390.**
What's wrong: the strip table is `120px 1fr 1fr` (`PLAN.md:430`); at 390 the strip content is ~318px after page + strip padding, so the two value columns are ~99px each. "AT-terms-2026.04-R1" is ~132px at 11px mono → it overflows or wraps mid-id, and the plan's responsive section only says the strip exists, not how it reflows (`PLAN.md:752-768`).
Evidence: `PLAN.md:421-432, 752-768`; blocked negotiation `cmvmhw471000dcde09k0ugpez` (`blockReason` "terms AT-terms-2026.04 → AT-terms-2026.04-R1").
Required fix: at `<768`, render the strip as stacked label/from→to rows (one block per term), not a 3-column table; keep the 3-column table for `md+`.

**M8. The home page still ends at ~69% of 900 and never shows the completed deal.**
What's wrong: the plan's home regions end at 620px (`PLAN.md:127-179`: head 40–118, composer 140–400, ledger 440–620), which is 69% of 900 — under the plan's own "fill ≥70%" rule (`PLAN.md:814`). The current home's content bottom is 670px (my DOM measurement of the four `.card` bottoms: 236/447/486/670), so the redesign actually removes ~50px of content and leaves more blank. Worse, the ledger filters out `CONFIRMED`/`CANCELLED` (`src/app/page.tsx:43-49`), so after the demo's happy path the buyer's home never shows the confirmed order — only the rail does.
Evidence: `PLAN.md:127-179, 814`; my DOM measurement of the live home (content bottom 670); `src/app/page.tsx:43-49`; `src/lib/queries.ts:146-152` (recent includes order).
Required fix: add a compact "Recently settled" line/section under the ledger from the same recent query (confirmed/cancelled with price + date), or a one-line account/catalogue footer; this both fills the page and closes the lifecycle on the home. If the plan keeps the filter, say the rail is the only record — but then the home is a form plus a short list, not a workspace.

**M9. The primary action is buried in the rail below the deal summary, while the lanes dominate.**
What's wrong: the plan's own priority says the order gate is "the page's most important thing when actionable" (`PLAN.md:267-269`), and it promotes the blocked/counter strips above the grid for exactly that reason (`PLAN.md:303-310`), but when the order is `AWAITING_AUTHORIZATION` the only primary button sits in the 376px rail under the deal summary, at ~y 600–690, while the 260px lanes and the transcript occupy the main column. At 390 the gate is first, but at 1440 the action is the smallest thing on the page.
Evidence: `PLAN.md:267-269, 303-310, 309-310, 438-465`; the live negotiation has the "Order" card in the right rail (my capture).
Required fix: when the order is actionable (awaiting auth or authorized), promote a full-width action strip above the grid — same geometry as the counter/blocked strip, with the step summary and the primary button — and keep the rail for the state detail. Or state that the gate is deliberately rail-only and justify why the lanes outrank the action.

**M10. The cross-surface links are incomplete, one is meaningless, and one leaks the buyer's position to the supplier.**
What's wrong: §2 says the vendor's offer detail links to the buyer record (quiet "Buyer record →") as "the demo's mental model" (`PLAN.md:99-101`), but the vendor wireframe and component inventory have no such link (`PLAN.md:195-232, 621-650`; `OfferReview` props are just `offer`). The buyer's blocked strip has a "`[Buyer record]`" action (`PLAN.md:425, 734`) — a link to the page you are already on — and the buyer's gate has "`Open review desk →`" (`PLAN.md:450-451`), contradicting "the only navigation between surfaces" (`PLAN.md:99-101`). Worse, the vendor→buyer link opens `/negotiation/{id}`, which prints the buyer's **target** and **budget cap** (`PLAN.md:300-302`), so the supplier can read the buyer's negotiating position — the opposite of the plan's "different privileges" claim.
Evidence: `PLAN.md:99-101, 425, 450-451, 621-650, 300-302`; `src/lib/queries.ts:119-120` (target/budget in the buyer DTO).
Required fix: (a) put the "Buyer record →" link in the vendor layout and inventory; (b) remove the buyer's "Buyer record" link; (c) either drop the buyer→vendor link or list both cross-surface links explicitly; (d) make the vendor's record view hide target/budget/per-unit ceiling (a `?view=vendor` server param is in scope) or drop the link. If the demo intentionally exposes everything, say so and stop claiming "different privileges".

**M11. The aria-hidden lanes drop per-supplier delivery, reliability, and list price from the accessibility tree.**
What's wrong: §4.2 hides the lane graphics and claims the transcript table is the text alternative (`PLAN.md:371-373`), but the lane's name block (delivery, reliability, list) is inside the lane, and the transcript rows carry only time, supplier, round, price, decision, note (`PLAN.md:311-315, 635`). A screen-reader user therefore loses the per-supplier quality/delivery/list data the lane exists to show; only the recommended supplier's delivery/reliability appears in the deal rail.
Evidence: `PLAN.md:357-358, 371-373, 311-315, 635`.
Required fix: keep the name block as real text (hide only the plot with `aria-hidden`), or add delivery/reliability/list to the transcript rows. State exactly which subtree is hidden.

**M12. The entrance animation replays on every server action.**
What's wrong: sections "rise 4px and fade in with a 30ms stagger on load" (`PLAN.md:607-613`). Every write is a server action that redirects (`src/app/actions.ts`), i.e. a fresh navigation, so Accept / Reject / Counter / Authorize / Confirm / Simulate repricing each replay the whole page entrance. A tool that animates its sections after every click reads as a reloading demo, not a settled product.
Evidence: `PLAN.md:607-613`; `src/app/actions.ts` (redirects on every action).
Required fix: drop the entrance animation (the page is a tool), or scope it to opacity-only 120ms with no stagger, and explicitly test after an action redirect. The plan's own rationale ("the page should settle, not perform") argues for dropping it.

**M13. Evidence citations and several factual claims do not match the files.**
What's wrong: the plan's credibility rests on its evidence table, and several entries are wrong: "`3 stacked right-rail cards`" (`PLAN.md:14`) — the live home has 2 (Account, Catalogue; my DOM capture); "Delivery/Reliability columns unreachable (no scroll container)" (`PLAN.md:16`) — `src/app/page.tsx:138` wraps the matrix in `overflow-x-auto` and the container scrolls (my DOM: table 620px in a 357px scroller); "`order-gate.tsx:143-176`" (`PLAN.md:22`) — the file is 155 lines and the block list is 124–131; "`rounds-matrix.tsx:22`" — the table is at 24; "`requisition-form.tsx:40-60`" — the select is 31–49; "`open-negotiations.tsx:35`" — the table is at 33; "`page-header.tsx:38-53`" — the chip is 39–41; "`account-card.tsx:29-33`" — the budget is 24–28; "`offer-detail.tsx:22-46`" — the bars are 23–27/52–67; "`3 in flight · 1 blocked`" (`PLAN.md:127, 159, 674`) — the live home says "2 active" and the ledger has 2 rows (1 blocked + 1 awaiting); "`5 offers`" (`PLAN.md:290, 724`) — the current target-$27 negotiation has 4 offers (my DOM), and the wireframe itself lists 4 rows.
Evidence: `PLAN.md:14, 16, 22, 127, 159, 290, 674, 724`; live DOM/screenshots; `src/app/page.tsx:138`; `src/components/negotiation/rounds-matrix.tsx:24`; `src/components/storefront/requisition-form.tsx:31-49`; `src/components/storefront/open-negotiations.tsx:33`; `src/components/shell/page-header.tsx:39-41`; `src/components/storefront/account-card.tsx:24-28`; `src/components/vendor/offer-detail.tsx:23-27, 52-67`; `src/components/negotiation/order-gate.tsx:124-131`.
Required fix: re-derive every line reference and count from the current files; make the wireframes match one real state; if a count is illustrative, label it.

**M14. The block-reason parser is the only in-scope option, but the plan doesn't say so or handle the asymmetric delivery case.**
What's wrong: the plan says "`blockReason` is a display string, so the block report is a parser plus a table" (`PLAN.md:408-412`) without stating that the Order's frozen fields (`frozenListPriceMinor`, `frozenDeliveryDays`, `frozenSpecVersion`, `frozenTermsVersion`, `prisma/schema.prisma:107-111`) are **not** in the buyer DTO (`src/lib/queries.ts:130-142`), so parsing is the only design-scope option. It also doesn't handle the delivery line's asymmetric units ("delivery 3 → 5 days") — splitting on `" → "` gives `"3"` and `"5 days"`, so the "at agreement" column would print a bare "3".
Evidence: `PLAN.md:408-412`; `src/lib/negotiation-service.ts:337-359` (formats `list price $X → $Y; delivery A → B days; item spec A → B; terms A → B`); `prisma/schema.prisma:107-111`; `src/lib/queries.ts:130-142`.
Required fix: state the frozen-field limitation and the parse-only decision; special-case `delivery` to render "3 days"/"5 days"; strip the four known prefixes; fall back to one line for anything else; never drop a line. If the Lead will extend the DTO with the frozen fields, prefer that and say so — it is strictly better than parsing.

**M15. The plan asks to be trusted on "premium" without a render.**
What's wrong: the design process is render → look → judge; the plan's evidence is ASCII and measurements. The human has rejected two visually confident passes already, so "restraint plus precision" is exactly the kind of claim that must be seen before it is built.
Evidence: `PLAN.md` §3 wireframes (ASCII) and §9 (rules); no rendered plate in `_shots/` for the new direction.
Required fix: before building all three pages, produce a static 1440×900 style plate — page head, composer item rows, one ledger row, one price lane, one policy band with real Meridian/Northwind/Atlas data — plus the same at 390, screenshot it into `_shots/design-plate-*.png`, and submit it for critic review. If the plate reads as a quiet generic form or as an art piece, the direction fails before the code is written.

## MINOR

**m1. Reject is specified two different ways.** §3.2 says "Reject = secondary outline" (`PLAN.md:251-252`); §5.5 defines a `Danger-quiet` variant "used only for Reject" (`PLAN.md:595-596`). Pick one (danger-quiet is the better call for the destructive action) and use it in both places.

**m2. Focus ring is specified as both `box-shadow` and `outline`.** §5.3 says "`box-shadow` is used only for the focus ring" (`PLAN.md:568`); §5.5 uses `outline: 2px solid` (`PLAN.md:590, 600`). Use `outline` (it respects `:focus-visible` and forced colors) and delete the box-shadow sentence.

**m3. Three type/count precision errors.** "Money gets four sizes and no others" then lists five: 44, 34, 22, 17, 13 (`PLAN.md:335-337`); "the 'now' column is the largest type in the strip" but the headline is also 15/600 (`PLAN.md:429-432`); "Quantity always carries its unit: '100 units'" but the vendor meta shows "QUANTITY 100" and the wireframe's qty is bare (`PLAN.md:216, 338`). Fix the counts/words to match the system.

**m4. Landmark labels duplicate and one status word may not fit at 390.** The rail is `<aside aria-label="Workspaces">` containing `<nav aria-label="Workspaces">` (`PLAN.md:782-784`) — label them distinctly ("Workspace navigation", "Recent negotiations"). "BLOCKED AT CONFIRMATION" at 11px +0.08em is ~154px; in the 390 strip it will wrap — allow two lines or shorten to "BLOCKED AT CONFIRM".

**m5. The gate's state map is not exhaustive.** It lists no-order/AWAITING_VENDOR, no-order/REJECTED, AWAITING_AUTHORIZATION, authorized, CONFIRMED, BLOCKED (`PLAN.md:449-463`) but not `OPEN` (transient, but a real enum value) or `CANCELLED` (a real order status; no action creates it today). Either add branches or state they are unreachable and why.

**m6. The block strip's 4px radius contradicts the no-radius rule and the full-bleed surface.** §5.3 puts `--radius-control: 4px` on the block strip (`PLAN.md:563`) while §5.3 also says "Nothing else is rounded" (`PLAN.md:564`) and the strip is a full-width state surface. Make state strips square (0) and keep 4px for controls only.

**m7. The item picker's selection mechanism is not specified.** It is a fieldset of native radios with no client JS (`PLAN.md:631`), so the selected row's style must be CSS-only — specify `:has(input:checked)` (and a `:focus-visible` ring on the row) or the implementation will guess. Also say explicitly that the 4px radius/white fill is a control exception (see M5).

**m8. The "superseded" dot predicate is undefined.** §4.2 uses `--ink-3` for superseded (`PLAN.md:364`) but never says how a dot is classified as superseded; the only signal is the service note (`"Vendor counter at …"`, `src/lib/negotiation-service.ts:254-269`) or a later round. Define it (e.g. "an offer superseded by a later offer from the same supplier") and align it with the `COUNTERED` state from M3.

**m9. Two copy lines overclaim.** "`No supplier accepted a price inside the budget. Nothing was ordered.`" (`PLAN.md:452-453`) asserts a cause the data does not record — the engine can reject for floor/policy reasons, not just budget. Say "No offer was accepted. Nothing was ordered." Also "the agreed price is void" (`PLAN.md:418-419`) is legalistic; "the agreed price no longer holds" is plainer.

## What is genuinely good

- The diagnosis is real and re-verified: the negotiation page's content ends at y≈425 of 900 (53% empty), the vendor page is 1594px tall with 4 KPI tiles and two below-fold tables, the three offer bars are 89/75/100% of list, and the 390 tables are off-screen in a scroller (my captures/DOM; the plan's evidence table matches except where noted in M13).
- The direction is the right kind of answer: it removes the admin chrome instead of reskinning it, and it replaces the round matrix with a price axis — an information-design argument, not a mood.
- The two instruments are genuinely specific to this product: price-over-time against a target, and offered price against a policy band. Neither exists in the current app, and both are derived from fields that actually exist.
- Killing the four KPI tiles, the duplicated account card, the native select, and the pastel pills is correct and evidence-backed; the vendor page's queue + detail is the right structure.
- The type/color system is coherent and implementable: Archivo + Plex Mono, a real scale, tabular money, and contrast numbers that check out (my calculation from the §5.2 tokens: `--ink-2` 7.38:1, `--ink-3` 5.12:1, `--waiting` 5.62:1, `--blocked` 7.27:1, `--agreed` 7.35:1 on `#FAF9F6`). No gradients, glass, glow, or icon logo.
- The blocked/counter strips above the grid are the right IA, and the "status is a word + a square, never a pastel chip" rule is disciplined and legible.
- The implementation order, the cleanup list, and the "server logic untouched" boundary are sane; the "directions killed" section shows the plan is not converging on the mean.
- The open-decision note is honest about the one thing it is unsure of (the target default) — it just needs a real answer (M1), not a poll.

VERDICT: CHANGES REQUIRED

---

# CRITIQUE — round 2

**Reviewed:** `PLAN.md` 963 lines, mtime 24 Oct 20:47; plate renders 20:22–20:30 (`_shots/plate-neg-1440.png`, `plate-neg-1440-full.png`, `plate-neg-390.png`, `plate-home-1440.png`, `plate-home-390.png`, `plate-vendor-1440.png`, `plate-vendor-390.png`), `_shots/plate/plate.css`, `neg.html`, `pages.html`. The plan changed at 20:47 while I was reading it; the contrast numbers were corrected in that edit and now match my calculation (`--ink` 16.69, `--ink-2` 7.38, `--ink-3` 5.12, `--waiting` 5.62, `--blocked` 7.27, `--agreed` 7.35), so this review is against the 20:47 version and does not re-raise the contrast issue.

**Overall judgement.** The concept passes. This is no longer an art piece or a reskin: the order line is the page's spine, the supplier board is the comparison, the policy band is the vendor's instrument, and the plate reads as a considered document rather than generic admin. The lane deletion is the right call, not a dodge — the engine opens every supplier at the target, so the lane's x-axis is degenerate by construction, and the replacement carries more decision-relevant information. What remains is not another direction; it is convergence, and the drift is now between the plan and its own plate: the type scale in §2.3/§5.2 is 34/22 while the plate renders 24–26/15; the board's price rule says `min(offers)` while the plate shows the latest offer; the countered state hard-codes `$27.00` and detects itself by parsing a note; the first screen says "3-day delivery" when the fastest is 2; the vendor queue says "2m ago" three times while §4.6 bans relative time; and the date format the copy and the plate require is not what `format.ts` produces. Those are real, but they are a day of work, not a rewrite. The plan is close; it is not yet shippable.

**Axis verdicts (round 2).**

| # | Axis | Verdict | Why |
|---|---|---|---|
| 1 | Fixes the real complaint | **PASS** | The plate is a specific product, not an art piece or a reskin; the order line carries the action, the board the comparison, the band the vendor decision. The 390 composer is the one usability failure (B2). |
| 2 | IA, page jobs, nav, duplication | **PASS** | Home lists in-flight *and* settled; vendor queue is the 3 real pending A4 offers; one rail; no duplicate budget cards; M10 dropped deliberately (separate routes, rail link) is acceptable. Only the §2.4 `REJECTED` definition is loose (m6). |
| 3 | Layout, wireframe, above-fold, 1440/390 | **PASS at 1440; FAIL at 390 composer** | 1440 is concrete and above-fold; at 390 the composer is 1-up, the price block is top-right, and "Start negotiation" sits at y=866 in an 844 viewport, contradicting §8.1/§8.2 and the 390 wireframe (B2). |
| 4a | Price-lane encoding | **N/A (deleted; right call)** | The engine opens all three R1 offers at `$27.00`; only two distinct prices exist; a shared x-axis is empty by construction. The board's price rule is the replacement's one data bug (M1). |
| 4b | Policy band (offered vs floor, no legend) | **PASS** | Detail geometry is exact: Meridian floor 3.7%, reject 28.4%, accept 65.4%, offer 53.1%, list 96.3%; caption `$2.00` over reject / `$1.00` under accept is correct; labels + ticks + caption make it legible without a legend. The queue mini bands are wrong (M7). |
| 4c | Blocked-order `blockReason` robustness | **PASS** | Structural frozen-vs-live comparison, no parsing; DTO exposes `frozen*`/`live*` (`queries.ts:130-154`); null-frozen fallback; the plate's "2 OF 4 TERMS CHANGED" is right. The residual note-prefix parse is in the countered state (M2), not here. |
| 5 | Visual system | **PASS** | No cards, no gradients/glass/glow, warm plane + hairlines, Archivo + Plex Mono, tabular money, status = square + word. The type table's "Use" column contradicts the plate (M6); the item-picker 4px and reject border are minors (m7). |
| 6 | Components and states inventory | **PASS with one gap** | Five order-line states complete and matched to real actions; `buyerAcceptCounterAction` exists (`actions.ts:118-133`); the transcript table omits the `COUNTERED` decision row (m12); `Field`/composer props are incomplete (m3). |
| 7 | Copy | **PASS with fixes** | Restrained, specific, no hype or fake precision. "3-day" (M5), "2m ago" (M4), "Your counter" (m2), "2 of 3" (m2), the countered price (M2), and the date format (B1) are wrong. |
| 8 | Responsive / a11y | **PASS at 390/768 no horizontal scroll; composer stacking fails** | Measured `scrollWidth === clientWidth` at 390 (376/376) and 768 (753/753); ledger/band/board/transcript/queue stack correctly; the composer does not (B2); decision buttons are not full-width (m4); 390 h1 inverts (M6). A11y order line, band, picker, focus, reduced motion are strong. |
| 9 | Implementability | **PASS with one blocker** | Tailwind v4 + `globals.css`, no new deps, no client JS except the justified composer island; `src/lib` boundary respected. The date formatter is not implementable as written (B1); `targetPriceMinor` (M1), `formatMinorInput` (m3), the note-prefix parse (M2) are the rest. |
| 10 | Scope discipline / order | **PASS** | The order is sensible; the server boundary is explicit; the plate checkpoint was delivered; the cleanup list is real; the 20:47 contrast correction shows the process is working. |

## Your five questions, answered

1. **§4.3 arithmetic vs seed.** The detail band is exact (Meridian 3.7 / 28.4 / 65.4 / 53.1 / 96.3; caption `$2.00` over reject, `$1.00` under accept). The queue mini bands are not computed from the same formula: Northwind renders 30 / 34 / 64 with marker 46, correct is 22.2 / 59.3 / 34.6; Atlas renders 27 / 38 / 65 with marker 86, correct is 21.1 / 61.6 / 55.8. The Atlas marker at 86% says a `$30.50` offer is above the `$31.00` accept line; it is not. Also the 0→reject zone is named "below-floor" though it includes floor→reject, and the two auto-decided caption cases are unreachable in the queue.
2. **Is deleting the lane a dodge?** No. With target `$27.00`, `initialBuyerOfferMinor` returns `$27.00` for all three R1 offers (`negotiation.ts:63-69`), so the lane's x-axis collapses to one point by construction; only Meridian and Atlas have a second price. A shared price axis cannot encode four offers. The board + order line is the better instrument, and the plate proves it: the buyer reads the commit chain on the spine and the supplier comparison across the board. Keep the deletion.
3. **§3.2.1 five states vs `actions.ts`.** The states map to real actions: pending (no action), countered (`buyerAcceptCounterAction`, `offerId` + `negotiationId`), agreed (`authorizeOrderAction`), blocked (new requisition), confirmed (none). Two problems: the countered state's `$27.00` is the buyer's target, not the vendor's counter price (M2), and its detection is `isVendorCounter` = note starts with "Vendor counter at" (`status.ts:77-79`), a display-string parse. Use the structured `COUNTERED` decision on the prior offer for the same listing, or ask the Lead for a source field.
4. **§8.2 390 stacking.** Ledger, band labels, board, transcript, queue, order line all stack correctly and the page has no horizontal overflow (measured). The composer does not: `.terms` is 1 column (343.68px) instead of 2×2, the picker's price block is top-right (x=268, y=292) instead of under the facts, and "Start negotiation" is at y=866 in an 844 viewport. The decision buttons are max-content (136 / 76 / 69px) though §5.5/§8.2 say full-width. At 768 the 5-column terms grid's max-content button runs 14px past the content box (button right 747, content right 733; no scroll).
5. **Any unverifiable claim.** Yes: the date format (B1), "no relative timestamps" (M4), "3-day delivery" (M5), "cap $400,000.00" (m1), "no element with both a background and a border" (m7), "every state reachable from /" (m6), and the round-1 misquote (m8). The contrast numbers are now correct.

## What the rewrite fixed

- B1 fixed: caption arithmetic `$2.00` / `$1.00`, five boundary cases, and the detail band is exact.
- B2 / B3 / B6 moot: the lane is gone; the deletion is the right call.
- B4 fixed: the vendor queue is the three real pending A4 offers, not an invented gloves row.
- B5 fixed: `authorizedAt` labelled `Authorized`, `createdAt` labelled `Order created`; no invented `confirmedAt`.
- B6 fixed: one order line, five states, real counts (4 offers, 2 rounds, 1 accepted, 2 superseded).
- M1 fixed: the composer island defaults the target to 85% of the selected item's lowest list, and follows the item.
- M2 fixed: five breakpoints, queue flip, 390 stacking rules (except the composer, B2).
- M3 fixed: lane gone; one vocabulary; no pastel pills; status = square + word.
- M4 fixed: labels row decoupled from x positions; 2-row at <768; band geometry correct.
- M5 fixed: rule-separated picker rows; no white boxes; selected = sunk + left rule.
- M6 fixed: column widths and no `min-width` tables; 390 no horizontal scroll measured.
- M7 fixed: blocked strip stacks; structural frozen/live diff.
- M8 fixed: home shows 1 in flight + 2 settled; no state is hidden.
- M9 fixed: no right rail; the order line carries the action.
- M10 dropped deliberately: separate routes, rail link, no view-as mode — acceptable; no data leak.
- M11 fixed: band `aria-hidden` + hidden sentence; statuses are text + square.
- M12 fixed: no entrance animations; 120ms hover only; reduced-motion removal.
- M13 fixed: Appendix A citations re-checked against the code read in round 1; they are correct: `negotiation/[id]/page.tsx:138`, `rounds-matrix.tsx:24`, `order-gate.tsx:116/124-131`, `page.tsx:47/104/109`, `vendor/page.tsx:51-83`, `offer-detail.tsx:23-26/53-56`, `requisition-form.tsx:31-49`, `page-header.tsx:37-41`, `seed.ts:127`, `negotiation-service.ts:244-245`, `schema.prisma` Order — all correct.
- M14 fixed: no `blockReason` parsing; frozen/live fields; null fallback.
- M15 fixed: the plate is built, rendered, measured; this is the proof the round-1 critique asked for.
- The contrast numbers were corrected at 20:47 and now match my calculation.

## BLOCKER

**B1. The date format the copy and the plate require is not what the code produces, and the plan claims it is.**
What's wrong: §4.6 says `formatDate` → `24 Oct 2026`, `formatDateTime` → `24 Oct, 19:21` (`PLAN.md:555`), and §8.4 says dates are formatted by `format.ts` only. `src/lib/format.ts:32-47` uses `en-US` with day/month/year and a 12-hour clock, so it produces `Oct 31, 2026` and `Oct 24, 07:21 PM`. `src/lib/**` is out of the design's scope. The plate (`neg.html` meta, transcript, confirmed step) and §7.3's copy all use the non-existent format.
Evidence: `PLAN.md:555`, `PLAN.md:877`; `src/lib/format.ts:32-47`; `_shots/plate/neg.html` ("filed 24 Oct, 19:21", "19:21", "19:59").
Required fix: either the Lead changes `format.ts` (one-line Intl options: `en-GB`/manual day-month order and `hour12: false`) and the plan says so, or the plan adopts the lib's existing `Oct 31, 2026` / `Oct 24, 07:21 PM` in §4.6, §7.3 and the plate. Do not ship the claim that the current lib produces the desired format.

**B2. The 390 composer contradicts the plan's own stacking rules and buries the primary action below the fold.**
What's wrong: §8.1 says at <480 "terms 2×2; picker price block drops under the facts" (`PLAN.md:840`); §8.2 says "<768 terms 2×2, button full width" and "picker price block right-aligned under facts" (`PLAN.md:848-850`); §3.1's 390 wireframe shows the same (`PLAN.md:206`). The plate at 390 renders `.terms` as one column (343.68px), the picker's price at top-right (x=268, y=292), and "Start negotiation" at y=866 in an 844 viewport. The ledger, band, board, transcript and queue stack correctly; the composer is the failure.
Evidence: measured at 390: `.terms` `grid-template-columns: 343.68px`; start button `{x:16, y:866, w:344, h:40, inViewport:false}`; picker price `{x:268, y:292}`; `_shots/plate-home-390.png`; `_shots/plate/plate.css:483` (`.terms { grid-template-columns: 1fr; }` at <480).
Required fix: implement the plan's 2×2 terms grid and price-under-facts at <768 (the button then lands above the fold), or change the plan to accept the 1-up form and move the button up (e.g., submit row before the hint) and say so. As submitted, the proof and the spec disagree on the home page's primary job.

## MAJOR

**M1. The board's price rule says `min(offers)`, but the plate (correctly) shows the latest offer; the same paragraph uses a non-existent field.**
What's wrong: §3.2.3 says the board price is "best price (lowest offer price for that supplier)" and defines it as `min(offers[].unitPriceMinor)` (`PLAN.md:346`, `PLAN.md:354`). The plate's Atlas column shows `$30.50` (the latest R2 offer) with `+$3.50 over your target`; the minimum is `$27.00` (R1, rejected). The state row is "the latest offer" (`PLAN.md:350`), so the min-price + latest-state pair is incoherent: Atlas would show `$27.00` with `AWAITING VENDOR` for a `$30.50` pending offer. The plate's latest-price rule is the defensible one. The same paragraph computes delta against `negotiation.targetPriceMinor`, which does not exist; the DTO field is `targetUnitPriceMinor` (`queries.ts:119`).
Evidence: `PLAN.md:346/350/353/354`; `_shots/plate/neg.html` Atlas `$30.50`, delta `+$3.50`; `src/lib/queries.ts:119`; `_shots/plate-neg-1440.png`.
Required fix: define the board price as "the price in play = the latest offer's price", with the trail for history; keep the rejected-only case as `Declined`; change `targetPriceMinor` to `targetUnitPriceMinor`. State the rule once and make the plate the reference.

**M2. The "Supplier countered" state hard-codes `$27.00` and detects itself by parsing a display note.**
What's wrong: §3.2.1 renders the countered state as `$27.00 /unit` / `Accept $27.00` (`PLAN.md:306`), and §7.3 repeats it (`PLAN.md:762`). A vendor counter is a *different* price: `vendorCounterOffer` creates a new `PENDING` offer at the counter price and marks the prior offer `COUNTERED` (`negotiation-service.ts:254-267`); `buyerAcceptCounterAction` takes that new offer's `offerId` (`actions.ts:118-133`). The state must use the counter offer's `unitPriceMinor`, and the button must say `Accept $X` for that X. The state's predicate is `isVendorCounter` = note starts with "Vendor counter at" (`PLAN.md:785`; `status.ts:77-79`) — the same class of display-string parse the plan correctly banned for `blockReason`. A note rewrite silently turns a vendor counter into a "buyer offer".
Evidence: `PLAN.md:306/762/785`; `src/lib/negotiation-service.ts:254-267`; `src/app/actions.ts:118-133`; `src/components/status.ts:77-79`.
Required fix: use the counter offer's price and id; derive the state structurally from the preceding offer's `decision === "COUNTERED"` for the same listing (or ask the Lead for a source field). Update the example to a real counter price, not `$27.00`.

**M3. The spine labels step 1 "Agreed"/"Price agreed" while the pending state says "No price agreed yet".**
What's wrong: §3.2.1 says "Step 1 is `Agreed`, step 2 `Authorize`, step 3 `Confirm`" (`PLAN.md:301`); the pending row's value is `No price agreed yet` (`PLAN.md:305`); §7.3's label row and §8.4's a11y label both say `AGREED` (`PLAN.md:761`, `PLAN.md:868`); the plate renders `Price agreed` above `No price agreed yet` (`neg.html:59-60`). The slot is an action ("AUTHORIZE"/"CONFIRM" are verbs) but the label is a past-tense statement, and "Agreed" is not in the §4.5 vocabulary.
Evidence: `PLAN.md:301/305/761/868`; `_shots/plate/neg.html:59-60`; `_shots/plate-neg-1440.png`.
Required fix: label the steps `AGREE` / `AUTHORIZE` / `CONFIRM` (actions), or use the vocabulary's `ACCEPTED` only when the step is done; change the plate's `Price agreed` and the plan's `AGREED` together.

**M4. The plate and the §3.3 wireframe use "2m ago" three times, while §4.6/§9.12 ban relative time anywhere.**
What's wrong: §4.6 says "No relative time (`2m ago`) anywhere" (`PLAN.md:556`); §9.12 lists "Fake liveness. Relative timestamps ('2m ago')" as a trap (`PLAN.md:898`). The §3.3 wireframe prints `2m ago` on all three queue rows (`PLAN.md:373/378/383`), and the plate ships it three times (`pages.html:176/190/204`). The resubmission message claims there are none. This is a direct self-contradiction and a §9.5 invented-data violation.
Evidence: `PLAN.md:373/378/383/556/898`; `_shots/plate/pages.html:176/190/204`; `_shots/plate-vendor-1440.png`.
Required fix: replace with the absolute filed/offer time (e.g., `24 Oct, 19:21`) or remove; update the wireframe and the plate. The demo's clock is not the data's clock — the plan's own sentence is right.

**M5. The home's first-screen item facts say "3-day delivery" when the fastest supplier is 2 days.**
What's wrong: §7.2's copy table says `3 suppliers · 3-day delivery · spec-2026.1` (`PLAN.md:743`), and the plate renders it (`pages.html:70`). The seed's A4 deliveries are Meridian 5, Northwind 3, Atlas 2 (`seed.ts:71-77`, `58-64`, `84-90`), so the fastest is 2 days. The plan's own 1440 and 390 wireframes say `fastest 2 days` (`PLAN.md:133`, `PLAN.md:178`), and §3.2.1 says `Delivery 5 / 3 / 2 days` (`PLAN.md:212`). This is the §9.5 invented-data trap inside the plan's own copy table.
Evidence: `PLAN.md:133/178/212/743`; `prisma/seed.ts:58-64/71-77/84-90`; `_shots/plate/pages.html:70`.
Required fix: `3 suppliers · fastest 2 days · spec-2026.1` in §7.2 and the plate; do not describe an item by one supplier's delivery time.

**M6. The page grammar's type scale contradicts the plate the plan says is already implemented.**
What's wrong: §2.3 says page `h1` 34px and section `h2` 22px (`PLAN.md:101-102`); §5.2 defines `t-display` 34 "page h1", `t-h1` 26 "negotiation h1", `t-h1-sm` 24 "home and vendor h1", `t-h2` 22 "section h2", `t-h3` 15 (`PLAN.md:597-604`). The plate renders home/vendor h1 24, negotiation h1 26, section h2 15 (`t-h3`), vendor detail name 22 (`t-h2`); measured. An implementer following §2.3/§5.2 builds a heavier hierarchy than the plate, and `t-display` is unused in the plate. The 390 override reduces `t-h1` to 22 but leaves `t-h1-sm` at 24, so the negotiation h1 is smaller than the home h1 at 390.
Evidence: `PLAN.md:101-102/597-604`; measured 1440: `neg.html` h1 26, `pages.html` h1 24, section h2 15; `plate.css:55-58`, `plate.css:480`; `_shots/plate-neg-390.png`.
Required fix: adopt the plate's scale in §2.3/§5.2 — home/vendor h1 24, negotiation h1 26, section h2 15, vendor detail name 22, board price 30; delete `t-display` or reserve it for a true display moment; apply the mobile 22px rule to both h1 classes. The plate's hierarchy is the better one; change the spec, not the render.

**M7. The vendor queue's mini bands are hand-tuned and wrong for two of three rows.**
What's wrong: §4.3's formula is `lo = min(floor, offer) - 4%`, `hi = max(list, offer) + 4%`, zones at `pct(reject)` / `pct(accept)`, marker at `pct(offer)` (`PLAN.md:486-497`). The detail band matches exactly (Meridian 3.7 / 28.4 / 65.4 / 53.1 / 96.3). The queue's mini bands do not: Northwind renders 30 / 34 / 64 with marker 46 (correct 22.2 / 59.3 / 34.6); Atlas renders 27 / 38 / 65 with marker 86 (correct 21.1 / 61.6 / 55.8). The Atlas marker at 86% places a `$30.50` offer in the above-accept zone even though it is below the `$31.00` accept line; the queue would tell the vendor the wrong thing about the decision in front of them.
Evidence: `PLAN.md:486-497`; `_shots/plate/pages.html:184-189` (Northwind), `199-202` (Atlas); `_shots/plate-vendor-1440.png`; seed `seed.ts:58-64/71-77/84-90`.
Required fix: compute the mini bands from the same formula in the plate (and in the implementation); the queue's scannability claim depends on it.

## MINOR

**m1. Cap `$400,000.00` is a 100× units error.** §3.2.1 and Appendix A say `cap $400,000.00` (`PLAN.md:212`, `PLAN.md:958`); the real cap is `400000` minor units = `$4,000.00` (the same section's wireframe at `PLAN.md:219` and the plate show `$4,000.00`; the buyer's budget is `250000` at `seed.ts:127`). This is exactly the units bug the plan warns about; correct both.

**m2. Two copy claims overstate what happened.** §7.3 says "Your counter was sent" for the engine's R2 counter (`PLAN.md:790`; `neg.html:182`) — the buyer did not send it; say "The agent countered at $30.50 — awaiting the supplier" or "A counter was sent". And "2 of 3 suppliers are considering your price" (`PLAN.md:305/762`) while the board shows three `AWAITING VENDOR` states (Meridian/Northwind at `$27.00`, Atlas at `$30.50`); say "2 of 3 are at your target; Atlas countered at $30.50" or let the board's states carry it.

**m3. Two implementability details are unspecified.** §4.1 says "nothing is divided by 100 in a component" (`PLAN.md:455`), but §6.1's `formatMinorInput(minor) = (minor / 100).toFixed(2)` does exactly that (`PLAN.md:708`); exempt the input helper explicitly or use a string-based formatter. The `RequisitionComposer` props omit `defaultDeadlineDays` (14) and `defaultBudgetMinor` (2500) from §3.1, and `Field` has only `defaultValue` although the target is controlled (`PLAN.md:682/695`); add `value`/`onChange` or say the island renders a raw input.

**m4. The mobile button rule is contradictory, and the 768 terms grid overflows its content box.** At 390 the decision block is one column (343.68px) but Accept/Reject/Send are 136/76/69px (max-content), while §5.5/§8.2 say the stacked mobile decision block's buttons are full width (`PLAN.md:644/857`); the composer's button is full width, which §5.5's "never full-width except the decision block" forbids. Define one rule. At 768 the 5-column terms grid's max-content button runs 14px past the content box (button right 747, content right 733; page `scrollWidth` 753 = `clientWidth` 753, so no scroll but the button is misaligned); switch to 2×2 at ≤1023 or let the button wrap.

**m5. The home budget field does not show the derived per-unit ceiling.** §4.1 says the ceiling is "shown next to the cap" (`PLAN.md:471`); the home field shows `$2,500.00` with no `$50.00/unit` under it (the negotiation meta shows `$4,000.00 ($40.00/unit)`). Either add the derived line under the budget field (it depends on quantity) or scope the rule to the negotiation meta; otherwise the buyer cannot see the cap's per-unit effect before starting.

**m6. Three state-coverage claims are loose.** §2.4's in-flight definition puts a no-order `REJECTED` negotiation in flight (`PLAN.md:108`); add `REJECTED` to settled. §9.10 says every vocabulary state is reachable from `/` (`PLAN.md:896`), but `Cancelled` has no seed and no action; seed one or scope the claim. §4.3's `offer > accept` / `offer < reject` caption cases (`PLAN.md:509-513`) cannot occur in the vendor queue, which shows only in-band pending offers; delete them or state where they render.

**m7. Three spec self-contradictions.** §9.7 says "no element with both a background and a border except form controls" (`PLAN.md:893`), but the selected picker row has a sunk fill + 2px ink left edge (`plate.css:193`) and the blocked strip has a wash + 1px top rule (§3.2.2); rewrite to "no full border around a filled block; a single left rule plus a fill is allowed for selection/state". §5.3 puts 4px on "the item-picker box" (`PLAN.md:618`), but the plate's rows are square and rule-separated (`plate.css:186-191`, no radius); drop the item-picker from the radius list. §3.3 says Reject has a 1px `--blocked` border (`PLAN.md:445`), while §5.5 and the plate use `--rule-strong` (`PLAN.md:641`; `plate.css:157`); pick the plate's quieter border.

**m8. The round-2 self-correction misquotes round 1.** §4.3 says round 1 claimed "`$1.00` over and `$2.00` under" (`PLAN.md:515`); round 1 actually said "`$1.00` over the reject floor and `$1.00` under the accept floor" (`CRITIQUE.md:27`). The current caption is correct, but the narrative misstates the prior error; fix the record.

**m9. The band's left zone is named "below-floor" though it includes floor→reject.** §4.3 calls `0 → pct(reject)` "below-floor" (`PLAN.md:495`); a `$24.50` offer is above the `$23.00` floor and below the `$25.00` reject line, so the name is false. Rename to "below the reject line" (and any legend), or a vendor reading "BELOW FLOOR" is misled.

**m10. The reprice action is hidden at 390 with no rule.** The plate's "Simulate repricing" buttons are 0×0 at 390; §3.3/§8.2 say the listing keeps supplier/list/floor below 1024 but do not say where the action goes (`PLAN.md:446/858`). State it — otherwise the blocked-order demo flow is desktop-only.

**m11. "Exactly one submit button on the page" is false for the vendor page.** §3.2.1 says this (`PLAN.md:314`), but the vendor page has Accept/Reject/Counter/Send plus three reprice buttons. Scope the rule to the buyer negotiation page or say "one primary action per step".

**m12. The transcript table omits the `COUNTERED` decision row.** §7.3's table has PENDING (3), ACCEPTED (2), REJECTED, SUPERSEDED (`PLAN.md:785-795`); the vendor counter marks the buyer's prior offer `COUNTERED` (`negotiation-service.ts:255-258`), and the plan assigns "Countered" to the vendor's new PENDING offer (line 791), leaving the prior row undefined. Add `COUNTERED` → `Countered` / "The supplier replied with a new price." and give the vendor's pending counter a distinct word ("Awaiting you"), or document the two-row duplicate.

## What is genuinely good

- The lane deletion is evidence-led, not a dodge: the engine opens every supplier at the target, so the lane's x-axis is degenerate; the board + order line is the better instrument. This is the right kind of self-correction.
- The order line is a real spine: five states, one action, the commit chain reads in order, and the blocked/confirmed states use `authorizedAt`/`createdAt` instead of an invented timestamp.
- The plate is real, rendered, measured, and mostly high quality: the warm plane, the Archivo/Plex Mono split, tabular money, the 6px status square, the no-cards rule, and the band geometry all read as a considered product, not generic admin.
- The vendor page is the strongest surface: the queue + detail band + decision block is specific to this domain, and the blocked strip's structural frozen-vs-live diff is robust and honest.
- The 390 work is mostly right: no horizontal overflow (376/376), the ledger/band/board/transcript/queue stack, and the mobile type still reads. The composer is the one exception.
- The copy is restrained: no hype, no fake precision, no "successfully"; the "Nothing was charged, and the agreed price no longer holds" and "no payment processed in this demo" lines are exactly right.
- The process is working: the plate-before-build checkpoint was delivered, and the 20:47 contrast correction shows the plan is being checked against evidence rather than defended.

VERDICT: CHANGES REQUIRED
