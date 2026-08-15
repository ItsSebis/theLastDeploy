import { create } from "zustand";
import type { ResourceKey } from "../content/types";
import { companionsById, endings, endingsById, events, eventsById, gigsById, itemsById } from "../content";
import { evaluateCompanionQuit } from "./companionQuit";
import { evaluateEndings } from "./endingEvaluator";
import { pickNightEvent } from "./eventSelector";
import { resolveIncident } from "./incidentResolver";
import { applySupportEffect } from "./companionSupport";
import { SHOP_ITEMS, applyPurchase, canPurchase } from "./shop";
import {
  dangerTierFromTechDebt,
  FIGMA_NETWORK_REPUTATION_BONUS,
  FOCUS_PER_SPRINT,
  FOCUS_PER_SPRINT_LOW,
  INTERN_CHAOS_BONUS_RUNWAY,
  INTERN_CHAOS_CHANCE,
  INTERN_CHAOS_MISHAP_TECH_DEBT,
  INTERN_FEE_WAIVE_RUNWAY_THRESHOLD,
  NEGLECT_QUIT_SPRINTS,
  NEGLECT_SANITY_PENALTY,
  NEGLECT_WARNING_SPRINTS,
  PEACEFUL_NIGHT_CHANCE,
  PM_RUNWAY_DRIFT_BONUS,
  RESOURCE_MAX,
  RESOURCE_MIN,
  RUNWAY_SPRINT_DRIFT,
  SANITY_WARNING_THRESHOLD,
  SCRAMBLE_DURATION_SECONDS,
  SCRAMBLE_INVENTORY_CAP,
  SENIOR_DEV_TECH_DEBT_DRIFT_REDUCTION,
  SPRINT_ACTIONS,
  STARTING_RESOURCES,
  TAKE_OFFER_REPUTATION_THRESHOLD,
  TECH_DEBT_SPRINT_DRIFT,
  RELATIONSHIP_VERY_GOOD_THRESHOLD,
} from "./sprintEconomy";
import type { ActivityTab, GameState, LogEntry } from "./types";
import { nextRandom, randomSeed } from "../utils/rng";

const BOUNDED_RESOURCES: readonly ResourceKey[] = ["coffee", "sanity", "reputation"];

function clampResource(key: ResourceKey, value: number): number {
  // Rounded because the tech-debt fail multiplier and companion passives are
  // fractional (e.g. 1.145x) -- without this, resources drift into long
  // floating-point tails ("47.27250000000001") instead of clean integers.
  const rounded = Math.round(value);
  if (BOUNDED_RESOURCES.includes(key)) {
    return Math.min(RESOURCE_MAX, Math.max(RESOURCE_MIN, rounded));
  }
  return Math.max(RESOURCE_MIN, rounded);
}

function applyEffects(
  resources: Record<ResourceKey, number>,
  effects: Partial<Record<ResourceKey, number>>,
  multiplier = 1,
): Record<ResourceKey, number> {
  const next = { ...resources };
  for (const key of Object.keys(effects) as ResourceKey[]) {
    const delta = effects[key];
    if (delta === undefined) continue;
    next[key] = clampResource(key, next[key] + delta * multiplier);
  }
  return next;
}

function makeLogEntry(sprintNumber: number, text: string): LogEntry {
  return { id: crypto.randomUUID(), sprintNumber, text };
}

function checkForcedFail(resources: Record<ResourceKey, number>): string | null {
  if (resources.sanity <= 0) return "goat_farm";
  if (resources.runway <= 0) return "back_to_corporate";
  return null;
}

function createInitialState(): GameState {
  return {
    phase: "intro",
    runId: crypto.randomUUID(),
    seed: 0,
    rngState: 0,
    sprintNumber: 0,
    focusRemaining: 0,
    resources: { ...STARTING_RESOURCES },
    inventory: [],
    companionId: null,
    flags: {
      itemsUsed: [],
      relationshipLevel: 0,
      lastCheckedInSprint: 0,
      companionHiredSprint: 0,
      supportOffered: false,
    },
    qaGhost: {
      buffActive: false,
      buffSprintsRemaining: 0,
      relationshipLevel: 0,
      hired: false,
      supportOffered: false,
      guardActive: false,
    },
    offerUnlocked: false,
    activeIncident: null,
    lastEventId: null,
    endingId: null,
    log: [],
    scramble: { timeRemaining: SCRAMBLE_DURATION_SECONDS, grabbedItemIds: [] },
    activityTab: "explorer",
    openedFileId: null,
    focusBonus: 0,
    shopPurchases: [],
    terminalPanelOpen: true,
    terminalActiveTab: "terminal",
    debugHighlightCounters: false,
  };
}

