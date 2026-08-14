interface ProblemsBadgeProps {
  techDebt: number;
}

export function ProblemsBadge({ techDebt }: ProblemsBadgeProps) {
  const severity = techDebt >= 60 ? "error" : techDebt >= 30 ? "warn" : "ok";

  return (
    <span className={`problems-badge ${severity}`} title="Tech Debt (Problems)">
      🐛 {techDebt}
    </span>
  );
}
