import * as THREE from 'three';

/**
 * Hero Diegetic Engineering Shader:
 * Visualizes real Kirsch-inspired corner stress concentration around a morphable
 * superellipse window cutout (p=14 -> sharp 90° square, p=2 -> smooth oval),
 * plus animated force-flow streamlines and a propagating multi-branch crack!
 */
export function createStressPanelMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: false,
    uniforms: {
      uTime: { value: 0.0 },
      uCornerPower: { value: 14.0 },   // 14.0 = sharp 90° square, 2.0 = smooth oval
      uWinHalfSize: { value: new THREE.Vector2(0.24, 0.22) },
      uHeatmapMix: { value: 0.0 },     // 0 = brushed aluminum, 1 = full photoelastic stress map
      uLoadLevel: { value: 0.0 },      // 0..1 altitude pressure load
      uStreamlines: { value: 0.0 },    // 0..1 glowing force streamlines
      uCrackProgress: { value: 0.0 },  // 0..1 diagonal corner crack propagation
      uSafePalette: { value: 0.0 },    // 0 = danger thermal palette, 1 = laminar safe oval palette
      uLightDir: { value: new THREE.Vector3(0.45, 0.62, 0.72).normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uCornerPower;
      uniform vec2 uWinHalfSize;
      uniform float uHeatmapMix;
      uniform float uLoadLevel;
      uniform float uStreamlines;
      uniform float uCrackProgress;
      uniform float uSafePalette;
      uniform vec3 uLightDir;

      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vViewDir;

      // Thermal / photoelastic danger ramp: cobalt -> violet -> magenta -> orange -> incandescent white-gold
      vec3 dangerRamp(float x) {
        float t = clamp(x, 0.0, 1.0);
        vec3 c0 = vec3(0.10, 0.20, 0.54); // 1.0x cool cobalt
        vec3 c1 = vec3(0.46, 0.16, 0.72); // 1.8x violet
        vec3 c2 = vec3(0.90, 0.20, 0.38); // 2.6x crimson-magenta
        vec3 c3 = vec3(1.05, 0.52, 0.10); // 3.3x blazing orange
        vec3 c4 = vec3(1.85, 1.65, 0.95); // 3.8x HDR incandescent white-gold
        if (t < 0.25) return mix(c0, c1, t / 0.25);
        if (t < 0.52) return mix(c1, c2, (t - 0.25) / 0.27);
        if (t < 0.78) return mix(c2, c3, (t - 0.52) / 0.26);
        return mix(c3, c4, (t - 0.78) / 0.22);
      }

      // Laminar safe ramp for rounded oval window
      vec3 safeRamp(float x) {
        float t = clamp(x, 0.0, 1.0);
        vec3 c0 = vec3(0.08, 0.22, 0.46);
        vec3 c1 = vec3(0.06, 0.62, 0.72);
        vec3 c2 = vec3(0.24, 0.88, 0.64);
        return t < 0.5 ? mix(c0, c1, t * 2.0) : mix(c1, c2, (t - 0.5) * 2.0);
      }

      void main() {
        // Panel local coords p in [-0.9, 0.9] x [-0.55, 0.55]
        vec2 p = (vUv - 0.5) * vec2(1.80, 1.10);
        vec2 a = uWinHalfSize;

        // Superellipse normalized radius: rSe = 1.0 at window boundary
        vec2 q = abs(p) / a;
        float pwr = max(2.0, uCornerPower);
        float rSe = pow(pow(q.x + 1e-5, pwr) + pow(q.y + 1e-5, pwr), 1.0 / pwr);
        float distEdge = (rSe - 1.0) * min(a.x, a.y);

        // Inside the window glass opening: warm cabin glow OR golden sunset cloud horizon on Oval Payoff!
        if (rSe < 1.0) {
          float bezel = smoothstep(0.88, 1.0, rSe);
          vec3 skyTop = mix(vec3(0.14, 0.24, 0.46), vec3(0.22, 0.16, 0.44), uSafePalette);
          vec3 skyMid = mix(vec3(0.45, 0.62, 0.86), vec3(0.96, 0.54, 0.32), uSafePalette);
          vec3 skyBot = mix(vec3(0.96, 0.76, 0.46), vec3(1.08, 0.78, 0.42), uSafePalette);
          float wy = clamp((p.y / a.y) * 0.5 + 0.5, 0.0, 1.0);
          vec3 glassInner = mix(skyBot, skyMid, smoothstep(0.05, 0.52, wy));
          glassInner = mix(glassInner, skyTop, smoothstep(0.48, 0.96, wy));
          // Stylized drifting cloud silhouettes visible through the window!
          float cld = smoothstep(0.18, 0.0, length(vec2(fract(p.x * 1.4 + uTime * 0.06) - 0.5, wy - 0.24) * vec2(1.0, 2.4)));
          glassInner = mix(glassInner, vec3(1.05, 0.90, 0.72), cld * 0.55);
          // Diagonal aircraft glass reflection
          float refl = smoothstep(0.07, 0.0, abs((p.x + p.y * 0.65) - 0.04)) * 0.26;
          vec3 colGlass = mix(glassInner + refl, vec3(0.24, 0.28, 0.35), bezel);
          gl_FragColor = vec4(colGlass, 1.0);
          return;
        }

        // Brushed 1950s aviation aluminum base
        float brush = sin(vUv.y * 620.0) * 0.018 + sin(vUv.y * 1730.0 + vUv.x * 13.0) * 0.010;
        float seamX = smoothstep(0.006, 0.0, abs(abs(p.x) - 0.62));
        float seamY = smoothstep(0.006, 0.0, abs(abs(p.y) - 0.40));
        vec3 N = normalize(vNormalW);
        vec3 L = normalize(uLightDir);
        vec3 V = normalize(vViewDir);
        vec3 H = normalize(L + V);
        float diff = max(dot(N, L), 0.0) * 0.65 + 0.35;
        float spec = pow(max(dot(N, H), 0.0), 42.0) * 0.55;

        vec3 metalCol = (vec3(0.68, 0.72, 0.77) + brush) * diff + vec3(0.95, 0.97, 1.0) * spec;
        metalCol *= (1.0 - 0.25 * max(seamX, seamY));

        // Raised aluminum window frame bezel
        float frameBand = smoothstep(0.036, 0.028, distEdge);
        metalCol = mix(metalCol, metalCol * 1.16 + vec3(0.06), frameBand * 0.7);

        // Mathematical Corner Stress Concentration Factor:
        // Corners occur where |p.x|/a.x and |p.y|/a.y are simultaneously near 1.0!
        vec2 cornerPos = a * sign(p);
        float dCorner = length(p - cornerPos);
        float sharpnessFactor = clamp((pwr - 2.0) / 12.0, 0.0, 1.0); // 1 for square, 0 for oval

        // Butterfly lobe peak at 45° around sharp vertex vs smooth tangent flow on oval
        float cornerSpike = exp(-dCorner * 12.5) * (0.35 + 2.95 * sharpnessFactor);
        float topBottomTangent = exp(-distEdge * 7.5) * smoothstep(0.2, 0.95, abs(p.y) / (a.y + 0.05)) * 0.42;
        float stressNorm = clamp((0.14 + cornerSpike + topBottomTangent) * uLoadLevel, 0.0, 1.0);

        vec3 heatCol = mix(dangerRamp(stressNorm), safeRamp(stressNorm * 1.25), uSafePalette);
        vec3 basePlusHeat = mix(metalCol, heatCol, uHeatmapMix * smoothstep(0.55, 0.02, distEdge * 0.85));
        // Blend outer metal softly into heatmap
        basePlusHeat = mix(metalCol, heatCol, uHeatmapMix * clamp(0.45 + 0.55 * exp(-distEdge * 3.2), 0.0, 1.0));

        // True Fluid-Mechanics Potential-Flow Force Streamlines wrapping smoothly around the window cutout!
        // Streamfunction psi = y * (1 - 1 / rSe^2): equals 0 all along the window boundary rSe = 1,
        // so horizontal streamlines part smoothly above and below the window instead of hitting the glass!
        if (uStreamlines > 0.001) {
          float invR2 = 1.0 / max(rSe * rSe, 1.001);
          float psi = p.y * (1.0 - invR2 * 0.86);
          // On the sharp 90° square window, streamlines pinch tightly into the 90° vertex!
          float cornerPinch = sharpnessFactor * 0.048 * sign(p.y) * exp(-dCorner * 11.0);
          psi -= cornerPinch;

          float lineFreq = 22.0;
          float stripe = abs(fract(psi * lineFreq) - 0.5) * 2.0;
          float lineMask = smoothstep(0.19, 0.03, stripe);
          float travel = 0.62 + 0.38 * sin(p.x * 14.0 - uTime * 5.5);
          vec3 lineCol = mix(
            mix(vec3(0.60, 0.88, 1.30), vec3(2.2, 1.40, 0.55), clamp(cornerSpike * 0.6, 0.0, 1.0)),
            vec3(0.55, 1.45, 1.15),
            uSafePalette
          );
          basePlusHeat += lineCol * lineMask * travel * uStreamlines * smoothstep(0.005, 0.025, distEdge);
        }

        // Propagating High-Contrast Structural Fracture from Top-Right 90° Corner (a.x, a.y)!
        if (uCrackProgress > 0.001 && p.x > 0.0 && p.y > 0.0) {
          vec2 cp = p - a;
          float ang = 0.66;
          vec2 rot = vec2(
            cp.x * cos(ang) + cp.y * sin(ang),
            -cp.x * sin(ang) + cp.y * cos(ang)
          );
          float maxLen = uCrackProgress * 0.56;
          float jag = sin(rot.x * 68.0) * 0.013 + sin(rot.x * 175.0 + 1.3) * 0.0065 + sin(rot.x * 340.0) * 0.003;
          float mainDist = abs(rot.y - jag);
          float inLen = smoothstep(maxLen + 0.012, maxLen - 0.018, rot.x) * smoothstep(-0.012, 0.006, rot.x);

          vec2 forkOrigin = vec2(0.14, sin(0.14 * 68.0) * 0.013);
          vec2 fp = rot - forkOrigin;
          vec2 fRot = vec2(fp.x * 0.86 - fp.y * 0.50, fp.x * 0.50 + fp.y * 0.86);
          float fJag = sin(fRot.x * 95.0) * 0.008;
          float forkLen = max(0.0, (uCrackProgress - 0.28) * 0.40);
          float forkMask = smoothstep(0.008, 0.0015, abs(fRot.y - fJag))
                         * smoothstep(forkLen + 0.01, forkLen - 0.015, fRot.x)
                         * smoothstep(0.0, 0.012, fRot.x);

          float crackCore = smoothstep(0.014, 0.0035, mainDist) * inLen;
          float crackRim  = smoothstep(0.032, 0.011, mainDist) * inLen + forkMask * 0.85;

          // Vivid fiery crimson-orange rim + deep obsidian split core so crack pops against bright stress lobe!
          basePlusHeat = mix(basePlusHeat, vec3(2.2, 0.42, 0.12), clamp(crackRim * 0.85, 0.0, 1.0));
          basePlusHeat = mix(basePlusHeat, vec3(0.02, 0.02, 0.04), clamp(crackCore + forkMask, 0.0, 1.0));
        }

        gl_FragColor = vec4(basePlusHeat, 1.0);
      }
    `,
  });
}
