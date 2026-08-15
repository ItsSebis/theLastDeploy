export type ResourceKey = "coffee" | "sanity" | "reputation" | "runway" | "techDebt";

export interface Item {
  id: string;
  name: string;
  description: string;
  // "default" for Phase 1 seed content; wider union of unlock ids added in Phase 4 (meta-progression).
  unlockedBy: string;
  flavorOnUse: string;
}

// Documents the intended values of NightEvent.danger below; kept as `string`
// on the interface itself so plain JSON content (typed broadly by TS) still
// satisfies it (same accommodation as EndingTier/Ending.tier below).
export type EventDanger = "low" | "medium" | "high";

// Documents the intended values of ItemOutcome.tier below; kept as `string`
// on the interface itself for the same reason as EventDanger above.
export type ItemOutcomeTier = "perfect" | "neutral" | "bad";

export interface ItemOutcome {
  tier: string;
  text: string;
  effects: Partial<Record<ResourceKey, number>>;
  // Removes the item from inventory after this outcome fires. Only ever
  // authored on "perfect" outcomes -- fumbling a neutral/bad match
  // shouldn't cost the player the item.
  consumed?: boolean;
}

export interface NightEvent {
  id: string;
  name: string;
  description: string;
  // Keyed by itemId. Items with no entry here fall through to failText/failEffects.
  itemOutcomes: Record<string, ItemOutcome>;
  failText: string;
  failEffects: Partial<Record<ResourceKey, number>>;
  ignoreText: string;
  ignoreEffects: Partial<Record<ResourceKey, number>>;
  // Rare: ignoring is the *correct* response -- reacting is what creates the
  // problem. When true, ignoreEffects should read as a relief, not a punishment.
  ignoreIsCorrect?: boolean;
  // Soft-biases weighted event selection toward the run's current danger
  // tier (see sprintEconomy.ts); optional, absent on content that predates it.
  danger?: string;
  weight: number;
  minSprint?: number;
  maxSprint?: number;
}

export interface Gig {
  id: string;
  name: string;
  focusCost: number;
  effects: Partial<Record<ResourceKey, number>>;
}

export interface CompanionQuitCondition {
  id: string;
  // A condition fires when ALL present fields below are satisfied (AND).
  // A companion quits when ANY condition in Companion.quitConditions fires
  // (OR across conditions) -- unlike Ending.requirements' single AND-block,
  // one companion can have two unrelated quit reasons (e.g. the intern:
  // 30 sprints in the party OR relationship gets too chatty).
  // Intended values are ResourceKey; kept as `string` here so plain JSON
  // content still satisfies it (same accommodation as EventDanger/EndingTier
  // above).
  resource?: string;
  min?: number; // fires when resource >= min
  max?: number; // fires when resource <= max
  relationshipMin?: number;
  relationshipMax?: number;
  sprintsInPartyMin?: number;
}

export interface CompanionSupport {
  id: string;
  name: string;
  description: string;
  relationshipMin: number; // "good relationship" gate before this can ever be offered
  offerChance: number; // per-sprint roll once gated, same shape as PEACEFUL_NIGHT_CHANCE
}

export interface Companion {
  id: string;
  name: string;
  description: string;
  passive: string;
  relationshipEvents: string[];
  unlockedBy: string;
  dailyCost: number;
  quitConditions: CompanionQuitCondition[]; // [] = never quits via this system
  quitFlavorText: string;
  support: CompanionSupport;
}

export interface EndingRequirementRange {
  min?: number;
  max?: number;
}

export interface EndingRequirements {
  coffee?: EndingRequirementRange;
  sanity?: EndingRequirementRange;
  reputation?: EndingRequirementRange;
  runway?: EndingRequirementRange;
  techDebt?: EndingRequirementRange;
  requiredItemsUsed?: string[];
}

// Documents the intended values of Ending.tier below; kept as `string` on the
// interface itself so plain JSON content (typed broadly by TS) still satisfies it.
export type EndingTier = "forced_fail" | "true_ending" | "standard" | "neutral" | "secret";

export interface Ending {
  id: string;
  name: string;
  tier: string;
  requirements: EndingRequirements;
  text: string;
}
