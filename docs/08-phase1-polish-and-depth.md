# Phase 1, part three — polish and depth

This doc organizes the raw notes in `docs/Sebis Brain.md` into an ordered punch
list. It's the next round of Phase 1 work, the same way
`07-scramble-and-interaction-redesign.md` organized the previous batch (now
implemented — see commits `9d75bfb`..`278fbc1`, `65b58ca`, `e3952cb`).

Standing rule (per `05-roadmap-phases.md`): don't start Phase 2 (local save),
Phase 3 (login), or Phase 6 (tutorial) until this doc's batches are done, or at
minimum through Batch D. A nice working game beats login, saves, or a tutorial.

Items are pulled from Sebi's Brain.md and pruned there as they land, same
convention as before — this doc is the ordered version, Sebi's Brain.md stays
the raw capture surface for new thoughts.

Ordering logic: cheapest/most-foundational first, the biggest net-new system
second-to-last, open-ended content last.

Each batch below has the ask (as originally captured) and an **Implementation
notes** subsection (added after a codebase research pass) with exact current
numbers/files and the concrete approach — enough to start coding without
re-deriving the research each time.

## Batch 0 — Dev debug overlay

New from today's brainstorm. Build **first**, ahead of Batch A — every batch
after this is faster to verify with live state inspection and one-click test
triggers instead of manually playing full runs to reach a given state.

- Dev-only panel, gated behind `import.meta.env.DEV` so it never ships in
  prod builds.
- Shows every live variable and value: Coffee, Sanity, Reputation, Runway,
  Tech Debt, inventory, companion state, current sprint number, current
  danger tier, etc.
- Trigger buttons for useful test actions:
  - "Give all items" (fills inventory, bypasses `SCRAMBLE_INVENTORY_CAP`)
  - "Force next incident" (pick a specific event by id, skip weighted roll)
  - "Highlight correct item on incidents" — a toggle that, while active,
    marks the counter item during an incident
  - Jump straight to a given ending
  - Adjust-any-resource sliders/inputs
- Lives alongside the existing shell (`src/components/shell/`), not gated
  behind any game-state condition — should be visible/collapsible regardless
  of scramble/sprint/incident phase.

### Implementation notes

- New component `src/components/shell/common/DevDebugPanel.tsx`, mounted as
  one more always-present sibling in `AppShell.tsx` (after
  `<DayTransitionOverlay />`). Self-guards with
  `if (!import.meta.env.DEV) return null;` at the top, matching how
  `IncidentOverlay`/`DayTransitionOverlay` already self-guard on their own
  conditions. `position: fixed`, high `z-index` (existing overlays top out at
  300) so it floats above the CSS grid rather than taking a grid area.
- State display: read every `GameState` field via `useGameStore` selectors
  (resources, inventory, companionId, flags, phase, sprintNumber,
  focusRemaining, offerUnlocked, activeIncident, scramble, activityTab);
  danger tier isn't stored directly, compute it live via the already-exported
  `dangerTierFromTechDebt(resources.techDebt)` (`sprintEconomy.ts`).
- New dev-only store actions on `gameStore.ts` (each internally guarded by
  `if (!import.meta.env.DEV) return;`, consistent with the codebase's
  existing action style rather than raw `setState` calls from the component):
  - `debugGiveAllItems()` — sets `inventory` to every id in `itemsById`,
    bypassing `SCRAMBLE_INVENTORY_CAP` (that cap is only enforced inside
    `grabItem`, not globally).
  - `debugForceEvent(eventId: string)` — sets
    `activeIncident: { event: eventsById[eventId], resolution: null }`
    directly, bypassing `pickNightEvent`'s weighted roll.
  - `debugSetEnding(endingId: string)` — `set({ phase: "ending", endingId })`.
  - `debugSetResource(key: ResourceKey, value: number)` — direct resource
    override (no existing per-resource setter; `applyEffects` is
    module-private).
  - `debugToggleHighlight()` — flips a new `debugHighlightCounters: boolean`
    field on `GameState` (new, doesn't exist today).
- "Highlight correct item" reads `debugHighlightCounters` and marks the
  matching row(s) in the inventory list (see Batch A below — the incident
  response picker lives in `InventoryTree`, not the overlay).
- `import.meta.env.DEV` is a new pattern for this codebase (zero existing
  usages) but needs no config changes — `vite/client` types are already in
  `tsconfig.app.json`, and Vite strips `DEV`-gated code appropriately between
  `vite`/`vite build`.

## Batch A — Quick UI/bug fixes

Low effort, no dependencies, immediate feel improvement.

- Next-day transition overlay (`DayTransitionOverlay.tsx`): box is too large,
  needs resizing.
- Left sidebar is too tight for the companion box, or the companion box is
  too wide — resolve the layout conflict (`CompanionPanel.tsx` and its
  sidebar container).
- On incidents, the response picker should move into the existing sidebar
  inventory list rather than a separate item-chip grid on the overlay itself
  — the overlay stays focused on the incident description.

### Implementation notes

- `DayTransitionOverlay.tsx` sizing: `.day-transition-panel` currently has no
  `width`/`max-width` (unlike `.incident-overlay-panel`, which caps at
  `560px`) plus `padding: 14px 28px` and `font-size: 15px` for one short
  line. Fix: add a `max-width` (e.g. `360px`), drop padding to roughly
  `8px 16px`, drop font-size to roughly `13px`.
- Sidebar/companion width: the sidebar column is a fixed `240px`
  (`grid-template-columns: 48px 240px 1fr 32px` in `.app-shell`), and
  `.companion-card` has `margin: 8px 16px` + `padding: 10px` on top of that
  with no width rule — description text just wraps tight. Fix: widen the
  sidebar column modestly (e.g. `240px` → `272px` in `.app-shell`'s
  `grid-template-columns`) and trim `.companion-card`'s margin (e.g.
  `16px` → `12px` horizontal). Check `InventoryTree` and `ContactsList` rows
  still look right at the new width since they share the same `240px`
  column today.
