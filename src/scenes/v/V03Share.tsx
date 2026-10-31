import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../../components/v2/Stage';
import {Kicker, Headline, SourceTag} from '../../components/v2/Type';
import {ALL_ISO} from '../../lib/plate';
import {V, C, F, at, appear, eo} from '../../config/vertical';

/** V03 -- the share: 44 of the world's countries is one in five. */
export const V03Share: React.FC<{start: number}> = ({start}) => {
  const f = useCurrentFrame() + start;

  const others = Object.fromEntries(ALL_ISO.map((i) => [i, {color: C.red, from: start + 6, opacity: 0.62}]));
  const plane = {s: at(f, start, start + 220, 1.3, 1.26), ty: 0, rx: at(f, start, start + 220, 27, 31)};

  const rows: Array<[string, number, string]> = [
    ['AFRICA', 16, C.red],
    ['EUROPE', 14, C.red2],
    ['ASIA', 12, C.amber],
    ['S. AMERICA', 2, C.teal],
  ];
  const max = 16;
  const barsAt = start + 74;

  return (
    <AbsoluteFill>
      <Stage cam={{lng: 14, lat: 20, across: 236}} plates={['p_world']} plane={plane} frame={f} fills={others} flags={[]} />

      <div style={{position: 'absolute', top: 150, left: V.SAFE.left, right: V.SAFE.right}}>
        <Kicker at={start + 4}>THE SHARE</Kicker>
        <div style={{marginTop: 14}}>
          <Headline at={start + 10} lines={['ONE COUNTRY', 'IN FIVE']} size={118} />
        </div>
      </div>

      {/* the four continents as proportion bars, drawn against the largest */}
      <div style={{position: 'absolute', left: V.SAFE.left, right: V.SAFE.right, bottom: 250}}>
        <div style={{height: 1, background: 'rgba(160,190,215,0.2)', marginBottom: 24}} />
        {rows.map(([name, n, col], i) => {
          const t = appear(f, barsAt + i * 5, 14);
          return (
            <div key={name} style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16, opacity: t}}>
              <div style={{width: 210, fontFamily: F.mono, fontSize: 19, letterSpacing: '0.16em', color: C.dim}}>{name}</div>
              <div style={{flex: 1, height: 22, background: 'rgba(255,255,255,0.07)', position: 'relative'}}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${(n / max) * 100 * eo(appear(f, barsAt + i * 5, 20))}%`,
                    background: col,
                    opacity: 0.9,
                  }}
                />
              </div>
              <div
                style={{
                  width: 54,
                  textAlign: 'right',
                  fontFamily: F.display,
                  fontWeight: 700,
                  fontSize: 38,
                  color: C.white,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {n}
              </div>
            </div>
          );
        })}
        <div
          style={{
            marginTop: 22,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: F.mono,
            fontSize: 18,
            letterSpacing: '0.18em',
            color: 'rgba(150,168,184,0.8)',
            opacity: appear(f, barsAt + 26, 14),
          }}
        >
          <span>44 STATES · NO COASTLINE</span>
          <span style={{color: C.amber}}>≈ 22.6% OF ALL COUNTRIES</span>
        </div>
      </div>

      <SourceTag at={start + 6}>COUNT OF SOVEREIGN STATES WITH NO SEA COAST</SourceTag>
    </AbsoluteFill>
  );
};
