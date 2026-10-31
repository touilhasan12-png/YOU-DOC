import React, {useMemo} from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {carto, type Cam, type Carto} from '../../lib/plate';
import {V, C} from '../../config/vertical';
import {FlagCard, type FlagSpec} from './FlagCard';

export type Plane = {s: number; tx?: number; ty?: number; rx: number; rz?: number};
export type FillSpec = {color: string; from?: number; opacity?: number; stroke?: string};
export type PinSpec = {lng: number; lat: number; label: string; color?: string; at?: number; dy?: number};

/**
 * THE STAGE -- one projected satellite slab of the Earth, tilted in 3D.
 *
 * COORDINATE MODEL (the one thing that must never drift):
 *   - DESIGN SPACE is `ov` times the frame, origin at the plane's top-left.
 *     The camera centre sits exactly at the plane's centre, which is the
 *     frame's centre, so tilting and scaling never moves what is being looked at.
 *   - `across` = degrees of longitude visible across the FRAME when plane.s == ov.
 *     Therefore k = w / (ov * across * rad).
 *   - 1 design px = plane.s screen px. Nothing else scales anything.
 *   With ov = 1.22 and a 3400 px lens, a 26 deg tilt still covers the frame
 *   (checked in docs/ART_NOTES.md) while keeping the perspective long-lens
 *   rather than fisheye.
 */
