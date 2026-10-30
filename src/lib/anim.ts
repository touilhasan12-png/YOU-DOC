/**
 * DETERMINISTIC animation helpers.
 * HARD RULE: no Math.random(), no Date.now(), no CSS transitions/animations.
 * Every value is a pure function of the frame number.
 */
import {interpolate, spring} from 'remotion';
import {EASE, FPS} from '../theme/tokens';

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** fade-in only (no pulsation). Returns 0..1 */
export const fadeIn = (f: number, start: number, dur: number, ease = EASE.out) =>
  clamp(ease(clamp((f - start) / Math.max(1, dur))));

/** fade-in then fade-out window. Never loops. */
export const window01 = (f: number, start: number, dur: number, pad = 8, easeIn = EASE.out, easeOut = EASE.in) => {
  const a = fadeIn(f, start, pad, easeIn);
  const b = 1 - fadeIn(f, start + dur - pad, pad, easeOut);
  return clamp(Math.min(a, b));
};

/** One-shot spring (no infinite bounce). */
export const springIn = (f: number, start: number, fps = FPS, config = {damping: 200}) =>
  f <= start ? 0 : spring({frame: f - start, fps, config});

/** UI/panel slide - in/out only */
export const slideY = (f: number, start: number, dur: number, distance = 24) =>
  interpolate(window01(f, start, dur), [0, 1], [distance, 0]);

/** Determinstic pseudo-random, seeded. Never Math.random(). */
export const seeded = (i: number, seed = 1337) => {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** progress of a shot expressed in ms (for shot-budget assertions) */
export const shotProgress = (f: number, durFrames: number) => clamp(f / Math.max(1, durFrames));
