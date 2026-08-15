import type { ResourceKey } from "../content/types";
import {
  DESIGNER_SUPPORT_REPUTATION_BOOST,
  INTERN_SUPPORT_REPUTATION_BOOST,
  INTERN_SUPPORT_RUNWAY_BOOST,
  PM_SUPPORT_REPUTATION_BOOST,
} from "./sprintEconomy";

export interface SupportEffectResult {
  effects: Partial<Record<ResourceKey, number>>;
  // senior_dev's Support clears Tech Debt outright rather than applying a
  // delta -- kept as an explicit flag instead of a huge negative delta so it
  // reads as "reset to zero" regardless of the current value.
  setTechDebtToZero?: boolean;
}

// QA Ghost's Support ("Guard the Night") doesn't touch resources at all --
// it's handled directly in gameStore via qaGhost.guardActive, not through
// this function.
export function applySupportEffect(companionId: string): SupportEffectResult {
  switch (companionId) {
    case "senior_dev":
      return { effects: {}, setTechDebtToZero: true };
    case "pm_circling_back":
      return { effects: { reputation: PM_SUPPORT_REPUTATION_BOOST } };
    case "figma_designer":
      return { effects: { reputation: DESIGNER_SUPPORT_REPUTATION_BOOST } };
    case "the_intern":
      return {
        effects: { reputation: INTERN_SUPPORT_REPUTATION_BOOST, runway: INTERN_SUPPORT_RUNWAY_BOOST },
      };
    default:
      return { effects: {} };
  }
}
