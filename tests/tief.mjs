// Tiefe Tests: lange Läufe, Speichern/Laden, Zufallsklicks, viele Bildschirmgrößen, kaputte Spielstände, Tempo.
// Dauern einige Minuten. Aufruf: cd tests && npm run tief   (nur bestimmte: npm run tief -- dauerlauf monkey)
// Gleiche Optionen wie run.mjs: GAME=… (Datei oder URL, z. B. Netlify-Vorschau), CHROMIUM_PATH=…
// ALT=… (Datei oder URL): Vorversion für den Update-Test, sonst game/index.html aus origin/main (git)
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAME = /^https?:\/\//.test(process.env.GAME || '') ? process.env.GAME : pathToFileURL(process.env.GAME || path.join(root, 'game/index.html')).href;
const exe = process.env.CHROMIUM_PATH || ['/opt/pw-browsers/chromium'].find(existsSync);
const only = process.argv.slice(2).map(s => s.toLowerCase());
const DESKTOP = { viewport: { width: 1440, height: 900 } };
const MOBILE = { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 };

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
class Fail extends Error {}
const ok = (cond, msg) => { if (!cond) throw new Fail(msg); };

let browser;
async function open(opts = DESKTOP, seed) {
  const ctx = await browser.newContext(opts);
  if (seed) await ctx.addInitScript(s => { let x = s; Math.random = () => (x = (x * 16807) % 2147483647) / 2147483647; }, seed);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(GAME); await page.waitForTimeout(600);
  return { page, ctx, errors };
}
// Unterschiede zweier Spielstände: geänderte oder verschwundene Werte (neu angelegte Felder mit Standardwerten zählen nicht)
function diffLost(x, y, p = 'CAREER', out = []) {
  if (out.length > 5) return out;
  if (x === undefined) return out;
  if (x === null || typeof x !== 'object' || y === null || typeof y !== 'object') { if (JSON.stringify(x) !== JSON.stringify(y)) out.push(`${p}: ${JSON.stringify(x)?.slice(0, 60)} → ${JSON.stringify(y)?.slice(0, 60)}`); return out; }
  for (const k of Object.keys(x)) diffLost(x[k], y[k], `${p}.${k}`, out);
  return out;
}
const STEP = `window.__run = n => { for (let i = 0; i < n; i++) { readInput(1 / 60); step(1 / 60); } };`;

// Prüft den ganzen Karriere-Spielstand auf Widersprüche. Gibt eine Liste von Problemen zurück (leer = alles stimmt).
const INV = `window.__inv = (wo) => {
  const bad = [], add = t => bad.length < 12 && bad.push(wo + ': ' + t), num = v => typeof v === 'number' && isFinite(v);
  const pids = new Map();
  for (const t of TEAMS) {
    const sq = CAREER.squads[t.id];
    if (!sq || sq.length < 10 || sq.length > 20) { add(t.k + ' Kadergröße ' + (sq && sq.length)); continue; }
    for (const r of ROLES) if (!sq.some(p => p.role === r)) add(t.k + ' ohne ' + r);
    const nums = new Set();
    for (const p of sq) {
      if (pids.has(p.pid)) add('Spieler doppelt: ' + p.name + ' (' + t.k + ' und ' + pids.get(p.pid) + ')'); pids.set(p.pid, t.k);
      for (const k of ['att', 'pas', 'def', 'spd', 'gk', 'sta', 'fit', 'form', 'age', 'sal', 'vt', 'num']) if (!num(p[k])) { add(t.k + ' ' + p.name + ' ' + k + '=' + p[k]); break; }
      if (!num(potOf(p))) add(t.k + ' ' + p.name + ' Potenzial ' + potOf(p));
      if (p.fit < 0 || p.fit > 100) add(t.k + ' ' + p.name + ' Fitness ' + p.fit);
      if (p.form < -3 || p.form > 3) add(t.k + ' ' + p.name + ' Form ' + p.form);
      if (p.age < 15 || p.age > 45) add(t.k + ' ' + p.name + ' Alter ' + p.age);
      if (nums.has(p.num)) add(t.k + ' Rückennummer doppelt ' + p.num); nums.add(p.num);
      for (const w of ['s', 'k']) { const x = statOf(p, w); if (x.g > x.sh || x.g7 > x.s7 || x.g7 > x.g || x.fb > x.g || x.sv7 > x.f7 || STK.some(k => !isFinite(x[k]) || x[k] < 0)) { add(t.k + ' ' + p.name + ' Statistik ' + w + ' ' + JSON.stringify(x)); break; } }
    }
  }
  for (const p of CAREER.free || []) if (pids.has(p.pid)) add('Spieler zugleich vereinslos und im Kader: ' + p.name);
  const L = lineup(CAREER.team);
  if (L.length !== 7 || new Set(L.map(p => p.pid)).size !== 7 || ROLES.some(r => !L.some(p => p.role === r))) add('eigene Aufstellung unvollständig');
  if (!num(CAREER.money)) add('Kontostand ' + CAREER.money);
  for (const t of TEAMS) if (!num(CAREER.aiMoney[t.id])) add(t.k + ' CPU-Geld ' + CAREER.aiMoney[t.id]);
  const S = CAREER.season, T = Object.values(S.table), sum = k => T.reduce((a, r) => a + r[k], 0);
  if (sum('s') !== sum('n')) add('Tabelle: Siege ' + sum('s') + ' ≠ Niederlagen ' + sum('n'));
  if (sum('tp') !== sum('tm')) add('Tabelle: Tore ' + sum('tp') + ' ≠ Gegentore ' + sum('tm'));
  if (new Set(T.map(r => r.sp)).size > 1) add('Tabelle: ungleiche Spielzahl ' + [...new Set(T.map(r => r.sp))]);
  if (T.some(r => r.s + r.u + r.n !== r.sp)) add('Tabelle: S+U+N ≠ Spiele');
  if (Object.keys(S.table).some(id => CAREER.lgOf[id] !== S.lg)) add('Tabelle enthält Verein aus anderer Liga');
  if (TEAMS.filter(t => CAREER.lgOf[t.id] === S.lg).length !== T.length) add('Liga und Tabelle verschieden groß');
  if (!S.table[CAREER.team]) add('eigener Verein fehlt in der Tabelle');
  if ((CAREER.news || []).length > 14) add('Zeitung zu lang ' + CAREER.news.length);
  return bad;
};`;

