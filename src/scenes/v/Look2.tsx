import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {StageX} from '../../components/v2/StageX';
import {Hero, Tag, Mark, Lede} from '../../components/v2/Hero';
import {Prop} from '../../components/v2/Prop';
import {REGION_OF} from '../../lib/plate';
import {C, at, clamp01} from '../../config/vertical';

/**
 * LOOK 2 -- what changed after the corrections:
 *   (a) a flag FALLS and WEARS the country, fills it to its borders, holds while
 *       the narrator is on it, then hands back to the neon halo   -- frames 1 and 2
 *   (b) a real 3D tilt (20-24 deg) instead of the invisible 8 deg -- every frame
 *   (c) cut-out objects placed on the glass with hard shadows      -- frames 0 and 3
 *
 * `LookStill` renders frames 0..3 as stills. `LookMotion` is 90 frames (3 s)
 * where all three happen in motion, because a still cannot show a camera move.
 */

const SETTLED = 1000;
const RED = '#E23A2C';
const RED_HALO = '#FF5A3C';
const AMBER = '#FFB020';
const AMBER_HALO = '#FFC24D';

const AFRICA = REGION_OF.africa;
const fillsAll = Object.fromEntries(AFRICA.map((iso) => [iso, {color: RED, opacity: 0.46, halo: RED_HALO}]));

/** frame 0 -- the statement, with two cut-out objects on the glass */
const F0: React.FC = () => (
  <>
    <StageX
      cam={{lng: 18, lat: 4, across: 52}}
      plates={['p_world']}
      frame={SETTLED}
      s={1.34}
      tilt={20}
      rz={-1.5}
      allBorders
      fills={fillsAll}
    />
    <Prop src="props/binoculars.png" x={252} y={1436} w={470} frame={SETTLED} from={-900} motion="rise" rotate={-8} />
    <Prop src="props/barrier.png" x={812} y={1668} w={520} frame={SETTLED} from={-900} motion="right" rotate={4} />
    <Tag top={150} align="center">
      THE LANDLOCKED STATES
    </Tag>
    <Hero top={700} at={-1} size={116} lines={[{t: '44 countries'}, {t: 'have no sea.', glow: 'rgba(255,70,50,0.95)'}]} />
    <Mark />
  </>
);

/** frame 1 -- four countries WEARING their flag, up against their own borders */
const F1: React.FC = () => (
  <>
    <StageX
      cam={{lng: 20, lat: 2, across: 50}}
      plates={['p_world']}
      frame={SETTLED}
      s={1.34}
      tilt={20}
      allBorders
      fills={fillsAll}
      flagFills={[
        {iso2: 'ml', from: -900},
        {iso2: 'td', from: -900},
        {iso2: 'zm', from: -900},
        {iso2: 'et', from: -900},
      ]}
    />
    <Tag top={128} align="center">
      THE FLAG WEARS THE COUNTRY
    </Tag>
    <Hero top={176} at={-1} size={96} lines={[{t: 'every border, its own flag'}]} />
    <Lede bottom={190} size={34}>
      Mali · Chad · Zambia · Ethiopia — cut to their exact outlines.
    </Lede>
    <Mark />
  </>
);

/** frame 2 -- the same four, back on the halo: the flag hands over, it does not stay */
const F2: React.FC = () => (
  <>
    <StageX
      cam={{lng: 20, lat: 2, across: 50}}
      plates={['p_world']}
      frame={SETTLED}
      s={1.34}
      tilt={20}
      allBorders
      fills={fillsAll}
      flagFills={[
        {iso2: 'ml', from: -900, until: 900},
        {iso2: 'td', from: -900, until: 900},
        {iso2: 'zm', from: -900, until: 900},
        {iso2: 'et', from: -900, until: 900},
      ]}
    />
    <Tag top={128} align="center" color={AMBER}>
      AFTER ITS MOMENT
    </Tag>
    <Hero top={176} at={-1} size={96} lines={[{t: 'back to the halo'}]} />
    <Lede bottom={190} size={34}>
      The flag hands the country back — it does not stay behind.
    </Lede>
    <Mark />
  </>
);

/** frame 3 -- one country, heavy tilt, a cut-out object with a real shadow */
const F3: React.FC = () => (
  <>
    <StageX
      cam={{lng: 60, lat: 44, across: 38}}
      plates={['p_world', 'p_casia']}
      frame={SETTLED}
      s={1.36}
      tilt={24}
      rz={2}
      allBorders
      fills={{
        kz: {color: AMBER, opacity: 0.6, halo: AMBER_HALO},
        ...Object.fromEntries(['uz', 'tm', 'kg', 'tj', 'ru'].map((i) => [i, {color: RED, opacity: 0.34, halo: RED_HALO}])),
      }}
      flagFills={[{iso2: 'kz', from: -900}]}
    />
    <Prop src="props/oilpump.png" x={790} y={1290} w={560} frame={SETTLED} from={-900} motion="rise" />
    <Tag top={210} align="center" color={AMBER}>
      KAZAKHSTAN · LARGEST LANDLOCKED STATE
    </Tag>
    <Hero top={266} at={-1} size={104} lines={[{t: '2.72 million km²'}, {t: 'zero coastline', glow: 'rgba(255,176,32,0.85)'}]} />
    <Mark />
  </>
);

export const LookStill: React.FC = () => {
  const i = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: C.ink}}>{i === 0 ? <F0 /> : i === 1 ? <F1 /> : i === 2 ? <F2 /> : <F3 />}</AbsoluteFill>;
};

/** 90 frames: tilt moves, a flag falls and hands back, an object arrives */
export const LookMotion: React.FC = () => {
  const f = useCurrentFrame();
  const tilt = at(f, 0, 89, 14, 22);
  const s = at(f, 0, 89, 1.30, 1.42);
  const rz = at(f, 0, 89, -1.5, 1.5);
  const heroIn = clamp01((f - 6) / 12);

  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <StageX
        cam={{lng: at(f, 0, 89, 17, 23), lat: 3, across: 52}}
        plates={['p_world']}
        frame={f}
        s={s}
        tilt={tilt}
        rz={rz}
        allBorders
        fills={fillsAll}
        flagFills={[
          {iso2: 'td', from: 18, until: 62},
          {iso2: 'zm', from: 30, until: 74},
        ]}
      />
      <Prop src="props/binoculars.png" x={300} y={1420} w={430} frame={f} from={40} dur={14} motion="rise" rotate={-7} />
      <Prop src="props/barrier.png" x={810} y={1660} w={500} frame={f} from={58} dur={12} motion="right" rotate={4} />
      <Tag top={150} align="center">
        {f < 30 ? 'CAMERA TILT · 14° → 22°' : 'THE FLAG WEARS THE COUNTRY'}
      </Tag>
      <Hero top={700} at={4} size={110} lines={[{t: '44 countries'}, {t: 'have no sea.', glow: 'rgba(255,70,50,0.95)'}]} style={{opacity: heroIn}} />
      <Mark />
    </AbsoluteFill>
  );
};
