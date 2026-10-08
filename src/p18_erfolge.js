// ================= Erfolge: Trophäenschrank, Rekorde, Ehrenhalle, Teilen =================
// CAREER.titles: [{ type, year, team }] · CAREER.rec: Rekorde der ganzen Karriere · CAREER.hall: { pid: Spieler deiner Vereine }
const TITLE_TYPES = [
  { k: 'meister', n: 'DEUTSCHER MEISTER', col: '#ffc83a' },
  { k: 'pokal', n: 'POKALSIEGER', col: '#e0e6f0' },
  { k: 'euro', n: 'EUROPAPOKAL', col: '#7cf2ff' },
  { k: 'meister2', n: 'MEISTER 2. LIGA', col: '#d08a4a' },
  { k: 'aufstieg', n: 'AUFSTIEG', col: '#3ddc84' },
];
const titleName = k => (TITLE_TYPES.find(t => t.k === k) || {}).n || k;
function erfolgeInit() {
  if (!CAREER) return;
  CAREER.rec ??= {};
  CAREER.hall ??= {};
  CAREER.awards ??= [];
  if (!CAREER.titles) {   // ältere Karrieren: Titel aus der Historie nachtragen
    CAREER.titles = [];
    for (const h of CAREER.history || []) {
      const me = h.team ?? CAREER.team;
      seasonTitles(h.lg, h.pos, h.cup === me, h.euro === me, h.lg === 2 && h.pos <= 2).forEach(type => CAREER.titles.push({ type, year: h.year, team: me }));
    }
    for (const p of CAREER.squads[CAREER.team]) hallEntry(p).g = Math.max(hallEntry(p).g, p.tg || 0);   // Ehrenhalle: Tore bisher
  }
  if (!CAREER.ms) msInit();
}
const isLegend = e => e.s >= 5 || e.g >= 150 || e.t >= 3;   // Ehrenhalle: 5 Saisons, 150 Tore oder 3 Titel für deine Vereine
// ---------- Meilensteine: einmal pro Karriere, mit Saison. Melden sich in der Zeitung und als Ereignis an die Plattform (z. B. Game Center) ----------
const MILESTONES = [
  { k: 'sieg1', n: 'ERSTER SIEG', d: 'Gewinne ein Pflichtspiel.' },
  { k: 'kantersieg', n: 'KANTERSIEG', d: 'Gewinne mit 10 Toren Unterschied.' },
  { k: 'serie5', n: 'LAUF', d: '5 Ligasiege in Folge.' },
  { k: 'serie10', n: 'UNAUFHALTSAM', d: '10 Ligasiege in Folge.' },
  { k: 'voll', n: 'AUSVERKAUFT', d: 'Volle Halle bei einem Heimspiel.' },
  { k: 'dreher', n: 'DREHER-TOR', d: 'Triff selbst mit einem Dreher.' },
  { k: 'kempa', n: 'KEMPA-TOR', d: 'Triff selbst mit dem Kempa-Trick.' },
  { k: 'krimi', n: 'NERVENSTARK', d: 'Gewinne selbst ein 7-Meter-Werfen.' },
  { k: 'aufstieg', n: 'AUFSTIEG', d: 'Steige in die 1. Liga auf.' },
  { k: 'final4', n: 'FINAL FOUR', d: 'Erreiche ein Final Four im Pokal oder Europapokal.' },
  { k: 'pokal', n: 'POKALSIEGER', d: 'Gewinne den Pokal.' },
  { k: 'meister', n: 'DEUTSCHER MEISTER', d: 'Werde Meister der 1. Liga.' },
  { k: 'euro', n: 'EUROPAS BESTE', d: 'Gewinne den Europapokal.' },
  { k: 'double', n: 'DOUBLE', d: 'Meister und Pokalsieger in derselben Saison.' },
  { k: 'mvp', n: 'SPIELER DER SAISON', d: 'Ein Spieler deines Vereins wird Spieler der Saison.' },
  { k: 'legende', n: 'HALLEN-LEGENDE', d: 'Ein Spieler deiner Vereine wird Legende der Ehrenhalle.' },
  { k: 'treue', n: 'URGESTEIN', d: '10 Saisons als Trainer.' },
  { k: 'million', n: 'MILLIONÄR', d: '1 Million Euro auf dem Konto.' },
];
function msUnlock(k, year = CAREER.year, quiet = false) {
  if (!CAREER.ms) erfolgeInit();   // alte Karriere: erst nachtragen, dann neu freischalten
  const M = CAREER.ms;
  if (M[k]) return false;
  M[k] = { y: year ?? null };
  const m = MILESTONES.find(x => x.k === k);
  if (!quiet) news(`Meilenstein: ${m.n}! ${m.d}`);
  track('meilenstein', quiet ? { id: k, nachtrag: true } : { id: k });
  return true;
}
// ältere Karrieren: aus Titeln, Rekorden, Historie und Ehrenhalle nachtragen (ohne Zeitungsmeldung)
function msInit() {
  CAREER.ms = {};
  const R = CAREER.rec || {}, T = CAREER.titles || [], H = CAREER.history || [], q = (k, y) => msUnlock(k, y, true);
  if (R.win) q('sieg1', R.win.year);
  if (R.win && R.win.v >= 10) q('kantersieg', R.win.year);
  if (R.streak && R.streak.v >= 5) q('serie5', R.streak.year);
  if (R.streak && R.streak.v >= 10) q('serie10', R.streak.year);
  for (const t of T) {
    if (['aufstieg', 'pokal', 'meister', 'euro'].includes(t.type)) q(t.type, t.year);
    if (t.type === 'pokal' || t.type === 'euro') q('final4', t.year);
    if (t.type === 'meister' && T.some(u => u.type === 'pokal' && u.year === t.year)) q('double', t.year);
  }
  for (const h of H) if (h.euroMy && /Halbfinale|Finale|Sieger/.test(h.euroMy)) q('final4', h.year);
  if (H.length >= 10) q('treue', H[9].year);
  for (const a of CAREER.awards || []) if (a.mvp && a.mvp.own) q('mvp', a.year);
  if (Object.values(CAREER.hall || {}).some(isLegend)) q('legende');
  if (CAREER.money >= 1e6) q('million');
}
// nach jedem eigenen Spiel (gespielt oder simuliert)
function msAfterMatch(my, their, fans) {
  if (my > their) msUnlock('sieg1');
  if (my - their >= 10) msUnlock('kantersieg');
  if (CAREER.streak >= 5) msUnlock('serie5');
  if (CAREER.streak >= 10) msUnlock('serie10');
  if (fans && fans >= hallCap(CAREER.team)) msUnlock('voll');
  if (CAREER.money >= 1e6) msUnlock('million');
  if (Object.values(CAREER.hall).some(isLegend)) msUnlock('legende');
}
// Tore, die du selbst im Karriere-Spiel erzielst: Dreher und Kempa
function msGoal(kind) { if (G && G.career && CAREER && !G.demo) msUnlock(kind); }
function seasonTitles(lg, pos, cup, euro, up) {
  const t = [];
  if (lg === 1 && pos === 1) t.push('meister');
  if (lg === 2 && pos === 1) t.push('meister2');
  if (lg === 2 && up) t.push('aufstieg');
  if (cup) t.push('pokal');
  if (euro) t.push('euro');
  return t;
}
function hallEntry(p) {
  const H = CAREER.hall, k = String(p.pid);
  return H[k] ??= { name: p.name, role: p.role, g: 0, apps: 0, s: 0, t: 0, team: CAREER.team };
}
const better = (cur, v) => !cur || v > cur.v;
// nach jedem eigenen Spiel (Liga, Pokal, Europapokal)
function noteOwnMatch(my, their, opp, comp, stats, L, fans) {
  erfolgeInit();
  const R = CAREER.rec, base = { opp, sc: `${my}:${their}`, year: CAREER.year, comp, team: CAREER.team };
  if (my > their && better(R.win, my - their)) R.win = { v: my - their, ...base };
  if (my < their && better(R.loss, their - my)) R.loss = { v: their - my, ...base };
  if (better(R.goals, my + their)) R.goals = { v: my + their, ...base };
  if (fans && better(R.fans, fans)) R.fans = { v: fans, ...base };
  for (const p of L || []) {
    const g = (stats && stats[p.pid] && stats[p.pid].g) || 0, e = hallEntry(p);
    e.g += g; e.apps++; e.name = p.name;
    if (p.role !== 'TW' && g && better(R.pgoals, g)) R.pgoals = { v: g, name: p.name, ...base };
  }
  if (comp === 'Liga' && CAREER.streak > 0 && better(R.streak, CAREER.streak)) R.streak = { v: CAREER.streak, year: CAREER.year, team: CAREER.team };
  msAfterMatch(my, their, fans);
}
// Saisonabschluss (vor Alterung und Kaderwechseln): Titel, Saisonrekorde, Ehrenhalle
function seasonClose(lg, pos, row, up, cupWon, euroWon) {
  erfolgeInit();
  const me = CAREER.team, R = CAREER.rec, sq = CAREER.squads[me];
  const titles = seasonTitles(lg, pos, cupWon, euroWon, up);
  titles.forEach(type => { CAREER.titles.push({ type, year: CAREER.year, team: me }); track('titel', { art: type }); });
  const pts = row.s * 2 + row.u, best = sq.filter(p => p.role !== 'TW').sort((a, b) => b.sg - a.sg)[0];
  if (better(R.season, pts * 10 + (lg === 1 ? 5 : 0))) R.season = { v: pts * 10 + (lg === 1 ? 5 : 0), pts, neg: row.n * 2 + row.u, pos, lg, year: CAREER.year, team: me };
  if (best && best.sg && better(R.scorer, best.sg)) R.scorer = { v: best.sg, name: best.name, year: CAREER.year, team: me };
  for (const p of sq) { const e = hallEntry(p); e.s++; e.t += titles.length; e.team = me; }
  for (const k of ['aufstieg', 'pokal', 'meister', 'euro']) if (titles.includes(k)) msUnlock(k);
  if (titles.includes('meister') && titles.includes('pokal')) msUnlock('double');
  if ((CAREER.cup && CAREER.cup.myBest >= 3) || /Halbfinale|Finale|Sieger/.test(euroMyBest())) msUnlock('final4');   // Halbfinale erreicht
  if ((CAREER.history || []).length + 1 >= 10) msUnlock('treue');
  if (Object.values(CAREER.hall).some(isLegend)) msUnlock('legende');
  const fans = finOf().fans, avg = fans.length ? Math.round(fans.reduce((a, b) => a + b, 0) / fans.length / 10) * 10 : 0;
  return { titles, own: { s: row.s, u: row.u, n: row.n, tp: row.tp, tm: row.tm, pts, neg: row.n * 2 + row.u, scorer: best && best.sg ? { name: best.name, n: best.sg } : null, fans: avg } };
}
// ---------- Auszeichnungen der Saison in deiner Liga (vor Alterung und Statistik-Reset): Spieler, Torwart, Talent ----------
// Mindestens 40 % der Spieltage gespielt. Feldspieler: Tore, Vorlagen, Ballgewinne, Spieler des Spiels, dazu ein Bonus nach Tabellenplatz.
// Torwart: Fangquote, Spieler des Spiels, kleiner Tabellenbonus. Talent: bester Feldspieler bis 21 Jahre (nicht der Spieler der Saison)
function seasonAwards(lg, table) {
  const st = standingsOf(table), n = st.length, need = CAREER.season.fixtures.length * 0.4, me = CAREER.team;
  const bonus = tid => { const k = st.findIndex(x => x.i === tid); return k < 0 ? 0 : 10 * (1 - k / Math.max(1, n - 1)); };
  const pool = st.flatMap(({ i }) => CAREER.squads[i].map(p => ({ p, tid: i, x: statOf(p) }))).filter(o => o.x.sp >= need);
  const quote = x => x.sv / Math.max(1, x.sv + x.ga);
  const field = o => o.x.g + o.x.as * 0.8 + o.x.bg * 0.6 + o.x.potm * 2.5 + bonus(o.tid), keeper = o => quote(o.x) * 100 + o.x.potm * 1.5 + bonus(o.tid) * 0.3;
  const top = (list, f) => list.slice().sort((a, b) => f(b) - f(a))[0];
  const F = pool.filter(o => o.p.role !== 'TW'), mvp = top(F, field), tw = top(pool.filter(o => o.p.role === 'TW'), keeper), tal = top(F.filter(o => o.p.age <= 21 && o !== mvp), field);
  const ent = (o, line) => o ? { name: o.p.name, pid: o.p.pid, tid: o.tid, role: o.p.role, own: o.tid === me, line } : null;
  return { year: CAREER.year, lg,
    mvp: ent(mvp, mvp && `${mvp.x.g} Tore, ${mvp.x.as} Vorlagen, ${mvp.x.potm}× Spieler des Spiels`),
    tw: ent(tw, tw && `${Math.round(quote(tw.x) * 100)} % gehalten, ${tw.x.sv} Paraden`),
    tal: ent(tal, tal && `${tal.p.age} Jahre, ${tal.x.g} Tore, ${tal.x.as} Vorlagen`) };
}
const AWARDS = [['mvp', 'Spieler der Saison'], ['tw', 'Torwart der Saison'], ['tal', 'Talent der Saison']];
const awardTxt = w => w ? `${w.own ? '<b style="color:var(--gold)">' : ''}${esc(w.name)}${w.own ? '</b>' : ''} (${TEAMS[w.tid].k}), ${esc(w.line)}${w.own ? ' · DEIN VEREIN!' : ''}` : '–';
function awardSeason(lg, table) {
  erfolgeInit();
  const a = seasonAwards(lg, table); CAREER.awards.push(a);
  const txt = AWARDS.filter(([k]) => a[k]).map(([k, n]) => `${n} ${a[k].name} (${TEAMS[a[k].tid].short})`).join(', ');
  if (txt) news(`Auszeichnungen ${seasonName(a.year)}: ${txt}.`);
  for (const [k] of AWARDS) if (a[k] && a[k].own) { const p = findCareerPlayer(CAREER.team, a[k].pid); if (p) hallEntry(p).aw = (hallEntry(p).aw || 0) + 1; }
  if (a.mvp && a.mvp.own) msUnlock('mvp');
  return a;
}
// ---------- Anzeige: Tab ERFOLGE ----------
function trophySvg(col, on) {
  const c = on ? col : '#3a2f4d', d = on ? shade(col, 0.6) : '#2a2438';
  const px = [[3, 1, 8, 1, d], [2, 2, 10, 5, c], [0, 2, 2, 3, c], [12, 2, 2, 3, c], [1, 4, 1, 2, c], [12, 4, 1, 2, c], [3, 7, 8, 1, c], [5, 8, 4, 2, c], [6, 10, 2, 2, d], [4, 12, 6, 1, c], [3, 13, 8, 2, d], [4, 3, 2, 3, on ? '#ffffff' : '#4a3d62']];
  return `<svg class="tro" viewBox="0 0 14 16" width="42" height="48" aria-hidden="true">${px.map(([x, y, w, h, f]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`).join('')}</svg>`;
}
// Medaille für Meilensteine (Pixel, wie die Pokale)
function medalSvg(on) {
  const c = on ? '#ffc83a' : '#3a2f4d', d = on ? '#b07a12' : '#2a2438', r = on ? '#ff4f3a' : '#2a2438';
  const px = [[3, 0, 2, 4, r], [7, 0, 2, 4, r], [4, 3, 4, 1, r], [3, 4, 6, 1, d], [2, 5, 8, 5, c], [3, 10, 6, 1, d], [3, 5, 6, 1, on ? '#fff3c4' : '#4a3d62'], [5, 6, 2, 3, d]];
  return `<svg class="tro" viewBox="0 0 12 12" width="30" height="30" aria-hidden="true">${px.map(([x, y, w, h, f]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`).join('')}</svg>`;
}
const teamTag = id => id !== undefined && id !== CAREER.team ? ` · ${esc(TEAMS[id].short)}` : '';
function trophyView() {
  erfolgeInit();
  const T = CAREER.titles, R = CAREER.rec, H = Object.entries(CAREER.hall), me = CAREER.team, inSquad = new Set(CAREER.squads[me].map(p => String(p.pid)));
  const shelf = TITLE_TYPES.map(t => { const won = T.filter(x => x.type === t.k);
    return `<div class="tshelf ${won.length ? 'won' : ''}">${trophySvg(t.col, won.length)}<b>${won.length ? `${won.length}×` : '–'}</b><span>${t.n}</span><i>${won.map(x => seasonName(x.year) + teamTag(x.team)).join(', ') || 'noch offen'}</i></div>`; }).join('');
  const rec = [
    ['Höchster Sieg', R.win && `${R.win.sc} gegen ${esc(TEAMS[R.win.opp].n)} (${R.win.comp}, ${seasonName(R.win.year)}${teamTag(R.win.team)})`],
    ['Höchste Niederlage', R.loss && `${R.loss.sc} gegen ${esc(TEAMS[R.loss.opp].n)} (${R.loss.comp}, ${seasonName(R.loss.year)}${teamTag(R.loss.team)})`],
    ['Torreichstes Spiel', R.goals && `${R.goals.sc} gegen ${esc(TEAMS[R.goals.opp].n)} (${R.goals.v} Tore, ${seasonName(R.goals.year)})`],
    ['Längste Siegesserie', R.streak && `${R.streak.v} Ligaspiele in Folge (${seasonName(R.streak.year)}${teamTag(R.streak.team)})`],
    ['Meiste Tore in einem Spiel', R.pgoals && `${esc(R.pgoals.name)}: ${R.pgoals.v} Tore gegen ${esc(TEAMS[R.pgoals.opp].n)} (${seasonName(R.pgoals.year)})`],
    ['Torjäger einer Saison', R.scorer && `${esc(R.scorer.name)}: ${R.scorer.v} Ligatore (${seasonName(R.scorer.year)}${teamTag(R.scorer.team)})`],
    ['Beste Saison', R.season && `${R.season.pts}:${R.season.neg} Punkte, Platz ${R.season.pos} in der ${R.season.lg}. Liga (${seasonName(R.season.year)}${teamTag(R.season.team)})`],
    ['Zuschauerrekord', R.fans && `${R.fans.v.toLocaleString('de-DE')} gegen ${esc(TEAMS[R.fans.opp].n)} (${seasonName(R.fans.year)})`],
  ];
  const score = e => e.g + e.apps * 0.5 + e.t * 25 + e.s * 10, legend = isLegend;
  const hall = H.sort((a, b) => score(b[1]) - score(a[1])).slice(0, 10);
  return `<p class="muted">Alle Titel, Rekorde und die besten Spieler deiner Karriere. Rekorde zählen ab dieser Version, Titel auch rückwirkend aus der Historie.</p>
    <h3>TROPHÄENSCHRANK · ${T.length} ${T.length === 1 ? 'TITEL' : 'TITEL'}</h3><div class="tshelves">${shelf}</div>
    <h3>MEILENSTEINE · ${Object.keys(CAREER.ms).length} VON ${MILESTONES.length}</h3><div class="tshelves ms">${MILESTONES.map(m => { const got = CAREER.ms[m.k];
      return `<div class="tshelf ${got ? 'won' : ''}">${medalSvg(got)}<span>${m.n}</span><i>${esc(m.d)}</i>${got ? `<b style="font-size:10px">${got.y ? seasonName(got.y) : '✓'}</b>` : ''}</div>`; }).join('')}</div>
    <h3>AUSZEICHNUNGEN</h3>${CAREER.awards.length ? `<table class="sqt stt aw"><tbody>${CAREER.awards.slice().reverse().map(a =>
      `<tr><td class="lbl">${seasonName(a.year)} · ${a.lg}. Liga</td><td>${AWARDS.filter(([k]) => a[k]).map(([k, n]) => `${n.replace(' der Saison', '')}: ${a[k].own ? '<b style="color:var(--gold)">' : ''}${esc(a[k].name)}${a[k].own ? '</b>' : ''} (${TEAMS[a[k].tid].k})`).join(' · ')}</td></tr>`).join('')}</tbody></table>
      <p class="muted" style="font-size:17px">Spieler, Torwart und Talent der Saison, vergeben am Saisonende in deiner Liga. Gold: Spieler deines Vereins.</p>` : '<p class="muted">Am Ende deiner ersten Saison werden Spieler, Torwart und Talent der Saison gewählt.</p>'}
    <h3>REKORDE</h3><table class="sqt stt"><tbody>${rec.map(([l, v]) => `<tr><td class="lbl">${l}</td><td>${v || '<span class="muted">noch kein Eintrag</span>'}</td></tr>`).join('')}</tbody></table>
    <h3>EHRENHALLE</h3>${hall.length ? `<table class="sqt cards"><thead><tr><th>NAME</th><th>POS</th><th>SAISONS</th><th>SPIELE</th><th>TORE</th><th>TITEL</th></tr></thead><tbody>${hall.map(([k, e]) =>
      `<tr><td class="c-name">${esc(e.name)}${legend(e) ? ' <span class="tal" style="color:var(--gold)">LEGENDE</span>' : ''}${e.aw ? ` <span class="tal">${e.aw}× AUSGEZEICHNET</span>` : ''}${inSquad.has(k) ? '' : ' <span class="age">ehemalig</span>'}</td><td data-l="POS">${e.role}</td><td data-l="SAISONS">${e.s}</td><td data-l="SPIELE">${e.apps}</td><td data-l="TORE">${e.g}</td><td data-l="TITEL">${e.t}</td></tr>`).join('')}</tbody></table>
      <p class="muted" style="font-size:17px">LEGENDE: 5 Saisons, 150 Tore oder 3 Titel für deine Vereine.</p>` : '<p class="muted">Noch keine Einträge. Nach dem ersten Spiel geht es los.</p>'}
    <div class="row"><button class="main" data-act="cShare" data-v="career">KARRIERE ALS BILD TEILEN</button></div>`;
}
// ---------- Teilen: Pixel-Karte 1080 × 1350 (WhatsApp-Status, Instagram) ----------
const CARD_W = 360, CARD_H = 450, CARD_S = 3;
function cupTxt(s) { if (s.cupWinner === CAREER.team) return 'SIEGER'; return s.cupMy >= 0 ? `AUS: ${CUP_ROUNDS[Math.min(s.cupMy, CUP_ROUNDS.length - 1)]}` : '–'; }
function seasonHead(s) {
  const t = s.titles || [];
  if (t.includes('meister') && t.includes('pokal') && t.includes('euro')) return 'TRIPLE!';
  if (t.includes('meister') && t.includes('pokal')) return 'DOUBLE!';
  if (t.includes('euro')) return 'EUROPAPOKALSIEGER!';
  if (t.includes('meister')) return 'DEUTSCHER MEISTER!';
  if (t.includes('pokal')) return 'POKALSIEGER!';
  if (t.includes('meister2')) return 'MEISTER 2. LIGA!';
  if (s.move === 'auf') return 'AUFSTIEG!';
  if (s.move === 'ab') return 'ABSTIEG';
  return `PLATZ ${s.pos}`;
}
async function drawShareCard(kind) {
  try { if (document.fonts && document.fonts.load) await Promise.all([document.fonts.load(`8px ${FONT}`), document.fonts.load(`8px ${FONT}`, 'ĆČŠŽŁŐ')]); } catch (e) { }
  const c = document.createElement('canvas'); c.width = CARD_W; c.height = CARD_H; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const me = CAREER.team, T = TEAMS[me], K = T.home, R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const tx = (s, x, y, size, col, align = 'center', maxW = CARD_W - 24) => {
    g.font = `${size}px ${FONT}`; g.textAlign = align; g.textBaseline = 'top'; let t = String(s);
    while (g.measureText(t).width > maxW && t.length > 3) t = t.slice(0, -2) + '…';
    g.fillStyle = '#000'; g.fillText(t, x + 1, y + 1); g.fillStyle = col; g.fillText(t, x, y);
  };
  // Hintergrund: Vereinsfarbe, Hallenboden, Rahmen
  for (let y = 0; y < CARD_H; y++) R(0, y, CARD_W, 1, mix(shade(K.c1, 0.32), '#07060b', Math.min(1, y / CARD_H * 1.3)));
  for (let x = 0; x < CARD_W; x += 6) R(x, 0, 1, CARD_H, 'rgba(255,255,255,0.03)');
  R(0, CARD_H - 92, CARD_W, 92, '#2a58a8'); for (let y = CARD_H - 92; y < CARD_H; y += 3) R(0, y, CARD_W, 1, 'rgba(255,255,255,0.05)');
  R(0, CARD_H - 92, CARD_W, 2, '#f3ead6'); R(CARD_W / 2 - 1, CARD_H - 92, 2, 92, 'rgba(243,234,214,0.6)');
  R(0, 0, CARD_W, 4, '#ffc83a'); R(0, CARD_H - 4, CARD_W, 4, '#ffc83a'); R(0, 0, 4, CARD_H, '#ffc83a'); R(CARD_W - 4, 0, 4, CARD_H, '#ffc83a');
  tx('HALLEN-LEGENDEN', CARD_W / 2, 16, 16, '#ffc83a');
  g.drawImage(jerseyIcon(K), CARD_W / 2 - 36, 44, 72, 72);
  tx(T.n.toUpperCase(), CARD_W / 2, 124, 8, '#f3ead6');
  if (kind === 'season') {
    const s = CAREER.summary, o = s.own || {};
    tx(`SAISON ${seasonName(s.year)}`, CARD_W / 2, 142, 8, '#9b90ad');
    const head = seasonHead(s); tx(head, CARD_W / 2, 164, head.length > 12 ? 14 : 20, s.move === 'ab' ? '#ff4f3a' : '#ffc83a');
    const lines = [
      `${s.lg}. LIGA · PLATZ ${s.pos}${o.pts !== undefined ? ` · ${o.pts}:${o.neg} PUNKTE` : ''}`,
      o.s !== undefined ? `${o.s} SIEGE · ${o.u} REMIS · ${o.n} NIEDERLAGEN` : '',
      o.tp !== undefined ? `TORE ${o.tp}:${o.tm}` : '',
      `POKAL: ${cupTxt(s)}`,
      s.euroMy ? `EUROPAPOKAL: ${s.euroWinner === me ? 'SIEGER' : s.euroMy.toUpperCase()}` : '',
      o.scorer ? `TORJÄGER: ${o.scorer.name.toUpperCase()} (${o.scorer.n})` : '',
      o.fans ? `ZUSCHAUER IM SCHNITT: ${o.fans.toLocaleString('de-DE')}` : '',
    ].filter(Boolean);
    lines.forEach((l, i) => tx(l, CARD_W / 2, 200 + i * 18, 8, i ? '#f3ead6' : '#7cf2ff'));
    const tt = s.titles || []; tt.forEach((k, i) => drawTrophy(g, CARD_W / 2 - tt.length * 22 + i * 44 + 8, 330, TITLE_TYPES.find(t => t.k === k).col));
  } else {
    erfolgeInit();
    const H = CAREER.history || [], from = H.length ? H[0].year : CAREER.year, T2 = CAREER.titles;
    tx(`KARRIERE SEIT ${seasonName(from)} · ${H.length} ${H.length === 1 ? 'SAISON' : 'SAISONS'}`, CARD_W / 2, 142, 8, '#9b90ad');
    tx(T2.length ? `${T2.length} ${T2.length === 1 ? 'TITEL' : 'TITEL'}` : 'AUF DEM WEG NACH OBEN', CARD_W / 2, 164, T2.length ? 20 : 12, '#ffc83a');
    const shown = TITLE_TYPES.filter(t => T2.some(x => x.type === t.k));
    shown.forEach((t, i) => { const x = CARD_W / 2 - shown.length * 30 + i * 60 + 16; drawTrophy(g, x, 196, t.col); tx(`${T2.filter(z => z.type === t.k).length}×`, x + 14, 250, 8, '#f3ead6'); });
    const R2 = CAREER.rec, top = Object.values(CAREER.hall).sort((a, b) => (b.g + b.apps * 0.5 + b.t * 25) - (a.g + a.apps * 0.5 + a.t * 25))[0];
    const lines = [
      R2.season ? `BESTE SAISON: PLATZ ${R2.season.pos}, ${R2.season.lg}. LIGA` : '',
      R2.win ? `HÖCHSTER SIEG: ${R2.win.sc} GEGEN ${TEAMS[R2.win.opp].short.toUpperCase()}` : '',
      R2.scorer ? `TORJÄGER: ${R2.scorer.name.toUpperCase()} (${R2.scorer.v})` : '',
      top ? `VEREINSLEGENDE: ${top.name.toUpperCase()}` : '',
    ].filter(Boolean);
    lines.forEach((l, i) => tx(l, CARD_W / 2, (shown.length ? 272 : 214) + i * 18, 8, '#f3ead6'));
  }
  tx('KOSTENLOS IM BROWSER SPIELEN', CARD_W / 2, CARD_H - 64, 8, '#f3ead6');
  R(CARD_W / 2 - 120, CARD_H - 46, 240, 26, '#ffc83a'); R(CARD_W / 2 - 120, CARD_H - 20, 240, 3, '#000');
  g.font = `12px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = '#1a1205'; g.fillText('HALLENLEGENDEN.DE', CARD_W / 2, CARD_H - 39);
  const big = document.createElement('canvas'); big.width = CARD_W * CARD_S; big.height = CARD_H * CARD_S;
  const b = big.getContext('2d'); b.imageSmoothingEnabled = false; b.drawImage(c, 0, 0, big.width, big.height);
  return big;
}
function drawTrophy(g, x, y, col) {
  const s = 3, d = shade(col, 0.6), R = (a, b, w, h, f) => { g.fillStyle = f; g.fillRect(x + a * s, y + b * s, w * s, h * s); };
  R(3, 1, 8, 1, d); R(2, 2, 10, 5, col); R(0, 2, 2, 3, col); R(12, 2, 2, 3, col); R(1, 4, 1, 2, col); R(12, 4, 1, 2, col); R(3, 7, 8, 1, col); R(5, 8, 4, 2, col); R(6, 10, 2, 2, d); R(4, 12, 6, 1, col); R(3, 13, 8, 2, d); R(4, 3, 2, 3, '#ffffff');
}
function shareText(kind) {
  const T = TEAMS[CAREER.team], url = PLATFORM.shareUrl || 'https://hallenlegenden.de';
  if (kind === 'season') {
    const s = CAREER.summary, head = seasonHead(s).replace(/!$/, ''), big = (s.titles || []).length || s.move === 'auf';
    const NICE = { 'TRIPLE': 'Triple', 'DOUBLE': 'Double', 'EUROPAPOKALSIEGER': 'Europapokalsieger', 'DEUTSCHER MEISTER': 'Deutscher Meister', 'POKALSIEGER': 'Pokalsieger', 'MEISTER 2. LIGA': 'Meister der 2. Liga', 'AUFSTIEG': 'Aufstieg' };
    const what = big ? `${NICE[head] || head} mit ${T.n}!` : s.move === 'ab' ? `Abgestiegen mit ${T.n}, aber wir kommen wieder!` : `Platz ${s.pos} in der ${s.lg}. Liga mit ${T.n}.`;
    return `${what} Saison ${seasonName(s.year)} bei Hallen-Legenden, dem Handball-Spiel${ON_WEB ? ' im Browser' : ''}: ${url}`;
  }
  const n = (CAREER.titles || []).length, y = (CAREER.history || []).length;
  const what = n ? `${n} Titel in ${y} ${y === 1 ? 'Saison' : 'Saisons'}` : y ? `${y} ${y === 1 ? 'Saison' : 'Saisons'} als Trainer, der erste Titel kommt bald` : `Meine Karriere bei ${T.n} beginnt`;
  return `${what}! Handball-Manager bei Hallen-Legenden. Schaffst du mehr? ${url}`;
}
let SHARE = null;   // zuletzt erzeugte Karte (Vorschau, Speichern)
async function shareCard(kind) {
  const c = await drawShareCard(kind), text = shareText(kind), name = `hallenlegenden-${kind === 'season' ? 'saison-' + seasonName(CAREER.summary.year).replace('/', '-') : 'karriere'}.png`;
  track('teilen', { art: kind });
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  SHARE = { url: c.toDataURL('image/png'), text, name, back: CAREER.summary ? 'summary' : 'trophy' };
  try {
    const file = new File([blob], name, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text, title: 'Hallen-Legenden' }); return 'shared'; }
  } catch (e) { if (e && e.name === 'AbortError') return 'aborted'; }
  showMenu(`<div class="panel"><h2>ALS BILD TEILEN</h2>
    <img class="sharecard" src="${SHARE.url}" alt="Teilen-Karte: ${esc(text)}">
    <p class="muted">${esc(text)}</p>
    <div class="row"><a class="btn-a" href="${SHARE.url}" download="${esc(name)}" data-umami-event="teilen-speichern">BILD SPEICHERN</a><button data-act="cCopy">TEXT KOPIEREN</button><button class="main" data-act="cShareBack">ZURÜCK</button></div></div>`);
  return 'preview';
}
Object.assign(ACT, {
  cShare(v) { shareCard(v); },
  cShareBack() { careerHub(SHARE && SHARE.back === 'trophy' ? 'trophy' : undefined); },
  cCopy() { const t = SHARE && SHARE.text; if (!t) return; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { const b = menu.querySelector('[data-act="cCopy"]'); if (b) b.textContent = 'KOPIERT ✓'; }).catch(() => { }); },
});
if (CAREER) erfolgeInit();
