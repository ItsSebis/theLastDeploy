# Architecture & Stack

## Guiding principle

Login and cloud save are **additive**, not load-bearing. The game must be fully
playable, saveable, and resumable with zero account — local-first. An account
unlocks cross-device sync and the roguelike meta-progression layer (see 03).
This keeps Phase 1 development simple and lets us defer backend/auth work until
the core loop is proven fun (see 05-roadmap-phases.md).

## Proposed stack (defaults — revisit if the team has existing preferences)

- **Frontend:** Vite + React + TypeScript. Terminal/CLI-styled UI (fits both
  "text adventure" and dev-culture theming, cheap to build).
- **State management:** a single game-state reducer/store (Zustand or plain
  Context+useReducer is enough — this is not a large app). Game state is a plain
  serializable object so it can be dropped straight into local storage or a DB row.
- **Local persistence (Phase 1–2):** IndexedDB (via a thin wrapper like `idb`) for
  run-in-progress saves; localStorage is fine for small meta flags but avoid it for
  full run state (5MB ceiling, synchronous).
- **Backend/auth (Phase 3+):** Supabase (Postgres + Auth + row-level security).
  Reasoning: fastest path to real auth + a real database without hand-rolling a
  server, generous free tier, and Claude Code can scaffold it quickly. If the
  agency already runs its own backend infra, swap this for that instead — the
  data model below doesn't change.
- **Auth method:** GitHub OAuth as the primary (and maybe only) login option.
  On-brand, zero password management, one click for the target audience. Email
  magic-link as a fallback if non-technical playtesters need in.
- **Hosting:** Vercel (assumed, not confirmed — flag if the agency has a
  preferred host).

## Data model (conceptual — refine in Supabase/Prisma schema during Phase 3)

**users**
- id, github_id, display_name, avatar_url, created_at

**runs** (one row per completed or in-progress run)
- id, user_id (nullable for anonymous/local play), started_at, ended_at,
  ending_id (nullable until finished), seed, final_stats (json), loadout (json)

**meta_progress** (one row per user — the roguelike layer, see 03)
- user_id, commit_karma (int), unlocked_companions (json array),
  unlocked_items (json array), unlocked_modifiers (json array),
  endings_achieved (json array), highest_difficulty_cleared

**save_state** (current in-progress run, upsert on autosave)
- user_id (nullable), run_id, sprint_number, resources (json), inventory (json),
  companion_id, flags (json), updated_at

For anonymous/local play, `runs` and `save_state` live in IndexedDB with the same
shape, keyed by a local device ID instead of `user_id`. When a user logs in for
the first time, offer to import their local save into their account (one-time
migration prompt) rather than silently overwriting or discarding it.

## Save behavior

- **Autosave** at the end of every sprint (both local and, if logged in, synced
  to `save_state`).
- **Manual "quit and save"** always available mid-sprint.
- Only one active run per user/device at a time for MVP — no save slots yet.
  Multiple slots is a reasonable post-MVP addition once the core loop is stable.

## Non-goals for MVP

- No real-time multiplayer or leaderboards (a static "endings achieved" share
  card covers the social hook without needing live infra).
- No mobile app — browser only, responsive layout is enough.
- No server-authoritative anti-cheat. This is a single-player narrative game;
  a determined player editing their local save isn't a threat worth engineering
  around.
