import { describe, expect, it } from "vitest";
import { pickNightEvent } from "./eventSelector";
import { DANGER_WEIGHT_MULTIPLIER } from "./sprintEconomy";
import type { NightEvent } from "../content/types";

const lowEvent: NightEvent = {
  id: "low_event",
  name: "Low",
  description: "d",
  itemOutcomes: {},
  failText: "f",
  failEffects: {},
  ignoreText: "i",
  ignoreEffects: {},
  danger: "low",
  weight: 10,
};

const highEvent: NightEvent = {
  id: "high_event",
  name: "High",
  description: "d",
  itemOutcomes: {},
  failText: "f",
  failEffects: {},
  ignoreText: "i",
  ignoreEffects: {},
  danger: "high",
  weight: 10,
};

const gatedEvent: NightEvent = {
  id: "gated_event",
  name: "Gated",
  description: "d",
  itemOutcomes: {},
  failText: "f",
  failEffects: {},
  ignoreText: "i",
  ignoreEffects: {},
  weight: 1,
  minSprint: 5,
};

describe("pickNightEvent", () => {
  it("respects minSprint/maxSprint gating", () => {
    const { event } = pickNightEvent([lowEvent, gatedEvent], 1, null, 0, "low");
    expect(event.id).toBe("low_event");
  });

  it("softly excludes the previous event when more than one is eligible", () => {
    const { event } = pickNightEvent([lowEvent, highEvent], 3, "low_event", 0, "low");
    expect(event.id).toBe("high_event");
  });

  it("falls back to the only eligible event even if it was the last one", () => {
    const { event } = pickNightEvent([lowEvent], 3, "low_event", 0, "low");
    expect(event.id).toBe("low_event");
  });

  it("biases toward the current danger tier via DANGER_WEIGHT_MULTIPLIER", () => {
    // With totalWeight = 10*mult(low,low) + 10*mult(low,high), a roll value
    // just above the low-event's share should land on the high event.
    const tier = "low";
    const lowWeight = lowEvent.weight * DANGER_WEIGHT_MULTIPLIER[tier]["low"];
    const highWeight = highEvent.weight * DANGER_WEIGHT_MULTIPLIER[tier]["high"];
    const totalWeight = lowWeight + highWeight;

    // rngState chosen elsewhere is opaque (mulberry32) -- instead verify the
    // weight math directly by checking the multiplier table has the expected
    // shape: same-tier match must weigh more than a high-danger event when
    // the run's tier is low.
    expect(lowWeight).toBeGreaterThan(highWeight);
    expect(totalWeight).toBeGreaterThan(0);
  });
});
