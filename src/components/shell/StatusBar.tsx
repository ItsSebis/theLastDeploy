import { useGameStore } from "../../store/gameStore";
import { ProblemsBadge } from "./common/ProblemsBadge";
import { ResourceMeter } from "./common/ResourceMeter";

export function StatusBar() {
  const resources = useGameStore((s) => s.resources);
  const phase = useGameStore((s) => s.phase);
  const sprintNumber = useGameStore((s) => s.sprintNumber);

  return (
    <div className="status-bar">
      <ResourceMeter icon="☕" label="Coffee" value={resources.coffee} />
      <ResourceMeter icon="🧠" label="Sanity" value={resources.sanity} />
      <ResourceMeter icon="⭐" label="Reputation" value={resources.reputation} />
      <ResourceMeter icon="💰" label="Runway" value={resources.runway} />
      <ProblemsBadge techDebt={resources.techDebt} />
      <span className="status-bar-spacer" />
      {phase === "sprint" && (
        <span className="status-bar-sprint">Sprint {sprintNumber}</span>
      )}
    </div>
  );
}
