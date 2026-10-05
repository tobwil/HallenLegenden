// ================= Szene & TV-Grafik =================
const PIXC = { 'Ø': 'O', 'ø': 'o', 'Æ': 'AE', 'æ': 'ae', 'Đ': 'D', 'đ': 'd', 'Ł': 'L', 'ł': 'l', 'ð': 'd', 'Þ': 'TH' };
function pixSafe(s) { const K = 'ÄÖÜäöüß'; return String(s).replace(/[ÄÖÜäöüß]/g, c => String.fromCharCode(0xE000 + K.indexOf(c))).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-]/g, c => K[c.charCodeAt(0) - 0xE000]).replace(/[ØøÆæĐđŁłðÞ]/g, c => PIXC[c]); }
function text(t, x, y, col = '#f3ead6', size = 8, align = 'left', shadow = '#000', maxW = 0) {
  t = pixSafe(t);
  ctx.font = `${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'top';
  if (maxW) {
    while (size > 6 && ctx.measureText(t).width > maxW) { size--; ctx.font = `${size}px ${FONT}`; }
    while (t.length > 3 && ctx.measureText(t).width > maxW) t = t.slice(0, -2) + '.';
  }
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(t, x + Math.max(1, size / 8), y + Math.max(1, size / 8)); }
  ctx.fillStyle = col; ctx.fillText(t, x, y);
}
function bigText(t, x, y, size, col, depth = 4) {
  t = pixSafe(t);
  ctx.font = `${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let i = depth; i > 0; i--) { ctx.fillStyle = i === depth ? '#000' : shade(col === '#ffffff' || col === '#f4f4f0' ? '#9a9aa8' : col, 0.45); ctx.fillText(t, x + i, y + i); }
  ctx.fillStyle = OUTLINE; for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) ctx.fillText(t, x + dx, y + dy);
  ctx.fillStyle = col; ctx.fillText(t, x, y);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.save(); ctx.beginPath(); ctx.rect(x - 400, y, 800, size * 0.35); ctx.clip(); ctx.fillText(t, x, y); ctx.restore();
}
function pstar(x, y) { rect(x + 3, y, 2, 2, '#0c0a12'); rect(x, y + 2, 8, 2, '#0c0a12'); rect(x + 1, y + 4, 6, 2, '#0c0a12'); rect(x + 1, y + 6, 2, 2, '#0c0a12'); rect(x + 5, y + 6, 2, 2, '#0c0a12'); }
const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const tcol = t => { const c = kit(t).c1; return lum(c) > 0.85 ? '#e8e8e0' : c; };