- **Incident response picker (decision made):** the game currently has no
  "wrong item" penalty data — every non-counter item behaves identically to
  clicking Ignore (`incidentResolver.ts`'s `resolveIncident` only checks
  `event.counteredBy.includes(itemId)`), so literally filtering the overlay
  to "impactful items" would just hand the player the answer. Instead:
  rework `IncidentOverlay.tsx` so the emergency overlay itself only shows
  the incident description/name (centered, prominent) plus "Ignore" — remove
  the per-item chip grid from the overlay. The existing sidebar
  `InventoryTree` becomes the response picker while `activeIncident` is set:
  clicking an inventory item calls `respondToIncident(itemId)` directly
  (same store action the overlay chips call today). This keeps the full
  inventory visible at all times (no spoiler — every item shows, whether it
  counters the current incident or not) and matches Sebi's own phrasing —
  "items should be accessible in the inventory." Needs: `InventoryTree.tsx`
  gains an incident-aware click handler
  (`useGameStore((s) => s.activeIncident)` to detect the mode), and
  `IncidentOverlay.tsx` loses its `inventory.map(...)` chip block. Batch 0's
  `debugHighlightCounters` toggle should highlight the matching row(s) in
  `InventoryTree` for consistency with this change.

## Batch B — Scramble balance pass

Tightens a loop (`src/components/scramble/`) that's already fully built.

- Add more decoy code/entries in the scramble explorer that don't map to
  items — currently too easy to tell signal from noise.
- Audit remaining items for placement that makes narrative sense (the
  pattern `git_stash` → Source Control panel, `cd216ed`, already set the
  precedent — extend it to other items still placed arbitrarily).
- Rebalance or remove `SCRAMBLE_INVENTORY_CAP` (currently hardcoded to 4 in
  `src/store/sprintEconomy.ts`) — as event/item count grows, 4 slots will be
  too punishing. Consider scaling the cap with total item count instead of a
  flat number.
- Tune the scramble timer (`SCRAMBLE_DURATION_SECONDS`) so a full clear
  requires speed/efficiency, not idle exploration.

### Implementation notes

- Current numbers: 10 items total, 15 scramble nodes across Explorer (10) /
  Source Control (2) / Extensions (3), 5 decoys total (`itemId: null`) — but
  concentrated in the smaller panels (Explorer is only 2/10 = 20% decoy,
  Source Control 1/2, Extensions 2/3). `SCRAMBLE_INVENTORY_CAP = 4` (40% of
  all items), `SCRAMBLE_DURATION_SECONDS = 45`. All defined in
  `src/content/scrambleContent.ts` (`EXPLORER_TREE`, `SOURCE_CONTROL_ENTRIES`,
  `EXTENSIONS_ENTRIES`) and `src/store/sprintEconomy.ts`.
- Decoys: add roughly 4–6 more `itemId: null` leaf nodes to `EXPLORER_TREE`
  specifically (it's the biggest, most-used panel and currently the
  thinnest on noise) — new files under existing folders (`linuxdoom-1.10/`,
  `legacy/`, `.config/`) or a new folder, each with flavor `fileText` and no
  item.
- Item placement: only `git_stash` (Source Control) and
  `stack_overflow_bookmark` (Extensions) currently have a thematic home; the
  other 8 items sit in generic Explorer files. Good re-homing candidates:
  `tabs_vs_spaces_allegiance` → Extensions (a formatter/linter-war joke fits
  the panel), `the_one_working_unit_test` → Source Control (CI-status-
  flavored entry). Physical-object items (`laptop_charger`, `rubber_duck`,
  `signed_nda`) are fine staying in Explorer as "found near this file"
  flavor — they're desk objects, not code/tools, so Source Control/
  Extensions aren't a natural fit.
