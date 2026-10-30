/**
 * GEO LAYER -- SVG based, d3-geo projections.
 * Why not MapLibre/deck.gl here (yet):
 *   - This sandbox has 1 GB RAM / no GPU -> WebGL/tiles = OOM risk.
 *   - SVG paths render deterministically, are pixel-crisp, and are ideal for
 *     cut-out / move / re-compose shots required by the shot budget.
 * MapLibre + deck.gl are reserved for the zoom/terrain shots that need them,
 * and they will run in GitHub Actions (4 vCPU / 16 GB), not here.
 *
 * Basemap source: Natural Earth (public domain)  --  NOT OSM tiles (bulk-scrape prohibited).
 */
import {geoNaturalEarth1, geoMercator, geoEquirectangular, geoPath, geoGraticule10} from 'd3-geo';
import type {GeoProjection} from 'd3-geo';

export type LngLat = [number, number];

export const PROJECTIONS = {
  /** equal-ish area world view - honest, editorial */
  world: () => geoNaturalEarth1().fitExtent([[0, 0], [100, 100]], {type: 'Sphere'} as never),
  /** for regional corridor views */
  mercator: () => geoMercator(),
  /** for latitude-comparable stats */
  equirect: () => geoEquirectangular(),
} as const;

/**
 * Build a projection fitted to a [minLng,minLat,maxLng,maxLat] bbox inside a w x h box.
 * Padding keeps labels inside safe area.
 */
export function fitted(p: GeoProjection, bbox: [number, number, number, number], box: [number, number], pad = 0) {
  const [w, h] = box;
  const [x0, y0, x1, y1] = bbox;
  return p.fitExtent(
    [[pad, pad], [w - pad, h - pad]],
    {type: 'Polygon', coordinates: [[[x0, y1], [x1, y1], [x1, y0], [x0, y0], [x0, y1]]]} as never,
  );
}

export const graticule = geoGraticule10();

export function makePath(p: GeoProjection) {
  return geoPath(p).context(null) as unknown as (o: unknown) => string;
}

/** Great-circle-ish sampled line between two points (for arcs / sea lanes) */
export function greatCircle(a: LngLat, b: LngLat, steps = 64): LngLat[] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const [lon1, lat1] = [toRad(a[0]), toRad(a[1])];
  const [lon2, lat2] = [toRad(b[0]), toRad(b[1])];
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2,
  ));
  if (d === 0) return [a, b];
  const out: LngLat[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const A = Math.sin((1 - t) * d) / Math.sin(d);
    const B = Math.sin(t * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    out.push([toDeg(Math.atan2(y, x)), toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))]);
  }
  return out;
}

/** Zoom a fitted projection by a factor around its own center. */
export function zoomed<T extends GeoProjection>(p: T, factor: number): T {
  return p.scale(p.scale() * factor) as T;
}

/** Shift projection so that lngLat lands exactly on the target pixel. */
export function centerOn<T extends GeoProjection>(p: T, lngLat: LngLat, target: [number, number]): T {
  const pt = p(lngLat);
  if (!pt) return p;
  const [tx, ty] = p.translate();
  return p.translate([tx + (target[0] - pt[0]), ty + (target[1] - pt[1])]) as T;
}

export const boxPoly = (b: [number, number, number, number]) =>
  ({type: 'Polygon', coordinates: [[[b[0], b[3]], [b[2], b[3]], [b[2], b[1]], [b[0], b[1]], [b[0], b[3]]]]} as never);
