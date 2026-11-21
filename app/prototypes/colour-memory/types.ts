/** Hue in degrees (0–360), saturation and lightness in percent (0–100). sRGB HSL. */
export type Hsl = { h: number; s: number; l: number }

export type Difficulty = "easy" | "hard"

export type Phase = "idle" | "preparing" | "showing" | "recall" | "reveal" | "summary"

export type TurnResult = {
  target: Hsl
  guess: Hsl
  /** CIEDE2000 colour difference. */
  deltaE: number
  /** 0–100. */
  score: number
}

/** Settings snapshotted when a round starts, so panel tweaks mid-round don't change it. */
export type Round = {
  difficulty: Difficulty
  displayMs: number
  targets: Hsl[]
}

/** Best average score (0–100) per difficulty. */
export type BestScores = Partial<Record<Difficulty, number>>