// ---------------------------------------------------------------- Dauerlauf
test('Dauerlauf: 3 Karrieren × 6 Saisons mit Transfers, Auf- und Abstieg, Entlassung; nach jedem Spieltag alles stimmig, Speichern und Laden verlustfrei', async () => {
  const runs = [['KIE', 1, 11], ['WET', 1, 12], ['DRE', 2, 13]];   // Spitzenteam, Abstiegskandidat, Zweitligist; Saisonlänge 17 bzw. 34
  for (const [k, len, seed] of runs) {
    const { page, ctx, errors } = await open(DESKTOP, seed);
    await page.evaluate(INV); await page.evaluate(([k, len]) => careerCreate(TEAM_BASE.findIndex(b => b[0] === k), len, 1, 1, true, 0), [k, len]);
    const counts0 = await page.evaluate(() => [1, 2, 3].map(l => TEAMS.filter(t => CAREER.lgOf[t.id] === l).length));
    const log = [];
    for (let s = 0; s < 6; s++) {
      const r = await page.evaluate(() => {
        const bad = []; let g = 0;
        while ((!CAREER.season.done || cupDue() || euroDue()) && g++ < 300) { ACT.cSim(); bad.push(...__inv('Spieltag ' + CAREER.season.round)); if (bad.length) break; }
        if (bad.length || g >= 300) return { bad: bad.length ? bad : ['Saison endet nicht'] };
        ACT.cEnd(); const sm = CAREER.summary, info = { year: CAREER.year, team: TEAMS[CAREER.team].k, lg: sm.lg, pos: sm.pos, fired: !!(sm.board && sm.board.fired), money: Math.round(CAREER.money / 1000) };
        if (info.fired) { const o = [...menu.querySelectorAll('[data-act="cJob"]')].map(b => +b.dataset.v); if (!o.length) return { bad: ['entlassen ohne Jobangebot'] }; ACT.cJob(o[0]); }
        else ACT.cNext();
        const after = __inv('neue Saison');
        return { bad: after, info, counts: [1, 2, 3].map(l => TEAMS.filter(t => CAREER.lgOf[t.id] === l).length), hist: CAREER.history.length, size: JSON.stringify(CAREER).length };
      });
      ok(!r.bad.length, `${k} Saison ${s + 1}: ${r.bad.join(' | ')}`);
      ok(r.counts.join() === counts0.join(), `${k}: Ligagrößen ändern sich ${counts0} → ${r.counts}`);
      ok(r.hist === s + 1, `${k}: Historie hat ${r.hist} statt ${s + 1} Einträge`);
      log.push(`${r.info.year} ${r.info.team} ${r.info.lg}.L Platz ${r.info.pos}${r.info.fired ? ' entlassen' : ''} ${r.info.money}k ${Math.round(r.size / 1024)}KB`);
      // Speichern, neu laden: der Spielstand muss danach genau gleich sein
      const before = await page.evaluate(() => { saveCareer(); return JSON.stringify(CAREER); });
      await page.reload(); await page.waitForTimeout(400); await page.evaluate(INV);
      const after = await page.evaluate(() => JSON.stringify(CAREER));
      const lost = diffLost(JSON.parse(before), JSON.parse(after));
      ok(!lost.length, `${k} Saison ${s + 1}: Spielstand nach Neuladen verändert: ${lost.join(' | ')}`);
      ok(r.size < 1.5e6, `${k}: Spielstand wird zu groß (${Math.round(r.size / 1024)} KB)`);
    }
    console.log(`      ${k}: ${log.join(' · ')}`);
    ok(!errors.length, errors.join('; ')); await ctx.close();
  }
});

