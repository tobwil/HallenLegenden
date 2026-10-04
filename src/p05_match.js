// ================= Spielzustand, Aufstellungen, Spielfortsetzungen =================
let G = null;
const DIFF = [{ n: 'Amateur', cpu: -9, react: 1.45, steal: 0.08 }, { n: 'Profi', cpu: 0, react: 1, steal: 0.03 }, { n: 'Legende', cpu: 6, react: 0.72, steal: 0 }];
const goalX = t => ((t === 0) !== G.swap) ? CW : 0;
const ownX = t => goalX(t) === CW ? 0 : CW;
const sgn = t => goalX(t) === CW ? 1 : -1;
const relY = (t, yy) => sgn(t) > 0 ? yy : CH - yy;

const KIT_NAMES = ['HEIM', 'AUSWÄRTS', 'ALTERNATIV'];
const kitSet = T => [T.home, T.away, T.alt];
function autoKits(a, b) {
  const A = TEAMS[a].home, ks = kitSet(TEAMS[b]);
  let ib = ks.findIndex(k => colDist(k.c1, A.c1) >= 120);
  if (ib < 0) ib = ks.map((k, i) => [colDist(k.c1, A.c1), i]).sort((x, y) => y[0] - x[0])[0][1];
  return [0, ib];
}
function makeKits(a, b, ia, ib) {
  if (ia === undefined || ib === undefined) [ia, ib] = autoKits(a, b);
  const A = TEAMS[a], B = TEAMS[b], ka = { ...kitSet(A)[ia], gk: A.gkc }, kb = { ...kitSet(B)[ib], gk: B.gkc };
  const pal = ['#ffd23f', '#3fd0ff', '#9cff57', '#ff8bd1', '#ff9f1c', '#c58bff'], ok = (g, os) => os.every(o => colDist(g, o) > 110);
  if (!ok(ka.gk, [ka.c1, kb.c1])) ka.gk = pal.find(g => ok(g, [ka.c1, kb.c1])) || ka.gk;
  if (!ok(kb.gk, [ka.c1, kb.c1, ka.gk])) kb.gk = pal.find(g => ok(g, [ka.c1, kb.c1, ka.gk])) || kb.gk;
  return [ka, kb];
}
function newMatch(ta, tb, o = {}) {
  const kits = o.kits || makeKits(ta, tb, o.kitA, o.kitB);
  G = {
    tid: [ta, tb], kits, human: o.human ?? -1, diff: o.diff ?? 1, halfLen: o.halfLen ?? 180, lg: TEAMS[ta].lg,
    career: !!o.career, cup: !!o.cup, euro: o.euro || null, event: o.event || null, demo: !!o.demo, label: o.label || '', lineupPids: o.lineups ? o.lineups.map(l => l.map(r => r.pid)) : null, seven: o.career && CAREER ? [ta, tb].map(t => t === CAREER.team ? CAREER.seven || null : null) : null,
    score: [0, 0], half: 1, clock: 0, swap: false, phase: o.demo ? 'kickoff' : 'intro', phaseT: 0, t: 0, introT: 0,
    players: [], ctrl: null, poss: -1, possT: 0, starter: 0, pending: null, passiveWarn: false,
    banner: null, cut: null, ticker: { txt: '', t: 0 }, shake: 0, flash: 0, slow: 1, slowT: 0, excite: 0, wave: 0,
    rec: [], recAcc: 0, replay: null, rp: 0, parts: [], netKick: [0, 0],
    tact: [0, 0], timeouts: [1, 1], pen: null, kempa: null,
    stats: { shots: [0, 0], goals: [0, 0], saves: [0, 0], steals: [0, 0], susp: [0, 0], seven: [0, 0], tech: [0, 0] }, log: [],
  };
  G.bench = [[], []]; G.autoSub = o.autoSub ?? true;
  for (let t = 0; t < 2; t++) {
    const boost = (G.human >= 0 && t !== G.human) ? DIFF[G.diff].cpu : 0;
    (o.lineups ? o.lineups[t] : roster(G.tid[t])).forEach((r, i) => {
      const p = Object.assign({
        team: t, i, x: 20, y: 10, z: 0, vx: 0, vy: 0, vz: 0, face: 1, anim: 0, st: 1, stun: 0, dash: 0, cd: 0, charge: 0, charging: false,
        throwT: 0, save: 0, saveType: '', out: 0, dec: 0, hold: 0, patience: 1.5, tx: 20, ty: 10, block: 0, lie: 0,
        shotJump: false, fallShot: false, pose: 'idle', fr: 0, cheer: 0, airCatch: false,
      }, matchData(r, boost));
      p.st = 0.55 + 0.45 * p.energy;   // müde Spieler starten mit weniger Puste
      p.look = lookOf(p, kits[t]);
      G.players.push(p);
    });
    G.bench[t] = (o.benches ? o.benches[t] : quickBench(G.tid[t])).map(r => matchData(r, boost));
  }
  G.goalie = [G.players[0], G.players[7]];
  G.ball = { x: 20, y: 10, z: 1, vx: 0, vy: 0, vz: 0, owner: null, state: 'held', passTo: null, shot: null, last: null, nc: null, ncT: 0, tried: new Set(), px: 20, lob: false, trail: [] };
  buildArena(kits[0], kits[1], G.lg, G.event);
  setupKickoff(0, true);   // setzt die Phase auf 'kickoff' …
  if (G.demo) G.phase = 'play';
  else { G.phase = 'intro'; /* … deshalb das TV-Intro (Aufstellungen, Event-Titel) danach wieder setzen */ AU.jingle('intro'); AU.say(`Herzlich willkommen zum Spiel ${TEAMS[ta].n} gegen ${TEAMS[tb].n}!`); }
}
const kit = t => G.kits[t];
const mates = p => G.players.filter(q => q.team === p.team && q !== p && !q.out);
const opps = p => G.players.filter(q => q.team !== p.team && !q.out);
const fieldOpps = p => opps(p).filter(q => q.role !== 'TW');
function say(txt, t = 4.5) { if (G.demo) return; G.ticker = { txt, t }; }
function banner(txt, col = '#ffc83a', sub = '', dur = 1.6, big = false) { if (G.demo && !big) return; G.banner = { txt, col, sub, t: 0, dur, big }; }

