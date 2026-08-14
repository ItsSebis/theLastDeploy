import { useState } from "react";
import type { ExplorerNode } from "../../content/scrambleContent";
import { EXPLORER_TREE } from "../../content/scrambleContent";
import { useGameStore } from "../../store/gameStore";

function ExplorerNodeRow({ node, depth }: { node: ExplorerNode; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const openedFileId = useGameStore((s) => s.openedFileId);
  const grabbedItemIds = useGameStore((s) => s.scramble.grabbedItemIds);
  const openExplorerFile = useGameStore((s) => s.openExplorerFile);

  const indent = { paddingLeft: 16 + depth * 14 };

  if (node.type === "folder") {
    return (
      <div>
        <div
          className="tree-row tree-row-clickable folder"
          style={indent}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "📂" : "📁"} {node.name}
        </div>
        {expanded && node.children.map((child) => (
          <ExplorerNodeRow key={"id" in child ? child.id : child.name} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  const grabbed = node.itemId ? grabbedItemIds.includes(node.itemId) : false;

  return (
    <div
      className={`tree-row tree-row-clickable ${openedFileId === node.id ? "active" : ""}`}
      style={indent}
      onClick={() => openExplorerFile(node.id)}
    >
      {grabbed ? "✓" : "📄"} {node.name}
    </div>
  );
}

export function ExplorerPanel() {
  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">Explorer</div>
      <ExplorerNodeRow node={EXPLORER_TREE} depth={0} />
    </div>
  );
}
