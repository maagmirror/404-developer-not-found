// Every timing of the installation lives here. All values are milliseconds.
// The show is idle -> event -> idle, with the four events dealt from a shuffled deck.
export const timing = {
  // Idle field between two events: a random gap inside this window.
  ambientGapMs: [12000, 24000] as const,
  // First event after boot, so whoever turns the monitor on sees the system work.
  firstEventMs: 6000,
  // Short signal glitch when a face appears and when it dissolves.
  blipMs: 280,
  // Signal cut before and after a video.
  glitchMs: 700,

  // 1. The face leans in from a side, tilted, and stares.
  peek: { convergeMs: 900, holdMs: 3800, dissolveMs: 700, slideInMs: 900, slideOutMs: 700 },
  // 2. The face forms in the centre, trembling, eyes darting everywhere.
  stare: { convergeMs: 1400, holdMs: 6000, dissolveMs: 1000 },
  // 4. The field speeds up, glitches, runs backwards, then forwards again. Each step: how long,
  // target rows per second (negative = down, reached over the first part of the step), glitch amount.
  rush: [
    { ms: 500, speed: 6, glitch: 0.05 },
    { ms: 1300, speed: 95, glitch: 0.25 },
    { ms: 350, speed: 95, glitch: 0.9 },
    { ms: 1000, speed: -75, glitch: 0.45 },
    { ms: 320, speed: -75, glitch: 0.9 },
    { ms: 1200, speed: 95, glitch: 0.3 },
    { ms: 800, speed: 3, glitch: 0.05 },
  ],
  // Pupils jump to a new spot about this often while darting.
  gazeJumpMs: 110,

  // 3. Video beside a "now playing" line. Default cooldown per clip so the same file does not come back too soon.
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
