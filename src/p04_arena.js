// ================= Halle: Boden mit Perspektive, Tribünen, LED-Banden, Videowürfel =================
const TX0 = -6, TEXW = Math.round(52 * PX), TROW0 = 22;     // Textur: Welt-x -6..46, Zeile 0 = 22 px über der Seitenlinie
const FLOOR = document.createElement('canvas'); FLOOR.width = TEXW; FLOOR.height = Math.round(CH * DY) + TROW0 + 30;
const STANDS = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = 1400; c.height = 96; return c; });
const FRONT = document.createElement('canvas'); FRONT.width = 1600; FRONT.height = 30;
const ftx = x => (x - TX0) * PX, fty = y => TROW0 + y * DY;
let ARENA = { home: 0, away: 1, flags: [] };

function areaPts(gx, r, step = 0.03) {
  const pts = [], mx = x => gx === 0 ? x : CW - x;
  for (let a = -Math.PI / 2; a <= 0; a += step / r) pts.push([mx(r * Math.cos(a)), GY1 + r * Math.sin(a)]);
  for (let y = GY1; y <= GY2; y += step) pts.push([mx(r), y]);
  for (let a = 0; a <= Math.PI / 2; a += step / r) pts.push([mx(r * Math.cos(a)), GY2 + r * Math.sin(a)]);
  return pts.filter(p => p[1] >= -0.01 && p[1] <= CH + 0.01);
}
function buildArena(homeKit, awayKit, lg) {
  const c = FLOOR.getContext('2d'), r = seeded(77 + lg);
  // Hallenboden außen
  c.fillStyle = '#1b2233'; c.fillRect(0, 0, FLOOR.width, FLOOR.height);
  for (let y = 0; y < FLOOR.height; y += 3) { c.fillStyle = 'rgba(255,255,255,0.025)'; c.fillRect(0, y, FLOOR.width, 1); }
  // Spielfläche: Blau mit Dielen-Struktur
  const court = lg === 2 ? '#2d5c8f' : '#2a58a8', area = lg === 2 ? '#d07a2e' : '#e0842e';
  c.fillStyle = court; c.fillRect(ftx(0), fty(0), CW * PX, CH * DY);
  for (let y = fty(0); y < fty(CH); y++) { c.fillStyle = (y % 4 < 2) ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.035)'; c.fillRect(ftx(0), y, CW * PX, 1); }
  for (let i = 0; i < 2600; i++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'; c.fillRect((ftx(r() * CW)) | 0, (fty(r() * CH)) | 0, 2 + ((r() * 4) | 0), 1); }
  // Freiwurfraum leicht abgesetzt, Torräume orange
  for (const gx of [0, CW]) {
    const fill = (rad, col) => { const pts = areaPts(gx, rad); c.fillStyle = col; c.beginPath(); c.moveTo(ftx(gx), fty(pts[0][1])); for (const p of pts) c.lineTo(ftx(p[0]), fty(p[1])); c.lineTo(ftx(gx), fty(pts[pts.length - 1][1])); c.fill(); };
    fill(6, area);
    const pts = areaPts(gx, 6); for (let i = 0; i < 900; i++) { const y = r() * CH, x = r() * 6; if (goalDist(gx === 0 ? x : CW - x, y, gx) < 5.9) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'; c.fillRect(ftx(gx === 0 ? x : CW - x) | 0, fty(y) | 0, 3, 1); } }
  }
  const dot = (x, y, col, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(Math.round(ftx(x)), Math.round(fty(y)), w, h); };
  const line = (x1, y1, x2, y2, col, w = 1, h = 1) => { const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 0.025); for (let i = 0; i <= n; i++) dot(lerp(x1, x2, i / n), lerp(y1, y2, i / n), col, w, h); };
  // Linien anderer Hallensportarten (Mehrzweckhalle, sehr dezent)
  const ghost = 'rgba(240,200,70,0.22)';
  [[11, 5.5, 29, 5.5], [11, 14.5, 29, 14.5], [11, 5.5, 11, 14.5], [29, 5.5, 29, 14.5], [17, 5.5, 17, 14.5], [23, 5.5, 23, 14.5]].forEach(l => line(...l, ghost));
  // Handball-Linien
  const wh = '#f6f3ea';
  line(0, 0, CW, 0, wh, 2, 2); line(0, CH, CW, CH, wh, 2, 2); line(0, 0, 0, CH, wh, 2, 1); line(CW, 0, CW, CH, wh, 2, 1);
  line(20, 0, 20, CH, wh, 2, 1);
  for (let a = 0; a < Math.PI * 2; a += 0.012) dot(20 + 2 * Math.cos(a), 10 + 2 * Math.sin(a), wh, 2, 1);
  line(15.5, -0.4, 15.5, 0.4, wh, 2, 1); line(24.5, -0.4, 24.5, 0.4, wh, 2, 1);
  for (const gx of [0, CW]) {
    areaPts(gx, 6, 0.02).forEach(p => dot(p[0], p[1], wh, 2, 2));
    areaPts(gx, 9, 0.02).forEach((p, i) => { if (Math.floor(i * 0.02 / 0.3) % 2 === 0) dot(p[0], p[1], wh, 2, 1); });
    const m = x => gx === 0 ? x : CW - x;
    line(m(7), 9.5, m(7), 10.5, wh, 2, 1); line(m(4), 9.92, m(4), 10.08, wh, 2, 1);
  }
  // Mittelkreis-Logo: Liga-Schriftzug in den Boden gedruckt
  c.save(); c.globalAlpha = 0.16; c.fillStyle = '#ffffff'; c.font = `16px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(lg === 2 ? '2. LIGA' : '1. LIGA', ftx(20), fty(10)); c.restore();
  // Werbung auf dem Boden neben den Toren
  c.save(); c.globalAlpha = 0.22; c.fillStyle = '#ffffff'; c.font = `8px ${FONT}`; c.textAlign = 'center';
  c.fillText('HARZ & HAFT', ftx(13), fty(17.6)); c.fillText('HARZ & HAFT', ftx(27), fty(2.8)); c.restore();
  buildStands(homeKit, awayKit);
  buildFront(homeKit);
}
function fanColors(kit) { return [kit.c1, kit.c1, kit.c1, kit.c2, kit.c2, '#d8d2c0', '#5d5a6a', '#2a2a30']; }
function buildStands(homeKit, awayKit) {
  const r0 = seeded(1234);
  const home = fanColors(homeKit), away = fanColors(awayKit);
  ARENA.fans = [];
  STANDS.forEach((cnv, f) => {
    const g = cnv.getContext('2d'), r = seeded(99);
    g.fillStyle = '#100d18'; g.fillRect(0, 0, cnv.width, cnv.height);
    for (let row = 0; row < 12; row++) {
      const y0 = row * 8;
      g.fillStyle = row % 2 ? '#1a1626' : '#1e1a2c'; g.fillRect(0, y0 + 2, cnv.width, 8);
      g.fillStyle = '#2a2438'; g.fillRect(0, y0 + 9, cnv.width, 1);
      for (let x = (row % 2) * 3; x < cnv.width; x += 6) {
        const gast = x > 1040 && x < 1260;                          // Gästeblock
        if (r() < 0.07 && !gast) continue;
        const pal = gast ? away : home, col = pal[(r() * pal.length) | 0];
        const skin = SKIN[(r() * SKIN.length) | 0][0], hair = HAIR[(r() * HAIR.length) | 0];
        const act = r(), up = f === 0 ? 0 : f === 1 ? (act < 0.5 ? 1 : 0) : (act < 0.8 ? 2 : 1);
        const y = y0 + 3 - up;
        g.fillStyle = col; g.fillRect(x, y + 3, 5, 5);
        g.fillStyle = shade(col, 0.7); g.fillRect(x, y + 3, 1, 5);
        g.fillStyle = skin; g.fillRect(x + 1, y, 3, 3);
        g.fillStyle = hair; g.fillRect(x + 1, y, 3, 1);
        if (up && r() < 0.75) { g.fillStyle = skin; g.fillRect(x - 1, y - 2 - (up > 1 ? 1 : 0), 1, 4); g.fillRect(x + 5, y - 2 - (up > 1 ? 1 : 0), 1, 4); }
        if (f && r() < 0.05) { g.fillStyle = col === '#d8d2c0' ? home[0] : '#ffffff'; g.fillRect(x - 1, y - 6, 7, 4); }   // Schals/Schilder
      }
    }
    // Fahnen-Doppelhalter
    const rr = seeded(55);
    for (let i = 0; i < 9; i++) { const x = (rr() * cnv.width) | 0, y = (rr() * 70) | 0, gast = x > 1040 && x < 1260, k = gast ? awayKit : homeKit; g.fillStyle = k.c1; g.fillRect(x, y, 20, 10); g.fillStyle = k.c2; g.fillRect(x, y + 4, 20, 2); g.fillStyle = OUTLINE; g.fillRect(x, y - 1, 20, 1); }
  });
  ARENA.flags = Array.from({ length: 6 }, (_, i) => ({ x: 120 + i * 210 + r0() * 60, y: 18 + r0() * 50, k: i === 5 ? awayKit : homeKit, ph: r0() * 6 }));
}
function buildFront(kit) {
  const g = FRONT.getContext('2d'), r = seeded(5);
  g.clearRect(0, 0, FRONT.width, FRONT.height);
  for (let x = 0; x < FRONT.width; x += 9 + ((r() * 6) | 0)) {
    const h = 12 + ((r() * 10) | 0), col = r() < 0.5 ? shade(kit.c1, 0.25) : '#07060b';
    g.fillStyle = col; g.fillRect(x, FRONT.height - h + 7, 13, h); g.beginPath(); g.arc(x + 6.5, FRONT.height - h + 3, 5, 0, 7); g.fill();
  }
}

// --- Laufschrift der LED-Banden ---
const LED = { msg: null, t: 0, col: '#ffc83a' };
function ledFlash(txt, col, dur = 3) { LED.msg = txt; LED.col = col; LED.t = dur; }
const ADS = ['HARZ & HAFT', 'KREISLÄUFER BRÄU', 'SIEBENMETER VERSICHERUNG', 'TEMPOGEGENSTOSS ENERGY', 'RÜCKRAUM REISEN', 'KEMPA KAFFEE', 'FALLWURF FITNESS'];

function drawArenaBack(t, excite) {
  // Dach & Traversen
  ctx.fillStyle = '#07060b'; ctx.fillRect(0, 0, W, 40);
  const par = (CAMX - 20) * PX * 0.35;
  ctx.fillStyle = '#151221';
  for (let i = -2; i < 12; i++) { const x = Math.round(i * 80 - (par % 80)); ctx.fillRect(x, 6, 2, 30); ctx.fillRect(x - 20, 8, 80, 1); ctx.fillRect(x - 20, 20, 80, 1); }
  for (let i = -2; i < 12; i++) { const x = Math.round(i * 80 - (par % 80)) + 30; ctx.fillStyle = '#fff8e0'; ctx.fillRect(x, 10, 5, 2); ctx.fillStyle = 'rgba(255,248,224,0.12)'; ctx.fillRect(x - 2, 12, 9, 1); }
  // Tribünen (Parallaxe)
  const fr = excite > 1.5 ? (Math.floor(t * 7) % 2 ? 2 : 1) : excite > 0 ? (Math.floor(t * 5) % 2) : (Math.floor(t * 0.8) % 3 === 0 ? 1 : 0);
  const off = Math.round(((CAMX - 20) * PX * 0.6) + 700 - W / 2);
  ctx.drawImage(STANDS[fr], clamp(off, 0, 1400 - W), 0, W, 96, 0, 38, W, 96);
  // La-Ola bei hoher Stimmung
  if (G && G.wave > 0) { const wx = ((t * 260) % (W + 120)) - 60; ctx.drawImage(STANDS[2], clamp(off, 0, 1400 - W) + Math.max(0, wx), 0, 50, 96, Math.max(0, wx), 38, 50, 96); }
  // Doppelhalter schwenken
  for (const f of ARENA.flags) {
    const x = Math.round(f.x - clamp(off, 0, 1400 - W)), y = 38 + f.y + Math.round(Math.sin(t * 2.4 + f.ph) * 2);
    if (x < -30 || x > W + 10) continue;
    ctx.fillStyle = '#5a5060'; ctx.fillRect(x, y, 1, 18); ctx.fillRect(x + 24, y, 1, 18);
    ctx.fillStyle = f.k.c1; ctx.fillRect(x + 1, y, 23, 12); ctx.fillStyle = f.k.c2; ctx.fillRect(x + 1, y + 5, 23, 2);
  }
  // Blitzlichter
  if (excite > 0) for (let i = 0; i < 6 * excite; i++) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect((Math.random() * W) | 0, 40 + ((Math.random() * 90) | 0), 2, 2); }
  // LED-Banden
  drawLED(t);
  // Bankbereich
  ctx.fillStyle = '#0d0f18'; ctx.fillRect(0, 134, W, FAR_Y - 134);
}
function drawLED(t) {
  const y0 = 120, h = 13;
  ctx.fillStyle = '#05040a'; ctx.fillRect(0, y0 - 1, W, h + 2);
  ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.clip();
  ctx.font = `8px ${FONT}`; ctx.textBaseline = 'top';
  if (LED.t > 0) {
    const on = Math.floor(t * 8) % 2;
    ctx.fillStyle = on ? LED.col : shade(LED.col, 0.4); ctx.fillRect(0, y0, W, h);
    ctx.fillStyle = on ? '#05040a' : '#ffffff';
    const w = ctx.measureText(LED.msg + '   ').width;
    for (let x = -((t * 120) % w); x < W; x += w) ctx.fillText(LED.msg + '   ', x, y0 + 3);
  } else {
    const par = (CAMX - 20) * PX * 0.82;
    let x = -((par + t * 18) % 1400) - 200, i = 0;
    while (x < W) {
      const txt = ADS[i % ADS.length], w = ctx.measureText(txt).width + 30;
      ctx.fillStyle = i % 3 === 0 ? '#11214a' : i % 3 === 1 ? '#3a0f24' : '#0f2e22'; ctx.fillRect(Math.round(x), y0, w, h);
      ctx.fillStyle = i % 3 === 0 ? '#7cf2ff' : i % 3 === 1 ? '#ffc83a' : '#9cff57'; ctx.fillText(txt, Math.round(x + 15), y0 + 3);
      x += w; i++;
    }
  }
  for (let x = 0; x < W; x += 2) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x, y0, 1, h); }
  ctx.restore();
}
function drawFloor() {
  const r0 = FAR_Y - TROW0, r1 = Math.min(H, FAR_Y + Math.round(CH * DY) + 26);
  for (let row = r0; row < r1; row++) {
    const ty = row - FAR_Y + TROW0; if (ty < 0 || ty >= FLOOR.height) continue;
    const wy = (row - FAR_Y) / DY, k = kOf(wy);
    const dx = W / 2 + (TX0 - CAMX) * PX * k;
    ctx.drawImage(FLOOR, 0, ty, TEXW, 1, Math.round(dx), row, Math.round(TEXW * k), 1);
  }
  // Glanz der Hallenbeleuchtung
  const gr = ctx.createLinearGradient(0, FAR_Y, 0, FAR_Y + CH * DY);
  gr.addColorStop(0, 'rgba(255,255,255,0.07)'); gr.addColorStop(0.35, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = gr; ctx.fillRect(0, FAR_Y, W, CH * DY);
}
function drawLightCones(t) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const x = W / 2 + Math.sin(t * 0.3 + i * 2.1) * 220, g = ctx.createLinearGradient(0, 10, 0, H);
    g.addColorStop(0, 'rgba(255,240,200,0.07)'); g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 6, 12); ctx.lineTo(x + 6, 12); ctx.lineTo(x + 90, H); ctx.lineTo(x - 90, H); ctx.fill();
  }
  ctx.restore();
}
function drawFront() {
  const off = Math.round(((CAMX - 20) * PX * 1.25) + 800 - W / 2);
  ctx.drawImage(FRONT, clamp(off, 0, FRONT.width - W), 0, W, 30, 0, H - 24, W, 30);
}
