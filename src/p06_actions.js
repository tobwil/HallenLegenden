// ================= Aktionen: Pass, Kempa, Wurf, Heber, Finte, Klauen, Fouls =================
function launch(fx, fy, fz, tx, ty, tz, speed) {
  const b = G.ball, d = Math.hypot(tx - fx, ty - fy), t = Math.max(d / speed, 0.12);
  b.x = fx; b.y = fy; b.z = fz; b.vx = (tx - fx) / t; b.vy = (ty - fy) / t; b.vz = (tz - fz + 0.5 * GRAV * t * t) / t;
  b.state = 'air'; b.owner = null; b.tried = new Set(); b.trail = [];
}
const openness = q => { let m = 9; for (const o of fieldOpps(q)) m = Math.min(m, dist(q.x, q.y, o.x, o.y)); return m; };
function laneOpen(p, tx, ty) { let m = 9; for (const o of fieldOpps(p)) if (dist(o.x, o.y, p.x, p.y) > 0.3) m = Math.min(m, segDist(o.x, o.y, p.x, p.y, tx, ty)); return m; }
const pressure = p => Math.min(9, ...fieldOpps(p).map(o => dist(o.x, o.y, p.x, p.y)));
function choosePass(p, dx, dy, det = false, cone = 0.62) {
  let best = null, bs = -1e9; const hasDir = Math.hypot(dx, dy) > 0.3, gx = goalX(p.team);
  for (const q of mates(p)) {
    if (q.role === 'TW' && G.possT > 0.5) continue;
    const d = dist(p.x, p.y, q.x, q.y); if (d < 1.2) continue;
    let sc;
    if (hasDir) { const dot = ((q.x - p.x) * dx + (q.y - p.y) * dy) / d / Math.hypot(dx, dy); if (dot < cone) continue; sc = dot * 6 - d * 0.04 + openness(q) * 0.15; }
    else sc = openness(q) * 0.8 - goalDist(q.x, q.y, gx) * 0.16 - d * 0.03 + laneOpen(p, q.x, q.y) * 0.7 + (det ? 0 : rnd(0, 0.7)) + (q.star ? 0.4 : 0);
    if (sc > bs) { bs = sc; best = q; }
  }
  // Pass in Laufrichtung: erst ein enger Kegel (~50°), dann ein weiter (~75°), sonst der beste freie Mitspieler
  return best || (hasDir ? (cone > 0.3 ? choosePass(p, dx, dy, det, 0.25) : choosePass(p, 0, 0, det)) : null);
}
function pass(p, q) {
  if (!q) return;
  const b = G.ball, d = dist(p.x, p.y, q.x, q.y), sp = d > 14 ? 18 : 13.5, t = d / sp;
  const tp = { x: clamp(q.x + q.vx * t * 0.85, 0.3, CW - 0.3), y: clamp(q.y + q.vy * t * 0.85, 0.3, CH - 0.3) };
  pushOut(tp, 6.4); const tx = tp.x, ty = tp.y;
  launch(p.x + p.face * 0.3, p.y, p.z + 1.5, tx, ty, 1.3, sp);
  b.passTo = q; b.shot = null; b.nc = p; b.ncT = 0.25; b.last = p; p.throwT = 0.22; p.hold = 0;
  q.tx = tx; q.ty = ty;
  G.recvSteer = null; if (G.human === p.team) { G.ctrl = q; G.recvLock = { p: q, x: IN.x, y: IN.y }; }   // beim Pass gehaltene Richtung steuert den Empfänger nicht
  AU.pass();
}
// Kempa-Trick: Lupfer in den Torraum, Mitspieler fängt im Sprung
function kempa(p) {
  const gx = goalX(p.team), s = sgn(p.team);
  const cands = mates(p).filter(q => q.role !== 'TW' && goalDist(q.x, q.y, gx) < 10.5 && q.z <= 0).sort((a, c) => openness(c) - openness(a));
  const q = cands[0]; if (!q) return pass(p, choosePass(p, 0, 0));
  const cy = clamp(q.y, GY1 - 3, GY2 + 3), ly = lerp(q.y, 10, 0.35), lx = gx - s * Math.max(3.6, Math.min(4.8, Math.abs(q.x - gx) * 0.6));
  launch(p.x, p.y, p.z + 1.8, lx, ly, 2.6, 9.5);
  const b = G.ball; b.passTo = q; b.lob = true; b.nc = p; b.ncT = 0.4; b.last = p; p.throwT = 0.25;
  q.tx = lx - s * 1.2; q.ty = ly; q.kempaRun = true;
  G.kempa = { by: p, to: q };
  if (G.human === p.team) G.ctrl = q;
  AU.pass(); say(`${p.name} lupft in den Kreis... KEMPA?`, 2);
}
function shoot(p, aimY, charge, lob = false) {
  const b = G.ball, gx = goalX(p.team), s = sgn(p.team), gk = G.goalie[1 - p.team];
  const d = goalDist(p.x, p.y, gx), wing = Math.abs(p.y - 10) > 6 && d < 9.5, close = d < 7.6;
  if (p.z <= 0.01 && G.phase !== 'penalty') {
    if (wing || close) { p.vz = 2.9; p.vx = s * 3.2; p.vy = (10 - p.y) * 0.25; p.fallShot = true; }
    else { p.vz = 3.9; p.vx = s * 1.7 + p.vx * 0.3; p.vy *= 0.3; p.shotJump = true; }
  }
  let ty, tz;
  if (aimY === null) {           // KI zielt in die freie Ecke
    const far = gk.y > 10 ? rnd(9.0, 9.5) : rnd(10.5, 11.0);
    ty = Math.random() < 0.8 ? far : rnd(9.3, 10.7);
    tz = Math.random() < 0.5 ? rnd(0.25, 0.7) : rnd(1.2, 1.65);
  } else { ty = 10 + clamp(aimY, -1, 1) * 1.25; tz = 0.25 + charge * 1.5; }
  const press = pressure(p);
  let err = (0.06 + d * 0.022) * (1.45 - p.att / 100) * (press < 1.2 ? 1.6 : 1) * (p.st < 0.25 ? 1.35 : 1) * (charge > 0.92 ? 1.3 : 1) * (p.energy < 0.5 ? 1.25 : 1) * (p.team === G.human && TOUCHDEV ? 0.8 : 1);
  if (G.phase === 'penalty') err *= 0.55;
  if (p.trait === 'Kanonier') err *= 0.85;
  ty += rnd(-1, 1) * err * 1.3; tz = Math.max(0.05, tz + rnd(-1, 1) * err * 0.8);
  let speed = 15 + charge * 10 + p.att / 100 * 4 + (p.trait === 'Kanonier' ? 3 : 0);
  if (lob) { speed = 8.5; tz = rnd(1.55, 1.85); ty = 10 + rnd(-0.6, 0.6); }
  launch(p.x + s * 0.3, p.y, p.z + 2.1, gx + s * 0.15, ty, tz, speed);
  b.shot = { by: p, team: p.team, speed, d, gkDone: false, lob, react: rnd(0.08, 0.2) * (1.3 - gk.gk / 200) * (G.human === gk.team ? 1 : DIFF[G.diff].react) * (lob ? 2.2 : 1), blocked: new Set() };
  if (d > 12) b.shot.react *= 0.45;
  b.passTo = null; b.nc = p; b.ncT = 0.4; b.last = p; p.throwT = 0.32; p.charge = 0; p.charging = false; p.shots++;
  G.stats.shots[p.team]++; G.possT = 0; G.excite = Math.max(G.excite, 0.6);
  AU.shot(charge); AU.crowd(0.13, 0.3); if (p.team === G.human) buzz(20);
  for (const o of fieldOpps(p)) {
    const ahead = (o.x - p.x) * s > -0.2, dd = dist(o.x, o.y, p.x, p.y);
    if (ahead && dd < 3 && o !== G.ctrl && Math.random() < o.df / 140 && o.z <= 0) { o.vz = 3.8; o.block = 0.6; }
  }
}
function feint(p, dx, dy) {
  if (p.cd > 0) return; p.cd = 1.0;
  let m = Math.hypot(dx, dy);
  if (m < 0.3) { dx = 0; dy = p.y < 10 ? 1 : -1; m = 1; }
  p.dash = 0.3; p.vx = dx / m * 8.5; p.vy = dy / m * 8.5;
  for (const o of fieldOpps(p)) if (dist(o.x, o.y, p.x, p.y) < 1.8 && Math.random() < 0.4 + (p.att - o.df) / 140) {
    o.stun = 0.75; G.parts.push(...burst(o.x, o.y, 1.9, '#ffffff', 5));
    if (G.human === p.team) banner('FINTE!', '#7cf2ff', `${p.name} lässt ${o.name} stehen`, 0.9);
  }
}
function steal(d, c) {
  if (d.cd > 0 || !c) return; d.cd = 0.75; d.throwT = 0.25; d.stealT = 0.3;
  if (dist(d.x, d.y, c.x, c.y) > 1.35) { d.cd = 0.35; return; }   // ins Leere: kein Strafstillstand
  const pr = 0.16 + (d.df - c.att) / 220 + (c.charging ? 0.15 : 0) + (G.human === d.team ? 0.05 + DIFF[G.diff].steal : 0);
  if (Math.random() < pr) {
    G.stats.steals[d.team]++; d.stealsN++;
    if (Math.random() < 0.55) { giveBall(d); banner('BALLGEWINN', '#9cff57', d.name, 1); say(pick([`${d.name} spitzelt den Ball weg!`, `Starke Abwehr von ${d.name}!`, `Ballverlust! ${d.name} ist dazwischen.`])); }
    else { const b = G.ball; b.owner = null; b.state = 'air'; b.x = c.x; b.y = c.y; b.z = 0.8; b.vx = (d.x - c.x) * 2 + rnd(-2, 2); b.vy = (d.y - c.y) * 2 + rnd(-2, 2); b.vz = 2; b.passTo = null; b.shot = null; b.last = d; b.nc = c; b.ncT = 0.3; b.tried = new Set(); }
    c.stun = 0.4;
  } else if (Math.random() < 0.42) foul(d, c);
  else d.stun = 0.35;
}
function foul(d, c) {
  const gx = goalX(c.team), s = sgn(c.team), dd = goalDist(c.x, c.y, gx);
  d.fouls++; AU.whistle(1); AU.foul(); if (c.team === 0 && !G.demo) AU.boo();
  c.lie = 0.7; c.vx = c.vy = 0; G.shake = Math.max(G.shake, 0.12);
  if (Math.random() < 0.05) { c.injured = true; c.lie = 1.6; G.cut = { kind: 'card', p: c, t: 0, dur: 2, title: 'VERLETZT', col: '#ff4f3a' }; say(`${c.name} bleibt liegen und muss raus.`); }
  let seven = false;
  if (dd < 8.6 && (c.x - gx) * -s > 0) seven = fieldOpps(c).filter(o => o !== d && segDist(o.x, o.y, c.x, c.y, gx, 10) < 1.0).length === 0;
  const suspend = Math.random() < (seven ? 0.35 : 0.11) || d.fouls >= 4;
  if (suspend) {
    d.out = 120 * G.halfLen / 1800; d.fouls = 0; G.stats.susp[d.team]++;
    if (G.ctrl === d) G.ctrl = null;
    G.cut = { kind: 'card', p: d, t: 0, dur: 2.2, title: '2 MINUTEN', col: '#ff4f3a' };
    say(`Zwei Minuten für ${d.name}. ${TEAMS[G.tid[c.team]].short} in Überzahl!`);
    if (!G.demo) AU.say(`Zwei Minuten Zeitstrafe für die Nummer ${d.num}, ${d.name}.`);
  }
  if (seven) { banner('7-METER!', '#ff4f3a', `Foul von ${d.name}`, 1.5, true); G.pending = { k: 'pen', team: c.team, t: suspend ? 2.2 : 1.4 }; if (!suspend) say(pick(['Klare Torchance zerstört, Siebenmeter!', 'Das gibt den Strafwurf!'])); }
  else { if (!suspend) banner('FREIWURF', '#ffc83a', '', 0.9); G.pending = { k: 'frei', team: c.team, x: c.x, y: c.y, who: c, t: suspend ? 2.0 : 0.8 }; }
  G.phase = 'whistle'; G.phaseT = 0;
}
function turnover(team, x, y, txt, sub = '') {
  AU.whistle(1); banner(txt, '#ffc83a', sub, 1.2); G.stats.tech[1 - team]++;
  G.pending = { k: 'frei', team, x, y, t: 0.9 }; G.phase = 'whistle'; G.phaseT = 0;
}
function callTimeout(team) {
  if (!G || G.phase !== 'play' || G.timeouts[team] <= 0 || G.poss !== team || !G.ball.owner) return false;
  G.timeouts[team]--; AU.whistle(1);
  G.phase = 'timeout'; G.phaseT = 0; G.toTeam = team;
  banner('TEAM-TIMEOUT', '#3ddc84', TEAMS[G.tid[team]].n, 1.6, true);
  if (G.human === team) setTimeout(() => { if (G && G.phase === 'timeout') showTactics(); }, 700);
  else { G.tact[team] = (G.score[team] < G.score[1 - team]) ? 2 : (G.tact[team] + 1) % 3; say(`${TEAMS[G.tid[team]].short} stellt um auf ${DEF_SYS[G.tact[team]].n}-Deckung.`); }
  return true;
}
