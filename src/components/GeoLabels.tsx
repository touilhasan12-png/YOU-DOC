import React from 'react';
import type {GeoProjection} from 'd3-geo';
import {useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme/tokens';
import {fadeIn} from '../lib/anim';
import {labelsIn} from '../data/labels';

/** Country + sea labels. Static (no drift), fading in once. */
export const GeoLabels: React.FC<{
  projection: GeoProjection;
  bbox: [number, number, number, number];
  start: number;
  /** 'full' = countries + seas (regional shots). 'sparse' = seas only (world shots, avoids collisions). */
  density?: 'full' | 'sparse';
}> = ({projection, bbox, start, density = 'full'}) => {
  const f = useCurrentFrame();
  const op = fadeIn(f, start, 12);
  if (op <= 0) return null;
  return (
    <g opacity={op}>
      {labelsIn(bbox)
        .filter((l) => density === 'full' || l.kind === 'sea')
        .map((l) => {
        const pt = projection(l.lngLat);
        if (!pt) return null;
        const sea = l.kind === 'sea';
        return (
          <text
            key={l.t}
            x={pt[0]}
            y={pt[1]}
            textAnchor="middle"
            style={{
              fontFamily: sea ? FONT.text : FONT.mono,
              fontSize: sea ? 17 : 19,
              fontWeight: sea ? 500 : 600,
              letterSpacing: sea ? '0.22em' : '0.16em',
              fill: sea ? COLORS.cool : COLORS.textDim,
              opacity: sea ? 0.5 : 0.7,
              fontStyle: sea ? 'italic' : 'normal',
            }}
          >
            {l.t}
          </text>
        );
      })}
    </g>
  );
};
