import type { NightEvent } from "../content/types";
import { nextRandom } from "../utils/rng";

export interface EventPick {
  event: NightEvent;
  nextRngState: number;
}

// Weighted random pick, gated by minSprint/maxSprint (docs/04-content-schema.md).
// Softly excludes the previous incident when more than one is eligible, so the
// same incident doesn't fire twice in a row.
export function pickNightEvent(
  events: NightEvent[],
  sprintNumber: number,
  lastEventId: string | null,
  rngState: number,
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

  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
  const { value, nextState } = nextRandom(rngState);
  let roll = value * totalWeight;

  for (const event of pool) {
    roll -= event.weight;
    if (roll <= 0) {
      return { event, nextRngState: nextState };
    }
  }

  return { event: pool[pool.length - 1], nextRngState: nextState };
}
