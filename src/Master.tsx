import React from 'react';
import {AbsoluteFill, Sequence, Audio, staticFile} from 'remotion';
import {Hook} from './scenes/Hook';
import {Ranking} from './scenes/Ranking';
import {TimedCaptions, type Cue} from './components/Captions';
import {FPS} from './theme/tokens';

/**
 * MASTER -- the film is an explicit list of sequences.
 * Nothing overlaps by accident: every start/duration is written down here.
 * Audio is optional at this stage (audio stage is gated: we stop and ask).
 */
export const MASTER_FRAMES = 4.3 * FPS + 8 * FPS; // 12.3s scaffold (full film later)

const cues: Cue[] = []; // filled by the audio stage (WhisperX). Empty => no captions.

export const Master: React.FC<{withAudio?: boolean}> = ({withAudio = false}) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#06090F'}}>
      <Sequence from={0} durationInFrames={Math.round(4.3 * FPS)} name="Hook">
        <Hook />
      </Sequence>
      <Sequence from={Math.round(4.3 * FPS)} durationInFrames={8 * FPS} name="Ranking">
        <Ranking />
      </Sequence>
      <TimedCaptions cues={cues} fps={FPS} />
      {withAudio ? <Audio src={staticFile('audio/narration.wav')} /> : null}
    </AbsoluteFill>
  );
};