- Cap: raise `SCRAMBLE_INVENTORY_CAP` from 4 to 5 — softens the "can't
  survive with 4 items" problem Sebi flagged while keeping the loadout
  choice meaningful; revisit again once Batch F grows the item count
  further.
- Timer: tune `SCRAMBLE_DURATION_SECONDS` down modestly (e.g. toward
  35–40s) only after the decoy additions land, since more nodes to check
  should roughly track the timer budget — treat the exact number as a
  playtesting call, not a hardcoded prescription.

## Batch C — Economy honesty pass

Small, high-value trust fix. Touches the same files as Batch B's item work.

- `GIG_FLAVORS` (`src/content/gigFlavors.ts`) is pure flavor text ("$200,
  due yesterday") completely disconnected from the fixed `take_gig` action
  effects (`runway: 10`) in `src/store/sprintEconomy.ts`. Give each gig its
  own effect data (reward, coffee drain, sanity cost) that the displayed
  flavor text actually reflects, and vary gig difficulty/reward pairs.

### Implementation notes

- Current state: `GIG_FLAVORS` is a flat `string[]`; `GigBoard.tsx` picks a
  random index and displays it, but `performAction("take_gig")` always
  applies the same fixed `SPRINT_ACTIONS` effects (`runway: 10,
  reputation: 5, coffee: -12, sanity: -8`) regardless of which flavor string
  is showing — the "$200 due yesterday" text is disconnected from the
  actual $10-equivalent reward.
- Fix: make gigs data-driven, consistent with the project's "content lives
  in data files" rule (`00-start-here.md`). New `src/content/gigs.json`
  (schema: `id`, `name`/flavor text, `focusCost`,
  `effects: Partial<Record<ResourceKey, number>>`), a `Gig` type in
  `content/types.ts`, `gigs`/`gigsById` exports from `content/index.ts`.
  `GigBoard.tsx` picks a random `Gig` object (not a string index) on
  mount/after accept, displays its own flavor text, and applies *that gig's*
  effects on accept — replacing the static `take_gig` entry in
  `SPRINT_ACTIONS` (or keeping `take_gig` as the action id but routing its
  effects through the selected gig). Vary reward/coffee-drain/sanity-cost
  pairs across gigs (e.g. quick-low-pay vs. slow-high-pay-high-drain) so
  difficulty and payout track each other.

## Batch D — Survival pacing

Core loop feel. Depends on nothing above but benefits from B/C's balance
being settled first.

- Sanity already forces the `goat_farm` ending at `<= 0`
  (`gameStore.ts:59`) — add warning states/soft penalties as sanity
  approaches zero, not just the hard cutoff.
- More randomness in which incidents can fire (danger-tiered selection
  already landed in `65b58ca` — extend/tune further per playtesting).
- Rework the early-exit/buyout ending: should be reachable without an
  unreasonably long run, but stay clearly easier to achieve than the true
  ending — and the true/positive ending should stay hard to reach.

### Implementation notes

- Sanity warning: `checkForcedFail` only fires at `sanity <= 0` (forces
  `goat_farm`), checked in exactly two places (`advanceSprint` and
  `dismissIncident`) — there's no intermediate warning state anywhere in the
  codebase (confirmed via grep, zero matches for "warning"/"critical"). Add
  a `SANITY_WARNING_THRESHOLD` constant (e.g. `25`) in `sprintEconomy.ts`;
  below it (and above 0), apply a soft penalty mirroring the existing
  coffee-zero-reduces-focus pattern (`FOCUS_PER_SPRINT_COFFEE_ZERO`) — e.g.
  reduced focus regen — plus a visual warning, reusing `MoneyMeter`'s
  existing flash-on-decrease pattern for a "sanity low" flash on the status
  bar.
- Reputation exposure: only 5 of 13 events touch Reputation on failure (-5,
  -5, -10, -5, -6), while `take_gig` (+5) and `network` (+6) are risk-free —
  this is the imbalance flagged during a playtesting-question pass earlier
  (once Reputation crosses the 50 buyout threshold it rarely falls back
  under). Cheapest fix: extend more events' `failEffects` in `events.json`
  to include a small reputation hit (pure content-data change, no code) —
  bring reputation-exposure from 5/13 up to roughly 8–9/13, rather than
  nerfing the two positive actions (which are meant to feel good).
- Buyout/ending pacing: `TAKE_OFFER_REPUTATION_THRESHOLD = 50` (starting
  reputation is 20) unlocks the offer — and once unlocked,
  `forever_freelance` requires nothing further, `clean_refactor` (true
  ending) requires `techDebt <= 10`, `reputation >= 70`, `hotfix_script`
  used. Treat the exact threshold as a playtest call: track how many
  sprints it takes on average to hit 50 reputation with a normal action
  mix, and raise `TAKE_OFFER_REPUTATION_THRESHOLD` (e.g. toward 60–65) if
  that comes out too fast, while keeping `clean_refactor`'s bar
  proportionally higher so it stays meaningfully harder than the buyout.

## Batch E — Companion relationship system

Biggest net-new system in this doc — new state shape (contact recency or a
relationship meter) plus a new UI surface. Sequenced after the smaller fixes
so it's built on a settled economy/pacing baseline. No existing
implementation to extend — this is greenfield (confirmed: no "last
contacted" state or messages tab currently exists anywhere in
`src/store/` or `src/components/`).

- Interacting with the companion (or other contacts) should give rewards;
  neglecting them (not checking in) should carry a punishment.
- A messages tab with the companion, and a consequence (companion quits) for
  prolonged neglect.
- Rebalance companion perks: more useful/positive effects from the
  non-senior-dev companion options, since the senior dev currently
  outshines the others.

### Implementation notes

- Scope note: there are actually **two** flavor-only systems here, both
  greenfield for rewards/punishments: the single chosen companion
  (`CompanionPanel.tsx`, `check_in` action, `flags.relationshipLevel` —
  exists but is a flat counter with no decay, gates nothing) *and* the
  `ContactsList` sidebar (`src/content/contacts.ts` — 3 static `Contact`
  entries, name/role/chatText only, every contact funnels into the same
  generic `network` action with no per-contact tracking at all). Sebi's
  note ("companions or other contacts") covers both.
- Neglect tracking: add `lastCheckedInSprint: number` to `GameFlags` (init
  `0`), updated whenever `check_in` runs. In `advanceSprint`, if
  `sprintNumber - flags.lastCheckedInSprint` exceeds a new
  `NEGLECT_THRESHOLD_SPRINTS` constant, apply a punishment (reduce
  `relationshipLevel`, small sanity penalty) — and past a second, longer
  threshold, the companion quits: `companionId: null` (losing their
  passive) plus a log entry.
- Messages tab: `Companion.relationshipEvents: string[]` is already typed
  in `content/types.ts` but empty `[]` for every companion in
  `companions.json` and read nowhere in the code — populate it with a few
  flavor strings keyed to relationship milestones, and add a new
  sidebar/terminal tab to surface them (same pattern as the existing
  `terminalActiveTab: "terminal" | "problems"` toggle).
- Rebalance perks: only `senior_dev` has a real mechanical passive (-10%
  Tech Debt drift, wired into `advanceSprint`); the other 4
  (`pm_circling_back`, `figma_designer`, `the_intern`, `qa_ghost`) are all
  `"Flavor only for now."` with zero effect anywhere. Give each a real
  passive that matches its flavor: PM → small Runway boost per sprint;
  Figma Designer → Reputation boost on `network`; Intern → chaotic (small
  chance of bonus or minor mishap each sprint); QA Ghost → "warns before
  things go wrong" — a natural fit for a companion-gated version of Batch
  0's highlight-counter assist (nice thematic tie-in, worth calling out
  explicitly when this lands).

