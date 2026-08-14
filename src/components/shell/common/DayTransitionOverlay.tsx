import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../../../store/gameStore";

const DISPLAY_MS = 1300;

interface Transition {
  from: number;
  to: number;
}

export function DayTransitionOverlay() {
  const phase = useGameStore((s) => s.phase);
  const sprintNumber = useGameStore((s) => s.sprintNumber);
  const prevSprintNumber = useRef(sprintNumber);
  const [transition, setTransition] = useState<Transition | null>(null);

  useEffect(() => {
    const prev = prevSprintNumber.current;
    if (phase === "sprint" && prev >= 1 && sprintNumber !== prev) {
      setTransition({ from: prev, to: sprintNumber });
      const timeout = setTimeout(() => setTransition(null), DISPLAY_MS);
      prevSprintNumber.current = sprintNumber;
      return () => clearTimeout(timeout);
    }
    prevSprintNumber.current = sprintNumber;
  }, [phase, sprintNumber]);

  if (!transition) return null;

  return (
    <div className="day-transition-overlay">
      <div className="day-transition-panel">
        Sprint {transition.from} complete → Sprint {transition.to} begins
      </div>
    </div>
  );
}
