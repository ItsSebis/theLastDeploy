import { CompanionPanel } from "./CompanionPanel";
import { InventoryTree } from "./InventoryTree";

export function Sidebar() {
  return (
    <div className="sidebar">
      <InventoryTree />
      <CompanionPanel />
    </div>
  );
}
