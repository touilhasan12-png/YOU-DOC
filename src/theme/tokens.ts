/**
 * DESIGN TOKENS -- single source of truth.
 * Rule: no magic numbers anywhere in scenes. Everything reads from here.
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const COLORS = {
  // base (investigative / editorial dark)
  ink: '#06090F',
  ink2: '#0B1119',
  panel: 'rgba(10,17,26,0.72)',
  panelSolid: '#0A111A',
  // map surfaces
  ocean: '#0E1A28',   // ocean must read LIGHTER than land, otherwise water looks like a hole
  land: '#18222E',
  landHi: '#26323F',
  border: '#44586C',
  // signals
  accent: '#FFB020', // amber  -> the chokepoint marker
  accent2: '#2ED3C6', // teal   -> flow / trade
  hot: '#FF4D4D', // red    -> risk / conflict
  cool: '#4D8DFF', // blue   -> population / sea
  // type
  text: '#F2F5F8',
  textDim: '#95A3B4',
  textMute: '#5C6A7A',
} as const;

export const FONT = {
  display: 'Barlow Condensed',
  text: 'Inter',
  mono: 'JetBrains Mono',
} as const;

export const TYPE = {
  h1: {size: 108, weight: 700, tracking: '-0.02em'},
  h2: {size: 64, weight: 700, tracking: '-0.01em'},
  kicker: {size: 26, weight: 600, tracking: '0.18em'},
  body: {size: 30, weight: 400, tracking: '0em'},
  small: {size: 22, weight: 400, tracking: '0.02em'},
  numeral: {size: 190, weight: 700, tracking: '-0.04em'},
} as const;

/** Fixed safe areas. Nothing ever renders outside these. */
export const SAFE = {
  top: 72,
  bottom: 96,
  left: 96,
  right: 96,
} as const;

export const SAFE_W = WIDTH - SAFE.left - SAFE.right;
export const SAFE_H = HEIGHT - SAFE.top - SAFE.bottom;

/**
 * MOTION LAW (the user's constraints, encoded so they can be violated only on purpose)
 */
export const MOTION = {
  /** absolute maximum on-screen duration of a single visual state */
  MAX_SHOT_MS: 3000,
  /** motion never overshoots beyond this scale */
  MAX_SCALE_OVERSHOOT: 1.03,
  /** camera moves live between these (ms) */
  CAM_MIN_MS: 600,
  CAM_MAX_MS: 1400,
  /** horizontal pan speed cap, px per frame @1080p (anti-dizziness) */
  MAX_PAN_PX_PER_FRAME: 22,
  /** hard ban: no periodic oscillation of opacity/scale/glow */
  ALLOW_LOOPS: false,
  ALLOW_SHAKE: false,
  /** WCAG 2.3.1 */
  MAX_FLASHES_PER_SEC: 3,
} as const;

/** Easing library -- in/out only. Never ease-in-out oscillation. */
export type Ease = (t: number) => number;
export const EASE: Record<string, Ease> = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  linear: (t) => t,
};
