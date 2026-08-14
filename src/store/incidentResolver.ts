import type { NightEvent, ResourceKey } from "../content/types";

export interface IncidentOutcome {
  success: boolean;
  text: string;
  effects: Partial<Record<ResourceKey, number>>;
  multiplier: number;
}

export function resolveIncident(
  event: NightEvent,
  itemId: string | null,
  techDebt: number,
): IncidentOutcome {
  const success = itemId !== null && event.counteredBy.includes(itemId);

  if (success) {
    return {
      success: true,
      text: event.onCounteredText,
      effects: event.successEffects ?? {},
      multiplier: 1,
    };
  }

  return {
    success: false,
    text: event.onFailText,
    effects: event.failEffects,
    multiplier: 1 + techDebt / 100,
  };
}
