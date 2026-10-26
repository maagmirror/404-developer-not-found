import { useEffect } from 'react'
import type { VariantProps } from './types'

// The visitor was cut off mid-name, so these never use it.
const threats = ['NO HACE FALTA QUE TERMINES.', 'NO NECESITO TU NOMBRE.', 'DEMASIADO LENTO.']

/** The interruption itself is the scare: straight to the final message with the flash. */
export function JumpscareVariant({ onFinal }: VariantProps) {
  useEffect(() => {
    onFinal({ threats, scare: true })
  }, [onFinal])

  return null
}
