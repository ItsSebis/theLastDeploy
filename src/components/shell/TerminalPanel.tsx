import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../../store/gameStore";

export function TerminalPanel() {
  const log = useGameStore((s) => s.log);
  const [open, setOpen] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [log, open]);

  return (
    <div className="terminal-panel">
      <div className="terminal-header">
        <span>Terminal — run log</span>
        <button className="terminal-toggle" onClick={() => setOpen((v) => !v)}>
          {open ? "hide ▾" : "show ▸"}
        </button>
      </div>
      {open && (
        <div className="terminal-body" ref={bodyRef}>
          {log.map((entry) => (
            <div className="terminal-line" key={entry.id}>
              <span className="terminal-line-prefix">$</span>
              {entry.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
