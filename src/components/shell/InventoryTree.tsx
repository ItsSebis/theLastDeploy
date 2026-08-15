import { itemsById } from "../../content";
import { useGameStore } from "../../store/gameStore";

export function InventoryTree() {
  const inventory = useGameStore((s) => s.inventory);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const respondToIncident = useGameStore((s) => s.respondToIncident);
  const debugHighlightCounters = useGameStore((s) => s.debugHighlightCounters);
  const qaGhost = useGameStore((s) => s.qaGhost);

  const respondable = !!activeIncident && !activeIncident.resolution;
  const showHighlight =
    debugHighlightCounters || qaGhost.hired || (qaGhost.buffActive && qaGhost.buffSprintsRemaining > 0);

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">Assets</div>
      <div className="tree-row folder">📁 my-loadout</div>
      {inventory.length === 0 ? (
        <div className="tree-row-empty">empty</div>
      ) : (
        inventory.map((itemId) => {
          const item = itemsById[itemId];
          if (!item) return null;

          const highlighted =
            respondable &&
            showHighlight &&
            activeIncident!.event.itemOutcomes[itemId]?.tier === "perfect";

          if (respondable) {
            return (
              <div
                className={`tree-row tree-row-clickable tree-row-respondable ${highlighted ? "tree-row-highlight" : ""}`}
                key={itemId}
                title={item.description}
                onClick={() => respondToIncident(itemId)}
              >
                📄 {item.name}
              </div>
            );
          }

          return (
            <div className="tree-row" key={itemId} title={item.description}>
              📄 {item.name}
            </div>
          );
        })
      )}
    </div>
  );
}
