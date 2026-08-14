import { itemsById } from "../../content";
import { findExplorerFile } from "../../content/scrambleContent";
import { useGameStore } from "../../store/gameStore";
import { SCRAMBLE_INVENTORY_CAP } from "../../store/sprintEconomy";

export function FileViewer() {
  const openedFileId = useGameStore((s) => s.openedFileId);
  const grabbedItemIds = useGameStore((s) => s.scramble.grabbedItemIds);
  const timeRemaining = useGameStore((s) => s.scramble.timeRemaining);
  const grabItem = useGameStore((s) => s.grabItem);

  if (!openedFileId) {
    return <p className="narrative-subtitle">Click a file in the Explorer to open it.</p>;
  }

  const file = findExplorerFile(openedFileId);
  if (!file) return null;

  const item = file.itemId ? itemsById[file.itemId] : null;
  const grabbed = file.itemId ? grabbedItemIds.includes(file.itemId) : false;
  const capReached = grabbedItemIds.length >= SCRAMBLE_INVENTORY_CAP;

  return (
    <div className="file-viewer">
      <pre className="file-viewer-content">{file.fileText}</pre>
      {item ? (
        <button
          className="btn btn-primary"
          disabled={grabbed || timeRemaining <= 0 || (!grabbed && capReached)}
          onClick={() => grabItem(item.id)}
        >
          {grabbed ? `✓ ${item.name} grabbed` : `Grab ${item.name}`}
        </button>
      ) : (
        <p className="file-viewer-empty">Nothing useful here.</p>
      )}
    </div>
  );
}
