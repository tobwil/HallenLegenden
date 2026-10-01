# Hallen-Legenden

Retro-Handball im Pixel-Look, inspiriert von *Legend Bowl*. Ein komplettes Browserspiel in einer einzigen HTML-Datei: kein Server, keine Installation, keine externen Abhängigkeiten außer zwei Google-Schriften.

**Spielen:** `index.html` (oder `spielen.html`) im Browser öffnen. Läuft am Desktop mit Tastatur oder Gamepad und auf dem Handy mit Touch-Steuerung (Querformat empfohlen).

> Inoffizielles Fan-Projekt. Vereins- und Spielernamen sind Fantasienamen. Es gibt keine Logos und keine Verbindung zu einer Liga oder einem Verein. Im Editor lassen sich alle Namen und Farben lokal im eigenen Browser ändern.

---

## Was drin ist

### Spiel
- **7 gegen 7** mit echten Handballregeln: 6-m-Torraum, Sprungwurf über den Kreis, Freiwurf an der 9-m-Linie, 7-Meter, 2-Minuten-Strafen, passives Spiel, Einwurf, Ecke, Abwurf und Team-Timeout
- **Aktionen:** Pass mit Vorschau (wer den Ball bekommt), Wurf mit Zielkreuz und Aufladen, Heber, Kempa-Trick, Finte, Ball herausspielen und Blocksprung
- **Torwart:** Paraden als „Hampelmann“ oder im Spagat. Beim 7-Meter rätst du als Torwart die Ecke
- **KI:** Abwehrsysteme 6:0, 5:1 und 3:2:1, Kreuzen im Rückraum, Einläufer, Tempogegenstoß, eigene Timeouts
- **Kraft und Auswechseln:** Spieler ermüden über die Spielzeit (Ausdauer bremst den Abbau). Wechsel per Menü (Q) oder automatisch über den Co-Trainer. Verletzungen nach Fouls
- **Schnelle Mitte** nach Toren, **Zeitlupe** bei Torchancen, **Wiederholung** nach jedem Tor
- **Pokal-K.-o.-Spiele** mit 7-Meter-Werfen bei Unentschieden (5 Schützen, dann Sudden Death)

### Präsentation
- Pixel-Halle mit Perspektive: Dielenboden mit Spiegelungen, Tribünen mit Gästeblock und Doppelhaltern, La-Ola, Blitzlichter, LED-Banden, Lichtkegel, Trainerbänke und Schiedsrichter
- Prozedural gezeichnete Spieler-Sprites mit rund 20 Posen, Rückennummern, Frisuren und Porträts
- TV-Auftritt: Intro mit Aufstellungskarten, Anzeigetafel, Radar, Tor-Einblendung mit Torschützen-Karte, Halbzeit- und Endstatistik, Spieler des Spiels
- Sound vollständig synthetisiert (Web Audio): Hallenakustik, Publikum aus synthetischen Stimmen, Trommeln, Pfiff, Torhupe, Chiptune-Musik. Optional ein Hallensprecher über die Sprachausgabe des Browsers (standardmäßig aus)

### Ligen und Karriere
- **36 Vereine** in zwei Ligen, Ligazugehörigkeit nach der Saison 2026/27 (Fantasienamen aus Stadt und Spitzname)
- **Schnelles Spiel** mit Trikotwahl (Heim, Auswärts, Alternativ) und Warnung bei ähnlichen Farben
- **Karriere** über beliebig viele Saisons:
  - 6, 17 oder 34 Spieltage, Auf- und Abstieg zwischen beiden Ligen
  - 14er-Kader mit Werten für Wurf, Pass, Abwehr, Tempo, Torwart und Ausdauer, dazu Alter, Potenzial, Form und Fitness
  - Training mit sechs Schwerpunkten, Spielerentwicklung und Karriereende, Jugendspieler rücken nach
  - Transfermarkt, Gehälter, Verträge mit Laufzeit und Verlängerung, Angebote anderer Vereine
  - CPU-Transfers (abschaltbar), Verletzungen, Vorstand mit Saisonziel
  - Co-Trainer für Aufstellung und Training (optional)
  - Pokal mit 32 Teams und Final Four
  - Jede Partie selbst spielen oder simulieren
  - Zeitung „Handball-Kurier“ mit Schlagzeilen, Tabelle, Torjägern und Meldungen
