import { EditorTabs } from "./EditorTabs";
import { NarrativeView } from "./NarrativeView";

export function EditorArea() {
  return (
    <div className="editor-area">
      <EditorTabs />
      <div className="narrative-view">
        <NarrativeView />
      </div>
    </div>
  );
}
