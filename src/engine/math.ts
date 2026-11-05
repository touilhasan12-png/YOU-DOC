import * as THREE from 'three';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function invLerp(a: number, b: number, v: number): number {
  if (Math.abs(b - a) < 1e-9) return 0;
  return clamp((v - a) / (b - a), 0, 1);
}

export function smoothstep(e0: number, e1: number, x: number): number {
  const t = invLerp(e0, e1, x);
  return t * t * (3 - 2 * t);
}

export function smootherstep(e0: number, e1: number, x: number): number {
  const t = invLerp(e0, e1, x);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function easeInOutCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Analytical closed-form damped harmonic spring step (0 -> 1 with overshoot).
 * Pure function of elapsed time dt >= 0 (100% deterministic across shards).
 */
export function dampedSpring(dt: number, freq = 14.0, damping = 5.5): number {
  if (dt <= 0) return 0;
  return 1.0 - Math.exp(-damping * dt) * Math.cos(freq * dt);
}

/**
 * Deterministic Halton sequence in [-0.5, 0.5] for sub-pixel jittered AA.
 */
export function halton(index: number, base: number): number {
  let result = 0;
  let f = 1 / base;
  let i = index + 1;
  while (i > 0) {
    result += f * (i % base);
    i = Math.floor(i / base);
    f /= base;
  }
  return result - 0.5;
}

export function evalSplineVec3(
  points: THREE.Vector3[],
  u: number,
  target = new THREE.Vector3()
): THREE.Vector3 {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.45);
  return curve.getPoint(clamp(u, 0, 1), target);
}
