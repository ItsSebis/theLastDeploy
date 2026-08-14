import { itemsById } from "../../content";
import { useGameStore } from "../../store/gameStore";

export function InventoryTree() {
  const inventory = useGameStore((s) => s.inventory);

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
