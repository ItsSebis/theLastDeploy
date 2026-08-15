export interface IconTier {
  min: number;
  icon: string;
}

interface TieredIconMeterProps {
  value: number;
  tiers: IconTier[];
  label: string;
  criticalMin?: number;
}

export function TieredIconMeter({ value, tiers, label, criticalMin }: TieredIconMeterProps) {
  const tier = tiers.find((t) => value >= t.min) ?? tiers[tiers.length - 1];
  const critical = criticalMin !== undefined && value <= criticalMin;

  return (
    <span
      className={`tiered-icon-meter${critical ? " tiered-icon-meter-critical" : ""}`}
      title={`${label}: ${value}`}
    >
      {tier.icon}
    </span>
  );
}
