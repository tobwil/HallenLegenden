'use strict';
// ================= Kern: Maße, Projektion, Helfer =================
let W = 640; const H = 360;   // W wächst auf breiten Bildschirmen (siehe fitView), H bleibt fest
const CW = 40, CH = 20, GY1 = 8.5, GY2 = 11.5, GH = 2, GRAV = 9.8;
const FAR_Y = 152, DY = 9.2, PX = 19, ZPX = 19;            // Sichtachse: Seitenlinie oben bei y=152, 9,2 px pro Tiefenmeter
const kOf = y => 0.8 + 0.2 * (y / CH);                      // horizontale Perspektive (hinten schmaler)
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const FONT = '"Press Start 2P", ui-monospace, monospace';
const TOUCHDEV = 'ontouchstart' in window || matchMedia('(pointer:coarse)').matches;
let CAMX = 20;                                              // Kamerazentrum in Weltmetern
const sx = (x, y) => Math.round(W / 2 + (x - CAMX) * PX * kOf(y));
const sy = (y, z = 0) => Math.round(FAR_Y + y * DY - z * ZPX);
let VIEW_HALF = W / 2 / PX;
const CAM_HALF = 640 / 2 / PX;                               // halbe Sichtbreite bei 16:9 in Metern
// Kamera-Anschlag: Am Desktop wie bisher. Auf Touch-Geräten fährt die Kamera bei breitem Bild weiter über das Spielfeldende hinaus,
// damit das Tor vor den Wurf- und Pass-Knöpfen liegt und dahinter nur Hallenboden verdeckt ist.
const camHalf = () => TOUCHDEV ? 2 * CAM_HALF - VIEW_HALF : VIEW_HALF;
const hudR = () => W - (TOUCHDEV ? 54 : 0);                 // rechter Rand fürs HUD oben, auf Touch-Geräten neben dem Pause-Knopf
// Spielfeldbreite an das Seitenverhältnis anpassen: 16:9 (640 px) bis 20:9 (800 px). Breite Handys zeigen mehr Halle statt schwarzer Ränder,
// die Höhe bleibt 360 px, nichts wird verzerrt oder abgeschnitten. Die Kamera zeigt an den Spielfeldenden nicht mehr als bisher.
function fitView() {
  const cs = getComputedStyle(document.body), aw = innerWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const ah = innerHeight - (document.body.classList.contains('touch') ? 0 : 24), w = Math.min(800, Math.max(640, Math.round(H * aw / Math.max(1, ah) / 2) * 2));
  document.documentElement.style.setProperty('--ar', `${w} / ${H}`);
  if (w === W) return;
  W = w; VIEW_HALF = W / 2 / PX; cv.width = W; ctx.imageSmoothingEnabled = false;   // neue Canvas-Breite setzt den Zeichenzustand zurück
}

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const pick = a => a[(Math.random() * a.length) | 0];
const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeBack = t => { t = clamp(t, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  const t = l ? clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}
const goalDist = (x, y, gx) => segDist(x, y, gx, GY1, gx, GY2);
const inArea = (x, y) => goalDist(x, y, 0) < 6 || goalDist(x, y, CW) < 6;
function pushOut(p, r = 6.05) {
  for (const gx of [0, CW]) {
    const cy = clamp(p.y, GY1, GY2), dx = p.x - gx, dy = p.y - cy, d = Math.hypot(dx, dy);
    if (d < r) {
      if (d < 1e-3) p.x = gx + (gx ? -r : r);
      else { const ax = gx === 0 ? Math.abs(dx) : -Math.abs(dx); p.x = gx + ax / d * r; p.y = cy + dy / d * r; }
    }
  }
}
function seeded(seed) { let s = (seed >>> 0) || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function shade(h, f) { const c = hexRgb(h); return rgbHex(c[0] * f, c[1] * f, c[2] * f); }
function mix(a, b, t) { const x = hexRgb(a), y = hexRgb(b); return rgbHex(lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)); }
function colDist(a, b) { const x = hexRgb(a), y = hexRgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); }
const lum = h => { const c = hexRgb(h); return (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255; };
const store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } },
};
// Nutzungsstatistik (Umami): Skript lädt nur auf hallenlegenden.de, sonst ohne Wirkung
const track = (name, data) => { try { if (window.umami) window.umami.track(name, data); } catch (e) { } };
const SETTINGS = Object.assign({ speed: 1 }, store.get('hl4_settings', {}));

