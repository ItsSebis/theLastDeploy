# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"The Last Deploy" — a browser text-adventure reskinned around software agency
culture: a timed **scramble** phase (loot a dying client repo before access
expires) followed by a **sprint/night survival loop** (spend Focus on actions,
resolve random incidents with items from your inventory, manage resources
until you hit an ending). VS Code-styled UI (activity bar, explorer, terminal
panel, status bar) is the visual conceit for both phases.

Read `docs/00-start-here.md` first — it's the index and points to the design
doc, architecture doc, content schema, and roadmap in the right order. The
project is currently in **Phase 1** (core loop, local-only, no accounts) —
don't build save/login/meta-progression (Phases 2–4) until roadmap Phase 1,
part three's batches are done (see `docs/08-phase1-polish-and-depth.md`).

## Commands

```bash
npm run dev      # start the dev server (Vite)
npm run build    # type-check (tsc -b) + production build
npm run lint      # oxlint
npm test          # vitest run (single run, not watch mode)
npx vitest run src/store/shop.test.ts   # run a single test file
```

There is no separate typecheck script — `npm run build` is the type-check.
Tests live next to the module they cover (e.g. `shop.ts` / `shop.test.ts`) in
`src/store/`, using `vitest` + `describe`/`it`/`expect`.

## Architecture

**State:** one Zustand store (`src/store/gameStore.ts`) holds the entire
`GameState` (see `src/store/types.ts`) as a plain serializable object —
resources, inventory, companion, flags, RNG state, UI state (active tab, open
file, terminal panel) all live in the same store. There is no
persistence yet (Phase 2); a fresh run starts from `createInitialState()`.

**Game phases** (`GameState.phase`): `intro → scramble_loot →
scramble_companion → sprint → ending`. Sprint and ending phases loop/branch
based on resources and forced-fail conditions (sanity ≤ 0 or runway ≤ 0 ends
the run immediately, checked in both `advanceSprint` and `dismissIncident`).

**RNG is a pure step function, not a closure.** `src/utils/rng.ts`
(`nextRandom(state) -> { value, nextState }`) is mulberry32; the *current*
`rngState` number lives in `GameState` itself so a run's random sequence stays
reproducible/serializable from a seed rather than hidden in closure state.
Any code that consumes randomness must thread `rngState` through explicitly
(see `eventSelector.ts`, `gameStore.ts`'s intern-chaos roll).

**Content is data, not code.** `src/content/*.json` (items, events,
companions, endings, gigs) are typed via `satisfies`/`as` against
`src/content/types.ts` and re-exported as both arrays and `...ById` lookup
maps from `src/content/index.ts`. Adding content (a new item, event, ending)
should almost always mean editing JSON, not touching store logic — see
`docs/04-content-schema.md` for the shape contract. Endings in particular are
fully declarative: `endingEvaluator.ts` has no per-ending branching, it just
checks each `Ending.requirements` block against current resources/flags, most
specific (most requirement keys) first, falling back to
`FALLBACK_ENDING_ID`.

**Balance constants are centralized** in `src/store/sprintEconomy.ts`
(starting resources, Focus per sprint, drift rates, danger-tier thresholds,
companion bonuses, shop economy inputs). These are explicitly called out as
Phase 1 placeholders pending a real balance pass (Phase 5) — don't treat
specific numbers as sacred, but do keep new balance knobs here rather than
inlined in `gameStore.ts` or components.

**Store logic layering** — `gameStore.ts` orchestrates; the actual rules live
in single-purpose pure modules it calls into:
- `eventSelector.ts` — weighted random night-event pick, danger-tier biased,
  gated by `minSprint`/`maxSprint`, avoids repeating the last event.
- `incidentResolver.ts` — resolves an incident given an item choice (or
  `null` for "ignore"); tech-debt raises the fail-effect multiplier.
- `endingEvaluator.ts` — declarative ending selection (see above).
- `shop.ts` — Runway-shop purchase validation/effects.

`advanceSprint()` in `gameStore.ts` is the sprint-end pipeline (drift →
companion neglect check → intern chaos roll → forced-fail check → peaceful
night roll → incident pick) and is shared by the "Focus hit 0" and "dismissed
an incident" paths — read it top-to-bottom when changing end-of-sprint
behavior, order matters (e.g. forced-fail is checked *after* drift is
applied, using the drifted resources).

**Dev-only debug affordances** (`debugGiveAllItems`, `debugForceEvent`,
`debugSetEnding`, `debugSetResource`, `debugToggleHighlight` in
`gameStore.ts`, surfaced via `DevDebugPanel.tsx`) are gated behind
`import.meta.env.DEV` and are a no-op in production builds — keep new debug
actions gated the same way.

## Conventions

- Resource values are always rounded (`clampResource`) — companion passives
  and the tech-debt fail multiplier are fractional, so unrounded state would
  drift into long float tails. `coffee`/`sanity`/`reputation` are clamped to
  `[0, 100]`; `runway`/`techDebt` are floor-only at 0.
- Comments in this codebase are used sparingly and specifically to explain
  *why*, not what (e.g. why a threshold matches a UI tier, why an effect is
  order-dependent). Match that style rather than narrating what the code does.
- If a design/architecture decision in the docs is ambiguous or you hit a
  fork not covered there, flag it and propose a default rather than guessing
  silently (this is an explicit instruction in `docs/00-start-here.md`).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
