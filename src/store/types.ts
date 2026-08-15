import type { NightEvent, ResourceKey } from "../content/types";

export type GamePhase = "intro" | "scramble_loot" | "scramble_companion" | "sprint" | "ending";

export type ActivityTab = "explorer" | "source_control" | "extensions" | "shop";

export interface LogEntry {
  id: string;
  sprintNumber: number;
  text: string;
}

export interface IncidentResolution {
  success: boolean;
  text: string;
}

export interface ActiveIncident {
  event: NightEvent;
  resolution: IncidentResolution | null;
}

export interface ScrambleState {
  timeRemaining: number;
  grabbedItemIds: string[];
}

export interface GameFlags {
  itemsUsed: string[];
  relationshipLevel: number;
  lastCheckedInSprint: number;
  companionHiredSprint: number; // sprint the current companionId was picked
  supportOffered: boolean; // pending, untriggered Support offer from the current companion
}

// QA Ghost lives outside the single companionId slot (see docs/08's Batch G
// implementation notes) -- it's bought before it's hired, so it needs to
// track relationship/state independently of whatever companionId holds.
export interface QaGhostState {
  buffActive: boolean;
  buffSprintsRemaining: number;
  relationshipLevel: number;
  hired: boolean;
  supportOffered: boolean;
  guardActive: boolean; // pending Support-ability consumption (skips the next incident)
}

export interface GameState {
  phase: GamePhase;
  runId: string;
  seed: number;
  rngState: number;
  sprintNumber: number;
  focusRemaining: number;
  resources: Record<ResourceKey, number>;
  inventory: string[];
  companionId: string | null;
  flags: GameFlags;
  qaGhost: QaGhostState;
  offerUnlocked: boolean;
  activeIncident: ActiveIncident | null;
  lastEventId: string | null;
  endingId: string | null;
  log: LogEntry[];
  scramble: ScrambleState;
  activityTab: ActivityTab;
  openedFileId: string | null;
  focusBonus: number;
  shopPurchases: string[];
  terminalPanelOpen: boolean;
  terminalActiveTab: "terminal" | "problems" | "messages";
  debugHighlightCounters: boolean;
}
