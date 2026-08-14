import { itemsById } from "../../content";
import type { ActiveIncident } from "../../store/types";
import { useGameStore } from "../../store/gameStore";

interface IncidentToastProps {
  incident: ActiveIncident;
}

export function IncidentToast({ incident }: IncidentToastProps) {
  const inventory = useGameStore((s) => s.inventory);
  const respondToIncident = useGameStore((s) => s.respondToIncident);
  const dismissIncident = useGameStore((s) => s.dismissIncident);

  const { event, resolution } = incident;

  if (!resolution) {
    return (
      <div className="incident-toast">
        <div className="incident-toast-title">⚠ {event.name}</div>
        <div className="incident-toast-desc">{event.description}</div>
        <div className="incident-toast-actions">
          {inventory.map((itemId) => {
            const item = itemsById[itemId];
            if (!item) return null;
            return (
              <button
                key={itemId}
                className="btn incident-toast-btn"
                onClick={() => respondToIncident(itemId)}
              >
                {item.name}
              </button>
            );
          })}
          <button
            className="btn incident-toast-btn"
            onClick={() => respondToIncident(null)}
          >
            Ignore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`incident-toast resolved ${resolution.success ? "success" : "fail"}`}>
      <div className="incident-toast-title">
        {resolution.success ? "✓ " : "✕ "}
        {event.name}
      </div>
      <div className="incident-toast-result">{resolution.text}</div>
      <button className="btn incident-toast-btn" onClick={dismissIncident}>
        Dismiss
      </button>
    </div>
  );
}
