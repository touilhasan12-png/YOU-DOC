import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import * as THREE from 'three';
import timelineData from './data/timeline.json';
import { createPostPipeline } from './engine/postfx';
import { OverlayCompositor } from './overlays/OverlayCompositor';
import { DocumentaryWorld } from './world/DocumentaryWorld';

const tabVideo = document.getElementById('tab-video') as HTMLButtonElement;
const tabLive = document.getElementById('tab-live') as HTMLButtonElement;
const videoEl = document.getElementById('master-video') as HTMLVideoElement;
const livePane = document.getElementById('live-pane') as HTMLDivElement;
const liveCanvas = document.getElementById('live-canvas') as HTMLCanvasElement;
const scrubber = document.getElementById('live-scrubber') as HTMLDivElement;
const rangeInput = document.getElementById('live-range') as HTMLInputElement;
const timeLabel = document.getElementById('live-time') as HTMLSpanElement;
const playBtn = document.getElementById('live-play') as HTMLButtonElement;

let engineInitialized = false;
let livePlaying = false;
let liveAudio: HTMLAudioElement | null = null;
let renderAtTime: ((t: number) => void) | null = null;

async function ensureLiveEngine(): Promise<void> {
  if (engineInitialized) return;
  engineInitialized = true;
  await document.fonts.ready;

  const width = 1280;
  const height = 720;
  liveCanvas.width = width;
  liveCanvas.height = height;
  const outCtx = liveCanvas.getContext('2d', { alpha: false })!;

  const glCanvas = document.createElement('canvas');
  glCanvas.width = width;
  glCanvas.height = height;

  const renderer = new THREE.WebGLRenderer({
    canvas: glCanvas,
    antialias: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const world = new DocumentaryWorld(width / height);
  const post = createPostPipeline(renderer, world.scene, world.camera, width, height);
  const overlays = new OverlayCompositor();

  liveAudio = new Audio('./audio/master_audio.mp3');

  renderAtTime = (t: number) => {
    const clamped = Math.max(0, Math.min(timelineData.duration, t));
    const st = world.evaluateAt(clamped, 0, 0, width, height);
    post.bloom.intensity = st.bloomIntensity;
    post.grade.updateTime(clamped, st.warmth, 0.42);
    post.composer.render(1 / 30);
    outCtx.drawImage(glCanvas, 0, 0, width, height);
    overlays.draw(outCtx, width, height, clamped, st);
    rangeInput.value = clamped.toFixed(3);
    timeLabel.textContent = `${clamped.toFixed(2).padStart(5, '0')}s / ${timelineData.duration.toFixed(2)}s`;
  };

  renderAtTime(14.8);
}

tabVideo?.addEventListener('click', () => {
  tabVideo.classList.add('active');
  tabLive.classList.remove('active');
  videoEl.style.display = 'block';
  livePane.style.display = 'none';
  scrubber.style.display = 'none';
  livePlaying = false;
  liveAudio?.pause();
});

tabLive?.addEventListener('click', async () => {
  tabLive.classList.add('active');
  tabVideo.classList.remove('active');
  videoEl.pause();
  videoEl.style.display = 'none';
  livePane.style.display = 'block';
  scrubber.style.display = 'flex';
  await ensureLiveEngine();
});

rangeInput?.addEventListener('input', () => {
  if (renderAtTime) renderAtTime( Number(rangeInput.value) );
});

playBtn?.addEventListener('click', async () => {
  await ensureLiveEngine();
  if (!liveAudio || !renderAtTime) return;
  if (livePlaying) {
    livePlaying = false;
    liveAudio.pause();
    playBtn.textContent = '▶ Play 3D';
  } else {
    livePlaying = true;
    liveAudio.currentTime = Number(rangeInput.value);
    await liveAudio.play().catch(() => {});
    playBtn.textContent = '⏸ Pause 3D';
    const tick = () => {
      if (!livePlaying || !liveAudio || !renderAtTime) return;
      if (liveAudio.ended || liveAudio.currentTime >= timelineData.duration) {
        livePlaying = false;
        playBtn.textContent = '▶ Play 3D';
        return;
      }
      renderAtTime(liveAudio.currentTime);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
});
