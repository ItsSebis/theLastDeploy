import { describe, expect, it } from "vitest";
import { resolveIncident } from "./incidentResolver";
import type { NightEvent } from "../content/types";

const event: NightEvent = {
  id: "test_event",
  name: "Test Event",
  description: "d",
  counteredBy: ["item_a"],
  onCounteredText: "success text",
  onFailText: "fail text",
  failEffects: { sanity: -10 },
  successEffects: { reputation: 5 },
  weight: 1,
};

describe("resolveIncident", () => {
  it("returns a success outcome with successEffects when the right item is used", () => {
    const outcome = resolveIncident(event, "item_a", 10);
    expect(outcome.success).toBe(true);
    expect(outcome.text).toBe("success text");
    expect(outcome.effects).toEqual({ reputation: 5 });
    expect(outcome.multiplier).toBe(1);
  });

  it("returns a fail outcome scaled by tech debt when the wrong item is used", () => {
    const outcome = resolveIncident(event, "item_b", 20);
    expect(outcome.success).toBe(false);
    expect(outcome.text).toBe("fail text");
    expect(outcome.effects).toEqual({ sanity: -10 });
    expect(outcome.multiplier).toBe(1.2);
  });

  it("returns a fail outcome when ignored (itemId null)", () => {
    const outcome = resolveIncident(event, null, 0);
    expect(outcome.success).toBe(false);
    expect(outcome.multiplier).toBe(1);
  });

  it("defaults effects to an empty object when the event has no successEffects", () => {
    const noBonus: NightEvent = { ...event, successEffects: undefined };
    const outcome = resolveIncident(noBonus, "item_a", 50);
    expect(outcome.effects).toEqual({});
  });
});
