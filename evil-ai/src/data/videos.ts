// Video playlist. Drop .mp4/.webm files into evil-ai/media/videos/ and restart `npm run dev`
// (or run `npm run build` again): every file is picked up automatically.
// With no files the interludes show placeholder feeds, so the full cycle can be rehearsed today.
import { timing } from '../config'
import { buildManifest, type VideoOverride } from '../domain/manifest'

const files = import.meta.glob('../../media/videos/*.{mp4,m4v,webm,ogv,MP4,M4V,WEBM,OGV}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

// Optional, by exact file name. Everything here can be left out.
//   label:      text of the CCTV overlay
//   durationMs: clip length; without it the clip is cut at timing.videoMaxMs at most
//   weight:     how often it is picked compared to the rest (default 1)
//   cooldownMs: minimum time before the same clip can play again
//   fit:        'contain' (whole frame, default) or 'cover' (fills the screen, crops)
//   cctv:       false to skip the grayscale and grain treatment
export const videoOverrides: Record<string, VideoOverride> = {
  // 'pasillo-colapso.mp4': { label: 'CAM 04 // PASILLO NORTE', durationMs: 12000, weight: 2 },
  // The clip already has CAM 03 burned in and its own CCTV treatment.
  'sala-operaciones.mp4': { label: 'SALA DE OPERACIONES // PISO 7', cctv: false },
}

export const videos = buildManifest(files, videoOverrides, {
  cooldownMs: timing.videoCooldownMs,
  placeholderMs: timing.placeholderMs,
})

export const usingPlaceholders = videos.every((video) => video.src === null)
