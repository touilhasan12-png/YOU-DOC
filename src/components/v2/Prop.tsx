import React from 'react';
import {Img, staticFile} from 'remotion';
import {eo, clamp01} from '../../config/vertical';

/**
 * PROP -- a cut-out object placed on the glass, the way the references do it.
 *
 * The references cut an object out of its background (a wall, binoculars, a
 * cheetah) and slide/drop it over the map with a shadow, then take it away.
 * That is exactly this component: screen space, hard shadow, one-shot entrance,
 * optional one-shot exit. Nothing loops.
 *
 * `x`,`y` are the CENTRE of the object in frame px. `w` is its width in px; the
 * height follows the picture's own aspect, so nothing is ever squashed.
 */
export const Prop: React.FC<{
  src: string;
  x: number;
  y: number;
  w: number;
  frame: number;
  /** absolute frame it enters on */
  from: number;
  /** entrance length in frames */
  dur?: number;
  /** absolute frame it starts leaving on (optional) */
  until?: number;
  motion?: 'rise' | 'drop' | 'left' | 'right' | 'none';
  rotate?: number;
  /** extra shading, 0..1 */
  darken?: number;
  shadow?: number;
}> = ({src, x, y, w, frame, from, dur = 12, until, motion = 'rise', rotate = 0, darken = 0, shadow = 1}) => {
  const t = clamp01((frame - from) / dur);
  if (t <= 0) return null;

  const out = until === undefined ? 0 : clamp01((frame - until) / 10);
  if (until !== undefined && out >= 1) return null;

  const e = eo(t);
  const dx = motion === 'left' ? (1 - e) * -110 : motion === 'right' ? (1 - e) * 110 : 0;
  const dy = motion === 'rise' ? (1 - e) * 90 : motion === 'drop' ? (1 - e) * -90 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: x + dx,
        top: y + dy - out * 46,
        width: w,
        transform: `translate(-50%,-50%) rotate(${rotate}deg) scale(${0.93 + 0.07 * e})`,
        opacity: Math.min(1, t * 2.4) * (1 - out),
        filter: `drop-shadow(0 ${18 * shadow}px ${26 * shadow}px rgba(0,0,0,${0.55 * shadow}))` +
          (darken > 0 ? ` brightness(${1 - darken})` : ''),
        pointerEvents: 'none',
      }}
    >
      <Img src={staticFile(src)} style={{width: '100%', display: 'block'}} />
    </div>
  );
};
