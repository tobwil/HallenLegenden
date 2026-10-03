// Regressionstests für das Spiel (game/index.html) mit Playwright und Chromium.
// Aufruf:  cd tests && npm install && npm test        (einmalig vorher: npx playwright-core install chromium)
// Optional: CHROMIUM_PATH=/pfad/zu/chromium, GAME=/pfad/zu/index.html oder GAME=https://…/game/ (z. B. Netlify-Vorschau), nur bestimmte Tests: npm test -- pass zoom
// Wo möglich laufen die Tests Frame für Frame (readInput + step) mit festem Zufall, damit sie nicht vom Timing abhängen.
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAME = /^https?:\/\//.test(process.env.GAME || '') ? process.env.GAME : pathToFileURL(process.env.GAME || path.join(root, 'game/index.html')).href;
const exe = process.env.CHROMIUM_PATH || ['/opt/pw-browsers/chromium'].find(existsSync);
const only = process.argv.slice(2);
const DESKTOP = { viewport: { width: 1440, height: 900 } };
const MOBILE = { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 };

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
class Fail extends Error {}
const ok = (cond, msg) => { if (!cond) throw new Fail(msg); };

let browser;
// Neue Seite mit leerem Speicher; seed: Math.random deterministisch machen
async function open(opts = DESKTOP, seed) {
  const ctx = await browser.newContext(opts);
  if (seed) await ctx.addInitScript(s => { let x = s; Math.random = () => (x = (x * 16807) % 2147483647) / 2147483647; }, seed);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(GAME); await page.waitForTimeout(700);
  return { page, ctx, errors };
}
// Im Browser: N Frames manuell weiterschalten (G.paused hält die eigene Schleife an)
const STEP = `window.__run = n => { for (let i = 0; i < n; i++) { readInput(1 / 60); step(1 / 60); } };`;

// ---------------------------------------------------------------- Laden & Darstellung
test('Seite lädt ohne Fehler, Spielschleife läuft (Desktop und Handy)', async () => {
  for (const o of [DESKTOP, MOBILE]) {
    const { page, ctx, errors } = await open(o);
    const t1 = await page.evaluate('G.t'); await page.waitForTimeout(600); const t2 = await page.evaluate('G.t');
    // Pixelschrift mit erweitertem Zeichensatz geladen, sonst zeigt die Leinwand Ć, Š, Ž … falsch (Petrović, Kovač)
    const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.family.includes('Press Start')).map(f => f.status));
    ok(t2 > t1, `G.t steigt nicht (${t1} -> ${t2})`); ok(fonts.length === 2 && fonts.every(s => s === 'loaded'), 'Schrift-Zeichensätze: ' + fonts); ok(!errors.length, errors.join('; ')); await ctx.close();
  }
});

test('Handy: kein Menü-Overlay im Spiel, Antipp-Tipp beim ersten Spiel, dezente Knöpfe', async () => {
  const { page, ctx, errors } = await open(MOBILE);
  await page.evaluate(() => { document.body.classList.add('touch'); startMatch(SEL.a, SEL.b, { human: 0, halfLen: 180 }); G.introT = 99; });
  // Tipp erscheint beim Anwurf, hält das Spiel an und gibt es nach VERSTANDEN wieder frei
  await page.waitForSelector('#ttip', { timeout: 10000 });
  const tip = await page.evaluate(() => ({ paused: G.paused, text: document.getElementById('ttip').innerText.includes('Tor antippen') }));
  await page.tap('#ttip button');
  await page.waitForFunction(() => G && G.phase === 'play', null, { timeout: 20000 });
  const r = await page.evaluate(() => ({ hidden: menu.hidden, display: getComputedStyle(menu).display, ingame: document.body.classList.contains('ingame'), tipGone: !document.getElementById('ttip'),
    btnBg: getComputedStyle(document.querySelector('.tb-a')).backgroundColor, stickOp: +getComputedStyle(document.getElementById('stick')).opacity }));
  // im zweiten Spiel noch einmal, ab dem dritten nicht mehr
  const again = await page.evaluate(() => { const n = []; for (let i = 0; i < 2; i++) { hideMenu(); startMatch(SEL.a, SEL.b, { human: 0, halfLen: 180 }); G.introT = 99; G.phase = 'kickoff'; touchTip(); n.push(!!document.getElementById('ttip')); const t = document.getElementById('ttip'); if (t) t.remove(); } return n; });
  ok(tip.paused && tip.text, 'Tipp: ' + JSON.stringify(tip)); ok(r.hidden && r.display === 'none' && r.ingame && r.tipGone, JSON.stringify(r));
  ok(/rgba\(.*0\.\d+\)/.test(r.btnBg) && r.stickOp < 0.4, 'Knöpfe/Stick nicht dezent: ' + JSON.stringify(r)); ok(again[0] && !again[1], 'Tipp-Zähler: ' + JSON.stringify(again));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Handy: Knopfgröße klein/normal/groß aus den Optionen, bleibt gespeichert', async () => {
  const { page, ctx, errors } = await open(MOBILE);
  const size = () => page.evaluate(() => { const c = document.body.classList, mo = c.contains('menuopen'); c.add('ingame'); c.remove('menuopen'); const w = document.querySelector('.tb-b').getBoundingClientRect().width; c.remove('ingame'); if (mo) c.add('menuopen'); return Math.round(w); });
  await page.evaluate(() => ACT.options()); const row = await page.evaluate(() => menu.innerText.includes('TOUCH-KNÖPFE'));
  const m = await size(); await page.evaluate(() => ACT.btnSize('l')); const l = await size(); await page.evaluate(() => ACT.btnSize('s')); const sm = await size();
  await page.reload(); await page.waitForTimeout(500); const kept = await size();
  ok(row, 'Option fehlt'); ok(l > m && m > sm && kept === sm, `Größen: normal ${m}, groß ${l}, klein ${sm}, nach Neuladen ${kept}`);
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Alle Menüfenster gleich groß, Tabwechsel ändert nichts', async () => {
  const { page, ctx, errors } = await open(DESKTOP);
  const sizes = await page.evaluate(() => {
    const out = {}, size = n => { const b = menu.querySelector('.panel').getBoundingClientRect(); out[n] = Math.round(b.width) + 'x' + Math.round(b.height); };
    ACT.main(); size('main'); ACT.quick(); size('quick'); ACT.help(); size('help'); ACT.options(); size('options'); ACT.editor(0); size('editor');
    careerCreate(3, 1, 1, 0); for (const t of ['home', 'squad', 'train', 'market', 'table', 'cup', 'euro', 'stats', 'hist']) { ACT.cTab(t); size('tab-' + t); }
    return out;
  });
  ok(new Set(Object.values(sizes)).size === 1, JSON.stringify(sizes)); ok(!errors.length, errors.join('; ')); await ctx.close();
});

