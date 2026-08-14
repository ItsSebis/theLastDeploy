import { useGameStore } from "../../../store/gameStore";

interface ProblemsBadgeProps {
  techDebt: number;
}

export function ProblemsBadge({ techDebt }: ProblemsBadgeProps) {
  const setTerminalTab = useGameStore((s) => s.setTerminalTab);
  const severity = techDebt >= 60 ? "error" : techDebt >= 30 ? "warn" : "ok";

  return (
    <button
      className={`problems-badge ${severity}`}
      title="Tech Debt (Problems) — click to refactor"
      onClick={() => setTerminalTab("problems")}
    >
      🐛 {techDebt}
    </button>
  );
}
