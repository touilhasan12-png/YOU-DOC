import React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {SatelliteMap} from '../components/SatelliteMap';
import {GeoMarker, GeoText} from '../components/Overlay';
import {SourceTag} from '../components/MapStage';
import {Headline, Kicker} from '../components/Title';
import {RankingPanel} from '../components/RankingPanel';
import {shots, shotFrames, type Shot} from '../lib/shots';
import {COLORS, FONT, SAFE} from '../theme/tokens';
import {chokepoints, ranked} from '../data/chokepoints';
import {fadeIn, slideY} from '../lib/anim';
import {useCurrentFrame} from 'remotion';

/** per-region overlay content: marker anchor + the sea labels that matter */
const OVERLAY: Record<string, {pt: [number, number]; name: string; sea: Array<{t: string; p: [number, number]}>}> = {
  hormuz: {pt: [56.5, 26.6], name: 'HORMUZ', sea: [{t: 'PERSIAN GULF', p: [51.4, 27.0]}, {t: 'GULF OF OMAN', p: [58.6, 24.8]}]},
  malacca: {pt: [100.6, 2.5], name: 'MALACCA', sea: [{t: 'MALACCA STRAIT', p: [99.2, 5.2]}, {t: 'SOUTH CHINA SEA', p: [105.5, 4.0]}]},
  babalmandeb: {pt: [43.4, 12.6], name: 'BAB EL-MANDEB', sea: [{t: 'RED SEA', p: [40.5, 18.5]}, {t: 'GULF OF ADEN', p: [48.2, 11.4]}]},
  panama: {pt: [-79.6, 9.1], name: 'PANAMA', sea: [{t: 'CARIBBEAN SEA', p: [-78.5, 13.0]}, {t: 'PACIFIC OCEAN', p: [-83.0, 6.5]}]},
  gibraltar: {pt: [-5.6, 35.95], name: 'GIBRALTAR', sea: [{t: 'ATLANTIC OCEAN', p: [-9.5, 35.5]}, {t: 'ALBORAN SEA', p: [-3.5, 36.2]}]},
  bosporus: {pt: [29.05, 41.1], name: 'BOSPORUS', sea: [{t: 'BLACK SEA', p: [32.0, 43.0]}, {t: 'MARMARA SEA', p: [27.2, 40.4]}]},
  danish: {pt: [11.0, 55.3], name: 'DANISH STRAITS', sea: [{t: 'NORTH SEA', p: [5.0, 56.0]}, {t: 'BALTIC SEA', p: [15.5, 55.6]}]},
  world: {pt: [0, 0], name: '', sea: []},
};

const Layers: React.FC<{shot: Shot; region: string}> = ({shot, region}) => {
  const f = useCurrentFrame();
  const o = OVERLAY[region];
  const has = (l: string) => shot.layers.includes(l);
  return (
    <>
      {o && has('labels') && o.sea.map((s, i) => (
        <GeoText key={s.t} lngLat={s.p} region={region} text={s.t} kind="sea" start={4 + i * 3} />
      ))}
      {o && has('marker') && o.name ? (
        <GeoMarker lngLat={o.pt} region={region} label={o.name} start={3} color={COLORS.hot} />
      ) : null}
      {has('title') ? (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
          <Kicker start={3}>SEVEN CHOKEPOINTS</Kicker>
          <div style={{height: 14}} />
          <Headline start={7} size={128}>THE SEVEN CHOKEPOINTS</Headline>
          <div style={{height: 30}} />
          <div style={{fontFamily: FONT.mono, fontSize: 24, letterSpacing: '0.2em', color: COLORS.textDim,
                       opacity: fadeIn(f, 13, 10), textTransform: 'uppercase'}}>
            WHERE WORLD TRADE CAN BE STOPPED
          </div>
        </AbsoluteFill>
      ) : null}
      {has('ranking') ? <RankingPanel start={6} /> : null}
    </>
  );
};

const SingleShot: React.FC<{shot: Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  const o = OVERLAY[shot.region];
  const cp = chokepoints.find((c) => c.id === shot.region);
  const isBody = shot.scene === 'body';
  return (
    <SatelliteMap region={shot.region} camera={shot.cam} plate={isBody ? 0.34 : 0.42}>
      <Layers shot={shot} region={shot.region} />
      {isBody && cp ? (
        <>
          <div style={{position: 'absolute', left: SAFE.left, bottom: SAFE.bottom + 74,
                       opacity: fadeIn(f, 5, 10), transform: `translateY(${slideY(f, 5, 16, 12)}px)`}}>
            <div style={{fontFamily: FONT.mono, fontSize: 22, letterSpacing: '0.24em', color: COLORS.accent}}>
              {String(ranked.findIndex((r) => r.id === cp.id) + 1).padStart(2, '0')} / 07
            </div>
            <div style={{fontFamily: FONT.display, fontSize: 84, fontWeight: 700, color: COLORS.text, lineHeight: 1}}>
              {cp.name}
            </div>
          </div>
          <div style={{position: 'absolute', left: SAFE.left, bottom: SAFE.bottom,
                       opacity: fadeIn(f, 9, 10), fontFamily: FONT.mono, fontSize: 24, color: COLORS.accent2,
                       letterSpacing: '0.06em'}}>
            {cp.fact.toUpperCase()}
          </div>
        </>
      ) : null}
      {o?.name && shot.region !== 'world' ? <SourceTag text="Imagery: NASA Blue Marble (public domain)" /> : null}
    </SatelliteMap>
  );
};

/** The whole film, generated from the shot ledger. Nothing is hand-timed twice. */
export const Film: React.FC = () => {
  const {fps} = useVideoConfig();
  let from = 0;
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.ink}}>
      {shots.map((s) => {
        const dur = shotFrames(s, fps);
        const el = (
          <Sequence key={s.id} from={from} durationInFrames={dur} name={`${s.id} ${s.region}`}>
            <SingleShot shot={s} />
          </Sequence>
        );
        from += dur;
        return el;
      })}
    </AbsoluteFill>
  );
};

export const FILM_FRAMES = shots.reduce((a, s) => a + s.durMs, 0) / 1000 * 30;
