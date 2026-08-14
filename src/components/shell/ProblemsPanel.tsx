import { PROBLEM_FLAVORS } from "../../content/problemFlavors";
import { useGameStore } from "../../store/gameStore";

export function ProblemsPanel() {
  const techDebt = useGameStore((s) => s.resources.techDebt);
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const phase = useGameStore((s) => s.phase);
  const performAction = useGameStore((s) => s.performAction);

  const count = Math.min(PROBLEM_FLAVORS.length, Math.max(1, Math.ceil(techDebt / 10)));
  const visibleProblems = PROBLEM_FLAVORS.slice(0, count);
  const canRefactor = phase === "sprint" && focusRemaining >= 1 && !activeIncident;

  if (visibleProblems.length === 0) {
    return <div className="terminal-line">No problems. Suspicious.</div>;
  }

  return (
    <div className="problems-panel">
      {visibleProblems.map((text) => (
        <button
          key={text}
          className="problem-row"
          disabled={!canRefactor}
          onClick={() => performAction("refactor")}
        >
          🐛 {text}
        </button>
      ))}
    </div>
  );
}
