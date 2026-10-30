import React from 'react';
import {Composition} from 'remotion';
import {Master, MASTER_FRAMES} from './Master';
import {Hook} from './scenes/Hook';
import {FPS, HEIGHT, WIDTH} from './theme/tokens';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Master"
      component={Master}
      durationInFrames={Math.round(MASTER_FRAMES)}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{withAudio: false}}
    />
    <Composition id="TestShot" component={Hook} durationInFrames={Math.round(4.3 * FPS)} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
