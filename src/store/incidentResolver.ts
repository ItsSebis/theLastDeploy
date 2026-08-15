import type { NightEvent, ResourceKey } from "../content/types";

export interface IncidentOutcome {
  success: boolean;
  text: string;
  effects: Partial<Record<ResourceKey, number>>;
  multiplier: number;
  consumed: boolean;
}

export function resolveIncident(
  event: NightEvent,
  itemId: string | null,
  techDebt: number,
): IncidentOutcome {
  const failMultiplier = 1 + techDebt / 100;

  if (itemId === null) {
    const success = event.ignoreIsCorrect === true;
    return {
      success,
      text: event.ignoreText,
      effects: event.ignoreEffects,
      multiplier: success ? 1 : failMultiplier,
      consumed: false,
    };
  }

  const outcome = event.itemOutcomes[itemId];
  if (!outcome) {
    return {
      success: false,
      text: event.failText,
      effects: event.failEffects,
      multiplier: failMultiplier,
      consumed: false,
    };
  }

  const success = outcome.tier === "perfect";
  return {
    success,
    text: outcome.text,
    effects: outcome.effects,
    multiplier: success ? 1 : failMultiplier,
    consumed: !!outcome.consumed,
  };
}
