import React from 'react';
import {COLORS, FONT, SAFE, TYPE} from '../theme/tokens';
import {fadeIn, slideY} from '../lib/anim';
import {useCurrentFrame} from 'remotion';

export const Kicker: React.FC<{children: React.ReactNode; start: number}> = ({children, start}) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: TYPE.kicker.size,
        fontWeight: TYPE.kicker.weight,
        letterSpacing: TYPE.kicker.tracking,
        color: COLORS.accent,
        opacity: fadeIn(f, start, 10),
        transform: `translateY(${slideY(f, start, 18, 10)}px)`,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
};

export const Headline: React.FC<{children: React.ReactNode; start: number; size?: number}> = ({
  children,
  start,
  size = TYPE.h1.size,
}) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: FONT.display,
        fontSize: size,
        fontWeight: TYPE.h1.weight,
        letterSpacing: TYPE.h1.tracking,
        lineHeight: 1.0,
        color: COLORS.text,
        opacity: fadeIn(f, start, 14),
        transform: `translateY(${slideY(f, start, 22, 18)}px)`,
      }}
    >
      {children}
    </div>
  );
};

export const Panel: React.FC<{children: React.ReactNode; start: number; width?: number}> = ({
  children,
  start,
  width = 560,
}) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: SAFE.left,
        top: SAFE.top + 40,
        width,
        padding: 28,
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${COLORS.accent}`,
        opacity: fadeIn(f, start, 12),
        transform: `translateY(${slideY(f, start, 20, 14)}px)`,
      }}
    >
      {children}
    </div>
  );
};
