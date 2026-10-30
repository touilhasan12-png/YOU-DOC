import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {geoNaturalEarth1} from 'd3-geo';
import {MapStage, SourceTag} from '../components/MapStage';
import {Kicker} from '../components/Title';
import {GeoLabels} from '../components/GeoLabels';
import {COLORS, EASE, HEIGHT, SAFE, WIDTH} from '../theme/tokens';
import {clamp, fadeIn} from '../lib/anim';
import {ranked, scoreOf} from '../data/chokepoints';

/**
 * FINALE REVEAL -- the ranking builds itself, 1 row per ~0.35s.
 * Bars grow with mandatory movement only (no bounce, no pulse).
 */
export const Ranking: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const proj = geoNaturalEarth1().fitExtent(
    [[SAFE.left, SAFE.top], [WIDTH * 0.52, HEIGHT - SAFE.bottom]],
    {type: 'Sphere'} as never,
  );
  const max = Math.max(...ranked.map(scoreOf));

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.ink}}>
      <MapStage projection={proj} showGraticule={false} landFill={COLORS.land}>
        <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute'}}>
          <GeoLabels projection={proj} bbox={[-180, -60, 180, 78]} start={4} density="sparse" />
          {ranked.map((c, i) => {
            const s = Math.round(i * 0.35 * fps) + 12;
            const p = EASE.out(clamp((f - s) / 14));
            const [x, y] = proj(c.lngLat)!;
            if (p <= 0) return null;
            return (
              <g key={c.id} opacity={p}>
                <circle cx={x} cy={y} r={6 + 4 * p} fill="none" stroke={COLORS.accent} strokeWidth={2} />
                <circle cx={x} cy={y} r={3} fill={COLORS.accent} />
                <line
                  x1={x}
                  y1={y}
                  x2={WIDTH * 0.52 - 24}
                  y2={SAFE.top + 90 + i * 56}
                  stroke={COLORS.accent}
                  strokeWidth={1}
                  opacity={0.28}
                  strokeDasharray="3 4"
                />
              </g>
            );
          })}
        </svg>
      </MapStage>

      <div style={{position: 'absolute', left: WIDTH * 0.54, top: SAFE.top + 20, width: WIDTH * 0.42}}>
        <Kicker start={2}>THE RANKING</Kicker>
        <div style={{height: 26}} />
        {ranked.map((c, i) => {
          const s = Math.round(i * 0.35 * fps) + 12;
          const p = EASE.out(clamp((f - s) / 16));
          const score = scoreOf(c);
          const w = (score / max) * 100 * p;
          return (
            <div key={c.id} style={{opacity: clamp(p * 1.6), marginBottom: 18}}>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 12}}>
                <span style={{fontFamily: 'JetBrains Mono', fontSize: 20, color: COLORS.textMute, width: 30}}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{fontFamily: 'Barlow Condensed', fontSize: 38, fontWeight: 700, color: COLORS.text, flex: 1}}>
                  {c.short}
                </span>
                <span style={{fontFamily: 'JetBrains Mono', fontSize: 26, color: COLORS.accent}}>{score}</span>
              </div>
              <div style={{height: 7, background: '#141C25', marginTop: 6, position: 'relative'}}>
                <div style={{height: '100%', width: `${w}%`, background: i === 0 ? COLORS.accent : COLORS.accent2, opacity: i === 0 ? 1 : 0.75}} />
              </div>
            </div>
          );
        })}
        <div
          style={{
            marginTop: 26,
            fontFamily: 'JetBrains Mono',
            fontSize: 16,
            color: COLORS.textMute,
            letterSpacing: '0.05em',
            opacity: fadeIn(f, Math.round(9 * 0.35 * fps) + 20, 12),
          }}
        >
          SCORE = TRADE 40 · MILITARY 30 · LACK OF ALTERNATIVES 20 · FRAGILITY 10
        </div>
      </div>
      <SourceTag text="Sub-scores: editorial methodology v1 · see docs/methodology.md" />
    </AbsoluteFill>
  );
};
