import * as THREE from 'three';
import { clamp, dampedSpring, mulberry32 } from '../engine/math';

export type PuppetRole = 'passenger' | 'boss' | 'engineer';

export type PuppetExpression =
  | 'happy_sip'
  | 'smug_proud'
  | 'wink_brag'
  | 'skeptical_squint'
  | 'focused_pull'
  | 'ring_shock'
  | 'boss_panic_violet'
  | 'confident_smile'
  | 'triumphant_wink'
  | 'humbled_relief';

export interface PuppetPose {
  expression: PuppetExpression;
  time: number;
  stateChangedAt?: number;
  armAngleDeg?: number;     // right action arm angle
  leftArmAngleDeg?: number; // left arm angle
  headTiltDeg?: number;
  talkAmount?: number;      // 0..1 subtle jaw/body emphasis
  hatDetached?: boolean;    // when Boss's hat flies in 3D!
  hatFlyProgress?: number;  // 0..1 trajectory
  facing?: 1 | -1;
}

const INK = '#13141E';

export class Puppet2D {
  public readonly group: THREE.Group;
  public readonly bodyMesh: THREE.Mesh;
  public readonly hatMesh: THREE.Mesh | null = null;

  private readonly role: PuppetRole;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly texture: THREE.CanvasTexture;
  private readonly depthMat: THREE.MeshDepthMaterial;
  private readonly stdMat: THREE.MeshStandardMaterial;
  private readonly grainPattern: CanvasPattern | null;

