/** Region registry -- single source of truth for the real-satellite basemap crops. */
export type Region = {id: string; bbox: [number, number, number, number]; file: string};

/** bbox order: [minLng, minLat, maxLng, maxLat] -- must match scripts/fetch_basemap.py */
export const REGIONS: Record<string, Region> = {
  world: {id: 'world', bbox: [-180, -60, 180, 78], file: 'world.jpg'},
  hormuz: {id: 'hormuz', bbox: [47, 22, 63, 31.5], file: 'hormuz.jpg'},
  malacca: {id: 'malacca', bbox: [94, -6, 108, 12], file: 'malacca.jpg'},
  babalmandeb: {id: 'babalmandeb', bbox: [31, 8, 50, 34], file: 'babalmandeb.jpg'},
  panama: {id: 'panama', bbox: [-92, -2, -67, 20], file: 'panama.jpg'},
  gibraltar: {id: 'gibraltar', bbox: [-14, 30, 4, 42], file: 'gibraltar.jpg'},
  bosporus: {id: 'bosporus', bbox: [19, 35, 38, 47], file: 'bosporus.jpg'},
  danish: {id: 'danish', bbox: [3, 51, 19, 60], file: 'danish.jpg'},
};

export const regionOf = (id: string): Region => REGIONS[id] ?? REGIONS.world;
