import { useGameStore } from "../../store/gameStore";
import { GigBoard } from "./GigBoard";

export function SprintScreen() {
  const sprintNumber = useGameStore((s) => s.sprintNumber);
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const offerUnlocked = useGameStore((s) => s.offerUnlocked);
  const takeTheOffer = useGameStore((s) => s.takeTheOffer);

  return (
    <>
      <h1 className="narrative-title"># sprint-{sprintNumber}.ts</h1>
      <p className="narrative-comment">
        // {focusRemaining} focus point{focusRemaining === 1 ? "" : "s"} remaining this sprint
      </p>
      {activeIncident ? (
        <p className="narrative-subtitle">Something's happening. Check the notification.</p>
      ) : (
        <>
          <p className="narrative-subtitle">
            Click the 🐛 badge to refactor, check in with your companion or a contact in the
            sidebar to network, or go 🛋 Away in the status bar to rest. Once you're out of
            focus, Away turns into 🌙 End Day.
          </p>
          <GigBoard />
          {offerUnlocked && (
            <button className="btn action-btn offer" onClick={takeTheOffer} style={{ marginTop: 16 }}>
              <span className="action-btn-name">Take the Offer</span>
              <span className="action-btn-desc">Cash out. End the run here.</span>
            </button>
          )}
        </>
      )}
    </>
  );
}
