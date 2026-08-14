import { items } from "../../content";
import { useGameStore } from "../../store/gameStore";
import { SCRAMBLE_INVENTORY_CAP } from "../../store/sprintEconomy";

export function LootGrid() {
  const timeRemaining = useGameStore((s) => s.scramble.timeRemaining);
  const grabbedItemIds = useGameStore((s) => s.scramble.grabbedItemIds);
  const grabItem = useGameStore((s) => s.grabItem);
  const stopScramble = useGameStore((s) => s.stopScramble);

  const timeUp = timeRemaining <= 0;
  const capReached = grabbedItemIds.length >= SCRAMBLE_INVENTORY_CAP;

  return (
    <>
      <div className="scramble-header">
        <span>
          Grabbed {grabbedItemIds.length} / {SCRAMBLE_INVENTORY_CAP}
        </span>
        <span className={`scramble-timer ${timeRemaining <= 10 ? "low" : ""}`}>
          {timeRemaining}s
        </span>
      </div>

      <div className="loot-grid">
        {items.map((item) => {
          const grabbed = grabbedItemIds.includes(item.id);
          return (
            <button
              key={item.id}
              className={`loot-card ${grabbed ? "grabbed" : ""}`}
              disabled={timeUp || grabbed || (capReached && !grabbed)}
              onClick={() => grabItem(item.id)}
            >
              <div className="loot-card-name">{grabbed ? "✓ " : ""}{item.name}</div>
              <div className="loot-card-desc">{item.description}</div>
            </button>
          );
        })}
      </div>

      <button className="btn btn-primary" onClick={stopScramble} disabled={timeUp}>
        {grabbedItemIds.length === 0 ? "Leave empty-handed" : "I'm done grabbing"}
      </button>
    </>
  );
}