// Touch: Kamera-Anschlag beim eigenen Angriff aus der echten Lage von Knöpfen und Stick (#41). Hat dein Team den Ball, fährt die
// Kamera am Spielfeldende so weit, dass das angegriffene Tor samt etwas Netz links der Knöpfe auf Torhöhe liegt (rechtes Tor) bzw.
// rechts vom Stick (linkes Tor). Auf schmalen Handys (16:9, Sicherheitsabstände) reichte der feste Anschlag nicht. In der Abwehr
// bleibt der Anschlag wie bisher. Gemessen wird nur, wenn sich Bild, Fenster oder Knopfgröße ändern.
let CAMLIM = { key: '' };
function camLimits() {
  const lo = camHalf() - 3, hi = CW - camHalf() + 3;
  if (!TOUCHDEV || !document.body.classList.contains('touch')) return [lo, hi];
  const key = `${W}|${innerWidth}|${innerHeight}|${SETTINGS.btn}`;
  if (CAMLIM.key === key) return CAMLIM.v;
  const pad = document.getElementById('pad'), cr = cv.getBoundingClientRect();
  if (!pad || !pad.getBoundingClientRect().width || !cr.width) return [lo, hi];   // Steuerung gerade nicht zu sehen: nicht merken
  const k = cr.width / W, kk = kOf(GY2), M = 6;                                 // CSS-Pixel je Leinwand-Pixel; vorderer Pfosten am breitesten
  const top = cr.top + sy(GY1, GH) * k, bot = cr.top + sy(GY2) * k;             // Tor auf dem Bildschirm, von oben bis zum Boden
  const onGoal = q => q.width && q.bottom > top && q.top < bot;
  const btn = [...pad.querySelectorAll('.tb')].map(e => e.getBoundingClientRect()).filter(onGoal), st = document.getElementById('stick').getBoundingClientRect();
  let l = lo, h = hi;
  if (btn.length) { const T = (Math.min(...btn.map(q => q.left)) - cr.left) / k - M; h = Math.max(hi, CW + 0.6 - (T - W / 2) / (PX * kk)); }
  if (onGoal(st)) { const T = (st.right - cr.left) / k + M; l = Math.min(lo, -0.6 - (T - W / 2) / (PX * kk)); }
  CAMLIM = { key, v: [Math.max(l, 4), Math.min(h, CW - 4)] };
  return CAMLIM.v;
}
function updateCamera() {
  const b = G.ball; let tgt;
  if (G.phase === 'intro') tgt = G.introT < 3.4 ? lerp(4, 36, ease(G.introT / 3.4)) : 20;
  else { const lead = G.poss >= 0 && G.phase === 'play' ? sgn(G.poss) * 3 : 0; tgt = b.x + lead; }
  const [lo, hi] = camLimits(), att = G.human >= 0 && G.poss === G.human ? sgn(G.human) : 0;
  tgt = clamp(tgt, att < 0 ? lo : camHalf() - 3, att > 0 ? hi : CW - camHalf() + 3);
  CAMX = G.phase === 'intro' ? tgt : lerp(CAMX, tgt, 0.075);
}
function render() {
  const rp = G.phase === 'replay' && G.replay ? G.replay[Math.min(G.replay.length - 1, Math.floor(G.rp))] : null;
  if (rp) CAMX = rp.c; else updateCamera();
  ctx.save();
  if (G.shake > 0 && !rp) ctx.translate(Math.round(rnd(-3, 3) * G.shake * 4), Math.round(rnd(-2, 2) * G.shake * 4));
  drawArenaBack(G.t, G.excite);
  drawFloor();
  drawBench(G.t);
  drawNet(0, G.netKick[0]); drawNet(CW, G.netKick[1]);
  drawRefs(G.t, false);
  const ents = [];
  G.players.forEach((p, i) => {
    const s = rp ? rp.p[i] : null;
    const v = s ? { x: s[0], y: s[1], z: s[2], face: s[3], pose: s[4], fr: s[5], out: s[6] } : p;
    if (v.out) { const bx = (p.team === 0 ? 13.5 : 26.5) + (p.i - 3) * 0.5; ents.push({ y: -1.1, d: () => drawPlayerAt(p, { x: bx, y: -1.1, z: 0, face: 1, pose: 'sit', fr: 0, out: 1 }, false) }); return; }
    ents.push({ y: v.y, d: () => drawPlayerAt(p, v, !rp && p === G.ctrl && G.phase !== 'intro') });
  });
  const bb = rp ? rp.b : [G.ball.x, G.ball.y, G.ball.z];
  ents.push({ y: bb[1] + 0.03, d: () => drawBall(bb, rp ? null : G.ball.trail) });
  for (const gx of [0, CW]) { ents.push({ y: GY1, d: () => drawPost(gx, GY1, true) }); ents.push({ y: GY2, d: () => drawPost(gx, GY2, false) }); }
  ents.sort((a, c) => a.y - c.y).forEach(e => e.d());
  drawRefs(G.t, true);
  drawParts();
  drawLightCones(G.t);
  drawFront();
  ctx.restore();
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${G.flash * 0.6})`; ctx.fillRect(0, 0, W, H); }
  if (G.demo) return;
  if (rp) return replayHud();
  if (G.phase === 'intro') return introHud();
  hud();
  if (G.phase === 'halftime') halftimeHud();
}
function scoreBug() {
  const x = 10, y = 8, T0 = TEAMS[G.tid[0]], T1 = TEAMS[G.tid[1]];
  rect(x, y, 252, 18, 'rgba(8,7,14,0.92)'); rect(x, y + 18, 252, 2, '#ffc83a');
  rect(x + 2, y + 2, 4, 14, tcol(0)); text(T0.k, x + 10, y + 5, '#f3ead6', 8, 'left', null);
  rect(x + 44, y, 26, 18, '#f3ead6'); text(String(G.score[0]), x + 57, y + 5, '#0c0a12', 8, 'center', null);
  rect(x + 71, y, 26, 18, '#f3ead6'); text(String(G.score[1]), x + 84, y + 5, '#0c0a12', 8, 'center', null);
  text(T1.k, x + 102, y + 5, '#f3ead6', 8, 'left', null); rect(x + 132, y + 2, 4, 14, tcol(1));
  const gm = Math.min(G.half * 30, gameMinute()), mm = Math.floor(gm), ss = Math.floor((gm - mm) * 60);
  text(`${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, x + 144, y + 5, '#ffc83a', 8, 'left', null);
  text(`${G.half}.HZ`, x + 200, y + 5, '#9b90ad', 8, 'left', null);
  if (Math.floor(G.t * 1.5) % 2) rect(x + 243, y + 7, 4, 4, '#ff3b3b');
  for (let t = 0; t < 2; t++) {
    const bx = x + (t ? 102 : 10), n = G.players.filter(p => p.team === t && p.out).length;
    for (let i = 0; i < n; i++) { rect(bx + i * 14, y + 23, 12, 10, '#e2372f'); text("2'", bx + 1 + i * 14, y + 24, '#fff', 8, 'left', null); }
    for (let i = 0; i < G.timeouts[t]; i++) rect(bx + 30 + i * 6, y + 25, 4, 4, '#3ddc84');
  }
  if (G.passiveWarn && G.phase === 'play' && Math.floor(G.t * 3) % 2) { rect(x + 144, y + 22, 64, 12, '#ffc83a'); text('PASSIV', x + 152, y + 24, '#0c0a12', 8, 'left', null); }
}
function radar() {
  const rw = 90, rh = 45, x0 = hudR() - rw - 10, y0 = 8, kx = rw / CW, ky = rh / CH;
  rect(x0 - 2, y0 - 2, rw + 4, rh + 4, 'rgba(8,7,14,0.85)'); rect(x0, y0, rw, rh, 'rgba(42,88,168,0.55)');
  rect(x0 + rw / 2, y0, 1, rh, 'rgba(255,255,255,0.4)');
  ctx.fillStyle = 'rgba(224,132,46,0.6)'; ctx.fillRect(x0, y0 + rh / 2 - 7 * ky * 1.4, 6 * kx, 14 * ky * 1.4 - 2); ctx.fillRect(x0 + rw - 6 * kx, y0 + rh / 2 - 7 * ky * 1.4, 6 * kx, 14 * ky * 1.4 - 2);
  const l = Math.max(0, (CAMX - VIEW_HALF) * kx), r = Math.min(rw, (CAMX + VIEW_HALF) * kx); rect(x0 + l, y0, r - l, 1, '#ffc83a'); rect(x0 + l, y0 + rh - 1, r - l, 1, '#ffc83a');   // Sichtbereich, auf die Karte begrenzt
  for (const p of G.players) if (!p.out) rect(x0 + p.x * kx - 1, y0 + p.y * ky - 1, 3, 3, p === G.ctrl ? '#ffc83a' : tcol(p.team));
  rect(x0 + G.ball.x * kx - 1, y0 + G.ball.y * ky - 1, 2, 2, '#fff');
}
function hud() {
  scoreBug(); radar();
  const b = G.ball, c = G.ctrl;
  if (c && !c.out && G.phase !== 'goal') {
    const x = sx(c.x, c.y), y = sy(c.y, c.z);
    if (b.owner === c || c.charging) text(`${c.num} ${c.name.toUpperCase()}`, x, y - 70, '#f3ead6', 8, 'center', '#000', 150);
    if (c.charging) {
      rect(x - 16, y - 62, 32, 5, OUTLINE); rect(x - 15, y - 61, Math.round(30 * c.charge), 3, c.charge > 0.92 ? '#ff4f3a' : c.charge > 0.6 ? '#ffc83a' : '#9cff57');
      // Zielkreuz am Tor
      const gx = goalX(c.team), ty = 10 + clamp(c.aim || 0, -1, 1) * 1.25, tz = 0.25 + c.charge * 1.5;
      const rx = sx(gx, ty), ry = sy(ty, tz), bl = Math.floor(G.t * 10) % 2 ? '#ffc83a' : '#ffffff';
      rect(rx - 6, ry, 4, 1, bl); rect(rx + 3, ry, 4, 1, bl); rect(rx, ry - 6, 1, 4, bl); rect(rx, ry + 3, 1, 4, bl);
      text(usePad() ? 'B=HEBER' : TOUCHDEV ? 'FINTE=HEBER' : 'D=HEBER', x, y - 82, '#7cf2ff', 8, 'center');
    }
    if (b.owner === c && IN.a && IN.aHeld > 0.32 && c.role !== 'TW') text('KEMPA!', x, y - 82, '#ff8bd1', 8, 'center');
    if (c.st < 0.98) { rect(x - 9, sy(c.y) + 5, 18, 3, OUTLINE); rect(x - 8, sy(c.y) + 6, Math.round(16 * c.st), 1, c.st > 0.35 ? '#9cff57' : '#ff4f3a'); }
  }
  const pp = G.passPrev;
  if (pp && !pp.out && b.owner === c) {
    const x = sx(pp.x, pp.y), y = sy(pp.y, pp.z) - 62 - (Math.floor(G.t * 5) % 2);
    rect(x - 5, y, 11, 2, '#7cf2ff'); rect(x - 3, y + 2, 7, 2, '#7cf2ff'); rect(x - 1, y + 4, 3, 2, '#7cf2ff');
    const g = sy(pp.y); ctx.fillStyle = 'rgba(124,242,255,0.8)'; ctx.fillRect(x - 9, g + 2, 4, 1); ctx.fillRect(x + 6, g + 2, 4, 1); ctx.fillRect(x - 9, g - 3, 4, 1); ctx.fillRect(x + 6, g - 3, 4, 1);
  }
  if (G.phase === 'penalty' && G.pen) {
    const sh = G.pen.shooter, gx = goalX(sh.team);
    if (G.human === sh.team) {
      const ty = 10 + G.pen.aim * 1.25, tz = 0.25 + sh.charge * 1.5, rx = sx(gx, ty), ry = sy(ty, tz);
      rect(rx - 6, ry, 4, 1, '#ffc83a'); rect(rx + 3, ry, 4, 1, '#ffc83a'); rect(rx, ry - 6, 1, 4, '#ffc83a'); rect(rx, ry + 3, 1, 4, '#ffc83a');
      banner7('ZIELEN: HOCH/RUNTER · K HALTEN & LOSLASSEN');
    } else if (G.human >= 0) {
      banner7(G.pen.gkGuess ? `TORWART SPRINGT ${G.pen.gkGuess < 0 ? 'NACH HINTEN' : 'NACH VORNE'}` : 'TORWART: HOCH/RUNTER = ECKE RATEN');
      if (G.pen.gkGuess) { const g = G.goalie[G.human], ax = sx(g.x, g.y), ay = sy(10 + G.pen.gkGuess * 1.2, 1); rect(ax - 2, ay - 2, 5, 5, '#ffc83a'); }
    }
  }
  if (G.so && (G.shootout || G.soWinner !== undefined)) {
    const x0 = W / 2 - 60, y0 = 40; rect(x0 - 6, y0 - 4, 132, 34, 'rgba(8,7,14,0.88)');
    for (let t = 0; t < 2; t++) { text(TEAMS[G.tid[t]].k, x0, y0 + t * 14, '#f3ead6', 8, 'left', null); const r = G.so.r[t]; for (let i = 0; i < Math.max(5, r.length); i++) rect(x0 + 34 + i * 12, y0 + t * 14, 8, 8, i < r.length ? (r[i] ? '#9cff57' : '#ff4f3a') : '#3a2f4d'); }
  }
  drawBanner(); drawCut(); ticker();
}
function banner7(t) { ctx.font = `8px ${FONT}`; const w = ctx.measureText(t).width + 20; rect(W / 2 - w / 2, 300, w, 16, 'rgba(8,7,14,0.85)'); text(t, W / 2, 304, '#ffc83a', 8, 'center', null); }
function drawBanner() {
  const bn = G.banner; if (!bn) return;
  const e = ease(bn.t / 0.25), out = clamp((bn.t - bn.dur + 0.25) / 0.25, 0, 1);
  if (bn.big) {
    const size = bn.txt.length > 9 ? Math.min(28, Math.floor((W - 40) / bn.txt.length)) : 40, y = 116;   // lange Texte passen sich der Breite an
    const sc = easeBack(bn.t / 0.35);
    rect(0, y - 14, W * e, size + 36 + (bn.sub ? 14 : 0), 'rgba(8,7,14,0.7)');
    for (let i = 0; i < 6; i++) rect(((G.t * 300 + i * 110) % (W + 80)) - 80, y - 14, 40, 3, bn.col);
    rect(0, y + size + 19 + (bn.sub ? 14 : 0), W * e, 3, bn.col);
    ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(W / 2, y + size / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -(y + size / 2));
    bigText(bn.txt, W / 2, y, size, bn.col === '#f4f4f0' ? '#ffffff' : bn.col, 5);
    ctx.restore();
    if (bn.sub && bn.t > 0.25) text(bn.sub.toUpperCase(), W / 2, y + size + 10, '#f3ead6', 8, 'center', '#000', W - 40);
  } else {
    const off = Math.round((1 - e) * -W + out * W), y = 92;
    rect(off, y, W, 24 + (bn.sub ? 12 : 0), 'rgba(8,7,14,0.72)'); rect(off, y, W, 2, bn.col);
    bigText(bn.txt, W / 2 + off, y + 5, 16, bn.col, 2);
    if (bn.sub) text(bn.sub, W / 2 + off, y + 24, '#f3ead6', 8, 'center', '#000', W - 40);
  }
}
function card(p, x, y, title, col, extra) {
  const k = kit(p.team), w = 250, h = 74, tw = w - 88;
  rect(x + 4, y + 4, w, h, 'rgba(0,0,0,0.5)'); rect(x, y, w, h, OUTLINE); rect(x + 2, y + 2, w - 4, h - 4, '#14111d');
  rect(x + 2, y + 2, 72, h - 4, shade(k.c1, 0.5));
  ctx.imageSmoothingEnabled = false; ctx.drawImage(portrait(p, k), x + 4, y + 2, 70, 70);
  rect(x + 76, y + 6, w - 82, 14, col); text(title, x + 80, y + 9, lum(col) > 0.6 ? '#0c0a12' : '#ffffff', 8, 'left', null, tw);
  text(`#${p.num} ${p.name.toUpperCase()}`, x + 80, y + 27, '#f3ead6', 8, 'left', '#000', tw);
  text(ROLE_LONG[p.role].toUpperCase(), x + 80, y + 41, '#9b90ad', 8, 'left', null, tw);
  text(extra, x + 80, y + 55, '#ffc83a', 8, 'left', null, tw);
  if (p.star) { rect(x + 60, y + 6, 10, 10, '#ffc83a'); pstar(x + 61, y + 7); }
}
function drawCut() {
  const c = G.cut; if (!c || c.t < 0.35) return;
  const e = ease((c.t - 0.35) / 0.3), out = clamp((c.t - c.dur + 0.3) / 0.3, 0, 1);
  const x = -270 + (280 * e) - out * 300, p = c.p;
  const extra = c.kind === 'goal' ? `${p.goals}. TOR (${p.goals}/${p.shots})` : c.kind === 'card' && c.title.startsWith('2') ? 'ZEITSTRAFE' : c.title === 'VERLETZT' ? 'WIRD AUSGEWECHSELT' : `${p.saves} PARADEN`;
  card(p, x, 214, c.title, c.col === '#f4f4f0' ? '#ffffff' : c.col, extra);
}
function ticker() {
  let tick = G.ticker.t > 0 ? G.ticker.txt : '';
  if (!tick && G.phase === 'kickoff' && G.half === 1 && G.score[0] + G.score[1] === 0) tick = usePad() ? 'A PASS  RB+A KEMPA  X WURF  B FINTE/KLAU  RB SPRINT  START PAUSE' : TOUCHDEV ? 'MITSPIELER ANTIPPEN = PASS  TOR ANTIPPEN = WURF  PASS LANG = KEMPA' : 'S PASS  A KEMPA  LEERTASTE WURF  D FINTE/KLAU  W SPRINT  T TIMEOUT';
  if (!tick) return;
  rect(0, H - 18, W, 18, 'rgba(8,7,14,0.88)'); rect(0, H - 18, 6, 18, '#ff4f3a'); rect(0, H - 19, W, 1, '#ffc83a');
  ctx.font = `8px ${FONT}`; while (ctx.measureText(tick).width > W - 24 && tick.length > 4) tick = tick.slice(0, -2) + '…';
  text(tick, 14, H - 12, '#f3ead6', 8, 'left', null);
}
function replayHud() {
  rect(0, 0, W, 24, '#000'); rect(0, H - 24, W, 24, '#000');
  if (Math.floor(G.t * 2) % 2) rect(12, 8, 8, 8, '#e2372f');
  text('WIEDERHOLUNG', 26, 8, '#f3ead6', 8, 'left', null); text('ZEITLUPE', hudR() - 12, 8, '#9b90ad', 8, 'right', null);
  text(`${usePad() ? 'A' : TOUCHDEV ? 'TIPPEN' : 'TASTE'} = WEITER`, W - 12, H - 16, '#9b90ad', 8, 'right', null);
  const m = G.replayMeta || {}; if (m.scorer) text(`${m.kempa ? 'KEMPA-TOR' : 'TOR'}: #${m.scorer.num} ${m.scorer.name.toUpperCase()}`, 12, H - 16, '#ffc83a', 8, 'left', null);
  const yy = (G.t * 90) % H; rect(0, yy, W, 2, 'rgba(255,255,255,0.07)');
  for (let i = 0; i < 30; i++) rect(Math.random() * W, 24 + Math.random() * (H - 48), 1, 1, 'rgba(255,255,255,0.25)');
}
function introHud() {
  const t = G.introT, T0 = TEAMS[G.tid[0]], T1 = TEAMS[G.tid[1]];
  rect(0, 0, W, 20, '#000'); rect(0, H - 20, W, 20, '#000');
  text('LIVE', 14, 6, '#ff3b3b', 8, 'left', null); text(G.label || lgName(G.lg), hudR() - 14, 6, '#9b90ad', 8, 'right', null);
  text(`${usePad() ? 'A' : TOUCHDEV ? 'TIPPEN' : 'TASTE'} = ÜBERSPRINGEN`, W / 2, H - 14, '#6e6680', 8, 'center', null);
  if (t < 3.6) {
    const e = ease(t / 0.6), o = clamp((t - 3.1) / 0.5, 0, 1);
    ctx.globalAlpha = 1 - o;
    rect(0, 120, W * e, 44, tcol(0)); rect(W - W * e, 166, W, 44, tcol(1));
    bigText(T0.n.toUpperCase(), W / 2 - (1 - e) * 300, 134, clamp(Math.floor((W - 60) / T0.n.length), 8, 16), lum(tcol(0)) > 0.7 ? '#16161a' : '#ffffff', 2);
    bigText(T1.n.toUpperCase(), W / 2 + (1 - e) * 300, 180, clamp(Math.floor((W - 60) / T1.n.length), 8, 16), lum(tcol(1)) > 0.7 ? '#16161a' : '#ffffff', 2);
    if (t > 0.6) { rect(W / 2 - 22, 152, 44, 26, OUTLINE); bigText('VS', W / 2, 157, 16, '#ffc83a', 2); }
    if (G.event) { const e2 = ease(t / 0.8); ctx.globalAlpha = (1 - o) * e2; bigText(G.event.title, W / 2, 56, 24, '#ffc83a', 3); rect(W / 2 - G.event.stage.length * 4 - 10, 87, G.event.stage.length * 8 + 20, 17, 'rgba(8,7,14,0.85)'); text(G.event.stage, W / 2, 92, '#f3ead6', 8, 'center', null); ctx.globalAlpha = 1 - o; }
    ctx.globalAlpha = 1;
    return;
  }
  const team = t < 7.6 ? 0 : 1, t0 = team ? 7.6 : 3.6, lt = t - t0;
  const ps = G.players.filter(p => p.team === team);
  rect(0, 40, W, 22, 'rgba(8,7,14,0.85)'); rect(0, 40, 8, 22, tcol(team));
  text(`AUFSTELLUNG ${TEAMS[G.tid[team]].n.toUpperCase()}`, 20, 47, '#f3ead6', 8, 'left', null, 440);
  text(`DECKUNG ${DEF_SYS[G.tact[team]].n}`, hudR() - 14, 47, '#ffc83a', 8, 'right', null);
  ps.forEach((p, i) => {
    const e = ease((lt - i * 0.18) / 0.35); if (e <= 0) return;
    const col = i < 4 ? i : i - 4, row = i < 4 ? 0 : 1, cw = 150;
    const x = (W - 640) / 2 + (row ? 90 : 14) + col * (cw + 6) + (1 - e) * 400, y = 72 + row * 112;   // mittig, auch bei breitem Spielfeld
    rect(x + 3, y + 3, cw, 104, 'rgba(0,0,0,0.5)'); rect(x, y, cw, 104, OUTLINE); rect(x + 2, y + 2, cw - 4, 100, '#14111d');
    rect(x + 2, y + 2, cw - 4, 64, shade(kit(team).c1, 0.45));
    ctx.drawImage(portrait(p, kit(team)), x + cw / 2 - 30, y + 4, 60, 60);
    if (p.star) { rect(x + 6, y + 6, 12, 12, '#ffc83a'); pstar(x + 8, y + 8); }
    text(String(p.num), x + cw - 8, y + 8, '#ffffff', 16, 'right');
    text(p.name.toUpperCase(), x + cw / 2, y + 70, '#f3ead6', 8, 'center', '#000', cw - 10);
    text(ROLE_LONG[p.role].toUpperCase(), x + cw / 2, y + 82, '#9b90ad', 8, 'center', null, cw - 10);
    text(p.trait ? p.trait.toUpperCase() : `${p.role === 'TW' ? 'TOR' : 'WURF'} ${p.role === 'TW' ? p.gk : p.att}`, x + cw / 2, y + 93, p.trait ? '#ffc83a' : '#6e6680', 8, 'center', null);
  });
}
function halftimeHud() {
  const e = ease(G.phaseT / 0.5), x = W / 2 - 180, y = 60 + (1 - e) * 300, s = G.stats;
  rect(x + 5, y + 5, 360, 236, 'rgba(0,0,0,0.6)'); rect(x, y, 360, 236, OUTLINE); rect(x + 2, y + 2, 356, 232, '#14111d');
  rect(x + 2, y + 2, 356, 30, '#ffc83a'); bigText('HALBZEIT', W / 2, y + 9, 16, '#0c0a12', 0);
  rect(x + 2, y + 34, 178, 26, tcol(0)); rect(x + 180, y + 34, 178, 26, tcol(1));
  text(`${TEAMS[G.tid[0]].k}  ${G.score[0]}`, x + 20, y + 43, lum(tcol(0)) > 0.7 ? '#0c0a12' : '#fff', 8);
  text(`${G.score[1]}  ${TEAMS[G.tid[1]].k}`, x + 340, y + 43, lum(tcol(1)) > 0.7 ? '#0c0a12' : '#fff', 8, 'right');
  const q = t => s.shots[t] ? Math.round(s.goals[t] / s.shots[t] * 100) + '%' : '–';
  const rows = [['WÜRFE', s.shots[0], s.shots[1]], ['WURFQUOTE', q(0), q(1)], ['PARADEN', s.saves[0], s.saves[1]], ['BALLGEWINNE', s.steals[0], s.steals[1]], ['7-METER', s.seven[0], s.seven[1]], ['ZEITSTRAFEN', s.susp[0], s.susp[1]]];
  rows.forEach((r, i) => {
    const yy = y + 72 + i * 20; rect(x + 10, yy - 4, 340, 1, '#2a2438');
    text(String(r[1]), x + 30, yy, '#f3ead6', 8, 'left', null); text(r[0], W / 2, yy, '#9b90ad', 8, 'center', null); text(String(r[2]), x + 330, yy, '#f3ead6', 8, 'right', null);
  });
  const best = t => G.players.filter(p => p.team === t).sort((a, b) => b.goals - a.goals)[0];
  const b0 = best(0), b1 = best(1);
  text(`TOP: ${b0.name} ${b0.goals}`, x + 14, y + 200, '#ffc83a', 8, 'left', null, 160); text(`${b1.name} ${b1.goals}`, x + 346, y + 200, '#ffc83a', 8, 'right', null, 160);
  text(`${usePad() ? 'A' : TOUCHDEV ? 'TIPPEN' : 'TASTE'} = 2. HALBZEIT`, W / 2, y + 218, '#6e6680', 8, 'center', null);
}
