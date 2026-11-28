import type { NoiseColour } from "./types"

/** Small seeded PRNG so each channel gets independent noise. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function rawNoise(colour: NoiseColour, length: number, rand: () => number) {
  const out = new Float32Array(length)
  if (colour === "white") {
    for (let i = 0; i < length; i++) out[i] = rand() * 2 - 1
  } else if (colour === "pink") {
    // Paul Kellet's refined pink filter.
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < length; i++) {
      const w = rand() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856
      b4 = 0.55 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.016898
      out[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362
      b6 = w * 0.115926
    }
  } else {
    // Leaky integrator: brown (red) noise without DC drift.
    let last = 0
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (rand() * 2 - 1)) / 1.02
      out[i] = last
    }
  }
  return out
}

/**
 * A loopable noise channel: generated slightly long, then the tail is
 * crossfaded into the head so the loop point is seamless (no click),
 * and normalised to a fixed RMS so colours sit at similar loudness.
 */
export function loopableNoise(
  colour: NoiseColour,
  length: number,
  seed: number,
  targetRms = 0.2,
  fadeLength = 4096
): Float32Array {
  const rand = mulberry32(seed)
  const raw = rawNoise(colour, length + fadeLength, rand)
  const out = raw.slice(0, length)
  for (let i = 0; i < fadeLength; i++) {
    // Equal-power crossfade: uncorrelated signals keep their level.
    const t = i / fadeLength
    out[i] = raw[i] * Math.sin((t * Math.PI) / 2) + raw[length + i] * Math.cos((t * Math.PI) / 2)
  }
  let sum = 0
  for (let i = 0; i < length; i++) sum += out[i] * out[i]
  const rms = Math.sqrt(sum / length) || 1
  const k = targetRms / rms
  for (let i = 0; i < length; i++) out[i] *= k
  return out
}
