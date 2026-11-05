import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import * as THREE from 'three';
import timelineData from './data/timeline.json';
import { halton } from './engine/math';
import { createPostPipeline, type CinemaPostPipeline } from './engine/postfx';
import { OverlayCompositor } from './overlays/OverlayCompositor';
import { DocumentaryWorld } from './world/DocumentaryWorld';

declare global {
  interface Window {
    __YOU_DOC_READY__?: boolean;
    __YOU_DOC_INFO__?: Record<string, unknown>;
    __YOU_DOC_RENDER_FRAME__?: (
      frameIndex: number,
      fps?: number,
      shutterSamples?: number
    ) => { frameIndex: number; t: number; beat: string; samplesUsed: number };
  }
}

async function initHarness(): Promise<void> {
  await document.fonts.ready;

  const params = new URLSearchParams(window.location.search);
  const width = Number(params.get('w') || 1920);
  const height = Number(params.get('h') || 1080);

  const outCanvas = document.getElementById('out-canvas') as HTMLCanvasElement;
  outCanvas.width = width;
  outCanvas.height = height;
  outCanvas.style.width = `${width}px`;
  outCanvas.style.height = `${height}px`;
  const outCtx = outCanvas.getContext('2d', { alpha: false })!;

  // Offscreen WebGL2 canvas
  const glCanvas = document.createElement('canvas');
  glCanvas.width = width;
  glCanvas.height = height;

  const renderer = new THREE.WebGLRenderer({
    canvas: glCanvas,
    antialias: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
    stencil: false,
    depth: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const gl = renderer.getContext() as WebGL2RenderingContext;
  const floatExt = !!(
    gl.getExtension('EXT_color_buffer_float') ||
    gl.getExtension('EXT_color_buffer_half_float')
  );

  const world = new DocumentaryWorld(width / height);
  const post: CinemaPostPipeline = createPostPipeline(
    renderer,
    world.scene,
    world.camera,
    width,
    height
  );
  const overlays = new OverlayCompositor();

  // Warm-up shader compilation across all 4 stages so frame 0 has zero stall
  for (const warmT of [1.0, 7.0, 15.0, 21.0]) {
    world.evaluateAt(warmT, 0, 0, width, height);
    post.composer.render(1 / 30);
  }

  window.__YOU_DOC_INFO__ = {
    webgl2: renderer.capabilities.isWebGL2,
    floatRenderTargets: floatExt,
    renderer: gl.getParameter(gl.RENDERER),
    vendor: gl.getParameter(gl.VENDOR),
    maxTextureSize: renderer.capabilities.maxTextureSize,
    totalFrames: timelineData.totalFrames,
    duration: timelineData.duration,
    fps: timelineData.fps,
    width,
    height,
  };

  window.__YOU_DOC_RENDER_FRAME__ = (
    frameIndex: number,
    fps = 30,
    shutterSamples?: number
  ) => {
    const tCenter = frameIndex / fps;

    // Adaptive temporal shutter accumulation: 3 sub-frames on fast motion/wipes/impacts, 1 SMAA-filtered frame otherwise
    let samples = shutterSamples ?? 1;
    if (shutterSamples === undefined) {
      const isFastMotion =
        (tCenter >= 5.15 && tCenter <= 6.10) ||
        (tCenter >= 17.84 && tCenter <= 18.55) ||
        (tCenter >= 19.70 && tCenter <= 20.22);
      samples = isFastMotion ? 3 : 1;
    }
    samples = Math.max(1, Math.min(8, samples));

    const shutterSpan = 0.5 / fps; // 180-degree cinema shutter
    let centerState = world.evaluateAt(tCenter, 0, 0, width, height);

    outCtx.save();
    for (let s = 0; s < samples; s++) {
      const subOffset =
        samples === 1 ? 0 : ((s + 0.5) / samples - 0.5) * shutterSpan;
      const tSub = Math.max(0, Math.min(timelineData.duration, tCenter + subOffset));
      const jx = samples === 1 ? 0 : halton(frameIndex * 8 + s, 2) * 0.75;
      const jy = samples === 1 ? 0 : halton(frameIndex * 8 + s, 3) * 0.75;

      const st = world.evaluateAt(tSub, jx, jy, width, height);
      if (s === Math.floor(samples / 2)) centerState = st;

      post.bloom.intensity = st.bloomIntensity;
      post.grade.updateTime(tSub, st.warmth, 0.42);
      post.composer.render(1 / fps);

      outCtx.globalAlpha = 1.0 / (s + 1);
      outCtx.drawImage(glCanvas, 0, 0, width, height);
    }
    outCtx.restore();

    // Composite crisp 1080p kinetic captions & diegetic HUD on top
    overlays.draw(outCtx, width, height, tCenter, centerState);

    return {
      frameIndex,
      t: Number(tCenter.toFixed(4)),
      beat: centerState.activeBeat,
      samplesUsed: samples,
    };
  };

  // Render initial frame 0 immediately
  window.__YOU_DOC_RENDER_FRAME__(0, 30, 1);
  window.__YOU_DOC_READY__ = true;
}

initHarness().catch((err) => {
  console.error('Harness init failed:', err);
  (window as unknown as Record<string, unknown>).__YOU_DOC_ERROR__ = String(err);
});
