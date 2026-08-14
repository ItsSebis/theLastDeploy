import { useState } from "react";
import { GIG_FLAVORS } from "../../content/gigFlavors";
import { useGameStore } from "../../store/gameStore";

export function GigBoard() {
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const performAction = useGameStore((s) => s.performAction);
  const [flavorIndex, setFlavorIndex] = useState(() => Math.floor(Math.random() * GIG_FLAVORS.length));

  const disabled = focusRemaining < 1 || !!activeIncident;

  function accept() {
    performAction("take_gig");
    setFlavorIndex(Math.floor(Math.random() * GIG_FLAVORS.length));
  }

  return (
    <div className="gig-board">
      <div className="gig-board-title">📋 Open gig</div>
      <div className="gig-board-desc">{GIG_FLAVORS[flavorIndex]}</div>
      <button className="btn btn-primary" disabled={disabled} onClick={accept}>
        Accept
      </button>
    </div>
  );
}
