/* Nimmt Standbilder für README und Landingpage auf (PNG, 1280 × 720, Handy 1278 × 590): Titelbildschirm, Spielszene, Teamauswahl, Karriere
   (Zeitung, Statistik, Pokal, Europapokal, Kader, Spielerkarte, Scouting-Karte, Erfolge), Vor dem Spiel, Teilen-Bild und Handy im Querformat.
   Aufruf: node bilder.js <Ausgabeordner> [Basis-URL]
   Fester Zufall: die Menübilder sind bei jedem Aufruf gleich (das Handybild läuft in Echtzeit und kann leicht abweichen). promo.sh wandelt sie in JPG für docs/screenshots/ um.
   Benötigt Playwright (npm i playwright) und eine laufende lokale Seite, siehe promo.sh. */
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const fs = require('fs'), path = require('path');
const [OUT, BASE = 'http://localhost:8765'] = process.argv.slice(2);
if (!OUT) { console.error('Aufruf: node bilder.js <ordner> [basis-url]'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
// Das Demo-Spiel im Hintergrund verbraucht laufend Zufallszahlen: daher vor jedem Schritt neu setzen (__seed)
const SEED = s => { window.__seed = s => { let x = s; Math.random = () => (x = (x * 16807) % 2147483647) / 2147483647; }; window.__seed(s); window.AudioContext = window.webkitAudioContext = undefined; };

(async () => {
  const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const open = async (seed, opts = { viewport: { width: 1280, height: 720 } }) => {
    const ctx = await b.newContext(opts); await ctx.addInitScript(SEED, seed);
    const p = await ctx.newPage(); p.on('pageerror', e => { console.error('Fehler im Spiel:', e.message); process.exitCode = 1; });
    await p.goto(BASE + '/game/index.html'); await p.waitForTimeout(700); return { p, ctx };
  };
  const shot = (p, name) => p.screenshot({ path: path.join(OUT, name + '.png') });

  // Titelbildschirm (Demo-Spiel im Hintergrund, Copyright-Zeile)
  { const { p, ctx } = await open(2026);
    await p.waitForTimeout(1500); await shot(p, 'title-screen'); await ctx.close(); }

  // Spielszene: Kiel gegen Flensburg kurz nach dem Anpfiff, Name über dem eigenen Spieler
  { const { p, ctx } = await open(2026);
    await p.evaluate(() => { __seed(2026); startMatch(TEAMS.find(t => t.k === 'KIE').id, TEAMS.find(t => t.k === 'FLE').id, { human: 0, halfLen: 180 }); G.introT = 99; });
    await p.waitForFunction(() => G && G.phase === 'play', null, { timeout: 20000 }); await p.waitForTimeout(1200);
    await shot(p, 'gameplay'); await ctx.close(); }

  // Schnelles Spiel: Kiel gegen Flensburg
  { const { p, ctx } = await open(2026);
    await p.evaluate(() => { ACT.main(); ACT.quick(); SEL.a = TEAMS.find(t => t.k === 'KIE').id; SEL.b = TEAMS.find(t => t.k === 'FLE').id; ACT.quick(); document.activeElement.blur(); });
    await shot(p, 'team-selection'); await ctx.close(); }

  // Kiel (Co-Trainer stellt auf, wie ein Spieler, der rotiert), eine Saison mit 17 Spieltagen: Zeitung zum Start, Statistik und Pokal nach 9 Spieltagen, Europapokal am Saisonende
  { const { p, ctx } = await open(2026);
    await p.evaluate(() => { __seed(2026); G = null; careerCreate(TEAMS.find(t => t.k === 'KIE').id, 1, 1, 1, true, 1); careerHub('home'); document.activeElement.blur(); });
    await shot(p, 'career-newspaper');
    await p.evaluate(() => { __seed(2027); let g = 0; while ((CAREER.season.round < 9 || cupDue() || euroDue()) && g++ < 40) ACT.cSim(); ACT.cTab('stats'); document.activeElement.blur(); });
    await shot(p, 'career-stats');
    await p.evaluate(() => { ACT.cTab('cup'); document.activeElement.blur(); }); await shot(p, 'career-cup');
    await p.evaluate(() => { __seed(2028); let g = 0; while ((!CAREER.season.done || cupDue() || euroDue()) && g++ < 80) ACT.cSim(); ACT.cTab('euro'); document.activeElement.blur(); const sc = [...menu.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY)); if (sc) sc.scrollTop = sc.scrollHeight; });
    await shot(p, 'career-euro');   /* ans Ende gescrollt: K.-o.-Phase bis zum Sieger */ await ctx.close(); }

  // Vor dem Spiel: Kiel in der Rückrunde, Vergleich mit Form, Bilanz, Sternen und Hinspiel
  { const { p, ctx } = await open(2026);
    await p.evaluate(() => { __seed(2026); G = null; careerCreate(TEAMS.find(t => t.k === 'KIE').id, 2, 1, 1, true, 1); let g = 0; while ((CAREER.season.round < 21 || cupDue() || euroDue()) && g++ < 90) ACT.cSim(); careerHub('home'); ACT.cPlay(); });
    await shot(p, 'prematch'); await ctx.close(); }

  // Kiel über fünf Saisons (17 Spieltage): Pokal, Meisterschaft und Europapokal. Dann Erfolge, Kader mit Potenzial zur Saisonmitte, Karriere als Bild
  { const { p, ctx } = await open(19);
    await p.evaluate(() => {
      __seed(19); G = null; careerCreate(TEAMS.find(t => t.k === 'KIE').id, 1, 1, 0);
      for (let s = 0; s < 5; s++) { let g = 0; while ((!CAREER.season.done || cupDue() || euroDue()) && g++ < 200) ACT.cSim(); ACT.cEnd(); ACT.cNext(); }
      ACT.cTab('trophy'); document.activeElement.blur();
    });
    await shot(p, 'career-trophies');
    await p.evaluate(() => { __seed(20); for (let i = 0; i < 8; i++) ACT.cSim(); ACT.cTab('squad'); document.activeElement.blur(); }); await shot(p, 'career-squad');
    await p.evaluate(() => { const sq = CAREER.squads[CAREER.team], w = sq.find(q => q.name === 'Weidenhammer') || sq.find(q => q.start && q.role !== 'TW'); ACT.cCapt(w.pid); ACT.cPick(w.pid); CSTAT = false; ACT.cStat(); document.activeElement.blur(); }); await shot(p, 'player-card');
    await p.evaluate(() => { CSTAT = false; ACT.cPick(); });
    // Scouting-Karte: Feldspieler eines Ligavereins mit den meisten Spielen, Werte mit Abstand zum eigenen Stammspieler
    await p.evaluate(() => { ACT.cTab('market'); const m = CAREER.market.filter(x => x.from >= 0 && marketPlayer(x).role !== 'TW').sort((a, b) => statOf(marketPlayer(b), 'k').sp - statOf(marketPlayer(a), 'k').sp)[0] || CAREER.market[0]; ACT.cScout(m.pid); document.activeElement.blur(); }); await shot(p, 'transfer-scout');
    await p.evaluate(() => ACT.cTab('squad'));
    await p.evaluate(() => { __seed(21); return shareCard('career'); }); await p.waitForSelector('#menu img.sharecard'); await p.waitForTimeout(300);
    await shot(p, 'share-card'); await ctx.close(); }

  // Handy quer: Spielfeld über die volle Breite, durchscheinende Touch-Knöpfe. Läuft in Echtzeit: Liegt gerade ein Pfiff an (Foul, Freiwurf), neu aufnehmen
  for (let k = 0; k < 4; k++) {
    const { p, ctx } = await open(4242, { viewport: { width: 852, height: 393 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1.5 });
    await p.evaluate(() => { localStorage.setItem('hl4_touchtip', '9'); document.body.classList.add('touch'); startMatch(TEAMS.find(t => t.k === 'KIE').id, TEAMS.find(t => t.k === 'FLE').id, { human: 0, halfLen: 180 }); G.introT = 99; });
    await p.waitForFunction(() => G && G.phase === 'play', null, { timeout: 20000 }); await p.waitForTimeout(2500);
    const clean = await p.evaluate(() => G.phase === 'play');
    if (clean || k === 3) await shot(p, 'mobile');
    await ctx.close(); if (clean) break;
  }

  await b.close();
})();