  constructor(role: PuppetRole, heightWorld = 2.15) {
    this.role = role;
    this.group = new THREE.Group();

    this.canvas = document.createElement('canvas');
    this.canvas.width = 768;
    this.canvas.height = 960;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;

    this.grainPattern = this.buildPaperGrain();

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    const aspect = this.canvas.width / this.canvas.height;
    const geo = new THREE.PlaneGeometry(heightWorld * aspect, heightWorld);
    // Shift pivot to feet (y = 0 at bottom of character)
    geo.translate(0, heightWorld * 0.5, 0);

    this.stdMat = new THREE.MeshStandardMaterial({
      map: this.texture,
      transparent: false,
      alphaTest: 0.42,
      roughness: 0.80,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });

    this.depthMat = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: this.texture,
      alphaTest: 0.42,
    });

    this.bodyMesh = new THREE.Mesh(geo, this.stdMat);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.bodyMesh.customDepthMaterial = this.depthMat;
    this.group.add(this.bodyMesh);

    if (role === 'boss') {
      this.hatMesh = this.createDetachedHatMesh(heightWorld * 0.34);
      this.hatMesh.visible = false;
      this.group.add(this.hatMesh);
    }
  }

  private buildPaperGrain(): CanvasPattern | null {
    const g = document.createElement('canvas');
    g.width = 96;
    g.height = 96;
    const gctx = g.getContext('2d');
    if (!gctx) return null;
    const img = gctx.createImageData(96, 96);
    const rng = mulberry32(90125);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 230 + Math.floor((rng() - 0.5) * 34);
      img.data[i] = v;
      img.data[i + 1] = v - 2;
      img.data[i + 2] = v - 6;
      img.data[i + 3] = 28;
    }
    gctx.putImageData(img, 0, 0);
    return this.ctx.createPattern(g, 'repeat');
  }

  private createDetachedHatMesh(sizeWorld: number): THREE.Mesh {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 240;
    const hctx = c.getContext('2d')!;
    hctx.lineCap = 'round';
    hctx.lineJoin = 'round';

    // Homburg crown + curled brim + gold ribbon
    hctx.fillStyle = '#232533';
    hctx.strokeStyle = INK;
    hctx.lineWidth = 12;

    hctx.beginPath();
    hctx.moveTo(68, 152);
    hctx.quadraticCurveTo(75, 48, 132, 54);
    hctx.quadraticCurveTo(160, 66, 188, 54);
    hctx.quadraticCurveTo(245, 48, 252, 152);
    hctx.closePath();
    hctx.fill();
    hctx.stroke();

    // Gold hatband
    hctx.fillStyle = '#E3AA3C';
    hctx.fillRect(73, 128, 174, 22);
    hctx.strokeRect(73, 128, 174, 22);

    // Curled brim
    hctx.fillStyle = '#2D3042';
    hctx.beginPath();
    hctx.ellipse(160, 158, 128, 24, 0, 0, Math.PI * 2);
    hctx.fill();
    hctx.stroke();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      alphaTest: 0.4,
      roughness: 0.78,
      side: THREE.DoubleSide,
    });
    const dmat = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: tex,
      alphaTest: 0.4,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sizeWorld * 1.33, sizeWorld), mat);
    m.castShadow = true;
    m.customDepthMaterial = dmat;
    return m;
  }

  private lastDrawnTime = -999;
  private lastDrawnExp = '';

  public update(pose: PuppetPose): void {
    const t = pose.time;
    const dtState = t - (pose.stateChangedAt ?? 0);
    const pop = dampedSpring(Math.max(0, dtState), 16.0, 6.2);

    // Subtle breathing + spring squash & stretch (volume preserving!)
    const breathe = Math.sin(t * 2.8 + (this.role === 'boss' ? 1.2 : 0.0)) * 0.016;
    const squash = (1.0 - pop) * 0.08 + (pose.talkAmount ?? 0) * 0.025 * Math.sin(t * 18.0);
    const sy = 1.0 + breathe + squash;
    const sx = (pose.facing ?? 1) * (1.0 / Math.sqrt(Math.max(0.7, sy)));
    this.bodyMesh.scale.set(sx, sy, 1);

    // Detached 3D flying hat trajectory for Boss panic!
    if (this.hatMesh) {
      if (pose.hatDetached) {
        this.hatMesh.visible = true;
        const u = clamp(pose.hatFlyProgress ?? 0, 0, 1);
        const arcY = 1.92 + Math.sin(u * Math.PI * 0.88) * 0.95 - u * u * 0.28;
        const arcX = (pose.facing ?? 1) * (-0.12 - u * 0.45);
        this.hatMesh.position.set(arcX, arcY, 0.08);
        this.hatMesh.rotation.z = u * 6.8;
      } else {
        this.hatMesh.visible = false;
      }
    }

    if (Math.abs(t - this.lastDrawnTime) > 0.018 || pose.expression !== this.lastDrawnExp) {
      this.drawCharacter(pose, pop);
      this.texture.needsUpdate = true;
      this.lastDrawnTime = t;
      this.lastDrawnExp = pose.expression;
    }
  }

  private drawCharacter(pose: PuppetPose, springVal: number): void {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const t = pose.time;
    const exp = pose.expression;
    const armDeg = pose.armAngleDeg ?? 0;
    const leftArmDeg = pose.leftArmAngleDeg ?? 0;
    const headTilt = ((pose.headTiltDeg ?? 0) + (1 - springVal) * 6) * (Math.PI / 180);

    // 1. Stick-ink legs & boots (y: 720 -> 915)
    ctx.strokeStyle = INK;
    ctx.lineWidth = 16;
    // Left leg
    ctx.beginPath();
    ctx.moveTo(335, 715);
    ctx.quadraticCurveTo(326, 815, 322, 895);
    ctx.stroke();
    // Right leg
    ctx.beginPath();
    ctx.moveTo(433, 715);
    ctx.quadraticCurveTo(442, 815, 446, 895);
    ctx.stroke();

    // Stylized boots
    ctx.fillStyle = '#1B1C28';
    for (const [bx, dir] of [[312, -1], [456, 1]] as const) {
      ctx.beginPath();
      ctx.ellipse(bx + dir * 14, 902, 32, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 10;
      ctx.stroke();
    }

    // 2. Back/Left Arm
    this.drawArm(ctx, 290, 545, leftArmDeg, true, exp);

    // 3. Bean Torso with Role Costume
    this.drawTorso(ctx, exp);

    // 4. Head (Big expressive white/tinted egg head with thick ink outline!)
    ctx.save();
    ctx.translate(384, 345);
    ctx.rotate(headTilt);

    // Head fill color (turns outraged violet on boss_panic_violet!)
    const isViolet = exp === 'boss_panic_violet';
    ctx.fillStyle = isViolet ? '#A86CE0' : '#FAF6EE';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 14;

    ctx.beginPath();
    ctx.ellipse(0, -10, 146, 168, 0, 0, Math.PI * 2);
    ctx.fill();
    // Subtle cheek/jaw shadow inside head
    ctx.save();
    ctx.clip();
    ctx.fillStyle = isViolet ? 'rgba(92, 32, 145, 0.35)' : 'rgba(218, 198, 178, 0.38)';
    ctx.beginPath();
    ctx.ellipse(26, 34, 148, 160, 0, 0, Math.PI * 2);
    ctx.fill();
    if (this.grainPattern) {
      ctx.fillStyle = this.grainPattern;
      ctx.fillRect(-170, -200, 340, 400);
    }
    if (exp === 'humbled_relief') {
      ctx.fillStyle = 'rgba(235, 110, 130, 0.35)';
      ctx.beginPath();
      ctx.ellipse(-78, 28, 28, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(78, 28, 28, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // Crisp outer head ink stroke
    ctx.beginPath();
    ctx.ellipse(0, -10, 146, 168, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Ear steam puffs when Boss panics!
    if (isViolet) {
      this.drawEarSteam(ctx, t);
    }

    // Facial features (10 distinct expressions + deterministic natural blink)
    const blinkCycle = (t * 0.33 + (this.role === 'engineer' ? 0.41 : 0.12)) % 1.0;
    const autoBlink = blinkCycle > 0.955 && exp !== 'ring_shock' && exp !== 'boss_panic_violet';
    this.drawFace(ctx, exp, t, autoBlink);

    // Hat (if attached)
    if (!pose.hatDetached) {
      this.drawHat(ctx);
    }

    ctx.restore(); // end head

    // 5. Front/Right Action Arm + Role Prop (Teacup / Pointer Cane / Slide Rule)
    this.drawArm(ctx, 476, 545, armDeg, false, exp, t);

    ctx.restore();
  }

  private drawTorso(ctx: CanvasRenderingContext2D, exp: PuppetExpression): void {
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 14;

    // Bean torso path
    const torsoPath = new Path2D();
    torsoPath.moveTo(286, 505);
    torsoPath.bezierCurveTo(255, 565, 262, 695, 310, 726);
    torsoPath.lineTo(458, 726);
    torsoPath.bezierCurveTo(506, 695, 513, 565, 482, 505);
    torsoPath.closePath();

    if (this.role === 'engineer') {
      // Crisp white shirt base + Teal waistcoat (#19858E) + Crimson tie (#D63A49)
      ctx.fillStyle = '#F2EFE9';
      ctx.fill(torsoPath);
      ctx.save();
      ctx.clip(torsoPath);
      ctx.fillStyle = '#177E89';
      ctx.fillRect(260, 520, 92, 220);
      ctx.fillRect(416, 520, 92, 220);
      if (this.grainPattern) {
        ctx.fillStyle = this.grainPattern;
        ctx.fillRect(250, 500, 270, 240);
      }
      // Red tie
      ctx.fillStyle = '#D93B48';
      ctx.beginPath();
      ctx.moveTo(384, 512);
      ctx.lineTo(404, 635);
      ctx.lineTo(384, 668);
      ctx.lineTo(364, 635);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.stroke();
      // Pocket protector + brass pen
      ctx.fillStyle = '#E5B248';
      ctx.fillRect(430, 575, 36, 12);
      ctx.strokeRect(430, 575, 36, 12);
      ctx.restore();
    } else if (this.role === 'boss') {
      // Charcoal pinstripe coat + Mustard waistcoat + Gold watch chain!
      ctx.fillStyle = '#292C3D';
      ctx.fill(torsoPath);
      ctx.save();
      ctx.clip(torsoPath);
      // Pinstripes
      ctx.strokeStyle = 'rgba(255,255,255,0.13)';
      ctx.lineWidth = 3;
      for (let x = 268; x <= 500; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, 500);
        ctx.lineTo(x, 735);
        ctx.stroke();
      }
      // Mustard waistcoat center V
      ctx.fillStyle = '#E3AA38';
      ctx.beginPath();
      ctx.moveTo(340, 505);
      ctx.lineTo(428, 505);
      ctx.lineTo(418, 726);
      ctx.lineTo(350, 726);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 9;
      ctx.stroke();
      // Gold pocket watch chain
      ctx.strokeStyle = '#FFE07D';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(352, 650);
      ctx.quadraticCurveTo(384, 682, 422, 646);
      ctx.stroke();
      ctx.restore();
    } else {
      // Passenger: Warm vintage burgundy tweed jacket + cream scarf
      ctx.fillStyle = '#8C2F45';
      ctx.fill(torsoPath);
      ctx.save();
      ctx.clip(torsoPath);
      ctx.fillStyle = '#F4E8D1';
      ctx.beginPath();
      ctx.moveTo(348, 504);
      ctx.lineTo(420, 504);
      ctx.lineTo(384, 610);
      ctx.closePath();
      ctx.fill();
      if (this.grainPattern) {
        ctx.fillStyle = this.grainPattern;
        ctx.fillRect(250, 500, 270, 240);
      }
      ctx.restore();
    }

    ctx.strokeStyle = INK;
    ctx.lineWidth = 14;
    ctx.stroke(torsoPath);
    ctx.restore();
  }

  private drawFace(
    ctx: CanvasRenderingContext2D,
    exp: PuppetExpression,
    t: number,
    autoBlink: boolean
  ): void {
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    ctx.lineWidth = 11;

    const eyeLX = -52;
    const eyeRX = 52;
    const eyeY = -18;

    // Engineer round wire-rim spectacles background rims
    if (this.role === 'engineer') {
      ctx.save();
      ctx.fillStyle = 'rgba(190, 232, 248, 0.22)';
      ctx.strokeStyle = '#2B3040';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(eyeLX, eyeY, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(eyeRX, eyeY, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Spectacle bridge
      ctx.beginPath();
      ctx.moveTo(eyeLX + 40, eyeY - 4);
      ctx.quadraticCurveTo(0, eyeY - 14, eyeRX - 40, eyeY - 4);
      ctx.stroke();
      ctx.restore();
    }

    // EYES
    if (exp === 'ring_shock') {
      // Iconic concentric ring-eyes!
      for (const ex of [eyeLX, eyeRX]) {
        ctx.fillStyle = '#FFFFFF';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.arc(ex, eyeY, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(ex, eyeY, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(ex + Math.sin(t * 28) * 2, eyeY, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      // Animated blue sweat drop on temple!
      const dropY = -55 + ((t * 42) % 36);
      ctx.fillStyle = '#5CC8FF';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(116, dropY - 22);
      ctx.quadraticCurveTo(134, dropY + 8, 116, dropY + 18);
      ctx.quadraticCurveTo(98, dropY + 8, 116, dropY - 22);
      ctx.fill();
      ctx.stroke();
    } else if (exp === 'boss_panic_violet') {
      // Wide bulging panic eyes
      for (const ex of [eyeLX, eyeRX]) {
        ctx.fillStyle = '#FFFFFF';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(ex, eyeY - 4, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(ex, eyeY - 4, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (exp === 'smug_proud' || autoBlink) {
      // Happy / smug curved closed eyes
      ctx.lineWidth = 11;
      for (const ex of [eyeLX, eyeRX]) {
        ctx.beginPath();
        ctx.arc(ex, eyeY + 6, 22, Math.PI * 1.12, Math.PI * 1.88);
        ctx.stroke();
      }
    } else if (exp === 'wink_brag' || exp === 'triumphant_wink') {
      // Left eye open dot, right eye crisp wink chevron!
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(eyeLX, eyeY, 12, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(eyeRX - 22, eyeY - 8);
      ctx.lineTo(eyeRX + 6, eyeY + 4);
      ctx.lineTo(eyeRX - 22, eyeY + 16);
      ctx.stroke();
    } else if (exp === 'skeptical_squint') {
      // Half-lidded analytical squint
      for (const ex of [eyeLX, eyeRX]) {
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(ex + 5, eyeY + 4, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.moveTo(ex - 24, eyeY - 5);
        ctx.lineTo(ex + 24, eyeY - 5);
        ctx.stroke();
      }
    } else {
      // Expressive glossy dot eyes
      for (const ex of [eyeLX, eyeRX]) {
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.ellipse(ex, eyeY, 12, 17, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex - 4, eyeY - 6, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // EYEBROWS
    ctx.strokeStyle = INK;
    ctx.lineWidth = 11;
    if (exp === 'skeptical_squint') {
      ctx.beginPath();
      ctx.moveTo(eyeLX - 24, eyeY - 46);
      ctx.lineTo(eyeLX + 22, eyeY - 38);
      ctx.moveTo(eyeRX - 22, eyeY - 48);
      ctx.quadraticCurveTo(eyeRX, eyeY - 64, eyeRX + 24, eyeY - 48);
      ctx.stroke();
    } else if (exp === 'focused_pull') {
      ctx.beginPath();
      ctx.moveTo(eyeLX - 26, eyeY - 50);
      ctx.lineTo(eyeLX + 20, eyeY - 36);
      ctx.moveTo(eyeRX + 26, eyeY - 50);
      ctx.lineTo(eyeRX - 20, eyeY - 36);
      ctx.stroke();
    } else if (exp === 'ring_shock' || exp === 'boss_panic_violet') {
      ctx.beginPath();
      ctx.arc(eyeLX, eyeY - 46, 24, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(eyeRX, eyeY - 46, 24, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(eyeLX - 22, eyeY - 46);
      ctx.quadraticCurveTo(eyeLX, eyeY - 56, eyeLX + 22, eyeY - 46);
      ctx.moveTo(eyeRX - 22, eyeY - 46);
      ctx.quadraticCurveTo(eyeRX, eyeY - 56, eyeRX + 22, eyeY - 46);
      ctx.stroke();
    }

    // Boss distinguished mustache
    if (this.role === 'boss') {
      ctx.fillStyle = '#232533';
      ctx.beginPath();
      ctx.moveTo(0, 32);
      ctx.quadraticCurveTo(-38, 22, -56, 44);
      ctx.quadraticCurveTo(-26, 48, 0, 38);
      ctx.quadraticCurveTo(26, 48, 56, 44);
      ctx.quadraticCurveTo(38, 22, 0, 32);
      ctx.fill();
    }

    // MOUTH
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    if (exp === 'ring_shock' || exp === 'boss_panic_violet') {
      ctx.fillStyle = '#3B1528';
      ctx.beginPath();
      ctx.ellipse(0, 68, exp === 'boss_panic_violet' ? 32 : 22, exp === 'boss_panic_violet' ? 38 : 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (exp === 'focused_pull') {
      // Gritted teeth rectangle
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(-34, 52, 68, 24, 10);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-32, 64);
      ctx.lineTo(32, 64);
      ctx.stroke();
    } else if (exp === 'skeptical_squint') {
      ctx.beginPath();
      ctx.moveTo(-26, 62);
      ctx.lineTo(22, 54);
      ctx.stroke();
    } else if (exp === 'humbled_relief') {
      ctx.beginPath();
      ctx.moveTo(-24, 62);
      ctx.quadraticCurveTo(0, 70, 24, 58);
      ctx.stroke();
    } else {
      // Warm confident smile
      ctx.beginPath();
      ctx.arc(0, 48, 34, Math.PI * 0.16, Math.PI * 0.84);
      ctx.stroke();
    }
  }

  private drawHat(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 13;

    if (this.role === 'boss') {
      // Classic 1950s Executive Homburg Hat
      ctx.fillStyle = '#232533';
      ctx.beginPath();
      ctx.moveTo(-112, -138);
      ctx.quadraticCurveTo(-102, -258, -32, -250);
      ctx.quadraticCurveTo(0, -236, 32, -250);
      ctx.quadraticCurveTo(102, -258, 112, -138);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#E3AA3C';
      ctx.fillRect(-106, -162, 212, 22);
      ctx.strokeRect(-106, -162, 212, 22);

      ctx.fillStyle = '#2D3042';
      ctx.beginPath();
      ctx.ellipse(0, -134, 156, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (this.role === 'passenger') {
      // Vintage Cream Fedora
      ctx.fillStyle = '#EDE0C8';
      ctx.beginPath();
      ctx.moveTo(-104, -140);
      ctx.quadraticCurveTo(-88, -242, 0, -236);
      ctx.quadraticCurveTo(88, -242, 104, -140);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#8C2F45';
      ctx.fillRect(-98, -162, 196, 20);
      ctx.strokeRect(-98, -162, 196, 20);

      ctx.fillStyle = '#EDE0C8';
      ctx.beginPath();
      ctx.ellipse(6, -136, 148, 22, -0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Chief Engineer: Crisp parted dark hair tuft (distinguishes silhouette cleanly!)
      ctx.fillStyle = '#1E2230';
      ctx.beginPath();
      ctx.moveTo(-118, -118);
      ctx.quadraticCurveTo(-90, -212, 18, -198);
      ctx.quadraticCurveTo(72, -208, 112, -126);
      ctx.quadraticCurveTo(45, -158, -28, -154);
      ctx.quadraticCurveTo(-78, -154, -118, -118);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawEarSteam(ctx: CanvasRenderingContext2D, t: number): void {
    ctx.save();
    ctx.fillStyle = '#FAF6EE';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 7;
    for (const side of [-1, 1]) {
      const puffProg = (t * 2.8 + (side > 0 ? 0.5 : 0)) % 1.0;
      const px = side * (162 + puffProg * 58);
      const py = -18 - puffProg * 36;
      const r = 18 + Math.sin(puffProg * Math.PI) * 14;
      ctx.globalAlpha = 1.0 - puffProg * 0.65;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.arc(px + side * 18, py - 10, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawArm(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    angleDeg: number,
    isLeft: boolean,
    exp: PuppetExpression,
    t = 0
  ): void {
    ctx.save();
    ctx.translate(sx, sy);
    const rad = (angleDeg * Math.PI) / 180;
    ctx.rotate(rad);

    const dir = isLeft ? -1 : 1;
    const ex = dir * 92;
    const ey = 72;

    ctx.strokeStyle = INK;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(dir * 52, 48, ex, ey);
    ctx.stroke();

    // White cartoon glove / hand circle
    ctx.fillStyle = '#FAF6EE';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(ex, ey, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Role props in right hand!
    if (!isLeft) {
      if (this.role === 'boss' && exp !== 'boss_panic_violet' && exp !== 'humbled_relief') {
        // Wooden pointer cane with brass tip
        ctx.strokeStyle = '#6E3F20';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + 145, ey - 75);
        ctx.stroke();
        ctx.fillStyle = '#FFD166';
        ctx.beginPath();
        ctx.arc(ex + 148, ey - 77, 9, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.role === 'passenger') {
        // Porcelain teacup + saucer + rising steam curl!
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.ellipse(ex + 22, ey + 6, 32, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(ex + 4, ey - 24, 36, 28, [2, 2, 14, 14]);
        ctx.fill();
        ctx.stroke();
        // Rising tea steam
        ctx.strokeStyle = 'rgba(255,255,255,0.78)';
        ctx.lineWidth = 5;
        const st = Math.sin(t * 5.0) * 6;
        ctx.beginPath();
        ctx.moveTo(ex + 22, ey - 32);
        ctx.quadraticCurveTo(ex + 22 + st, ey - 52, ex + 22 - st, ey - 74);
        ctx.stroke();
      } else if (this.role === 'engineer' && (exp === 'skeptical_squint' || exp === 'confident_smile')) {
        // Ivory & brass engineering slide rule!
        ctx.save();
        ctx.translate(ex + 16, ey - 8);
        ctx.rotate(-0.45);
        ctx.fillStyle = '#F6E7C1';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 7;
        ctx.fillRect(-10, -10, 118, 22);
        ctx.strokeRect(-10, -10, 118, 22);
        ctx.restore();
      }
    }

    ctx.restore();
  }
}
