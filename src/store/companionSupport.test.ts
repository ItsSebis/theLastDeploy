import { describe, expect, it } from "vitest";
import { applySupportEffect } from "./companionSupport";

describe("applySupportEffect", () => {
  it("clears Tech Debt to zero for senior_dev", () => {
    expect(applySupportEffect("senior_dev")).toEqual({ effects: {}, setTechDebtToZero: true });
  });

  it("boosts reputation for pm_circling_back", () => {
    expect(applySupportEffect("pm_circling_back")).toEqual({ effects: { reputation: 15 } });
  });

  it("boosts reputation for figma_designer, distinct from the PM's amount", () => {
    const result = applySupportEffect("figma_designer");
    expect(result).toEqual({ effects: { reputation: 12 } });
    expect(result.effects.reputation).not.toBe(applySupportEffect("pm_circling_back").effects.reputation);
  });

  it("boosts both reputation and runway for the_intern", () => {
    expect(applySupportEffect("the_intern")).toEqual({ effects: { reputation: 20, runway: 15 } });
  });

  it("returns no effects for an unknown/qa_ghost id", () => {
    expect(applySupportEffect("qa_ghost")).toEqual({ effects: {} });
  });
});