// ================= Ligen 2026/27 =================
// Fantasienamen (Stadt + Spitzname), Ligazugehörigkeit und Stärke nach der Saison 2026/27.
// Namen, Kürzel und Farben lassen sich im Editor ändern (wird nur im Browser gespeichert).
const TEAM_BASE = [
  ['MAG', 'Magdeburg Domstürmer', '#0a8a3e', '#e30613', 1, 91], ['FLE', 'Flensburg Fördeblitz', '#0b3d91', '#e2001a', 1, 89],
  ['KIE', 'Kiel Leuchttürme', '#f4f4f0', '#16161a', 1, 89], ['BER', 'Berlin Hauptstadtbären', '#0f8a4a', '#ffffff', 1, 90],
  ['HAN', 'Hannover Leineritter', '#d0021b', '#141414', 1, 85], ['MEL', 'Melsungen Fuldataler', '#c8102e', '#f2f2f2', 1, 86],
  ['GUM', 'Gummersbach Oberbergler', '#0057a8', '#ffffff', 1, 85], ['ERL', 'Erlangen Regnitzer', '#1b2f6b', '#f39200', 1, 80],
  ['KUR', 'Rhein-Neckar Kurpfälzer', '#ffd200', '#0a2d6e', 1, 84], ['GÖP', 'Göppingen Hohenstaufen', '#00863f', '#f5f5f5', 1, 79],
  ['STU', 'Stuttgart Neckarwilde', '#b0122c', '#ffffff', 1, 78], ['BAL', 'Balingen Zollernalb', '#f07d00', '#141414', 1, 76],
  ['LEM', 'Lemgo Lippe-Hanse', '#0050a0', '#f4f4f4', 1, 82], ['HAM', 'Hamburg Hafenriesen', '#1d1d24', '#3ba3e8', 1, 79],
  ['EIS', 'Eisenach Wartburgritter', '#1356a8', '#ffffff', 1, 79], ['BIE', 'Bietigheim Enzwölfe', '#e30613', '#13306b', 1, 76],
  ['WET', 'Wetzlar Lahnadler', '#008d4c', '#f4f4f4', 1, 78], ['WUP', 'Wuppertal Bergwölfe', '#6aa82f', '#141414', 1, 75],
  ['LEI', 'Leipzig Messestädter', '#00a14b', '#ffffff', 2, 77], ['MIN', 'Minden Weserstürmer', '#00733a', '#ffffff', 2, 76],
  ['DRE', 'Dresden Zwingerkrieger', '#c8102e', '#1b2a4a', 2, 73], ['POT', 'Potsdam Havelkönige', '#1d4f91', '#e6e6e6', 2, 74],
  ['HAG', 'Hagen Volmetaler', '#173f8a', '#ffd200', 2, 73], ['NOR', 'Nordhorn Vechtestürmer', '#101820', '#ffcd00', 2, 73],
  ['LÜB', 'Lübeck Holstentorer', '#00a0dc', '#ffffff', 2, 71], ['LBK', 'Lübbecke Wiehenkrieger', '#d71920', '#ffffff', 2, 74],
  ['COB', 'Coburg Vestekämpfer', '#004b93', '#fff200', 2, 74], ['DES', 'Dessau Muldehaie', '#0a3d91', '#e30613', 2, 70],
  ['HÜT', 'Hüttenberg Lahnauer', '#e2001a', '#1a1a1a', 2, 70], ['GRW', 'Großwallstadt Mainfranken', '#b5123b', '#ffffff', 2, 71],
  ['LUD', 'Ludwigshafen Rheinpiraten', '#1d1d1b', '#ffcc00', 2, 71], ['DOR', 'Dormagen Rheinwerker', '#0055a5', '#e2001a', 2, 72],
  ['ESS', 'Essen Zechenkumpel', '#00589c', '#ffffff', 2, 71], ['FER', 'Ferndorf Siegerländer', '#a3001e', '#141414', 2, 69],
  ['EMS', 'Emsdetten Emsflitzer', '#ffd400', '#0a3a7a', 2, 70], ['HMM', 'Hamm Westfalenhammer', '#e30613', '#f4f4f4', 2, 71],
  // Internationale Vereine (Liga 3 = Europapokal, keine Ligazugehörigkeit). Fantasienamen aus Stadt und Spitzname
  ['BAR', 'Barcelona Katalanenstiere', '#004d98', '#a50044', 3, 93], ['VES', 'Veszprém Bakonylöwen', '#d0021b', '#ffffff', 3, 92],
  ['PAR', 'Paris Seinelöwen', '#0b1f4b', '#e30613', 3, 91], ['AAL', 'Aalborg Limfjordwikinger', '#ffffff', '#d40029', 3, 90],
  ['KIC', 'Kielce Kreuzritter', '#ffd400', '#1a3c8f', 3, 89], ['SZE', 'Szeged Theißfischer', '#1e5aa8', '#ffffff', 3, 88],
  ['NAN', 'Nantes Loirekanoniere', '#7a2b8f', '#ffffff', 3, 87], ['PLK', 'Płock Weichselwölfe', '#00539f', '#ffffff', 3, 86],
  ['LIS', 'Lissabon Tejolöwen', '#00843d', '#ffffff', 3, 86], ['POR', 'Porto Douro-Drachen', '#003da5', '#ffffff', 3, 85],
  ['MON', 'Montpellier Okzitanier', '#f39200', '#0a2d6e', 3, 85], ['ODE', 'Odense Fünenfalken', '#141414', '#e30613', 3, 84],
  ['ZAG', 'Zagreb Savestürmer', '#002f6c', '#d52b1e', 3, 83], ['BUC', 'Bukarest Karpatenadler', '#c8102e', '#f4f4f4', 3, 83],
  ['KRI', 'Kristianstad Schonenelche', '#ffffff', '#0a3d91', 3, 82], ['ELV', 'Elverum Glommatrolle', '#d71920', '#141414', 3, 81],
];
const TEAM_KEY = 'hl2_vereine';
let TEAM_EDIT = store.get(TEAM_KEY, {});
const TEAMS = TEAM_BASE.map(([k, n, c1, c2, lg, r], id) => ({ id, k, n, c1, c2, lg, r }));
function defaultAway(c1, c2) { return lum(c2) > 0.8 || colDist(c2, c1) > 140 ? { c1: c2, c2: c1 } : { c1: '#f4f4f0', c2: c1 }; }
function applyTeam(t) {
  const [k, n, c1, c2] = TEAM_BASE[t.id], e = TEAM_EDIT[t.id] || {};
  t.k = (e.k || k).toUpperCase().slice(0, 3); t.n = e.n || n;
  t.home = { c1: e.h1 || c1, c2: e.h2 || c2 };
  const da = defaultAway(t.home.c1, t.home.c2); t.away = { c1: e.a1 || da.c1, c2: e.a2 || da.c2 };
  t.alt = lum(t.home.c1) < 0.35 && lum(t.away.c1) < 0.35 ? { c1: '#f4f4f0', c2: t.home.c1 } : { c1: '#1d1d24', c2: lum(t.home.c1) < 0.2 ? t.home.c2 : t.home.c1 };
  t.c1 = t.home.c1; t.c2 = t.home.c2;
  t.short = t.n.split(' ')[0];
}
TEAMS.forEach((t, i) => {
  applyTeam(t);
  const r = seeded(hashStr(TEAM_BASE[i][1]));
  t.att = Math.round(t.r + (r() - 0.5) * 8); t.def = Math.round(t.r + (r() - 0.5) * 8);
  t.gk = Math.round(t.r + (r() - 0.5) * 8); t.spd = Math.round(t.r + (r() - 0.5) * 8);
  t.gkc = ['#ffd23f', '#3fd0ff', '#9cff57', '#ff8bd1', '#ff9f1c', '#c58bff'][(r() * 6) | 0];
});
const LEAGUE = lg => TEAMS.filter(t => t.lg === lg);

