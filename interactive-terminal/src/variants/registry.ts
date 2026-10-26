import type { Trigger, VariantId } from './types'

export interface VariantInfo {
  id: VariantId
  label: string
  trigger: Trigger
  /** Skip the glitch burst when interrupting (the jumpscare must be instant). */
  instant?: boolean
}

/** Order matters: Alt+1..7 force the variant at that position. */
export const variants: VariantInfo[] = [
  { id: 'anticipado', label: 'RECONOCIMIENTO ANTICIPADO', trigger: 'recognize' },
  { id: 'jumpscare', label: 'JUMPSCARE AL ESCRIBIR', trigger: 'interrupt', instant: true },
  { id: 'cuenta', label: 'CUENTA REGRESIVA', trigger: 'interrupt' },
  { id: 'emergencia', label: 'PROTOCOLO DE EMERGENCIA', trigger: 'interrupt' },
  { id: 'facial', label: 'RECONOCIMIENTO FACIAL', trigger: 'interrupt' },
  { id: 'captcha', label: 'CAPTCHA MACABRO', trigger: 'submit' },
  { id: 'sobrevive', label: 'ELIGE QUIÉN SOBREVIVE', trigger: 'submit' },
]

export const variantInfo = (id: VariantId): VariantInfo =>
  variants.find((variant) => variant.id === id) ?? variants[0]

const isVariantId = (value: string | null): value is VariantId =>
  variants.some((variant) => variant.id === value)

/**
 * Shuffle bag: every variant plays once, in random order, before any repeats,
 * and a new round never starts with the variant that just played.
 */
export function createVariantPicker(random: () => number = Math.random) {
  let bag: VariantId[] = []
  let last: VariantId | null = null

  return (): VariantId => {
    if (bag.length === 0) {
      bag = variants.map((variant) => variant.id)
      for (let i = bag.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1))
        ;[bag[i], bag[j]] = [bag[j], bag[i]]
      }
      if (bag.length > 1 && bag[bag.length - 1] === last) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]]
    }
    last = bag.pop() as VariantId
    return last
  }
}

/** `?v=cuenta` pins one variant for every visit (handy for rehearsals). */
export function pinnedVariantFromUrl(search: string): VariantId | null {
  const value = new URLSearchParams(search).get('v')
  return isVariantId(value) ? value : null
}
