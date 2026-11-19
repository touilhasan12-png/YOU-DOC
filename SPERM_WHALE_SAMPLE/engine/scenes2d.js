/**
 * Scene 4 (depth_evidence): Pure sharp Canvas 2D scientific evidence plate.
 * Exact YOU-DOC Canvas 2D Palette (01_VISUAL_IDENTITY_AND_STYLE_DNA.txt):
 *   ink #163847, cream #f4edda, paper #f3e9d5, aqua #72b8bc,
 *   gold #dfb565, muted #577a80, coral #cf7960
 *   sea gradient: #225b63 -> #123d49 -> #071d28; dark panels: #0d333f / #092431
 */

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const W = 1920, H = 1080;

const PAL = {
  ink: '#163847',
  cream: '#f4edda',
  paper: '#f3e9d5',
  aqua: '#72b8bc',
  gold: '#dfb565',
  muted: '#577a80',
  coral: '#cf7960',
  seaTop: '#225b63',
  seaMid: '#123d49',
  seaBot: '#071d28',
  panelDark: '#0d333f',
  panelDeep: '#092431',
  far: '#0b2631',
  rays: '#b4d7cb'
};

let worldLand = null;
try {
  const res = await fetch('/geography/world_land.geojson');
  if (res.ok) worldLand = await res.json();
} catch (e) {
  console.warn('GeoJSON load warning:', e);
}

let activeRow = null;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function ease(x) { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); }
function lerp(a, b, t) { return a + (b - a) * t; }

