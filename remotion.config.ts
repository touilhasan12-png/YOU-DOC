import {Config} from '@remotion/cli/config';

// Determinism first: fixed fps, no random, no LFS surprises.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setConcurrency(2);
Config.setChromiumOpenGlRenderer('swangle');
Config.setOverwriteOutput(true);
