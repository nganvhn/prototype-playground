import { gain, glide, loopSource, type NoiseBuffers } from "./audio-utils"
import type { NoiseColour } from "./types"

/** Per-colour trims so white doesn't overpower brown at the same slider value. */
const TRIM: Record<NoiseColour, number> = { white: 0.6, pink: 0.62, brown: 0.75 }
const COLOURS: NoiseColour[] = ["white", "pink", "brown"]

/** All three colours run continuously; switching crossfades between them. */
export class NoiseLayer {
  readonly output: GainNode
  private readonly gains: Record<NoiseColour, GainNode>

  constructor(
    private readonly ctx: BaseAudioContext,
    buffers: NoiseBuffers,
    rand: () => number,
    colour: NoiseColour
  ) {
    this.output = gain(ctx, 1)
    this.gains = Object.fromEntries(
      COLOURS.map((c) => {
        const g = gain(ctx, c === colour ? TRIM[c] : 0)
        loopSource(ctx, buffers[c], rand).connect(g).connect(this.output)
        return [c, g]
      })
    ) as Record<NoiseColour, GainNode>
  }

  setColour(colour: NoiseColour) {
    for (const c of COLOURS) glide(this.gains[c].gain, c === colour ? TRIM[c] : 0, this.ctx, 0.15)
  }
}
