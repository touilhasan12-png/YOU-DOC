#!/usr/bin/env node
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.slice(2).split('=');
      out[k] = v ?? 'true';
    }
  }
  return out;
}

async function waitForHttp(url, timeoutMs = 25000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for server at ${url}`);
}

const CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  '--enable-webgl2',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--force-color-profile=srgb',
];

async function main() {
  const args = parseArgs(process.argv);
  const mode = args.mode || 'smoke';
  const port = Number(args.port || 4173);

  // Start Vite preview server on prebuilt dist/
  const server = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  const cleanup = () => {
    try {
      server.kill('SIGTERM');
    } catch {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(1); });

  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForHttp(`${baseUrl}/render.html`);

    const browser = await chromium.launch({
      headless: true,
      args: CHROMIUM_ARGS,
    });

    if (mode === 'smoke') {
      const outDir = path.resolve('out_render/smoke');
      fs.mkdirSync(path.join(outDir, 'frames'), { recursive: true });
      fs.mkdirSync(path.join(outDir, 'stills_1080p'), { recursive: true });

      // 1. Measure 1080p single-frame speed + capture 4 beat verification stills at full 1920x1080!
      const ctx1080 = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      });
      const page1080 = await ctx1080.newPage();
      page1080.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
        }
      });
      page1080.on('pageerror', (err) => console.error('PAGE ERROR:', err));
      await page1080.goto(`${baseUrl}/render.html?w=1920&h=1080`, { waitUntil: 'networkidle' });
      await page1080.waitForFunction(() => window.__YOU_DOC_READY__ === true || !!window.__YOU_DOC_ERROR__, null, { timeout: 45000 });

      const err1080 = await page1080.evaluate(() => window.__YOU_DOC_ERROR__);
      if (err1080) throw new Error(`Render harness error: ${err1080}`);

      const glInfo = await page1080.evaluate(() => window.__YOU_DOC_INFO__);
      console.log('WebGL2 Capabilities:', JSON.stringify(glInfo, null, 2));
      if (!glInfo.webgl2) throw new Error('WebGL2 is NOT enabled!');

      const keyFrames = [75, 169, 285, 485, 540, 645]; // 2.5s, 5.63s, 9.5s, 16.17s, 18.0s, 21.5s
      const tBenchStart = Date.now();
      for (const kf of keyFrames) {
        await page1080.evaluate((f) => window.__YOU_DOC_RENDER_FRAME__(f, 30), kf);
        await page1080.screenshot({
          path: path.join(outDir, 'stills_1080p', `still_${String(kf).padStart(4, '0')}.jpg`),
          type: 'jpeg',
          quality: 94,
        });
      }
      const msPerFrame1080 = Math.round((Date.now() - tBenchStart) / keyFrames.length);
      console.log(`Measured 1080p render speed: ${msPerFrame1080} ms/frame`);
      await ctx1080.close();

      // 2. Render 90-frame (3.0s) continuous smoke clip at 1280x720 to verify ffmpeg + mux pipeline
      const ctx720 = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
      });
      const page720 = await ctx720.newPage();
      await page720.goto(`${baseUrl}/render.html?w=1280&h=720`, { waitUntil: 'networkidle' });
      await page720.waitForFunction(() => window.__YOU_DOC_READY__ === true, null, { timeout: 45000 });

      const t720Start = Date.now();
      for (let i = 0; i < 90; i++) {
        // Render 13.0s -> 16.0s (macro stress shader + captions)
        await page720.evaluate((f) => window.__YOU_DOC_RENDER_FRAME__(f, 30, 1), 390 + i);
        await page720.screenshot({
          path: path.join(outDir, 'frames', `f_${String(i).padStart(4, '0')}.png`),
          type: 'png',
        });
      }
      const msPerFrame720 = Math.round((Date.now() - t720Start) / 90);
      await ctx720.close();

      execFileSync('ffmpeg', [
        '-y',
        '-framerate', '30',
        '-i', path.join(outDir, 'frames', 'f_%04d.png'),
        '-ss', '13.0', '-t', '3.0',
        '-i', path.resolve('assets/audio/master_audio.wav'),
        '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '192k',
        '-movflags', '+faststart',
        path.join(outDir, 'smoke_preview.mp4'),
      ], { stdio: 'inherit' });

      fs.rmSync(path.join(outDir, 'frames'), { recursive: true, force: true });

      const metrics = {
        timestamp: new Date().toISOString(),
        glInfo,
        msPerFrame1080,
        msPerFrame720,
        estimated780FramesOn10ShardsSec: Math.round((78 * msPerFrame1080) / 1000),
      };
      fs.writeFileSync(path.join(outDir, 'smoke_metrics.json'), JSON.stringify(metrics, null, 2));
      console.log('Smoke metrics:', metrics);
    } else if (mode === 'chunk') {
      const shard = Number(args.shard ?? 0);
      const shards = Number(args.shards ?? 10);
      const totalFrames = Number(args.totalFrames ?? 780);
      const width = Number(args.width ?? 1920);
      const height = Number(args.height ?? 1080);

      const perShard = Math.ceil(totalFrames / shards);
      const startFrame = shard * perShard;
      const endFrame = Math.min(totalFrames, startFrame + perShard);
      const count = endFrame - startFrame;

      console.log(`Shard ${shard}/${shards}: rendering frames [${startFrame}, ${endFrame}) (${count} frames) at ${width}x${height}`);

      const outDir = path.resolve('chunks');
      const framesDir = path.resolve(`frames_shard_${shard}`);
      fs.mkdirSync(outDir, { recursive: true });
      fs.mkdirSync(framesDir, { recursive: true });

      const ctx = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      page.on('pageerror', (err) => console.error('PAGE ERROR:', err));
      await page.goto(`${baseUrl}/render.html?w=${width}&h=${height}`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.__YOU_DOC_READY__ === true || !!window.__YOU_DOC_ERROR__, null, { timeout: 60000 });

      const err = await page.evaluate(() => window.__YOU_DOC_ERROR__);
      if (err) throw new Error(`Render harness error: ${err}`);

      const t0 = Date.now();
      for (let i = 0; i < count; i++) {
        const globalFrame = startFrame + i;
        await page.evaluate((f) => window.__YOU_DOC_RENDER_FRAME__(f, 30), globalFrame);
        const pngPath = path.join(framesDir, `frame_${String(i).padStart(5, '0')}.png`);
        await page.screenshot({ path: pngPath, type: 'png' });

        if ((i + 1) % 15 === 0 || i === count - 1) {
          const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
          console.log(`  Shard ${shard}: ${i + 1}/${count} frames (${elapsed}s)`);
        }
      }
      await ctx.close();

      const chunkPath = path.join(outDir, `chunk_${String(shard).padStart(2, '0')}.mp4`);
      execFileSync('ffmpeg', [
        '-y',
        '-framerate', '30',
        '-i', path.join(framesDir, 'frame_%05d.png'),
        '-c:v', 'libx264',
        '-preset', 'slow',
        '-crf', '14',
        '-profile:v', 'high',
        '-level', '4.2',
        '-pix_fmt', 'yuv420p',
        '-colorspace', 'bt709',
        '-color_primaries', 'bt709',
        '-color_trc', 'bt709',
        '-color_range', 'tv',
        '-g', '30',
        '-keyint_min', '30',
        '-sc_threshold', '0',
        '-bf', '2',
        '-an',
        chunkPath,
      ], { stdio: 'inherit' });

      fs.rmSync(framesDir, { recursive: true, force: true });
      console.log(`Shard ${shard} encoded -> ${chunkPath}`);
    }

    await browser.close();
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
