import type { EventDanger, ResourceKey } from "../content/types";

// All numbers below are Phase 1 placeholders, picked to make one run
// playable start to finish. They need a real balance pass after playtesting
// (see docs/05-roadmap-phases.md, Phase 5) -- do not treat them as final.

export const STARTING_RESOURCES: Record<ResourceKey, number> = {
  coffee: 70,
  sanity: 70,
  reputation: 20,
  runway: 20,
  techDebt: 10,
};

export const FOCUS_PER_SPRINT = 3;
export const FOCUS_PER_SPRINT_COFFEE_ZERO = 1;

export const SCRAMBLE_DURATION_SECONDS = 40;
export const SCRAMBLE_INVENTORY_CAP = 5;

export const TAKE_OFFER_REPUTATION_THRESHOLD = 50;

export const TECH_DEBT_SPRINT_DRIFT = 5;
export const RUNWAY_SPRINT_DRIFT = -5;
export const SENIOR_DEV_TECH_DEBT_DRIFT_REDUCTION = 0.1;

export const RESOURCE_MIN = 0;
export const RESOURCE_MAX = 100; // only applied to coffee/sanity/reputation; runway & techDebt are floor-only

// Single source of truth for "how bad is it right now" -- mirrors the
// thresholds ProblemsBadge already shows the player on the Tech Debt badge,
// so the difficulty knob the player sees is literally what's driving it.
const DANGER_TECH_DEBT_HIGH = 60;
const DANGER_TECH_DEBT_MEDIUM = 30;

export function dangerTierFromTechDebt(techDebt: number): EventDanger {
  if (techDebt >= DANGER_TECH_DEBT_HIGH) return "high";
  if (techDebt >= DANGER_TECH_DEBT_MEDIUM) return "medium";
  return "low";
}

// Chance a given day-end rolls no incident at all.
export const PEACEFUL_NIGHT_CHANCE: Record<EventDanger, number> = {
  low: 0.35,
  medium: 0.15,
  high: 0.05,
};

// Soft bias multiplier applied to an event's `weight` based on how its own
// `danger` tag relates to the current run's danger tier. Events without a
// `danger` tag are untouched (multiplier 1) regardless of tier.
export const DANGER_WEIGHT_MULTIPLIER: Record<EventDanger, Record<EventDanger, number>> = {
  low: { low: 1.6, medium: 1, high: 0.5 },
  medium: { low: 1, medium: 1.3, high: 1 },
  high: { low: 0.5, medium: 1, high: 1.8 },
};

export interface SprintAction {
  id: string;
  name: string;
  focusCost: number;
  effects: Partial<Record<ResourceKey, number>>;
  description: string;
}

export const SPRINT_ACTIONS: SprintAction[] = [
  {
    id: "refactor",
    name: "Refactor",
    focusCost: 1,
    effects: { techDebt: -15 },
    description: "Pay down debt now so it doesn't bite later.",
  },
  {
    id: "network",
    name: "Network",
    focusCost: 1,
    effects: { reputation: 6, coffee: -8 },
    description: "Coffee chats and LinkedIn posts. Slow, steady reputation.",
  },
  {
    id: "rest",
    name: "Rest",
    focusCost: 1,
    effects: { coffee: 20, sanity: 12 },
    description: "Step away from the keyboard. Actually rest.",
  },
  {
    id: "check_in",
    name: "Check In with Companion",
    focusCost: 1,
    effects: { sanity: 10 },
    description: "Talk to someone who gets it.",
  },
];

export const TAKE_OFFER_ACTION_ID = "take_offer";
