# Changelog

Alle Versionen entstanden am 1. Oktober 2026 in einer durchgehenden Entwicklungssitzung.

## v7.2: Einheitliche Fenster
- **Feste Fenstergröße:** Alle Menüfenster haben dieselbe Größe und füllen die Spielfläche. Klicks auf Knöpfe oder Karriere-Tabs ändern die Größe nicht mehr, längere Inhalte scrollen im Fenster. Kurze Menüs (Hauptmenü, Optionen, Pause, Taktik) zeigen ihren Inhalt schmal und mittig. Auf dem Handy füllt jedes Fenster mindestens den Bildschirm.
- **Fehler behoben:** Knöpfe in der Zeitung (z. B. „SIMULIEREN“) waren ohne Hover schwarz auf schwarz, weil die Zeitung die Schriftfarbe `--ink` auf Dunkelbraun setzt

## v7.1: Veröffentlichung
- **GitHub Pages:** spielbar unter https://tobwil.github.io/HallenLegenden/. `index.html` ist jetzt ein vollständiges HTML-Dokument (Titel, Beschreibung, Vorschau-Tags und Favicon im `<head>`), dazu `.nojekyll`
- **Lizenz:** Open Source unter MIT, © 2026 tobwil. Hinweis auf dem Titelbildschirm
- **README** auf Deutsch und Englisch
- **Fehler behoben:** Das ausgeblendete Menü lag im Spiel weiter als dunkle Fläche über dem Spielfeld, auf dem Handy auch über den Touch-Knöpfen (`#menu` mit `display:flex` überstimmte das `hidden`-Attribut)
- **Fehler behoben:** Beim Start konnte die Spielschleife abbrechen und das Bild einfrieren, wenn der erste Frame-Zeitstempel vor dem Ladezeitpunkt lag (negative Spielzeit)

## v7: Touch-Steuerung, Auswechseln, Pokal, Verletzungen, Verträge
- **Touch:**
  - mitwandernder Stick mit Auto-Sprint bei voller Auslenkung
  - Mitspieler antippen spielt den Pass, ins Tor tippen wirft (Höhe der Tippstelle bestimmt die Ecke)
  - in der Abwehr wechselt ein Tipp den Spieler
  - zwei große Knöpfe mit wechselnder Beschriftung (PASS/WURF/FINTE bzw. WECHSEL/BLOCK/KLAU), Kempa per langem Druck auf PASS
  - Vibration bei Wurf und Tor, Zielhilfe und aggressiverer automatischer Spielerwechsel
- **Pass-Vorschau:** Ein Pfeil zeigt, wer den nächsten Pass bekommt. Menschliche Pässe sind vorhersehbar.
- **Spieltempo:** 100, 85 oder 70 % (Optionen)
- **Kraft über das Spiel:** Spieler ermüden mit der Spielzeit, Ausdauer bremst den Abbau. Müde Spieler laufen langsamer und werfen ungenauer.
- **Auswechseln:** Ersatzbank (Karriere: ganzer Kader, sonst je Position ein Ersatz). Wechselmenü (Q oder Pause), Auto-Wechsel durch den Co-Trainer, Erholung auf der Bank.
- **Verletzungen:** im Spiel nach Fouls und in der Karriere nach Partien (1 bis 6 Spieltage), Anzeige im Kader und in der Zeitung
- **Verträge:** Laufzeit und Gehalt pro Spieler, Verlängerung mit Forderung und Handgeld. Ausgelaufene Spieler gehen ablösefrei, Jugendspieler füllen den Kader auf mindestens 12 auf.
- **Pokal:** 32 Teams, fünf K.-o.-Runden über die Saison verteilt, Final Four, Prämien pro Runde. 7-Meter-Werfen bei Unentschieden mit 5 Schützen und Sudden Death, auch im selbst gespielten Spiel. Neuer Tab und Eintrag in der Historie.
- **Mobile Menüs:** feste „‹ ZURÜCK“-Leiste, wischbare Karriere-Tabs, größere Schrift
- Hallensprecher standardmäßig aus
- **Fehler behoben:**
  - Absturz durch die verzögerte Tor-Durchsage nach Spielende
  - Einstellungen wurden gelesen, bevor der Speicher bereit war

