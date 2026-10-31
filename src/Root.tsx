import React from 'react';
import {Composition} from 'remotion';
import {Film, FILM_FRAMES} from './scenes/ShotList';
import {LockPreview} from './scenes/LockPreview';
import {FPS, HEIGHT, WIDTH} from './theme/tokens';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={Math.round(FILM_FRAMES)}
      fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="Lock" component={LockPreview} durationInFrames={150}
      fps={FPS} width={1080} height={1920} />
  </>
);
