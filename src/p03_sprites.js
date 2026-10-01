// ================= Pixel-Sprites: prozedural, mit Umriss & Schattierung =================
const SW = 36, SH = 56, AX = 18, AY = 53;          // Sprite-Leinwand, Fußpunkt
const OUTLINE = '#0b0910';
const DIGITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001010010', '111101111101111', '111101111001111'];
function drawDigits(g, n, x, y, col, scale = 1) {
  const s = String(n); g.fillStyle = col;
  [...s].forEach((d, k) => { const m = DIGITS[+d]; for (let i = 0; i < 15; i++) if (m[i] === '1') g.fillRect(x + k * 4 * scale + (i % 3) * scale, y + ((i / 3) | 0) * scale, scale, scale); });
}
const digitsW = (n, scale = 1) => String(n).length * 4 * scale - scale;

// Posen: Gelenkpositionen relativ zum Fußpunkt (Blick nach rechts). k=Knie, f=Fuß, e=Ellbogen, h=Hand. b=Rumpfversatz
// Laufzyklus mit 6 Schlüsselbildern: Aufsetzen, Stütz, Abdruck, Rückschwung, Kniehub, Vorschwung
const RUN_LEG = [{ k: [4, -12], f: [6, 0] }, { k: [3, -11], f: [2, 0] }, { k: [1, -11], f: [-3, -1] }, { k: [-1, -12], f: [-7, -6] }, { k: [4, -15], f: [0, -9] }, { k: [7, -15], f: [7, -6] }];
const RUN_ARM = [{ e: [4, -24], h: [8, -28] }, { e: [2, -23], h: [6, -25] }, { e: [-1, -23], h: [1, -19] }, { e: [-4, -24], h: [-4, -19] }, { e: [-2, -23], h: [0, -19] }, { e: [2, -23], h: [6, -24] }];
function runPose(fr, ball) {
  return { lf: RUN_LEG[fr % 6], lb: RUN_LEG[(fr + 3) % 6], af: ball ? { e: [5, -24], h: [9, -19 + (fr % 3)] } : RUN_ARM[(fr + 3) % 6], ab: RUN_ARM[fr % 6], b: [1, fr % 3 === 1 ? -1 : 0] };
}
const POSES = {
  idle: fr => ({ lf: { k: [3, -11], f: [3, 0] }, lb: { k: [-2, -11], f: [-3, 0] }, af: { e: [4, -24], h: [5, -18] }, ab: { e: [-4, -24], h: [-5, -18] }, b: [0, fr ? 1 : 0] }),
  def: fr => ({ lf: { k: [6, -9], f: [5, 0] }, lb: { k: [-4, -9], f: [-5, 0] }, af: { e: [7, -33], h: [8, -40 - fr] }, ab: { e: [-5, -33], h: [-6, -40 - fr] }, b: [0, 2] }),
  run: fr => runPose(fr, false),
  drib: fr => runPose(fr, true),
  hold: fr => ({ lf: { k: [3, -11], f: [3, 0] }, lb: { k: [-2, -11], f: [-3, 0] }, af: { e: [5, -25], h: [9, -22] }, ab: { e: [-2, -25], h: [6, -21] }, b: [0, fr ? 1 : 0] }),
  jump: () => ({ lf: { k: [5, -14], f: [2, -7] }, lb: { k: [-1, -12], f: [-6, -6] }, af: { e: [6, -31], h: [9, -36] }, ab: { e: [-6, -30], h: [-9, -34] }, b: [0, 0] }),
  wind: fr => ({ lf: fr ? { k: [6, -15], f: [3, -8] } : { k: [5, -10], f: [7, 0] }, lb: fr ? { k: [-2, -12], f: [-7, -7] } : { k: [-3, -11], f: [-6, 0] }, af: { e: [-3, -37], h: [-6, -43] }, ab: { e: [5, -29], h: [11, -31] }, b: [-1, 0] }),
  throw: fr => ({ lf: fr ? { k: [6, -13], f: [7, -6] } : { k: [6, -10], f: [8, 0] }, lb: fr ? { k: [-2, -12], f: [-7, -8] } : { k: [-2, -11], f: [-7, -1] }, af: { e: [7, -31], h: [12, -26] }, ab: { e: [-5, -27], h: [-9, -24] }, b: [2, 0] }),
  fall: () => ({ lf: { k: [3, -12], f: [-2, -9] }, lb: { k: [-2, -10], f: [-8, -9] }, af: { e: [8, -30], h: [13, -28] }, ab: { e: [-4, -30], h: [-7, -36] }, b: [4, 3] }),
  block: () => ({ lf: { k: [3, -13], f: [1, -6] }, lb: { k: [-2, -12], f: [-4, -5] }, af: { e: [4, -41], h: [5, -49] }, ab: { e: [-3, -41], h: [-3, -49] }, b: [0, 0] }),
  star: () => ({ lf: { k: [5, -10], f: [10, -2] }, lb: { k: [-5, -10], f: [-10, -2] }, af: { e: [8, -37], h: [12, -46] }, ab: { e: [-8, -37], h: [-12, -46] }, b: [0, 0] }),
  split: () => ({ lf: { k: [7, -6], f: [14, 0] }, lb: { k: [-7, -6], f: [-13, 0] }, af: { e: [8, -20], h: [14, -17] }, ab: { e: [-8, -20], h: [-14, -17] }, b: [0, 6] }),
  gk: fr => ({ lf: { k: [6, -9], f: [6, 0] }, lb: { k: [-5, -9], f: [-6, 0] }, af: { e: [8, -27], h: [10, -33 - fr] }, ab: { e: [-7, -27], h: [-9, -33 - fr] }, b: [0, 3] }),
  cheer: fr => { const r = runPose(fr, false); r.af = { e: [5, -39], h: [7, -47] }; r.ab = { e: [-4, -39], h: [-5, -47] }; return r; },
  slide: () => ({ lf: { k: [4, -2], f: [-4, -1] }, lb: { k: [1, -2], f: [-7, -1] }, af: { e: [5, -32], h: [8, -41] }, ab: { e: [-4, -32], h: [-5, -41] }, b: [0, 9] }),
  steal: () => ({ lf: { k: [7, -9], f: [10, 0] }, lb: { k: [-3, -10], f: [-7, 0] }, af: { e: [8, -24], h: [14, -21] }, ab: { e: [-4, -26], h: [-7, -21] }, b: [2, 2] }),
  stumble: () => ({ lf: { k: [4, -10], f: [8, 0] }, lb: { k: [-3, -9], f: [-8, -2] }, af: { e: [7, -22], h: [11, -16] }, ab: { e: [-6, -28], h: [-10, -34] }, b: [3, 1] }),
  sit: () => ({ lf: { k: [6, -9], f: [6, 0] }, lb: { k: [5, -9], f: [5, 0] }, af: { e: [4, -18], h: [7, -16] }, ab: { e: [-3, -18], h: [3, -15] }, b: [0, 7] }),
};