// ---------------------------------------------------------------- Eingabe
test('Tastenbelegung: Pfeile laufen, W/Shift Sprint, S/A Pass, Leertaste Wurf, D Finte', async () => {
  const { page, ctx, errors } = await open(DESKTOP);
  const r = await page.evaluate(() => {
    const out = {};
    for (const k of ['ArrowUp', 'ArrowLeft', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft']) {
      KEY[k] = true; readInput(1 / 60); out[k] = { x: IN.x, y: IN.y, s: IN.s, a: IN.a, b: IN.b, c: IN.c, k: IN.k }; KEY[k] = false; readInput(1 / 60);
    }
    KEYP.KeyS = true; readInput(1 / 60); out.tap = IN.pa;   // Tipper kürzer als ein Frame geht nicht verloren
    return out;
  });
  const want = { ArrowUp: { y: -1 }, ArrowLeft: { x: -1 }, KeyW: { s: true, y: 0 }, KeyA: { a: true, k: true }, KeyS: { a: true, k: false }, KeyD: { c: true }, Space: { b: true }, ShiftLeft: { s: true, k: true } };
  for (const [k, w] of Object.entries(want)) for (const [f, v] of Object.entries(w)) ok(r[k][f] === v, `${k}: ${f} = ${r[k][f]}, erwartet ${v}`);
  ok(r.tap === true, 'kurzer Tipper auf S kommt nicht an'); ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Aktionen mit Ball: Pass, Kempa, Shift+S, W+S ohne Kempa, Finte, Wurf', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 4242);
  const r = await page.evaluate(STEP + `(() => {
    hideMenu(); startMatch(0, 1, { human: 0, halfLen: 180 }); G.paused = true;
    let n = 0; while (G.phase !== 'play' && n++ < 3000) __run(1);
    const res = {};
    for (const [label, keys, hold] of [['S', ['KeyS']], ['A', ['KeyA']], ['Shift+S', ['ShiftLeft', 'KeyS']], ['W+S', ['KeyW', 'KeyS']], ['D', ['KeyD']], ['Leertaste', ['Space']]]) {
      const calls = [], orig = {};
      for (const f of ['pass', 'kempa', 'feint', 'shoot']) { orig[f] = window[f]; window[f] = function (...a) { calls.push(f); return orig[f].apply(this, a); }; }
      const a = G.players.find(q => q.team === 0 && q.role === 'RM'); G.phase = 'play'; place(a, a.x, a.y); giveBall(a); G.ctrl = a;   // place: steht wieder (könnte gefoult am Boden liegen)
      for (const k of keys) KEY[k] = true; __run(1); for (const k of keys) KEY[k] = false; __run(1);
      for (const f in orig) window[f] = orig[f];
      res[label] = calls[0] || '';
      __run(90);
    }
    return res;
  })()`);
  const want = { S: 'pass', A: 'kempa', 'Shift+S': 'kempa', 'W+S': 'pass', D: 'feint', Leertaste: 'shoot' };
  for (const [k, v] of Object.entries(want)) ok(r[k] === v, `${k}: ${r[k] || 'nichts'} statt ${v}`);
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Eingabepuffer: Druck während des Passflugs wird beim Fangen ausgeführt, genau einmal', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 777);
  const r = await page.evaluate(STEP + `(() => {
    hideMenu(); startMatch(0, 1, { human: 0, halfLen: 900 }); G.paused = true;
    let n = 0; while (G.phase !== 'play' && n++ < 3000) __run(1);
    const out = {};
    for (const [label, key] of [['S', 'KeyS'], ['Leertaste', 'Space'], ['A', 'KeyA'], ['ohne', null]]) {
      const calls = [], orig = {};
      for (const f of ['pass', 'kempa', 'shoot']) { orig[f] = window[f]; window[f] = function (...a) { if (a[0] && a[0].team === 0) calls.push(f); return orig[f].apply(this, a); }; }
      const pl = G.players.filter(q => q.team === 0 && q.role !== 'TW' && !q.out), a = pl[0];
      const q = pl.slice(1).sort((x, y) => dist(a.x, a.y, x.x, x.y) - dist(a.x, a.y, y.x, y.y))[0];
      for (const o of G.players) if (o.team === 1 && o.role !== 'TW') { o.x = 4; o.y = 2; o.vx = o.vy = 0; }
      G.phase = 'play'; giveBall(a); G.ctrl = a; orig.pass(a, q);
      let caught = -1, pressed = false;
      for (let f = 0; f < 120; f++) {
        if (key && !pressed && G.ball.state === 'air' && dist(G.ball.x, G.ball.y, q.x, q.y) < 2.5) { KEYP[key] = true; pressed = true; }
        __run(1); if (caught < 0 && G.ball.owner === q) caught = f;
      }
      for (const f in orig) window[f] = orig[f];
      out[label] = { caught, calls: calls.join(',') };
      __run(60);
    }
    return out;
  })()`);
  ok(r.S.caught >= 0 && r.S.calls === 'pass', 'S: ' + JSON.stringify(r.S));
  ok(r.Leertaste.calls.startsWith('shoot'), 'Leertaste: ' + JSON.stringify(r.Leertaste));
  ok(r.A.calls.startsWith('kempa'), 'A: ' + JSON.stringify(r.A));
  ok(r.ohne.calls === '', 'ohne Taste: ' + JSON.stringify(r.ohne));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Passquote: gehaltene Richtung und neue Richtung im Flug, Bälle fliegen gerade', async () => {
  const { page, ctx, errors } = await open({ viewport: { width: 800, height: 450 } }, 12345);
  const r = await page.evaluate(STEP + `(() => {
    hideMenu(); newMatch(0, 1, { human: -1, halfLen: 900 }); G.demo = false; G.paused = true;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[0.7,0.7],[0.7,-0.7],[-0.7,0.7],[-0.7,-0.7]];
    const arrows = (dx, dy) => { KEY.ArrowRight = dx > 0.3; KEY.ArrowLeft = dx < -0.3; KEY.ArrowDown = dy > 0.3; KEY.ArrowUp = dy < -0.3; };
    const res = { held: [0, 0], steer: [0, 0] }; let trials = 0, maxTurn = 0;
    for (let s = 0; s < 300000 && trials < 160; s++) {
      __run(1); const o = G.ball.owner;
      if (G.phase !== 'play' || !o || o.team !== 0 || o.role === 'TW' || o.airCatch || o.z > 0 || s % 37) continue;
      const mode = trials % 2 ? 'steer' : 'held'; trials++;
      G.human = 0; G.ctrl = o; const d = dirs[(trials * 7) % 8]; arrows(d[0], d[1]); KEY.KeyS = true;
      let q = null, out = null, dir0 = null;
      for (let f = 0; f < 150; f++) {
        if (f === 1) KEY.KeyS = false;
        if (mode === 'steer' && f === 2) arrows(0, 0);
        if (mode === 'steer' && f === 8) { const d2 = dirs[(trials * 3 + 1) % 8]; arrows(d2[0], d2[1]); }
        __run(1);
        if (f === 0) { q = G.ball.passTo; if (!q) break; dir0 = Math.atan2(G.ball.vy, G.ball.vx); }
        if (q && G.phase === 'play' && G.ball.state === 'air' && G.ball.passTo === q && !G.ball.lob && Math.hypot(G.ball.vx, G.ball.vy) > 1) { let t = Math.abs(Math.atan2(G.ball.vy, G.ball.vx) - dir0); t = Math.min(t, 2 * Math.PI - t); maxTurn = Math.max(maxTurn, t); }
        const ow = G.ball.owner; if (ow && ow !== o) { out = ow === q; break; } if (G.phase !== 'play') { out = false; break; }
      }
      arrows(0, 0); KEY.KeyS = false; __run(1); G.human = -1; G.ctrl = null;
      if (q) { res[mode][1]++; if (out) res[mode][0]++; }
    }
    return { held: res.held[0] / res.held[1], steer: res.steer[0] / res.steer[1], n: res.held[1] + res.steer[1], maxTurnDeg: maxTurn * 180 / Math.PI };
  })()`);
  ok(r.n >= 100, `zu wenige Pässe (${r.n})`);
  ok(r.held >= 0.7, `Pfeil gehalten: nur ${Math.round(r.held * 100)} % angekommen`);
  ok(r.steer >= 0.7, `neue Richtung im Flug: nur ${Math.round(r.steer * 100)} % angekommen`);
  ok(r.maxTurnDeg < 1, `Ball fliegt eine Kurve (${r.maxTurnDeg.toFixed(1)}°)`);
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Abwehr: Wechseltaste geht zum Ballnächsten, dann der Nähe nach weiter', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 2024);
  const r = await page.evaluate(STEP + `(() => {
    hideMenu(); newMatch(0, 1, { human: 0, halfLen: 900 }); G.demo = false; G.paused = true;
    let n = 0; while (G.phase !== 'play' && n++ < 3000) __run(1);
    const opp = G.players.find(q => q.team === 1 && q.role === 'RM'); giveBall(opp);
    const mates = G.players.filter(q => q.team === 0 && q.role !== 'TW' && !q.out).sort((a, c) => dist(a.x, a.y, opp.x, opp.y) - dist(c.x, c.y, opp.x, opp.y));
    G.ctrl = mates[mates.length - 1]; G.manT = G.t;
    const seq = [];
    for (let i = 0; i < 3; i++) { KEY.KeyS = true; __run(1); KEY.KeyS = false; __run(1); seq.push(G.swList.indexOf(G.ctrl)); __run(6); }
    return seq;
  })()`);
  ok(JSON.stringify(r) === '[0,1,2]', `Reihenfolge ${JSON.stringify(r)} statt [0,1,2]`);
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

// ---------------------------------------------------------------- Spielablauf
test('Komplettes CPU-Spiel bis Abpfiff, Co-Trainer wechselt', async () => {
  const { page, ctx, errors } = await open({ viewport: { width: 800, height: 450 } }, 99);
  const r = await page.evaluate(() => {
    hideMenu(); newMatch(0, 1, { human: -1, halfLen: 120 }); G.demo = false; G.autoSub = true;
    let subs = 0; const o = window.doSub; window.doSub = function (...a) { subs++; return o.apply(this, a); };
    let n = 0; while (G.phase !== 'fulltime' && n < 80000) { step(1 / 60); n++; }
    window.doSub = o; return { phase: G.phase, score: G.score, subs };
  });
  ok(r.phase === 'fulltime', 'kein Abpfiff: ' + r.phase); ok(r.score[0] + r.score[1] > 0, 'keine Tore'); ok(r.subs > 0, 'keine Wechsel');
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Kraftverlust: ohne Wechsel sinkt die Kraft bis Spielende deutlich', async () => {
  const { page, ctx, errors } = await open({ viewport: { width: 800, height: 450 } }, 7);
  const e = await page.evaluate(() => {
    hideMenu(); newMatch(0, 1, { human: -1, halfLen: 120 }); G.demo = false; window.doSub = () => {};
    let n = 0; while (G.phase !== 'fulltime' && n < 80000) { step(1 / 60); n++; }
    const on = G.players.filter(q => !q.out && q.role !== 'TW'); return on.reduce((s, q) => s + q.energy, 0) / on.length;
  });
  ok(e > 0.15 && e < 0.55, `Kraft am Ende ${e.toFixed(2)}, erwartet 0,15–0,55`); ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Zufallseingaben über eine Halbzeit ohne Absturz', async () => {
  const { page, ctx, errors } = await open({ viewport: { width: 800, height: 450 } }, 31337);
  const r = await page.evaluate(STEP + `(() => {
    hideMenu(); newMatch(0, 1, { human: 0, halfLen: 120 }); G.demo = false; G.paused = true;
    const keys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft'];
    let n = 0, err = null;
    try { while (G.phase !== 'halftime' && n < 60000) { if (n % 6 === 0) for (const k of keys) if (Math.random() < 0.08) { KEY[k] = !KEY[k]; if (KEY[k]) KEYP[k] = true; } if (!menu.hidden) hideMenu(); __run(1); n++; } }
    catch (e) { err = e.stack; }
    for (const k of keys) KEY[k] = false;
    return { n, phase: G.phase, err };
  })()`);
  ok(!r.err, r.err); ok(r.phase === 'halftime', `Halbzeit nicht erreicht (${r.phase} nach ${r.n} Frames)`); ok(!errors.length, errors.join('; ')); await ctx.close();
});

// ---------------------------------------------------------------- Karriere & Editor
test('Simulierte Ergebnisse passen zur Halbzeitlänge', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 55);
  const r = await page.evaluate(() => [0, 1, 2].map(half => {
    careerCreate(3, 0, half, 1); const g = [];
    for (let i = 0; i < 300; i++) { const a = i % 18, b = (i * 7 + 1) % 18; if (a === b) continue; const m = simMatch(a, b); g.push(m.ga, m.gb); }
    return g.reduce((s, v) => s + v, 0) / g.length;
  }));
  const range = [[4, 7.5], [6.5, 10.5], [11, 17]];
  r.forEach((v, i) => ok(v >= range[i][0] && v <= range[i][1], `Halbzeit ${['2', '3', '5'][i]} Min: ${v.toFixed(1)} Tore pro Team, erwartet ${range[i].join('–')}`));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Editor: Ersatzbank und Karriere-Kader lassen sich umbenennen', async () => {
  const { page, ctx, errors } = await open(DESKTOP);
  await page.evaluate(() => ACT.editor(SEL.a));
  ok(await page.locator('#menu input[id^="ed"][id$="N"]').count() === 14, 'Schnelles Spiel: nicht 14 Eingabefelder');
  await page.fill('#ed0N', 'Startername'); await page.fill('#ed9N', 'Bankname'); await page.fill('#ed9Z', '77'); await page.click('text=SPEICHERN');
  const q = await page.evaluate(() => { hideMenu(); newMatch(SEL.a, SEL.b, { human: 0 }); const r = { start: G.players.some(p => p.team === 0 && p.name === 'Startername'), bench: G.bench[0].some(p => p.name === 'Bankname' && p.num === 77) }; G = null; return r; });
  ok(q.start && q.bench, 'Schnelles Spiel: ' + JSON.stringify(q));
  await page.evaluate(() => { careerCreate(3, 0, 1, 1); ACT.editor(CAREER.team); });
  const n = await page.locator('#menu input[id^="edC"][id$="N"]').count();
  await page.fill(`#edC${n - 1}N`, 'Neuer Name'); await page.click('text=SPEICHERN');
  const c = await page.evaluate(() => { const sq = CAREER.squads[CAREER.team]; return { last: sq[sq.length - 1].name, stored: JSON.parse(localStorage.getItem(CAREER_KEY)).squads[CAREER.team].some(p => p.name === 'Neuer Name') }; });
  ok(c.last === 'Neuer Name' && c.stored, 'Karriere: ' + JSON.stringify(c));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Karriere: 9 Spieltage, Statistik und Pokal-Turnierbaum', async () => {
  for (const o of [DESKTOP, MOBILE]) {
    const { page, ctx, errors } = await open(o, 314);
    const r = await page.evaluate(() => {
      careerCreate(3, 1, 1, 0); for (let i = 0; i < 40 && CAREER.season.round < 9; i++) ACT.cSim();
      ACT.cTab('stats'); const kpi = menu.querySelectorAll('.kpi').length, chart = !!menu.querySelector('svg.poschart polyline');
      ACT.cTab('cup'); const ties = menu.querySelectorAll('.tie').length;
      // Baum stimmig: Sieger einer Runde stehen in derselben Reihenfolge in der nächsten Runde
      const C = CAREER.cup; let tree = true;
      for (const res of C.results) { const next = C.results.find(x => x.round === res.round + 1); const nt = next ? next.rows.flatMap(r => [r[0], r[1]]) : res.round + 1 === C.round ? C.ties.flat() : null; if (nt) tree = tree && res.rows.map(r => r[5]).every((w, i) => nt[i] === w); }
      return { round: CAREER.season.round, hist: (CAREER.season.posHist || []).length, kpi, chart, ties, tree };
    });
    ok(r.round === 9 && r.hist === 9, `Spieltage/Verlauf: ${JSON.stringify(r)}`); ok(r.kpi === 6 && r.chart, `Statistik: ${JSON.stringify(r)}`);
    ok(r.ties === 32 && r.tree, `Pokal: ${JSON.stringify(r)}`); ok(!errors.length, errors.join('; ')); await ctx.close();
  }
});

// ---------------------------------------------------------------- Wirtschaft
test('Wirtschaft: Saisonlänge ändert Gehälter und Einnahmen pro Saison kaum', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 4711);
  const r = await page.evaluate(() => [0, 1, 2].map(len => {
    careerCreate(12, len, 1, 1, true, 3); while (!CAREER.season.done) ACT.cSim(); const F = finOf();
    return { wages: F.wages, income: F.gate + F.sponsor };
  }));
  const span = k => Math.max(...r.map(x => x[k])) / Math.min(...r.map(x => x[k]));
  ok(span('wages') < 1.1, 'Gehälter pro Saison weichen ab: ' + JSON.stringify(r));
  ok(span('income') < 1.6, 'Einnahmen pro Saison weichen stark ab: ' + JSON.stringify(r));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Wirtschaft: kein Geld aus dem Nichts (Sperre, Sofortverkauf, zahlender Käufer)', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 99);
  const r = await page.evaluate(() => {
    careerCreate(3, 1, 1, 1); refreshMarket(true);
    const fa = CAREER.market.filter(x => x.from < 0).sort((a, b) => a.price - b.price)[0], m0 = CAREER.money;
    const bought = buyPlayer(fa.pid) === '', blocked = sellPlayer(fa.pid) !== '';
    const p = CAREER.squads[CAREER.team].find(q => q.pid === fa.pid);
    while (isLocked(p)) ACT.cSim();
    const price = quickSalePrice(p), before = CAREER.money, aiBefore = Object.values(CAREER.aiMoney).reduce((a, c) => a + c, 0);
    const sold = sellPlayer(fa.pid) === '', aiAfter = Object.values(CAREER.aiMoney).reduce((a, c) => a + c, 0);
    return { bought, blocked, sold, profit: price - fa.price, got: CAREER.money - before, aiPaid: aiBefore - aiAfter };
  });
  ok(r.bought && r.blocked, 'Neuzugang ließ sich sofort weiterverkaufen: ' + JSON.stringify(r));
  ok(r.sold && r.profit < 0, 'Kauf und Wiederverkauf bringt Gewinn: ' + JSON.stringify(r));
  ok(r.got === r.aiPaid, 'Käufer hat den Verkaufspreis nicht bezahlt: ' + JSON.stringify(r));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Wirtschaft: Schulden führen zu Transfersperre und Notverkauf', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 99);
  const r = await page.evaluate(() => {
    careerCreate(12, 1, 1, 1); CAREER.money = -300000; refreshMarket(true);
    const ban = buyPlayer(CAREER.market[0].pid).startsWith('Transfersperre'), n0 = CAREER.squads[CAREER.team].length;
    for (let i = 0; i < debtLimit(); i++) ACT.cSim();
    return { ban, sold: n0 - CAREER.squads[CAREER.team].length, money: CAREER.money, news: CAREER.news.some(t => t.startsWith('Notverkauf')) };
  });
  ok(r.ban, 'keine Transfersperre bei Schulden'); ok(r.sold >= 1 && r.news && r.money >= 0, 'kein Notverkauf: ' + JSON.stringify(r));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Wirtschaft: Entlassung nach zweimal deutlich verfehltem Ziel, neuer Verein per Klick, dort weiterspielen', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 99);
  // zwei Saisons, eigener Verein jeweils am Tabellenende; Saisonabschluss und Weiter über die Knöpfe
  const board = [];
  await page.evaluate(() => careerCreate(3, 0, 1, 1));
  for (let s = 0; s < 2; s++) {
    await page.evaluate(() => { let g = 0; while ((!CAREER.season.done || cupDue() || euroDue()) && g++ < 200) ACT.cSim(); const T = CAREER.season.table[CAREER.team]; T.s = T.u = T.tp = 0; T.n = T.sp; careerHub('home'); });
    await page.click('#menu button[data-act="cEnd"]');
    board.push(await page.evaluate(() => CAREER.summary.board));
    if (s === 0) await page.click('#menu button[data-act="cNext"]');
  }
  // Jobangebote stehen oben im Saisonabschluss, ohne Scrollen sichtbar; kein Weiter-Knopf
  const offers = await page.evaluate(() => { const b = [...menu.querySelectorAll('button[data-act="cJob"]')], r = b[0] && b[0].getBoundingClientRect(); return { n: b.length, ids: b.map(x => +x.dataset.v), visible: !!r && r.bottom <= innerHeight, next: !!menu.querySelector('[data-act="cNext"]') }; });
  const old = await page.evaluate(() => CAREER.team), pick = offers.ids[0];
  await page.click(`#menu button[data-act="cJob"][data-v="${pick}"]`);
  await page.reload(); await page.waitForTimeout(500);
  const job = await page.evaluate(([old, pick]) => ({ team: CAREER.team, summary: CAREER.summary, round: CAREER.season.round, inTable: !!CAREER.season.table[CAREER.team], lg: CAREER.season.lg === CAREER.lgOf[CAREER.team], starters: CAREER.squads[CAREER.team].filter(p => p.start).length, miss: CAREER.board.miss, oldIsAi: !!CAREER.squads[old] && old !== CAREER.team }), [old, pick]);
  // mit dem neuen Verein selbst spielen: SELBST SPIELEN -> ANPFIFF -> Abpfiff -> WEITER ZUR KARRIERE
  await page.evaluate(() => careerHub('home')); await page.click('#menu button[data-act="cPlay"]'); await page.click('#menu button[data-act="pmGo"]');
  const match = await page.evaluate(() => ({ mine: G.tid[G.human] === CAREER.team, career: G.career }));
  await page.evaluate(() => { G.paused = true; G.introT = 99; let n = 0; while (G.phase !== 'fulltime' && n++ < 90000) { readInput(1 / 60); step(1 / 60); } G.paused = false; });
  await page.waitForSelector('#menu button[data-act="afterMatch"]', { timeout: 15000 }); await page.click('#menu button[data-act="afterMatch"]');
  const rest = await page.evaluate(() => { const r1 = CAREER.season.round; let g = 0; while ((!CAREER.season.done || cupDue() || euroDue()) && g++ < 200) ACT.cSim(); ACT.cEnd();
    return { r1, done: g < 200, histTeam: CAREER.history.slice(-1)[0].team === CAREER.team, histOld: CAREER.history.slice(0, 2).every(h => h.team !== CAREER.team) }; });
  ok(board[0].warn && !board[0].fired && board[1].fired, 'Warnung/Entlassung fehlt: ' + JSON.stringify(board));
  ok(offers.n >= 2 && offers.visible && !offers.next && !offers.ids.includes(old), 'Jobangebote: ' + JSON.stringify(offers));
  ok(job.team === pick && !job.summary && job.round === 0 && job.inTable && job.lg && job.starters === 7 && job.miss === 0 && job.oldIsAi, 'Jobwechsel: ' + JSON.stringify(job));
  ok(match.mine && match.career && rest.r1 === 1, 'Spiel mit neuem Verein: ' + JSON.stringify({ match, rest }));
  ok(rest.done && rest.histTeam && rest.histOld, 'Saison/Historie: ' + JSON.stringify(rest));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Wirtschaft: CPU-Budgets bleiben über drei Saisons stabil', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 4711);
  const r = await page.evaluate(() => {
    careerCreate(12, 1, 1, 1, true, 3);
    // Durchschnitt aller CPU-Vereine, dazu einzeln 1. Liga (Stammbesetzung) und internationale Vereine (spielen fast jedes Jahr Europapokal)
    const avgAi = f => { const v = Object.entries(CAREER.aiMoney).filter(([id]) => +id !== CAREER.team && f(+id)).map(([, x]) => x); return v.reduce((a, c) => a + c, 0) / v.length; };
    const lg1 = TEAMS.filter(t => t.lg === 1).map(t => t.id), all = () => avgAi(() => true), l1 = () => avgAi(id => lg1.includes(id)), l3 = () => avgAi(id => TEAMS[id].lg === 3);
    const a0 = [all(), l1(), l3()];
    for (let s = 0; s < 3; s++) { while (!CAREER.season.done || euroDue()) ACT.cSim(); careerEndSeason(); if (CAREER.jobOffers) ACT.cJob(CAREER.jobOffers[0]); }
    return { a0, a3: [all(), l1(), l3()] };
  });
  ['alle', '1. Liga', 'international'].forEach((n, i) => ok(r.a3[i] > r.a0[i] * 0.5 && r.a3[i] < r.a0[i] * 1.8, `CPU-Durchschnitt ${n}: ${Math.round(r.a0[i] / 1000)}k -> ${Math.round(r.a3[i] / 1000)}k`));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Handy-Hochformat: keine Karriere-Ansicht ragt über den Fensterrand', async () => {
  const { page, ctx, errors } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, 5);
  const bad = await page.evaluate(() => {
    document.body.classList.add('touch', 'portraitok'); careerCreate(8, 1, 1, 1, true, 3);
    while (!CAREER.season.done) ACT.cSim(); careerEndSeason();
    const out = [], check = name => { const panel = menu.querySelector('.panel'); if (!panel) return; const pr = panel.getBoundingClientRect();
      menu.querySelectorAll('.panel *').forEach(el => { const r = el.getBoundingClientRect(); if (r.width && r.right > pr.right + 1 && !el.closest('.ctabs') && !el.closest('.bracket')) out.push(`${name}: ${el.tagName.toLowerCase()} +${Math.round(r.right - pr.right)}px`); }); };
    careerHub(); check('Saisonabschluss'); ACT.cNext(); for (let i = 0; i < 5; i++) ACT.cSim();
    for (const t of ['home', 'squad', 'train', 'market', 'table', 'cup', 'euro', 'stats', 'trophy', 'hist']) { ACT.cTab(t); check(t); }
    ACT.cPick(CAREER.squads[CAREER.team][0].pid); check('Spieler');
    return [...new Set(out)].slice(0, 5);
  });
  ok(!bad.length, bad.join(', ')); ok(!errors.length, errors.join('; ')); await ctx.close();
});

