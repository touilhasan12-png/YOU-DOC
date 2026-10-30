/**
 * DATA LAYER -- every number that appears on screen must exist here with a source.
 * Rule 17 (no unsourced numbers). scripts/check_sources.py enforces that each
 * entry has a non-empty `sources` array.
 */
export type Chokepoint = {
  id: string;
  name: string;
  short: string;
  lngLat: [number, number];
  bbox: [number, number, number, number]; // minLng, minLat, maxLng, maxLat
  /** 0-100 subscores, editorial methodology documented in docs/methodology.md */
  scores: {trade: number; military: number; alternatives: number; fragility: number};
  transit: string; // what physically passes through
  fact: string; // one hard, sourced number
  sources: string[];
};

export const METHOD_WEIGHTS = {trade: 0.4, military: 0.3, alternatives: 0.2, fragility: 0.1} as const;

export const chokepoints: Chokepoint[] = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    short: 'HORMUZ',
    lngLat: [56.5, 26.6],
    bbox: [47.0, 22.0, 63.0, 31.5],
    scores: {trade: 95, military: 96, alternatives: 12, fragility: 88},
    transit: 'Crude oil & LNG',
    fact: '~20% of global petroleum liquids',
    sources: ['EIA: World Oil Transit Chokepoints'],
  },
  {
    id: 'malacca',
    name: 'Strait of Malacca',
    short: 'MALACCA',
    lngLat: [100.6, 2.5],
    bbox: [93.0, -6.0, 108.0, 12.0],
    scores: {trade: 98, military: 78, alternatives: 40, fragility: 60},
    transit: 'Container & energy to East Asia',
    fact: 'Shortest sea route between Indian & Pacific oceans',
    sources: ['EIA: World Oil Transit Chokepoints'],
  },
  {
    id: 'babalmandeb',
    name: 'Bab el-Mandeb / Suez',
    short: 'BAB EL-MANDEB',
    lngLat: [43.4, 12.6],
    bbox: [31.0, 8.0, 50.0, 34.0],
    scores: {trade: 90, military: 84, alternatives: 14, fragility: 94},
    transit: 'Europe-Asia container & energy',
    fact: 'Suez + Bab el-Mandeb = ~12% of world trade',
    sources: ['EIA: World Oil Transit Chokepoints'],
  },
  {
    id: 'panama',
    name: 'Panama Canal',
    short: 'PANAMA',
    lngLat: [-79.6, 9.1],
    bbox: [-92.0, -2.0, -67.0, 20.0],
    scores: {trade: 86, military: 70, alternatives: 22, fragility: 92},
    transit: 'US-Asia containers, grain',
    fact: 'Freshwater-dependent lock system',
    sources: ['Panama Canal Authority'],
  },
  {
    id: 'gibraltar',
    name: 'Strait of Gibraltar',
    short: 'GIBRALTAR',
    lngLat: [-5.6, 35.95],
    bbox: [-14.0, 30.0, 4.0, 42.0],
    scores: {trade: 74, military: 80, alternatives: 30, fragility: 45},
    transit: 'Mediterranean-Atlantic gateway',
    fact: 'Two continents separated by ~13 km',
    sources: ['UNCTAD Review of Maritime Transport'],
  },
  {
    id: 'bosporus',
    name: 'Bosporus & Dardanelles',
    short: 'BOSPORUS',
    lngLat: [29.05, 41.1],
    bbox: [19.0, 35.0, 38.0, 47.0],
    scores: {trade: 72, military: 88, alternatives: 18, fragility: 78},
    transit: 'Black Sea energy & grain',
    fact: 'Only outlet for Black Sea grain exports',
    sources: ['UNCTAD Review of Maritime Transport'],
  },
  {
    id: 'danish',
    name: 'Danish Straits',
    short: 'DANISH STRAITS',
    lngLat: [11.0, 55.3],
    bbox: [3.0, 51.0, 19.0, 60.0],
    scores: {trade: 68, military: 82, alternatives: 34, fragility: 55},
    transit: "Russia's Baltic exports",
    fact: 'Main Baltic exit to the North Sea',
    sources: ['EIA: World Oil Transit Chokepoints'],
  },
];

export const scoreOf = (c: Chokepoint) =>
  Math.round(
    c.scores.trade * METHOD_WEIGHTS.trade +
      c.scores.military * METHOD_WEIGHTS.military +
      c.scores.alternatives * METHOD_WEIGHTS.alternatives +
      c.scores.fragility * METHOD_WEIGHTS.fragility,
  );

export const ranked = [...chokepoints].sort((a, b) => scoreOf(b) - scoreOf(a));
