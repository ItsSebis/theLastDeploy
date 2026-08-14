import { companions } from "../../content";
import { useGameStore } from "../../store/gameStore";

export function CompanionPicker() {
  const pickCompanion = useGameStore((s) => s.pickCompanion);

  return (
    <div className="companion-grid">
      {companions.map((companion) => (
        <button
          key={companion.id}
          className="companion-pick-card"
          onClick={() => pickCompanion(companion.id)}
        >
          <div className="companion-pick-name">{companion.name}</div>
          <div className="companion-pick-desc">{companion.description}</div>
          <div className="companion-pick-passive">{companion.passive}</div>
        </button>
      ))}
    </div>
  );
}
