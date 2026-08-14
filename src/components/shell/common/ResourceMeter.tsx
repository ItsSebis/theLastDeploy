interface ResourceMeterProps {
  icon: string;
  label: string;
  value: number;
}

export function ResourceMeter({ icon, label, value }: ResourceMeterProps) {
  return (
    <span className="resource-meter">
      <span className="resource-meter-icon">{icon}</span>
      <span className="resource-meter-label">{label}</span>
      {value}
    </span>
  );
}
