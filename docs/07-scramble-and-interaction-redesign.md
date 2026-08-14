# Scramble & Interaction Redesign

Design for reworking two things that shipped flat in the Phase 0/1 build:
the scramble phase (currently a static 3×3 button grid) and the sprint action
menu (currently five generic buttons). Both should feel like *inhabiting* the
IDE rather than filling out a form. This doc also introduces a new economic
sink (the Runway shop) and settles how "a legendary crowded codebase" gets
represented without bundling real source into the app.

This is a refinement of Phase 1 (see 05-roadmap-phases.md) — it doesn't pull
in Phase 2+ work, but it does expand Phase 1's scope beyond what already
shipped, so treat it as "Phase 1, part two" rather than a new phase.

## 1. Scramble redesign: explore, don't just click

**New Activity Bar** — the icon strip on the far-left edge, real VS Code
style. During the scramble it shows three tabs:

- **📁 Explorer** — a nested folder tree (the "dying project's" source, see
  §4 for content sourcing). Clicking a folder expands/collapses it as today.
  Clicking a **file** no longer grabs anything directly — it *opens* the file
  in the editor pane. Once open, one of three things is true:
  - The file contains a **useful item** (counters a specific incident) — a
    "Grab" button appears under the flavor content.
  - The file contains a **flavor-only item** (matches today's decoy items —
    occupies an inventory slot, counters nothing) — also has a "Grab" button,
    tempting you to waste a slot.
  - The file is a **true dead end** — flavor text only, nothing to grab. You
    spent the click and the reading time for nothing.
  This three-way split (useful / tempting decoy / pure dead end) is what
  makes searching genuinely risky, not just a matter of clicking fast.

- **🌿 Source Control** — a fake git "Changes" list. Single-click to reveal an
  entry's content (no open-file step — shallower interaction than Explorer,
  for variety). This is where the one rare item lives (see §2).

- **🧩 Extensions** — a fake installed-extensions list, mostly decoys, single
  click to reveal/grab, same shallow interaction as Source Control. Houses
  one more useful item alongside 2-3 decoy extension entries.

Exact file/folder layout and item placement is an implementation-time detail
(§4 gives a starter set), but the target ratio: most of the 5 existing useful
items + all 4 existing decoy items live in Explorer across ~8-10 openable
files (some true dead ends added on top); one useful item moves to
Extensions; the new rare item is the sole highlight in Source Control.

Companion pick stays as its own untimed step after the scramble ends, unchanged.

Source Control and Extensions are exploration-only surfaces — once the
scramble ends, the Activity Bar drops to just Explorer (now showing the
inventory tree, as it does today) and the new Shop tab (§5) for the rest of
the run.

## 2. Item tiers — strong items are specific, not universal

No joker/wildcard items. Every item still counters exactly one incident.
"Rare" items differ by having a **bonus effect on success**, not by having a
broader counter list.

**New incident: `force_pushed_to_main`**
- Description: someone force-pushed to `main`; the last few days of commits
  are missing, maybe.
- `counteredBy: ["git_stash"]`
- On success: normal counter text, *plus* a small bonus effect (+5
  Reputation) — this is the mechanical difference between "rare" and
  "common" items. Requires extending `NightEvent` with an optional
  `successEffects` field (mirrors `failEffects`, applied on success instead
  of on fail/ignore; absent on all existing events, present only here).
  Update `04-content-schema.md`'s Night Event shape to document this field.
- On fail: harsher than the existing five (this is presented as a scarier
  incident, matching why its counter is worth digging for) — proposed
  `sanity: -20, techDebt: 20, reputation: -10`.
- `weight`/`minSprint`: low weight (rare to encounter), `minSprint: 2`.

**New item: `git_stash`** ("A Stash You Forgot About") — `counters:
["force_pushed_to_main"]`, found only in Source Control.

No other item gets a bonus effect for now; this establishes the pattern
(`successEffects` on the event) for adding more rare items later without
new mechanics.

## 3. Sprint action interactions (all bespoke)

- **Check In with Companion** → click the companion card in the sidebar
  directly. Removed from the action-menu list entirely.
