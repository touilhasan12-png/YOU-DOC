import React from 'react';
import {useCurrentFrame} from 'remotion';
import {COLORS, FONT} from '../theme/tokens';
import {fadeIn} from '../lib/anim';

/**
 * The signature marker: a fixed ring + crosshair + label.
 * NO pulsing. The ring is drawn once (stroke-dashoffset) and stays put.
 */
export const ChokepointMarker: React.FC<{
  x: number;
  y: number;
  label: string;
  start: number;
  color?: string;
}> = ({x, y, label, start, color = COLORS.accent}) => {
  const f = useCurrentFrame();
  const draw = fadeIn(f, start, 14);
  const C = 2 * Math.PI * 26;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* crosshair */}
      <line x1={-46} x2={-14} y1={0} y2={0} stroke={color} strokeWidth={1.5} opacity={0.5 * draw} />
      <line x1={14} x2={46} y1={0} y2={0} stroke={color} strokeWidth={1.5} opacity={0.5 * draw} />
      <line y1={-46} y2={-14} x1={0} x2={0} stroke={color} strokeWidth={1.5} opacity={0.5 * draw} />
      <line y1={14} y2={46} x1={0} x2={0} stroke={color} strokeWidth={1.5} opacity={0.5 * draw} />
      {/* one-shot ring draw */}
      <circle
        r={26}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={C}
        strokeDashoffset={C * (1 - draw)}
        transform="rotate(-90)"
      />
      <circle r={4.5} fill={color} opacity={draw} />
      {/* label */}
      <g transform="translate(44,-6)" opacity={fadeIn(f, start + 8, 12)}>
        <text
          style={{
            fontFamily: FONT.mono,
            fontSize: 19,
            fontWeight: 600,
            letterSpacing: '0.10em',
            fill: COLORS.text,
          }}
        >
          {label}
        </text>
      </g>
    </g>
  );
};
