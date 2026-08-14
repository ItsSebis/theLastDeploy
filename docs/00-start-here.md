# Docs Index — "The Last Deploy"

This folder is the design + technical brief for the game. Read in this order:

1. **01-game-design.md** — premise, core loop, content pillars, endings. The "why."
2. **02-architecture-and-stack.md** — proposed tech stack, login/save approach, data model.
3. **03-meta-progression-roguelike.md** — the cross-run unlock/progression layer.
4. **04-content-schema.md** — JSON shapes for events, items, companions, endings, saves.
5. **05-roadmap-phases.md** — build order. Start here when picking up work; don't
   build login or meta-progression before the core loop is fun on its own.
6. **06-content-bank-inside-jokes.md** — raw backlog of jokes/events/items to expand
   into real content. Editable by non-engineers on the team.

## Decisions already made
- Core loop = scramble phase + sprint/night day-loop, modeled on "Don't Sleep with
  the Fishes" (see 01).
- Local-first save for solo play; accounts are additive, not required to play.
- GitHub OAuth as the login method (on-brand, low friction, no password management).
- Content (events/items/endings) lives in data files, not hardcoded in components.

## Decisions still open (flagged inline where relevant)
- Final hosting target (Vercel assumed, not confirmed).
- Whether meta-progression syncs in real time or only saves at run-end.
- Exact visual theme (terminal/CLI assumed, not confirmed).

If something in these docs is ambiguous or you (Claude Code) hit a fork in the
road not covered here, stop and ask rather than guessing silently — flag it in
your response and propose the default you'd pick.