function roundRectPath(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Clean crisp silhouette of a diving sperm whale in Canvas 2D
function drawWhaleVector(cx, cy, scale, angleRad, fillCol = PAL.cream) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angleRad);
  ctx.scale(scale, scale);

  ctx.fillStyle = fillCol;
  ctx.beginPath();
  // Blunt rectangular spermaceti snout on +x, flukes on -x
  ctx.moveTo(58, -16);
  ctx.quadraticCurveTo(64, -14, 64, 0);
  ctx.quadraticCurveTo(64, 12, 56, 13);
  // Underslung jaw step
  ctx.lineTo(24, 14);
  ctx.quadraticCurveTo(18, 19, 10, 18);
  // Belly taper to caudal peduncle
  ctx.quadraticCurveTo(-20, 15, -52, 5);
  // Fluke lower edge
  ctx.lineTo(-70, 16);
  ctx.quadraticCurveTo(-65, 5, -62, 0);
  // Fluke upper edge
  ctx.quadraticCurveTo(-65, -5, -70, -16);
  ctx.lineTo(-52, -5);
  // Dorsal knuckles & hump
  ctx.lineTo(-34, -8);
  ctx.lineTo(-22, -13);
  ctx.quadraticCurveTo(-15, -18, -8, -15);
  // Long flat crown to blunt forehead
  ctx.lineTo(58, -16);
  ctx.closePath();
  ctx.fill();

  // Small rounded paddle pectoral fin
  ctx.fillStyle = PAL.aqua;
  ctx.beginPath();
  ctx.ellipse(16, 14, 10, 4.5, 0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Crisp stylized giant squid vector silhouette at abyssal hunting depth
function drawSquidVector(cx, cy, scale, t) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Mantle & arrow fins
  ctx.fillStyle = PAL.coral;
  ctx.beginPath();
  ctx.moveTo(42, 0);
  ctx.quadraticCurveTo(22, -13, -12, -10);
  ctx.lineTo(-12, 10);
  ctx.quadraticCurveTo(22, 13, 42, 0);
  ctx.closePath();
  ctx.fill();

  // Arrow terminal fin
  ctx.beginPath();
  ctx.moveTo(44, 0);
  ctx.lineTo(28, -16);
  ctx.lineTo(22, 0);
  ctx.lineTo(28, 16);
  ctx.closePath();
  ctx.fill();

  // Undulating trailing arms
  ctx.strokeStyle = PAL.coral;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    const len = Math.abs(i) === 1 ? 54 : 36;
    const wave = Math.sin(t * 2.4 + i * 1.1) * 5;
    ctx.beginPath();
    ctx.moveTo(-12, i * 3.4);
    ctx.quadraticCurveTo(-12 - len * 0.5, i * 5.2 + wave, -12 - len, i * 4.2 - wave);
    ctx.stroke();
  }

  // Eye dot
  ctx.fillStyle = PAL.cream;
  ctx.beginPath();
  ctx.arc(-11, -3, 3.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.seaBot;
  ctx.beginPath();
  ctx.arc(-11.8, -3, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Left column: 0m -> 2,000m ocean dive profile
function drawDepthColumn(t, cueT) {
  const x = 104, y = 216, w = 820, h = 796;

  // Bathymetric sea gradient
  roundRectPath(x, y, w, h, 14);
  ctx.save();
  ctx.clip();

  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0.0, PAL.seaTop);
  grad.addColorStop(0.28, PAL.seaMid);
  grad.addColorStop(0.62, '#0a2936');
  grad.addColorStop(1.0, PAL.seaBot);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Subtle top sunlight rays (only in upper 200m sunlight zone)
  ctx.fillStyle = 'rgba(180, 215, 203, 0.08)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    const rx = x + 90 + i * 160;
    ctx.moveTo(rx, y);
    ctx.lineTo(rx + 46, y);
    ctx.lineTo(rx - 20, y + 180);
    ctx.lineTo(rx - 68, y + 180);
    ctx.closePath();
    ctx.fill();
  }

  // Depth zone grid lines
  const zones = [
    { m: 0,    frac: 0.07, label: '0 m',      sub: 'Sunlight zone · surface breath' },
    { m: 200,  frac: 0.24, label: '200 m',    sub: 'Twilight zone · light fades' },
    { m: 1000, frac: 0.56, label: '1,000 m',  sub: 'Midnight zone · pitch darkness' },
    { m: 2000, frac: 0.89, label: '2,000 m',  sub: 'Abyssal hunting depth · ~200 atm' }
  ];

  zones.forEach(z => {
    const zy = y + h * z.frac;
    ctx.strokeStyle = z.m === 2000 ? 'rgba(223, 181, 101, 0.45)' : 'rgba(114, 184, 188, 0.22)';
    ctx.lineWidth = z.m === 2000 ? 1.5 : 1;
    ctx.setLineDash(z.m === 0 ? [] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(x + 28, zy);
    ctx.lineTo(x + w - 28, zy);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = z.m === 2000 ? PAL.gold : PAL.cream;
    ctx.font = '700 22px Display';
    ctx.fillText(z.label, x + 32, zy - 10);

    ctx.fillStyle = 'rgba(244, 237, 218, 0.68)';
    ctx.font = '450 18px Body';
    ctx.fillText(z.sub, x + 148, zy - 11);
  });

  // Smooth dive descent trajectory from 0m to 1,920m over t = 0..10.5s, cruising at depth thereafter
  const diveU = ease(t / 10.2);
  const whaleX = lerp(x + 205, x + 420, diveU) + Math.sin(t * 0.9) * 14 * diveU;
  const whaleY = lerp(y + h * 0.085, y + h * 0.84, diveU);
  const whaleAngle = lerp(0.88, 0.08, ease((t - 7.8) / 3.2));
  const currentDepthM = Math.round(lerp(10, 2000, diveU));

  // Dotted dive path trail
  ctx.strokeStyle = 'rgba(114, 184, 188, 0.55)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const u = (i / steps) * diveU;
    const px = lerp(x + 205, x + 420, u);
    const py = lerp(y + h * 0.085, y + h * 0.84, u);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Giant squid prey target at deep hunting zone
  const squidX = x + 690 + Math.sin(t * 0.7) * 10;
  const squidY = y + h * 0.835 + Math.cos(t * 0.9) * 8;
  drawSquidVector(squidX, squidY, 1.35, t);

  // Expanding directional sonar arcs emitted from whale snout toward squid
  const browX = whaleX + Math.cos(whaleAngle) * 76;
  const browY = whaleY + Math.sin(whaleAngle) * 76;
  for (let k = 0; k < 4; k++) {
    const phase = (t * 0.95 + k * 0.25) % 1.0;
    const rad = 24 + phase * 185;
    const alpha = (1 - phase) * 0.72 * clamp(diveU * 2.2, 0.25, 1.0);
    ctx.strokeStyle = k % 2 === 0
      ? `rgba(114, 184, 188, ${alpha.toFixed(3)})`
      : `rgba(223, 181, 101, ${alpha.toFixed(3)})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(browX, browY, rad, whaleAngle - 0.38, whaleAngle + 0.38);
    ctx.stroke();
  }

  // Descending sperm whale silhouette
  drawWhaleVector(whaleX, whaleY, 1.30, whaleAngle, PAL.cream);

  // Clean live telemetry readout box (top-right inside depth column, zero overlap)
  ctx.fillStyle = 'rgba(9, 36, 49, 0.82)';
  roundRectPath(x + w - 266, y + 24, 240, 114, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(114, 184, 188, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = PAL.gold;
  ctx.font = '750 44px Display';
  ctx.fillText(`${currentDepthM.toLocaleString('en-US')} m`, x + w - 246, y + 76);

  ctx.fillStyle = PAL.cream;
  ctx.font = '450 18px Body';
  ctx.fillText('Up to 90 min · single breath', x + w - 246, y + 112);

  ctx.restore();

  // Crisp outer border
  roundRectPath(x, y, w, h, 14);
  ctx.strokeStyle = 'rgba(114, 184, 188, 0.34)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// Top-right card: Spermaceti head acoustic cutaway schematic
function drawAcousticCutaway(t) {
  const x = 964, y = 216, w = 852, h = 382;

  roundRectPath(x, y, w, h, 14);
  ctx.fillStyle = PAL.panelDark;
  ctx.fill();
  ctx.strokeStyle = 'rgba(114, 184, 188, 0.34)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = PAL.cream;
  ctx.font = '700 28px Display';
  ctx.fillText('Inside the acoustic head', x + 32, y + 48);
  ctx.fillStyle = 'rgba(244, 237, 218, 0.68)';
  ctx.font = '450 18px Body';
  ctx.fillText('Schematic cross-section · how a 230 dB click is focused', x + 32, y + 78);

  // Head silhouette box (facing right)
  const hx = x + 64, hy = y + 126;
  ctx.save();
  ctx.fillStyle = '#183e53';
  ctx.strokeStyle = PAL.aqua;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hx, hy + 20);
  ctx.lineTo(hx + 400, hy + 8);
  ctx.quadraticCurveTo(hx + 455, hy + 10, hx + 458, hy + 68);
  ctx.quadraticCurveTo(hx + 456, hy + 126, hx + 400, hy + 132);
  ctx.lineTo(hx + 150, hy + 136);
  ctx.lineTo(hx + 340, hy + 158); // narrow lower jaw
  ctx.lineTo(hx + 336, hy + 174);
  ctx.lineTo(hx + 100, hy + 176);
  ctx.lineTo(hx, hy + 160);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 1. Spermaceti oil organ (upper golden chamber)
  ctx.fillStyle = 'rgba(223, 181, 101, 0.28)';
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 1.8;
  roundRectPath(hx + 95, hy + 24, 310, 48, 22);
  ctx.fill();
  ctx.stroke();

  // 2. Junk acoustic lens (lower segmented oil chambers)
  ctx.fillStyle = 'rgba(114, 184, 188, 0.24)';
  ctx.strokeStyle = PAL.aqua;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    roundRectPath(hx + 150 + i * 52, hy + 82, 42, 36, 8);
    ctx.fill();
    ctx.stroke();
  }

  // 3. Frontal air sac mirror (rear reflector)
  ctx.strokeStyle = PAL.cream;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(hx + 92, hy + 68, 36, -0.65, 0.65);
  ctx.stroke();

  // 4. Phonic ("monkey") lips at front upper tip
  ctx.fillStyle = PAL.coral;
  ctx.beginPath();
  ctx.arc(hx + 412, hy + 46, 9, 0, Math.PI * 2);
  ctx.fill();

  // Animated acoustic pulse bouncing: phonic lips -> back through spermaceti -> frontal sac -> forward through junk lens -> out into sea!
  const cycle = (t * 0.72) % 1.0;
  let px, py, emitPhase = -1;
  if (cycle < 0.35) {
    const u = cycle / 0.35;
    px = lerp(hx + 412, hx + 102, u);
    py = hy + 48;
  } else if (cycle < 0.72) {
    const u = (cycle - 0.35) / 0.37;
    px = lerp(hx + 102, hx + 455, u);
    py = lerp(hy + 66, hy + 100, u);
  } else {
    emitPhase = (cycle - 0.72) / 0.28;
    px = hx + 458 + emitPhase * 150;
    py = hy + 100;
  }

  // Draw crisp acoustic packet dot inside chambers
  if (emitPhase < 0) {
    ctx.fillStyle = PAL.gold;
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PAL.cream;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Emitted focused 230 dB beam arcs exiting the brow
    for (let b = 0; b < 3; b++) {
      const r = 18 + emitPhase * 140 + b * 24;
      const a = Math.max(0, 1 - emitPhase) * (0.85 - b * 0.2);
      ctx.strokeStyle = b === 0 ? `rgba(223,181,101,${a.toFixed(2)})` : `rgba(114,184,188,${a.toFixed(2)})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(hx + 458, hy + 100, r, -0.36, 0.36);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Clean right-side legend labels (zero overlap)
  const lx = x + 558;
  const items = [
    { col: PAL.coral, title: '1. Phonic lips', desc: 'Pressurized air generates click' },
    { col: PAL.gold,  title: '2. Spermaceti case', desc: 'Sound reflects off rear air sac' },
    { col: PAL.aqua,  title: '3. Junk acoustic lens', desc: 'Focuses beam to 230 dB' }
  ];
  items.forEach((it, idx) => {
    const iy = y + 146 + idx * 72;
    ctx.fillStyle = it.col;
    ctx.beginPath();
    ctx.arc(lx, iy - 6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAL.cream;
    ctx.font = '700 20px Display';
    ctx.fillText(it.title, lx + 18, iy);
    ctx.fillStyle = 'rgba(244, 237, 218, 0.72)';
    ctx.font = '450 16px Body';
    ctx.fillText(it.desc, lx + 18, iy + 24);
  });
}

// Bottom-right card: Natural Earth Caribbean map + Coda Clan Dialect Track
function drawMapAndCodas(t) {
  const x = 964, y = 630, w = 852, h = 382;

  roundRectPath(x, y, w, h, 14);
  ctx.fillStyle = PAL.panelDark;
  ctx.fill();
  ctx.strokeStyle = 'rgba(114, 184, 188, 0.34)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = PAL.cream;
  ctx.font = '700 28px Display';
  ctx.fillText('Vocal clans & dialects', x + 32, y + 48);
  ctx.fillStyle = 'rgba(244, 237, 218, 0.68)';
  ctx.font = '450 18px Body';
  ctx.fillText('Matrilineal families share learned rhythmic click patterns (codas)', x + 32, y + 78);

  // Left half of card: Real Natural Earth Caribbean / Eastern Atlantic map
  const mx = x + 32, my = y + 102, mw = 390, mh = 248;
  ctx.save();
  roundRectPath(mx, my, mw, mh, 10);
  ctx.fillStyle = PAL.panelDeep;
  ctx.fill();
  ctx.clip();

  // Simple equirectangular projection centered on Caribbean / Western Atlantic
  const lonMin = -92, lonMax = -48, latMin = 4, latMax = 30;
  const proj = (lon, lat) => [
    mx + ((lon - lonMin) / (lonMax - lonMin)) * mw,
    my + ((latMax - lat) / (latMax - latMin)) * mh
  ];

  // Subtle lat/lon graticule
  ctx.strokeStyle = 'rgba(114, 184, 188, 0.12)';
  ctx.lineWidth = 1;
  for (let lon = -90; lon <= -50; lon += 10) {
    const [gx] = proj(lon, 0);
    ctx.beginPath(); ctx.moveTo(gx, my); ctx.lineTo(gx, my + mh); ctx.stroke();
  }
  for (let lat = 10; lat <= 25; lat += 5) {
    const [, gy] = proj(0, lat);
    ctx.beginPath(); ctx.moveTo(mx, gy); ctx.lineTo(mx + mw, gy); ctx.stroke();
  }

  // Draw Natural Earth land polygons
  if (worldLand && worldLand.features) {
    ctx.fillStyle = '#25525d';
    ctx.strokeStyle = 'rgba(114, 184, 188, 0.45)';
    ctx.lineWidth = 1;
    const drawRing = ring => {
      ctx.beginPath();
      ring.forEach((pt, idx) => {
        const [px, py] = proj(pt[0], pt[1]);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };
    for (const f of worldLand.features) {
      const g = f.geometry;
      if (!g) continue;
      if (g.type === 'Polygon') g.coordinates.forEach(drawRing);
      else if (g.type === 'MultiPolygon') g.coordinates.forEach(poly => poly.forEach(drawRing));
    }
  }

  // Dominica marker (15.41 N, 61.37 W) with pulsing ring
  const [dx, dy] = proj(-61.37, 15.41);
  const pulse = (t * 0.9) % 1.0;
  ctx.strokeStyle = `rgba(223, 181, 101, ${(1 - pulse) * 0.85})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(dx, dy, 6 + pulse * 26, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = PAL.gold;
  ctx.beginPath();
  ctx.arc(dx, dy, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PAL.cream;
  ctx.font = '700 17px Display';
  ctx.fillText('Dominica', dx + 12, dy - 6);
  ctx.fillStyle = 'rgba(244, 237, 218, 0.65)';
  ctx.font = '450 13px Body';
  ctx.fillText('Natural Earth 110m · public domain', mx + 12, my + mh - 12);
  ctx.restore();

  // Right half of card: Animated Coda Rhythm Patterns
  const cx = x + 452, cw = 368;
  const clans = [
    { name: 'EC-1 Caribbean Clan', code: '1 + 1 + 3 coda', beats: [0.06, 0.34, 0.62, 0.74, 0.86], col: PAL.gold },
    { name: 'EC-2 Atlantic Clan',  code: '5-Regular coda', beats: [0.10, 0.28, 0.46, 0.64, 0.82], col: PAL.aqua }
  ];

  const scanU = (t * 0.55) % 1.0;
  clans.forEach((cl, idx) => {
    const cy = y + 132 + idx * 116;
    ctx.fillStyle = PAL.cream;
    ctx.font = '700 20px Display';
    ctx.fillText(cl.name, cx, cy);
    ctx.fillStyle = cl.col;
    ctx.font = '450 16px Body';
    ctx.fillText(cl.code, cx + 220, cy);

    // Track bar
    const ty = cy + 28;
    ctx.fillStyle = PAL.panelDeep;
    roundRectPath(cx, ty, cw, 44, 8);
    ctx.fill();

    // Moving playhead line
    const headX = cx + 14 + scanU * (cw - 28);
    ctx.strokeStyle = 'rgba(244, 237, 218, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(headX, ty + 4);
    ctx.lineTo(headX, ty + 40);
    ctx.stroke();

    // Rhythmic click pulses
    cl.beats.forEach(b => {
      const bx = cx + 14 + b * (cw - 28);
      const dist = Math.abs(scanU - b);
      const active = dist < 0.07 ? 1 - dist / 0.07 : 0;
      const barH = 16 + active * 16;
      ctx.fillStyle = active > 0.1 ? PAL.cream : cl.col;
      ctx.fillRect(bx - 3, ty + 22 - barH / 2, 6, barH);
    });
  });

  ctx.fillStyle = 'rgba(244, 237, 218, 0.62)';
  ctx.font = '450 15px Body';
  ctx.fillText('Illustrative rhythm diagram · not a field spectrogram', cx, y + 344);
}

window.configure = row => {
  activeRow = row;
};

window.draw = t => {
  // Clean deep background
  ctx.fillStyle = PAL.panelDeep;
  ctx.fillRect(0, 0, W, H);

  // Subtle top bar hairline
  ctx.fillStyle = 'rgba(114, 184, 188, 0.18)';
  ctx.fillRect(104, 184, W - 208, 1.5);

  const cueT = activeRow?.cue_s ?? activeRow?.default_cue_s ?? 10.6;
  const isClosing = t >= cueT;

  // Editorial header at YOU-DOC Canvas coordinates (104, 88)
  ctx.fillStyle = isClosing ? PAL.gold : PAL.cream;
  ctx.font = '750 54px Display';
  ctx.fillText(
    isClosing ? (activeRow?.beat_title || 'Not blind in the dark.') : (activeRow?.opening_title || 'Built for the abyss.'),
    104,
    112
  );

  ctx.fillStyle = isClosing ? PAL.cream : 'rgba(244, 237, 218, 0.78)';
  ctx.font = isClosing ? '700 28px Display' : '450 24px Body';
  ctx.fillText(
    isClosing ? (activeRow?.beat_detail || 'Built to see with sound.') : (activeRow?.opening_detail || 'Single-breath dive profile · spermaceti acoustics'),
    104,
    154
  );

  // Right-side chapter pill
  ctx.fillStyle = PAL.aqua;
  ctx.font = '700 22px Display';
  ctx.textAlign = 'right';
  ctx.fillText('PHYSETER MACROCEPHALUS · EVIDENCE', W - 104, 112);
  ctx.textAlign = 'left';

  drawDepthColumn(t, cueT);
  drawAcousticCutaway(t);
  drawMapAndCodas(t);

  return { is_closing: isClosing, time: Number(t.toFixed(3)) };
};

window.ready = true;
