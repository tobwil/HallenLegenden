/* Zeichnet Profilbild und Banner für Social Media mit den echten Pixel-Figuren des Spiels, im Stil des Steam-Symbols
   der Desktop-Version:
     profilbild.png      1024 × 1024, das Steam-Symbol ohne Rahmen und Ecken, weil X, Bluesky & Co. rund ausschneiden
     profilbild-400.png  400 × 400 (Größe, die X empfiehlt)
     banner.png          1500 × 500 (X-Header): 375 × 125 Pixel gezeichnet, 4-fach ohne Glättung vergrößert.
                         Unten links bleibt freier Boden, dort liegt bei X das Profilbild
     vorschau.png        grob wie X am Desktop: Banner mit rundem Profilbild, nur zum Ansehen
   Aufruf: node profil.js <Ausgabeordner> [Basis-URL]
   Benötigt Playwright (npm i playwright) und eine laufende lokale Seite, siehe promo.sh. */
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const fs = require('fs'), path = require('path');
const [OUT, BASE = 'http://localhost:8765'] = process.argv.slice(2);
if (!OUT) { console.error('Aufruf: node profil.js <ordner> [basis-url]'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const p = await b.newPage();
  p.on('pageerror', e => { console.error('Fehler im Spiel:', e.message); process.exitCode = 1; });
  await p.goto(BASE + '/game/index.html');
  await p.waitForFunction(() => typeof sprite === 'function' && typeof lookOf === 'function');
  await p.evaluate(() => Promise.all([document.fonts.load('64px "Press Start 2P"'), document.fonts.load('32px "Press Start 2P"')]));

  const bilder = await p.evaluate(() => {
    const leinwand = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const pxOf = g => (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const gross = (c, f) => { const big = leinwand(c.width * f, c.height * f), G = big.getContext('2d'); G.imageSmoothingEnabled = false; G.drawImage(c, 0, 0, big.width, big.height); return big; };
    const O = '#0b0910';

    // Ball wie im Steam-Symbol (10 × 10) oder klein wie im Spiel (6 × 6)
    const ball = (px, bx, by, klein) => {
      if (klein) {
        px(bx + 1, by, 4, 6, O); px(bx, by + 1, 6, 4, O);
        px(bx + 1, by + 1, 4, 4, '#f6f2e4'); px(bx + 1, by + 1, 2, 2, '#2bb3e8'); px(bx + 3, by + 3, 2, 2, '#ffcc00'); return;
      }
      px(bx + 2, by, 6, 10, O); px(bx, by + 2, 10, 6, O); px(bx + 1, by + 1, 8, 8, O);
      px(bx + 2, by + 1, 6, 8, '#f6f2e4'); px(bx + 1, by + 2, 8, 6, '#f6f2e4');
      px(bx + 2, by + 2, 3, 3, '#2bb3e8'); px(bx + 6, by + 4, 2, 4, '#ffcc00'); px(bx + 1, by + 6, 3, 2, '#e2372f');
      px(bx + 3, by + 1, 2, 1, '#ffffff');
    };
    // Unterkante der Figur im Sprite (für schwebende Sprungwürfe)
    const unterkante = s => { const d = s.getContext('2d').getImageData(0, 0, SW, SH).data; let u = 0; for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (d[(y * SW + x) * 4 + 3]) u = y; return u; };

    const heim = { c1: '#ffc83a', c2: '#e2372f', gk: '#3ddc84' };
    const gast = { c1: '#f3ead6', c2: '#2b3a8c', gk: '#7cf2ff' };
    const werfer = { role: 'RL', skin: 1, hair: '#3a2416', style: 1, beard: true, band: true, num: 7, tall: 1, musc: true };

    // ---------- Profilbild: das Steam-Symbol ohne Rahmen und Ecken, damit der Kreis sauber sitzt ----------
    function avatar() {
      const N = 64, c = leinwand(N, N), g = c.getContext('2d'), px = pxOf(g);
      const himmel = ['#241e3c', '#1e1932', '#181428', '#120f1e', '#0c0a14'];
      for (let y = 0; y < 36; y++) px(0, y, N, 1, himmel[Math.min(4, Math.floor(y / 36 * 5))]);
      const fans = ['#3a3050', '#4a3c62', '#2e2742', '#5a4a6e'];
      for (let y = 22; y < 34; y += 3) for (let x = (y % 2); x < N; x += 3) px(x, y, 2, 2, fans[(x * 7 + y * 3) % 4]);
      px(0, 34, N, 3, '#e2372f'); px(0, 35, N, 1, '#ffcc00');
      px(0, 37, N, 27, '#2557b8');
      for (let y = 40; y < N; y += 4) px(0, y, N, 1, '#2a5fc4');
      // Torraum etwas weiter in die Mitte, damit der Kreis ihn noch anschneidet
      for (let y = 37; y < N; y++) for (let x = 0; x < N; x++) {
        const d = ((x - 64) / 30) ** 2 + ((y - 66) / 20) ** 2;
        if (d < 1) px(x, y, 1, 1, d > 0.86 ? '#f3ead6' : '#e8963a');
      }
      const s = sprite(lookOf(werfer, heim), 'wind', 1);
      // Figur zwei Pixel weiter rechts als im Steam-Symbol: Ball und Körper stehen dann mittig im Kreis
      const schatten = 57, sx = 32 - AX, sy = schatten - 5 - unterkante(s);
      px(sx + AX - 7, schatten, 14, 2, 'rgba(0,0,0,.4)');
      g.drawImage(s, sx, sy);
      ball(px, sx + AX - 11, sy + AY - 50);
      return c;
    }

    // ---------- Banner 375 × 125 ----------
    function banner() {
      const W = 375, H = 125, c = leinwand(W, H), g = c.getContext('2d'), px = pxOf(g);
      const BANDE = 68, BODEN = 75;
      // Hallendach mit Scheinwerfern
      px(0, 0, W, BANDE, '#0c0a14');
      px(0, 0, W, 7, '#07060b');
      for (let x = 14; x < W; x += 31) { px(x, 3, 5, 1, '#f3ead6'); px(x + 1, 4, 3, 1, '#9b90ad'); }
      // Tribüne: Reihen von Fans, oben dunkler. Heimblock links in Gold/Rot, Gästeblock rechts in Weiß/Blau
      const reihen = [];
      for (let y = 10; y < BANDE - 3; y += 5) reihen.push(y);
      const dunkel = ['#2e2742', '#3a3050', '#4a3c62', '#5a4a6e'];
      const haut = ['#7a5a4a', '#8a6a52', '#6a4a3a', '#5a3e2e'];
      reihen.forEach((y, r) => {
        const t = r / (reihen.length - 1), versatz = (r % 2) * 2;
        for (let x = versatz; x < W; x += 4) {
          const h = (x * 13 + r * 7) % 17;
          let shirt = dunkel[(x * 7 + r * 3) % 4];
          if (x < 70 && h < 9) shirt = h % 2 ? '#8a6a1e' : '#7a2420';
          if (x > 300 && h < 9) shirt = h % 2 ? '#8a8478' : '#22285a';
          const hell = 0.55 + 0.45 * t;
          g.globalAlpha = hell;
          px(x, y + 2, 3, 3, shirt);
          px(x + (h % 2), y, 2, 2, haut[h % 4]);
          g.globalAlpha = 1;
        }
      });
      // Doppelhalter und Fahnen in der Kurve
      const doppel = [[22, 30, '#f3ead6', '#e2372f'], [44, 46, '#ffc83a', '#e2372f'], [318, 34, '#f3ead6', '#2b3a8c'], [344, 50, '#f3ead6', '#2b3a8c']];
      for (const [x, y, a, z] of doppel) { px(x, y - 4, 1, 9, '#3a2f4d'); px(x + 11, y - 4, 1, 9, '#3a2f4d'); px(x, y - 4, 12, 5, a); px(x + 2, y - 2, 8, 1, z); }
      // Lichtkegel von den Scheinwerfern
      const kegel = (x0, x1) => { const gr = g.createLinearGradient(0, 4, 0, BODEN); gr.addColorStop(0, 'rgba(255,240,200,.10)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(x0, 4); g.lineTo(x0 + 4, 4); g.lineTo(x1 + 30, BODEN); g.lineTo(x1, BODEN); g.fill(); };
      kegel(76, 40); kegel(293, 300);
      // Schatten hinter dem Schriftzug, damit er sich von der Tribüne abhebt
      const vig = g.createRadialGradient(W / 2, 34, 10, W / 2, 34, 150);
      vig.addColorStop(0, 'rgba(7,6,11,.82)'); vig.addColorStop(1, 'rgba(7,6,11,0)');
      g.fillStyle = vig; g.fillRect(0, 0, W, BODEN);
      // Bande wie im Steam-Symbol
      px(0, BANDE, W, 7, '#e2372f'); px(0, BANDE + 3, W, 1, '#ffcc00'); px(0, BANDE, W, 1, '#ff6a52');
      // Hallenboden mit Dielen
      px(0, BODEN, W, H - BODEN, '#2557b8');
      for (let y = BODEN + 3; y < H; y += 4) px(0, y, W, 1, '#2a5fc4');
      // Torraum (6 m) und gestrichelte 9-m-Linie rechts
      const MX = 392, MY = 128;
      for (let y = BODEN; y < H; y++) for (let x = 230; x < W; x++) {
        const d6 = ((x - MX) / 64) ** 2 + ((y - MY) / 40) ** 2, d9 = ((x - MX) / 98) ** 2 + ((y - MY) / 58) ** 2;
        if (d6 < 1) px(x, y, 1, 1, d6 > 0.9 ? '#f3ead6' : '#e8963a');
        else if (d9 < 1 && d9 > 0.93 && (((x + y) >> 2) % 2)) px(x, y, 1, 1, '#f3ead6');
      }
      // Tor: Pfosten rot-weiß, Netz nach rechts
      const TX = 362, TO = 80, TU = 112;
      for (let y = TO; y < TU; y += 2) for (let x = TX + 3; x < W; x += 3) px(x, y, 1, 1, 'rgba(243,234,214,.55)');
      for (let y = TO; y <= TU; y++) px(TX, y, 2, 1, ((y - TO) >> 2) % 2 ? '#f3ead6' : '#e2372f');
      for (let x = TX; x < W; x++) px(x, TO, 1, 2, ((x - TX) >> 2) % 2 ? '#f3ead6' : '#e2372f');
      px(TX - 1, TU + 1, 5, 1, 'rgba(0,0,0,.35)');

      // Figuren: Fußpunkt (fx, fy), Höhe über dem Boden, Blickrichtung
      const figur = (spieler, kit, pose, fr, fx, fy, hoch = 0, flip = false) => {
        const s = sprite(lookOf(spieler, kit), pose, fr, flip);
        px(fx - 7, fy, 14, 2, 'rgba(0,0,0,.35)');
        g.drawImage(s, fx - AX, fy - hoch - AY);
        return { sx: fx - AX, sy: fy - hoch - AY };
      };
      // Links: Rückraum läuft mit, rechts: Sprungwurf über den Kreis, Abwehr im Block, Torwart
      figur({ role: 'RM', skin: 3, hair: '#1a1210', style: 2, beard: false, band: false, num: 11, tall: 0 }, heim, 'run', 2, 132, 116);
      figur({ role: 'RR', skin: 0, hair: '#c9a060', style: 0, beard: false, band: false, num: 23, tall: 0 }, gast, 'def', 0, 182, 108, 0, true);
      const w = figur(werfer, heim, 'wind', 1, 268, 117, 9);
      ball(px, w.sx + AX - 6 - 3, w.sy + AY - 43 - 5, true);
      figur({ role: 'KM', skin: 2, hair: '#2a1a12', style: 3, beard: true, band: false, num: 4, tall: 1, musc: true }, gast, 'block', 0, 306, 112, 4, true);
      figur({ role: 'TW', skin: 1, hair: '#5a3a22', style: 1, beard: false, band: false, num: 1, tall: 1 }, gast, 'star', 0, 344, 108, 0, true);
      return c;
    }

    const av = avatar(), ba = banner();
    const avBig = gross(av, 16);
    // 400 × 400 aus dem großen Bild (X verkleinert sowieso)
    const av400 = leinwand(400, 400); { const G = av400.getContext('2d'); G.imageSmoothingEnabled = true; G.imageSmoothingQuality = 'high'; G.drawImage(avBig, 0, 0, 400, 400); }

    // Schriftzug in voller Auflösung: Press Start 2P mit 64 px = 8 px je Schriftpixel = 2 Bannerpixel
    const head = gross(ba, 4), G = head.getContext('2d');
    G.textAlign = 'center'; G.textBaseline = 'top';
    G.font = '64px "Press Start 2P"';
    const logo = 'HALLEN-LEGENDEN', LX = 750, LY = 66;
    for (const [dy, col] of [[24, '#000000'], [16, '#7a2c0c'], [8, '#c96a12'], [0, '#ffc83a']]) { G.fillStyle = col; G.fillText(logo, LX, LY + dy); }
    G.font = '32px "Press Start 2P"';
    const sub = 'RETRO-HANDBALL';
    if ('letterSpacing' in G) G.letterSpacing = '8px';
    for (const [dy, col] of [[8, '#000000'], [4, '#ff4f3a'], [0, '#f3ead6']]) { G.fillStyle = col; G.fillText(sub, LX + 4, LY + 108 + dy); }

    // Vorschau wie bei X am Desktop: Banner 600 × 200, Profilbild 134 px rund, links unten überlappend
    const vw = 600, vor = leinwand(vw, 330), V = vor.getContext('2d');
    V.fillStyle = '#000'; V.fillRect(0, 0, vw, 330);
    V.drawImage(head, 0, 0, vw, 200);
    V.save(); V.beginPath(); V.arc(16 + 67, 200, 71, 0, 7); V.fillStyle = '#000'; V.fill(); V.beginPath(); V.arc(16 + 67, 200, 67, 0, 7); V.clip();
    V.drawImage(avBig, 16, 133, 134, 134); V.restore();
    V.fillStyle = '#e7e9ea'; V.font = 'bold 20px system-ui, sans-serif'; V.fillText('Hallen-Legenden', 16, 300);
    V.fillStyle = '#71767b'; V.font = '15px system-ui, sans-serif'; V.fillText('@hallenlegenden', 16, 322);

    return { avatar1024: avBig.toDataURL('image/png'), avatar400: av400.toDataURL('image/png'), header: head.toDataURL('image/png'), vorschau: vor.toDataURL('image/png') };
  });

  await b.close();
  const schreib = (name, url) => fs.writeFileSync(path.join(OUT, name), Buffer.from(url.split(',')[1], 'base64'));
  schreib('profilbild.png', bilder.avatar1024);
  schreib('profilbild-400.png', bilder.avatar400);
  schreib('banner.png', bilder.header);
  schreib('vorschau.png', bilder.vorschau);
})();
