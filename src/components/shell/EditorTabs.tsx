import { useGameStore } from "../../store/gameStore";

function tabLabel(phase: string, sprintNumber: number): string {
  switch (phase) {
    case "intro":
      return "welcome.md";
    case "scramble_loot":
    case "scramble_companion":
      return "scramble.ts";
    case "sprint":
      return `sprint-${sprintNumber}.ts`;
    case "ending":
      return "post-mortem.md";
    default:
      return "untitled";
  }
}

export function EditorTabs() {
  const phase = useGameStore((s) => s.phase);
  const sprintNumber = useGameStore((s) => s.sprintNumber);

  return (
    <div className="editor-tabs">
      <div className="editor-tab">{tabLabel(phase, sprintNumber)}</div>
    </div>
  );
}
