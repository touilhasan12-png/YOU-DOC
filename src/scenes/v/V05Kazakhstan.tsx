import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../../components/v2/Stage';
import {Kicker, Headline, SourceTag, Stat} from '../../components/v2/Type';
import {V, C, F, at, appear} from '../../config/vertical';

/** V05 -- the largest landlocked state on Earth. */
export const V05Kazakhstan: React.FC<{start: number; drops: Array<{iso2: string; f: number}>}> = ({start, drops}) => {
  const f = useCurrentFrame() + start;
  const plane = {s: at(f, start, start + 240, 1.26, 1.34), rx: at(f, start, start + 240, 27, 23)};

  return (
    <AbsoluteFill>
      <Stage
        cam={{lng: 67, lat: 44, across: 42}}
        plates={['p_casia', 'p_world']}
        plane={plane}
        frame={f}
        fills={{kz: {color: C.red, from: start + 4, opacity: 0.74}}}
        flags={drops.map((d) => ({iso2: d.iso2, at: d.f, w: 78, dur: 12, label: 'KAZAKHSTAN'}))}
        planeSvg={() => null}
      />

      <div style={{position: 'absolute', top: 150, left: V.SAFE.left, right: V.SAFE.right}}>
        <Kicker at={start + 2}>THE LARGEST</Kicker>
        <div style={{marginTop: 12}}>
          <Headline at={start + 6} lines={['KAZAKHSTAN']} size={112} />
        </div>
      </div>

      <div style={{position: 'absolute', left: V.SAFE.left, right: V.SAFE.right, bottom: 240}}>
        <div style={{height: 1, background: 'rgba(160,190,215,0.2)', marginBottom: 26}} />
        <div style={{display: 'flex', gap: 44, alignItems: 'flex-end'}}>
          <Stat at={start + 40} value="2.72M" label={'SQUARE\nKILOMETRES'} size={82} accent={C.white} />
          <div style={{width: 1, alignSelf: 'stretch', background: 'rgba(160,190,215,0.22)'}} />
          <Stat at={start + 52} value="0 m" label={'OF\nCOASTLINE'} size={82} accent={C.red2} />
        </div>
        <div
          style={{
            marginTop: 28,
            fontFamily: F.text,
            fontSize: 30,
            lineHeight: 1.35,
            color: 'rgba(230,238,246,0.9)',
            opacity: appear(f, start + 64, 14),
          }}
        >
          Bigger than any other landlocked country — and every export still
          has to leave through somebody else’s port.
        </div>
      </div>

      <SourceTag at={start + 4}>AREA 2,724,900 KM² · FIVE NEIGHBOURS, NO COAST</SourceTag>
    </AbsoluteFill>
  );
};
