export type ResourceKey = "coffee" | "sanity" | "reputation" | "runway" | "techDebt";

export interface Item {
  id: string;
  name: string;
  description: string;
  counters: string[];
  // "default" for Phase 1 seed content; wider union of unlock ids added in Phase 4 (meta-progression).
  unlockedBy: string;
  flavorOnUse: string;
}

// Documents the intended values of NightEvent.danger below; kept as `string`
// on the interface itself so plain JSON content (typed broadly by TS) still
// satisfies it (same accommodation as EndingTier/Ending.tier below).
export type EventDanger = "low" | "medium" | "high";

export interface NightEvent {
  id: string;
  name: string;
  description: string;
  counteredBy: string[];
  onCounteredText: string;
  onFailText: string;
  failEffects: Partial<Record<ResourceKey, number>>;
  successEffects?: Partial<Record<ResourceKey, number>>;
  // Soft-biases weighted event selection toward the run's current danger
  // tier (see sprintEconomy.ts); optional, absent on content that predates it.
  danger?: string;
  weight: number;
  minSprint?: number;
  maxSprint?: number;
}

export interface Companion {
  id: string;
  name: string;
  description: string;
  passive: string;
  relationshipEvents: string[];
  unlockedBy: string;
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
