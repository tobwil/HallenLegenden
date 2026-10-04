// ================= Touch, Hauptschleife, Start =================
if ('ontouchstart' in window || matchMedia('(pointer:coarse)').matches) document.body.classList.add('touch');
fitView(); addEventListener('resize', fitView); addEventListener('orientationchange', () => setTimeout(fitView, 250));
// Kein Browser-Zoom beim Spielen mit zwei Daumen: iOS Safari ignoriert user-scalable=no und zoomt bei Stick + Knopf per Pinch.
// Safaris Gesten-Events und Mehrfinger-Bewegungen abfangen; falls doch gezoomt wurde, Zoom zurücksetzen.
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
if (window.visualViewport) visualViewport.addEventListener('resize', () => {
  const vp = document.getElementById('vp'); if (!vp || visualViewport.scale <= 1.01) return;
  const c = vp.content; vp.content = 'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  setTimeout(() => { vp.content = c; }, 300);
});
const buzz = ms => { if (TOUCHDEV && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } };
const attacking = () => !!(G && G.human >= 0 && ((G.ball.owner && G.ball.owner.team === G.human) || (G.ball.passTo && G.ball.passTo.team === G.human)));
// Tippen aufs Spielfeld: Mitspieler = Pass, Tor = Wurf in diese Ecke, in der Abwehr = Spielerwechsel
function tapAt(cx0, cy0) {
  if (!G || G.demo || !menu.hidden) return;
  if (['intro', 'replay', 'halftime', 'goal'].includes(G.phase)) { KEY.Enter = true; setTimeout(() => { KEY.Enter = false; }, 60); return; }
  const r = cv.getBoundingClientRect(); if (cx0 < r.left || cx0 > r.right || cy0 < r.top || cy0 > r.bottom) return;
  const cx = (cx0 - r.left) * W / r.width, cy = (cy0 - r.top) * H / r.height, me = G.human; if (me < 0) return;
  let hit = null, hd = 1e9;
  for (const p of G.players) { if (p.out) continue; const px = sx(p.x, p.y), py = sy(p.y, p.z) - 24, d = Math.hypot((cx - px) * 1.4, cy - py); if (Math.abs(cx - px) < 16 && cy > py - 34 && cy < py + 30 && d < hd) { hd = d; hit = p; } }
  const c = G.ctrl, own = G.ball.owner;
  if ((G.phase === 'play' || G.phase === 'penalty') && own && own === c && c.team === me) {
    const gx = goalX(me), gsx = sx(gx, 10), top = sy(GY1, 2.3), bot = sy(GY2, 0);
    if (Math.abs(cx - gsx) < 34 && cy > top - 8 && cy < bot + 8) {
      const aim = clamp(((cy - top) / (bot - top)) * 2 - 1, -1, 1);
      if (G.phase === 'penalty') { if (G.phaseT <= 0) { shoot(c, aim, 0.7); G.phase = 'play'; AU.whistle(1); } }
      else shoot(c, aim, 0.65);
      return;
    }
    if (G.phase === 'play' && hit && hit.team === me && hit !== c && hit.role !== 'TW') { pass(c, hit); buzz(12); }
    return;
  }
  if (G.phase === 'play' && hit && !attacking()) {
    const n = hit.team === me ? hit : nearestTo(me, hit.x, hit.y);
    if (n && n.role !== 'TW') { G.ctrl = n; G.manT = G.t; AU.select(); buzz(8); }
  }
}
(() => {
  const zone = document.getElementById('zone'), st = document.getElementById('stick'), kn = document.getElementById('knob'), R = 50, pend = new Map();
  let sid = null, sx0 = 0, sy0 = 0;
  const rest = () => { st.style.left = ''; st.style.top = ''; st.classList.remove('act'); kn.style.transform = ''; TOUCH.x = TOUCH.y = 0; TOUCH.s = false; };
  const move = e => { const dx = e.clientX - sx0, dy = e.clientY - sy0, m = Math.hypot(dx, dy), k = Math.min(1, R / (m || 1)); TOUCH.x = dx * k / R; TOUCH.y = dy * k / R; TOUCH.s = m > R * 1.15; kn.style.transform = `translate(${dx * k}px,${dy * k}px)`; };
  zone.addEventListener('pointerdown', e => { AU.init(); zone.setPointerCapture(e.pointerId); pend.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), left: e.clientX < innerWidth * 0.5 }); });
  zone.addEventListener('pointermove', e => {
    if (e.pointerId === sid) return move(e);
    const p = pend.get(e.pointerId); if (!p) return;
    // Daumen links ziehen = mitwandernder Stick, dort wo der Daumen aufsetzt
    if (p.left && sid === null && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) { sid = e.pointerId; sx0 = p.x; sy0 = p.y; st.style.left = p.x + 'px'; st.style.top = p.y + 'px'; st.classList.add('act'); pend.delete(e.pointerId); move(e); }
  });
  const end = e => {
    if (e.pointerId === sid) { sid = null; rest(); return; }
    const p = pend.get(e.pointerId); pend.delete(e.pointerId);
    if (e.type === 'pointerup' && p && performance.now() - p.t < 380 && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 16) tapAt(e.clientX, e.clientY);
  };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  document.querySelectorAll('.tb').forEach(b => {
    const k = b.dataset.k; let holdT = null, kDone = false;
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); b.setPointerCapture(e.pointerId); AU.init(); b.classList.add('on');
      if (k === 'a') {
        if (attacking()) { kDone = false; holdT = setTimeout(() => { holdT = null; kDone = true; TOUCH.pulseA = 1; TOUCH.pulseK = 1; b.classList.add('kempa'); buzz(25); }, 450); }   // lange drücken = Kempa
        else TOUCH.pulseA = 1;
      } else TOUCH[k] = true;
    });
    const rel = () => { b.classList.remove('on', 'kempa'); if (k === 'a') { if (holdT) { clearTimeout(holdT); holdT = null; if (!kDone) TOUCH.pulseA = 1; } } else TOUCH[k] = false; };
    b.addEventListener('pointerup', rel); b.addEventListener('pointercancel', rel);
  });
})();
// Knopfbeschriftung je nach Spielsituation
// Knopfgröße aus den Optionen (klein, normal, groß)
const BTN_SCALE = { s: 0.82, m: 1, l: 1.18 };
function applyBtnSize() { document.getElementById('pad').style.setProperty('--tbs', BTN_SCALE[SETTINGS.btn] || 1); }
applyBtnSize();
// Tipp in den ersten beiden Spielen auf dem Handy: Antippen geht oft schneller als die Knöpfe
let tipG = null;
function touchTip() {
  if (!TOUCHDEV || !G || G.demo || G === tipG || G.phase !== 'kickoff' || !menu.hidden) return;
  tipG = G; const n = store.get('hl4_touchtip', 0); if (n >= 2) return; store.set('hl4_touchtip', n + 1);
  const el = document.createElement('div'); el.id = 'ttip'; el.setAttribute('role', 'dialog');
  el.innerHTML = '<b>TIPP: EINFACH ANTIPPEN</b><ul><li>Mitspieler antippen = Pass zu ihm</li><li>Tor antippen = Wurf in diese Ecke</li><li>In der Abwehr: Spieler antippen = zu ihm wechseln</li><li>PASS lang drücken = Kempa · Stick weit ziehen = Sprint</li></ul><button>VERSTANDEN</button>';
  G.paused = true;
  const close = () => { el.remove(); if (G && menu.hidden) G.paused = false; };
  el.querySelector('button').addEventListener('click', close); el.addEventListener('pointerdown', e => e.stopPropagation());
  document.body.appendChild(el);
}
const TBL = { a: document.querySelector('.tb-a'), b: document.querySelector('.tb-b'), c: document.querySelector('.tb-c') }; let tbMode = '';
function updateTouchLabels() {
  if (!TOUCHDEV || !G || G.demo) return;
  const m = attacking() ? 'att' : 'def'; if (m === tbMode) return; tbMode = m;
  const L = m === 'att' ? ['PASS', 'WURF', 'FINTE'] : ['WECHSEL', 'BLOCK', 'KLAU'];
  TBL.a.textContent = L[0]; TBL.b.textContent = L[1]; TBL.c.textContent = L[2];
}
addEventListener('pointerdown', () => AU.init());
document.getElementById('tbPause').addEventListener('pointerdown', e => { e.preventDefault(); AU.init(); if (!menu.hidden) menuBack(); else togglePause(); });
document.getElementById('rotOk').addEventListener('click', () => document.body.classList.add('portraitok'));
// Gamepad im Menü: Steuerkreuz/Stick navigiert, A bestätigt, B zurück
const PADM = {};
// Trikotfarben zum Durchschalten (Gamepad, Pfeiltasten): die Vereinsfarben aus dem Spiel und ein paar weitere, nach Farbton sortiert
const KIT_PALETTE = (() => {
  const hsl = h => { const [r, g, b] = hexRgb(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
    const hue = !d ? 0 : mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return { h: hue, s: d, l }; };
  const cols = [];   // fast gleiche Farben nur einmal, damit jeder Druck sichtbar etwas ändert
  const extra = ['#7a1f2b', '#ff6fae', '#8a8f99', '#c9a227', '#2ec4b6', '#a4e04a'];   // Bordeaux, Pink, Grau, Gold, Türkis, Hellgrün
  for (const c of ['#ffffff', '#16161a'].concat(TEAM_BASE.flatMap(t => [t[2], t[3]]), extra).map(c => c.toLowerCase())) if (!cols.some(x => colDist(x, c) < 40)) cols.push(c);
  return cols.sort((x, y) => { const a = hsl(x), b = hsl(y), ga = a.s < 0.12, gb = b.s < 0.12; return ga !== gb ? (ga ? -1 : 1) : ga ? a.l - b.l : a.h - b.h || a.l - b.l; });
})();
// Wert eines Menüelements ändern statt den Fokus zu bewegen: Regler ±5, Auswahlliste ±1 Eintrag, Trikotfarbe ±1 Palettenfarbe
function menuAdjust(el, d, wrap) {
  if (!el || !menu.contains(el)) return false;
  const fire = (...ev) => ev.forEach(n => el.dispatchEvent(new Event(n, { bubbles: true })));
  if (el.tagName === 'SELECT') {
    const n = el.options.length, i = wrap ? (el.selectedIndex + d + n) % n : clamp(el.selectedIndex + d, 0, n - 1);
    if (i !== el.selectedIndex) { const id = el.id; el.selectedIndex = i; fire('input', 'change'); const now = id && menu.querySelector('#' + id); if (now && document.activeElement !== now) now.focus(); }   // Editor baut sich beim Wechsel neu auf
    return true;
  }
  if (el.type === 'range') { el.value = clamp(+el.value + d * 5, +el.min || 0, +el.max || 100); fire('input', 'change'); return true; }
  if (el.type === 'color') {
    const v = el.value.toLowerCase(), near = KIT_PALETTE.reduce((bi, c, i) => colDist(c, v) < colDist(KIT_PALETTE[bi], v) ? i : bi, 0);
    const i = KIT_PALETTE[near] === v ? (near + d + KIT_PALETTE.length) % KIT_PALETTE.length : near;
    el.value = KIT_PALETTE[i]; fire('input', 'change'); return true;
  }
  return false;
}
// Pfeil links/rechts auf einer Trikotfarbe oder Auswahlliste: Wert ändern wie mit dem Gamepad (Regler kann der Browser selbst,
// hoch/runter auf der Liste bleibt beim Browser)
addEventListener('keydown', e => {
  const el = document.activeElement;
  if (menu.hidden || !el || !['color', 'select-one'].includes(el.type) || !['ArrowLeft', 'ArrowRight'].includes(e.code)) return;
  e.preventDefault(); e.stopImmediatePropagation(); menuAdjust(el, e.code === 'ArrowLeft' ? -1 : 1);
}, true);
function menuPad() {
  if (!navigator.getGamepads) return;
  for (const gp of navigator.getGamepads()) {
    if (!gp) continue;
    const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed), ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    if (gp.buttons.some(x => x && x.pressed) || Math.hypot(ax, ay) > 0.5) setInput('pad');
    const st = { up: b(12) || ay < -0.6, down: b(13) || ay > 0.6, left: b(14) || ax < -0.6, right: b(15) || ax > 0.6, a: b(0), b: b(1) }, now = performance.now();
    // im Spiel gehaltene Knöpfe gelten erst nach dem Loslassen im Menü (sonst klickt ein Pass beim Abpfiff gleich etwas an)
    if (menu.hidden) { for (const k in st) PADM[k] = st[k] ? Infinity : false; return; }
    for (const k in st) {
      if (!st[k]) { PADM[k] = false; continue; }
      const el = document.activeElement, adj = (k === 'left' || k === 'right') && el && menu.contains(el) && (el.tagName === 'SELECT' || el.type === 'range' || el.type === 'color');
      // neu gedrückt; links/rechts beim Wertändern wiederholen sich beim Halten (nach 0,35 s alle 0,08 s)
      if (PADM[k]) { if (!adj || now < PADM[k]) continue; PADM[k] = now + 80; } else PADM[k] = now + 350;
      if (k === 'a') { if (el && menu.contains(el) && (el.tagName === 'SELECT' || el.type === 'color')) menuAdjust(el, 1, true); else if (el && menu.contains(el) && el.type === 'range') menuMove('down'); else if (el && menu.contains(el)) el.click(); else menuMove('down'); }
      else if (k === 'b') menuBack();
      else if (adj) menuAdjust(el, k === 'left' ? -1 : 1);
      else menuMove(k);
    }
    break;
  }
}
cv.addEventListener('pointerdown', () => { if (G && !G.demo && ['intro', 'replay', 'halftime', 'goal'].includes(G.phase)) { KEY.Enter = true; setTimeout(() => { KEY.Enter = false; }, 60); } });

