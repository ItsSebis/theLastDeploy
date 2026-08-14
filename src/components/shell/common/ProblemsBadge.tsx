import { useGameStore } from "../../../store/gameStore";
import { dangerTierFromTechDebt } from "../../../store/sprintEconomy";

interface ProblemsBadgeProps {
  techDebt: number;
}

export function ProblemsBadge({ techDebt }: ProblemsBadgeProps) {
  const setTerminalTab = useGameStore((s) => s.setTerminalTab);
  const tier = dangerTierFromTechDebt(techDebt);
  const severity = tier === "high" ? "error" : tier === "medium" ? "warn" : "ok";
  const icon = severity === "error" ? "🖥️💥" : severity === "warn" ? "🖥️⚠️" : "🖥️";

  return (
    <button
      className={`problems-badge ${severity}`}
      title="Tech Debt (Problems) — click to refactor"
      onClick={() => setTerminalTab("problems")}
    >
      {icon} {techDebt}
    </button>
  );
}
