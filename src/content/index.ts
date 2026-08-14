import itemsData from "./items.json";
import eventsData from "./events.json";
import companionsData from "./companions.json";
import endingsData from "./endings.json";
import type { Companion, Ending, Item, NightEvent } from "./types";

export const items = itemsData satisfies Item[];
export const events = eventsData satisfies NightEvent[];
export const companions = companionsData satisfies Companion[];
export const endings = endingsData satisfies Ending[];

function toMap<T extends { id: string }>(list: T[]): Record<string, T> {
  return Object.fromEntries(list.map((entry) => [entry.id, entry]));
}

export const itemsById = toMap(items);
export const eventsById = toMap(events);
export const companionsById = toMap(companions);
export const endingsById = toMap(endings);

export type { Companion, Ending, EndingRequirements, Item, NightEvent, ResourceKey } from "./types";
