// ================= Karriere-Bildschirme: Zeitung, Kader, Transfers =================
let CTAB = 'home', CMSG = '', CDEL = false, CSEL = null, CSELL = null, CSTAT = false, CSCOUT = null;
const seasonName = y => `${y}/${String(y + 1).slice(2)}`;
const euroS = v => v >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + ' M' : Math.round(v / 1000) + ' T';
function careerEntry() { SEASON_PICK = false; if (CAREER) careerHub('home'); else careerNewScreen(); }
function careerNewScreen() {
  SCREEN = 'cnew'; SEASON_PICK = true; if (SEL.lg === 3) SEL.lg = 1; if (TEAMS[SEL.a].lg !== SEL.lg) SEL.a = LEAGUE(SEL.lg)[0].id;
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
  const t = [['home', 'ZEITUNG'], ['squad', 'KADER'], ['train', 'TRAINING'], ['market', `TRANSFERS${CAREER.offers.length ? ` (${CAREER.offers.length})` : ''}`], ['table', 'TABELLE'], ['cup', 'POKAL'], ['euro', 'EUROPA'], ['stats', 'STATISTIK'], ['trophy', 'ERFOLGE'], ['hist', 'HISTORIE']];
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
  } else if (ownEuroTie()) {
    const et = ownEuroTie(), n = euroNext(), oppId = et[0] === CAREER.team ? et[1] : et[0], O = TEAMS[oppId], so = strength(oppId), sm = strength(CAREER.team);
    next = `<div class="np-box np-next"><h4>EUROPAPOKAL · ${n.type === 'group' ? `GRUPPE ${GROUP_N[groupOf(CAREER.team)]} · ${n.md + 1}. SPIELTAG` : EURO_KO[n.r]}</h4>
      <div class="np-vs"><img src="${icon(me)}" alt=""><b>${n.type === 'ko' && n.r >= 1 ? 'FINAL FOUR' : et[0] === CAREER.team ? 'HEIM' : 'AUSWÄRTS'}</b><img src="${icon(O)}" alt=""></div>
      <p><b>${esc(O.n)}</b> (${CAREER.lgOf[oppId] === 3 ? 'international' : CAREER.lgOf[oppId] + '. Liga'})<br>Stärke ${so.ovr} (ihr: ${sm.ovr})</p>
      <p>${n.type === 'group' ? 'Gruppenspiel: Die ersten zwei kommen ins Viertelfinale.' : n.r >= 1 ? 'Final Four in neutraler Halle. Bei Unentschieden entscheidet das 7-Meter-Werfen.' : 'K.-o.-Spiel, der Gruppensieger hat Heimrecht. Bei Unentschieden 7-Meter-Werfen.'}</p>
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
      <div class="np-box"><h4>VORSTAND</h4><p>Saisonziel: <b>${esc(CAREER.goal.txt)}</b><br>Stimmung: <b>${mood.txt}</b>${CAREER.board && CAREER.board.miss ? '<br><b style="color:#a3170d">Letzte Saison verfehlt: Es gibt keine zweite Warnung.</b>' : ''}${CAREER.money < 0 ? `<br><b style="color:#a3170d">Schulden: ${euro(-CAREER.money)}. Transfersperre${CAREER.debt ? `, Notverkauf nach ${Math.max(0, debtLimit() - CAREER.debt)} weiteren Spieltagen im Minus` : ''}.</b>` : ''}</p><div class="np-meter"><i style="width:${Math.round(mood.v * 100)}%"></i></div>
        <h4>KABINE</h4><p>${hot ? `In Topform: ${esc(hot.name)} (${formTxtPlain(hot.form)}). ` : ''}${cold ? `Formkrise: ${esc(cold.name)}. ` : ''}${tired.length ? `Müde: ${tired.map(p => `${esc(p.name)} (${Math.round(p.fit)} %)`).join(', ')}.` : 'Der Kader ist fit.'}
          ${sq.some(p => p.inj) ? `<br><b>Verletzt:</b> ${sq.filter(p => p.inj).map(p => `${esc(p.name)} (${p.inj})`).join(', ')}` : ''}
          ${S.round >= S.fixtures.length * 0.6 && sq.some(p => p.vt <= 1) ? `<br><b>Verträge laufen aus:</b> ${sq.filter(p => p.vt <= 1).map(p => esc(p.name)).join(', ')}` : ''}</p>
        ${CAREER.cup ? `<h4>POKAL</h4><p>${CAREER.cup.winner !== null ? `Sieger: ${esc(TEAMS[CAREER.cup.winner].n)}` : CAREER.cup.myOut ? `Ausgeschieden (${esc(CAREER.cupLast ? CAREER.cupLast.sc : '')} gegen ${esc(CAREER.cupLast ? TEAMS[CAREER.cupLast.opp].short : '')}). Nächste Runde: ${CUP_ROUNDS[CAREER.cup.round]}.` : `Noch dabei! Nächste Runde: ${CUP_ROUNDS[CAREER.cup.round]} nach Spieltag ${CAREER.cup.sched[CAREER.cup.round]}.`}</p>` : ''}
        ${CAREER.euro && CAREER.euro.teams.includes(CAREER.team) ? `<h4>EUROPAPOKAL</h4><p>${esc(euroStatus())}</p>` : ''}
        <h4>CO-TRAINER</h4><p>„${esc(coachTip())}“</p>
        <h4>TRANSFERMARKT</h4><p>${offer ? `<b>Angebot:</b> ${esc(TEAMS[offer.from].short)} bietet ${euro(offer.price)} für ${esc((findCareerPlayer(CAREER.team, offer.pid) || {}).name || '')}.` : tlog ? esc(tlog) : 'Ruhig. Keine Wechsel gemeldet.'}</p></div>
    </div>
    <h4 class="np-sec">MELDUNGEN</h4>
    <div class="np-news">${CAREER.news.slice(0, 8).map(n => `<p>${esc(n)}</p>`).join('')}</div>
  </div>`;
}
// ---------- Spieler-Detail: Spielerkarte (Spieler | Werte oder Statistik) und Knopfleiste ----------
const starsOf = v => clamp(Math.round((v - 58) / 7.5), 1, 5);   // Gesamtwert in Sterne: 65 ≈ 1, 73 ≈ 2, 80 ≈ 3, 88 ≈ 4, 95 ≈ 5
const stars = (n, col) => `<b class="pcst" aria-label="${n} von 5 Sternen">${[1, 2, 3, 4, 5].map(i => `<svg viewBox="0 0 7 7" width="12" height="12" aria-hidden="true"><path d="M3 0h1v2h3v1h-1v1h1v3h-2v-1h-3v1h-2v-3h1v-1h-1v-1h3z" fill="${i <= n ? col : '#3a2f4d'}"/></svg>`).join('')}</b>`;
const ATTR_INFO = { Wurf: 'Torgefahr und Wurfhärte', Pass: 'Genauigkeit, Vorlagen', Abwehr: 'Zweikampf, Ballgewinne', Tempo: 'Laufen, Tempogegenstoß', Torwart: 'Reaktion und Stellungsspiel', Ausdauer: 'wie schnell er müde wird' };
const pct = (a, b) => b ? Math.round(100 * a / b) + ' %' : '–';
function statSince(which) {   // Statistik gibt es erst seit dem Update: Hinweis, ab wann gezählt wird
  const f = CAREER.statFrom; if (!f) return '';
  if (which === 's' && f.year === CAREER.year && f.round > 0) return `ab ${f.round + 1}. Spieltag`;
  if (which === 'k' && (f.year > (CAREER.history[0] ? CAREER.history[0].year : CAREER.year) || f.round > 0)) return `seit ${f.year}/${String(f.year + 1).slice(2)}`;
  return '';
}
function statTable(p) {
  const S = statOf(p, 's'), K = statOf(p, 'k'), gk = p.role === 'TW';
  const rows = gk ? [['Spiele', x => x.sp], ['Spielminuten', x => Math.round(x.min)], ['Paraden', x => x.sv], ['Gegentore', x => x.ga], ['Fangquote', x => pct(x.sv, x.sv + x.ga)], ['7-Meter gehalten', x => `${x.sv7} / ${x.f7}`], ['Spieler des Spiels', x => x.potm]]
    : [['Spiele', x => x.sp], ['Spielminuten', x => Math.round(x.min)], ['Tore / Würfe', x => `${x.g} / ${x.sh}`], ['Wurfquote', x => pct(x.g, x.sh)], ['Tore pro Spiel', x => x.sp ? (x.g / x.sp).toFixed(1).replace('.', ',') : '–'],
      ['7-Meter', x => `${x.g7} / ${x.s7}`], ['Tempogegenstoß-Tore', x => x.fb], ['Torvorlagen', x => x.as], ['Ballgewinne', x => x.bg], ['Zeitstrafen', x => x.zs], ['Spieler des Spiels', x => x.potm]];
  const ss = statSince('s'), ks = statSince('k');
  return `<table class="sqt stt pcstat"><thead><tr><th></th><th class="num">SAISON</th><th class="num">KARRIERE</th></tr></thead><tbody>${rows.map(([l, f]) => `<tr><td class="lbl">${l}</td><td class="num">${f(S)}</td><td class="num">${f(K)}</td></tr>`).join('')}</tbody></table>
    <p class="muted" style="margin:4px 0 0">Liga, Pokal und Europapokal zusammen${ss || ks ? ` · gezählt ${[ss && 'Saison ' + ss, ks && 'Karriere ' + ks].filter(Boolean).join(', ')}` : ''}</p>`;
}
const attrsOf = p => (p.role === 'TW' ? [['Torwart', p.gk], ['Tempo', p.spd]] : [['Wurf', p.att], ['Pass', p.pas], ['Abwehr', p.def], ['Tempo', p.spd]]).concat([['Ausdauer', p.sta ?? 75]]);
const zustOf = p => { const fit = Math.round(p.fit ?? 100); return `${fitBar(fit, 60)} ${fit} % · ${fit >= 85 ? 'frisch' : fit >= 65 ? 'gut' : fit >= 45 ? 'müde' : 'erschöpft'}`; };
const FORM_TXT = ['in der Krise', 'schwach', 'etwas schwach', 'normal', 'gut drauf', 'stark', 'in Topform'];
const dTxt = d => `<span style="color:${d > 0 ? 'var(--green)' : d < 0 ? 'var(--hot)' : 'var(--dim)'}">${d > 0 ? '+' : d < 0 ? '−' : '±'}${Math.abs(d)}</span>`;
function cardHead(p, sub, badges = '') {
  return `<div class="pchead"><canvas id="pdC" width="40" height="40"></canvas><div>
      <h2>${p.num ? `#${p.num} ` : ''}${esc(p.name.toUpperCase())}${p.star ? ' ★' : ''} ${badges}</h2>
      <p class="muted">${ROLE_LONG[p.role].toUpperCase()} · ${p.age} Jahre${sub}${p.trait ? ` · ${esc(p.trait)}` : ''}</p></div></div>`;
}
function cardRight(p, ref, note = '') {   // WERTE (mit Abstand zum eigenen Stammspieler, wenn ref) oder STATISTIK
  if (CSTAT) return `<section class="pcbox"><h3>STATISTIK</h3>${statTable(p)}${note}</section>`;
  const A = attrsOf(p), R = ref ? attrsOf(ref) : null;
  return `<section class="pcbox"><h3>WERTE${ref ? ` · ±&nbsp;ZU ${esc(ref.name.toUpperCase())}` : ''}</h3><div class="bars">${A.map(([l, v], i) => `<span>${l}</span><div class="bar"><i style="width:${clamp((v - 50) / 49 * 100, 4, 100)}%"></i></div><span>${v}${R ? ` ${dTxt(v - R[i][1])}` : ''}</span>`).join('')}</div>
      <p class="muted pcinfo">${A.map(([l]) => `<b>${l}:</b> ${ATTR_INFO[l]}`).join(' · ')}</p></section>`;
}
function playerDetail(p) {
  const sellP = quickSalePrice(p), locked = isLocked(p), sq = CAREER.squads[CAREER.team], seven = sevenPick(CAREER.team, sq.filter(x => x.start)), capt = isCapt(p);
  const isSeven = CAREER.seven === p.pid, autoSeven = !CAREER.seven && seven && seven.pid === p.pid, offer = CAREER.offers.find(o => o.pid === p.pid);
  const badges = `${capt ? '<span class="cbadge">C</span>' : ''}${isSeven || autoSeven ? '<span class="cbadge">7M</span>' : ''}`;
  const info = `<section class="pcbox"><h3>SPIELER</h3><dl>
      <dt>Stärke</dt><dd>${stars(starsOf(ovr(p)), 'var(--gold)')} <b style="color:var(--gold)">${ovr(p)}</b></dd>
      <dt>Potenzial</dt><dd>${stars(starsOf(potOf(p)), 'var(--cyan)')} <b style="color:var(--cyan)">${potOf(p)}</b> <span class="muted">${POT_TXT[potTrend(p)]}</span></dd>
      <dt>Zustand</dt><dd>${zustOf(p)}</dd>
      <dt>Form</dt><dd>${formTxt(p.form)} · ${FORM_TXT[Math.round(p.form) + 3]}</dd>
      <dt>Vertrag</dt><dd>${p.vt <= 1 ? '<b style="color:var(--hot)">läuft am Saisonende aus</b>' : `noch ${p.vt} Saisons`} · ${euro((p.sal || salaryFor(p)) * REF_LEN)} pro Saison</dd>
      <dt>Marktwert</dt><dd>${euro(pValue(p))}</dd>
      <dt>Aufgaben</dt><dd>${[p.start ? 'Startsieben' : 'Bank', capt && 'Kapitän', isSeven ? '7-Meter-Schütze' : autoSeven ? '7-Meter-Schütze (automatisch)' : ''].filter(Boolean).join(' · ')}</dd>
    </dl>${p.inj ? `<p style="margin:6px 0 0;color:var(--hot)">Verletzt: fällt noch ${p.inj === 1 ? 'einen Spieltag' : `${p.inj} Spieltage`} aus.</p>` : ''}</section>`;
  const startBtn = p.start ? `<button data-act="cBench" data-v="${p.pid}">AUF DIE BANK</button>` : p.inj ? '<span class="tag" style="color:var(--hot)">VERLETZT</span>' : `<button class="main" data-act="cStart" data-v="${p.pid}">AUFSTELLEN</button>`;
  return `<div class="pcard">${cardHead(p, '', badges)}
    <div class="pcgrid">${info}${cardRight(p)}</div>
    ${offer ? `<div class="row"><span class="tag" style="color:var(--gold)">ANGEBOT: ${esc(TEAMS[offer.from].short.toUpperCase())} BIETET ${euro(offer.price)} (BIS SPIELTAG ${offer.exp})</span><button class="small main" data-act="cOffer" data-v="${p.pid}:1">ANNEHMEN</button><button class="small" data-act="cOffer" data-v="${p.pid}:0">ABLEHNEN</button></div>` : ''}
    ${p.vt <= 2 ? `<div class="row"><span class="tag">VERLÄNGERN (Forderung ${euro(extendDemand(p) * REF_LEN)} pro Saison, Handgeld ${euro(extendDemand(p) * 5)})</span>${[1, 2, 3].map(y => `<button class="small" data-act="cExt" data-v="${p.pid}:${y}">+${y} J.</button>`).join('')}</div>` : ''}
    <div class="row">${startBtn}<button data-act="cStat">${CSTAT ? 'WERTE' : 'STATISTIK'}</button>
      ${p.role === 'TW' ? '' : `<button data-act="cSeven" data-v="${p.pid}">${isSeven ? '7-METER: AUTOMATISCH' : '7-METER-SCHÜTZE'}</button>`}
      <button data-act="cCapt" data-v="${p.pid}">${capt ? 'KEIN KAPITÄN' : 'KAPITÄN'}</button>
      ${locked ? `<span class="tag">NEUZUGANG · VERKAUF AB SPIELTAG ${p.lock.r + 1}</span>` : `<button data-act="cSell" data-v="${p.pid}">${CSELL === p.pid ? `WIRKLICH FÜR ${euro(sellP)} VERKAUFEN?` : `SOFORTVERKAUF (${euro(sellP)})`}</button>`}<button data-act="cPick" data-v="">ZURÜCK ZUM KADER</button></div>
  </div>`;
}
// ---------- Scouting-Karte: Spieler von der Transferliste, dieselbe Karte, dazu Ablöse, Gehalt und Vergleich mit dem eigenen Kader ----------
function scoutDetail(p, m) {
  const sq = CAREER.squads[CAREER.team], same = sq.filter(x => x.role === p.role).sort((a, b) => ovr(b) - ovr(a)), best = same[0], starter = sq.find(x => x.role === p.role && x.start) || best;
  const club = m.from < 0 ? 'vereinslos' : TEAMS[m.from].n, why = buyCheck(m), d = best ? ovr(p) - ovr(best) : 0;
  const verdict = !best ? `Du hast keinen ${ROLE_LONG[p.role]} im Kader.` : d > 0 ? `Wäre dein bester ${ROLE_LONG[p.role]}.` : starter && ovr(p) > ovr(starter) ? 'Stärker als dein Stammspieler.'
    : potOf(p) > ovr(best) && potTrend(p) === 'up' ? `Talent: kann ${esc(best.name)} überholen.` : 'Ergänzung für die Bank.';
  const games = statOf(p, 'k').sp;
  const info = `<section class="pcbox"><h3>SCOUTING</h3><dl>
      <dt>Stärke</dt><dd>${stars(starsOf(ovr(p)), 'var(--gold)')} <b style="color:var(--gold)">${ovr(p)}</b></dd>
      <dt>Potenzial</dt><dd>${stars(starsOf(potOf(p)), 'var(--cyan)')} <b style="color:var(--cyan)">${potOf(p)}</b> <span class="muted">${POT_TXT[potTrend(p)]}</span></dd>
      <dt>Zustand</dt><dd>${zustOf(p)}${p.inj ? ` · <b style="color:var(--hot)">verletzt (${p.inj} Sp.)</b>` : ''}</dd>
      <dt>Form</dt><dd>${formTxt(p.form || 0)} · ${FORM_TXT[Math.round(p.form || 0) + 3]}</dd>
      <dt>Vertrag</dt><dd>${m.from < 0 ? 'vereinslos, sofort zu haben' : `noch ${p.vt} ${p.vt === 1 ? 'Saison' : 'Saisons'} bei ${esc(TEAMS[m.from].short)}`}</dd>
      <dt>Marktwert</dt><dd>${euro(pValue(p))}</dd>
      <dt>Ablöse</dt><dd><b style="color:var(--gold)">${euro(m.price)}</b></dd>
      <dt>Gehalt</dt><dd>${euro(newSalary(p) * REF_LEN)} pro Saison bei dir</dd>
      <dt>Vergleich</dt><dd>${best ? `${dTxt(d)} zu ${esc(best.name)} (${ovr(best)}) · ` : ''}${verdict}</dd>
    </dl></section>`;
  const note = !games ? `<p class="muted" style="margin:4px 0 0">${m.from < 0 ? 'Vereinslos: in dieser Karriere noch kein Spiel.' : 'Noch kein Spiel in dieser Karriere.'}</p>` : '';
  return `<div class="pcard">${cardHead(p, ` · ${esc(club)}`)}
    <div class="pcgrid">${info}${cardRight(p, starter && starter !== p ? starter : null, note)}</div>
    <div class="row">${why ? `<span class="tag" style="color:var(--hot)">${esc(why.toUpperCase())}</span>` : `<button class="main" data-act="cBuy" data-v="${p.pid}">KAUFEN FÜR ${euro(m.price)}</button>`}<button data-act="cStat">${CSTAT ? 'WERTE' : 'STATISTIK'}</button><button data-act="cScout" data-v="">ZURÜCK ZUR TRANSFERLISTE</button></div>
    <p class="muted" style="margin:0">Neuzugänge sind ${lockRounds()} Spieltage für einen Weiterverkauf gesperrt.</p>
  </div>`;
}
// ---------- Statistik: Kennzahlen, Platz-Verlauf, Torjäger, eigener Kader ----------
function statsView() {
  const S = CAREER.season, me = CAREER.team, st = standingsOf(S.table), n = st.length, row = st.find(r => r.i === me);
  const rankBy = (k, asc) => st.slice().sort((a, b) => asc ? a[k] - b[k] : b[k] - a[k]).findIndex(r => r.i === me) + 1;
  const played = row && row.sp > 0, sign = v => v > 0 ? '+' + v : '' + v;
  const tile = (lbl, val, sub) => `<div class="kpi"><span>${lbl}</span><b>${val}</b>${sub ? `<i>${sub}</i>` : ''}</div>`;
  const chips = CAREER.form5.length ? CAREER.form5.map(r => `<em class="fchip f${r}">${r}</em>`).join('') : '–';
  const kpis = `<div class="kpis">${tile('PLATZ', played ? (st.indexOf(row) + 1) + '.' : '–', `von ${n}`)}${tile('PUNKTE', played ? row.pk : '–', played ? `${row.s}S ${row.u}U ${row.n}N` : 'noch kein Spiel')}${
    tile('TORE', played ? `${row.tp}:${row.tm}` : '–', played ? `Diff. ${sign(row.d)}` : '')}${tile('ANGRIFF', played ? rankBy('tp') + '.' : '–', played ? `Ø ${(row.tp / row.sp).toFixed(1)} Tore` : '')}${
    tile('ABWEHR', played ? rankBy('tm', true) + '.' : '–', played ? `Ø ${(row.tm / row.sp).toFixed(1)} Gegentore` : '')}<div class="kpi"><span>FORM</span><b class="chips">${chips}</b><i>letzte 5</i></div></div>`;
  // Platz-Verlauf: eine Linie, Platz 1 oben
  const h = S.posHist || [], len = S.fixtures.length;
  let chart = '<p class="muted">Der Verlauf füllt sich ab dem nächsten Spieltag.</p>';
  if (h.length) {
    const W = 1000, H = 130, L = 34, R = 12, T = 10, B = 22, x = i => L + (len > 1 ? i / (len - 1) : 0) * (W - L - R), y = p => T + (n > 1 ? (p - 1) / (n - 1) : 0) * (H - T - B);
    const grid = [1, Math.ceil(n / 2), n].map(p => `<line x1="${L}" x2="${W - R}" y1="${y(p)}" y2="${y(p)}" class="gl"/><text x="${L - 6}" y="${y(p) + 4}" text-anchor="end">${p}.</text>`).join('');
    const pts = h.map((p, i) => [x(i), y(p), i + 1, p]);
    chart = `<svg class="poschart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tabellenplatz nach Spieltag: ${h.map((p, i) => `Spieltag ${i + 1} Platz ${p}`).join(', ')}">${grid}
      <text x="${L}" y="${H - 4}">ST 1</text><text x="${W - R}" y="${H - 4}" text-anchor="end">ST ${len}</text>
      ${pts.length > 1 ? `<polyline points="${pts.map(q => q[0] + ',' + q[1]).join(' ')}" class="pl"/>` : ''}
      ${pts.map((q, i) => `<g class="pt"><circle cx="${q[0]}" cy="${q[1]}" r="${i === pts.length - 1 ? 5 : 3.5}"/><circle cx="${q[0]}" cy="${q[1]}" r="12" class="hit"/><title>Spieltag ${q[2]}: Platz ${q[3]}</title></g>`).join('')}</svg>`;
  }
  const top = Object.values(S.scorers).sort((a, b) => b.n - a.n).slice(0, 10), max = top.length ? top[0].n : 1;
  const scorers = top.length ? `<table class="sqt stt"><tbody>${top.map((s, i) => `<tr class="${s.tid === me ? 'me' : ''}"><td class="num">${i + 1}</td><td>${esc(s.name)}</td><td>${TEAMS[s.tid].k}</td><td class="barc"><span class="sbar" style="width:${Math.round(s.n / max * 100)}%"></span></td><td class="num">${s.n}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Noch keine Tore.</p>';
  const mine = CAREER.squads[me].filter(p => p.apps).sort((a, b) => b.sg - a.sg || b.apps - a.apps);
  const fArrow = f => f > 1 ? '<b style="color:var(--green)">▲</b>' : f > 0.3 ? '<b style="color:var(--green)">↗</b>' : f < -1 ? '<b style="color:var(--hot)">▼</b>' : f < -0.3 ? '<b style="color:var(--hot)">↘</b>' : '<b style="color:var(--dim)">→</b>';
  const squad = mine.length ? `<table class="sqt stt"><thead><tr><th>POS</th><th>NAME</th><th class="num">SP</th><th class="num">TORE</th><th class="num">Ø</th><th class="num">PAR.</th><th class="num">FORM</th><th class="num">FIT</th></tr></thead><tbody>${
    mine.map(p => `<tr><td>${p.role}</td><td>${esc(p.name)}</td><td class="num">${p.apps}</td><td class="num">${p.role === 'TW' ? '–' : p.sg}</td><td class="num">${p.role === 'TW' ? '–' : (p.sg / p.apps).toFixed(1)}</td><td class="num">${p.role === 'TW' ? p.ss : '–'}</td><td class="num">${fArrow(p.form)}</td><td class="num" style="color:${p.fit < 60 ? 'var(--hot)' : p.fit < 80 ? 'var(--gold)' : 'inherit'}">${Math.round(p.fit)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Noch keine Spiele.</p>';
  return `${kpis}<h3>TABELLENPLATZ NACH SPIELTAG</h3>${chart}<div class="stat2"><div><h3>TORJÄGER DER LIGA</h3>${scorers}${finTable(finOf(), CAREER.money)}</div><div><h3>DEIN KADER · SAISON</h3>${squad}</div></div>`;
}
// Finanzbilanz einer Saison (Saisonabschluss und Statistik)
function finTable(F, money) {
  const rows = [['Zuschauer (Liga)', F.gate], ['Sponsoren', F.sponsor], ['Pokal (Zuschauer und Prämien)', F.cup], ['Europapokal (Zuschauer und Prämien)', F.euro || 0], ['Ligaprämie', F.prize], ['Vorstandsbonus', F.bonus], ['Transfers (Saldo)', F.transfer], ['Gehälter', -F.wages]].filter(r => r[1]);
  const sum = rows.reduce((s, r) => s + r[1], 0), fmt = v => `<span style="color:${v < 0 ? 'var(--hot)' : 'inherit'}">${v < 0 ? '−' : '+'}${euro(Math.abs(v))}</span>`;
  const fans = F.fans && F.fans.length ? `Ø ${Math.round(avg(F.fans)).toLocaleString('de-DE')} Zuschauer bei ${F.fans.length} Heimspielen · Halle ${hallCap(CAREER.team).toLocaleString('de-DE')} Plätze` : '';
  return `<h3>FINANZEN DER SAISON</h3><table class="sqt stt fin"><tbody>${rows.map(([l, v]) => `<tr><td class="lbl">${l}</td><td class="num">${fmt(v)}</td></tr>`).join('')}
    <tr><td class="lbl"><b>Saldo</b></td><td class="num"><b>${fmt(sum)}</b></td></tr>${money !== undefined ? `<tr><td class="lbl">Kontostand</td><td class="num">${fmt(money)}</td></tr>` : ''}</tbody></table>${fans ? `<p class="muted" style="margin:0">${fans}</p>` : ''}`;
}
// ---------- Europapokal: Gruppen und Turnierbaum ----------
function euroStatus() {
  const E = CAREER.euro, me = CAREER.team, n = euroNext();
  if (E.winner !== null) return E.winner === me ? 'Europapokalsieger!' : `Sieger: ${TEAMS[E.winner].n}.${E.teams.includes(me) ? ` Dein Verein: ${euroMyBest()}.` : ''}`;
  const inKo = E.ko.some(k => k.ties.some(t => t.includes(me)));
  const out = E.ko.length ? !E.ko[E.kround].ties.some(t => t.includes(me)) : false;
  if (out || (!inKo && E.gmd === 6)) return `Ausgeschieden (${euroMyBest()}).`;
  if (!E.compact && E.gmd < 6) { const t = groupTable(groupOf(me)), k = t.findIndex(r => r.i === me); return `Gruppe ${GROUP_N[groupOf(me)]}: Platz ${k + 1}, ${t[k].pk} Punkte. ${n ? 'Spiel steht jetzt an.' : `Nächstes Spiel nach Spieltag ${E.gsched[E.gmd]}.`}`; }
  const tie = E.ko[E.kround].ties.find(t => t.includes(me)), opp = tie.find(x => x !== me);
  return `${EURO_KO[E.kround]} gegen ${TEAMS[opp].short}${n ? ', steht jetzt an.' : `, nach Spieltag ${E.ksched[E.kround === 0 ? 0 : 1]}.`}`;
}
function euroView() {
  const E = CAREER.euro, me = CAREER.team;
  const rule = 'Startplätze: Platz 1 und 2 der 1. Liga, dazu der Pokalsieger (falls Erstligist, sonst der Dritte).';
  if (!E) return `<p class="muted">Der Europapokal startet mit der nächsten Saison. ${rule}</p>`;
  const n = euroNext(), inIt = E.teams.includes(me);
  const fmt = E.compact ? '8 Vereine: Viertelfinale, dann Final Four in neutraler Halle.' : '16 Vereine in 4 Gruppen mit Hin- und Rückspiel, die ersten zwei kommen ins Viertelfinale, danach Final Four in neutraler Halle.';
  let html = `<p class="muted">${fmt} ${rule} ${inIt ? `<b style="color:var(--gold)">Dein Verein ist dabei. ${esc(euroStatus())}</b>` : 'Dein Verein ist diese Saison nicht qualifiziert.'}</p>`;
  const line = (a, b, x, y, so) => `<span class="${a === me || b === me ? 'me' : ''}">${TEAMS[a].k} ${x === undefined ? '–:–' : `${x}:${y}${so ? '*' : ''}`} ${TEAMS[b].k}</span>`;
  if (!E.compact) {
    html += `<div class="egroups">${E.groups.map((g, gi) => {
      const t = groupTable(gi), res = [];
      for (let md = 0; md < 6; md++) E.gfix[md].filter(([a]) => g.includes(a)).forEach(([a, b]) => { const r = (E.gres[md] || []).find(x => x[0] === a && x[1] === b); res.push(line(a, b, r ? r[2] : undefined, r ? r[3] : undefined)); });
      return `<div class="egroup"><h3>GRUPPE ${GROUP_N[gi]}</h3><table class="sqt stt"><tbody>${t.map((r, k) => `<tr class="${r.i === me ? 'me' : ''} ${k < 2 ? 'zone-a' : ''}"><td class="num">${k + 1}</td><td class="lbl">${esc(TEAMS[r.i].short)}</td><td class="num">${r.sp}</td><td class="num">${r.d > 0 ? '+' : ''}${r.d}</td><td class="num"><b>${r.pk}</b></td></tr>`).join('')}</tbody></table>
        <p class="eres">${res.join(' · ')}</p></div>`; }).join('')}</div>`;
  }
  // K.-o.-Phase als Baum
  const cols = [0, 1, 2].map(r => { const k = E.ko[r]; if (!k) return Array.from({ length: 4 >> r }, () => ({})); return k.rows ? k.rows.map(([a, b, x, y, so, w]) => ({ a, b, x, y, so, w })) : k.ties.map(([a, b]) => ({ a, b })); });
  const lineB = (t, id, sc) => id === undefined ? '<div class="bt tbd"><span>–</span></div>' : `<div class="bt ${t.w === undefined ? '' : t.w === id ? 'win' : 'out'} ${id === me ? 'mine' : ''}"><span>${TEAMS[id].k}</span><b>${sc ?? ''}</b></div>`;
  const tie = t => `<div class="tie ${t.a === me || t.b === me ? 'myt' : ''}" ${t.a !== undefined ? `title="${esc(TEAMS[t.a].n)} – ${esc(TEAMS[t.b].n)}"` : ''}>${lineB(t, t.a, t.x)}${lineB(t, t.b, t.y)}${t.so ? '<em>n.7m</em>' : ''}</div>`;
  html += `<h3>K.-O.-PHASE${n && n.type === 'ko' ? ` · ${EURO_KO[n.r]} STEHT AN` : ''}</h3><div class="bracket ebr">${cols.map((c, r) => `<div class="bcol"><h3>${r ? EURO_KO[r] + ' (F4)' : EURO_KO[r]}</h3><div class="bties">${c.map(tie).join('')}</div></div>`).join('')}
    <div class="bcol champ"><h3>SIEGER</h3><div class="bties"><div class="tie ${E.winner === me ? 'myt' : ''}">${E.winner !== null ? `<div class="bt win ${E.winner === me ? 'mine' : ''}"><span>🏆 ${TEAMS[E.winner].k}</span></div>` : '<div class="bt tbd"><span>?</span></div>'}</div></div></div></div>`;
  return html;
}
// ---------- Pokal als Turnierbaum ----------
function cupView() {
  const C = CAREER.cup, me = CAREER.team;
  if (!C) return '<p class="muted">Kein Pokal in dieser Saison.</p>';
  // Spalten: gespielte Runden, aktuelle Auslosung, offene Runden. Ältere Runden so sortiert, dass Sieger neben ihrer nächsten Partie stehen
  const cols = CUP_ROUNDS.map((_, r) => {
    const res = C.results.find(x => x.round === r);
    if (res) return res.rows.map(([a, b, x, y, so, w]) => ({ a, b, x, y, so, w }));
    if (C.winner === null && r === C.round) return C.ties.map(([a, b]) => ({ a, b }));
    return Array.from({ length: 16 >> r }, () => ({}));
  });
  for (let r = CUP_ROUNDS.length - 2; r >= 0; r--) {
    const next = cols[r + 1].flatMap(t => [t.a, t.b]);
    if (next.some(v => v !== undefined)) cols[r].sort((p, q) => (next.indexOf(p.w) + 1 || 99) - (next.indexOf(q.w) + 1 || 99));
  }
  const line = (t, id, sc) => id === undefined ? `<div class="bt tbd"><span>–</span></div>`
    : `<div class="bt ${t.w === undefined ? '' : t.w === id ? 'win' : 'out'} ${id === me ? 'mine' : ''}"><span>${TEAMS[id].k}</span><b>${sc ?? ''}</b></div>`;
  const tie = t => `<div class="tie ${t.a === me || t.b === me ? 'myt' : ''}" ${t.a !== undefined ? `title="${esc(TEAMS[t.a].n)} – ${esc(TEAMS[t.b].n)}${t.x !== undefined ? ` ${t.x}:${t.y}${t.so ? ' n.7m' : ''}` : ''}"` : ''}>${line(t, t.a, t.x)}${line(t, t.b, t.y)}${t.so ? '<em>n.7m</em>' : ''}</div>`;
  const status = C.winner !== null ? `Pokalsieger: <b style="color:var(--gold)">${esc(TEAMS[C.winner].n)}</b>.`
    : C.myOut ? `Ausgeschieden. Nächste Runde: ${CUP_ROUNDS[C.round]} nach Spieltag ${C.sched[C.round]}.`
    : cupDue() ? `<b style="color:var(--gold)">${CUP_ROUNDS[C.round]} steht jetzt an</b>, vor dem nächsten Ligaspiel.` : `Nächste Runde: ${CUP_ROUNDS[C.round]} nach Spieltag ${C.sched[C.round]}.`;
  return `<p class="muted">32 Vereine im K.-o.-System, Halbfinale und Finale als Final Four. Unentschieden entscheidet das 7-Meter-Werfen. ${status}</p>
    <div class="bracket">${cols.map((c, r) => `<div class="bcol"><h3>${CUP_ROUNDS[r]}</h3><div class="bties">${c.map(tie).join('')}</div></div>`).join('')}
    <div class="bcol champ"><h3>SIEGER</h3><div class="bties"><div class="tie ${C.winner === me ? 'myt' : ''}">${C.winner !== null ? `<div class="bt win ${C.winner === me ? 'mine' : ''}"><span>🏆 ${TEAMS[C.winner].k}</span></div>` : '<div class="bt tbd"><span>?</span></div>'}</div></div></div></div>`;
}
function careerHub(tab) {
  if (!CAREER) return careerNewScreen();
  if (tab) { CTAB = tab; if (tab !== 'squad') CSEL = null; if (tab !== 'market') CSCOUT = null; }
  SCREEN = 'career'; if (!G || !G.demo) startDemo(); AU.startMusic();
  if (CAREER.summary) return seasonSummary();
  const S = CAREER.season, me = TEAMS[CAREER.team];
  const head = `<div class="row spread"><div class="tname"><img src="${icon(me)}" alt=""><span>${esc(me.n.toUpperCase())}<br><span class="tag">${S.lg}. LIGA · ${seasonName(CAREER.year)} · SPIELTAG ${Math.min(S.round + 1, S.fixtures.length)}/${S.fixtures.length}</span></span></div>
    <div style="text-align:right"><span class="tag">BUDGET · GEHÄLTER ${euro(wagesPerRound())}/SPIELTAG${CAREER.money < 0 ? ' · TRANSFERSPERRE' : ''}</span><br><b style="font-family:var(--pix);font-size:11px;color:${CAREER.money < 0 ? 'var(--hot)' : 'var(--gold)'}">${CAREER.money < 0 ? '−' + euro(-CAREER.money) : euro(CAREER.money)}</b></div></div>`;
  let body = '';
  if (CTAB === 'home') body = paper();
  else if (CTAB === 'squad') {
    const sel = CSEL && CAREER.squads[CAREER.team].find(p => p.pid === CSEL);
    if (sel) body = playerDetail(sel);
    else {
      const sq = CAREER.squads[CAREER.team].slice().sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || b.start - a.start || ovr(b) - ovr(a));
      body = `<p class="muted">Gelb = Startsieben. Tippe auf einen Namen für Details, Aufstellung und Verkauf. POT ist das Potenzial: ↗ wächst noch, ↘ baut ab. FIT ist die aktuelle Frische: Wer müde ist, spielt schwächer und läuft langsamer. AUS (Ausdauer) bestimmt, wie schnell ein Spieler ermüdet und sich erholt.${CAREER.coach.lineup ? ' <b style="color:var(--cyan)">Der Co-Trainer stellt vor jedem Spiel auf.</b>' : ''}</p>
      <table class="sqt cards"><thead><tr><th>POS</th><th>NAME</th><th>GES</th><th title="Potenzial: Höchstwert, den der Spieler erreichen kann">POT</th><th>WUR</th><th>PAS</th><th>ABW</th><th>TEM</th><th>AUS</th><th>FORM</th><th>FIT</th><th>TORE</th><th>VTR</th><th>WERT</th></tr></thead><tbody>${
        sq.map(p => `<tr class="${p.start ? 'me' : ''}"><td data-l="POS">${p.role}</td><td class="c-name"><button class="link" data-act="cPick" data-v="${p.pid}">${esc(p.name)}</button><span class="age">${p.age}</span>${p.star ? ' ★' : ''}${isCapt(p) ? ' <span class="cbadge">C</span>' : ''}${CAREER.seven === p.pid ? ' <span class="cbadge">7M</span>' : ''}${p.age <= 21 && p.pot - ovr(p) > 8 ? ' <span class="tal">TALENT</span>' : ''}${p.inj ? ` <span class="inj">VERL. ${p.inj}</span>` : ''}</td><td data-l="GES"><b>${ovr(p)}</b></td><td data-l="POT">${potCell(p)}</td>
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
  } else if (CTAB === 'market' && CSCOUT && CAREER.market.some(m => m.pid === CSCOUT && marketPlayer(m))) {
    const m = CAREER.market.find(x => x.pid === CSCOUT); body = scoutDetail(marketPlayer(m), m);
  } else if (CTAB === 'market') {
    const sq = CAREER.squads[CAREER.team]; CSCOUT = null;
    body = `<div class="row spread"><p class="muted">Kader ${sq.length}/18 (mindestens 12). Die Liste wird alle zwei Spieltage neu gemischt. Neuzugänge sind ${lockRounds()} Spieltage gesperrt, ein Sofortverkauf bringt 55 % des Marktwerts. Mehr gibt es über Angebote. Tippe auf einen Namen für die Scouting-Karte.${CAREER.money < 0 ? ' <b style="color:var(--hot)">Transfersperre: Die Kasse ist im Minus.</b>' : ''}</p>
      <div class="row"><span class="tag">CPU-TRANSFERS</span><button class="small ${CAREER.aiTransfers ? 'on' : ''}" data-act="cAiT" data-v="1">AN</button><button class="small ${CAREER.aiTransfers ? '' : 'on'}" data-act="cAiT" data-v="0">AUS</button></div></div>`;
    if (CAREER.offers.length) body += `<h3>ANGEBOTE FÜR DEINE SPIELER</h3><table class="sqt cards"><tbody>${CAREER.offers.map(o => { const p = findCareerPlayer(CAREER.team, o.pid); if (!p) return ''; return `<tr><td data-l="POS">${p.role}</td><td class="c-name"><button class="link" data-act="cPick" data-v="${p.pid}">${esc(p.name)}</button> <span class="age">${ovr(p)}</span></td><td data-l="VON">${esc(TEAMS[o.from].short)}</td><td data-l="BIETET">${euro(o.price)}</td><td data-l="BIS">${o.exp}. Sp.</td><td class="c-act"><button class="small main" data-act="cOffer" data-v="${p.pid}:1">ANNEHMEN</button> <button class="small" data-act="cOffer" data-v="${p.pid}:0">ABLEHNEN</button></td></tr>`; }).join('')}</tbody></table>`;
    body += `<h3>TRANSFERLISTE</h3><table class="sqt cards"><thead><tr><th>POS</th><th>NAME</th><th>VON</th><th>GES</th><th>POT</th><th>PREIS</th><th></th></tr></thead><tbody>${
      CAREER.market.map(m => { const p = marketPlayer(m); if (!p) return ''; return `<tr><td data-l="POS">${p.role}</td><td class="c-name"><button class="link" data-act="cScout" data-v="${p.pid}">${esc(p.name)}</button><span class="age">${p.age}</span></td><td data-l="VON">${m.from < 0 ? 'frei' : TEAMS[m.from].k}</td><td data-l="GES"><b>${ovr(p)}</b></td><td data-l="POT">${potCell(p)}</td><td data-l="PREIS">${euroS(m.price)}</td>
        <td class="c-act"><button class="small" data-act="cBuy" data-v="${p.pid}" ${CAREER.money >= m.price ? '' : 'disabled style="opacity:.45"'}>KAUFEN</button></td></tr>`; }).join('')}</tbody></table>`;
    if ((CAREER.transferLog || []).length) body += `<h3>WECHSEL IN DER LIGA</h3><p class="muted" style="font-size:17px">${CAREER.transferLog.slice(0, 5).map(esc).join('<br>')}</p>`;
  } else if (CTAB === 'table') {
    body = `<p class="muted">${S.lg === 1 ? 'Grün: Meister · Rot: Abstieg in die 2. Liga' : 'Grün: Aufstieg in die 1. Liga'}</p>${leagueTable(CAREER.team)}`;
  } else if (CTAB === 'cup') body = cupView();
  else if (CTAB === 'euro') body = euroView();
  else if (CTAB === 'stats') body = statsView();
  else if (CTAB === 'trophy') body = trophyView();
  else if (CTAB === 'hist') {
    // Handy: Karten statt Spalten (Kopfzeile Saison · Liga · Platz, darunter beschriftete Felder)
    body = CAREER.history.length ? `<table class="sqt cards hist"><thead><tr><th>SAISON</th><th>LIGA</th><th>PLATZ</th><th>ZIEL</th><th>MEISTER</th><th>POKAL</th><th>EUROPA</th><th>TORJÄGER</th></tr></thead><tbody>${
      CAREER.history.map(h => `<tr><td class="c-name"><span class="hm-only">${seasonName(h.year)} · ${h.lg}. Liga · Platz ${h.pos}</span><span class="hd-only">${seasonName(h.year)}</span></td><td class="hd-only">${h.lg}.</td><td class="hd-only">${h.pos}</td><td data-l="ZIEL" style="color:${h.met ? 'var(--green)' : h.met === false ? 'var(--hot)' : 'inherit'}">${esc(h.goal || '–')}</td><td data-l="MEISTER">${esc(TEAMS[h.champ].short)}</td><td data-l="POKAL" style="${h.cup === CAREER.team ? 'color:var(--gold)' : ''}">${h.cup !== null && h.cup !== undefined ? esc(TEAMS[h.cup].short) : '–'}</td><td data-l="EUROPA" style="${h.euro === CAREER.team ? 'color:var(--gold)' : ''}">${h.euro !== null && h.euro !== undefined ? esc(TEAMS[h.euro].short) : '–'}${h.euroMy && h.euro !== CAREER.team ? ` <span class="muted">(${esc(h.euroMy)})</span>` : ''}</td><td data-l="TORJÄGER">${h.top ? `${esc(h.top.name)} (${h.top.n})` : '–'}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Noch keine abgeschlossene Saison.</p>';
    body += `<div class="row"><button data-act="cDel">${CDEL ? 'WIRKLICH LÖSCHEN? JA' : 'KARRIERE LÖSCHEN'}</button>${CDEL ? '<button data-act="cTab" data-v="hist">NEIN</button>' : ''}</div>`;
  }
  // Auf der Spielerkarte bleibt der Fokus auf dem gedrückten Knopf (STATISTIK, 7-METER, KAPITÄN, BANK), sonst springt er bei Pad und Tastatur nach oben
  const ae = document.activeElement, keep = (CSEL || CSCOUT) && ae && ae.closest && ae.closest('.pcard') && ae.dataset.act !== 'cSell' ? [ae.dataset.act, ae.dataset.v || ''] : null;
  showMenu(`<div class="panel wide"><div class="csticky">${head}${tabs()}</div>${CMSG ? `<p style="margin:0;color:var(--hot)">${esc(CMSG)}</p>` : ''}${body}<div class="row"><button data-act="main">HAUPTMENÜ</button></div></div>`);
  const c = menu.querySelector('#pdC');
  if (c && CSEL) { const p = CAREER.squads[CAREER.team].find(x => x.pid === CSEL); if (p) c.getContext('2d').drawImage(portrait(p, { c1: me.home.c1, c2: me.home.c2, gk: me.gkc }), 0, 0); }
  else if (c && CSCOUT) { const m = CAREER.market.find(x => x.pid === CSCOUT), p = m && marketPlayer(m), T = m && m.from >= 0 ? TEAMS[m.from] : null;   // im Trikot seines Vereins, vereinslos in Grau
    if (p) c.getContext('2d').drawImage(portrait(p, T ? { c1: T.home.c1, c2: T.home.c2, gk: T.gkc } : { c1: '#6d6878', c2: '#d9d4e3', gk: '#3d3a46' }), 0, 0); }
  const on = menu.querySelector('.ctabs .on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  if (keep) { const same = a => a === keep[0] || (/^c(Bench|Start)$/.test(a) && /^c(Bench|Start)$/.test(keep[0])), k = [...menu.querySelectorAll('.pcard [data-act]')].find(b => same(b.dataset.act) && (b.dataset.v || '') === keep[1]); if (k) k.focus({ preventScroll: true }); }
  CMSG = ''; if (CTAB !== 'hist') CDEL = false;
}
function seasonSummary() {
  const s = CAREER.summary, me = TEAMS[CAREER.team];
  const head = s.move === 'auf' ? 'AUFSTIEG!' : s.move === 'ab' ? 'ABSTIEG' : s.pos === 1 ? (s.lg === 1 ? 'DEUTSCHER MEISTER!' : 'MEISTER DER 2. LIGA') : `PLATZ ${s.pos}`;
  showMenu(`<div class="panel"><h2>SAISON ${seasonName(s.year)} · ABSCHLUSS</h2>
    <p class="res" style="color:${s.move === 'ab' ? 'var(--hot)' : 'var(--gold)'}">${s.titles && s.titles.length ? seasonHead(s) : head}</p>
    ${s.titles && s.titles.length ? `<div class="tshelves mini">${s.titles.map(k => `<div class="tshelf won">${trophySvg(TITLE_TYPES.find(t => t.k === k).col, true)}<span>${titleName(k)}</span></div>`).join('')}</div>` : ''}
    <div class="row" style="justify-content:center"><button class="main" data-act="cShare" data-v="season">SAISON ALS BILD TEILEN</button></div>
    <p class="muted" style="text-align:center">${esc(me.n)} beendet die ${s.lg}. Liga auf Platz ${s.pos}. Saisonziel „${esc(s.goal || '')}“ ${s.goalMet ? '<b style="color:var(--green)">erreicht</b>' : '<b style="color:var(--hot)">verfehlt</b>'}. Prämie: ${euro(s.prize)}.</p>
    ${s.board ? `<p class="muted" style="text-align:center;color:${s.board.fired ? 'var(--hot)' : s.board.warn ? 'var(--gold)' : 'var(--green)'}"><b>VORSTAND:</b> ${esc(s.board.txt)}</p>` : ''}
    ${CAREER.jobOffers ? `<div class="jobs"><h3>ENTLASSEN · DEINE JOBANGEBOTE</h3><p class="muted">Diese Vereine wollen dich als Trainer. Wähle einen aus: Du startest mit ihrem Kader und ihrem Budget in die neue Saison. Deine Erfolge und Rekorde nimmst du mit.</p>
      <div class="btns menu-list">${CAREER.jobOffers.map(id => `<button data-act="cJob" data-v="${id}">${esc(TEAMS[id].n)} <i>${CAREER.lgOf[id]}. Liga · Stärke ${strength(id).ovr} · ${euro(CAREER.aiMoney[id])}</i></button>`).join('')}</div></div>` : ''}
    ${s.fin ? finTable(s.fin, s.money) : ''}
    <table class="sqt"><tbody>
      <tr><td>Meister 1. Liga</td><td>${esc(TEAMS[s.champ1].n)}</td></tr>
      <tr><td>Meister 2. Liga</td><td>${esc(TEAMS[s.champ2].n)}</td></tr>
      <tr><td>Aufsteiger</td><td>${s.up.map(i => esc(TEAMS[i].n)).join(', ')}</td></tr>
      <tr><td>Absteiger</td><td>${s.down.map(i => esc(TEAMS[i].n)).join(', ')}</td></tr>
      <tr><td>Pokalsieger</td><td>${s.cupWinner !== null && s.cupWinner !== undefined ? esc(TEAMS[s.cupWinner].n) : '–'}${s.cupWinner === CAREER.team ? ' (DEIN VEREIN!)' : ''}</td></tr>
      <tr><td>Europapokalsieger</td><td>${s.euroWinner !== null && s.euroWinner !== undefined ? esc(TEAMS[s.euroWinner].n) : '–'}${s.euroWinner === CAREER.team ? ' (DEIN VEREIN!)' : s.euroMy ? ` · dein Verein: ${esc(s.euroMy)}` : ''}</td></tr>
      <tr><td>Torschützenkönig</td><td>${s.top ? `${esc(s.top.name)} (${TEAMS[s.top.tid].k}), ${s.top.n} Tore` : '–'}</td></tr>
    </tbody></table>
    <h3>ENTWICKLUNG IM KADER</h3><p class="muted" style="font-size:18px">${s.dev.slice(0, 8).map(d => `${esc(d.name)} <b style="color:${d.d > 0 ? 'var(--green)' : 'var(--hot)'}">${d.d > 0 ? '+' : ''}${d.d}</b> (${d.o})`).join(' · ') || 'Kaum Veränderungen.'}</p>
    ${s.gone && s.gone.length ? `<p class="muted">Vertrag ausgelaufen, ablösefrei weg: ${s.gone.map(esc).join(', ')}.</p>` : ''}
    ${s.youth && s.youth.length ? `<p class="muted">Aus der Jugend rücken nach: ${s.youth.map(esc).join(', ')}.</p>` : ''}
    ${s.retired.length ? `<p class="muted">Karriereende: ${s.retired.map(esc).join(', ')}. Talente aus der Jugend rücken nach.</p>` : ''}
    ${CAREER.jobOffers ? '' : `<div class="row"><button class="main" data-act="cNext">SAISON ${seasonName(CAREER.year)} STARTEN</button></div>`}</div>`);
}
Object.assign(ACT, {
  cNew() { SEASON_PICK = false; careerCreate(SEL.a, SEL.len, SEL.half, SEL.diff, SEL.ait === 0, SEL.coach); track('karriere-neu'); careerHub('home'); },
  cTab(v) { CSEL = null; CSELL = null; CSCOUT = null; CTAB = v; careerHub(); },
  cScout(v) { CSCOUT = v ? +v : null; CTAB = 'market'; careerHub(); },
  cPick(v) { CSEL = v ? +v : null; CSELL = null; CTAB = 'squad'; careerHub(); },
  cPlay() {
    const ct = ownCupTie(), et = !ct && ownEuroTie(), en = et ? euroNext() : null, fx = ct || et || ownFixture(); if (!fx) return careerHub();
    coachPrep();
    const L = [lineup(fx[0]), lineup(fx[1])];
    prematch(fx[0], fx[1], { human: fx.indexOf(CAREER.team), halfLen: HALVES[CAREER.half].s, diff: CAREER.diff, career: true, cup: !!ct || !!(en && en.type === 'ko'), euro: !!et, event: ct ? cupEvent(CAREER.cup.round) : en && en.type === 'ko' ? euroEvent(en.r) : null, autoSub: CAREER.coach.lineup || true,
      lineups: L, benches: [benchOf(fx[0], L[0]), benchOf(fx[1], L[1])], label: ct ? `POKAL · ${CUP_ROUNDS[CAREER.cup.round]}` : en ? euroLabel(en) : `${CAREER.season.lg}. LIGA · ${CAREER.season.round + 1}. SPIELTAG` }, 'career');
  },
  cExt(v) { const [pid, y] = v.split(':').map(Number); CMSG = extendContract(pid, y); careerHub(); },
  cSim() { careerSimOwn(); track('karriere-simuliert'); careerHub('home'); },
  cStat() { CSTAT = !CSTAT; careerHub(); },
  cBench(v) {   // auf die Bank: der beste gesunde Ersatz auf derselben Position rückt in die Startsieben
    const sq = CAREER.squads[CAREER.team], p = sq.find(x => x.pid === +v); if (!p) return careerHub();
    const alt = sq.filter(x => x.role === p.role && x !== p && !x.inj).sort((a, b) => effOvr(b) - effOvr(a))[0];
    if (!alt) { CMSG = `Kein gesunder Ersatz für ${p.name} auf dieser Position.`; return careerHub(); }
    p.start = false; alt.start = true; if (CAREER.coach.lineup) { CAREER.coach.lineup = false; CMSG = `${alt.name} spielt für ${p.name}. Du stellst jetzt selbst auf.`; } else CMSG = `${alt.name} spielt für ${p.name}.`;
    saveCareer(); careerHub();
  },
  cSeven(v) { const p = CAREER.squads[CAREER.team].find(x => x.pid === +v); if (!p) return careerHub(); CAREER.seven = CAREER.seven === p.pid ? null : p.pid; CMSG = CAREER.seven ? `${p.name} wirft ab jetzt die 7-Meter.` : 'Die 7-Meter wirft wieder der beste Werfer auf dem Feld.'; if (CAREER.seven) news(CMSG); saveCareer(); careerHub(); },
  cCapt(v) { const p = CAREER.squads[CAREER.team].find(x => x.pid === +v); if (!p) return careerHub(); CAREER.capt = CAREER.capt === p.pid ? null : p.pid; CMSG = CAREER.capt ? `${p.name} ist neuer Kapitän.` : `${p.name} gibt die Kapitänsbinde ab.`; if (CAREER.capt) news(`${p.name} ist neuer Kapitän und führt die Mannschaft aufs Feld.`); saveCareer(); careerHub(); },
  cStart(v) {
    const sq = CAREER.squads[CAREER.team], p = sq.find(x => x.pid === +v);
    if (p && p.inj) { CMSG = `${p.name} ist verletzt und kann nicht spielen.`; return careerHub(); }
    if (p) { sq.filter(x => x.role === p.role).forEach(x => x.start = false); p.start = true; if (CAREER.coach.lineup) { CAREER.coach.lineup = false; CMSG = 'Du stellst jetzt selbst auf. Der Co-Trainer hält sich raus (umschaltbar unter Training).'; } saveCareer(); }
    careerHub();
  },
  cCoach(v) { const [k, on] = v.split(':'); CAREER.coach[k] = on === '1'; if (k === 'training' && CAREER.coach.training) CAREER.training = coachTraining(); if (k === 'lineup' && CAREER.coach.lineup) coachPrep(); saveCareer(); careerHub('train'); },
  cSell(v) { if (CSELL !== +v) { CSELL = +v; return careerHub(); } CSELL = null; CMSG = sellPlayer(+v); if (!CMSG) CSEL = null; careerHub(); },
  cBuy(v) { const m = CAREER.market.find(x => x.pid === +v), p = m && marketPlayer(m); CMSG = buyPlayer(+v); if (!CMSG && p) { CSCOUT = null; CMSG = `${p.name} gehört jetzt zu deinem Kader (Rückennummer ${p.num}).`; } careerHub('market'); },
  cOffer(v) { const [pid, a] = v.split(':'); CMSG = answerOffer(+pid, a === '1'); careerHub(); },   // bleibt, wo entschieden wurde: Transferliste oder Spielerkarte
  cAiT(v) { CAREER.aiTransfers = v === '1'; saveCareer(); careerHub('market'); },
  cTrain(v) { CAREER.training = v; if (CAREER.coach.training) { CAREER.coach.training = false; CMSG = 'Du bestimmst das Training jetzt selbst.'; } saveCareer(); careerHub('train'); },
  cEnd() { careerEndSeason(); careerHub(); },
  cNext() { CAREER.summary = null; saveCareer(); careerHub('home'); },
  cJob(v) { takeJob(+v); CAREER.summary = null; saveCareer(); careerHub('home'); },
  cDel() { if (!CDEL) { CDEL = true; return careerHub('hist'); } CDEL = false; store.del(CAREER_KEY); store.del(SAVE_KEY); CAREER = null; ACT.main(); },
});
