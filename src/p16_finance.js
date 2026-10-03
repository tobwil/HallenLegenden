// ================= Finanzen: Zuschauer, Sponsoren, Gehälter, Vorstand, Schulden =================
// Gehälter (p.sal) und Einnahmen sind auf eine Saison mit 17 Spieltagen geeicht. Bei 6 oder 34 Spieltagen wird pro Spieltag
// umgerechnet, damit eine Saison immer ähnlich viel kostet und einbringt. Ablösen und Prämien bleiben feste Beträge.
const REF_LEN = 17;
const seasonScale = () => REF_LEN / Math.max(1, CAREER.season.fixtures.length);
const hallCap = tid => clamp(Math.round((1000 + (TEAMS[tid].r - 65) * 330) / 100) * 100, 1300, 9800);
const ticketNet = (lg, cup) => (lg === 2 ? 6 : 7) * (cup ? 1.2 : 1);                     // Erlös pro Zuschauer nach Kosten
const sponsorOf = tid => CAREER.lgOf[tid] !== 2 ? 5000 + (TEAMS[tid].r - 75) * 250 : 12000 + (TEAMS[tid].r - 70) * 300;   // 1. Liga und international gleich
const leaguePrize = (pos, lg) => Math.round((19 - pos) * (lg === 1 ? 15000 : 6000) / 5000) * 5000;   // TV-Geld und Prämie nach Platz
// Zuschauereinnahmen über die tatsächliche Zahl der Heimspiele hochrechnen (2 oder 3 Heimspiele bei 6 Spieltagen zählen gleich viel)
function homeScale(tid) { const S = CAREER.season, H = S.homes ??= {}; H[tid] ??= S.fixtures.filter(rd => rd.some(([a]) => a === tid)).length; return REF_LEN / 2 / Math.max(1, H[tid]); }
const wagesOf = tid => CAREER.squads[tid].reduce((s, p) => s + (p.sal || salaryFor(p)), 0);
const wagesPerRound = () => Math.round(wageBill() * seasonScale() / 1000) * 1000;           // was dein Verein pro Spieltag zahlt
// Zuschauer: Kapazität × Auslastung. Auslastung steigt mit Tabellenplatz, Siegesserie, starkem Gegner und im Pokal
function attendance(home, away, cupRound) {
  const S = CAREER.season, lg = CAREER.lgOf[home], cap = hallCap(home);
  let rate = lg === 2 ? 0.5 : 0.62;
  if (S.table[home]) { const st = standingsOf(S.table), f = st.length > 1 ? st.findIndex(r => r.i === home) / (st.length - 1) : 0.5; if (S.round) rate += 0.3 * (0.5 - f); }
  rate += (TEAMS[away].r - 78) * 0.008;
  if (home === CAREER.team) rate += clamp((CAREER.streak || 0) * 0.02, -0.08, 0.08);
  if (cupRound !== undefined) rate += 0.12 + cupRound * 0.05;
  rate = clamp(rate + rnd(-0.05, 0.05), 0.3, 1);
  const full = rate >= 0.99, n = full ? cap : Math.round(cap * rate / 10) * 10;
  return { n, cap, full, money: Math.round(n * ticketNet(lg, cupRound !== undefined)) };
}
function finOf() { return CAREER.season.fin ??= { gate: 0, sponsor: 0, cup: 0, prize: 0, bonus: 0, transfer: 0, wages: 0, fans: [] }; }
// Ein Liga-Spieltag: dein Verein (Zuschauer bei Heimspiel, Sponsor, Gehälter) und alle KI-Vereine nach demselben Modell
function roundFinances(fx, myHome, myOpp) {
  const me = CAREER.team, sc = seasonScale(), F = finOf(), out = { gate: null, sponsor: Math.round(sponsorOf(me) * sc), wages: wagesPerRound() };
  if (myHome) { const a = attendance(me, myOpp); a.money = Math.round(a.money * homeScale(me)); out.gate = a; F.gate += a.money; F.fans.push(a.n); CAREER.money += a.money; }
  CAREER.money += out.sponsor - out.wages; F.sponsor += out.sponsor; F.wages += out.wages;
  const homeIn = new Map(fx.map(([a, b]) => [a, b]));
  for (const t of TEAMS) {
    if (t.id === me) continue;
    let g;
    if (homeIn.has(t.id)) g = attendance(t.id, homeIn.get(t.id)).money * homeScale(t.id);          // Heimspiel in deiner Liga
    else if (CAREER.lgOf[t.id] !== CAREER.season.lg) g = attendance(t.id, t.id).money * 0.5 * sc;  // andere Liga: im Schnitt jedes zweite Spiel daheim
    else g = 0;
    CAREER.aiMoney[t.id] += Math.round(g + (sponsorOf(t.id) - wagesOf(t.id)) * sc);
  }
  return out;
}
// Pokal-Heimspiel: Zuschauereinnahmen für den Gastgeber
function cupGate(a, b, round) {
  const g = attendance(a, b, round);
  if (a === CAREER.team) { CAREER.money += g.money; finOf().cup += g.money; finOf().fans.push(g.n); } else CAREER.aiMoney[a] += g.money;
  return g;
}
// ---------- Transfers: Sperre für Neuzugänge, Sofortverkauf nur an zahlende Vereine ----------
const lockRounds = () => Math.max(2, Math.round(CAREER.season.fixtures.length / 3));
const isLocked = p => !!p.lock && p.lock.y === CAREER.year && CAREER.season.round < p.lock.r;
const quickSalePrice = p => Math.round(pValue(p) * 0.55 / 5000) * 5000;
function buyerFor(p, price) {
  const c = TEAMS.filter(t => t.id !== CAREER.team && CAREER.squads[t.id].length < 16 && CAREER.aiMoney[t.id] >= price);
  return c.length ? pick(c) : null;
}
// ---------- Schulden: Transfersperre, nach einigen Spieltagen Notverkäufe ----------
const debtLimit = () => Math.max(2, Math.round(CAREER.season.fixtures.length * 0.15));
function checkDebt() {
  if (CAREER.money >= 0) { if (CAREER.debt) news('Die Kasse ist wieder im Plus. Die Transfersperre ist aufgehoben.'); CAREER.debt = 0; return; }
  CAREER.debt = (CAREER.debt || 0) + 1;
  if (CAREER.debt === 1) news(`Die Kasse ist im Minus (${euro(CAREER.money)}). Transfersperre, bis wieder Geld da ist. Nach ${debtLimit()} Spieltagen im Minus muss der Vorstand Spieler verkaufen.`);
  if (CAREER.debt < debtLimit()) return;
  const sq = CAREER.squads[CAREER.team], sold = [];
  while (CAREER.money < 0) {
    const c = sq.filter(p => sq.length > 12 && sq.filter(x => x.role === p.role).length > 1 && buyerFor(p, Math.round(pValue(p) * 0.5 / 5000) * 5000)).sort((a, b) => pValue(a) - pValue(b));
    const p = c.find(x => pValue(x) * 0.5 >= -CAREER.money) || c[c.length - 1]; if (!p) break;   // günstigster, der die Schulden deckt, sonst der wertvollste
    const price = Math.round(pValue(p) * 0.5 / 5000) * 5000, t = buyerFor(p, price);
    sq.splice(sq.indexOf(p), 1); CAREER.money += price; CAREER.aiMoney[t.id] -= price; finOf().transfer += price;
    p.start = false; p.num = 0; delete p.lock; CAREER.squads[t.id].push(p); fixNumbers(CAREER.squads[t.id]); sold.push(`${p.name} (${euro(price)} an ${t.short})`);
  }
  if (sold.length) { ensureStarters(CAREER.team); news(`Notverkauf wegen Schulden: ${sold.join(', ')}.`); }
}
// ---------- Vorstand: Bonus, Warnung, Entlassung ----------
// Ziel erreicht: Bonus. Knapp verfehlt (bis 2 Plätze): keine Folgen. Deutlich verfehlt oder Schulden: Warnung, beim zweiten Mal in Folge Entlassung
function boardVerdict(pos, goal, lg) {
  const B = CAREER.board ??= { miss: 0 }, debt = CAREER.money < 0, met = pos <= goal.pos && !debt, clear = debt || pos > goal.pos + 2;
  let bonus = 0, txt;
  if (met) { B.miss = 0; bonus = (lg === 1 ? 60000 : 25000) * (pos <= goal.pos - 3 ? 1.5 : 1); txt = `Der Vorstand ist zufrieden und zahlt einen Bonus von ${euro(bonus)}.`; }
  else if (!clear) { B.miss = 0; txt = 'Saisonziel knapp verfehlt. Der Vorstand ist enttäuscht, hält aber an dir fest.'; }
  else { B.miss++; txt = B.miss >= 2 ? 'Zum zweiten Mal in Folge deutlich verfehlt: Der Vorstand trennt sich von dir.' : `Saisonziel deutlich verfehlt${debt ? ', dazu Schulden' : ''}. Der Vorstand spricht eine Warnung aus: Noch einmal, und du bist raus.`; }
  CAREER.money += bonus; finOf().bonus += bonus;
  return { met, bonus, warn: clear && B.miss === 1, fired: B.miss >= 2, txt };
}
// Jobangebote nach einer Entlassung: drei schwächere Vereine, eher aus der 2. Liga
function jobOffers() {
  const me = CAREER.team, r = TEAMS[me].r;
  const pool = TEAMS.filter(t => t.id !== me && t.r <= r - 2 && CAREER.lgOf[t.id] !== 3).sort((a, b) => (CAREER.lgOf[b.id] - CAREER.lgOf[a.id]) || (b.r - a.r));
  const lg2 = pool.filter(t => CAREER.lgOf[t.id] === 2), lg1 = pool.filter(t => CAREER.lgOf[t.id] === 1);
  const picks = [...lg1.slice(-1), ...lg2.slice(0, 6).sort(() => Math.random() - 0.5).slice(0, 2)];
  return (picks.length >= 2 ? picks : TEAMS.filter(t => t.id !== me && CAREER.lgOf[t.id] === 2).slice(0, 3)).map(t => t.id);
}
function takeJob(tid) {
  const old = CAREER.team;
  CAREER.aiMoney[old] = CAREER.money; CAREER.money = CAREER.aiMoney[tid]; CAREER.aiMoney[tid] = 0;
  CAREER.squads[old].forEach(p => delete p.lock);
  CAREER.team = tid; CAREER.board = { miss: 0 }; CAREER.debt = 0; CAREER.jobOffers = null; CAREER.offers = []; CAREER.streak = 0;
  ensureStarters(tid); newSeason();
  news(`Neuer Job: Du übernimmst ${TEAMS[tid].n} (${CAREER.lgOf[tid]}. Liga). Saisonziel: ${CAREER.goal.txt}.`);
  saveCareer();
}
// alte Spielstände ergänzen
if (CAREER) { CAREER.board ??= { miss: 0 }; CAREER.debt ??= 0; if (CAREER.season) finOf(); }
