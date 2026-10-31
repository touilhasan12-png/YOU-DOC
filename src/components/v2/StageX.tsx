import React, {useMemo} from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {carto, type Cam, type Carto} from '../../lib/plate';
import {V} from '../../config/vertical';
import {FlagCard, type FlagSpec} from './FlagCard';

/**
 * STAGEX -- the full-bleed cinematic stage ("REF language").
 *
 * Differences from the editorial Stage (kept alongside for reference):
 *   1. BLEED.   plane.s >= OVERSCAN => the camera window is at least as wide as
 *               the frame, so the satellite map runs edge to edge. No slab, no
 *               black bands, no fade. A blurred cover of the same plate sits
 *               underneath, so an uncovered corner reads as distance, never void.
 *   2. GRADE.   the plates are pushed UP, not down (saturate 1.28 / contrast
 *               1.07 / brightness 1.03). The old stage desaturated to 0.62 --
 *               that single number is why the first cut looked grey next to the
 *               references.
 *   3. NEON.    a highlighted country gets three passes: a wide blurred halo in
 *               its own colour, a mid stroke, then a white-hot 2.2 px rim
 *               (the references' signature look).
 *   4. AIR.     thin white borders at 0.30, no graticule, a 38 % corner
 *               vignette, and 5 % grain. No top/bottom scrim: the type carries
 *               its own shadow instead of a black band.
 *
 * Geometry is unchanged from Stage: one camera model, k = frameW/(across*rad),
 * across degrees span the frame width when s == OVERSCAN (1.26).
 */

export type FXFill = {
  /** fill colour */
  color: string;
  /** fill opacity, default .5 */
  opacity?: number;
  /** halo colour, default = color */
  halo?: string;
  /** absolute film frame at which the fill grows in */
  from?: number;
};

