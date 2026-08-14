import { useEffect } from "react";

// Calls onTick once per second while `active` is true. Used to drive the
// scramble phase's timer via the store rather than local component state, so
// the countdown survives re-renders and stays a single source of truth.
export function useCountdown(active: boolean, onTick: () => void): void {
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(onTick, 1000);
    return () => window.clearInterval(id);
  }, [active, onTick]);
}
