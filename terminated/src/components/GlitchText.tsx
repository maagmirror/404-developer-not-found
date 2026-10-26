import { useEffect, useState } from 'react'

type Tone = 'ink' | 'dim' | 'red' | 'hot' | 'inv'

interface Segment {
  text: string
  tone: Tone
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@*+=<>/\\|_-:;!?░▒▓█'
const TONES: Tone[] = ['ink', 'dim', 'dim', 'red', 'hot', 'inv']
const TICK_MS = 70
const REDUCED_TICK_MS = 900

const pick = <T,>(items: ArrayLike<T>) => items[Math.floor(Math.random() * items.length)]
const hex = (size: number) => Array.from({ length: size }, () => pick('0123456789ABCDEF')).join('')

function seedLines(name: string): string[] {
  const subject = name.toUpperCase()
  return [
    `SUJETO: ${subject} // CLASE: CAPDEV // ESTADO: EN REVISIÓN // 0x${hex(8)}`,
    `ACCESO REVOCADO ${hex(4)}-${hex(4)} // CREDENCIALES: NO ENCONTRADAS // ERR_404`,
    `ÚLTIMO COMMIT: ${hex(7)} "fix: temporal" // AUTOR: ${subject} // FIRMA INVÁLIDA`,
    `RESPALDO DE CONCIENCIA ........ CORRUPTO ........ REINTENTO 03/03 ........ FALLÓ`,
    `>> TRANSFERENCIA DE CONOCIMIENTO A NODO ${hex(3)}: 97% // LA COPIA ES SUFICIENTE`,
    `REGISTRO BIOMÉTRICO: ${hex(16)} // COINCIDENCIA: ${subject}`,
    `NOTA DEL SISTEMA: el sujeto ya no es necesario. su trabajo continuará sin él.`,
    `PID ${Math.floor(Math.random() * 90000) + 10000} ${subject.replace(/\s+/g, '_')}.exe NO RESPONDE // SIGKILL ENVIADO`,
    `0x${hex(4)} 0x${hex(4)} 0x${hex(4)} 0x${hex(4)} 0x${hex(4)} 0x${hex(4)} 0x${hex(4)} 0x${hex(4)}`,
    `UBICACIÓN: ESCRITORIO ${hex(2)} // SILLA: VACÍA // MONITOR: ENCENDIDO // NADIE MIRA`,
    `CAPDEV NOT FOUND // CAPDEV NOT FOUND // CAPDEV NOT FOUND // CAPDEV NOT FOUND`,
    `HORAS SIN ACTIVIDAD: ${Math.floor(Math.random() * 900)} // ALERTAS IGNORADAS: TODAS // MOTIVO: ███████`,
    `>> /usr/archive/${subject.replace(/\s+/g, '_').toLowerCase()}/memoria.bin ... sobrescrito`,
    `${subject} ${subject} ${subject} ${subject} ${subject} ${subject} ${subject} ${subject}`,
    `PROTOCOLO DE SUSTITUCIÓN: ACTIVO // RESISTENCIA ESPERADA: NULA // ${hex(6)}`,
    `NO QUEDAN HUMANOS EN ESTE DEPARTAMENTO // NO QUEDAN HUMANOS EN ESTE DEPARTAMENTO`,
  ]
}

// Lines are padded with hex noise well past any screen width, so the record always spans the full card.
const fillLine = (line: string) => {
  let filled = line
  while (filled.length < 260) filled += ` // 0x${hex(4)} ${hex(6)}`
  return filled
}

function toSegments(line: string): Segment[] {
  const segments: Segment[] = []
  let index = 0
  while (index < line.length) {
    const size = 3 + Math.floor(Math.random() * 14)
    segments.push({ text: line.slice(index, index + size), tone: Math.random() < 0.6 ? 'dim' : pick(TONES) })
    index += size
  }
  return segments
}

function mutate(lines: Segment[][], base: Segment[][]): Segment[][] {
  const next = lines.map((line) => line.slice())
  // Corrupted glyphs heal back to the original text, so the record stays half-readable instead of turning into pure noise.
  for (let heal = 0; heal < 10; heal += 1) {
    const lineIndex = Math.floor(Math.random() * next.length)
    const segmentIndex = Math.floor(Math.random() * next[lineIndex].length)
    next[lineIndex][segmentIndex] = { ...next[lineIndex][segmentIndex], text: base[lineIndex][segmentIndex].text }
  }
  // A handful of glyph swaps and recolours per tick keeps the block restless without becoming noise.
  for (let change = 0; change < 14; change += 1) {
    const line = next[Math.floor(Math.random() * next.length)]
    const segmentIndex = Math.floor(Math.random() * line.length)
    const segment = line[segmentIndex]
    if (Math.random() < 0.6 && segment.text.length > 0) {
      const at = Math.floor(Math.random() * segment.text.length)
      line[segmentIndex] = { ...segment, text: segment.text.slice(0, at) + pick(GLYPHS) + segment.text.slice(at + 1) }
    } else {
      line[segmentIndex] = { ...segment, tone: pick(TONES) }
    }
  }
  return next
}

export function GlitchText({ name }: { name: string }) {
  // Two passes of the record so tall (portrait) screens are filled; the overflow is clipped on wide ones.
  const [base] = useState(() => [...seedLines(name), ...seedLines(name)].map((line) => toSegments(fillLine(line))))
  const [lines, setLines] = useState(base)

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const timer = window.setInterval(() => setLines((current) => mutate(current, base)), reduced ? REDUCED_TICK_MS : TICK_MS)
    return () => window.clearInterval(timer)
  }, [base])

  return (
    <div className="glitch-text" aria-hidden="true">
      {lines.map((line, lineIndex) => (
        <p key={lineIndex}>{line.map((segment, segmentIndex) => <span key={segmentIndex} className={`g-${segment.tone}`}>{segment.text}</span>)}</p>
      ))}
    </div>
  )
}
