export interface Visitor {
  id: string
  name: string
  aliases: string[]
  /** Reserved for future content without coupling it to recognition. */
  metadata?: Record<string, string>
  /** Reserved hook name only; no special behavior is executed in this version. */
  specialBehavior?: string
}

export const visitors: Visitor[] = [
  { id: 'aster', name: 'Aster', aliases: [] },
  { id: 'boreal', name: 'Boreal', aliases: [] },
  { id: 'marble', name: 'Marble', aliases: ['Slate'] },
  { id: 'marrow', name: 'Marrow', aliases: ['Veil'] },
  { id: 'ember', name: 'Ember', aliases: [] },
  { id: 'flux', name: 'Flux', aliases: [] },
]