interface GameStore extends GameState {
  startNewRun: () => void;
  tickScrambleTimer: () => void;
  grabItem: (itemId: string) => void;
  stopScramble: () => void;
  pickCompanion: (companionId: string) => void;
  performAction: (actionId: string) => void;
  triggerSupport: () => void;
  thankQaGhost: () => void;
  hireQaGhost: () => void;
  takeGig: (gigId: string) => void;
  endSprint: () => void;
  respondToIncident: (itemId: string | null) => void;
  dismissIncident: () => void;
  takeTheOffer: () => void;
  restart: () => void;
  setActivityTab: (tab: ActivityTab) => void;
  openExplorerFile: (fileId: string) => void;
  setTerminalTab: (tab: "terminal" | "problems" | "messages") => void;
  toggleTerminalPanel: () => void;
  purchaseShopItem: (itemId: string) => void;
  debugGiveAllItems: () => void;
  debugForceEvent: (eventId: string) => void;
  debugSetEnding: (endingId: string) => void;
  debugSetResource: (key: ResourceKey, value: number) => void;
  debugToggleHighlight: () => void;
  debugSetRelationship: (value: number) => void;
  debugSetQaGhostRelationship: (value: number) => void;
  debugForceSupportOffer: () => void;
}

// Ends the current sprint: applies passive resource drift, checks forced-fail
// endings, and otherwise rolls the next incident. Shared by performAction
// (focus hits 0) and dismissIncident (advancing past a resolved incident).
function advanceSprint(state: GameState): Partial<GameState> {
  const techDebtDrift =
    state.companionId === "senior_dev"
      ? TECH_DEBT_SPRINT_DRIFT * (1 - SENIOR_DEV_TECH_DEBT_DRIFT_REDUCTION)
      : TECH_DEBT_SPRINT_DRIFT;
  const runwayDrift =
    state.companionId === "pm_circling_back"
      ? RUNWAY_SPRINT_DRIFT + PM_RUNWAY_DRIFT_BONUS
      : RUNWAY_SPRINT_DRIFT;

  const driftedResources = applyEffects(state.resources, {
    techDebt: techDebtDrift,
    runway: runwayDrift,
  });

  const nextSprintNumber = state.sprintNumber + 1;

  let resources = driftedResources;
  let flags = state.flags;
  let companionId = state.companionId;
  let qaGhost = state.qaGhost;
  const extraLogTexts: string[] = [];

  // Companion upkeep: daily Runway cost, waived for the intern specifically
  // when Runway is already low (read post-drift, so a rough sprint waives
  // that same sprint's fee too). QA Ghost's upkeep is unconditional once hired.
  if (companionId) {
    const companion = companionsById[companionId];
    const waiveIntern =
      companionId === "the_intern" && resources.runway <= INTERN_FEE_WAIVE_RUNWAY_THRESHOLD;
    if (!waiveIntern) {
      resources = applyEffects(resources, { runway: -companion.dailyCost });
    }
  }
  if (qaGhost.hired) {
    resources = applyEffects(resources, { runway: -companionsById.qa_ghost.dailyCost });
  }

  // QA Ghost's timed shop-buff countdown. The highlight assist itself is
  // time-limited, but the rapport it builds persists after it lapses --
  // relationshipLevel keeps accruing even on the sprint the buff runs out.
  if (qaGhost.buffActive && qaGhost.buffSprintsRemaining > 0) {
    const remaining = qaGhost.buffSprintsRemaining - 1;
    qaGhost = {
      ...qaGhost,
      buffSprintsRemaining: remaining,
      buffActive: remaining > 0,
      relationshipLevel: qaGhost.relationshipLevel + 1,
    };
  }

  // Neglect: a companion notices (small penalty) after NEGLECT_WARNING_SPRINTS
  // sprints with no "Check In", and leaves for good after NEGLECT_QUIT_SPRINTS.
  if (companionId) {
    const sprintsSinceContact = nextSprintNumber - flags.lastCheckedInSprint;
    const companion = companionsById[companionId];
    if (sprintsSinceContact >= NEGLECT_QUIT_SPRINTS) {
      companionId = null;
      extraLogTexts.push(`${companion?.name ?? "Your companion"} stops responding. They're gone.`);
    } else if (sprintsSinceContact >= NEGLECT_WARNING_SPRINTS) {
      flags = { ...flags, relationshipLevel: Math.max(0, flags.relationshipLevel - 1) };
      resources = applyEffects(resources, { sanity: -NEGLECT_SANITY_PENALTY });
      extraLogTexts.push(`${companion?.name ?? "Your companion"} hasn't heard from you in a while.`);
    }
  }

  // Per-companion quit conditions, layered on top of the generic neglect
  // timer above -- runs after neglect so a same-sprint neglect-quit is
  // respected first, and before the intern-chaos roll so a same-sprint quit
  // correctly suppresses that roll. Note: a companion can be
  // neglect-penalized and trip their own quit condition in the same sprint
  // (reads the same-sprint post-penalty relationship value) -- intentional
  // "last straw" framing, but worth a specific playtest pass.
  if (companionId) {
    const companion = companionsById[companionId];
    const firedCondition = evaluateCompanionQuit(companion, {
      resources,
      relationshipLevel: flags.relationshipLevel,
      sprintsInParty: nextSprintNumber - flags.companionHiredSprint,
    });
    if (firedCondition) {
      extraLogTexts.push(companion.quitFlavorText);
      companionId = null;
    }
  }

  // Intern chaos: one extra roll per sprint while they're in the party.
  let rngState = state.rngState;
  if (companionId === "the_intern") {
    const { value: internRoll, nextState: afterInternState } = nextRandom(rngState);
    rngState = afterInternState;
    if (internRoll < INTERN_CHAOS_CHANCE) {
      resources = applyEffects(resources, { runway: INTERN_CHAOS_BONUS_RUNWAY });
      extraLogTexts.push("The intern found a client who pays fast.");
    } else {
      resources = applyEffects(resources, { techDebt: INTERN_CHAOS_MISHAP_TECH_DEBT });
      extraLogTexts.push("The intern refactored something. It compiles. Barely.");
    }
  }

  // Support-ability offers: relationship-gated, low-chance rolls, same shape
  // as the peaceful-night/intern-chaos rolls above. Fixed position in the
  // rngState chain so replays stay deterministic regardless of which
  // conditionals above fired.
  if (companionId && !flags.supportOffered) {
    const companion = companionsById[companionId];
    if (flags.relationshipLevel >= companion.support.relationshipMin) {
      const { value: supportRoll, nextState: afterSupportState } = nextRandom(rngState);
      rngState = afterSupportState;
      if (supportRoll < companion.support.offerChance) {
        flags = { ...flags, supportOffered: true };
        extraLogTexts.push(`${companion.name} offers to help: ${companion.support.name}.`);
      }
    }
  }
  if (qaGhost.hired && !qaGhost.supportOffered) {
    const qaGhostCompanion = companionsById.qa_ghost;
    if (qaGhost.relationshipLevel >= qaGhostCompanion.support.relationshipMin) {
      const { value: qaSupportRoll, nextState: afterQaSupportState } = nextRandom(rngState);
      rngState = afterQaSupportState;
      if (qaSupportRoll < qaGhostCompanion.support.offerChance) {
        qaGhost = { ...qaGhost, supportOffered: true };
        extraLogTexts.push(`${qaGhostCompanion.name} offers to help: ${qaGhostCompanion.support.name}.`);
      }
    }
  }

  const extraLogEntries = extraLogTexts.map((text) => makeLogEntry(state.sprintNumber, text));

  const forcedEndingId = checkForcedFail(resources);
  if (forcedEndingId) {
    return {
      resources,
      companionId,
      flags,
      qaGhost,
      phase: "ending",
      endingId: forcedEndingId,
      activeIncident: null,
      log: [
        ...state.log,
        ...extraLogEntries,
        makeLogEntry(state.sprintNumber, "The numbers finally caught up with you."),
      ],
    };
  }

  const dangerTier = dangerTierFromTechDebt(resources.techDebt);

  const lowResource = resources.coffee <= 0 || resources.sanity <= SANITY_WARNING_THRESHOLD;

  const baseUpdate: Partial<GameState> = {
    resources,
    companionId,
    flags,
    qaGhost,
    sprintNumber: nextSprintNumber,
    focusRemaining: (lowResource ? FOCUS_PER_SPRINT_LOW : FOCUS_PER_SPRINT) + state.focusBonus,
    offerUnlocked: resources.reputation >= TAKE_OFFER_REPUTATION_THRESHOLD,
  };

  // QA Ghost's "Guard the Night" Support ability consumes on the very next
  // advanceSprint call regardless of what it would have rolled, forcing a
  // peaceful night -- the literal reading of "guards you fully, for one night".
  if (qaGhost.guardActive) {
    return {
      ...baseUpdate,
      qaGhost: { ...qaGhost, guardActive: false },
      rngState,
      activeIncident: null,
      log: [
        ...state.log,
        ...extraLogEntries,
        makeLogEntry(nextSprintNumber, "The QA Ghost stands watch. Nothing gets through tonight."),
      ],
    };
  }

  const { value: peacefulRoll, nextState: afterPeacefulState } = nextRandom(rngState);
  if (peacefulRoll < PEACEFUL_NIGHT_CHANCE[dangerTier]) {
    return {
      ...baseUpdate,
      rngState: afterPeacefulState,
      activeIncident: null,
      log: [
        ...state.log,
        ...extraLogEntries,
        makeLogEntry(nextSprintNumber, "A quiet night. Nothing on fire, for once."),
      ],
    };
  }

  const { event, nextRngState } = pickNightEvent(
    events,
    nextSprintNumber,
    state.lastEventId,
    afterPeacefulState,
    dangerTier,
  );

  return {
    ...baseUpdate,
    rngState: nextRngState,
    lastEventId: event.id,
    activeIncident: { event, resolution: null },
    log: [...state.log, ...extraLogEntries, makeLogEntry(nextSprintNumber, `Incident: ${event.name}`)],
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  startNewRun: () => {
    const seed = randomSeed();
    set({
      ...createInitialState(),
      phase: "scramble_loot",
      seed,
      rngState: seed,
      log: [makeLogEntry(0, "The repo access expires in 45 seconds. Grab what you can.")],
    });
  },

  tickScrambleTimer: () => {
    const state = get();
    if (state.phase !== "scramble_loot" || state.scramble.timeRemaining <= 0) return;
    const timeRemaining = state.scramble.timeRemaining - 1;
    set({ scramble: { ...state.scramble, timeRemaining } });
    if (timeRemaining <= 0) {
      get().stopScramble();
    }
  },

  grabItem: (itemId) => {
    const state = get();
    if (state.phase !== "scramble_loot") return;
    if (state.scramble.timeRemaining <= 0) return;
    if (state.scramble.grabbedItemIds.length >= SCRAMBLE_INVENTORY_CAP) return;
    if (state.scramble.grabbedItemIds.includes(itemId)) return;
    if (!itemsById[itemId]) return;

    set({
      scramble: {
        ...state.scramble,
        grabbedItemIds: [...state.scramble.grabbedItemIds, itemId],
      },
    });
  },

  stopScramble: () => {
    const state = get();
    if (state.phase !== "scramble_loot") return;
    set({
      phase: "scramble_companion",
      inventory: [...state.scramble.grabbedItemIds],
      activityTab: "explorer",
      openedFileId: null,
    });
  },

  setActivityTab: (tab) => {
    set({ activityTab: tab, openedFileId: null });
  },

  openExplorerFile: (fileId) => {
    const state = get();
    if (state.phase !== "scramble_loot" || state.scramble.timeRemaining <= 0) return;
    set({ openedFileId: fileId });
  },

  setTerminalTab: (tab) => {
    set({ terminalActiveTab: tab, terminalPanelOpen: true });
  },

  toggleTerminalPanel: () => {
    set((state) => ({ terminalPanelOpen: !state.terminalPanelOpen }));
  },

  purchaseShopItem: (itemId) => {
    const state = get();
    if (state.phase !== "sprint") return;

    const check = canPurchase(itemId, state.resources.runway, state.shopPurchases);
    if (!check.allowed) return;

    const effect = applyPurchase(itemId);
    const shopItem = SHOP_ITEMS.find((i) => i.id === itemId)!;

    let resources = applyEffects(state.resources, { runway: effect.runwayDelta });
    if (effect.coffeeSetTo !== undefined) {
      resources = { ...resources, coffee: clampResource("coffee", effect.coffeeSetTo) };
    }
    const qaGhost = effect.qaGhostBuffDelta
      ? {
          ...state.qaGhost,
          buffActive: true,
          buffSprintsRemaining: state.qaGhost.buffSprintsRemaining + effect.qaGhostBuffDelta,
        }
      : state.qaGhost;

    set({
      resources,
      focusBonus: state.focusBonus + effect.focusBonusDelta,
      shopPurchases: [...state.shopPurchases, itemId],
      qaGhost,
      log: [...state.log, makeLogEntry(state.sprintNumber, `Bought ${shopItem.name}`)],
    });
  },

  pickCompanion: (companionId) => {
    const state = get();
    if (state.phase !== "scramble_companion") return;
    if (!companionsById[companionId]) return;

    const companion = companionsById[companionId];
    set({
      companionId,
      phase: "sprint",
      sprintNumber: 1,
      focusRemaining: FOCUS_PER_SPRINT + state.focusBonus,
      flags: { ...state.flags, lastCheckedInSprint: 1, companionHiredSprint: 1, supportOffered: false },
      log: [
        ...state.log,
        makeLogEntry(1, `${companion.name} joins you. Sprint 1 begins.`),
      ],
    });
  },

  performAction: (actionId) => {
    const state = get();
    if (state.phase !== "sprint" || state.activeIncident) return;

    const action = SPRINT_ACTIONS.find((a) => a.id === actionId);
    if (!action || state.focusRemaining < action.focusCost) return;

    const bonusEffects =
      actionId === "network" && state.companionId === "figma_designer"
        ? { reputation: FIGMA_NETWORK_REPUTATION_BONUS }
        : {};
    const resources = applyEffects(
      applyEffects(state.resources, action.effects),
      bonusEffects,
    );
    const focusRemaining = state.focusRemaining - action.focusCost;
    const flags =
      actionId === "check_in"
        ? {
            ...state.flags,
            relationshipLevel: state.flags.relationshipLevel + 1,
            lastCheckedInSprint: state.sprintNumber,
          }
        : state.flags;

    set({
      resources,
      focusRemaining,
      flags,
      log: [...state.log, makeLogEntry(state.sprintNumber, action.name)],
    });
  },

  triggerSupport: () => {
    const state = get();
    if (state.phase !== "sprint" || state.activeIncident || state.focusRemaining < 1) return;

    if (state.companionId && state.flags.supportOffered) {
      const companion = companionsById[state.companionId];
      const result = applySupportEffect(state.companionId);
      let resources = applyEffects(state.resources, result.effects);
      if (result.setTechDebtToZero) {
        resources = { ...resources, techDebt: clampResource("techDebt", 0) };
      }
      set({
        resources,
        focusRemaining: state.focusRemaining - 1,
        flags: { ...state.flags, supportOffered: false },
        log: [...state.log, makeLogEntry(state.sprintNumber, `${companion.name}: ${companion.support.name}`)],
      });
      return;
    }

    if (state.qaGhost.hired && state.qaGhost.supportOffered) {
      const qaGhostCompanion = companionsById.qa_ghost;
      set({
        focusRemaining: state.focusRemaining - 1,
        qaGhost: { ...state.qaGhost, supportOffered: false, guardActive: true },
        log: [
          ...state.log,
          makeLogEntry(state.sprintNumber, `${qaGhostCompanion.name}: ${qaGhostCompanion.support.name}`),
        ],
      });
    }
  },

  thankQaGhost: () => {
    const state = get();
    if (state.phase !== "sprint" || state.activeIncident) return;
    if (state.qaGhost.hired || state.focusRemaining < 1) return;

    set({
      focusRemaining: state.focusRemaining - 1,
      qaGhost: { ...state.qaGhost, relationshipLevel: state.qaGhost.relationshipLevel + 1 },
      log: [
        ...state.log,
        makeLogEntry(state.sprintNumber, "You thank the QA Ghost. They seem... pleased? Hard to tell."),
      ],
    });
  },

  hireQaGhost: () => {
    const state = get();
    if (state.phase !== "sprint" || state.qaGhost.hired) return;
    if (state.qaGhost.relationshipLevel < RELATIONSHIP_VERY_GOOD_THRESHOLD) return;

    set({
      qaGhost: { ...state.qaGhost, hired: true },
      log: [
        ...state.log,
        makeLogEntry(state.sprintNumber, "The QA Ghost agrees to stick around. Officially, this time."),
      ],
    });
  },

  takeGig: (gigId) => {
    const state = get();
    if (state.phase !== "sprint" || state.activeIncident) return;

    const gig = gigsById[gigId];
    if (!gig || state.focusRemaining < gig.focusCost) return;

    set({
      resources: applyEffects(state.resources, gig.effects),
      focusRemaining: state.focusRemaining - gig.focusCost,
      log: [...state.log, makeLogEntry(state.sprintNumber, `Took a gig: ${gig.name}`)],
    });
  },

  endSprint: () => {
    const state = get();
    if (state.phase !== "sprint" || state.activeIncident) return;
    if (state.focusRemaining > 0) return;
    set(advanceSprint(state));
  },

  respondToIncident: (itemId) => {
    const state = get();
    if (!state.activeIncident || state.activeIncident.resolution) return;

    const event = state.activeIncident.event;
    const outcome = resolveIncident(event, itemId, state.resources.techDebt);
    const resources = applyEffects(state.resources, outcome.effects, outcome.multiplier);

    const flags =
      outcome.success && itemId && !state.flags.itemsUsed.includes(itemId)
        ? { ...state.flags, itemsUsed: [...state.flags.itemsUsed, itemId] }
        : state.flags;
    const inventory =
      outcome.consumed && itemId
        ? state.inventory.filter((id) => id !== itemId)
        : state.inventory;

    set({
      resources,
      flags,
      inventory,
      activeIncident: { event, resolution: { success: outcome.success, text: outcome.text } },
      log: [...state.log, makeLogEntry(state.sprintNumber, outcome.text)],
    });
  },

  dismissIncident: () => {
    const state = get();
    if (!state.activeIncident || !state.activeIncident.resolution) return;

    const forcedEndingId = checkForcedFail(state.resources);
    if (forcedEndingId) {
      set({
        phase: "ending",
        endingId: forcedEndingId,
        activeIncident: null,
        log: [
          ...state.log,
          makeLogEntry(state.sprintNumber, "The numbers finally caught up with you."),
        ],
      });
      return;
    }

    set({
      activeIncident: null,
      offerUnlocked: state.resources.reputation >= TAKE_OFFER_REPUTATION_THRESHOLD,
    });
  },

  takeTheOffer: () => {
    const state = get();
    if (state.phase !== "sprint" || !state.offerUnlocked || state.activeIncident) return;

    const ending = evaluateEndings(state.resources, state.flags, endings);
    set({
      phase: "ending",
      endingId: ending.id,
      log: [...state.log, makeLogEntry(state.sprintNumber, "You take the offer.")],
    });
  },

  restart: () => {
    get().startNewRun();
  },

  debugGiveAllItems: () => {
    if (!import.meta.env.DEV) return;
    set({ inventory: Object.keys(itemsById) });
  },

  debugForceEvent: (eventId) => {
    if (!import.meta.env.DEV) return;
    const event = eventsById[eventId];
    if (!event) return;
    set({ activeIncident: { event, resolution: null } });
  },

  debugSetEnding: (endingId) => {
    if (!import.meta.env.DEV) return;
    if (!endingsById[endingId]) return;
    set({ phase: "ending", endingId });
  },

  debugSetResource: (key, value) => {
    if (!import.meta.env.DEV) return;
    const state = get();
    set({ resources: { ...state.resources, [key]: clampResource(key, value) } });
  },

  debugToggleHighlight: () => {
    if (!import.meta.env.DEV) return;
    set((state) => ({ debugHighlightCounters: !state.debugHighlightCounters }));
  },

  debugSetRelationship: (value) => {
    if (!import.meta.env.DEV) return;
    set((state) => ({ flags: { ...state.flags, relationshipLevel: value } }));
  },

  debugSetQaGhostRelationship: (value) => {
    if (!import.meta.env.DEV) return;
    set((state) => ({ qaGhost: { ...state.qaGhost, relationshipLevel: value } }));
  },

  debugForceSupportOffer: () => {
    if (!import.meta.env.DEV) return;
    set((state) => ({
      flags: { ...state.flags, supportOffered: true },
      qaGhost: { ...state.qaGhost, supportOffered: state.qaGhost.hired ? true : state.qaGhost.supportOffered },
    }));
  },
}));
