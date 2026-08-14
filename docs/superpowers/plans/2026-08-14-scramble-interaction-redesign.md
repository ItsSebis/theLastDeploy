# Scramble & Interaction Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat scramble grid and generic sprint action-menu buttons with an explorable, VS Code-shaped set of interactions (Activity Bar + Explorer/Source Control/Extensions panels, a Runway shop, and bespoke per-action triggers), per the approved design in `docs/07-scramble-and-interaction-redesign.md`.

**Architecture:** Extract two pure logic modules (`incidentResolver`, `shop`) that are independently unit-tested with Vitest, since they're the only parts of this change with real business logic. Everything else is Zustand store surface area (new fields + actions on the existing `gameStore.ts`) and React components that read/write that store, verified by hand in the browser the same way Phase 0/1 was verified (this repo has no React component test harness yet, and adding one is out of scope here).

**Tech Stack:** Existing Vite + React 19 + TypeScript + Zustand stack. Adds Vitest (dev-only, for the two pure logic modules).

## Global Constraints

- All new/modified `.ts`/`.tsx` files must pass `npx tsc -b --force` with zero errors before a task is considered done.
- Every new resource-affecting calculation must go through the existing `applyEffects`/`clampResource` helpers in `src/store/gameStore.ts` — do not hand-roll new clamping logic.
- No React component test harness exists in this repo. New pure logic (non-React) modules get real Vitest unit tests; new UI components are verified manually via `npm run dev` in the Browser tool, matching how Phase 0/1 was verified.
- Follow existing conventions: no comments unless explaining a non-obvious WHY, Zustand actions read via `get()`/write via `set()`, CSS lives in `src/styles/components.css` using the existing `--vsc-*` custom properties, numeric game-balance values are flagged as tunable placeholders the same way `sprintEconomy.ts` already does.
- Reuse `docs/07-scramble-and-interaction-redesign.md` as the source of truth for scope — nothing in this plan should exceed what that spec describes.

---

### Task 1: Content schema — `successEffects` field, `git_stash` item, `force_pushed_to_main` event

**Files:**
- Modify: `src/content/types.ts`
- Modify: `src/content/items.json`
- Modify: `src/content/events.json`
- Modify: `docs/04-content-schema.md`

