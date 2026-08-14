import { useState } from "react";
import { gigs } from "../../content";
import { useGameStore } from "../../store/gameStore";

export function GigBoard() {
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const takeGig = useGameStore((s) => s.takeGig);
  const [gigIndex, setGigIndex] = useState(() => Math.floor(Math.random() * gigs.length));

  const disabled = focusRemaining < 1 || !!activeIncident;
  const gig = gigs[gigIndex];

  function accept() {
    takeGig(gig.id);
    setGigIndex(Math.floor(Math.random() * gigs.length));
  }

  return (
    <div className="gig-board">
      <div className="gig-board-title">📋 Open gig</div>
      <div className="gig-board-desc">{gig.name}</div>
      <button className="btn btn-primary" disabled={disabled} onClick={accept}>
        Accept
      </button>
    </div>
  );
}
