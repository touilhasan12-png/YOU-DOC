import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {geoNaturalEarth1, geoMercator, geoPath} from 'd3-geo';
import {MapStage, SourceTag} from '../components/MapStage';
import {Headline, Kicker} from '../components/Title';
import {ChokepointMarker} from '../components/ChokepointMarker';
import {GeoLabels} from '../components/GeoLabels';
import {FlowArcs} from '../components/FlowArcs';
import {COLORS, EASE, HEIGHT, SAFE, WIDTH} from '../theme/tokens';
import {clamp, fadeIn} from '../lib/anim';
import {boxPoly, centerOn, zoomed} from '../lib/geo';
import {chokepoints} from '../data/chokepoints';

const regionBox = (id: string) => chokepoints.find((c) => c.id === id)!.bbox;
const regionCenter = (id: string) => chokepoints.find((c) => c.id === id)!.lngLat;

/**
 * HOOK -- 25s, 4 shots, nothing on screen longer than 1.8s of new information.
 * Shot H01 = the only hero shot in the film (continuous zoom-in, used once).
 */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();

  // ---- H01 (0 -> 1.7s): world -> deep zoom. Hero. Never repeated.
  const h1 = clamp(f / (1.7 * fps));
  const zoomWorld = geoNaturalEarth1().fitExtent(
    [[SAFE.left, SAFE.top], [WIDTH - SAFE.right, HEIGHT - SAFE.bottom]],
    {type: 'Sphere'} as never,
  );
  // stage A: global (with title), stage B: regional (markers)
  const phase = f < 1.7 * fps ? 'A' : 'B';

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.ink}}>
      {phase === 'A' ? (
        <MapStage projection={zoomWorld} landFill={COLORS.land}>
          <AbsoluteFill style={{padding: SAFE.top, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            <Kicker start={4}>7 CHOKEPOINTS</Kicker>
            <div style={{height: 18}} />
            <div style={{textAlign: 'center'}}>
              <Headline start={8} size={132}>
                THE SEVEN
                <br />
                CHOKEPOINTS
              </Headline>
            </div>
            <div style={{height: 46}} />
            <div
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 22,
                letterSpacing: '0.16em',
                color: COLORS.textDim,
                opacity: fadeIn(f, 16, 10),
                textTransform: 'uppercase',
              }}
            >
              WHERE THE WORLD&apos;S TRADE CAN BE STOPPED
            </div>
            {/* white flash-free wipe: opacity only, single pass */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: COLORS.ink,
                opacity: interpolate(h1, [0.72, 1], [0, 0.0], {extrapolateLeft: 'clamp'}),
              }}
            />
          </AbsoluteFill>
        </MapStage>
      ) : null}

      {phase === 'B' ? <HookRegion frame={f} /> : null}
      <SourceTag text="Basemap: Natural Earth (public domain) · Analysis: see methodology" />
    </AbsoluteFill>
  );
};

/** H02 / H03 / H04 -- three fast regional states. */
const HookRegion: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const t = frame - 1.7 * fps;
  const seqs = [
    {start: 0, dur: 1.4, id: 'hormuz'},
    {start: 1.4, dur: 1.3, id: 'malacca'},
    {start: 2.7, dur: 1.6, id: 'world'},
  ];

  return (
    <>
      {seqs.map((s) => {
        const local = t - s.start * fps;
        if (local < 0 || local > s.dur * fps) return null;

        if (s.id === 'world') {
          const proj = geoNaturalEarth1().fitExtent(
            [[SAFE.left, SAFE.top], [WIDTH - SAFE.right, HEIGHT - SAFE.bottom]],
            {type: 'Sphere'} as never,
          );
          const path = geoPath(proj);
          const outOpacity = 1 - fadeIn(local, s.dur * fps - 8, 8, EASE.in);

          return (
            <div key={s.start} style={{opacity: outOpacity}}>
              <MapStage projection={proj} showGraticule={false}>
                <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute'}}>
                  <GeoLabels projection={proj} bbox={[-180, -70, 180, 80]} start={0} density="sparse" />
                  <FlowArcs
                    projection={proj}
                    pathGen={(o) => path(o as never) ?? ''}
                    from={regionCenter('hormuz')}
                    to={[3.0, 51.5]}
                    start={2}
                    travelDot
                  />
                  <FlowArcs
                    projection={proj}
                    pathGen={(o) => path(o as never) ?? ''}
                    from={regionCenter('malacca')}
                    to={[-118.4, 33.7]}
                    start={8}
                    travelDot
                  />
                  <FlowArcs
                    projection={proj}
                    pathGen={(o) => path(o as never) ?? ''}
                    from={regionCenter('babalmandeb')}
                    to={regionCenter('gibraltar')}
                    start={14}
                    travelDot
                  />
                </svg>
              </MapStage>
            </div>
          );
        }

        const bbox = regionBox(s.id);
        const c = chokepoints.find((x) => x.id === s.id)!;
        // camera: fit bbox, then push in and pull the point off-centre so the
        // label sits in the free third of the frame (editorial composition).
        const base = geoMercator().fitExtent(
          [[SAFE.left, SAFE.top], [WIDTH - SAFE.right, HEIGHT - SAFE.bottom]],
          boxPoly(bbox),
        );
        const proj = centerOn(zoomed(base, 1.35), c.lngLat, [WIDTH * 0.62, HEIGHT * 0.42]);
        const [lx, ly] = proj(c.lngLat)!;

        // gentle, capped push-in (no shake): scale 1 -> 1.02 only
        const push = 1 + 0.02 * EASE.out(clamp(local / (s.dur * fps)));
        const outOpacity = 1 - fadeIn(local, s.dur * fps - 7, 7, EASE.in);

        return (
          <div key={s.start} style={{opacity: outOpacity}}>
            <div style={{position: 'absolute', inset: 0, transform: `scale(${push})`}}>
              <MapStage projection={proj} showGraticule={false}>
                <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute'}}>
                  <GeoLabels projection={proj} bbox={bbox} start={6} />
                  <ChokepointMarker x={lx} y={ly} label={c.short} start={4} color={COLORS.hot} />
                </svg>
              </MapStage>
            </div>
            <div
              style={{
                position: 'absolute',
                left: SAFE.left,
                bottom: SAFE.bottom + 40,
                opacity: fadeIn(local, 6, 10),
                fontFamily: 'Barlow Condensed',
                fontSize: 76,
                fontWeight: 700,
                color: COLORS.text,
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}
            >
              {c.name}
            </div>
            <div
              style={{
                position: 'absolute',
                left: SAFE.left,
                bottom: SAFE.bottom,
                opacity: fadeIn(local, 10, 10),
                fontFamily: 'JetBrains Mono',
                fontSize: 24,
                color: COLORS.accent,
                letterSpacing: '0.08em',
              }}
            >
              {c.fact.toUpperCase()}
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, transparent 60%, rgba(6,9,15,0.85) 135%)`}} />
    </>
  );
};

export const HOOK_FRAMES = Math.round(4.3 * 30); // 25s hook placeholder-safe