let lastT = performance.now();
function frame(now) {
  const dt = Math.max(0, Math.min(1 / 30, (now - lastT) / 1000)); lastT = now;
  readInput(dt); menuPad(); updateTouchLabels(); touchTip();
  document.body.classList.toggle('ingame', !!(G && !G.demo));
  if (G && !G.paused) {
    const sm = Math.min(G.slow || 1, G.slowT > 0 ? 0.4 : 1); G.slow = 1; G.slowT = Math.max(0, G.slowT - dt);
    step(dt * sm * (G.demo ? 1 : SETTINGS.speed));
    if (G && G.phase === 'play') { G.recAcc += dt * sm; if (G.recAcc >= 0.015) { G.recAcc = 0; G.rec.push(snapshot()); if (G.rec.length > 300) G.rec.shift(); } }
  }
  if (G) render();
  requestAnimationFrame(frame);
}
startDemo();
ACT.title();
// beide Zeichensätze laden: die Leinwand lädt Schriften nicht selbst nach, sonst fehlen Ć, Š, Ž, Ł … in Namen wie Petrović
(document.fonts && document.fonts.load ? Promise.all([document.fonts.load('8px "Press Start 2P"'), document.fonts.load('8px "Press Start 2P"', 'ĆČŠŽŁŐ')]) : Promise.resolve()).then(() => { if (G) buildArena(G.kits[0], G.kits[1], G.lg, G.event); }).catch(() => { });
requestAnimationFrame(frame);
