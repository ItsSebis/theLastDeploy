import { describe, expect, it } from "vitest";
import { applyPurchase, canPurchase, SHOP_ITEMS } from "./shop";

describe("canPurchase", () => {
  it("disallows purchase when runway is too low", () => {
    expect(canPurchase("coffee_refill", 5, [])).toEqual({
      allowed: false,
      reason: "insufficient runway",
    });
  });

  it("disallows re-purchasing a non-repeatable item", () => {
    expect(canPurchase("better_coffee", 100, ["better_coffee"])).toEqual({
      allowed: false,
      reason: "already purchased",
    });
  });

  it("allows repeatable items to be bought again", () => {
    expect(canPurchase("coffee_refill", 100, ["coffee_refill"])).toEqual({ allowed: true });
  });

  it("allows a first-time purchase with enough runway", () => {
    expect(canPurchase("better_coffee", 100, [])).toEqual({ allowed: true });
  });

  it("rejects an unknown item id", () => {
    expect(canPurchase("not_a_real_item", 1000, [])).toEqual({
      allowed: false,
      reason: "unknown item",
    });
  });
});

describe("applyPurchase", () => {
  it("grants a permanent focus bonus for better_coffee", () => {
    expect(applyPurchase("better_coffee")).toEqual({
      runwayDelta: -20,
      focusBonusDelta: 1,
    });
  });

  it("sets coffee to 100 for coffee_refill", () => {
    expect(applyPurchase("coffee_refill")).toEqual({
      runwayDelta: -10,
      focusBonusDelta: 0,
      coffeeSetTo: 100,
    });
  });

  it("has no mechanical effect for junk items beyond the runway cost", () => {
    const junk = SHOP_ITEMS.find((i) => i.kind === "junk")!;
    expect(applyPurchase(junk.id)).toEqual({
      runwayDelta: -junk.cost,
      focusBonusDelta: 0,
    });
  });

  it("throws for an unknown item id", () => {
    expect(() => applyPurchase("not_a_real_item")).toThrow();
  });
});
