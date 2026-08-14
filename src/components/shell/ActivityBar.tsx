import { useGameStore } from "../../store/gameStore";
import type { ActivityTab } from "../../store/types";

interface ActivityBarButton {
  tab: ActivityTab;
  icon: string;
  label: string;
}

const SCRAMBLE_BUTTONS: ActivityBarButton[] = [
  { tab: "explorer", icon: "📁", label: "Explorer" },
  { tab: "source_control", icon: "🌿", label: "Source Control" },
  { tab: "extensions", icon: "🧩", label: "Extensions" },
];

const SPRINT_BUTTONS: ActivityBarButton[] = [
  { tab: "explorer", icon: "📁", label: "Explorer" },
  { tab: "shop", icon: "🛍", label: "Shop" },
];

export function ActivityBar() {
  const phase = useGameStore((s) => s.phase);
  const activityTab = useGameStore((s) => s.activityTab);
  const setActivityTab = useGameStore((s) => s.setActivityTab);

  if (phase !== "scramble_loot" && phase !== "sprint") return null;

  const buttons = phase === "scramble_loot" ? SCRAMBLE_BUTTONS : SPRINT_BUTTONS;

  return (
    <div className="activity-bar">
      {buttons.map((button) => (
        <button
          key={button.tab}
          className={`activity-bar-btn ${activityTab === button.tab ? "active" : ""}`}
          title={button.label}
          onClick={() => setActivityTab(button.tab)}
        >
          {button.icon}
        </button>
      ))}
    </div>
  );
}
