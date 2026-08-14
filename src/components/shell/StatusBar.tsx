import { useGameStore } from "../../store/gameStore";
import { MoneyMeter } from "./common/MoneyMeter";
import { ProblemsBadge } from "./common/ProblemsBadge";
import { TieredIconMeter } from "./common/TieredIconMeter";

const SANITY_TIERS = [
  { min: 80, icon: "🧠" },
  { min: 60, icon: "😐" },
  { min: 40, icon: "😵‍💫" },
  { min: 20, icon: "😫" },
  { min: 0, icon: "💀" },
];

const REPUTATION_TIERS = [
  { min: 80, icon: "🌟" },
  { min: 60, icon: "⭐" },
  { min: 40, icon: "✨" },
  { min: 20, icon: "💫" },
  { min: 0, icon: "🌑" },
];

export function StatusBar() {
  const resources = useGameStore((s) => s.resources);
  const phase = useGameStore((s) => s.phase);
  const sprintNumber = useGameStore((s) => s.sprintNumber);
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const performAction = useGameStore((s) => s.performAction);

  const canRest = phase === "sprint" && focusRemaining >= 1 && !activeIncident;

  return (
    <div className="status-bar">
      <TieredIconMeter label="Sanity" value={resources.sanity} tiers={SANITY_TIERS} />
      <TieredIconMeter label="Reputation" value={resources.reputation} tiers={REPUTATION_TIERS} />
      <MoneyMeter value={resources.runway} />
      {phase === "sprint" && <ProblemsBadge techDebt={resources.techDebt} />}
      {phase === "sprint" && (
        <button
          className="status-bar-rest"
          disabled={!canRest}
          onClick={() => performAction("rest")}
          title="Rest"
        >
          🛋 Away
        </button>
      )}
      <span className="status-bar-spacer" />
      {phase === "sprint" && <span className="status-bar-sprint">Sprint {sprintNumber}</span>}
    </div>
  );
}
