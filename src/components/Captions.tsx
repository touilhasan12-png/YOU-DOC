import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLORS, SAFE} from '../theme/tokens';

/**
 * ALIGNED CAPTIONS.
 * Timings are NEVER typed by hand: they are produced by WhisperX forced
 * alignment and dumped to src/data/captions.json. This component just renders.
 * If captions.json is missing, it renders nothing (fail-safe, never fake sync).
 */
export type Cue = {startMs: number; endMs: number; text: string};

export const TimedCaptions: React.FC<{cues: Cue[]; fps: number}> = ({cues, fps}) => {
  const f = useCurrentFrame();
  const ms = (f / fps) * 1000;
  const cue = cues.find((c) => ms >= c.startMs && ms < c.endMs);
  if (!cue) return null;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: SAFE.bottom - 10}}>
      <div
        style={{
          maxWidth: 1280,
          textAlign: 'center',
          fontFamily: 'Inter',
          fontSize: 34,
          fontWeight: 500,
          color: COLORS.text,
          textShadow: '0 2px 12px rgba(0,0,0,0.9)',
          lineHeight: 1.25,
        }}
      >
        {cue.text}
      </div>
    </AbsoluteFill>
  );
};
