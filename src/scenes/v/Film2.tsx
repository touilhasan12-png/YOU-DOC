import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {StageX, type FXFill, type FlagFillSpec} from '../../components/v2/StageX';
import type {FlagPin} from '../../components/v2/StageX';
import {Hero, Tag, Mark, Lede} from '../../components/v2/Hero';
import {Prop} from '../../components/v2/Prop';
import {REGION_OF, type Cam} from '../../lib/plate';
import {C} from '../../config/vertical';
import {FrameOffset} from '../../components/v2/frame';

/**
 * THE LOCKED COUNTRIES -- film v2, fast cut.
 *
 * One table drives the whole film: every shot is a camera, a set of fills, the
 * flags that wear their countries, the cut-out objects that carry a NUMBER, and
 * the line of type. Nothing is hand-placed twice.
 *
 * Rhythm: a cut every 1.3-3 s (26 shots in 66.6 s). Entrances are 6-10 frames.
 * Every cut-out states a fact, and the fact is also set in type beside it, so
 * the object is information, not decoration.
 */

const RED = '#E23A2C';
const RED_HALO = '#FF5A3C';
const AMBER = '#FFB020';
const AMBER_HALO = '#FFC24D';

type PropSpec = {
  src: string;
  x: number;
  y: number;
  w: number;
  rotate?: number;
  motion?: 'rise' | 'drop' | 'left' | 'right' | 'none';
  at: number;
  until?: number;
  dur?: number;
};

type Shot = {
  id: string;
  from: number;
  to: number;
  cam: Cam;
  plates?: string[];
  tilt?: number;
  s?: number;
  rz?: number;
  /** how far the camera slides / pushes during the cut */
  dLng?: number;
  dLat?: number;
  push?: number;
  /** perspective strength: lower = the tilt reads harder */
  persp?: number;
  allBorders?: boolean;
  fills?: Record<string, FXFill>;
  /** flags that wear their countries: 'until' defaults to the end of the cut */
  flagFills?: {iso2: string; from: number; until?: number; mode?: 'fill' | 'tile'}[];
  flags?: FlagPin[];
  props?: PropSpec[];
  tag?: {text: string; color?: string; top?: number};
  hero?: {lines: {t: string; glow?: string; color?: string}[]; top: number; size: number};
  lede?: {text: string; bottom?: number; size?: number};
  mark?: boolean;
};

const africa = REGION_OF.africa;
const europe = REGION_OF.europe;
const asia = REGION_OF.asia;
const samerica = REGION_OF.samerica;
const ALL = [...africa, ...europe, ...asia, ...samerica];

const fillRegion = (list: string[], color = RED, halo = RED_HALO, opacity = 0.46): Record<string, FXFill> =>
  Object.fromEntries(list.map((iso) => [iso, {color, halo, opacity}]));

/** every named country wears its own flag, dropped onto it in a quick stagger.
 *  No badges, no pins: the flag IS the country's area, clipped by its border. */
const wear = (list: string[], from: number, until?: number): FlagFillSpec[] =>
  list.map((iso2, i) => ({iso2, from: from + i * 2, ...(until === undefined ? {} : {until})}));