// Angriffs-Grundpositionen (d = Abstand zur gegnerischen Torlinie, yy = Breite in Laufrichtung)
const ATT = { LA: [1.0, 1.2], RL: [9.4, 4.4], RM: [10.4, 10], RR: [9.4, 15.6], RA: [1.0, 18.8], KM: [6.5, 10] };
const DEF_SYS = [
  { n: '6:0', order: ['LA', 'RL', 'KM', 'RM', 'RR', 'RA'], s: [[2.4, 6.7, .3], [5.9, 6.7, .3], [8.7, 6.7, .3], [11.3, 6.7, .3], [14.1, 6.7, .3], [17.6, 6.7, .3]] },
  { n: '5:1', order: ['LA', 'RL', 'KM', 'RR', 'RA', 'RM'], s: [[2.6, 6.7, .3], [6.2, 6.7, .3], [10, 6.7, .3], [13.8, 6.7, .3], [17.4, 6.7, .3], [10, 9.4, .85]] },
  { n: '3:2:1', order: ['LA', 'KM', 'RA', 'RL', 'RR', 'RM'], s: [[3.8, 6.8, .35], [10, 6.7, .35], [16.2, 6.8, .35], [6.2, 8.4, .55], [13.8, 8.4, .55], [10, 10.3, .85]] },
];
function attackSpot(p) {
  const s = sgn(p.team), gx = goalX(p.team), b = G.ball, a = ATT[p.role];
  let d = a[0], yy = a[1];
  const cross = Math.sin(G.t * 0.45 + p.team) > 0.75;             // Kreuzen im Rückraum
  if (cross && p.role === 'RM') yy = 6.2; if (cross && p.role === 'RL') yy = 9.4;
  let y = relY(p.team, yy);
  if (p.role === 'RL' || p.role === 'RM' || p.role === 'RR') { d += Math.sin(G.t * 0.9 + p.i * 1.7) * 1.2; y += (b.y - 10) * 0.18; }
  else if (p.role === 'KM') {
    y = clamp(10 + (b.y - 10) * 0.45 + Math.sin(G.t * 0.6) * 2.4, 5, 15);
    const dy = Math.max(0, Math.abs(y - 10) - 1.5); d = Math.sqrt(Math.max(1, 6.4 * 6.4 - dy * dy));
  } else if ((p.role === 'LA' || p.role === 'RA') && G.possT > 8 && Math.sin(G.t * 0.5 + p.i) > 0.85) {
    yy = p.role === 'LA' ? 6 : 14; y = relY(p.team, yy); d = 6.6;    // Einläufer: Außen läuft zum Kreis
  }
  return [gx - s * d, clamp(y, 0.6, CH - 0.6)];
}
function defendSpot(p) {
  const gx = ownX(p.team), s2 = gx === 0 ? 1 : -1, sys = DEF_SYS[G.tact[p.team]], k = sys.order.indexOf(p.role), b = G.ball;
  const [yy, r, shift] = sys.s[k];
  let y = relY(p.team, yy) + (b.y - 10) * shift; y = clamp(y, 0.8, CH - 0.8);
  const dy = Math.abs(y - clamp(y, GY1, GY2));
  const dx = dy < r - 0.6 ? Math.sqrt(r * r - dy * dy) : 0.9;
  return [gx + s2 * dx, y];
}
function kickoffSpot(p, kicker) {
  const s = sgn(p.team), r = p.role;
  if (r === 'TW') return [ownX(p.team) + s * 1.2, 10];
  if (r === 'RM' && p.team === kicker) return [20, 10];
  const m = { LA: [1.2, 3], RL: [4.5, 6.5], RM: [4, 10], RR: [4.5, 13.5], RA: [1.2, 17], KM: [2.4, 10] }[r];
  return [20 - s * m[0], relY(p.team, m[1])];
}
function place(p, x, y) { Object.assign(p, { x, y, z: 0, vx: 0, vy: 0, vz: 0, charge: 0, charging: false, save: 0, stun: 0, lie: 0, tx: x, ty: y, shotJump: false, airCatch: false }); }
function giveBall(p, quiet) {
  const b = G.ball;
  if (G.kempa && p !== G.kempa.to) G.kempa = null;
  p.assistFrom = b.passer && b.passer !== p && b.passer.team === p.team ? b.passer : null; b.passer = null;   // für die Torvorlage
  b.owner = p; b.state = 'held'; b.passTo = null; b.shot = null; b.last = p; b.vz = 0; b.lob = false;
  p.hold = 0; p.patience = rnd(0.7, 2.0); p.dec = rnd(0.08, 0.2);
  if (G.poss !== p.team) { G.poss = p.team; G.possT = 0; G.passiveWarn = false; G.possSrc = 'live'; }   // Ballgewinn im laufenden Spiel (Tempogegenstoß möglich)
  if (G.human === p.team && p.role !== 'TW') G.ctrl = p;   // Torwart wirft automatisch ab
  if (!quiet) AU.catch();
}
function nearestTo(team, x, y, exclGK = true) {
  let best = null, bd = 1e9;
  for (const p of G.players) if (p.team === team && !p.out && !(exclGK && p.role === 'TW')) { const d = dist(p.x, p.y, x, y); if (d < bd) { bd = d; best = p; } }
  return best;
}
// Anwurf. quick=true: schnelle Mitte, nur der Werfer wird zur Mitte gesetzt
function setupKickoff(team, full, quick = false) {
  G.phase = 'kickoff'; G.phaseT = quick ? 0.55 : 1.3; G.pending = null; G.pen = null; G.kempa = null;
  if (!quick) for (const p of G.players) if (!p.out) { const [x, y] = kickoffSpot(p, team); place(p, x, y); }
  for (const p of G.players) { p.cheer = 0; p.lie = 0; p.z = 0; p.vz = 0; }
  const k = G.players.find(p => p.team === team && p.role === 'RM' && !p.out) || nearestTo(team, 20, 10) || G.players.find(p => p.team === team && !p.out);
  if (quick) {
    // Schnelle Mitte: Die Torschützen sind während Jubel und Wiederholung zurückgelaufen und stehen in der Deckung,
    // die anwerfende Mannschaft steht in der eigenen Hälfte.
    G.ball.x = 20; G.ball.y = 10;
    for (const p of G.players) {
      if (p.out) continue;
      if (p.team !== team) { const [x, y] = p.role === 'TW' ? [ownX(p.team) + sgn(p.team) * 1.2, 10] : defendSpot(p); place(p, x, y); }
      else { const s = sgn(team); if ((p.x - 20) * s > -1) p.x = 20 - s * rnd(1.5, 4); p.z = 0; p.vz = 0; p.lie = 0; }
    }
  }
  place(k, 20, 10); giveBall(k, true); G.poss = team; G.possT = 0; G.possSrc = 'restart';
  if (G.human >= 0) G.ctrl = G.human === team ? k : nearestTo(G.human, 20, 10);
}
function setupRestart(team, x, y, type, who) {
  G.phase = 'restart'; G.phaseT = 0.85; G.restart = { team, type }; G.pen = null; G.kempa = null;
  const s = sgn(team), gx = goalX(team);
  if (type === 'frei' && goalDist(x, y, gx) < 9) { const cy = clamp(y, GY1, GY2), d = Math.max(0.01, dist(x, y, gx, cy)); x = gx + (x - gx) / d * 9.1; y = cy + (y - cy) / d * 9.1; }
  x = clamp(x, 0.3, CW - 0.3); y = clamp(y, 0.1, CH - 0.1);
  const t = type === 'abwurf' ? G.goalie[team] : (who && !who.out ? who : nearestTo(team, x, y));
  if (type === 'abwurf') { x = ownX(team) + s * 2; y = 10; }
  for (const p of G.players) {
    if (p.out || p === t) continue;
    p.lie = 0; p.z = 0; p.vz = 0;
    if (p.team !== team && dist(p.x, p.y, x, y) < 3) { const d = Math.max(0.1, dist(p.x, p.y, x, y)); p.x = x + (p.x - x) / d * 3.1; p.y = y + (p.y - y) / d * 3.1; }
    p.vx = p.vy = 0; p.charge = 0; p.charging = false;
    if (p.role !== 'TW') pushOut(p);
  }
  place(t, x, y); giveBall(t, true); G.poss = team; if (type !== 'frei') { G.possT = 0; G.possSrc = 'restart'; }
  if (G.human >= 0) G.ctrl = G.human === team ? t : nearestTo(G.human, x, y);
}
function setupPenalty(team, pick) {
  G.phase = 'penalty'; G.phaseT = 1.0; if (!G.shootout) G.stats.seven[team]++;
  const s = sgn(team), gx = goalX(team);
  // Schütze: festgelegter 7-Meter-Schütze (Karriere), sonst der beste Werfer auf dem Feld
  const onCourt = G.players.filter(p => p.team === team && !p.out && !p.injured && p.role !== 'TW'), set = G.seven && onCourt.find(p => p.pid && p.pid === G.seven[team]);
  const shooter = pick || set || onCourt.sort((a, b) => b.att - a.att)[0];
  for (const p of G.players) {
    if (p.out) continue;
    if (p === shooter) place(p, gx - s * 7.1, 10);
    else if (p === G.goalie[1 - team]) place(p, gx - s * 0.7, 10);
    else if (p.role === 'TW') place(p, ownX(p.team) + s * 1.2, 10);
    else { const a = (p.i - 3.5) * 0.27 + (p.team === team ? 0 : 0.13), r = 10.5 + (p.team === team ? 0.9 : 0); place(p, gx - s * r * Math.cos(a), clamp(10 + r * Math.sin(a), 1, 19)); }
  }
  giveBall(shooter, true); G.poss = team; G.possT = 0; G.possSrc = 'restart';
  G.pen = { aim: 0, aiT: rnd(1.0, 1.7), gkGuess: 0, shooter };
  if (G.human >= 0) G.ctrl = G.human === team ? shooter : G.goalie[G.human];
  say(`Siebenmeter! ${shooter.name} gegen ${G.goalie[1 - team].name}.`);
}