const ROLES = ['TW', 'LA', 'RL', 'RM', 'RR', 'RA', 'KM'];
const ROLE_LONG = { TW: 'Torwart', LA: 'Linksaußen', RL: 'Rückraum links', RM: 'Rückraum Mitte', RR: 'Rückraum rechts', RA: 'Rechtsaußen', KM: 'Kreisläufer' };
const TRAITS = { TW: ['Krake', 'Reflexmonster'], LA: ['Flügelflitzer', 'Dreher-Künstler'], RA: ['Flügelflitzer', 'Dreher-Künstler'], RL: ['Kanonier', 'Spielmacher'], RR: ['Kanonier', 'Spielmacher'], RM: ['Spielmacher', 'Kanonier'], KM: ['Kreis-Turm', 'Sperren-König'] };
const SUR = ['Becker','Hoffmann','Krüger','Lehmann','Brandt','Vogel','Hartmann','Kühn','Seidel','Franke','Lorenz','Arnold','Pohl','Ziegler','Böhm','Sauer',
  'Haas','Kaiser','Keller','Roth','Graf','Jäger','Winter','Sommer','Busch','Engel','Horn','Voigt','Petersen','Jansen','Thiele','Kruse','Brinkmann',
  'Lange','Peters','Möller','Schulte','Wendt','Rademacher','Ott','Stein','Fuchs','Wolter','Kraft','Hein','Mertens','Ludwig','Behrens','Ehlers',
  'Larsen','Hansen','Dahl','Holm','Iversen','Strand','Lindqvist','Berglund','Nyborg','Kjær','Sørlie','Aalto','Virtanen','Eriksen','Mikkelsen',
  'Novak','Marić','Horvat','Kovač','Babić','Petrović','Jurić','Radić','Lazović','Duvnjak','Kos','Zorman','Blažek','Dvořák','Kowalski','Nowicki',
  'Garcia','Ruiz','Navarro','Moreno','Duarte','Fabregas','Dupont','Lefèvre','Moreau','Girard','Fontaine','Pires','Costa','Silva','Magnusson',
  'Jónsson','Gíslason','Sigurdsson','Halldórsson','Tønnesen','Østergaard','Svensson','Lund','Eklund','Arvidsson'];
