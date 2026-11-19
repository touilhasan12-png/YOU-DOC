import * as T from 'three';
import { Water } from 'three/addons/objects/Water.js';

export const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
export const PI = Math.PI;

// Exact YOU-DOC 3D Palette (01_VISUAL_IDENTITY_AND_STYLE_DNA.txt)
export const C = {
  ink: 0x183e53,
  cream: 0xede8da,
  teak: 0x987450,
  navy: 0x1d4359,
  metal: 0x829eaa,
  gold: 0xdfb565,
  aqua: 0x72b8bc,
  coral: 0xcf7960,
  waterUnder: 0x074967,
  waterSurface: 0x075269,
  sun: 0xfff3d6
};

const texLoader = new T.TextureLoader();
const waterNormal = await texLoader.loadAsync('/ocean/waternormals.jpg');
waterNormal.wrapS = waterNormal.wrapT = T.RepeatWrapping;

const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(1920, 1080);
renderer.setPixelRatio(1);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.82;
renderer.shadowMap.enabled = false;
document.body.append(renderer.domElement);

let scene = null;
let camera = null;

export const M = (color, roughness = 0.62, metalness = 0.02) =>
  new T.MeshStandardMaterial({ color, roughness, metalness });

export function mesh(parent, geo, mat) {
  const o = new T.Mesh(geo, typeof mat === 'number' ? M(mat) : mat);
  parent.add(o);
  return o;
}

export function tube(parent, a, b, r, mat) {
  const len = a.distanceTo(b);
  const o = mesh(parent, new T.CylinderGeometry(r, r, len, 16), mat);
  o.position.copy(a).add(b).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  return o;
}

export function curve(parent, points, r, mat, segs = 48, radSegs = 10) {
  return mesh(parent, new T.TubeGeometry(new T.CatmullRomCurve3(points), segs, r, radSegs, false), mat);
}

// Smooth volumetric loft with guaranteed outward triangle winding
export function loft(parent, sections, A, B, mat, n = 48, k = 24) {
  const c = new T.CatmullRomCurve3(sections.map(s => V(s[0], s[1], s[2])));
  const p = [], ix = [], centers = [];
  for (let j = 0; j <= n; j++) {
    const t = j / n;
    const q = c.getPoint(t);
    const u = t * (sections.length - 1);
    const m = Math.min(sections.length - 2, Math.floor(u));
    let f = u - m;
    f = f * f * (3 - 2 * f);
    const a = T.MathUtils.lerp(sections[m][3], sections[m + 1][3], f);
    const b = T.MathUtils.lerp(sections[m][4], sections[m + 1][4], f);
    centers.push(q);
    for (let i = 0; i <= k; i++) {
      const th = (i / k) * 2 * PI;
      const v = q.clone().addScaledVector(A, a * Math.sin(th)).addScaledVector(B, b * Math.cos(th));
      p.push(v.x, v.y, v.z);
    }
  }
  function tri(a, b, cIdx, j) {
    const va = V(p[a * 3], p[a * 3 + 1], p[a * 3 + 2]);
    const vb = V(p[b * 3], p[b * 3 + 1], p[b * 3 + 2]);
    const vc = V(p[cIdx * 3], p[cIdx * 3 + 1], p[cIdx * 3 + 2]);
    const normal = vb.clone().sub(va).cross(vc.clone().sub(va));
    const rad = va.clone().sub(centers[j]);
    if (normal.dot(rad) >= 0) ix.push(a, b, cIdx);
    else ix.push(a, cIdx, b);
  }
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < k; i++) {
      const a = j * (k + 1) + i;
      const b = a + k + 1;
      tri(a, b, a + 1, j);
      tri(a + 1, b, b + 1, j);
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  g.setIndex(ix);
  g.computeVertexNormals();
  const o = mesh(parent, g, typeof mat === 'number' ? M(mat) : mat.clone());
  o.userData.rest = g.attributes.position.array.slice();
  return o;
}

export function ease(x) {
  const t = T.MathUtils.clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}

export function reset(under = false, abyssal = false) {
  if (scene) {
    scene.environment?.dispose();
    scene.traverse(o => {
      if (o.geometry) o.geometry.dispose();
    });
  }
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(38, 16 / 9, 0.06, 1600);
  // Sharp mode: fog explicitly null (01_VISUAL_IDENTITY_AND_STYLE_DNA.txt)
  scene.fog = null;

  if (!under) {
    scene.add(new T.HemisphereLight(0xd6e8f4, 0x5b6660, 1.8));
    const key = new T.DirectionalLight(0xffe6bc, 2.25);
    key.position.set(-12, 22, 10);
    scene.add(key);
    const fill = new T.DirectionalLight(0xc7dceb, 1.25);
    fill.position.set(7, 9, 10);
    scene.add(fill);
  } else {
    const bgHex = abyssal ? 0x053348 : 0x074967;
    scene.background = new T.Color(bgHex);
    scene.add(new T.HemisphereLight(abyssal ? 0x5fb6cf : 0x80d0e3, 0x063c57, abyssal ? 1.45 : 1.7));
    const key = new T.DirectionalLight(abyssal ? 0x8bd8e6 : 0xa9ebf0, abyssal ? 2.25 : 2.6);
    key.position.set(-12, 22, 10);
    scene.add(key);
    const resetLight = new T.DirectionalLight(0xafdfe9, abyssal ? 1.1 : 1.3);
    resetLight.position.set(9, 5, 12);
    scene.add(resetLight);
    const appFill = new T.DirectionalLight(0xb8d9dd, 0.85);
    appFill.position.set(6, -7, 9);
    scene.add(appFill);
  }
}

