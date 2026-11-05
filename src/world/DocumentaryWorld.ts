import * as THREE from 'three';
import { clamp, easeInOutCubic, lerp, smootherstep } from '../engine/math';
import { createSkyDomeMaterial } from '../shaders/skyCloudShaders';
import { HangarTankSet } from './HangarTankSet';
import { OvalPayoffSet } from './OvalPayoffSet';
import { SkyJetSet } from './SkyJetSet';
import { StressMacroSet } from './StressMacroSet';

export interface FrameDirectorState {
  activeBeat: string;
  cloudWipeAlpha: number;
  dissolveAlpha: number;
  warmth: number;
  bloomIntensity: number;
  cornerUvX: number;
  cornerUvY: number;
}

export class DocumentaryWorld {
  public readonly scene = new THREE.Scene();
  public readonly camera: THREE.PerspectiveCamera;

  private readonly skyMat: THREE.ShaderMaterial;
  private readonly sunLight: THREE.DirectionalLight;
  private readonly hemiLight: THREE.HemisphereLight;
  private readonly rimLight: THREE.DirectionalLight;

  private readonly skyJetSet: SkyJetSet;
  private readonly hangarSet: HangarTankSet;
  private readonly stressMacroSet: StressMacroSet;
  private readonly ovalPayoffSet: OvalPayoffSet;

  constructor(aspect = 16 / 9) {
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 260);

    // Atmospheric Sky Dome
    this.skyMat = createSkyDomeMaterial();
    const skyDome = new THREE.Mesh(new THREE.SphereGeometry(180, 36, 24), this.skyMat);
    this.scene.add(skyDome);

    // Cinema 3-Point + Hemisphere Lighting with Real 2048x2048 Soft Shadows!
    this.hemiLight = new THREE.HemisphereLight('#9EC5FF', '#3A2838', 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight('#FFE4B5', 2.45);
    this.sunLight.position.set(-9, 12, 11);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 45.0;
    const d = 10;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.rimLight = new THREE.DirectionalLight('#6CA6FF', 0.95);
    this.rimLight.position.set(10, 5, -8);
    this.scene.add(this.rimLight);

    // Instantiate the 4 seamless production stages
    this.skyJetSet = new SkyJetSet();
    this.hangarSet = new HangarTankSet();
    this.stressMacroSet = new StressMacroSet();
    this.ovalPayoffSet = new OvalPayoffSet();

    this.scene.add(this.skyJetSet.group);
    this.scene.add(this.hangarSet.group);
    this.scene.add(this.stressMacroSet.group);
    this.scene.add(this.ovalPayoffSet.group);
  }

