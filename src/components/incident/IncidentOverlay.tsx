import { useGameStore } from "../../store/gameStore";

export function IncidentOverlay() {
  const activeIncident = useGameStore((s) => s.activeIncident);
  const respondToIncident = useGameStore((s) => s.respondToIncident);
  const dismissIncident = useGameStore((s) => s.dismissIncident);

  if (!activeIncident) return null;
  const { event, resolution } = activeIncident;

  return (
    <div className="incident-overlay-backdrop">
      {!resolution ? (
        <div className="incident-overlay-panel">
          <div className="incident-overlay-title">⚠ {event.name} ⚠</div>
          <div className="incident-overlay-desc">{event.description}</div>
          <div className="incident-overlay-hint">Respond with an item from your inventory, or:</div>
          <button
            className="btn incident-overlay-action-btn"
            onClick={() => respondToIncident(null)}
          >
            Ignore
          </button>
        </div>
      ) : (
        <div className={`incident-overlay-panel resolved ${resolution.success ? "success" : "fail"}`}>
          <div className="incident-overlay-title">
            {resolution.success ? "✓ " : "✕ "}
            {event.name}
          </div>
          <div className="incident-overlay-result">{resolution.text}</div>
          <button className="btn incident-overlay-action-btn" onClick={dismissIncident}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
