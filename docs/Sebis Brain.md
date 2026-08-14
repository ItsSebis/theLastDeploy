## Design
> The overall design ofcourse stays VS Code based, but when the game seems tireding there needs to be some creative enchancing effect
- Next day overlay design bug: box is too large
- sidebar on the left is too tight for the companion box, or companion box is too wide
- on events just show the incident in the middle, the items should be accessible in the inventory, but only those which will have an impact, some positive, some negative

## Scramble
- Much more code, which doesn't have items to confuse the player
- Put Items where they make sense, like the git stash item in the versioning
- Remove the limit of 4 items, in the future with many more events it will be way more difficult to survive with even 4 items
- Balance the time so you cant collect everything, or only if you are very fast

## Tasks
- many different gig descriptions and corresponding coffee drain and price, which should really reflect in money. (currently says $200, but only gives 10. ofc keep it balanced, but that does not match up)
- Interaction with companions or other contacts should give rewards, as well as punishments if you dont stay in touch. e.g. messages tab with them and quitting companion if you dont talk to them. 
    - more positive effects from the other companion options and more useful from the senior dev
- end if sanity falls low, punishments before that
- randomness in the problems
- not that early exit, buyout only after establishing a nice work, but easier to achive than the true_ending
    - you can also make it harder to achieve that, but ending the game with a positive outcome has to be difficult

## Long term
- way more events
- on each event unique outcomes with each item
    - one perfect match, on very difficult incidents even with drawbacks
    - some neutral items, which fix the problem sometimes or only temporarily, but with drawbacks
    - some that dont fix the issue and start the day with less focus or coffee
    - loss of items after use
    - worst outcomes
    - hard punishments for ignoring incidents
    - rarely incidents you have to ignore and they fix themselfes somehow, you just create an issue when reacting
- way harder gameplay

## Dev tooling
- dev-mode debug box showing every current variable/value (resources, inventory, companion state, sprint/danger tier, etc.)
- useful trigger buttons in that box to test functions, e.g. "give all items", or "highlight correct item on incidents" (toggle that marks the counter item during an incident)
