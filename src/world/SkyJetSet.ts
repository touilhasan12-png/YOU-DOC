import * as THREE from 'three';
import { Puppet2D } from '../characters/Puppet2D';
import { clamp, mulberry32, smoothstep } from '../engine/math';
import { createStylizedCloudMaterial } from '../shaders/skyCloudShaders';

export class SkyJetSet {
  public readonly group = new THREE.Group();
  public readonly jetGroup = new THREE.Group();
  public readonly cloudMat: THREE.ShaderMaterial;

  private readonly passenger: Puppet2D;
  private readonly cloudInstanced: THREE.InstancedMesh;
  private readonly cloudBaseMatrices: { pos: THREE.Vector3; scale: THREE.Vector3; speed: number }[] = [];
  private readonly cornerGlint: THREE.Mesh;
  private readonly engineGlows: THREE.Mesh[] = [];

  constructor() {
    this.cloudMat = createStylizedCloudMaterial();

    // 1. Build 1952 Silver-and-Cobalt Jetliner
    const aluminumMat = new THREE.MeshStandardMaterial({
      color: '#D8E0EA',
      metalness: 0.82,
      roughness: 0.24,
    });
    const cobaltStripeMat = new THREE.MeshStandardMaterial({
      color: '#193B8A',
      metalness: 0.35,
      roughness: 0.40,
    });
    const darkGlassMat = new THREE.MeshStandardMaterial({
      color: '#101B30',
      metalness: 0.9,
      roughness: 0.12,
    });

    // Fuselage main barrel along X-axis (-9 to +9), radius = 1.48
    const fuseGeo = new THREE.CylinderGeometry(1.48, 1.48, 13.5, 40, 1, false);
    fuseGeo.rotateZ(Math.PI * 0.5);
    const fuseMesh = new THREE.Mesh(fuseGeo, aluminumMat);
    fuseMesh.castShadow = true;
    fuseMesh.receiveShadow = true;
    this.jetGroup.add(fuseMesh);

    // Tapered streamlined nose cone (+X is forward!)
    const noseGeo = new THREE.SphereGeometry(1.48, 36, 24);
    noseGeo.scale(2.35, 0.96, 1.0);
    const noseMesh = new THREE.Mesh(noseGeo, aluminumMat);
    noseMesh.position.set(6.75, -0.05, 0);
    this.jetGroup.add(noseMesh);

    // Cockpit glazed visor
    const visorGeo = new THREE.BoxGeometry(1.55, 0.52, 1.65);
    const visorMesh = new THREE.Mesh(visorGeo, darkGlassMat);
    visorMesh.position.set(7.45, 0.58, 0);
    visorMesh.rotation.z = -0.22;
    this.jetGroup.add(visorMesh);

    // Tail cone (-X) + Swept Vertical Stabilizer + Horizontal Tailplane
    const tailConeGeo = new THREE.CylinderGeometry(0.32, 1.48, 5.2, 32);
    tailConeGeo.rotateZ(-Math.PI * 0.5);
    const tailCone = new THREE.Mesh(tailConeGeo, aluminumMat);
    tailCone.position.set(-9.3, 0.12, 0);
    this.jetGroup.add(tailCone);

    const finShape = new THREE.Shape();
    finShape.moveTo(-7.2, 1.1);
    finShape.lineTo(-11.4, 1.25);
    finShape.lineTo(-12.3, 4.55);
    finShape.lineTo(-10.4, 4.55);
    finShape.closePath();
    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04 });
    finGeo.translate(0, 0, -0.09);
    const finMesh = new THREE.Mesh(finGeo, cobaltStripeMat);
    this.jetGroup.add(finMesh);

    // Gold speedbird fin stripe
    const finGold = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.24, 0.28), new THREE.MeshStandardMaterial({ color: '#F3B63F', metalness: 0.6, roughness: 0.3 }));
    finGold.position.set(-10.9, 3.3, 0);
    this.jetGroup.add(finGold);

    // Swept Wings (mounted cleanly at belly y = -0.95 with slight downward perspective clearance so camera at +Z/+Y sees entire fuselage unobstructed!)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(1.8, 0);
    wingShape.lineTo(-2.4, 0);
    wingShape.lineTo(-5.2, 8.8);
    wingShape.lineTo(-3.6, 8.8);
    wingShape.closePath();
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.18, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04 });

    const rightWing = new THREE.Mesh(wingGeo, aluminumMat);
    rightWing.rotation.x = Math.PI * 0.5 + 0.06;
    rightWing.position.set(-0.6, -0.95, 1.05);
    rightWing.castShadow = true;
    this.jetGroup.add(rightWing);

    const leftWing = new THREE.Mesh(wingGeo, aluminumMat);
    leftWing.rotation.x = -Math.PI * 0.5 - 0.06;
    leftWing.position.set(-0.6, -0.95, -1.05);
    this.jetGroup.add(leftWing);

    // Four buried Comet turbojet nacelles + HDR amber exhaust glow at wing roots
    for (const zOff of [2.05, 3.05, -2.05, -3.05]) {
      const nac = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.32, 3.4, 24).rotateZ(Math.PI * 0.5),
        aluminumMat
      );
      nac.position.set(-0.6, -0.98, zOff);
      this.jetGroup.add(nac);

      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 16),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.25, 0.38) })
      );
      glow.position.set(-2.35, -0.98, zOff);
      this.jetGroup.add(glow);
      this.engineGlows.push(glow);
    }

    // Livery cheatline banner texture along starboard side (+Z = camera side!)
    const liveryCanvas = document.createElement('canvas');
    liveryCanvas.width = 1024;
    liveryCanvas.height = 160;
    const lctx = liveryCanvas.getContext('2d')!;
    lctx.fillStyle = '#183A8A';
    lctx.fillRect(0, 42, 1024, 92);
    lctx.fillStyle = '#F3B63F';
    lctx.fillRect(0, 30, 1024, 14);
    lctx.fillRect(0, 132, 1024, 10);
    lctx.fillStyle = '#FAF6EE';
    lctx.font = '800 34px sans-serif';
    lctx.fillText('SKYLINE JETWAYS  ·  COMET LUXURY CRUISER  ·  1952', 74, 24);
    const livTex = new THREE.CanvasTexture(liveryCanvas);
    livTex.colorSpace = THREE.SRGBColorSpace;
    const livPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(11.6, 0.85),
      new THREE.MeshStandardMaterial({ map: livTex, roughness: 0.4, metalness: 0.25 })
    );
    livPlane.position.set(0.3, 0.82, 1.49);
    this.jetGroup.add(livPlane);

    // FOUR PROMINENT SHARP 90° SQUARE WINDOWS along starboard side (z = +1.49)!
    const frameMat = new THREE.MeshStandardMaterial({ color: '#FAF0DC', metalness: 0.75, roughness: 0.22 });
    const cabinBackMat = new THREE.MeshBasicMaterial({ color: '#FFCF86' });
    const winXs = [-2.4, -0.5, 1.4, 3.3];

    for (let i = 0; i < winXs.length; i++) {
      const wx = winXs[i];
      const wy = 0.16;
      const wz = 1.495;
      const wGroup = new THREE.Group();
      wGroup.position.set(wx, wy, wz);

      // Sharp 90-degree square frame bars!
      const barT = 0.065;
      const wSize = 0.72;
      const topB = new THREE.Mesh(new THREE.BoxGeometry(wSize + barT * 2, barT, 0.08), frameMat);
      topB.position.y = wSize * 0.5 + barT * 0.5;
      const botB = topB.clone();
      botB.position.y = -wSize * 0.5 - barT * 0.5;
      const leftB = new THREE.Mesh(new THREE.BoxGeometry(barT, wSize, 0.08), frameMat);
      leftB.position.x = -wSize * 0.5 - barT * 0.5;
      const rightB = leftB.clone();
      rightB.position.x = wSize * 0.5 + barT * 0.5;
      wGroup.add(topB, botB, leftB, rightB);

      // Warm lit square cabin backdrop
      const warmGlow = new THREE.Mesh(new THREE.PlaneGeometry(wSize, wSize), cabinBackMat);
      warmGlow.position.z = -0.02;
      wGroup.add(warmGlow);

      this.jetGroup.add(wGroup);
    }

    // Place cheerful 2D Passenger puppet framed inside Hero Square Window #3 (x = 1.4)!
    this.passenger = new Puppet2D('passenger', 0.86);
    this.passenger.group.position.set(1.38, -0.44, 1.515);
    this.jetGroup.add(this.passenger.group);

    // Subtle ominous HDR stress-glint diamond right on the 90° top-right corner of Hero Window #3!
    const glintGeo = new THREE.OctahedronGeometry(0.075, 0);
    this.cornerGlint = new THREE.Mesh(
      glintGeo,
      new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.4, 0.55) })
    );
    this.cornerGlint.position.set(1.4 + 0.37, 0.16 + 0.37, 1.56);
    this.jetGroup.add(this.cornerGlint);

    this.group.add(this.jetGroup);

    // 2. Sculpted Multi-Layer Cloud Ocean (200 deterministic puffs!)
    const puffGeo = new THREE.IcosahedronGeometry(1.0, 2);
    this.cloudInstanced = new THREE.InstancedMesh(puffGeo, this.cloudMat, 210);
    const rng = mulberry32(195201);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < 210; i++) {
      let px: number, py: number, pz: number, sx: number, sy: number, sz: number, spd: number;
      if (i < 175) {
        // Vast lower golden cloud ocean cleanly below the aircraft (y: -4.8 .. -11.5)
        px = (rng() - 0.45) * 150;
        py = -4.8 - rng() * 6.8;
        pz = -45 + rng() * 72;
        const base = 3.4 + rng() * 6.4;
        sx = base * (1.35 + rng() * 0.7);
        sy = base * (0.45 + rng() * 0.25);
        sz = base * (1.0 + rng() * 0.6);
        spd = 6.0 + rng() * 3.5;
      } else {
        // Distant background cumulus towers behind the jet (z < -8.5 — NEVER blocks camera!)
        px = -55 + rng() * 110;
        py = -3.2 + rng() * 7.5;
        pz = -36 + rng() * 24;
        const base = 3.0 + rng() * 4.8;
        sx = base * 1.5;
        sy = base * 0.85;
        sz = base * 1.1;
        spd = 4.0 + rng() * 2.5;
      }
      this.cloudBaseMatrices.push({
        pos: new THREE.Vector3(px, py, pz),
        scale: new THREE.Vector3(sx, sy, sz),
        speed: spd,
      });
      dummy.position.set(px, py, pz);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      this.cloudInstanced.setMatrixAt(i, dummy.matrix);
    }
    this.group.add(this.cloudInstanced);
  }

  public update(t: number): void {
    // Subtle aerodynamic float of the 1952 jetliner
    this.jetGroup.position.y = Math.sin(t * 1.65) * 0.11;
    this.jetGroup.rotation.x = Math.sin(t * 1.1) * 0.018;
    this.jetGroup.rotation.z = Math.cos(t * 0.9) * 0.015;

    // Cheerful 2D Passenger sipping & waving teacup inside square window!
    this.passenger.update({
      expression: t > 3.9 ? 'wink_brag' : 'happy_sip',
      time: t,
      stateChangedAt: t > 3.9 ? 3.9 : 0.0,
      armAngleDeg: -28 + Math.sin(t * 4.2) * 14,
      leftArmAngleDeg: 14,
      headTiltDeg: Math.sin(t * 2.5) * 4,
      facing: 1,
    });

    // Ominous stress glint pulse on the sharp 90° window corner as narrator says "square windows"!
    const glintPulse = smoothstep(3.8, 4.4, t) * (0.65 + 0.35 * Math.sin(t * 18.0));
    const gs = 0.01 + glintPulse * 1.45;
    this.cornerGlint.scale.set(gs, gs * 1.6, gs);
    this.cornerGlint.rotation.z = t * 3.5;

    // Engine exhaust shimmer
    const exScale = 0.92 + 0.08 * Math.sin(t * 42.0);
    for (const g of this.engineGlows) {
      g.scale.setScalar(exScale);
    }

    // Deterministic cloud drift (-X relative to forward-flying jet!)
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.cloudBaseMatrices.length; i++) {
      const c = this.cloudBaseMatrices[i];
      let x = c.pos.x - t * c.speed;
      x = ((((x + 70) % 150) + 150) % 150) - 70;
      dummy.position.set(x, c.pos.y, c.pos.z);
      dummy.scale.copy(c.scale);
      dummy.updateMatrix();
      this.cloudInstanced.setMatrixAt(i, dummy.matrix);
    }
    this.cloudInstanced.instanceMatrix.needsUpdate = true;
  }
}
