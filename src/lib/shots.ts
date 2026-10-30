/**
 * SHOT LEDGER -- the anti-repetition system + the 3s budget, as code.
 * Every visual state in the film MUST be declared here with an id and a
 * fingerprint. scripts/shot_lint.py fails the build if:
 *   - any shot > MOTION.MAX_SHOT_MS
 *   - two shots share a fingerprint above the similarity threshold
 */
import {MOTION} from '../theme/tokens';

export type Shot = {
  id: string;
  scene: string;
  /** what the camera looks at */ place: string;
  /** zoom tier 1..5 */ zoom: number;
  /** visual layers present */ layers: string[];
  /** motion type: enter | pan | zoom | cut | hold */ motion: 'enter' | 'pan' | 'zoom' | 'cut' | 'hold';
  /** ms on screen */ durMs: number;
  /** reserved: appears at most once in the whole film */
  hero?: boolean;
};

export const fingerprint = (s: Shot) =>
  [s.place, `z${s.zoom}`, [...s.layers].sort().join('+'), s.motion].join('|');

export const shots: Shot[] = [
  // ---- HOOK (fast: 1.2-1.8s)
  {id: 'H01', scene: 'hook', place: 'world', zoom: 1, layers: ['land', 'graticule'], motion: 'zoom', durMs: 1700, hero: true},
  {id: 'H02', scene: 'hook', place: 'hormuz', zoom: 4, layers: ['land', 'marker'], motion: 'enter', durMs: 1400},
  {id: 'H03', scene: 'hook', place: 'malacca', zoom: 4, layers: ['land', 'marker'], motion: 'cut', durMs: 1300},
  {id: 'H04', scene: 'hook', place: 'world', zoom: 2, layers: ['land', 'arcs'], motion: 'pan', durMs: 1600},

  // ---- FRAME (calm: 2.5-3.0s)
  {id: 'F01', scene: 'frame', place: 'world', zoom: 2, layers: ['land', 'graticule', 'panel'], motion: 'hold', durMs: 2800},
  {id: 'F02', scene: 'frame', place: 'world', zoom: 2, layers: ['land', 'scores'], motion: 'enter', durMs: 2600},

  // ---- BODY (2.0-2.8s)
  {id: 'B01', scene: 'body', place: 'hormuz', zoom: 5, layers: ['land', 'marker', 'panel'], motion: 'zoom', durMs: 2400},
  {id: 'B02', scene: 'body', place: 'malacca', zoom: 5, layers: ['land', 'arcs', 'panel'], motion: 'pan', durMs: 2400},
  {id: 'B03', scene: 'body', place: 'babalmandeb', zoom: 5, layers: ['land', 'marker', 'arcs'], motion: 'enter', durMs: 2200},

  // ---- FINALE (1.5-2.0s)
  {id: 'Z01', scene: 'finale', place: 'world', zoom: 2, layers: ['land', 'ranking'], motion: 'enter', durMs: 1900},
  {id: 'Z02', scene: 'finale', place: 'world', zoom: 1, layers: ['land', 'ranking', 'markers'], motion: 'zoom', durMs: 1800},

  // ---- OUTRO (2.5-3.0s)
  {id: 'O01', scene: 'outro', place: 'world', zoom: 1, layers: ['land'], motion: 'hold', durMs: 2600},
];

export const assertShotBudget = () => {
  const bad = shots.filter((s) => s.durMs > MOTION.MAX_SHOT_MS);
  if (bad.length) throw new Error(`Shots over ${MOTION.MAX_SHOT_MS}ms: ${bad.map((b) => b.id).join(',')}`);
  const heroes = shots.filter((s) => s.hero);
  if (heroes.length > 1) throw new Error('Only one hero shot allowed');
  return true;
};
