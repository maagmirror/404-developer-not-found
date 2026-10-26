import { forwardRef, type FormEvent } from 'react'
import { playKey, unlockAudio } from '../audio/sfx'

interface TerminalInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  frozen?: boolean
  maxLength?: number
  describedBy?: string
}

/** The red-bordered "> NAME█" box from the Lovable design, with key clicks. */
export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(function TerminalInput(
  { id, value, onChange, onSubmit, frozen = false, maxLength = 24, describedBy },
  ref,
) {
  // Monospace font: size the input to its content so the block cursor trails the text.
  const width = `calc(${Math.max(value.length, 1)} * (1ch + 0.1em))`

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!frozen) onSubmit?.()
  }

  return (
    <form onSubmit={submit} className="identity-form">
      <div
        className="input-box"
        onClick={(event) => (event.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus()}
      >
        <span className="prompt text-blood" aria-hidden="true">&gt;</span>
        <input
          ref={ref}
          id={id}
          value={value}
          style={{ width }}
          readOnly={frozen}
          onChange={(event) => {
            if (frozen) return
            unlockAudio()
            if (event.target.value.length > value.length) playKey()
            onChange(event.target.value)
          }}
          autoComplete="off"
          autoFocus
          spellCheck={false}
          maxLength={maxLength}
          aria-describedby={describedBy}
        />
        <span className="cursor blink" aria-hidden="true" />
      </div>
    </form>
  )
})
