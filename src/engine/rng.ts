/**
 * Deterministic PRNG (mulberry32). Both peers apply the same seeded RNG to the
 * same action log, so shuffles and coin flips stay in sync without a server.
 */
export interface Rng {
  state: number
}

export function makeRng(seed: number): Rng {
  return { state: seed >>> 0 }
}

export function nextFloat(rng: Rng): number {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0
  let t = rng.state
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function nextInt(rng: Rng, maxExclusive: number): number {
  return Math.floor(nextFloat(rng) * maxExclusive)
}

/** Fisher–Yates shuffle, in place. */
export function shuffle<T>(rng: Rng, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = nextInt(rng, i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
