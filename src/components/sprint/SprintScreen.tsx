import { useGameStore } from "../../store/gameStore";
import { ActionMenu } from "./ActionMenu";

export function SprintScreen() {
  const sprintNumber = useGameStore((s) => s.sprintNumber);
  const focusRemaining = useGameStore((s) => s.focusRemaining);
  const activeIncident = useGameStore((s) => s.activeIncident);

  return (
    <>
      <h1 className="narrative-title"># sprint-{sprintNumber}.ts</h1>
      <p className="narrative-comment">// {focusRemaining} focus point{focusRemaining === 1 ? "" : "s"} remaining this sprint</p>
      {activeIncident ? (
        <p className="narrative-subtitle">
          Something's happening. Check the notification.
        </p>
      ) : (
        <ActionMenu />
      )}
    </>
  );
}
