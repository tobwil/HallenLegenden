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
  if (!CAREER.titles) {   // ältere Karrieren: Titel aus der Historie nachtragen
    CAREER.titles = [];
    for (const h of CAREER.history || []) {
      const me = h.team ?? CAREER.team;
      seasonTitles(h.lg, h.pos, h.cup === me, h.euro === me, h.lg === 2 && h.pos <= 2).forEach(type => CAREER.titles.push({ type, year: h.year, team: me }));
    }
    for (const p of CAREER.squads[CAREER.team]) hallEntry(p).g = Math.max(hallEntry(p).g, p.tg || 0);   // Ehrenhalle: Tore bisher
  }
}
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
  if (!CAREER.rec) erfolgeInit();
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
}
// Saisonabschluss (vor Alterung und Kaderwechseln): Titel, Saisonrekorde, Ehrenhalle
function seasonClose(lg, pos, row, up, cupWon, euroWon) {
  if (!CAREER.rec) erfolgeInit();
  const me = CAREER.team, R = CAREER.rec, sq = CAREER.squads[me];
  const titles = seasonTitles(lg, pos, cupWon, euroWon, up);
  titles.forEach(type => { CAREER.titles.push({ type, year: CAREER.year, team: me }); track('titel', { art: type }); });
  const pts = row.s * 2 + row.u, best = sq.filter(p => p.role !== 'TW').sort((a, b) => b.sg - a.sg)[0];
  if (better(R.season, pts * 10 + (lg === 1 ? 5 : 0))) R.season = { v: pts * 10 + (lg === 1 ? 5 : 0), pts, neg: row.n * 2 + row.u, pos, lg, year: CAREER.year, team: me };
  if (best && best.sg && better(R.scorer, best.sg)) R.scorer = { v: best.sg, name: best.name, year: CAREER.year, team: me };
  for (const p of sq) { const e = hallEntry(p); e.s++; e.t += titles.length; e.team = me; }
  const fans = finOf().fans, avg = fans.length ? Math.round(fans.reduce((a, b) => a + b, 0) / fans.length / 10) * 10 : 0;
  return { titles, own: { s: row.s, u: row.u, n: row.n, tp: row.tp, tm: row.tm, pts, neg: row.n * 2 + row.u, scorer: best && best.sg ? { name: best.name, n: best.sg } : null, fans: avg } };
}
// ---------- Anzeige: Tab ERFOLGE ----------
function trophySvg(col, on) {
  const c = on ? col : '#3a2f4d', d = on ? shade(col, 0.6) : '#2a2438';
  const px = [[3, 1, 8, 1, d], [2, 2, 10, 5, c], [0, 2, 2, 3, c], [12, 2, 2, 3, c], [1, 4, 1, 2, c], [12, 4, 1, 2, c], [3, 7, 8, 1, c], [5, 8, 4, 2, c], [6, 10, 2, 2, d], [4, 12, 6, 1, c], [3, 13, 8, 2, d], [4, 3, 2, 3, on ? '#ffffff' : '#4a3d62']];
  return `<svg class="tro" viewBox="0 0 14 16" width="42" height="48" aria-hidden="true">${px.map(([x, y, w, h, f]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`).join('')}</svg>`;
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
  const score = e => e.g + e.apps * 0.5 + e.t * 25 + e.s * 10, legend = e => e.s >= 5 || e.g >= 150 || e.t >= 3;
  const hall = H.sort((a, b) => score(b[1]) - score(a[1])).slice(0, 10);
  return `<p class="muted">Alle Titel, Rekorde und die besten Spieler deiner Karriere. Rekorde zählen ab dieser Version, Titel auch rückwirkend aus der Historie.</p>
    <h3>TROPHÄENSCHRANK · ${T.length} ${T.length === 1 ? 'TITEL' : 'TITEL'}</h3><div class="tshelves">${shelf}</div>
    <h3>REKORDE</h3><table class="sqt stt"><tbody>${rec.map(([l, v]) => `<tr><td class="lbl">${l}</td><td>${v || '<span class="muted">noch kein Eintrag</span>'}</td></tr>`).join('')}</tbody></table>
    <h3>EHRENHALLE</h3>${hall.length ? `<table class="sqt cards"><thead><tr><th>NAME</th><th>POS</th><th>SAISONS</th><th>SPIELE</th><th>TORE</th><th>TITEL</th></tr></thead><tbody>${hall.map(([k, e]) =>
      `<tr><td class="c-name">${esc(e.name)}${legend(e) ? ' <span class="tal" style="color:var(--gold)">LEGENDE</span>' : ''}${inSquad.has(k) ? '' : ' <span class="age">ehemalig</span>'}</td><td data-l="POS">${e.role}</td><td data-l="SAISONS">${e.s}</td><td data-l="SPIELE">${e.apps}</td><td data-l="TORE">${e.g}</td><td data-l="TITEL">${e.t}</td></tr>`).join('')}</tbody></table>
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
  const T = TEAMS[CAREER.team], url = 'https://hallenlegenden.de';
  if (kind === 'season') {
    const s = CAREER.summary, head = seasonHead(s).replace(/!$/, ''), big = (s.titles || []).length || s.move === 'auf';
    const NICE = { 'TRIPLE': 'Triple', 'DOUBLE': 'Double', 'EUROPAPOKALSIEGER': 'Europapokalsieger', 'DEUTSCHER MEISTER': 'Deutscher Meister', 'POKALSIEGER': 'Pokalsieger', 'MEISTER 2. LIGA': 'Meister der 2. Liga', 'AUFSTIEG': 'Aufstieg' };
    const what = big ? `${NICE[head] || head} mit ${T.n}!` : s.move === 'ab' ? `Abgestiegen mit ${T.n}, aber wir kommen wieder!` : `Platz ${s.pos} in der ${s.lg}. Liga mit ${T.n}.`;
    return `${what} Saison ${seasonName(s.year)} bei Hallen-Legenden, dem Handball-Spiel im Browser: ${url}`;
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
