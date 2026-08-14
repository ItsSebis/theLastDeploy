interface ResourceMeterProps {
  icon: string;
  label: string;
  value: number;
}

export function ResourceMeter({ icon, label, value }: ResourceMeterProps) {
  return (
    <span className="resource-meter" title={label}>
      <span className="resource-meter-icon">{icon}</span>
      {value}
    </span>
  );
}
