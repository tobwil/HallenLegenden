// ================= Effekte: Partikel, Tore, Ball, Spieler-Zeichnung =================
function burst(x, y, z, col, n = 6, sp = 2.5) {
  return Array.from({ length: n }, () => ({ x, y, z, vx: rnd(-sp, sp), vy: rnd(-sp, sp) * 0.5, vz: rnd(1, sp * 1.4), col, life: rnd(0.25, 0.55), t: 0, sz: 2 }));
}
function confetti(gx, cols) {
  return Array.from({ length: 70 }, () => ({ x: gx + rnd(-4, 4), y: rnd(2, 18), z: rnd(4, 8), vx: rnd(-1.5, 1.5), vy: rnd(-1, 1), vz: rnd(-0.5, 2), col: pick(cols), life: rnd(1.6, 3), t: 0, sz: 2, conf: true, ph: rnd(0, 6) }));
}
function updateParts(dt) {
  for (const q of G.parts) {
    q.t += dt;
    if (q.conf) { q.vz = Math.max(q.vz - 3 * dt, -1.2); q.x += (q.vx + Math.sin(q.t * 5 + q.ph) * 0.8) * dt; }
    else { q.vz -= GRAV * dt; q.x += q.vx * dt; }
    q.y += q.vy * dt; q.z = Math.max(0, q.z + q.vz * dt);
  }
  G.parts = G.parts.filter(q => q.t < q.life);
}
function drawParts() {
  for (const q of G.parts) {
    const a = 1 - q.t / q.life; ctx.globalAlpha = clamp(a * 1.5, 0, 1);
    ctx.fillStyle = q.col;
    const w = q.conf ? (Math.sin(q.t * 9 + q.ph) > 0 ? 2 : 1) : q.sz;
    ctx.fillRect(sx(q.x, q.y), sy(q.y, q.z), w, 2);
  }
  ctx.globalAlpha = 1;
}
function linePix(x1, y1, x2, y2, c) {
  const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) | 0; ctx.fillStyle = c;
  for (let i = 0; i <= n; i++) { const t = n ? i / n : 0; ctx.fillRect(Math.round(lerp(x1, x2, t)), Math.round(lerp(y1, y2, t)), 1, 1); }
}
const P3 = (x, y, z) => [sx(x, y), sy(y, z)];
// Tornetz mit Ausbeulung beim Treffer
function drawNet(gx, kick) {
  const o = gx === 0 ? -1 : 1, c = 'rgba(235,235,245,0.5)', bulge = kick * 0.6;
  const back = (y, z) => { const bz = Math.sin(clamp((y - GY1) / 3, 0, 1) * Math.PI) * Math.sin(clamp(z / 1.8, 0, 1) * Math.PI); return gx + o * (lerp(1.0, 0.8, z / 1.8) + bulge * bz); };
  ctx.fillStyle = 'rgba(10,10,20,0.35)';
  const q = [P3(gx, GY1, 0), P3(back(GY1, 0), GY1, 0), P3(back(GY2, 0), GY2, 0), P3(gx, GY2, 0)];
  ctx.beginPath(); ctx.moveTo(...q[0]); q.forEach(v => ctx.lineTo(...v)); ctx.fill();
  for (let y = GY1; y <= GY2 + 0.01; y += 0.25) {
    let prev = null; for (let z = 0; z <= 1.81; z += 0.3) { const pt = P3(back(y, z), y, z); if (prev) linePix(...prev, ...pt, c); prev = pt; }
    linePix(...P3(gx, y, 2), ...P3(back(y, 1.8), y, 1.8), c);
  }
  for (let z = 0; z <= 1.81; z += 0.3) { let prev = null; for (let y = GY1; y <= GY2 + 0.01; y += 0.25) { const pt = P3(back(y, z), y, z); if (prev) linePix(...prev, ...pt, c); prev = pt; } }
  for (const y of [GY1, GY2]) for (let z = 0; z <= 1.81; z += 0.45) linePix(...P3(gx, y, z), ...P3(back(y, z), y, z), c);
}
function drawPost(gx, y, bar) {
  const x = sx(gx, y) - 1;
  for (let i = 0; i < 10; i++) { const y0 = sy(y, (i + 1) * 0.2), h = sy(y, i * 0.2) - y0; ctx.fillStyle = i % 2 ? '#f4f1ea' : '#e2372f'; ctx.fillRect(x, y0, 3, h); }
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 2, sy(y, 2), 1, sy(y, 0) - sy(y, 2));
  if (bar) {
    const y0 = sy(GY1, 2), y1 = sy(GY2, 2), x0 = sx(gx, GY1), x1 = sx(gx, GY2);
    for (let yy = y0; yy <= y1; yy++) { const t = (yy - y0) / (y1 - y0); ctx.fillStyle = Math.floor(t * 15) % 2 ? '#f4f1ea' : '#e2372f'; ctx.fillRect(Math.round(lerp(x0, x1, t)) - 1, yy - 2, 3, 3); }
  }
}
function drawBall(b, trail) {
  const x = sx(b[0], b[1]), g = sy(b[1]), y = sy(b[1], b[2]);
  const sh = clamp(1 - b[2] / 4, 0.3, 1);
  ctx.fillStyle = `rgba(0,0,0,${0.4 * sh})`; ctx.fillRect(x - 3, g - 1, 6, 2);
  if (trail) trail.forEach((t, i) => { ctx.globalAlpha = (i + 1) / trail.length * 0.5; ctx.fillStyle = '#ffd56a'; ctx.fillRect(sx(t[0], t[1]) - 1, sy(t[1], t[2]) - 2, 3, 3); });
  ctx.globalAlpha = 1;
  ctx.fillStyle = OUTLINE; ctx.fillRect(x - 3, y - 4, 6, 6); ctx.fillRect(x - 2, y - 5, 4, 8);
  ctx.fillStyle = '#f6f2e4'; ctx.fillRect(x - 2, y - 4, 4, 6); ctx.fillRect(x - 3, y - 3, 6, 4);
  ctx.fillStyle = '#2bb3e8'; ctx.fillRect(x - 2, y - 3, 2, 2); ctx.fillStyle = '#ffcc00'; ctx.fillRect(x + 1, y - 1, 1, 3); ctx.fillStyle = '#e2372f'; ctx.fillRect(x - 3, y, 2, 1);
  ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 4, 1, 1);
}
function drawPlayerAt(p, v, sel) {
  const x = sx(v.x, v.y), gy = sy(v.y), y = sy(v.y, v.z);
  const look = p.look;
  // Schatten
  const sh = clamp(1 - v.z / 1.5, 0.35, 1);
  ctx.fillStyle = `rgba(0,0,0,${0.38 * sh})`; ctx.fillRect(x - 7, gy - 1, 14, 3); ctx.fillRect(x - 5, gy - 2, 10, 5);
  if (sel) { const c = '#ffc83a', b = Math.floor(G.t * 4) % 2; ctx.fillStyle = c; ctx.fillRect(x - 10, gy - 1, 3, 2); ctx.fillRect(x + 8, gy - 1, 3, 2); ctx.fillRect(x - 7, gy + 2 + b, 15, 1); ctx.fillRect(x - 7, gy - 3 - b, 15, 1); }
  const flip = v.face < 0;
  let img = v.pose === 'lie' ? lieSprite(look) : sprite(look, v.pose, v.fr, flip);
  // Spiegelung auf dem Hallenboden
  if (!v.out && v.pose !== 'lie') {
    ctx.save(); ctx.globalAlpha = 0.13; ctx.translate(x, gy + (gy - y) + 1); ctx.scale(1, -1);
    ctx.drawImage(img, -AX, -AY); ctx.restore();
  }
  ctx.save(); ctx.translate(x, y + 1); if (flip && v.pose === 'lie') ctx.scale(-1, 1);
  if (v.pose === 'lie') ctx.drawImage(img, -SH / 2, -SW + 4); else ctx.drawImage(img, -AX, -AY - 1);
  ctx.restore();
  if (p.star && !G.replay) { ctx.fillStyle = '#ffc83a'; const tx = x - 2, ty = y - 50; ctx.fillRect(tx + 1, ty, 1, 1); ctx.fillRect(tx, ty + 1, 3, 1); ctx.fillRect(tx + 1, ty + 2, 1, 1); }
  if (sel) { const ty = y - 56 - Math.floor(G.t * 4) % 2; ctx.fillStyle = OUTLINE; ctx.fillRect(x - 4, ty - 1, 9, 5); ctx.fillStyle = '#ffc83a'; ctx.fillRect(x - 3, ty, 7, 1); ctx.fillRect(x - 2, ty + 1, 5, 1); ctx.fillRect(x - 1, ty + 2, 3, 1); ctx.fillRect(x, ty + 3, 1, 1); }
}
// Spielerbank & Offizielle (hinter der Seitenlinie)
function drawBench(t) {
  for (let team = 0; team < 2; team++) {
    const bx = team === 0 ? 13.5 : 26.5;
    const y = -1.15, x0 = sx(bx - 2.2, y), x1 = sx(bx + 2.2, y), yy = sy(y);
    ctx.fillStyle = '#2a2f40'; ctx.fillRect(x0, yy - 8, x1 - x0, 6); ctx.fillStyle = '#3a4156'; ctx.fillRect(x0, yy - 9, x1 - x0, 2);
    const k = kit(team);
    for (let i = 0; i < 6; i++) {
      const px = Math.round(lerp(x0 + 4, x1 - 6, i / 5)), jump = G.excite > 1 && G.lastScorer && G.lastScorer.team === team ? (Math.floor(t * 8 + i) % 2) * 3 : 0;
      ctx.fillStyle = OUTLINE; ctx.fillRect(px - 1, yy - 17 - jump, 7, 11);
      ctx.fillStyle = shade(k.c1, 0.85); ctx.fillRect(px, yy - 12 - jump, 5, 6);
      ctx.fillStyle = SKIN[(i + team * 2) % 5][0]; ctx.fillRect(px + 1, yy - 16 - jump, 3, 4);
    }
    // Trainer an der Seitenlinie, gestikulierend
    const cx = sx(bx + (team ? -3 : 3), -0.5), cyy = sy(-0.5), arm = Math.sin(t * 3 + team) > 0.3 ? -4 : 0;
    ctx.fillStyle = OUTLINE; ctx.fillRect(cx - 3, cyy - 22, 8, 22);
    ctx.fillStyle = '#20232c'; ctx.fillRect(cx - 2, cyy - 15, 6, 14); ctx.fillStyle = k.c1; ctx.fillRect(cx - 2, cyy - 15, 6, 2);
    ctx.fillStyle = '#e0ac7e'; ctx.fillRect(cx - 1, cyy - 21, 4, 5); ctx.fillRect(cx + 4, cyy - 14 + arm, 2, 5);
    ctx.fillStyle = '#7a7a7a'; ctx.fillRect(cx - 1, cyy - 21, 4, 1);
  }
  // Kampfgericht
  const x0 = sx(18.6, -1.2), x1 = sx(21.4, -1.2), yy = sy(-1.2);
  ctx.fillStyle = '#3a3f52'; ctx.fillRect(x0, yy - 9, x1 - x0, 8); ctx.fillStyle = '#ffc83a'; ctx.fillRect(x0 + 2, yy - 7, x1 - x0 - 4, 1);
  ctx.fillStyle = '#d9d2c0'; ctx.fillRect(x0 + 8, yy - 15, 4, 6); ctx.fillRect(x1 - 12, yy - 15, 4, 6);
}
// Schiedsrichter (zwei: Feld- und Torschiedsrichter)
const REF_LOOK = [0, 1].map(i => ({ gk: false, jer: '#2bd6c4', jerS: '#1d9a8d', jerH: '#8ff3e8', trim: '#16161c', sho: '#16161c', sock: '#16161c', shoe: '#16161c',
  skin: SKIN[i ? 3 : 1][0], skinS: SKIN[i ? 3 : 1][1], hair: i ? '#1a1a1a' : '#8a8478', style: i ? 1 : 3, beard: !i, band: false, num: i ? 2 : 1, numCol: '#16161c', tall: false, key: 'ref' + i }));
