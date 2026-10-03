/* Nimmt Werbe-Material vom Story-Film der Landingpage auf (Einzelbilder als PNG).
   Aufruf: node aufnahme.js <story|anzug|tafel> <Ausgabeordner> [Basis-URL]
   Benötigt Playwright (npm i playwright) und eine laufende lokale Seite, siehe promo.sh. */
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const { chromium } = pw;
const fs = require('fs'), path = require('path');
const [mode, OUT, BASE = 'http://localhost:8765'] = process.argv.slice(2);
if (!mode || !OUT) { console.error('Aufruf: node aufnahme.js <story|anzug|tafel> <ordner> [basis-url]'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

// Zeitpläne: [Sekunde, Scroll-Einheit der Story]. Laufen zügig, Aktionen langsamer.
const PLAN = {
  story: { fps: 15, keys: [[0, 0], [1.4, 0], [2.8, 700], [4.8, 1000], [5.6, 1430], [6.9, 1630], [7.6, 2106], [8.8, 2366], [9.6, 2890], [10.9, 3150], [11.6, 3534], [13.8, 3854], [14.5, 4330], [16.0, 4490], [17.2, 4490]], smooth: true },
  anzug: { fps: 12, keys: [[0, 3470], [0.8, 3534], [5.0, 3854], [5.8, 3900], [6.6, 3900]], smooth: false },
};
const at = (keys, t, smooth) => {
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, u0] = keys[i - 1], [t1, u1] = keys[i], k = (t - t0) / (t1 - t0 || 1);
    return u0 + (u1 - u0) * (smooth ? k * k * (3 - 2 * k) : k);
  }
  return keys[keys.length - 1][1];
};
const launch = () => chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  if (mode === 'tafel') {
    await p.goto('file://' + path.resolve(__dirname, 'abschlusstafel.html'));
    await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(OUT, 'tafel.png') });
    return b.close();
  }
  const plan = PLAN[mode];
  await p.clock.install();                       // Zeit steuern: jedes Bild genau 1/fps später
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  // Story-Film ohne Kopfleiste, Anzeigetafel und deutsche Textkarten, nur das Logo bleibt
  await p.addStyleTag({ content: '.top,.hud,.cap:not(.cap-hero),.cap-hero .tagline,.cap-hero .cta,.cap-hero .platforms,.cap-hero .scroll-hint{display:none!important} .js .cap-hero{top:7vh!important}' });
  await p.clock.runFor(500);
  const n = Math.round(plan.keys[plan.keys.length - 1][0] * plan.fps);
  for (let f = 0; f < n; f++) {
    await p.evaluate(u => { const fm = document.getElementById('film'); scrollTo(0, fm.offsetTop + u * __story.unitPx()); dispatchEvent(new Event('scroll')); }, at(plan.keys, f / plan.fps, plan.smooth));
    await p.clock.runFor(1000 / plan.fps);
    const file = path.join(OUT, `f${String(f).padStart(4, '0')}.png`);
    if (mode === 'story') await p.screenshot({ path: file });
    else {                                        // Anzug: Spielgrafik in Originalpixeln, ohne Texte
      const d = await p.evaluate(() => document.getElementById('story').toDataURL('image/png'));
      fs.writeFileSync(file, Buffer.from(d.split(',')[1], 'base64'));
    }
  }
  console.log(mode, n, 'Bilder');
  await b.close();
})();
