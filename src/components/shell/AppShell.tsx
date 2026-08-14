import { useGameStore } from "../../store/gameStore";
import { IncidentOverlay } from "../incident/IncidentOverlay";
import { ActivityBar } from "./ActivityBar";
import { CoffeeRail } from "./common/CoffeeRail";
import { DayTransitionOverlay } from "./common/DayTransitionOverlay";
import { EditorArea } from "./EditorArea";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { TerminalPanel } from "./TerminalPanel";

export function AppShell() {
  const coffee = useGameStore((s) => s.resources.coffee);

  return (
    <div className="app-shell">
      <ActivityBar />
      <Sidebar />
      <EditorArea />
      <TerminalPanel />
      <CoffeeRail value={coffee} />
      <StatusBar />
      <IncidentOverlay />
      <DayTransitionOverlay />
    </div>
  );
}
