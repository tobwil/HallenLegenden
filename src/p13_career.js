// ================= Karriere: Kader, Form, Fitness, Entwicklung, Liga über mehrere Jahre =================
const CAREER_KEY = 'hl3_karriere';
let CAREER = store.get(CAREER_KEY, null);
if (CAREER && CAREER.v !== 1) CAREER = null;
// beschädigter Spielstand: beiseitelegen statt das Spiel abstürzen zu lassen (bleibt unter hl3_karriere_defekt erhalten)
if (CAREER && !(CAREER.squads && typeof CAREER.squads === 'object' && CAREER.lgOf && CAREER.season && CAREER.season.table && Array.isArray(CAREER.season.fixtures) && TEAMS[CAREER.team] && CAREER.squads[CAREER.team])) {
  store.set(CAREER_KEY + '_defekt', CAREER); store.del(CAREER_KEY); CAREER = null;
}
function saveCareer() { if (CAREER) { dropGoneRoles(); store.set(CAREER_KEY, CAREER); } }
function dropGoneRoles() {   // Kapitän oder 7-Meter-Schütze hat den Verein verlassen (Verkauf, Vertragsende, Karriereende): Amt wird frei
  const sq = CAREER.squads[CAREER.team], gone = pid => pid && !sq.some(p => p.pid === pid), c = gone(CAREER.capt), s = gone(CAREER.seven);
  if (c) { CAREER.capt = null; news('Die Kapitänsbinde ist frei: Bestimme im Kader einen neuen Kapitän.'); }
  if (s) CAREER.seven = null;   // die 7-Meter wirft wieder der beste Werfer auf dem Feld
}
const careerStamp = () => CAREER ? `${CAREER.year}-${CAREER.season.round}` : '';
const SEASON_LENS = [{ n: 'KURZ · 6', v: 6 }, { n: 'HINRUNDE · 17', v: 17 }, { n: 'VOLL · 34', v: 34 }];
const TRAINING = [
  { k: 'balance', n: 'AUSGEWOGEN', d: 'Alle Werte wachsen langsam.' },
  { k: 'att', n: 'WURF & PASS', d: 'Angriffswerte steigen schneller.' },
  { k: 'def', n: 'ABWEHR', d: 'Deckungsarbeit und Blocks.' },
  { k: 'spd', n: 'ATHLETIK', d: 'Tempo und Ausdauer: weniger Erschöpfung nach Spielen.' },
  { k: 'gk', n: 'TORWART', d: 'Spezialtraining für die Keeper.' },
  { k: 'fit', n: 'REGENERATION', d: 'Doppelte Erholung, gut bei müdem Kader.' },
];
const ATTR_N = { att: 'Wurf', pas: 'Pass', def: 'Abwehr', spd: 'Tempo', gk: 'Torwart', sta: 'Ausdauer' };
const avg = a => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
const ovr = p => p.role === 'TW' ? Math.round(p.gk * 0.85 + p.spd * 0.15) : Math.round((p.att * 2 + p.pas + p.def + p.spd) / 5);
const effOvr = p => ovr(p) + p.form - Math.max(0, 75 - p.fit) * 0.2;
const gauss = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
function pValue(p) {
  const o = ovr(p), af = p.age < 23 ? 1.5 : p.age < 28 ? 1.2 : p.age < 31 ? 0.9 : 0.5;
  return Math.max(5000, Math.round((Math.pow(Math.max(0, o - 55), 2) * 700 + 10000) * af / 5000) * 5000);
}
// Potenzial für die Anzeige: Bis 29 kann ein Spieler bis zu seinem Potenzial wachsen, ab 30 baut er ab (Höchstwert = aktueller Wert)
const potOf = p => p.age >= 30 ? ovr(p) : Math.max(ovr(p), Math.round(p.pot ?? ovr(p)));
const potTrend = p => p.age >= 30 ? 'down' : potOf(p) - ovr(p) >= 3 && p.age <= 26 ? 'up' : 'peak';
const POT_TXT = { up: 'entwickelt sich noch', peak: 'auf dem Höhepunkt', down: 'baut altersbedingt ab' };
const potCell = p => { const t = potTrend(p), v = potOf(p); return `<span class="pot pot-${t}" title="${POT_TXT[t]}">${v}${t === 'up' ? '↗' : t === 'down' ? '↘' : ''}</span>`; };
const euro = v => v >= 1e6 ? (v / 1e6).toFixed(2).replace('.', ',') + ' Mio €' : Math.round(v / 1000) + ' Tsd €';

function genPlayer(role, level, r, ageMin = 18, ageMax = 33) {
  const age = ageMin + Math.floor(r() * (ageMax - ageMin + 1)), v = () => Math.round((r() - 0.5) * 10), lv = Math.round(level);
  const p = { name: SUR[(r() * SUR.length) | 0], num: 0, role, age, att: lv + v(), pas: lv + v(), def: lv + v() + (role === 'KM' ? 3 : 0), gk: role === 'TW' ? lv + v() : 40,
    spd: lv + v() + (role === 'LA' || role === 'RA' ? 4 : 0), sta: lv + v(), skin: (r() * SKIN.length) | 0, hair: HAIR[(r() * HAIR.length) | 0], style: (r() * 6) | 0,
    beard: r() < 0.35, band: r() < 0.2, tall: role === 'KM' || role === 'RL' || role === 'RR', star: false, trait: '' };
  p.pot = Math.min(97, ovr(p) + (age < 22 ? 6 + r() * 14 : age < 26 ? r() * 7 : 0));
  return p;
}
function finalize(p, start = false) {
  Object.assign(p, { pid: CAREER.nextPid++, form: 0, fit: 100, start, sg: 0, ss: 0, apps: 0, tg: p.tg || 0, inj: 0, vt: 1 + ((Math.random() * 4) | 0) });
  p.sal = salaryFor(p); return p;
}
function fixNumbers(sq) {
  const used = new Set();
  for (const p of sq) { if (!p.num || used.has(p.num)) { let n = p.role === 'TW' ? 1 : 2; while (used.has(n)) n++; p.num = n; } used.add(p.num); }
}
function makeSquad(tid) {
  const T = TEAMS[tid], r = seeded(hashStr(TEAM_BASE[tid][1] + '#bank'));
  const sq = roster(tid).map(p => { const q = { ...p, age: 22 + ((r() * 11) | 0) }; if (p.age) q.age = p.age; /* Hallen-Legenden: festes Alter, gleicher Zufallsverlauf */ q.pot = Math.min(97, ovr(q) + (q.age < 25 ? 3 + r() * 6 : 0)); if (p.potPlus) q.pot = Math.min(99, ovr(q) + p.potPlus); delete q.potPlus; return finalize(q, true); });
  const names = new Set(sq.map(p => p.name));
  for (const role of ROLES) { const q = genPlayer(role, T.r - 7 - r() * 5, r, 18, 32); while (names.has(q.name)) q.name = SUR[(r() * SUR.length) | 0]; names.add(q.name); sq.push(finalize(q)); }
  fixNumbers(sq); return sq;
}
function ensureStarters(tid) {
  const sq = CAREER.squads[tid];
  for (const role of ROLES) {
    const c = sq.filter(p => p.role === role), st = c.filter(p => p.start);
    if (st.length === 1 && !st[0].inj) continue;
    c.forEach(p => p.start = false);
    const pool = c.filter(p => !p.inj).length ? c.filter(p => !p.inj) : c;
    if (pool.length) pool.sort((a, b) => effOvr(b) - effOvr(a))[0].start = true;
  }
}
// CPU-Aufstellung: unter 60 Fitness wird ein Spieler zunehmend geschont, sonst spielten Stars dauerhaft erschöpft.
// Bewusst ohne zusätzliche Erholung: so bleibt die Spielstärke der CPU-Vereine im Saisonmittel fast gleich
const aiPick = p => effOvr(p) - Math.max(0, 60 - p.fit) * 0.5;
function lineup(tid) {
  const sq = CAREER.squads[tid], mine = tid === CAREER.team;
  if (mine) ensureStarters(tid);
  return ROLES.map(role => { const all = sq.filter(p => p.role === role), c = all.some(p => !p.inj) ? all.filter(p => !p.inj) : all; return mine ? (c.find(p => p.start) || c[0]) : c.slice().sort((a, b) => aiPick(b) - aiPick(a))[0]; });
}
// Ersatzbank fürs Spiel: alle gesunden Kaderspieler, die nicht in der Startsieben stehen
function benchOf(tid, L) {
  const ids = new Set(L.map(p => p.pid));
  return CAREER.squads[tid].filter(p => !ids.has(p.pid) && !p.inj);
}
function strength(tid) {
  const L = lineup(tid), f = L.filter(p => p.role !== 'TW'), e = (p, k) => p[k] + p.form - Math.max(0, 75 - p.fit) * 0.2;
  return { att: avg(f.map(p => e(p, 'att') * 0.7 + e(p, 'pas') * 0.3)), def: avg(f.map(p => e(p, 'def'))), gk: e(L[0], 'gk'), L, ovr: Math.round(avg(L.map(effOvr))) };
}
const findCareerPlayer = (tid, pid) => CAREER && CAREER.squads[tid] ? CAREER.squads[tid].find(p => p.pid === pid) : null;