  /**
   * Pure deterministic scene evaluation at exact timestamp t (seconds).
   */
  public evaluateAt(
    t: number,
    jitterX = 0,
    jitterY = 0,
    width = 1920,
    height = 1080
  ): FrameDirectorState {
    // Cloud Wipe peaks at exact t = 5.65s!
    const wipeIn = smootherstep(5.30, 5.65, t);
    const wipeOut = 1.0 - smootherstep(5.65, 6.02, t);
    const cloudWipeAlpha = t < 5.65 ? wipeIn : wipeOut;

    // Cross-transition flash/dissolve around t = 19.95s (Square fracture -> Smooth Oval!)
    const disIn = smootherstep(19.75, 19.95, t);
    const disOut = 1.0 - smootherstep(19.95, 20.20, t);
    const dissolveAlpha = t < 19.95 ? disIn : disOut;

    // Determine active stage cleanly at exact transition peaks
    this.skyJetSet.group.visible = t < 5.65;
    this.hangarSet.group.visible = t >= 5.65 && t < 11.75;
    this.stressMacroSet.group.visible = t >= 11.75 && t < 19.95;
    this.ovalPayoffSet.group.visible = t >= 19.95;

    let activeBeat = 'sky_hook';
    let warmth = 0.55;
    let bloomIntensity = 0.85;

    if (t < 5.65) {
      // ---------------- BEAT 1: 1952 GOLDEN-HOUR JET HOOK (0.00 -> 5.65s) ----------------
      activeBeat = 'sky_hook';
      this.skyJetSet.update(t);
      this.skyMat.uniforms.uSunsetMix.value = 0.18;
      this.skyMat.uniforms.uIndoorDim.value = 0.0;
      this.hemiLight.intensity = 1.05;
      this.sunLight.position.set(10, 9, 12);
      this.sunLight.target.position.set(1.4, 0, 0);
      this.sunLight.intensity = 2.75;

      // Unobstructed 16:9 aerial tracking shot from 3/4 nose hero angle right up to the square window & waving Passenger!
      const u = easeInOutCubic(clamp(t / 5.25, 0, 1));
      const camPos = new THREE.Vector3(
        lerp(9.6, 1.72, u),
        lerp(2.15, 0.32, u),
        lerp(9.2, 3.65, u)
      );
      const lookTarget = new THREE.Vector3(
        lerp(0.6, 1.40, u),
        lerp(-0.15, 0.16, u),
        lerp(0.0, 1.49, u)
      );

      // Smooth bank into cloud wipe during 5.20 -> 5.65s
      if (t > 5.20) {
        const dive = smootherstep(5.20, 5.65, t);
        camPos.y += dive * 0.9;
        camPos.x += dive * 1.6;
      }

      this.camera.fov = lerp(44, 34, u);
      this.camera.position.copy(camPos);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(lookTarget);
      this.camera.rotation.z += Math.sin(t * 0.9) * 0.02 + smootherstep(5.15, 5.65, t) * 0.08;
      warmth = 0.68;
      bloomIntensity = 0.90;
    } else if (t < 11.75) {
      // ---------------- BEAT 2: FARNBOROUGH HANGAR & PRESSURE TANK (5.65 -> 11.75s) ----------------
      activeBeat = 'hangar_tank';
      this.hangarSet.update(t);
      this.skyMat.uniforms.uSunsetMix.value = 0.25;
      this.skyMat.uniforms.uIndoorDim.value = 0.45;
      this.hemiLight.intensity = 1.55;
      this.sunLight.position.set(-5.5, 12.5, 9.5);
      this.sunLight.target.position.set(0, 1.5, -1.0);
      this.sunLight.intensity = 2.85;

      // Generous wide 16:9 cinema framing:
      // 5.65 -> 8.0s: Airline Boss + "SQUARE VIEW = LUXURY!" easel + Chief Engineer
      // 8.0 -> 11.75s: Smooth dolly framing Chief Engineer pulling lever + FULL Farnborough Tank + Plaque + Gauge!
      const uPan = smootherstep(7.65, 9.60, t);
      const pushGauge = smootherstep(10.45, 11.75, t);

      const cx = lerp(-2.15, 1.55, uPan) + pushGauge * 0.85;
      const cy = lerp(2.05, 2.35, uPan) + pushGauge * 0.15;
      const cz = lerp(6.85, 7.65, uPan) - pushGauge * 1.45;

      const tx = lerp(-2.35, 1.75, uPan) + pushGauge * 0.95;
      const ty = lerp(1.75, 2.22, uPan) + pushGauge * 0.15;
      const tz = lerp(-0.8, -1.85, uPan);

      this.camera.fov = lerp(43, 40, pushGauge);
      this.camera.position.set(cx, cy, cz);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(tx, ty, tz);
      warmth = 0.48;
      bloomIntensity = 0.78;
    } else if (t < 19.95) {
      // ---------------- BEAT 3: MACRO PHOTOELASTIC STRESS SHADER & CRACK! (11.75 -> 19.95s) ----------------
      activeBeat = 'macro_stress';
      this.stressMacroSet.update(t);
      this.skyMat.uniforms.uSunsetMix.value = 0.55;
      this.skyMat.uniforms.uIndoorDim.value = 0.45;
      this.hemiLight.intensity = 1.35;
      this.sunLight.position.set(4.5, 8.5, 8.5);
      this.sunLight.target.position.set(0, 2.0, 0);
      this.sunLight.intensity = 2.45;

      const uMacro = smootherstep(11.75, 16.90, t);
      const uPullback = smootherstep(18.08, 18.80, t);

      let cx = lerp(0.15, 0.72, uMacro);
      let cy = lerp(2.22, 2.86, uMacro);
      let cz = lerp(4.35, 2.18, uMacro);

      let tx = lerp(0.10, 0.88, uMacro);
      let ty = lerp(2.25, 2.98, uMacro);
      const tz = 0.0;

      // Pull back right after the crack snap to frame BOTH cracked window & Boss's flying hat + ring-eyed Engineer!
      cx = lerp(cx, 0.0, uPullback);
      cy = lerp(cy, 1.92, uPullback);
      cz = lerp(cz, 6.25, uPullback);
      tx = lerp(tx, 0.0, uPullback);
      ty = lerp(ty, 1.95, uPullback);

      if (t >= 17.88) {
        const dtS = t - 17.88;
        const shake = Math.exp(-dtS * 7.5) * 0.16;
        cx += Math.sin(dtS * 95.0) * shake;
        cy += Math.cos(dtS * 118.0) * shake;
      }

      this.camera.fov = lerp(38, 44, uPullback);
      this.camera.position.set(cx, cy, cz);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(tx, ty, tz);
      warmth = 0.38;
      bloomIntensity = t >= 17.85 && t < 18.5 ? 1.25 : 0.95;
    } else {
      // ---------------- BEAT 4: SMOOTH OVAL SOLUTION & SUNSET SKY PAYOFF (19.95 -> 26.00s) ----------------
      activeBeat = 'oval_payoff';
      this.ovalPayoffSet.update(t);
      this.skyMat.uniforms.uSunsetMix.value = 0.92;
      this.skyMat.uniforms.uIndoorDim.value = 0.0;
      this.hemiLight.intensity = 1.25;
      this.sunLight.position.set(-7.5, 7.5, 9.5);
      this.sunLight.target.position.set(0, 1.8, 0);
      this.sunLight.intensity = 2.85;

      // Start wide enough to frame the full rounded oval + laminar streamlines, then pull back to sunset vista & winking Engineer!
      const uPull = smootherstep(21.40, 24.75, t);
      const cx = lerp(0.08, 0.0, uPull);
      const cy = lerp(2.25, 1.92, uPull);
      const cz = lerp(4.25, 6.65, uPull);

      const tx = 0.0;
      const ty = lerp(2.22, 1.82, uPull);

      this.camera.fov = lerp(39, 44, uPull);
      this.camera.position.set(cx, cy, cz);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(tx, ty, 0);
      warmth = 0.88;
      bloomIntensity = 0.92;
    }

    // Apply sub-pixel Halton camera jitter for temporal supersampling AA
    if (jitterX !== 0 || jitterY !== 0) {
      this.camera.setViewOffset(width, height, jitterX, jitterY, width, height);
    } else {
      this.camera.clearViewOffset();
    }
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld(true);

    // Project exact 3D top-right 90° window corner (0.96, 3.13, 0.02) to normalized screen UV!
    const cornerProj = new THREE.Vector3(0.96, 3.13, 0.02).project(this.camera);
    const cornerUvX = clamp(cornerProj.x * 0.5 + 0.5, 0.1, 0.85);
    const cornerUvY = clamp(-cornerProj.y * 0.5 + 0.5, 0.12, 0.78);

    return {
      activeBeat,
      cloudWipeAlpha,
      dissolveAlpha,
      warmth,
      bloomIntensity,
      cornerUvX,
      cornerUvY,
    };
  }
}
