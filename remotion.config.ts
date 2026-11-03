import {Config} from '@remotion/cli/config';
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(90);
Config.setChromiumOpenGlRenderer('swangle');
Config.setConcurrency(2);
Config.setOverwriteOutput(true);
Config.setPublicDir('public');