function careerCreate(team, lenIdx, half, diff, aiTransfers = true, coach = 0) {
  CAREER = { v: 1, year: 2026, team, len: SEASON_LENS[lenIdx].v, half, diff, nextPid: 1, training: 'balance', lgOf: {}, squads: {}, history: [], news: [], free: [], market: [], form5: [], season: null, summary: null,
    aiTransfers, aiMoney: {}, offers: [], legends: LEGENDS_VER, statFrom: { year: 2026, round: 0 }, seven: null, capt: null, board: { miss: 0 }, debt: 0, streak: 0, lastMatch: null, goal: null, issue: 1, coach: { lineup: coach === 1 || coach === 3, training: coach === 2 || coach === 3 } };
  TEAMS.forEach(t => { CAREER.lgOf[t.id] = TEAM_BASE[t.id][4]; CAREER.squads[t.id] = makeSquad(t.id); CAREER.aiMoney[t.id] = Math.round((t.r - 60) * (t.lg === 2 ? 12000 : 25000)) + 50000; });
  const T = TEAMS[team]; CAREER.money = Math.round((T.r - 60) * (T.lg === 1 ? 25000 : 12000) / 5000) * 5000 + 50000;
  newSeason(); news(`Willkommen bei ${T.n}! Saison ${CAREER.year}/${String(CAREER.year + 1).slice(2)} in der ${CAREER.season.lg}. Liga.`);
  saveCareer();
}
function roundRobin(ids) {
  const arr = ids.slice(), n = arr.length, rounds = [], home = {}, lastHome = {};
  ids.forEach(i => { home[i] = 0; lastHome[i] = null; });
  for (let r = 0; r < n - 1; r++) {
    const rd = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i], b = arr[n - 1 - i];
      // Heimrecht ausgleichen: wer weniger Heimspiele hatte bzw. zuletzt auswärts war, spielt zu Hause
      let h = home[a] !== home[b] ? (home[a] < home[b] ? a : b) : lastHome[a] === lastHome[b] ? ((r + i) % 2 ? a : b) : (lastHome[a] ? b : a);
      const g = h === a ? b : a; home[h]++; lastHome[h] = true; lastHome[g] = false; rd.push([h, g]);
    }
    rounds.push(rd); arr.splice(1, 0, arr.pop());
  }
  return rounds;
}
const leagueIds = lg => TEAMS.filter(t => CAREER.lgOf[t.id] === lg).map(t => t.id);
function newSeason() {
  const lg = CAREER.lgOf[CAREER.team], r = seeded(CAREER.year * 31 + lg);
  const ids = leagueIds(lg).sort(() => r() - 0.5), rr = roundRobin(ids);
  const fixtures = CAREER.len === 34 ? rr.concat(rr.map(rd => rd.map(([a, b]) => [b, a]))) : rr.slice(0, CAREER.len);
  const table = {}; ids.forEach(i => table[i] = { sp: 0, s: 0, u: 0, n: 0, tp: 0, tm: 0 });
  CAREER.season = { lg, round: 0, fixtures, table, last: [], scorers: {}, done: false };
  const rank = ids.map(i => [i, strength(i).ovr]).sort((x, y) => y[1] - x[1]).findIndex(x => x[0] === CAREER.team) + 1;
  CAREER.goal = lg === 1 ? (rank <= 2 ? { txt: 'Meisterschaft', pos: 1 } : rank <= 5 ? { txt: 'Platz 1 bis 4', pos: 4 } : rank <= 11 ? { txt: 'Obere Tabellenhälfte', pos: 9 } : { txt: 'Klassenerhalt', pos: 16 })
    : (rank <= 3 ? { txt: 'Aufstieg', pos: 2 } : rank <= 8 ? { txt: 'Platz 1 bis 6', pos: 6 } : { txt: 'Gesichertes Mittelfeld', pos: 12 });
  CAREER.goal.rank = rank; CAREER.lastMatch = null; CAREER.streak = 0;
  newCup(); newEuro();
  CAREER.form5 = []; CAREER.summary = null;
  refreshMarket(true);
}
function news(t) { CAREER.news.unshift(t); CAREER.news = CAREER.news.slice(0, 14); }
function standingsOf(table) {
  return Object.entries(table).map(([i, r]) => ({ i: +i, ...r, pk: r.s * 2 + r.u, d: r.tp - r.tm })).sort((x, y) => y.pk - x.pk || y.d - x.d || y.tp - x.tp);
}
function recordIn(table, a, b, ga, gb) {
  const A = table[a], B = table[b]; A.sp++; B.sp++; A.tp += ga; A.tm += gb; B.tp += gb; B.tm += ga;
  if (ga > gb) { A.s++; B.n++; } else if (gb > ga) { B.s++; A.n++; } else { A.u++; B.u++; }
}
// Simuliertes Spiel: Stärke aus den aufgestellten Spielern inkl. Form & Fitness
function simMatch(a, b, neutral) {   // neutral: kein Heimvorteil (Final Four)
  const A = strength(a), B = strength(b);
  // Schwierigkeit wirkt auch in der Simulation: Amateur hilft dir, Legende macht es schwerer
  const bonus = [2.5, 0, -2.5][CAREER.diff] || 0;
  for (const [S, tid] of [[A, a], [B, b]]) if (tid === CAREER.team) { S.att += bonus; S.def += bonus; S.gk += bonus; }
  // Erwartung aus Stärke + deutliche Streuung: Überraschungen sind möglich.
  // Skaliert auf die gewählte Halbzeitlänge (gespielt: ~5 Tore pro Team bei 2 Min, ~8 bei 3 Min, ~13 bei 5 Min statt 27 über 60 echte Minuten)
  const sc = (HALVES[CAREER.half] || HALVES[1]).s * 0.046 / 27;
  const g = (X, Y, h) => Math.max(Math.round(15 * sc), Math.round(sc * (27 + (X.att - Y.def) * 0.18 + (80 - Y.gk) * 0.08 + h) + gauss() * 3.8 * Math.sqrt(sc)));
  const ga = g(A, B, neutral ? 0 : 1), gb = g(B, A, 0), stats = {};
  const share = (S, goals) => {
    const f = S.L.filter(p => p.role !== 'TW'), w = f.map(p => ({ LA: 0.8, RA: 0.8, RL: 1.2, RR: 1.2, RM: 1, KM: 0.9 }[p.role]) * Math.pow(p.att / 80, 1.5));
    const tot = w.reduce((s, v) => s + v, 0);
    S.L.forEach(p => stats[p.pid] = { g: 0, sv: 0 });
    for (let i = 0; i < goals; i++) { let x = Math.random() * tot, k = 0; while (x > w[k] && k < w.length - 1) { x -= w[k]; k++; } stats[f[k].pid].g++; }
  };
  share(A, ga); share(B, gb);
  const sv = S => Math.max(1, Math.round((rnd(6, 13) + (S.gk - 80) / 4) * sc));
  stats[A.L[0].pid].sv = sv(A); stats[B.L[0].pid].sv = sv(B);
  const res = { a, b, ga, gb, stats, La: A.L, Lb: B.L }; simExtras(res, a, b);
  return res;
}
// Ergebnis auf Tabelle, Spieler (Tore, Form, Fitness) anwenden
// ---------- Handball-Statistik pro Spieler: Saison (p.s) und Karriere (p.k), als kompakte Zahlenreihe ----------
// sp Spiele · min Minuten · g Tore · sh Würfe · g7/s7 7-Meter Tore/Würfe · fb Tempogegenstoß-Tore · as Torvorlagen · bg Ballgewinne
// zs Zeitstrafen · potm Spieler des Spiels · sv Paraden · ga Gegentore · sv7/f7 gehaltene/erlebte 7-Meter (Torhüter)
const STK = ['sp', 'min', 'g', 'sh', 'g7', 's7', 'fb', 'as', 'bg', 'zs', 'potm', 'sv', 'ga', 'sv7', 'f7'];
const statOf = (p, which = 's') => { const a = p[which] || [], o = {}; STK.forEach((k, i) => o[k] = a[i] || 0); return o; };
function addStats(p, st) {
  for (const w of ['s', 'k']) { const a = p[w] || (p[w] = STK.map(() => 0)); STK.forEach((k, i) => { a[i] = (a[i] || 0) + (k === 'sp' ? 1 : Math.round(st[k] || 0)); }); }
}
// 7-Meter-Schütze und Kapitän: eigener Verein frei wählbar, sonst (und bei CPU-Vereinen) der beste Werfer auf dem Feld
const sevenPick = (tid, L) => { const f = L.filter(p => p.role !== 'TW'), own = tid === CAREER.team && CAREER.seven && f.find(p => p.pid === CAREER.seven); return own || f.slice().sort((a, b) => b.att - a.att)[0]; };
const isCapt = p => CAREER.capt === p.pid;
// Handball-Zahlen für simulierte Spiele (Würfe, 7-Meter, Tempogegenstöße, Vorlagen, Ballgewinne, Zeitstrafen, Torhüter).
// Eigener Zufall aus Paarung und Spieltag: Ergebnis, Torschützen-Zufall und alles andere bleiben genau wie ohne Statistik.
function simExtras(r, tA, tB) {
  const R = seeded(hashStr(`${CAREER.year}|${CAREER.season.round}|${r.a}|${r.b}|${r.ga}|${r.gb}`)), st = r.stats;
  const n = x => Math.max(0, Math.round(x + R() - 0.5));
  const wpick = (list, w) => { let x = R() * w.reduce((s, v) => s + v, 0); for (let i = 0; i < list.length; i++) if ((x -= w[i]) <= 0) return list[i]; return list[list.length - 1]; };
  const side = [];
  for (const [L, goals, tid] of [[r.La, r.ga, tA], [r.Lb, r.gb, tB]]) {
    L.forEach(p => Object.assign(st[p.pid] || (st[p.pid] = { g: 0, sv: 0 }), { min: 60, sh: 0, g7: 0, s7: 0, fb: 0, as: 0, bg: 0, zs: 0, ga: 0, sv7: 0, f7: 0 }));
    const f = L.filter(p => p.role !== 'TW'); if (!f.length) { side.push({ s7: 0, g7: 0, miss: 0 }); continue; }
    // 7-Meter: etwa jedes siebte Tor, der Schütze bekommt die verwandelten (aus den Toren der Mitspieler)
    const sh7 = sevenPick(tid, L), s7 = Math.min(n(goals * 0.15), goals + 2), conv = clamp(0.6 + (sh7.att - 75) / 100, 0.5, 0.9);
    let g7 = 0; for (let i = 0; i < s7; i++) if (R() < conv) g7++; g7 = Math.min(goals, g7);   // jeder 7-Meter einzeln: etwa drei von vier sitzen
    while (st[sh7.pid].g < g7) { const d = f.filter(p => p !== sh7 && st[p.pid].g > 0); if (!d.length) break; st[wpick(d, d.map(p => st[p.pid].g)).pid].g--; st[sh7.pid].g++; }
    Object.assign(st[sh7.pid], { g7: Math.min(g7, st[sh7.pid].g), s7 });
    // Tempogegenstöße: vor allem Außen und schnelle Spieler
    for (let i = n(goals * 0.15); i > 0; i--) { const c = f.filter(p => st[p.pid].g - st[p.pid].g7 - st[p.pid].fb > 0); if (!c.length) break; st[wpick(c, c.map(p => (p.role === 'LA' || p.role === 'RA' ? 3 : 1) * p.spd / 80)).pid].fb++; }
    // Würfe aus Trefferquote nach Position und Wurfstärke (7-Meter zählen mit)
    let miss = 0;
    for (const p of f) { const x = st[p.pid], q = clamp(({ LA: 0.66, RA: 0.66, KM: 0.7, RL: 0.52, RR: 0.52, RM: 0.55 }[p.role] || 0.58) + (p.att - 80) / 250, 0.35, 0.85), op = x.g - x.g7;
      const m = n(op * (1 - q) / q); x.sh = op + m + x.s7; miss += m + x.s7 - x.g7; }
    // Torvorlagen: gut jedes zweite Tor aus dem Spiel heraus, vor allem vom Rückraum
    for (const p of f) for (let i = st[p.pid].g - st[p.pid].g7; i > 0; i--) if (R() < 0.55) { const c = f.filter(q => q !== p); if (c.length) st[wpick(c, c.map(q => q.pas * ({ RM: 2, RL: 1.3, RR: 1.3 }[q.role] || 0.6))).pid].as++; }
    for (let i = n(goals * 0.22); i > 0; i--) st[wpick(f, f.map(p => p.def * p.spd / 6400 * (p.role === 'KM' ? 1.3 : 1))).pid].bg++;
    for (let i = n(goals * 0.1); i > 0; i--) st[wpick(f, f.map(p => p.def / 80 * ({ KM: 1.4, RM: 1.2 }[p.role] || 1))).pid].zs++;
    side.push({ s7, g7, miss, f });
  }
  // Torhüter: Gegentore, erlebte und gehaltene 7-Meter; Paraden stammen aus der Simulation (nie mehr als Fehlwürfe des Gegners)
  [[r.La, 1, r.gb], [r.Lb, 0, r.ga]].forEach(([L, o, conceded]) => { const gk = L.find(p => p.role === 'TW'); if (!gk) return; const x = st[gk.pid], os = side[o];
    x.ga = conceded; x.f7 = os.s7; x.sv7 = Math.round((os.s7 - os.g7) * 0.75);
    // mehr Paraden als Fehlwürfe geht nicht: dann haben die Werfer entsprechend öfter verworfen (vor allem der Rückraum)
    for (let d = x.sv - os.miss; d > 0 && os.f; d--) st[wpick(os.f, os.f.map(p => ({ RL: 2, RR: 2, RM: 1.6 }[p.role] || 1))).pid].sh++; });
  // Spieler des Spiels wie nach einem gespielten Spiel (Tore, Paraden, Ballgewinne, Vorlagen, Sieg)
  let best = null, bs = -1;
  for (const [L, w] of [[r.La, r.ga > r.gb], [r.Lb, r.gb > r.ga]]) for (const p of L) { const x = st[p.pid], v = x.g * 3 + x.sv * 1.6 + x.bg * 1.5 + x.as * 1.2 + (w ? 2 : 0); if (v > bs) { bs = v; best = x; } }
  if (best) best.potm = 1;
}
// Form (letzte 5 Spiele aller Wettbewerbe) und letztes direktes Duell, für den Vergleich vor dem Spiel
function noteResult(a, b, ga, gb, comp) {
  const F = CAREER.formAll ??= {};
  for (const [t, x, y] of [[a, ga, gb], [b, gb, ga]]) F[t] = (F[t] || []).concat(x > y ? 'S' : x === y ? 'U' : 'N').slice(-5);
  const M = CAREER.season.meet ??= {}; M[a < b ? a + '-' + b : b + '-' + a] = { a, b, ga, gb, comp, year: CAREER.year };
}
function applyResult(res) {
  const S = CAREER.season, { a, b, ga, gb } = res;
  recordIn(S.table, a, b, ga, gb); S.last.push([a, b, ga, gb]); noteResult(a, b, ga, gb, 'Liga');
  applyPlayers(res, true);
}
function applyPlayers(res, league) {
  const S = CAREER.season, { a, b, ga, gb, stats } = res;
  for (const [tid, L, my, their] of [[a, res.La, ga, gb], [b, res.Lb, gb, ga]]) {
    const sq = CAREER.squads[tid], played = new Set(L.map(p => p.pid)), r = my > their ? 0.3 : my === their ? 0 : -0.3;
    for (const p of sq) {
      if (played.has(p.pid)) {
        const st = stats[p.pid] || { g: 0, sv: 0 };
        const perf = p.role === 'TW' ? (st.sv - 9) * 0.09 : (st.g - my / 6) * 0.22;
        p.form = clamp(p.form * 0.65 + r + perf + rnd(-0.4, 0.4), -3, 3);     // starke Rückkehr zur Mitte: keine Siegesspirale
        p.fit = clamp(p.fit - rnd(9, 15) * (1.3 - (p.sta || 75) / 200), 20, 100); p.apps++; p.tg += st.g; addStats(p, st);
        if (league) { p.sg += st.g; p.ss += st.sv; }
        // Verletzungsrisiko: höher bei müden Spielern, sicher bei Verletzung im Spiel
        if (st.inj || Math.random() < 0.018 + (p.fit < 55 ? 0.03 : 0)) {
          p.inj = st.inj ? 1 + ((Math.random() * 4) | 0) : pick([1, 1, 1, 2, 2, 3, 4, 6]); p.start = false;
          if (tid === CAREER.team) news(`Verletzung: ${p.name} fällt ${p.inj === 1 ? 'einen Spieltag' : `${p.inj} Spieltage`} aus.`);
        }
        if (league && st.g) { const k = p.pid; S.scorers[k] = S.scorers[k] || { n: 0, tid, name: p.name }; S.scorers[k].n += st.g; S.scorers[k].tid = tid; }
      } else { p.form *= 0.9; p.fit = clamp(p.fit + 14 * (0.6 + (p.sta || 75) / 250), 0, 100); }
    }
  }
}
// Ein Spieltag: eigenes Ergebnis + alle anderen Partien
function playRound(own) {
  const S = CAREER.season; if (S.done) return;
  S.last = [];
  const fx = S.fixtures[S.round];
  for (const [a, b] of fx) {
    if (a === own.a && b === own.b) applyResult(own);
    else applyResult(simMatch(a, b));
  }
  S.posHist = (S.posHist || []).concat(standingsOf(S.table).findIndex(r => r.i === CAREER.team) + 1);   // Tabellenplatz nach jedem Spieltag (Statistik)
  const me = CAREER.team, mine = own.a === me ? [own.ga, own.gb] : [own.gb, own.ga], opp = own.a === me ? own.b : own.a;
  const res = mine[0] > mine[1] ? 'S' : mine[0] === mine[1] ? 'U' : 'N';
  const myL = own.a === me ? own.La : own.Lb, top = myL.filter(p => p.role !== 'TW').map(p => [p, (own.stats[p.pid] || {}).g || 0]).sort((x, y) => y[1] - x[1])[0];
  const gk = myL.find(p => p.role === 'TW');
  CAREER.lastMatch = { round: S.round + 1, home: own.a === me, opp, my: mine[0], their: mine[1], res, top: top ? { name: top[0].name, g: top[1] } : null, gk: gk ? { name: gk.name, sv: (own.stats[gk.pid] || {}).sv || 0 } : null };
  CAREER.streak = (CAREER.streak && Math.sign(CAREER.streak) === (res === 'S' ? 1 : res === 'N' ? -1 : 0)) ? CAREER.streak + Math.sign(CAREER.streak) : (res === 'S' ? 1 : res === 'N' ? -1 : 0);
  CAREER.form5.push(res); CAREER.form5 = CAREER.form5.slice(-5);
  const fin = roundFinances(fx, own.a === me, opp), g = fin.gate;
  if (g) CAREER.lastMatch.fans = g.n;
  noteOwnMatch(mine[0], mine[1], opp, 'Liga', own.stats, myL, g ? g.n : 0);   // Rekorde, Ehrenhalle
  news(`${S.round + 1}. Spieltag: ${res === 'S' ? 'Sieg' : res === 'U' ? 'Remis' : 'Niederlage'} gegen ${TEAMS[opp].n} (${mine[0]}:${mine[1]}). ${g ? `${g.n.toLocaleString('de-DE')} Zuschauer${g.full ? ' (ausverkauft)' : ''}: ${euro(g.money)}, ` : 'Auswärtsspiel, '}Sponsor ${euro(fin.sponsor)}, Gehälter ${euro(fin.wages)}.`);
  const gains = weeklyTraining(); if (gains.length) news(`Training: ${gains.slice(0, 3).join(', ')}${gains.length > 3 ? ' …' : ''}`);
  S.round++;
  for (const t of TEAMS) for (const p of CAREER.squads[t.id]) if (p.inj) { p.inj--; if (!p.inj && t.id === me) news(`${p.name} ist wieder fit.`); }
  ensureStarters(me);
  if (CAREER.cup) autoCup();
  if (CAREER.euro) autoEuro();
  if (S.round >= S.fixtures.length) { S.done = true; news('Letzter Spieltag gespielt. Zeit für den Saisonabschluss!'); }
  if (S.round % 2 === 0) refreshMarket(false);
  CAREER.offers = CAREER.offers.filter(o => o.exp > S.round && findCareerPlayer(me, o.pid));
  if (CAREER.aiTransfers) aiTransferRound(1);
  checkDebt();
  if (boardMood().v <= 0.2 && !CAREER.board.warned) { CAREER.board.warned = true; news('Der Vorstand ist verärgert. Wird das Saisonziel verfehlt, gibt es Konsequenzen.'); }
  saveCareer();
}
const salaryFor = p => Math.max(1500, Math.round(pValue(p) * 0.0035 / 500) * 500);
const wageBill = () => Math.round(CAREER.squads[CAREER.team].reduce((s, p) => s + (p.sal || salaryFor(p)), 0) / 1000) * 1000;
function ownFixture() { const S = CAREER.season; return S.done ? null : S.fixtures[S.round].find(f => f.includes(CAREER.team)); }
function careerSimOwn() { if (ownCupTie()) return cupSimOwn(); if (ownEuroTie()) return euroSimOwn(); const fx = ownFixture(); if (!fx) return; coachPrep(); playRound(simMatch(fx[0], fx[1])); }
function careerAfterPlayed(g) {
  const stats = {}, all = allMatchPlayers(), played = [[], []];
  const best = potm(all);
  all.forEach(p => { if (!p.pid) return;
    stats[p.pid] = { g: p.goals, sv: p.saves, min: p.mins * 30 / g.halfLen, inj: p.injured, sh: p.shots, g7: p.g7 || 0, s7: p.s7 || 0, fb: p.fb || 0, as: p.as || 0, bg: p.stealsN || 0, zs: p.zs || 0, ga: p.ga || 0, sv7: p.sv7 || 0, f7: p.f7 || 0, potm: p === best ? 1 : 0 };
    if (p.mins > 0.5 || g.lineupPids[p.team].includes(p.pid)) played[p.team].push(p.pid); });
  const La = played[0].map(id => findCareerPlayer(g.tid[0], id)).filter(Boolean), Lb = played[1].map(id => findCareerPlayer(g.tid[1], id)).filter(Boolean);
  if (g.euro) return playEuroRound({ a: g.tid[0], b: g.tid[1], ga: g.score[0], gb: g.score[1], stats, La, Lb, so: g.soWinner !== undefined, win: g.soWinner !== undefined ? g.tid[g.soWinner] : undefined });
  if (g.cup) return playCupRound({ a: g.tid[0], b: g.tid[1], ga: g.score[0], gb: g.score[1], stats, La, Lb, so: g.soWinner !== undefined, win: g.soWinner !== undefined ? g.tid[g.soWinner] : g.tid[g.score[0] > g.score[1] ? 0 : 1] });
  playRound({ a: g.tid[0], b: g.tid[1], ga: g.score[0], gb: g.score[1], stats, La, Lb });
}
function weeklyTraining() {
  if (CAREER.coach && CAREER.coach.training) { const t = coachTraining(); if (t !== CAREER.training) { CAREER.training = t; news(`Co-Trainer: Trainingsschwerpunkt jetzt ${TRAINING.find(x => x.k === t).n.toLowerCase()}.`); } }
  const tr = CAREER.training, gains = [];
  for (const p of CAREER.squads[CAREER.team]) {
    const rec = 0.6 + (p.sta || 75) / 250; p.fit = clamp(p.fit + (tr === 'fit' ? 16 : 6) * rec, 0, 100);
    const chance = p.age < 22 ? 0.3 : p.age < 26 ? 0.18 : p.age < 30 ? 0.08 : 0.03;
    const keys = tr === 'att' ? (p.role === 'TW' ? [] : ['att', 'pas']) : tr === 'def' ? (p.role === 'TW' ? [] : ['def']) : tr === 'spd' ? ['spd', 'sta'] : tr === 'gk' ? (p.role === 'TW' ? ['gk'] : []) : tr === 'fit' ? [] : (p.role === 'TW' ? ['gk', 'spd'] : ['att', 'pas', 'def', 'spd']);
    if (keys.length && Math.random() < chance * (tr === 'balance' ? 0.6 : 1) && ovr(p) < p.pot + 2) { const k = pick(keys); p[k] = Math.min(99, p[k] + 1); gains.push(`${p.name} +1 ${ATTR_N[k]}`); }
  }
  return gains;
}
// ================= Transfers =================
function refreshMarket(full) {
  const level = avg(lineup(CAREER.team).map(ovr));
  if (full || CAREER.free.length < 4) {
    CAREER.free = [];
    for (let i = 0; i < 6; i++) CAREER.free.push(finalize(genPlayer(pick(ROLES), level - 9 + Math.random() * 10, Math.random, 19, 33)));
  }
  CAREER.market = [];
  const others = TEAMS.filter(t => t.id !== CAREER.team);
  for (let tries = 0; CAREER.market.length < 7 && tries < 60; tries++) {
    const t = pick(others), sq = CAREER.squads[t.id]; if (sq.length <= 13) continue;
    const p = pick(sq); if (Math.abs(ovr(p) - level) > 10 || CAREER.market.some(m => m.pid === p.pid)) continue;
    CAREER.market.push({ pid: p.pid, from: t.id, price: Math.round(pValue(p) * 1.3 / 5000) * 5000 });
  }
  CAREER.free.forEach(p => CAREER.market.push({ pid: p.pid, from: -1, price: Math.round(pValue(p) * 0.6 / 5000) * 5000 }));
}
function marketPlayer(m) { return m.from < 0 ? CAREER.free.find(p => p.pid === m.pid) : CAREER.squads[m.from].find(p => p.pid === m.pid); }
function buyPlayer(pid) {
  const m = CAREER.market.find(x => x.pid === pid), sq = CAREER.squads[CAREER.team];
  if (!m) return 'Spieler nicht mehr verfügbar.';
  if (sq.length >= 18) return 'Der Kader ist voll (18 Spieler). Verkaufe zuerst jemanden.';
  if (CAREER.money < 0) return 'Transfersperre: Die Kasse ist im Minus.';
  if (CAREER.money < m.price) return 'Dafür reicht das Budget nicht.';
  if (sq.length >= 16 && CAREER.money - m.price < wagesPerRound() * 3) return 'Zu riskant: Nach dem Kauf wären die Gehälter der nächsten Spieltage nicht gedeckt.';
  const p = marketPlayer(m); if (!p) return 'Spieler nicht mehr verfügbar.';
  if (m.from < 0) CAREER.free = CAREER.free.filter(x => x !== p);
  else { const src = CAREER.squads[m.from]; src.splice(src.indexOf(p), 1); if (src.length < 13) { src.push(finalize(genPlayer(p.role, TEAMS[m.from].r - 10, Math.random, 18, 20))); fixNumbers(src); } ensureAiRoles(m.from); }
  CAREER.money -= m.price; finOf().transfer -= m.price; if (m.from >= 0) CAREER.aiMoney[m.from] += m.price; p.lock = { y: CAREER.year, r: CAREER.season.round + lockRounds() }; p.start = false; p.num = 0; p.vt = 2 + ((Math.random() * 3) | 0); p.sal = Math.round(salaryFor(p) * 1.1 / 500) * 500; sq.push(p); fixNumbers(sq);
  CAREER.market = CAREER.market.filter(x => x.pid !== pid);
  news(`Transfer: ${p.name} (${ROLE_LONG[p.role]}, ${ovr(p)}) kommt für ${euro(m.price)}.`); saveCareer(); return '';
}
function sellPlayer(pid) {
  const sq = CAREER.squads[CAREER.team], p = sq.find(x => x.pid === pid);
  if (!p) return '';
  if (sq.length <= 12) return 'Mindestens 12 Spieler müssen im Kader bleiben.';
  if (sq.filter(x => x.role === p.role).length <= 1) return `Du brauchst mindestens einen ${ROLE_LONG[p.role]}.`;
  if (isLocked(p)) return `${p.name} ist gerade erst gekommen und kann bis Spieltag ${p.lock.r + 1} nicht verkauft werden.`;
  const price = quickSalePrice(p), t = buyerFor(p, price);
  if (!t) return `Kein Verein kann sich ${p.name} gerade leisten.`;
  sq.splice(sq.indexOf(p), 1); CAREER.money += price; CAREER.aiMoney[t.id] -= price; finOf().transfer += price; ensureStarters(CAREER.team);
  p.start = false; p.num = 0; CAREER.squads[t.id].push(p); fixNumbers(CAREER.squads[t.id]); news(`${p.name} wechselt für ${euro(price)} zu ${t.n}.`);
  saveCareer(); return '';
}
function ensureAiRoles(tid) { const sq = CAREER.squads[tid]; for (const role of ROLES) if (!sq.some(p => p.role === role)) sq.push(finalize(genPlayer(role, TEAMS[tid].r - 10, Math.random, 18, 21))); fixNumbers(sq); }
// ================= Saisonabschluss: Auf-/Abstieg, Alterung, Karriereende =================
function develop(p, r) {
  const keys = p.role === 'TW' ? ['gk', 'spd'] : ['att', 'pas', 'def', 'spd'], before = ovr(p);
  const d = p.age <= 21 ? 2 + r() * 4 : p.age <= 24 ? r() * 3.5 : p.age <= 29 ? r() * 2 - 1 : p.age <= 32 ? -r() * 2.5 : -1 - r() * 3;
  for (const k of keys) { let dd = d + (r() - 0.5) * 2; if (dd > 0 && ovr(p) >= p.pot) dd *= 0.2; p[k] = clamp(Math.round(p[k] + dd), 35, 99); }
  return ovr(p) - before;
}
function simWholeLeague(ids) {
  const table = {}; ids.forEach(i => table[i] = { sp: 0, s: 0, u: 0, n: 0, tp: 0, tm: 0 });
  for (const rd of roundRobin(ids)) for (const [a, b] of rd) { const m = simMatch(a, b); recordIn(table, a, b, m.ga, m.gb); }
  return standingsOf(table);
}
function careerEndSeason() {
  while (CAREER.cup && CAREER.cup.winner === null) playCupRound(null, true);   // offene Pokalrunden zu Ende simulieren
  for (let i = 0; i < 12 && CAREER.euro && CAREER.euro.winner === null; i++) playEuroRound(null, true);   // ebenso den Europapokal
  const S = CAREER.season, lg = S.lg, me = CAREER.team, r = Math.random;
  const st = standingsOf(S.table), other = simWholeLeague(leagueIds(lg === 1 ? 2 : 1));
  const l1 = lg === 1 ? st : other, l2 = lg === 2 ? st : other;
  const down = l1.slice(-2).map(x => x.i), up = l2.slice(0, 2).map(x => x.i);
  const euroW = CAREER.euro ? CAREER.euro.winner : null, euroMy = euroMyBest();
  euroQualify(l1);
  const pos = st.findIndex(x => x.i === me) + 1;
  const close = seasonClose(lg, pos, S.table[me], up.includes(me), !!CAREER.cup && CAREER.cup.winner === me, euroW === me);   // Titel, Rekorde, Ehrenhalle (vor Alterung und Wechseln)
  const prize = leaguePrize(pos, lg);
  CAREER.money += prize; finOf().prize += prize;
  const verdict = boardVerdict(pos, CAREER.goal, lg), finSeason = { ...finOf() };
  const topE = Object.entries(S.scorers).sort((a, b) => b[1].n - a[1].n)[0];
  const top = topE ? { name: topE[1].name, tid: topE[1].tid, n: topE[1].n } : null;
  down.forEach(id => CAREER.lgOf[id] = 2); up.forEach(id => CAREER.lgOf[id] = 1);
  const move = down.includes(me) ? 'ab' : up.includes(me) ? 'auf' : '';
  const dev = [], retired = [], gone = [];
  for (const t of TEAMS) {
    const sq = CAREER.squads[t.id];
    for (let i = sq.length - 1; i >= 0; i--) {
      const p = sq[i]; p.age++;
      const d = develop(p, r);
      if (t.id === me && Math.abs(d) >= 2) dev.push({ name: p.name, d, o: ovr(p) });
      if (p.age >= 37 || (p.age >= 34 && r() < 0.35)) {
        if (t.id === me) retired.push(p.name);
        sq.splice(i, 1); sq.push(finalize(genPlayer(p.role, t.r - 9 + r() * 4, r, 18, 20)));
        continue;
      }
      Object.assign(p, { form: 0, fit: 100, sg: 0, ss: 0, apps: 0, inj: 0 }); delete p.s;
      // Verträge: ein Jahr weniger; ausgelaufene Spieler gehen (KI-Vereine verlängern meist)
      p.vt = (p.vt ?? 2) - 1;
      if (p.vt <= 0) {
        if (t.id !== me && Math.random() < 0.75) { p.vt = 1 + ((r() * 3) | 0); p.sal = salaryFor(p); }
        else { sq.splice(i, 1); p.start = false; p.vt = 2; CAREER.free.push(p); if (t.id === me) gone.push(p.name); continue; }
      }
    }
    fixNumbers(sq); ensureAiRoles(t.id);
  }
  CAREER.free = CAREER.free.slice(-20);
  // Jugend füllt Lücken auf: mindestens 12 (eigener Verein) bzw. 13 Spieler, zuerst auf dünn besetzten Positionen
  const youth = [];
  for (const t of TEAMS) {
    const sq = CAREER.squads[t.id], min = t.id === me ? 12 : 13;
    while (sq.length < min) {
      const role = ROLES.slice().sort((x, y) => sq.filter(p => p.role === x).length - sq.filter(p => p.role === y).length)[0];
      const p = finalize(genPlayer(role, (t.id === me ? strength(me).ovr : t.r) - 9 + r() * 4, r, 18, 19)); sq.push(p);
      if (t.id === me) youth.push(`${p.name} (${role})`);
    }
    fixNumbers(sq);
  }
  if (youth.length) news(`Aus der eigenen Jugend rücken nach: ${youth.join(', ')}.`);
  ensureStarters(me);
  var sum = { year: CAREER.year, lg, pos, prize, top, champ: st[0].i, champ1: l1[0].i, champ2: l2[0].i, up, down, move, dev: dev.sort((a, b) => b.d - a.d), retired, gone, youth, cupWinner: CAREER.cup ? CAREER.cup.winner : null, cupMy: CAREER.cup ? CAREER.cup.myBest : 0, final: st.slice(0, 18).map(x => [x.i, x.pk, x.d]) };
  const goalMet = pos <= CAREER.goal.pos;
  sum.goal = CAREER.goal.txt; sum.goalMet = goalMet; sum.board = verdict; sum.fin = finSeason; sum.money = CAREER.money;
  CAREER.history.push({ year: CAREER.year, team: me, lg, pos, champ: st[0].i, top, goal: CAREER.goal.txt, met: goalMet, cup: CAREER.cup ? CAREER.cup.winner : null, euro: euroW, euroMy });
  sum.euroWinner = euroW; sum.euroMy = euroMy; sum.titles = close.titles; sum.own = close.own;
  for (const [list, l] of [[st, lg], [other, lg === 1 ? 2 : 1]]) list.forEach((x, k) => { if (x.i !== me) CAREER.aiMoney[x.i] += leaguePrize(k + 1, l); });
  leagueIds(3).forEach(id => { CAREER.aiMoney[id] += INTL_HOME_PRIZE; });   // internationale Vereine: Prämien aus ihrer Heimatliga
  if (CAREER.aiTransfers) aiTransferRound(4);
  CAREER.year++;
  CAREER.board.warned = false; TEAMS.forEach(t => CAREER.squads[t.id].forEach(p => delete p.lock));
  newSeason();
  if (verdict.fired) CAREER.jobOffers = jobOffers();
  CAREER.summary = sum;
  news(move === 'auf' ? `AUFSTIEG! ${TEAMS[me].n} spielt ab sofort in der 1. Liga.` : move === 'ab' ? `Abstieg in die 2. Liga. Jetzt heißt es: sofort zurückkommen!` : `Neue Saison ${CAREER.year}/${String(CAREER.year + 1).slice(2)} in der ${CAREER.season.lg}. Liga.`);
  saveCareer();
  return sum;
}
// ================= KI-Transfers & Angebote für deine Spieler =================
function aiTransferRound(passes) {
  const me = CAREER.team, S = CAREER.season;
  for (let pass = 0; pass < passes; pass++) for (const t of TEAMS.slice().sort(() => Math.random() - 0.5)) {
    if (t.id === me || Math.random() > 0.1) continue;
    const L = lineup(t.id), weak = L.slice().sort((a, b) => ovr(a) - ovr(b))[0], budget = CAREER.aiMoney[t.id];
    const pool = [];
    for (const o of TEAMS) if (o.id !== me && o.id !== t.id && CAREER.squads[o.id].length > 13) for (const p of CAREER.squads[o.id]) if (p.role === weak.role) pool.push([p, o.id, pValue(p) * 1.2]);
    for (const p of CAREER.free) if (p.role === weak.role) pool.push([p, -1, pValue(p) * 0.6]);
    const c = pool.filter(([p, , pr]) => ovr(p) >= ovr(weak) + 2 && pr <= budget * 0.6).sort((x, y) => ovr(y[0]) - ovr(x[0]))[0];
    if (!c) continue;
    const [p, from, price] = c;
    if (from < 0) CAREER.free = CAREER.free.filter(x => x !== p);
    else { const src = CAREER.squads[from]; src.splice(src.indexOf(p), 1); CAREER.aiMoney[from] += price; ensureAiRoles(from); }
    CAREER.aiMoney[t.id] -= price; p.start = false; p.num = 0;
    const sq = CAREER.squads[t.id]; sq.push(p);
    if (sq.length > 16) { const out = sq.filter(x => x.role === p.role && x !== p).sort((a, b) => ovr(a) - ovr(b))[0]; if (out) { sq.splice(sq.indexOf(out), 1); out.start = false; CAREER.free.push(out); } }
    fixNumbers(sq);
    CAREER.market = CAREER.market.filter(m => m.pid !== p.pid);
    const msg = `${p.name} wechselt ${from < 0 ? 'ablösefrei' : `von ${TEAMS[from].short}`} zu ${t.short} (${euro(Math.round(price / 5000) * 5000)}).`;
    (CAREER.transferLog = CAREER.transferLog || []).unshift(msg); CAREER.transferLog = CAREER.transferLog.slice(0, 10);
    if (CAREER.lgOf[t.id] === S.lg || (from >= 0 && CAREER.lgOf[from] === S.lg)) news('Transfermarkt: ' + msg);
  }
  // Angebote für deine Spieler
  if (passes === 1 && Math.random() < 0.18 && CAREER.offers.length < 3) {
    const sq = CAREER.squads[me], level = avg(lineup(me).map(ovr));
    const cand = sq.filter(p => (ovr(p) >= level - 1 || (p.age < 22 && p.pot - ovr(p) > 8)) && !isLocked(p) && !CAREER.offers.some(o => o.pid === p.pid));
    const p = cand.length ? pick(cand) : null, buyers = TEAMS.filter(t => t.id !== me && CAREER.aiMoney[t.id] > (p ? pValue(p) * 1.1 : 1e9));
    if (p && buyers.length) {
      const t = pick(buyers), price = Math.round(pValue(p) * rnd(1.05, 1.45) / 5000) * 5000;
      CAREER.offers.push({ pid: p.pid, from: t.id, price, exp: S.round + 2 });
      news(`Angebot: ${t.n} bietet ${euro(price)} für ${p.name}. Entscheidung unter Transfers.`);
    }
  }
}
function answerOffer(pid, accept) {
  const o = CAREER.offers.find(x => x.pid === pid); if (!o) return '';
  CAREER.offers = CAREER.offers.filter(x => x !== o);
  const sq = CAREER.squads[CAREER.team], p = sq.find(x => x.pid === pid); if (!p) return '';
  if (!accept) { news(`Abgelehnt: ${p.name} bleibt. ${TEAMS[o.from].short} zieht das Angebot zurück.`); p.form = clamp(p.form + 0.5, -3, 3); saveCareer(); return ''; }
  if (sq.length <= 12) return 'Mindestens 12 Spieler müssen im Kader bleiben.';
  if (sq.filter(x => x.role === p.role).length <= 1) return `Du brauchst mindestens einen ${ROLE_LONG[p.role]}.`;
  if (CAREER.aiMoney[o.from] < o.price) return `${TEAMS[o.from].short} kann das Angebot nicht mehr bezahlen.`;
  sq.splice(sq.indexOf(p), 1); CAREER.money += o.price; CAREER.aiMoney[o.from] -= o.price; finOf().transfer += o.price; ensureStarters(CAREER.team);
  p.start = false; p.num = 0; CAREER.squads[o.from].push(p); fixNumbers(CAREER.squads[o.from]);
  news(`Verkauft: ${p.name} geht für ${euro(o.price)} zu ${TEAMS[o.from].n}.`); saveCareer(); return '';
}
// ================= Vorstand & Zeitung =================
function boardMood() {
  const S = CAREER.season, st = standingsOf(S.table), pos = st.findIndex(r => r.i === CAREER.team) + 1, g = CAREER.goal;
  if (!S.round) return { v: 0.7, txt: 'Erwartungsvoll' };
  const d = g.pos - pos, w = Math.min(1, S.round / 6);
  const v = clamp(0.6 + (d / 8) * w + (CAREER.streak || 0) * 0.04, 0.05, 1);
  return { v, txt: v > 0.8 ? 'Begeistert' : v > 0.6 ? 'Zufrieden' : v > 0.4 ? 'Abwartend' : v > 0.2 ? 'Unruhig' : 'Verärgert' };
}
function headline() {
  const m = CAREER.lastMatch, me = TEAMS[CAREER.team];
  if (!m) return { h: `${me.short.toUpperCase()} STARTET IN DIE SAISON`, s: `Der Vorstand gibt das Ziel aus: ${CAREER.goal.txt}. Die Konkurrenz sieht ${me.short} auf Rang ${CAREER.goal.rank} der Kräfteverhältnisse.` };
  const o = TEAMS[m.opp], diff = m.my - m.their, sc = `${m.my}:${m.their}`;
  const r = seeded(CAREER.year * 97 + m.round), pk = a => a[(r() * a.length) | 0];
  let h;
  if (diff >= 8) h = pk([`${me.short.toUpperCase()} ZERLEGT ${o.short.toUpperCase()}!`, `GALA! ${sc} GEGEN ${o.short.toUpperCase()}`, `${o.short.toUpperCase()} CHANCENLOS`]);
  else if (diff > 0) h = pk([`${me.short.toUpperCase()} BEZWINGT ${o.short.toUpperCase()}`, `ARBEITSSIEG GEGEN ${o.short.toUpperCase()}`, `ZWEI PUNKTE FÜR ${me.short.toUpperCase()}`]);
  else if (diff === 0) h = pk([`PUNKTETEILUNG MIT ${o.short.toUpperCase()}`, `REMIS-KRIMI: ${sc}`]);
  else if (diff > -8) h = pk([`PLEITE GEGEN ${o.short.toUpperCase()}`, `${me.short.toUpperCase()} VERLIERT ${sc}`, `KNAPP DANEBEN IN ${m.home ? me.short.toUpperCase() : o.short.toUpperCase()}`]);
  else h = pk([`DEBAKEL! ${sc} GEGEN ${o.short.toUpperCase()}`, `${me.short.toUpperCase()} GEHT UNTER`]);
  const s = [`${m.round}. Spieltag, ${m.home ? (m.fans ? `vor ${m.fans.toLocaleString('de-DE')} Zuschauern` : 'vor heimischem Publikum') : 'auswärts'}: ${me.short} ${m.my > m.their ? 'gewinnt' : m.my === m.their ? 'spielt' : 'verliert'} ${sc} gegen ${o.n}.`];
  if (m.top && m.top.g) s.push(`Bester Werfer war ${m.top.name} mit ${m.top.g} Toren.`);
  if (m.gk) s.push(`${m.gk.name} kam auf ${m.gk.sv} Paraden.`);
  if (Math.abs(CAREER.streak) >= 3) s.push(CAREER.streak > 0 ? `Das ist der ${CAREER.streak}. Sieg in Folge!` : `Bereits die ${-CAREER.streak}. Niederlage am Stück.`);
  return { h, s: s.join(' ') };
}
// alte Spielstände ergänzen
if (CAREER) {
  CAREER.aiTransfers ??= false; CAREER.coach ??= { lineup: false, training: false };
  CAREER.statFrom ??= { year: CAREER.year, round: CAREER.season.round };   // Spieler-Statistik zählt ab diesem Update
  TEAMS.forEach(t => (CAREER.squads[t.id] || []).forEach(p => { p.sta ??= 75; p.inj ??= 0; p.vt ??= 1 + ((Math.random() * 3) | 0); p.sal ??= salaryFor(p); })); CAREER.offers ??= []; CAREER.streak ??= 0; CAREER.lastMatch ??= null; CAREER.issue ??= 1;
  if (!CAREER.aiMoney) { CAREER.aiMoney = {}; TEAMS.forEach(t => CAREER.aiMoney[t.id] = Math.round((t.r - 60) * 20000) + 50000); }
  TEAMS.forEach(t => { if (CAREER.squads[t.id]) return; CAREER.squads[t.id] = makeSquad(t.id); CAREER.lgOf[t.id] = TEAM_BASE[t.id][4]; CAREER.aiMoney[t.id] = Math.round((t.r - 60) * 25000) + 50000; });   // später hinzugekommene Vereine (international)
  if (!CAREER.goal) CAREER.goal = { txt: 'Obere Tabellenhälfte', pos: 9, rank: 9 };
  // umbenannte Legenden: überall im Spielstand (Kader, Torjäger, Ehrenhalle, Rekorde, Zeitung, Historie)
  for (const [v, [from, to]] of Object.entries(LEGEND_RENAMED)) if ((CAREER.legends || 0) < +v) CAREER = JSON.parse(JSON.stringify(CAREER).replace(new RegExp(`\\b${from}\\b`, 'g'), to));
  // Hallen-Legenden nachrüsten: der Spieler auf ihrem Platz bekommt Namen und Aussehen (falls er noch im Verein ist und es sie noch nicht gibt)
  if ((CAREER.legends || 0) < LEGENDS_VER) {
    for (const [k, L] of Object.entries(LEGENDS)) {
      const tid = TEAM_BASE.findIndex(b => b[0] === k), plain = roster(tid, true), orig = plain[legendSlot(L, plain)], sq = CAREER.squads[tid];
      const p = orig && !TEAMS.some(t => CAREER.squads[t.id].some(x => x.name === L.name)) && sq.find(x => x.name === orig.name && x.role === orig.role);
      if (p) LEGEND_KEYS.forEach(key => { if (L[key] !== undefined) p[key] = L[key]; });
    }
    CAREER.legends = LEGENDS_VER; saveCareer();
  }
}

