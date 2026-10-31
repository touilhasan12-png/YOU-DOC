import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {StageX} from '../../components/v2/StageX';
import {Hero, Tag, Mark, Lede} from '../../components/v2/Hero';
import {REGION_OF} from '../../lib/plate';
import {C} from '../../config/vertical';

/**
 * LOOK TEST -- three frames, nothing else.
 *
 * Rendered as stills at frame 0, 1 and 2 (see .github/workflows/look-test.yml).
 * Each frame is one composition of the new visual language, so the client can
 * accept or reject the look before a single second of the film is rendered.
 *
 *   frame 0  full-bleed continent, 44 states glowing, hero statement
 *   frame 1  the flag language: every country of a continent carrying its flag
 *   frame 2  one country, its whole neighbourhood, the doubly-landlocked claim
 *
 * Type and fills are forced to their settled state (at = -1, stage frame 1000)
 * because a still is not a moment in a move.
 */

const SETTLED = 1000;
const RED = '#E23A2C';
const RED_HALO = '#FF5A3C';
const AMBER = '#FFB020';
const AMBER_HALO = '#FFC24D';

const UZ_NEIGHBOURS = ['kz', 'kg', 'tj', 'af', 'tm'];

/** frame 0 -- the statement, over a continent that fills the frame */
const Hook: React.FC = () => (
  <>
    <StageX
      cam={{lng: 16, lat: 16, across: 78}}
      plates={['p_world']}
      frame={SETTLED}
      s={1.34}
      tilt={8}
      fills={Object.fromEntries(
        [...REGION_OF.africa, ...REGION_OF.europe, ...REGION_OF.asia, ...(REGION_OF.samerica ?? [])].map((iso) => [
          iso,
          {color: RED, opacity: 0.5, halo: RED_HALO},
        ]),
      )}
    />
    <Tag top={150} align="center">
      THE LANDLOCKED STATES
    </Tag>
    <Hero
      top={760}
      at={-1}
      size={118}
      lines={[{t: '44 countries'}, {t: 'have no sea.', glow: 'rgba(255,70,50,0.95)'}]}
    />
    <Lede bottom={210} size={42}>
      One country in five cannot reach the ocean.
    </Lede>
    <Mark />
  </>
);

/** frame 1 -- the flag language, on a continent where it can breathe */
const Flags: React.FC = () => (
  <>
    <StageX
      cam={{lng: 20, lat: 2, across: 46}}
      plates={['p_world']}
      frame={SETTLED}
      s={1.34}
      tilt={9}
      fills={Object.fromEntries(REGION_OF.africa.map((iso) => [iso, {color: RED, opacity: 0.46, halo: RED_HALO}]))}
      flags={REGION_OF.africa.map((iso) => ({iso2: iso, at: -900, w: 62}))}
    />
    <Tag top={132} align="center">
      AFRICA
    </Tag>
    <Hero top={186} at={-1} size={150} lines={[{t: '16 states'}, {t: 'with no coast', glow: 'rgba(255,70,50,0.9)'}]} />
    <Lede bottom={196} size={38}>
      Every one of them carries its own flag.
    </Lede>
    <Mark />
  </>
);

/** frame 2 -- one country, its neighbourhood, and the claim that makes it rare */
const Doubly: React.FC = () => (
  <>
    <StageX
      cam={{lng: 66, lat: 42, across: 26}}
      plates={['p_world', 'p_casia']}
      frame={SETTLED}
      s={1.34}
      tilt={10}
      fills={{
        uz: {color: AMBER, opacity: 0.62, halo: AMBER_HALO},
        ...Object.fromEntries(UZ_NEIGHBOURS.map((iso) => [iso, {color: RED, opacity: 0.40, halo: RED_HALO}])),
      }}
      flags={[{iso2: 'uz', at: -900, w: 84, tone: 'amber'}]}
    />
    <Tag top={700} align="center" color={AMBER}>
      DOUBLY LANDLOCKED
    </Tag>
    <Hero top={760} at={-1} size={116} lines={[{t: 'Uzbekistan', glow: 'rgba(255,176,32,0.85)'}]} />
    <Lede bottom={210} size={40}>
      All five of its neighbours are landlocked too.
    </Lede>
    <Mark />
  </>
);

export const LookTest: React.FC = () => {
  const i = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      {i === 0 ? <Hook /> : i === 1 ? <Flags /> : <Doubly />}
    </AbsoluteFill>
  );
};