**Interfaces:**
- Produces: `NightEvent.successEffects?: Partial<Record<ResourceKey, number>>` (optional field, consumed by Task 2's `resolveIncident`).

- [ ] **Step 1: Add `successEffects` to the `NightEvent` interface**

In `src/content/types.ts`, in the `NightEvent` interface, add the field after `failEffects`:

```ts
export interface NightEvent {
  id: string;
  name: string;
  description: string;
  counteredBy: string[];
  onCounteredText: string;
  onFailText: string;
  failEffects: Partial<Record<ResourceKey, number>>;
  successEffects?: Partial<Record<ResourceKey, number>>;
  weight: number;
  minSprint?: number;
  maxSprint?: number;
}
```

- [ ] **Step 2: Add the `git_stash` item to `items.json`**

Append to the array in `src/content/items.json`:

```json
{
  "id": "git_stash",
  "name": "A Stash You Forgot About",
  "description": "git stash list. Three entries. You have no memory of any of them.",
  "counters": ["force_pushed_to_main"],
  "unlockedBy": "default",
  "flavorOnUse": "You pop the stash. It's exactly what you needed. You don't ask why."
}
```

- [ ] **Step 3: Add the `force_pushed_to_main` event to `events.json`**

Append to the array in `src/content/events.json`:

```json
{
  "id": "force_pushed_to_main",
  "name": "Force-Pushed to Main",
  "description": "Someone force-pushed to `main`. The last few days of commits are... gone? Maybe? Nobody's sure.",
  "counteredBy": ["git_stash"],
  "onCounteredText": "You had a stash from two days ago. Crisis averted. The team buys you coffee.",
  "onFailText": "Three days of history, gone. You start rewriting from memory.",
  "failEffects": { "sanity": -20, "techDebt": 20, "reputation": -10 },
  "successEffects": { "reputation": 5 },
  "weight": 1,
  "minSprint": 2
}
```

- [ ] **Step 4: Document the new field in the schema doc**

In `docs/04-content-schema.md`, in the "Night Event (Incident)" JSON example section, add a line right after the existing `failEffects` line in the prose/example so the doc stays authoritative:

```
- `successEffects` (optional) works like `failEffects` but applies on a
  successful counter instead of a fail/ignore. Most events omit it (a
  successful counter has no bonus, per the game design). Present only on
  "rare" items' events (see 07-scramble-and-interaction-redesign.md).
```

- [ ] **Step 5: Type-check**

Run: `npx tsc -b --force`
Expected: exits 0, no errors (confirms `items.json`/`events.json` still satisfy `Item[]`/`NightEvent[]` via the `satisfies` checks in `src/content/index.ts`).

- [ ] **Step 6: Commit**

```bash
git add src/content/types.ts src/content/items.json src/content/events.json docs/04-content-schema.md
git commit -m "content: add git_stash item and force_pushed_to_main event with successEffects"
```

---

### Task 2: Vitest setup + `incidentResolver` pure module

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` script, add `vitest` devDependency)
- Create: `src/store/incidentResolver.ts`
- Create: `src/store/incidentResolver.test.ts`

**Interfaces:**
- Consumes: `NightEvent` from `src/content/types.ts` (Task 1).
- Produces: `resolveIncident(event: NightEvent, itemId: string | null, techDebt: number): IncidentOutcome` and `IncidentOutcome` type, both exported from `src/store/incidentResolver.ts`, consumed by Task 5's `respondToIncident`.

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 3: Add `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 4: Write the failing tests**

Create `src/store/incidentResolver.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveIncident } from "./incidentResolver";
import type { NightEvent } from "../content/types";

const event: NightEvent = {
  id: "test_event",
  name: "Test Event",
  description: "d",
  counteredBy: ["item_a"],
  onCounteredText: "success text",
  onFailText: "fail text",
  failEffects: { sanity: -10 },
  successEffects: { reputation: 5 },
  weight: 1,
};

describe("resolveIncident", () => {
  it("returns a success outcome with successEffects when the right item is used", () => {
    const outcome = resolveIncident(event, "item_a", 10);
    expect(outcome.success).toBe(true);
    expect(outcome.text).toBe("success text");
    expect(outcome.effects).toEqual({ reputation: 5 });
    expect(outcome.multiplier).toBe(1);
  });

  it("returns a fail outcome scaled by tech debt when the wrong item is used", () => {
    const outcome = resolveIncident(event, "item_b", 20);
    expect(outcome.success).toBe(false);
    expect(outcome.text).toBe("fail text");
    expect(outcome.effects).toEqual({ sanity: -10 });
    expect(outcome.multiplier).toBe(1.2);
  });

  it("returns a fail outcome when ignored (itemId null)", () => {
    const outcome = resolveIncident(event, null, 0);
    expect(outcome.success).toBe(false);
    expect(outcome.multiplier).toBe(1);
  });

  it("defaults effects to an empty object when the event has no successEffects", () => {
    const noBonus: NightEvent = { ...event, successEffects: undefined };
    const outcome = resolveIncident(noBonus, "item_a", 50);
    expect(outcome.effects).toEqual({});
  });
});
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `npx vitest run src/store/incidentResolver.test.ts`
Expected: FAIL — `Cannot find module './incidentResolver'` (file doesn't exist yet).

- [ ] **Step 6: Implement `incidentResolver.ts`**

```ts
import type { NightEvent, ResourceKey } from "../content/types";

export interface IncidentOutcome {
  success: boolean;
  text: string;
  effects: Partial<Record<ResourceKey, number>>;
  multiplier: number;
}

export function resolveIncident(
  event: NightEvent,
  itemId: string | null,
  techDebt: number,
): IncidentOutcome {
  const success = itemId !== null && event.counteredBy.includes(itemId);

  if (success) {
    return {
      success: true,
      text: event.onCounteredText,
      effects: event.successEffects ?? {},
      multiplier: 1,
    };
  }

  return {
    success: false,
    text: event.onFailText,
    effects: event.failEffects,
    multiplier: 1 + techDebt / 100,
  };
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run src/store/incidentResolver.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/store/incidentResolver.ts src/store/incidentResolver.test.ts
git commit -m "test: add vitest and a pure incidentResolver module with success/fail outcomes"
```

---

### Task 3: Shop pure module

**Files:**
- Create: `src/store/shop.ts`
- Create: `src/store/shop.test.ts`

**Interfaces:**
- Produces: `SHOP_ITEMS: ShopItem[]`, `ShopItem`, `ShopItemKind`, `canPurchase(itemId: string, runway: number, alreadyPurchased: string[]): PurchaseCheck`, `applyPurchase(itemId: string): PurchaseEffect`, all exported from `src/store/shop.ts`, consumed by Task 5's `purchaseShopItem` action and Task 11's `ShopPanel`.

- [ ] **Step 1: Write the failing tests**

Create `src/store/shop.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applyPurchase, canPurchase, SHOP_ITEMS } from "./shop";

describe("canPurchase", () => {
  it("disallows purchase when runway is too low", () => {
    expect(canPurchase("coffee_refill", 5, [])).toEqual({
      allowed: false,
      reason: "insufficient runway",
    });
  });

  it("disallows re-purchasing a non-repeatable item", () => {
    expect(canPurchase("better_coffee", 100, ["better_coffee"])).toEqual({
      allowed: false,
      reason: "already purchased",
    });
  });

  it("allows repeatable items to be bought again", () => {
    expect(canPurchase("coffee_refill", 100, ["coffee_refill"])).toEqual({ allowed: true });
  });

  it("allows a first-time purchase with enough runway", () => {
    expect(canPurchase("better_coffee", 100, [])).toEqual({ allowed: true });
  });

  it("rejects an unknown item id", () => {
    expect(canPurchase("not_a_real_item", 1000, [])).toEqual({
      allowed: false,
      reason: "unknown item",
    });
  });
});

describe("applyPurchase", () => {
  it("grants a permanent focus bonus for better_coffee", () => {
    expect(applyPurchase("better_coffee")).toEqual({
      runwayDelta: -20,
      focusBonusDelta: 1,
    });
  });

  it("sets coffee to 100 for coffee_refill", () => {
    expect(applyPurchase("coffee_refill")).toEqual({
      runwayDelta: -10,
      focusBonusDelta: 0,
      coffeeSetTo: 100,
    });
  });

  it("has no mechanical effect for junk items beyond the runway cost", () => {
    const junk = SHOP_ITEMS.find((i) => i.kind === "junk")!;
    expect(applyPurchase(junk.id)).toEqual({
      runwayDelta: -junk.cost,
      focusBonusDelta: 0,
    });
  });

  it("throws for an unknown item id", () => {
    expect(() => applyPurchase("not_a_real_item")).toThrow();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/store/shop.test.ts`
Expected: FAIL — `Cannot find module './shop'`.

- [ ] **Step 3: Implement `shop.ts`**

```ts
export type ShopItemKind = "focus_bonus" | "coffee_refill" | "junk";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  kind: ShopItemKind;
  repeatable: boolean;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "better_coffee",
    name: "Better Coffee",
    description: "A subscription to the good beans. +1 Focus every sprint, for the rest of the run.",
    cost: 20,
    kind: "focus_bonus",
    repeatable: false,
  },
  {
    id: "coffee_refill",
    name: "Coffee Refill",
    description: "Instantly refills your Coffee to full.",
    cost: 10,
    kind: "coffee_refill",
    repeatable: true,
  },
  {
    id: "standing_desk",
    name: "Standing Desk Converter",
    description: "You will use this twice.",
    cost: 8,
    kind: "junk",
    repeatable: true,
  },
  {
    id: "motivational_poster",
    name: "Motivational Cat Poster",
    description: '"Hang in there." Does not help.',
    cost: 3,
    kind: "junk",
    repeatable: true,
  },
  {
    id: "kombucha_subscription",
    name: "Kombucha Subscription",
    description: "Fizzy. Expensive. Doesn't do anything.",
    cost: 6,
    kind: "junk",
    repeatable: true,
  },
];

export interface PurchaseCheck {
  allowed: boolean;
  reason?: string;
}

export function canPurchase(
  itemId: string,
  runway: number,
  alreadyPurchased: string[],
): PurchaseCheck {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return { allowed: false, reason: "unknown item" };
  if (runway < item.cost) return { allowed: false, reason: "insufficient runway" };
  if (!item.repeatable && alreadyPurchased.includes(itemId)) {
    return { allowed: false, reason: "already purchased" };
  }
  return { allowed: true };
}

export interface PurchaseEffect {
  runwayDelta: number;
  focusBonusDelta: number;
  coffeeSetTo?: number;
}

export function applyPurchase(itemId: string): PurchaseEffect {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) throw new Error(`Unknown shop item: ${itemId}`);

  const base: PurchaseEffect = { runwayDelta: -item.cost, focusBonusDelta: 0 };
  if (item.kind === "focus_bonus") return { ...base, focusBonusDelta: 1 };
  if (item.kind === "coffee_refill") return { ...base, coffeeSetTo: 100 };
  return base;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/store/shop.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/store/shop.ts src/store/shop.test.ts
git commit -m "feat: add pure shop module with purchase checks and effects"
```

---

### Task 4: Scramble content data (Explorer tree, Source Control/Extensions entries, flavor pools)

**Files:**
- Create: `src/content/scrambleContent.ts`
- Create: `src/content/gigFlavors.ts`
- Create: `src/content/contacts.ts`
- Create: `src/content/problemFlavors.ts`

**Interfaces:**
- Produces: `ExplorerNode`, `ExplorerFileNode`, `ExplorerFolderNode`, `EXPLORER_TREE: ExplorerFolderNode`, `findExplorerFile(id: string): ExplorerFileNode | undefined`, `ScrambleListEntry`, `SOURCE_CONTROL_ENTRIES: ScrambleListEntry[]`, `EXTENSIONS_ENTRIES: ScrambleListEntry[]` from `src/content/scrambleContent.ts`. `GIG_FLAVORS: string[]` from `gigFlavors.ts`. `Contact`, `CONTACTS: Contact[]` from `contacts.ts`. `PROBLEM_FLAVORS: string[]` from `problemFlavors.ts`.
- Consumed by: Task 7 (`ExplorerPanel`, `FileViewer`), Task 8 (`SourceControlPanel`, `ExtensionsPanel`), Task 10 (`GigBoard`, `ContactsList`), Task 9 (`ProblemsPanel`).

Item placement across the three panels (10 total items: 5 original useful + 4 original flavor-only + new `git_stash`):
- Explorer: `rubber_duck`, `hotfix_script`, `it_works_on_my_machine_badge`, `laptop_charger` (useful) + `signed_nda`, `tabs_vs_spaces_allegiance`, `readme_nobody_wrote`, `the_one_working_unit_test` (flavor-only) + 2 true dead-end files. 10 files total.
- Extensions: `stack_overflow_bookmark` (useful) + 2 dead-end entries.
- Source Control: `git_stash` (useful, rare) + 1 dead-end entry.

- [ ] **Step 1: Create `src/content/scrambleContent.ts`**

```ts
export interface ExplorerFileNode {
  type: "file";
  id: string;
  name: string;
  itemId: string | null;
  fileText: string;
}

export interface ExplorerFolderNode {
  type: "folder";
  name: string;
  children: ExplorerNode[];
}

export type ExplorerNode = ExplorerFileNode | ExplorerFolderNode;

export const EXPLORER_TREE: ExplorerFolderNode = {
  type: "folder",
  name: "legendary-repo",
  children: [
    {
      type: "folder",
      name: "linuxdoom-1.10",
      children: [
        {
          type: "file",
          id: "p_enemy",
          name: "p_enemy.c",
          itemId: "rubber_duck",
          fileText: "// AI state machine for demons.\n// A rubber duck sits on the monitor. It has opinions about this switch statement.",
        },
        {
          type: "file",
          id: "r_bsp",
          name: "r_bsp.c",
          itemId: null,
          fileText: "// BSP tree traversal for rendering.\n// Nothing here but math and old comments.",
        },
        {
          type: "file",
          id: "w_wad",
          name: "w_wad.c",
          itemId: "hotfix_script",
          fileText: "// WAD file loader.\n// A hotfix script is taped to the bottom of this function. Never tested. Always run.",
        },
        {
          type: "file",
          id: "m_menu",
          name: "m_menu.c",
          itemId: null,
          fileText: "// Menu system.\n// You scroll through options you'll never use. Nothing to grab.",
        },
        {
          type: "file",
          id: "z_zone",
          name: "z_zone.c",
          itemId: "signed_nda",
          fileText: "// Memory zone management.\n// A signed NDA is stapled to a printout of this file. You can't say why.",
        },
      ],
    },
    {
      type: "folder",
      name: "legacy",
      children: [
        {
          type: "file",
          id: "jquery_min",
          name: "jquery.min.js",
          itemId: "it_works_on_my_machine_badge",
          fileText: "// Minified. Unreadable.\n// Someone left a laminated badge taped to their monitor, pointing at this file.",
        },
        {
          type: "file",
          id: "ie6_hacks",
          name: "ie6-hacks.css",
          itemId: "tabs_vs_spaces_allegiance",
          fileText: "/* IE6 conditional hacks. */\n/* A faction pin is stuck to the printout. A monument to a browser nobody misses. */",
        },
      ],
    },
    {
      type: "folder",
      name: ".config",
      children: [
        {
          type: "file",
          id: "env_backup",
          name: ".env.backup",
          itemId: "laptop_charger",
          fileText: "# old secrets, mostly expired\n# A charger cable is coiled up next to this file on the desk.",
        },
        {
          type: "file",
          id: "deploy_yml",
          name: "deploy.yml",
          itemId: "readme_nobody_wrote",
          fileText: "# deploy pipeline, undocumented\n# Someone started a README for this. It has one line: TODO.",
        },
        {
          type: "file",
          id: "old_todo",
          name: "old_todo.txt",
          itemId: "the_one_working_unit_test",
          fileText: "1. fix the thing\n2. ??? \n// A printout of a passing test run is paperclipped to this file.",
        },
      ],
    },
  ],
};

export function findExplorerFile(id: string, node: ExplorerNode = EXPLORER_TREE): ExplorerFileNode | undefined {
  if (node.type === "file") {
    return node.id === id ? node : undefined;
  }
  for (const child of node.children) {
    const found = findExplorerFile(id, child);
    if (found) return found;
  }
  return undefined;
}

export interface ScrambleListEntry {
  id: string;
  label: string;
  description: string;
  itemId: string | null;
}

export const SOURCE_CONTROL_ENTRIES: ScrambleListEntry[] = [
  {
    id: "git_stash_entry",
    label: "stash@{0}: WIP on main",
    description: "git stash list. Three entries. You have no memory of any of them.",
    itemId: "git_stash",
  },
  {
    id: "uncommitted_diff",
    label: "12 uncommitted changes",
    description: "Whitespace changes and one very passive-aggressive comment. Nothing to grab.",
    itemId: null,
  },
];

export const EXTENSIONS_ENTRIES: ScrambleListEntry[] = [
  {
    id: "stack_overflow_ext",
    label: "Stack Overflow Importer",
    description: "Pastes the top answer directly into your file. A bookmark is pinned inside its settings page.",
    itemId: "stack_overflow_bookmark",
  },
  {
    id: "gitlens_trial",
    label: "GitLens (trial expired)",
    description: "Wants you to upgrade. You will not upgrade. Nothing to grab.",
    itemId: null,
  },
  {
    id: "prettier_uninstalled",
    label: "Prettier — Code Formatter",
    description: "Uninstalled two jobs ago. Somehow still running. Nothing to grab.",
    itemId: null,
  },
];
```

- [ ] **Step 2: Create `src/content/gigFlavors.ts`**

```ts
export const GIG_FLAVORS: string[] = [
  "Fix a WordPress plugin — $200, due yesterday.",
  'Landing page for a crypto startup. They want it to "pop."',
  "Migrate a client off jQuery. They swear it'll be quick.",
  "Rebuild a logo in 4 different shades of blue.",
  '"Just a quick bug fix" — six hours ago.',
];
```

- [ ] **Step 3: Create `src/content/contacts.ts`**

```ts
export interface Contact {
  name: string;
  role: string;
  chatText: string;
}

export const CONTACTS: Contact[] = [
  {
    name: "Priya",
    role: "ex-coworker, now at BigCorp",
    chatText: '"We should grab coffee sometime." You will not grab coffee.',
  },
  {
    name: "Dev_Marcus",
    role: "met at a meetup once",
    chatText: "Sends you a job posting you're wildly underqualified for. It's flattering anyway.",
  },
  {
    name: "Old Manager",
    role: "still owes you a reference",
    chatText: '"Let\'s circle back on that reference." You\'ve heard this before.',
  },
];
```

- [ ] **Step 4: Create `src/content/problemFlavors.ts`**

```ts
export const PROBLEM_FLAVORS: string[] = [
  "Unused variable 'x' in invoice.ts",
  "Missing semicolon in deploy.sh",
  "TODO: fix this before launch (2019)",
  "console.log left in production build",
  "Deprecated API call in auth.ts",
  "Circular dependency detected",
  "Magic number should be a named constant",
  "Commented-out code block, 40 lines",
];
```

- [ ] **Step 5: Type-check**

Run: `npx tsc -b --force`
Expected: exits 0, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/content/scrambleContent.ts src/content/gigFlavors.ts src/content/contacts.ts src/content/problemFlavors.ts
git commit -m "content: add scramble explorer tree, source control/extensions entries, and flavor pools"
```

---

### Task 5: Store wiring — new state, new actions, incidentResolver + shop integration

**Files:**
- Modify: `src/store/types.ts`
- Modify: `src/store/gameStore.ts`

**Interfaces:**
- Consumes: `resolveIncident` (Task 2), `SHOP_ITEMS`/`canPurchase`/`applyPurchase` (Task 3).
- Produces (new `GameState` fields): `activityTab: ActivityTab`, `openedFileId: string | null`, `focusBonus: number`, `shopPurchases: string[]`, `terminalPanelOpen: boolean`, `terminalActiveTab: "terminal" | "problems"`.
- Produces (new store actions): `setActivityTab(tab: ActivityTab)`, `openExplorerFile(fileId: string)`, `purchaseShopItem(itemId: string)`, `setTerminalTab(tab: "terminal" | "problems")`, `toggleTerminalPanel()`. Consumed by Tasks 6-11.

- [ ] **Step 1: Add new fields and the `ActivityTab` type to `src/store/types.ts`**

Add near the top, after `GamePhase`:

```ts
export type ActivityTab = "explorer" | "source_control" | "extensions" | "shop";
```

Add these fields to the `GameState` interface (after `scramble: ScrambleState;`):

```ts
  activityTab: ActivityTab;
  openedFileId: string | null;
  focusBonus: number;
  shopPurchases: string[];
  terminalPanelOpen: boolean;
  terminalActiveTab: "terminal" | "problems";
```

- [ ] **Step 2: Initialize the new fields in `createInitialState`**

In `src/store/gameStore.ts`, in `createInitialState()`, add after `scramble: { ... }`:

```ts
    activityTab: "explorer",
    openedFileId: null,
    focusBonus: 0,
    shopPurchases: [],
    terminalPanelOpen: true,
    terminalActiveTab: "terminal",
```

- [ ] **Step 3: Import the new pure modules**

At the top of `src/store/gameStore.ts`, add:

```ts
import { resolveIncident } from "./incidentResolver";
import { applyPurchase, canPurchase } from "./shop";
```

- [ ] **Step 4: Refactor `respondToIncident` to use `resolveIncident`**

Replace the existing `respondToIncident` action body with:

```ts
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
```

- [ ] **Step 5: Wire `focusBonus` into the sprint Focus calculation**

In `advanceSprint`, find this line:

```ts
    focusRemaining:
      driftedResources.coffee <= 0 ? FOCUS_PER_SPRINT_COFFEE_ZERO : FOCUS_PER_SPRINT,
```

Replace with:

```ts
    focusRemaining:
      (driftedResources.coffee <= 0 ? FOCUS_PER_SPRINT_COFFEE_ZERO : FOCUS_PER_SPRINT) +
      state.focusBonus,
```

And in `pickCompanion`, find:

```ts
      focusRemaining: FOCUS_PER_SPRINT,
```

Replace with:

```ts
      focusRemaining: FOCUS_PER_SPRINT + state.focusBonus,
```

- [ ] **Step 6: Add `setActivityTab`, `openExplorerFile`, `setTerminalTab`, `toggleTerminalPanel` actions**

Add to the `GameStore` interface:

```ts
  setActivityTab: (tab: ActivityTab) => void;
  openExplorerFile: (fileId: string) => void;
  setTerminalTab: (tab: "terminal" | "problems") => void;
  toggleTerminalPanel: () => void;
  purchaseShopItem: (itemId: string) => void;
```

(Add `ActivityTab` to the type import from `./types`.)

Add the implementations (anywhere among the other actions, e.g. after `stopScramble`):

```ts
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
```

- [ ] **Step 7: Add `purchaseShopItem`**

```ts
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
```

Add `SHOP_ITEMS` to the `./shop` import from Step 3 (`import { SHOP_ITEMS, applyPurchase, canPurchase } from "./shop";`).

- [ ] **Step 8: Type-check**

Run: `npx tsc -b --force`
Expected: exits 0, no errors.

- [ ] **Step 9: Run the full test suite**

Run: `npx vitest run`
Expected: all existing tests (Tasks 2 and 3) still PASS — this task didn't change `incidentResolver.ts` or `shop.ts`, only how `gameStore.ts` calls them.

- [ ] **Step 10: Commit**

```bash
git add src/store/types.ts src/store/gameStore.ts
git commit -m "feat: wire incidentResolver, shop, activity tabs, and focus bonus into the game store"
```

---

### Task 6: Activity Bar component + shell layout update

**Files:**
- Create: `src/components/shell/ActivityBar.tsx`
- Modify: `src/components/shell/AppShell.tsx`
- Modify: `src/styles/components.css`

**Interfaces:**
- Consumes: `activityTab`, `setActivityTab` from the store (Task 5); `phase` from the store.

- [ ] **Step 1: Create `ActivityBar.tsx`**

```tsx
import { useGameStore } from "../../store/gameStore";
import type { ActivityTab } from "../../store/types";

interface ActivityBarButton {
  tab: ActivityTab;
  icon: string;
  label: string;
}

const SCRAMBLE_BUTTONS: ActivityBarButton[] = [
  { tab: "explorer", icon: "📁", label: "Explorer" },
  { tab: "source_control", icon: "🌿", label: "Source Control" },
  { tab: "extensions", icon: "🧩", label: "Extensions" },
];

const SPRINT_BUTTONS: ActivityBarButton[] = [
  { tab: "explorer", icon: "📁", label: "Explorer" },
  { tab: "shop", icon: "🛍", label: "Shop" },
];

export function ActivityBar() {
  const phase = useGameStore((s) => s.phase);
  const activityTab = useGameStore((s) => s.activityTab);
  const setActivityTab = useGameStore((s) => s.setActivityTab);

  if (phase !== "scramble_loot" && phase !== "sprint") return null;

  const buttons = phase === "scramble_loot" ? SCRAMBLE_BUTTONS : SPRINT_BUTTONS;

  return (
    <div className="activity-bar">
      {buttons.map((button) => (
        <button
          key={button.tab}
          className={`activity-bar-btn ${activityTab === button.tab ? "active" : ""}`}
          title={button.label}
          onClick={() => setActivityTab(button.tab)}
        >
          {button.icon}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `AppShell.tsx`**

```tsx
import { IncidentToastContainer } from "../incident/IncidentToastContainer";
import { ActivityBar } from "./ActivityBar";
import { EditorArea } from "./EditorArea";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { TerminalPanel } from "./TerminalPanel";

export function AppShell() {
  return (
    <div className="app-shell">
      <ActivityBar />
      <Sidebar />
      <EditorArea />
      <TerminalPanel />
      <StatusBar />
      <IncidentToastContainer />
    </div>
  );
}
```

- [ ] **Step 3: Update the grid layout in `components.css`**

Replace the existing `.app-shell` rule:

```css
.app-shell {
  height: 100vh;
  display: grid;
  grid-template-columns: 48px 240px 1fr;
  grid-template-rows: 1fr auto 22px;
  grid-template-areas:
    "activitybar sidebar editor"
    "activitybar sidebar terminal"
    "statusbar statusbar statusbar";
}
```

Add new rules (anywhere in the "Sidebar" section):

```css
.activity-bar {
  grid-area: activitybar;
  background: var(--vsc-bg-activitybar);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8px;
  gap: 4px;
}

.activity-bar-btn {
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  border-left: 2px solid transparent;
  font-size: 18px;
  color: var(--vsc-fg-muted);
  border-radius: 0;
}

.activity-bar-btn:hover:not(:disabled) {
  color: var(--vsc-fg-bright);
  background: none;
  border-color: transparent;
}

.activity-bar-btn.active {
  color: var(--vsc-fg-bright);
  border-left-color: var(--vsc-accent-blue);
}
```

Note the `.sidebar` rule already sets `grid-area: sidebar`, which still matches — no change needed there.

- [ ] **Step 4: Type-check and manually verify**

Run: `npx tsc -b --force` — expect 0 errors.

Start the dev server and confirm in the Browser tool: on the intro screen and companion-pick screen the Activity Bar is absent (phase is `intro`/`scramble_companion`); starting a new run shows the Activity Bar with 3 icons; clicking each icon highlights it (the actual panel content switch is wired in Task 7-8, so the Sidebar content won't change yet — that's expected at this point).

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/ActivityBar.tsx src/components/shell/AppShell.tsx src/styles/components.css
git commit -m "feat: add VS Code activity bar and update shell grid layout"
```

---

### Task 7: Explorer panel, File viewer, Sidebar routing, status bar labels

**Files:**
- Create: `src/components/scramble/ExplorerPanel.tsx`
- Create: `src/components/scramble/FileViewer.tsx`
- Modify: `src/components/shell/Sidebar.tsx`
- Modify: `src/components/scramble/ScrambleScreen.tsx`
- Modify: `src/components/shell/common/ResourceMeter.tsx`
- Modify: `src/styles/components.css`

**Interfaces:**
- Consumes: `EXPLORER_TREE`, `findExplorerFile`, `ExplorerNode` (Task 4); `openedFileId`, `openExplorerFile`, `activityTab` (Task 5); `grabItem` (existing).

- [ ] **Step 1: Create `ExplorerPanel.tsx`**

```tsx
import { useState } from "react";
import type { ExplorerNode } from "../../content/scrambleContent";
import { EXPLORER_TREE } from "../../content/scrambleContent";
import { useGameStore } from "../../store/gameStore";

function ExplorerNodeRow({ node, depth }: { node: ExplorerNode; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const openedFileId = useGameStore((s) => s.openedFileId);
  const grabbedItemIds = useGameStore((s) => s.scramble.grabbedItemIds);
  const openExplorerFile = useGameStore((s) => s.openExplorerFile);

  const indent = { paddingLeft: 16 + depth * 14 };

  if (node.type === "folder") {
    return (
      <div>
        <div
          className="tree-row folder"
          style={indent}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "📂" : "📁"} {node.name}
        </div>
        {expanded && node.children.map((child) => (
          <ExplorerNodeRow key={"id" in child ? child.id : child.name} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  const grabbed = node.itemId ? grabbedItemIds.includes(node.itemId) : false;

  return (
    <div
      className={`tree-row ${openedFileId === node.id ? "active" : ""}`}
      style={indent}
      onClick={() => openExplorerFile(node.id)}
    >
      {grabbed ? "✓" : "📄"} {node.name}
    </div>
  );
}

export function ExplorerPanel() {
  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">Explorer</div>
      <ExplorerNodeRow node={EXPLORER_TREE} depth={0} />
    </div>
  );
}
```

- [ ] **Step 2: Create `FileViewer.tsx`**

```tsx
import { itemsById } from "../../content";
import { findExplorerFile } from "../../content/scrambleContent";
import { useGameStore } from "../../store/gameStore";
import { SCRAMBLE_INVENTORY_CAP } from "../../store/sprintEconomy";

export function FileViewer() {
  const openedFileId = useGameStore((s) => s.openedFileId);
  const grabbedItemIds = useGameStore((s) => s.scramble.grabbedItemIds);
  const timeRemaining = useGameStore((s) => s.scramble.timeRemaining);
  const grabItem = useGameStore((s) => s.grabItem);

  if (!openedFileId) {
    return <p className="narrative-subtitle">Click a file in the Explorer to open it.</p>;
  }

  const file = findExplorerFile(openedFileId);
  if (!file) return null;

  const item = file.itemId ? itemsById[file.itemId] : null;
  const grabbed = file.itemId ? grabbedItemIds.includes(file.itemId) : false;
  const capReached = grabbedItemIds.length >= SCRAMBLE_INVENTORY_CAP;

  return (
    <div className="file-viewer">
      <pre className="file-viewer-content">{file.fileText}</pre>
      {item ? (
        <button
          className="btn btn-primary"
          disabled={grabbed || timeRemaining <= 0 || (!grabbed && capReached)}
          onClick={() => grabItem(item.id)}
        >
          {grabbed ? `✓ ${item.name} grabbed` : `Grab ${item.name}`}
        </button>
      ) : (
        <p className="file-viewer-empty">Nothing useful here.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update `Sidebar.tsx` to show the Explorer panel during the scramble**

This is a minimal, self-contained routing step — Source Control/Extensions/Shop routing and the Contacts list are added incrementally in Tasks 8, 10, and 11, each in the task that actually introduces that panel, so every task keeps the whole app compiling on its own.

```tsx
import { CompanionPanel } from "./CompanionPanel";
import { InventoryTree } from "./InventoryTree";
import { ExplorerPanel } from "../scramble/ExplorerPanel";
import { useGameStore } from "../../store/gameStore";

export function Sidebar() {
  const phase = useGameStore((s) => s.phase);

  if (phase === "scramble_loot") {
    return <div className="sidebar"><ExplorerPanel /></div>;
  }

  return (
    <div className="sidebar">
      <InventoryTree />
      <CompanionPanel />
    </div>
  );
}
```

- [ ] **Step 4: Update `ScrambleScreen.tsx` to show `FileViewer` in the editor area for the Explorer tab**

```tsx
import { useCountdown } from "../../hooks/useCountdown";
import { useGameStore } from "../../store/gameStore";
import { CompanionPicker } from "./CompanionPicker";
import { FileViewer } from "./FileViewer";

export function ScrambleScreen() {
  const phase = useGameStore((s) => s.phase);
  const activityTab = useGameStore((s) => s.activityTab);
  const tickScrambleTimer = useGameStore((s) => s.tickScrambleTimer);
  const timeRemaining = useGameStore((s) => s.scramble.timeRemaining);
  const grabbedItemIds = useGameStore((s) => s.scramble.grabbedItemIds);
  const stopScramble = useGameStore((s) => s.stopScramble);

  useCountdown(phase === "scramble_loot", tickScrambleTimer);

  if (phase === "scramble_loot") {
    const timeUp = timeRemaining <= 0;
    return (
      <>
        <h1 className="narrative-title"># scramble.ts</h1>
        <div className="scramble-header">
          <span>Grabbed {grabbedItemIds.length} / 4</span>
          <span className={`scramble-timer ${timeRemaining <= 10 ? "low" : ""}`}>{timeRemaining}s</span>
        </div>
        {activityTab === "explorer" ? (
          <FileViewer />
        ) : (
          <p className="narrative-subtitle">Browse the list on the left.</p>
        )}
        <button className="btn btn-primary" onClick={stopScramble} disabled={timeUp} style={{ marginTop: 16 }}>
          {grabbedItemIds.length === 0 ? "Leave empty-handed" : "I'm done grabbing"}
        </button>
      </>
    );
  }

  return (
    <>
      <h1 className="narrative-title"># scramble.ts</h1>
      <p className="narrative-subtitle">One seat left on the way out. Who do you bring?</p>
      <CompanionPicker />
    </>
  );
}
```

This replaces the old `LootGrid` usage — delete `src/components/scramble/LootGrid.tsx`, it's fully superseded by `ExplorerPanel` + `FileViewer` + `SourceControlPanel`/`ExtensionsPanel`.

- [ ] **Step 5: Add visible labels to `ResourceMeter.tsx`**

```tsx
interface ResourceMeterProps {
  icon: string;
  label: string;
  value: number;
}

export function ResourceMeter({ icon, label, value }: ResourceMeterProps) {
  return (
    <span className="resource-meter">
      <span className="resource-meter-icon">{icon}</span>
      <span className="resource-meter-label">{label}</span>
      {value}
    </span>
  );
}
```

- [ ] **Step 6: Add CSS for the new elements**

Append to `src/styles/components.css`:

```css
.tree-row.active {
  background: var(--vsc-bg-selected);
}

.file-viewer {
  background: var(--vsc-bg-input);
  border: 1px solid var(--vsc-border);
  border-radius: var(--vsc-radius);
  padding: 16px;
  margin-bottom: 16px;
}

.file-viewer-content {
  font-family: var(--vsc-font-mono);
  font-size: 12px;
  color: var(--vsc-fg-default);
  white-space: pre-wrap;
  margin: 0 0 12px;
}

.file-viewer-empty {
  color: var(--vsc-fg-muted);
  font-style: italic;
  margin: 0;
}

.resource-meter-label {
  opacity: 0.85;
}
```

- [ ] **Step 7: Type-check and manually verify**

Run: `npx tsc -b --force`
Expected: exits 0, no errors.

Start the dev server and confirm in the Browser tool: starting a new run shows the Explorer tree in the sidebar; expanding folders and opening a file shows its content in the main editor area with a "Grab" button when it has an item, or "Nothing useful here" for a dead end; grabbing updates the file's row to a checkmark and the grabbed count in the header. Switching to the Source Control/Extensions tabs on the Activity Bar won't change the sidebar yet — that's wired in Task 8.

- [ ] **Step 8: Commit**

```bash
git add src/components/scramble/ExplorerPanel.tsx src/components/scramble/FileViewer.tsx src/components/shell/Sidebar.tsx src/components/scramble/ScrambleScreen.tsx src/components/shell/common/ResourceMeter.tsx src/styles/components.css
git rm src/components/scramble/LootGrid.tsx
git commit -m "feat: add Explorer panel + file viewer, route sidebar by phase/tab, verbose status bar labels"
```

---

### Task 8: Source Control panel + Extensions panel

**Files:**
- Create: `src/components/scramble/ScrambleListPanel.tsx`
- Create: `src/components/scramble/SourceControlPanel.tsx`
- Create: `src/components/scramble/ExtensionsPanel.tsx`
- Modify: `src/components/shell/Sidebar.tsx`
- Modify: `src/styles/components.css`

**Interfaces:**
- Consumes: `ScrambleListEntry`, `SOURCE_CONTROL_ENTRIES`, `EXTENSIONS_ENTRIES` (Task 4); `grabItem`, `scramble.grabbedItemIds`, `scramble.timeRemaining`, `activityTab` from the store.
- Produces: `SourceControlPanel`, `ExtensionsPanel`.

- [ ] **Step 1: Create the shared `ScrambleListPanel.tsx`**

```tsx
import { itemsById } from "../../content";
import type { ScrambleListEntry } from "../../content/scrambleContent";
import { useGameStore } from "../../store/gameStore";
import { SCRAMBLE_INVENTORY_CAP } from "../../store/sprintEconomy";

interface ScrambleListPanelProps {
  title: string;
  entries: ScrambleListEntry[];
}

export function ScrambleListPanel({ title, entries }: ScrambleListPanelProps) {
  const grabbedItemIds = useGameStore((s) => s.scramble.grabbedItemIds);
  const timeRemaining = useGameStore((s) => s.scramble.timeRemaining);
  const grabItem = useGameStore((s) => s.grabItem);

  const capReached = grabbedItemIds.length >= SCRAMBLE_INVENTORY_CAP;

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">{title}</div>
      {entries.map((entry) => {
        const item = entry.itemId ? itemsById[entry.itemId] : null;
        const grabbed = entry.itemId ? grabbedItemIds.includes(entry.itemId) : false;
        return (
          <div className="scramble-list-entry" key={entry.id}>
            <div className="scramble-list-entry-label">{entry.label}</div>
            <div className="scramble-list-entry-desc">{entry.description}</div>
            {item && (
              <button
                className="btn scramble-list-entry-grab"
                disabled={grabbed || timeRemaining <= 0 || (!grabbed && capReached)}
                onClick={() => grabItem(entry.itemId as string)}
              >
                {grabbed ? "✓ grabbed" : `Grab ${item.name}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create `SourceControlPanel.tsx`**

```tsx
import { SOURCE_CONTROL_ENTRIES } from "../../content/scrambleContent";
import { ScrambleListPanel } from "./ScrambleListPanel";

export function SourceControlPanel() {
  return <ScrambleListPanel title="Source Control" entries={SOURCE_CONTROL_ENTRIES} />;
}
```

- [ ] **Step 3: Create `ExtensionsPanel.tsx`**

```tsx
import { EXTENSIONS_ENTRIES } from "../../content/scrambleContent";
import { ScrambleListPanel } from "./ScrambleListPanel";

export function ExtensionsPanel() {
  return <ScrambleListPanel title="Extensions" entries={EXTENSIONS_ENTRIES} />;
}
```

- [ ] **Step 4: Extend `Sidebar.tsx` to route by activity tab during the scramble**

Replace the `Sidebar` function body from Task 7 with:

```tsx
import { CompanionPanel } from "./CompanionPanel";
import { InventoryTree } from "./InventoryTree";
import { ExplorerPanel } from "../scramble/ExplorerPanel";
import { SourceControlPanel } from "../scramble/SourceControlPanel";
import { ExtensionsPanel } from "../scramble/ExtensionsPanel";
import { useGameStore } from "../../store/gameStore";

export function Sidebar() {
  const phase = useGameStore((s) => s.phase);
  const activityTab = useGameStore((s) => s.activityTab);

  if (phase === "scramble_loot") {
    if (activityTab === "source_control") return <div className="sidebar"><SourceControlPanel /></div>;
    if (activityTab === "extensions") return <div className="sidebar"><ExtensionsPanel /></div>;
    return <div className="sidebar"><ExplorerPanel /></div>;
  }

  return (
    <div className="sidebar">
      <InventoryTree />
      <CompanionPanel />
    </div>
  );
}
```

- [ ] **Step 5: Add CSS**

Append to `src/styles/components.css`:

```css
.scramble-list-entry {
  padding: 8px 16px;
  border-bottom: 1px solid var(--vsc-border);
}

.scramble-list-entry-label {
  font-family: var(--vsc-font-mono);
  font-size: 12px;
  color: var(--vsc-fg-bright);
  margin-bottom: 2px;
}

.scramble-list-entry-desc {
  font-size: 11px;
  color: var(--vsc-fg-muted);
  margin-bottom: 6px;
  line-height: 1.4;
}

.scramble-list-entry-grab {
  font-size: 11px;
  padding: 4px 8px;
}
```

- [ ] **Step 6: Type-check and manually verify**

Run: `npx tsc -b --force`
Expected: exits 0, no errors.

Confirm in the Browser tool: clicking the 🌿 Source Control icon on the Activity Bar shows the two entries, grabbing `git_stash` works; clicking 🧩 Extensions shows its three entries, grabbing `stack_overflow_bookmark` works; the dead-end entries in both show their description with no grab button.

- [ ] **Step 7: Commit**

```bash
git add src/components/scramble/ScrambleListPanel.tsx src/components/scramble/SourceControlPanel.tsx src/components/scramble/ExtensionsPanel.tsx src/components/shell/Sidebar.tsx src/styles/components.css
git commit -m "feat: add Source Control and Extensions scramble panels"
```

---

### Task 9: Refactor via Problems badge — tabbed Terminal panel

**Files:**
- Create: `src/components/shell/ProblemsPanel.tsx`
- Modify: `src/components/shell/common/ProblemsBadge.tsx`
- Modify: `src/components/shell/TerminalPanel.tsx`
- Modify: `src/styles/components.css`

**Interfaces:**
- Consumes: `PROBLEM_FLAVORS` (Task 4); `terminalActiveTab`, `terminalPanelOpen`, `setTerminalTab`, `toggleTerminalPanel`, `performAction` (Task 5).

- [ ] **Step 1: Create `ProblemsPanel.tsx`**

```tsx
import { PROBLEM_FLAVORS } from "../../content/problemFlavors";
import { useGameStore } from "../../store/gameStore";

export function ProblemsPanel() {
  const techDebt = useGameStore((s) => s.resources.techDebt);
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const phase = useGameStore((s) => s.phase);
  const performAction = useGameStore((s) => s.performAction);

  const count = Math.min(PROBLEM_FLAVORS.length, Math.max(1, Math.ceil(techDebt / 10)));
  const visibleProblems = PROBLEM_FLAVORS.slice(0, count);
  const canRefactor = phase === "sprint" && focusRemaining >= 1 && !activeIncident;

  if (visibleProblems.length === 0) {
    return <div className="terminal-line">No problems. Suspicious.</div>;
  }

  return (
    <div className="problems-panel">
      {visibleProblems.map((text) => (
        <button
          key={text}
          className="problem-row"
          disabled={!canRefactor}
          onClick={() => performAction("refactor")}
        >
          🐛 {text}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Make `ProblemsBadge.tsx` clickable**

```tsx
import { useGameStore } from "../../store/gameStore";

interface ProblemsBadgeProps {
  techDebt: number;
}

export function ProblemsBadge({ techDebt }: ProblemsBadgeProps) {
  const setTerminalTab = useGameStore((s) => s.setTerminalTab);
  const severity = techDebt >= 60 ? "error" : techDebt >= 30 ? "warn" : "ok";

  return (
    <button
      className={`problems-badge ${severity}`}
      title="Tech Debt (Problems) — click to refactor"
      onClick={() => setTerminalTab("problems")}
    >
      🐛 {techDebt}
    </button>
  );
}
```

- [ ] **Step 3: Update `TerminalPanel.tsx` with a tab switcher**

```tsx
import { useEffect, useRef } from "react";
import { useGameStore } from "../../store/gameStore";
import { ProblemsPanel } from "./ProblemsPanel";

export function TerminalPanel() {
  const log = useGameStore((s) => s.log);
  const open = useGameStore((s) => s.terminalPanelOpen);
  const activeTab = useGameStore((s) => s.terminalActiveTab);
  const toggleTerminalPanel = useGameStore((s) => s.toggleTerminalPanel);
  const setTerminalTab = useGameStore((s) => s.setTerminalTab);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || activeTab !== "terminal" || !bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [log, open, activeTab]);

  return (
    <div className="terminal-panel">
      <div className="terminal-header">
        <div className="terminal-tabs">
          <button
            className={`terminal-tab ${activeTab === "terminal" ? "active" : ""}`}
            onClick={() => setTerminalTab("terminal")}
          >
            Terminal
          </button>
          <button
            className={`terminal-tab ${activeTab === "problems" ? "active" : ""}`}
            onClick={() => setTerminalTab("problems")}
          >
            Problems
          </button>
        </div>
        <button className="terminal-toggle" onClick={toggleTerminalPanel}>
          {open ? "hide ▾" : "show ▸"}
        </button>
      </div>
      {open && (
        <div className="terminal-body" ref={bodyRef}>
          {activeTab === "terminal" ? (
            log.map((entry) => (
              <div className="terminal-line" key={entry.id}>
                <span className="terminal-line-prefix">$</span>
                {entry.text}
              </div>
            ))
          ) : (
            <ProblemsPanel />
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add CSS for tabs and problem rows**

Append to `src/styles/components.css`:

```css
.terminal-tabs {
  display: flex;
  gap: 4px;
}

.terminal-tab {
  background: none;
  border: none;
  color: var(--vsc-fg-muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-bottom: 2px solid transparent;
}

.terminal-tab.active {
  color: var(--vsc-fg-bright);
  border-bottom-color: var(--vsc-accent-blue);
}

.problems-panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.problem-row {
  background: none;
  border: none;
  text-align: left;
  color: var(--vsc-fg-default);
  font-family: var(--vsc-font-mono);
  font-size: 12px;
  padding: 2px 0;
}

.problem-row:hover:not(:disabled) {
  color: var(--vsc-accent-yellow);
  background: none;
}

.problems-badge {
  border: none;
}
```

(The existing `.problems-badge` rule already sets background/padding; this just clears the default button border since it's now a `<button>`.)

- [ ] **Step 5: Type-check**

Run: `npx tsc -b --force`
Expected: 0 errors.

- [ ] **Step 6: Manually verify**

Start a run, spend Focus down in a sprint with no active incident, click the 🐛 badge in the status bar, confirm the Terminal panel switches to the Problems tab and shows rows scaled to current Tech Debt; click a row and confirm Tech Debt drops by 15 (same as the old Refactor button) and the row count updates.

- [ ] **Step 7: Commit**

```bash
git add src/components/shell/ProblemsPanel.tsx src/components/shell/common/ProblemsBadge.tsx src/components/shell/TerminalPanel.tsx src/styles/components.css
git commit -m "feat: make refactor a click-through-the-Problems-badge interaction"
```

---

### Task 10: Companion check-in click, Rest status-bar toggle, Gig board, Contacts list, remove ActionMenu

**Files:**
- Modify: `src/components/shell/CompanionPanel.tsx`
- Modify: `src/components/shell/StatusBar.tsx`
- Create: `src/components/sprint/GigBoard.tsx`
- Create: `src/components/sprint/ContactsList.tsx`
- Modify: `src/components/sprint/SprintScreen.tsx`
- Modify: `src/components/shell/Sidebar.tsx`
- Delete: `src/components/sprint/ActionMenu.tsx`
- Modify: `src/styles/components.css`

**Interfaces:**
- Consumes: `GIG_FLAVORS` (Task 4), `CONTACTS`/`Contact` (Task 4), `performAction`/`focusRemaining`/`activeIncident`/`offerUnlocked`/`takeTheOffer` (existing store).
- Produces: `GigBoard`, `ContactsList` (consumed by `Sidebar.tsx`, already written in Task 7).

- [ ] **Step 1: Make `CompanionPanel.tsx` clickable for check-in**

```tsx
import { companionsById } from "../../content";
import { useGameStore } from "../../store/gameStore";

export function CompanionPanel() {
  const companionId = useGameStore((s) => s.companionId);
  const relationshipLevel = useGameStore((s) => s.flags.relationshipLevel);
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const performAction = useGameStore((s) => s.performAction);

  if (!companionId) return null;
  const companion = companionsById[companionId];
  if (!companion) return null;

  const disabled = focusRemaining < 1 || !!activeIncident;

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">Team</div>
      <button
        className="companion-card companion-card-clickable"
        disabled={disabled}
        onClick={() => performAction("check_in")}
        title="Check in"
      >
        <div className="companion-card-name">{companion.name}</div>
        <div className="companion-card-desc">{companion.description}</div>
        <div className="companion-card-relationship">Relationship: {relationshipLevel}</div>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add a Rest toggle to `StatusBar.tsx`**

```tsx
import { useGameStore } from "../../store/gameStore";
import { ProblemsBadge } from "./common/ProblemsBadge";
import { ResourceMeter } from "./common/ResourceMeter";

export function StatusBar() {
  const resources = useGameStore((s) => s.resources);
  const phase = useGameStore((s) => s.phase);
  const sprintNumber = useGameStore((s) => s.sprintNumber);
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const performAction = useGameStore((s) => s.performAction);

  const canRest = phase === "sprint" && focusRemaining >= 1 && !activeIncident;

  return (
    <div className="status-bar">
      <ResourceMeter icon="☕" label="Coffee" value={resources.coffee} />
      <ResourceMeter icon="🧠" label="Sanity" value={resources.sanity} />
      <ResourceMeter icon="⭐" label="Reputation" value={resources.reputation} />
      <ResourceMeter icon="💰" label="Runway" value={resources.runway} />
      <ProblemsBadge techDebt={resources.techDebt} />
      {phase === "sprint" && (
        <button
          className="status-bar-rest"
          disabled={!canRest}
          onClick={() => performAction("rest")}
          title="Rest"
        >
          🛋 Away
        </button>
      )}
      <span className="status-bar-spacer" />
      {phase === "sprint" && <span className="status-bar-sprint">Sprint {sprintNumber}</span>}
    </div>
  );
}
```

- [ ] **Step 3: Create `GigBoard.tsx`**

```tsx
import { useState } from "react";
import { GIG_FLAVORS } from "../../content/gigFlavors";
import { useGameStore } from "../../store/gameStore";

export function GigBoard() {
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const performAction = useGameStore((s) => s.performAction);
  const [flavorIndex, setFlavorIndex] = useState(() => Math.floor(Math.random() * GIG_FLAVORS.length));

  const disabled = focusRemaining < 1 || !!activeIncident;

  function accept() {
    performAction("take_gig");
    setFlavorIndex(Math.floor(Math.random() * GIG_FLAVORS.length));
  }

  return (
    <div className="gig-board">
      <div className="gig-board-title">📋 Open gig</div>
      <div className="gig-board-desc">{GIG_FLAVORS[flavorIndex]}</div>
      <button className="btn btn-primary" disabled={disabled} onClick={accept}>
        Accept
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create `ContactsList.tsx`**

```tsx
import { useState } from "react";
import { CONTACTS } from "../../content/contacts";
import { useGameStore } from "../../store/gameStore";

export function ContactsList() {
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const performAction = useGameStore((s) => s.performAction);
  const [usedIndex, setUsedIndex] = useState<number | null>(null);

  const disabled = focusRemaining < 1 || !!activeIncident;

  function network(index: number) {
    performAction("network");
    setUsedIndex(index);
  }

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">Contacts</div>
      {CONTACTS.map((contact, index) => (
        <button
          key={contact.name}
          className="contact-row"
          disabled={disabled}
          onClick={() => network(index)}
        >
          {contact.name} — <span className="contact-role">{contact.role}</span>
        </button>
      ))}
      {usedIndex !== null && <div className="contact-last-text">{CONTACTS[usedIndex].chatText}</div>}
    </div>
  );
}
```

- [ ] **Step 5: Rewrite `SprintScreen.tsx`**

```tsx
import { useGameStore } from "../../store/gameStore";
import { GigBoard } from "./GigBoard";

export function SprintScreen() {
  const sprintNumber = useGameStore((s) => s.sprintNumber);
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const offerUnlocked = useGameStore((s) => s.offerUnlocked);
  const takeTheOffer = useGameStore((s) => s.takeTheOffer);

  return (
    <>
      <h1 className="narrative-title"># sprint-{sprintNumber}.ts</h1>
      <p className="narrative-comment">
        // {focusRemaining} focus point{focusRemaining === 1 ? "" : "s"} remaining this sprint
      </p>
      {activeIncident ? (
        <p className="narrative-subtitle">Something's happening. Check the notification.</p>
      ) : (
        <>
          <p className="narrative-subtitle">
            Click the 🐛 badge to refactor, check in with your companion or a contact in the
            sidebar to network, or go 🛋 Away in the status bar to rest.
          </p>
          <GigBoard />
          {offerUnlocked && (
            <button className="btn action-btn offer" onClick={takeTheOffer} style={{ marginTop: 16 }}>
              <span className="action-btn-name">Take the Offer</span>
              <span className="action-btn-desc">Cash out. End the run here.</span>
            </button>
          )}
        </>
      )}
    </>
  );
}
```

- [ ] **Step 6: Delete `ActionMenu.tsx`**

```bash
git rm src/components/sprint/ActionMenu.tsx
```

- [ ] **Step 7: Extend `Sidebar.tsx` to show the Contacts list during the sprint**

Add the import and the conditional line to the `Sidebar` function from Task 8:

```tsx
import { ContactsList } from "../sprint/ContactsList";
```

```tsx
  return (
    <div className="sidebar">
      <InventoryTree />
      <CompanionPanel />
      {phase === "sprint" && <ContactsList />}
    </div>
  );
```

- [ ] **Step 8: Add CSS**

Append to `src/styles/components.css`:

```css
.companion-card-clickable {
  display: block;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.status-bar-rest {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 2px;
}

.status-bar-rest:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.gig-board {
  background: var(--vsc-bg-input);
  border: 1px solid var(--vsc-border);
  border-radius: var(--vsc-radius);
  padding: 14px;
  max-width: 360px;
}

.gig-board-title {
  font-weight: 600;
  margin-bottom: 6px;
}

.gig-board-desc {
  font-size: 12px;
  color: var(--vsc-fg-muted);
  margin-bottom: 10px;
  line-height: 1.4;
}

.contact-row {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: var(--vsc-fg-default);
  font-size: 12px;
  padding: 4px 16px;
}

.contact-row:hover:not(:disabled) {
  background: var(--vsc-bg-hover);
}

.contact-role {
  color: var(--vsc-fg-muted);
}

.contact-last-text {
  font-size: 11px;
  color: var(--vsc-accent-green);
  padding: 4px 16px;
  line-height: 1.4;
}
```

- [ ] **Step 9: Type-check and manually verify**

Run: `npx tsc -b --force`
Expected: exits 0, no errors.

Confirm in the Browser tool: the sidebar now shows a Contacts list below the companion card during the sprint phase; clicking a contact spends Focus and shows its chat text; clicking the companion card checks in; clicking 🛋 Away in the status bar rests; the Gig Board shows on the sprint screen with a randomized offer that changes after accepting.

- [ ] **Step 10: Commit**

```bash
git add src/components/shell/CompanionPanel.tsx src/components/shell/StatusBar.tsx src/components/sprint/GigBoard.tsx src/components/sprint/ContactsList.tsx src/components/sprint/SprintScreen.tsx src/components/shell/Sidebar.tsx src/styles/components.css
git commit -m "feat: bespoke interactions for check-in, rest, take-a-gig, and network"
```

---

### Task 11: Shop panel + full integration verification

**Files:**
- Create: `src/components/shop/ShopPanel.tsx`
- Modify: `src/components/shell/Sidebar.tsx`
- Modify: `src/styles/components.css`

**Interfaces:**
- Consumes: `SHOP_ITEMS`, `canPurchase` (Task 3); `resources.runway`, `shopPurchases`, `purchaseShopItem` (Task 5); `activityTab` from the store.

- [ ] **Step 1: Create `ShopPanel.tsx`**

```tsx
import { canPurchase, SHOP_ITEMS } from "../../store/shop";
import { useGameStore } from "../../store/gameStore";

export function ShopPanel() {
  const runway = useGameStore((s) => s.resources.runway);
  const shopPurchases = useGameStore((s) => s.shopPurchases);
  const purchaseShopItem = useGameStore((s) => s.purchaseShopItem);

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">Shop</div>
      {SHOP_ITEMS.map((item) => {
        const check = canPurchase(item.id, runway, shopPurchases);
        return (
          <div className="shop-item" key={item.id}>
            <div className="shop-item-name">{item.name}</div>
            <div className="shop-item-desc">{item.description}</div>
            <button
              className="btn shop-item-buy"
              disabled={!check.allowed}
              onClick={() => purchaseShopItem(item.id)}
            >
              💰 {item.cost}
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Add CSS**

Append to `src/styles/components.css`:

```css
.shop-item {
  padding: 8px 16px;
  border-bottom: 1px solid var(--vsc-border);
}

.shop-item-name {
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 2px;
}

.shop-item-desc {
  font-size: 11px;
  color: var(--vsc-fg-muted);
  margin-bottom: 6px;
  line-height: 1.4;
}

.shop-item-buy {
  font-size: 11px;
  padding: 4px 8px;
}
```

- [ ] **Step 3: Extend `Sidebar.tsx` with the final Shop routing**

Add the import and the conditional block to the `Sidebar` function from Task 10:

```tsx
import { ShopPanel } from "../shop/ShopPanel";
```

```tsx
  if (phase === "sprint" && activityTab === "shop") {
    return <div className="sidebar"><ShopPanel /></div>;
  }
```

This must go in the `Sidebar` function body *before* the final fallback `return` (the one rendering `InventoryTree`/`CompanionPanel`/`ContactsList`), same placement pattern as the `scramble_loot` branch above it.

- [ ] **Step 4: Full type-check**

Run: `npx tsc -b --force`
Expected: 0 errors — this is the final state of `Sidebar.tsx`, pulling together every panel from Tasks 6-11.

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: all tests from Tasks 2 and 3 PASS (13 tests total).

- [ ] **Step 6: Build and lint**

Run: `npm run build`
Expected: succeeds, no errors.

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 7: Full manual playtest in the Browser tool**

Start the dev server and play one complete run, touching every new interaction at least once:
1. Scramble: switch between Explorer/Source Control/Extensions tabs via the Activity Bar. In Explorer, open at least one file with an item and grab it, open at least one true dead-end file (confirm no grab button, "Nothing useful here" shows). In Source Control, grab `git_stash`. In Extensions, grab `stack_overflow_bookmark`. Confirm the 4-item cap still disables further grabs.
2. Pick a companion, confirm the sprint screen shows the Gig Board and the updated hint text (no old action-menu buttons remain).
3. Click the companion card in the sidebar to check in — confirm Focus decrements and Sanity/relationship update.
4. Click a contact in the Contacts list to network — confirm Focus decrements and the chat text appears.
5. Click 🛋 Away in the status bar to rest — confirm Focus decrements and Coffee/Sanity update.
6. Click the 🐛 Problems badge — confirm the Terminal panel switches to the Problems tab; click a problem row — confirm Tech Debt drops by 15 and Focus decrements.
7. Accept a gig from the Gig Board — confirm Runway/Reputation update and the flavor text changes on the next render.
8. Switch to the Shop tab (Activity Bar, sprint phase) — buy Coffee Refill (confirm Coffee jumps to 100, Runway drops by 10), buy Better Coffee once (confirm it becomes disabled/unbuyable afterward and Focus per sprint is +1 from the next sprint on), buy a junk item (confirm Runway drops, nothing else changes).
9. Deliberately trigger the `force_pushed_to_main` incident (may require several sprints since it's `minSprint: 2`, low weight) and resolve it with `git_stash` — confirm the success text includes the Reputation bonus (Reputation should jump by more than a normal successful counter, which grants none).
10. Reach "Take the Offer" or a forced-fail ending as in the original Phase 1 verification, confirm no console errors throughout (`read_console_messages`).

- [ ] **Step 8: Commit**

```bash
git add src/components/shop/ShopPanel.tsx src/components/shell/Sidebar.tsx src/styles/components.css
git commit -m "feat: add Runway shop panel; completes scramble and interaction redesign"
```
