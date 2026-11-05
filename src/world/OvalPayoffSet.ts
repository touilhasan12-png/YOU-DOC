import * as THREE from 'three';
import { Puppet2D } from '../characters/Puppet2D';
import { mulberry32, smootherstep } from '../engine/math';
import { createStylizedCloudMaterial } from '../shaders/skyCloudShaders';
import { createStressPanelMaterial } from '../shaders/stressPanelShader';

export class OvalPayoffSet {
  public readonly group = new THREE.Group();
  public readonly ovalPanelMat: THREE.ShaderMaterial;
  public readonly sunsetCloudMat: THREE.ShaderMaterial;

  private readonly engineer: Puppet2D;
  private readonly boss: Puppet2D;
  private readonly clouds: THREE.InstancedMesh;
  private readonly cloudSeeds: { pos: THREE.Vector3; scale: THREE.Vector3; speed: number }[] = [];

  constructor() {
    this.ovalPanelMat = createStressPanelMaterial();
    this.ovalPanelMat.uniforms.uCornerPower.value = 2.0; // Smooth Rounded Oval Window!
    this.ovalPanelMat.uniforms.uSafePalette.value = 1.0; // Laminar cyan-emerald safe palette!
    this.ovalPanelMat.uniforms.uWinHalfSize.value.set(0.22, 0.27); // Classic vertical aviation oval!

    // 1. Sleek Modernized Fuselage Wall with Smooth Rounded Oval Window
    const fuselageWall = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 4.5), this.ovalPanelMat);
    fuselageWall.position.set(0, 2.25, 0);
    fuselageWall.receiveShadow = true;
    this.group.add(fuselageWall);

    // Cobalt & Gold Sunset Airline Cheatline Trim above & below panel
    const cobaltMat = new THREE.MeshStandardMaterial({ color: '#183A8A', metalness: 0.45, roughness: 0.35 });
    const goldMat = new THREE.MeshStandardMaterial({ color: '#F5B841', metalness: 0.72, roughness: 0.25 });

    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.36, 0.08), cobaltMat);
    topTrim.position.set(0, 4.18, 0.02);
    const goldStripe = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.10, 0.10), goldMat);
    goldStripe.position.set(0, 3.96, 0.02);
    this.group.add(topTrim, goldStripe);

    // Observation Wing/Promenade Deck Platform so characters cast sunset shadows!
    const wingDeck = new THREE.Mesh(
      new THREE.BoxGeometry(12.5, 0.28, 5.2),
      new THREE.MeshStandardMaterial({ color: '#C8D2E0', metalness: 0.75, roughness: 0.28 })
    );
    wingDeck.position.set(0, -0.14, 1.85);
    wingDeck.receiveShadow = true;
    this.group.add(wingDeck);

    // 2. Golden-Hour Sunset Cloud Ocean stretching to the horizon behind & below!
    this.sunsetCloudMat = createStylizedCloudMaterial();
    this.sunsetCloudMat.uniforms.uSunsetMix.value = 0.92;

    const puffGeo = new THREE.IcosahedronGeometry(1.0, 2);
    this.clouds = new THREE.InstancedMesh(puffGeo, this.sunsetCloudMat, 140);
    const rng = mulberry32(202611);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 140; i++) {
      const px = (rng() - 0.5) * 120;
      const py = -5.2 - rng() * 5.5;
      const pz = -42 + rng() * 52;
      const b = 3.5 + rng() * 6.0;
      const scale = new THREE.Vector3(b * 1.5, b * 0.5, b * 1.1);
      this.cloudSeeds.push({ pos: new THREE.Vector3(px, py, pz), scale, speed: 4.2 + rng() * 2.5 });
      dummy.position.set(px, py, pz);
      dummy.scale.copy(scale);
      dummy.updateMatrix();
      this.clouds.setMatrixAt(i, dummy.matrix);
    }
    this.group.add(this.clouds);

    // 3. Triumphant Chief Engineer & Humbled Relieved Airline Boss flanking the Smooth Oval Window!
    this.engineer = new Puppet2D('engineer', 2.12);
    this.engineer.group.position.set(1.82, 0.0, 0.95);
    this.group.add(this.engineer.group);

    this.boss = new Puppet2D('boss', 2.18);
    this.boss.group.position.set(-1.92, 0.0, 0.98);
    this.group.add(this.boss.group);
  }

  public update(t: number): void {
    this.ovalPanelMat.uniforms.uTime.value = t;

    // 20.0 - 23.2s: Show smooth laminar streamlines around the rounded oval, then softly blend into gleaming sunset aluminum!
    const fadeToMetal = smootherstep(23.1, 24.8, t);
    this.ovalPanelMat.uniforms.uHeatmapMix.value = 0.85 * (1.0 - fadeToMetal * 0.68);
    this.ovalPanelMat.uniforms.uLoadLevel.value = 0.85;
    this.ovalPanelMat.uniforms.uStreamlines.value = 0.95 * (1.0 - fadeToMetal * 0.55);
    this.ovalPanelMat.uniforms.uCrackProgress.value = 0.0;

    // Engineer smiles proudly -> winks at 22.8s ("flows harmlessly around.")!
    const winkNow = t >= 22.85;
    this.engineer.update({
      expression: winkNow ? 'triumphant_wink' : 'confident_smile',
      time: t,
      stateChangedAt: winkNow ? 22.85 : 20.0,
      armAngleDeg: winkNow ? -38 : -16,
      leftArmAngleDeg: 14,
      headTiltDeg: winkNow ? -5 : 2,
      facing: -1,
    });

    // Boss clutches recovered hat in sheepish relief!
    this.boss.update({
      expression: 'humbled_relief',
      time: t,
      stateChangedAt: 20.1,
      armAngleDeg: -14,
      leftArmAngleDeg: 22,
      headTiltDeg: 6,
      hatDetached: false,
      facing: 1,
    });

    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.cloudSeeds.length; i++) {
      const c = this.cloudSeeds[i];
      const x = ((((c.pos.x - (t - 19.5) * c.speed + 60) % 120) + 120) % 120) - 60;
      dummy.position.set(x, c.pos.y, c.pos.z);
      dummy.scale.copy(c.scale);
      dummy.updateMatrix();
      this.clouds.setMatrixAt(i, dummy.matrix);
    }
    this.clouds.instanceMatrix.needsUpdate = true;
  }
}
