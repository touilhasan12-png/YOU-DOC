import React from 'react';
import {C, F, appear, eo} from '../../config/vertical';
import {useAbs} from './frame';

/**
 * HERO TYPE -- the references' voice: a very heavy grotesque, centred over the
 * map, with a hard black shadow so it stays legible on bright jungle and bright
 * sand alike. Words can carry their own glow (the "LYING" trick).
 *
 * Everything here is screen space: it is never tilted with the plate.
 */

export type HeroLine = {
  t: string;
  color?: string;
  /** halo colour; omit for a plain word */
  glow?: string;
  /** multiplier on the block size, for one word that must shout */
  scale?: number;
};

const SHADOW = '0 6px 26px rgba(0,0,0,0.92), 0 2px 7px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)';

export const Hero: React.FC<{
  lines: HeroLine[];
  at: number;
  /** cap height in px */
  size?: number;
  /** distance from the top of the frame to the block, in px */
  top?: number;
  align?: 'center' | 'left';
  lineHeight?: number;
  style?: React.CSSProperties;
}> = ({lines, at, size = 108, top, align = 'center', lineHeight = 0.95, style}) => {
  const cur = useAbs(); // absolute film frame (Sequence offsets handled)
  const f = at < 0 ? 10_000 : cur; // at=-1 means "settled", used by stills
  return (
    <div
      style={{
        position: 'absolute',
        left: align === 'center' ? 0 : 60,
        right: align === 'center' ? 0 : 60,
        top,
        textAlign: align,
        fontFamily: F.text,
        fontWeight: 900,
        lineHeight,
        letterSpacing: '-0.028em',
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {lines.map((l, i) => {
        const start = at < 0 ? -1 : at + i * 5;
        const t = at < 0 ? 1 : appear(f, start, 10);
        const s = size * (l.scale ?? 1);
        return (
          <div
            key={i}
            style={{
              fontSize: s,
              color: l.color ?? '#FFFFFF',
              opacity: t,
              transform: `translateY(${(1 - eo(t)) * 30}px) scale(${0.985 + 0.015 * eo(t)})`,
              textShadow: l.glow
                ? `0 0 26px ${l.glow}, 0 0 70px ${l.glow}, ${SHADOW}`
                : SHADOW,
            }}
          >
            {l.t}
          </div>
        );
      })}
    </div>
  );
};

/** small mono label, the only place a light weight is allowed */
export const Tag: React.FC<{
  children: React.ReactNode;
  at?: number;
  top?: number;
  left?: number;
  color?: string;
  align?: 'left' | 'center';
}> = ({children, at = -1, top = 130, left = 60, color = C.amber, align = 'left'}) => {
  const cur = useAbs();
  const f = at < 0 ? 10_000 : cur;
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: align === 'center' ? 0 : left,
        right: align === 'center' ? 0 : undefined,
        textAlign: align,
        fontFamily: F.mono,
        fontWeight: 600,
        fontSize: 24,
        letterSpacing: '0.34em',
        color,
        opacity: at < 0 ? 1 : appear(f, at, 10),
        textShadow: '0 2px 12px rgba(0,0,0,0.95)',
      }}
    >
      {children}
    </div>
  );
};

/** the watermark, bottom-left, exactly where the references put theirs */
export const Mark: React.FC<{text?: string}> = ({text = 'GEO STUDIO'}) => (
  <div
    style={{
      position: 'absolute',
      left: 46,
      bottom: 62,
      fontFamily: F.mono,
      fontWeight: 600,
      fontSize: 21,
      letterSpacing: '0.16em',
      color: 'rgba(255,255,255,0.62)',
      textShadow: '0 2px 10px rgba(0,0,0,0.9)',
    }}
  >
    {text}
  </div>
);

/** a straight bar of copy along the bottom, for the one supporting line */
export const Lede: React.FC<{children: React.ReactNode; at?: number; bottom?: number; size?: number}> = ({
  children,
  at = -1,
  bottom = 168,
  size = 40,
}) => {
  const cur = useAbs();
  const f = at < 0 ? 10_000 : cur;
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        bottom,
        textAlign: 'center',
        fontFamily: F.text,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1.25,
        letterSpacing: '-0.01em',
        color: 'rgba(255,255,255,0.95)',
        opacity: at < 0 ? 1 : appear(f, at, 12),
        textShadow: SHADOW,
      }}
    >
      {children}
    </div>
  );
};
