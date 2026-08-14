# Roadmap / Build Phases

Build in this order. Don't jump ahead to login/meta-progression before the core
loop is proven fun with placeholder content — that's the highest-risk part and
the cheapest to iterate on before backend work locks anything in.

## Phase 0 — Setup
- Scaffold Vite + React + TypeScript project.
- Terminal/CLI-styled base UI shell (or confirm a different visual direction).
- Empty content files following 04-content-schema.md, with 3–5 placeholder
  items/events/companions/endings so the loop is testable end to end.

## Phase 1 — Core loop, local only, no accounts
- Sprint/night day-loop: action selection, resource HUD, Focus spending.
- Night event resolution (weighted random pick, counter-check against inventory).
- At least one full run reachable start to finish, hitting a placeholder ending.
- Phase 1 "scramble" mini-game (timed pick from a loot pool + one companion).
- **Goal: a friend can play a full run and it's fun**, even with joke placeholder
  content. Don't move on until this is true.

## Phase 2 — Local save/resume
- IndexedDB persistence of run state (autosave per sprint + manual save/quit).
- Resume-on-load if a save exists; new-run confirmation if the player wants to
  discard it.
- No accounts yet — this is purely "don't lose my progress if I close the tab."

## Phase 3 — Login + cloud save
- Supabase project setup, GitHub OAuth.
- `runs` / `save_state` tables per 02-architecture-and-stack.md.
- Local→account save migration prompt on first login.
- Cross-device resume.

## Phase 4 — Meta-progression (roguelike layer)
- Commit Karma calculation at run end.
- Unlock tree for items/companions/modifiers/themes (start with ~15–20 unlocks,
  see 03-meta-progression-roguelike.md).
- Endings gallery on the account page.

## Phase 5 — Content pass + polish
- Replace placeholder content with the real inside-joke backlog (06).
- Balance pass on resource numbers and event weights (this will need real
  playtesting — expect to tune numbers after Phase 1 feedback, not guess them
  upfront).
- Shareable post-mortem results card.
- Difficulty modes (Junior/Mid/Senior) if not already threaded through earlier
  phases.

## Suggested "definition of done" per phase
Each phase should end with something playable/demoable, not just code committed.
If a phase can't be demoed, it's not done.
