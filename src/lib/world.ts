/**
 * World geometry loader.
 * Source: world-atlas (Natural Earth 1:50m, public domain) -> topojson -> geojson.
 * Baked into the bundle at build time => deterministic, offline, no tile scraping.
 */
import {feature} from 'topojson-client';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - JSON module
import topo from 'world-atlas/countries-50m.json';

const fc = feature(topo as never, (topo as never as {objects: {countries: never}}).objects.countries) as never as {
  type: 'FeatureCollection';
  features: Array<{type: 'Feature'; id?: string; properties: {name?: string}; geometry: unknown}>;
};

export const worldFeatures = fc.features;
export const landFC = fc;

/** Rough country centroid lookup by name (used for labels only). */
export function featureByName(n: string) {
  return worldFeatures.find((f) => (f.properties?.name ?? '').toLowerCase() === n.toLowerCase());
}
