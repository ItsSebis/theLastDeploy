import { SOURCE_CONTROL_ENTRIES } from "../../content/scrambleContent";
import { ScrambleListPanel } from "./ScrambleListPanel";

export function SourceControlPanel() {
  return <ScrambleListPanel title="Source Control" entries={SOURCE_CONTROL_ENTRIES} />;
}
