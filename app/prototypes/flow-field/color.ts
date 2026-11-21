import { BAND_COUNT, COLORS } from "./data"
import type { Palette, RGB } from "./types"

const toByte = (x: number) => {
  const c = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, c)) * 255)
}

/** OKLCH → sRGB bytes. Done by hand so canvas colours don't depend on oklch() support. */
export function oklchToRgb(l: number, c: number, hueDeg: number): RGB {
  const h = (hueDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    toByte(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    toByte(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    toByte(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  ]
}

const wrapHue = (h: number) => ((h % 360) + 360) % 360

/** Hue-tinted water background plus one stroke colour per band across the hue spread. */
export function buildPalette(hue: number, spread: number, dark: boolean): Palette {
  const c = dark ? COLORS.dark : COLORS.light
  const background = oklchToRgb(c.bg.l, c.bg.c, hue)
  const bands = Array.from({ length: BAND_COUNT }, (_, i) => {
    const t = i / Math.max(1, BAND_COUNT - 1)
    const [r, g, b] = oklchToRgb(c.stroke.l, c.stroke.c, wrapHue(hue + spread * (t - 0.5)))
    return `rgba(${r}, ${g}, ${b}, ${c.stroke.a})`
  })
  return { background, backgroundCss: `rgb(${background.join(", ")})`, bands }
}
