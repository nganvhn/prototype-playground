import {
  between,
  createRoomImpulse,
  expRand,
  filter,
  gain,
  glide,
  loopSource,
  type NoiseBuffers,
} from "./audio-utils"
import { CAFE_VOICES, FADE } from "./data"
import { cafeParams } from "./mix-math"

type Voice = { gain: GainNode; formant: BiquadFilterNode; next: number }

/** Inharmonic partial ratios: ceramic cup vs. cutlery. */
const CUP = [1, 2.32, 4.25, 6.63]
const CUTLERY = [1, 1.47, 2.09, 2.56, 3.9]

/**
 * Café = a low room-tone bed + several "voices" (band-passed noise whose
 * level and formant move in syllable-like bursts, far away behind a low-pass)
 * + occasional cup and cutlery clinks, all sent through a synthetic room.
 */
export class CafeLayer {
  readonly output: GainNode
  private readonly bedGain: GainNode
  private readonly voices: Voice[] = []
  private readonly clinks: GainNode
  private params = cafeParams(40, CAFE_VOICES)
  private nextClink = 0

  constructor(
    private readonly ctx: BaseAudioContext,
    buffers: NoiseBuffers,
    private readonly rand: () => number
  ) {
    this.output = gain(ctx, 1)

    const room = ctx.createConvolver()
    room.buffer = createRoomImpulse(ctx)
    const wet = gain(ctx, 0.5)
    room.connect(wet).connect(this.output)

    const bed = loopSource(ctx, buffers.brown, rand)
    const bedLp = filter(ctx, "lowpass", 450)
    this.bedGain = gain(ctx, this.params.bedGain)
    bed.connect(bedLp).connect(this.bedGain).connect(this.output)

    // Voices: distant, so mostly the vowel band, softened by a low-pass.
    const murmur = gain(ctx, 1)
    const murmurLp = filter(ctx, "lowpass", 1500)
    const murmurHp = filter(ctx, "highpass", 180)
    murmur.connect(murmurHp).connect(murmurLp)
    murmurLp.connect(this.output)
    murmurLp.connect(room)

    for (let i = 0; i < CAFE_VOICES; i++) {
      const src = loopSource(ctx, buffers.pinkMono, rand)
      const formant = filter(ctx, "bandpass", 500, 3.5)
      const g = gain(ctx, 0)
      const pan = ctx.createStereoPanner()
      pan.pan.value = between(rand, -0.7, 0.7)
      src.connect(formant).connect(g).connect(pan).connect(murmur)
      this.voices.push({ gain: g, formant, next: 0 })
    }

    this.clinks = gain(ctx, 1)
    this.clinks.connect(this.output)
    this.clinks.connect(room)
  }

  setBusyness(busyness: number) {
    this.params = cafeParams(busyness, CAFE_VOICES)
    glide(this.bedGain.gain, this.params.bedGain, this.ctx, FADE.layer)
  }

  schedule(until: number) {
    const now = this.ctx.currentTime
    this.voices.forEach((v, i) => this.scheduleVoice(v, i, now, until))
    if (this.nextClink < now) this.nextClink = now + between(this.rand, 0.5, 3)
    while (this.nextClink < until) {
      this.clink(this.nextClink)
      this.nextClink += -Math.log(1 - this.rand()) / this.params.clinksPerSecond
    }
  }

  private scheduleVoice(v: Voice, index: number, now: number, until: number) {
    const { rand } = this
    if (v.next < now) v.next = now + between(rand, 0, 1.5)
    while (v.next < until) {
      if (index >= this.params.activeVoices) {
        v.next += between(rand, 0.5, 1.5)
        continue
      }
      // One utterance: a run of syllables with moving formant, then a pause.
      const level = between(rand, 0.9, 2.2)
      const end = v.next + between(rand, 0.8, 3.5)
      let t = v.next
      while (t < end) {
        const syllable = between(rand, 0.11, 0.28)
        const peak = level * between(rand, 0.35, 1)
        v.gain.gain.setTargetAtTime(peak, t, 0.03)
        v.gain.gain.setTargetAtTime(peak * 0.2, t + syllable * 0.6, 0.04)
        v.formant.frequency.setTargetAtTime(expRand(rand, 320, 950), t, 0.05)
        t += syllable
      }
      v.gain.gain.setTargetAtTime(0, t, 0.08)
      v.next = t + between(rand, this.params.pauseMin, this.params.pauseMax)
    }
  }

  private clink(t: number) {
    const { ctx, rand } = this
    const cup = rand() < 0.55
    const hits = cup ? 1 : 1 + Math.floor(rand() * 3)
    const pan = ctx.createStereoPanner()
    pan.pan.value = between(rand, -0.8, 0.8)
    pan.connect(this.clinks)
    const f0 = cup ? expRand(rand, 1700, 2900) : expRand(rand, 3000, 5200)
    const ratios = cup ? CUP : CUTLERY
    const loudness = between(rand, 0.025, 0.07)
    for (let h = 0; h < hits; h++) {
      const ht = t + h * between(rand, 0.06, 0.14)
      const hitGain = loudness * (h === 0 ? 1 : between(rand, 0.4, 0.8))
      ratios.forEach((r, i) => {
        const osc = ctx.createOscillator()
        osc.frequency.value = f0 * r * between(rand, 0.995, 1.005)
        const env = gain(ctx, 0)
        const decay = (cup ? 0.35 : 0.14) / (1 + i * 0.6)
        env.gain.setValueAtTime(0, ht)
        env.gain.linearRampToValueAtTime(hitGain / (1 + i), ht + 0.002)
        env.gain.exponentialRampToValueAtTime(0.0001, ht + decay)
        osc.connect(env).connect(pan)
        osc.start(ht)
        osc.stop(ht + decay + 0.02)
      })
    }
  }
}