// ---------------------------------------------------------------- Europapokal & Final Four
test('Europapokal: Gruppen, Viertelfinale und Final Four bei 6, 17 und 34 Spieltagen', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 2024);
  const r = await page.evaluate(() => [0, 1, 2].map(len => {
    careerCreate(3, len, 1, 1, true, 3); const E = CAREER.euro, ger = E.teams.filter(id => CAREER.lgOf[id] === 1);
    const sepGroups = !E.groups || E.groups.every(g => g.filter(id => ger.includes(id)).length <= 1);
    let guard = 0; while ((!CAREER.season.done || euroDue() || cupDue()) && guard++ < 200) ACT.cSim();
    const games = E.groups ? Object.values(E.table).reduce((a, t) => a + t.sp, 0) : 0;
    const sum = careerEndSeason();
    return { n: E.teams.length, compact: E.compact, sepGroups, games, ko: E.ko.map(k => k.rows ? k.rows.length : 0).join('/'), winner: sum.euroWinner, qual: CAREER.euroQual.length, next: CAREER.euro.teams.length, guard };
  }));
  ok(r[0].compact && r[0].n === 8 && r[0].ko === '4/2/1', '6 Spieltage: ' + JSON.stringify(r[0]));
  for (const x of r.slice(1)) ok(!x.compact && x.n === 16 && x.sepGroups && x.games === 96 && x.ko === '4/2/1', 'Gruppenphase: ' + JSON.stringify(x));
  ok(r.every(x => x.winner !== null && x.winner !== undefined && x.qual === 3 && x.guard < 200), 'Sieger/Qualifikation: ' + JSON.stringify(r));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Europapokal und Pokal: Final Four am selben Termin, neutral, mit Event und Pokalübergabe', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 2024);
  const r = await page.evaluate(() => {
    careerCreate(3, 1, 1, 1, true, 3); const cs = CAREER.cup.sched, ks = CAREER.euro.ksched, len = CAREER.season.fixtures.length;
    // Final-Four-Spiel des Pokals: neutrale Halle (keine Zuschauereinnahmen für den "Gastgeber")
    while (CAREER.cup.round < CUP_F4 && !CAREER.season.done) ACT.cSim();
    const ai0 = { ...CAREER.aiMoney }, m0 = CAREER.money, ties = CAREER.cup.ties.map(t => t.slice());
    playCupRound(null, true);
    const homeGot = ties.filter(([a]) => a !== CAREER.team).some(([a]) => CAREER.aiMoney[a] - ai0[a] > 0 && CAREER.aiMoney[a] - ai0[a] < 100000 && CAREER.aiMoney[a] - ai0[a] !== CUP_PRIZE[CUP_F4]);
    // Event im Spiel: Pokalübergabe nach dem Finale
    hideMenu(); newMatch(1, 2, { human: 0, halfLen: 60, cup: true, event: euroEvent(2) }); G.score = [20, 18]; G.half = 2; G.players.forEach(p => p.mins = 60); endHalf();
    return { cupF4Same: cs[3] === cs[4], euroF4AtEnd: ks[1] === len, homeGot, intro: !!G.event && G.trophyWinner === 0 };
  });
  ok(r.cupF4Same && r.euroF4AtEnd, 'Termine: ' + JSON.stringify(r)); ok(!r.homeGot, 'Final Four zahlt Zuschauergeld an einen Gastgeber');
  ok(r.intro, 'keine Pokalübergabe im Finale'); ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Final Four: Nach eigenem Halbfinal-Aus wird das Finale sofort gespielt (Pokal und Europapokal)', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 2024);
  const r = await page.evaluate(() => {
    careerCreate(3, 1, 1, 1, true, 3); const me = CAREER.team, C = CAREER.cup, E = CAREER.euro;
    // Eigenes Spiel als Niederlage melden (wie nach einem selbst gespielten Spiel)
    const lose = (t, neutral) => { const m = simMatch(t[0], t[1], neutral), home = t[0] === me; return { a: t[0], b: t[1], ga: home ? 20 : 30, gb: home ? 30 : 20, stats: m.stats, La: m.La, Lb: m.Lb, win: home ? t[1] : t[0] }; };
    let g = 0; while (C.round < CUP_F4 && g++ < 60) ACT.cSim();
    if (!C.ties.flat().includes(me)) C.ties[0][0] = me;                 // eigenen Verein ins Halbfinale setzen
    g = 0; while (!cupDue() && g++ < 60) ACT.cSim();
    const cupBefore = C.winner; playCupRound(lose(ownCupTie(), true));
    const cup = { before: cupBefore, winner: C.winner, inFinal: C.results.slice(-1)[0].rows.flat().includes(me) };
    g = 0; while (E.kround < 1 && g++ < 60) ACT.cSim();
    if (!E.ko[1].ties.flat().includes(me)) E.ko[1].ties[0][0] = me;
    g = 0; while (!ownEuroTie() && g++ < 60) ACT.cSim();
    const due = euroNext(); playEuroRound(lose(ownEuroTie(), true));
    return { cup, semi: due && due.type === 'ko' && due.r === 1, euroWinner: E.winner, round: CAREER.season.round, len: CAREER.season.fixtures.length };
  });
  ok(r.cup.before === null && r.cup.winner !== null && !r.cup.inFinal, 'Pokalfinale nicht gleich gespielt: ' + JSON.stringify(r.cup));
  ok(r.semi && r.euroWinner !== null && r.euroWinner !== undefined, 'Europapokal-Finale nicht gleich gespielt: ' + JSON.stringify(r));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Hallen-Legenden: Weidenhammer, Hebbe, Richardson und Schörner im Kader, auch in laufenden Karrieren', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 5);
  const NAMES = [['KIE', 'Weidenhammer'], ['COB', 'Hebbe'], ['BER', 'Richardson'], ['ERL', 'Schörner']];
  const r = await page.evaluate(NAMES => {
    const chk = {};
    for (const [k, name] of NAMES) {
      const tid = TEAM_BASE.findIndex(b => b[0] === k), ro = roster(tid), pl = roster(tid, true), i = ro.findIndex(x => x.name === name);
      chk[k] = i > 0 && i === legendSlot(LEGENDS[k], pl) && ['att', 'pas', 'def', 'spd', 'sta', 'num', 'role', 'star'].every(f => ro[i][f] === pl[i][f]) && ro.every((x, j) => j === i || x.name === pl[j].name);
    }
    careerCreate(3, 1, 1, 1);
    const all = () => TEAMS.flatMap(t => CAREER.squads[t.id]), find = n => all().find(p => p.name === n);
    const inCareer = NAMES.every(([, n]) => find(n)), rich = find('Richardson'), sch = find('Schörner');
    const looks = { musc: rich.musc === true, talent: rich.age === 19 && rich.pot - ovr(rich) > 8, tall: sch.tall === 2, trait: sch.trait === 'Kreis-Turm' };
    // alter Spielstand (Version 1): Richardson und Schörner heißen noch wie früher
    for (const [k, n] of [['BER', 'Richardson'], ['ERL', 'Schörner']]) { const tid = TEAM_BASE.findIndex(b => b[0] === k), p = find(n), o = roster(tid, true)[LEGENDS[k].slot]; p.name = o.name; p.musc = undefined; p.tall = o.tall; p.trait = o.trait; }
    const kie = TEAM_BASE.findIndex(b => b[0] === 'KIE'), w = find('Weidenhammer'), orig = roster(kie, true)[legendSlot(LEGENDS.KIE, roster(kie, true))];
    w.name = orig.name; w.beard = false; CAREER.legends = undefined; saveCareer();
    return { chk, inCareer, looks };
  }, NAMES);
  // alter Spielstand ohne Merker: alle vier werden nachgerüstet
  await page.reload(); await page.waitForTimeout(600);
  const m0 = await page.evaluate(() => { const f = n => TEAMS.flatMap(t => CAREER.squads[t.id]).find(p => p.name === n); return { w: !!f('Weidenhammer') && f('Weidenhammer').beard, r: !!f('Richardson') && f('Richardson').musc, s: !!f('Schörner') && f('Schörner').tall === 2, flag: CAREER.legends }; });
  ok(r.chk.KIE && r.chk.COB && r.chk.BER && r.chk.ERL, 'Kader: ' + JSON.stringify(r.chk)); ok(r.inCareer, 'nicht in der Karriere');
  ok(Object.values(r.looks).every(Boolean), 'Aussehen/Talent: ' + JSON.stringify(r.looks));
  ok(m0.w && m0.r && m0.s && m0.flag === 2, 'Nachrüsten im alten Spielstand: ' + JSON.stringify(m0));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Karriere: Potenzial in Kader, Transferliste und Spielerprofil', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 21);
  const r = await page.evaluate(() => {
    careerCreate(5, 1, 1, 1); const sq = CAREER.squads[CAREER.team];
    ACT.cTab('squad'); const head = [...menu.querySelectorAll('thead th')].map(t => t.textContent), cells = menu.querySelectorAll('tbody td[data-l="POT"] .pot').length;
    ACT.cTab('market'); const mcells = menu.querySelectorAll('td[data-l="POT"] .pot').length, mrows = CAREER.market.filter(m => marketPlayer(m)).length;
    ACT.cTab('squad'); ACT.cPick(sq[0].pid); const det = menu.innerText.includes('Potenzial');
    // Regeln: nie unter dem aktuellen Wert, ab 30 Jahren gleich dem aktuellen Wert (baut ab)
    const all = TEAMS.flatMap(t => CAREER.squads[t.id]), rules = all.every(p => potOf(p) >= ovr(p) && (p.age < 30 || (potOf(p) === ovr(p) && potTrend(p) === 'down')));
    const legends = ['Weidenhammer', 'Hebbe'].map(n => all.find(p => p.name === n)).map(p => p && p.age === 27 && potTrend(p) !== 'down');
    return { pot: head.includes('POT'), cells, n: sq.length, mcells, mrows, det, rules, legends };
  });
  ok(r.pot && r.cells === r.n, 'Kader: ' + JSON.stringify(r)); ok(r.mcells === r.mrows && r.mrows > 0, 'Transferliste: ' + JSON.stringify(r));
  ok(r.det && r.rules, 'Profil/Regeln: ' + JSON.stringify(r)); ok(r.legends.every(Boolean), 'Legenden mit 27 in Bestform: ' + JSON.stringify(r.legends));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Breite Handys: Spielfeld füllt den Bildschirm, Desktop und Hochformat bleiben 16:9', async () => {
  const phone = { viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 };
  const { page, ctx, errors } = await open(phone);
  const fill = () => page.evaluate(() => { const r = document.getElementById('wrap').getBoundingClientRect(); return { W, cv: cv.width, fill: r.width * r.height / (innerWidth * innerHeight) }; });
  const wide = await fill();
  const intro = await page.evaluate(() => { startMatch(2, 26, { human: 0, halfLen: 120 }); G.paused = true; G.introT = 5.5; render(); return { ok: G.phase === 'intro', radar: hudR() < W }; });
  await page.setViewportSize({ width: 393, height: 852 }); await page.waitForTimeout(400);
  const tall = await fill();
  await page.setViewportSize({ width: 852, height: 393 }); await page.waitForTimeout(400);
  const back = await page.evaluate(() => { G.paused = true; G.introT = 99; G.phase = 'play'; for (let i = 0; i < 5; i++) render(); return W; });
  const d = await open(DESKTOP); const desk = await d.page.evaluate(() => W);
  ok(wide.W > 700 && wide.W <= 800 && wide.cv === wide.W && wide.fill > 0.97, 'Querformat: ' + JSON.stringify(wide));
  ok(intro.ok && intro.radar, 'Intro/HUD: ' + JSON.stringify(intro)); ok(tall.W === 640, 'Hochformat: ' + JSON.stringify(tall)); ok(back === wide.W, 'zurückgedreht: ' + back);
  ok(desk === 640, 'Desktop 16:10: ' + desk);
  ok(!errors.length && !d.errors.length, errors.concat(d.errors).join('; ')); await ctx.close(); await d.ctx.close();
});

