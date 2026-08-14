import { useEffect, useRef, useState } from "react";
import { RUNWAY_SPRINT_DRIFT } from "../../../store/sprintEconomy";

interface MoneyMeterProps {
  value: number;
}

export function MoneyMeter({ value }: MoneyMeterProps) {
  const prevValue = useRef(value);
  const [dropping, setDropping] = useState(false);

  useEffect(() => {
    if (value < prevValue.current) {
      setDropping(true);
      const timeout = setTimeout(() => setDropping(false), 600);
      prevValue.current = value;
      return () => clearTimeout(timeout);
    }
    prevValue.current = value;
  }, [value]);

  return (
    <span className={`money-meter${dropping ? " money-meter-drop" : ""}`}>
      <span className="resource-meter-icon">💵</span>
      <span className="resource-meter-label">Money</span>
      {value}
      <span className="money-meter-drift">{RUNWAY_SPRINT_DRIFT}/day</span>
    </span>
  );
}
