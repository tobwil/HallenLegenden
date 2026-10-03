// Erzeugt Icon und Banner für r/HallenLegenden nach docs/community/.
//   node tools/community/reddit.js
// Braucht playwright (wie tools/promo). Optional: CHROMIUM=/pfad/zu/chromium
const path = require('path');
const { chromium } = require('playwright');

const SEITE = 'file://' + path.join(__dirname, 'reddit.html');
const ZIEL = path.join(__dirname, '../../docs/community');
const BILDER = [
  { teil: 'icon', w: 256, h: 256, datei: 'reddit-icon.png' },
  { teil: 'banner', w: 1920, h: 384, datei: 'reddit-banner.png' },
];

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  for (const b of BILDER) {
    const page = await browser.newPage({ viewport: { width: b.w, height: b.h } });
    await page.goto(SEITE + '?' + b.teil);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(ZIEL, b.datei) });
    await page.close();
    console.log('fertig:', b.datei);
  }
  await browser.close();
})();
