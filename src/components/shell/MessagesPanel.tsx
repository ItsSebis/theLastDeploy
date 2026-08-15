import { companionsById } from "../../content";
import { useGameStore } from "../../store/gameStore";

export function MessagesPanel() {
  const companionId = useGameStore((s) => s.companionId);
  const relationshipLevel = useGameStore((s) => s.flags.relationshipLevel);

  if (!companionId) {
    return <div className="terminal-line">No one to message.</div>;
  }

  const companion = companionsById[companionId];
  const unlocked = companion.relationshipEvents.slice(0, relationshipLevel);

  if (unlocked.length === 0) {
    return (
      <div className="terminal-line">Nothing yet. Check in to hear from {companion.name}.</div>
    );
  }

  return (
    <div className="messages-panel">
      {unlocked.map((text, i) => (
        <div className="message-row" key={i}>
          💬 {text}
        </div>
      ))}
    </div>
  );
}
