import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {GeoProjection} from 'd3-geo';
import {fadeIn} from '../lib/anim';
import {greatCircle, type LngLat} from '../lib/geo';
import {COLORS} from '../theme/tokens';

/**
 * Trade-flow arcs. Drawn with stroke-dashoffset (one pass, left to right).
 * Optional travelling dot uses the SAME progress => no loop, no pulse.
 */
export const FlowArcs: React.FC<{
  projection: GeoProjection;
  pathGen: (o: unknown) => string;
  from: LngLat;
  to: LngLat;
  start: number;
  color?: string;
  travelDot?: boolean;
}> = ({projection, pathGen, from, to, start, color = COLORS.accent2, travelDot = true}) => {
  const f = useCurrentFrame();
  const line = {type: 'LineString', coordinates: greatCircle(from, to, 96)} as never;
  const d = pathGen(line);
  const p = fadeIn(f, start, 20);
  const total = 1000;

  const head = projection(from)!;
  const tail = projection(to)!;
  const t = fadeIn(f, start + 4, 18);

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={0.85}
        strokeDasharray={total}
        strokeDashoffset={total * (1 - p)}
      />
      {travelDot ? (
        <circle
          r={5}
          fill={color}
          cx={head[0] + (tail[0] - head[0]) * t}
          cy={head[1] + (tail[1] - head[1]) * t}
          opacity={p > 0.9 ? 1 : 0}
        />
      ) : null}
    </g>
  );
};
