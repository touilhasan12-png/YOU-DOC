import * as THREE from 'three';
import { Puppet2D } from '../characters/Puppet2D';
import { clamp, mulberry32, smootherstep, smoothstep } from '../engine/math';
import { createStressPanelMaterial } from '../shaders/stressPanelShader';

interface BallisticParticle {
  origin: THREE.Vector3;
  vel: THREE.Vector3;
  rotSpeed: number;
  scale: number;
}

export class StressMacroSet {
  public readonly group = new THREE.Group();
  public readonly panelMat: THREE.ShaderMaterial;

  private readonly bossReaction: Puppet2D;
  private readonly engineerReaction: Puppet2D;
  private readonly flyingRivets: THREE.InstancedMesh;
  private readonly sparks: THREE.InstancedMesh;
  private readonly rivetData: BallisticParticle[] = [];
  private readonly sparkData: BallisticParticle[] = [];

  constructor() {
    this.panelMat = createStressPanelMaterial();
    this.panelMat.uniforms.uCornerPower.value = 14.0; // Sharp 90° square window!
    this.panelMat.uniforms.uSafePalette.value = 0.0;

    // 1. Heavy Riveted Fuselage Test Panel Wall (7.2m x 4.4m)
    const panelMesh = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.4, 1, 1), this.panelMat);
    panelMesh.position.set(0, 2.25, 0);
    panelMesh.receiveShadow = true;
    this.group.add(panelMesh);

    // Structural backing ribs & dark industrial test chamber floor
    const darkSteel = new THREE.MeshStandardMaterial({ color: '#1E2333', metalness: 0.65, roughness: 0.5 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 16), darkSteel);
    floor.rotation.x = -Math.PI * 0.5;
    floor.receiveShadow = true;
    this.group.add(floor);

    // 3D Raised Aluminum Rivet Domes bordering the square window & panel seams!
    const rivetGeo = new THREE.SphereGeometry(0.032, 12, 8);
    const rivetMat = new THREE.MeshStandardMaterial({ color: '#E6ECF5', metalness: 0.85, roughness: 0.22 });
    const staticRivets = new THREE.InstancedMesh(rivetGeo, rivetMat, 96);
    const dummy = new THREE.Object3D();
    let rIdx = 0;

    // Window cutout in world coords: panel is 7.2 x 4.4, uWinHalfSize=(0.24, 0.22) in [-0.9..0.9, -0.55..0.55]
    // So half-width in world = (0.24 / 0.9) * 3.6 = 0.96m, half-height = (0.22 / 0.55) * 2.2 = 0.88m!
    const rw = 1.08;
    const rh = 1.00;
    for (let k = -6; k <= 6; k++) {
      if (rIdx < 96) {
        dummy.position.set((k / 6) * rw, 2.25 + rh, 0.015);
        dummy.scale.set(1, 1, 0.55);
        dummy.updateMatrix();
        staticRivets.setMatrixAt(rIdx++, dummy.matrix);
      }
      if (rIdx < 96) {
        dummy.position.set((k / 6) * rw, 2.25 - rh, 0.015);
        dummy.scale.set(1, 1, 0.55);
        dummy.updateMatrix();
        staticRivets.setMatrixAt(rIdx++, dummy.matrix);
      }
    }
    for (let k = -5; k <= 5; k++) {
      if (rIdx < 96) {
        dummy.position.set(-rw, 2.25 + (k / 6) * rh, 0.015);
        dummy.scale.set(1, 1, 0.55);
        dummy.updateMatrix();
        staticRivets.setMatrixAt(rIdx++, dummy.matrix);
      }
      if (rIdx < 96) {
        dummy.position.set(rw, 2.25 + (k / 6) * rh, 0.015);
        dummy.scale.set(1, 1, 0.55);
        dummy.updateMatrix();
        staticRivets.setMatrixAt(rIdx++, dummy.matrix);
      }
    }
    staticRivets.count = rIdx;
    this.group.add(staticRivets);

    // 2. Ballistic Popping 3D Rivets + HDR Fracture Sparks erupting from Top-Right 90° Corner (0.96, 3.13, 0.04)!
    const cornerWorld = new THREE.Vector3(0.96, 2.25 + 0.88, 0.04);
    const rng = mulberry32(178800);

    this.flyingRivets = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.038, 0.025, 0.05, 12),
      rivetMat,
      18
    );
    for (let i = 0; i < 18; i++) {
      this.rivetData.push({
        origin: cornerWorld.clone().add(new THREE.Vector3(rng() * 0.45, rng() * 0.35, 0)),
        vel: new THREE.Vector3(1.2 + rng() * 3.2, 1.4 + rng() * 2.8, 2.2 + rng() * 3.4),
        rotSpeed: 8 + rng() * 14,
        scale: 0.9 + rng() * 0.5,
      });
    }
    this.group.add(this.flyingRivets);

    this.sparks = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.036, 0),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 1.85, 0.55) }),
      42
    );
    for (let i = 0; i < 42; i++) {
      const ang = rng() * Math.PI * 1.4 - 0.3;
      const spd = 2.5 + rng() * 5.8;
      this.sparkData.push({
        origin: cornerWorld.clone().add(new THREE.Vector3(rng() * 0.3, rng() * 0.25, 0.02)),
        vel: new THREE.Vector3(Math.cos(ang) * spd, Math.sin(ang) * spd + 1.2, 1.8 + rng() * 4.2),
        rotSpeed: 12 + rng() * 20,
        scale: 0.6 + rng() * 1.1,
      });
    }
    this.group.add(this.sparks);

    // 3. Foreground 2D Characters Reacting to the Stress & Crack!
    this.bossReaction = new Puppet2D('boss', 2.05);
    this.bossReaction.group.position.set(-2.15, 0.0, 1.35);
    this.group.add(this.bossReaction.group);

    this.engineerReaction = new Puppet2D('engineer', 1.98);
    this.engineerReaction.group.position.set(2.25, 0.0, 1.32);
    this.group.add(this.engineerReaction.group);
  }

  public update(t: number): void {
    this.panelMat.uniforms.uTime.value = t;

    // Heatmap & Load ramp up smoothly from 12.2s -> 17.0s ("At 35,000 feet, every sharp 90-degree corner concentrated nearly four times the stress")
    const heatMix = smootherstep(12.25, 13.85, t);
    const loadLvl = smootherstep(12.40, 16.95, t);
    const streamMix = smootherstep(13.30, 14.80, t);
    // Crack snaps violently at t = 17.88s ("snapping aluminum like glass.")!
    const crackProg = clamp((t - 17.88) / 0.38, 0, 1);

    this.panelMat.uniforms.uHeatmapMix.value = heatMix;
    this.panelMat.uniforms.uLoadLevel.value = loadLvl;
    this.panelMat.uniforms.uStreamlines.value = streamMix;
    this.panelMat.uniforms.uCrackProgress.value = crackProg;

    // Update ballistic flying rivets & HDR sparks for dt >= 0 after 17.88s!
    const dtSnap = t - 17.88;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.rivetData.length; i++) {
      if (dtSnap <= 0) {
        dummy.scale.setScalar(0.0001);
        dummy.position.set(0, -10, 0);
      } else {
        const r = this.rivetData[i];
        dummy.position.set(
          r.origin.x + r.vel.x * dtSnap,
          r.origin.y + r.vel.y * dtSnap - 4.9 * dtSnap * dtSnap,
          r.origin.z + r.vel.z * dtSnap
        );
        dummy.rotation.set(dtSnap * r.rotSpeed, dtSnap * r.rotSpeed * 0.7, 0);
        dummy.scale.setScalar(r.scale);
      }
      dummy.updateMatrix();
      this.flyingRivets.setMatrixAt(i, dummy.matrix);
    }
    this.flyingRivets.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < this.sparkData.length; i++) {
      if (dtSnap <= 0 || dtSnap > 1.35) {
        dummy.scale.setScalar(0.0001);
        dummy.position.set(0, -10, 0);
      } else {
        const s = this.sparkData[i];
        dummy.position.set(
          s.origin.x + s.vel.x * dtSnap,
          s.origin.y + s.vel.y * dtSnap - 6.2 * dtSnap * dtSnap,
          s.origin.z + s.vel.z * dtSnap
        );
        const fade = Math.max(0.001, 1.0 - dtSnap / 1.15);
        dummy.scale.setScalar(s.scale * fade);
      }
      dummy.updateMatrix();
      this.sparks.setMatrixAt(i, dummy.matrix);
    }
    this.sparks.instanceMatrix.needsUpdate = true;

    // Foreground reaction puppets (revealed as camera pulls back right on the crack!)
    const isSnapped = t >= 17.88;
    const hatFly = clamp((t - 18.02) / 1.35, 0, 1);

    this.bossReaction.update({
      expression: isSnapped ? 'boss_panic_violet' : 'smug_proud',
      time: t,
      stateChangedAt: isSnapped ? 17.88 : 12.0,
      armAngleDeg: isSnapped ? -68 : -20,
      leftArmAngleDeg: isSnapped ? 68 : 15,
      headTiltDeg: isSnapped ? -11 : 4,
      hatDetached: t >= 18.02,
      hatFlyProgress: hatFly,
      facing: 1,
    });

    this.engineerReaction.update({
      expression: t >= 15.6 ? 'ring_shock' : 'skeptical_squint',
      time: t,
      stateChangedAt: t >= 15.6 ? 15.6 : 12.0,
      armAngleDeg: isSnapped ? -48 : -18,
      leftArmAngleDeg: isSnapped ? 42 : 14,
      headTiltDeg: isSnapped ? 8 : -4,
      facing: -1,
    });
  }
}
