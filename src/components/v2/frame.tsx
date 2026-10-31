import {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';

/**
 * ABSOLUTE FRAME CONTEXT.
 * Scenes live inside <Sequence from={sceneStart}>, so useCurrentFrame() is
 * local. Every cue in this film is written in ABSOLUTE film frames (they come
 * from timeline.json), so shared components must add the sequence offset or
 * they fade in at the wrong time -- silently, as opacity 0.
 */
export const FrameOffset = createContext(0);

export const useAbs = (): number => useCurrentFrame() + useContext(FrameOffset);
