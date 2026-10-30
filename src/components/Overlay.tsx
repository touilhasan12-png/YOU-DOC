import React from 'react';
import {useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme/tokens';
import {fadeIn} from '../lib/anim';
import type {LngLat} from '../lib/geo';
import {projectToImage} from './SatelliteMap';
import {regionOf} from '../lib/regions';

/** Marker + label drawn in IMAGE space, so it tracks the real geography. */
export const GeoMarker: React.FC<{
  lngLat: LngLat;
  region: string;
  label: string;
  start: number;
  color?: string;
  side?: 'right' | 'left';
}> = ({lngLat, region, label, start, color = COLORS.accent, side = 'right'}) => {
  const f = useCurrentFrame();
  const draw = fadeIn(f, start, 10);
  const {x, y} = projectToImage(lngLat, regionOf(region).bbox);
  const C = 2 * Math.PI * 30;
  const dir = side === 'right' ? 1 : -1;

  return (
    <svg
      viewBox="0 0 1920 1080"
      width="100%"
      height="100%"
      style={{position: 'absolute', inset: 0}}
      preserveAspectRatio="none"
    >
      <g transform={`translate(${x * 1920},${y * 1080})`}>
        <circle r={30} fill="none" stroke={color} strokeWidth={2.5}
          strokeDasharray={C} strokeDashoffset={C * (1 - draw)} transform="rotate(-90)" opacity={0.95} />
        <circle r={30} fill={color} opacity={0.10 * draw} />
        <circle r={5} fill={color} opacity={draw} />
        <line x1={0} y1={0} x2={dir * 58} y2={0} stroke={color} strokeWidth={1.6} opacity={0.7 * draw} />
        <text
          x={dir * 72}
          y={7}
          textAnchor={side === 'right' ? 'start' : 'end'}
          opacity={fadeIn(f, start + 6, 8)}
          style={{
            fontFamily: FONT.mono,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '0.14em',
            fill: COLORS.text,
            paintOrder: 'stroke',
            stroke: 'rgba(0,0,0,0.65)',
            strokeWidth: 4,
          }}
        >
          {label}
        </text>
      </g>
    </svg>
  );
};

/** Sea / country labels placed by real coordinates. */
export const GeoText: React.FC<{
  lngLat: LngLat;
  region: string;
  text: string;
  kind?: 'sea' | 'country';
  start?: number;
}> = ({lngLat, region, text, kind = 'country', start = 0}) => {
  const f = useCurrentFrame();
  const {x, y} = projectToImage(lngLat, regionOf(region).bbox);
  const sea = kind === 'sea';
  return (
    <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute', inset: 0}} preserveAspectRatio="none">
      <text
        x={x * 1920}
        y={y * 1080}
        textAnchor="middle"
        opacity={fadeIn(f, start, 10) * (sea ? 0.62 : 0.78)}
        style={{
          fontFamily: sea ? FONT.text : FONT.mono,
          fontSize: sea ? 20 : 22,
          fontWeight: sea ? 500 : 600,
          fontStyle: sea ? 'italic' : 'normal',
          letterSpacing: sea ? '0.26em' : '0.18em',
          fill: '#DCE6F0',
          paintOrder: 'stroke',
          stroke: 'rgba(0,0,0,0.6)',
          strokeWidth: 5,
        }}
      >
        {text}
      </text>
    </svg>
  );
};
