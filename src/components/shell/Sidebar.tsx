import { CompanionPanel } from "./CompanionPanel";
import { InventoryTree } from "./InventoryTree";
import { ExplorerPanel } from "../scramble/ExplorerPanel";
import { useGameStore } from "../../store/gameStore";

export function Sidebar() {
  const phase = useGameStore((s) => s.phase);

  if (phase === "scramble_loot") {
    return <div className="sidebar"><ExplorerPanel /></div>;
  }

  return (
    <div className="sidebar">
      <InventoryTree />
      <CompanionPanel />
    </div>
  );
}