// ---------------------------------------------------------------- Laufendes Spiel speichern
// bis zur Mitte der 1. Halbzeit spielen, speichern, Seite neu laden, fortsetzen, zu Ende spielen
const toMid = `G.paused = true; G.introT = 99; { let n = 0; while (!(G.half === 1 && G.clock > G.halfLen * 0.5 && G.phase === 'play') && n++ < 60000) __run(1); }`;
const toEnd = `G.paused = true; G.introT = 99; { let n = 0; while (G.phase !== 'fulltime' && n++ < 120000) { if (G.phase === 'penalty' && G.pen && G.human === G.pen.shooter.team && G.phaseT <= 0) { shoot(G.pen.shooter, 0.5, 0.8); G.phase = 'play'; } __run(1); } } G.paused = false;`;
test('Speichern im Spiel: Schnelles Spiel und Karriere-Spiel nach Neuladen fortsetzen, Ergebnis zählt genau einmal', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 7);
  // Schnelles Spiel
  await page.evaluate(STEP); await page.evaluate(`hideMenu(); startMatch(2, 5, { human: 0, halfLen: 120 }); ${toMid}`);
  const q0 = await page.evaluate(() => { const r = { score: [...G.score], half: G.half, clock: Math.round(G.clock) }; ACT.saveQuit(); return r; });
  await page.reload(); await page.waitForTimeout(500); await page.evaluate(STEP);
  const q1 = await page.evaluate(() => { const info = savedInfo(); ACT.load(); return { info, score: [...G.score], half: G.half, clock: Math.round(G.clock), menuHidden: menu.hidden }; });
  await page.evaluate(toEnd); await page.waitForSelector('#menu button[data-act="afterMatch"], #menu button[data-act="rematch"]', { timeout: 15000 });
  const qEnd = await page.evaluate(() => ({ saved: !!store.get(SAVE_KEY, null) }));
  ok(q1.info && q1.score.join() === q0.score.join() && q1.half === q0.half && q1.clock === q0.clock && q1.menuHidden, 'Schnelles Spiel fortsetzen: ' + JSON.stringify({ q0, q1 }));
  ok(!qEnd.saved, 'Nach Abpfiff ist der Spielstand noch gespeichert');
  // Karriere-Ligaspiel
  await page.evaluate(() => { careerCreate(TEAM_BASE.findIndex(b => b[0] === 'MEL'), 1, 1, 1); for (let i = 0; i < 3 || cupDue() || euroDue(); i++) ACT.cSim(); careerHub('home'); ACT.cPlay(); ACT.pmGo(); });
  await page.evaluate(toMid);
  const c0 = await page.evaluate(() => { const r = { round: CAREER.season.round, sp: CAREER.season.table[CAREER.team].sp, score: [...G.score] }; ACT.saveQuit(); return r; });
  await page.reload(); await page.waitForTimeout(500); await page.evaluate(STEP);
  const c1 = await page.evaluate(() => { ACT.load(); return { career: !!G.career, score: [...G.score] }; });
  await page.evaluate(toEnd); await page.waitForSelector('#menu button[data-act="afterMatch"]', { timeout: 15000 }); await page.click('#menu button[data-act="afterMatch"]');
  const c2 = await page.evaluate(() => ({ round: CAREER.season.round, sp: CAREER.season.table[CAREER.team].sp, saved: !!store.get(SAVE_KEY, null) }));
  ok(c1.career && c1.score.join() === c0.score.join(), 'Karriere-Spiel fortsetzen: ' + JSON.stringify({ c0, c1 }));
  ok(c2.round === c0.round + 1 && c2.sp === c0.sp + 1 && !c2.saved, 'Karriere-Ergebnis: ' + JSON.stringify({ c0, c2 }));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Speichern im Spiel: gespeichertes Pokal-, Europa- oder Ligaspiel, das inzwischen simuliert wurde, zählt nicht doppelt', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 9);
  await page.evaluate(STEP);
  const out = {};
  for (const kind of ['Liga', 'Pokal', 'Europapokal']) {
    // bis das passende eigene Spiel ansteht
    const ready = await page.evaluate(kind => {
      if (!CAREER || kind === 'Liga') careerCreate(TEAM_BASE.findIndex(b => b[0] === 'BER'), 1, 1, 1);
      let g = 0; const due = () => kind === 'Pokal' ? !!ownCupTie() : kind === 'Europapokal' ? !!ownEuroTie() : !ownCupTie() && !ownEuroTie() && !!ownFixture();
      while (!due() && !CAREER.season.done && g++ < 60) ACT.cSim();
      if (!due()) return false;
      careerHub('home'); ACT.cPlay(); ACT.pmGo(); return true;
    }, kind);
    if (!ready) { out[kind] = 'kommt nicht vor'; continue; }
    await page.evaluate(toMid);
    const st = () => JSON.stringify({ r: CAREER.season.round, cup: CAREER.cup && [CAREER.cup.round, (CAREER.cup.rows || []).length, CAREER.cup.winner], eu: CAREER.euro && [CAREER.euro.round, JSON.stringify(CAREER.euro).length], sp: CAREER.season.table[CAREER.team].sp });
    // speichern, aufhören, dasselbe Spiel in der Karriere simulieren, dann den alten Spielstand laden und zu Ende spielen
    const r = await page.evaluate(st => { ACT.saveQuit(); careerHub('home'); ACT.cSim(); const afterSim = eval('(' + st + ')')(); ACT.load(); return { afterSim, career: !!G.career }; }, st.toString());
    await page.evaluate(toEnd); await page.waitForTimeout(3600);
    const end = await page.evaluate(st => { if (G && G.career) { endMatch(); } const s = eval('(' + st + ')')(); ACT.afterMatch(); return s; }, st.toString());
    out[kind] = { geladenAlsKarriere: r.career, gleich: r.afterSim === end };
    if (kind === 'Pokal') await page.evaluate(() => { let g = 0; while ((!CAREER.season.done || cupDue() || euroDue()) && g++ < 100) ACT.cSim(); ACT.cEnd(); ACT.cNext(); });   // neue Saison für den Europapokal
  }
  ok(Object.values(out).every(v => v === 'kommt nicht vor' || (!v.geladenAlsKarriere && v.gleich)), 'Doppelt gezählt: ' + JSON.stringify(out));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

