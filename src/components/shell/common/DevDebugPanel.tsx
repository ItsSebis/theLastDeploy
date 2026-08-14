import { useState } from "react";
import { endings, events } from "../../../content";
import type { ResourceKey } from "../../../content/types";
import { useGameStore } from "../../../store/gameStore";
import { dangerTierFromTechDebt } from "../../../store/sprintEconomy";

const RESOURCE_KEYS: ResourceKey[] = ["coffee", "sanity", "reputation", "runway", "techDebt"];

export function DevDebugPanel() {
  const [open, setOpen] = useState(false);
  const [eventChoice, setEventChoice] = useState(events[0]?.id ?? "");
  const [endingChoice, setEndingChoice] = useState(endings[0]?.id ?? "");

  const phase = useGameStore((s) => s.phase);
  const sprintNumber = useGameStore((s) => s.sprintNumber);
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const resources = useGameStore((s) => s.resources);
  const inventory = useGameStore((s) => s.inventory);
  const companionId = useGameStore((s) => s.companionId);
  const flags = useGameStore((s) => s.flags);
  const offerUnlocked = useGameStore((s) => s.offerUnlocked);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const activityTab = useGameStore((s) => s.activityTab);
  const debugHighlightCounters = useGameStore((s) => s.debugHighlightCounters);

  const debugGiveAllItems = useGameStore((s) => s.debugGiveAllItems);
  const debugForceEvent = useGameStore((s) => s.debugForceEvent);
  const debugSetEnding = useGameStore((s) => s.debugSetEnding);
  const debugSetResource = useGameStore((s) => s.debugSetResource);
  const debugToggleHighlight = useGameStore((s) => s.debugToggleHighlight);

  if (!import.meta.env.DEV) return null;

  if (!open) {
    return (
      <button className="dev-debug-toggle" onClick={() => setOpen(true)}>
        🐞 DEV
      </button>
    );
  }

  return (
    <div className="dev-debug-panel">
      <div className="dev-debug-header">
        <span>🐞 Debug</span>
        <button className="dev-debug-close" onClick={() => setOpen(false)}>
          ✕
        </button>
      </div>

      <div className="dev-debug-section">
        <div className="dev-debug-section-title">Resources</div>
        {RESOURCE_KEYS.map((key) => (
          <label className="dev-debug-row" key={key}>
            <span>{key}</span>
            <input
              type="number"
              value={resources[key]}
              onChange={(e) => debugSetResource(key, Number(e.target.value))}
            />
          </label>
        ))}
      </div>

      <div className="dev-debug-section">
        <div className="dev-debug-section-title">State</div>
        <div className="dev-debug-row"><span>phase</span><span>{phase}</span></div>
        <div className="dev-debug-row"><span>sprint</span><span>{sprintNumber}</span></div>
        <div className="dev-debug-row"><span>focus</span><span>{focusRemaining}</span></div>
        <div className="dev-debug-row"><span>companion</span><span>{companionId ?? "—"}</span></div>
        <div className="dev-debug-row"><span>relationship</span><span>{flags.relationshipLevel}</span></div>
        <div className="dev-debug-row"><span>offerUnlocked</span><span>{String(offerUnlocked)}</span></div>
        <div className="dev-debug-row"><span>dangerTier</span><span>{dangerTierFromTechDebt(resources.techDebt)}</span></div>
        <div className="dev-debug-row"><span>activityTab</span><span>{activityTab}</span></div>
        <div className="dev-debug-row"><span>incident</span><span>{activeIncident?.event.id ?? "—"}</span></div>
      </div>

      <div className="dev-debug-section">
        <div className="dev-debug-section-title">Inventory ({inventory.length})</div>
        <div className="dev-debug-row">{inventory.join(", ") || "empty"}</div>
      </div>

      <div className="dev-debug-section">
        <div className="dev-debug-section-title">Actions</div>
        <button className="btn dev-debug-btn" onClick={debugGiveAllItems}>
          Give all items
        </button>

        <div className="dev-debug-row">
          <select value={eventChoice} onChange={(e) => setEventChoice(e.target.value)}>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
          <button className="btn dev-debug-btn" onClick={() => debugForceEvent(eventChoice)}>
            Force incident
          </button>
        </div>

        <div className="dev-debug-row">
          <select value={endingChoice} onChange={(e) => setEndingChoice(e.target.value)}>
            {endings.map((ending) => (
              <option key={ending.id} value={ending.id}>
                {ending.name}
              </option>
            ))}
          </select>
          <button className="btn dev-debug-btn" onClick={() => debugSetEnding(endingChoice)}>
            Jump to ending
          </button>
        </div>

        <label className="dev-debug-row">
          <span>Highlight correct item on incidents</span>
          <input
            type="checkbox"
            checked={debugHighlightCounters}
            onChange={debugToggleHighlight}
          />
        </label>
      </div>
    </div>
  );
}
