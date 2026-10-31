/**
 * PLATE GEOMETRY -- Web-Mercator, exact to the NASA plates.
 *
 * One camera model is shared by every scene:
 *   Cam = {lng, lat, across}   "`across` degrees of longitude fill the FRAME width"
 * The projection is computed ONCE per shot (memoised), never per frame; the
 * per-frame camera move is a CSS transform on a container that overscans the
 * frame. That keeps a 66 s film renderable and the motion perfectly smooth.
 *
 * The satellite plates in public/basemap/ were built by scripts/fetch_plate.py
 * as EXACT mercator rectangles, so an image can be placed with `plateRect()`
 * and it will align with the vector borders to the pixel at any zoom.
 */
import {geoMercator, geoPath, geoCentroid, geoGraticule10} from 'd3-geo';
import type {GeoProjection} from 'd3-geo';
import {landFC} from './world';
import LANDLOCKED from '../data/landlocked.json';
import PLATES from '../data/plates.json';

export type Cam = {lng: number; lat: number; across: number};
export type Plate = {id: string; bbox: [number, number, number, number]; size: [number, number]};

export const PLATE_MANIFEST = PLATES as unknown as Record<string, [[number, number, number, number], [number, number]]>;

const RAD = Math.PI / 180;
/** d3 mercator raw y -- identical to the spherical mercator used by the tiles */
export const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (Math.max(-85, Math.min(85, lat)) * RAD) / 2));

export const CL = LANDLOCKED as Array<{iso2: string; name: string; num: number; region: string; lng?: number; lat?: number}>;

export const REGION_OF: Record<string, string[]> = CL.reduce((acc, c) => {
  (acc[c.region] = acc[c.region] || []).push(c.iso2);
  return acc;
}, {} as Record<string, string[]>);

export const DOUBLE_LOCKED = ['uz', 'li'];

/** anchor point of every landlocked state, in lng/lat (degrees) */
export const ANCHOR: Record<string, [number, number]> = (() => {
  const out: Record<string, [number, number]> = {};
  const byIso = new Map<string, [number, number]>();
  for (const feat of landFC.features) {
    const num = Number((feat as {id?: string}).id);
    const c = CL.find((x) => x.num === num);
    if (!c) continue;
    const g = geoCentroid(feat as never) as [number, number];
    byIso.set(c.iso2, [g[0], g[1]]);
  }
  for (const c of CL) {
    if (c.lng !== undefined && c.lat !== undefined) out[c.iso2] = [c.lng, c.lat];
    else out[c.iso2] = byIso.get(c.iso2) ?? [0, 0];
  }
  return out;
})();

/**
 * Anchors that read better when nudged: either the geometric centroid falls in
 * an odd place (long thin or multi-part shapes) or the flag must not cover the
 * country's own outline. Values are DEGREES, so they behave at every zoom.
 */
export const ANCHOR_NUDGE: Record<string, [number, number]> = {
  kz: [0.6, -0.4],
  uz: [0.2, -0.2],
  mn: [0.4, 0.2],
  td: [0.4, -0.3],
  ne: [0.2, 0.1],
  ml: [-0.4, 0.2],
  et: [0.5, 0.1],
  bo: [-0.2, 0.2],
  np: [-1.2, -0.2],
  bt: [0.4, -0.2],
  la: [0.6, -0.3],
  az: [0.4, -0.6],
  am: [-0.8, -0.4],
  // the European cluster: micro-states pull out on leader lines, the big ones
  // shift so 34 px cards never stack on each other
  li: [2.9, 1.1],
  ch: [0.4, -1.7],
  lu: [-1.4, 1.5],
  ad: [-2.0, 1.4],
  sm: [2.1, 0.8],
  va: [1.3, -1.6],
  at: [1.6, 1.3],
  cz: [-1.5, 1.1],
  sk: [1.5, -1.1],
  hu: [0.1, -1.7],
  rs: [-1.9, 0.5],
  mk: [1.1, -0.8],
  md: [1.7, 0.6],
  by: [-1.0, 1.4],
  // Africa micro/close pairs
  rw: [-4.5, -0.6],
  bi: [3.6, 1.0],
  sz: [1.4, -1.0],
  ls: [-1.4, -0.9],
  mw: [0.6, 0.4],
  ss: [0.4, 0.3],
  // South America
  py: [0.6, -0.6],
};