export const StageX: React.FC<{
  cam: Cam;
  /** plates, back to front. Keep p_world first: it guarantees full coverage. */
  plates: string[];
  frame: number;
  /** plane scale; >= V.OVERSCAN (1.26) is full bleed. Default 1.34 */
  s?: number;
  tilt?: number;
  rz?: number;
  tx?: number;
  ty?: number;
  fills?: Record<string, FXFill>;
  flags?: FlagSpec[];
  vignette?: number;
  grain?: boolean;
  planeSvg?: (c: Carto) => React.ReactNode;
  children?: React.ReactNode;
}> = ({
  cam,
  plates,
  frame,
  s = 1.34,
  tilt = 8,
  rz = 0,
  tx = 0,
  ty = 0,
  fills,
  flags,
  vignette = 0.38,
  grain = true,
  planeSvg,
  children,
}) => {
  const w = V.W;
  const h = V.H;
  const ov = V.OVERSCAN;
  const pw = w * ov;
  const ph = h * ov;
  const c = useMemo(
    () => carto(cam, w / ov, [pw / 2, ph / 2], plates),
    [cam.lng, cam.lat, cam.across, w, h, ov, plates.join(',')],
  );

  const planeTransform = `translate(${tx}px, ${ty}px) scale(${s}) rotateX(${tilt}deg) rotateZ(${rz}deg)`;

  return (
    <AbsoluteFill style={{backgroundColor: '#0A1A2A', overflow: 'hidden'}}>
      {/* 1. distance filler: a blurred cover of the same imagery, so no corner is ever void */}
      <AbsoluteFill>
        <Img
          src={staticFile(`basemap/${plates[0]}.jpg`)}
          style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(26px) saturate(1.3) brightness(0.95)', transform: 'scale(1.35)'}}
        />
      </AbsoluteFill>

      {/* 2. the tilted plate */}
      <AbsoluteFill style={{perspective: V.PERSPECTIVE, perspectiveOrigin: '50% 44%'}}>
        <div
          style={{
            position: 'absolute',
            left: (w - pw) / 2,
            top: (h - ph) / 2,
            width: pw,
            height: ph,
            transform: planeTransform,
            transformStyle: 'preserve-3d',
            transformOrigin: '50% 50%',
          }}
        >
          {plates.map((id) => {
            const r = c.rects[id];
            if (!r) return null;
            return (
              <Img
                key={id}
                src={staticFile(`basemap/${id}.jpg`)}
                style={{
                  position: 'absolute',
                  left: r.x,
                  top: r.y,
                  width: r.w,
                  height: r.h,
                  filter: 'saturate(1.28) contrast(1.07) brightness(1.03)',
                }}
              />
            );
          })}

          <svg width={pw} height={ph} viewBox={`0 0 ${pw} ${ph}`} style={{position: 'absolute', left: 0, top: 0}}>
            <defs>
              <filter id="xHalo" x="-45%" y="-45%" width="190%" height="190%">
                <feGaussianBlur stdDeviation="9" />
              </filter>
              <filter id="xHaloWide" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="26" />
              </filter>
            </defs>

            {/* borders: thin, white, everywhere -- the reference's constant */}
            <g fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth={0.9} strokeLinejoin="round">
              {Object.entries(c.shapes).map(([iso, d]) => (
                <path key={iso} d={d} />
              ))}
            </g>

            {fills ? (
              <>
                {/* halo pass: wide + soft, in the accent colour */}
                <g filter="url(#xHaloWide)">
                  {Object.entries(fills).map(([iso, sp]) => {
                    const d = c.shapes[iso];
                    if (!d) return null;
                    const k = Math.max(0, Math.min(1, (frame - (sp.from ?? -9999)) / 10));
                    if (k <= 0) return null;
                    return (
                      <path
                        key={`h2-${iso}`}
                        d={d}
                        fill={sp.halo ?? sp.color}
                        fillOpacity={0.55 * k}
                        stroke={sp.halo ?? sp.color}
                        strokeWidth={14}
                        strokeOpacity={0.75 * k}
                      />
                    );
                  })}
                </g>
                <g filter="url(#xHalo)">
                  {Object.entries(fills).map(([iso, sp]) => {
                    const d = c.shapes[iso];
                    if (!d) return null;
                    const k = Math.max(0, Math.min(1, (frame - (sp.from ?? -9999)) / 10));
                    if (k <= 0) return null;
                    return (
                      <path
                        key={`h1-${iso}`}
                        d={d}
                        fill={sp.color}
                        fillOpacity={(sp.opacity ?? 0.5) * k}
                        stroke={sp.halo ?? sp.color}
                        strokeWidth={6}
                        strokeOpacity={0.95 * k}
                      />
                    );
                  })}
                </g>
                {/* crisp white-hot rim on top */}
                <g fill="none">
                  {Object.entries(fills).map(([iso]) => {
                    const d = c.shapes[iso];
                    if (!d) return null;
                    return (
                      <path
                        key={`rim-${iso}`}
                        d={d}
                        stroke="rgba(255,255,255,0.95)"
                        strokeWidth={2.2}
                        strokeLinejoin="round"
                      />
                    );
                  })}
                </g>
              </>
            ) : null}

            {planeSvg ? planeSvg(c) : null}
          </svg>

          {/* flags are billboards inside the tilted plane, so they stay upright */}
          <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}>
            {(flags ?? []).map((sp) => {
              const pt = c.pts[sp.iso2];
              if (!pt) return null;
              return <FlagCard key={`${sp.iso2}-${sp.at}`} spec={sp} pt={pt} tilt={tilt} frame={frame} planeScale={s} />;
            })}
          </div>
        </div>
      </AbsoluteFill>

      {/* 3. vignette + grain: the two things that stop a map looking like a screenshot */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 78% 62% at 50% 46%, rgba(0,0,0,0) 38%, rgba(2,8,16,${vignette}) 100%)`,
          pointerEvents: 'none',
        }}
      />
      {grain ? (
        <AbsoluteFill style={{opacity: 0.05, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
          <svg width="100%" height="100%">
            <filter id="xGrain">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#xGrain)" />
          </svg>
        </AbsoluteFill>
      ) : null}

      {children}
    </AbsoluteFill>
  );
};
