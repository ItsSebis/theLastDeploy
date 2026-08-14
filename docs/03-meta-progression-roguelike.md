# Meta-Progression (Roguelike Layer)

This is the cross-run system that gives repeat players a reason to keep coming
back after their first ending. Build this **last** — it depends on the core loop,
content bank, and (for the account-synced version) login/save being done. A
local-only version of this can ship before accounts exist; see 05-roadmap-phases.

## Meta currency: "Commit Karma"

Earned at the end of every run, scaled by how far you got and what you achieved
(reached a new ending for the first time, survived to a high sprint count, cleared
a harder difficulty, used an item combo cleanly, etc.). Spent between runs to
unlock the pool of things that can appear in future runs — it does not affect the
current run in progress.

## What Commit Karma unlocks

- **Starting items** — new options in the Phase 1 scramble pool (e.g. unlock the
  "Signed NDA" item after your first client-dispute incident).
- **Companions** — new coworkers become recruitable in the Phase 1 pick (e.g. the
  QA Ghost only unlocks after you've experienced 3 incidents they would've warned
  you about).
- **Run modifiers ("Sprint Modifiers")** — Slay-the-Spire-style optional
  ascension-type modifiers you can toggle on for a harder/weirder run in exchange
  for bonus Commit Karma (e.g. "Client is always available" = more frequent scope
  creep events but more income; "Remote-only" = no office-based incidents but
  Sanity drains faster).
- **Cosmetic terminal themes** — pure flavor, cheap to build, good completionist
  bait (e.g. a "dark mode," a "VS Code theme," a "vim mode" that's secretly harder
  to navigate as a joke).
- **Difficulty tiers** — Senior mode locked until you've cleared Mid-Level once.

## Persistent player record

- **Endings gallery** — a checklist/grid of every ending achieved, visible on the
  account page. This is the primary "collect them all" hook and also feeds the
  shareable post-mortem card mentioned in 01.
- **Best runs** — longest survived, highest Reputation, lowest Tech Debt at
  finish, etc. Purely cosmetic bragging stats, no gameplay effect.

## Design constraints (keep this from becoming a second game)

- Meta-progression should widen *options*, not raise a power curve. A player who
  unlocks everything should have more interesting choices, not simply be
  stronger than a first-time player — this keeps "easy to learn, hard to master"
  intact rather than turning into "grind to become viable."
- No run should require a meta-unlock to reach a specific ending. Every ending
  must be reachable on a completely fresh account; unlocks add alternate paths,
  not gates.
- Keep the unlock tree small at launch (aim for ~15–20 unlockables total). It's
  much easier to add more later than to prune a bloated tree.

## Open question to settle before building this layer

Does Commit Karma and the endings gallery sync live during a run, or only commit
at run-end? Recommend **run-end only** — simpler to build, avoids partial-state
sync bugs, and there's no gameplay reason a mid-run save needs meta-progression
visibility.
