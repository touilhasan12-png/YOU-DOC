/**
 * VERTICAL FILM CONFIG -- 1080x1920, single source of truth for the picture.
 * Numbers that appear in more than one scene live here and nowhere else.
 */
export const V = {
  W: 1080,
  H: 1920,
  FPS: 30,
  /** the map plane overscans the frame so a camera move never exposes an edge.
   *  1.5 is the minimum that still covers 1920 px at a 22 deg tilt with a
   *  2000 px perspective (checked analytically, see docs/ART_NOTES.md). */
  OVERSCAN: 1.26,
  PERSPECTIVE: 2600,
  SAFE: {top: 118, bottom: 132, left: 66, right: 66},
} as const;

export const C = {
  ink: '#04070B',
  ink2: '#080D14',
  red: '#E8402F',
  red2: '#FF6B4A',
  amber: '#FFB020',
  teal: '#2ED3C6',
  white: '#F4F7FA',
  dim: '#A8B8C8',
  mute: '#5F7182',
  hair: 'rgba(150,185,215,0.30)',
} as const;

export const F = {
  display: 'Barlow Condensed',
  text: 'Inter',
  mono: 'JetBrains Mono',
} as const;

/** ease-out cubic, the only easing used for entrances (no oscillation) */
export const eo = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
export const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

/** linear-in, eased-out interpolation between two frames */
export const at = (f: number, f0: number, f1: number, a: number, b: number) =>
  a + (b - a) * eo((f - f0) / Math.max(1, f1 - f0));

export const appear = (f: number, f0: number, dur = 10) => clamp01((f - f0) / dur);
