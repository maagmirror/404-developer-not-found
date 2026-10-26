/**
 * Office material for the CAPTCHA and "Elige quién sobrevive" variants.
 *
 * Placeholders for now. To use real material, drop the image in `public/office/`
 * and set `photo` to its file name (e.g. `photo: 'escritorio-01.jpg'`). Entries
 * without `photo` keep showing the drawn placeholder.
 */

export interface DeskPhoto {
  id: string
  /** Shown as the evidence tag on the tile. */
  label: string
  photo?: string
}

export interface Developer {
  id: string
  name: string
  role: string
  photo?: string
}

/** CAPTCHA grid: exactly 9 desks (3 × 3). */
export const desks: DeskPhoto[] = Array.from({ length: 9 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0')
  return { id: `desk-${number}`, label: `ESCRITORIO ${number}` }
})

/** Two are picked at random per visit; add as many as you like. */
export const developers: Developer[] = [
  { id: 'dev-1', name: 'DESARROLLADOR 1', role: 'BACKEND' },
  { id: 'dev-2', name: 'DESARROLLADOR 2', role: 'FRONTEND' },
]

export const officePhotoUrl = (photo: string) => `${import.meta.env.BASE_URL}office/${photo}`
