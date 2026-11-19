import * as T from 'three';
import { V, PI, mesh, loft } from './stage.js';

/**
 * 8-meter Giant Squid (Architeuthis dux) for shared-world abyssal scale & sonar reveal.
 * Mantle points toward -z (jet-swimming direction), arms & tentacles trail toward +z.
 */
export function buildGiantSquid(parent, totalLen = 8.0) {
  const root = new T.Group();
  const body = new T.Group();
  parent.add(root);
  root.add(body);

  const mantleMat = new T.MeshStandardMaterial({
    color: 0x9b5447,
    roughness: 0.48,
    metalness: 0.04
  });
  const finMat = new T.MeshStandardMaterial({
    color: 0x86443a,
    roughness: 0.52,
    metalness: 0.03
  });
  const armMat = new T.MeshStandardMaterial({
    color: 0xb06658,
    roughness: 0.54,
    metalness: 0.02
  });

  // Streamlined torpedo mantle (z from -3.1 tip to -0.15 collar)
  const mantle = loft(body, [
    [0, 0, -3.15, 0.02, 0.02],
    [0, 0, -2.55, 0.16, 0.15],
    [0, 0, -1.65, 0.34, 0.32],
    [0, 0, -0.75, 0.37, 0.35],
    [0, 0, -0.20, 0.31, 0.30]
  ], V(1, 0, 0), V(0, 1, 0), mantleMat, 40, 24);

  // Terminal arrow stabilizing fins
  for (const side of [-1, 1]) {
    loft(body, [
      [side * 0.08, 0, -2.75, 0.03, 0.28],
      [side * 0.38, 0, -2.62, 0.024, 0.36],
      [side * 0.64, 0, -2.85, 0.012, 0.18],
      [side * 0.72, 0, -3.02, 0.004, 0.02]
    ], V(0, 1, 0), V(0, 0, 1), finMat, 24, 14);
  }

  // Head & huge pelagic eyes (dinner-plate sized ~25cm)
  const head = loft(body, [
    [0, 0, -0.22, 0.28, 0.27],
    [0, 0,  0.18, 0.29, 0.27],
    [0, 0,  0.52, 0.24, 0.22]
  ], V(1, 0, 0), V(0, 1, 0), mantleMat, 20, 20);

  const eyeWhite = new T.MeshStandardMaterial({ color: 0xd8c8a8, roughness: 0.25 });
  const pupilMat = new T.MeshStandardMaterial({ color: 0x09161c, roughness: 0.15 });
  for (const side of [-1, 1]) {
    const eb = mesh(body, new T.SphereGeometry(0.115, 18, 12), eyeWhite);
    eb.position.set(side * 0.24, 0.03, 0.15);
    const pu = mesh(body, new T.SphereGeometry(0.072, 16, 10), pupilMat);
    pu.position.set(side * 0.30, 0.03, 0.17);
  }

  // 8 tapered arms + 2 long feeding tentacles
  const limbs = [];
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * 2 * PI + 0.2;
    const rx = Math.cos(ang), ry = Math.sin(ang);
    const arm = loft(body, [
      [rx * 0.16, ry * 0.15, 0.45, 0.068, 0.068],
      [rx * 0.24, ry * 0.22, 1.45, 0.052, 0.052],
      [rx * 0.26, ry * 0.24, 2.55, 0.032, 0.032],
      [rx * 0.22, ry * 0.20, 3.45, 0.008, 0.008]
    ], V(1, 0, 0), V(0, 1, 0), armMat, 28, 10);
    limbs.push({ mesh: arm, phase: i * 0.72, amp: 0.14 });
  }
  // 2 long club-tipped feeding tentacles
  for (const side of [-1, 1]) {
    const tent = loft(body, [
      [side * 0.10, -0.06, 0.48, 0.040, 0.040],
      [side * 0.18, -0.10, 2.20, 0.032, 0.032],
      [side * 0.24, -0.08, 3.95, 0.028, 0.028],
      [side * 0.28, -0.06, 4.55, 0.072, 0.055], // club
      [side * 0.26, -0.05, 4.95, 0.008, 0.008]
    ], V(1, 0, 0), V(0, 1, 0), armMat, 36, 10);
    limbs.push({ mesh: tent, phase: side > 0 ? 1.4 : 4.2, amp: 0.22 });
  }

  // Normalize to totalLen
  body.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(body);
  const sc = totalLen / (bounds.max.z - bounds.min.z);
  body.scale.setScalar(sc);
  body.position.z = -(bounds.min.z + bounds.max.z) * 0.5 * sc;

  return {
    root,
    body,
    mantleMat,
    armMat,
    swim(t) {
      const pulse = 1.0 + 0.035 * Math.sin(t * 2.1);
      mantle.scale.set(pulse, pulse, 1.0);
      for (const item of limbs) {
        const p = item.mesh.geometry.attributes.position;
        const r = item.mesh.userData.rest;
        for (let i = 0; i < p.count; i++) {
          const x = r[3 * i], y = r[3 * i + 1], z = r[3 * i + 2];
          const u = T.MathUtils.clamp((z - 0.45) / 4.4, 0, 1);
          const waveY = item.amp * u * u * Math.sin(t * 1.9 + z * 1.3 + item.phase);
          const waveX = item.amp * 0.65 * u * u * Math.cos(t * 1.5 + z * 1.1 + item.phase);
          p.setXYZ(i, x + waveX, y + waveY, z);
        }
        p.needsUpdate = true;
        item.mesh.geometry.computeVertexNormals();
      }
      root.updateMatrixWorld(true);
    }
  };
}
