/** Smooth deceleration, no overshoot. */
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3)
export const easeOutCubicInverse = (e: number) => 1 - Math.cbrt(1 - Math.min(Math.max(e, 0), 1))
