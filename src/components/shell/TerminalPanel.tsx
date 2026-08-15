import { useEffect, useRef } from "react";
import { useGameStore } from "../../store/gameStore";
import { MessagesPanel } from "./MessagesPanel";
import { ProblemsPanel } from "./ProblemsPanel";

export function TerminalPanel() {
  const log = useGameStore((s) => s.log);
  const open = useGameStore((s) => s.terminalPanelOpen);
  const activeTab = useGameStore((s) => s.terminalActiveTab);
  const toggleTerminalPanel = useGameStore((s) => s.toggleTerminalPanel);
  const setTerminalTab = useGameStore((s) => s.setTerminalTab);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || activeTab !== "terminal" || !bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [log, open, activeTab]);

  return (
    <div className="terminal-panel">
      <div className="terminal-header">
        <div className="terminal-tabs">
          <button
            className={`terminal-tab ${activeTab === "terminal" ? "active" : ""}`}
            onClick={() => setTerminalTab("terminal")}
          >
            Terminal
          </button>
          <button
            className={`terminal-tab ${activeTab === "problems" ? "active" : ""}`}
            onClick={() => setTerminalTab("problems")}
          >
            Problems
          </button>
          <button
            className={`terminal-tab ${activeTab === "messages" ? "active" : ""}`}
            onClick={() => setTerminalTab("messages")}
          >
            Messages
          </button>
        </div>
        <button className="terminal-toggle" onClick={toggleTerminalPanel}>
          {open ? "hide ▾" : "show ▸"}
        </button>
      </div>
      {open && (
        <div className="terminal-body" ref={bodyRef}>
          {activeTab === "terminal" ? (
            log.map((entry) => (
              <div className="terminal-line" key={entry.id}>
                <span className="terminal-line-prefix">$</span>
                {entry.text}
              </div>
            ))
          ) : activeTab === "problems" ? (
            <ProblemsPanel />
          ) : (
            <MessagesPanel />
          )}
        </div>
      )}
    </div>
  );
}
