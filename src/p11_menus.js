// ================= Menüs, Editor, Spielende, Speichern =================
const menu = document.getElementById('menu');
const HALVES = [{ n: '2 MIN', s: 120 }, { n: '3 MIN', s: 180 }, { n: '5 MIN', s: 300 }];
const SEL = { lg: 1, a: 2, b: 1, slot: 'a', half: 1, diff: 1, def: 0, len: 1 };
const ICONS = new Map();
const kitIcon = K => { const key = K.c1 + K.c2; if (!ICONS.has(key)) ICONS.set(key, jerseyIcon(K).toDataURL()); return ICONS.get(key); };
const icon = T => kitIcon(T.home);
const SAVE_KEY = 'hl3_spielstand';
let PM = null;   // Vor-dem-Spiel-Auswahl
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function showMenu(html, clear = false) {
  if (!document.body.classList.contains('touch')) html += `<p class="navhint">PFEILE wählen · ENTER bestätigen · ESC zurück</p>`;
  menu.innerHTML = html; menu.hidden = false; document.body.classList.add('menuopen'); menu.scrollTop = 0;
  if (document.body.classList.contains('touch') && !['title', 'main'].includes(SCREEN) && !(G && !G.demo && G.paused && SCREEN === 'pause')) {
    const t = menu.querySelector('h2'), bar = document.createElement('div'); bar.className = 'mbar';
    bar.innerHTML = `<button class="mback" aria-label="Zurück">‹ ZURÜCK</button><span>${t ? t.textContent : ''}</span>`;
    bar.firstChild.addEventListener('click', () => { AU.init(); menuBack(); });
    if (backTarget()) menu.prepend(bar);
  } menu.classList.toggle('clear', clear);
  const f = menu.querySelector('[autofocus]') || menu.querySelector('button.main') || menu.querySelector('button'); if (f) f.focus({ preventScroll: true });
}
function hideMenu() { menu.hidden = true; menu.innerHTML = ''; document.body.classList.remove('menuopen'); }
menu.addEventListener('click', e => { const bt = e.target.closest('[data-act]'); if (!bt) return; AU.init(); AU.select(); ACT[bt.dataset.act](bt.dataset.v); });
// ---------- Menüsteuerung: Pfeiltasten räumlich, Enter wählt, Esc/Backspace zurück ----------
const focusables = () => [...menu.querySelectorAll('button:not([disabled]), input, select')].filter(el => el.offsetParent !== null);
function menuMove(dir) {
  const els = focusables(); if (!els.length) return;
  const cur = document.activeElement;
  if (!els.includes(cur)) { (menu.querySelector('button.main') || els[0]).focus(); return; }
  const r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const [dx, dy] = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir];
  let best = null, bs = 1e9;
  for (const el of els) {
    if (el === cur) continue;
    const q = el.getBoundingClientRect(), ex = q.left + q.width / 2, ey = q.top + q.height / 2, vx = ex - cx, vy = ey - cy;
    const along = vx * dx + vy * dy; if (along <= 4) continue;
    const across = Math.abs(vx * dy - vy * dx), sc = along + across * 2.5;
    if (sc < bs) { bs = sc; best = el; }
  }
  if (!best && (dir === 'down' || dir === 'up')) best = dir === 'down' ? els[0] : els[els.length - 1];   // am Ende umbrechen
  if (best) { best.focus(); best.scrollIntoView({ block: 'nearest' }); AU.select(); }
}
function backTarget() {
  const btns = [...menu.querySelectorAll('button:not(.mback)')];
  return btns.find(x => /^(ZURÜCK|NEIN)/.test(x.textContent.trim())) || menu.querySelector('[data-back]') || menu.querySelector('button[data-act="main"]');
}
function menuBack() {
  if (menu.hidden) return;
  if (G && !G.demo && G.paused && SCREEN === 'pause') { togglePause(); return; }
  const b = backTarget();
  if (b) { AU.back(); b.click(); } else if (SCREEN === 'main') { AU.back(); ACT.title(); }
}
addEventListener('keydown', e => {
  if (menu.hidden) return;
  const el = document.activeElement, tag = el && el.tagName, type = el && el.type;
  if (e.code === 'Escape' || (e.code === 'Backspace' && tag !== 'INPUT')) { e.preventDefault(); if (tag === 'INPUT' || tag === 'SELECT') el.blur(); menuBack(); return; }
  const dir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.code]; if (!dir) return;
  if (tag === 'INPUT' && (type === 'range' || type === 'text' || type === 'color' || !type) && (dir === 'left' || dir === 'right')) return;
  if (tag === 'SELECT' && (dir === 'up' || dir === 'down')) return;
  e.preventDefault(); menuMove(dir);
});
function startDemo() {
  const lg = LEAGUE(1), a = pick(lg).id; let b; do { b = pick(lg).id; } while (b === a);
  newMatch(a, b, { demo: true, human: -1, halfLen: 99999 });
}
function bars(T) {
  const row = (l, v) => `<span>${l}</span><div class="bar"><i style="width:${clamp((v - 60) / 35 * 100, 5, 100)}%"></i></div><span>${v}</span>`;
  return `<div class="bars">${row('Angriff', T.att)}${row('Abwehr', T.def)}${row('Torwart', T.gk)}${row('Tempo', T.spd)}</div>`;
}
function tcard(id, label, cls, active) {
  const T = TEAMS[id];
  return `<div class="tcard ${cls} ${active ? 'active' : ''}" data-act="slot" data-v="${cls}"><span class="tag">${label}</span>
    <div class="tname"><img src="${icon(T)}" alt="">${esc(T.n)}</div>${bars(T)}</div>`;
}
function optRow(label, list, key) {
  return `<div class="row"><span class="tag" style="min-width:120px">${label}</span>${list.map((o, i) => `<button class="small ${SEL[key] === i ? 'on' : ''}" data-act="opt" data-v="${key}:${i}">${o.n}</button>`).join('')}</div>`;
}
const lgName = l => l === 3 ? 'EUROPA' : `${l}. LIGA`;
// Karriere: nur deutsche Ligen wählbar; Schnelles Spiel zusätzlich die internationalen Vereine
function leagueTabs(act = 'lg') { return `<div class="row">${(SEASON_PICK ? [1, 2] : [1, 2, 3]).map(l => `<button class="small ${SEL.lg === l ? 'on' : ''}" data-act="${act}" data-v="${l}">${lgName(l)}</button>`).join('')}</div>`; }
function teamGrid(selA, selB) {
  return `<div class="grid">${LEAGUE(SEL.lg).map(T => `<button class="tbtn ${T.id === selA ? 'sel-a' : ''} ${T.id === selB ? 'sel-b' : ''}" data-act="team" data-v="${T.id}" title="${esc(T.n)}"><img src="${icon(T)}" alt="">${T.k}</button>`).join('')}</div>`;
}
let SCREEN = 'title';
const ACT = {
  title() {
    SCREEN = 'title'; if (!G || !G.demo) startDemo(); AU.startMusic();
    addEventListener('keydown', function anyKey(e) { if (SCREEN === 'title' && !['Tab', 'ShiftLeft', 'ShiftRight'].includes(e.code)) { e.preventDefault(); ACT.main(); } removeEventListener('keydown', anyKey); }, { once: true });
    showMenu(`<div class="title"><p class="logo">HALLEN-<br>LEGENDEN<span>HANDBALL 26/27</span></p>
      <button class="press" data-act="main" autofocus>DRÜCKE START</button>
      <p class="legal">Inoffizielles Fan-Spiel. Vereinsnamen nur zur Zuordnung, ohne Logos und ohne Verbindung zu Liga oder Vereinen.</p>
      <p class="legal">${esc(PLATFORM.legal || '© 2026 tobwil · Quellcode offen, nicht kommerziell · github.com/tobwil/HallenLegenden')}</p></div>`, true);
  },
  main() {
    SCREEN = 'main'; AU.startMusic();
    showMenu(`<div class="panel narrow"><h2>HAUPTMENÜ</h2><div class="btns menu-list">
      ${savedInfo() ? `<button class="main" data-act="load">FORTSETZEN <i>${savedInfo()}</i></button>` : ''}
      <button class="${savedInfo() ? '' : 'main'}" data-act="quick">SCHNELLES SPIEL <i>1 gegen CPU</i></button>
      <button data-act="career">KARRIERE <i>${CAREER ? `${esc(TEAMS[CAREER.team].k)} · ${CAREER.season.lg}. Liga · ${CAREER.year}/${String(CAREER.year + 1).slice(2)}` : 'Manager & Liga'}</i></button>
      <button data-act="editor">EDITOR <i>Vereine, Farben, Spieler</i></button>
      <button data-act="help">STEUERUNG <i>& Regeln</i></button>
      <button data-act="options">OPTIONEN <i>Lautstärke, Hallensprecher</i></button>
      ${PLATFORM.quit ? '<button data-act="exitGame">BEENDEN <i>zurück zum Desktop</i></button>' : ''}</div></div>`);
  },
  exitGame() { if (PLATFORM.quit) PLATFORM.quit(); },
  quick() {
    SCREEN = 'quick'; SEASON_PICK = false;
    showMenu(`<div class="panel"><div class="row spread"><h2>SCHNELLES SPIEL</h2>${leagueTabs()}</div>
      <div class="duel">${tcard(SEL.a, 'DU (HEIM)', 'a', SEL.slot === 'a')}<div class="vs">VS</div>${tcard(SEL.b, 'CPU (GAST)', 'b', SEL.slot === 'b')}</div>
      <h3>${SEL.slot === 'a' ? 'WÄHLE DEIN TEAM' : 'WÄHLE DEN GEGNER'} (KARTE OBEN ANTIPPEN ZUM WECHSELN)</h3>
      ${teamGrid(SEL.a, SEL.b)}
      ${optRow('HALBZEIT', HALVES, 'half')}${optRow('SCHWIERIGKEIT', DIFF, 'diff')}${optRow('DECKUNG', DEF_SYS, 'def')}
      <div class="row"><button class="main" data-act="kick">ANPFIFF</button><button data-act="main">ZURÜCK</button></div></div>`);
  },
  lg(v) { SEL.lg = +v; (SEASON_PICK ? careerNewScreen : ACT.quick)(); },
  slot(v) { SEL.slot = v; ACT.quick(); },
  team(v) {
    v = +v;
    if (SEASON_PICK) { SEL.a = v; return careerNewScreen(); }
    if (SEL.slot === 'a') { if (v === SEL.b) SEL.b = SEL.a; SEL.a = v; SEL.slot = 'b'; } else { if (v === SEL.a) SEL.a = SEL.b; SEL.b = v; }
    ACT.quick();
  },
  opt(v) { const [k, i] = v.split(':'); SEL[k] = +i; if (SCREEN === 'pre') return prematch(); (SEASON_PICK ? careerNewScreen : ACT.quick)(); },
  kick() { prematch(SEL.a, SEL.b, { human: 0, halfLen: HALVES[SEL.half].s, diff: SEL.diff, label: 'FREUNDSCHAFTSSPIEL' }, 'quick'); },
  kitpick(v) { const [side, i] = v.split(':'); PM[side] = +i; prematch(); },
  pmGo() { startMatch(PM.a, PM.b, { ...PM.o, kitA: PM.ia, kitB: PM.ib }); },
  pmBack() { SCREEN = ''; PM.back === 'career' ? careerHub() : ACT.quick(); },
  pmSim() { SCREEN = ''; ACT.cSim(); },   // aus der Vorschau heraus simulieren (dasselbe Spiel, das gerade angezeigt wurde)
  load() { loadMatch(); },
  saveQuit() { saveMatch(); G = null; ACT.main(); },
  help() {
    SCREEN = 'help';
    showMenu(`<div class="panel"><h2>STEUERUNG</h2><div class="keys">
      <b>PFEILE</b><span>Laufen</span>
      <b>W / SHIFT</b><span>Sprinten (kostet Puste)</span>
      <b>S</b><span>Angriff: Pass in Laufrichtung (ohne Richtung zum besten freien Mitspieler) · Abwehr: Spieler wechseln. Erst zum ballnächsten, jedes weitere Drücken zum nächstnäheren. Ohne Wechseltaste steuerst du automatisch den ballnächsten Spieler</span>
      <b>A</b><span>Kempa-Trick: Lupfer in den Kreis, der Mitspieler fängt im Sprung und wirft (auch SHIFT + S) · Abwehr: wie S</span>
      <b>LEERTASTE</b><span>Angriff: Wurf. Kurz tippen = schneller Wurf, halten = mehr Wucht. Das Zielkreuz zeigt die Ecke (hoch/runter = Seite, Aufladen = Höhe) · Abwehr: Blocksprung</span>
      <b>D</b><span>Angriff: Finte, beim Aufladen = Heber · Abwehr: Ball herausspielen (Foulgefahr)</span>
      <b>Q</b><span>Wechselmenü</span>
      <b>T</b><span>Team-Timeout (1 pro Halbzeit, nur in Ballbesitz): Deckung umstellen</span>
      <b>ESC / P</b><span>Pause · M Ton</span>
      <b>7-METER</b><span>Als Schütze zielen und abziehen. Als Torwart vor dem Wurf hoch/runter drücken und die Ecke raten</span>
      <b>GAMEPAD</b><span>A Pass · X Wurf · B Finte/Klau · RB Sprint · Start Pause. Im Menü: Steuerkreuz wählen, A bestätigen, B zurück</span>
      <b>TOUCH</b><span>Daumen links aufsetzen und ziehen = laufen, weit ziehen = sprinten. Rechts PASS (lang drücken = Kempa), WURF (halten = mehr Wucht), FINTE. In der Abwehr: WECHSEL, BLOCK, KLAU. Schneller geht es oft per Antippen: Mitspieler = Pass zu ihm, Tor = Wurf in diese Ecke, in der Abwehr Spieler = zu ihm wechseln. II oben rechts = Pause. Knopfgröße unter Optionen</span></div>
      <h2>REGELN</h2><p class="muted">Feldspieler dürfen den 6-m-Kreis nicht betreten, nur im Sprung. Wer mit Ball im Kreis landet, verliert ihn. Fouls bei klarer Chance geben 7-Meter, harte Fouls 2 Minuten. Zu langes Spiel ohne Torgefahr wird als passives Spiel abgepfiffen. Nach einem Tor kannst du mit einer Taste die schnelle Mitte spielen.</p>
      <button data-act="${G && !G.demo && G.paused ? 'pause' : 'main'}">ZURÜCK</button></div>`);
  },
  sound() { AU.toggle(); if (AU.on) AU.startMusic(); ACT.options(); },
  options() {
    const sl = (k, l) => `<span class="tag">${l}</span><input type="range" id="vol_${k}" min="0" max="100" value="${Math.round(AU.vol[k] * 100)}" aria-label="${l}"><span id="vv_${k}">${Math.round(AU.vol[k] * 100)}</span>`;
    showMenu(`<div class="panel narrow"><h2>OPTIONEN</h2>
      <div class="ed" style="grid-template-columns:auto 1fr 40px">${sl('master', 'GESAMT')}${sl('music', 'MUSIK')}${sl('sfx', 'EFFEKTE')}${sl('crowd', 'PUBLIKUM')}</div>
      <div class="row"><span class="tag" style="min-width:150px">SPIELTEMPO</span>${[1, 0.85, 0.7].map(v => `<button class="small ${SETTINGS.speed === v ? 'on' : ''}" data-act="speed" data-v="${v}">${Math.round(v * 100)} %</button>`).join('')}</div>
      ${TOUCHDEV ? `<div class="row"><span class="tag" style="min-width:150px">TOUCH-KNÖPFE</span>${[['s', 'KLEIN'], ['m', 'NORMAL'], ['l', 'GROSS']].map(([k, n]) => `<button class="small ${(SETTINGS.btn || 'm') === k ? 'on' : ''}" data-act="btnSize" data-v="${k}">${n}</button>`).join('')}</div>` : ''}
      <div class="row"><span class="tag" style="min-width:150px">TON</span><button class="small ${AU.on ? 'on' : ''}" data-act="sound">${AU.on ? 'AN' : 'AUS'}</button></div>
      <div class="row"><span class="tag" style="min-width:150px">HALLENSPRECHER</span><button class="small ${AU.vol.speaker ? 'on' : ''}" data-act="speaker">${AU.vol.speaker ? 'AN' : 'AUS'}</button><button class="small" data-act="sndTest">PROBE</button></div>
      <p class="muted">Der Hallensprecher nutzt die Sprachausgabe deines Browsers. Je nach Gerät klingt die Stimme anders oder fehlt ganz.</p>
      <div class="row"><button class="main" data-act="main">ZURÜCK</button></div></div>`);
    ['master', 'music', 'sfx', 'crowd'].forEach(k => { const el = menu.querySelector('#vol_' + k); el.oninput = () => { AU.setVol(k, el.value / 100); menu.querySelector('#vv_' + k).textContent = el.value; }; });
  },
  speed(v) { SETTINGS.speed = +v; store.set('hl4_settings', SETTINGS); ACT.options(); },
  btnSize(v) { SETTINGS.btn = v; store.set('hl4_settings', SETTINGS); applyBtnSize(); ACT.options(); },
  speaker() { AU.vol.speakerChosen = true; AU.setVol('speaker', !AU.vol.speaker); ACT.options(); },
  sndTest() { AU.init(); AU.whistle(1); setTimeout(() => { AU.cheer(0.7); AU.horn(); }, 400); setTimeout(() => AU.say('Tor für die Heimmannschaft! Torschütze mit der Nummer 7!'), 900); },
  pause() {
    SCREEN = 'pause';
    showMenu(`<div class="panel narrow"><h2>PAUSE</h2><p class="muted">${esc(TEAMS[G.tid[0]].n)} ${G.score[0]} : ${G.score[1]} ${esc(TEAMS[G.tid[1]].n)}</p>
      <div class="btns menu-list"><button class="main" data-act="resume">WEITERSPIELEN</button>
      ${G.human >= 0 ? `<div class="row"><span class="tag" style="min-width:120px">DECKUNG</span>${DEF_SYS.map((d, i) => `<button class="small ${G.tact[G.human] === i ? 'on' : ''}" data-act="tact" data-v="${i}">${d.n}</button>`).join('')}</div>` : ''}
      ${G.human >= 0 ? `<button data-act="subs">WECHSELN <i>Q · Kraft der Spieler</i></button>` : ''}
      <button data-act="help">STEUERUNG</button><button data-act="saveQuit">SPEICHERN & BEENDEN <i>später fortsetzen</i></button>
      <button data-act="quit">AUFGEBEN${G.career ? ' <i>wird nicht gewertet</i>' : ''}</button></div></div>`);
  },
  subs() {
    SCREEN = 'subs'; const t = G.human, on = G.players.filter(p => p.team === t);
    const bar = e => `<span class="bar" style="display:inline-block;width:46px;vertical-align:middle"><i style="width:${Math.round(e * 100)}%;background:${e > 0.65 ? 'var(--green)' : e > 0.45 ? 'var(--gold)' : 'var(--hot)'}"></i></span>`;
    showMenu(`<div class="panel"><h2>WECHSELN</h2><p class="muted">Kraft sinkt mit der Spielzeit, Ausdauer bremst den Abbau. Auf der Bank erholen sich Spieler. Den Ballführer und Spieler mit Zeitstrafe kannst du nicht wechseln.</p>
      <div class="row"><span class="tag" style="min-width:150px">AUTO-WECHSEL</span><button class="small ${G.autoSub ? 'on' : ''}" data-act="autoSub" data-v="1">CO-TRAINER</button><button class="small ${G.autoSub ? '' : 'on'}" data-act="autoSub" data-v="0">ICH SELBST</button></div>
      <table class="sqt cards"><thead><tr><th>POS</th><th>AUF DEM FELD</th><th>KRAFT</th><th>BANK</th></tr></thead><tbody>${on.map(p => {
        const opts = G.bench[t].map((b, i) => [b, i]).filter(([b]) => b.role === p.role);
        return `<tr><td data-l="POS">${p.role}</td><td class="c-name">#${p.num} ${esc(p.name)}${p.injured ? ' <b style="color:var(--hot)">VERLETZT</b>' : ''}</td><td data-l="KRAFT">${bar(p.energy)}</td>
          <td class="c-act">${p.out ? '<span class="tag">ZEITSTRAFE</span>' : opts.map(([b, i]) => `<button class="small" data-act="doSub" data-v="${p.i}:${i}" ${b.injured ? 'disabled style="opacity:.45"' : ''}>↔ #${b.num} ${esc(b.name)} ${Math.round(b.energy * 100)}%</button>`).join(' ') || '–'}</td></tr>`; }).join('')}</tbody></table>
      <div class="row"><button class="main" data-act="pause">ZURÜCK</button></div></div>`);
  },
  doSub(v) { const [pi, bi] = v.split(':').map(Number), p = G.players.find(q => q.team === G.human && q.i === pi); if (p && !doSub(p, bi)) CMSG = ''; ACT.subs(); },
  autoSub(v) { G.autoSub = v === '1'; ACT.subs(); },
  tact(v) { G.tact[G.human] = +v; if (G.phase === 'timeout') { hideMenu(); resumeTimeout(); say(`Umstellung auf ${DEF_SYS[+v].n}-Deckung.`); } else ACT.pause(); },
  resume() { G.paused = false; hideMenu(); },
  quit() { store.del(SAVE_KEY); G = null; ACT.main(); },
  career() { careerEntry(); },
  afterMatch() { const c = G && G.career; G = null; if (c) careerHub(); else ACT.main(); },
  rematch() { const a = G.tid[0], b = G.tid[1]; startMatch(a, b, { human: 0, halfLen: G.halfLen, diff: G.diff, label: 'REVANCHE' }); },
  editor(v) {
    const tid = v !== undefined ? +v : (SEL.edit ?? SEL.a); SEL.edit = tid;
    const ps = roster(tid).concat(quickBench(tid)), csq = CAREER && CAREER.squads[tid];
    const T = TEAMS[tid];
    const row = (p, id, lbl) => `<span class="tag">${p.role}</span><input id="${id}N" value="${esc(p.name)}" maxlength="16" aria-label="Name ${lbl}"><input id="${id}Z" value="${p.num}" inputmode="numeric" maxlength="2" aria-label="Nummer ${lbl}">`;
    showMenu(`<div class="panel"><h2>EDITOR</h2>
      <p class="muted">Vereins- und Spielernamen sind Platzhalter. Hier kannst du alles umbenennen und die Farben anpassen. Gespeichert wird nur in diesem Browser.</p>
      <select id="edTeam" aria-label="Verein">${TEAMS.map(X => `<option value="${X.id}" ${X.id === tid ? 'selected' : ''}>${X.lg === 3 ? 'International' : X.lg + '. Liga'} · ${esc(X.n)}</option>`).join('')}</select>
      <h3>VEREIN</h3>
      <div class="ed"><span class="tag">NAME</span><input id="edTn" value="${esc(T.n)}" maxlength="30" aria-label="Vereinsname"><input id="edTk" value="${esc(T.k)}" maxlength="3" aria-label="Kürzel"></div>
      <div class="row"><span class="tag" style="min-width:120px">HEIMTRIKOT</span><input type="color" id="edH1" value="${T.home.c1}" aria-label="Heim Trikotfarbe"><input type="color" id="edH2" value="${T.home.c2}" aria-label="Heim Zweitfarbe"><img src="${kitIcon(T.home)}" width="32" height="32" alt="" style="image-rendering:pixelated">
        <span class="tag" style="min-width:110px;margin-left:12px">AUSWÄRTS</span><input type="color" id="edA1" value="${T.away.c1}" aria-label="Auswärts Trikotfarbe"><input type="color" id="edA2" value="${T.away.c2}" aria-label="Auswärts Zweitfarbe"><img src="${kitIcon(T.away)}" width="32" height="32" alt="" style="image-rendering:pixelated"></div>
      <h3>SCHNELLES SPIEL · STARTSIEBEN (NAME · NUMMER)</h3>
      <div class="ed">${ps.slice(0, ROLES.length).map((p, i) => row(p, 'ed' + i, ROLE_LONG[p.role])).join('')}</div>
      <h3>SCHNELLES SPIEL · ERSATZBANK</h3>
      <div class="ed">${ps.slice(ROLES.length).map((p, i) => row(p, 'ed' + (ROLES.length + i), 'Ersatz ' + ROLE_LONG[p.role])).join('')}</div>
      ${csq ? `<h3>KARRIERE · KADER (${csq.length} SPIELER)</h3><p class="muted" style="margin:0">Gilt für deine laufende Karriere, inklusive Ersatzspielern und Neuzugängen.</p>
      <div class="ed">${csq.map((p, i) => row(p, 'edC' + i, ROLE_LONG[p.role])).join('')}</div>` : ''}
      <div class="row"><button class="main" data-act="edSave">SPEICHERN</button><button data-act="edReset">ZURÜCKSETZEN</button><button data-act="main">ZURÜCK</button></div></div>`);
    menu.querySelector('#edTeam').onchange = e => ACT.editor(e.target.value);
  },
  edSave() {
    const T = TEAMS[SEL.edit], v = id => menu.querySelector(id).value;
    TEAM_EDIT[T.id] = { n: v('#edTn').trim().slice(0, 30) || undefined, k: v('#edTk').trim().slice(0, 3) || undefined, h1: v('#edH1'), h2: v('#edH2'), a1: v('#edA1'), a2: v('#edA2') };
    store.set(TEAM_KEY, TEAM_EDIT); applyTeam(T); ICONS.clear();
    const rd = id => ({ name: menu.querySelector(`#${id}N`).value.trim().slice(0, 16), num: clamp(parseInt(menu.querySelector(`#${id}Z`).value, 10) || 0, 1, 99) });
    ROSTER_EDIT[T.id] = [...ROLES, ...ROLES].map((_, i) => rd('ed' + i));
    store.set(ROSTER_KEY, ROSTER_EDIT);
    const csq = CAREER && CAREER.squads[T.id];
    if (csq) { csq.forEach((p, i) => { if (!menu.querySelector(`#edC${i}N`)) return; const e = rd('edC' + i); if (e.name) p.name = e.name; p.num = e.num; }); fixNumbers(csq); saveCareer(); } ACT.editor(SEL.edit); const h = menu.querySelector('h2'); if (h) h.textContent = 'KADER GESPEICHERT';
  },
  edReset() { const id = SEL.edit; delete ROSTER_EDIT[id]; delete TEAM_EDIT[id]; store.set(ROSTER_KEY, ROSTER_EDIT); store.set(TEAM_KEY, TEAM_EDIT); applyTeam(TEAMS[id]); ICONS.clear(); ACT.editor(id); },
};
let SEASON_PICK = false;
function startMatch(a, b, o) { AU.stopMusic(); newMatch(a, b, o); G.tact[o.human] = SEL.def; G.tact[1 - o.human] = (Math.random() * 3) | 0; hideMenu(); track('spiel-start', { modus: G.career ? 'karriere' : 'schnelles-spiel' }); }
function showTactics() {
  if (!G) return;
  showMenu(`<div class="panel narrow"><h2>TEAM-TIMEOUT · TAKTIK</h2><p class="muted">Wähle die Deckung für die nächsten Minuten.</p>
    <div class="btns menu-list">${DEF_SYS.map((d, i) => `<button class="${i === G.tact[G.human] ? 'main' : ''}" data-act="tact" data-v="${i}" ${i === G.tact[G.human] ? 'data-back' : ''}>${d.n}-DECKUNG <i>${['kompakt am Kreis', 'Spitze stört die Mitte', 'offensiv, viele Ballgewinne'][i]}</i></button>`).join('')}</div></div>`, true);
}

