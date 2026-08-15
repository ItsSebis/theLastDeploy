import { companionsById } from "../../content";
import { useGameStore } from "../../store/gameStore";
import { RELATIONSHIP_VERY_GOOD_THRESHOLD } from "../../store/sprintEconomy";

export function QaGhostPanel() {
  const qaGhost = useGameStore((s) => s.qaGhost);
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const thankQaGhost = useGameStore((s) => s.thankQaGhost);
  const hireQaGhost = useGameStore((s) => s.hireQaGhost);
  const triggerSupport = useGameStore((s) => s.triggerSupport);

  if (!qaGhost.buffActive && !qaGhost.hired) return null;

  const companion = companionsById.qa_ghost;
  const disabled = focusRemaining < 1 || !!activeIncident;
  const eligibleToHire = !qaGhost.hired && qaGhost.relationshipLevel >= RELATIONSHIP_VERY_GOOD_THRESHOLD;

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">QA Ghost</div>
      <div className="companion-card">
        <div className="companion-card-name">{companion.name}</div>
        <div className="companion-card-desc">{companion.description}</div>
        {qaGhost.buffActive && (
          <div className="companion-card-relationship">
            Warning active — {qaGhost.buffSprintsRemaining} sprint{qaGhost.buffSprintsRemaining === 1 ? "" : "s"} left.
          </div>
        )}
        {!qaGhost.hired && <div className="companion-card-relationship">Relationship: {qaGhost.relationshipLevel}</div>}
      </div>
      {!qaGhost.hired && (
        <button className="btn" disabled={disabled} onClick={() => thankQaGhost()} title="Thank the QA Ghost">
          Thank QA Ghost (1 Focus)
        </button>
      )}
      {eligibleToHire && (
        <button className="btn" onClick={() => hireQaGhost()} title="Hire the QA Ghost for $1/day">
          Hire QA Ghost ($1/day)
        </button>
      )}
      {qaGhost.hired && qaGhost.supportOffered && (
        <button
          className="btn companion-support-btn"
          disabled={disabled}
          onClick={() => triggerSupport()}
          title={companion.support.description}
        >
          {companion.support.name} (1 Focus)
        </button>
      )}
    </div>
  );
}
