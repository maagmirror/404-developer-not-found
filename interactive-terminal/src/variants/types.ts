import type { Visitor } from '../data/visitors'

/** What a variant hands over when its sequence is done: the final cryptic message. */
export interface FinalRequest {
  /** Shown above the message, only when the visitor's name is known. */
  name?: string
  /** One is picked at random. */
  threats: string[]
  /** Full-screen jumpscare flash before the message. */
  scare?: boolean
}

/** What the "¿QUIÉN ERES?" prompt learned before handing over to the variant. */
export interface Identity {
  /** Recognized visitor (seeded or remembered). */
  visitor?: Visitor
  /** Best known name: the visitor's, or what was typed and submitted. */
  name?: string
}

export interface VariantProps {
  identity: Identity
  onFinal: (request: FinalRequest) => void
}

export type VariantId =
  | 'anticipado'
  | 'jumpscare'
  | 'cuenta'
  | 'facial'
  | 'captcha'
  | 'sobrevive'

/**
 * How a variant takes over the "¿QUIÉN ERES?" input:
 * - interrupt: cuts the typing after a few letters.
 * - recognize: lets the visitor type until the name is recognized (or Enter).
 * - submit: lets the visitor finish and press Enter.
 */
export type Trigger = 'recognize' | 'interrupt' | 'submit'

export const pickOne = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]
