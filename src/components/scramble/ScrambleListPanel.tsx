import { itemsById } from "../../content";
import type { ScrambleListEntry } from "../../content/scrambleContent";
import { useGameStore } from "../../store/gameStore";
import { SCRAMBLE_INVENTORY_CAP } from "../../store/sprintEconomy";

interface ScrambleListPanelProps {
  title: string;
  entries: ScrambleListEntry[];
}

export function ScrambleListPanel({ title, entries }: ScrambleListPanelProps) {
  const grabbedItemIds = useGameStore((s) => s.scramble.grabbedItemIds);
  const timeRemaining = useGameStore((s) => s.scramble.timeRemaining);
  const grabItem = useGameStore((s) => s.grabItem);

  const capReached = grabbedItemIds.length >= SCRAMBLE_INVENTORY_CAP;

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">{title}</div>
      {entries.map((entry) => {
        const item = entry.itemId ? itemsById[entry.itemId] : null;
        const grabbed = entry.itemId ? grabbedItemIds.includes(entry.itemId) : false;
        return (
          <div className="scramble-list-entry" key={entry.id}>
            <div className="scramble-list-entry-label">{entry.label}</div>
            <div className="scramble-list-entry-desc">{entry.description}</div>
            {item && (
              <button
                className="btn scramble-list-entry-grab"
                disabled={grabbed || timeRemaining <= 0 || (!grabbed && capReached)}
                onClick={() => grabItem(entry.itemId as string)}
              >
                {grabbed ? "✓ grabbed" : `Grab ${item.name}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
