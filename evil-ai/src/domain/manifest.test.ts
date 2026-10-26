import { describe, expect, it } from 'vitest'
import { buildManifest, slugify } from './manifest'

const defaults = { cooldownMs: 240000, placeholderMs: 7000 }

describe('video manifest', () => {
  it('returns placeholder feeds when the folder is empty', () => {
    const manifest = buildManifest({}, {}, defaults)
    expect(manifest.length).toBeGreaterThan(0)
    expect(manifest.every((entry) => entry.src === null && entry.durationMs === 7000)).toBe(true)
  })

  it('registers every supported file sorted by name and ignores the rest', () => {
    const manifest = buildManifest({
      '../../media/videos/zeta.webm': '/assets/zeta.webm',
      '../../media/videos/Alfa Pasillo.MP4': '/assets/alfa.mp4',
      '../../media/videos/LEEME.txt': '/assets/leeme.txt',
      '../../media/videos/clip.mov': '/assets/clip.mov',
    }, {}, defaults)
    expect(manifest.map((entry) => entry.id)).toEqual(['alfa-pasillo', 'zeta'])
    expect(manifest[0]).toMatchObject({ src: '/assets/alfa.mp4', mimeType: 'video/mp4', label: 'CAM 01 // ALFA PASILLO', weight: 1, cctv: true })
    expect(manifest[1].mimeType).toBe('video/webm')
  })

  it('applies overrides by file name', () => {
    const [entry] = buildManifest({ 'media/videos/sala.mp4': '/s.mp4' }, { 'sala.mp4': { label: 'CAM 07 // SALA', weight: 3, durationMs: 9000, cctv: false } }, defaults)
    expect(entry).toMatchObject({ id: 'sala', label: 'CAM 07 // SALA', weight: 3, durationMs: 9000, cctv: false, cooldownMs: 240000 })
  })

  it('keeps ids unique and ascii', () => {
    expect(slugify('Electrocución  #2.mp4')).toBe('electrocucion-2')
    const manifest = buildManifest({ 'a/caida.mp4': '1', 'a/Caída.webm': '2' }, {}, defaults)
    expect(new Set(manifest.map((entry) => entry.id)).size).toBe(2)
  })
})
