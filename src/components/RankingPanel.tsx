import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT, SAFE} from '../theme/tokens';
import {clamp, fadeIn} from '../lib/anim';
import {ranked, scoreOf} from '../data/chokepoints';

/** Right-hand ranking build. Rows enter once, bars grow once. No pulses. */
export const RankingPanel: React.FC<{start: number}> = ({start}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const max = Math.max(...ranked.map(scoreOf));
  return (
    <div style={{position: 'absolute', right: SAFE.right, top: SAFE.top + 40, width: 760}}>
      <div style={{fontFamily: FONT.mono, fontSize: 24, letterSpacing: '0.24em', color: COLORS.accent,
                   opacity: fadeIn(f, start, 8)}}>THE RANKING</div>
      <div style={{height: 22}} />
      {ranked.map((c, i) => {
        const s = start + Math.round(i * 0.32 * fps);
        const p = clamp((f - s) / 12);
        const w = (scoreOf(c) / max) * 100 * p;
        return (
          <div key={c.id} style={{opacity: fadeIn(f, s, 8), marginBottom: 16}}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 14}}>
              <span style={{fontFamily: FONT.mono, fontSize: 20, color: COLORS.textMute, width: 32}}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{fontFamily: FONT.display, fontSize: 40, fontWeight: 700, color: COLORS.text, flex: 1}}>
                {c.short}
              </span>
              <span style={{fontFamily: FONT.mono, fontSize: 26, color: COLORS.accent}}>{scoreOf(c)}</span>
            </div>
            <div style={{height: 6, background: 'rgba(255,255,255,0.10)', marginTop: 6}}>
              <div style={{height: '100%', width: `${w}%`,
                           background: i === 0 ? COLORS.accent : COLORS.accent2, opacity: i === 0 ? 1 : 0.8}} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
