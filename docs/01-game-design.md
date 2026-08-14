# Game Design — "The Last Deploy" (working title)

A browser text-adventure inspired by "Don't Sleep with the Fishes": a frantic
scavenge intro, then a day/night survival loop where every action is a trade-off,
seeded with random incidents that only certain items/skills counter, building
toward one of many endings. Reskinned around software agency life, for internal
inside jokes + portfolio/recruiting value.

Title alternatives: **git blame** · **Deploy or Die** · **Undefined Behavior**
· **The Sprint That Never Ends** · **Post-Mortem**

## Premise

It's the client's last day. Funding fell through, the contract got cancelled, or
the server lease expires at midnight — the project is going down. You get one
timed pass to grab what matters from the dying repo, pick ONE teammate to bring,
then survive as a freelancer until you land somewhere good, burn out, or reach a
secret ending.

## Core Loop

| Reference game | The Last Deploy |
|---|---|
| Scramble the sinking ship for loot | Scramble the dying repo for assets |
| Pick one crew member to save | Pick one coworker to bring |
| Lifeboat survival, day/night cycle | Freelance survival, sprint/night cycle |
| Energy points per day | Focus points per sprint |
| Food/hunger | Coffee |
| Boat repair / health | Reputation / Sanity |
| Night events countered by specific items | Incidents countered by specific tools/skills |
| 12+ endings | 12+ career endings |

**Phase 1 — The Scramble (timed, ~2 min):** grab a limited inventory of assets
before access is revoked. Loadout shapes which incidents you can survive later.

**Phase 2 — The Grind (day/night loop):** each sprint gives Focus Points to spend
on actions — take a gig (income), refactor (reduces Tech Debt), network (unlocks
opportunities), rest (restores Coffee), check in with your companion (Sanity +
relationship). End sprint → a night event fires.

**Night events** are the comedy/horror engine: incidents that need a specific
item/skill to counter cleanly, or you take Reputation/Sanity damage.

## Resources

- **Coffee** — energy refill. Zero → Focus regen tanks.
- **Sanity ("Vibes")** — health. Zero → forced burnout ending.
- **Reputation** — needed to unlock good-ending gigs.
- **Runway** — days of savings left. Zero → forced pivot.
- **Tech Debt** — rises if ignored, makes incidents worse/more frequent; refactoring
  costs Focus now for safety later.

## Content Pillars (see 06 for the full backlog)

- **Night events:** Friday 5PM Deploy Curse, Merge Conflict Kraken, "can you just
  make it pop?", legacy jQuery reawakens, off-by-one error, CVE alert, AWS bill
  spike, intern pushes to `main`, 2FA lockout, Scope Creep Gremlin, "just circling
  back," Standup That Would Not End.
- **Items:** Rubber Duck, "It Works On My Machine" badge, Stack Overflow bookmark,
  Hotfix script, charger, signed NDA, Tabs-vs-Spaces allegiance.
- **Companions:** the Senior Dev (speaks only in code comments), the PM ("circling
  back"), the Figma-obsessed Designer, the Intern (chaotic swings), the QA Ghost
  (early incident warnings).

## Endings (aim for 10–14)

Acquired by BigCorp · Unicorn IPO (rare) · Open-Sourced and Abandoned · Goat Farm
(burnout) · The Clean Refactor (true/hard ending) · Acquihired by a Competitor ·
Forever Freelance (neutral loop) · Friday 5PM Deploy (bad ending) · Back to
Corporate (safe) · The Codebase Achieves Sentience (joke ending) · 100% Test
Coverage Zen (secret/completionist).

## Easy to Learn, Hard to Master

- **Entry:** 3–4 actions per sprint, clear HUD icons, a first run finishes in
  ~20 minutes.
- **Depth:** hidden item combos neutralize specific incidents, stat thresholds
  silently gate rare endings, Tech Debt punishes greedy runs.
- **Difficulty modes:** Junior (forgiving, passive regen) · Mid-Level (standard) ·
  Senior (no passive regen, real pressure events).

## Marketing/Recruiting Angle

End-of-run "post-mortem" share card (Wordle-style results grid) — shareable,
on-brand, doubles as low-effort marketing for the agency.
