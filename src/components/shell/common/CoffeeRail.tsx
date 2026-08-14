interface CoffeeRailProps {
  value: number;
}

export function CoffeeRail({ value }: CoffeeRailProps) {
  const severity = value >= 60 ? "high" : value >= 30 ? "mid" : "low";

  return (
    <div className="coffee-rail" title={`Coffee: ${value}`}>
      <span className="coffee-rail-icon">☕</span>
      <div className="coffee-rail-track">
        <div
          className={`coffee-rail-fill ${severity}`}
          style={{ height: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
