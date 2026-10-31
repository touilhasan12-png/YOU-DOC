import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../../components/v2/Stage';
import {Kicker, Headline, SourceTag} from '../../components/v2/Type';
import {ALL_ISO} from '../../lib/plate';
import {V, C, F, at, appear, eo} from '../../config/vertical';

/** V08 -- the close: every one of the 44 flags pinned at once, then the line. */
export const V08Close: React.FC<{start: number; end: number; drops: Array<{iso2: string; f: number}>}> = ({start, end, drops}) => {
  const f = useCurrentFrame() + start;
  const plane = {s: at(f, start, end, 1.32, 1.24), rx: at(f, start, end, 30, 26)};
  const fills = Object.fromEntries(ALL_ISO.map((i) => [i, {color: C.red, from: start + 2, opacity: 0.6}]));

  const endAt = end - 74;
  const cardT = appear(f, endAt, 18);

  return (
    <AbsoluteFill>
      <Stage
        cam={{lng: 20, lat: 24, across: 214}}
        plates={['p_world']}
        plane={plane}
        frame={f}
        fills={fills}
        flags={drops.map((d) => ({iso2: d.iso2, at: d.f, w: 20, dur: 8}))}
      />

      <div style={{position: 'absolute', top: 150, left: V.SAFE.left, right: V.SAFE.right}}>
        <Kicker at={start + 2}>EVERY ONE OF THEM</Kicker>
        <div style={{marginTop: 12}}>
          <Headline at={start + 6} lines={['44 COUNTRIES.', 'ZERO PORTS.']} size={106} />
        </div>
      </div>

      {/* end card */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: 150,
          paddingTop: 54,
          paddingLeft: V.SAFE.left,
          paddingRight: V.SAFE.right,
          background: 'linear-gradient(to bottom, rgba(3,6,10,0) 0%, rgba(3,6,10,0.94) 38%, #03060A 100%)',
          opacity: cardT,
          transform: `translateY(${(1 - eo(cardT)) * 24}px)`,
        }}
      >
        <div style={{height: 1, background: 'rgba(160,190,215,0.25)', marginBottom: 30}} />
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 62, lineHeight: 0.98, color: C.white}}>
          EVERY SHIPMENT IN OR OUT
          <br />
          CROSSES SOMEONE ELSE’S BORDER.
        </div>
        <div
          style={{
            marginTop: 26,
            display: 'flex',
            gap: 18,
            alignItems: 'center',
            fontFamily: F.mono,
            fontSize: 17,
            letterSpacing: '0.16em',
            color: C.amber,
          }}
        >
          <span style={{width: 44, height: 2, background: C.amber, display: 'inline-block'}} />
          44 LANDLOCKED STATES · 2 DOUBLY LANDLOCKED
        </div>
      </div>

      <SourceTag at={start + 4} style={{bottom: 58, opacity: cardT}}>
        BORDERS: NATURAL EARTH · IMAGERY: NASA GIBS BLUE MARBLE (PUBLIC DOMAIN) · FLAGS: FLAG-ICONS (MIT)
      </SourceTag>
    </AbsoluteFill>
  );
};
