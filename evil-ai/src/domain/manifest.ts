// Turns the files dropped in media/videos/ into a playlist. Without files it returns placeholder feeds.
export type VideoFit = 'contain' | 'cover'

export interface VideoEntry {
  id: string
  // Bundled URL of the clip, or null for a placeholder feed.
  src: string | null
  file: string
  label: string
  mimeType: string
  // Expected length; used for the timeout. Unknown clips fall back to the hard cap.
  durationMs: number | null
  weight: number
  cooldownMs: number
  fit: VideoFit
  // CCTV treatment (grayscale, grain, overlays). Turn off for clips that already look like CCTV.
  cctv: boolean
}

export type VideoOverride = Partial<Omit<VideoEntry, 'id' | 'src' | 'file'>>

const MIME_BY_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
}

export const VIDEO_EXTENSIONS = Object.keys(MIME_BY_EXTENSION)

export const fileName = (path: string) => path.split(/[\\/]/).pop() ?? path

export function slugify(name: string) {
  return name
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'clip'
}

const defaultLabel = (index: number, file: string) =>
  `CAM ${(index + 1).toString().padStart(2, '0')} // ${slugify(file).replace(/-/g, ' ').toUpperCase()}`

export const PLACEHOLDER_FEEDS = ['SALA DEV A', 'PASILLO NORTE', 'SALA DE SERVIDORES']

export function buildManifest(
  files: Record<string, string>,
  overrides: Record<string, VideoOverride>,
  defaults: { cooldownMs: number; placeholderMs: number },
): VideoEntry[] {
  const paths = Object.keys(files)
    .filter((path) => VIDEO_EXTENSIONS.includes(fileName(path).split('.').pop()?.toLowerCase() ?? ''))
    .sort((a, b) => fileName(a).localeCompare(fileName(b)))

  if (paths.length === 0) {
    return PLACEHOLDER_FEEDS.map((feed, index) => ({
      id: `placeholder-${index + 1}`,
      src: null,
      file: '',
      label: `CAM ${(index + 1).toString().padStart(2, '0')} // ${feed}`,
      mimeType: '',
      durationMs: defaults.placeholderMs,
      weight: 1,
      cooldownMs: defaults.cooldownMs,
      fit: 'contain',
      cctv: true,
    }))
  }

  const used = new Set<string>()
  return paths.map((path, index) => {
    const file = fileName(path)
    let id = slugify(file)
    while (used.has(id)) id = `${id}-${index + 1}`
    used.add(id)
    const extension = file.split('.').pop()!.toLowerCase()
    const override = overrides[file] ?? {}
    return {
      id,
      src: files[path],
      file,
      label: defaultLabel(index, file),
      mimeType: MIME_BY_EXTENSION[extension],
      durationMs: null,
      weight: 1,
      cooldownMs: defaults.cooldownMs,
      fit: 'contain' as const,
      cctv: true,
      ...override,
    }
  })
}
