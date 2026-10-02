/**
 * Hallen-Legenden: Feature-Wünsche von der Landingpage in die Google-Tabelle schreiben.
 *
 * Einrichtung (einmalig, siehe docs/LANDINGPAGE.md):
 * 1. Tabelle „Feature Requests HallenLegenden“ öffnen → Erweiterungen → Apps Script
 * 2. Diesen Code einfügen und speichern
 * 3. Bereitstellen → Neue Bereitstellung → Typ „Web-App“
 *    Ausführen als: Ich · Zugriff: Jeder
 * 4. Die Web-App-URL (endet auf /exec) in index.html bei FEATURE_ENDPOINT eintragen
 */

const SHEET_NAME = 'Tabellenblatt1';
const HEADER = ['Zeitstempel', 'Kategorie', 'Wunsch', 'Beschreibung', 'Name', 'Kontakt', 'Gerät'];
const CATEGORIES = ['Gameplay', 'Steuerung', 'Karriere & Manager', 'Grafik & Sound', 'Handy & Touch', 'Fehler / Bug', 'Sonstiges'];
const MAX_PER_10_MIN = 60; // grobe Bremse gegen Spam, gilt für alle Absender zusammen

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return json({ ok: true }); // Spam-Falle: unsichtbares Feld wurde ausgefüllt

  if (!looksHuman(p)) return json({ ok: true }); // Bots bekommen keine Fehlermeldung, aber auch keinen Eintrag

  const wunsch = clean(p.wunsch, 120);
  if (!wunsch) return json({ ok: false, error: 'Wunsch fehlt' });
  const kategorie = CATEGORIES.indexOf(p.kategorie) >= 0 ? p.kategorie : 'Sonstiges';

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json({ ok: false, error: 'Server beschäftigt' });
  try {
    const cache = CacheService.getScriptCache();
    const count = Number(cache.get('count') || 0);
    if (count >= MAX_PER_10_MIN) return json({ ok: false, error: 'Zu viele Wünsche gerade, bitte später nochmal' });
    cache.put('count', String(count + 1), 600);

    const sheet = getSheet();
    sheet.appendRow([
      new Date(),
      kategorie,
      wunsch,
      clean(p.beschreibung, 2000),
      clean(p.name, 60),
      clean(p.kontakt, 120),
      clean(p.geraet, 60),
    ]);
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true });
}

// Prüfwert der Landingpage nachrechnen: gleiche Formel wie checksum() in index.html
function looksHuman(p) {
  const t = Number(p.t);
  if (!t || Math.abs(Date.now() - t) > 24 * 3600 * 1000) return false;
  return p.h === checksum('hl:' + p.t + ':' + String(p.wunsch || '').trim().length);
}

function checksum(str) { // FNV-1a, 32 Bit
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}

// Aufruf im Browser zeigt, ob die Web-App läuft
function doGet() {
  return json({ ok: true, info: 'Hallen-Legenden Wunschliste' });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADER);
  return sheet;
}

// Kürzt Eingaben und verhindert, dass Text als Formel ausgeführt wird
function clean(value, max) {
  const s = String(value || '').trim().slice(0, max);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