const SKIN = [['#f3c9a2', '#d9a47c'], ['#e6b085', '#c98d62'], ['#c98c5c', '#a96d43'], ['#9a6440', '#7a4a2c'], ['#6e4428', '#52301b']];
const HAIR = ['#2a1a10', '#4a2e18', '#7a4a20', '#c9a050', '#e3c27a', '#1a1a1a', '#8a3a18', '#b8b0a0'];
const ROSTER_KEY = 'hl3_kader';
let ROSTER_EDIT = store.get(ROSTER_KEY, {});
// Hallen-Legenden aus dem echten Leben: feste Spieler mit den Werten des Spielers, den sie ersetzen (Teamstärke bleibt gleich).
// slot: Platz in der Startsieben (ohne Angabe: der Star-Platz). Aussehen: skin = Index in SKIN, style = Frisur (0 kurz mit Pony, 1 kurz,
// 6 lange offene Haare), beard = Vollbart, tall: 2 = sehr groß, musc = muskulös. trait: Eigenschaft auf der Spielerkarte.
// Nur für neue Karrieren: age = Alter, potPlus = Potenzial über dem aktuellen Wert.
const LEGENDS = {
  KIE: { name: 'Weidenhammer', skin: 1, hair: '#4a2e18', style: 1, beard: true, band: false, age: 27 },
  COB: { name: 'Schülein', skin: 1, hair: '#7e3f1e', style: 6, beard: false, band: false, age: 27 },
  BER: { slot: 6, name: 'Richardson', skin: 1, hair: '#1a1a1a', style: 1, beard: false, band: false, musc: true, trait: 'Supertalent', age: 19, potPlus: 11 },
  ERL: { slot: 6, name: 'Schörner', skin: 1, hair: '#4a2e18', style: 0, beard: false, band: false, tall: 2, trait: 'Kreis-Turm', age: 25 },
};
const LEGEND_KEYS = ['name', 'skin', 'hair', 'style', 'beard', 'band', 'tall', 'musc', 'trait'];
const LEGENDS_VER = 3;   // bei neuen Legenden erhöhen: laufende Karrieren rüsten sie dann beim Laden nach
const LEGEND_RENAMED = { 3: ['Hebbe', 'Schülein'] };   // umbenannte Legenden: Version, alter Name, neuer Name
const legendSlot = (L, ro) => L.slot ?? ro.findIndex((p, i) => i > 0 && p.star && p.role !== 'TW');
function roster(tid, plain) {
  const t = TEAMS[tid], r = seeded(hashStr(TEAM_BASE[tid][1] + '#kader')), used = new Set(), nums = new Set(), legend = !plain && LEGENDS[TEAM_BASE[tid][0]];
  const starIdx = 1 + ((r() * 6) | 0), gkStar = r() < 0.35;
  return ROLES.map((role, i) => {
    let n; do { n = SUR[(r() * SUR.length) | 0]; } while (used.has(n)); used.add(n);
    let num; do { num = role === 'TW' ? [1, 12, 16, 33][(r() * 4) | 0] : 2 + ((r() * 70) | 0); } while (nums.has(num)); nums.add(num);
    const v = () => Math.round((r() - 0.5) * 12);
    const star = i === starIdx || (role === 'TW' && gkStar);
    const b = star ? 7 : 0;
    const p = { name: n, num, role, star, trait: star ? TRAITS[role][(r() * 2) | 0] : '',
      att: Math.min(97, t.att + v() + b), pas: Math.min(97, t.att + v() + b), def: Math.min(97, t.def + v() + (role === 'KM' ? 3 : 0)), gk: Math.min(97, t.gk + v() + b), spd: Math.min(97, t.spd + v() + (role === 'LA' || role === 'RA' ? 5 : 0)), sta: Math.min(97, t.r + v() - (role === 'TW' ? 0 : 2)),
      skin: (r() * SKIN.length) | 0, hair: HAIR[(r() * HAIR.length) | 0], style: (r() * 6) | 0, beard: r() < 0.35, band: r() < 0.2, tall: role === 'KM' || role === 'RL' || role === 'RR' };
    if (legend && i === (legend.slot ?? starIdx)) { const { slot, ...look } = legend; Object.assign(p, look); }
    const ed = ROSTER_EDIT[tid] && ROSTER_EDIT[tid][i];
    if (ed) { if (ed.name) p.name = ed.name; if (ed.num) p.num = ed.num; }
    return p;
  });
}
