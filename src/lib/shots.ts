/**
 * SHOT LEDGER -- the film as data.
 * Machine-enforced rules (scripts/shot_lint.py):
 *   - no shot longer than 3000 ms
 *   - no two shots may share a fingerprint (anti-repetition)
 *   - exactly one hero shot
 *
 * CINEMATIC RULE (new, from user feedback): a shot is never a "static card".
 * Every shot carries a continuous camera move (push/pull/pan) so that cuts are
 * rare, motivated, and never felt. Cuts happen only when the camera has reached
 * its limit.
 */
import {MOTION} from '../theme/tokens';

export type Shot = {
  id: string;
  scene: string;
  region: string;
  /** camera: z0 -> z1 (push/pull) and focal move f0 -> f1 */
  cam: {z0: number; z1: number; f0: [number, number]; f1: [number, number]};
  /** what is drawn on top of the plate */ layers: string[];
  durMs: number;
  hero?: boolean;
};

export const fingerprint = (s: Shot) =>
  [s.region, `z${s.cam.z0.toFixed(2)}>${s.cam.z1.toFixed(2)}`,
   `f${s.cam.f0.map((v) => v.toFixed(2)).join(',')}>${s.cam.f1.map((v) => v.toFixed(2)).join(',')}`,
   [...s.layers].sort().join('+')].join('|');

export const shotFrames = (s: Shot, fps: number) => Math.round((s.durMs / 1000) * fps);

export const shots: Shot[] = [
  // ---------- HOOK : fast, 1.4-1.9 s, camera never still
  {id: 'H01', scene: 'hook', region: 'world', durMs: 1900,
   cam: {z0: 1.14, z1: 1.24, f0: [0.50, 0.46], f1: [0.56, 0.42]}, layers: ['title'], hero: true},
  {id: 'H02', scene: 'hook', region: 'hormuz', durMs: 1600,
   cam: {z0: 1.14, z1: 1.24, f0: [0.62, 0.55], f1: [0.60, 0.50]}, layers: ['marker', 'labels']},
  {id: 'H03', scene: 'hook', region: 'malacca', durMs: 1500,
   cam: {z0: 1.14, z1: 1.24, f0: [0.44, 0.50], f1: [0.40, 0.54]}, layers: ['marker', 'labels']},
  {id: 'H04', scene: 'hook', region: 'babalmandeb', durMs: 1500,
   cam: {z0: 1.14, z1: 1.24, f0: [0.52, 0.62], f1: [0.48, 0.58]}, layers: ['marker', 'labels']},

  // ---------- FRAME : slower, camera continuous
  {id: 'F01', scene: 'frame', region: 'world', durMs: 2800,
   cam: {z0: 1.14, z1: 1.24, f0: [0.46, 0.48], f1: [0.52, 0.44]}, layers: ['panel', 'scores']},
  {id: 'F02', scene: 'frame', region: 'world', durMs: 2600,
   cam: {z0: 1.16, z1: 1.32, f0: [0.55, 0.44], f1: [0.62, 0.40]}, layers: ['scores']},

  // ---------- BODY : one shot per chokepoint, all with moves
  {id: 'B01', scene: 'body', region: 'hormuz', durMs: 2400,
   cam: {z0: 1.14, z1: 1.26, f0: [0.60, 0.54], f1: [0.57, 0.48]}, layers: ['marker', 'flow', 'labels']},
  {id: 'B02', scene: 'body', region: 'malacca', durMs: 2400,
   cam: {z0: 1.14, z1: 1.28, f0: [0.45, 0.50], f1: [0.42, 0.56]}, layers: ['marker', 'flow', 'labels']},
  {id: 'B03', scene: 'body', region: 'babalmandeb', durMs: 2300,
   cam: {z0: 1.14, z1: 1.27, f0: [0.50, 0.60], f1: [0.46, 0.54]}, layers: ['marker', 'flow', 'labels']},
  {id: 'B04', scene: 'body', region: 'panama', durMs: 2200,
   cam: {z0: 1.14, z1: 1.30, f0: [0.50, 0.52], f1: [0.46, 0.46]}, layers: ['marker', 'labels']},
  {id: 'B05', scene: 'body', region: 'gibraltar', durMs: 2100,
   cam: {z0: 1.14, z1: 1.30, f0: [0.48, 0.50], f1: [0.44, 0.54]}, layers: ['marker', 'labels']},
  {id: 'B06', scene: 'body', region: 'bosporus', durMs: 2100,
   cam: {z0: 1.14, z1: 1.32, f0: [0.52, 0.50], f1: [0.48, 0.46]}, layers: ['marker', 'labels']},
  {id: 'B07', scene: 'body', region: 'danish', durMs: 2000,
   cam: {z0: 1.14, z1: 1.32, f0: [0.46, 0.50], f1: [0.52, 0.46]}, layers: ['marker', 'labels']},

  // ---------- FINALE : pull back, ranking builds
  {id: 'Z01', scene: 'finale', region: 'world', durMs: 2900,
   cam: {z0: 1.30, z1: 1.40, f0: [0.56, 0.44], f1: [0.50, 0.48]}, layers: ['ranking']},
  {id: 'Z02', scene: 'finale', region: 'world', durMs: 2400,
   cam: {z0: 1.14, z1: 1.24, f0: [0.50, 0.48], f1: [0.50, 0.50]}, layers: ['ranking', 'markers']},

  // ---------- OUTRO
  {id: 'O01', scene: 'outro', region: 'world', durMs: 2600,
   cam: {z0: 1.14, z1: 1.24, f0: [0.50, 0.50], f1: [0.52, 0.48]}, layers: ['cta']},
];

export const assertShotBudget = () => {
  const bad = shots.filter((s) => s.durMs > MOTION.MAX_SHOT_MS);
  if (bad.length) throw new Error(`Shots over ${MOTION.MAX_SHOT_MS}ms: ${bad.map((b) => b.id).join(',')}`);
  if (shots.filter((s) => s.hero).length !== 1) throw new Error('Exactly one hero shot required');
  return true;
};

export const TOTAL_MS = shots.reduce((a, s) => a + s.durMs, 0);
