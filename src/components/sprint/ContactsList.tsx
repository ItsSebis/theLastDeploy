import { useState } from "react";
import { CONTACTS } from "../../content/contacts";
import { useGameStore } from "../../store/gameStore";

export function ContactsList() {
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);
  const performAction = useGameStore((s) => s.performAction);
  const [usedIndex, setUsedIndex] = useState<number | null>(null);

  const disabled = focusRemaining < 1 || !!activeIncident;

  function network(index: number) {
    performAction("network");
    setUsedIndex(index);
  }

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">Contacts</div>
      {CONTACTS.map((contact, index) => (
        <button
          key={contact.name}
          className="contact-row"
          disabled={disabled}
          onClick={() => network(index)}
        >
          {contact.name} — <span className="contact-role">{contact.role}</span>
        </button>
      ))}
      {usedIndex !== null && <div className="contact-last-text">{CONTACTS[usedIndex].chatText}</div>}
    </div>
  );
}
