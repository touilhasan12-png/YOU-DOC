import {Composition} from 'remotion';
import {BreweryShort} from './brewery/Brewery';
import {FPS, TOTAL, WIDTH, HEIGHT} from './brewery/edit';
export const Root = () => <Composition id="BeerFloodBenchmark" component={BreweryShort} durationInFrames={TOTAL} fps={FPS} width={WIDTH} height={HEIGHT} />;
