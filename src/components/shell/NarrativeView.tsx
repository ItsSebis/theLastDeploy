import { ScrambleScreen } from "../scramble/ScrambleScreen";
import { SprintScreen } from "../sprint/SprintScreen";
import { EndingScreen } from "../endgame/EndingScreen";
import { useGameStore } from "../../store/gameStore";

function IntroScreen() {
  const startNewRun = useGameStore((s) => s.startNewRun);

  return (
    <div className="intro-screen">
      <h1 className="narrative-title"># welcome.md</h1>
      <p className="narrative-subtitle">
        It's the client's last day. The server lease expires at midnight. You get
        one timed pass through the dying repo, pick one coworker to bring, then
        survive as a freelancer until you land somewhere good — or you don't.
      </p>
      <button className="btn btn-primary" onClick={startNewRun}>
        New Run
      </button>
    </div>
  );
}

export function NarrativeView() {
  const phase = useGameStore((s) => s.phase);

  switch (phase) {
    case "intro":
      return <IntroScreen />;
    case "scramble_loot":
    case "scramble_companion":
      return <ScrambleScreen />;
    case "sprint":
      return <SprintScreen />;
    case "ending":
      return <EndingScreen />;
    default:
      return null;
  }
}