## Batch F — Content depth & variety

Explicitly open-ended/iterative — Sebi's own notes call this "long term," so
it's last and framed as ongoing work, not a one-shot deliverable.

- Many more night events overall.
- Per-item unique outcomes per event, building on the `successEffects` field
  added in `65b58ca`:
  - one perfect-match item per incident (even difficult incidents can have
    one, sometimes with drawbacks)
  - neutral items that fix the problem sometimes/temporarily, with drawbacks
  - items that don't fix the issue and instead reduce next-sprint Focus or
    Coffee
  - item loss after use (consumable items)
  - worse worst-case outcomes for total mismatches
  - harder punishments for ignoring incidents outright
  - rare incidents that are best ignored — reacting to them is what creates
    the problem, and they resolve themselves if left alone
- Overall difficulty increase once the above content lands.

### Implementation notes

- Technical prerequisite, not just content work: today `Item.counters` /
  `NightEvent.counteredBy` are flat id-list mirrors — a binary
  counters-or-doesn't model. "One perfect match, some neutral items, some
  that make it worse" requires generalizing this into a richer per-event
  outcome map (e.g. `NightEvent.itemOutcomes: Record<itemId, { tier:
  "perfect" | "neutral" | "bad"; effects: Partial<Record<ResourceKey,
  number>> }>`) instead of/alongside the current `counteredBy` list — a
  schema + resolver change in `incidentResolver.ts`, which should land
  before writing the richer content itself.
- Item loss after use requires a new `consumeItem(itemId)` store action
  (items never leave `inventory` today once grabbed).
- Otherwise as already scoped above — genuinely open-ended, content volume
  work, best done iteratively against playtesting rather than planned
  further up front.
