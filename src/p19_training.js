// ================= Training: 8 Lektionen mit Anleitung für Tastatur, Gamepad oder Touch =================
// Ein normales Spiel mit G.tut: Uhr und Zeitspiel stehen, Gegner und Mitspieler stehen still (außer in der Abwehr-Lektion),
// nach Tor, Pfiff oder Ballverlust wird die Lektion neu aufgestellt. Überspringen und Beenden im Pausemenü.
const tutKeys = () => LASTIN === 'touch' && !usePad()
  ? { run: 'Daumen links ziehen', sprint: 'Stick weit ziehen', pass: 'PASS', passAlt: 'PASS (oder Mitspieler antippen)', shoot: 'WURF', aim: 'Stick hoch/runter oder Tor antippen', kempa: 'PASS lang drücken', feint: 'FINTE', steal: 'KLAU', block: 'BLOCK', sw: 'WECHSEL' }
  : usePad() ? { run: 'Stick', sprint: 'RB', pass: 'A', passAlt: 'A', shoot: 'X', aim: 'Stick hoch/runter', kempa: 'RB + A', feint: 'B', steal: 'B', block: 'X', sw: 'A' }
  : { run: 'Pfeiltasten', sprint: 'W', pass: 'S', passAlt: 'S', shoot: 'Leertaste', aim: 'Pfeil hoch/runter', kempa: 'A', feint: 'D', steal: 'D', block: 'Leertaste', sw: 'S' };
