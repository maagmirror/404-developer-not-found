/**
 * Office material for the CAPTCHA variant and the person placeholder.
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

/** CAPTCHA grid: exactly 9 desks (3 × 3). */
export const desks: DeskPhoto[] = Array.from({ length: 9 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0')
  return { id: `desk-${number}`, label: `ESCRITORIO ${number}` }
})

/**
 * CAPTCHA video: a 4 s looping security-camera clip, cut into the 3 × 3 grid.
 * Lives in `public/media/`. Without it the grid shows the desk placeholders.
 */
export const captchaVideoUrl = `${import.meta.env.BASE_URL}media/captcha-loop.mp4`

export const officePhotoUrl = (photo: string) => `${import.meta.env.BASE_URL}office/${photo}`
