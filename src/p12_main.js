// ================= Touch, Hauptschleife, Start =================
if ('ontouchstart' in window || matchMedia('(pointer:coarse)').matches) document.body.classList.add('touch');
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
function menuPad() {
  if (menu.hidden || !navigator.getGamepads) return;
  for (const gp of navigator.getGamepads()) {
    if (!gp) continue;
    const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed), ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const st = { up: b(12) || ay < -0.6, down: b(13) || ay > 0.6, left: b(14) || ax < -0.6, right: b(15) || ax > 0.6, a: b(0), b: b(1) };
    for (const k in st) if (st[k] && !PADM[k]) { if (k === 'a') { const el = document.activeElement; if (el && menu.contains(el)) el.click(); else menuMove('down'); } else if (k === 'b') menuBack(); else menuMove(k); }
    Object.assign(PADM, st); break;
  }
}
cv.addEventListener('pointerdown', () => { if (G && !G.demo && ['intro', 'replay', 'halftime', 'goal'].includes(G.phase)) { KEY.Enter = true; setTimeout(() => { KEY.Enter = false; }, 60); } });

let lastT = performance.now();
function frame(now) {
  const dt = Math.max(0, Math.min(1 / 30, (now - lastT) / 1000)); lastT = now;
  readInput(dt); menuPad(); updateTouchLabels();
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
(document.fonts && document.fonts.load ? document.fonts.load('8px "Press Start 2P"') : Promise.resolve()).then(() => { if (G) buildArena(G.kits[0], G.kits[1], G.lg); }).catch(() => { });
requestAnimationFrame(frame);
