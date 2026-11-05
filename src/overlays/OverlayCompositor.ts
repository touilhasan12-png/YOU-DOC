import timelineData from '../data/timeline.json';
import { clamp, dampedSpring, lerp, smootherstep, smoothstep } from '../engine/math';
import type { FrameDirectorState } from '../world/DocumentaryWorld';

interface TimedWord {
  word: string;
  start: number;
  end: number;
  accent: string;
}

interface CaptionCard {
  id: number;
  start: number;
  end: number;
  text: string;
  words: TimedWord[];
}

const CARDS: CaptionCard[] = timelineData.cards as CaptionCard[];

export class OverlayCompositor {
  public draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    t: number,
    state: FrameDirectorState
  ): void {
    const s = width / 1920; // Scale factor for 720p smoke tests vs 1080p master!

    // 1. Seamless Volumetric Cloud-Wipe Veil around t = 5.65s!
    if (state.cloudWipeAlpha > 0.002) {
      this.drawCloudWipe(ctx, width, height, t, state.cloudWipeAlpha, s);
    }

    // 2. Anamorphic Light-Streak Dissolve around t = 19.95s!
    if (state.dissolveAlpha > 0.002) {
      this.drawAnamorphicDissolve(ctx, width, height, state.dissolveAlpha);
    }

    // 3. Diegetic Engineering Callouts & Live Stress Multiplier HUD
    this.drawEngineeringHUD(ctx, width, height, t, s, state);

    // 4. Closing Documentary Title Plaque (24.40 -> 26.00s)
    if (t >= 24.35) {
      this.drawClosingPlaque(ctx, width, height, t, s);
    }

    // 5. Word-Synced Kinetic Captions (Lower-Third y ~ 84.5%)
    this.drawCaptions(ctx, width, height, t, s);
  }

  private drawCloudWipe(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    alpha: number,
    s: number
  ): void {
    ctx.save();
    // Base warm sunlit cloud fog veil (reaches 1.0 opacity at exact t = 5.65s!)
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, `rgba(255, 236, 208, ${clamp(alpha * 1.06, 0, 1)})`);
    grad.addColorStop(0.55, `rgba(242, 224, 218, ${clamp(alpha * 1.08, 0, 1)})`);
    grad.addColorStop(1, `rgba(205, 188, 216, ${clamp(alpha * 1.05, 0, 1)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft sweeping cumulus silhouettes across the wipe
    const sweep = (t - 5.30) / 0.72;
    ctx.fillStyle = `rgba(255, 248, 236, ${clamp(alpha * 0.9, 0, 1)})`;
    for (let i = 0; i < 9; i++) {
      const cx = ((i / 8) * 1.3 - 0.15 + (sweep - 0.5) * 0.45 * (i % 2 === 0 ? 1 : -1)) * w;
      const cy = (0.18 + ((i * 37) % 64) / 100) * h;
      const r = (240 + (i % 3) * 110) * s;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawAnamorphicDissolve(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    alpha: number
  ): void {
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, `rgba(45, 210, 195, ${alpha * 0.75})`);
    g.addColorStop(0.5, `rgba(255, 240, 200, ${clamp(alpha * 1.05, 0, 1)})`);
    g.addColorStop(1, `rgba(255, 168, 76, ${alpha * 0.80})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  private drawEngineeringHUD(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    s: number,
    state: FrameDirectorState
  ): void {
    // Beat 1 subtle date & altitude stamp (0.35 -> 4.95s)
    if (t >= 0.35 && t <= 5.05) {
      const a = smoothstep(0.35, 0.75, t) * (1.0 - smoothstep(4.65, 5.05, t));
      ctx.save();
      ctx.globalAlpha = a;
      this.drawPillBadge(
        ctx,
        74 * s,
        66 * s,
        '1952  ·  35,000 FT CRUISING ALTITUDE',
        '#FFD166',
        s
      );
      ctx.restore();
    }

    // Beat 3 Macro Stress Callout Reticle (13.35 -> 17.85s)
    if (t >= 13.35 && t < 17.88) {
      const a = smoothstep(13.35, 13.80, t);
      const load = smootherstep(13.4, 16.9, t);
      const factor = lerp(1.0, 3.8, load).toFixed(1);

      ctx.save();
      ctx.globalAlpha = a;

      // Animated target reticle locked onto the exact 3D-projected 90° top-right corner!
      const rx = w * state.cornerUvX;
      const ry = h * state.cornerUvY;
      const pulseR = (38 + Math.sin(t * 10.0) * 5) * s;

      ctx.strokeStyle = load > 0.6 ? '#FF5D6C' : '#FFD166';
      ctx.lineWidth = 3.5 * s;
      ctx.beginPath();
      ctx.arc(rx, ry, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      // Leader line to callout box on top-left of reticle so it never clips right frame edge!
      const boxW = 490 * s;
      const bx = Math.max(48 * s, Math.min(w - boxW - 48 * s, rx - boxW - 65 * s));
      const by = Math.max(48 * s, ry - 115 * s);
      ctx.beginPath();
      ctx.moveTo(rx - pulseR * 0.72, ry - pulseR * 0.72);
      ctx.lineTo(bx + boxW * 0.75, by + 50 * s);
      ctx.stroke();

      this.drawPillBadge(
        ctx,
        bx,
        by,
        `90° SHARP CORNER  ·  ${factor}× STRESS`,
        load > 0.6 ? '#FF5D6C' : '#FFD166',
        s
      );
      ctx.restore();
    }

    // Fracture Alert Stamp right after t = 17.88s!
    if (t >= 17.88 && t <= 19.65) {
      const pop = dampedSpring(t - 17.88, 18.0, 6.0);
      const fade = 1.0 - smoothstep(19.25, 19.65, t);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(w * 0.5, h * 0.14);
      ctx.scale(0.85 + 0.15 * pop, 0.85 + 0.15 * pop);
      this.drawPillBadge(
        ctx,
        -255 * s,
        -28 * s,
        '⚠ FATIGUE CRACK AT 90° VERTEX  (3.8× PEAK)',
        '#FF5D6C',
        s
      );
      ctx.restore();
    }

    // Beat 4 Smooth Oval Laminar Flow Badge (20.25 -> 23.80s)
    if (t >= 20.25 && t <= 23.85) {
      const a = smoothstep(20.25, 20.65, t) * (1.0 - smoothstep(23.35, 23.85, t));
      ctx.save();
      ctx.globalAlpha = a;
      this.drawPillBadge(
        ctx,
        74 * s,
        66 * s,
        '✓ ROUNDED OVAL WINDOW  ·  1.1× SMOOTH LAMINAR FLOW',
        '#4CE0B3',
        s
      );
      ctx.restore();
    }
  }

  private drawPillBadge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    accentHex: string,
    s: number
  ): void {
    ctx.font = `800 ${Math.round(24 * s)}px "Montserrat", sans-serif`;
    const tw = ctx.measureText(label).width;
    const pw = tw + 44 * s;
    const ph = 50 * s;

    ctx.fillStyle = 'rgba(12, 15, 28, 0.82)';
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.roundRect(x, y, pw, ph, 12 * s);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accentHex;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 22 * s, y + ph * 0.52);
  }

  private drawClosingPlaque(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    s: number
  ): void {
    const a = smoothstep(24.35, 24.95, t);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const title = 'WHY AIRPLANE WINDOWS ARE NEVER SQUARE';
    ctx.font = `900 ${Math.round(42 * s)}px "Montserrat", sans-serif`;
    const tw = ctx.measureText(title).width;
    const bx = (w - tw) * 0.5 - 38 * s;
    const by = h * 0.12 - 36 * s;

    ctx.fillStyle = 'rgba(11, 14, 26, 0.72)';
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.roundRect(bx, by, tw + 76 * s, 74 * s, 16 * s);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FAF6EE';
    ctx.fillText(title, w * 0.5, h * 0.12 + 2 * s);
    ctx.restore();
  }

  private drawCaptions(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    s: number
  ): void {
    const card = CARDS.find((c) => t >= c.start && t <= c.end);
    if (!card) return;

    const dtCard = t - card.start;
    const pop = dampedSpring(dtCard, 22.0, 7.5);
    const cardScale = 0.92 + 0.08 * pop;
    const fadeOut = 1.0 - smoothstep(card.end - 0.06, card.end, t);

    ctx.save();
    ctx.globalAlpha = clamp(fadeOut, 0, 1);

    const fontSize = Math.round(56 * s);
    ctx.font = `900 ${fontSize}px "Montserrat", sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const spaceW = ctx.measureText(' ').width * 1.08;
    const widths = card.words.map((wd) => ctx.measureText(wd.word).width);
    const totalW = widths.reduce((a, b) => a + b, 0) + spaceW * Math.max(0, card.words.length - 1);

    const centerY = h * 0.855;
    ctx.translate(w * 0.5, centerY);
    ctx.scale(cardScale, cardScale);

    // Subtle cinema lower-third backdrop pill for 100% legibility on bright clouds & highlights
    const padX = 34 * s;
    const padY = 20 * s;
    ctx.fillStyle = 'rgba(10, 12, 22, 0.48)';
    ctx.beginPath();
    ctx.roundRect(-totalW * 0.5 - padX, -fontSize * 0.56 - padY, totalW + padX * 2, fontSize * 1.12 + padY * 2, 18 * s);
    ctx.fill();

    let cursorX = -totalW * 0.5;
    for (let i = 0; i < card.words.length; i++) {
      const wd = card.words[i];
      const ww = widths[i];
      const isSpokenNow = t >= wd.start - 0.02 && t <= wd.end + 0.08;
      const wordPop = isSpokenNow ? 1.0 + 0.075 * Math.sin(clamp((t - wd.start) / Math.max(0.08, wd.end - wd.start), 0, 1) * Math.PI) : 1.0;

      let fill = '#FFFFFF';
      if (wd.accent === 'gold') fill = isSpokenNow ? '#FFE082' : '#FFD166';
      else if (wd.accent === 'danger') fill = isSpokenNow ? '#FF7582' : '#FF5D6C';
      else if (wd.accent === 'safe') fill = isSpokenNow ? '#6FFFE9' : '#4CE0B3';
      else if (isSpokenNow) fill = '#FFFDF7';

      ctx.save();
      ctx.translate(cursorX + ww * 0.5, 0);
      ctx.scale(wordPop, wordPop);
      ctx.textAlign = 'center';

      // Soft drop shadow + crisp heavy ink stroke (beats reference legibility!)
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = 14 * s;
      ctx.shadowOffsetY = 5 * s;

      ctx.strokeStyle = '#0A0C16';
      ctx.lineWidth = 11 * s;
      ctx.strokeText(wd.word, 0, 0);

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = fill;
      ctx.fillText(wd.word, 0, 0);

      ctx.restore();
      cursorX += ww + spaceW;
    }

    ctx.restore();
  }
}
