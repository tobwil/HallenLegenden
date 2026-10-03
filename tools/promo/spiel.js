/* Nimmt Presse-Clips direkt aus dem Spiel auf (Einzelbilder als PNG).
   Aufruf: node spiel.js <final-four|aufstellung|spielszene|europapokal> <Ausgabeordner> [Basis-URL]
   Das Spiel läuft dabei Bild für Bild: requestAnimationFrame wird von Hand weitergeschaltet,
   Math.random hat einen festen Startwert. So entsteht bei jedem Aufruf dieselbe Aufnahme.
   Benötigt Playwright (npm i playwright) und eine laufende lokale Seite, siehe promo.sh. */
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const fs = require('fs'), path = require('path');
const [mode, OUT, BASE = 'http://localhost:8765'] = process.argv.slice(2);
const MODES = ['final-four', 'aufstellung', 'spielszene', 'europapokal'];
if (!MODES.includes(mode) || !OUT) { console.error(`Aufruf: node spiel.js <${MODES.join('|')}> <ordner> [basis-url]`); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
const FPS = 30;

// Vor dem Laden: fester Zufall, Bildtakt von Hand, kein Ton
const INIT = seed => {
  let x = seed; Math.random = () => (x = (x * 16807) % 2147483647) / 2147483647;
  let q = [], now = 0;
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.__tick = (n, ms = 1000 / 60) => { for (let i = 0; i < n; i++) { now += ms; const c = q; q = []; c.forEach(f => f(now)); } };
  window.AudioContext = window.webkitAudioContext = undefined; window.speechSynthesis && (window.speechSynthesis.speak = () => { });
};

(async () => {
  const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(INIT, mode === 'spielszene' ? 4242 : 2026);
  const p = await ctx.newPage();
  p.on('pageerror', e => { console.error('Fehler im Spiel:', e.message); process.exitCode = 1; });
  await p.goto(BASE + '/game/', { waitUntil: 'load' });
  await p.evaluate(() => { localStorage.clear(); __tick(30); });
  let f = 0;
  const shot = async () => {                       // Spielgrafik in Originalpixeln (640 × 360)
    const d = await p.evaluate(() => document.getElementById('cv').toDataURL('image/png'));
    fs.writeFileSync(path.join(OUT, `f${String(f++).padStart(4, '0')}.png`), Buffer.from(d.split(',')[1], 'base64'));
  };
  const film = async (sec, until) => {             // sec Sekunden aufnehmen (oder bis until() im Browser wahr ist)
    for (let i = 0; i < sec * FPS; i++) { await p.evaluate(() => __tick(2)); await shot(); if (until && await p.evaluate(until)) break; }
  };
  const skip = cond => p.evaluate(c => { let n = 0; while (!eval(c) && n++ < 60 * 600) __tick(1); return n; }, cond);

  if (mode === 'aufstellung') {
    // TV-Intro eines Ligaspiels: Teamnamen, dann die Aufstellungskarten beider Mannschaften
    await p.evaluate(() => { startMatch(2, 1, { human: 0, halfLen: 180 }); });
    await film(11.4);
  } else if (mode === 'final-four') {
    // Europapokal-Finale: Final-Four-Titel, Spielszene in der neutralen Halle, Pokalübergabe
    await p.evaluate(() => { startMatch(2, 36, { human: -1, halfLen: 150, cup: true, euro: true, event: { title: 'FINAL FOUR', stage: 'EUROPAPOKAL · FINALE', trophy: 'EUROPAPOKAL', final: true }, label: 'EUROPAPOKAL · FINALE' }); G.autoSub = true; });
    await film(3.4);                                 // Titel und Teamnamen
    await p.evaluate(() => { G.introT = 11; });      // Aufstellungen zeigt der eigene Clip
    await film(3.0);
    await skip("G.phase === 'play' && G.clock > 4");
    await film(7);                                   // laufendes Spiel
    // Schlussphase: knappe Führung, die letzten Sekunden laufen live bis zur Pokalübergabe
    await p.evaluate(() => { G.half = 2; G.swap = true; G.score = [27, 26]; G.clock = G.halfLen - 6; G.players.forEach(pl => pl.mins = 55); });
    await film(14, () => G.phase === 'fulltime' && G.phaseT > 4.6);
  } else if (mode === 'spielszene') {
    // Ligaspiel CPU gegen CPU bis zum ersten Tor mit Wiederholung
    // Erster Durchlauf sucht das erste Tor, der zweite (gleicher Zufall) springt bis 7 s davor und filmt Tor und Wiederholung
    const start = () => p.evaluate(() => { startMatch(0, 1, { human: -1, halfLen: 300 }); G.autoSub = true; G.introT = 99; });
    await start();
    const goalAt = await p.evaluate(() => { let n = 0; while (G.score[0] + G.score[1] === 0 && n < 60 * 900) { __tick(1); n++; } return n; });
    await p.goto(BASE + '/game/', { waitUntil: 'load' }); await p.evaluate(() => { localStorage.clear(); __tick(30); });
    await start();
    await p.evaluate(n => __tick(n), Math.max(0, goalAt - 7 * 60));
    await film(30, () => G.phase === 'kickoff' && G.score[0] + G.score[1] > 0);
    await film(1);
  } else {
    // Karriere-Menü: Europapokal-Tab mit Gruppen, Ergebnissen und Turnierbaum (Seitenaufnahme statt Spielgrafik)
    await p.evaluate(() => { careerCreate(0, 1, 1, 1, true, 3); let g = 0; while (CAREER.euro.winner === null && g++ < 200) ACT.cSim(); ACT.cTab('euro'); __tick(5); });
    const box = await p.evaluate(() => { const s = menu.querySelector('.panel') || menu; return s.scrollHeight - s.clientHeight; });
    const pageShot = async () => p.screenshot({ path: path.join(OUT, `f${String(f++).padStart(4, '0')}.png`) });
    const scrollTo = y => p.evaluate(y => { const s = menu.querySelector('.panel') || menu; s.scrollTop = y; __tick(1); }, y);
    for (let i = 0; i < FPS * 2.5; i++) await pageShot();
    const n = FPS * 4; for (let i = 0; i <= n; i++) { const k = i / n; await scrollTo(box * k * k * (3 - 2 * k)); await pageShot(); }
    for (let i = 0; i < FPS * 2.5; i++) await pageShot();
  }
  console.log(mode, f, 'Bilder');
  await b.close();
})();
