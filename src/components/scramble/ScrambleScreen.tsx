import { useCountdown } from "../../hooks/useCountdown";
import { useGameStore } from "../../store/gameStore";
import { CompanionPicker } from "./CompanionPicker";
import { LootGrid } from "./LootGrid";

export function ScrambleScreen() {
  const phase = useGameStore((s) => s.phase);
  const tickScrambleTimer = useGameStore((s) => s.tickScrambleTimer);

  useCountdown(phase === "scramble_loot", tickScrambleTimer);

  if (phase === "scramble_loot") {
    return (
      <>
        <h1 className="narrative-title"># scramble.ts</h1>
        <p className="narrative-subtitle">
          Access to the repo expires when the clock hits zero. Grab what you can carry —
          you can bring {""}
          <strong>4</strong> things with you.
        </p>
        <LootGrid />
      </>
    );
  }

  return (
    <>
      <h1 className="narrative-title"># scramble.ts</h1>
      <p className="narrative-subtitle">
        One seat left on the way out. Who do you bring?
      </p>
      <CompanionPicker />
    </>
  );
}
