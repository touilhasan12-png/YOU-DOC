import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, EASE} from '../theme/tokens';
import {clamp} from '../lib/anim';
import {regionOf} from '../lib/regions';
import type {LngLat} from '../lib/geo';

/**
 * REAL SATELLITE BASEMAP -- NASA GIBS Blue Marble Shaded Relief + Bathymetry.
 * Public domain, commercial use permitted, no API key.
 *
 * Geometry: the JPEG is a 16:9 crop of the region's Web-Mercator bbox, then
 * resized to 1920x1080. Web Mercator is a RECTANGLE in projected space, so a
 * linear rescale keeps the mapping exact:
 *   x = (lng - minLng) / (maxLng - minLng)
 *   y = (mercY(lat) - mercY(maxLat)) / (mercY(minLat) - mercY(maxLat))
 * Marker positions therefore land on the real strait, not "somewhere near it".
 */
const mercY = (lat: number) => {
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return Math.log(Math.tan(Math.PI / 4 + (Math.asin(s)) / 2)); // increasing in lat
};

export const projectToImage = (lngLat: LngLat, bbox: [number, number, number, number]) => {
  const [x0, y0, x1, y1] = bbox;
  const x = (lngLat[0] - x0) / (x1 - x0);
  const yTop = mercY(y1);
  const yBot = mercY(y0);
  const y = (yTop - mercY(lngLat[1])) / (yTop - yBot);
  return {x, y};
};

export type Camera = {
  z0: number; // zoom factor at shot start (1 = whole crop)
  z1: number; // zoom factor at shot end  (z1>z0 = push-in, z1<z0 = pull-out)
  f0: [number, number]; // normalised focal point at start (0..1 inside the crop)
  f1: [number, number]; // normalised focal point at end
};

/**
 * The shot camera: ALWAYS moving, decelerating, and it never resets mid-shot.
 * Pan speed is capped by construction (see PAN_LIMIT) -- that is what stops the
 * "dizzy / cheap transition" feel.
 */
/** hard ceiling on how far the plate may travel, in px, so no shot feels like a swoop */
const PAN_LIMIT_PX = 220;

export const SatelliteMap: React.FC<{
  region: string;
  camera: Camera;
  /** how much the plate is darkened so overlays stay readable */
  plate?: number;
  children?: React.ReactNode;
}> = ({region, camera, plate = 0.42, children}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const r = regionOf(region);

  // one continuous ease-out over the whole shot
  const p = EASE.out(clamp(f / (fps * 7)));
  const z = camera.z0 + (camera.z1 - camera.z0) * p;
  const fx = camera.f0[0] + (camera.f1[0] - camera.f0[0]) * p;
  const fy = camera.f0[1] + (camera.f1[1] - camera.f0[1]) * p;

  // pixel-space translation (percent of a scaled element is not reliable across engines)
  // The plate must always overfill the frame: translation is limited to the
  // overscan created by the zoom, otherwise black bands appear at the edges.
  const overX = Math.max(0, ((z - 1) * 1920) / 2 - 6);
  const overY = Math.max(0, ((z - 1) * 1080) / 2 - 6);
  const rawX = -(fx - 0.5) * 1920 * z;
  const rawY = -(fy - 0.5) * 1080 * z;
  const shiftX = Math.max(-Math.min(overX, PAN_LIMIT_PX), Math.min(Math.min(overX, PAN_LIMIT_PX), rawX));
  const shiftY = Math.max(-Math.min(overY, PAN_LIMIT_PX), Math.min(Math.min(overY, PAN_LIMIT_PX), rawY));

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.ink, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translate3d(${shiftX}px, ${shiftY}px, 0) scale(${z})`,
          transformOrigin: 'center center',
        }}
      >
        <Img
          src={staticFile(`basemap/${r.file}`)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'saturate(0.70) contrast(1.08) brightness(0.90)',
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{backgroundColor: `rgba(4,8,14,${plate})`}} />
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 40%, rgba(3,6,11,0.80) 100%)'}}
      />
      {children}
    </AbsoluteFill>
  );
};
