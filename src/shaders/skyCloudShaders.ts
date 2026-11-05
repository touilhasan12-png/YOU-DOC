import * as THREE from 'three';

export function createSkyDomeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uSunDir: { value: new THREE.Vector3(-0.55, 0.24, -0.79).normalize() },
      uSunsetMix: { value: 0.0 },
      uIndoorDim: { value: 0.0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDir;
      uniform float uSunsetMix;
      uniform float uIndoorDim;
      varying vec3 vWorldDir;

      void main() {
        vec3 d = normalize(vWorldDir);
        float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
        float elev = clamp(d.y, -0.3, 1.0);

        // Day/Golden-hour 1952 stratosphere palette
        vec3 zenithDay = vec3(0.07, 0.16, 0.44);
        vec3 midDay    = vec3(0.24, 0.45, 0.78);
        vec3 horizDay  = vec3(0.95, 0.62, 0.34);

        // Sunset climax palette (deep indigo-wine -> amber-gold)
        vec3 zenithSun = vec3(0.11, 0.08, 0.28);
        vec3 midSun    = vec3(0.52, 0.22, 0.42);
        vec3 horizSun  = vec3(0.99, 0.56, 0.22);

        vec3 zenith = mix(zenithDay, zenithSun, uSunsetMix);
        vec3 mid    = mix(midDay, midSun, uSunsetMix);
        vec3 horiz  = mix(horizDay, horizSun, uSunsetMix);

        vec3 sky = mix(horiz, mid, smoothstep(-0.02, 0.28, elev));
        sky = mix(sky, zenith, smoothstep(0.22, 0.85, elev));

        // Below-horizon warm cloud haze bounce
        vec3 nadir = mix(vec3(0.22, 0.16, 0.30), vec3(0.18, 0.09, 0.22), uSunsetMix);
        sky = mix(nadir, sky, smoothstep(-0.28, 0.02, elev));

        // Mie sun halo + solar disc
        float mu = max(dot(d, normalize(uSunDir)), 0.0);
        sky += vec3(1.0, 0.68, 0.32) * pow(mu, 7.0) * 0.45;
        sky += vec3(1.4, 1.05, 0.65) * pow(mu, 64.0) * 0.85;
        sky += vec3(2.4, 2.0, 1.4) * smoothstep(0.9985, 0.9997, mu);

        sky *= mix(1.0, 0.16, uIndoorDim);
        gl_FragColor = vec4(sky, 1.0);
      }
    `,
  });
}

export function createStylizedCloudMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    uniforms: {
      uSunDir: { value: new THREE.Vector3(-0.55, 0.28, -0.79).normalize() },
      uSunsetMix: { value: 0.0 },
      uOpacity: { value: 0.96 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalW;
      varying vec3 vViewDir;
      void main() {
        #ifdef USE_INSTANCING
          vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vNormalW = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        #else
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vNormalW = normalize(mat3(modelMatrix) * normal);
        #endif
        vViewDir = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDir;
      uniform float uSunsetMix;
      uniform float uOpacity;
      varying vec3 vNormalW;
      varying vec3 vViewDir;

      void main() {
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(vViewDir);
        vec3 L = normalize(uSunDir);

        float ndl = dot(N, L) * 0.5 + 0.5;
        float up = N.y * 0.5 + 0.5;
        float rim = pow(1.0 - max(dot(N, V), 0.0), 2.4);
        float forwardScatter = pow(max(dot(-V, L), 0.0), 4.0);

        vec3 shadowCol = mix(vec3(0.28, 0.24, 0.42), vec3(0.26, 0.14, 0.30), uSunsetMix);
        vec3 midCol    = mix(vec3(0.86, 0.78, 0.80), vec3(0.92, 0.56, 0.46), uSunsetMix);
        vec3 litCol    = mix(vec3(1.05, 0.93, 0.78), vec3(1.18, 0.78, 0.42), uSunsetMix);

        // Painterly quantized + smooth hybrid shading
        float band = mix(ndl, floor(ndl * 4.0) / 4.0, 0.28);
        vec3 col = mix(shadowCol, midCol, smoothstep(0.18, 0.58, band * 0.7 + up * 0.3));
        col = mix(col, litCol, smoothstep(0.55, 0.92, band));
        col += vec3(1.15, 0.78, 0.42) * rim * (0.28 + 0.45 * forwardScatter);

        gl_FragColor = vec4(col, uOpacity);
      }
    `,
  });
}

export function createGodRayMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color('#FFBE6B') },
      uIntensity: { value: 0.22 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec2 vUv;
      void main() {
        float across = sin(vUv.x * 3.14159265);
        float along = pow(1.0 - vUv.y, 1.45) * smoothstep(0.0, 0.12, vUv.y);
        float alpha = across * across * along * uIntensity;
        gl_FragColor = vec4(uColor * alpha, alpha);
      }
    `,
  });
}