function lookOf(p, kit) {
  const gk = p.role === 'TW', sk = SKIN[p.skin];
  const jer = gk ? kit.gk : kit.c1, trim = gk ? shade(kit.gk, 0.5) : kit.c2;
  return { gk, jer, jerS: shade(jer, 0.7), jerH: mix(jer, '#ffffff', 0.3), trim, sho: gk ? shade(kit.gk, 0.45) : kit.c2,
    sock: lum(kit.c1) > 0.8 ? kit.c2 : kit.c1, shoe: gk ? '#f2f2f2' : (p.num % 3 ? '#f2f2f2' : kit.c2),
    skin: sk[0], skinS: sk[1], hair: p.hair, style: p.style, beard: p.beard, band: p.band, num: p.num,
    numCol: lum(jer) > 0.6 ? shade(trim, 0.9) : (colDist(trim, jer) > 120 ? trim : '#ffffff'), tall: p.tall, key: `${jer}|${trim}|${p.skin}|${p.hair}|${p.style}|${+p.beard}|${+p.band}|${p.num}|${+gk}|${+p.tall}` };
}

const SPR = new Map();
function sprite(look, pose, fr, flip = false) {
  const key = look.key + '|' + pose + '|' + fr + '|' + +flip;
  let c = SPR.get(key); if (c) return c;
  c = renderSprite(look, pose, fr, flip); SPR.set(key, c);
  if (SPR.size > 3000) SPR.clear();
  return c;
}
function renderSprite(L, pose, fr, flip = false) {
  const base = document.createElement('canvas'); base.width = SW; base.height = SH;
  const g = base.getContext('2d');
  const P = (POSES[pose] || POSES.idle)(fr);
  const t = L.tall ? -1 : 0;
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(flip ? AX - x - w : AX + x, AY + y, w, h); };
  const brush = (x1, y1, x2, y2, w, c) => { const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1); for (let i = 0; i <= n; i++) { const k = i / n; R(Math.round(lerp(x1, x2, k) - (w >> 1)), Math.round(lerp(y1, y2, k) - (w >> 1)), w, w, c); } };
  // Gliedmaße aus Segmenten; vordere bekommen eine eigene Kontur, damit sie sich vom Körper absetzen
  const limb = (segs, outline) => { if (outline) segs.forEach(s => brush(s[0], s[1], s[2], s[3], s[4] + 2, OUTLINE)); segs.forEach(s => brush(...s)); };
  const [bx, by] = P.b;
  const hipY = -19 + by + t, shY = -32 + by + t * 2, hx = bx;
  const leg = (Lg, back) => {
    const hip = [hx + (back ? -2 : 2), hipY], [kx, ky] = Lg.k, [fx, fy] = Lg.f, mx = (kx + fx) / 2, my = (ky + fy) / 2;
    const d = back ? 0.72 : 1, skin = back ? L.skinS : L.skin, sock = shade(L.sock, d), pant = shade(L.sho, back ? 0.75 : 1);
    if (L.gk) limb([[hip[0], hip[1], kx, ky, 4, pant], [kx, ky, fx, fy - 2, 4, pant]], !back);
    else limb([[hip[0], hip[1], kx, ky, 4, skin], [kx, ky, mx, my, 3, skin], [mx, my, fx, fy - 2, 3, sock]], !back);
    if (!back && !L.gk) R(kx, ky - 1, 1, 1, mix(L.skin, '#ffffff', 0.3));
    // Schuh mit Sohle und Streifen
    if (!back) R(fx - 2, fy - 3, 7, 4, OUTLINE);
    R(fx - 1, fy - 2, 5, 2, shade(L.shoe, d)); R(fx - 1, fy, 5, 1, back ? '#3a3a40' : '#55555c'); R(fx + 1, fy - 2, 1, 2, shade(L.trim, d));
  };
  const arm = (A, back) => {
    const sh = [hx + (back ? -3 : 3), shY + 2], ex = A.e[0] + bx, ey = A.e[1] + by + t, hx2 = A.h[0] + bx, hy = A.h[1] + by + t;
    const skin = back ? L.skinS : L.skin, jer = back ? L.jerS : L.jer;
    const sx2 = lerp(sh[0], ex, 0.45), sy2 = lerp(sh[1], ey, 0.45);
    limb(L.gk ? [[sh[0], sh[1], ex, ey, 3, jer], [ex, ey, hx2, hy, 3, jer]] : [[sh[0], sh[1], ex, ey, 3, skin], [sh[0], sh[1], sx2, sy2, 4, jer], [ex, ey, hx2, hy, 2, skin]], !back);
    R(hx2 - 1, hy - 1, 3, 3, L.gk ? '#ececec' : skin); R(hx2 - 1, hy + 1, 3, 1, L.gk ? '#bdbdbd' : L.skinS);
    if (!L.gk && !back && L.band) R(Math.round(lerp(ex, hx2, 0.7)) - 1, Math.round(lerp(ey, hy, 0.7)), 3, 1, L.trim);
  };
  leg(P.lb, true); arm(P.ab, true);
  leg(P.lf, false);
  // Hose (über den Oberschenkeln)
  R(hx - 5, hipY - 2, 10, 6, L.sho); R(hx - 5, hipY - 2, 2, 6, shade(L.sho, 0.78)); R(hx + 4, hipY - 1, 1, 4, L.trim);
  R(hx - 5, hipY + 3, 4, 1, shade(L.sho, 0.65)); R(hx + 1, hipY + 3, 4, 1, shade(L.sho, 0.85));
  // Rumpf als Trapez: breite Schultern, schmale Taille
  const tH = hipY - 1 - shY;
  for (let r = 0; r < tH; r++) {
    const k = r / Math.max(1, tH - 1), l = Math.round(lerp(-6, -4, k)), rr = Math.round(lerp(5, 4, k)), y = shY + r;
    R(hx + l, y, rr - l + 1, 1, L.jer); R(hx + l, y, 3, 1, L.jerS); R(hx + rr, y, 1, 1, r < tH * 0.6 ? L.jerH : L.jer);
  }
  R(hx - 6, shY, 12, 1, L.trim); R(hx - 1, shY, 4, 2, L.skinS); R(hx, shY + 2, 2, 1, L.trim);
  R(hx - 4, hipY - 2, 9, 1, shade(L.jer, 0.8));
  const dx0 = AX + hx - Math.floor(digitsW(L.num) / 2) + 1;
  drawDigits(g, L.num, flip ? 2 * AX - dx0 - digitsW(L.num) : dx0, AY + shY + 4, L.numCol);
  // Kopf mit abgerundeten Ecken, Ohr, Auge, Nase
  const hy = shY - 10, hxx = hx - 3;
  R(hx - 1, shY - 2, 4, 3, L.skinS);
  R(hxx + 1, hy, 6, 9, L.skin); R(hxx, hy + 1, 8, 7, L.skin); R(hxx + 8, hy + 3, 1, 3, L.skin);
  R(hxx, hy + 1, 2, 7, L.skinS); R(hxx + 2, hy + 8, 5, 1, L.skinS);
  R(hxx + 2, hy + 4, 2, 2, shade(L.skinS, 0.85));
  R(hxx + 5, hy + 3, 2, 2, '#f4f0ea'); R(hxx + 6, hy + 3, 1, 2, '#1a1010');
  R(hxx + 5, hy + 2, 3, 1, shade(L.hair, 0.75)); R(hxx + 7, hy + 7, 1, 1, shade(L.skinS, 0.8));
  R(hxx + 4, hy + 1, 2, 1, mix(L.skin, '#ffffff', 0.35));
  const H = L.hair, HL = mix(H, '#ffffff', 0.25);
  switch (L.style) {
    case 0: R(hxx + 1, hy - 1, 7, 2, H); R(hxx, hy, 2, 4, H); R(hxx + 3, hy - 1, 3, 1, HL); break;
    case 1: R(hxx + 1, hy - 1, 6, 1, H); R(hxx, hy, 1, 3, H); break;
    case 2: R(hxx, hy - 2, 8, 3, H); R(hxx - 1, hy, 3, 8, H); R(hxx, hy + 1, 8, 1, L.trim); R(hxx + 2, hy - 2, 3, 1, HL); break;
    case 3: R(hxx + 3, hy + 1, 2, 1, mix(L.skin, '#fff', 0.45)); break;
    case 4: R(hxx, hy - 3, 9, 4, H); R(hxx - 1, hy - 1, 3, 6, H); R(hxx + 2, hy - 3, 3, 1, HL); break;
    default: R(hxx + 1, hy - 1, 7, 2, H); R(hxx - 2, hy - 2, 3, 3, H); R(hxx, hy, 1, 4, H);
  }
  if (L.beard) { R(hxx + 2, hy + 6, 6, 3, shade(H, 0.9)); R(hxx + 6, hy + 7, 2, 1, L.skinS); }
  arm(P.af, false);
  // äußere Kontur
  const out = document.createElement('canvas'); out.width = SW; out.height = SH;
  const o = out.getContext('2d'), src = g.getImageData(0, 0, SW, SH), dst = o.createImageData(SW, SH), s = src.data, d = dst.data;
  const oc = hexRgb(OUTLINE);
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    const i = (y * SW + x) * 4;
    if (s[i + 3] > 0) { d[i] = s[i]; d[i + 1] = s[i + 1]; d[i + 2] = s[i + 2]; d[i + 3] = 255; continue; }
    const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < SW && yy < SH && s[(yy * SW + xx) * 4 + 3] > 0;
    if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) { d[i] = oc[0]; d[i + 1] = oc[1]; d[i + 2] = oc[2]; d[i + 3] = 255; }
  }
  o.putImageData(dst, 0, 0);
  return out;
}
// liegender Spieler: Idle-Sprite um 90° gedreht
function lieSprite(look) {
  const key = look.key + '|lie'; let c = SPR.get(key); if (c) return c;
  const s = sprite(look, 'idle', 0); c = document.createElement('canvas'); c.width = SH; c.height = SW;
  const g = c.getContext('2d'); g.translate(SH - 2, 0); g.rotate(Math.PI / 2); g.drawImage(s, 0, 0); SPR.set(key, c); return c;
}

