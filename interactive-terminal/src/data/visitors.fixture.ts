import type { Visitor } from './visitors'

/** Example visitors for the tests only; the real database lives in visitors.ts. */
export const exampleVisitors: Visitor[] = [
  { id: 'aster', name: 'Aster', aliases: [] },
  { id: 'boreal', name: 'Boreal', aliases: [] },
  { id: 'marble', name: 'Marble', aliases: ['Slate'] },
  { id: 'marrow', name: 'Marrow', aliases: ['Veil'] },
  { id: 'ember', name: 'Ember', aliases: [] },
  { id: 'flux', name: 'Flux', aliases: [] },
]
