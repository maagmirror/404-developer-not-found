export interface Visitor {
  id: string
  name: string
  aliases: string[]
  /** Reserved for future content without coupling it to recognition. */
  metadata?: Record<string, string>
  /** Reserved hook name only; no special behavior is executed in this version. */
  specialBehavior?: string
}

/**
 * The prepopulated database: people the terminal already "knows". Add one line per person,
 * e.g. `{ id: 'ana', name: 'Ana', aliases: ['Anita'] },` (aliases are optional nicknames).
 * Names typed at the terminal are added on top of these (stored in the browser).
 */
export const visitors: Visitor[] = []
