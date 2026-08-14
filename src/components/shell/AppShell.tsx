import { IncidentToastContainer } from "../incident/IncidentToastContainer";
import { ActivityBar } from "./ActivityBar";
import { EditorArea } from "./EditorArea";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { TerminalPanel } from "./TerminalPanel";

export function AppShell() {
  return (
    <div className="app-shell">
      <ActivityBar />
      <Sidebar />
      <EditorArea />
      <TerminalPanel />
      <StatusBar />
      <IncidentToastContainer />
    </div>
  );
}
