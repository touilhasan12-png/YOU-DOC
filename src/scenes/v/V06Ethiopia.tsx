import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../../components/v2/Stage';
import {Kicker, Headline, SourceTag, Stat} from '../../components/v2/Type';
import {arcPath} from '../../lib/plate';
import {V, C, F, at, appear, eo} from '../../config/vertical';

const ADDIS: [number, number] = [38.75, 9.02];
const DJIBOUTI: [number, number] = [43.15, 11.6];

/** V06 -- the most populous landlocked state, and the corridor it depends on. */
export const V06Ethiopia: React.FC<{start: number; drops: Array<{iso2: string; f: number}>}> = ({start, drops}) => {
  const f = useCurrentFrame() + start;
  const plane = {s: at(f, start, start + 250, 1.26, 1.36), rx: at(f, start, start + 250, 28, 23)};
  const arcT = eo(at(f, start + 46, start + 96, 0, 1));
  const arcOn = f > start + 46;

  return (
    <AbsoluteFill>
      <Stage
        cam={{lng: 40.5, lat: 9, across: 25}}
        plates={['p_ethiopia', 'p_world']}
        plane={plane}
        frame={f}
        fills={{
          et: {color: C.red, from: start + 4, opacity: 0.72},
          dj: {color: C.teal, from: start + 46, opacity: 0.35, stroke: 'rgba(180,255,245,0.9)'},
        }}
        flags={drops.map((d) => ({iso2: d.iso2, at: d.f, w: 62, dur: 12}))}
        pins={[
          {lng: 38.75, lat: 9.02, label: 'ADDIS ABABA', color: C.white, at: start + 40},
          {lng: 43.15, lat: 11.6, label: 'DJIBOUTI · PORT', color: C.teal, at: start + 66},
        ]}
        planeSvg={(c) => {
          const a = c.proj(ADDIS);
          const b = c.proj(DJIBOUTI);
          if (!a || !b) return null;
          const d = arcPath(c.proj, ADDIS, DJIBOUTI, 40);
          const t = appLen(f, start + 46, 40);
          return (
            <g>
              {arcOn ? (
                <>
                  <path d={d} fill="none" stroke="rgba(46,211,198,0.25)" strokeWidth={7} strokeLinecap="round" />
                  <path
                    d={d}
                    fill="none"
                    stroke={C.teal}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="1 1"
                    strokeDashoffset={1 - arcT}
                  />
                  <circle cx={a[0]} cy={a[1]} r={5} fill={C.white} />
                  <circle cx={b[0]} cy={b[1]} r={5} fill={C.teal} />
                  <circle cx={b[0]} cy={b[1]} r={12} fill="none" stroke={C.teal} strokeWidth={1.5} opacity={t} />
                </>
              ) : null}
            </g>
          );
        }}
      />

      <div style={{position: 'absolute', top: 150, left: V.SAFE.left, right: V.SAFE.right}}>
        <Kicker at={start + 2}>THE MOST POPULOUS</Kicker>
        <div style={{marginTop: 12}}>
          <Headline at={start + 6} lines={['ETHIOPIA']} size={112} />
        </div>
        <div
          style={{
            marginTop: 16,
            display: 'inline-block',
            padding: '8px 14px',
            border: `1px solid ${C.teal}`,
            fontFamily: F.mono,
            fontSize: 17,
            letterSpacing: '0.14em',
            color: C.teal,
            opacity: appear(f, start + 52, 14),
          }}
        >
          ONE CORRIDOR · DJIBOUTI
        </div>
      </div>

      <div style={{position: 'absolute', left: V.SAFE.left, right: V.SAFE.right, bottom: 240}}>
        <div style={{height: 1, background: 'rgba(160,190,215,0.2)', marginBottom: 26}} />
        <Stat at={start + 40} value="120M+" label={'PEOPLE — THE LARGEST\nLANDLOCKED POPULATION'} size={86} />
        <div
          style={{
            marginTop: 24,
            fontFamily: F.text,
            fontSize: 30,
            lineHeight: 1.35,
            color: 'rgba(230,238,246,0.9)',
            opacity: appear(f, start + 66, 14),
          }}
        >
          Almost all of its trade moves by road to one neighbour’s port.
        </div>
      </div>

      <SourceTag at={start + 4}>
        CORRIDOR: ADDIS ABABA → DJIBOUTI · POPULATION: UN WORLD POPULATION PROSPECTS
      </SourceTag>
    </AbsoluteFill>
  );
};

function appLen(f: number, start: number, dur: number) {
  return Math.max(0, Math.min(1, (f - start) / dur));
}
