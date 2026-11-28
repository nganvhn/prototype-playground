import { between, expRand, filter, gain, glide, loopSource, type NoiseBuffers } from "./audio-utils"
import { FADE } from "./data"
import { rainParams } from "./mix-math"

/**
 * Rain = a filtered pink-noise bed + a low brown rumble + individually
 * scheduled droplets (band-passed noise ticks and the odd bubbly "plink").
 */
export class RainLayer {
  readonly output: GainNode
  private readonly bedGain: GainNode
  private readonly bedFilter: BiquadFilterNode
  private readonly rumbleGain: GainNode
  private readonly drops: GainNode
  private params = rainParams(45)
  private next = 0

  constructor(
    private readonly ctx: BaseAudioContext,
    private readonly buffers: NoiseBuffers,
    private readonly rand: () => number
  ) {
    this.output = gain(ctx, 1.5)

    const bed = loopSource(ctx, buffers.pink, rand)
    const hp = filter(ctx, "highpass", 450)
    this.bedFilter = filter(ctx, "lowpass", this.params.bedCutoff)
    this.bedGain = gain(ctx, this.params.bedGain)
    bed.connect(hp).connect(this.bedFilter).connect(this.bedGain).connect(this.output)

    const rumble = loopSource(ctx, buffers.brown, rand)
    const lp = filter(ctx, "lowpass", 280)
    this.rumbleGain = gain(ctx, this.params.rumbleGain)
    rumble.connect(lp).connect(this.rumbleGain).connect(this.output)

    this.drops = gain(ctx, 1)
    this.drops.connect(this.output)
  }

  setIntensity(intensity: number) {
    this.params = rainParams(intensity)
    glide(this.bedGain.gain, this.params.bedGain, this.ctx, FADE.layer)
    glide(this.bedFilter.frequency, this.params.bedCutoff, this.ctx, FADE.layer)
    glide(this.rumbleGain.gain, this.params.rumbleGain, this.ctx, FADE.layer)
  }

  /** Queue droplets from now up to `until` (audio-clock seconds). */
  schedule(until: number) {
    const now = this.ctx.currentTime
    if (this.next < now) this.next = now + 0.02
    while (this.next < until) {
      if (this.rand() < this.params.plinkChance) this.plink(this.next)
      else this.drop(this.next)
      // Poisson arrivals sound natural; a fixed rate sounds like a clock.
      this.next += -Math.log(1 - this.rand()) / this.params.dropsPerSecond
    }
  }

  private drop(t: number) {
    const { ctx, rand } = this
    const src = ctx.createBufferSource()
    src.buffer = this.buffers.burst
    const bp = filter(ctx, "bandpass", expRand(rand, 1200, 7000), between(rand, 1.5, 6))
    const env = gain(ctx, 0)
    const pan = ctx.createStereoPanner()
    pan.pan.value = between(rand, -0.9, 0.9)
    const peak = this.params.dropGain * between(rand, 0.15, 1)
    const decay = between(rand, 0.008, 0.045)
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(peak, t + 0.0015)
    env.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    src.connect(bp).connect(env).connect(pan).connect(this.drops)
    src.start(t, rand() * 0.15)
    src.stop(t + decay + 0.02)
  }

  /** A drop hitting water: a short sine whose pitch rises (Minnaert bubble). */
  private plink(t: number) {
    const { ctx, rand } = this
    const osc = ctx.createOscillator()
    const f = expRand(rand, 1400, 3200)
    const dur = between(rand, 0.02, 0.05)
    osc.frequency.setValueAtTime(f, t)
    osc.frequency.exponentialRampToValueAtTime(f * between(rand, 1.3, 1.8), t + dur)
    const env = gain(ctx, 0)
    const pan = ctx.createStereoPanner()
    pan.pan.value = between(rand, -0.8, 0.8)
    const peak = this.params.dropGain * between(rand, 0.05, 0.18)
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(peak, t + 0.002)
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(env).connect(pan).connect(this.drops)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }
}
