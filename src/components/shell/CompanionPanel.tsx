import { companionsById } from "../../content";
import { useGameStore } from "../../store/gameStore";

export function CompanionPanel() {
  const companionId = useGameStore((s) => s.companionId);
  const relationshipLevel = useGameStore((s) => s.flags.relationshipLevel);
  const supportOffered = useGameStore((s) => s.flags.supportOffered);
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const performAction = useGameStore((s) => s.performAction);
  const triggerSupport = useGameStore((s) => s.triggerSupport);

  if (!companionId) return null;
  const companion = companionsById[companionId];
  if (!companion) return null;

  const disabled = focusRemaining < 1 || !!activeIncident;

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">Team</div>
      <button
        className="companion-card companion-card-clickable"
        disabled={disabled}
        onClick={() => performAction("check_in")}
        title="Check in"
      >
        <div className="companion-card-name">{companion.name}</div>
        <div className="companion-card-desc">{companion.description}</div>
        <div className="companion-card-relationship">Relationship: {relationshipLevel}</div>
      </button>
      {supportOffered && (
        <button
          className="companion-card companion-card-clickable companion-support-btn"
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
