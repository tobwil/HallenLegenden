// ================= Ball, Tore, Paraden, Spielphasen =================
const INTRO_LEN = 11.5;
function updateBall(dt) {
  const b = G.ball, o = b.owner;
  b.px = b.x;
  if (o) {
    if (o.out) { b.owner = null; return; }
    const moving = Math.hypot(o.vx, o.vy) > 0.6 && G.phase === 'play';
    const back = o.charging || (o.pose === 'wind');
    b.x = o.x + o.face * (back ? -0.32 : 0.4); b.y = o.y + 0.05;
    b.z = o.z + (back ? 2.2 : o.lie ? 0.3 : moving && !o.airCatch ? 0.12 + Math.abs(Math.sin(o.anim * 1.5)) * 0.85 : 1.15);
    if (moving && Math.abs(Math.sin(o.anim * 1.5)) < 0.07 && Math.random() < 0.5) AU.bounce();
    return;
  }
  const spd = Math.hypot(b.vx, b.vy);
  if (spd > 15) { b.trail.push([b.x, b.y, b.z]); if (b.trail.length > 7) b.trail.shift(); } else if (b.trail.length) b.trail.shift();
  if (G.phase !== 'play') {
    b.vx *= 0.92; b.vy *= 0.92; b.vz -= GRAV * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z = Math.max(0, b.z + b.vz * dt); if (b.z === 0) b.vz = Math.abs(b.vz) > 2 ? -b.vz * 0.4 : 0;
    if (G.phase === 'goal') { const gx = b.x < 20 ? 0 : CW; b.x = gx === 0 ? Math.max(b.x, -0.9) : Math.min(b.x, CW + 0.9); }
    return;
  }
  b.ncT -= dt;
  // Selbst gesteuerter Empfänger: Pass lenkt leicht nach, damit kleine Laufkorrekturen ihn nicht kosten
  if (b.passTo && G.recvSteer === b.passTo && !b.lob && b.state === 'air') {
    const q = b.passTo, v = Math.hypot(b.vx, b.vy), a = Math.atan2(b.vy, b.vx), want = Math.atan2(q.y - b.y, q.x - b.x);
    let da = want - a; da = Math.atan2(Math.sin(da), Math.cos(da)); const na = a + clamp(da, -2.5 * dt, 2.5 * dt);
    b.vx = Math.cos(na) * v; b.vy = Math.sin(na) * v;
  } else if (!b.passTo) G.recvSteer = null;
  b.vz -= GRAV * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
  if (b.z <= 0) {
    b.z = 0;
    if (b.vz < -1.2) { b.vz = -b.vz * 0.55; b.vx *= 0.82; b.vy *= 0.82; AU.bounce(); G.parts.push(...burst(b.x, b.y, 0, '#cfc6b0', 3)); if (b.shot && Math.abs(b.vx) < 6) b.shot = null; }
    else { b.vz = 0; const f = Math.max(0, 1 - 1.6 * dt); b.vx *= f; b.vy *= f; b.passTo = null; b.lob = false; }
  }
  if (b.shot && !b.shot.gkDone) {
    const g = G.goalie[1 - b.shot.team];
    if (!g.out && (b.px - g.x) * (b.x - g.x) <= 0) {
      b.shot.gkDone = true;
      const dy = Math.abs(b.y - g.y), reach = 0.55 + (g.save > 0 ? 0.85 : 0.2) + g.gk / 400 + (g.trait === 'Krake' ? 0.15 : 0);
      if (dy < reach && b.z < 2.3 && !(b.shot.lob && b.z > 2.0)) {
        let pr = (1 - dy / reach * 0.7) * (0.4 + g.gk / 100 * 0.4) * clamp(1.25 - b.shot.speed / 40, 0.5, 1);
        if (dy < 0.35) pr += 0.15; if (g.trait === 'Reflexmonster') pr += 0.06;
        pr += clamp((b.shot.d - 12) / 6, 0, 0.6);            // Fernwürfe sieht der Torwart kommen
        if (G.pen && G.pen.gkGuess && G.human === g.team) pr = Math.sign(b.y - 10) === Math.sign(G.pen.gkGuess) || Math.abs(b.y - 10) < 0.5 ? 0.85 : 0.05;
        if (Math.random() < pr) return save(g);
      }
    }
    if (Math.abs(b.x - goalX(b.shot.team)) < 3.2 && !G.demo) G.slow = 0.42;
  }
  for (const p of G.players) {
    if (p.out || (p === b.nc && b.ncT > 0) || p.stun > 0.3 || p.lie) continue;
    const dxy = dist(p.x, p.y, b.x, b.y), hz = b.z - p.z;
    if (b.shot) {
      if (p.team !== b.shot.team && p.role !== 'TW' && !b.shot.blocked.has(p) && dxy < (p.block > 0 ? 0.8 : 0.5) && hz > 0.6 && hz < (p.block > 0 ? 2.75 : 2.2)) {
        b.shot.blocked.add(p);
        if (Math.random() < (p.block > 0 ? 0.5 : 0.18) + (p.trait === 'Kreis-Turm' ? 0.12 : 0)) {
          b.vx *= -0.3; b.vy = rnd(-3.5, 3.5); b.vz = rnd(1.5, 3.5); b.shot = null; b.last = p; b.nc = p; b.ncT = 0.25; b.tried = new Set();
          banner('GEBLOCKT!', '#7cf2ff', p.name, 0.9); AU.save(); G.parts.push(...burst(b.x, b.y, b.z, '#ffffff', 8));
          say(pick([`Block von ${p.name}!`, `${p.name} fährt die Hände hoch!`, 'Abgewehrt im Mittelblock!']));
          return;
        }
      }
      continue;
    }
    if (dxy > (b.lob ? 0.95 : 0.75) || hz < -0.3 || hz > 2.6) continue;
    if (p.role !== 'TW' && inArea(b.x, b.y) && p.z < 0.3) continue;
    if (b.passTo && p.team !== b.passTo.team) {
      if (b.tried.has(p)) continue; b.tried.add(p);
      if (Math.random() < 0.1 + p.df / 900 + (G.ctrl === p ? 0.25 : 0)) { giveBall(p); G.stats.steals[p.team]++; p.stealsN++; banner('ABGEFANGEN!', '#9cff57', p.name, 0.9); say(`${p.name} liest den Pass und fängt ab!`); return; }
      continue;
    }
    if (b.passTo && p !== b.passTo && dxy > 0.45) continue;
    const wasLob = b.lob;
    giveBall(p);
    if (p.z > 0.3 && p.role !== 'TW') { p.airCatch = true; p.airT = 0; if (wasLob) banner('KEMPA?!', '#ff8bd1', '', 0.7); }
    return;
  }
  if (!b.shot && !b.lob) for (const g of G.goalie) {
    if (g.out || g.lie) continue;
    if (goalDist(b.x, b.y, ownX(g.team)) < 6 && dist(g.x, g.y, b.x, b.y) < 2.4 && b.z < 2.3 && !(b.passTo && b.passTo.team === g.team)) { giveBall(g); return; }
  }
  if (b.y < -0.3 || b.y > CH + 0.3) {
    const t = b.last ? 1 - b.last.team : 1 - G.poss;
    AU.whistle(1); banner('EINWURF', '#ffc83a', '', 0.7);
    G.pending = { k: 'frei', team: t, x: clamp(b.x, 0.5, CW - 0.5), y: b.y < 0 ? 0.15 : CH - 0.15, t: 0.6, ein: true };
    G.phase = 'whistle'; G.phaseT = 0; b.vx = b.vy = 0; return;
  }
  const cross0 = b.px > 0 && b.x <= 0, cross1 = b.px < CW && b.x >= CW;
  if (cross0 || cross1) {
    const gx = cross0 ? 0 : CW, def = goalX(0) === gx ? 1 : 0;
    const inMouth = b.y > GY1 + 0.08 && b.y < GY2 - 0.08 && b.z < GH - 0.04;
    const post = !inMouth && b.z < GH + 0.08 && (Math.abs(b.y - GY1) < 0.14 || Math.abs(b.y - GY2) < 0.14 || (b.y > GY1 && b.y < GY2));
    if (post) {
      const latte = b.y > GY1 + 0.08 && b.y < GY2 - 0.08;
      b.x = gx + (gx ? -0.06 : 0.06); b.vx = -b.vx * 0.45; b.vy += rnd(-2, 2); b.vz = Math.abs(b.vz) * 0.4 + 1; b.shot = null; b.tried = new Set();
      banner(latte ? 'LATTE!' : 'PFOSTEN!', '#ffffff', '', 0.9); AU.post(); AU.crowd(0.18, 0.3); G.shake = 0.18;
      G.parts.push(...burst(b.x, b.y, b.z, '#ffffff', 10));
      say(pick(['Nur Aluminium!', 'Klong! Das Gestänge rettet.', 'Pech, das war knapp!']));
      return;
    }
    if (inMouth) return scoreGoal(1 - def, gx);
    const lt = b.last; AU.whistle(1);
    if (lt && lt.team === def && lt.role !== 'TW') { banner('ECKE', '#ffc83a', '', 0.7); G.pending = { k: 'frei', team: 1 - def, x: gx + (gx ? -0.3 : 0.3), y: b.y < 10 ? 0.15 : CH - 0.15, t: 0.6, ein: true }; }
    else { banner('ABWURF', '#ffc83a', '', 0.7); G.pending = { k: 'abwurf', team: def, t: 0.6 }; if (b.shot) AU.ooh(0.4); if (b.shot) say(pick(['Drüber!', 'Am Tor vorbei.', 'Das war nichts, Abwurf.'])); }
    G.phase = 'whistle'; G.phaseT = 0; b.shot = null; b.vx *= 0.2; b.vy *= 0.2;
  }
}
function save(g) {
  const b = G.ball, sh = b.shot; G.stats.saves[g.team]++; g.saves++;
  banner('GEHALTEN!', '#ffc83a', g.name, 1, true); AU.save(); AU.crowd(0.22, 0.4); G.shake = 0.15; G.slowT = 0.45; G.flash = 0.25;
  G.parts.push(...burst(b.x, b.y, b.z, '#ffffff', 14, 4));
  if (G.pen) G.cut = { kind: 'card', p: g, t: 0, dur: 2, title: '7-METER PARIERT', col: '#ffc83a' };
  say(pick([`Was für eine Parade von ${g.name}!`, `${g.name} ist zur Stelle!`, `Glanztat! ${g.name} hält.`, `${sh.by.name} scheitert am Keeper.`]));
  G.pen = null;
  if (sh.speed < 21 && Math.random() < 0.5) { giveBall(g); return; }
  b.vx = -b.vx * rnd(0.15, 0.35); b.vy = rnd(-4, 4); b.vz = rnd(1.5, 4); b.shot = null; b.last = g; b.nc = g; b.ncT = 0.2; b.tried = new Set(); b.passTo = null;
}
function scoreGoal(team, gx) {
  if (G.shootout) { AU.net(); G.netKick[gx === 0 ? 0 : 1] = 1; G.ball.shot = null; G.ball.vx *= 0.2; return soResolve(true); }
  const b = G.ball, sc = b.last && b.last.team === team ? b.last : null;
  G.score[team]++; G.stats.goals[team]++; G.phase = 'goal'; G.phaseT = 0; G.lastScorer = sc; G.lastConcede = 1 - team;
  G.replay = G.rec.slice(); G.rec = []; G.replayMeta = { scorer: sc, kempa: G.kempa && G.kempa.to === sc };
  b.shot = null; b.vx *= 0.25; b.vy *= 0.3; G.netKick[gx === 0 ? 0 : 1] = 1;
  const k = kit(team), wasPen = !!G.pen; G.pen = null;
  if (sc) sc.goals++;
  const kempaGoal = G.kempa && G.kempa.to === sc; G.kempa = null;
  const title = !sc ? 'EIGENTOR' : kempaGoal ? 'KEMPA-TOR!' : wasPen ? 'VERWANDELT!' : 'TOR!';
  banner(title, k.c1, sc ? `#${sc.num} ${sc.name}` : TEAMS[G.tid[team]].n, 2.1, true);
  G.cut = sc ? { kind: 'goal', p: sc, t: 0, dur: 2.4, title, col: k.c1 } : null;
  ledFlash(`TOR  ${TEAMS[G.tid[team]].short.toUpperCase()}  ${G.score[0]}:${G.score[1]}`, k.c1 === '#f4f4f0' ? '#ffffff' : k.c1, 4);
  AU.net(); AU.horn(); buzz(60); AU.cheer(team === 0 ? 1 : 0.55); AU.jingle('goal'); AU.exc = 1; G.shake = 0.5; G.excite = 3.5; G.flash = 0.4; G.wave = G.score[team] % 5 === 0 ? 6 : G.wave;
  G.parts.push(...confetti(gx, [k.c1, k.c2, '#ffffff', '#ffc83a']));
  const s = `${G.score[0]}:${G.score[1]}`;
  say(sc ? pick([`${sc.name} trifft zum ${s}!`, `Tor durch ${sc.name}! Es steht ${s}.`, `Eiskalt, ${sc.name}! ${s}.`, `Der sitzt! ${sc.name}, ${s}.`, `Unhaltbar! ${sc.name} zum ${s}.`]) : `Eigentor! ${s}.`);
  G.log.push({ team, name: sc ? sc.name : 'Eigentor', min: Math.floor(gameMinute()) });
  if (sc && !G.demo && AU.vol.speaker) { const line = team === 0 ? `Tor für ${TEAMS[G.tid[0]].short}! Torschütze mit der Nummer ${sc.num}: ${sc.name}! Es steht ${G.score[0]} zu ${G.score[1]}.` : `Tor für die Gäste. Nummer ${sc.num}, ${sc.name}. ${G.score[0]} zu ${G.score[1]}.`; setTimeout(() => AU.say(line), 900); }
}
const gameMinute = () => (G.half - 1) * 30 + G.clock / G.halfLen * 30;
function afterGoal() { setupKickoff(G.lastConcede ?? 0, false, true); }
function snapshot() {
  const b = G.ball;
  return { c: CAMX, b: [b.x, b.y, b.z], p: G.players.map(p => [p.x, p.y, p.z, p.face, p.pose, p.fr, p.out]) };
}
function endHalf() {
  AU.whistle(G.half === 1 ? 2 : 3, true);
  if (G.half === 1) { G.phase = 'halftime'; G.phaseT = 0; say('Halbzeit! Durchatmen in der Kabine.'); if (!G.demo) { AU.jingle('half'); AU.say(`Halbzeit. Es steht ${G.score[0]} zu ${G.score[1]}.`); } }
  else if (G.cup && G.score[0] === G.score[1]) startShootout();
  else { G.phase = 'fulltime'; G.phaseT = 0; if (!G.demo) { AU.cheer(0.8); AU.say(`Abpfiff! Endstand ${G.score[0]} zu ${G.score[1]}.`); } G.excite = 2; G.parts.push(...confetti(20, ['#ffc83a', '#ffffff', kit(G.score[0] >= G.score[1] ? 0 : 1).c1])); }
}
function step(dt) {
  G.t += dt; G.shake = Math.max(0, G.shake - dt); G.excite = Math.max(0, G.excite - dt); G.flash = Math.max(0, G.flash - dt); G.wave = Math.max(0, G.wave - dt);
  LED.t = Math.max(0, LED.t - dt);
  G.netKick = G.netKick.map(v => Math.max(0, v - dt * 1.8));
  if (G.banner) { G.banner.t += dt; if (G.banner.t > G.banner.dur) G.banner = null; }
  if (G.cut) { G.cut.t += dt; if (G.cut.t > G.cut.dur) G.cut = null; }
  if (G.ticker.t > 0) G.ticker.t -= dt;
  updateParts(dt);
  const ph = G.phase, b = G.ball;
  if (!G.demo) {
    let lv = 0.12;
    if (ph === 'goal') lv = 1;
    else if (ph === 'play' && G.poss >= 0) lv = clamp(1 - goalDist(b.x, b.y, goalX(G.poss)) / 16, 0, 1) * (G.poss === 0 ? 0.75 : 0.5) + (b.shot ? 0.3 : 0);
    AU.setExcite(lv);
  }
  if (ph === 'intro') {
    G.introT += dt;
    if ((IN.any && G.introT > 0.4) || G.introT > INTRO_LEN) { G.phase = 'kickoff'; G.phaseT = 1.0; AU.ambience(true); say(`${TEAMS[G.tid[0]].short} gegen ${TEAMS[G.tid[1]].short}. Anwurf!`); }
    return;
  }
  if (ph === 'replay') { G.rp += dt * 60 * 0.5; if (G.rp >= G.replay.length - 1 || (IN.any && G.rp > 12)) { G.replay = null; afterGoal(); } return; }
  if (ph === 'halftime') {
    G.phaseT += dt;
    if (G.phaseT > 9 || (IN.any && G.phaseT > 1.2)) { G.half = 2; G.swap = !G.swap; G.clock = 0; G.timeouts = [1, 1]; setupKickoff(1 - G.starter, true); banner('2. HALBZEIT', '#ffc83a', '', 1.4, true); say('Seitenwechsel. Weiter geht es!'); }
    return;
  }
  if (ph === 'fulltime') { G.phaseT += dt; if (G.phaseT > 3 && !G.shown) { G.shown = true; if (!G.demo) endMatch(); } }
  if (ph === 'timeout') { G.phaseT += dt; if (G.human !== G.toTeam && G.phaseT > 2.6) resumeTimeout(); }
  // 7-Meter-Werfen: Fehlwurf erkennen (gehalten, vorbei, Pfosten)
  if (G.shootout && G.so.live) {
    if (G.phase === 'play') G.so.t += dt;
    if ((G.phase === 'play' && !b.shot && G.so.t > 0.25) || (G.phase === 'whistle' && G.pending && G.pending.k !== 'so')) { G.pending = null; soResolve(false); }
  }
  if (G.human >= 0) {
    if (!G.ctrl || G.ctrl.out || G.ctrl.team !== G.human) G.ctrl = nearestTo(G.human, b.x, b.y);
    if (G.ctrl && G.ctrl.role === 'TW' && b.owner !== G.ctrl && ph === 'play') G.ctrl = nearestTo(G.human, b.x, b.y);
    // Automatischer Wechsel in der Abwehr, wenn der Gegner den Ball bekommt und der gesteuerte Spieler weit weg ist
    const thr = b.owner || b.passTo;
    if (ph === 'play' && thr && thr.team !== G.human && thr !== G.autoSw) {
      G.autoSw = thr;
      const tx = b.owner ? thr.x : (thr.tx ?? thr.x), ty = b.owner ? thr.y : (thr.ty ?? thr.y), n = nearestTo(G.human, tx, ty);
      if (n && G.ctrl && n !== G.ctrl) { const dc = dist(G.ctrl.x, G.ctrl.y, tx, ty); if (dc > 9 || (Math.hypot(IN.x, IN.y) < 0.2 && dc > 4) || (TOUCHDEV && dc > 5)) G.ctrl = n; }
    }
    if (thr && thr.team === G.human) G.autoSw = null;
  }
  if (ph === 'kickoff' || ph === 'restart') { G.phaseT -= dt; if (G.phaseT <= 0) { G.phase = 'play'; AU.whistle(1); } }
  if (ph === 'whistle') {
    G.phaseT += dt;
    if (G.pending && G.phaseT >= G.pending.t) {
      const pd = G.pending; G.pending = null;
      if (pd.k === 'so') soKick();
      else if (pd.k === 'pen') setupPenalty(pd.team);
      else if (pd.k === 'abwurf') setupRestart(pd.team, 0, 0, 'abwurf');
      else setupRestart(pd.team, pd.x, pd.y, pd.ein ? 'ein' : 'frei', pd.who);
    }
  }
  if (ph === 'goal') { G.phaseT += dt; if (G.phaseT > 2.6 || (IN.any && G.phaseT > 0.8)) { if (G.replay && G.replay.length > 60 && !G.demo && G.phaseT > 2.6) { G.phase = 'replay'; G.rp = 0; } else afterGoal(); } }
  if (ph === 'penalty') {
    const sh = b.owner; G.phaseT -= dt;
    if (sh && G.phaseT <= 0) {
      if (G.human === sh.team) {
        G.pen.aim = lerp(G.pen.aim, IN.y, Math.min(1, dt * 8));
        if (IN.b) { sh.charging = true; sh.charge = Math.min(1, sh.charge + dt / 0.8); }
        if (IN.rb && sh.charging) { shoot(sh, G.pen.aim, sh.charge); G.phase = 'play'; }
      } else {
        if (G.human >= 0) { if (IN.y < -0.4) G.pen.gkGuess = -1; else if (IN.y > 0.4) G.pen.gkGuess = 1; }
        if ((G.pen.aiT -= dt) <= 0) { shoot(sh, pick([-1, 1, 0.5, -0.5, 0]), rnd(0.45, 0.95)); G.phase = 'play'; }
      }
      if (G.phase === 'play') AU.whistle(1);
    }
  }
  if (G.phase === 'play') {
    G.clock += dt; G.possT += dt;
    if (G.possT > 22 && !G.passiveWarn && b.owner) { G.passiveWarn = true; say('Der Schiedsrichter hebt den Arm: Zeitspiel droht!'); }
    if (G.possT > 31 && b.owner && b.owner.role !== 'TW') { G.possT = 0; turnover(1 - b.owner.team, b.owner.x, b.owner.y, 'PASSIVES SPIEL'); }
    const ai = 1 - Math.max(0, G.human);
    if (G.human >= 0 && G.half === 2 && G.score[ai] + 3 <= G.score[1 - ai] && Math.random() < dt * 0.05) callTimeout(ai);
    if (G.clock >= G.halfLen && !b.shot && !G.shootout) { G.clock = G.halfLen; endHalf(); }
    // Stimmung: Trommeln, wenn die Heimmannschaft angreift
    const atk = b.owner ? b.owner.team : -1;
    AU.tickDrums(dt, atk === 0 ? 1 : atk === 1 ? 0.35 : 0.5);
  }
  if (G.phase === 'play' || G.phase === 'restart') {
    for (const p of G.players) if (p.out) { p.out -= dt; if (p.out <= 0) { p.out = 0; place(p, 20 - sgn(p.team) * 2, 0.3); say(`${p.name} ist wieder auf dem Feld.`); } }
  }
  if (G.phase === 'play') for (const t of [0, 1]) for (const b of G.bench[t]) b.energy = Math.min(b.fitMul, b.energy + dt * 0.3 / (2 * G.halfLen));
  G.subT = (G.subT || 0) + dt; if (G.subT > 3 && ['play', 'restart', 'whistle', 'kickoff'].includes(G.phase)) { G.subT = 0; autoSubs(); }
  // Warnung, wenn ein eigener Spieler platt ist und nicht automatisch gewechselt wird
  if (G.human >= 0 && !G.autoSub && G.phase === 'play') { const tired = G.players.find(p => p.team === G.human && p.energy < 0.4 && !p.warned); if (tired) { tired.warned = true; say(`${tired.name} ist platt. Wechseln im Pausemenü (Q).`, 4); } }
  // Vorschau: wer würde den nächsten Pass bekommen?
  G.ppT = (G.ppT || 0) + 1;
  if (G.ppT % 6 === 0) { const c = G.ctrl; G.passPrev = c && G.ball.owner === c && G.phase === 'play' && !c.charging ? choosePass(c, IN.x, IN.y, true) : null; }
  for (const p of G.players) updatePlayer(p, dt);
  collide();
  updateBall(dt);
}
function resumeTimeout() {
  const o = G.ball.owner || nearestTo(G.toTeam, 20, 10);
  setupRestart(G.toTeam, o.x, o.y, 'frei', o); G.possT = 0;
}