- **Editor** für Vereinsnamen, Kürzel, Trikotfarben, Spielernamen und Nummern
- **Speichern:** laufende Spiele automatisch und per „Speichern & Beenden“, Karriere dauerhaft im Browser (`localStorage`)

---

## Steuerung

| Taste | Angriff | Abwehr |
|---|---|---|
| Pfeile / WASD | Laufen | Laufen |
| Shift | Sprint | Sprint |
| J | Pass (Richtung = Laufrichtung) | zum ballnächsten Spieler wechseln |
| Shift + J | Kempa-Trick | – |
| K / Leertaste | Wurf (antippen = schnell, halten = mehr Wucht, hoch/runter = Ecke) | Blocksprung |
| L | Finte, beim Aufladen: Heber | Ball herausspielen |
| T | Team-Timeout (Deckung umstellen) | |
| Q | Wechselmenü | |
| Esc / P | Pause, im Menü: zurück | |
| M | Ton an/aus | |

**Menüs:** Pfeiltasten wählen, Enter bestätigt, Esc oder Backspace geht zurück.

**Gamepad:** A Pass, X Wurf, B Finte/Klau, RB Sprint, Start Pause. Im Menü: Steuerkreuz wählen, A bestätigen, B zurück.

**Touch (Handy):**
- Stick erscheint dort, wo der Daumen links aufsetzt. Voll ausgelenkt sprintet der Spieler
- Mitspieler antippen spielt den Pass, ins Tor tippen wirft
- Knöpfe je nach Lage: PASS/WURF/FINTE oder WECHSEL/BLOCK/KLAU. Langer Druck auf PASS spielt Kempa
- Pause (II) oben rechts, Zurück-Leiste in allen Menüs

---

## Projektstruktur

```
index.html            spielbare Datei (identisch mit spielen.html, für GitHub Pages)
spielen.html          spielbare Datei
hallen-legenden.html  dieselbe Seite ohne <html>-Gerüst (für die Veröffentlichung als Claude-Artifact)
src/                  Quellcode in Modulen, wird per build.sh zusammengesetzt
docs/ARCHITEKTUR.md   Aufbau des Codes, Datenmodell, Speicher-Schlüssel
docs/ENTWICKLUNG.md   Entwicklungsgeschichte: Wünsche, Entscheidungen, Tests
CHANGELOG.md          Versionen v1 bis v7
```

### Bauen

Die Module in `src/` werden in fester Reihenfolge zu einer HTML-Datei zusammengesetzt:

```sh
sh src/build.sh
```

Das erzeugt `hallen-legenden.html`, `spielen.html` und `index.html`. Es gibt keinen Bundler und keine Paketabhängigkeiten. Für einen Syntax-Check reicht `node --check` auf die zusammengefügten JS-Dateien.

### Als Website veröffentlichen

Mit GitHub Pages (Branch `main`, Ordner `/`) läuft das Spiel direkt unter der Pages-Adresse des Repositorys, weil `index.html` im Hauptordner liegt.

---

## Entstehung

Das Spiel wurde im Dialog mit Claude (Anthropic) in Claude Code entwickelt: von einer ersten Version mit fiktiven Teams über die Pixel-Halle, die Ligen 2026/27 und den Manager-Modus bis zur Touch-Steuerung. Den Verlauf mit allen Wünschen, Entscheidungen und Tests beschreibt [docs/ENTWICKLUNG.md](docs/ENTWICKLUNG.md), die Versionen stehen in [CHANGELOG.md](CHANGELOG.md).

## Lizenz

Noch nicht festgelegt. Bis dahin gilt das Standard-Urheberrecht.