export function cameraAt(pos, target, fov = 38) {
  camera.fov = fov;
  camera.updateProjectionMatrix();
  camera.position.copy(pos);
  camera.lookAt(target);
}

export function buildSky() {
  const sun = V(-0.4, 0.42, 0.65).normalize();
  const dome = new T.Mesh(
    new T.SphereGeometry(900, 32, 20),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      uniforms: { sun: { value: sun } },
      vertexShader: `varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 dir;uniform vec3 sun;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float f(vec2 p){return .53*n(p)+.27*n(p*2.03)+.13*n(p*4.17)+.07*n(p*8.31);}
void main(){
  vec3 d=normalize(dir);
  float y=max(d.y,0.);
  vec3 c=mix(vec3(.40,.57,.65),vec3(.045,.19,.37),pow(y,.45));
  float cloud=smoothstep(.56,.75,f(d.xz/max(.03,d.y)*3.))*smoothstep(.10,.24,d.y);
  c=mix(c,vec3(.71,.76,.75),cloud*.58);
  float a=max(dot(d,sun),0.);
  c+=vec3(1.,.78,.47)*pow(a,130.)*.13;
  c=mix(c,vec3(1.,.88,.62),smoothstep(.9997,.9999,a));
  gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`
    })
  );
  scene.add(dome);
  const env = new T.PMREMGenerator(renderer);
  scene.environment = env.fromScene(dome, 0.065).texture;
  scene.environmentIntensity = 0.38;
  env.dispose();
  return sun;
}

export function buildOcean() {
  const sun = buildSky();
  const g = new T.PlaneGeometry(1200, 1200, 128, 128);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, 0.13 * Math.sin(x * 0.23 + y * 0.12) + 0.055 * Math.sin(y * 0.64 - x * 0.18));
  }
  g.computeVertexNormals();
  const water = new Water(g, {
    textureWidth: 256,
    textureHeight: 256,
    waterNormals: waterNormal,
    sunDirection: sun,
    sunColor: 0xfff3d6,
    waterColor: 0x075269,
    distortionScale: 1.65,
    fog: false
  });
  water.rotation.x = -PI / 2;
  scene.add(water);
  water.material.uniforms.size.value = 4.0;
  water.material.fragmentShader = water.material.fragmentShader
    .replace('float rf0 = 0.3;', 'float rf0 = 0.025;')
    .replace('sunColor * diffuseLight * 0.3', 'sunColor * diffuseLight * 0.075')
    .replace('vec3( 0.1 ) + reflectionSample', 'vec3( 0.005, 0.015, 0.025 ) + reflectionSample');
  return t => {
    water.material.uniforms.time.value = t * 0.45;
  };
}

export function buildUnderwater(level = 7, abyssal = false) {
  // Subtle light shafts
  const shaftCount = abyssal ? 8 : 11;
  const shaftAlpha = abyssal ? 0.028 : 0.045;
  for (let i = 0; i < shaftCount; i++) {
    const mat = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      uniforms: { strength: { value: shaftAlpha } },
      vertexShader: 'varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec2 q;uniform float strength;void main(){float edge=pow(sin(3.14159265*q.x),3.);float fade=smoothstep(0.,.3,q.y)*(1.-smoothstep(.88,1.,q.y));gl_FragColor=vec4(.25,.58,.64,strength*edge*fade);\n#include <colorspace_fragment>\n}'
    });
    const shaft = mesh(scene, new T.PlaneGeometry(0.9 + (i % 3) * 0.65, 28), mat);
    shaft.position.set(-20 + i * 4.2, level - 10, -24 + (i % 3) * 5);
    shaft.rotation.z = -0.20;
  }

  // Deep water gradient dome
  const topCol = abyssal ? 'vec3(.014,.15,.22)' : 'vec3(.028,.27,.34)';
  const botCol = abyssal ? 'vec3(.003,.012,.030)' : 'vec3(.006,.023,.052)';
  mesh(
    scene,
    new T.SphereGeometry(120, 24, 16),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      vertexShader: 'varying vec3 d;void main(){d=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec3 d;void main(){float y=normalize(d).y;gl_FragColor=vec4(mix(${botCol},${topCol},smoothstep(-.6,.65,y)),1.);\n#include <colorspace_fragment>\n}`
    })
  );

  // Overhead surface ripple ceiling
  if (!abyssal) {
    const ceiling = mesh(
      scene,
      new T.PlaneGeometry(200, 200, 64, 64),
      new T.MeshPhysicalMaterial({
        color: 0x68c4d3,
        roughness: 0.16,
        metalness: 0.2,
        transparent: true,
        opacity: 0.22,
        side: T.DoubleSide
      })
    );
    const cp = ceiling.geometry.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      const x = cp.getX(i), z = cp.getY(i);
      cp.setZ(i, 0.10 * Math.sin(x * 0.32 + z * 0.17) + 0.04 * Math.sin(z * 0.85));
    }
    ceiling.geometry.computeVertexNormals();
    ceiling.rotation.x = PI / 2;
    ceiling.position.y = level;
  }

  // Subtle marine snow particles
  const geo = new T.BufferGeometry();
  const pts = [];
  for (let i = 0; i < 160; i++) {
    pts.push(Math.sin(i * 17.71) * 26, -12 + ((i * 7.13) % 20), Math.cos(i * 13.17) * 32);
  }
  geo.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
  const snow = new T.Points(
    geo,
    new T.PointsMaterial({ color: 0xbce9e6, size: 0.035, transparent: true, opacity: 0.28 })
  );
  scene.add(snow);
  return t => {
    snow.position.y = -0.18 * Math.sin(t * 0.3);
    snow.position.x = -0.25 * t;
  };
}

export const stage = {
  get scene() { return scene; },
  get camera() { return camera; },
  get renderer() { return renderer; }
};
