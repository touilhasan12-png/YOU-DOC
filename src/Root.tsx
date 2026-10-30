import React from 'react';
import {Composition} from 'remotion';
import {Film, FILM_FRAMES} from './scenes/ShotList';
import {FPS, HEIGHT, WIDTH} from './theme/tokens';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Film"
    component={Film}
    durationInFrames={Math.round(FILM_FRAMES)}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