## v6: Mobile, Menüsteuerung, Publikum
- **Menüs:** Pfeiltasten springen räumlich zum nächsten Knopf, Esc/Backspace geht überall eine Ebene zurück, Gamepad-Steuerung, beliebige Taste auf dem Titelbildschirm
- **Publikum:** Das Rauschen ist ersetzt durch synthetisches Stimmengewirr (rund 50 Stimmen mit Silben und Vokalen), Jubel und „Ooh“ als Stimmen. Deutlich leiser, Regler standardmäßig auf 40 %.
- **Responsive:**
  - Vollbild-Menüs auf kleinen Bildschirmen, Scrollen per Touch
  - Kader, Transfers und Angebote als Karten
  - Spiel im Querformat mit überlagerter Steuerung, Pause-Knopf, Hinweis zum Drehen im Hochformat
- **Fehler behoben:** Esc im Spiel pausierte und hob die Pause sofort wieder auf.

## v5: Zeitung, Co-Trainer, Ausdauer, Sound
- **Karriere-Center als Zeitung „Handball-Kurier“:**
  - Schlagzeile und Ergebnis-Ticker
  - Gegner-Vorschau, Mini-Tabelle und Torjäger
  - Vorstand mit Saisonziel und Stimmung, Lage in der Kabine
  - Meldungen in einer Box mit fester Höhe
- **Kader:** kompakte Tabelle ohne horizontales Scrollen, Spieler-Detailansicht mit Porträt, Aufstellen und Verkaufen
- **CPU-Transfers** (abschaltbar) und Angebote für eigene Spieler
- **Simulation:**
  - ausgeglichene Heimspiele im Spielplan
  - weniger Gewicht auf Stärkeunterschiede, keine Form-Spirale mehr
  - Schwierigkeit wirkt auch auf simulierte Spiele
- **Ausdauer** als Spielerwert: Erschöpfung zwischen den Spielen, müde Spieler sind im Spiel langsamer.
- **Co-Trainer:** übernimmt auf Wunsch Aufstellung (schont müde Spieler) und Training
- **Neue Audio-Engine:** Hallenhall, Kompressor, Publikum je nach Spielsituation, Schuhquietschen, realistischer Pfiff, Jingles, Hallensprecher, Lautstärkeregler

## v4: Karriere und Manager
- Karriere ersetzt den Saisonmodus: mehrere Saisons, Auf- und Abstieg, 14er-Kader, Form, Fitness, Training, Spielerentwicklung, Transfermarkt, Gehälter, Simulieren oder Selbstspielen, Saisonabschluss, Historie
- **Steuerung:**
  - Pass sofort beim Drücken, kurzes Antippen von K ergibt einen schnellen Wurf
  - Passempfänger laufen automatisch zum Ball, der Torwart wirft automatisch ab
  - Auto-Spielerwechsel in der Abwehr

## v3: Korrekturen, Trikotwahl, Speichern
- **Schnelle Mitte:** Die Abwehr steht beim Anwurf wieder (vorher lief der Anwerfer frei aufs Tor).
- Texte passen in ihre Boxen.
- **Fantasienamen** für alle Vereine, Editor für Vereinsnamen, Kürzel und Farben
- **Neue Sprites** mit Anatomie: Schultern, Taille, gebeugte Gelenke, Konturen
- **Pässe** zielen nie in den Torraum, der Torwart sichert lose Bälle im Kreis, Fernwürfe werden fast immer gehalten
- Speichern und Laden laufender Spiele, automatisches Speichern
- Trikotwahl vor dem Spiel (Heim, Auswärts, Alternativ)

## v2: Neue Grafik, Ligen 2026/27, TV-Auftritt
- Doppelte Auflösung, Halle mit Perspektive, prozedurale Sprites mit Umriss, Schattierung, Nummern und Porträts
- 36 Vereine der beiden Ligen 2026/27, Kader-Editor
- **TV-Auftritt:** Intro mit Aufstellung, Tor-Einblendung mit Torschützen-Karte, Halbzeitstatistik, Spieler des Spiels
- **Neue Aktionen:** Zielkreuz, Heber, Kempa, Fallwurf, Torwart rät beim 7-Meter, schnelle Mitte, Abwehrsysteme, Team-Timeout, bessere KI
- Chiptune-Musik und Fan-Trommeln

## v1: Erste Version
- Pixel-Handball 7 gegen 7 mit Grundregeln, KI-Teams, Freundschaftsspiel und kurzer Saison mit acht fiktiven Vereinen, Wiederholung nach Toren, Touch-Steuerung