/** the shot table: 26 cuts */
const SHOTS: Shot[] = [
  // ---------- V01 · the hook (0-8.3 s) ----------
  {
    id: 's01',
    from: 0,
    to: 66,
    cam: {lng: 18, lat: 4, across: 54},
    plates: ['p_africa'],
    tilt: 20,
    rz: -1.5,
    allBorders: true,
    fills: fillRegion(ALL),
    tag: {text: 'THE LANDLOCKED STATES', top: 130},
    hero: {lines: [{t: '44 countries'}, {t: 'have no sea.', glow: 'rgba(255,70,50,0.95)'}], top: 690, size: 116},
    mark: true,
  },
  {
    id: 's02',
    from: 66,
    to: 122,
    cam: {lng: 20, lat: 2, across: 44},
    plates: ['p_africa'],
    tilt: 22,
    allBorders: true,
    fills: fillRegion(ALL),
    props: [{src: 'props/binoculars.png', x: 300, y: 1380, w: 470, rotate: -7, motion: 'drop', at: 70, dur: 8}],
    tag: {text: 'NO COAST TO WATCH', top: 132},
    hero: {lines: [{t: 'no port.'}, {t: 'no navy.', glow: 'rgba(255,70,50,0.9)'}], top: 730, size: 122},
  },
  {
    id: 's03',
    from: 122,
    to: 182,
    cam: {lng: 20, lat: 2, across: 50},
    plates: ['p_africa'],
    tilt: 20,
    allBorders: true,
    fills: fillRegion(ALL),
    props: [{src: 'props/ship.png', x: 540, y: 1430, w: 900, motion: 'left', at: 126, dur: 8}],
    tag: {text: 'ZERO REGISTERED MERCHANT FLEETS', top: 132},
    hero: {lines: [{t: 'no ship'}, {t: 'of their own.', glow: 'rgba(255,70,50,0.9)'}], top: 700, size: 116},
  },
  {
    id: 's04',
    from: 182,
    to: 249,
    cam: {lng: 22, lat: 2, across: 46},
    plates: ['p_africa'],
    tilt: 24,
    rz: 1.5,
    allBorders: true,
    fills: fillRegion(ALL),
    props: [{src: 'props/barrier.png', x: 560, y: 1500, w: 1000, rotate: 3, motion: 'right', at: 186, dur: 8}],
    tag: {text: 'EVERY BORDER IS SOMEONE ELSE’S', top: 132},
    hero: {lines: [{t: 'no direct line'}, {t: 'to the sea.', glow: 'rgba(255,70,50,0.9)'}], top: 700, size: 108},
  },

  // ---------- V02 · the four continents (8.3-16.5 s) ----------
  {
    id: 's05',
    from: 249,
    to: 312,
    cam: {lng: 20, lat: 2, across: 50},
    plates: ['p_africa'],
    tilt: 20,
    allBorders: true,
    fills: fillRegion(africa),
    flagFills: wear(africa, 255),
    tag: {text: 'AFRICA', top: 120},
    hero: {lines: [{t: '16'}], top: 620, size: 300},
    lede: {text: 'of 54 African states have no coast', bottom: 180},
  },
  {
    id: 's06',
    from: 312,
    to: 374,
    cam: {lng: 15, lat: 50, across: 34},
    plates: ['p_europe'],
    tilt: 20,
    rz: -1,
    allBorders: true,
    fills: fillRegion(europe),
    flagFills: wear(europe, 318),
    tag: {text: 'EUROPE', top: 120},
    hero: {lines: [{t: '14'}], top: 620, size: 300},
    lede: {text: 'the densest cluster on Earth', bottom: 180},
  },
  {
    id: 's07',
    from: 374,
    to: 436,
    cam: {lng: 78, lat: 44, across: 62},
    plates: ['p_asia'],
    tilt: 20,
    rz: 1,
    allBorders: true,
    fills: fillRegion(asia),
    flagFills: wear(asia, 380),
    tag: {text: 'ASIA', top: 120},
    hero: {lines: [{t: '12'}], top: 620, size: 300},
    lede: {text: 'including the largest of them all', bottom: 180},
  },
  {
    id: 's08',
    from: 436,
    to: 496,
    cam: {lng: -61, lat: -19, across: 26},
    plates: ['p_bolivia','p_samerica'],
    tilt: 20,
    allBorders: true,
    fills: fillRegion(samerica),
    flagFills: wear(samerica, 442),
    tag: {text: 'SOUTH AMERICA', top: 120},
    hero: {lines: [{t: '2'}], top: 620, size: 300},
    lede: {text: 'Bolivia and Paraguay', bottom: 180},
  },

  // ---------- V03 · one in five (16.5-24 s) ----------
  {
    id: 's09',
    from: 496,
    to: 600,
    cam: {lng: 12, lat: 18, across: 82},
    plates: ['p_world'],
    tilt: 18,
    allBorders: true,
    fills: fillRegion(ALL),
    tag: {text: 'THE PLANET, COUNTED', top: 124},
    hero: {lines: [{t: 'one in five', glow: 'rgba(255,70,50,0.9)'}], top: 660, size: 150},
    lede: {text: '44 of about 195 recognised states', bottom: 200},
  },
  {
    id: 's10',
    from: 600,
    to: 719,
    cam: {lng: 12, lat: 12, across: 86},
    plates: ['p_world'],
    tilt: 20,
    rz: -1,
    allBorders: true,
    fills: fillRegion(ALL),
    tag: {text: 'LOCKED OUT BY GEOGRAPHY', top: 124},
    hero: {lines: [{t: '22.6%'}], top: 640, size: 240},
    lede: {text: 'no port of their own, on any ocean', bottom: 200},
  },

  // ---------- V04 · doubly landlocked (24-31.7 s) ----------
  {
    id: 's11',
    from: 719,
    to: 800,
    cam: {lng: 64, lat: 41.5, across: 30},
    plates: ['p_casia'],
    tilt: 24,
    allBorders: true,
    fills: {
      uz: {color: AMBER, opacity: 0.62, halo: AMBER_HALO},
      ...fillRegion(['kz', 'kg', 'tj', 'af', 'tm'], RED, RED_HALO, 0.34),
    },
    flagFills: [{iso2: 'uz', from: 726, until: 782}],
    tag: {text: 'DOUBLY LANDLOCKED', top: 700, color: AMBER},
    hero: {lines: [{t: 'uzbekistan', glow: 'rgba(255,176,32,0.85)'}], top: 754, size: 104},
    lede: {text: 'all five neighbours are landlocked too', bottom: 190},
  },
  {
    id: 's12',
    from: 800,
    to: 880,
    cam: {lng: 9.6, lat: 47.1, across: 11},
    plates: ['p_alps'],
    tilt: 22,
    allBorders: true,
    fills: {
      li: {color: AMBER, opacity: 0.66, halo: AMBER_HALO},
      ...fillRegion(['ch', 'at'], RED, RED_HALO, 0.34),
    },
    flagFills: [{iso2: 'li', from: 806, until: 862}],
    tag: {text: 'DOUBLY LANDLOCKED', top: 700, color: AMBER},
    hero: {lines: [{t: 'liechtenstein', glow: 'rgba(255,176,32,0.85)'}], top: 754, size: 92},
    lede: {text: 'two neighbours: Switzerland and Austria', bottom: 190},
  },
  {
    id: 's13',
    from: 880,
    to: 951,
    cam: {lng: 22, lat: 34, across: 84},
    plates: ['p_world'],
    tilt: 18,
    allBorders: true,
    fills: {
      uz: {color: AMBER, opacity: 0.6, halo: AMBER_HALO},
      li: {color: AMBER, opacity: 0.6, halo: AMBER_HALO},
      ...fillRegion(ALL, RED, RED_HALO, 0.26),
    },
    flagFills: wear(['uz', 'li'], 886),
    tag: {text: 'THE RAREST CASE', top: 124, color: AMBER},
    hero: {lines: [{t: 'only two'}, {t: 'on earth.', glow: 'rgba(255,176,32,0.8)'}], top: 700, size: 140},
  },

  // ---------- V05 · Kazakhstan (31.7-39.9 s) ----------
  {
    id: 's14',
    from: 951,
    to: 1030,
    cam: {lng: 68, lat: 48, across: 44},
    plates: ['p_casia'],
    tilt: 24,
    rz: 1.5,
    allBorders: true,
    fills: {
      kz: {color: AMBER, opacity: 0.6, halo: AMBER_HALO},
      ...fillRegion(['uz', 'tm', 'kg', 'tj', 'ru'], RED, RED_HALO, 0.28),
    },
    flagFills: [{iso2: 'kz', from: 958, until: 1014}],
    tag: {text: 'THE LARGEST', top: 124, color: AMBER},
    hero: {lines: [{t: 'kazakhstan'}], top: 178, size: 118},
    lede: {text: 'bigger than all of Western Europe', bottom: 186},
  },
  {
    id: 's15',
    from: 1030,
    to: 1120,
    cam: {lng: 68, lat: 48, across: 38},
    plates: ['p_casia'],
    tilt: 22,
    allBorders: true,
    fills: {kz: {color: AMBER, opacity: 0.42, halo: AMBER_HALO}},
    props: [{src: 'props/oilpump.png', x: 760, y: 1330, w: 560, motion: 'rise', at: 1034, dur: 8}],
    tag: {text: 'OIL AND GAS, NO OCEAN', top: 124, color: AMBER},
    hero: {lines: [{t: '2.72 m km²', glow: 'rgba(255,176,32,0.8)'}], top: 660, size: 132},
    lede: {text: 'exports leave through pipelines and neighbours', bottom: 186},
  },
  {
    id: 's16',
    from: 1120,
    to: 1198,
    cam: {lng: 68, lat: 48, across: 44},
    plates: ['p_casia'],
    tilt: 24,
    allBorders: true,
    fills: {kz: {color: AMBER, opacity: 0.5, halo: AMBER_HALO}},
    tag: {text: 'THE MEASUREMENT THAT MATTERS', top: 124, color: AMBER},
    hero: {lines: [{t: '0 metres'}, {t: 'of coast.', glow: 'rgba(255,70,50,0.85)'}], top: 690, size: 140},
  },

  // ---------- V06 · Ethiopia (39.9-48.6 s) ----------
  {
    id: 's17',
    from: 1198,
    to: 1280,
    cam: {lng: 39, lat: 9, across: 26},
    plates: ['p_ethiopia'],
    tilt: 22,
    allBorders: true,
    fills: {
      et: {color: AMBER, opacity: 0.58, halo: AMBER_HALO},
      ...fillRegion(['so', 'ke', 'ss', 'sd', 'er', 'dj'], RED, RED_HALO, 0.26),
    },
    flagFills: [{iso2: 'et', from: 1204, until: 1262}],
    tag: {text: 'THE MOST POPULOUS', top: 124, color: AMBER},
    hero: {lines: [{t: 'ethiopia'}], top: 178, size: 118},
    lede: {text: '120 million people, no coast', bottom: 184},
  },
  {
    id: 's18',
    from: 1280,
    to: 1370,
    cam: {lng: 39, lat: 9, across: 30},
    plates: ['p_ethiopia'],
    tilt: 24,
    rz: -1,
    allBorders: true,
    fills: {et: {color: AMBER, opacity: 0.5, halo: AMBER_HALO}},
    props: [{src: 'props/truck.png', x: 560, y: 1400, w: 860, motion: 'right', at: 1284, dur: 8}],
    tag: {text: 'ONE CORRIDOR TO THE SEA', top: 124, color: AMBER},
    hero: {lines: [{t: 'by road'}, {t: 'or not at all.', glow: 'rgba(255,176,32,0.8)'}], top: 690, size: 120},
    lede: {text: 'the Djibouti corridor carries most of its trade', bottom: 184},
  },
  {
    id: 's19',
    from: 1370,
    to: 1459,
    cam: {lng: 42, lat: 9, across: 22},
    plates: ['p_ethiopia'],
    tilt: 20,
    allBorders: true,
    fills: {et: {color: AMBER, opacity: 0.42, halo: AMBER_HALO}, dj: {color: RED, opacity: 0.4, halo: RED_HALO}},
    flagFills: wear(['et', 'dj'], 1376),
    tag: {text: '776 KILOMETRES TO A PORT', top: 124, color: AMBER},
    hero: {lines: [{t: 'everything'}, {t: 'crosses a border.', glow: 'rgba(255,70,50,0.85)'}], top: 690, size: 110},
  },

  // ---------- V07 · Bolivia (48.6-56.9 s) ----------
  {
    id: 's20',
    from: 1459,
    to: 1540,
    cam: {lng: -64, lat: -17, across: 24},
    plates: ['p_bolivia'],
    tilt: 22,
    allBorders: true,
    fills: {
      bo: {color: AMBER, opacity: 0.58, halo: AMBER_HALO},
      ...fillRegion(['pe', 'br', 'py', 'ar', 'cl'], RED, RED_HALO, 0.26),
    },
    flagFills: [{iso2: 'bo', from: 1465, until: 1522}],
    tag: {text: 'IT HAD A COAST', top: 124, color: AMBER},
    hero: {lines: [{t: 'bolivia'}], top: 178, size: 118},
    lede: {text: 'until 1884', bottom: 184},
  },
  {
    id: 's21',
    from: 1540,
    to: 1630,
    cam: {lng: -70, lat: -20, across: 20},
    plates: ['p_bolivia','p_samerica'],
    tilt: 24,
    rz: 1,
    allBorders: true,
    fills: {bo: {color: AMBER, opacity: 0.4, halo: AMBER_HALO}, cl: {color: RED, opacity: 0.55, halo: RED_HALO}},
    flagFills: wear(['bo', 'cl'], 1546),
    tag: {text: 'THE WAR OF THE PACIFIC', top: 124, color: AMBER},
    hero: {lines: [{t: '1884'}], top: 640, size: 260},
    lede: {text: 'Chile took the coast; Bolivia kept the claim', bottom: 184},
  },
  {
    id: 's22',
    from: 1630,
    to: 1708,
    cam: {lng: -69, lat: -16, across: 9},
    plates: ['p_bolivia'],
    tilt: 20,
    allBorders: true,
    fills: {bo: {color: AMBER, opacity: 0.34, halo: AMBER_HALO}},
    props: [{src: 'props/ship.png', x: 560, y: 1320, w: 760, rotate: -2, motion: 'rise', at: 1634, dur: 8}],
    tag: {text: 'LAKE TITICACA, 3,812 M UP', top: 124, color: AMBER},
    hero: {lines: [{t: 'a navy'}, {t: 'on a lake.', glow: 'rgba(255,176,32,0.85)'}], top: 700, size: 122},
  },

  // ---------- V08 · the close (56.9-66.6 s) ----------
  {
    id: 's23',
    from: 1708,
    to: 1790,
    cam: {lng: 20, lat: 2, across: 50},
    plates: ['p_africa'],
    tilt: 20,
    allBorders: true,
    fills: fillRegion(ALL, RED, RED_HALO, 0.3),
    flagFills: wear(africa, 1712),
    flagFills: wear(ALL, 1714),
    tag: {text: 'EVERY ONE OF THEM', top: 120},
    hero: {lines: [{t: '44 countries'}], top: 640, size: 150},
  },
  {
    id: 's24',
    from: 1790,
    to: 1880,
    cam: {lng: 12, lat: 16, across: 84},
    plates: ['p_world'],
    tilt: 18,
    allBorders: true,
    fills: fillRegion(ALL, RED, RED_HALO, 0.34),
    tag: {text: 'COUNTED', top: 124},
    hero: {lines: [{t: 'zero ports', glow: 'rgba(255,70,50,0.9)'}], top: 660, size: 160},
  },
  {
    id: 's25',
    from: 1880,
    to: 1998,
    cam: {lng: 20, lat: 2, across: 48},
    plates: ['p_africa'],
    tilt: 22,
    rz: -1,
    allBorders: true,
    fills: fillRegion(ALL, RED, RED_HALO, 0.3),
    props: [
      {src: 'props/truck.png', x: 380, y: 1400, w: 700, motion: 'right', at: 1884, dur: 8},
      {src: 'props/barrier.png', x: 830, y: 1560, w: 620, rotate: 4, motion: 'left', at: 1892, dur: 8},
    ],
    tag: {text: 'EVERY SHIPMENT, EVERY TIME', top: 124},
    hero: {lines: [{t: 'someone else’s'}, {t: 'border.', glow: 'rgba(255,70,50,0.9)'}], top: 690, size: 118},
    mark: true,
  },
];