const allMatchPlayers = () => G.players.concat(G.bench[0].map(b => ({ ...b, team: 0 })), G.bench[1].map(b => ({ ...b, team: 1 })));
function potm() {
  const all = allMatchPlayers().filter(p => p.mins > 0 || p.goals || p.saves);
  const score = p => p.goals * 3 + p.saves * 1.6 + p.stealsN * 1.5 + (G.score[p.team] > G.score[1 - p.team] ? 2 : 0);
  return all.sort((a, b) => score(b) - score(a))[0] || allMatchPlayers()[0];   // Abpfiff ohne Einsatzminuten (nur theoretisch): irgendein Spieler
}
function endMatch() {
  const T0 = TEAMS[G.tid[0]], T1 = TEAMS[G.tid[1]], st = G.stats;
  store.del(SAVE_KEY);
  if (G.career && CAREER) careerAfterPlayed(G);
  const h = G.human, res = h < 0 ? '' : G.soWinner !== undefined ? (G.soWinner === h ? 'WEITER!' : 'AUSGESCHIEDEN') : G.score[h] > G.score[1 - h] ? 'SIEG!' : G.score[h] < G.score[1 - h] ? 'NIEDERLAGE' : 'UNENTSCHIEDEN';
  track('spiel-ende', { modus: G.career ? 'karriere' : 'schnelles-spiel', ergebnis: res ? res.replace('!', '').toLowerCase() : 'cpu' });
  const row = (l, a, b) => `<tr><td>${a}</td><td style="text-align:center">${l}</td><td>${b}</td></tr>`;
  const q = t => st.shots[t] ? Math.round(st.goals[t] / st.shots[t] * 100) + '%' : '–';
  const best = potm();
  const scorers = allMatchPlayers().filter(p => p.goals).sort((a, b) => b.goals - a.goals).slice(0, 5).map(p => `${esc(p.name)} (${TEAMS[G.tid[p.team]].k}) ${p.goals}`).join(' · ') || 'keine';
  showMenu(`<div class="panel"><div class="row spread"><h2>ABPFIFF${res ? ' · ' + res : ''}</h2><span class="tag">${esc(G.label)}</span></div>
    <p class="res">${T0.k} ${G.score[0]} : ${G.score[1]} ${T1.k}</p>${G.trophyWinner !== undefined ? `<p class="res" style="font-size:clamp(12px,2vw,18px)">🏆 ${esc(TEAMS[G.tid[G.trophyWinner]].n.toUpperCase())} GEWINNT DEN ${esc(G.event.trophy)}</p>` : ''}${G.soScore ? `<p class="muted" style="text-align:center">n. 7-Meter-Werfen ${G.soScore[0]}:${G.soScore[1]} · ${esc(TEAMS[G.tid[G.soWinner]].n)} weiter</p>` : ''}
    <div class="potm"><canvas id="potmC" width="40" height="40"></canvas><div><h3>SPIELER DES SPIELS</h3><p style="margin:4px 0;font-family:var(--pix);font-size:12px">#${best.num} ${esc(best.name.toUpperCase())}</p>
      <p class="muted">${esc(TEAMS[G.tid[best.team]].n)} · ${best.role === 'TW' ? `${best.saves} Paraden` : `${best.goals} Tore aus ${best.shots} Würfen`}${best.stealsN ? ` · ${best.stealsN} Ballgewinne` : ''}</p></div></div>
    <div class="tblwrap"><table><thead><tr><th>${T0.k}</th><th style="text-align:center">STATISTIK</th><th>${T1.k}</th></tr></thead><tbody>
    ${row('Würfe', st.shots[0], st.shots[1])}${row('Wurfquote', q(0), q(1))}${row('Paraden', st.saves[0], st.saves[1])}${row('Ballgewinne', st.steals[0], st.steals[1])}${row('7-Meter', st.seven[0], st.seven[1])}${row('Zeitstrafen', st.susp[0], st.susp[1])}</tbody></table></div>
    <p class="muted">Torschützen: ${scorers}</p>
    <div class="row"><button class="main" data-back data-act="afterMatch">${G.career ? 'WEITER ZUR KARRIERE' : 'HAUPTMENÜ'}</button>${G.career ? '' : '<button data-act="rematch">REVANCHE</button>'}</div></div>`);
  const c = menu.querySelector('#potmC'); if (c) c.getContext('2d').drawImage(portrait(best, kit(best.team)), 0, 0);
}
function togglePause() {
  if (!G || G.demo || ['fulltime', 'intro', 'timeout'].includes(G.phase)) return;
  G.paused = !G.paused; if (G.paused) ACT.pause(); else hideMenu();
}

