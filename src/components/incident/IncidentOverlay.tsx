import { itemsById } from "../../content";
import { useGameStore } from "../../store/gameStore";

export function IncidentOverlay() {
  const activeIncident = useGameStore((s) => s.activeIncident);
  const inventory = useGameStore((s) => s.inventory);
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
          <div className="incident-overlay-chip-grid">
            {inventory.map((itemId) => {
              const item = itemsById[itemId];
              if (!item) return null;
              return (
                <button
                  key={itemId}
                  className="incident-overlay-chip"
                  onClick={() => respondToIncident(itemId)}
                >
                  <span className="incident-overlay-chip-name">{item.name}</span>
                  <span className="incident-overlay-chip-desc">{item.description}</span>
                </button>
              );
            })}
            <button className="incident-overlay-chip ignore" onClick={() => respondToIncident(null)}>
              <span className="incident-overlay-chip-name">Ignore</span>
            </button>
          </div>
        </div>
      ) : (
        <div className={`incident-overlay-panel resolved ${resolution.success ? "success" : "fail"}`}>
          <div className="incident-overlay-title">
            {resolution.success ? "✓ " : "✕ "}
            {event.name}
          </div>
          <div className="incident-overlay-result">{resolution.text}</div>
          <button className="btn incident-overlay-dismiss" onClick={dismissIncident}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