// ---------------------------------------------------------------- Zufallsklicks
// Klickt zufällig durch alle Menüs (Desktop und Handy). Im Spiel laufen ein paar Sekunden mit Zufallstasten, manchmal wird vorgespult oder pausiert.
async function monkey(opts, seed, steps, touch) {
  const { page, ctx, errors } = await open(opts, seed);
  await page.evaluate(STEP); if (touch) await page.evaluate(() => document.body.classList.add('touch', 'portraitok'));
  let x = seed * 7919; const rnd = () => (x = (x * 48271) % 2147483647) / 2147483647;
  const trail = []; let stuck = 0, games = 0, clicks = 0;
  for (let i = 0; i < steps && !errors.length; i++) {
    const st = await page.evaluate(() => ({ menu: !menu.hidden, g: !!G && !G.demo, n: [...menu.querySelectorAll('button:not([disabled]), select, input')].filter(e => e.offsetParent).length }));
    if (st.menu) {
      if (!st.n) { if (++stuck > 3) throw new Fail(`Menü ohne Knöpfe nach: ${trail.slice(-6).join(' → ')}`); await page.waitForTimeout(300); continue; }
      stuck = 0;
      const pick = rnd();
      const what = await page.evaluate(pick => {
        const els = [...menu.querySelectorAll('button:not([disabled]), select, input')].filter(e => e.offsetParent), main = els.filter(e => e.classList.contains('main'));
        const el = main.length && pick < 0.35 ? main[Math.floor(pick / 0.35 * main.length)] : els[Math.floor(pick * els.length)];   /* Hauptknöpfe öfter, damit auch gespielt wird */
        const label = (el.dataset.act || el.tagName.toLowerCase()) + (el.dataset.v !== undefined ? ':' + el.dataset.v : '');
        if (el.tagName === 'SELECT') { el.selectedIndex = Math.floor(pick * 997) % el.options.length; el.dispatchEvent(new Event('change', { bubbles: true })); }
        else if (el.tagName === 'INPUT' && el.type !== 'range' && el.type !== 'checkbox') { el.value = ['Müller', 'X', '99', 'Ćorluka-Nießen', ''][Math.floor(pick * 5)]; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
        else el.click();
        return label;
      }, pick);
      trail.push(what); clicks++;
    } else if (st.g) {
      games++;
      const r = rnd();
      await page.evaluate(([r, seed]) => {
        const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft'];
        if (r < 0.3 && G.phase === 'play') G.clock = Math.max(G.clock, G.halfLen - 2);   // vorspulen
        G.paused = true; for (let n = 0; n < 240 && menu.hidden; n++) { if (n % 6 === 0) for (const k of keys) if (Math.random() < 0.08) { KEY[k] = !KEY[k]; if (KEY[k]) KEYP[k] = true; } __run(1); }
        for (const k of keys) KEY[k] = false; G.paused = false;
      }, [r, seed]);
      if (r > 0.85) await page.keyboard.press('Escape');
      trail.push('spiel');
    } else { trail.push('warte'); await page.waitForTimeout(200); }
  }
  await ctx.close();
  return { errors, trail, clicks, games };
}
test('Zufallsklicks: 3 × 350 Schritte durch alle Menüs und Spiele (Desktop, Handy quer, Handy hoch) ohne Fehler und ohne Sackgasse', async () => {
  const res = [];
  for (const [opts, seed, touch] of [[DESKTOP, 101, false], [MOBILE, 202, true], [{ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, 303, true]]) {
    const r = await monkey(opts, seed, 350, touch);
    ok(!r.errors.length, `Fehler: ${r.errors[0]}\n      zuletzt: ${r.trail.slice(-10).join(' → ')}`);
    res.push(`${r.clicks} Klicks, ${r.games} Spielabschnitte`);
  }
  console.log('      ' + res.join(' · '));
});

// ---------------------------------------------------------------- Bildschirmgrößen
const VIEWS = [[320, 568], [360, 640], [390, 844], [414, 896], [568, 320], [667, 375], [844, 390], [932, 430], [1024, 768], [1280, 720], [1920, 1080]];
test('Bildschirmgrößen: 11 Geräte von 320 px bis Full HD, alle Menüs, Karriere-Tabs, Saisonabschluss, Teilen, Pause und Spielende ohne Überstand', async () => {
  const bad = [];
  for (const [w, h] of VIEWS) {
    const mob = w < 1000, { page, ctx, errors } = await open({ viewport: { width: w, height: h }, ...(mob ? { hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : {}) }, 5);
    await page.evaluate(STEP); const r = await page.evaluate(async mob => {
      if (mob) document.body.classList.add('touch', 'portraitok');
      const out = [], check = name => {
        if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`${name}: Seite ${document.documentElement.scrollWidth - innerWidth}px zu breit`);
        const panel = menu.querySelector('.panel'); if (!panel || menu.hidden) return; const pr = panel.getBoundingClientRect();
        if (pr.right > innerWidth + 1 || pr.left < -1) out.push(`${name}: Fenster ragt aus dem Bildschirm`);
        for (const el of menu.querySelectorAll('.panel *')) { const q = el.getBoundingClientRect(); if (q.width && q.right > pr.right + 1 && !el.closest('.ctabs, .bracket, .tblwrap')) { out.push(`${name}: ${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''} +${Math.round(q.right - pr.right)}px`); break; } }
      };
      ACT.title(); check('Titel'); ACT.main(); check('Hauptmenü'); ACT.quick(); check('Schnelles Spiel'); ACT.lg(3); check('Europa-Auswahl'); ACT.lg(1);
      ACT.kick(); check('Vor dem Spiel'); ACT.options(); check('Optionen'); ACT.help(); check('Hilfe'); ACT.editor(); check('Editor');
      careerCreate(TEAM_BASE.findIndex(b => b[0] === 'KIE'), 1, 1, 1, true, 3);
      let g = 0; while ((!CAREER.season.done || cupDue() || euroDue()) && g++ < 100) ACT.cSim();
      ACT.cEnd(); check('Saisonabschluss'); await shareCard('season'); check('Teilen'); ACT.cShareBack(); ACT.cNext();
      for (let i = 0; i < 9; i++) ACT.cSim();
      for (const t of ['home', 'squad', 'train', 'market', 'table', 'cup', 'euro', 'stats', 'trophy', 'hist']) { ACT.cTab(t); check('Karriere ' + t); }
      ACT.cPick(CAREER.squads[CAREER.team][0].pid); check('Spielerprofil'); careerHub('home'); ACT.cPlay(); check('Vor dem Karriere-Spiel');
      ACT.pmGo(); G.introT = 99; ACT.pause(); check('Pause'); ACT.subs(); check('Wechsel'); ACT.resume();
      __run(400); endMatch(); check('Spielende');
      return out;
    }, mob);
    bad.push(...r.map(x => `${w}×${h} ${x}`), ...errors.map(e => `${w}×${h} Fehler ${e}`));
    await ctx.close();
  }
  ok(!bad.length, bad.slice(0, 12).join('\n      '));
});

// ---------------------------------------------------------------- Kaputte und fremde Spielstände
test('Kaputte Spielstände: Spiel startet trotzdem, Menü und neue Karriere funktionieren', async () => {
  const cases = [
    ['hl3_karriere', '{kaputt'], ['hl3_karriere', '[]'], ['hl3_karriere', '"text"'], ['hl3_karriere', '{"v":1}'], ['hl3_karriere', '{"team":3,"squads":{}}'],
    ['hl3_spielstand', '{kaputt'], ['hl3_spielstand', '{"v":2,"tid":[999,1],"score":[1,2],"half":1}'], ['hl3_spielstand', '{"v":2,"tid":[0,1]}'],
    ['hl4_settings', '{kaputt'], ['hl4_settings', '"x"'], ['hl4_touchtip', 'abc'],
  ];
  const bad = [];
  for (const [k, v] of cases) {
    const { page, ctx, errors } = await open(DESKTOP, 3);
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [k, v]); await page.reload(); await page.waitForTimeout(500);
    const r = await page.evaluate(() => { try { ACT.main(); const btn = [...menu.querySelectorAll('button')].map(b => b.dataset.act); if (btn.includes('load')) ACT.load(); if (G && !G.demo) { G = null; } ACT.main(); ACT.career(); careerCreate(3, 0, 1, 1); ACT.cSim(); return { ok: CAREER.season.round === 1 }; } catch (e) { return { err: e.message }; } });
    if (r.err || !r.ok || errors.length) bad.push(`${k}=${v}: ${r.err || errors[0] || 'Karriere startet nicht'}`);
    await ctx.close();
  }
  ok(!bad.length, bad.join('\n      '));
});

// ---------------------------------------------------------------- Karriere-Spiele wirklich gespielt
test('Kurze Saison komplett selbst gespielt (Zufallseingaben): Ergebnisse, Tabelle, Torjäger und Pokal stimmen mit dem Spiel überein', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 44);
  await page.evaluate(STEP); await page.evaluate(INV);
  await page.evaluate(() => careerCreate(TEAM_BASE.findIndex(b => b[0] === 'GUM'), 0, 1, 1));
  const log = [];
  for (let i = 0; i < 20; i++) {
    const kind = await page.evaluate(() => { if (CAREER.season.done && !cupDue() && !euroDue()) return null; careerHub('home'); ACT.cPlay(); const k = PM.o.cup ? 'Pokal' : PM.o.euro ? 'Europa' : 'Liga'; ACT.pmGo(); return k; });
    if (!kind) break;
    const r = await page.evaluate(kind => {
      const S = CAREER.season, me = CAREER.team, sp0 = S.table[me].sp, goals0 = Object.values(S.scorers).filter(x => x.tid === me).reduce((a, x) => a + x.n, 0), tp0 = S.table[me].tp;
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'];
      G.paused = true; G.introT = 99; let n = 0;
      while (G.phase !== 'fulltime' && n++ < 150000) { if (n % 6 === 0) for (const k of keys) if (Math.random() < 0.08) { KEY[k] = !KEY[k]; if (KEY[k]) KEYP[k] = true; } if (!menu.hidden) hideMenu(); __run(1); }
      for (const k of keys) KEY[k] = false;
      const h = G.human, my = G.score[h], th = G.score[1 - h], so = G.soWinner; endMatch();
      const goals1 = Object.values(S.scorers).filter(x => x.tid === me).reduce((a, x) => a + x.n, 0);
      const res = { kind, my, th, so, frames: n };
      if (kind === 'Liga') res.ok = S.table[me].sp === sp0 + 1 && S.table[me].tp === tp0 + my && goals1 - goals0 === my && CAREER.lastMatch.my === my && CAREER.lastMatch.their === th;
      else res.ok = true;
      res.inv = __inv(kind); ACT.afterMatch(); return res;
    }, kind);
    log.push(`${r.kind} ${r.my}:${r.th}${r.so !== undefined ? ' n.7m' : ''}`);
    ok(r.frames < 150000, `${kind}: Spiel endet nicht`); ok(r.ok, `${kind} ${r.my}:${r.th}: Ergebnis falsch übernommen`); ok(!r.inv.length, r.inv.join(' | '));
  }
  console.log('      ' + log.join(' · '));
  ok(log.length >= 6, 'zu wenige Spiele: ' + log.length);
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

// ---------------------------------------------------------------- Tempo
test('Tempo: Spielschritt und Zeichnen bleiben flott (Desktop und breites Handy)', async () => {
  const res = [];
  for (const [opts, name] of [[DESKTOP, 'Desktop'], [{ viewport: { width: 932, height: 430 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 }, 'Handy']]) {
    const { page, ctx, errors } = await open(opts, 8);
    // getImageData zwingt die Leinwand, jedes Bild sofort fertig zu zeichnen: so zählt die echte Arbeit pro Bild (sonst sammelt der Browser mehrere Bilder)
    const r = await page.evaluate(STEP + `(() => { hideMenu(); newMatch(2, 5, { human: 0, halfLen: 180 }); G.paused = true; G.introT = 99;
      for (let i = 0; i < 300; i++) { __run(1); render(); ctx.getImageData(0, 0, 1, 1); }
      const t = [], d = []; for (let i = 0; i < 1200; i++) { let a = performance.now(); __run(1); t.push(performance.now() - a); a = performance.now(); render(); ctx.getImageData(0, 0, 1, 1); d.push(performance.now() - a); }
      const q = (x, p) => x.slice().sort((a, b) => a - b)[Math.floor(x.length * p)];
      return { step: q(t, 0.5), step99: q(t, 0.99), draw: q(d, 0.5), draw99: q(d, 0.99) }; })()`);
    res.push(`${name}: Schritt ${r.step.toFixed(2)} ms (99 %: ${r.step99.toFixed(2)}), Zeichnen ${r.draw.toFixed(2)} ms (99 %: ${r.draw99.toFixed(2)})`);
    ok(r.step + r.draw < 8 && r.step99 + r.draw99 < 14, `${name} zu langsam (Budget 16,7 ms je Bild): ${JSON.stringify(r)}`); ok(!errors.length, errors.join('; ')); await ctx.close();
  }
  console.log('      ' + res.join('\n      '));
});

// ---------------------------------------------------------------- Update von der Vorversion
// Spielstände entstehen in der Vorversion und werden in der neuen Version weitergespielt, so wie bei Spielern nach einem Deploy.
// Vorversion: ALT=Datei oder URL, sonst game/index.html aus origin/main. Der Speicher wird von Seite zu Seite übertragen, daher
// dürfen beide Versionen auf verschiedenen Adressen liegen (zum Beispiel live und Netlify-Vorschau).
function vorversion() {
  if (process.env.ALT) return /^https?:\/\//.test(process.env.ALT) ? process.env.ALT : pathToFileURL(path.resolve(process.env.ALT)).href;
  try {
    const html = execSync('git show origin/main:game/index.html', { cwd: root, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const dir = path.join(root, 'tests', '.vorversion'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'index.html'), html);
    return pathToFileURL(path.join(dir, 'index.html')).href;
  } catch (e) { return null; }
}
// Ohne Eingaben wartet ein eigener 7-Meter auf den Wurf: den nimmt der Test ab, sonst hängt die Partie je nach Spielverlauf
const toMidS = `G.paused = true; G.introT = 99; { let n = 0; while (!(G.half === 1 && G.clock > G.halfLen * 0.5 && G.phase === 'play') && n++ < 60000) { if (G.phase === 'penalty' && G.pen && G.human === G.pen.shooter.team && G.phaseT <= 0) { shoot(G.pen.shooter, 0.5, 0.8); G.phase = 'play'; } __run(1); } }`;
const toEndS = `G.paused = true; G.introT = 99; { let n = 0; while (G.phase !== 'fulltime' && n++ < 120000) { if (G.phase === 'penalty' && G.pen && G.human === G.pen.shooter.team && G.phaseT <= 0) { shoot(G.pen.shooter, 0.5, 0.8); G.phase = 'play'; } __run(1); } } G.paused = false;`;
// eine Partie: Spielstand in der Vorversion anlegen (prep), Speicher in die neue Version übertragen, dort weiter (check)
async function update(ALT, seed, prep, check) {
  const a = await open(DESKTOP, seed); await a.page.goto(ALT); await a.page.waitForTimeout(600); await a.page.evaluate(STEP);
  const before = await prep(a.page);
  const data = await a.page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
  const oldErr = a.errors.slice(); await a.ctx.close();
  const n = await open(DESKTOP, seed + 1);
  await n.page.evaluate(d => { localStorage.clear(); for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v); }, data);
  await n.page.reload(); await n.page.waitForTimeout(600); await n.page.evaluate(STEP); await n.page.evaluate(INV);
  const r = await check(n.page, before);
  const errs = oldErr.map(e => 'Vorversion: ' + e).concat(n.errors); await n.ctx.close();
  return { r, errs };
}
test('Update von der Vorversion: laufendes Spiel, simuliertes Pokalspiel, Karriere und Einstellungen gehen nach dem Deploy weiter', async () => {
  const ALT = vorversion(); if (!ALT) { console.log('      übersprungen: keine Vorversion (kein git, ALT nicht gesetzt)'); return; }
  console.log('      Vorversion: ' + ALT.replace(pathToFileURL(root).href, '.'));
  // A: Ligaspiel mittendrin gespeichert → in der neuen Version fortsetzen, zählt genau einmal
  const A = await update(ALT, 21, async p => {
    await p.evaluate(() => { careerCreate(TEAM_BASE.findIndex(b => b[0] === 'HAN'), 1, 1, 1); for (let i = 0; i < 3 || cupDue() || euroDue(); i++) ACT.cSim(); careerHub('home'); ACT.cPlay(); ACT.pmGo(); });
    await p.evaluate(toMidS); return p.evaluate(() => { const r = { round: CAREER.season.round, sp: CAREER.season.table[CAREER.team].sp, score: G.score.join(':') }; ACT.saveQuit(); return r; });
  }, async (p, b) => {
    const s1 = await p.evaluate(() => { ACT.main(); const btn = menu.querySelector('[data-act="load"]'); const t = btn && btn.innerText.replace(/\s+/g, ' '); ACT.load(); return { btn: t, career: !!G.career, score: G.score.join(':') }; });
    await p.evaluate(toEndS); await p.waitForSelector('#menu button[data-act="afterMatch"]', { timeout: 15000 }); await p.click('#menu button[data-act="afterMatch"]');
    const s2 = await p.evaluate(() => ({ round: CAREER.season.round, sp: CAREER.season.table[CAREER.team].sp, saved: !!localStorage.getItem('hl3_spielstand'), inv: __inv('nach dem Spiel') }));
    return { ok: !!s1.btn && s1.career && s1.score === b.score && s2.round === b.round + 1 && s2.sp === b.sp + 1 && !s2.saved && !s2.inv.length, b, s1, s2 };
  });
  // B: Pokalspiel gespeichert, nach dem Update erst simuliert, dann geladen → Freundschaftsspiel, Pokal unverändert
  const B = await update(ALT, 9, async p => {
    const ok = await p.evaluate(() => { careerCreate(TEAM_BASE.findIndex(b => b[0] === 'BER'), 1, 1, 1); let g = 0; while (!ownCupTie() && g++ < 40) ACT.cSim(); if (!ownCupTie()) return false; careerHub('home'); ACT.cPlay(); ACT.pmGo(); return true; });
    if (ok) { await p.evaluate(toMidS); await p.evaluate(() => ACT.saveQuit()); } return ok;
  }, async (p, ok) => {
    if (!ok) return { ok: false, grund: 'kein Pokalspiel erreicht' };
    const r = await p.evaluate(() => { careerHub('home'); ACT.cSim(); const cup = JSON.stringify(CAREER.cup); ACT.load(); return { career: !!G.career, cup }; });
    await p.evaluate(toEndS); await p.waitForTimeout(3600);
    const after = await p.evaluate(() => JSON.stringify(CAREER.cup));
    return { ok: !r.career && after === r.cup, career: r.career, gleich: after === r.cup };
  });
  // C: Karriere über 2 Saisons mit Rekorden, Titeln und Editor-Änderung → alles da, 10 weitere Spieltage stimmig
  const C = await update(ALT, 4, async p => p.evaluate(() => {
    localStorage.setItem('hl4_settings', JSON.stringify({ speed: 2 }));
    careerCreate(TEAM_BASE.findIndex(b => b[0] === 'KIE'), 1, 1, 1, true, 1);
    for (let s = 0; s < 2; s++) { let g = 0; while ((!CAREER.season.done || cupDue() || euroDue()) && g++ < 100) ACT.cSim(); ACT.cEnd(); if (CAREER.summary.board.fired) { const o = [...menu.querySelectorAll('[data-act="cJob"]')]; ACT.cJob(+o[0].dataset.v); } else ACT.cNext(); }
    saveCareer();
    const sq = TEAMS.flatMap(t => CAREER.squads[t.id].map(p => p.pid)).sort((a, b) => a - b).join();
    return { team: CAREER.team, year: CAREER.year, money: CAREER.money, hist: JSON.stringify(CAREER.history), titles: JSON.stringify(CAREER.titles || []), rec: JSON.stringify(CAREER.rec || {}), sq };
  }), async (p, b) => p.evaluate(b => {
    const sq = TEAMS.flatMap(t => CAREER.squads[t.id].map(p => p.pid)).sort((a, b) => a - b).join();
    const now = { team: CAREER.team === b.team, year: CAREER.year === b.year, money: CAREER.money === b.money, hist: JSON.stringify(CAREER.history) === b.hist, titles: JSON.stringify(CAREER.titles || []) === b.titles, rec: JSON.stringify(CAREER.rec || {}) === b.rec, kader: sq === b.sq, tempo: SETTINGS.speed === 2, defekt: !localStorage.getItem('hl3_karriere_defekt') };
    const bad = []; for (let i = 0; i < 10; i++) { ACT.cSim(); bad.push(...__inv('Spieltag nach Update')); }
    return { ok: Object.values(now).every(Boolean) && !bad.length, now, bad: bad.slice(0, 3) };
  }, b));
  for (const [n, x] of [['A laufendes Ligaspiel', A], ['B simuliertes Pokalspiel', B], ['C Karriere und Einstellungen', C]]) {
    ok(x.r.ok, `${n}: ${JSON.stringify(x.r)}`); ok(!x.errs.length, `${n}: ${x.errs.join('; ')}`);
  }
});

// ---------------------------------------------------------------- Main
(async () => {
  browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const list = tests.filter(t => !only.length || only.some(w => t.name.toLowerCase().includes(w)));
  console.log(`Spiel: ${GAME}\n${list.length} tiefe Tests\n`);
  let pass = 0;
  for (const t of list) {
    const t0 = Date.now();
    try { await t.fn(); pass++; console.log(`  ✓ ${t.name} (${((Date.now() - t0) / 1000).toFixed(1)} s)`); }
    catch (e) { console.log(`  ✗ ${t.name}\n      ${e instanceof Fail ? e.message : e.stack}`); }
  }
  console.log(`\n${pass} von ${list.length} bestanden`);
  await browser.close(); process.exit(pass === list.length ? 0 : 1);
})();
