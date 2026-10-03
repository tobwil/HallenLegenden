// ================= Pokal (K.-o.-Runden mit Final Four) & Verträge =================
const CUP_ROUNDS = ['1. RUNDE', 'ACHTELFINALE', 'VIERTELFINALE', 'HALBFINALE', 'FINALE'];
const CUP_PRIZE = [30000, 50000, 80000, 120000, 300000];   // Prämie für gewonnene Runde
function newCup() {
  // 32 Teilnehmer: alle aus der 1. Liga + die 14 stärksten der 2. Liga, dein Verein ist immer dabei
  const l1 = leagueIds(1), l2 = leagueIds(2).sort((a, b) => strength(b).ovr - strength(a).ovr);
  let field = l1.concat(l2.slice(0, 14));
  if (!field.includes(CAREER.team)) { field = field.slice(0, 31); field.push(CAREER.team); }
  const len = CAREER.season.fixtures.length, sched = [];
  [0.15, 0.35, 0.55, 0.8].forEach((f, i) => sched.push(Math.min(len, Math.max(i ? sched[i - 1] + 1 : 1, Math.round(len * f)))));
  sched.push(sched[CUP_F4]);   // Final Four: Halbfinale und Finale am selben Termin
  CAREER.cup = { round: 0, sched, ties: cupDraw(field), results: [], winner: null, myOut: false, myBest: 0 };
}
function cupDraw(ids) { const a = ids.slice().sort(() => Math.random() - 0.5), t = []; for (let i = 0; i < a.length; i += 2) t.push([a[i], a[i + 1]]); return t; }
const cupDue = () => { const C = CAREER.cup; return !!(C && C.winner === null && CAREER.season.round >= C.sched[C.round]); };   // winner kann Verein 0 sein
const CUP_F4 = 3;   // ab dem Halbfinale: Final Four an einem Termin in neutraler Halle
const cupEvent = round => round >= CUP_F4 ? { title: 'FINAL FOUR', stage: round === CUP_F4 ? 'POKAL · HALBFINALE' : 'POKAL · FINALE', trophy: 'POKAL', final: round === CUP_F4 + 1 } : null;
function ownCupTie() { return cupDue() ? CAREER.cup.ties.find(t => t.includes(CAREER.team)) || null : null; }
function autoCup() { while (cupDue() && !ownCupTie()) playCupRound(null); }
// Eine Pokalrunde: dein Ergebnis (gespielt/simuliert) + alle anderen Partien, Unentschieden per 7-Meter-Werfen
function playCupRound(own, force) {
  const C = CAREER.cup, me = CAREER.team, rows = [];
  for (const [a, b] of C.ties) {
    if (C.round < CUP_F4) cupGate(a, b, C.round);   // Zuschauereinnahmen für den Gastgeber (Final Four: neutrale Halle)
    let r = own && own.a === a && own.b === b ? own : null;
    if (!r) {
      const m = simMatch(a, b, C.round >= CUP_F4); r = { a, b, ga: m.ga, gb: m.gb, stats: m.stats, La: m.La, Lb: m.Lb };
      if (r.ga === r.gb) { r.so = true; r.win = Math.random() < 0.5 + (strength(a).ovr - strength(b).ovr) * 0.03 ? a : b; } else r.win = r.ga > r.gb ? a : b;
    }
    applyPlayers(r, false);
    rows.push([r.a, r.b, r.ga, r.gb, !!r.so, r.win]);
    if (a === me || b === me) {
      const opp = a === me ? b : a, won = r.win === me, sc = a === me ? `${r.ga}:${r.gb}` : `${r.gb}:${r.ga}`;
      noteOwnMatch(a === me ? r.ga : r.gb, a === me ? r.gb : r.ga, opp, 'Pokal', r.stats, a === me ? r.La : r.Lb, 0);
      if (won) { CAREER.money += CUP_PRIZE[C.round]; finOf().cup += CUP_PRIZE[C.round]; C.myBest = C.round + 1; news(`Pokal ${CUP_ROUNDS[C.round]}: Weiter! ${sc}${r.so ? ' nach 7-Meter-Werfen' : ''} gegen ${TEAMS[opp].n}. Prämie ${euro(CUP_PRIZE[C.round])}.`); }
      else { C.myOut = true; news(`Pokal-Aus im ${CUP_ROUNDS[C.round].toLowerCase()}: ${sc}${r.so ? ' nach 7-Meter-Werfen' : ''} gegen ${TEAMS[opp].n}.`); }
      CAREER.cupLast = { round: C.round, opp, sc, won, so: !!r.so };
    }
  }
  C.results.push({ round: C.round, rows });
  const alive = rows.map(r => r[5]);
  C.round++;
  if (C.round >= CUP_ROUNDS.length) { C.winner = alive[0]; news(C.winner === me ? `POKALSIEG! ${TEAMS[me].n} holt den Pokal!` : `Pokalsieger: ${TEAMS[C.winner].n}.`); }
  else { C.ties = []; for (let i = 0; i < alive.length; i += 2) C.ties.push([alive[i], alive[i + 1]]); }   // fester Turnierbaum: Sieger benachbarter Partien treffen aufeinander
  saveCareer();
  if (!force) autoCup();   // Final Four: Finale am selben Termin wie das Halbfinale
}
function cupSimOwn() { const t = ownCupTie(); if (!t) return; coachPrep(); const m = simMatch(t[0], t[1], CAREER.cup.round >= CUP_F4); const r = { a: t[0], b: t[1], ga: m.ga, gb: m.gb, stats: m.stats, La: m.La, Lb: m.Lb }; if (r.ga === r.gb) { r.so = true; r.win = Math.random() < 0.5 ? r.a : r.b; } else r.win = r.ga > r.gb ? r.a : r.b; playCupRound(r); }
// ================= Verträge =================
function extendDemand(p) {
  const me = TEAMS[CAREER.team], lvl = avg(lineup(CAREER.team).map(ovr));
  let f = p.age < 24 ? 1.15 : p.age > 31 ? 0.9 : 1.05;
  if (CAREER.season.lg === 2 && ovr(p) > lvl + 4) f *= 1.3;          // Leistungsträger in Liga 2 wollen mehr
  if (p.form > 1.5) f *= 1.08;
  return Math.round(salaryFor(p) * f / 500) * 500;
}
function extendContract(pid, years) {
  const p = findCareerPlayer(CAREER.team, pid); if (!p) return '';
  const sal = extendDemand(p), bonus = sal * 5;
  if (CAREER.money < bonus) return `Für die Handgeld-Zahlung (${euro(bonus)}) reicht das Budget nicht.`;
  CAREER.money -= bonus; p.vt = Math.max(1, p.vt) + years; p.sal = sal;
  news(`Vertrag verlängert: ${p.name} bleibt ${years} weitere ${years === 1 ? 'Saison' : 'Saisons'} (${euro(sal * REF_LEN)} pro Saison).`); saveCareer(); return '';
}
if (CAREER && CAREER.cup === undefined) { newCup(); saveCareer(); }
