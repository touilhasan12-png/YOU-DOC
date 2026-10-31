import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../../components/v2/Stage';
import {Kicker, Headline, SourceTag, Stat} from '../../components/v2/Type';
import {arcPath} from '../../lib/plate';
import {V, C, at, appear, eo} from '../../config/vertical';

const LA_PAZ: [number, number] = [-68.15, -16.5];
const COAST: [number, number] = [-70.35, -21.2]; // the Pacific shore Bolivia lost in 1884
const TITICACA: [number, number] = [-69.35, -15.85];

/** V07 -- the country that had a coast, lost it, and kept the navy. */
export const V07Bolivia: React.FC<{start: number; drops: Array<{iso2: string; f: number}>}> = ({start, drops}) => {
  const f = useCurrentFrame() + start;
  const plane = {s: at(f, start, start + 240, 1.26, 1.35), rx: at(f, start, start + 240, 27, 22)};
  const lineT = eo(at(f, start + 52, start + 104, 0, 1));

  return (
    <AbsoluteFill>
      <Stage
        cam={{lng: -64.4, lat: -17.6, across: 19}}
        plates={['p_bolivia', 'p_world']}
        plane={plane}
        frame={f}
        fills={{bo: {color: C.red, from: start + 4, opacity: 0.72}}}
        flags={drops.map((d) => ({iso2: d.iso2, at: d.f, w: 62, dur: 12}))}
        pins={[
          {lng: -70.35, lat: -21.2, label: 'COAST LOST 1884', color: C.amber, at: start + 62, dy: 6},
          {lng: -69.35, lat: -15.85, label: 'LAKE TITICACA · NAVY', color: C.teal, at: start + 96, dy: -14},
        ]}
        planeSvg={(c) => {
          const a = c.proj(LA_PAZ);
          const b = c.proj(COAST);
          const k = c.proj(TITICACA);
          if (!a || !b) return null;
          const d = arcPath(c.proj, LA_PAZ, COAST, 30);
          return (
            <g>
              <path
                d={d}
                fill="none"
                stroke={C.amber}
                strokeWidth={2.6}
                strokeDasharray="9 7"
                strokeLinecap="round"
                pathLength={1}
                strokeDashoffset={f > start + 52 ? 1 - lineT : 1}
                opacity={f > start + 52 ? 1 : 0}
              />
              <circle cx={a[0]} cy={a[1]} r={4.5} fill={C.white} opacity={f > start + 52 ? 1 : 0} />
              {k ? (
                <g opacity={appear(f, start + 96, 14)}>
                  <circle cx={k[0]} cy={k[1]} r={7} fill="none" stroke={C.teal} strokeWidth={2} />
                  <circle cx={k[0]} cy={k[1]} r={2.6} fill={C.teal} />
                </g>
              ) : null}
            </g>
          );
        }}
      />


      <div style={{position: 'absolute', top: 150, left: V.SAFE.left, right: V.SAFE.right}}>
        <Kicker at={start + 2}>THE ONE THAT LOST IT</Kicker>
        <div style={{marginTop: 12}}>
          <Headline at={start + 6} lines={['BOLIVIA']} size={112} />
        </div>
      </div>

      <div style={{position: 'absolute', left: V.SAFE.left, right: V.SAFE.right, bottom: 240}}>
        <div style={{height: 1, background: 'rgba(160,190,215,0.2)', marginBottom: 26}} />
        <div style={{display: 'flex', gap: 42}}>
          <Stat at={start + 60} value="1884" label={'COAST LOST TO CHILE\nIN THE WAR OF THE PACIFIC'} size={78} accent={C.amber} />
          <Stat at={start + 76} value="1" label={'NAVY, STILL ON THE\nBOOKS TODAY'} size={78} accent={C.teal} />
        </div>
      </div>

      <SourceTag at={start + 4}>TREATY OF ANCÓN, 1883 · PACT OF BOGOTÁ, 1904 · BOLIVIAN NAVAL FORCE, LAKE TITICACA</SourceTag>
    </AbsoluteFill>
  );
};
