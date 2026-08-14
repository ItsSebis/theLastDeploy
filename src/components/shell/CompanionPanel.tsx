import { companionsById } from "../../content";
import { useGameStore } from "../../store/gameStore";

export function CompanionPanel() {
  const companionId = useGameStore((s) => s.companionId);
  const relationshipLevel = useGameStore((s) => s.flags.relationshipLevel);

  if (!companionId) return null;
  const companion = companionsById[companionId];
  if (!companion) return null;

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">Team</div>
      <div className="companion-card">
        <div className="companion-card-name">{companion.name}</div>
        <div className="companion-card-desc">{companion.description}</div>
        <div className="companion-card-relationship">Relationship: {relationshipLevel}</div>
      </div>
    </div>
  );
}
