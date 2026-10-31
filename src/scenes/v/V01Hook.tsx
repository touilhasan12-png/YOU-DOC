import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../../components/v2/Stage';
import {Kicker, Headline, Sub, Rule, SourceTag} from '../../components/v2/Type';
import {CL} from '../../lib/plate';
import {V, C, at, appear, eo} from '../../config/vertical';

/** V01 -- the cold open: the whole Earth, and 44 states that cannot reach the sea. */
export const V01Hook: React.FC = () => {
  const f = useCurrentFrame();

  // west -> east sweep, so the fills read as one wave crossing the planet
  const order = [...CL].sort((a, b) => (a.lng ?? 0) - (b.lng ?? 0)).map((c) => c.iso2);
  const fills = Object.fromEntries(order.map((iso, i) => [iso, {color: C.red, from: 26 + i * 1.35, opacity: 0.66}]));

  const plane = {
    s: at(f, 0, 240, 1.26, 1.32),
    ty: at(f, 0, 240, 4, -8),
    rx: at(f, 0, 240, 31, 27),
  };
  const t = appear(f, 96, 16);

  return (
    <AbsoluteFill>
      <Stage cam={{lng: 20, lat: 26, across: 222}} plates={['p_world']} plane={plane} frame={f} fills={fills} flags={[]} />

      <div style={{position: 'absolute', top: 150, left: V.SAFE.left, right: V.SAFE.right}}>
        <Kicker at={4}>THE LANDLOCKED STATES</Kicker>
        <div style={{marginTop: 18}}>
          <Headline at={10} lines={['44 COUNTRIES', 'HAVE NO SEA.']} size={112} />
        </div>
        <Rule at={30} />
        <Sub at={40} style={{maxWidth: 820}}>
          No port. No navy.
          <br />
          No direct line to the ocean.
        </Sub>
      </div>

      {/* datum block: the count, the share, and a proportion bar */}
      <div
        style={{
          position: 'absolute',
          left: V.SAFE.left,
          right: V.SAFE.right,
          bottom: 300,
          opacity: t,
          transform: `translateY(${(1 - eo(t)) * 14}px)`,
        }}
      >
        <div style={{height: 1, background: 'rgba(160,190,215,0.22)', marginBottom: 26}} />
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 28}}>
          <div style={{fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 150, lineHeight: 0.78, color: C.white}}>
            {Math.round(44 * eo(appear(f, 96, 32)))}
          </div>
          <div style={{paddingBottom: 12}}>
            <div style={{fontFamily: 'JetBrains Mono', fontSize: 21, letterSpacing: '0.2em', color: C.amber, lineHeight: 1.6}}>
              STATES WITH
              <br />
              NO COASTLINE
            </div>
            <div style={{fontFamily: 'Inter', fontSize: 25, color: C.dim, marginTop: 8}}>Roughly one in five countries.</div>
          </div>
        </div>
        <div style={{marginTop: 30, height: 10, background: 'rgba(255,255,255,0.10)', width: '100%', position: 'relative'}}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${22.6 * eo(appear(f, 104, 30))}%`,
              background: C.red,
            }}
          />
        </div>
      </div>

      <SourceTag at={60}>BORDERS: NATURAL EARTH · IMAGERY: NASA GIBS · FLAGS: FLAG-ICONS (MIT)</SourceTag>
    </AbsoluteFill>
  );
};
