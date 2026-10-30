/** Map label registry. Positions are hand-placed so nothing collides at any zoom tier. */
export type MapLabel = {t: string; lngLat: [number, number]; kind: 'sea' | 'country'; size?: number};

export const labels: MapLabel[] = [
  {t: 'IRAN', lngLat: [54.0, 29.6], kind: 'country'},
  {t: 'OMAN', lngLat: [56.6, 22.6], kind: 'country'},
  {t: 'U.A.E.', lngLat: [54.6, 24.2], kind: 'country'},
  {t: 'SAUDI ARABIA', lngLat: [49.5, 24.6], kind: 'country'},
  {t: 'PERSIAN GULF', lngLat: [51.4, 27.4], kind: 'sea'},
  {t: 'GULF OF OMAN', lngLat: [58.6, 25.0], kind: 'sea'},
  {t: 'MALACCA', lngLat: [100.6, 4.4], kind: 'sea'},
  {t: 'SUMATRA', lngLat: [101.6, -1.2], kind: 'country'},
  {t: 'MALAYSIA', lngLat: [102.4, 4.0], kind: 'country'},
  {t: 'RED SEA', lngLat: [40.0, 18.0], kind: 'sea'},
  {t: 'YEMEN', lngLat: [45.5, 15.4], kind: 'country'},
  {t: 'DJIBOUTI', lngLat: [42.4, 11.9], kind: 'country'},
  {t: 'PANAMA', lngLat: [-80.4, 8.6], kind: 'country'},
  {t: 'CARIBBEAN SEA', lngLat: [-77.0, 14.0], kind: 'sea'},
];

export const labelsIn = (bbox: [number, number, number, number]) =>
  labels.filter(
    (l) => l.lngLat[0] >= bbox[0] && l.lngLat[0] <= bbox[2] && l.lngLat[1] >= bbox[1] && l.lngLat[1] <= bbox[3],
  );
