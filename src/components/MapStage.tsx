import React from 'react';
import {AbsoluteFill} from 'remotion';
import {geoNaturalEarth1, geoPath} from 'd3-geo';
import type {GeoProjection} from 'd3-geo';
import {landFC} from '../lib/world';
import {COLORS, FONT, HEIGHT, SAFE, WIDTH} from '../theme/tokens';
import {graticule} from '../lib/geo';

/**
 * Base map canvas: ocean + graticule + country land + hairline borders.
 * Pure SVG. Deterministic. ~110m resolution is enough at video scale.
 */
export const MapStage: React.FC<{
  projection?: GeoProjection;
  landFill?: string;
  showGraticule?: boolean;
  children?: React.ReactNode;
}> = ({projection, landFill = COLORS.land, showGraticule = true, children}) => {
  const proj = projection ?? geoNaturalEarth1().fitExtent(
    [[SAFE.left, SAFE.top + 20], [WIDTH - SAFE.right, HEIGHT - SAFE.bottom - 20]],
    {type: 'Sphere'} as never,
  );
  const path = geoPath(proj);

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.ocean}}>
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute'}}>
        {showGraticule ? (
          <path d={path(graticule) ?? undefined} fill="none" stroke="#16202B" strokeWidth={1} />
        ) : null}
        <g>
          {landFC.features.map((f, i) => (
            <path
              key={i}
              d={path(f as never) ?? undefined}
              fill={landFill}
              stroke={COLORS.border}
              strokeWidth={0.75}
            />
          ))}
        </g>
      </svg>
      {children}
    </AbsoluteFill>
  );
};

/** Small editorial caption that never moves (anti-distraction). */
export const SourceTag: React.FC<{text: string; opacity?: number}> = ({text, opacity = 0.65}) => (
  <div
    style={{
      position: 'absolute',
      left: SAFE.left,
      bottom: SAFE.bottom - 46,
      fontFamily: FONT.mono,
      fontSize: 16,
      letterSpacing: '0.06em',
      color: COLORS.textMute,
      opacity,
      textTransform: 'uppercase',
    }}
  >
    {text}
  </div>
);
