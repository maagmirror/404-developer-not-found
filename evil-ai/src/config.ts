// Every timing of the installation lives here. All values are milliseconds.
export const timing = {
  // Ambient field between two events: a random gap inside this window.
  ambientGapMs: [18000, 40000] as const,
  // Face: glyphs converge, the face holds, then dissolves back into the field.
  face: { convergeMs: 3600, holdMs: 5200, dissolveMs: 3000 },
  // Signal cut before and after every video interlude.
  glitchMs: 700,
  // Chance that an event slot becomes a video when one is allowed.
  videoChance: 0.55,
  // Minimum time between the end of one video and the start of the next.
  videoMinIntervalMs: 70000,
  // Default cooldown per clip, so the same file does not come back too soon.
  videoCooldownMs: 240000,
  // Hard cap for a clip; a stuck or very long file is cut here.
  videoMaxMs: 45000,
  // Extra margin over the clip's own duration before the timeout fires.
  videoTimeoutMarginMs: 4000,
  // How long a placeholder feed stays on screen while there are no real clips.
  placeholderMs: 7000,
  // How early the next clip starts buffering.
  preloadLeadMs: 6000,
}

export type Timing = typeof timing

export const faceTotalMs = timing.face.convergeMs + timing.face.holdMs + timing.face.dissolveMs
