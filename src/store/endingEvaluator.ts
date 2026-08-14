import type { Ending, EndingRequirements } from "../content/types";
import type { GameFlags } from "./types";
import type { ResourceKey } from "../content/types";

export const FALLBACK_ENDING_ID = "forever_freelance";

const RANGE_KEYS: readonly (keyof EndingRequirements & ResourceKey)[] = [
  "coffee",
  "sanity",
  "reputation",
  "runway",
  "techDebt",
];

function countRequirementKeys(requirements: EndingRequirements): number {
  return Object.keys(requirements).length;
}

function meetsRequirements(
  resources: Record<ResourceKey, number>,
  flags: GameFlags,
  requirements: EndingRequirements,
): boolean {
  for (const key of RANGE_KEYS) {
    const range = requirements[key];
    if (!range) continue;
    const value = resources[key];
    if (range.min !== undefined && value < range.min) return false;
    if (range.max !== undefined && value > range.max) return false;
  }

  if (requirements.requiredItemsUsed) {
    const allUsed = requirements.requiredItemsUsed.every((id) => flags.itemsUsed.includes(id));
    if (!allUsed) return false;
  }

  return true;
}

// Generic evaluator: reads each ending's declarative `requirements` block and
// checks it against current run state. No per-ending branching -- new endings
// only need a requirements block in endings.json. Ties broken by specificity
// (most requirement keys wins) so e.g. clean_refactor is checked before a
// looser standard ending even if both would technically pass.
export function evaluateEndings(
  resources: Record<ResourceKey, number>,
  flags: GameFlags,
  endings: Ending[],
): Ending {
  const candidates = endings
    .filter((e) => e.id !== FALLBACK_ENDING_ID && e.tier !== "forced_fail")
    .sort((a, b) => countRequirementKeys(b.requirements) - countRequirementKeys(a.requirements));

  for (const ending of candidates) {
    if (meetsRequirements(resources, flags, ending.requirements)) {
      return ending;
    }
  }

  const fallback = endings.find((e) => e.id === FALLBACK_ENDING_ID);
  if (!fallback) {
    throw new Error(`Fallback ending "${FALLBACK_ENDING_ID}" is missing from endings.json`);
  }
  return fallback;
}
