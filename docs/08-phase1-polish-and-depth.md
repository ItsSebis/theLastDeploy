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
    marks the counter item on the incident overlay
  - Jump straight to a given ending
  - Adjust-any-resource sliders/inputs
- Lives alongside the existing shell (`src/components/shell/`), not gated
  behind any game-state condition — should be visible/collapsible regardless
  of scramble/sprint/incident phase.

## Batch A — Quick UI/bug fixes

Low effort, no dependencies, immediate feel improvement.

- Next-day transition overlay (`DayTransitionOverlay.tsx`): box is too large,
  needs resizing.
- Left sidebar is too tight for the companion box, or the companion box is
  too wide — resolve the layout conflict (`CompanionPanel.tsx` and its
  sidebar container).
- On incidents, only show the items in inventory that will actually have an
  impact on the current incident (positive or negative) — not the full
  unfiltered inventory list on the emergency overlay.

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

## Batch C — Economy honesty pass

Small, high-value trust fix. Touches the same files as Batch B's item work.

- `GIG_FLAVORS` (`src/content/gigFlavors.ts`) is pure flavor text ("$200,
  due yesterday") completely disconnected from the fixed `take_gig` action
  effects (`runway: 10`) in `src/store/sprintEconomy.ts`. Give each gig its
  own effect data (reward, coffee drain, sanity cost) that the displayed
  flavor text actually reflects, and vary gig difficulty/reward pairs.

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