// ================= Porträts für Spielerkarten =================
const PORT = new Map();
function portrait(p, kit) {
  const L = lookOf(p, kit), key = L.key + '|port';
  if (PORT.has(key)) return PORT.get(key);
  const c = document.createElement('canvas'); c.width = 40; c.height = 40; const g = c.getContext('2d');
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  for (let y = 0; y < 40; y++) R(0, y, 40, 1, mix(shade(L.jer, 0.35), shade(L.jer, 0.75), y / 40));
  for (let i = 0; i < 40; i += 4) R(i, 0, 1, 40, 'rgba(255,255,255,0.05)');
  // Schultern & Trikot
  R(4, 31, 32, 9, L.jer); R(4, 31, 6, 9, L.jerS); R(30, 32, 4, 8, L.jerH); R(15, 30, 10, 2, L.trim); R(17, 32, 6, 2, L.skinS);
  drawDigits(g, L.num, 20 - Math.floor(digitsW(L.num) / 2), 34, L.numCol);
  // Hals & Kopf
  R(16, 25, 8, 7, L.skinS);
  R(11, 9, 18, 19, L.skin); R(11, 9, 3, 19, L.skinS); R(13, 26, 14, 2, L.skinS); R(9, 15, 2, 5, L.skinS); R(29, 15, 2, 5, L.skinS);
  R(14, 15, 4, 2, '#fff'); R(22, 15, 4, 2, '#fff'); R(16, 15, 2, 2, '#1a1010'); R(24, 15, 2, 2, '#1a1010');
  R(14, 13, 4, 1, shade(L.hair, 0.7)); R(22, 13, 4, 1, shade(L.hair, 0.7));
  R(19, 17, 2, 4, L.skinS); R(18, 21, 4, 1, shade(L.skinS, 0.85)); R(16, 23, 8, 1, shade(L.skinS, 0.75));
  const H = L.hair;
  switch (L.style) {
    case 0: R(11, 6, 18, 5, H); R(10, 8, 2, 7, H); R(28, 8, 2, 6, H); R(14, 6, 6, 1, mix(H, '#fff', 0.25)); break;
    case 1: R(11, 7, 18, 3, H); R(10, 9, 1, 5, H); R(29, 9, 1, 5, H); break;
    case 2: R(10, 5, 20, 6, H); R(8, 8, 3, 18, H); R(29, 8, 3, 18, H); R(10, 10, 20, 2, L.trim); break;
    case 3: R(15, 10, 5, 1, mix(L.skin, '#fff', 0.45)); break;
    case 4: R(9, 2, 22, 9, H); R(8, 6, 3, 10, H); R(29, 6, 3, 10, H); R(13, 3, 5, 1, mix(H, '#fff', 0.25)); break;
    default: R(11, 6, 18, 4, H); R(17, 2, 6, 4, H); R(10, 8, 2, 5, H); R(28, 8, 2, 5, H);
  }
  if (L.beard) { R(12, 21, 16, 7, shade(H, 0.9)); R(16, 22, 8, 1, L.skinS); R(16, 23, 8, 1, shade(L.skinS, 0.75)); }
  PORT.set(key, c); return c;
}
// Trikot-Symbol für Teamauswahl
function jerseyIcon(K) {
  const c = document.createElement('canvas'); c.width = 24; c.height = 24; const g = c.getContext('2d');
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  R(3, 4, 18, 19, OUTLINE); R(0, 5, 24, 8, OUTLINE);
  R(4, 5, 16, 17, K.c1); R(1, 6, 5, 6, K.c1); R(18, 6, 5, 6, K.c1);
  R(4, 5, 4, 17, shade(K.c1, 0.8)); R(16, 6, 1, 12, mix(K.c1, '#ffffff', 0.3)); R(9, 5, 6, 2, K.c2); R(10, 7, 4, 1, shade(K.c1, 0.6));
  R(1, 10, 5, 2, K.c2); R(18, 10, 5, 2, K.c2);
  drawDigits(g, 10, 8, 11, lum(K.c1) > 0.6 ? K.c2 : (colDist(K.c1, K.c2) > 100 ? K.c2 : '#fff'));
  return c;
}
