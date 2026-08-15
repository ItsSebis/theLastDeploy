# Content Schema

All game content (events, items, companions, endings) should live in data files,
not hardcoded in components, so non-engineers on the team can add inside jokes
without touching game logic. Suggested shapes below — adjust field names to taste
during implementation, but keep the separation of content from code.

## Item

```json
{
  "id": "rubber_duck",
  "name": "Rubber Duck",
  "description": "Stares at your code. Says nothing. Somehow helps.",
  "counters": ["off_by_one_error", "merge_conflict_kraken"],
  "unlockedBy": "default",
  "flavorOnUse": "You explain the bug out loud. You immediately see the bug."
}
```

## Night Event (Incident)

```json
{
  "id": "friday_deploy_curse",
  "name": "The Friday 5PM Deploy Curse",
  "description": "Someone deployed on a Friday. At 5:03 PM. On purpose.",
  "counteredBy": ["hotfix_script"],
  "onCounteredText": "You roll it back before anyone notices. Mostly.",
  "onFailText": "You spend the weekend un-breaking production.",
  "failEffects": { "sanity": -15, "reputation": -5 },
  "successEffects": { "reputation": 5 },
  "danger": "high",
  "weight": 3,
  "minSprint": 2
}
```

- `successEffects` (optional) works like `failEffects` but applies on a
  successful counter instead of a fail/ignore. Most events omit it (a
  successful counter has no bonus, per the game design). Present only on
  "rare" items' events (see 07-scramble-and-interaction-redesign.md).
- `danger` (optional) tags an event `"low" | "medium" | "high"`; it
  soft-biases weighted selection toward the run's current danger tier
  (derived from Tech Debt) via a multiplier table, not a hard filter — see
  `dangerTierFromTechDebt`/`DANGER_WEIGHT_MULTIPLIER` in
  `src/store/sprintEconomy.ts`. Absent on content that predates it.

## Companion

```json
{
  "id": "senior_dev",
  "name": "The Senior Dev",
  "description": "Communicates exclusively through code comments.",
  "passive": "Reduces Tech Debt gain by 10% while in your party.",
  "relationshipEvents": [
    "// noted.",
    "// this is fine, probably."
  ],
  "unlockedBy": "default",
  "dailyCost": 5,
  "quitConditions": [
    { "id": "tech_debt_high", "resource": "techDebt", "min": 60, "relationshipMax": 1 }
  ],
  "quitFlavorText": "The Senior Dev pushes one last commit and goes quiet for good.",
  "support": {
    "id": "senior_dev_clear_debt",
    "name": "Emergency Cleanup",
    "description": "Clears Tech Debt back to zero.",
    "relationshipMin": 2,
    "offerChance": 0.2
  }
}
```

- `relationshipEvents` is a flat list of flavor **strings** (not event-id
  references) unlocked in order as `relationshipLevel` rises, read by
  `MessagesPanel.tsx` via `relationshipEvents.slice(0, relationshipLevel)`.
- `dailyCost` is deducted from Runway each sprint while the companion is in
  the party (see `advanceSprint` in `gameStore.ts`).
- `quitConditions` is an array of declarative conditions, each evaluated as
  an AND of its present fields (`resource`+`min`/`max`, `relationshipMin`/
  `relationshipMax`, `sprintsInPartyMin`); the companion quits when **any**
  condition in the array fires (OR across conditions) — see
  `companionQuit.ts`'s `evaluateCompanionQuit`. An empty array means the
  companion never quits via this system (e.g. `qa_ghost`).
- `support` describes a Focus-costing, relationship-gated activatable
  ability: `relationshipMin` gates whether it can ever be offered,
  `offerChance` is a per-sprint roll (once gated) for whether it's actually
  offered that sprint, mirroring `PEACEFUL_NIGHT_CHANCE`'s shape. The
  concrete effect of triggering it is still companion-id-specific code (see
  `companionSupport.ts`), consistent with how passives are applied.

## Ending

```json
{
  "id": "clean_refactor",
  "name": "The Clean Refactor",
  "tier": "true_ending",
  "requirements": {
    "techDebt": { "max": 10 },
    "reputation": { "min": 70 },
    "requiredItemsUsed": ["hotfix_script"]
  },
  "text": "You shipped it. It's clean. Nobody believes you."
}
```

## Run State (what gets saved)

```json
{
  "runId": "uuid",
  "sprintNumber": 4,
  "difficulty": "mid",
  "resources": { "coffee": 60, "sanity": 45, "reputation": 30, "runway": 12, "techDebt": 25 },
  "inventory": ["rubber_duck", "hotfix_script"],
  "companionId": "senior_dev",
  "flags": { "seenEvents": ["friday_deploy_curse"], "relationshipLevel": 2 },
  "seed": 918273
}
```

## Notes for implementation

- Use a `weight` field on events for weighted-random selection, plus a
  `minSprint`/`maxSprint` gate so late-game events don't fire on sprint 1.
- Keep `requirements` on endings declarative (min/max ranges, required flags/items)
  so an ending-checker function can evaluate them generically instead of needing
  bespoke logic per ending.
- A `seed` on run state makes runs reproducible for debugging and for the
  shareable post-mortem card (same seed = comparable runs, like Wordle's daily
  puzzle number).
