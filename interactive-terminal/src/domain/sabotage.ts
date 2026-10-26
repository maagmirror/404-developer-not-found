/** Letters that look or sit close to each other, so a swap reads like the visitor's own typo. */
const lookalikes: Record<string, string> = {
  A: 'SQÁ', C: 'XVG', N: 'MBH', E: 'RWÉ', L: 'KIÑ', R: 'TEF', S: 'AD', T: 'RY', G: 'CF',
  I: 'LOU', O: 'P0I', M: 'N', P: 'O', D: 'SF', U: 'IY', V: 'CB', B: 'VN', F: 'DG',
}

type Random = () => number

const nearby = (char: string, random: Random) => {
  const options = lookalikes[char.toUpperCase()] ?? (char.toUpperCase() === 'X' ? 'Z' : 'X')
  return options[Math.floor(random() * options.length)]
}

/**
 * Subtly corrupts what the visitor typed: replace a letter with a lookalike, swap two
 * neighbours, drop a letter or double one. Only touches text that already exists.
 */
export function sabotage(value: string, random: Random = Math.random): string {
  if (value.length < 2) return value
  const chars = [...value]
  const at = Math.floor(random() * (chars.length - 1))
  const kind = Math.floor(random() * 4)

  if (kind === 0) chars[at] = nearby(chars[at], random)
  else if (kind === 1) [chars[at], chars[at + 1]] = [chars[at + 1], chars[at]]
  else if (kind === 2) chars.splice(at, 1)
  else chars.splice(at, 0, chars[at])

  const result = chars.join('')
  // A swap of identical letters changes nothing; fall back to a lookalike.
  return result === value ? value.slice(0, -1) + nearby(value[value.length - 1], random) : result
}

/** Neighbouring keys on a Spanish QWERTY keyboard. */
const keyboardNeighbours: Record<string, string> = {
  Q: 'WA', W: 'QES', E: 'WRD', R: 'ETF', T: 'RYG', Y: 'TUH', U: 'YIJ', I: 'UOK', O: 'IPL', P: 'OÑ',
  A: 'QSZ', S: 'ADW', D: 'SFE', F: 'DGR', G: 'FHT', H: 'GJY', J: 'HKU', K: 'JLI', L: 'KÑO', Ñ: 'LP',
  Z: 'XA', X: 'ZCS', C: 'XVD', V: 'CBF', B: 'VNG', N: 'BMH', M: 'NJ',
}

/**
 * Corrupts the key the visitor just typed (the last character of `value`): it becomes a
 * neighbouring key, gets a stray space in front of it, or comes out doubled.
 */
export function sabotageKeystroke(value: string, random: Random = Math.random): string {
  const typed = value.slice(-1)
  if (!typed.trim()) return value
  const before = value.slice(0, -1)
  const kind = Math.floor(random() * 3)

  if (kind === 1) return `${before} ${typed}`
  if (kind === 2) return `${value}${typed}`
  const options = keyboardNeighbours[typed.toUpperCase()]
  if (!options) return `${value}${typed}`
  const swapped = options[Math.floor(random() * options.length)]
  return before + (typed === typed.toLowerCase() ? swapped.toLowerCase() : swapped)
}
