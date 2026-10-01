// ================= Karriere-Bildschirme: Zeitung, Kader, Transfers =================
let CTAB = 'home', CMSG = '', CDEL = false, CSEL = null, CSELL = null;
const seasonName = y => `${y}/${String(y + 1).slice(2)}`;
const euroS = v => v >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + ' M' : Math.round(v / 1000) + ' T';
function careerEntry() { SEASON_PICK = false; if (CAREER) careerHub('home'); else careerNewScreen(); }
function careerNewScreen() {
  SCREEN = 'cnew'; SEASON_PICK = true; if (TEAMS[SEL.a].lg !== SEL.lg) SEL.a = LEAGUE(SEL.lg)[0].id;
  SEL.ait ??= 0; SEL.coach ??= 0;
  showMenu(`<div class="panel"><div class="row spread"><h2>NEUE KARRIERE</h2>${leagueTabs()}</div>
    <div class="tcard a active"><span class="tag">DEIN VEREIN</span><div class="tname"><img src="${icon(TEAMS[SEL.a])}" alt="">${esc(TEAMS[SEL.a].n)}</div>${bars(TEAMS[SEL.a])}</div>
    ${teamGrid(SEL.a, -1)}
    ${optRow('SAISONLÄNGE', SEASON_LENS, 'len')}${optRow('HALBZEIT', HALVES, 'half')}${optRow('SCHWIERIGKEIT', DIFF, 'diff')}
    ${optRow('CPU-TRANSFERS', [{ n: 'AN' }, { n: 'AUS' }], 'ait')}${optRow('CO-TRAINER', [{ n: 'AUS' }, { n: 'AUFSTELLUNG' }, { n: 'TRAINING' }, { n: 'BEIDES' }], 'coach')}
    <p class="muted">Du bist Trainer und Manager: Aufstellung, Training und Transfers. Spiele jede Partie selbst oder lass sie simulieren. Die besten zwei der 2. Liga steigen auf, die letzten zwei der 1. Liga ab. Mit CPU-Transfers kaufen die anderen Vereine selbst ein und machen Angebote für deine Spieler.</p>
    <div class="row"><button class="main" data-act="cNew">KARRIERE STARTEN</button><button data-act="main">ZURÜCK</button></div></div>`);
}
const formTxt = f => { const v = Math.round(f); return `<span style="color:${v > 0 ? 'var(--green)' : v < 0 ? 'var(--hot)' : 'var(--dim)'}">${v > 0 ? '+' : ''}${v}</span>`; };
const formTxtPlain = f => { const v = Math.round(f); return (v > 0 ? '+' : '') + v; };
const fitBar = (v, w = 34) => `<span class="bar" style="display:inline-block;width:${w}px;vertical-align:middle"><i style="width:${v}%;background:${v > 75 ? 'var(--green)' : v > 55 ? 'var(--gold)' : 'var(--hot)'}"></i></span>`;
function tabs() {
  const t = [['home', 'ZEITUNG'], ['squad', 'KADER'], ['train', 'TRAINING'], ['market', `TRANSFERS${CAREER.offers.length ? ` (${CAREER.offers.length})` : ''}`], ['table', 'TABELLE'], ['cup', 'POKAL'], ['stats', 'STATISTIK'], ['hist', 'HISTORIE']];
  return `<div class="row ctabs">${t.map(([k, n]) => `<button class="small ${CTAB === k ? 'on' : ''}" data-act="cTab" data-v="${k}" ${k === 'home' && CTAB !== 'home' ? 'data-back' : ''}>${n}</button>`).join('')}</div>`;
}
function leagueTable(hl, rows, compact) {
  const S = CAREER.season, st = standingsOf(S.table), n = st.length, lg = S.lg;
  const show = st.map((r, k) => [r, k]).filter(([r, k]) => !rows || rows(k, r));
  const zone = k => (lg === 1 && k === 0) || (lg === 2 && k < 2) ? 'zone-a' : lg === 1 && k >= n - 2 ? 'zone-d' : '';
  if (compact) return `<table class="sqt mini"><tbody>${show.map(([r, k]) => `<tr class="${r.i === hl ? 'me' : ''} ${zone(k)}"><td>${k + 1}</td><td>${esc(TEAMS[r.i].short)}</td><td>${r.d > 0 ? '+' : ''}${r.d}</td><td>${r.s * 2 + r.u}:${r.n * 2 + r.u}</td></tr>`).join('')}</tbody></table>`;
  return `<table class="sqt"><thead><tr><th>#</th><th>VEREIN</th><th>SP</th><th class="hm">S</th><th class="hm">U</th><th class="hm">N</th><th class="hm">TORE</th><th>DIFF</th><th>PKT</th></tr></thead><tbody>${
    show.map(([r, k]) => `<tr class="${r.i === hl ? 'me' : ''} ${zone(k)}"><td>${k + 1}</td><td>${esc(TEAMS[r.i].n)}</td><td>${r.sp}</td><td class="hm">${r.s}</td><td class="hm">${r.u}</td><td class="hm">${r.n}</td><td class="hm">${r.tp}:${r.tm}</td><td>${r.d > 0 ? '+' : ''}${r.d}</td><td>${r.s * 2 + r.u}:${r.n * 2 + r.u}</td></tr>`).join('')}</tbody></table>`;
}
// ---------- Zeitung ----------
function paper() {
  const S = CAREER.season, me = TEAMS[CAREER.team], st = standingsOf(S.table), pos = st.findIndex(r => r.i === CAREER.team) + 1;
  const hd = headline(), fx = ownFixture(), mood = boardMood(), sq = CAREER.squads[CAREER.team];
  const tired = sq.filter(p => p.fit < 62).sort((a, b) => a.fit - b.fit).slice(0, 3);
  const hot = sq.filter(p => p.form >= 1.5).sort((a, b) => b.form - a.form)[0], cold = sq.filter(p => p.start && p.form <= -1.5)[0];
  const topS = Object.values(S.scorers).sort((a, b) => b.n - a.n).slice(0, 3);
  let next;
  const ct = ownCupTie();
  if (ct) {
    const C = CAREER.cup, oppId = ct[0] === CAREER.team ? ct[1] : ct[0], O = TEAMS[oppId], so = strength(oppId), sm = strength(CAREER.team);
    next = `<div class="np-box np-next"><h4>POKAL · ${CUP_ROUNDS[C.round]}</h4>
      <div class="np-vs"><img src="${icon(me)}" alt=""><b>${ct[0] === CAREER.team ? 'HEIM' : 'AUSWÄRTS'}</b><img src="${icon(O)}" alt=""></div>
      <p><b>${esc(O.n)}</b> (${CAREER.lgOf[oppId]}. Liga)<br>Stärke ${so.ovr} (ihr: ${sm.ovr})</p>
      <p>K.-o.-Spiel: Bei Unentschieden entscheidet das 7-Meter-Werfen. Siegprämie ${euro(CUP_PRIZE[C.round])}.</p>
      <div class="row"><button class="main" data-act="cPlay">SELBST SPIELEN</button><button data-act="cSim">SIMULIEREN</button></div></div>`;
  } else if (fx) {
    const oppId = fx[0] === CAREER.team ? fx[1] : fx[0], O = TEAMS[oppId], so = strength(oppId), sm = strength(CAREER.team), op = st.findIndex(r => r.i === oppId) + 1;
    const oTop = CAREER.squads[oppId].slice().sort((a, b) => b.sg - a.sg || ovr(b) - ovr(a))[0], fav = sm.ovr - so.ovr;
    next = `<div class="np-box np-next"><h4>NÄCHSTES SPIEL · ${S.round + 1}. SPIELTAG</h4>
      <div class="np-vs"><img src="${icon(me)}" alt=""><b>${fx[0] === CAREER.team ? 'HEIM' : 'AUSWÄRTS'}</b><img src="${icon(O)}" alt=""></div>
      <p><b>${esc(O.n)}</b><br>Platz ${op} · Stärke ${so.ovr} (ihr: ${sm.ovr})</p>
      <p>Gefährlichster Werfer: ${esc(oTop.name)}${oTop.sg ? ` (${oTop.sg} Tore)` : ''}. ${fav >= 4 ? 'Ihr seid klarer Favorit.' : fav >= 1 ? 'Leichte Vorteile für euch.' : fav > -1 ? 'Ein Spiel auf Augenhöhe.' : fav > -4 ? 'Der Gegner ist leicht favorisiert.' : 'Ihr seid klarer Außenseiter.'}</p>
      <div class="row"><button class="main" data-act="cPlay">SELBST SPIELEN</button><button data-act="cSim">SIMULIEREN</button></div></div>`;
  } else next = `<div class="np-box np-next"><h4>SAISON BEENDET</h4><p>Alle Spieltage sind gespielt. Zeit für die Bilanz.</p><div class="row"><button class="main" data-act="cEnd">SAISONABSCHLUSS</button></div></div>`;
  const offer = CAREER.offers[0], tlog = (CAREER.transferLog || [])[0];
  return `<div class="paper">
    <div class="np-mast">HANDBALL-KURIER</div>
    <div class="np-date"><span>Ausgabe ${S.round + 1} · Saison ${seasonName(CAREER.year)}</span><span>${S.lg}. Liga · Spieltag ${Math.min(S.round + 1, S.fixtures.length)} von ${S.fixtures.length}</span><span>1,50 €</span></div>
    <h1 class="np-head">${esc(hd.h)}</h1>
    <p class="np-lead">${esc(hd.s)}</p>
    ${S.last.length ? `<div class="np-ticker">${S.last.map(([a, b, x, y]) => `<span class="${a === CAREER.team || b === CAREER.team ? 'me' : ''}">${TEAMS[a].k} ${x}:${y} ${TEAMS[b].k}</span>`).join('')}</div>` : ''}
    <div class="np-grid">
      ${next}
      <div class="np-box"><h4>TABELLE · PLATZ ${pos}</h4>${leagueTable(CAREER.team, k => k < 3 || Math.abs(k - (pos - 1)) <= 1 || k >= st.length - 2, true)}
        <h4>TORJÄGER</h4><p>${topS.map((s, i) => `${i + 1}. ${esc(s.name)} (${TEAMS[s.tid].k}) ${s.n}`).join('<br>') || 'Noch keine Tore.'}</p></div>
      <div class="np-box"><h4>VORSTAND</h4><p>Saisonziel: <b>${esc(CAREER.goal.txt)}</b><br>Stimmung: <b>${mood.txt}</b></p><div class="np-meter"><i style="width:${Math.round(mood.v * 100)}%"></i></div>
        <h4>KABINE</h4><p>${hot ? `In Topform: ${esc(hot.name)} (${formTxtPlain(hot.form)}). ` : ''}${cold ? `Formkrise: ${esc(cold.name)}. ` : ''}${tired.length ? `Müde: ${tired.map(p => `${esc(p.name)} (${Math.round(p.fit)} %)`).join(', ')}.` : 'Der Kader ist fit.'}
          ${sq.some(p => p.inj) ? `<br><b>Verletzt:</b> ${sq.filter(p => p.inj).map(p => `${esc(p.name)} (${p.inj})`).join(', ')}` : ''}
          ${S.round >= S.fixtures.length * 0.6 && sq.some(p => p.vt <= 1) ? `<br><b>Verträge laufen aus:</b> ${sq.filter(p => p.vt <= 1).map(p => esc(p.name)).join(', ')}` : ''}</p>
        ${CAREER.cup ? `<h4>POKAL</h4><p>${CAREER.cup.winner !== null ? `Sieger: ${esc(TEAMS[CAREER.cup.winner].n)}` : CAREER.cup.myOut ? `Ausgeschieden (${esc(CAREER.cupLast ? CAREER.cupLast.sc : '')} gegen ${esc(CAREER.cupLast ? TEAMS[CAREER.cupLast.opp].short : '')}). Nächste Runde: ${CUP_ROUNDS[CAREER.cup.round]}.` : `Noch dabei! Nächste Runde: ${CUP_ROUNDS[CAREER.cup.round]} nach Spieltag ${CAREER.cup.sched[CAREER.cup.round]}.`}</p>` : ''}
        <h4>CO-TRAINER</h4><p>„${esc(coachTip())}“</p>
        <h4>TRANSFERMARKT</h4><p>${offer ? `<b>Angebot:</b> ${esc(TEAMS[offer.from].short)} bietet ${euro(offer.price)} für ${esc((findCareerPlayer(CAREER.team, offer.pid) || {}).name || '')}.` : tlog ? esc(tlog) : 'Ruhig. Keine Wechsel gemeldet.'}</p></div>
    </div>
    <h4 class="np-sec">MELDUNGEN</h4>
    <div class="np-news">${CAREER.news.slice(0, 8).map(n => `<p>${esc(n)}</p>`).join('')}</div>
  </div>`;
}
// ---------- Spieler-Detail ----------
function playerDetail(p) {
  const attrs = (p.role === 'TW' ? [['Torwart', p.gk], ['Tempo', p.spd]] : [['Wurf', p.att], ['Pass', p.pas], ['Abwehr', p.def], ['Tempo', p.spd]]).concat([['Ausdauer', p.sta ?? 75]]);
  const sellP = Math.round(pValue(p) * 0.85 / 5000) * 5000;
  return `<div class="pdet"><canvas id="pdC" width="40" height="40"></canvas>
    <div class="pdet-info"><h2>#${p.num} ${esc(p.name.toUpperCase())}${p.star ? ' ★' : ''}</h2>
      <p class="muted">${ROLE_LONG[p.role]} · ${p.age} Jahre · Gesamt <b style="color:var(--gold)">${ovr(p)}</b>${p.age < 24 ? ` · Potenzial ${Math.round(p.pot)}` : ''}${p.trait ? ` · ${esc(p.trait)}` : ''}</p>
      <div class="bars">${attrs.map(([l, v]) => `<span>${l}</span><div class="bar"><i style="width:${clamp((v - 50) / 49 * 100, 4, 100)}%"></i></div><span>${v}</span>`).join('')}</div>
      ${p.inj ? `<p style="margin:0;color:var(--hot)">Verletzt: fällt noch ${p.inj === 1 ? 'einen Spieltag' : `${p.inj} Spieltage`} aus.</p>` : ''}
      <p class="muted">Vertrag: ${p.vt <= 1 ? '<b style="color:var(--hot)">läuft am Saisonende aus</b>' : `noch ${p.vt} Saisons`} · Gehalt ${euro(p.sal || salaryFor(p))}/Spieltag</p>
      ${p.vt <= 2 ? `<div class="row"><span class="tag">VERLÄNGERN (Forderung ${euro(extendDemand(p))}/Spieltag, Handgeld ${euro(extendDemand(p) * 5)})</span>${[1, 2, 3].map(y => `<button class="small" data-act="cExt" data-v="${p.pid}:${y}">+${y} J.</button>`).join('')}</div>` : ''}
      <p class="muted">Form ${formTxt(p.form)} · Fitness ${fitBar(Math.round(p.fit), 60)} ${Math.round(p.fit)} %<br>Saison: ${p.apps} Spiele, ${p.role === 'TW' ? `${p.ss} Paraden` : `${p.sg} Tore`} · Karriere: ${p.tg} Tore · Marktwert ${euro(pValue(p))}</p>
      <div class="row">${p.start ? '<span class="tag" style="color:var(--gold)">IN DER STARTSIEBEN</span>' : p.inj ? '<span class="tag" style="color:var(--hot)">VERLETZT</span>' : `<button class="main" data-act="cStart" data-v="${p.pid}">AUFSTELLEN</button>`}
        <button data-act="cSell" data-v="${p.pid}">${CSELL === p.pid ? `WIRKLICH FÜR ${euro(sellP)} VERKAUFEN?` : 'VERKAUFEN'}</button><button data-act="cPick" data-v="">ZURÜCK ZUM KADER</button></div>
    </div></div>`;
}
function careerHub(tab) {
  if (!CAREER) return careerNewScreen();
  if (tab) { CTAB = tab; if (tab !== 'squad') CSEL = null; }
  SCREEN = 'career'; if (!G || !G.demo) startDemo(); AU.startMusic();
  if (CAREER.summary) return seasonSummary();
  const S = CAREER.season, me = TEAMS[CAREER.team];
  const head = `<div class="row spread"><div class="tname"><img src="${icon(me)}" alt=""><span>${esc(me.n.toUpperCase())}<br><span class="tag">${S.lg}. LIGA · ${seasonName(CAREER.year)} · SPIELTAG ${Math.min(S.round + 1, S.fixtures.length)}/${S.fixtures.length}</span></span></div>
    <div style="text-align:right"><span class="tag">BUDGET · GEHÄLTER ${euro(wageBill())}/SPIELTAG</span><br><b style="font-family:var(--pix);font-size:11px;color:${CAREER.money < 0 ? 'var(--hot)' : 'var(--gold)'}">${CAREER.money < 0 ? '−' + euro(-CAREER.money) : euro(CAREER.money)}</b></div></div>`;
  let body = '';
  if (CTAB === 'home') body = paper();
  else if (CTAB === 'squad') {
    const sel = CSEL && CAREER.squads[CAREER.team].find(p => p.pid === CSEL);
    if (sel) body = playerDetail(sel);
    else {
      const sq = CAREER.squads[CAREER.team].slice().sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || b.start - a.start || ovr(b) - ovr(a));
      body = `<p class="muted">Gelb = Startsieben. Tippe auf einen Namen für Details, Aufstellung und Verkauf. FIT ist die aktuelle Frische: Wer müde ist, spielt schwächer und läuft langsamer. AUS (Ausdauer) bestimmt, wie schnell ein Spieler ermüdet und sich erholt.${CAREER.coach.lineup ? ' <b style="color:var(--cyan)">Der Co-Trainer stellt vor jedem Spiel auf.</b>' : ''}</p>
      <table class="sqt cards"><thead><tr><th>POS</th><th>NAME</th><th>GES</th><th>WUR</th><th>PAS</th><th>ABW</th><th>TEM</th><th>AUS</th><th>FORM</th><th>FIT</th><th>TORE</th><th>VTR</th><th>WERT</th></tr></thead><tbody>${
        sq.map(p => `<tr class="${p.start ? 'me' : ''}"><td data-l="POS">${p.role}</td><td class="c-name"><button class="link" data-act="cPick" data-v="${p.pid}">${esc(p.name)}</button><span class="age">${p.age}</span>${p.star ? ' ★' : ''}${p.age <= 21 && p.pot - ovr(p) > 8 ? ' <span class="tal">TALENT</span>' : ''}${p.inj ? ` <span class="inj">VERL. ${p.inj}</span>` : ''}</td><td data-l="GES"><b>${ovr(p)}</b></td>
          ${p.role === 'TW' ? `<td colspan="3" class="gkc">TOR ${p.gk}</td>` : `<td data-l="WUR">${p.att}</td><td data-l="PAS">${p.pas}</td><td data-l="ABW">${p.def}</td>`}<td data-l="TEM">${p.spd}</td><td data-l="AUS">${p.sta ?? 75}</td>
          <td data-l="FORM">${formTxt(p.form)}</td><td data-l="FIT">${fitBar(Math.round(p.fit))}</td><td data-l="${p.role === 'TW' ? 'PAR' : 'TORE'}">${p.role === 'TW' ? p.ss : p.sg}</td><td data-l="VTR" style="${p.vt <= 1 ? 'color:var(--hot)' : ''}">${p.vt}J</td><td data-l="WERT">${euroS(pValue(p))}</td></tr>`).join('')}</tbody></table>`;
    }
  } else if (CTAB === 'train') {
    const c = CAREER.coach;
    body = `<h3>CO-TRAINER</h3>
      <div class="row"><span class="tag" style="min-width:150px">AUFSTELLUNG</span><button class="small ${c.lineup ? 'on' : ''}" data-act="cCoach" data-v="lineup:1">ÜBERNIMMT ER</button><button class="small ${c.lineup ? '' : 'on'}" data-act="cCoach" data-v="lineup:0">MACHE ICH</button></div>
      <div class="row"><span class="tag" style="min-width:150px">TRAINING</span><button class="small ${c.training ? 'on' : ''}" data-act="cCoach" data-v="training:1">ÜBERNIMMT ER</button><button class="small ${c.training ? '' : 'on'}" data-act="cCoach" data-v="training:0">MACHE ICH</button></div>
      <p class="muted">„${esc(coachTip())}“</p>
      <h3>TRAININGSSCHWERPUNKT${c.training ? ' · VOM CO-TRAINER GEWÄHLT' : ''}</h3>
      <p class="muted">Der Schwerpunkt wirkt nach jedem Spieltag. Junge Spieler entwickeln sich am schnellsten. Am Saisonende altern alle: Talente legen zu, Routiniers bauen ab.</p>
      <div class="btns menu-list">${TRAINING.map(t => `<button class="${CAREER.training === t.k ? 'main' : ''}" data-act="cTrain" data-v="${t.k}">${t.n} <i>${t.d}</i></button>`).join('')}</div>`;
  } else if (CTAB === 'market') {
    const sq = CAREER.squads[CAREER.team];
    body = `<div class="row spread"><p class="muted">Kader ${sq.length}/18 (mindestens 12). Die Liste wird alle zwei Spieltage neu gemischt.</p>
      <div class="row"><span class="tag">CPU-TRANSFERS</span><button class="small ${CAREER.aiTransfers ? 'on' : ''}" data-act="cAiT" data-v="1">AN</button><button class="small ${CAREER.aiTransfers ? '' : 'on'}" data-act="cAiT" data-v="0">AUS</button></div></div>`;
    if (CAREER.offers.length) body += `<h3>ANGEBOTE FÜR DEINE SPIELER</h3><table class="sqt cards"><tbody>${CAREER.offers.map(o => { const p = findCareerPlayer(CAREER.team, o.pid); if (!p) return ''; return `<tr><td data-l="POS">${p.role}</td><td class="c-name">${esc(p.name)} <span class="age">${ovr(p)}</span></td><td data-l="VON">${esc(TEAMS[o.from].short)}</td><td data-l="BIETET">${euro(o.price)}</td><td data-l="BIS">${o.exp}. Sp.</td><td class="c-act"><button class="small main" data-act="cOffer" data-v="${p.pid}:1">ANNEHMEN</button> <button class="small" data-act="cOffer" data-v="${p.pid}:0">ABLEHNEN</button></td></tr>`; }).join('')}</tbody></table>`;
    body += `<h3>TRANSFERLISTE</h3><table class="sqt cards"><thead><tr><th>POS</th><th>NAME</th><th>VON</th><th>GES</th><th>POT</th><th>PREIS</th><th></th></tr></thead><tbody>${
      CAREER.market.map(m => { const p = marketPlayer(m); if (!p) return ''; return `<tr><td data-l="POS">${p.role}</td><td class="c-name">${esc(p.name)}<span class="age">${p.age}</span></td><td data-l="VON">${m.from < 0 ? 'frei' : TEAMS[m.from].k}</td><td data-l="GES"><b>${ovr(p)}</b></td><td data-l="POT">${p.age < 24 ? Math.round(p.pot) : '–'}</td><td data-l="PREIS">${euroS(m.price)}</td>
        <td class="c-act"><button class="small" data-act="cBuy" data-v="${p.pid}" ${CAREER.money >= m.price ? '' : 'disabled style="opacity:.45"'}>KAUFEN</button></td></tr>`; }).join('')}</tbody></table>`;
    if ((CAREER.transferLog || []).length) body += `<h3>WECHSEL IN DER LIGA</h3><p class="muted" style="font-size:17px">${CAREER.transferLog.slice(0, 5).map(esc).join('<br>')}</p>`;
  } else if (CTAB === 'table') {
    body = `<p class="muted">${S.lg === 1 ? 'Grün: Meister · Rot: Abstieg in die 2. Liga' : 'Grün: Aufstieg in die 1. Liga'}</p>${leagueTable(CAREER.team)}`;
  } else if (CTAB === 'cup') {
    const C = CAREER.cup;
    body = !C ? '<p class="muted">Kein Pokal in dieser Saison.</p>' : `<p class="muted">32 Vereine, K.-o.-System, Halbfinale und Finale als Final Four. Unentschieden werden im 7-Meter-Werfen entschieden. ${C.winner !== null ? `Sieger: <b style="color:var(--gold)">${esc(TEAMS[C.winner].n)}</b>.` : `Nächste Runde: ${CUP_ROUNDS[C.round]} nach Spieltag ${C.sched[C.round]}.`}</p>
      ${C.winner === null ? `<h3>${CUP_ROUNDS[C.round]} · AUSLOSUNG</h3><p class="muted" style="font-size:17px">${C.ties.map(([a, b]) => `${a === CAREER.team || b === CAREER.team ? '<b style="color:var(--gold)">' : ''}${TEAMS[a].k} – ${TEAMS[b].k}${a === CAREER.team || b === CAREER.team ? '</b>' : ''}`).join(' · ')}</p>` : ''}
      ${C.results.slice().reverse().map(r => `<h3>${CUP_ROUNDS[r.round]}</h3><p class="muted" style="font-size:17px">${r.rows.map(([a, b, x, y, so, w]) => `${a === CAREER.team || b === CAREER.team ? '<b style="color:var(--gold)">' : ''}${w === a ? '<u>' + TEAMS[a].k + '</u>' : TEAMS[a].k} ${x}:${y}${so ? ' n.7m' : ''} ${w === b ? '<u>' + TEAMS[b].k + '</u>' : TEAMS[b].k}${a === CAREER.team || b === CAREER.team ? '</b>' : ''}`).join(' · ')}</p>`).join('')}`;
  } else if (CTAB === 'stats') {
    const top = Object.values(S.scorers).sort((a, b) => b.n - a.n).slice(0, 10);
    const mine = CAREER.squads[CAREER.team].filter(p => p.apps).sort((a, b) => b.sg - a.sg);
    body = `<h3>TORJÄGER DER LIGA</h3><table class="sqt"><tbody>${top.map((s, i) => `<tr class="${s.tid === CAREER.team ? 'me' : ''}"><td>${i + 1}</td><td>${esc(s.name)}</td><td>${TEAMS[s.tid].k}</td><td>${s.n}</td></tr>`).join('') || '<tr><td>–</td><td>noch keine Spiele</td></tr>'}</tbody></table>
      <h3>DEIN KADER</h3><table class="sqt"><thead><tr><th>POS</th><th>NAME</th><th>SPIELE</th><th>TORE</th><th>PARADEN</th><th>KARRIERE</th></tr></thead><tbody>${mine.map(p => `<tr><td>${p.role}</td><td>${esc(p.name)}</td><td>${p.apps}</td><td>${p.sg}</td><td>${p.role === 'TW' ? p.ss : '–'}</td><td>${p.tg}</td></tr>`).join('') || '<tr><td>–</td><td>noch keine Spiele</td></tr>'}</tbody></table>`;
  } else if (CTAB === 'hist') {
    body = CAREER.history.length ? `<table class="sqt"><thead><tr><th>SAISON</th><th>LIGA</th><th>PLATZ</th><th>ZIEL</th><th>MEISTER</th><th class="hm">POKAL</th><th class="hm">TORJÄGER</th></tr></thead><tbody>${
      CAREER.history.map(h => `<tr><td>${seasonName(h.year)}</td><td>${h.lg}.</td><td>${h.pos}</td><td style="color:${h.met ? 'var(--green)' : h.met === false ? 'var(--hot)' : 'inherit'}">${esc(h.goal || '–')}</td><td>${esc(TEAMS[h.champ].n)}</td><td class="hm" style="${h.cup === CAREER.team ? 'color:var(--gold)' : ''}">${h.cup !== null && h.cup !== undefined ? esc(TEAMS[h.cup].short) : '–'}</td><td class="hm">${h.top ? `${esc(h.top.name)} (${h.top.n})` : '–'}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Noch keine abgeschlossene Saison.</p>';
    body += `<div class="row"><button data-act="cDel">${CDEL ? 'WIRKLICH LÖSCHEN? JA' : 'KARRIERE LÖSCHEN'}</button>${CDEL ? '<button data-act="cTab" data-v="hist">NEIN</button>' : ''}</div>`;
  }
  showMenu(`<div class="panel wide"><div class="csticky">${head}${tabs()}</div>${CMSG ? `<p style="margin:0;color:var(--hot)">${esc(CMSG)}</p>` : ''}${body}<div class="row"><button data-act="main">HAUPTMENÜ</button></div></div>`);
  const c = menu.querySelector('#pdC'); if (c && CSEL) { const p = CAREER.squads[CAREER.team].find(x => x.pid === CSEL); if (p) c.getContext('2d').drawImage(portrait(p, { c1: me.home.c1, c2: me.home.c2, gk: me.gkc }), 0, 0); }
  const on = menu.querySelector('.ctabs .on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  CMSG = ''; if (CTAB !== 'hist') CDEL = false;
}
function seasonSummary() {
  const s = CAREER.summary, me = TEAMS[CAREER.team];
  const head = s.move === 'auf' ? 'AUFSTIEG!' : s.move === 'ab' ? 'ABSTIEG' : s.pos === 1 ? (s.lg === 1 ? 'DEUTSCHER MEISTER!' : 'MEISTER DER 2. LIGA') : `PLATZ ${s.pos}`;
  showMenu(`<div class="panel"><h2>SAISON ${seasonName(s.year)} · ABSCHLUSS</h2>
    <p class="res" style="color:${s.move === 'ab' ? 'var(--hot)' : 'var(--gold)'}">${head}</p>
    <p class="muted" style="text-align:center">${esc(me.n)} beendet die ${s.lg}. Liga auf Platz ${s.pos}. Saisonziel „${esc(s.goal || '')}“ ${s.goalMet ? '<b style="color:var(--green)">erreicht</b>' : '<b style="color:var(--hot)">verfehlt</b>'}. Prämie: ${euro(s.prize)}.</p>
    <table class="sqt"><tbody>
      <tr><td>Meister 1. Liga</td><td>${esc(TEAMS[s.champ1].n)}</td></tr>
      <tr><td>Meister 2. Liga</td><td>${esc(TEAMS[s.champ2].n)}</td></tr>
      <tr><td>Aufsteiger</td><td>${s.up.map(i => esc(TEAMS[i].n)).join(', ')}</td></tr>
      <tr><td>Absteiger</td><td>${s.down.map(i => esc(TEAMS[i].n)).join(', ')}</td></tr>
      <tr><td>Pokalsieger</td><td>${s.cupWinner !== null && s.cupWinner !== undefined ? esc(TEAMS[s.cupWinner].n) : '–'}${s.cupWinner === CAREER.team ? ' (DEIN VEREIN!)' : ''}</td></tr>
      <tr><td>Torschützenkönig</td><td>${s.top ? `${esc(s.top.name)} (${TEAMS[s.top.tid].k}), ${s.top.n} Tore` : '–'}</td></tr>
    </tbody></table>
    <h3>ENTWICKLUNG IM KADER</h3><p class="muted" style="font-size:18px">${s.dev.slice(0, 8).map(d => `${esc(d.name)} <b style="color:${d.d > 0 ? 'var(--green)' : 'var(--hot)'}">${d.d > 0 ? '+' : ''}${d.d}</b> (${d.o})`).join(' · ') || 'Kaum Veränderungen.'}</p>
    ${s.gone && s.gone.length ? `<p class="muted">Vertrag ausgelaufen, ablösefrei weg: ${s.gone.map(esc).join(', ')}.</p>` : ''}
    ${s.youth && s.youth.length ? `<p class="muted">Aus der Jugend rücken nach: ${s.youth.map(esc).join(', ')}.</p>` : ''}
    ${s.retired.length ? `<p class="muted">Karriereende: ${s.retired.map(esc).join(', ')}. Talente aus der Jugend rücken nach.</p>` : ''}
    <div class="row"><button class="main" data-act="cNext">SAISON ${seasonName(CAREER.year)} STARTEN</button></div></div>`);
}
Object.assign(ACT, {
  cNew() { SEASON_PICK = false; careerCreate(SEL.a, SEL.len, SEL.half, SEL.diff, SEL.ait === 0, SEL.coach); careerHub('home'); },
  cTab(v) { CSEL = null; CSELL = null; CTAB = v; careerHub(); },
  cPick(v) { CSEL = v ? +v : null; CSELL = null; CTAB = 'squad'; careerHub(); },
  cPlay() {
    const ct = ownCupTie(), fx = ct || ownFixture(); if (!fx) return careerHub();
    coachPrep();
    const L = [lineup(fx[0]), lineup(fx[1])];
    prematch(fx[0], fx[1], { human: fx.indexOf(CAREER.team), halfLen: HALVES[CAREER.half].s, diff: CAREER.diff, career: true, cup: !!ct, autoSub: CAREER.coach.lineup || true,
      lineups: L, benches: [benchOf(fx[0], L[0]), benchOf(fx[1], L[1])], label: ct ? `POKAL · ${CUP_ROUNDS[CAREER.cup.round]}` : `${CAREER.season.lg}. LIGA · ${CAREER.season.round + 1}. SPIELTAG` }, 'career');
  },
  cExt(v) { const [pid, y] = v.split(':').map(Number); CMSG = extendContract(pid, y); careerHub(); },
  cSim() { careerSimOwn(); careerHub('home'); },
  cStart(v) {
    const sq = CAREER.squads[CAREER.team], p = sq.find(x => x.pid === +v);
    if (p && p.inj) { CMSG = `${p.name} ist verletzt und kann nicht spielen.`; return careerHub(); }
    if (p) { sq.filter(x => x.role === p.role).forEach(x => x.start = false); p.start = true; if (CAREER.coach.lineup) { CAREER.coach.lineup = false; CMSG = 'Du stellst jetzt selbst auf. Der Co-Trainer hält sich raus (umschaltbar unter Training).'; } saveCareer(); }
    careerHub();
  },
  cCoach(v) { const [k, on] = v.split(':'); CAREER.coach[k] = on === '1'; if (k === 'training' && CAREER.coach.training) CAREER.training = coachTraining(); if (k === 'lineup' && CAREER.coach.lineup) coachPrep(); saveCareer(); careerHub('train'); },
  cSell(v) { if (CSELL !== +v) { CSELL = +v; return careerHub(); } CSELL = null; CMSG = sellPlayer(+v); if (!CMSG) CSEL = null; careerHub(); },
  cBuy(v) { CMSG = buyPlayer(+v); careerHub('market'); },
  cOffer(v) { const [pid, a] = v.split(':'); CMSG = answerOffer(+pid, a === '1'); careerHub('market'); },
  cAiT(v) { CAREER.aiTransfers = v === '1'; saveCareer(); careerHub('market'); },
  cTrain(v) { CAREER.training = v; if (CAREER.coach.training) { CAREER.coach.training = false; CMSG = 'Du bestimmst das Training jetzt selbst.'; } saveCareer(); careerHub('train'); },
  cEnd() { careerEndSeason(); careerHub(); },
  cNext() { CAREER.summary = null; saveCareer(); careerHub('home'); },
  cDel() { if (!CDEL) { CDEL = true; return careerHub('hist'); } CDEL = false; store.del(CAREER_KEY); store.del(SAVE_KEY); CAREER = null; ACT.main(); },
});
