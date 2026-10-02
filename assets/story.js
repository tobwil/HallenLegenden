/* Hallen-Legenden: Story-Film der Landingpage.
   Eine Pixel-Figur läuft beim Scrollen von links nach rechts durch sieben Szenen.
   Die Spieler-Sprites stammen aus dem Spiel (src/p03_sprites.js), ergänzt um Anzug und ein paar Posen. */
(() => {
'use strict';

// ================= Helfer (wie src/p01_core.js) =================
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const seg = (q, a, b) => clamp((q - a) / (b - a), 0, 1); // 0..1 innerhalb [a, b]
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function shade(h, f) { const c = hexRgb(h); return rgbHex(c[0] * f, c[1] * f, c[2] * f); }
function mix(a, b, t) { const x = hexRgb(a), y = hexRgb(b); return rgbHex(lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)); }
const lum = h => { const c = hexRgb(h); return (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255; };
const hash = (i, j = 0) => { let h = (i * 374761393 + j * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const SKIN = [['#f3c9a2', '#d9a47c'], ['#e6b085', '#c98d62'], ['#c98c5c', '#a96d43'], ['#9a6440', '#7a4a2c'], ['#6e4428', '#52301b']];

// ================= Sprites (Port aus src/p03_sprites.js) =================
const SW = 36, SH = 56, AX = 18, AY = 53;
const OUTLINE = '#0b0910';
const DIGITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001010010', '111101111101111', '111101111001111'];
function drawDigits(g, n, x, y, col) {
  const s = String(n); g.fillStyle = col;
  [...s].forEach((d, k) => { const m = DIGITS[+d]; for (let i = 0; i < 15; i++) if (m[i] === '1') g.fillRect(x + k * 4 + (i % 3), y + ((i / 3) | 0), 1, 1); });
}
const digitsW = n => String(n).length * 4 - 1;
const RUN_LEG = [{ k: [4, -12], f: [6, 0] }, { k: [3, -11], f: [2, 0] }, { k: [1, -11], f: [-3, -1] }, { k: [-1, -12], f: [-7, -6] }, { k: [4, -15], f: [0, -9] }, { k: [7, -15], f: [7, -6] }];
const RUN_ARM = [{ e: [4, -24], h: [8, -28] }, { e: [2, -23], h: [6, -25] }, { e: [-1, -23], h: [1, -19] }, { e: [-4, -24], h: [-4, -19] }, { e: [-2, -23], h: [0, -19] }, { e: [2, -23], h: [6, -24] }];
function runPose(fr, ball) {
  return { lf: RUN_LEG[fr % 6], lb: RUN_LEG[(fr + 3) % 6], af: ball ? { e: [5, -24], h: [9, -19 + (fr % 3)] } : RUN_ARM[(fr + 3) % 6], ab: RUN_ARM[fr % 6], b: [1, fr % 3 === 1 ? -1 : 0] };
}
// ruhiger Gang für den Manager: kürzere Schritte, Arme schwingen wenig
const WALK_LEG = [{ k: [3, -11], f: [5, 0] }, { k: [2, -11], f: [1, 0] }, { k: [0, -11], f: [-3, 0] }, { k: [-1, -11], f: [-5, -2] }, { k: [2, -13], f: [0, -4] }, { k: [4, -12], f: [5, -2] }];
const WALK_ARM = [{ e: [3, -24], h: [6, -19] }, { e: [2, -24], h: [4, -18] }, { e: [0, -24], h: [1, -18] }, { e: [-2, -24], h: [-3, -18] }, { e: [-1, -24], h: [-1, -18] }, { e: [1, -24], h: [3, -18] }];
const POSES = {
  idle: fr => ({ lf: { k: [3, -11], f: [3, 0] }, lb: { k: [-2, -11], f: [-3, 0] }, af: { e: [4, -24], h: [5, -18] }, ab: { e: [-4, -24], h: [-5, -18] }, b: [0, fr ? 1 : 0] }),
  run: fr => runPose(fr, false),
  drib: fr => runPose(fr, true),
  walk: fr => ({ lf: WALK_LEG[fr % 6], lb: WALK_LEG[(fr + 3) % 6], af: WALK_ARM[(fr + 3) % 6], ab: WALK_ARM[fr % 6], b: [0, fr % 3 === 1 ? -1 : 0] }),
  hold: fr => ({ lf: { k: [3, -11], f: [3, 0] }, lb: { k: [-2, -11], f: [-3, 0] }, af: { e: [5, -25], h: [9, -22] }, ab: { e: [-2, -25], h: [6, -21] }, b: [0, fr ? 1 : 0] }),
  bounce: fr => ({ lf: { k: [3, -11], f: [3, 0] }, lb: { k: [-2, -11], f: [-3, 0] }, af: { e: [5, -24], h: [9, -19 + fr] }, ab: { e: [-4, -24], h: [-5, -18] }, b: [0, fr ? 1 : 0] }),
  wind: fr => ({ lf: fr ? { k: [6, -15], f: [3, -8] } : { k: [5, -10], f: [7, 0] }, lb: fr ? { k: [-2, -12], f: [-7, -7] } : { k: [-3, -11], f: [-6, 0] }, af: { e: [-3, -37], h: [-6, -43] }, ab: { e: [5, -29], h: [11, -31] }, b: [-1, 0] }),
  throw: fr => ({ lf: fr ? { k: [6, -13], f: [7, -6] } : { k: [6, -10], f: [8, 0] }, lb: fr ? { k: [-2, -12], f: [-7, -8] } : { k: [-2, -11], f: [-7, -1] }, af: { e: [7, -31], h: [12, -26] }, ab: { e: [-5, -27], h: [-9, -24] }, b: [2, 0] }),
  star: () => ({ lf: { k: [5, -10], f: [10, -2] }, lb: { k: [-5, -10], f: [-10, -2] }, af: { e: [8, -37], h: [12, -46] }, ab: { e: [-8, -37], h: [-12, -46] }, b: [0, 0] }),
  gk: fr => ({ lf: { k: [6, -9], f: [6, 0] }, lb: { k: [-5, -9], f: [-6, 0] }, af: { e: [8, -27], h: [10, -33 - fr] }, ab: { e: [-7, -27], h: [-9, -33 - fr] }, b: [0, 3] }),
  cheer: fr => { const r = runPose(fr, false); r.af = { e: [5, -39], h: [7, -47] }; r.ab = { e: [-4, -39], h: [-5, -47] }; return r; },
  jubel: fr => ({ lf: { k: [4, -11], f: [5, 0] }, lb: { k: [-3, -11], f: [-4, 0] }, af: { e: [5, -38], h: [7, -46 - fr] }, ab: { e: [-4, -38], h: [-5, -46 - fr] }, b: [0, fr ? -1 : 0] }),
  sit: () => ({ lf: { k: [6, -9], f: [6, 0] }, lb: { k: [5, -9], f: [5, 0] }, af: { e: [4, -18], h: [7, -16] }, ab: { e: [-3, -18], h: [3, -15] }, b: [0, 7] }),
  read: fr => ({ lf: { k: [6, -9], f: [6, 0] }, lb: { k: [5, -9], f: [5, 0] }, af: { e: [6, -19], h: [11, -24 - fr] }, ab: { e: [1, -19], h: [9, -25 - fr] }, b: [0, 7] }),
  lift: fr => ({ lf: { k: [3, -11], f: [3, 0] }, lb: { k: [-2, -11], f: [-3, 0] }, af: { e: [4, -39], h: [3, -47 - fr] }, ab: { e: [-3, -39], h: [1, -47 - fr] }, b: [0, fr ? -1 : 0] }),
  point: fr => ({ lf: { k: [3, -11], f: [3, 0] }, lb: { k: [-2, -11], f: [-3, 0] }, af: { e: [8, -30], h: [14, -33 - fr] }, ab: { e: [-4, -24], h: [-5, -18] }, b: [0, 0] }),
};

function look(o) {
  const sk = SKIN[o.skin], jer = o.jer, trim = o.trim;
  const L = { gk: !!o.gk, suit: !!o.suit, jer, jerS: shade(jer, 0.7), jerH: mix(jer, '#ffffff', 0.3), trim, sho: o.sho, sock: o.sock || jer, shoe: o.shoe,
    skin: sk[0], skinS: sk[1], hair: o.hair, style: o.style, beard: !!o.beard, band: !!o.band, num: o.num, tall: !!o.tall,
    numCol: lum(jer) > 0.6 ? shade(trim, 0.9) : '#ffffff' };
  L.key = JSON.stringify(o);
  return L;
}

const SPR = new Map();
function sprite(L, pose, fr = 0, flip = false) {
  const key = L.key + '|' + pose + '|' + fr + '|' + +flip;
  let c = SPR.get(key); if (!c) { c = renderSprite(L, pose, fr, flip); SPR.set(key, c); }
  return c;
}
function renderSprite(L, pose, fr, flip) {
  const base = document.createElement('canvas'); base.width = SW; base.height = SH;
  const g = base.getContext('2d');
  const P = (POSES[pose] || POSES.idle)(fr);
  const t = L.tall ? -1 : 0, pants = L.gk || L.suit;
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(flip ? AX - x - w : AX + x, AY + y, w, h); };
  const brush = (x1, y1, x2, y2, w, c) => { const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1); for (let i = 0; i <= n; i++) { const k = i / n; R(Math.round(lerp(x1, x2, k) - (w >> 1)), Math.round(lerp(y1, y2, k) - (w >> 1)), w, w, c); } };
  const limb = (segs, outline) => { if (outline) segs.forEach(s => brush(s[0], s[1], s[2], s[3], s[4] + 2, OUTLINE)); segs.forEach(s => brush(...s)); };
  const [bx, by] = P.b;
  const hipY = -19 + by + t, shY = -32 + by + t * 2, hx = bx;
  const leg = (Lg, back) => {
    const hip = [hx + (back ? -2 : 2), hipY], [kx, ky] = Lg.k, [fx, fy] = Lg.f, mx = (kx + fx) / 2, my = (ky + fy) / 2;
    const d = back ? 0.72 : 1, skin = back ? L.skinS : L.skin, sock = shade(L.sock, d), pant = shade(L.sho, back ? 0.75 : 1);
    if (pants) limb([[hip[0], hip[1], kx, ky, 4, pant], [kx, ky, fx, fy - 2, 4, pant]], !back);
    else limb([[hip[0], hip[1], kx, ky, 4, skin], [kx, ky, mx, my, 3, skin], [mx, my, fx, fy - 2, 3, sock]], !back);
    if (!back && !pants) R(kx, ky - 1, 1, 1, mix(L.skin, '#ffffff', 0.3));
    if (!back) R(fx - 2, fy - 3, 7, 4, OUTLINE);
    R(fx - 1, fy - 2, 5, 2, shade(L.shoe, d)); R(fx - 1, fy, 5, 1, back ? '#3a3a40' : '#55555c');
    if (!L.suit) R(fx + 1, fy - 2, 1, 2, shade(L.trim, d)); else if (!back) R(fx + 2, fy - 2, 2, 1, '#4a4652');
  };
  const arm = (A, back) => {
    const sh = [hx + (back ? -3 : 3), shY + 2], ex = A.e[0] + bx, ey = A.e[1] + by + t, hx2 = A.h[0] + bx, hy = A.h[1] + by + t;
    const skin = back ? L.skinS : L.skin, jer = back ? L.jerS : L.jer;
    const sx2 = lerp(sh[0], ex, 0.45), sy2 = lerp(sh[1], ey, 0.45);
    limb(pants ? [[sh[0], sh[1], ex, ey, 3, jer], [ex, ey, hx2, hy, 3, jer]] : [[sh[0], sh[1], ex, ey, 3, skin], [sh[0], sh[1], sx2, sy2, 4, jer], [ex, ey, hx2, hy, 2, skin]], !back);
    if (L.suit) R(Math.round(lerp(ex, hx2, 0.8)) - 1, Math.round(lerp(ey, hy, 0.8)), 3, 1, '#f3ead6'); // Hemdmanschette
    R(hx2 - 1, hy - 1, 3, 3, L.gk ? '#ececec' : skin); R(hx2 - 1, hy + 1, 3, 1, L.gk ? '#bdbdbd' : L.skinS);
    if (!pants && !back && L.band) R(Math.round(lerp(ex, hx2, 0.7)) - 1, Math.round(lerp(ey, hy, 0.7)), 3, 1, L.trim);
  };
  leg(P.lb, true); arm(P.ab, true);
  leg(P.lf, false);
  R(hx - 5, hipY - 2, 10, 6, L.sho); R(hx - 5, hipY - 2, 2, 6, shade(L.sho, 0.78));
  if (!L.suit) R(hx + 4, hipY - 1, 1, 4, L.trim);
  R(hx - 5, hipY + 3, 4, 1, shade(L.sho, 0.65)); R(hx + 1, hipY + 3, 4, 1, shade(L.sho, 0.85));
  const tH = hipY - 1 - shY;
  for (let r = 0; r < tH; r++) {
    const k = r / Math.max(1, tH - 1), l = Math.round(lerp(-6, -4, k)), rr = Math.round(lerp(5, 4, k)), y = shY + r;
    R(hx + l, y, rr - l + 1, 1, L.jer); R(hx + l, y, 3, 1, L.jerS); R(hx + rr, y, 1, 1, r < tH * 0.6 ? L.jerH : L.jer);
  }
  if (L.suit) {
    // Sakko: Hemd im V-Ausschnitt, Krawatte, Revers, Knöpfe, Einstecktuch
    for (let r = 0; r < 7; r++) { const w = Math.max(2, 6 - r); R(hx - (w >> 1) + 1, shY + r, w, 1, '#f3ead6'); }
    R(hx, shY + 1, 2, 1, '#b8321f'); R(hx, shY + 2, 2, 7, L.trim); R(hx + 1, shY + 2, 1, 7, shade(L.trim, 0.75)); R(hx, shY + 9, 2, 1, shade(L.trim, 0.6));
    R(hx - 3, shY + 1, 1, 6, shade(L.jer, 0.6)); R(hx + 4, shY + 1, 1, 6, shade(L.jer, 0.6));
    R(hx + 1, shY + 9, 1, 1, '#c9c2b0'); R(hx + 1, shY + 11, 1, 1, '#c9c2b0');
    R(hx - 5, shY + 3, 2, 1, '#ffc83a');
    R(hx - 6, shY, 12, 1, shade(L.jer, 0.8)); R(hx - 1, shY, 4, 1, '#f3ead6');
  } else {
    R(hx - 6, shY, 12, 1, L.trim); R(hx - 1, shY, 4, 2, L.skinS); R(hx, shY + 2, 2, 1, L.trim);
    const dx0 = AX + hx - Math.floor(digitsW(L.num) / 2) + 1;
    drawDigits(g, L.num, flip ? 2 * AX - dx0 - digitsW(L.num) : dx0, AY + shY + 4, L.numCol);
  }
  R(hx - 4, hipY - 2, 9, 1, shade(L.jer, 0.8));
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

// ================= Figuren =================
const HERO = look({ jer: '#ff4f3a', trim: '#ffc83a', sho: '#1d1830', sock: '#ff4f3a', shoe: '#f2f2f2', skin: 1, hair: '#4a2a17', style: 0, band: true, num: 7 });
const BOSS = look({ suit: true, jer: '#262c52', trim: '#ff4f3a', sho: '#20264a', shoe: '#17141c', skin: 1, hair: '#4a2a17', style: 0, num: 7 });
const KEEPER = look({ gk: true, jer: '#3ddc84', trim: '#1d6b3f', sho: '#1d6b3f', shoe: '#f2f2f2', skin: 3, hair: '#1a1210', style: 1, beard: true, num: 1, tall: true });
const BENCH = [
  look({ jer: '#ff4f3a', trim: '#ffc83a', sho: '#1d1830', shoe: '#f2f2f2', skin: 0, hair: '#d9b25a', style: 4, num: 11 }),
  look({ jer: '#ff4f3a', trim: '#ffc83a', sho: '#1d1830', shoe: '#f2f2f2', skin: 2, hair: '#1a1210', style: 5, beard: true, num: 23 }),
  look({ jer: '#ff4f3a', trim: '#ffc83a', sho: '#1d1830', shoe: '#f2f2f2', skin: 4, hair: '#1a1210', style: 3, num: 4 }),
];

// ================= Szenen und Zeitachse =================
// w = Breite der Szene in Welt-Pixeln, at = Haltepunkt der Figur, act = Länge der Aktion (Scroll-Einheiten)
const SCENES = [
  { id: 'halle', w: 520, at: 0, act: 0, label: '7 GEGEN 7' },
  { id: 'tor', w: 400, at: 120, act: 300, cam: 0.22, need: 148, label: 'DIE MOVES' },
  { id: 'tv', w: 440, at: 150, act: 200, cam: 0.3, need: 92, label: 'TV-AUFTRITT' },
  { id: 'zeitung', w: 420, at: 186, act: 260, cam: 0.36, need: 50, label: 'KARRIERE' },
  { id: 'buero', w: 460, at: 290, act: 260, cam: 0.5, label: 'STATISTIK' },
  { id: 'kabine', w: 400, at: 214, act: 320, cam: 0.42, label: 'MANAGER' },
  { id: 'finale', w: 560, at: 290, act: 160, cam: 0.42, need: 142, label: 'ANWURF!' },
];
let acc = 0;
SCENES.forEach(s => { s.x = acc; acc += s.w; });
const WORLD = acc;
const INTRO = { x: 70, len: 130 };

const TL = [];
(() => {
  let u = 0, x = INTRO.x;
  TL.push({ u0: u, u1: u += INTRO.len, hold: true, x, scene: SCENES[0], kind: 'intro' });
  SCENES.forEach(s => {
    if (!s.act) return;
    const tx = s.x + s.at;
    TL.push({ u0: u, u1: u += tx - x, hold: false, x0: x, x1: tx });
    TL.push({ u0: u, u1: u += s.act, hold: true, x: tx, scene: s, kind: s.id });
    x = tx;
  });
  TL.total = u;
})();

function stateAt(u) {
  u = clamp(u, 0, TL.total);
  let e = TL[TL.length - 1];
  for (const s of TL) if (u <= s.u1) { e = s; break; }
  const q = (u - e.u0) / Math.max(1, e.u1 - e.u0);
  const x = e.hold ? e.x : lerp(e.x0, e.x1, q);
  const scene = SCENES.findLast ? SCENES.findLast(s => x >= s.x) : [...SCENES].reverse().find(s => x >= s.x);
  return { u, x, q, hold: e.hold, kind: e.hold ? e.kind : 'walk', seg: e, scene };
}

// ================= Zeichnen =================
const cv = document.getElementById('story');
const g = cv.getContext('2d');
let W = 320, H = 180, FY = 158, cam = 0, T = 0, SCALE = 4;
const img = src => { const i = new Image(); i.src = src; return i; };
const SHOT_GAME = img('docs/screenshots/gameplay.jpg');
const SHOT_STATS = img('docs/screenshots/career-stats.jpg');
const SHOT_PAPER = img('docs/screenshots/career-newspaper.jpg');

const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const sx = wx => Math.round(wx - cam);
const PIX = '"Press Start 2P", monospace';
function text(s, x, y, c, size = 8, align = 'left') { g.font = `${size}px ${PIX}`; g.textAlign = align; g.textBaseline = 'top'; g.fillStyle = c; g.fillText(s, Math.round(x), Math.round(y)); }
function glow(x, y, r, c, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c.replace('A', a)); gr.addColorStop(1, c.replace('A', 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
function ellipse(x, y, rx, ry, c) { g.fillStyle = c; g.beginPath(); g.ellipse(Math.round(x), Math.round(y), rx, ry, 0, 0, Math.PI * 2); g.fill(); }
function drawSprite(L, pose, fr, wx, lift = 0, flip = false, shadow = true) {
  const x = sx(wx);
  if (shadow) ellipse(x, FY, 7, 1.6, 'rgba(0,0,0,.4)');
  g.drawImage(sprite(L, pose, fr, flip), x - AX, Math.round(FY - AY - lift));
}
function ball(x, y) { // Handball, 5 px
  R(x - 2, y - 3, 5, 7, OUTLINE); R(x - 3, y - 2, 7, 5, OUTLINE);
  R(x - 2, y - 2, 5, 5, '#ffc83a'); R(x - 1, y - 2, 1, 5, '#2f56b0'); R(x - 2, y, 5, 1, '#2f56b0'); R(x - 2, y - 2, 1, 1, '#fff6d0'); R(x + 1, y + 1, 1, 1, '#c96a12');
}

// ---------- Halle ----------
const CROWD = ['#ff4f3a', '#f3ead6', '#2f56b0', '#ffc83a', '#22202c', '#ff4f3a', '#7cf2ff', '#3a2f4d'];
function arena(s, opt = {}) {
  const x0 = sx(s.x), night = !!opt.night;
  // Dach und Lampen (Parallaxe 0.5)
  const top = g.createLinearGradient(0, 0, 0, FY - 40);
  top.addColorStop(0, night ? '#05040a' : '#0b0914'); top.addColorStop(1, night ? '#120d24' : '#1a1430');
  g.fillStyle = top; g.fillRect(x0, 0, s.w, FY);
  const px = Math.round((s.x - cam) * 0.5) - x0;
  for (let i = -6; i < s.w / 36 + 6; i++) {
    const lx = x0 + px + i * 36 + 10, ly = 6;
    R(lx, ly, 10, 2, '#3a3450'); R(lx + 2, ly + 2, 6, 1, '#fff7d6');
    glow(lx + 5, ly + 3, 14, 'rgba(255,240,200,A)', 0.18);
  }
  // Tribüne mit Publikum (Parallaxe 0.7), füllt nach oben auf
  const standBottom = FY - 46, rows = Math.ceil((standBottom - 18) / 7);
  const pc = Math.round((s.x - cam) * 0.7) - x0;
  const cheer = opt.cheer || 0;
  for (let r = 0; r < rows; r++) {
    const y = standBottom - (r + 1) * 7, dim = clamp(1 - r * 0.07, 0.35, 1);
    R(x0, y + 6, s.w, 1, '#0d0b14');
    for (let i = -4, n = Math.ceil(s.w / 5) + 8; i < n; i++) {
      const wx = i * 5 + pc, h = hash(i + Math.round((s.x) / 5), r + s.x);
      if (h < 0.08) continue;
      const col = shade(CROWD[(h * CROWD.length) | 0], dim), skin = shade(SKIN[(hash(i, r * 7) * 5) | 0][0], dim);
      const jump = cheer && hash(i, r * 3) < 0.7 ? Math.round(Math.abs(Math.sin(T * 9 + h * 20)) * 2 * cheer) : (Math.sin(T * 2 + h * 30) > 0.92 ? 1 : 0);
      const px2 = x0 + wx;
      R(px2, y + 2 - jump, 4, 4, col); R(px2 + 1, y - jump, 2, 2, skin);
      if (cheer && h > 0.5) { R(px2 - 1, y - 2 - jump, 1, 2, skin); R(px2 + 4, y - 2 - jump, 1, 2, skin); }
      if (h > 0.97) R(px2, y - 4 - jump, 5, 3, h > 0.985 ? '#ffc83a' : '#ff4f3a'); // Fahne/Schal
    }
  }
  // Blitzlichter
  for (let k = 0; k < 4; k++) { const h = hash(Math.floor(T * 3) + k, s.x); if (h < 0.35 * (1 + cheer)) R(x0 + hash(k, Math.floor(T * 3)) * s.w, 20 + hash(k * 9, Math.floor(T * 3)) * (standBottom - 30), 2, 2, '#ffffff'); }
  // LED-Bande
  const by = FY - 46;
  R(x0, by, s.w, 9, '#0a0812'); R(x0, by, s.w, 1, '#2a2140'); R(x0, by + 8, s.w, 1, '#2a2140');
  g.save(); g.beginPath(); g.rect(x0, by + 1, s.w, 7); g.clip();
  const msg = opt.board || '+++ HALLEN-LEGENDEN +++ 7 GEGEN 7 +++ KEMPA +++ SIEBENMETER +++ ';
  const tw = msg.length * 8, off = (T * 30) % tw;
  for (let k = -1; k < s.w / tw + 2; k++) text(msg, x0 + k * tw - off, by + 1, (Math.floor(T * 2) % 2) ? '#ffc83a' : '#7cf2ff', 8);
  g.restore();
  // Hallenboden
  const fy0 = FY - 37;
  R(x0, fy0, s.w, H - fy0, '#2f56b0');
  for (let y = fy0 + 2; y < H; y += 3) R(x0, y, s.w, 1, 'rgba(0,0,0,.08)');
  for (let k = 0; k < s.w; k += 23) R(x0 + k + ((k / 23) % 2) * 9, fy0, 1, H - fy0, 'rgba(0,0,0,.05)');
  R(x0, fy0, s.w, 1, '#f3ead6'); R(x0, fy0 + 1, s.w, 1, 'rgba(0,0,0,.25)');
  R(x0, FY + 10, s.w, 1, 'rgba(243,234,214,.7)');
  // Spiegelung der Bande
  R(x0, fy0 + 2, s.w, 6, 'rgba(255,200,58,.05)');
  // Lichtkegel
  g.fillStyle = 'rgba(255,240,200,.045)';
  for (let k = 0; k < s.w / 120; k++) { const cx = x0 + k * 120 + 60; g.beginPath(); g.moveTo(cx - 4, 0); g.lineTo(cx + 4, 0); g.lineTo(cx + 40, FY + 4); g.lineTo(cx - 40, FY + 4); g.fill(); }
  if (opt.center != null) { // Mittellinie und Mittelkreis
    const cx = x0 + opt.center;
    R(cx, fy0, 1, H - fy0, 'rgba(243,234,214,.75)');
    g.strokeStyle = 'rgba(243,234,214,.75)'; g.lineWidth = 1; g.beginPath(); g.ellipse(cx + 0.5, (fy0 + FY + 10) / 2, 26, (FY + 10 - fy0) / 2 - 3, 0, 0, Math.PI * 2); g.stroke();
  }
}

// ---------- Szene: Tor ----------
// Maßstab: Die Figur ist rund 50 px groß (≈ 1,9 m), also M = 26 px pro Meter. Möbel und Tor richten sich danach.
const M = 26;
const GOAL_DX = 118; // Torlinie rechts vom Wurfpunkt
function goal(gx, net = 0) {
  const fy0 = FY - 37, my = FY - 7;               // Hallenboden: Vorderkante, Mitte (Tiefe)
  const nearY = my + 5, farY = my - 4, hgt = 2 * M; // Pfosten vorn/hinten, Tor 2 m hoch
  // Hinter der Torlinie: Aus (dunkler), davor der Torraum als Halbkreis
  R(gx, fy0, 400, H - fy0, '#24418a');
  for (let y = fy0 + 2; y < H; y += 3) R(gx, y, 400, 1, 'rgba(0,0,0,.08)');
  g.fillStyle = '#d9842f'; g.beginPath(); g.ellipse(gx, my, 96, 24, 0, Math.PI / 2, Math.PI * 1.5); g.fill();
  g.strokeStyle = '#f3ead6'; g.lineWidth = 1;
  g.beginPath(); g.ellipse(gx, my, 96, 24, 0, Math.PI / 2, Math.PI * 1.5); g.stroke();
  g.setLineDash([3, 3]); g.beginPath(); g.ellipse(gx, my, 140, 30, 0, Math.PI / 2, Math.PI * 1.5); g.stroke(); g.setLineDash([]);
  R(gx - 40, my - 1, 1, 3, '#f3ead6');           // 7-m-Marke
  R(gx, fy0, 1, H - fy0, '#f3ead6');             // Torlinie
  // Netz nach hinten (rechts), beult bei Treffern aus
  const nd = 20, b = Math.round(net * 5), top = farY - hgt;
  for (let x = 2; x <= nd; x += 3) R(gx + 3 + x + (x > nd / 2 ? b : 0), top + Math.round(x * 0.5), 1, nearY - top - Math.round(x * 0.5), 'rgba(243,234,214,.28)');
  for (let y = top; y < nearY; y += 3) { const k = (y - top) / (nearY - top); R(gx + 3, y, nd + Math.round(b * Math.sin(k * Math.PI)), 1, 'rgba(243,234,214,.22)'); }
  R(gx + 3 + nd, top + 10, 1, nearY - top - 10, 'rgba(243,234,214,.45)');
  // hinterer Pfosten, Latte, vorderer Pfosten (rot-weiß)
  const post = (x, yb) => { for (let y = yb - hgt; y < yb; y += 4) { R(x, y, 2, 2, '#ff4f3a'); R(x, y + 2, 2, 2, '#f3ead6'); } };
  post(gx + 4, farY);
  for (let k = 0; k <= 9; k++) R(gx + Math.round(k * 4 / 9), nearY - hgt + Math.round((farY - nearY) * k / 9), 2, 2, k % 4 < 2 ? '#ff4f3a' : '#f3ead6');
  post(gx, nearY);
  ellipse(gx + 2, nearY, 4, 1, 'rgba(0,0,0,.35)');
}

// ---------- Szene: Wohnzimmer ----------
function room(s, wall, wall2, floor, floor2) {
  const x0 = sx(s.x), fy = FY - 22;
  R(x0, 0, s.w, fy, wall);
  for (let k = 0; k < s.w; k += 10) R(x0 + k, 0, 4, fy, wall2);
  R(x0, fy - 3, s.w, 3, shade(wall, 0.6)); R(x0, fy - 3, s.w, 1, mix(wall, '#ffffff', 0.15));
  R(x0, fy, s.w, H - fy, floor);
  for (let y = fy + 3; y < H; y += 5) R(x0, y, s.w, 1, floor2);
  for (let y = fy, r = 0; y < H; y += 5, r++) for (let k = (r % 2) * 13; k < s.w; k += 26) R(x0 + k, y, 1, 5, floor2);
}
function tvScene(s, st) {
  room(s, '#2a1d3a', '#2f2141', '#5a3a24', '#4a2f1c');
  const x0 = sx(s.x), fy = FY - 22;
  // Fenster 2 m × 1,4 m, Brüstung 0,9 m, draußen Stadt bei Nacht (Parallaxe)
  const ww = 52, wh = 36, wx = x0 + 30, wy = fy - 23 - wh;
  R(wx - 2, wy - 2, ww + 4, wh + 4, '#4a3a5c'); R(wx, wy, ww, wh, '#0d1030');
  g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
  const pp = Math.round((s.x - cam) * 0.25);
  for (let k = 0; k < 12; k++) { const bh = 8 + hash(k, 3) * 20, bx = wx + pp + k * 9 - 20; R(bx, wy + wh - bh, 8, bh, '#161a3e'); for (let j = 0; j < bh - 4; j += 3) for (let i2 = 1; i2 < 7; i2 += 3) if (hash(k * 31 + j, i2) > 0.55) R(bx + i2, wy + wh - bh + 2 + j, 1, 1, '#ffd27a'); }
  R(wx + 40, wy + 5, 3, 3, '#f3ead6');
  g.restore();
  R(wx + ww / 2 - 1, wy, 2, wh, '#4a3a5c'); R(wx - 4, wy + wh + 2, ww + 8, 2, '#5c4a72');
  // Sofa unter dem Fenster: 2,1 m breit, 0,85 m hoch
  const sf = x0 + 28;
  R(sf, fy - 22, 56, 11, '#3d4f8a'); R(sf, fy - 22, 56, 1, '#5a6fb0'); R(sf + 1, fy - 12, 54, 7, '#4a5fa0'); R(sf + 1, fy - 12, 54, 1, '#6a80c0');
  R(sf - 3, fy - 16, 5, 13, '#33437a'); R(sf + 54, fy - 16, 5, 13, '#33437a'); R(sf + 1, fy - 5, 2, 5, '#2a1d14'); R(sf + 53, fy - 5, 2, 5, '#2a1d14');
  R(sf + 6, fy - 19, 9, 7, '#ffc83a'); R(sf + 40, fy - 19, 9, 7, '#ff4f3a');
  // Teppich
  ellipse(x0 + 190, FY + 8, 100, 9, '#5c2234'); ellipse(x0 + 190, FY + 8, 92, 7, '#73283f');
  // Lowboard 1,6 m × 0,45 m, darüber Fernseher 1,45 m × 0,85 m an der Wand
  const lb = x0 + 186;
  R(lb, fy - 12, 42, 12, '#3d2616'); R(lb, fy - 12, 42, 1, '#5c3a22'); R(lb + 20, fy - 10, 1, 9, '#2c1b10'); R(lb + 2, fy - 2, 2, 2, '#2c1b10'); R(lb + 38, fy - 2, 2, 2, '#2c1b10');
  R(lb + 4, fy - 15, 6, 3, '#2a2630'); R(lb + 5, fy - 14, 1, 1, '#3ddc84');
  const tw = 38, th = 23, tx = lb + 2, ty = fy - 26 - th;
  R(tx - 1, ty - 1, tw + 2, th + 2, OUTLINE); R(tx, ty, tw, th, '#15131a');
  const scx = tx + 1, scy = ty + 1, scw = tw - 2, sch = th - 3;
  const goalNow = st.kind === 'tv' && st.q > 0.42;
  g.save(); g.beginPath(); g.rect(scx, scy, scw, sch); g.clip();
  if (SHOT_GAME.complete && SHOT_GAME.naturalWidth) {
    const zoom = goalNow ? 1.5 + 0.15 * Math.sin(T * 2) : 1.05, iw = scw * zoom, ih = iw * 9 / 16;
    const pan = goalNow ? 0.8 : 0.5 + 0.08 * Math.sin(T * 0.6);
    g.imageSmoothingEnabled = true; g.drawImage(SHOT_GAME, scx - (iw - scw) * pan, scy - (ih - sch) * 0.45, iw, ih); g.imageSmoothingEnabled = false;
  } else R(scx, scy, scw, sch, '#2f56b0');
  if (Math.floor(T * 2) % 2) R(scx + 1, scy + 1, 2, 2, '#ff4f3a');
  if (goalNow) { R(scx, scy + 5, scw, 10, Math.floor(T * 4) % 2 ? '#ffc83a' : '#ff4f3a'); text('TOR!', scx + scw / 2, scy + 6, '#1a1205', 8, 'center'); }
  g.restore();
  R(tx + tw / 2 - 1, ty + th - 1, 2, 1, '#3a3450');
  g.fillStyle = `rgba(124,242,255,${0.07 + 0.03 * Math.sin(T * 7)})`;
  g.beginPath(); g.moveTo(scx, scy + sch); g.lineTo(scx + scw, scy + sch); g.lineTo(scx + scw + 40, H); g.lineTo(scx - 40, H); g.fill();
  glow(tx + tw / 2, ty + th / 2, 34, 'rgba(124,242,255,A)', 0.1);
  // Stehlampe 1,6 m, Zimmerpflanze 1 m
  const lx = x0 + 262; R(lx, fy - 40, 1, 40, '#8a819c'); R(lx - 4, fy - 1, 9, 2, '#3a3450');
  g.fillStyle = '#ffc83a'; g.beginPath(); g.moveTo(lx - 5, fy - 40); g.lineTo(lx + 6, fy - 40); g.lineTo(lx + 4, fy - 47); g.lineTo(lx - 3, fy - 47); g.fill();
  glow(lx, fy - 40, 30, 'rgba(255,200,58,A)', 0.2);
  const plx = x0 + 104; R(plx - 4, fy - 8, 8, 8, '#8c4a2a'); R(plx - 5, fy - 9, 10, 2, '#a65c36');
  for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.32 + Math.sin(T + k) * 0.03; g.strokeStyle = k % 2 ? '#2f9a5a' : '#3ddc84'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(plx, fy - 8); g.lineTo(plx + Math.cos(a) * 12, fy - 8 + Math.sin(a) * 16); g.stroke(); }
}

// ---------- Szene: Küche mit Zeitung ----------
function kitchen(s, st) {
  const x0 = sx(s.x), fy = FY - 22;
  const q = st.kind === 'zeitung' ? st.q : (st.x > s.x + s.at ? 1 : 0);
  room(s, '#3a2f4d', '#3e3352', '#2b2438', '#352c45');
  // Küchenzeile 4 m lang, Arbeitsplatte 0,9 m; Fliesen darüber, Fenster darüber
  const kx = x0 + 236, kw = 104;
  for (let y = fy - 41; y < fy - 23; y += 4) for (let k = 0; k < kw; k += 4) R(kx + k, y, 3, 3, ((k / 4 + y / 4) | 0) % 2 ? '#4a4060' : '#453b5a');
  const ww = 52, wh = 28, wx = kx + 26, wy = fy - 43 - wh;
  R(wx - 2, wy - 2, ww + 4, wh + 4, '#5c4a72');
  const sky = g.createLinearGradient(0, wy, 0, wy + wh);
  sky.addColorStop(0, mix('#1a2a6a', '#7cc4ff', q)); sky.addColorStop(1, mix('#ff7a4a', '#ffd9a0', q));
  g.fillStyle = sky; g.fillRect(wx, wy, ww, wh);
  ellipse(wx + 34, wy + wh - 4 - q * 14, 4, 4, '#ffe27a'); glow(wx + 34, wy + wh - 4 - q * 14, 16, 'rgba(255,226,122,A)', 0.35);
  for (let k = 0; k < 6; k++) R(wx + k * 9 - 2, wy + wh - 4 - hash(k, 9) * 5, 9, 8, '#2a2448');
  R(wx + ww / 2 - 1, wy, 2, wh, '#5c4a72');
  R(kx, fy - 23, kw, 23, '#4a3b5c'); R(kx, fy - 23, kw, 2, '#8a7fa0');
  for (let k = 0; k < kw; k += 26) { R(kx + k, fy - 20, 1, 20, '#3a2f4d'); R(kx + k + 20, fy - 15, 3, 1, '#c9c2b0'); }
  R(kx + 60, fy - 26, 10, 3, '#c9c2b0'); R(kx + 63, fy - 29, 1, 3, '#c9c2b0');   // Spüle mit Hahn
  const fx = kx + kw + 4;                                                         // Kühlschrank 1,8 m
  R(fx, fy - 47, 16, 47, '#c9c2b0'); R(fx, fy - 47, 16, 1, '#e8e2d2'); R(fx, fy - 31, 16, 1, '#8a819c'); R(fx + 13, fy - 44, 1, 8, '#8a819c'); R(fx + 13, fy - 27, 1, 10, '#8a819c');
  // Wanduhr (35 cm), Zeiger drehen sich beim Lesen
  const cx = x0 + 120, cy = fy - 58;
  ellipse(cx, cy, 6, 6, OUTLINE); ellipse(cx, cy, 5, 5, '#fff8e8');
  for (let k = 0; k < 4; k++) R(cx + Math.round(Math.cos(k * Math.PI / 2) * 4), cy + Math.round(Math.sin(k * Math.PI / 2) * 4), 1, 1, '#3a2f4d');
  const mA = -Math.PI / 2 + q * Math.PI * 6, hA = -Math.PI / 2 + 0.9 + q * Math.PI / 2;
  g.strokeStyle = '#1a1205'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(mA) * 4, cy + Math.sin(mA) * 4); g.stroke();
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(hA) * 2.5, cy + Math.sin(hA) * 2.5); g.stroke();
  // Hängeleuchte über dem Tisch
  const lx = x0 + s.at + 24; R(lx, 0, 1, FY - 46, '#5c4a72'); R(lx - 5, FY - 46, 11, 3, '#ffc83a'); glow(lx, FY - 42, 34, 'rgba(255,200,58,A)', 0.2);
  // Stuhl: Sitz 0,46 m, Lehne 0,95 m
  const ch = x0 + s.at - 2;
  R(ch - 7, FY - 12, 13, 2, '#8c5a32'); R(ch - 6, FY - 10, 1, 10, '#6e4426'); R(ch + 4, FY - 10, 1, 10, '#6e4426'); R(ch - 8, FY - 25, 2, 15, '#8c5a32'); R(ch - 8, FY - 25, 2, 1, '#a66c3e');
}
function kitchenFront(s, st) {
  const x0 = sx(s.x);
  // Tisch 1,2 m × 0,76 m vor der Figur
  const tx = x0 + s.at + 8;
  R(tx, FY - 20, 32, 2, '#a66c3e'); R(tx, FY - 18, 32, 1, '#6e4426'); R(tx + 1, FY - 17, 2, 17, '#6e4426'); R(tx + 29, FY - 17, 2, 17, '#6e4426');
  // Teller mit Brötchen, Kaffeetasse mit Dampf
  R(tx + 7, FY - 21, 8, 1, '#efe6cf'); R(tx + 9, FY - 23, 4, 2, '#d9a45c');
  const mx = tx + 22;
  R(mx, FY - 23, 3, 3, '#f3ead6'); R(mx + 3, FY - 22, 1, 1, '#f3ead6'); R(mx, FY - 23, 3, 1, '#5a3a24');
  for (let k = 0; k < 2; k++) for (let j = 0; j < 4; j++) R(mx + k * 2 + Math.round(Math.sin(T * 3 + j * 0.9 + k) * 1), FY - 25 - j * 2, 1, 1, `rgba(243,234,214,${0.45 - j * 0.09})`);
}
function newspaper(px, q, fr) {
  // aufgeschlagene Zeitung, etwa 0,55 m × 0,4 m
  const x = sx(px) + 6, y = FY - 34 - fr;
  const flip = seg(q, 0.48, 0.58);
  R(x - 1, y - 1, 16, 13, OUTLINE); R(x, y, 14, 11, '#efe6cf'); R(x + 7, y, 1, 11, '#cfc4a8');
  R(x + 1, y + 1, 12, 2, '#1a1205');
  R(x + 1, y + 4, 5, 1, '#1a1205'); R(x + 1, y + 6, 5, 1, '#8a7f66'); R(x + 1, y + 8, 4, 1, '#8a7f66');
  R(x + 9, y + 4, 4, 3, q > 0.55 ? '#2f56b0' : '#ff4f3a'); R(x + 9, y + 8, 4, 1, '#8a7f66');
  if (flip > 0 && flip < 1) { const w = Math.round(7 * Math.cos(flip * Math.PI)); R(x + 7 + Math.min(0, w), y - 1, Math.abs(w), 13, '#fff8e8'); }
}

// ---------- Szene: Büro mit Statistik und Pokal ----------
function office(s, st) {
  room(s, '#1d2238', '#20263e', '#2a2438', '#241f31');
  const x0 = sx(s.x), fy = FY - 22;
  const q = st.kind === 'buero' ? st.q : (st.x > s.x + s.at ? 1 : 0);
  // Whiteboard 1,8 m × 1 m mit wachsender Tabellenkurve
  const bw = 47, bh = 26, bx = x0 + s.at - 128, by = fy - 27 - bh;
  R(bx - 2, by - 2, bw + 4, bh + 4, '#8a819c'); R(bx, by, bw, bh, '#f3ead6'); R(bx + 2, by + bh + 2, bw - 4, 1, '#5c5470');
  R(bx + 3, by + 3, 16, 1, '#3a2f4d');
  for (let k = 0; k < 3; k++) R(bx + 3, by + 8 + k * 6, bw - 6, 1, '#d9cfb8');
  const pts = [8, 18, 14, 15, 10, 8, 5, 6, 3, 2, 1, 1];
  const grow = clamp(0.25 + q * 1.4, 0, 1), n = Math.max(2, Math.round(pts.length * grow));
  g.strokeStyle = '#ff4f3a'; g.lineWidth = 1; g.beginPath();
  for (let k = 0; k < n; k++) { const px2 = bx + 4.5 + k * 3.6, py = by + 5.5 + pts[k]; k ? g.lineTo(px2, py) : g.moveTo(px2, py); }
  g.stroke();
  if (n === pts.length) { R(bx + bw - 6, by + 3, 3, 3, '#ffc83a'); R(bx + bw - 5, by + 2, 1, 5, '#ffc83a'); R(bx + bw - 7, by + 4, 5, 1, '#ffc83a'); }
  // Bilderrahmen
  const fx = x0 + s.at - 168; R(fx, fy - 58, 13, 10, '#ffc83a'); R(fx + 1, fy - 57, 11, 8, '#2f56b0'); R(fx + 4, fy - 54, 5, 3, '#f3ead6');
  // Analyse-Bildschirm 1,6 m an der Wand (zeigt die Statistik-Seite), darunter Schreibtisch
  const mw = 42, mh = 24, mx = x0 + s.at - 68, my = fy - 30 - mh;
  R(mx - 1, my - 1, mw + 2, mh + 2, OUTLINE); R(mx, my, mw, mh, '#15131a');
  if (SHOT_STATS.complete && SHOT_STATS.naturalWidth) { g.imageSmoothingEnabled = true; g.drawImage(SHOT_STATS, 60, 40, 1160, 640, mx + 1, my + 1, mw - 2, mh - 2); g.imageSmoothingEnabled = false; }
  glow(mx + mw / 2, my + mh / 2, 34, 'rgba(124,242,255,A)', 0.1);
  const dx = mx - 6;
  R(dx, fy - 20, 54, 2, '#5c3a22'); R(dx + 2, fy - 18, 2, 18, '#3d2616'); R(dx + 50, fy - 18, 2, 18, '#3d2616'); R(dx + 36, fy - 18, 14, 10, '#3d2616');
  R(dx + 10, fy - 21, 10, 1, '#8a819c'); R(dx + 11, fy - 26, 8, 5, '#2a2630'); R(dx + 12, fy - 25, 6, 3, '#3a6fb0');
  R(dx + 30, fy - 23, 3, 3, '#f3ead6');
  // Sockel 1 m mit Pokal (60 cm)
  const px = x0 + s.at + 16;
  R(px - 6, FY - 26, 13, 26, '#3a2f4d'); R(px - 7, FY - 27, 15, 2, '#4a3d62'); R(px - 3, FY - 17, 7, 3, '#ffc83a');
  const lifted = st.kind === 'buero' && q > 0.3 && q < 0.92;
  if (!lifted) trophy(px, FY - 27);
  // Regal 1,2 m mit Bällen und Ordnern
  const rx = x0 + 380, ry = fy - 40;
  R(rx, ry, 32, 2, '#5c3a22'); R(rx, ry + 14, 32, 2, '#5c3a22');
  for (let k = 0; k < 3; k++) ball(rx + 5 + k * 9, ry - 3);
  for (let k = 0; k < 6; k++) R(rx + 2 + k * 5, ry + 5, 4, 9, ['#ff4f3a', '#2f56b0', '#ffc83a', '#3ddc84', '#f3ead6', '#7cf2ff'][k]);
}
function trophy(x, y) { // Fuß bei (x, y), rund 16 px hoch
  R(x - 4, y - 3, 8, 3, '#7a4a12'); R(x - 1, y - 6, 2, 3, '#c98a1a');
  R(x - 4, y - 13, 8, 7, '#ffc83a'); R(x - 5, y - 14, 10, 1, '#ffe27a'); R(x - 3, y - 12, 1, 5, '#fff0b0'); R(x - 3, y - 7, 6, 1, '#c98a1a');
  R(x - 6, y - 13, 2, 4, '#c98a1a'); R(x + 4, y - 13, 2, 4, '#c98a1a');
  if (Math.sin(T * 5) > 0.3) { R(x + 3, y - 18, 1, 3, '#ffffff'); R(x + 2, y - 17, 3, 1, '#ffffff'); }
}

// ---------- Szene: Kabine ----------
function locker(s, st) {
  const x0 = sx(s.x), fy = FY - 22;
  R(x0, 0, s.w, fy, '#253040');
  for (let y = 0; y < fy; y += 8) for (let k = ((y / 8) % 2) * 4; k < s.w; k += 8) R(x0 + k, y, 7, 7, '#2a3648');
  R(x0, fy, s.w, H - fy, '#1e2733');
  for (let y = fy; y < H; y += 6) for (let k = 0; k < s.w; k += 6) R(x0 + k, y, 5, 5, ((k + y) / 6) % 2 ? '#222c39' : '#1b2430');
  // Spinde: 1,8 m hoch, 0,4 m breit
  const ly = fy - 47, booth = s.at;
  const spind = (lx, nr, open) => {
    if (open) { R(lx, ly, 10, 47, '#121820'); R(lx + 1, ly + 8, 8, 10, '#ff4f3a'); R(lx, ly + 8, 10, 2, '#ff4f3a'); drawDigits(g, 9, lx + 4, ly + 11, '#ffc83a'); return; }
    R(lx, ly, 10, 47, '#3d5068'); R(lx, ly, 10, 1, '#5a7090'); R(lx + 9, ly, 1, 47, '#2a3648');
    for (let j = 0; j < 3; j++) R(lx + 2, ly + 4 + j * 2, 6, 1, '#2a3648');
    R(lx + 7, ly + 22, 1, 4, '#c9c2b0'); drawDigits(g, nr, lx + 2, ly + 34, '#c9c2b0');
  };
  let nr = 0;
  const next = () => (nr++ % 9) + 1;
  for (let lx = 6; lx + 10 < booth - 26; lx += 11) spind(x0 + lx, next(), false);
  for (let lx = booth + 30, k = 0; lx + 10 < s.w - 6; lx += 11, k++) spind(x0 + lx, next(), k === 2);
  // Bank 0,45 m mit Handtuch und Ball
  R(x0 + 40, FY - 12, 80, 3, '#8c5a32'); R(x0 + 44, FY - 9, 2, 9, '#5c3a22'); R(x0 + 114, FY - 9, 2, 9, '#5c3a22');
  R(x0 + 60, FY - 14, 8, 2, '#f3ead6'); ball(x0 + 100, FY - 15);
  // Schild über der Umkleide
  const sxp = x0 + booth - 20, syp = fy - 66;
  R(sxp, syp, 40, 9, '#ffc83a'); R(sxp + 1, syp + 1, 38, 7, '#1a1205'); drawDigits(g, 7, sxp + 3, syp + 2, '#ffc83a'); R(sxp + 9, syp + 3, 27, 2, '#ffc83a');
}
function curtain(s, st) { // vor der Figur: Stange 2,15 m, Vorhang gut 1 m breit
  const x0 = sx(s.x), cx = x0 + s.at, top = FY - 56;
  const q = st.kind === 'kabine' ? st.q : (st.x > s.x + s.at ? 1 : 0);
  // Vorhang schließt (0–0.12), wackelt, öffnet (0.78–0.9)
  const close = st.kind === 'kabine' ? seg(q, 0.02, 0.12) * (1 - seg(q, 0.78, 0.9)) : 0;
  R(cx - 16, top - 2, 33, 2, '#c9c2b0'); R(cx - 17, top - 3, 2, 4, '#8a819c'); R(cx + 16, top - 3, 2, 4, '#8a819c');
  const wob = q > 0.15 && q < 0.75 ? Math.sin(T * 18) * 1.2 : 0;
  const cw = Math.round(lerp(6, 31, close));
  for (let k = 0; k < cw; k++) {
    const fold = (k % 4) < 2 ? '#c22f2f' : '#a32424', sway = Math.round(wob * Math.sin(k * 0.6 + T * 6));
    R(cx - 15 + k + sway, top, 1, 55 - (k % 3 === 0 ? 1 : 0), fold);
  }
  R(cx - 15, top, cw, 1, '#e04848');
}
// fliegende Kleidung beim Umziehen
function clothes(s, q) {
  const cx = sx(s.x + s.at);
  const items = [
    { t0: 0.24, c: '#ff4f3a', w: 8, h: 7, num: true, dx: -64, up: 34 },
    { t0: 0.36, c: '#1d1830', w: 6, h: 4, dx: -38, up: 26 },
    { t0: 0.46, c: '#f2f2f2', w: 4, h: 2, dx: -84, up: 30 },
    { t0: 0.52, c: '#ff4f3a', w: 2, h: 5, dx: -52, up: 22 },
  ];
  items.forEach(it => {
    const k = seg(q, it.t0, it.t0 + 0.16); if (k <= 0) return;
    const x = cx + it.dx * k, y = FY - 42 - it.up * Math.sin(k * Math.PI) + 40 * k * k;
    g.save(); g.translate(Math.round(x), Math.round(Math.min(y, FY - it.h))); g.rotate(k < 1 ? k * 8 : 0.3);
    R(-it.w / 2, -it.h / 2, it.w, it.h, it.c); if (it.num) drawDigits(g, 7, -1, -2, '#ffc83a');
    g.restore();
  });
  if (q > 0.62 && q < 0.86) for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 + T * 2, r = 15 + 5 * Math.sin(T * 6 + k); if (hash(k, Math.floor(T * 8)) > 0.3) R(cx + Math.cos(a) * r, FY - 28 + Math.sin(a) * r * 1.2, 1, 1, k % 2 ? '#ffc83a' : '#ffffff'); }
}

// ---------- Szene: Finale ----------
function finaleExtras(s, st) {
  const x0 = sx(s.x);
  // Trainerbank mit Ersatzspielern
  const bx = x0 + s.at + 46;
  R(bx - 6, FY - 52, 92, 4, '#2a2140'); R(bx - 6, FY - 52, 3, 52, '#2a2140'); R(bx + 83, FY - 52, 3, 52, '#2a2140');
  R(bx - 3, FY - 48, 86, 34, 'rgba(124,242,255,.08)');
  BENCH.forEach((L, k) => { const fr = Math.sin(T * 6 + k) > 0.6 ? 1 : 0; g.drawImage(sprite(L, st.kind === 'finale' && st.q > 0.3 ? 'jubel' : 'sit', fr), bx + 12 + k * 22 - AX, FY - 4 - AY); });
  R(bx - 2, FY - 12, 84, 3, '#8a819c');
  // Scheinwerfer, die kreisen
  for (let k = 0; k < 3; k++) {
    const cx = x0 + 120 + k * 160, a = Math.sin(T * 0.8 + k * 2) * 0.5;
    g.fillStyle = ['rgba(255,79,58,.08)', 'rgba(124,242,255,.08)', 'rgba(255,200,58,.08)'][k];
    g.beginPath(); g.moveTo(cx - 3, 0); g.lineTo(cx + 3, 0); g.lineTo(cx + Math.sin(a) * 140 + 40, FY + 6); g.lineTo(cx + Math.sin(a) * 140 - 40, FY + 6); g.fill();
  }
}
let CONFETTI = [];
function confetti(x, y, n, spread) {
  for (let k = 0; k < n; k++) CONFETTI.push({ x: x + (Math.random() - 0.5) * spread, y: y - Math.random() * 30, vx: (Math.random() - 0.5) * 30, vy: Math.random() * 20 + 10, c: ['#ffc83a', '#ff4f3a', '#7cf2ff', '#3ddc84', '#f3ead6'][k % 5], life: 3 });
}
function stepConfetti(dt) {
  CONFETTI = CONFETTI.filter(p => (p.life -= dt) > 0 && p.y < H);
  CONFETTI.forEach(p => { p.x += p.vx * dt + Math.sin(T * 6 + p.y) * 0.3; p.y += p.vy * dt; R(sx(p.x), p.y, 2, 2, p.c); });
}

// Trennwand zwischen den Szenen (wie Kulissen)
function divider(wx) {
  const x = sx(wx);
  if (x < -12 || x > W + 12) return;
  R(x - 5, 0, 10, H, '#07060b'); R(x - 5, 0, 1, H, '#2a2140'); R(x + 4, 0, 1, H, '#2a2140');
  for (let y = 6; y < H; y += 14) R(x - 2, y, 4, 2, '#1a1430');
}

// ================= Figur je Zustand =================
let lastKind = '', cheerAmt = 0;
function hero(st) {
  const ws = 7; // Welt-Pixel pro Schritt-Frame
  const runFr = Math.floor(st.x / ws) % 6;
  const after = id => st.x >= SCENES.find(s => s.id === id).x + SCENES.find(s => s.id === id).at && !(st.kind === id);
  const suit = st.x > SCENES[5].x + SCENES[5].at || (st.kind === 'kabine' && st.q > 0.5);
  const L = suit ? BOSS : HERO;
  const idleFr = Math.floor(T * 2) % 2;
  const tor = SCENES[1];
  switch (st.kind) {
    case 'intro': {
      // Ball auftippen im Stand
      const ph = (T * 2.2) % 1, h = Math.abs(Math.sin(ph * Math.PI)) * 14;
      drawSprite(L, 'bounce', h > 9 ? 0 : 1, st.x);
      ball(sx(st.x) + 9, FY - 4 - h);
      return;
    }
    case 'walk': {
      if (st.x < tor.x + tor.at) { // dribbeln
        drawSprite(L, 'drib', runFr, st.x);
        const h = Math.abs(Math.sin(st.x / ws / 3 * Math.PI)) * 13;
        ball(sx(st.x) + 10, FY - 4 - h);
      } else drawSprite(L, suit ? 'walk' : 'run', runFr, st.x);
      return;
    }
    case 'tor': {
      const q = st.q, gx = tor.x + tor.at + GOAL_DX, nearY = FY - 2;
      let pose = 'hold', fr = idleFr, lift = 0;
      if (q < 0.12) { pose = 'drib'; fr = Math.floor(q * 60) % 6; }
      else if (q < 0.22) { pose = 'wind'; fr = 0; }
      else if (q < 0.42) { pose = 'wind'; fr = 1; lift = Math.sin(seg(q, 0.22, 0.62) * Math.PI) * 16; }
      else if (q < 0.62) { pose = 'throw'; fr = 1; lift = Math.sin(seg(q, 0.22, 0.62) * Math.PI) * 16; }
      else { pose = 'jubel'; fr = Math.floor(T * 6) % 2; }
      const jx = st.x + Math.round(seg(q, 0.22, 0.62) * 14); // Sprung in den Kreis
      drawSprite(L, pose, fr, jx, lift);
      // Ball: in der Hand, dann Flug ins Tor
      const hx = sx(jx);
      if (q < 0.12) ball(hx + 10, FY - 4 - Math.abs(Math.sin(q * 30)) * 12);
      else if (q < 0.45) ball(hx + (q < 0.22 ? 9 : -6), FY - (q < 0.22 ? 24 : 46) - lift);
      else {
        const k = seg(q, 0.45, 0.6), bx = lerp(hx + 12, sx(gx) + 12, k), by = lerp(FY - 44 - 16, nearY - 36, k) - Math.sin(k * Math.PI) * 8;
        if (q < 0.6) ball(Math.round(bx), Math.round(by)); else ball(sx(gx) + 14, Math.round(lerp(nearY - 36, FY - 9, ease(seg(q, 0.6, 0.72)))));
      }
      return;
    }
    case 'tv': {
      const q = st.q;
      drawSprite(L, q > 0.42 ? 'jubel' : 'idle', q > 0.42 ? Math.floor(T * 6) % 2 : idleFr, st.x, q > 0.42 ? Math.abs(Math.sin(T * 7)) * 5 : 0);
      return;
    }
    case 'zeitung': {
      const q = st.q;
      if (q < 0.06 || q > 0.94) { drawSprite(L, 'idle', 0, st.x); return; }
      const fr = Math.floor(T * 1.5) % 2;
      g.drawImage(sprite(L, 'read', fr), sx(st.x) - AX, FY - AY);
      newspaper(st.x, q, fr);
      return;
    }
    case 'buero': {
      const q = st.q, lifted = q > 0.3 && q < 0.92;
      const fr = Math.floor(T * 4) % 2;
      drawSprite(L, lifted ? 'lift' : 'idle', lifted ? fr : idleFr, st.x + (lifted ? 6 : 0), 0);
      if (lifted) trophy(sx(st.x + 6) + 2, FY - 46 - fr);
      return;
    }
    case 'kabine': {
      const q = st.q;
      if (q < 0.12 || q > 0.8) drawSprite(L, q > 0.88 ? 'point' : 'idle', q > 0.88 ? Math.floor(T * 3) % 2 : 0, st.x);
      return;
    }
    case 'finale': {
      drawSprite(L, st.q > 0.25 ? 'point' : 'idle', Math.floor(T * 2) % 2, st.x);
      return;
    }
  }
}

// ================= Bild aufbauen =================
let st = stateAt(0), shownU = 0, targetU = 0, lastT = performance.now(), fired = {};
function render() {
  const now = performance.now(), dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; T += dt;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  shownU = reduce ? targetU : lerp(shownU, targetU, Math.min(1, dt * 10));
  if (Math.abs(shownU - targetU) < 0.05) shownU = targetU;
  st = stateAt(shownU);
  // Kamera: Figur links im Bild, bei Aktionen etwas weiter mittig
  let a = 0.33;
  if (st.hold && st.seg.scene && st.seg.scene.cam != null) {
    const sc = st.seg.scene, want = sc.need ? Math.max(0.06, Math.min(sc.cam, (W - sc.need) / W)) : sc.cam;
    const k = ease(seg(st.q, 0, 0.12)) * (1 - ease(seg(st.q, 0.9, 1))); a = lerp(0.33, want, k);
  }
  if (st.kind === 'intro') a = 0.45;
  cam = clamp(st.x - W * a, 0, WORLD - W);
  if (W > WORLD) cam = 0;

  g.imageSmoothingEnabled = false;
  g.fillStyle = '#07060b'; g.fillRect(0, 0, W, H);
  const tor = SCENES[1], torQ = st.kind === 'tor' ? st.q : 0;
  const cheer = st.kind === 'tor' ? seg(torQ, 0.58, 0.66) : st.kind === 'finale' ? 1 : 0;
  SCENES.forEach(s => {
    const a0 = sx(s.x), a1 = sx(s.x + s.w);
    if (a1 < 0 || a0 > W) return;
    g.save(); g.beginPath(); g.rect(a0, 0, s.w, H); g.clip();
    if (s.id === 'halle') arena(s, { center: 300 });
    if (s.id === 'tor') {
      arena(s, { cheer, board: torQ > 0.6 ? '+++ TOOOR! +++ TOOOR! +++ ' : undefined });
      const net = st.kind === 'tor' ? seg(torQ, 0.58, 0.62) * (1 - seg(torQ, 0.62, 0.8)) : 0;
      goal(sx(s.x + s.at + GOAL_DX), net);
      // Torwart
      const gq = torQ, dive = st.kind === 'tor' && gq > 0.5 && gq < 0.85;
      g.drawImage(sprite(KEEPER, dive ? 'star' : 'gk', dive ? 0 : Math.floor(T * 3) % 2, true), sx(s.x + s.at + GOAL_DX - 14) - AX + (dive ? -2 : 0), FY - 5 - AY - (dive ? 8 : 0));
    }
    if (s.id === 'tv') tvScene(s, st);
    if (s.id === 'zeitung') kitchen(s, st);
    if (s.id === 'buero') office(s, st);
    if (s.id === 'kabine') locker(s, st);
    if (s.id === 'finale') { arena(s, { night: true, cheer: 1, board: '+++ JETZT SPIELEN +++ DEINE LEGENDE BEGINNT +++ ' }); finaleExtras(s, st); }
    g.restore();
  });
  SCENES.slice(1).forEach(s => divider(s.x));

  hero(st);
  // Vordergrund
  const zt = SCENES[3]; if (sx(zt.x) < W && sx(zt.x + zt.w) > 0) { g.save(); g.beginPath(); g.rect(sx(zt.x), 0, zt.w, H); g.clip(); kitchenFront(zt, st); g.restore(); }
  const kb = SCENES[5]; if (sx(kb.x) < W && sx(kb.x + kb.w) > 0) { g.save(); g.beginPath(); g.rect(sx(kb.x), 0, kb.w, H); g.clip(); curtain(kb, st); if (st.kind === 'kabine') clothes(kb, st.q); g.restore(); }

  // Konfetti bei Tor, Pokal und Finale
  const trig = (key, cond, fn) => { if (cond && !fired[key]) { fired[key] = 1; fn(); } if (!cond) fired[key] = 0; };
  trig('tor', st.kind === 'tor' && st.q > 0.6, () => confetti(tor.x + tor.at + 120, 0, 50, 200));
  trig('cup', st.kind === 'buero' && st.q > 0.32 && st.q < 0.9, () => confetti(st.x + 6, 10, 70, 140));
  trig('fin', st.kind === 'finale' && st.q > 0.2, () => confetti(st.x, 0, 90, W));
  stepConfetti(dt);

  // „TOR!“-Einblendung
  if (st.kind === 'tor' && torQ > 0.6 && torQ < 0.95) {
    const k = seg(torQ, 0.6, 0.66), y = Math.round(lerp(-20, H * 0.2, ease(k)));
    g.font = `16px ${PIX}`; g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillStyle = '#000'; g.fillText('TOR!', W * 0.4 + 2, y + 3);
    g.fillStyle = '#c96a12'; g.fillText('TOR!', W * 0.4, y + 2);
    g.fillStyle = '#ffc83a'; g.fillText('TOR!', W * 0.4, y);
  }
  // Abdunklung oben für lesbare Texte, Vignette
  const sh = g.createLinearGradient(0, 0, 0, H * 0.55);
  sh.addColorStop(0, 'rgba(7,6,11,.55)'); sh.addColorStop(1, 'rgba(7,6,11,0)');
  g.fillStyle = sh; g.fillRect(0, 0, W, H * 0.55);
  onFrame(st);
}

// ================= Seite: Größe, Scroll, Texte =================
const film = document.getElementById('film');
const sticky = film.querySelector('.film-sticky');
const caps = [...film.querySelectorAll('[data-scene]')];
const heroCap = film.querySelector('.cap-hero');
const hudNo = document.getElementById('hudNo'), hudLbl = document.getElementById('hudLbl'), hudFill = document.getElementById('hudFill'), hudBall = document.getElementById('hudBall');
let unitPx = 3;

function resize() {
  const vw = sticky.clientWidth, vh = sticky.clientHeight;
  // Pixelgröße: Höhe mindestens 180 logische Pixel, Breite mindestens 230
  SCALE = Math.max(1.5, Math.min(vh / 165, vw / 150));
  W = Math.ceil(vw / SCALE); H = Math.ceil(vh / SCALE);
  FY = H - 24;
  cv.width = W; cv.height = H;
  unitPx = Math.max(1.6, SCALE * 0.72);
  film.style.height = (TL.total * unitPx + vh) + 'px';
  update();
}
function update() {
  const r = film.getBoundingClientRect();
  targetU = clamp(-r.top / unitPx, 0, TL.total);
}
// Nutzungsstatistik: jede Szene einmal pro Besuch zählen (wie weit wird gescrollt?)
const SEEN = new Set();
function seen(sc) { if (SEEN.has(sc.id)) return; SEEN.add(sc.id); try { if (window.umami) window.umami.track('story-szene', { szene: sc.id, nr: SCENES.indexOf(sc) + 1 }); } catch (e) { } }
function onFrame(s) {
  // Hero-Text verschwindet mit dem ersten Scrollen
  const h = 1 - seg(s.u, INTRO.len * 0.25, INTRO.len * 0.9);
  heroCap.style.opacity = h; heroCap.style.transform = `translate3d(${-(1 - h) * 60}px,0,0)`; heroCap.style.visibility = h < 0.02 ? 'hidden' : 'visible';
  // Szenen-Texte gleiten von rechts herein und nach links hinaus
  let active = 0;
  caps.forEach(c => {
    const sc = SCENES.find(x => x.id === c.dataset.scene);
    const enter = sc.x - W * 0.15, len = sc.w;
    let f = (s.x - enter) / len;
    if (sc.id === 'halle') f = s.kind === 'intro' ? -1 : (s.x - INTRO.x) / (sc.w - INTRO.x) * 0.9 + 0.08;
    if (s.hold && s.kind !== 'intro' && s.seg.scene === sc) f = clamp(f, 0.2, 0.8);
    const vis = f < 0.05 ? seg(f, -0.15, 0.05) : 1 - seg(f, 0.85, 1.05);
    const dx = f < 0.5 ? (1 - vis) * 80 : -(1 - vis) * 80;
    c.style.opacity = vis.toFixed(3); c.style.transform = `translate3d(${dx}px,0,0)`; c.style.visibility = vis < 0.02 ? 'hidden' : 'visible';
    if (vis > 0.5) { active = SCENES.indexOf(sc); seen(sc); }
  });
  const idx = SCENES.indexOf(s.scene);
  hudNo.textContent = String(s.kind === 'intro' ? 0 : idx + 1).padStart(2, '0');
  hudLbl.textContent = s.kind === 'intro' ? 'ANPFIFF' : s.scene.label;
  const p = s.u / TL.total;
  hudFill.style.width = (p * 100) + '%';
  hudBall.style.left = `calc(${p * 100}% + ${6 - p * 12}px)`;
}

let running = false;
function loop() { if (!running) return; render(); requestAnimationFrame(loop); }
const io = new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v && !running) { running = true; lastT = performance.now(); requestAnimationFrame(loop); } else if (!v) running = false; });
io.observe(film);
addEventListener('scroll', update, { passive: true });
addEventListener('resize', resize);
if (document.fonts) document.fonts.ready.then(() => { SPR.clear(); });
resize();
render();

// für Tests: window.__story.go(u)
window.__story = { total: () => TL.total, unitPx: () => unitPx, TL, SCENES };
})();