test('Erfolge: Titel, Rekorde und Ehrenhalle aus echten Spielen, Saisonbilanz und Karriere als Bild', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 31);
  const r = await page.evaluate(async () => {
    careerCreate(3, 1, 1, 1);
    // jedes eigene Spiel mitschreiben und die Rekorde danach nachrechnen
    const log = [], orig = window.noteOwnMatch; window.noteOwnMatch = function (my, th, opp, comp, stats, L) { log.push({ my, th, pg: Math.max(0, ...(L || []).filter(p => p.role !== 'TW').map(p => (stats[p.pid] || {}).g || 0)) }); return orig.apply(this, arguments); };
    let g = 0; while ((!CAREER.season.done || cupDue() || euroDue()) && g++ < 100) ACT.cSim();
    window.noteOwnMatch = orig;
    const me = CAREER.team, R = CAREER.rec, T = CAREER.season.table[me];
    const mx = f => Math.max(0, ...log.map(f)), exact = { win: mx(m => m.my - m.th), loss: mx(m => m.th - m.my), goals: mx(m => m.my + m.th), pgoals: mx(m => m.pg) };
    const recOk = R.win.v === exact.win && (exact.loss === 0 || R.loss.v === exact.loss) && R.goals.v === exact.goals && R.pgoals.v === exact.pgoals;
    ACT.cEnd(); const s = CAREER.summary, pos = s.pos, h = CAREER.history[0];
    const hallApps = Object.values(CAREER.hall).reduce((a, e) => a + e.apps, 0);
    // Titel stimmen mit Platz, Pokal und Europapokal überein
    const expect = [pos === 1 && s.lg === 1 && 'meister', s.cupWinner === me && 'pokal', s.euroWinner === me && 'euro'].filter(Boolean);
    const titlesOk = expect.every(k => s.titles.includes(k)) && s.titles.length === CAREER.titles.length && h.team === me;
    // Karte erzeugen (im Testbrowser gibt es kein Teilen-Menü: Vorschau mit Bild und Speichern)
    const mode = await shareCard('season'); const img = new Image(); img.src = SHARE.url; await img.decode();
    const preview = !!menu.querySelector('img.sharecard') && !!menu.querySelector('a[download]');
    ACT.cShareBack(); const backToSummary = !!CAREER.summary && menu.innerText.includes('ABSCHLUSS');
    ACT.cNext(); ACT.cTab('trophy'); const view = { shelf: menu.querySelectorAll('.tshelf.won').length, rows: menu.querySelectorAll('.stt td.lbl').length, hall: menu.querySelectorAll('table.cards tbody tr').length };
    const m2 = await shareCard('career');
    return { recOk, exact, games: log.length, recKeys: Object.keys(R).sort().join(','), streak: R.streak && R.streak.v, played: T.sp, titlesOk, titles: s.titles, hallApps, mode, size: [img.width, img.height], preview, backToSummary, view, m2, text: SHARE.text };
  });
  ok(r.recKeys.includes('win') && r.recKeys.includes('pgoals') && r.recKeys.includes('season') && r.recKeys.includes('scorer'), 'Rekorde fehlen: ' + r.recKeys);
  ok(r.recOk && r.games > r.played, 'Rekorde passen nicht zu den Ergebnissen: ' + JSON.stringify(r.exact)); ok(r.titlesOk, 'Titel: ' + JSON.stringify(r.titles)); ok(r.hallApps >= r.played * 7, 'Ehrenhalle zählt zu wenig Einsätze: ' + r.hallApps);
  ok(r.mode === 'preview' && r.size[0] === 1080 && r.size[1] === 1350 && r.preview, 'Teilen-Karte: ' + JSON.stringify(r)); ok(r.backToSummary, 'Zurück führt nicht zum Saisonabschluss');
  ok(r.view.shelf === r.titles.length && r.view.rows === 8 && r.view.hall > 0, 'Tab ERFOLGE: ' + JSON.stringify(r.view)); ok(r.text.includes('hallenlegenden.de'), 'Teilen-Text ohne Link');
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Erfolge: ältere Karriere bekommt Titel aus der Historie nachgetragen', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 8);
  await page.evaluate(() => {
    careerCreate(0, 0, 1, 1); const me = CAREER.team;
    // Spielstand wie vor dieser Version: Historie ohne Vereinsnummer, keine Titel, keine Rekorde
    CAREER.history = [{ year: 2026, lg: 1, pos: 1, champ: me, cup: me, euro: null }, { year: 2027, lg: 1, pos: 3, champ: 1, cup: 2, euro: me }];
    delete CAREER.titles; delete CAREER.rec; delete CAREER.hall; saveCareer();
  });
  await page.reload(); await page.waitForTimeout(600);
  const r = await page.evaluate(() => { ACT.career && 0; careerHub('trophy'); return { titles: CAREER.titles.map(t => t.type + t.year).join(','), shelf: menu.querySelectorAll('.tshelf.won').length, hall: Object.keys(CAREER.hall).length }; });
  ok(r.titles === 'meister2026,pokal2026,euro2027' && r.shelf === 3 && r.hall > 0, JSON.stringify(r));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Vor dem Spiel: Sterne, Form, Bilanz, Topwerfer, Hinspiel und SIMULIEREN', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 23);
  const r = await page.evaluate(() => {
    const read = () => [...menu.querySelectorAll('.duel .tcard')].map(c => ({ stars: [...c.querySelectorAll('.pvst b')].map(b => b.querySelectorAll('path[fill="var(--gold)"]').length),
      form: [...c.querySelectorAll('.pvform i')].map(i => i.textContent), rec: c.querySelector('.pvrec').textContent, top: c.querySelector('.pvtop').textContent, spr: !!c.querySelector('img.pvspr[src^="data:image"]') }));
    // Freundschaftsspiel: Sterne und Topwerfer, keine Form, kein SIMULIEREN
    ACT.kick(); const quick = { sides: read(), sim: !!menu.querySelector('[data-act="pmSim"]'), vs: menu.querySelector('.vs').innerText.trim() };
    // Karriere: bis in die Rückrunde simulieren, dann das nächste Ligaspiel ansehen
    careerCreate(3, 2, 1, 1); let g = 0; while ((CAREER.season.round < 18 || cupDue() || euroDue()) && g++ < 80) ACT.cSim();
    careerHub('home'); ACT.cPlay(); const S = CAREER.season, me = CAREER.team, opp = PM.a === me ? PM.b : PM.a, key = Math.min(me, opp) + '-' + Math.max(me, opp), m = S.meet[key];
    const sides = read(), prev = (menu.querySelector('.pvprev') || {}).innerText || '', mine = sides[PM.a === me ? 0 : 1], T = S.table[me];
    const exp = m && (m.a === PM.a ? `${m.ga}:${m.gb}` : `${m.gb}:${m.ga}`), form = CAREER.formAll[me];
    const meTop = Object.values(S.scorers).filter(x => x.tid === me).sort((a, b) => b.n - a.n)[0];
    const r = { quick, sides, prev, exp, comp: m && m.comp, rec: mine.rec, recExp: `${T.s}-${T.u}-${T.n}`, formOk: mine.form.join('') === form.slice(-5).join(''), top: mine.top, topExp: meTop && meTop.name.toUpperCase(), round: S.round, pre: SCREEN };
    // SIMULIEREN in der Vorschau spielt genau dieses Spiel und führt zurück in die Karriere
    menu.querySelector('[data-act="pmSim"]').click();
    Object.assign(r, { after: CAREER.season.round, screen: SCREEN, hub: !!menu.querySelector('[data-act="cPlay"], [data-act="cEnd"]'), played: CAREER.season.last.some(x => (x[0] === me && x[1] === opp) || (x[0] === opp && x[1] === me)) });
    return r;
  });
  const starsOk = s => s.stars.length === 3 && s.stars.every(n => n >= 1 && n <= 5);
  ok(r.quick.sides.length === 2 && r.quick.sides.every(s => starsOk(s) && s.form.length === 0 && s.spr && /LIGA/.test(s.rec) && /WURF \d+/.test(s.top)) && !r.quick.sim && r.quick.vs === 'VS', 'Freundschaftsspiel: ' + JSON.stringify(r.quick));
  ok(r.pre === 'pre' && r.sides.every(s => starsOk(s) && s.form.length === 5 && s.spr), 'Vorschau Karriere: ' + JSON.stringify(r.sides));
  ok(r.rec.startsWith('PLATZ ') && r.rec.endsWith(r.recExp) && r.formOk, 'Bilanz/Form: ' + JSON.stringify(r));
  ok(r.topExp && r.top.includes(r.topExp) && /TORE?$/.test(r.top), 'Topwerfer: ' + r.top + ' / ' + r.topExp);
  ok(r.comp === 'Liga' && r.prev.includes('HINSPIEL') && r.prev.includes(r.exp), 'Hinspiel: ' + JSON.stringify({ prev: r.prev, exp: r.exp, comp: r.comp }));
  ok(r.screen !== 'pre' && r.hub && r.after === r.round + 1 && r.played, 'SIMULIEREN aus der Vorschau: ' + JSON.stringify(r));
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('Pokal: Sieger mit Vereinsnummer 0 (Magdeburg) bleibt Sieger', async () => {
  const { page, ctx, errors } = await open(DESKTOP, 7);
  const r = await page.evaluate(() => {
    careerCreate(12, 1, 1, 1); while (!CAREER.season.done || cupDue()) ACT.cSim();
    CAREER.cup.winner = 0; const round = CAREER.cup.round, n = CAREER.cup.results.length;
    careerEndSeason(); const h = CAREER.history.slice(-1)[0];
    return { cup: h.cup, round, n };
  });
  ok(r.cup === 0, 'Pokalsieger in der Historie: ' + r.cup + ' statt 0 (Magdeburg)'); ok(!errors.length, errors.join('; ')); await ctx.close();
});