// ================= 7-Meter-Werfen (Pokal) =================
function startShootout() {
  G.shootout = true; G.so = { r: [[], []], turn: 0, k: [0, 0], live: false, t: 0 };
  AU.whistle(2); banner('7-METER-WERFEN', '#ffc83a', 'Unentschieden – die Entscheidung fällt vom Punkt', 2.4, true);
  say('Unentschieden! Jetzt entscheidet das 7-Meter-Werfen.');
  G.pending = { k: 'so', t: 2.6 }; G.phase = 'whistle'; G.phaseT = 0;
}
function soKick() {
  const t = G.so.turn, list = G.players.filter(p => p.team === t && p.role !== 'TW' && !p.out).sort((a, b) => b.att - a.att);
  const sh = list[G.so.k[t] % list.length]; G.so.k[t]++;
  setupPenalty(t, sh); G.so.live = true; G.so.t = 0;
}
function soResolve(hit) {
  const t = G.so.turn, r = G.so.r; G.so.live = false; r[t].push(hit);
  banner(hit ? 'TREFFER!' : 'VERGEBEN!', hit ? '#9cff57' : '#ff4f3a', TEAMS[G.tid[t]].short, 1.2, true);
  if (hit) { AU.cheer(t === 0 ? 0.7 : 0.4); } else AU.ooh(0.8);
  const n0 = r[0].length, n1 = r[1].length, s0 = r[0].filter(Boolean).length, s1 = r[1].filter(Boolean).length;
  let over = false;
  if (n0 <= 5 && n1 <= 5) over = s0 + (5 - n0) < s1 || s1 + (5 - n1) < s0;
  if (!over && n0 >= 5 && n0 === n1 && s0 !== s1) over = true;
  if (over) {
    G.soWinner = s0 > s1 ? 0 : 1; G.shootout = false; G.soScore = [s0, s1];
    AU.whistle(3, true); AU.cheer(1);
    banner('ENTSCHIEDEN!', '#ffc83a', `${TEAMS[G.tid[G.soWinner]].short} gewinnt ${s0}:${s1} vom Punkt`, 3, true);
    G.phase = 'fulltime'; G.phaseT = 0; return;
  }
  G.so.turn = 1 - t; G.pending = { k: 'so', t: 1.5 }; G.phase = 'whistle'; G.phaseT = 0;
}
