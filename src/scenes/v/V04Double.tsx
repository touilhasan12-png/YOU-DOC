import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../../components/v2/Stage';
import {Kicker, Headline, SourceTag} from '../../components/v2/Type';
import {V, C, F, appear, eo} from '../../config/vertical';

/**
 * V04 -- the two doubly-landlocked states.
 * Two map cards, each showing the state AND its entire neighbourhood, with a
 * flag on every single one of them: that is the argument, made visually.
 *   Uzbekistan  -> 5 neighbours: Kazakhstan, Kyrgyzstan, Tajikistan,
 *                  Turkmenistan, Afghanistan -- all landlocked.
 *   Liechtenstein -> 2 neighbours: Switzerland, Austria -- both landlocked.
 */
const Card: React.FC<{
  top: number;
  h: number;
  title: string;
  sub: string;
  cam: {lng: number; lat: number; across: number};
  plate: string;
  centre: string;
  neighbours: string[];
  flags: Array<{iso2: string; f: number}>;
  frame: number;
  at: number;
  tilt: number;
}> = ({top, h, title, sub, cam, plate, centre, neighbours, flags, frame, at: atF, tilt}) => {
  const t = appear(frame, atF, 16);
  const fills: Record<string, {color: string; from: number; opacity: number}> = {
    [centre]: {color: C.amber, from: atF, opacity: 0.75},
  };
  for (const n of neighbours) fills[n] = {color: C.red, from: atF + 6, opacity: 0.3};

  return (
    <div
      style={{
        position: 'absolute',
        left: 34,
        width: V.W - 68,
        top,
        height: h,
        opacity: t,
        transform: `translateY(${(1 - eo(t)) * 18}px)`,
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid rgba(160,190,215,0.22)',
        boxShadow: '0 26px 60px rgba(0,0,0,0.6)',
      }}
    >
      <Stage
        cam={cam}
        plates={[plate, 'p_world']}
        plane={{s: 1.1, rx: tilt}}
        frame={frame}
        ov={1.16}
        vp={{w: V.W - 68, h}}
        fills={fills}
        flags={flags.map((f) => ({iso2: f.iso2, at: f.f, w: 38, dur: 9}))}
        scrim={0}
        backdrop={false}
        slabEdge={false}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '54px 24px 18px',
          background: 'linear-gradient(to bottom, rgba(3,6,10,0) 0%, rgba(3,6,10,0.86) 62%, rgba(3,6,10,0.96) 100%)',
        }}
      >
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 52, color: C.white, lineHeight: 0.95}}>{title}</div>
        <div style={{fontFamily: F.mono, fontSize: 16, letterSpacing: '0.14em', color: C.amber, marginTop: 6}}>{sub}</div>
      </div>
    </div>
  );
};

export const V04Double: React.FC<{start: number; drops: Array<{iso2: string; f: number}>}> = ({start, drops}) => {
  const f = useCurrentFrame() + start;
  const uzAt = drops[0]?.f ?? start + 16;
  const liAt = drops[1]?.f ?? start + 60;
  const lastFlag = (iso2: string, base: number, i: number) => ({iso2, f: base + 8 + i * 5});

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 132, left: V.SAFE.left, right: V.SAFE.right}}>
        <Kicker at={start + 2}>DOUBLY LANDLOCKED</Kicker>
        <div style={{marginTop: 10}}>
          <Headline at={start + 6} lines={['BOXED IN', 'TWICE OVER']} size={88} />
        </div>
      </div>

      <Card
        top={520}
        h={560}
        title="UZBEKISTAN"
        sub="5 NEIGHBOURS · ALL 5 LANDLOCKED"
        cam={{lng: 64.5, lat: 41, across: 46}}
        plate="p_casia"
        centre="uz"
        neighbours={['kz', 'kg', 'tj', 'tm', 'af']}
        flags={[{iso2: 'uz', f: uzAt}, ...['kz', 'kg', 'tj', 'tm', 'af'].map((i, n) => lastFlag(i, uzAt, n))]}
        frame={f}
        at={start + 10}
        tilt={14}
      />

      <Card
        top={1110}
        h={480}
        title="LIECHTENSTEIN"
        sub="2 NEIGHBOURS · BOTH LANDLOCKED"
        cam={{lng: 10, lat: 46.6, across: 16}}
        plate="p_alps"
        centre="li"
        neighbours={['ch', 'at']}
        flags={[{iso2: 'li', f: liAt}, ...['ch', 'at'].map((i, n) => lastFlag(i, liAt, n))]}
        frame={f}
        at={liAt - 4}
        tilt={14}
      />

      <SourceTag at={start + 4}>NEIGHBOUR DATA: NATURAL EARTH BORDERS · THE ONLY TWO SUCH STATES ON EARTH</SourceTag>
    </AbsoluteFill>
  );
};
