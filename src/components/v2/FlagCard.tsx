import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, eo, clamp01} from '../../config/vertical';

export type FlagSpec = {
  iso2: string;
  /** absolute film frame at which the card lands */
  at: number;
  /** card width in plane px */
  w?: number;
  label?: string;
  tone?: 'white' | 'amber' | 'red';
  /** seconds of tumble-in (frames); 11 is crisp, 20 is soft */
  dur?: number;
};

const TONE: Record<string, string> = {
  white: 'rgba(255,255,255,0.92)',
  amber: C.amber,
  red: C.red2,
};

/**
 * A flag card pinned to its country.
 *
 * The card lives INSIDE the tilted map plane, so it tracks the projection and
 * the camera exactly. rotateX(-tilt) turns it back to face the camera: it is a
 * billboard, so the flag stays readable while the map behind it lies flat.
 * The card is 4:3 by construction -- the flag SVG is 4:3 -- so nothing is ever
 * stretched (object-fit:fill on an exact-ratio box, never cover).
 */
export const FlagCard: React.FC<{
  spec: FlagSpec;
  pt: [number, number];
  tilt: number;
  frame: number;
  /** plane scale, so the card can compensate and stay a constant on-screen size */
  planeScale: number;
}> = ({spec, pt, tilt, frame, planeScale}) => {
  const dur = spec.dur ?? 11;
  const t = clamp01((frame - spec.at) / dur);
  if (frame < spec.at) return null;
  const e = eo(t);
  const w = (spec.w ?? 46) / planeScale;
  const dropY = -78 * (1 - e);
  const sc = 1.3 - 0.3 * e;
  const ring = t > 0.45 ? (t - 0.45) / 0.55 : 0;
  const tone = TONE[spec.tone ?? 'white'];
  return (
    <>
      {/* one-shot landing ring on the map surface (never loops) */}
      {ring > 0 && ring < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: pt[0],
            top: pt[1],
            width: 40 * ring + 8,
            height: 40 * ring * 0.62 + 6,
            marginLeft: -(40 * ring + 8) / 2,
            marginTop: -(40 * ring * 0.62 + 6) / 2,
            borderRadius: '50%',
            border: `1.5px solid ${tone}`,
            opacity: (1 - ring) * 0.8,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: pt[0],
          top: pt[1],
          transform: `translate(-50%,-100%) translateY(${dropY}px) rotateX(${-tilt}deg) scale(${sc})`,
          transformOrigin: '50% 100%',
          opacity: Math.min(1, t * 3.5),
          width: w,
        }}
      >
        <div
          style={{
            width: w,
            height: w * 0.75,
            borderRadius: 2.5,
            overflow: 'hidden',
            border: `1.5px solid ${tone}`,
            boxShadow: '0 10px 20px rgba(0,0,0,0.62), 0 1px 0 rgba(255,255,255,0.35) inset',
            backgroundColor: '#0B1119',
          }}
        >
          <Img
            src={staticFile(`flags/${spec.iso2}.svg`)}
            style={{width: '100%', height: '100%', display: 'block'}}
          />
        </div>
        {/* pin */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -5,
            width: 2.5,
            height: 7,
            marginLeft: -1.25,
            background: tone,
            boxShadow: '0 0 4px rgba(0,0,0,0.8)',
          }}
        />
        {spec.label ? (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: -6,
              transform: 'translate(-50%,-100%)',
              whiteSpace: 'nowrap',
              fontFamily: 'Inter',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: C.white,
              textShadow: '0 1px 6px rgba(0,0,0,0.95)',
            }}
          >
            {spec.label}
          </div>
        ) : null}
      </div>
    </>
  );
};

export const VIGNETTE: React.FC<{strength?: number}> = ({strength = 1}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: `radial-gradient(ellipse 78% 62% at 50% 46%, rgba(0,0,0,0) 35%, rgba(2,4,7,${0.78 * strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);