/** StageX and Prop read the LOCAL frame; inside a Sequence we must give them the
 *  absolute one, otherwise every shot restarts from frame 0. */
const Inner: React.FC<{shot: Shot}> = ({shot}) => {
  const local = useCurrentFrame();
  const abs = shot.from + local;
  // the camera never sits still: it pushes in and slides for the whole cut
  const p = Math.min(1, Math.max(0, local / Math.max(1, shot.to - shot.from)));
  const cam = {
    lng: shot.cam.lng + (shot.dLng ?? 1.1) * p,
    lat: shot.cam.lat + (shot.dLat ?? 0.35) * p,
    across: shot.cam.across * (1 - (shot.push ?? 0.07) * p),
  };
  // a flag that is not given an end holds to the end of its own cut
  const flagFills = (shot.flagFills ?? []).map((f) => ({
    ...f,
    until: f.until ?? shot.to - 4,
  }));
  return (
    <>
      <StageX
        cam={cam}
        plates={shot.plates ?? ['p_world']}
        frame={abs}
        s={shot.s ?? 1.34}
        tilt={shot.tilt ?? 20}
        persp={shot.persp ?? 1500}
        rz={(shot.rz ?? 0) + 0.9 * p}
        allBorders={shot.allBorders}
        fills={shot.fills}
        flagFills={flagFills}
      />
      {(shot.props ?? []).map((p, i) => (
        <Prop key={i} src={p.src} x={p.x} y={p.y} w={p.w} rotate={p.rotate} motion={p.motion} from={p.at} until={p.until} dur={p.dur ?? 8} frame={abs} />
      ))}
      {shot.tag ? (
        <Tag top={shot.tag.top ?? 124} align="center" color={shot.tag.color}>
          {shot.tag.text}
        </Tag>
      ) : null}
      {shot.hero ? <Hero top={shot.hero.top} size={shot.hero.size} at={shot.from + 2} lines={shot.hero.lines} /> : null}
      {shot.lede ? (
        <Lede bottom={shot.lede.bottom ?? 184} size={shot.lede.size ?? 38} at={shot.from + 6}>
          {shot.lede.text}
        </Lede>
      ) : null}
      {shot.mark ? <Mark /> : null}
    </>
  );
};

export const FILM2_FRAMES = 1998;

export const Film2: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.ink}}>
    <Audio src={staticFile('audio/master.wav')} />
    {SHOTS.map((s) => (
      <Sequence key={s.id} from={s.from} durationInFrames={s.to - s.from} name={s.id}>
        {/* every cue in the table is an ABSOLUTE film frame, so the offset has to
            be published or Hero/Lede fade in at the wrong time -- invisibly. */}
        <FrameOffset.Provider value={s.from}>
          <Inner shot={s} />
        </FrameOffset.Provider>
      </Sequence>
    ))}
  </AbsoluteFill>
);