// ================= Eingabe =================
const KEY = {}, KEYP = {};   // KEYP: seit dem letzten Frame gedrückt (damit kurze Tipper nicht verloren gehen)
const IN = { x: 0, y: 0, s: false, a: false, b: false, c: false, pa: false, pb: false, pc: false, ra: false, rb: false, rc: false, any: false, aHeld: 0 };
const TOUCH = { x: 0, y: 0, a: false, b: false, c: false, s: false };
addEventListener('keydown', e => {
  const inField = document.activeElement && (document.activeElement.tagName === 'INPUT');
  if (inField) return;
  const onBtn = document.activeElement && document.activeElement.tagName === 'BUTTON' && !menu.hidden;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && !onBtn) e.preventDefault();
  KEY[e.code] = true; if (!e.repeat) KEYP[e.code] = true; AU.init();
  if (e.code === 'KeyM') AU.toggle();
  if ((e.code === 'Escape' || e.code === 'KeyP') && G && !G.demo && menu.hidden) { e.stopImmediatePropagation(); togglePause(); }
  if (e.code === 'KeyT' && G && !G.demo && G.human >= 0) callTimeout(G.human);
  if (e.code === 'KeyQ' && G && !G.demo && G.human >= 0 && menu.hidden && !['intro', 'fulltime'].includes(G.phase)) { G.paused = true; ACT.subs(); }
});
addEventListener('keyup', e => { KEY[e.code] = false; });
addEventListener('blur', () => { for (const k in KEY) KEY[k] = false; });
const prevIN = { a: false, b: false, c: false, st: false };
function readInput(dt) {
  let x = 0, y = 0, a, b, c, s, km;
  // Pfeile laufen, linke Hand macht die Aktionen: S Pass, A Kempa, Leertaste Wurf, D Finte/Klau, W oder Shift Sprint (J/K/L gehen weiterhin)
  if (KEY.ArrowLeft) x -= 1; if (KEY.ArrowRight) x += 1;
  if (KEY.ArrowUp) y -= 1; if (KEY.ArrowDown) y += 1;
  const K = c => !!(KEY[c] || KEYP[c]);
  a = K('KeyS') || K('KeyA') || K('KeyJ'); b = K('Space') || K('KeyK'); c = K('KeyD') || K('KeyL');
  km = K('ShiftLeft') || K('ShiftRight'); s = km || K('KeyW');   // km: Shift + Pass = Kempa (W sprintet nur)
  for (const gp of (navigator.getGamepads ? navigator.getGamepads() : [])) {
    if (!gp) continue;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0; if (Math.hypot(ax, ay) > 0.25) { x += ax; y += ay; }
    const bt = i => gp.buttons[i] && gp.buttons[i].pressed;
    if (bt(14)) x -= 1; if (bt(15)) x += 1; if (bt(12)) y -= 1; if (bt(13)) y += 1;
    a = a || bt(0); b = b || bt(2) || bt(7); c = c || bt(1) || bt(3); s = s || bt(5) || bt(4); km = km || bt(5) || bt(4);
    if (bt(9) && !prevIN.st && G && !G.demo) togglePause(); prevIN.st = bt(9);
  }
  x += TOUCH.x; y += TOUCH.y; b = b || TOUCH.b; c = c || TOUCH.c; s = s || TOUCH.s;
  if (TOUCH.pulseA) { a = true; TOUCH.pulseA = 0; }
  IN.k = !!TOUCH.pulseK || K('KeyA') || km; TOUCH.pulseK = 0;
  for (const k in KEYP) delete KEYP[k];
  const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
  Object.assign(IN, { x, y, s, a, b, c, pa: a && !prevIN.a, pb: b && !prevIN.b, pc: c && !prevIN.c, ra: !a && prevIN.a, rb: !b && prevIN.b, rc: !c && prevIN.c });
  IN.aHeld = a ? IN.aHeld + dt : (IN.ra ? IN.aHeld : 0);
  IN.any = IN.pa || IN.pb || IN.pc || !!KEY.Enter;
  prevIN.a = a; prevIN.b = b; prevIN.c = c;
}
function clearEdges() { IN.pa = IN.pb = IN.pc = IN.ra = IN.rb = IN.rc = IN.any = false; }

