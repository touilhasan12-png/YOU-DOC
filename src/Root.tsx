import React from 'react';
import {Composition} from 'remotion';
import {Film, FILM_FRAMES} from './scenes/ShotList';
import {LockPreview} from './scenes/LockPreview';
import {Vertical, VERTICAL_FRAMES} from './scenes/Vertical';
import {LookTest} from './scenes/v/LookTest';
import {FPS, HEIGHT, WIDTH} from './theme/tokens';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={Math.round(FILM_FRAMES)}
      fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="Lock" component={LockPreview} durationInFrames={150}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Vertical" component={Vertical} durationInFrames={VERTICAL_FRAMES}
      fps={30} width={1080} height={1920} />
    <Composition id="Look" component={LookTest} durationInFrames={3}
      fps={30} width={1080} height={1920} />
  </>
);