// ================= Co-Trainer =================
// Aufstellung: pro Position der Spieler mit der besten Tagesform (Stärke, Form, Fitness). Müde Stammspieler werden geschont.
function coachPrep() {
  if (!CAREER.coach || !CAREER.coach.lineup) return;
  const sq = CAREER.squads[CAREER.team], changes = [];
  for (const role of ROLES) {
    const c = sq.filter(p => p.role === role); if (!c.length) continue;
    const old = c.find(p => p.start), best = c.slice().sort((a, b) => effOvr(b) - effOvr(a))[0];
    c.forEach(p => p.start = p === best);
    if (old && old !== best) changes.push(`${best.name} für ${old.name}${old.fit < 65 ? ' (geschont)' : ''}`);
  }
  if (changes.length) news(`Co-Trainer stellt um: ${changes.join(', ')}.`);
}
function coachTraining() {
  const sq = CAREER.squads[CAREER.team], st = sq.filter(p => p.start);
  if (avg(st.map(p => p.fit)) < 70) return 'fit';
  const f = st.filter(p => p.role !== 'TW'), gk = st.find(p => p.role === 'TW');
  const a = avg(f.map(p => (p.att + p.pas) / 2)), d = avg(f.map(p => p.def)), s = avg(f.map(p => p.spd));
  if (gk && gk.gk < Math.min(a, d) - 4) return 'gk';
  const low = Math.min(a, d, s);
  return low === d && a - d > 3 ? 'def' : low === a && d - a > 3 ? 'att' : low === s && Math.min(a, d) - s > 3 ? 'spd' : 'balance';
}
function coachTip() {
  const sq = CAREER.squads[CAREER.team], tired = sq.filter(p => p.start && p.fit < 62).sort((a, b) => a.fit - b.fit)[0];
  if (tired) { const alt = sq.filter(p => p.role === tired.role && !p.start).sort((a, b) => effOvr(b) - effOvr(a))[0]; if (alt) return `Ich würde ${tired.name} schonen und ${alt.name} bringen.`; }
  const t = coachTraining(); if (t !== CAREER.training) return `Mein Trainingstipp: ${TRAINING.find(x => x.k === t).n.toLowerCase()}.`;
  return 'Die Mannschaft ist gut eingestellt.';
}
