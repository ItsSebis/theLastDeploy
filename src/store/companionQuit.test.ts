import { describe, expect, it } from "vitest";
import { evaluateCompanionQuit } from "./companionQuit";
import { companionsById } from "../content";
import type { Companion, ResourceKey } from "../content/types";

const BASE_RESOURCES: Record<ResourceKey, number> = {
  coffee: 50,
  sanity: 50,
  reputation: 50,
  runway: 50,
  techDebt: 10,
};

function makeCompanion(overrides: Partial<Companion> = {}): Companion {
  return {
    id: "test_companion",
    name: "Test Companion",
    description: "d",
    passive: "p",
    relationshipEvents: [],
    unlockedBy: "default",
    dailyCost: 1,
    quitConditions: [],
    quitFlavorText: "They're gone.",
    support: { id: "s", name: "Support", description: "d", relationshipMin: 2, offerChance: 0.2 },
    ...overrides,
  };
}

describe("evaluateCompanionQuit", () => {
  it("returns null when quitConditions is empty", () => {
    const companion = makeCompanion({ quitConditions: [] });
    const result = evaluateCompanionQuit(companion, {
      resources: BASE_RESOURCES,
      relationshipLevel: 0,
      sprintsInParty: 999,
    });
    expect(result).toBeNull();
  });

  it("fires a resource-min + relationship-max condition once both are satisfied", () => {
    const condition = { id: "tech_debt_high", resource: "techDebt" as const, min: 60, relationshipMax: 1 };
    const companion = makeCompanion({ quitConditions: [condition] });

    expect(
      evaluateCompanionQuit(companion, {
        resources: { ...BASE_RESOURCES, techDebt: 60 },
        relationshipLevel: 1,
        sprintsInParty: 5,
      }),
    ).toEqual(condition);

    expect(
      evaluateCompanionQuit(companion, {
        resources: { ...BASE_RESOURCES, techDebt: 59 },
        relationshipLevel: 1,
        sprintsInParty: 5,
      }),
    ).toBeNull();

    expect(
      evaluateCompanionQuit(companion, {
        resources: { ...BASE_RESOURCES, techDebt: 60 },
        relationshipLevel: 2,
        sprintsInParty: 5,
      }),
    ).toBeNull();
  });

  it("fires a resource-max condition when the resource drops to or below max", () => {
    const condition = { id: "reputation_low", resource: "reputation" as const, max: 20, relationshipMax: 1 };
    const companion = makeCompanion({ quitConditions: [condition] });

    expect(
      evaluateCompanionQuit(companion, {
        resources: { ...BASE_RESOURCES, reputation: 20 },
        relationshipLevel: 0,
        sprintsInParty: 5,
      }),
    ).toEqual(condition);

    expect(
      evaluateCompanionQuit(companion, {
        resources: { ...BASE_RESOURCES, reputation: 21 },
        relationshipLevel: 0,
        sprintsInParty: 5,
      }),
    ).toBeNull();
  });

  it("evaluates two independent conditions with OR semantics (intern's two quit reasons)", () => {
    const thirtySprintsCondition = { id: "thirty_sprints", sprintsInPartyMin: 30 };
    const overChattingCondition = { id: "over_chatting", relationshipMin: 6 };
    const companion = makeCompanion({ quitConditions: [thirtySprintsCondition, overChattingCondition] });

    expect(
      evaluateCompanionQuit(companion, { resources: BASE_RESOURCES, relationshipLevel: 0, sprintsInParty: 30 }),
    ).toEqual(thirtySprintsCondition);

    expect(
      evaluateCompanionQuit(companion, { resources: BASE_RESOURCES, relationshipLevel: 6, sprintsInParty: 1 }),
    ).toEqual(overChattingCondition);

    expect(
      evaluateCompanionQuit(companion, { resources: BASE_RESOURCES, relationshipLevel: 0, sprintsInParty: 1 }),
    ).toBeNull();
  });
});

describe("evaluateCompanionQuit against real content", () => {
  it("does not cross-trigger PM's and the Designer's reputation-based quit at the same threshold", () => {
    const pm = companionsById.pm_circling_back;
    const designer = companionsById.figma_designer;

    // Reputation value that quits the PM (bad relationship for both) should
    // not also quit the Designer, since their thresholds/gates are distinct.
    const input = { resources: { ...BASE_RESOURCES, reputation: 18 }, relationshipLevel: 1, sprintsInParty: 5 };
    expect(evaluateCompanionQuit(pm, input)).not.toBeNull();
    expect(evaluateCompanionQuit(designer, input)).toBeNull();
  });

  it("qa_ghost never quits regardless of input", () => {
    const qaGhost = companionsById.qa_ghost;
    const result = evaluateCompanionQuit(qaGhost, {
      resources: { ...BASE_RESOURCES, reputation: 0, techDebt: 100 },
      relationshipLevel: 0,
      sprintsInParty: 9999,
    });
    expect(result).toBeNull();
  });

  it("the intern quits after 30 sprints in the party", () => {
    const intern = companionsById.the_intern;
    const result = evaluateCompanionQuit(intern, {
      resources: BASE_RESOURCES,
      relationshipLevel: 0,
      sprintsInParty: 30,
    });
    expect(result?.id).toBe("thirty_sprints");
  });

  it("the intern quits from over-chatting even before 30 sprints", () => {
    const intern = companionsById.the_intern;
    const result = evaluateCompanionQuit(intern, {
      resources: BASE_RESOURCES,
      relationshipLevel: 6,
      sprintsInParty: 2,
    });
    expect(result?.id).toBe("over_chatting");
  });
});