export const anchorOf = (iso2: string): [number, number] => {
  const a = ANCHOR[iso2] ?? [0, 0];
  const n = ANCHOR_NUDGE[iso2] ?? [0, 0];
  return [a[0] + n[0], a[1] + n[1]];
};

export function makeProj(cam: Cam, frameW: number, offset: [number, number]): GeoProjection {
  const k = frameW / (cam.across * RAD);
  return geoMercator()
    .scale(k)
    .translate([offset[0] - k * cam.lng * RAD, offset[1] + k * mercY(cam.lat)]);
}

export type Carto = {
  proj: GeoProjection;
  path: (o: unknown) => string | null;
  graticule: string | null;
  /** iso2 -> svg path of the country */
  shapes: Record<string, string>;
  /** iso2 -> projected anchor px (card position) */
  pts: Record<string, [number, number]>;
  /** iso2 -> projected TRUE centroid px (leader lines start here) */
  ptsTrue: Record<string, [number, number]>;
  /** plate id -> {x,y,w,h} in svg px */
  rects: Record<string, {x: number; y: number; w: number; h: number}>;
  /** iso2 -> exact projected bounding box [x, y, w, h], from the projection itself
   *  (never parsed out of path text: that mis-pairs arc parameters) */
  boxes: Record<string, [number, number, number, number]>;
};

const cartoCache = new Map<string, Carto>();

/**
 * Build (once per camera) the whole vector layer + the exact rect of every
 * basemap plate inside the SVG coordinate system.
 */
export function carto(cam: Cam, frameW: number, offset: [number, number], plateIds: string[]): Carto {
  const key = `${cam.lng}|${cam.lat}|${cam.across}|${frameW}|${offset[0]}|${offset[1]}|${plateIds.join(',')}`;
  const hit = cartoCache.get(key);
  if (hit) return hit;

  const proj = makeProj(cam, frameW, offset);
  const gp = geoPath(proj);
  const path = (o: unknown) => gp(o as never) ?? null;

  const numToIso = new Map<number, string>();
  for (const c of CL) numToIso.set(c.num, c.iso2);

  const shapes: Record<string, string> = {};
  for (const feat of landFC.features) {
    const iso = numToIso.get(Number((feat as {id?: string}).id));
    if (!iso) continue;
    const d = path(feat);
    if (d) shapes[iso] = d;
  }

  const boxes: Record<string, [number, number, number, number]> = {};
  for (const feat of landFC.features) {
    const iso = numToIso.get(Number((feat as {id?: string}).id));
    if (!iso) continue;
    const b = gp.bounds(feat as never);
    if (!b) continue;
    boxes[iso] = [b[0][0], b[0][1], b[1][0] - b[0][0], b[1][1] - b[0][1]];
  }

  const pts: Record<string, [number, number]> = {};
  const ptsTrue: Record<string, [number, number]> = {};
  for (const c of CL) {
    const a = anchorOf(c.iso2);
    const p = proj(a as [number, number]);
    pts[c.iso2] = p ? [p[0], p[1]] : [0, 0];
    const t0 = ANCHOR[c.iso2] ?? a;
    const q = proj(t0 as [number, number]);
    ptsTrue[c.iso2] = q ? [q[0], q[1]] : [0, 0];
  }

  const rects: Record<string, {x: number; y: number; w: number; h: number}> = {};
  for (const id of plateIds) {
    const m = PLATE_MANIFEST[id];
    if (!m) continue;
    const [bbox] = m;
    const a = proj([bbox[0], bbox[3]]); // top-left  (minLng, maxLat)
    const b = proj([bbox[2], bbox[1]]); // bottom-right
    if (!a || !b) continue;
    rects[id] = {x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1]};
  }

  const out: Carto = {proj, path, graticule: path(geoGraticule10()), shapes, pts, ptsTrue, rects, boxes};
  cartoCache.set(key, out);
  return out;
}

/** great-circle arc as an SVG path, sampled */
export function arcPath(proj: GeoProjection, a: [number, number], b: [number, number], steps = 48): string {
  const pts: string[] = [];
  const d: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    d.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  for (const [lng, lat] of d) {
    const p = proj([lng, lat]);
    if (p) pts.push(`${pts.length ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`);
  }
  return pts.join(' ');
}

/** every landlocked iso2, in the canonical (alphabetical) order used everywhere */
export const ALL_ISO = CL.map((c) => c.iso2);
