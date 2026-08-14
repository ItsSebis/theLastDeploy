import { useCountdown } from "../../hooks/useCountdown";
import { useGameStore } from "../../store/gameStore";
import { CompanionPicker } from "./CompanionPicker";
import { FileViewer } from "./FileViewer";

export function ScrambleScreen() {
  const phase = useGameStore((s) => s.phase);
  const activityTab = useGameStore((s) => s.activityTab);
  const tickScrambleTimer = useGameStore((s) => s.tickScrambleTimer);
  const timeRemaining = useGameStore((s) => s.scramble.timeRemaining);
  const grabbedItemIds = useGameStore((s) => s.scramble.grabbedItemIds);
  const stopScramble = useGameStore((s) => s.stopScramble);

  useCountdown(phase === "scramble_loot", tickScrambleTimer);

  if (phase === "scramble_loot") {
    const timeUp = timeRemaining <= 0;
    return (
      <>
        <h1 className="narrative-title"># scramble.ts</h1>
        <div className="scramble-header">
          <span>Grabbed {grabbedItemIds.length} / 4</span>
          <span className={`scramble-timer ${timeRemaining <= 10 ? "low" : ""}`}>{timeRemaining}s</span>
        </div>
        {activityTab === "explorer" ? (
          <FileViewer />
        ) : (
          <p className="narrative-subtitle">Browse the list on the left.</p>
        )}
        <button className="btn btn-primary" onClick={stopScramble} disabled={timeUp} style={{ marginTop: 16 }}>
          {grabbedItemIds.length === 0 ? "Leave empty-handed" : "I'm done grabbing"}
        </button>
      </>
    );
  }

  return (
    <>
      <h1 className="narrative-title"># scramble.ts</h1>
      <p className="narrative-subtitle">One seat left on the way out. Who do you bring?</p>
      <CompanionPicker />
    </>
  );
}
