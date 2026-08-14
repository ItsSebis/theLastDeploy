import { useGameStore } from "../../store/gameStore";
import { ProblemsBadge } from "./common/ProblemsBadge";
import { ResourceMeter } from "./common/ResourceMeter";

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
      <ResourceMeter icon="☕" label="Coffee" value={resources.coffee} />
      <ResourceMeter icon="🧠" label="Sanity" value={resources.sanity} />
      <ResourceMeter icon="⭐" label="Reputation" value={resources.reputation} />
      <ResourceMeter icon="💰" label="Runway" value={resources.runway} />
      <ProblemsBadge techDebt={resources.techDebt} />
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
