// mulberry32: small, fast, seedable PRNG. Pure step function (state in, state
// out) rather than a closure, so the current rng position is a plain number
// that lives in GameState and stays serializable/reproducible.
export interface RandomDraw {
  value: number; // [0, 1)
  nextState: number;
}

export function nextRandom(state: number): RandomDraw {
  let s = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, nextState: s };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}
