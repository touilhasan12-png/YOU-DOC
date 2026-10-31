import React from 'react';
import {V, C, F, appear, eo} from '../../config/vertical';
import {useAbs} from './frame';

/** Editorial type for the vertical film. Screen space only -- never tilted. */

export const Kicker: React.FC<{children: React.ReactNode; at: number; color?: string; style?: React.CSSProperties}> = ({
  children,
  at,
  color = C.amber,
  style,
}) => {
  const f = useAbs();
  const t = appear(f, at, 9);
  return (
    <div
      style={{
        fontFamily: F.mono,
        fontSize: 25,
        fontWeight: 600,
        letterSpacing: '0.30em',
        color,
        opacity: t,
        transform: `translateY(${(1 - eo(t)) * 10}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Headline: React.FC<{
  lines: React.ReactNode[];
  at: number;
  size?: number;
  color?: string;
  weight?: number;
  lineHeight?: number;
  style?: React.CSSProperties;
}> = ({lines, at, size = 104, color = C.white, weight = 700, lineHeight = 0.94, style}) => {
  const f = useAbs();
  return (
    <div style={{fontFamily: F.display, fontWeight: weight, lineHeight, letterSpacing: '-0.015em', ...style}}>
      {lines.map((l, i) => {
        const t = appear(f, at + i * 4, 12);
        return (
          <div
            key={i}
            style={{
              fontSize: size,
              color,
              opacity: t,
              transform: `translateY(${(1 - eo(t)) * 26}px)`,
            }}
          >
            {l}
          </div>
        );
      })}
    </div>
  );
};

export const Sub: React.FC<{children: React.ReactNode; at: number; delay?: number; style?: React.CSSProperties}> = ({
  children,
  at,
  style,
}) => {
  const f = useAbs();
  const t = appear(f, at, 12);
  return (
    <div
      style={{
        fontFamily: F.text,
        fontSize: 34,
        fontWeight: 500,
        lineHeight: 1.3,
        color: C.dim,
        opacity: t,
        transform: `translateY(${(1 - eo(t)) * 14}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Rule: React.FC<{at: number; w?: number; color?: string}> = ({at, w = 92, color = C.amber}) => {
  const f = useAbs();
  const t = appear(f, at, 12);
  return <div style={{width: w * eo(t), height: 3, background: color, opacity: 0.9, marginTop: 16, marginBottom: 16}} />;
};

/** Big number that grows into place -- used for counts, never oscillates. */
export const Numeral: React.FC<{
  value: number;
  at: number;
  size?: number;
  color?: string;
  suffix?: string;
  countUp?: boolean;
}> = ({value, at, size = 230, color = C.white, suffix, countUp = true}) => {
  const f = useAbs();
  const t = appear(f, at, 16);
  const shown = countUp ? Math.round(value * eo(appear(f, at, 26))) : value;
  return (
    <div
      style={{
        fontFamily: F.display,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.0,
        color,
        letterSpacing: '-0.03em',
        opacity: t,
        transform: `translateY(${(1 - eo(t)) * 18}px)`,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {shown}
      {suffix ? <span style={{fontSize: size * 0.34, marginLeft: 10, color: C.amber}}>{suffix}</span> : null}
    </div>
  );
};

export const SourceTag: React.FC<{children: React.ReactNode; at?: number; style?: React.CSSProperties}> = ({
  children,
  at = 0,
  style,
}) => {
  const f = useAbs();
  return (
    <div
      style={{
        position: 'absolute',
        left: V.SAFE.left,
        right: V.SAFE.right,
        bottom: 58,
        fontFamily: F.mono,
        fontSize: 17,
        letterSpacing: '0.09em',
        lineHeight: 1.5,
        color: 'rgba(150,168,184,0.72)',
        opacity: appear(f, at, 14),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** thin vertical bar used as a structural element on the left margin */
export const Edge: React.FC<{at: number; h?: number; top?: number}> = ({at, h = 190, top = 132}) => {
  const f = useAbs();
  const t = appear(f, at, 14);
  return (
    <div
      style={{
        position: 'absolute',
        left: V.SAFE.left,
        top,
        width: 4,
        height: h * eo(t),
        background: `linear-gradient(to bottom, ${C.amber}, rgba(255,176,32,0))`,
      }}
    />
  );
};

/** One number + its label, used in the story beats. */
export const Stat: React.FC<{value: string; label: string; at: number; accent?: string; size?: number}> = ({
  value,
  label,
  at,
  accent = C.white,
  size = 62,
}) => {
  const f = useAbs();
  const t = appear(f, at, 13);
  return (
    <div style={{opacity: t, transform: `translateY(${(1 - eo(t)) * 12}px)`}}>
      <div style={{fontFamily: F.display, fontWeight: 700, fontSize: size, lineHeight: 0.9, color: accent, fontVariantNumeric: 'tabular-nums'}}>
        {value}
      </div>
      <div style={{fontFamily: F.mono, fontSize: 16, letterSpacing: '0.16em', lineHeight: 1.45, color: C.dim, marginTop: 8}}>{label}</div>
    </div>
  );
};
