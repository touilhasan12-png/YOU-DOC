import * as T from 'three';
import { stage, V, PI, C, reset, cameraAt, buildOcean, buildUnderwater, ease, mesh } from './stage.js';
import { buildSpermWhale } from './sperm_whale.js';
import { buildGiantSquid } from './giant_squid.js';
import { buildFreediver } from './diver.js';

const captionEl = document.getElementById('caption');
const badgeEl = document.getElementById('badge');

function setCaption(title, detail = '', badge = '') {
  captionEl.innerHTML = title
    ? `${title}${detail ? `<span id="detail">${detail}</span>` : ''}`
    : '';
  badgeEl.textContent = badge || '';
}

let activeUpdate = () => ({});
let activeRow = null;

// Scene 1: Dominica ocean surface — angled spout & deep-dive fluke-up
function setupSurfaceDive(row) {
  reset(false, false);
  const updateOcean = buildOcean();

  const whale = buildSpermWhale(stage.scene, 18.0);
  // Orient whale along +x (head right, flukes left), slight 3/4 toward camera
  whale.root.rotation.y = PI / 2 - 0.14;

  // Angled misty exhalation plume (45 deg forward-left from offset blowhole)
  const mistGroup = new T.Group();
  stage.scene.add(mistGroup);
  const mistPuffs = [];
  const puffGeo = new T.IcosahedronGeometry(0.28, 2);
  for (let i = 0; i < 34; i++) {
    const mat = new T.MeshStandardMaterial({
      color: 0xeaf4f5,
      roughness: 0.92,
      metalness: 0.0,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    const p = new T.Mesh(puffGeo, mat);
    mistGroup.add(p);
    mistPuffs.push({
      mesh: p,
      mat,
      seed: i / 34,
      jitterX: Math.sin(i * 19.3) * 0.35,
      jitterY: Math.cos(i * 13.7) * 0.25,
      jitterZ: Math.sin(i * 29.1) * 0.35
    });
  }

  return t => {
    updateOcean(t);
    // Smooth swim undulation (gentler while logging, stronger entering dive)
    const diveStart = 5.8;
    const diveU = ease((t - diveStart) / 8.8);
    const swimAmp = T.MathUtils.lerp(0.14, 0.30, diveU);
    whale.swim(t, swimAmp);

    // Logging gently at surface (0..5.8s), then arching head-down & lifting flukes (5.8..15s)
    const swell = 0.08 * Math.sin(t * 1.05);
    const pitch = T.MathUtils.lerp(0.0, 0.96, ease((t - 5.6) / 6.8)) + 0.14 * ease((t - 11.8) / 3.2);
    // Keep body high through fluke-up apex (~t=11.5..12.8s), then glide cleanly downward
    const sink = -0.36 + 0.32 * Math.sin(PI * T.MathUtils.clamp((t - 6.8) / 6.2, 0, 1)) - 4.4 * ease((t - 11.4) / 3.8);
    const forwardGlide = -1.6 + t * 0.22;

    whale.root.position.set(forwardGlide, sink + swell, 0.0);
    whale.body.rotation.x = pitch; // +x rotation tips +z head DOWN and -z flukes UP into the sky
    whale.root.updateMatrixWorld(true);

    // Forward-left angled blow spout between t = 1.6s and t = 5.9s
    const bh = whale.blowholeWorld();
    const spoutActive = t >= 1.5 && t <= 6.2;
    for (const pf of mistPuffs) {
      if (!spoutActive) {
        pf.mat.opacity = 0;
        pf.mesh.visible = false;
        continue;
      }
      const birth = 1.5 + pf.seed * 2.1;
      const age = t - birth;
      if (age < 0 || age > 2.6) {
        pf.mat.opacity = 0;
        pf.mesh.visible = false;
        continue;
      }
      pf.mesh.visible = true;
      const life = age / 2.6;
      // Angled 42 degrees forward (+x) and slightly left (+z)
      const dist = 4.2 * Math.pow(life, 0.72);
      const px = bh.x + dist * 0.68 + pf.jitterX * life * 1.6;
      const py = Math.max(0.08, bh.y + dist * 0.82 - 0.55 * life * life + pf.jitterY * life);
      const pz = bh.z + dist * 0.24 + pf.jitterZ * life * 1.4;
      pf.mesh.position.set(px, py, pz);
      const sc = 0.55 + life * 2.4;
      pf.mesh.scale.set(sc * 1.15, sc * 0.95, sc);
      pf.mat.opacity = 0.42 * Math.sin(PI * Math.min(1, life * 1.1)) * (1 - life * 0.65);
    }

    // Calm documentary tracking camera holding full 18m whale & rising flukes inside safe margins
    const camX = 3.2 - t * 0.28;
    const camY = 2.85 + 0.35 * ease((t - 7.0) / 5.0);
    const lookX = -0.6 - t * 0.14;
    const lookY = 1.15 + 0.65 * ease((t - 7.5) / 4.5);
    cameraAt(V(camX, camY, 21.8), V(lookX, lookY, 0.0), 36);

    const cueT = row.cue_s ?? row.default_cue_s ?? 11.2;
    if (t >= cueT) {
      setCaption(row.beat_title, row.beat_detail);
    } else if (t >= 0.6) {
      setCaption(row.opening_title, row.opening_detail);
    } else {
      setCaption('');
    }
    return { whale_pitch_rad: Number(pitch.toFixed(3)), whale_y: Number(sink.toFixed(3)) };
  };
}

// Scene 2: Deep underwater true shared-world scale (18m whale vs 1.8m freediver vs 8m giant squid)
function setupAbyssScale(row) {
  reset(true, false);
  const updateUnder = buildUnderwater(8.5, false);

  const whale = buildSpermWhale(stage.scene, 18.0);
  whale.root.rotation.y = PI / 2 - 0.15;
  whale.root.position.set(-0.2, 1.05, 0.0);

  const diver = buildFreediver(stage.scene, 1.80);
  diver.root.rotation.y = PI / 2 - 0.10;
  diver.root.position.set(4.8, -2.55, 1.4);

  const squid = buildGiantSquid(stage.scene, 8.0);
  // Jet-swimming rightward (mantle points +x)
  squid.root.rotation.y = -PI / 2 + 0.14;
  squid.root.position.set(-4.3, -4.15, -1.2);

  // Subtle crisp 3D gold scale bar for 18m length reference
  const scaleGroup = new T.Group();
  stage.scene.add(scaleGroup);
  const goldMat = new T.MeshBasicMaterial({ color: C.gold, transparent: true, opacity: 0.0 });
  const bar = mesh(scaleGroup, new T.BoxGeometry(17.8, 0.045, 0.045), goldMat);
  bar.position.set(-0.2, -1.25, 0.6);
  const tickL = mesh(scaleGroup, new T.BoxGeometry(0.055, 0.42, 0.055), goldMat);
  tickL.position.set(-9.1, -1.25, 0.6);
  const tickR = mesh(scaleGroup, new T.BoxGeometry(0.055, 0.42, 0.055), goldMat);
  tickR.position.set(8.7, -1.25, 0.6);

  return t => {
    updateUnder(t);
    whale.swim(t, 0.34);
    whale.setJawOpen(0.06 + 0.04 * Math.sin(t * 0.7));
    whale.root.position.x = -0.8 + t * 0.10;
    whale.root.position.y = 1.05 + 0.12 * Math.sin(t * 0.55);

    diver.swim(t);
    diver.root.position.x = 4.2 + t * 0.08;
    diver.root.position.y = -2.55 + 0.08 * Math.sin(t * 0.8 + 1.0);

    squid.swim(t);
    squid.root.position.x = -4.9 + t * 0.11;
    squid.root.position.y = -4.15 + 0.10 * Math.cos(t * 0.65);

    const cueT = row.cue_s ?? row.default_cue_s ?? 2.2;
    const barAlpha = ease((t - cueT) / 0.85) * 0.85;
    goldMat.opacity = barAlpha;
    scaleGroup.position.x = whale.root.position.x + 0.2;

    // Gentle steady documentary camera (slight smooth drift)
    cameraAt(V(1.1 - t * 0.04, -0.75, 25.6 - t * 0.06), V(0.0, -0.75, 0.0), 34);

    if (t >= cueT) {
      setCaption(row.beat_title, row.beat_detail, '18 M · 1.8 M · 8 M');
    } else {
      setCaption(row.opening_title, row.opening_detail);
    }
    return {
      whale_x: Number(whale.root.position.x.toFixed(3)),
      diver_y: Number(diver.root.position.y.toFixed(3))
    };
  };
}

// Scene 3: 230 dB Biological Sonar Cannon — front-3/4 head + crisp concentric sonar wavefronts + giant squid echo
function setupClick230dB(row) {
  reset(true, true);
  const updateUnder = buildUnderwater(9.0, true);

  const whale = buildSpermWhale(stage.scene, 18.0);
  whale.root.rotation.y = PI / 2 - 0.22;
  whale.root.position.set(-9.4, -0.25, 0.6);

  const squid = buildGiantSquid(stage.scene, 8.0);
  squid.root.rotation.y = PI / 2 + 0.25; // Mantle facing away/left-right oblique in abyssal water
  squid.root.position.set(8.6, -0.95, -1.6);

  // Pool of 6 crisp geometric sonar wavefront arcs (sharp vector-like 3D rings, NO blur)
  const wavePool = [];
  for (let i = 0; i < 6; i++) {
    const grp = new T.Group();
    stage.scene.add(grp);
    const matPrimary = new T.MeshBasicMaterial({
      color: i % 2 === 0 ? C.aqua : C.gold,
      transparent: true,
      opacity: 0.0,
      side: T.DoubleSide
    });
    const matInner = new T.MeshBasicMaterial({
      color: C.cream,
      transparent: true,
      opacity: 0.0,
      side: T.DoubleSide
    });
    // Vertical arc spanning ~84 degrees ahead of the brow
    const outerArc = mesh(grp, new T.TorusGeometry(1.0, 0.022, 10, 44, PI * 0.48), matPrimary);
    outerArc.rotation.z = -PI * 0.24;
    const innerArc = mesh(grp, new T.TorusGeometry(0.84, 0.012, 8, 36, PI * 0.36), matInner);
    innerArc.rotation.z = -PI * 0.18;
    wavePool.push({ grp, matPrimary, matInner, idx: i });
  }

  // Subtle echo reflection ring around squid when sonar sweeps past
  const echoMat = new T.MeshBasicMaterial({
    color: C.gold,
    transparent: true,
    opacity: 0.0,
    side: T.DoubleSide
  });
  const echoRing = mesh(stage.scene, new T.TorusGeometry(1.0, 0.02, 8, 40, PI * 0.42), echoMat);
  echoRing.rotation.z = PI - PI * 0.21;

  const baseSquidColor = new T.Color(0x9b5447);
  const litSquidColor = new T.Color(0xdc8d76);

  return t => {
    updateUnder(t);
    whale.swim(t, 0.26);
    // Subtle lower-jaw articulation synchronized to sonar bursts
    whale.setJawOpen(0.08 + 0.07 * Math.sin(t * 1.4));
    whale.root.position.x = -9.8 + t * 0.12;
    whale.root.position.y = -0.25 + 0.14 * Math.sin(t * 0.65);

    squid.swim(t);
    squid.root.position.x = 8.9 - t * 0.06;
    squid.root.position.y = -0.95 + 0.18 * Math.cos(t * 0.7);

    const brow = whale.browWorld();
    const targetDist = brow.distanceTo(squid.root.position);
    const period = 1.18; // ~0.85 Hz crisp deep-water search clicks
    const travelSpeed = 6.2; // meters/sec visual wavefront expansion

    let maxSquidEcho = 0;
    for (const w of wavePool) {
      const cycleIndex = Math.floor(t / period) - w.idx;
      const age = t - (cycleIndex * period + 0.35);
      if (cycleIndex < 0 || age < 0 || age > 2.35) {
        w.grp.visible = false;
        w.matPrimary.opacity = 0;
        w.matInner.opacity = 0;
        continue;
      }
      w.grp.visible = true;
      const radius = 0.65 + age * travelSpeed;
      const fade = Math.min(1, age / 0.14) * Math.max(0, 1 - age / 2.35);
      w.grp.position.copy(brow);
      w.grp.rotation.y = 0.16; // Aim gently along brow-to-squid bearing
      w.grp.scale.setScalar(radius);
      w.matPrimary.opacity = 0.78 * fade;
      w.matInner.opacity = 0.42 * fade;

      const hitDelta = Math.abs(radius - targetDist);
      if (hitDelta < 1.35) {
        maxSquidEcho = Math.max(maxSquidEcho, 1 - hitDelta / 1.35);
      }
    }

    // Echo shimmer off the giant squid
    if (maxSquidEcho > 0.02) {
      echoRing.visible = true;
      echoRing.position.set(squid.root.position.x - 1.2, squid.root.position.y, squid.root.position.z + 0.4);
      echoRing.scale.setScalar(1.1 + (1 - maxSquidEcho) * 2.4);
      echoMat.opacity = 0.65 * maxSquidEcho;
      squid.mantleMat.color.copy(baseSquidColor).lerp(litSquidColor, maxSquidEcho * 0.65);
    } else {
      echoRing.visible = false;
      echoMat.opacity = 0;
      squid.mantleMat.color.copy(baseSquidColor);
    }

    cameraAt(V(1.6 + t * 0.04, 0.15, 19.6 - t * 0.05), V(1.1, -0.45, -0.4), 35);

    const cueT = row.cue_s ?? row.default_cue_s ?? 7.8;
    if (t >= cueT) {
      setCaption(row.beat_title, row.beat_detail, '230 dB');
    } else {
      setCaption(row.opening_title, row.opening_detail);
    }
    return { echo_strength: Number(maxSquidEcho.toFixed(3)) };
  };
}

window.configure = row => {
  activeRow = row;
  if (row.key === 'surface_dive') activeUpdate = setupSurfaceDive(row);
  else if (row.key === 'abyss_scale') activeUpdate = setupAbyssScale(row);
  else if (row.key === 'click_230db') activeUpdate = setupClick230dB(row);
  else throw new Error('Unknown 3D scene key: ' + row.key);
};

window.draw = t => {
  const report = activeUpdate(t);
  stage.scene.fog = null;
  stage.renderer.render(stage.scene, stage.camera);
  return report || {};
};

window.ready = true;
