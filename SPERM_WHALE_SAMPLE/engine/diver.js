import * as T from 'three';
import { V, PI, mesh, loft, tube } from './stage.js';

/**
 * True-scale 1.8m articulated freediver (no invented scuba tank).
 * Matte neoprene wetsuit, diving mask & snorkel, weight belt, two long sleek fins.
 * Horizontal prone swimming posture (+z forward, -z fins).
 */
export function buildFreediver(parent, heightM = 1.80) {
  const root = new T.Group();
  const body = new T.Group();
  parent.add(root);
  root.add(body);

  const suitDark = new T.MeshStandardMaterial({ color: 0x1b2c36, roughness: 0.72, metalness: 0.04 });
  const suitAccent = new T.MeshStandardMaterial({ color: 0x355866, roughness: 0.65, metalness: 0.05 });
  const skinMat = new T.MeshStandardMaterial({ color: 0xd4a487, roughness: 0.68 });
  const glassMat = new T.MeshStandardMaterial({ color: 0x9cd8e3, roughness: 0.14, metalness: 0.35 });
  const beltMat = new T.MeshStandardMaterial({ color: 0xdfb565, roughness: 0.45, metalness: 0.15 });
  const finMat = new T.MeshStandardMaterial({ color: 0x12222b, roughness: 0.42, metalness: 0.08 });

  // Torso loft along z (hips at z=0.0, shoulders at z=+0.56)
  loft(body, [
    [0,  0.00, -0.04, 0.155, 0.105],
    [0,  0.01,  0.14, 0.140, 0.100],
    [0,  0.02,  0.38, 0.185, 0.118],
    [0,  0.01,  0.55, 0.195, 0.105],
    [0,  0.01,  0.62, 0.070, 0.065]
  ], V(1, 0, 0), V(0, 1, 0), suitDark, 24, 20);

  // Subtle teal chest panel accent
  const panel = mesh(body, new T.BoxGeometry(0.24, 0.025, 0.24), suitAccent);
  panel.position.set(0, 0.112, 0.38);

  // Weight belt around waist
  const belt = mesh(body, new T.TorusGeometry(0.145, 0.018, 10, 24), beltMat);
  belt.position.set(0, 0.008, 0.09);

  // Neck + hooded head
  tube(body, V(0, 0.01, 0.58), V(0, 0.02, 0.68), 0.052, suitDark);
  const head = mesh(body, new T.SphereGeometry(0.105, 20, 16), suitDark);
  head.position.set(0, 0.025, 0.77);
  head.scale.set(0.88, 0.94, 1.08);

  // Face cutout & low-volume freediving mask + snorkel
  const face = mesh(body, new T.SphereGeometry(0.082, 16, 12), skinMat);
  face.position.set(0, -0.02, 0.815);
  face.scale.set(0.85, 0.65, 0.75);

  const maskFrame = mesh(body, new T.BoxGeometry(0.145, 0.068, 0.045), suitAccent);
  maskFrame.position.set(0, -0.03, 0.865);
  const maskLens = mesh(body, new T.BoxGeometry(0.125, 0.052, 0.02), glassMat);
  maskLens.position.set(0, -0.03, 0.884);

  // Snorkel clipped cleanly along left temple
  tube(body, V(-0.085, -0.04, 0.84), V(-0.095, 0.12, 0.74), 0.012, beltMat);
  tube(body, V(-0.095, 0.12, 0.74), V(-0.095, 0.26, 0.62), 0.012, suitDark);

  // Articulated arms swept naturally along sides in streamlined glide
  const arms = [];
  for (const side of [-1, 1]) {
    const sh = new T.Group();
    sh.position.set(side * 0.205, 0.00, 0.52);
    body.add(sh);
    tube(sh, V(0, 0, 0), V(side * 0.05, -0.04, -0.28), 0.044, suitDark);
    const elbow = mesh(sh, new T.SphereGeometry(0.043, 12, 10), suitDark);
    elbow.position.set(side * 0.05, -0.04, -0.28);
    tube(sh, V(side * 0.05, -0.04, -0.28), V(side * 0.04, -0.06, -0.54), 0.036, suitAccent);
    const hand = mesh(sh, new T.BoxGeometry(0.065, 0.024, 0.14), skinMat);
    hand.position.set(side * 0.04, -0.06, -0.61);
    arms.push({ group: sh, side });
  }

  // Articulated legs + long freediving fins
  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new T.Group();
    hip.position.set(side * 0.092, 0.00, -0.02);
    body.add(hip);
    tube(hip, V(0, 0, 0), V(0, 0, -0.42), 0.068, suitDark);
    const knee = new T.Group();
    knee.position.set(0, 0, -0.42);
    hip.add(knee);
    mesh(knee, new T.SphereGeometry(0.056, 12, 10), suitDark);
    tube(knee, V(0, 0, 0), V(0, 0, -0.40), 0.048, suitDark);
    // Ankle & long freediving fin blade (~0.68m blade)
    const foot = new T.Group();
    foot.position.set(0, 0, -0.41);
    knee.add(foot);
    const boot = mesh(foot, new T.BoxGeometry(0.088, 0.055, 0.20), finMat);
    boot.position.set(0, -0.01, -0.08);
    const blade = mesh(foot, new T.BoxGeometry(0.175, 0.012, 0.62), finMat);
    blade.position.set(0, -0.015, -0.44);
    const tipStripe = mesh(foot, new T.BoxGeometry(0.175, 0.014, 0.05), beltMat);
    tipStripe.position.set(0, -0.015, -0.72);
    legs.push({ hip, knee, foot, side });
  }

  // Scale body so head-to-ankle height matches heightM (fins extend naturally beyond)
  const nominalBodyLen = 1.72; // z from -0.84 ankle to +0.88 mask
  body.scale.setScalar(heightM / nominalBodyLen);

  return {
    root,
    body,
    swim(t) {
      for (const lg of legs) {
        const phase = t * 2.2 + (lg.side > 0 ? 0 : PI);
        const s = Math.sin(phase);
        lg.hip.rotation.x = 0.16 * s;
        lg.knee.rotation.x = 0.22 * Math.max(0, Math.sin(phase - 0.7));
        lg.foot.rotation.x = 0.28 * Math.sin(phase - 1.1);
      }
      for (const ar of arms) {
        ar.group.rotation.x = 0.05 * Math.sin(t * 1.4 + ar.side);
      }
      body.position.y = 0.04 * Math.sin(t * 1.1);
      root.updateMatrixWorld(true);
    }
  };
}
