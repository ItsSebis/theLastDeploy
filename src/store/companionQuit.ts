import type { Companion, CompanionQuitCondition, ResourceKey } from "../content/types";

export interface QuitCheckInput {
  resources: Record<ResourceKey, number>;
  relationshipLevel: number;
  sprintsInParty: number;
}

function conditionFires(condition: CompanionQuitCondition, input: QuitCheckInput): boolean {
  if (condition.resource !== undefined) {
    const value = input.resources[condition.resource as ResourceKey];
    if (condition.min !== undefined && value < condition.min) return false;
    if (condition.max !== undefined && value > condition.max) return false;
  }
  if (condition.relationshipMin !== undefined && input.relationshipLevel < condition.relationshipMin) {
    return false;
  }
  if (condition.relationshipMax !== undefined && input.relationshipLevel > condition.relationshipMax) {
    return false;
  }
  if (condition.sprintsInPartyMin !== undefined && input.sprintsInParty < condition.sprintsInPartyMin) {
    return false;
  }
  return true;
}

// Companion quits when ANY of its quitConditions fires (OR across
// conditions) -- see the comment on CompanionQuitCondition in content/types.ts.
export function evaluateCompanionQuit(
  companion: Companion,
  input: QuitCheckInput,
): CompanionQuitCondition | null {
  for (const condition of companion.quitConditions) {
    if (conditionFires(condition, input)) return condition;
  }
  return null;
}
