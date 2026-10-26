import { useEffect } from 'react'
import type { VariantProps } from './types'

const threats = ['NO HACE FALTA QUE TERMINES.', 'YA SÉ CÓMO TE LLAMAS.', 'DEMASIADO LENTO.']

/** The interruption itself is the scare: straight to the final message with the flash. */
export function JumpscareVariant({ identity, onFinal }: VariantProps) {
  useEffect(() => {
    onFinal({ name: identity.name, threats, scare: true })
  }, [identity.name, onFinal])

  return null
}
