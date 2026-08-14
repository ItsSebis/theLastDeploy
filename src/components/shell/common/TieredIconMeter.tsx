export interface IconTier {
  min: number;
  icon: string;
}

interface TieredIconMeterProps {
  value: number;
  tiers: IconTier[];
  label: string;
}

export function TieredIconMeter({ value, tiers, label }: TieredIconMeterProps) {
  const tier = tiers.find((t) => value >= t.min) ?? tiers[tiers.length - 1];

  return (
    <span className="tiered-icon-meter" title={`${label}: ${value}`}>
      {tier.icon}
    </span>
  );
}
