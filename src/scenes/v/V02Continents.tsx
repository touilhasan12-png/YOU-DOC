import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../../components/v2/Stage';
import {FlagSpec} from '../../components/v2/FlagCard';
import {Kicker, SourceTag} from '../../components/v2/Type';
import {REGION_OF} from '../../lib/plate';
import {V, C, F, at, appear, eo} from '../../config/vertical';

export type BeatCfg = {
  region: 'africa' | 'europe' | 'asia' | 'samerica';
  name: string;
  cam: {lng: number; lat: number; across: number};
  plate: string;
  flagW: number;
  note: string;
  tilt: [number, number];
};

export const BEATS: Record<BeatCfg['region'], BeatCfg> = {
  africa: {
    region: 'africa',
    name: 'AFRICA',
    cam: {lng: 16, lat: 2, across: 72},
    plate: 'p_africa',
    flagW: 46,
    note: 'Sixteen of the forty-four — the largest cluster on Earth.',
    tilt: [26, 22],
  },
  europe: {
    region: 'europe',
    name: 'EUROPE',
    cam: {lng: 15, lat: 48.5, across: 27},
    plate: 'p_europe',
    flagW: 44,
    note: 'Fourteen states — five of them smaller than a city.',
    tilt: [27, 23],
  },
  asia: {
    region: 'asia',
    name: 'ASIA',
    cam: {lng: 74, lat: 32, across: 62},
    plate: 'p_asia',
    flagW: 47,
    note: 'Twelve, from the Caucasus to the steppe.',
    tilt: [26, 22],
  },
  samerica: {
    region: 'samerica',
    name: 'SOUTH AMERICA',
    cam: {lng: -60, lat: -18, across: 26},
    plate: 'p_samerica',
    flagW: 58,
    note: 'Two — Bolivia and Paraguay.',
    tilt: [24, 21],
  },
};

const ORDER = ['africa', 'europe', 'asia', 'samerica'] as const;

/**
 * V02 -- the count, continent by continent. Each beat is its own camera and its
 * own plate; the flags are the ones the timeline scheduled, so each card lands
 * exactly when its country is named.
 */
export const ContinentBeat: React.FC<{
  region: BeatCfg['region'];
  start: number;
  end: number;
  drops: Array<{iso2: string; f: number}>;
  index: number;
}> = ({region, start, end, drops, index}) => {
  const f = useCurrentFrame() + start;
  const cfg = BEATS[region];
  const iso = REGION_OF[region];

  const fills = Object.fromEntries(iso.map((i) => [i, {color: C.red, from: start + 4, opacity: 0.68}]));

  // every earlier continent stays lit but dim, so the count accumulates visually
  const earlier = ORDER.slice(0, index).flatMap((r) => REGION_OF[r]);
  const earlierFills = Object.fromEntries(earlier.map((i) => [i, {color: C.red, from: -999, opacity: 0.22}]));

  const plane = {s: at(f, start, end, 1.26, 1.33), ty: at(f, start, end, 6, -6), rx: at(f, start, end, cfg.tilt[0], cfg.tilt[1])};
  const flags: FlagSpec[] = drops.map((d) => ({iso2: d.iso2, at: d.f, w: cfg.flagW, dur: 9}));

  const tName = appear(f, start + 1, 10);
  const tNote = appear(f, start + 6, 12);
  const landed = drops.filter((d) => f >= d.f).length;

  return (
    <AbsoluteFill>
      <Stage
        cam={cfg.cam}
        plates={[cfg.plate, 'p_world'].filter((p, i, a) => a.indexOf(p) === i)}
        plane={plane}
        frame={f}
        fills={{...earlierFills, ...fills}}
        flags={flags}
        scrim={0.62}
      />

      {/* continent name, left */}
      <div
        style={{
          position: 'absolute',
          top: 300,
          left: V.SAFE.left,
          opacity: tName,
          transform: `translateX(${(1 - eo(tName)) * -18}px)`,
        }}
      >
        <Kicker at={start + 1}>{`0${index + 1} / 04`}</Kicker>
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 96, lineHeight: 0.92, color: C.white, marginTop: 6}}>
          {cfg.name}
        </div>
      </div>

      {/* running count, right */}
      <div style={{position: 'absolute', top: 286, right: V.SAFE.right, textAlign: 'right', opacity: tName}}>
        <div
          style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 168,
            lineHeight: 0.78,
            color: C.amber,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {String(iso.length).padStart(2, '0')}
        </div>
        <div style={{fontFamily: F.mono, fontSize: 18, letterSpacing: '0.22em', color: C.dim, marginTop: 10}}>OF 44</div>
      </div>

      {/* live counter of flags already pinned in this beat */}
      <div
        style={{
          position: 'absolute',
          top: 470,
          right: V.SAFE.right,
          fontFamily: F.mono,
          fontSize: 17,
          letterSpacing: '0.18em',
          color: 'rgba(168,184,200,0.85)',
          opacity: tNote,
        }}
      >
        {String(landed).padStart(2, '0')} FLAGS PINNED
      </div>

      <div
        style={{
          position: 'absolute',
          left: V.SAFE.left,
          right: V.SAFE.right,
          bottom: 250,
          opacity: tNote,
          transform: `translateY(${(1 - eo(tNote)) * 12}px)`,
        }}
      >
        <div style={{height: 1, background: 'rgba(160,190,215,0.2)', marginBottom: 20}} />
        <div style={{fontFamily: F.text, fontSize: 32, fontWeight: 500, lineHeight: 1.32, color: 'rgba(230,238,246,0.92)'}}>
          {cfg.note}
        </div>
      </div>

      <SourceTag at={start + 2}>FLAGS AND BORDERS AT TRUE POSITION · NATURAL EARTH + FLAG-ICONS</SourceTag>
    </AbsoluteFill>
  );
};
