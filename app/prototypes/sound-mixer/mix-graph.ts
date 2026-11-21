import { createNoiseBuffers, filter, gain, glide } from "./audio-utils"
import { CafeLayer } from "./cafe-layer"
import { FADE } from "./data"
import { volumeToGain, warmthToCutoff } from "./mix-math"
import { mulberry32 } from "./noise"
import { NoiseLayer } from "./noise-layer"
import { RainLayer } from "./rain-layer"
import type { LayerId, Layers, MixSettings } from "./types"

/** Headroom so three full layers don't slam the limiter. */
const MIX_TRIM = 0.55

/**
 * The full signal chain, buildable on any BaseAudioContext (so it can also be
 * rendered offline for testing):
 *
 *   rain ─┐
 *   café ─┼─ layer gains ─ master ─ fade ─ timer ─ warmth LPF ─ limiter ─ out
 *   noise ┘
 */
export class MixGraph {
  readonly rain: RainLayer
  readonly cafe: CafeLayer
  readonly noise: NoiseLayer
  /** Play/pause fades. */
  readonly fade: GainNode
  /** Auto-stop fade. */
  readonly timer: GainNode
  private readonly layerGains: Record<LayerId, GainNode>
  private readonly master: GainNode
  private readonly warmth: BiquadFilterNode
  private layers: Layers

  constructor(
    private readonly ctx: BaseAudioContext,
    layers: Layers,
    settings: MixSettings,
    seed = Date.now()
  ) {
    const rand = mulberry32(seed)
    const buffers = createNoiseBuffers(ctx)
    this.layers = structuredClone(layers)

    this.master = gain(ctx, volumeToGain(settings.master) * MIX_TRIM)
    this.fade = gain(ctx, 0)
    this.timer = gain(ctx, 1)
    this.warmth = filter(ctx, "lowpass", warmthToCutoff(settings.warmth))
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -6
    limiter.knee.value = 6
    limiter.ratio.value = 12
    limiter.attack.value = 0.005
    limiter.release.value = 0.25
    this.master.connect(this.fade).connect(this.timer).connect(this.warmth).connect(limiter)
    limiter.connect(ctx.destination)

    this.rain = new RainLayer(ctx, buffers, rand)
    this.cafe = new CafeLayer(ctx, buffers, rand)
    this.noise = new NoiseLayer(ctx, buffers, rand, settings.noiseColour)
    this.rain.setIntensity(settings.rain)
    this.cafe.setBusyness(settings.busyness)

    const outputs = { rain: this.rain.output, cafe: this.cafe.output, noise: this.noise.output }
    this.layerGains = Object.fromEntries(
      (Object.keys(outputs) as LayerId[]).map((id) => {
        const g = gain(ctx, this.layerTarget(id))
        outputs[id].connect(g).connect(this.master)
        return [id, g]
      })
    ) as Record<LayerId, GainNode>
  }

  private layerTarget(id: LayerId) {
    const l = this.layers[id]
    return l.on ? volumeToGain(l.volume) : 0
  }

  setLayers(layers: Layers) {
    this.layers = structuredClone(layers)
    for (const id of Object.keys(this.layerGains) as LayerId[]) {
      glide(this.layerGains[id].gain, this.layerTarget(id), this.ctx, FADE.layer)
    }
  }

  setSettings(s: MixSettings) {
    glide(this.master.gain, volumeToGain(s.master) * MIX_TRIM, this.ctx, FADE.param)
    glide(this.warmth.frequency, warmthToCutoff(s.warmth), this.ctx, FADE.layer)
    this.noise.setColour(s.noiseColour)
    this.rain.setIntensity(s.rain)
    this.cafe.setBusyness(s.busyness)
  }

  /** Queue scheduled events (droplets, syllables, clinks) up to `until`. Muted layers are skipped. */
  schedule(until: number) {
    if (this.layers.rain.on) this.rain.schedule(until)
    if (this.layers.cafe.on) this.cafe.schedule(until)
  }
}
