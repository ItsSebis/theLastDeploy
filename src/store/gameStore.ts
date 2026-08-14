import { create } from "zustand";
import type { ResourceKey } from "../content/types";
import { companionsById, endings, events, itemsById } from "../content";
import { evaluateEndings } from "./endingEvaluator";
import { pickNightEvent } from "./eventSelector";
import { resolveIncident } from "./incidentResolver";
import { SHOP_ITEMS, applyPurchase, canPurchase } from "./shop";
import {
  FOCUS_PER_SPRINT,
  FOCUS_PER_SPRINT_COFFEE_ZERO,
  RESOURCE_MAX,
  RESOURCE_MIN,
  RUNWAY_SPRINT_DRIFT,
  SCRAMBLE_DURATION_SECONDS,
  SCRAMBLE_INVENTORY_CAP,
  SENIOR_DEV_TECH_DEBT_DRIFT_REDUCTION,
  SPRINT_ACTIONS,
  STARTING_RESOURCES,
  TAKE_OFFER_REPUTATION_THRESHOLD,
  TECH_DEBT_SPRINT_DRIFT,
} from "./sprintEconomy";
import type { ActivityTab, GameState, LogEntry } from "./types";
import { randomSeed } from "../utils/rng";

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
    flags: { itemsUsed: [], relationshipLevel: 0 },
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
  };
}

interface GameStore extends GameState {
  startNewRun: () => void;
  tickScrambleTimer: () => void;
  grabItem: (itemId: string) => void;
  stopScramble: () => void;
  pickCompanion: (companionId: string) => void;
  performAction: (actionId: string) => void;
  respondToIncident: (itemId: string | null) => void;
  dismissIncident: () => void;
  takeTheOffer: () => void;
  restart: () => void;
  setActivityTab: (tab: ActivityTab) => void;
  openExplorerFile: (fileId: string) => void;
  setTerminalTab: (tab: "terminal" | "problems") => void;
  toggleTerminalPanel: () => void;
  purchaseShopItem: (itemId: string) => void;
}

// Ends the current sprint: applies passive resource drift, checks forced-fail
// endings, and otherwise rolls the next incident. Shared by performAction
// (focus hits 0) and dismissIncident (advancing past a resolved incident).
function advanceSprint(state: GameState): Partial<GameState> {
  const techDebtDrift =
    state.companionId === "senior_dev"
      ? TECH_DEBT_SPRINT_DRIFT * (1 - SENIOR_DEV_TECH_DEBT_DRIFT_REDUCTION)
      : TECH_DEBT_SPRINT_DRIFT;

  const driftedResources = applyEffects(state.resources, {
    techDebt: techDebtDrift,
    runway: RUNWAY_SPRINT_DRIFT,
  });

  const forcedEndingId = checkForcedFail(driftedResources);
  if (forcedEndingId) {
    return {
      resources: driftedResources,
      phase: "ending",
      endingId: forcedEndingId,
      activeIncident: null,
      log: [
        ...state.log,
        makeLogEntry(state.sprintNumber, "The numbers finally caught up with you."),
      ],
    };
  }

  const nextSprintNumber = state.sprintNumber + 1;
  const { event, nextRngState } = pickNightEvent(
    events,
    nextSprintNumber,
    state.lastEventId,
    state.rngState,
  );

  return {
    resources: driftedResources,
    sprintNumber: nextSprintNumber,
    rngState: nextRngState,
    lastEventId: event.id,
    focusRemaining:
      (driftedResources.coffee <= 0 ? FOCUS_PER_SPRINT_COFFEE_ZERO : FOCUS_PER_SPRINT) +
      state.focusBonus,
    offerUnlocked: driftedResources.reputation >= TAKE_OFFER_REPUTATION_THRESHOLD,
    activeIncident: { event, resolution: null },
    log: [...state.log, makeLogEntry(nextSprintNumber, `Incident: ${event.name}`)],
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

    set({
      resources,
      focusBonus: state.focusBonus + effect.focusBonusDelta,
      shopPurchases: [...state.shopPurchases, itemId],
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

    const resources = applyEffects(state.resources, action.effects);
    const focusRemaining = state.focusRemaining - action.focusCost;
    const flags =
      actionId === "check_in"
        ? { ...state.flags, relationshipLevel: state.flags.relationshipLevel + 1 }
        : state.flags;

    const withAction: GameState = {
      ...state,
      resources,
      focusRemaining,
      flags,
      log: [...state.log, makeLogEntry(state.sprintNumber, action.name)],
    };

    if (focusRemaining <= 0) {
      set({ ...withAction, ...advanceSprint(withAction) });
    } else {
      set(withAction);
    }
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

    set({
      resources,
      flags,
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
}));
