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
