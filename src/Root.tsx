import React from 'react';
import {Composition} from 'remotion';
import {Film, FILM_FRAMES} from './scenes/ShotList';
import {LockPreview} from './scenes/LockPreview';
import {Vertical, VERTICAL_FRAMES} from './scenes/Vertical';
import {LookTest} from './scenes/v/LookTest';
import {LookStill, LookMotion} from './scenes/v/Look2';
import {Film2, FILM2_FRAMES} from './scenes/v/Film2';
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
    <Composition id="Look2" component={LookStill} durationInFrames={4}
      fps={30} width={1080} height={1920} />
    <Composition id="Motion" component={LookMotion} durationInFrames={90}
      fps={30} width={1080} height={1920} />
    <Composition id="Film2" component={Film2} durationInFrames={FILM2_FRAMES}
      fps={30} width={1080} height={1920} />
  </>
);