// at: Ballführer [Abstand zur Torlinie, y in Angriffsrichtung]; spots: Laufziele; n: wie oft; got: Fortschritt aus G.tut
const LESSONS = [
  { n: 'LAUFEN', d: t => `${t.run}: lauf in den gelben Kreis. ${t.sprint} = Sprint.`, at: [13, 10], spots: [[10, 5], [8.5, 15]] },
  { n: 'PASSEN', d: t => `${t.passAlt}: Pass in Laufrichtung, ohne Richtung zum besten freien Mitspieler.`, at: [10, 10], n2: 2, got: T => T.passes },
  { n: 'WERFEN', d: t => `${t.shoot} halten lädt den Wurf auf (Balken), loslassen wirft. Erziele ein Tor.`, at: [9, 10], n2: 1, got: T => T.goals },
  { n: 'IN DIE ECKE', d: t => `Beim Aufladen ${t.aim}: Der Wurf geht genau in diese Ecke, das Zielkreuz zeigt wohin. Ein Tor in die Ecke.`, at: [9, 7], n2: 1, got: T => T.corner },
  { n: 'KEMPA-TRICK', d: t => `${t.kempa}: Lupfer in den Kreis, dein Mitspieler am Flügel fängt im Sprung und wirft.`, at: [9.5, 10], n2: 1, got: T => T.kempa },
  { n: 'DREHER', d: t => `Nur vom Flügel: ${t.shoot} halten und dazu ${t.pass} tippen. Der Ball springt auf und dreht am Torwart vorbei.`, at: [3.2, 2.8], n2: 1, got: T => T.dreher },
  { n: 'FINTE', d: t => `${t.feint} direkt vor dem Abwehrspieler: Er bleibt kurz stehen, du gehst vorbei.`, at: [9.5, 10], def: 1, n2: 1, got: T => T.feints },
  { n: 'ABWEHR', d: t => `Der Gegner greift an. ${t.steal} am Ballführer spielt den Ball heraus (Foulgefahr), beim Wurf ${t.block} blockt, ${t.sw} wechselt den Spieler. Hol dir den Ball.`, defense: 1, n2: 1, got: T => T.won },
];
ACT.training = () => {
  AU.stopMusic(); newMatch(SEL.a, SEL.b, { human: 0, halfLen: 600, diff: 1, label: 'TRAINING' }); AU.ambience(true);
  G.tut = { i: 0 }; G.timeouts = [0, 0]; hideMenu(); track('training-start'); tutSetup(true);
};
ACT.tutSkip = () => { if (!G || !G.tut) return; G.paused = false; hideMenu(); tutNext(); };
ACT.tutQuit = () => { G = null; ACT.main(); };
function tutNext() { G.tut.i++; if (G.tut.i >= LESSONS.length) return tutEnd(); tutSetup(true); }
function tutEnd() {
  track('training-geschafft'); SETTINGS.tutDone = true; store.set('hl4_settings', SETTINGS); G = null; startDemo();
  showMenu(`<div class="panel narrow"><h2>TRAINING GESCHAFFT!</h2><p>Du kennst jetzt Laufen, Passen, Werfen in die Ecke, Kempa-Trick, Dreher, Finte und die Abwehr.</p>
    <div class="btns menu-list"><button class="main" data-act="quick">SCHNELLES SPIEL <i>jetzt ausprobieren</i></button><button data-act="career">KARRIERE</button><button data-act="main">HAUPTMENÜ</button></div></div>`);
}
// Abstand d von der Torlinie, auf die der Mensch wirft, und y in Spielrichtung
const tutPos = (d, y) => { const s = sgn(G.human); return [goalX(G.human) - s * d, relY(G.human, y)]; };
// fresh: neue Lektion (Fortschritt auf null); sonst nur neu aufstellen (nach Tor, Pfiff, Ballverlust), der Fortschritt bleibt
function tutSetup(fresh) {
  const T = G.tut, L = LESSONS[T.i], me = G.human, op = 1 - me, b = G.ball;
  if (fresh) Object.assign(T, { passes: 0, goals: 0, corner: 0, kempa: 0, dreher: 0, feints: 0, won: 0, hits: 0, done: 0, t: 0 });
  T.reset = 0; T.loose = 0; T.corner1 = false;
  Object.assign(G, { phase: 'play', phaseT: 0, pending: null, pen: null, kempa: null, replay: null, cut: null, possT: 0, passiveWarn: false, clock: 30, ctrl: null });
  for (const p of G.players) { place(p, p.x, p.y); p.out = 0; p.charge = 0; p.charging = false; p.block = 0; p.cd = 0; p.dash = 0; p.kempaRun = false; p.hold = 0; }
  for (const t of [0, 1]) place(G.goalie[t], ownX(t) + sgn(t) * 1.2, 10);
  const mine = G.players.filter(p => p.team === me && p.role !== 'TW'), opp = G.players.filter(p => p.team === op && p.role !== 'TW');
  if (L.defense) {   // Gegner im Angriff auf dein Tor, deine Abwehr in der Deckung
    for (const p of opp) { const [x, y] = attackSpot(p); place(p, x, y); }
    for (const p of mine) { const [x, y] = defendSpot(p); place(p, x, y); }
    const c = opp.find(p => p.role === 'RM'); giveBall(c, true); G.poss = op; G.ctrl = nearestTo(me, c.x, c.y);
  } else {
    // Mitspieler auf ihren Angriffsplätzen, Gegner weit weg im Mittelfeld (stören weder Pässe noch Würfe)
    const spots = { LA: [3.6, 2.5], RL: [8.5, 5.5], RM: [9.5, 10], RR: [8.5, 14.5], RA: [3.6, 17.5], KM: [6.6, 9] };
    for (const p of mine) place(p, ...tutPos(...spots[p.role]));
    opp.forEach((p, i) => place(p, ...tutPos(17 + (i % 2), 2 + i * 3.2)));
    const c = L.n === 'DREHER' ? mine.find(p => p.role === 'LA') : mine.find(p => p.role === 'RM');
    for (const p of mine) if (p !== c && dist(p.x, p.y, ...tutPos(...L.at)) < 2) place(p, p.x, p.y + 2.5);
    place(c, ...tutPos(...L.at)); giveBall(c, true); G.poss = me; G.ctrl = c;
    if (L.def) { const o = opp.find(p => p.role === 'RM'); place(o, ...tutPos(L.at[0] - 1.3, L.at[1])); }
  }
  b.x = b.owner.x; b.y = b.owner.y; b.z = 1; b.vx = b.vy = b.vz = 0; b.passTo = null; b.shot = null; b.lob = false;
  T.spot = L.spots && T.hits < L.spots.length ? tutPos(...L.spots[T.hits]) : null;
}
// läuft in jedem Spielschritt: Uhr anhalten, Lektion prüfen, nach Tor/Pfiff/Ballverlust neu aufstellen
function tutTick(dt) {
  const T = G.tut, L = LESSONS[T.i], b = G.ball, me = G.human; T.t += dt;
  G.clock = 30; G.possT = 0; G.replay = null;
  if (T.spot && G.ctrl && dist(G.ctrl.x, G.ctrl.y, T.spot[0], T.spot[1]) < 1.1) { T.hits++; AU.select(); T.spot = T.hits < L.spots.length ? tutPos(...L.spots[T.hits]) : null; }
  if (L.defense && G.phase === 'play' && b.owner && b.owner.team === me && b.owner.role !== 'TW') T.won = 1;
  const ok = L.spots ? T.hits >= L.spots.length : L.got(T) >= L.n2;
  if (ok && !T.done) { T.done = T.t; banner('GESCHAFFT!', '#3ddc84', L.n, 1.2); AU.cheer(0.8); }
  if (T.done) { if (T.t - T.done > 1.5) tutNext(); return; }
  // falsche Lage (Tor, Pfiff, 7-Meter, Ballverlust, loser Ball, den keiner holt): kurz warten, dann neu aufstellen
  const lost = b.owner && (L.defense ? b.owner.team === me && b.owner.role === 'TW' : b.owner.team !== me);   // Abwehr: Parade des Torwarts zählt nicht, neu aufstellen
  T.loose = !b.owner && !b.passTo && !b.shot ? T.loose + dt : 0;
  if (G.phase !== 'play' || lost || T.loose > 2.5) { T.reset += dt; if (T.reset > 1.3) tutSetup(false); } else T.reset = 0;
}
// still stehen: alle außer Torhütern, dem eigenen Spieler und dem Passempfänger (Abwehr-Lektion: alle spielen)
function tutHold(p) {
  const T = G.tut; if (!T || LESSONS[T.i].defense || p.role === 'TW' || p === G.ctrl) return false;
  const b = G.ball; return !(b.passTo === p || p.kempaRun || p.airCatch);
}
// Schuss des Menschen: Ecke und Dreher merken (Tor zählt erst beim Treffer)
function tutShot(p, aimY, dreher) { const T = G.tut; T.corner1 = Math.abs(aimY ?? 0) >= 0.99; if (dreher) T.dreher++; }
function tutGoal(sc) { const T = G.tut; if (!sc || sc.team !== G.human) return; T.goals++; if (T.corner1) T.corner++; }
// Anleitung oben auf dem Spielfeld: Lektion, Text (Tasten des Geräts), Fortschritt, Hinweis auf Pause
function tutDraw() {
  const T = G.tut, L = LESSONS[T.i]; if (!T) return;
  if (T.spot) { const [x, y] = T.spot, cx = sx(x, y), cy = sy(y), r = 15 + Math.sin(G.t * 6) * 2; ctx.strokeStyle = '#ffc83a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.45, 0, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
  const x0 = 10, w = Math.min(hudR() - 112 - x0, 470), y0 = 8;   // links oben, wo sonst die Anzeigetafel steht, neben der Mini-Karte
  ctx.font = `8px ${FONT}`; const words = L.d(tutKeys()).split(' '), lines = [];
  for (const wd of words) { const l = lines.length ? lines[lines.length - 1] + ' ' + wd : wd; if (lines.length && ctx.measureText(l).width < w - 20) lines[lines.length - 1] = l; else lines.push(wd); }
  const h = 30 + lines.length * 11;
  rect(x0, y0, w, h, 'rgba(8,7,14,0.88)'); rect(x0, y0, w, 2, '#ffc83a'); rect(x0, y0, 4, h, '#3ddc84');
  text(`TRAINING ${T.i + 1}/${LESSONS.length} · ${L.n}`, x0 + 12, y0 + 7, '#ffc83a', 8, 'left', null);
  const prog = L.spots ? `${Math.min(T.hits, L.spots.length)}/${L.spots.length}` : `${Math.min(L.got(T), L.n2)}/${L.n2}`;
  text(prog, x0 + w - 10, y0 + 7, T.done ? '#3ddc84' : '#f3ead6', 8, 'right', null);
  lines.forEach((l, i) => text(l, x0 + 12, y0 + 20 + i * 11, '#f3ead6', 8, 'left', null));
  text(`${usePad() ? 'START' : TOUCHDEV && !usePad() ? 'II' : 'ESC'} = ÜBERSPRINGEN ODER BEENDEN`, x0 + w - 10, y0 + h - 10, '#9b90ad', 7, 'right', null);
}