// ================= Vor dem Spiel: Trikotwahl =================
// ---------- Vor dem Spiel: Stärkevergleich (Form, Bilanz, Sterne, Topwerfer) ----------
const PVSPR = new Map();
function bigSprite(p, K, flip) {   // Pixel-Spieler in den gewählten Trikots, für die Vorschau
  const L = lookOf({ ...p, num: p.num || 10 }, K), key = L.key + '|' + flip;
  if (!PVSPR.has(key)) PVSPR.set(key, sprite(L, 'idle', 0, flip).toDataURL());
  return PVSPR.get(key);
}
function scoutTeam(tid, o) {
  const career = !!(o.career && CAREER), T = TEAMS[tid];
  const players = career ? lineup(tid) : roster(tid), field = players.filter(p => p.role !== 'TW');
  const star = field.find(p => p.star) || field.slice().sort((a, b) => b.att - a.att)[0];
  const r = { star, rec: '', form: null, top: null };
  if (career) {
    const S = CAREER.season, lg = CAREER.lgOf[tid];
    if (lg === S.lg && S.table[tid]) { const st = standingsOf(S.table), k = st.findIndex(x => x.i === tid), t = S.table[tid]; r.rec = `PLATZ ${k + 1} · ${t.s}-${t.u}-${t.n}`; }
    else r.rec = lg === 3 ? 'INTERNATIONAL' : `${lg}. LIGA`;
    r.form = (CAREER.formAll || {})[tid] || [];
    const sc = Object.values(S.scorers).filter(x => x.tid === tid).sort((a, b) => b.n - a.n)[0];
    r.top = sc ? `${sc.name.toUpperCase()} · ${sc.n} ${sc.n === 1 ? 'TOR' : 'TORE'}` : `${star.name.toUpperCase()} · WURF ${Math.round(star.att)}`;
  } else { r.rec = lgName(T.lg); r.top = `${star.name.toUpperCase()} · WURF ${Math.round(star.att)}`; }
  return r;
}
// Sterne 1 bis 5 im Vergleich zu den Vereinen der beteiligten Ligen
function scoutStars(a, b, o) {
  const career = !!(o.career && CAREER), lgOf = t => career ? CAREER.lgOf[t] : TEAMS[t].lg, lgs = new Set([lgOf(a), lgOf(b)]);
  const pool = TEAMS.filter(t => lgs.has(lgOf(t.id))).map(t => t.id), val = id => { if (career) { const s = strength(id); return { att: s.att, def: s.def, gk: s.gk }; } const T = TEAMS[id]; return { att: T.att, def: T.def, gk: T.gk }; };
  const V = new Map(pool.map(id => [id, val(id)])); [a, b].forEach(id => { if (!V.has(id)) V.set(id, val(id)); });
  const star = (id, k) => { const xs = [...V.values()].map(v => v[k]), lo = Math.min(...xs), hi = Math.max(...xs); return clamp(1 + Math.round(4 * (V.get(id)[k] - lo) / Math.max(1, hi - lo)), 1, 5); };
  return id => ({ att: star(id, 'att'), def: star(id, 'def'), gk: star(id, 'gk') });
}
const pxStar = on => `<svg viewBox="0 0 7 7" width="12" height="12" aria-hidden="true"><path d="M3 0h1v2h3v1h-1v1h1v3h-2v-1h-3v1h-2v-3h1v-1h-1v-1h3z" fill="${on ? 'var(--gold)' : '#3a2f4d'}"/></svg>`;
const starRow = (l, n) => `<div class="pvst"><span>${l}</span><b aria-label="${n} von 5 Sternen">${[1, 2, 3, 4, 5].map(i => pxStar(i <= n)).join('')}</b></div>`;
const formBoxes = f => `<div class="pvform" aria-label="Form: ${f.join(' ') || 'noch keine Spiele'}">${[0, 1, 2, 3, 4].map(i => { const x = f[f.length - 5 + i]; return `<i class="${x === 'S' ? 'w' : x === 'U' ? 'd' : x === 'N' ? 'l' : ''}">${x || ''}</i>`; }).join('')}</div>`;
function prematch(a, b, o, back) {
  SCREEN = 'pre';
  if (a !== undefined) { const [ia, ib] = autoKits(a, b); PM = { a, b, o, ia, ib, back }; }
  const A = TEAMS[PM.a], B = TEAMS[PM.b], ka = kitSet(A)[PM.ia], kb = kitSet(B)[PM.ib], clash = colDist(ka.c1, kb.c1) < 110;
  const stars = scoutStars(PM.a, PM.b, PM.o), career = !!(PM.o.career && CAREER);
  const side = (T, key, sel, label, K) => { const sc = scoutTeam(T.id, PM.o), st = stars(T.id);
    return `<div class="tcard ${key === 'ib' ? 'b' : 'a'} active"><span class="tag">${label}</span>
    <div class="pv"><img class="pvspr" src="${bigSprite(sc.star, K, key === 'ib')}" alt="${esc(sc.star.name)} im Trikot von ${esc(T.n)}"><div class="pvinfo">
      <div class="tname">${esc(T.n)}</div><div class="pvrec">${esc(sc.rec)}</div>${sc.form ? formBoxes(sc.form) : ''}
      ${starRow('ANGRIFF', st.att)}${starRow('ABWEHR', st.def)}${starRow('TOR', st.gk)}
      <div class="pvtop">TOPWERFER: ${esc(sc.top)}</div></div></div>
    <div class="row">${kitSet(T).map((Kk, i) => `<button class="tbtn ${sel === i ? (key === 'ia' ? 'sel-a' : 'sel-b') : ''}" data-act="kitpick" data-v="${key}:${i}"><img src="${kitIcon(Kk)}" alt="">${KIT_NAMES[i]}</button>`).join('')}</div></div>`; };
  const hum = PM.o.human;
  const m = career && CAREER.season.meet ? CAREER.season.meet[PM.a < PM.b ? PM.a + '-' + PM.b : PM.b + '-' + PM.a] : null;
  const prev = m ? `<div class="pvprev">${m.comp === 'Liga' ? 'HINSPIEL' : 'LETZTES DUELL'}<b>${m.a === PM.a ? `${m.ga}:${m.gb}` : `${m.gb}:${m.ga}`}</b></div>` : '';
  showMenu(`<div class="panel"><div class="row spread"><h2>VOR DEM SPIEL</h2><span class="tag">${esc(PM.o.label || '')}</span></div>
    <div class="duel">${side(A, 'ia', PM.ia, hum === 0 ? 'HEIM · DU' : 'HEIM · CPU', ka)}<div class="vs">VS${prev}</div>${side(B, 'ib', PM.ib, hum === 1 ? 'GAST · DU' : 'GAST · CPU', kb)}</div>
    <p class="muted" style="color:${clash ? 'var(--hot)' : 'var(--dim)'}">${clash ? 'Achtung: Die Trikots sind kaum zu unterscheiden. Wähle für ein Team einen anderen Satz.' : 'Trikots gut unterscheidbar. Die Torhüter bekommen automatisch eigene Farben.'}</p>
    ${optRow('DEINE DECKUNG', DEF_SYS, 'def')}
    <div class="row"><button class="main" data-act="pmGo">ANPFIFF</button>${PM.back === 'career' ? '<button data-act="pmSim">SIMULIEREN</button>' : ''}<button data-act="pmBack">ZURÜCK</button></div></div>`);
}
// ================= Spielstand speichern & laden =================
function saveMatch() {
  if (!G || G.demo || ['intro', 'fulltime'].includes(G.phase)) return false;
  const d = { v: 2, tid: G.tid, kits: G.kits, human: G.human, diff: G.diff, halfLen: G.halfLen, career: !!G.career, ck: CAREER ? careerStamp() : '', lineups: G.lineupPids || null, label: G.label, cup: !!G.cup, euro: G.euro, event: G.event,
    score: G.score, half: G.phase === 'halftime' ? 2 : G.half, clock: G.phase === 'halftime' ? 0 : G.clock, swap: G.phase === 'halftime' ? !G.swap : G.swap,
    tact: G.tact, timeouts: G.timeouts, stats: G.stats, log: G.log, poss: G.poss, starter: G.starter,
    ps: G.players.map(p => ({ x: p.x, y: p.y, out: p.out, goals: p.goals, shots: p.shots, saves: p.saves, stealsN: p.stealsN, fouls: p.fouls, st: p.st })),
    bo: G.ball.owner ? G.players.indexOf(G.ball.owner) : -1, at: Date.now() };
  store.set(SAVE_KEY, d); return true;
}
// gespeichertes Spiel nur verwenden, wenn es vollständig ist (sonst verwerfen statt abstürzen)
function savedMatch() {
  const d = store.get(SAVE_KEY, null);
  const ok = d && Array.isArray(d.tid) && TEAMS[d.tid[0]] && TEAMS[d.tid[1]] && Array.isArray(d.score) && Array.isArray(d.ps) && d.ps.length && d.half >= 1;
  if (d && !ok) store.del(SAVE_KEY);
  return ok ? d : null;
}
function savedInfo() {
  const d = savedMatch(); if (!d) return '';
  return `${TEAMS[d.tid[0]].k} ${d.score[0]}:${d.score[1]} ${TEAMS[d.tid[1]].k} · ${d.half}. HZ`;
}
// Ein gespeichertes Karriere-Spiel zählt nur, wenn genau diese Partie noch ansteht (sonst wurde sie inzwischen simuliert und zählte doppelt)
function savedStillDue(d) {
  const same = t => !!t && t[0] === d.tid[0] && t[1] === d.tid[1];
  if (d.cup) return same(ownCupTie());
  if (d.euro) return same(ownEuroTie());
  return !ownCupTie() && !ownEuroTie() && same(ownFixture());
}
function loadMatch() {
  const d = savedMatch(); if (!d) return ACT.main();
  AU.stopMusic();
  const career = !!(d.career && CAREER && d.ck === careerStamp() && d.lineups && savedStillDue(d));
  newMatch(d.tid[0], d.tid[1], { human: d.human, halfLen: d.halfLen, diff: d.diff, career, label: d.label, kits: d.kits, cup: !!d.cup, euro: d.euro, event: d.event, lineups: career ? d.lineups.map((ids, t) => ids.map(id => findCareerPlayer(d.tid[t], id))) : null });
  Object.assign(G, { score: d.score, half: d.half, clock: d.clock, swap: d.swap, tact: d.tact, timeouts: d.timeouts, stats: d.stats, log: d.log, starter: d.starter });
  d.ps.forEach((s, i) => Object.assign(G.players[i], s));
  hideMenu(); AU.ambience(true);
  const team = d.poss >= 0 ? d.poss : 0, o = d.bo >= 0 && !G.players[d.bo].out ? G.players[d.bo] : nearestTo(team, 20, 10);
  if (o.role === 'TW') setupRestart(o.team, 0, 0, 'abwurf'); else setupRestart(o.team, o.x, o.y, 'frei', o);
  G.phaseT = 1.6; banner('WEITER GEHT\'S', '#ffc83a', `${G.half}. HALBZEIT`, 1.4, true);
}
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveMatch(); });
addEventListener('pagehide', () => saveMatch());
