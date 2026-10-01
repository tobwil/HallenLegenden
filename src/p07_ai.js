// ================= KI, Torwart, Steuerung, Bewegung =================
const runSpeed = p => (4.4 + p.sp * 0.018) * (p.st < 0.2 ? 0.82 : 1) * (0.84 + 0.16 * (p.energy ?? 1));   // Erschöpfung (aus vorherigen Spielen und im Spielverlauf) bremst

function aiCarrier(p, dt) {
  const s = sgn(p.team), gx = goalX(p.team);
  if (G.phase !== 'play') return [p.x, p.y, false];
  if (p.airCatch) return [p.x, p.y, false];
  p.dec -= dt;
  if (p.role === 'TW') {
    if (p.hold > rnd(0.6, 1.1)) {
      const fwd = mates(p).filter(q => q.role !== 'TW' && openness(q) > 2.6 && laneOpen(p, q.x, q.y) > 1.2).sort((a, b) => (b.x - a.x) * s);
      pass(p, fwd.length && Math.random() < 0.75 ? fwd[0] : choosePass(p, 0, 0));
    }
    return [ownX(p.team) + s * 1.5, 10, false];
  }
  if (p.dec <= 0) {
    p.dec = rnd(0.12, 0.26) * (G.human >= 0 && G.human !== p.team ? DIFF[G.diff].react : 1);
    const d = goalDist(p.x, p.y, gx), lane = laneOpen(p, gx, 10), press = pressure(p);
    const wing = p.role === 'LA' || p.role === 'RA', r = Math.random();
    const defBack = fieldOpps(p).filter(o => goalDist(o.x, o.y, ownX(o.team)) < 10).length;
    // Tempogegenstoß: Abwehr noch nicht formiert
    if (defBack < 3 && d > 7) { p.tx = gx - s * 6.8; p.ty = lerp(p.y, 10, 0.5); return [p.tx, p.ty, true]; }
    if ((d < 9.6 && lane > 1.0 && r < 0.55) || (d < 7.4 && lane > 0.55 && r < 0.78) || (wing && d < 7.6 && r < 0.45) ||
        (G.possT > 24 && d < 12 && r < 0.5) || (d < 11.5 && lane > 2.2 && r < 0.28) || (p.trait === 'Kanonier' && d < 11 && lane > 1.4 && r < 0.4)) {
      const gk = G.goalie[1 - p.team];
      if (d < 8.5 && Math.abs(gk.x - ownX(gk.team)) > 1.4 && Math.random() < 0.3) shoot(p, null, 0.5, true);
      else shoot(p, null, clamp(rnd(0.25, 1.05), 0, 1));
      return [p.x, p.y, false];
    }
    if (press < 1.3 && r < 0.12 * p.att / 80) feint(p, 0, Math.random() < 0.5 ? -1 : 1);
    else if ((press < 1.05 && r < 0.6) || p.hold > p.patience) {
      const wingOpen = mates(p).find(q => (q.role === 'LA' || q.role === 'RA') && openness(q) > 2.5 && goalDist(q.x, q.y, gx) < 9);
      if (wingOpen && Math.random() < 0.06 * (p.pas / 80)) kempa(p); else pass(p, choosePass(p, 0, 0));
      return [p.x, p.y, false];
    }
    let ty = p.y + rnd(-2.5, 2.5) * (wing ? 0.3 : 1); ty = lerp(ty, 10, wing ? 0.05 : 0.25);
    const depth = wing ? 6.4 : rnd(6.6, 8.5), cy = clamp(ty, GY1, GY2), dy = ty - cy, dx = Math.sqrt(Math.max(0.5, depth * depth - dy * dy));
    p.tx = gx - s * dx; p.ty = clamp(ty, 0.5, CH - 0.5);
  }
  return [p.tx, p.ty, dist(p.x, p.y, p.tx, p.ty) > 5];
}
function aiTarget(p, dt) {
  const b = G.ball, own = b.owner;
  if (own === p) return aiCarrier(p, dt);
  if (b.passTo === p && b.state === 'air') {
    if (b.lob && p.z <= 0 && dist(p.x, p.y, b.x, b.y) < 2.6 && b.vz < 1.5 && b.z > 1.6) { p.vz = 4.3; p.vx = (b.x + b.vx * 0.35 - p.x) * 2; p.vy = (b.y + b.vy * 0.35 - p.y) * 2; }
    return [p.tx, p.ty, true];
  }
  const loose = !own && !b.passTo && !b.shot;
  if (loose && !(b.z < 1 && Math.hypot(b.vx, b.vy) < 1 && inArea(b.x, b.y))) {
    const px = b.x + b.vx * 0.25, py = b.y + b.vy * 0.25;
    const team = G.players.filter(q => q.team === p.team && !q.out && q.role !== 'TW' && q !== G.ctrl).sort((a, c) => dist(a.x, a.y, px, py) - dist(c.x, c.y, px, py));
    if (team[0] === p || (team[1] === p && dist(p.x, p.y, px, py) < 4)) return [px, py, true];
  }
  const attacking = own ? own.team === p.team : b.passTo ? b.passTo.team === p.team : G.poss === p.team;
  if (attacking) { const [x, y] = attackSpot(p); return [x, y, dist(p.x, p.y, x, y) > 4]; }
  const threat = own || b.passTo;
  if (threat && threat.team !== p.team) {
    const gx = ownX(p.team), team = G.players.filter(q => q.team === p.team && !q.out && q.role !== 'TW');
    const ctrlNear = G.ctrl && G.ctrl.team === p.team && dist(G.ctrl.x, G.ctrl.y, threat.x, threat.y) < 2.2;
    let presser = null, bd = 1e9;
    for (const q of team) if (q !== G.ctrl) { const d = dist(q.x, q.y, threat.x, threat.y); if (d < bd) { bd = d; presser = q; } }
    const td = goalDist(threat.x, threat.y, gx);
    if (presser === p && !ctrlNear && (td < 12.5 || bd < 3)) {
      const cy = clamp(threat.y, GY1, GY2), dd = Math.max(0.1, dist(threat.x, threat.y, gx, cy));
      const tx = threat.x + (gx - threat.x) / dd * 0.85, ty = threat.y + (cy - threat.y) / dd * 0.85;
      if (own && own === threat && dist(p.x, p.y, own.x, own.y) < 1.15 && p.cd <= 0 && Math.random() < dt * 0.45 * p.df / 80) steal(p, own);
      if (own && own.charging && dist(p.x, p.y, own.x, own.y) < 2.2 && p.z <= 0 && Math.random() < dt * 3) { p.vz = 3.8; p.block = 0.6; }
      return [tx, ty, true];
    }
  }
  const [x, y] = defendSpot(p);
  return [x, y, dist(p.x, p.y, x, y) > 3];
}
function updateGK(g, dt) {
  const b = G.ball, gx = ownX(g.team), s2 = gx === 0 ? 1 : -1;
  if (b.owner === g) { if (G.human === g.team && G.ctrl === g) return null; const t = aiCarrier(g, dt); return [t[0], t[1], false]; }
  if (b.shot && b.shot.team !== g.team && !b.shot.gkDone) {
    b.shot.react -= dt;
    if (b.shot.react <= 0 && Math.abs(b.vx) > 0.1) {
      const t = (g.x - b.x) / b.vx;
      if (t > 0) {
        let py = b.y + b.vy * t, pz = b.z + b.vz * t - 0.5 * GRAV * t * t;
        if (G.pen && G.pen.gkGuess && G.human === g.team) py = 10 + G.pen.gkGuess * 1.2;       // Spieler-Torwart rät beim 7-Meter
        if (!g.save) { g.save = 0.6; g.saveType = pz < 0.75 ? 'split' : 'star'; }
        return [g.x, clamp(py, GY1 - 0.4, GY2 + 0.4), true, 7.5];
      }
    }
    return [g.x, g.y, false];
  }
  if (!b.owner && !b.shot && goalDist(b.x, b.y, gx) < 6 && b.z < 1.6 && (!b.passTo || b.passTo.team === g.team || Math.hypot(b.vx, b.vy) < 3)) return [b.x, b.y, true];
  const vx = b.x - gx, vy = b.y - 10, m = Math.max(0.1, Math.hypot(vx, vy)), far = clamp(goalDist(b.x, b.y, gx) / 14, 0, 1);
  const r = 0.9 + far * 1.0;
  const tx = gx + s2 * clamp((vx / m * r) * s2, 0.35, 2.0), ty = clamp(10 + vy / m * r, GY1 - 0.2, GY2 + 0.2);
  return [tx, ty, false];
}
function humanControl(p, dt) {
  const b = G.ball, sp = runSpeed(p) * (IN.s && p.st > 0.05 ? 1.3 : 1);
  if (b.owner === p) {
    G.inUsedT = G.t;   // Eingaben dieses Frames gehören dem Ballführer, nicht dem nächsten Empfänger
    const buf = G.inBuf && G.inBuf.p === p && G.t - G.inBuf.t < 0.25 ? G.inBuf.k : null; G.inBufK = buf && G.inBuf.kempa; G.inBuf = null;   // vor dem Fangen gedrückt
    if (buf === 'a') { IN.pa = true; IN.k = IN.k || G.inBufK; }
    else if (buf === 'b' && !p.airCatch && G.phase === 'play') { if (IN.b) IN.pb = true; else { shoot(p, IN.y, 0.3); return [0, 0]; } }
    else if (buf === 'c') IN.pc = true;
    if (p.airCatch) { if (IN.pb || p.airT > 0.24) shoot(p, IN.y || null, 0.7); return [0, 0]; }
    if (IN.pa && !p.charging) { if (IN.k && p.role !== 'TW') kempa(p); else pass(p, choosePass(p, IN.x, IN.y, true)); buzz(12); return [IN.x * sp, IN.y * sp]; }
    if (IN.pb && G.phase === 'play') { p.charging = true; p.charge = 0.3; p.aim = IN.y; }            // kurzes Antippen = schneller Wurf
    else if (IN.b && p.charging) { p.charge = Math.min(1, p.charge + dt / 0.8); p.aim = lerp(p.aim || 0, IN.y, Math.min(1, dt * 10)); }
    if (p.charging && IN.pc) { shoot(p, p.aim, p.charge, true); return [0, 0]; }
    if (IN.rb && p.charging && b.owner === p) shoot(p, p.aim, p.charge);
    else if (IN.pc && !p.charging) feint(p, IN.x, IN.y);
    if (p.role === 'TW' && p.hold > 1.5) pass(p, choosePass(p, 0, 0));
  } else {
    if (IN.pa) {
      const cands = G.players.filter(q => q.team === p.team && !q.out && q.role !== 'TW' && q !== p).sort((a, c) => dist(a.x, a.y, b.x, b.y) - dist(c.x, c.y, b.x, b.y));
      if (cands[0]) { G.ctrl = cands[0]; AU.select(); }
    }
    if (IN.pb && p.z <= 0 && p.role !== 'TW') { p.vz = 3.4; p.block = 0.55; }
    if (IN.pc && b.owner && b.owner.team !== p.team) steal(p, b.owner);
  }
  return [IN.x * sp, IN.y * sp];
}
function updatePlayer(p, dt) {
  if (p.out) return;
  for (const k of ['stun', 'dash', 'cd', 'throwT', 'block', 'save', 'lie', 'stealT']) p[k] = Math.max(0, (p[k] || 0) - dt);
  if (G.ball.owner === p) { p.hold += dt; if (p.airCatch) p.airT = (p.airT || 0) + dt; }
  const ph = G.phase, frozen = ['kickoff', 'penalty', 'goal', 'halftime', 'fulltime', 'whistle', 'timeout', 'intro'].includes(ph);
  let dvx = 0, dvy = 0, sprint = false;
  if (p.z > 0 || p.vz > 0) {
    if (G.ball.owner === p && p.airCatch && ph === 'play') { const hum = G.human === p.team && G.ctrl === p; if ((hum && IN.pb) || p.airT > (hum ? 0.26 : 0.12)) shoot(p, hum ? (IN.y || null) : null, 0.75); }
    p.vz -= GRAV * dt; p.z += p.vz * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.z <= 0) {
      p.z = 0; p.vz = 0; p.vx *= 0.4; p.vy *= 0.4;
      if (p.fallShot) { p.lie = 0.55; p.fallShot = false; }
      p.shotJump = false;
      if (G.ball.owner === p && p.role !== 'TW' && inArea(p.x, p.y) && ph === 'play') { p.airCatch = false; turnover(1 - p.team, p.x, p.y, 'KREIS BETRETEN'); }
      p.airCatch = false;
    }
  } else {
    const holdStill = (ph === 'restart' && G.ball.owner === p) || p.lie > 0;
    // Passempfänger läuft automatisch zum Ball, bis er ihn hat. Der gesteuerte nur, solange keine Richtung gedrückt ist
    if (!frozen && !holdStill) {
      const hum = G.human === p.team && G.ctrl === p && ph === 'play', recv = G.ball.passTo === p && G.ball.state === 'air';
      if (hum && recv && G.inUsedT !== G.t && (IN.pa || IN.pb || IN.pc)) G.inBuf = { p, t: G.t, k: IN.pa ? 'a' : IN.pb ? 'b' : 'c', kempa: IN.k };   // Ball unterwegs zu mir: Aktion für den Fang merken
      if (recv && G.inBuf && G.inBuf.p === p) G.inBuf.t = G.t;   // gilt den ganzen Flug über, danach noch kurz
      if (hum && recv && !G.ball.lob && Math.hypot(IN.x, IN.y) > 0.2) {   // mit Richtung selbst laufen (Kempa-Lupfer bleiben automatisch)
        const sp = runSpeed(p) * (IN.s && p.st > 0.05 ? 1.3 : 1); dvx = IN.x * sp; dvy = IN.y * sp; sprint = IN.s;
      }
      else if (hum && !recv) { [dvx, dvy] = humanControl(p, dt); sprint = IN.s && Math.hypot(dvx, dvy) > 0.5; }
      else {
        const t = p.role === 'TW' ? updateGK(p, dt) : aiTarget(p, dt);
        if (t) {
          const dx = t[0] - p.x, dy = t[1] - p.y, d = Math.hypot(dx, dy);
          const spd = t[3] || runSpeed(p) * (t[2] && p.st > 0.1 ? 1.25 : 1) * (G.ball.owner === p ? 0.92 : 1);
          const k = d > 1.2 ? 1 : d / 1.2;
          if (d > 0.05) { dvx = dx / d * spd * k; dvy = dy / d * spd * k; }
          sprint = t[2] && d > 2;
        }
      }
    } else if (ph === 'goal' && G.lastScorer && p.team === G.lastScorer.team && p.role !== 'TW') {
      const sc = G.lastScorer;
      if (p === sc) { const a = G.phaseT * 2.2; dvx = Math.cos(a) * 4; dvy = Math.sin(a) * 2.5; if (G.phaseT > 1.0 && G.phaseT < 1.6) { dvx = sgn(p.team) * -5; p.cheer = 2; } }
      else { const dx = sc.x - p.x, dy = sc.y - p.y, d = Math.hypot(dx, dy); if (d > 1.4) { dvx = dx / d * 5; dvy = dy / d * 5; } else if (Math.random() < dt * 1.4) p.vz = 2.6; }
      p.cheer = Math.max(p.cheer, 1);
    }
    if (p.charging) { dvx *= 0.45; dvy *= 0.45; }
    if (p.stun > 0) { dvx *= 0.2; dvy *= 0.2; }
    if (p.dash > 0) { dvx = p.vx; dvy = p.vy; }
    const k = Math.min(1, dt * (p.dash > 0 ? 30 : G.ctrl === p && G.human === p.team ? 18 : 11));   // eigener Spieler reagiert direkter
    const pv = Math.hypot(p.vx, p.vy), nv = Math.hypot(dvx, dvy);
    if (!G.demo && pv > 3.2 && nv > 3 && (p.vx * dvx + p.vy * dvy) / (pv * nv) < 0.3 && Math.random() < 0.6) AU.squeak();   // Schuhquietschen bei Richtungswechsel
    p.vx += (dvx - p.vx) * k; p.vy += (dvy - p.vy) * k;
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
  if (p.charging && G.ball.owner !== p) { p.charging = false; p.charge = 0; }
  p.st = clamp(p.st + (sprint ? -0.13 * (1.3 - (p.sta ?? 80) / 150) : 0.07 * (0.6 + 0.4 * (p.energy ?? 1))) * dt, 0, 1);
  // Kraft über das ganze Spiel: sinkt mit Spielzeit (Ausdauer bremst den Abbau), Sprints kosten extra
  if (ph === 'play') { p.mins += dt; p.energy = Math.max(0.15, p.energy - dt * 0.66 / (2 * G.halfLen) * (1.3 - (p.sta ?? 80) / 150) * (sprint ? 1.8 : 1)); }
  p.x = clamp(p.x, 0.15, CW - 0.15); p.y = clamp(p.y, 0.15, CH - 0.15);
  if (p.role !== 'TW' && p.z <= 0) pushOut(p);
  if (p.role === 'TW' && G.ball.owner === p) { const gx = ownX(p.team), cy = clamp(p.y, GY1, GY2), d = dist(p.x, p.y, gx, cy); if (d > 5.8) { p.x = gx + (p.x - gx) / d * 5.8; p.y = cy + (p.y - cy) / d * 5.8; } }
  const v = Math.hypot(p.vx, p.vy);
  if (Math.abs(p.vx) > 0.4) p.face = Math.sign(p.vx);
  else if (G.ball.owner === p || p.role === 'TW') p.face = p.role === 'TW' ? (ownX(p.team) === 0 ? 1 : -1) : sgn(p.team);
  else if (v < 0.4 && ph === 'play') p.face = Math.sign(G.ball.x - p.x) || p.face;
  if (p.z <= 0 && p.cheer && ph !== 'goal') p.cheer = 0;
  p.anim += v * dt * 2.1;
  // Pose für Darstellung & Wiederholung
  const hasBall = G.ball.owner === p, defending = G.poss >= 0 && G.poss !== p.team && ph === 'play';
  let pose = 'idle', fr = Math.floor(G.t * 1.6 + p.i) % 2;
  if (p.lie > 0) pose = 'lie';
  else if (p.role === 'TW' && p.save > 0) pose = p.saveType;
  else if (p.cheer === 2) pose = 'slide';
  else if (p.cheer && p.z > 0) pose = 'cheer';
  else if (p.charging) { pose = 'wind'; fr = p.z > 0 ? 1 : 0; }
  else if (p.throwT > 0) { pose = p.fallShot ? 'fall' : 'throw'; fr = p.z > 0 ? 1 : 0; }
  else if (p.fallShot) pose = 'fall';
  else if (p.z > 0.05) pose = p.block > 0 ? 'block' : 'jump';
  else if (p.stealT > 0) pose = 'steal';
  else if (p.stun > 0.3) pose = 'stumble';
  else if (v > 0.6) { pose = p.cheer ? 'cheer' : hasBall ? 'drib' : 'run'; fr = Math.floor(p.anim) % 6; }
  else if (p.role === 'TW') pose = hasBall ? 'hold' : 'gk';
  else if (hasBall) pose = 'hold';
  else if (defending && goalDist(p.x, p.y, ownX(p.team)) < 10) pose = 'def';
  p.pose = pose; p.fr = fr;
}
function collide() {
  const ps = G.players;
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const a = ps[i], c = ps[j];
    if (a.out || c.out || a.z > 0.4 || c.z > 0.4 || a.lie || c.lie) continue;
    const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy);
    if (d < 0.72 && d > 1e-4) {
      const o = 0.72 - d, nx = dx / d, ny = dy / d; let wa = 0.5;
      if (a.team !== c.team) wa = a.team === G.poss ? 0.75 : 0.25;
      a.x -= nx * o * wa; a.y -= ny * o * wa; c.x += nx * o * (1 - wa); c.y += ny * o * (1 - wa);
    }
  }
}
