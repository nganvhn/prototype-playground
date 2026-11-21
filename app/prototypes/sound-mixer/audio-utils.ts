import { NOISE_SECONDS } from "./data"
import { loopableNoise, mulberry32 } from "./noise"
import type { NoiseColour } from "./types"

export type NoiseBuffers = Record<NoiseColour, AudioBuffer> & {
  /** Mono pink noise for café voices (panned individually). */
  pinkMono: AudioBuffer
  /** Short white burst, the raw material for raindrops. */
  burst: AudioBuffer
}

/** Glide a param to a value with an exponential approach: never a step, so never a click. */
export function glide(param: AudioParam, value: number, ctx: BaseAudioContext, timeConstant: number) {
  const now = ctx.currentTime
  param.cancelScheduledValues(now)
  param.setValueAtTime(param.value, now)
  param.setTargetAtTime(value, now, timeConstant)
}

function bufferFrom(ctx: BaseAudioContext, channels: Float32Array[]) {
  const buf = ctx.createBuffer(channels.length, channels[0].length, ctx.sampleRate)
  channels.forEach((data, i) => buf.copyToChannel(data as Float32Array<ArrayBuffer>, i))
  return buf
}

export function createNoiseBuffers(ctx: BaseAudioContext): NoiseBuffers {
  const len = Math.round(ctx.sampleRate * NOISE_SECONDS)
  const stereo = (colour: NoiseColour, seed: number) =>
    bufferFrom(ctx, [loopableNoise(colour, len, seed), loopableNoise(colour, len, seed + 1)])
  const rand = mulberry32(99)
  const burst = new Float32Array(Math.round(ctx.sampleRate * 0.25))
  for (let i = 0; i < burst.length; i++) burst[i] = rand() * 2 - 1
  return {
    white: stereo("white", 1),
    pink: stereo("pink", 3),
    brown: stereo("brown", 5),
    pinkMono: bufferFrom(ctx, [loopableNoise("pink", len, 7)]),
    burst: bufferFrom(ctx, [burst]),
  }
}

/** A synthetic room: exponentially decaying stereo noise, used as a convolution impulse. */
export function createRoomImpulse(ctx: BaseAudioContext, seconds = 1.6, decay = 3.2) {
  const len = Math.round(ctx.sampleRate * seconds)
  const channels = [0, 1].map((c) => {
    const rand = mulberry32(42 + c)
    const data = new Float32Array(len)
    for (let i = 0; i < len; i++) {
      data[i] = (rand() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
    return data
  })
  return bufferFrom(ctx, channels)
}

export function loopSource(ctx: BaseAudioContext, buffer: AudioBuffer, rand: () => number) {
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  // Random start point so layers sharing a buffer don't phase against each other.
  src.start(0, rand() * buffer.duration)
  return src
}

export function filter(ctx: BaseAudioContext, type: BiquadFilterType, frequency: number, Q = 0.707) {
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = frequency
  f.Q.value = Q
  return f
}

export function gain(ctx: BaseAudioContext, value: number) {
  const g = ctx.createGain()
  g.gain.value = value
  return g
}

/** Exponential-ish random between a and b (good for frequencies). */
export function expRand(rand: () => number, a: number, b: number) {
  return a * Math.pow(b / a, rand())
}

export function between(rand: () => number, a: number, b: number) {
  return a + (b - a) * rand()
}
