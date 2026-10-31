import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import TIMELINE from '../data/timeline.json';
import {V01Hook} from './v/V01Hook';
import {ContinentBeat} from './v/V02Continents';
import {V03Share} from './v/V03Share';
import {V04Double} from './v/V04Double';
import {V05Kazakhstan} from './v/V05Kazakhstan';
import {V06Ethiopia} from './v/V06Ethiopia';
import {V07Bolivia} from './v/V07Bolivia';
import {V08Close} from './v/V08Close';
import {C} from '../config/vertical';
import {FrameOffset} from '../components/v2/frame';

/**
 * VERTICAL -- the film, assembled from data.
 * Every Sequence start/duration comes from src/data/timeline.json, which is
 * derived from the real voice-over durations (scripts/build_timeline.py).
 * Nothing here is hand-timed, so the picture cannot drift from the narration.
 */
export const T = TIMELINE as unknown as {
  fps: number;
  totalFrames: number;
  vo: Array<{src: string; start: number; durSec: number}>;
  scenes: Array<{id: string; start: number; end: number; vo: number; frames: number}>;
  subshots: Array<{id: string; region: 'africa' | 'europe' | 'asia' | 'samerica'; start: number; end: number}>;
  drops: Record<string, Array<{iso2: string; f: number}>>;
};

export const VERTICAL_FRAMES = T.totalFrames;

const scene = (id: string) => T.scenes.find((s) => s.id === id)!;

const Beat: React.FC<{id: string; index: number}> = ({id, index}) => {
  const sub = T.subshots.find((s) => s.id === id)!;
  return (
    <Sequence from={sub.start} durationInFrames={sub.end - sub.start} name={id}>
      <FrameOffset.Provider value={sub.start}>
        <ContinentBeat
          region={sub.region}
          start={sub.start}
          end={sub.end}
          index={index}
          drops={T.drops[id] ?? []}
        />
      </FrameOffset.Provider>
    </Sequence>
  );
};

export const Vertical: React.FC = () => {
  const s1 = scene('V01');
  const s3 = scene('V03');
  const s4 = scene('V04');
  const s5 = scene('V05');
  const s6 = scene('V06');
  const s7 = scene('V07');
  const s8 = scene('V08');

  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <Sequence from={s1.start} durationInFrames={s1.end - s1.start} name="V01 hook">
        <V01Hook />
      </Sequence>

      <Beat id="V02a" index={0} />
      <Beat id="V02b" index={1} />
      <Beat id="V02c" index={2} />
      <Beat id="V02d" index={3} />

      <Sequence from={s3.start} durationInFrames={s3.end - s3.start} name="V03 share">
        <FrameOffset.Provider value={s3.start}><V03Share start={s3.start} /></FrameOffset.Provider>
      </Sequence>

      <Sequence from={s4.start} durationInFrames={s4.end - s4.start} name="V04 doubly">
        <FrameOffset.Provider value={s4.start}><V04Double start={s4.start} drops={T.drops.V04 ?? []} /></FrameOffset.Provider>
      </Sequence>

      <Sequence from={s5.start} durationInFrames={s5.end - s5.start} name="V05 kazakhstan">
        <FrameOffset.Provider value={s5.start}><V05Kazakhstan start={s5.start} drops={T.drops.V05 ?? []} /></FrameOffset.Provider>
      </Sequence>

      <Sequence from={s6.start} durationInFrames={s6.end - s6.start} name="V06 ethiopia">
        <FrameOffset.Provider value={s6.start}><V06Ethiopia start={s6.start} drops={T.drops.V06 ?? []} /></FrameOffset.Provider>
      </Sequence>

      <Sequence from={s7.start} durationInFrames={s7.end - s7.start} name="V07 bolivia">
        <FrameOffset.Provider value={s7.start}><V07Bolivia start={s7.start} drops={T.drops.V07 ?? []} /></FrameOffset.Provider>
      </Sequence>

      <Sequence from={s8.start} durationInFrames={s8.end - s8.start} name="V08 close">
        <FrameOffset.Provider value={s8.start}><V08Close start={s8.start} end={s8.end} drops={T.drops.V08 ?? []} /></FrameOffset.Provider>
      </Sequence>

      {/* ONE mastered track: narration + music bed + sfx, mixed and normalised
          offline to -14 LUFS / -1 dBTP. Nothing is mixed at render time. */}
      <Audio src={staticFile('audio/master.wav')} />
    </AbsoluteFill>
  );
};
