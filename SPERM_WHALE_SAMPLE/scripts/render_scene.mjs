import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '../node_modules/playwright/index.mjs';
import esbuild from '../node_modules/esbuild/lib/main.js';

const tJobStart = Date.now();
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = path.join(ROOT, 'engine');
const ASSETS = path.join(ROOT, 'assets');

const sceneId = Number(process.argv[2] || 1);
const spec = JSON.parse(fs.readFileSync(path.join(ROOT, 'SPEC.json'), 'utf8'));
const scriptDoc = JSON.parse(fs.readFileSync(path.join(ROOT, 'SCRIPT_SAMPLE.json'), 'utf8'));
const row = scriptDoc.scenes.find(s => s.id === sceneId);
if (!row) throw new Error(`Invalid scene id: ${sceneId}`);

// Merge exact spoken cue timestamp if narration artifact is present
const tsPath = path.join(ROOT, 'generated', 'audio', 'AUDIO_TIMESTAMPS.json');
if (fs.existsSync(tsPath)) {
  const tsDoc = JSON.parse(fs.readFileSync(tsPath, 'utf8'));
  const entry = tsDoc.scenes?.[String(sceneId)];
  if (entry && typeof entry.cue_s === 'number') {
    row.cue_s = entry.cue_s;
    console.log(`Loaded exact audio cue_s=${row.cue_s}s for scene ${sceneId}`);
  }
}

const unitsOut = path.join(ROOT, 'generated', 'units');
const proofOut = path.join(ROOT, 'generated', 'proof');
fs.mkdirSync(unitsOut, { recursive: true });
fs.mkdirSync(proofOut, { recursive: true });

// Bundle 3D and 2D entrypoints cleanly
for (const [src, dst] of [['scenes3d.js', 'bundle3d.js'], ['scenes2d.js', 'bundle2d.js']]) {
  await esbuild.build({
    entryPoints: [path.join(ENGINE, src)],
    bundle: true,
    format: 'esm',
    outfile: path.join(ENGINE, dst),
    nodePaths: [path.join(ROOT, 'node_modules')]
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.ttf': 'font/ttf',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.geojson': 'application/geo+json',
  '.json': 'application/json'
};

const errors = [];
const server = http.createServer((req, res) => {
  const u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }
  let filePath;
  if (u === '/' || u === '/index.html') filePath = path.join(ENGINE, 'index.html');
  else if (u === '/illustrations.html') filePath = path.join(ENGINE, 'illustrations.html');
  else if (u.startsWith('/fonts/')) filePath = path.join(ASSETS, 'fonts', u.slice(7));
  else if (u.startsWith('/ocean/')) filePath = path.join(ASSETS, 'ocean', u.slice(7));
  else if (u.startsWith('/geography/')) filePath = path.join(ASSETS, 'geography', u.slice(11));
  else filePath = path.join(ENGINE, u.replace(/^\/+/, ''));

  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(ROOT + path.sep) || !fs.existsSync(resolved)) {
    errors.push(`HTTP 404: ${u}`);
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.setHeader('Content-Type', MIME[path.extname(resolved)] || 'application/octet-stream');
  fs.createReadStream(resolved).pipe(res);
});

server.listen(0, '127.0.0.1');
await once(server, 'listening');
const port = server.address().port;

const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader'
  ]
});

let encoder = null;
const reports = [];
const totalFrames = Number(row.frames || spec.frames_per_scene || 360);
const fps = Number(spec.fps || 24);
const proofFrames = new Set([0, 90, 180, 270, totalFrames - 1]);

try {
  const page = await browser.newPage({
    viewport: { width: spec.width, height: spec.height },
    deviceScaleFactor: 1
  });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => {
    if (m.type() === 'error' && !m.text().includes('favicon')) {
      errors.push(`console.error: ${m.text()}`);
    }
  });

  const targetUrl = `http://127.0.0.1:${port}${row.renderer === '2D' ? '/illustrations.html' : '/'}`;
  await page.goto(targetUrl, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });

  // Explicitly load documentary fonts before capturing any frame
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load('750 54px Display'),
      document.fonts.load('700 28px Display'),
      document.fonts.load('450 24px Body')
    ]);
  });

  await page.evaluate(r => window.configure(r), row);

  const mp4Path = path.join(unitsOut, `${String(sceneId).padStart(2, '0')}.mp4`);
  const ffmpegExe = process.env.FFMPEG_EXE || 'ffmpeg';
  let pipeError = null;
  encoder = spawn(ffmpegExe, [
    '-y', '-v', 'error',
    '-f', 'image2pipe',
    '-framerate', String(fps),
    '-c:v', 'png',
    '-i', 'pipe:0',
    '-an',
    '-frames:v', String(totalFrames),
    '-c:v', 'libx264',
    '-preset', String(spec.encoding_preset || 'fast'),
    '-crf', String(spec.encoding_crf || 17),
    '-threads', '2',
    '-pix_fmt', String(spec.pixel_format || 'yuv420p'),
    '-video_track_timescale', '12288',
    mp4Path
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  encoder.stdin.on('error', e => { pipeError = e; });
  const finished = once(encoder, 'exit');

  const tRenderStart = Date.now();
  for (let n = 0; n < totalFrames; n++) {
    const t = n / fps;
    const rep = await page.evaluate(timeSec => window.draw(timeSec), t);
    if (errors.length) throw new Error(errors.join('; '));

    const png = await page.screenshot({ type: 'png', animations: 'disabled' });
    if (proofFrames.has(n)) {
      fs.writeFileSync(path.join(proofOut, `S${sceneId}_${String(n).padStart(3, '0')}.png`), png);
    }
    if (pipeError) throw pipeError;
    if (!encoder.stdin.write(png)) {
      await once(encoder.stdin, 'drain');
    }

    if (n % 24 === 0 || n === totalFrames - 1) {
      reports.push({ frame: n, local_time: Number(t.toFixed(3)), ...rep });
    }
    if (n % 90 === 0 || n === totalFrames - 1) {
      const elapsedSoFar = ((Date.now() - tRenderStart) / 1000).toFixed(1);
      console.log(`Scene ${sceneId} (${row.key}) frame ${n}/${totalFrames - 1} [${elapsedSoFar}s]`);
    }
  }

  encoder.stdin.end();
  const [exitCode] = await finished;
  if (exitCode !== 0) throw new Error(`FFmpeg encoder exited with code ${exitCode}`);

  const renderSec = Number(((Date.now() - tRenderStart) / 1000).toFixed(2));
  const totalSec = Number(((Date.now() - tJobStart) / 1000).toFixed(2));
  const msPerFrame = Number(((renderSec * 1000) / totalFrames).toFixed(1));

  const summary = {
    scene_id: sceneId,
    key: row.key,
    renderer: row.renderer,
    frames: totalFrames,
    fps,
    cue_s: row.cue_s ?? row.default_cue_s,
    render_seconds: renderSec,
    total_script_seconds: totalSec,
    ms_per_frame: msPerFrame,
    mp4_bytes: fs.statSync(mp4Path).size,
    errors,
    samples: reports
  };
  fs.writeFileSync(path.join(unitsOut, `REPORT_${sceneId}.json`), JSON.stringify(summary, null, 2));
  console.log(`DONE Scene ${sceneId} (${row.key}, ${row.renderer}): ${renderSec}s render (${msPerFrame} ms/frame), ${summary.mp4_bytes} bytes`);
} finally {
  if (encoder && !encoder.killed && encoder.exitCode === null) encoder.kill('SIGTERM');
  await browser.close();
  server.close();
}
