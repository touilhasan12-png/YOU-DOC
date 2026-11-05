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
      this.skyMat.uniforms.uSunsetMix.value = 0.15;
      this.skyMat.uniforms.uIndoorDim.value = 0.0;
      this.sunLight.position.set(10, 9, 12);
      this.sunLight.target.position.set(1.4, 0, 0);
      this.sunLight.intensity = 2.65;

      // Sweeping 16:9 aerial hero camera -> pushes close to the sharp 90° square window -> banks into cloud bank!
      const u = easeInOutCubic(clamp(t / 5.30, 0, 1));
      const camPos = new THREE.Vector3(
        lerp(9.8, 1.55, u),
        lerp(1.65, 0.24, u),
        lerp(10.8, 3.55, u)
      );
      const lookTarget = new THREE.Vector3(
        lerp(0.8, 1.45, u),
        lerp(0.10, 0.18, u),
        lerp(0.0, 1.48, u)
      );

      // Dive into foreground cloud bank during 5.15 -> 5.65s
      if (t > 5.15) {
        const dive = smootherstep(5.15, 5.65, t);
        camPos.z = lerp(camPos.z, 6.2, dive);
        camPos.x += dive * 1.4;
      }

      this.camera.fov = lerp(43, 35, u);
      this.camera.position.copy(camPos);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(lookTarget);
      // Subtle dynamic aerial roll
      this.camera.rotation.z += Math.sin(t * 0.9) * 0.025 + smootherstep(5.1, 5.65, t) * 0.09;
      warmth = 0.65;
      bloomIntensity = 0.92;
    } else if (t < 11.75) {
      // ---------------- BEAT 2: FARNBOROUGH HANGAR & PRESSURE TANK (5.65 -> 11.75s) ----------------
      activeBeat = 'hangar_tank';
      this.hangarSet.update(t);
      this.skyMat.uniforms.uSunsetMix.value = 0.25;
      this.skyMat.uniforms.uIndoorDim.value = 0.72;
      this.sunLight.position.set(-5.5, 12.5, 8.5);
      this.sunLight.target.position.set(0, 1.2, -1.0);
      this.sunLight.intensity = 2.35;

      // Two-part spline glide:
      // 5.65 -> 8.15s: Frame Airline Boss & "SQUARE VIEW = LUXURY!" easel with tank looming behind
      // 8.15 -> 11.75s: Smooth dolly/pan across to Chief Engineer pulling lever & Giant 35,000 FT Pressure Tank!
      const uPan = smootherstep(7.75, 9.65, t);
      const pushGauge = smootherstep(10.35, 11.75, t);

      const cx = lerp(-2.05, 1.65, uPan) + pushGauge * 1.25;
      const cy = lerp(1.78, 2.05, uPan) + pushGauge * 0.35;
      const cz = lerp(5.45, 5.85, uPan) - pushGauge * 2.15;

      const tx = lerp(-2.65, 1.85, uPan) + pushGauge * 1.35;
      const ty = lerp(1.58, 1.95, uPan) + pushGauge * 0.42;
      const tz = lerp(-0.6, -1.65, uPan);

      this.camera.fov = lerp(42, 38, pushGauge);
      this.camera.position.set(cx, cy, cz);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(tx, ty, tz);
      warmth = 0.42;
      bloomIntensity = 0.78;
    } else if (t < 19.95) {
      // ---------------- BEAT 3: MACRO PHOTOELASTIC STRESS SHADER & CRACK! (11.75 -> 19.95s) ----------------
      activeBeat = 'macro_stress';
      this.stressMacroSet.update(t);
      this.skyMat.uniforms.uSunsetMix.value = 0.55;
      this.skyMat.uniforms.uIndoorDim.value = 0.65;
      this.sunLight.position.set(4.5, 8.5, 7.5);
      this.sunLight.target.position.set(0, 2.0, 0);
      this.sunLight.intensity = 2.25;

      // 11.75 -> 17.85s: Dramatic push-in onto Top-Right 90° Square Window Corner (x=0.96, y=3.13)!
      // 17.88 -> 19.95s: Explosive impact camera shake + energetic pullback revealing Violet Boss (flying hat!) & Ring-Eyed Engineer!
      const uMacro = smootherstep(11.75, 16.90, t);
      const uPullback = smootherstep(17.92, 18.75, t);

      let cx = lerp(0.15, 0.72, uMacro);
      let cy = lerp(2.22, 2.86, uMacro);
      let cz = lerp(4.35, 2.15, uMacro);

      let tx = lerp(0.10, 0.88, uMacro);
      let ty = lerp(2.25, 2.98, uMacro);
      const tz = 0.0;

      // Pull back after the snap to capture Boss's flying hat & Engineer's ring-eyed shock!
      cx = lerp(cx, 0.0, uPullback);
      cy = lerp(cy, 1.82, uPullback);
      cz = lerp(cz, 5.55, uPullback);
      tx = lerp(tx, 0.0, uPullback);
      ty = lerp(ty, 1.88, uPullback);

      // Deterministic damped impact shake right at t = 17.88s!
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
      warmth = 0.35;
      bloomIntensity = t >= 17.85 && t < 18.5 ? 1.35 : 1.02;
    } else {
      // ---------------- BEAT 4: SMOOTH OVAL SOLUTION & SUNSET SKY PAYOFF (19.95 -> 26.00s) ----------------
      activeBeat = 'oval_payoff';
      this.ovalPayoffSet.update(t);
      this.skyMat.uniforms.uSunsetMix.value = 0.92;
      this.skyMat.uniforms.uIndoorDim.value = 0.0;
      this.sunLight.position.set(-7.5, 7.5, 9.5);
      this.sunLight.target.position.set(0, 1.8, 0);
      this.sunLight.intensity = 2.75;

      // 19.95 -> 22.1s: Close on Smooth Rounded Oval Window showing effortless laminar streamlines
      // 22.1 -> 26.0s: Majestic cinema pullback revealing triumphant Engineer wink, relieved Boss, & golden sunset cloud sea!
      const uPull = smootherstep(21.55, 24.85, t);
      const cx = lerp(0.18, 0.0, uPull);
      const cy = lerp(2.25, 1.88, uPull);
      const cz = lerp(2.65, 6.25, uPull);

      const tx = 0.0;
      const ty = lerp(2.25, 1.78, uPull);

      this.camera.fov = lerp(36, 43, uPull);
      this.camera.position.set(cx, cy, cz);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(tx, ty, 0);
      warmth = 0.88;
      bloomIntensity = 0.95;
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
