// GitHub Actions only: 60-frame, 1080x1920, full-quality visual benchmark. No local rendering.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition, openBrowser} from '@remotion/renderer';

fs.mkdirSync('out', {recursive: true});
const t0 = Date.now();
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const tBundle = Date.now();
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'swangle', enableMultiProcessOnLinux: true}});
const tBrowser = Date.now();
const composition = await selectComposition({serveUrl, id: 'BeerFloodBenchmark', browserInstance: browser, chromiumOptions: {gl: 'swangle'}});
const tSelect = Date.now();
const total = composition.durationInFrames;
const concurrency = Number(process.env.CONCURRENCY || 2);
let last = 0;
const started = Date.now();
try {
  await renderMedia({
    serveUrl, composition, browserInstance: browser, codec: 'h264', crf: 18,
    outputLocation: 'out/beer-flood-benchmark.mp4', frameRange: [0, total - 1],
    concurrency, chromiumOptions: {gl: 'swangle'}, timeoutInMilliseconds: 180000,
    imageFormat: 'jpeg', jpegQuality: 90, muted: true, scale: 1,
    onProgress: ({renderedFrames}) => {
      if (renderedFrames !== last && (renderedFrames % 5 === 0 || renderedFrames === total)) {
        const sec = (Date.now() - started) / 1000;
        const per = sec / renderedFrames;
        console.log(`FRAME ${renderedFrames}/${total} elapsed=${sec.toFixed(1)}s per_frame=${per.toFixed(2)}s eta_60s_video=${(per * 1800 / 60).toFixed(1)}min`);
        last = renderedFrames;
      }
    },
    onBrowserLog: ({type, text}) => { if (type === 'error' || /Context Lost|WebGL|ERROR/i.test(text)) console.log(`BROWSER ${type}: ${text.slice(0, 500)}`); },
  });
} finally {
  await browser.close({silent: true});
}
const finished = Date.now();
const renderSec = (finished - started) / 1000;
const report = {
  composition: composition.id, width: composition.width, height: composition.height, fps: composition.fps,
  frames: total, durationSeconds: total / composition.fps, concurrency,
  cpuCount: os.cpus().length, cpuModel: os.cpus()[0]?.model, totalMemoryGiB: +(os.totalmem() / 1024 ** 3).toFixed(2),
  bundleSeconds: +((tBundle - t0) / 1000).toFixed(2), browserSeconds: +((tBrowser - tBundle) / 1000).toFixed(2),
  selectSeconds: +((tSelect - tBrowser) / 1000).toFixed(2), renderSeconds: +renderSec.toFixed(2),
  totalScriptSeconds: +((finished - t0) / 1000).toFixed(2), secondsPerFrame: +(renderSec / total).toFixed(3),
  estimatedRenderMinutesFor60sVideo: +(renderSec / total * 1800 / 60).toFixed(1),
  note: 'Linear extrapolation from this 2-second shot; other shots, narration, mixing and upload add time. No GPU was assumed.',
};
fs.writeFileSync('out/timings.json', JSON.stringify(report, null, 2));
console.log('BENCHMARK_REPORT ' + JSON.stringify(report));
