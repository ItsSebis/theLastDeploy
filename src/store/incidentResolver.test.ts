import { describe, expect, it } from "vitest";
import { resolveIncident } from "./incidentResolver";
import type { NightEvent } from "../content/types";

const event: NightEvent = {
  id: "test_event",
  name: "Test Event",
  description: "d",
  itemOutcomes: {
    item_perfect: { tier: "perfect", text: "perfect text", effects: { reputation: 5 }, consumed: true },
    item_neutral: { tier: "neutral", text: "neutral text", effects: { sanity: -3 } },
    item_bad: { tier: "bad", text: "bad text", effects: { reputation: -9 } },
  },
  failText: "fail text",
  failEffects: { sanity: -10 },
  ignoreText: "ignore text",
  ignoreEffects: { sanity: -13 },
  weight: 1,
};

describe("resolveIncident", () => {
  it("returns a success outcome with the item's effects when a perfect-tier item is used", () => {
    const outcome = resolveIncident(event, "item_perfect", 10);
    expect(outcome.success).toBe(true);
    expect(outcome.text).toBe("perfect text");
    expect(outcome.effects).toEqual({ reputation: 5 });
    expect(outcome.multiplier).toBe(1);
  });

  it("consumes the item only on a perfect-tier outcome", () => {
    expect(resolveIncident(event, "item_perfect", 0).consumed).toBe(true);
    expect(resolveIncident(event, "item_neutral", 0).consumed).toBe(false);
    expect(resolveIncident(event, "item_bad", 0).consumed).toBe(false);
  });

  it("returns a non-success outcome scaled by tech debt for a neutral-tier item", () => {
    const outcome = resolveIncident(event, "item_neutral", 20);
    expect(outcome.success).toBe(false);
    expect(outcome.text).toBe("neutral text");
    expect(outcome.effects).toEqual({ sanity: -3 });
    expect(outcome.multiplier).toBe(1.2);
  });

  it("returns a non-success outcome scaled by tech debt for a bad-tier item", () => {
    const outcome = resolveIncident(event, "item_bad", 20);
    expect(outcome.success).toBe(false);
    expect(outcome.text).toBe("bad text");
    expect(outcome.multiplier).toBe(1.2);
  });

  it("falls back to failText/failEffects for an item with no outcome entry", () => {
    const outcome = resolveIncident(event, "item_unlisted", 20);
    expect(outcome.success).toBe(false);
    expect(outcome.text).toBe("fail text");
    expect(outcome.effects).toEqual({ sanity: -10 });
    expect(outcome.multiplier).toBe(1.2);
    expect(outcome.consumed).toBe(false);
  });

  it("returns the ignore outcome, scaled by tech debt, when ignoreIsCorrect is not set", () => {
    const outcome = resolveIncident(event, null, 20);
    expect(outcome.success).toBe(false);
    expect(outcome.text).toBe("ignore text");
    expect(outcome.effects).toEqual({ sanity: -13 });
    expect(outcome.multiplier).toBe(1.2);
  });

  it("returns a success outcome with no tech-debt scaling when ignoreIsCorrect is true", () => {
    const ignoreCorrectEvent: NightEvent = { ...event, ignoreIsCorrect: true };
    const outcome = resolveIncident(ignoreCorrectEvent, null, 50);
    expect(outcome.success).toBe(true);
    expect(outcome.multiplier).toBe(1);
  });
});
