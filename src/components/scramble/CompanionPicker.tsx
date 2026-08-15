import { companions } from "../../content";
import { useGameStore } from "../../store/gameStore";

export function CompanionPicker() {
  const pickCompanion = useGameStore((s) => s.pickCompanion);

  // QA Ghost isn't picked here -- it's bought from the Runway shop as a
  // timed buff and only becomes hireable once relationship is very good.
  const pickable = companions.filter((companion) => companion.id !== "qa_ghost");

  return (
    <div className="companion-grid">
      {pickable.map((companion) => (
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
