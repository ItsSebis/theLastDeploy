import type { ResourceKey } from "../content/types";

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

export const SCRAMBLE_DURATION_SECONDS = 45;
export const SCRAMBLE_INVENTORY_CAP = 4;

export const TAKE_OFFER_REPUTATION_THRESHOLD = 50;

export const TECH_DEBT_SPRINT_DRIFT = 5;
export const RUNWAY_SPRINT_DRIFT = -5;
export const SENIOR_DEV_TECH_DEBT_DRIFT_REDUCTION = 0.1;

export const RESOURCE_MIN = 0;
export const RESOURCE_MAX = 100; // only applied to coffee/sanity/reputation; runway & techDebt are floor-only

export interface SprintAction {
  id: string;
  name: string;
  focusCost: number;
  effects: Partial<Record<ResourceKey, number>>;
  description: string;
}

export const SPRINT_ACTIONS: SprintAction[] = [
  {
    id: "take_gig",
    name: "Take a Gig",
    focusCost: 1,
    effects: { runway: 10, reputation: 5, coffee: -12, sanity: -8 },
    description: "Bill some hours. Money in, energy out.",
  },
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
