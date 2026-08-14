import { EXTENSIONS_ENTRIES } from "../../content/scrambleContent";
import { ScrambleListPanel } from "./ScrambleListPanel";

export function ExtensionsPanel() {
  return <ScrambleListPanel title="Extensions" entries={EXTENSIONS_ENTRIES} />;
}