// ================= Spielerdaten, Bank & Wechsel =================
const DATA_KEYS = ['name', 'num', 'role', 'star', 'trait', 'att', 'pas', 'df', 'gk', 'sp', 'sta', 'skin', 'hair', 'style', 'beard', 'band', 'tall', 'musc', 'pid', 'fitMul', 'energy', 'goals', 'shots', 'saves', 'stealsN', 'fouls', 'look', 'mins', 'injured', 'g7', 's7', 'fb', 'as', 'zs', 'ga', 'sv7', 'f7'];
function matchData(r, boost) {
  const f = r.form !== undefined ? r.form - Math.max(0, 75 - (r.fit ?? 100)) * 0.2 : 0;   // Form & Fitness aus der Karriere
  const fitMul = r.fit !== undefined ? r.fit / 100 : 1;
  return { name: r.name, num: r.num, role: r.role, star: r.star, trait: r.trait, skin: r.skin, hair: r.hair, style: r.style, beard: r.beard, band: r.band, tall: r.tall, musc: r.musc, pid: r.pid,
    att: r.att + boost + f, pas: r.pas + boost + f, df: r.def + boost + f, gk: r.gk + boost + f, sp: r.spd + boost * 0.5 + f * 0.5, sta: r.sta ?? 80,
    fitMul, energy: fitMul, goals: 0, shots: 0, saves: 0, stealsN: 0, fouls: 0, mins: 0, injured: false, look: null, g7: 0, s7: 0, fb: 0, as: 0, zs: 0, ga: 0, sv7: 0, f7: 0 };
}
// Ersatzbank für Spiele ohne Karriere: je Position ein etwas schwächerer Spieler
function quickBench(tid) {
  const T = TEAMS[tid], r = seeded(hashStr(TEAM_BASE[tid][1] + '#ersatz')), used = new Set(roster(tid).map(p => p.name)), nums = new Set(roster(tid).map(p => p.num));
  return ROLES.map((role, i) => {
    let n; do { n = SUR[(r() * SUR.length) | 0]; } while (used.has(n)); used.add(n);
    let num; do { num = role === 'TW' ? [12, 16, 33, 30][(r() * 4) | 0] : 2 + ((r() * 70) | 0); } while (nums.has(num)); nums.add(num);
    const ed = ROSTER_EDIT[tid] && ROSTER_EDIT[tid][ROLES.length + i];   // Editor: Plätze 8 bis 14 sind die Ersatzbank
    if (ed) { if (ed.name) n = ed.name; if (ed.num) num = ed.num; }
    const lv = T.r - 6, v = () => Math.round((r() - 0.5) * 10);
    return { name: n, num, role, att: lv + v(), pas: lv + v(), def: lv + v(), gk: lv + v(), spd: lv + v(), sta: lv + v(), skin: (r() * SKIN.length) | 0, hair: HAIR[(r() * HAIR.length) | 0],
      style: (r() * 6) | 0, beard: r() < 0.35, band: r() < 0.2, tall: role === 'KM' || role === 'RL' || role === 'RR', star: false, trait: '' };
  });
}
function canSub(p) { return !p.out && G.ball.owner !== p && p.z <= 0 && !(G.ball.passTo === p); }
function doSub(p, bi, quiet) {
  const t = p.team, b = G.bench[t][bi]; if (!b || !canSub(p)) return false;
  const old = {}; for (const k of DATA_KEYS) old[k] = p[k];
  for (const k of DATA_KEYS) p[k] = b[k];
  G.bench[t][bi] = old;
  p.look = lookOf(p, kit(t)); p.st = 0.5 + 0.5 * p.energy; p.warned = false; p.charging = false; p.charge = 0; p.lie = 0; p.stun = 0;
  if (G.ctrl === old) G.ctrl = p;
  if (!quiet) say(`Wechsel ${TEAMS[G.tid[t]].short}: ${p.name} kommt für ${old.name}${old.injured ? ' (verletzt)' : ''}.`, 3);
  return true;
}
// Automatische Wechsel: müde oder verletzte Spieler raus, frischer Ersatz derselben Position rein
function autoSubs() {
  for (let t = 0; t < 2; t++) {
    const auto = t !== G.human || G.autoSub;
    for (const p of G.players.filter(q => q.team === t)) {
      if (!canSub(p)) continue;
      const cands = G.bench[t].map((b, i) => [b, i]).filter(([b]) => b.role === p.role && !b.injured).sort((x, y) => y[0].energy - x[0].energy);
      if (!cands.length) continue;
      const [b, i] = cands[0];
      if (p.injured || (auto && p.energy < (p.role === 'TW' ? 0.35 : 0.52) && b.energy > p.energy + 0.25)) doSub(p, i);
    }
  }
}