test('TV-Intro mit Aufstellungen läuft vor dem Anwurf', async () => {
  const { page, ctx, errors } = await open(DESKTOP);
  const r = await page.evaluate(() => { startMatch(1, 2, { human: 0, halfLen: 120 }); const ph = G.phase; G.paused = true; for (let i = 0; i < 60; i++) step(1 / 60); return { ph, after: G.phase, t: G.introT }; });
  ok(r.ph === 'intro' && r.after === 'intro', JSON.stringify(r)); ok(!errors.length, errors.join('; ')); await ctx.close();
});

// ---------------------------------------------------------------- Handy-Zoom
test('Handy: kein Zoom mit zwei Daumen, Menü scrollt mit einem Finger', async () => {
  const { page, ctx, errors } = await open(MOBILE);
  const ev = await page.evaluate(() => {
    const ge = new Event('gesturestart', { cancelable: true, bubbles: true }); document.body.dispatchEvent(ge);
    const t = n => { const ts = Array.from({ length: n }, (_, i) => new Touch({ identifier: i, target: document.body, clientX: 100 + i * 200, clientY: 200 })); const e = new TouchEvent('touchmove', { touches: ts, cancelable: true, bubbles: true }); document.body.dispatchEvent(e); return e.defaultPrevented; };
    return { gesture: ge.defaultPrevented, two: t(2), one: t(1) };
  });
  ok(ev.gesture && ev.two && !ev.one, 'Events: ' + JSON.stringify(ev));
  const cdp = await ctx.newCDPSession(page);
  await page.evaluate(() => { document.body.classList.add('touch'); ACT.editor(0); }); await page.waitForTimeout(200);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 420, y: 330 }] });
  for (let i = 1; i < 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 420, y: 330 - i * 20 }] }); await page.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(300);
  ok(await page.evaluate(() => menu.scrollTop) > 50, 'Menü scrollt nicht mit einem Finger');
  await page.evaluate(() => { store.set('hl4_touchtip', 2); hideMenu(); startMatch(SEL.a, SEL.b, { human: 0, halfLen: 180 }); G.introT = 99; });   // Tipp schon gesehen
  await page.waitForFunction(() => G && G.phase === 'play', null, { timeout: 20000 });
  const pts = k => [{ x: 120 + k * 3, y: 250 - k * 2, id: 1 }, { x: 760 - k * 4, y: 300 - k * 3, id: 2 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(0) });
  for (let k = 1; k < 25; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(k) }); await page.waitForTimeout(16); }
  const stick = await page.evaluate(() => Math.hypot(TOUCH.x, TOUCH.y));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(300);
  ok(stick > 0.5, 'Stick reagiert nicht'); ok(await page.evaluate(() => visualViewport.scale) === 1, 'Seite ist gezoomt');
  ok(!errors.length, errors.join('; ')); await ctx.close();
});

// ---------------------------------------------------------------- Ablauf
browser = await chromium.launch(exe ? { executablePath: exe } : {});
let failed = 0;
const sel = tests.filter(t => !only.length || only.some(o => t.name.toLowerCase().includes(o.toLowerCase())));
console.log(`Spiel: ${GAME}\n${sel.length} Tests\n`);
for (const t of sel) {
  const t0 = Date.now();
  try { await t.fn(); console.log(`  ✓ ${t.name} (${((Date.now() - t0) / 1000).toFixed(1)} s)`); }
  catch (e) { failed++; console.log(`  ✗ ${t.name}\n      ${e instanceof Fail ? e.message : e.stack}`); }
}
await browser.close();
console.log(`\n${sel.length - failed} von ${sel.length} bestanden`);
process.exit(failed ? 1 : 0);
