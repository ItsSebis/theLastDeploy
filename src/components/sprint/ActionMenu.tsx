import { SPRINT_ACTIONS } from "../../store/sprintEconomy";
import { useGameStore } from "../../store/gameStore";

export function ActionMenu() {
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const offerUnlocked = useGameStore((s) => s.offerUnlocked);
  const performAction = useGameStore((s) => s.performAction);
  const takeTheOffer = useGameStore((s) => s.takeTheOffer);

  return (
    <div className="action-menu">
      {SPRINT_ACTIONS.map((action) => (
        <button
          key={action.id}
          className="btn action-btn"
          disabled={focusRemaining < action.focusCost}
          onClick={() => performAction(action.id)}
        >
          <span className="action-btn-name">{action.name}</span>
          <span className="action-btn-desc">{action.description}</span>
          <span className="action-btn-cost">{action.focusCost} focus</span>
        </button>
      ))}

      {offerUnlocked && (
        <button className="btn action-btn offer" onClick={takeTheOffer}>
          <span className="action-btn-name">Take the Offer</span>
          <span className="action-btn-desc">Cash out. End the run here.</span>
          <span className="action-btn-cost">free</span>
        </button>
      )}
    </div>
  );
}
