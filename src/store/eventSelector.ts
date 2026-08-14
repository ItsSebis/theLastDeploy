import type { EventDanger, NightEvent } from "../content/types";
import { DANGER_WEIGHT_MULTIPLIER } from "./sprintEconomy";
import { nextRandom } from "../utils/rng";

export interface EventPick {
  event: NightEvent;
  nextRngState: number;
}

function weightFor(event: NightEvent, dangerTier: EventDanger): number {
  const multiplier = event.danger
    ? DANGER_WEIGHT_MULTIPLIER[dangerTier][event.danger as EventDanger]
    : 1;
  return event.weight * multiplier;
}

// Weighted random pick, gated by minSprint/maxSprint (docs/04-content-schema.md).
// Softly excludes the previous incident when more than one is eligible, so the
// same incident doesn't fire twice in a row. Weights are further biased by how
// each event's `danger` tag relates to the run's current danger tier.
export function pickNightEvent(
  events: NightEvent[],
  sprintNumber: number,
  lastEventId: string | null,
  rngState: number,
  dangerTier: EventDanger,
): EventPick {
  const eligible = events.filter(
    (e) =>
      (e.minSprint === undefined || sprintNumber >= e.minSprint) &&
      (e.maxSprint === undefined || sprintNumber <= e.maxSprint),
  );

  if (eligible.length === 0) {
    throw new Error(`No eligible night events for sprint ${sprintNumber}`);
  }

  const pool = eligible.length > 1 ? eligible.filter((e) => e.id !== lastEventId) : eligible;

  const totalWeight = pool.reduce((sum, e) => sum + weightFor(e, dangerTier), 0);
  const { value, nextState } = nextRandom(rngState);
  let roll = value * totalWeight;

  for (const event of pool) {
    roll -= weightFor(event, dangerTier);
    if (roll <= 0) {
      return { event, nextRngState: nextState };
    }
  }

  return { event: pool[pool.length - 1], nextRngState: nextState };
}