export const Stage: React.FC<{
  cam: Cam;
  plates: string[];
  plane: Plane;
  frame: number;
  vp?: {w: number; h: number};
  ov?: number;
  fills?: Record<string, FillSpec>;
  rimmed?: string[];
  graticule?: boolean;
  flags?: FlagSpec[];
  pins?: PinSpec[];
  planeSvg?: (c: Carto) => React.ReactNode;
  slabEdge?: boolean;
  scrim?: number;
  backdrop?: boolean;
  children?: React.ReactNode;
}> = ({
  cam,
  plates,
  plane,
  frame,
  vp,
  ov: ovProp,
  fills,
  rimmed,
  graticule = true,
  flags,
  pins,
  planeSvg,
  slabEdge = true,
  scrim = 1,
  backdrop = true,
  children,
}) => {
  const w = vp?.w ?? V.W;
  const h = vp?.h ?? V.H;
  const ov = ovProp ?? V.OVERSCAN;
  const pw = w * ov;
  const ph = h * ov;
  const c = useMemo(
    () => carto(cam, w / ov, [pw / 2, ph / 2], plates),
    [cam.lng, cam.lat, cam.across, w, h, ov, plates.join(',')],
  );

  const planeTransform = `translate(${plane.tx ?? 0}px, ${plane.ty ?? 0}px) scale(${plane.s}) rotateX(${plane.rx}deg) rotateZ(${plane.rz ?? 0}deg)`;

  return (
    <AbsoluteFill style={{backgroundColor: C.ink, overflow: 'hidden'}}>
      {backdrop ? (
        <AbsoluteFill style={{opacity: 0.5}}>
          <Img
            src={staticFile(`basemap/${plates[plates.length - 1]}.jpg`)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(48px) saturate(0.5) brightness(0.3)',
              transform: 'scale(1.3)',
            }}
          />
        </AbsoluteFill>
      ) : null}

      <AbsoluteFill style={{perspective: V.PERSPECTIVE, perspectiveOrigin: '50% 40%'}}>
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
                  filter: 'saturate(0.62) brightness(0.80) contrast(1.06)',
                  // the slab fades into the void instead of ending in a crop line
                  maskImage:
                    'linear-gradient(to bottom, rgba(0,0,0,0) 0%, #000 15%, #000 93%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to bottom, rgba(0,0,0,0) 0%, #000 15%, #000 93%, rgba(0,0,0,0) 100%)',
                }}
              />
            );
          })}

          <svg width={pw} height={ph} viewBox={`0 0 ${pw} ${ph}`} style={{position: 'absolute', left: 0, top: 0}}>
            <defs>
              <filter id="glowR" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="7" result="b" />
                <feColorMatrix
                  in="b"
                  type="matrix"
                  values="1 0 0 0 0.55  0 0.3 0 0 0.05  0 0 0.15 0 0.01  0 0 0 0.85 0"
                />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {graticule && c.graticule ? (
              <path d={c.graticule} fill="none" stroke="rgba(140,180,215,0.12)" strokeWidth={1} />
            ) : null}

            <g fill="none" stroke="rgba(168,203,232,0.38)" strokeWidth={1} strokeLinejoin="round">
              {Object.entries(c.shapes).map(([iso, d]) => (
                <path key={iso} d={d} />
              ))}
            </g>

            {rimmed && rimmed.length ? (
              <g fill="none" stroke="rgba(255,225,170,0.6)" strokeWidth={1.6}>
                {rimmed.map((iso) => (c.shapes[iso] ? <path key={iso} d={c.shapes[iso]} /> : null))}
              </g>
            ) : null}

            {fills ? (
              <g filter="url(#glowR)">
                {Object.entries(fills).map(([iso, spec]) => {
                  const d = c.shapes[iso];
                  const o = spec.opacity ?? 0.62;
                  const from = spec.from ?? -999;
                  const k = Math.max(0, Math.min(1, (frame - from) / 9));
                  if (!d || k <= 0) return null;
                  return (
                    <path
                      key={iso}
                      d={d}
                      fill={spec.color}
                      fillOpacity={o * k}
                      stroke={spec.stroke ?? 'rgba(255,240,225,0.85)'}
                      strokeWidth={1.1}
                      strokeOpacity={0.85 * k}
                    />
                  );
                })}
              </g>
            ) : null}

            {planeSvg ? planeSvg(c) : null}
          </svg>

          {flags && flags.length ? (
            <svg width={pw} height={ph} viewBox={`0 0 ${pw} ${ph}`} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
              {flags.map((s) => {
                const a = c.pts[s.iso2];
                const b = c.ptsTrue[s.iso2];
                if (!a || !b) return null;
                if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 13 * ov) return null;
                return (
                  <g key={s.iso2}>
                    <line x1={b[0]} y1={b[1]} x2={a[0]} y2={a[1]} stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
                    <circle cx={b[0]} cy={b[1]} r={2.2} fill="rgba(255,255,255,0.8)" />
                  </g>
                );
              })}
            </svg>
          ) : null}

          <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}>
            {(flags ?? []).map((s) => {
              const pt = c.pts[s.iso2];
              if (!pt) return null;
              return (
                <FlagCard key={`${s.iso2}-${s.at}`} spec={s} pt={pt} tilt={plane.rx} frame={frame} planeScale={plane.s} />
              );
            })}
          </div>

          {/* pins: billboarded labels that sit exactly on a lng/lat */}
          <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}>
            {(pins ?? []).map((p) => {
              const pt = c.proj([p.lng, p.lat]);
              if (!pt) return null;
              const t = Math.max(0, Math.min(1, (frame - (p.at ?? -999)) / 8));
              if (t <= 0) return null;
              const col = p.color ?? C.teal;
              return (
                <div
                  key={`${p.label}-${p.lng}`}
                  style={{
                    position: 'absolute',
                    left: pt[0],
                    top: pt[1],
                    transform: `translate(-50%,-50%) rotateX(${-plane.rx}deg)`,
                    opacity: t,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      marginLeft: -5,
                      marginTop: -5,
                      borderRadius: '50%',
                      background: col,
                      boxShadow: '0 0 0 4px rgba(3,7,12,0.72), 0 0 14px rgba(0,0,0,0.9)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: -13 + (p.dy ?? 0),
                      whiteSpace: 'nowrap',
                      fontFamily: 'JetBrains Mono',
                      fontWeight: 600,
                      fontSize: 16,
                      letterSpacing: '0.1em',
                      color: col,
                      textShadow: '0 1px 8px rgba(0,0,0,0.95)',
                    }}
                  >
                    {p.label}
                  </div>
                </div>
              );
            })}
          </div>

          {slabEdge ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                boxShadow: 'inset 0 0 0 1px rgba(180,215,245,0.08), inset 0 0 140px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
              }}
            />
          ) : null}
        </div>
      </AbsoluteFill>

      {scrim > 0 ? (
        <>
          <AbsoluteFill
            style={{
              background: `linear-gradient(to bottom, rgba(3,6,10,${0.9 * scrim}) 0%, rgba(3,6,10,${0.5 * scrim}) 24%, rgba(3,6,10,0) 45%, rgba(3,6,10,0) 60%, rgba(3,6,10,${0.68 * scrim}) 84%, rgba(3,6,10,${0.95 * scrim}) 100%)`,
              pointerEvents: 'none',
            }}
          />
          <AbsoluteFill
            style={{
              background: 'radial-gradient(ellipse 72% 56% at 50% 44%, rgba(0,0,0,0) 42%, rgba(2,4,8,0.62) 100%)',
              pointerEvents: 'none',
            }}
          />
        </>
      ) : null}

      {children}
    </AbsoluteFill>
  );
};
