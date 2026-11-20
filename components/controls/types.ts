export type NumberControl = {
  type: "number"
  label: string
  min: number
  max: number
  step?: number
  default: number
}
export type BooleanControl = { type: "boolean"; label: string; default: boolean }
export type SelectControl<T extends string = string> = {
  type: "select"
  label: string
  options: readonly T[]
  default: T
}
/** A hue in degrees (0–360). Rendered as a hue slider; consumers build oklch() from it. */
export type HueControl = { type: "hue"; label: string; default: number }

export type Control = NumberControl | BooleanControl | SelectControl | HueControl
export type ControlSchema = Record<string, Control>

export type ControlValue<C extends Control> = C extends NumberControl | HueControl
  ? number
  : C extends BooleanControl
    ? boolean
    : C extends SelectControl<infer T>
      ? T
      : never

export type ControlValues<S extends ControlSchema> = { [K in keyof S]: ControlValue<S[K]> }

/** Identity helper that keeps literal types for select options. */
export function defineControls<const S extends ControlSchema>(schema: S): S {
  return schema
}
