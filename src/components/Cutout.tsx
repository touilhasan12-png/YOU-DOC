import React from 'react';
import {useCurrentFrame} from 'remotion';
import {EASE, MOTION} from '../theme/tokens';
import {clamp} from '../lib/anim';

/**
 * "Cut, then move" primitive.
 * Takes any SVG/React child and animates it in from an offset with a capped
 * scale -- hard-clamped so it can never overshoot the anti-jitter law.
 */
export const Cutout: React.FC<{
  start: number;
  dur?: number;
  from?: {x?: number; y?: number; scale?: number; rotate?: number};
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({start, dur = 16, from = {}, children, style}) => {
  const f = useCurrentFrame();
  const p = EASE.out(clamp((f - start) / dur));
  const sx = 1 + ((from.scale ?? 1) - 1) * (1 - p);
  const scale = Math.min(sx, p < 0.5 ? MOTION.MAX_SCALE_OVERSHOOT : 1);
  const x = (from.x ?? 0) * (1 - p);
  const y = (from.y ?? 0) * (1 - p);
  const rot = (from.rotate ?? 0) * (1 - p);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: clamp(p * 1.4),
        transform: `translate(${x}px,${y}px) scale(${scale}) rotate(${rot}deg)`,
        transformOrigin: 'center',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
