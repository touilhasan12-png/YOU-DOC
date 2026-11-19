import * as T from 'three';
import { V, PI, mesh, loft, curve } from './stage.js';

/**
 * Anatomically sculpted 18-meter bull Sperm Whale (Physeter macrocephalus).
 * Front = +z, Flukes = -z.
 * Signature hallmarks:
 *  - Massive blunt rectangular spermaceti head (superellipse cross-section, ~34% of length)
 *  - Underslung narrow lower jaw with two rows of ivory conical teeth
 *  - Corrugated dorsal hump + 4 caudal knuckles (no tall falcate dorsal fin)
 *  - Small rounded paddle pectoral flippers
 *  - Broad triangular horizontal flukes with clean median notch
 *  - Single left-offset blowhole near tip of snout
 *  - Charcoal-slate corrugated skin shader with subtle pale squid-sucker scars
 */
export function buildSpermWhale(parent, L = 18.0) {
  const root = new T.Group();
  const body = new T.Group();
  parent.add(root);
  root.add(body);

  // [z, rx (half-width), ry (half-height), cy (center elevation), p (superellipse exponent)]
  // Head occupies z = +2.8 .. +8.95 (~34% of total ~18m body)
  const stations = [
    [-9.00, 0.08, 0.14,  0.00, 2.0],
    [-8.20, 0.18, 0.28,  0.00, 2.0],
    [-6.80, 0.34, 0.50, -0.02, 2.1],
    [-4.80, 0.62, 0.80, -0.04, 2.1],
    [-2.50, 0.96, 1.14, -0.03, 2.2],
    [-0.20, 1.24, 1.38,  0.02, 2.3],
    [ 2.00, 1.36, 1.54,  0.08, 2.5],
    [ 3.80, 1.32, 1.62,  0.22, 2.8],
    [ 5.60, 1.20, 1.60,  0.34, 3.1],
    [ 7.20, 1.04, 1.52,  0.40, 3.3],
    [ 8.35, 0.82, 1.34,  0.42, 3.4],
    [ 8.85, 0.48, 0.92,  0.40, 3.2],
    [ 9.05, 0.04, 0.08,  0.36, 2.4]
  ];

  // Shape-preserving monotone cubic Hermite interpolation
  function profile(z) {
    let j = 0;
    while (j < stations.length - 2 && stations[j + 1][0] < z) j++;
    const a = stations[j], b = stations[j + 1], h = b[0] - a[0];
    const u = T.MathUtils.clamp((z - a[0]) / h, 0, 1);
    const out = [];
    for (let k = 1; k <= 4; k++) {
      const slope = i => {
        if (i === 0) return (stations[1][k] - stations[0][k]) / (stations[1][0] - stations[0][0]);
        if (i === stations.length - 1) return (stations[i][k] - stations[i - 1][k]) / (stations[i][0] - stations[i - 1][0]);
        const p1 = (stations[i][k] - stations[i - 1][k]) / (stations[i][0] - stations[i - 1][0]);
        const p2 = (stations[i + 1][k] - stations[i][k]) / (stations[i + 1][0] - stations[i][0]);
        return p1 * p2 <= 0 ? 0 : (2 * p1 * p2) / (p1 + p2);
      };
      out.push(
        (2 * u ** 3 - 3 * u * u + 1) * a[k] +
        (u ** 3 - 2 * u * u + u) * h * slope(j) +
        (-2 * u ** 3 + 3 * u * u) * b[k] +
        (u ** 3 - u * u) * h * slope(j + 1)
      );
    }
    return out; // [rx, ry, cy, p]
  }

  function skinPoint(z, angle, offset = 0.0) {
    const [rx, ry, cy, pExp] = profile(z);
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const exp = 2.0 / Math.max(2.0, pExp);
    const sx = Math.sign(s) * Math.pow(Math.abs(s), exp);
    const sy = Math.sign(c) * Math.pow(Math.abs(c), exp);
    // Flatten underside of spermaceti snout slightly so underslung jaw nests cleanly
    let yOff = cy + (ry + offset) * sy;
    if (z > 3.6 && sy < -0.25) {
      const headFactor = T.MathUtils.smoothstep(z, 3.6, 5.2);
      yOff += 0.28 * headFactor * (-sy - 0.25);
    }
    return V((rx + offset) * sx, yOff, z);
  }

  // Procedural dark charcoal-slate sperm whale skin with longitudinal corrugation + subtle scars
  const baseMat = new T.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.64,
    metalness: 0.015,
    vertexColors: true
  });

  function applySkinShader(obj) {
    const pos = obj.geometry.attributes.position;
    const norm = obj.geometry.attributes.normal;
    const cols = [];
    const dorsal = new T.Color(0x2c3c46);
    const flank = new T.Color(0x475963);
    const belly = new T.Color(0x63757f);
    for (let i = 0; i < pos.count; i++) {
      const ny = norm.getY(i);
      const col = ny > 0
        ? flank.clone().lerp(dorsal, T.MathUtils.smoothstep(ny, 0.0, 0.78))
        : flank.clone().lerp(belly, T.MathUtils.smoothstep(-ny, 0.05, 0.85));
      cols.push(col.r, col.g, col.b);
    }
    obj.geometry.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
    obj.material = baseMat.clone();
    obj.material.onBeforeCompile = s => {
      s.vertexShader = 'varying vec3 wp;\n' + s.vertexShader;
      s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nwp=position;');
      s.fragmentShader = `varying vec3 wp;
float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float n3(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(
    mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),
    f.z
  );
}
` + s.fragmentShader;
      s.fragmentShader = s.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        // Organic flank corrugation (prune-like wrinkles characteristic of Physeter)
        float flankMask = smoothstep(-5.5, -1.0, wp.z) * (1.0 - smoothstep(3.2, 5.4, wp.z));
        float wrinkle = sin(wp.y * 8.5 + n3(wp.xyz * 0.9) * 3.8) * 0.5 + 0.5;
        diffuseColor.rgb *= 1.0 - 0.11 * flankMask * wrinkle;
        // Subtle natural skin mottling
        float mottle = n3(wp * 1.4) + 0.35 * n3(wp * 4.2);
        diffuseColor.rgb *= 0.88 + 0.18 * mottle;
        // Pale healed squid-sucker scars around the blunt brow & snout
        float headMask = smoothstep(3.8, 6.2, wp.z);
        float scarField = n3(vec3(wp.x * 2.2, wp.y * 2.2, wp.z * 0.65));
        float scarLine = smoothstep(0.76, 0.85, scarField) * headMask;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.68, 0.70), scarLine * 0.34);`
      );
    };
    obj.material.customProgramCacheKey = () => 'sperm-whale-corrugated-v1';
  }

  // Main body mesh
  const nz = 220, nr = 64;
  const pts = [], ix = [];
  for (let j = 0; j <= nz; j++) {
    const z = -9.00 + (9.05 + 9.00) * (j / nz);
    for (let k = 0; k <= nr; k++) {
      const p = skinPoint(z, (k / nr) * 2 * PI, 0);
      pts.push(p.x, p.y, p.z);
      if (j < nz && k < nr) {
        const a = j * (nr + 1) + k;
        const b = a + nr + 1;
        ix.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const bodyGeo = new T.BufferGeometry();
  bodyGeo.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
  bodyGeo.setIndex(ix);
  bodyGeo.computeVertexNormals();
  const skin = mesh(body, bodyGeo, baseMat);
  applySkinShader(skin);

  function addFin(sections, A, B) {
    const o = loft(body, sections, A, B, baseMat, 44, 24);
    applySkinShader(o);
    return o;
  }

  // Small rounded paddle pectoral flippers (rooted deeply in flanks)
  for (const side of [-1, 1]) {
    addFin([
      [side * 1.10, -0.58, 3.05, 0.13, 0.44],
      [side * 1.55, -0.82, 2.72, 0.11, 0.50],
      [side * 2.02, -1.04, 2.30, 0.065, 0.38],
      [side * 2.28, -1.12, 1.98, 0.008, 0.05]
    ], V(0, 1, 0), V(0, 0, 1));
  }

  // Broad triangular horizontal tail flukes with distinct median notch
  for (const side of [-1, 1]) {
    addFin([
      [side * 0.06, 0.00, -8.35, 0.13, 0.44],
      [side * 0.72, -0.01, -8.68, 0.115, 0.68],
      [side * 1.58, -0.02, -8.98, 0.065, 0.56],
      [side * 2.22, 0.00, -9.28, 0.005, 0.025]
    ], V(0, 1, 0), V(0, 0, 1));
  }

  // Signature low rounded dorsal hump + 4 caudal knuckles along dorsal ridge
  const humpZ = -2.1;
  const [, hry, hcy] = profile(humpZ);
  const humpBase = hcy + hry - 0.12;
  addFin([
    [0, humpBase,        humpZ + 0.10, 0.24, 0.92],
    [0, humpBase + 0.24, humpZ - 0.05, 0.18, 0.68],
    [0, humpBase + 0.40, humpZ - 0.25, 0.11, 0.38],
    [0, humpBase + 0.44, humpZ - 0.42, 0.015, 0.05]
  ], V(1, 0, 0), V(0, 0, 1));

  // 4 smaller crenulations/knuckles leading toward tail stock
  const knuckleZs = [-3.45, -4.45, -5.35, -6.15];
  knuckleZs.forEach((kz, idx) => {
    const [, kry, kcy] = profile(kz);
    const kb = kcy + kry - 0.08;
    const h = 0.22 - idx * 0.032;
    addFin([
      [0, kb,        kz,        0.11 - idx * 0.015, 0.34 - idx * 0.03],
      [0, kb + h,    kz - 0.08, 0.05,               0.16],
      [0, kb + h + 0.02, kz - 0.15, 0.008,          0.02]
    ], V(1, 0, 0), V(0, 0, 1));
  });

  // Underslung narrow lower jaw (hinged group for subtle mouth articulation)
  const jawPivot = new T.Group();
  jawPivot.position.set(0, -1.04, 3.65);
  body.add(jawPivot);

  const jawLoft = loft(jawPivot, [
    [0,  0.00, 0.00, 0.42, 0.24],
    [0, -0.02, 1.40, 0.30, 0.20],
    [0,  0.00, 2.85, 0.21, 0.16],
    [0,  0.04, 4.05, 0.14, 0.12],
    [0,  0.06, 4.45, 0.03, 0.03]
  ], V(1, 0, 0), V(0, 1, 0), baseMat, 48, 20);
  // Pale whitish-grey lip/jaw lining characteristic of sperm whales
  applySkinShader(jawLoft);

  const toothMat = new T.MeshStandardMaterial({ color: 0xede6d3, roughness: 0.32, metalness: 0.02 });
  for (const side of [-1, 1]) {
    for (let i = 0; i < 14; i++) {
      const u = i / 13;
      const tz = 0.85 + u * 3.35;
      const halfW = T.MathUtils.lerp(0.28, 0.09, u);
      const tooth = mesh(jawPivot, new T.ConeGeometry(0.032, 0.135, 8), toothMat);
      tooth.position.set(side * halfW, 0.15 + u * 0.03, tz);
      tooth.rotation.z = -side * 0.14;
    }
  }

  // Eyes (set low and far back near jaw corner, anatomically accurate)
  const eyeMat = new T.MeshStandardMaterial({ color: 0x0c1b22, roughness: 0.22 });
  for (const side of [-1, 1]) {
    const ep = skinPoint(4.15, side * (PI * 0.56), 0.012);
    const eye = mesh(body, new T.SphereGeometry(0.065, 18, 12), eyeMat);
    eye.position.copy(ep);
    eye.scale.x = 0.55;
    // Subtle dark eyelid crease
    curve(body, [
      skinPoint(3.92, side * (PI * 0.545), 0.014),
      skinPoint(4.15, side * (PI * 0.535), 0.016),
      skinPoint(4.38, side * (PI * 0.550), 0.014)
    ], 0.014, 0x1b2a33, 16, 8);
  }

  // Single left-offset S-shaped blowhole near front-left crown of the snout
  const blowholeLocal = skinPoint(8.35, -0.34, 0.02);
  curve(body, [
    skinPoint(8.18, -0.30, 0.018),
    skinPoint(8.35, -0.35, 0.020),
    skinPoint(8.52, -0.39, 0.018)
  ], 0.026, 0x15232b, 16, 8);

  // Store rest vertices for unified smooth body undulation (excluding jawPivot children)
  const deformMeshes = [];
  body.children.forEach(ch => {
    if (ch === jawPivot) return;
    ch.traverse(o => {
      if (o.isMesh) {
        o.geometry = o.geometry.clone();
        o.geometry.userData.rest = o.geometry.attributes.position.array.slice();
        deformMeshes.push(o);
      }
    });
  });

  // Normalize exact length to L meters
  body.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(body);
  const scaleNorm = L / (bounds.max.z - bounds.min.z);
  body.scale.setScalar(scaleNorm);
  body.position.z = -(bounds.min.z + bounds.max.z) * 0.5 * scaleNorm;

  function verticalBend(z, t, amp = 0.34) {
    // Head stays stiff & massive; smooth vertical wave develops behind z = +1.0 toward flukes
    const u = T.MathUtils.clamp((1.2 - z) / 10.2, 0, 1);
    return amp * u * u * Math.sin(t * 1.18 + z * 0.24);
  }

  return {
    root,
    body,
    jawPivot,
    length: L,
    setJawOpen(rad) {
      jawPivot.rotation.x = Math.max(0, rad);
    },
    blowholeWorld() {
      body.updateMatrixWorld(true);
      return body.localToWorld(blowholeLocal.clone());
    },
    browWorld() {
      body.updateMatrixWorld(true);
      return body.localToWorld(V(0, 0.42, 9.05));
    },
    swim(t, amp = 0.34) {
      for (const o of deformMeshes) {
        const p = o.geometry.attributes.position;
        const r = o.geometry.userData.rest;
        for (let i = 0; i < p.count; i++) {
          const x = r[3 * i];
          const y = r[3 * i + 1];
          const z = r[3 * i + 2];
          p.setXYZ(i, x, y + verticalBend(z, t, amp), z);
        }
        p.needsUpdate = true;
        o.geometry.computeVertexNormals();
      }
      root.updateMatrixWorld(true);
    }
  };
}