- **Refactor** → click the **🐛 Problems badge** in the status bar. This
  switches the bottom panel from Terminal to a **Problems** tab (same panel,
  tab-switched — mirrors how real VS Code groups Terminal/Problems/Output).
  Lists flavor-text "problems" scaled to current Tech Debt (e.g. "Unused
  variable in `invoice.ts`"). Clicking one triggers the same effect as
  today's Refactor action (-15 Tech Debt, 1 Focus) — the player is choosing
  *which* problem to fix, not a different number.
- **Take a Gig** → an incoming **job-request toast**, same visual family as
  incident toasts but framed as opportunity. Flavor text randomizes per
  offer (e.g. "Fix a WordPress plugin — $200"); Accept triggers the existing
  effect.
- **Network** → a small **contacts/DM list** in the sidebar; click a contact
  to network with them. Flavor varies by contact, effect is the existing one.
- **Rest** → a **coffee mug / "set status to Away"** toggle in the status
  bar.

All four keep their existing Focus cost and resource effects — only the
trigger UI changes. No new balance numbers here.

## 4. Content sourcing: flavor names only, nothing downloaded

The "dying project" should feel like a real, dense, legendary codebase
without adding any network request or bundle weight. Approach: hand-author a
small set of realistic file/folder names evoking a well-known open-source
project's structure (classic DOOM's source layout is the reference — files
like `p_enemy.c`, `r_bsp.c`, `w_wad.c`, `z_zone.c`, a `linuxdoom-1.10/`
folder) as plain strings in our own content file. This is pure flavor
dressing, not real source: no fetch, no bundled repo, no licensing concern
(file names aren't creative content), no risk of the timed scramble stalling
on a slow network call.

Starter set (expand freely at implementation time, this just proves the
shape):

```
legendary-repo/
  linuxdoom-1.10/
    p_enemy.c       -- useful item
    r_bsp.c         -- dead end
    w_wad.c         -- useful item
    m_menu.c        -- dead end
    z_zone.c        -- flavor-only item
  legacy/
    jquery.min.js   -- useful item (ties into existing "Legacy jQuery Reawakens" event)
    ie6-hacks.css   -- dead end
  .config/
    .env.backup     -- useful item
    deploy.yml      -- flavor-only item
```

## 5. Runway shop

New **🛍 Shop** tab on the Activity Bar, visible only during the sprint
phase (alongside the existing inventory/Explorer view). Not Focus-gated —
purchases are a free side-decision available anytime between actions, only
constrained by Runway.

Entries:
- **Better Coffee** — one-time purchase, costs Runway (proposed 20). Effect:
  permanent `focusBonus += 1`, added into the Focus-per-sprint calculation
  from then on. Can't be bought twice.
- **Coffee Refill** — repeatable, costs Runway (proposed 10). Effect: Coffee
  set to 100 immediately. The escape valve for the coffee-zero Focus penalty.
- **Junk items** — several decoy purchases (agency-office joke items: a
  standing desk converter, a motivational cat poster, a kombucha
  subscription, an ergonomic wrist rest nobody uses), each costing a small
  amount of Runway, doing nothing mechanically. Same discovery philosophy as
  the rest of the game: nothing is labeled "useless," the player learns
  which purchases matter by spending on them.

Requires a new store action (`purchaseShopItem(id)`) and a `focusBonus`
field on `GameState`, folded into the existing Focus-per-sprint logic
(`FOCUS_PER_SPRINT + focusBonus`, still dropping to the coffee-zero penalty
value when Coffee is 0).

## 6. Status bar verbosity

Each resource meter shows its name, not just icon + number (e.g. "☕ Coffee
70" instead of "☕ 70"). Tooltip-only labelling is removed in favor of
always-visible text. No change to which resources are shown or their values.

## Open items for implementation time (not blocking this spec)

- Exact final file/folder tree and item placement in Explorer (§4 gives the
  shape, not the full list).
- Exact junk-item roster and prices for the shop.
- Whether "Better Coffee" needs a visual indicator once purchased (e.g. a
  small badge) so the player remembers they already bought it.
