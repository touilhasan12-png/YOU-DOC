import * as THREE from 'three';
import {
  BloomEffect,
  Effect,
  EffectComposer,
  EffectPass,
  KernelSize,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
  ToneMappingEffect,
  ToneMappingMode,
} from 'postprocessing';

const GRADE_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uVignette;
uniform float uGrain;
uniform float uWarmth;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 col = inputColor.rgb;

  // Subtle cinema split-tone: cobalt-velvet shadows + golden-cream highlights
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  vec3 shadowTint = vec3(0.95, 0.96, 1.05);
  vec3 highlightTint = mix(vec3(1.02, 1.00, 0.96), vec3(1.06, 1.01, 0.92), uWarmth);
  col *= mix(shadowTint, highlightTint, smoothstep(0.15, 0.85, luma));

  // Gentle contrast S-curve
  col = mix(col, smoothstep(0.0, 1.0, col), 0.12);

  // Soft optical vignette
  vec2 centered = (uv - 0.5) * vec2(1.12, 1.0);
  float dist2 = dot(centered, centered);
  float vig = 1.0 - dist2 * uVignette;
  col *= clamp(vig, 0.35, 1.0);

  // Fine deterministic film grain
  float g = hash12(uv * vec2(1920.0, 1080.0) + vec2(floor(uTime * 30.0) * 17.3, floor(uTime * 30.0) * 31.7)) - 0.5;
  col += g * uGrain;

  outputColor = vec4(max(col, vec3(0.0)), inputColor.a);
}
`;

export class CinemaGradeEffect extends Effect {
  constructor() {
    super('CinemaGradeEffect', GRADE_FRAGMENT, {
      uniforms: new Map<string, THREE.Uniform>([
        ['uTime', new THREE.Uniform(0)],
        ['uVignette', new THREE.Uniform(0.42)],
        ['uGrain', new THREE.Uniform(0.014)],
        ['uWarmth', new THREE.Uniform(0.5)],
      ]),
    });
  }

  updateTime(t: number, warmth = 0.5, vignette = 0.42): void {
    (this.uniforms.get('uTime') as THREE.Uniform).value = t;
    (this.uniforms.get('uWarmth') as THREE.Uniform).value = warmth;
    (this.uniforms.get('uVignette') as THREE.Uniform).value = vignette;
  }
}

export interface CinemaPostPipeline {
  composer: EffectComposer;
  bloom: BloomEffect;
  grade: CinemaGradeEffect;
  setSize(w: number, h: number): void;
}

export function createPostPipeline(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number
): CinemaPostPipeline {
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
  });

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloom = new BloomEffect({
    intensity: 0.85,
    luminanceThreshold: 0.82,
    luminanceSmoothing: 0.22,
    mipmapBlur: true,
    kernelSize: KernelSize.LARGE,
  });

  const toneMapping = new ToneMappingEffect({
    mode: ToneMappingMode.ACES_FILMIC,
  });

  const grade = new CinemaGradeEffect();
  const smaa = new SMAAEffect({ preset: SMAAPreset.HIGH });

  const effectPass = new EffectPass(camera, bloom, toneMapping, grade, smaa);
  composer.addPass(effectPass);
  composer.setSize(width, height);

  return {
    composer,
    bloom,
    grade,
    setSize(w: number, h: number) {
      composer.setSize(w, h);
    },
  };
}
