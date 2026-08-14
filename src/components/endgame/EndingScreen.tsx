import { endingsById } from "../../content";
import { useGameStore } from "../../store/gameStore";

export function EndingScreen() {
  const endingId = useGameStore((s) => s.endingId);
  const resources = useGameStore((s) => s.resources);
  const sprintNumber = useGameStore((s) => s.sprintNumber);
  const restart = useGameStore((s) => s.restart);

  if (!endingId) return null;
  const ending = endingsById[endingId];
  if (!ending) return null;

  return (
    <>
      <h1 className="narrative-title"># post-mortem.md</h1>
      <div className="ending-tier">{ending.tier.replace(/_/g, " ")}</div>
      <h2 className="narrative-title" style={{ fontSize: 18 }}>
        {ending.name}
      </h2>
      <p className="ending-text">{ending.text}</p>

      <div className="ending-stats">
        <div className="ending-stat">
          <span className="ending-stat-label">Sprints survived</span>
          {sprintNumber}
        </div>
        <div className="ending-stat">
          <span className="ending-stat-label">Reputation</span>
          {resources.reputation}
        </div>
        <div className="ending-stat">
          <span className="ending-stat-label">Runway</span>
          {resources.runway}
        </div>
        <div className="ending-stat">
          <span className="ending-stat-label">Sanity</span>
          {resources.sanity}
        </div>
        <div className="ending-stat">
          <span className="ending-stat-label">Coffee</span>
          {resources.coffee}
        </div>
        <div className="ending-stat">
          <span className="ending-stat-label">Tech Debt</span>
          {resources.techDebt}
        </div>
      </div>

      <button className="btn btn-primary" onClick={restart}>
        Play Again
      </button>
    </>
  );
}
