// ================= Europapokal =================
// 16 Vereine: 3 aus der 1. Liga (Platz 1 und 2, dazu der Pokalsieger bzw. der Dritte) und 13 internationale Vereine.
// Gruppenphase mit 4 Gruppen à 4 (Hin- und Rückspiel), Viertelfinale (Gruppensieger mit Heimrecht), Final Four in neutraler Halle.
// Kompakt bei 6 Spieltagen: 8 Vereine, direkt Viertelfinale, dann Final Four.
const EURO_KO = ['VIERTELFINALE', 'HALBFINALE', 'FINALE'];
// Geeicht an der Liga: Ein Erstligist macht pro Saison im Schnitt etwa 60.000 € Plus, ein Teilnehmer verdient im Europapokal
// im Schnitt etwa das Doppelte bis Dreifache, der Sieger rund 400.000 €. Mehr würde die Budgets der Dauerteilnehmer aufblähen.
const EURO_PRIZE = { start: 25000, win: 10000, draw: 5000, reach: [20000, 40000, 60000], title: 120000 };   // reach: Viertelfinale, Final Four, Finale erreicht
const EURO_GATE = 0.6;   // Anteil der Zuschauereinnahmen, der beim Gastgeber bleibt (Rest: Verband, Reise, Organisation)
const INTL_HOME_PRIZE = 25000;   // internationale Vereine: Prämie aus der (nicht simulierten) Heimatliga, dazu fast jedes Jahr Europapokal-Geld
const GROUP_N = 'ABCD';
const euroEvent = r => r >= 1 ? { title: 'FINAL FOUR', stage: r === 1 ? 'EUROPAPOKAL · HALBFINALE' : 'EUROPAPOKAL · FINALE', trophy: 'EUROPAPOKAL', final: r === 2 } : null;
function euroPay(id, v) { if (!v) return; if (id === CAREER.team) { CAREER.money += v; const F = finOf(); F.euro = (F.euro || 0) + v; } else CAREER.aiMoney[id] += v; }
// Qualifikation: aus der Vorsaison gespeichert, sonst (erste Saison) die stärksten Erstligisten
function euroGermans(n) {
  const strong = leagueIds(1).sort((a, b) => strength(b).ovr - strength(a).ovr);
  return [...new Set((CAREER.euroQual || []).filter(id => CAREER.lgOf[id] === 1).concat(strong))].slice(0, n);
}
function newEuro() {
  const len = CAREER.season.fixtures.length, compact = len < 10;
  const ger = euroGermans(compact ? 2 : 3), intl = leagueIds(3).sort((a, b) => strength(b).ovr - strength(a).ovr), nI = compact ? 6 : 13;
  const rest = intl.slice(nI - 3).sort(() => Math.random() - 0.5);
  const teams = ger.concat(intl.slice(0, nI - 3), rest.slice(0, 3));
  const E = CAREER.euro = { compact, teams, groups: null, gfix: [], gres: [], gsched: [], gmd: 0, table: {}, ko: [], ksched: [], kround: 0, winner: null, paid: false };
  const at = f => Math.max(1, Math.min(len, Math.round(len * f)));
  if (compact) {
    const s = teams.slice().sort((a, b) => strength(b).ovr - strength(a).ovr);
    E.ko[0] = { ties: [[s[0], s[7]], [s[3], s[4]], [s[1], s[6]], [s[2], s[5]]], rows: null };   // Stärkste mit Heimrecht gegen Schwächste
    E.ksched = [at(0.5), len];
    return E;
  }
  // Lostöpfe nach Stärke, deutsche Vereine kommen in verschiedene Gruppen
  const s = teams.slice().sort((a, b) => strength(b).ovr - strength(a).ovr), groups = [[], [], [], []];
  for (let pot = 0; pot < 4; pot++) {
    const p = s.slice(pot * 4, pot * 4 + 4).sort(() => Math.random() - 0.5);
    p.forEach((id, i) => groups[i].push(id));
  }
  for (let tries = 0; tries < 30; tries++) {   // zwei deutsche Vereine in einer Gruppe: innerhalb des Topfs tauschen
    const gi = groups.findIndex(g => g.filter(id => ger.includes(id)).length > 1); if (gi < 0) break;
    const id = groups[gi].filter(x => ger.includes(x))[1], pos = groups[gi].indexOf(id), gj = groups.findIndex(g => !g.some(x => ger.includes(x)));
    [groups[gi][pos], groups[gj][pos]] = [groups[gj][pos], groups[gi][pos]];
  }
  E.groups = groups;
  teams.forEach(id => E.table[id] = { sp: 0, s: 0, u: 0, n: 0, tp: 0, tm: 0 });
  const rr = groups.map(g => roundRobin(g));
  for (let md = 0; md < 6; md++) E.gfix.push(rr.flatMap(rd => md < 3 ? rd[md] : rd[md - 3].map(([a, b]) => [b, a])));
  const gs = []; [0.1, 0.2, 0.3, 0.45, 0.6, 0.7].forEach((f, i) => gs.push(Math.min(len - 2, Math.max(i ? gs[i - 1] + 1 : 1, at(f)))));
  E.gsched = gs; E.ksched = [Math.max(gs[5] + 1, at(0.85)), len];
  return E;
}
const groupOf = id => CAREER.euro.groups ? CAREER.euro.groups.findIndex(g => g.includes(id)) : -1;
function groupTable(gi) { const E = CAREER.euro, t = {}; E.groups[gi].forEach(id => t[id] = E.table[id]); return standingsOf(t); }
// Was steht als Nächstes an? force: am Saisonende alles Offene ohne Termin ausspielen
function euroNext(force) {
  const E = CAREER.euro; if (!E || E.winner !== null) return null;
  const R = CAREER.season.round;
  if (!E.compact && E.gmd < 6) return force || R >= E.gsched[E.gmd] ? { type: 'group', md: E.gmd } : null;
  return force || R >= E.ksched[E.kround === 0 ? 0 : 1] ? { type: 'ko', r: E.kround } : null;
}
const euroDue = () => !!euroNext();
function euroTies(n) { const E = CAREER.euro; return !n ? [] : n.type === 'group' ? E.gfix[n.md] : E.ko[n.r].ties; }
function ownEuroTie() { return euroTies(euroNext()).find(t => t.includes(CAREER.team)) || null; }
function autoEuro() { while (euroDue() && !ownEuroTie()) playEuroRound(null); }
const euroLabel = n => n.type === 'group' ? `EUROPAPOKAL · GRUPPE ${GROUP_N[groupOf(CAREER.team)] || ''} · ${n.md + 1}. SPIELTAG` : `EUROPAPOKAL · ${EURO_KO[n.r]}`;
// Eine Runde: dein Spiel (gespielt oder simuliert) und alle anderen Partien
function playEuroRound(own, force) {
  const E = CAREER.euro, n = euroNext(force), me = CAREER.team; if (!n) return;
  if (!E.paid) { E.teams.forEach(id => euroPay(id, EURO_PRIZE.start)); E.paid = true; }
  const ko = n.type === 'ko', neutral = ko && n.r >= 1, rows = [];
  for (const [a, b] of euroTies(n)) {
    if (!neutral) { const g = attendance(a, b, 3); g.money = Math.round(g.money * EURO_GATE); if (a === me) { CAREER.money += g.money; const F = finOf(); F.euro = (F.euro || 0) + g.money; F.fans.push(g.n); } else CAREER.aiMoney[a] += g.money; }
    let r = own && own.a === a && own.b === b ? own : null;
    if (!r) { const m = simMatch(a, b, neutral); r = { a, b, ga: m.ga, gb: m.gb, stats: m.stats, La: m.La, Lb: m.Lb }; }
    if (ko && r.win === undefined) { if (r.ga === r.gb) { r.so = true; r.win = Math.random() < 0.5 + (strength(a).ovr - strength(b).ovr) * 0.03 ? a : b; } else r.win = r.ga > r.gb ? a : b; }
    applyPlayers(r, false);
    rows.push([a, b, r.ga, r.gb, !!r.so, ko ? r.win : null]); noteResult(a, b, r.ga, r.gb, 'Europapokal');
    if (!ko) { recordIn(E.table, a, b, r.ga, r.gb); for (const [id, x, y] of [[a, r.ga, r.gb], [b, r.gb, r.ga]]) euroPay(id, x > y ? EURO_PRIZE.win : x === y ? EURO_PRIZE.draw : 0); }
    if (a === me || b === me) {
      const opp = a === me ? b : a, sc = a === me ? `${r.ga}:${r.gb}` : `${r.gb}:${r.ga}`, my = a === me ? r.ga : r.gb, th = a === me ? r.gb : r.ga;
      E.last = { opp, sc, so: !!r.so, label: euroLabel(n) };
      noteOwnMatch(my, th, opp, 'Europapokal', r.stats, a === me ? r.La : r.Lb, 0);
      news(ko ? `Europapokal ${EURO_KO[n.r]}: ${r.win === me ? 'Weiter!' : 'Ausgeschieden.'} ${sc}${r.so ? ' nach 7-Meter-Werfen' : ''} gegen ${TEAMS[opp].n}.`
        : `Europapokal, Gruppe ${GROUP_N[groupOf(me)]}: ${my > th ? 'Sieg' : my === th ? 'Remis' : 'Niederlage'} ${sc} gegen ${TEAMS[opp].n}.`);
    }
  }
  if (!ko) {
    E.gres[n.md] = rows; E.gmd++;
    if (E.gmd === 6) {   // Viertelfinale: Gruppensieger mit Heimrecht, Sieger benachbarter Partien treffen im Halbfinale aufeinander
      const t = [0, 1, 2, 3].map(groupTable);
      E.ko[0] = { ties: [[t[0][0].i, t[1][1].i], [t[2][0].i, t[3][1].i], [t[1][0].i, t[0][1].i], [t[3][0].i, t[2][1].i]], rows: null };
      const q = E.ko[0].ties.flat(); q.forEach(id => euroPay(id, EURO_PRIZE.reach[0]));
      news(q.includes(me) ? `Europapokal: Viertelfinale erreicht! Gegner: ${TEAMS[E.ko[0].ties.find(x => x.includes(me)).find(x => x !== me)].n}.` : E.teams.includes(me) ? 'Europapokal: Aus in der Gruppenphase.' : `Europapokal: Gruppenphase beendet.`);
    }
  } else {
    E.ko[n.r].rows = rows;
    const w = rows.map(r => r[5]);
    if (n.r === 2) { E.winner = w[0]; euroPay(w[0], EURO_PRIZE.title); news(E.winner === me ? `EUROPAPOKALSIEG! ${TEAMS[me].n} gewinnt das Final Four!` : `Europapokalsieger: ${TEAMS[E.winner].n}.`); }
    else {
      const ties = []; for (let i = 0; i < w.length; i += 2) ties.push([w[i], w[i + 1]]);
      E.ko[n.r + 1] = { ties, rows: null }; E.kround++; w.forEach(id => euroPay(id, EURO_PRIZE.reach[n.r + 1]));
    }
  }
  saveCareer();
  if (!force) autoEuro();   // Final Four: Nach dem eigenen Halbfinale ist das Finale sofort fällig, ohne eigenen Verein gleich simulieren
}
function euroSimOwn() {
  const t = ownEuroTie(), n = euroNext(); if (!t) return; coachPrep();
  const m = simMatch(t[0], t[1], n.type === 'ko' && n.r >= 1);
  playEuroRound({ a: t[0], b: t[1], ga: m.ga, gb: m.gb, stats: m.stats, La: m.La, Lb: m.Lb });
}
// Wie weit kam dein Verein? (Historie)
function euroMyBest() {
  const E = CAREER.euro, me = CAREER.team; if (!E || !E.teams.includes(me)) return '';
  if (E.winner === me) return 'Sieger';
  for (let r = 2; r >= 0; r--) if (E.ko[r] && E.ko[r].ties.some(t => t.includes(me))) return ['Viertelfinale', 'Halbfinale', 'Finale'][r];
  return E.compact ? 'Viertelfinale' : 'Gruppenphase';
}
// Startplätze für die nächste Saison: Platz 1 und 2 der 1. Liga, dazu der Pokalsieger (falls Erstligist und nicht schon dabei), sonst der Dritte
function euroQualify(l1table) {
  const top = l1table.slice(0, 3).map(x => x.i), cw = CAREER.cup ? CAREER.cup.winner : null;
  const q = top.slice(0, 2); q.push(cw !== null && CAREER.lgOf[cw] === 1 && !q.includes(cw) ? cw : top[2]);
  CAREER.euroQual = q;
  if (q.includes(CAREER.team)) news(`Qualifiziert! ${TEAMS[CAREER.team].n} spielt nächste Saison im Europapokal.`);
}
