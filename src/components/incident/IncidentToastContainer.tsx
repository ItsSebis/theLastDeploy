import { useGameStore } from "../../store/gameStore";
import { IncidentToast } from "./IncidentToast";

export function IncidentToastContainer() {
  const activeIncident = useGameStore((s) => s.activeIncident);

  if (!activeIncident) return null;

  return (
    <div className="incident-toast-container">
      <IncidentToast incident={activeIncident} />
    </div>
  );
}
