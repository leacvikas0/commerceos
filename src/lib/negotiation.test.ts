import { describe, expect, it } from "vitest";
import {
  budgetUnitCapMinor,
  counterOfferMinor,
  decideOffer,
  initialBuyerOfferMinor,
  recommendDeal,
  statusFromDecisions,
  type DealCandidate,
} from "./negotiation";

const bands = {
  autoAcceptFloorMinor: 2900,
  autoRejectBelowMinor: 2600,
};

describe("decideOffer — the three decision bands", () => {
  it("auto-accepts at or above the auto-accept floor", () => {
    expect(decideOffer(2900, bands)).toBe("ACCEPTED");
    expect(decideOffer(5000, bands)).toBe("ACCEPTED");
  });

  it("auto-rejects strictly below the auto-reject threshold", () => {
    expect(decideOffer(2599, bands)).toBe("REJECTED");
    expect(decideOffer(0, bands)).toBe("REJECTED");
  });

  it("sends the borderline middle band to vendor review", () => {
    expect(decideOffer(2600, bands)).toBe("PENDING");
    expect(decideOffer(2750, bands)).toBe("PENDING");
    expect(decideOffer(2899, bands)).toBe("PENDING");
  });
});

describe("budgetUnitCapMinor", () => {
  it("divides the total budget by quantity, rounding down", () => {
    expect(budgetUnitCapMinor(250000, 100)).toBe(2500);
    expect(budgetUnitCapMinor(250001, 100)).toBe(2500);
  });
});

describe("initialBuyerOfferMinor", () => {
  it("never offers below the supplier floor", () => {
    expect(
      initialBuyerOfferMinor({
        targetUnitPriceMinor: 2000,
        floorPriceMinor: 2450,
        budgetCapMinor: 250000,
        quantity: 100,
      }),
    ).toBe(2450);
  });

  it("never offers above the per-unit budget cap", () => {
    expect(
      initialBuyerOfferMinor({
        targetUnitPriceMinor: 3000,
        floorPriceMinor: 2450,
        budgetCapMinor: 25000, // cap = 250/unit
        quantity: 100,
      }),
    ).toBe(250);
  });

  it("uses the target when it sits inside floor and budget", () => {
    expect(
      initialBuyerOfferMinor({
        targetUnitPriceMinor: 2700,
        floorPriceMinor: 2450,
        budgetCapMinor: 350000, // cap = 3500/unit, not binding
        quantity: 100,
      }),
    ).toBe(2700);
  });
});

describe("counterOfferMinor", () => {
  it("closes half of the gap to the list price", () => {
    // gap = 3200 - 2500 = 700, half = 350
    expect(
      counterOfferMinor({
        currentOfferMinor: 2500,
        listPriceMinor: 3200,
        budgetCapMinor: 350000, // cap = 3500/unit, not binding
        quantity: 100,
      }),
    ).toBe(2850);
  });

  it("clamps the counter to the per-unit budget cap", () => {
    // 2500 + 350 = 2850, but cap = 2800
    expect(
      counterOfferMinor({
        currentOfferMinor: 2500,
        listPriceMinor: 3200,
        budgetCapMinor: 280000,
        quantity: 100,
      }),
    ).toBe(2800);
  });

  it("never counters downward when the offer is already at or above list", () => {
    expect(
      counterOfferMinor({
        currentOfferMinor: 3300,
        listPriceMinor: 3200,
        budgetCapMinor: 250000,
        quantity: 100,
      }),
    ).toBe(3300);
  });
});

describe("statusFromDecisions", () => {
  it("is AGREED when any supplier accepted", () => {
    expect(statusFromDecisions(["REJECTED", "ACCEPTED", "PENDING"])).toBe(
      "AGREED",
    );
  });

  it("is AWAITING_VENDOR when only borderline offers remain", () => {
    expect(statusFromDecisions(["REJECTED", "PENDING"])).toBe("AWAITING_VENDOR");
  });

  it("is REJECTED when every supplier rejected", () => {
    expect(statusFromDecisions(["REJECTED", "REJECTED"])).toBe("REJECTED");
  });
});

describe("recommendDeal", () => {
  const candidate = (
    offerId: string,
    unitPriceMinor: number,
    deliveryDays: number,
    reliabilityScore: number,
  ): DealCandidate => ({ offerId, unitPriceMinor, deliveryDays, reliabilityScore });

  it("picks the lowest accepted unit price", () => {
    const winner = recommendDeal([
      candidate("a", 2900, 3, 92),
      candidate("b", 2800, 5, 85),
      candidate("c", 3100, 2, 78),
    ]);
    expect(winner?.offerId).toBe("b");
  });

  it("breaks a price tie with the earliest delivery", () => {
    const winner = recommendDeal([
      candidate("a", 2800, 5, 92),
      candidate("b", 2800, 3, 78),
    ]);
    expect(winner?.offerId).toBe("b");
  });

  it("breaks a price+delivery tie with the higher reliability score", () => {
    const winner = recommendDeal([
      candidate("a", 2800, 3, 78),
      candidate("b", 2800, 3, 92),
    ]);
    expect(winner?.offerId).toBe("b");
  });

  it("returns null when nothing was accepted", () => {
    expect(recommendDeal([])).toBeNull();
  });
});
