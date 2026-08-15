import { CompanionPanel } from "./CompanionPanel";
import { QaGhostPanel } from "./QaGhostPanel";
import { InventoryTree } from "./InventoryTree";
import { ExplorerPanel } from "../scramble/ExplorerPanel";
import { SourceControlPanel } from "../scramble/SourceControlPanel";
import { ExtensionsPanel } from "../scramble/ExtensionsPanel";
import { ContactsList } from "../sprint/ContactsList";
import { ShopPanel } from "../shop/ShopPanel";
import { useGameStore } from "../../store/gameStore";

export function Sidebar() {
  const phase = useGameStore((s) => s.phase);
  const activityTab = useGameStore((s) => s.activityTab);

  if (phase === "scramble_loot") {
    if (activityTab === "source_control") return <div className="sidebar"><SourceControlPanel /></div>;
    if (activityTab === "extensions") return <div className="sidebar"><ExtensionsPanel /></div>;
    return <div className="sidebar"><ExplorerPanel /></div>;
  }

  if (phase === "sprint" && activityTab === "shop") {
    return <div className="sidebar"><ShopPanel /></div>;
  }

  return (
    <div className="sidebar">
      <InventoryTree />
      <CompanionPanel />
      {phase === "sprint" && <QaGhostPanel />}
      {phase === "sprint" && <ContactsList />}
    </div>
  );
}