function drawRefs(t, near) {
  if (!G || G.phase === 'intro') return;
  const b = G.ball, s = G.poss >= 0 ? sgn(G.poss) : 1;
  G.refs = G.refs || [{ x: 20, y: 1.5 }, { x: 30, y: 18.5 }];
  const targets = [[clamp(b.x - s * 5, 3, 37), 1.2], [clamp(goalX(Math.max(0, G.poss)) - s * 3, 2, 38), 18.6]];
  G.refs.forEach((r, i) => {
    if (!near) { r.x = lerp(r.x, targets[i][0], 0.02); r.y = lerp(r.y, targets[i][1], 0.02); }
    if ((r.y > 10) !== !!near) return;
    const x = sx(r.x, r.y), y = sy(r.y), raise = (G.passiveWarn && i === 0) || G.phase === 'whistle';
    const mv = Math.hypot(targets[i][0] - r.x, targets[i][1] - r.y) > 0.3;
    r.anim = (r.anim || 0) + (mv ? 0.25 : 0); r.face = targets[i][0] > r.x + 0.05 ? 1 : targets[i][0] < r.x - 0.05 ? -1 : (r.face || 1);
    const pose = raise ? 'wind' : mv ? 'run' : 'idle', fr = mv ? Math.floor(r.anim) % 6 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - 6, y - 1, 12, 3);
    ctx.drawImage(sprite(REF_LOOK[i], pose, fr, r.face < 0), x - AX, y - AY);
  });
}
