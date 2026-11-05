import * as THREE from 'three';
import { Puppet2D } from '../characters/Puppet2D';
import { clamp, dampedSpring, lerp, mulberry32, smoothstep } from '../engine/math';
import { createGodRayMaterial } from '../shaders/skyCloudShaders';

export class HangarTankSet {
  public readonly group = new THREE.Group();

  private readonly boss: Puppet2D;
  private readonly engineer: Puppet2D;
  private readonly leverPivot = new THREE.Group();
  private readonly gaugeNeedle = new THREE.Group();
  private readonly submergedCabin = new THREE.Group();
  private readonly waterMesh: THREE.Mesh;
  private readonly bubbles: THREE.InstancedMesh;
  private readonly bubbleSeeds: { x: number; z: number; speed: number; phase: number; r: number }[] = [];

  constructor() {
    // 1. Industrial Hangar Concrete/Checker Floor (casts & receives real 3D shadows!)
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fctx = floorCanvas.getContext('2d')!;
    fctx.fillStyle = '#262B3A';
    fctx.fillRect(0, 0, 512, 512);
    fctx.fillStyle = '#2E3446';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if ((x + y) % 2 === 0) fctx.fillRect(x * 64, y * 64, 64, 64);
      }
    }
    // Yellow safety stripe across foreground catwalk edge
    fctx.fillStyle = '#E5AD36';
    fctx.fillRect(0, 440, 512, 18);
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.colorSpace = THREE.SRGBColorSpace;
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(6, 4);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(46, 32),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.72, metalness: 0.12 })
    );
    floor.rotation.x = -Math.PI * 0.5;
    floor.receiveShadow = true;
    this.group.add(floor);

    // 2. Back Hangar Wall + Steel Columns + Arched Clerestory Windows + Volumetric God-Rays!
    const wallMat = new THREE.MeshStandardMaterial({ color: '#2B3550', roughness: 0.78, metalness: 0.15 });
    const steelMat = new THREE.MeshStandardMaterial({ color: '#586682', roughness: 0.38, metalness: 0.62 });
    const brassMat = new THREE.MeshStandardMaterial({ color: '#E8B64C', roughness: 0.28, metalness: 0.78 });

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(46, 18), wallMat);
    backWall.position.set(0, 9, -8.5);
    backWall.receiveShadow = true;
    this.group.add(backWall);

    const rayMat = createGodRayMaterial();
    for (let i = -3; i <= 3; i++) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.55, 16, 0.75), steelMat);
      col.position.set(i * 5.2, 8, -8.1);
      col.castShadow = true;
      this.group.add(col);

      // Overhead roof truss beam
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 18), steelMat);
      beam.position.set(i * 5.2, 13.5, -1.0);
      this.group.add(beam);

      if (Math.abs(i) <= 2) {
        // Glowing arched clerestory hangar window
        const winGlow = new THREE.Mesh(
          new THREE.PlaneGeometry(2.8, 3.6),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(1.45, 1.05, 0.62) })
        );
        winGlow.position.set(i * 5.2 + 2.6, 9.6, -8.42);
        this.group.add(winGlow);

        // Volumetric sunbeam shaft angled down into hangar
        const ray = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 13.5), rayMat);
        ray.position.set(i * 5.2 + 1.4, 5.8, -4.4);
        ray.rotation.z = 0.24;
        ray.rotation.x = 0.18;
        this.group.add(ray);
      }
    }

    // 3. Vintage Airline Boardroom Easel Banner on Left ("BIGGER SQUARE WINDOWS = LUXURY!")
    const easelGroup = new THREE.Group();
    easelGroup.position.set(-4.35, 0, -1.4);
    easelGroup.rotation.y = 0.26;

    const boardCanvas = document.createElement('canvas');
    boardCanvas.width = 768;
    boardCanvas.height = 512;
    const bctx = boardCanvas.getContext('2d')!;
    bctx.fillStyle = '#F6ECDC';
    bctx.fillRect(0, 0, 768, 512);
    bctx.strokeStyle = '#183A8A';
    bctx.lineWidth = 18;
    bctx.strokeRect(18, 18, 732, 476);

    bctx.fillStyle = '#B8293D';
    bctx.fillRect(38, 38, 692, 86);
    bctx.fillStyle = '#FAF6EE';
    bctx.font = '900 42px sans-serif';
    bctx.textAlign = 'center';
    bctx.fillText('1952 CABIN DESIGN BRIEF', 384, 96);

    // Big square window illustration on the easel!
    bctx.fillStyle = '#5B95E5';
    bctx.fillRect(105, 165, 220, 220);
    bctx.strokeStyle = '#14151F';
    bctx.lineWidth = 14;
    bctx.strokeRect(105, 165, 220, 220);

    bctx.fillStyle = '#14151F';
    bctx.textAlign = 'left';
    bctx.font = '900 46px sans-serif';
    bctx.fillText('SQUARE VIEW', 362, 238);
    bctx.fillStyle = '#D97B1E';
    bctx.font = '900 50px sans-serif';
    bctx.fillText('= LUXURY!', 362, 304);
    bctx.fillStyle = '#2F364A';
    bctx.font = '700 23px sans-serif';
    bctx.fillText('"Passengers love big corners!"', 362, 366);

    const boardTex = new THREE.CanvasTexture(boardCanvas);
    boardTex.colorSpace = THREE.SRGBColorSpace;
    const boardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(3.1, 2.05, 0.12),
      new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.65 })
    );
    boardMesh.position.y = 2.35;
    boardMesh.castShadow = true;
    easelGroup.add(boardMesh);

    const woodMat = new THREE.MeshStandardMaterial({ color: '#693E22', roughness: 0.75 });
    for (const lx of [-1.1, 1.1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.6, 12), woodMat);
      leg.position.set(lx, 1.75, -0.15);
      leg.rotation.z = lx * 0.08;
      leg.castShadow = true;
      easelGroup.add(leg);
    }
    this.group.add(easelGroup);

    // 4. Giant RAE Farnborough Glass-Walled Steel Water-Pressure Tank (Center-Right!)
    const tankGroup = new THREE.Group();
    tankGroup.position.set(2.35, 0, -2.35);

    // Steel tank base + vertical corner girders
    const tankBase = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.55, 3.6), steelMat);
    tankBase.position.y = 0.275;
    tankBase.castShadow = true;
    tankBase.receiveShadow = true;
    tankGroup.add(tankBase);

    const topRim = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.28, 3.6), steelMat);
    topRim.position.y = 3.95;
    tankGroup.add(topRim);

    for (const gx of [-3.65, -1.2, 1.2, 3.65]) {
      for (const gz of [-1.7, 1.7]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.5, 0.24), steelMat);
        post.position.set(gx, 2.2, gz);
        post.castShadow = true;
        tankGroup.add(post);
      }
    }

    // Tank Banner Plaque ("RAE FARNBOROUGH — HYDRO-PRESSURE TANK")
    const plaqueCanvas = document.createElement('canvas');
    plaqueCanvas.width = 1024;
    plaqueCanvas.height = 128;
    const pctx = plaqueCanvas.getContext('2d')!;
    pctx.fillStyle = '#151A28';
    pctx.fillRect(0, 0, 1024, 128);
    pctx.strokeStyle = '#DFAA3E';
    pctx.lineWidth = 10;
    pctx.strokeRect(8, 8, 1008, 112);
    pctx.fillStyle = '#F6ECDC';
    pctx.font = '800 35px sans-serif';
    pctx.textAlign = 'center';
    pctx.fillText('FARNBOROUGH PRESSURE TANK  ·  35,000 FT TEST', 512, 76);
    const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
    plaqueTex.colorSpace = THREE.SRGBColorSpace;
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 0.68),
      new THREE.MeshBasicMaterial({ map: plaqueTex })
    );
    plaque.position.set(0, 4.35, 1.82);
    tankGroup.add(plaque);

    // Submerged Silver Fuselage Test Barrel inside the tank!
    const testFuseMat = new THREE.MeshStandardMaterial({ color: '#CFD9E6', metalness: 0.78, roughness: 0.26 });
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.05, 5.8, 32).rotateZ(Math.PI * 0.5),
      testFuseMat
    );
    this.submergedCabin.add(barrel);
    for (const wx of [-1.6, 0.0, 1.6]) {
      const sqWin = new THREE.Mesh(
        new THREE.BoxGeometry(0.58, 0.58, 0.12),
        new THREE.MeshBasicMaterial({ color: '#FFE09E' })
      );
      sqWin.position.set(wx, 0.12, 1.02);
      this.submergedCabin.add(sqWin);
    }
    this.submergedCabin.position.set(0, 2.55, 0);
    tankGroup.add(this.submergedCabin);

    // Translucent turquoise-cyan tank water volume!
    this.waterMesh = new THREE.Mesh(
      new THREE.BoxGeometry(7.25, 3.15, 3.25),
      new THREE.MeshPhysicalMaterial({
        color: '#1AA6B8',
        transparent: true,
        opacity: 0.42,
        roughness: 0.15,
        metalness: 0.05,
        transmission: 0.35,
      })
    );
    this.waterMesh.position.y = 2.12;
    tankGroup.add(this.waterMesh);

    // 65 Deterministic Rising Underwater Bubbles!
    const bubGeo = new THREE.SphereGeometry(1.0, 12, 12);
    const bubMat = new THREE.MeshBasicMaterial({ color: '#A8F5FF', transparent: true, opacity: 0.68 });
    this.bubbles = new THREE.InstancedMesh(bubGeo, bubMat, 65);
    const rng = mulberry32(88421);
    for (let i = 0; i < 65; i++) {
      this.bubbleSeeds.push({
        x: (rng() - 0.5) * 6.2,
        z: (rng() - 0.5) * 2.4,
        speed: 0.8 + rng() * 1.4,
        phase: rng(),
        r: 0.035 + rng() * 0.055,
      });
    }
    tankGroup.add(this.bubbles);

    // Giant Illuminated Brass Altitude Pressure Gauge mounted cleanly on upper-right tank frame!
    const gaugeGroup = new THREE.Group();
    gaugeGroup.position.set(2.85, 2.85, 1.92);
    gaugeGroup.scale.setScalar(0.88);
    const brassRing = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.18, 36).rotateX(Math.PI * 0.5), brassMat);
    gaugeGroup.add(brassRing);

    const dialCanvas = document.createElement('canvas');
    dialCanvas.width = 512;
    dialCanvas.height = 512;
    const dctx = dialCanvas.getContext('2d')!;
    dctx.fillStyle = '#FAF5E8';
    dctx.beginPath();
    dctx.arc(256, 256, 240, 0, Math.PI * 2);
    dctx.fill();
    // Danger red arc on right side of dial
    dctx.strokeStyle = '#E63946';
    dctx.lineWidth = 34;
    dctx.beginPath();
    dctx.arc(256, 256, 198, -Math.PI * 0.35, Math.PI * 0.22);
    dctx.stroke();
    // Tick marks
    dctx.strokeStyle = '#14151F';
    dctx.lineWidth = 8;
    for (let k = 0; k <= 10; k++) {
      const a = Math.PI * 0.78 + (k / 10) * Math.PI * 1.44;
      dctx.beginPath();
      dctx.moveTo(256 + Math.cos(a) * 172, 256 + Math.sin(a) * 172);
      dctx.lineTo(256 + Math.cos(a) * 215, 256 + Math.sin(a) * 215);
      dctx.stroke();
    }
    dctx.fillStyle = '#14151F';
    dctx.font = '900 36px sans-serif';
    dctx.textAlign = 'center';
    dctx.fillText('CABIN ΔP', 256, 190);
    dctx.fillStyle = '#D62839';
    dctx.font = '900 34px sans-serif';
    dctx.fillText('35,000 FT', 256, 355);
    const dialTex = new THREE.CanvasTexture(dialCanvas);
    dialTex.colorSpace = THREE.SRGBColorSpace;
    const dialFace = new THREE.Mesh(new THREE.CircleGeometry(0.82, 36), new THREE.MeshBasicMaterial({ map: dialTex }));
    dialFace.position.z = 0.10;
    gaugeGroup.add(dialFace);

    const needleMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.68, 0.04),
      new THREE.MeshBasicMaterial({ color: '#D62839' })
    );
    needleMesh.position.y = 0.26;
    this.gaugeNeedle.position.z = 0.13;
    this.gaugeNeedle.add(needleMesh);
    gaugeGroup.add(this.gaugeNeedle);
    tankGroup.add(gaugeGroup);

    this.group.add(tankGroup);

    // 5. Hydraulic Valve Pedestal + Pull Lever in front of Chief Engineer!
    const pedGroup = new THREE.Group();
    pedGroup.position.set(0.35, 0, 0.85);
    const pedBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.05, 0.45), brassMat);
    pedBox.position.y = 0.525;
    pedBox.castShadow = true;
    pedGroup.add(pedBox);

    this.leverPivot.position.set(0, 1.02, 0);
    const leverRod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.78, 12), steelMat);
    leverRod.position.y = 0.38;
    const leverKnob = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 16),
      new THREE.MeshStandardMaterial({ color: '#E63946', roughness: 0.3 })
    );
    leverKnob.position.y = 0.78;
    this.leverPivot.add(leverRod, leverKnob);
    pedGroup.add(this.leverPivot);
    this.group.add(pedGroup);

    // 6. Our Two Star 2D Puppets Casting Real 3D Shadows onto the Hangar Floor!
    this.boss = new Puppet2D('boss', 2.35);
    this.boss.group.position.set(-2.35, 0, 0.45);
    this.group.add(this.boss.group);

    this.engineer = new Puppet2D('engineer', 2.22);
    this.engineer.group.position.set(-0.35, 0, 0.92);
    this.group.add(this.engineer.group);
  }

  public update(t: number): void {
    // Cane double-tap at 6.45s & 6.75s!
    const tap1 = Math.exp(-Math.pow((t - 6.45) * 14, 2));
    const tap2 = Math.exp(-Math.pow((t - 6.75) * 14, 2));
    const caneAngle = -36 - (tap1 + tap2) * 24;

    this.boss.update({
      expression: t < 8.1 ? 'smug_proud' : 'wink_brag',
      time: t,
      stateChangedAt: t < 8.1 ? 5.7 : 8.1,
      armAngleDeg: caneAngle,
      leftArmAngleDeg: 18,
      headTiltDeg: -5 + (tap1 + tap2) * 6,
      facing: -1, // faces easel on left, then glances toward tank
    });

    // Engineer pulls the lever at t = 8.65s -> fuselage submerges -> pressure needle climbs -> ring_shock at 10.6s!
    const pullProg = dampedSpring(Math.max(0, t - 8.60), 12.0, 5.0);
    this.leverPivot.rotation.z = lerp(0.42, -0.52, clamp(pullProg, 0, 1.15));

    const submergeProg = smoothstep(8.55, 9.75, t);
    this.submergedCabin.position.y = lerp(2.85, 1.92, submergeProg) + Math.sin(t * 3.2) * 0.03;

    // Pressure gauge climbs smoothly into the red zone!
    const pressureProg = smoothstep(8.75, 11.55, t);
    this.gaugeNeedle.rotation.z = lerp(2.15, -1.85, pressureProg) + Math.sin(t * 28.0) * 0.04 * pressureProg;

    let engExp: 'skeptical_squint' | 'focused_pull' | 'ring_shock' = 'skeptical_squint';
    let engChanged = 5.8;
    if (t >= 10.45) {
      engExp = 'ring_shock';
      engChanged = 10.45;
    } else if (t >= 8.35) {
      engExp = 'focused_pull';
      engChanged = 8.35;
    }

    this.engineer.update({
      expression: engExp,
      time: t,
      stateChangedAt: engChanged,
      armAngleDeg: lerp(-12, 34, clamp(pullProg, 0, 1)),
      leftArmAngleDeg: 15,
      headTiltDeg: engExp === 'ring_shock' ? -7 : 3,
      facing: 1,
    });

    // Update rising tank bubbles
    const dummy = new THREE.Object3D();
    const bubIntensity = smoothstep(8.65, 9.2, t);
    for (let i = 0; i < this.bubbleSeeds.length; i++) {
      const b = this.bubbleSeeds[i];
      const u = (b.phase + t * b.speed * 0.35) % 1.0;
      const by = 0.65 + u * 2.95;
      const bx = b.x + Math.sin(t * 4.0 + i) * 0.08;
      dummy.position.set(bx, by, b.z);
      const s = b.r * (0.25 + 0.85 * bubIntensity);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      this.bubbles.setMatrixAt(i, dummy.matrix);
    }
    this.bubbles.instanceMatrix.needsUpdate = true;
  }
}
