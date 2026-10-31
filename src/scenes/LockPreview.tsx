import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {geoNaturalEarth1, geoPath, GeoProjection} from 'd3-geo';
import {landFC} from '../lib/world';
import {COLORS, FONT} from '../theme/tokens';
import {LANDLOCKED} from '../data/landlocked';

const W = 1080;
const H = 1920;

type Poly = {num: number; d: string; cx: number; cy: number};
export const LockPreview: React.FC = () => {
  const f = useCurrentFrame();
  const proj: GeoProjection = geoNaturalEarth1().fitExtent(
    [[-140, 250], [W + 140, 1180]],
    {type: 'Sphere'} as never,
  );
  const path = geoPath(proj);
  const byNum = new Map<number, {d: string; cx: number; cy: number}>();
  for (const feat of landFC.features) {
    const num = Number((feat as {id?: string}).id);
    const d = path(feat as never) ?? '';
    const c = path.centroid(feat as never);
    if (d) byNum.set(num, {d, cx: c[0], cy: c[1]});
  }
  const tilt = interpolate(f, [0, 150], [24, 16]);
  const yaw = interpolate(f, [0, 150], [-6, 4]);
  return (
    <AbsoluteFill style={{backgroundColor: '#05080D', overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          perspective: 1800,
          perspectiveOrigin: '50% 40%',
        }}
      >
        <div
          style={{
            position: 'absolute', inset: 0,
            transform: `translateY(-40px) rotateX(${tilt}deg) rotateZ(${yaw * 0.35}deg) scale(1.06)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
            <defs>
              <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="7" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="vig" cx="50%" cy="42%" r="72%">
                <stop offset="0%" stopColor="#0A1018" stopOpacity="0" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
              </radialGradient>
            </defs>
            <g>
              {landFC.features.map((feat, i) => (
                <path key={i} d={path(feat as never) ?? undefined}
                  fill="#131C27" stroke="#2C3B4A" strokeWidth={0.6} />
              ))}
            </g>
            <g filter="url(#glow)">
              {LANDLOCKED.map((c) => {
                const p = byNum.get(c.num);
                if (!p) return null;
                return (
                  <path key={c.iso2} d={p.d} fill="#E23B3B" fillOpacity={0.82}
                    stroke="#FFF3E8" strokeWidth={1.15} strokeOpacity={0.85} />
                );
              })}
            </g>
            <rect x={0} y={0} width={W} height={H} fill="url(#vig)" pointerEvents="none" />
          </svg>
        </div>
      </AbsoluteFill>

      {/* flags: 8 markers as a taste of the 44-flag beat */}
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        {LANDLOCKED.slice(0, 8).map((c, i) => {
          const p = byNum.get(c.num);
          const cx = p ? p.cx : 0;
          const cy = p ? p.cy : 0;
          const t = interpolate(f, [10 + i * 6, 26 + i * 6], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
          if (t <= 0) return null;
          const y = interpolate(t, [0, 1], [-90, 0]);
          return (
            <div key={c.iso2} style={{
              position: 'absolute', left: cx - 34, top: cy - 44 + y, width: 68, height: 51,
              borderRadius: 6, overflow: 'hidden', opacity: t,
              boxShadow: '0 14px 28px rgba(0,0,0,.55), 0 0 0 1.5px rgba(255,255,255,.75)',
              transform: `scale(${interpolate(t, [0, 0.7, 1], [1.5, 0.94, 1])})`,
            }}>
              <Img src={staticFile(`flags/${c.iso2}.svg`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
          );
        })}
      </AbsoluteFill>

      <div style={{position: 'absolute', top: 96, left: 72, right: 72}}>
        <div style={{fontFamily: FONT.mono, fontSize: 26, letterSpacing: '0.28em', color: COLORS.accent}}>
          THE LOCKED COUNTRIES
        </div>
        <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 84, lineHeight: 0.95, color: '#fff', marginTop: 14}}>
          44 COUNTRIES<br />HAVE NO SEA
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 120, left: 72, right: 72, textAlign: 'center'}}>
        <div style={{fontFamily: FONT.text, fontSize: 38, fontWeight: 500, color: '#E7EDF3'}}>
          One in five countries cannot reach the ocean.
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 62, left: 72, fontFamily: FONT.mono, fontSize: 20, color: '#4E5D6E'}}>
        BORDERS: NATURAL EARTH (PUBLIC DOMAIN) · FLAGS: FLAG-ICONS (MIT)
      </div>
    </AbsoluteFill>
  );
};
