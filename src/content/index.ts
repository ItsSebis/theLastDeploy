import itemsData from "./items.json";
import eventsData from "./events.json";
import companionsData from "./companions.json";
import endingsData from "./endings.json";
import gigsData from "./gigs.json";
import type { Companion, Ending, Gig, Item, NightEvent } from "./types";

export const items = itemsData satisfies Item[];
export const events = eventsData as NightEvent[];
export const companions = companionsData satisfies Companion[];
export const endings = endingsData satisfies Ending[];
export const gigs = gigsData satisfies Gig[];

function toMap<T extends { id: string }>(list: T[]): Record<string, T> {
  return Object.fromEntries(list.map((entry) => [entry.id, entry]));
}

export const itemsById = toMap(items);
export const eventsById = toMap(events);
export const companionsById = toMap(companions);
export const endingsById = toMap(endings);
export const gigsById = toMap(gigs);

export type { Companion, Ending, EndingRequirements, EventDanger, Gig, Item, NightEvent, ResourceKey } from "./types";
