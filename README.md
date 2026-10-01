# Hallen-Legenden

[![Jetzt spielen / Play now](https://img.shields.io/badge/%E2%96%B6%20Jetzt%20spielen%20%2F%20Play%20now-tobwil.github.io%2FHallenLegenden-ffc83a?style=for-the-badge&labelColor=07060b)](https://tobwil.github.io/HallenLegenden/)
[![License: MIT](https://img.shields.io/badge/License-MIT-3ddc84?style=for-the-badge&labelColor=07060b)](LICENSE)

**[Deutsch](#deutsch) · [English](#english)**

---

<a id="deutsch"></a>

## Deutsch

Retro-Handball im Pixel-Look, inspiriert von *Legend Bowl*. Ein komplettes Browserspiel in einer einzigen HTML-Datei: kein Server, keine Installation, keine externen Abhängigkeiten außer zwei Google-Schriften.

**▶ Spielen: [tobwil.github.io/HallenLegenden](https://tobwil.github.io/HallenLegenden/)**

Läuft am Desktop mit Tastatur oder Gamepad und auf dem Handy mit Touch-Steuerung (Querformat empfohlen). Offline geht es auch: `index.html` herunterladen und im Browser öffnen.

> Inoffizielles Fan-Projekt. Vereins- und Spielernamen sind Fantasienamen. Es gibt keine Logos und keine Verbindung zu einer Liga oder einem Verein. Im Editor lassen sich alle Namen und Farben lokal im eigenen Browser ändern.

### Was drin ist

#### Spiel
- **7 gegen 7** mit echten Handballregeln: 6-m-Torraum, Sprungwurf über den Kreis, Freiwurf an der 9-m-Linie, 7-Meter, 2-Minuten-Strafen, passives Spiel, Einwurf, Ecke, Abwurf und Team-Timeout
- **Aktionen:** Pass mit Vorschau (wer den Ball bekommt), Wurf mit Zielkreuz und Aufladen, Heber, Kempa-Trick, Finte, Ball herausspielen und Blocksprung
- **Torwart:** Paraden als „Hampelmann“ oder im Spagat. Beim 7-Meter rätst du als Torwart die Ecke
- **KI:** Abwehrsysteme 6:0, 5:1 und 3:2:1, Kreuzen im Rückraum, Einläufer, Tempogegenstoß, eigene Timeouts
- **Kraft und Auswechseln:** Spieler ermüden über die Spielzeit (Ausdauer bremst den Abbau). Wechsel per Menü (Q) oder automatisch über den Co-Trainer. Verletzungen nach Fouls
- **Schnelle Mitte** nach Toren, **Zeitlupe** bei Torchancen, **Wiederholung** nach jedem Tor
- **Pokal-K.-o.-Spiele** mit 7-Meter-Werfen bei Unentschieden (5 Schützen, dann Sudden Death)

#### Präsentation
- Pixel-Halle mit Perspektive: Dielenboden mit Spiegelungen, Tribünen mit Gästeblock und Doppelhaltern, La-Ola, Blitzlichter, LED-Banden, Lichtkegel, Trainerbänke und Schiedsrichter
- Prozedural gezeichnete Spieler-Sprites mit rund 20 Posen, Rückennummern, Frisuren und Porträts
- TV-Auftritt: Intro mit Aufstellungskarten, Anzeigetafel, Radar, Tor-Einblendung mit Torschützen-Karte, Halbzeit- und Endstatistik, Spieler des Spiels
- Sound vollständig synthetisiert (Web Audio): Hallenakustik, Publikum aus synthetischen Stimmen, Trommeln, Pfiff, Torhupe, Chiptune-Musik. Optional ein Hallensprecher über die Sprachausgabe des Browsers (standardmäßig aus)

#### Ligen und Karriere
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

### Steuerung

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

### Projektstruktur

```
index.html            spielbare Datei, wird von GitHub Pages ausgeliefert
spielen.html          Kopie von index.html
hallen-legenden.html  dieselbe Seite ohne <html>-Gerüst (für die Veröffentlichung als Claude-Artifact)
src/                  Quellcode in Modulen, wird per build.sh zusammengesetzt
docs/ARCHITEKTUR.md   Aufbau des Codes, Datenmodell, Speicher-Schlüssel
docs/ENTWICKLUNG.md   Entwicklungsgeschichte: Wünsche, Entscheidungen, Tests
CHANGELOG.md          Versionen
LICENSE               MIT-Lizenz
```

#### Bauen

Die Module in `src/` werden in fester Reihenfolge zu einer HTML-Datei zusammengesetzt:

```sh
sh src/build.sh
```

Das erzeugt `index.html`, `spielen.html` und `hallen-legenden.html`. Es gibt keinen Bundler und keine Paketabhängigkeiten. Für einen Syntax-Check reicht `node --check` auf die zusammengefügten JS-Dateien.

#### Als Website veröffentlichen

GitHub Pages liefert den Branch `main`, Ordner `/` (root) aus. Weil `index.html` im Hauptordner liegt, läuft das Spiel direkt unter [tobwil.github.io/HallenLegenden](https://tobwil.github.io/HallenLegenden/). Die leere Datei `.nojekyll` sorgt dafür, dass GitHub die Dateien unverändert ausliefert.

### Entstehung

Das Spiel hat **tobwil** im Dialog mit Claude (Anthropic) in Claude Code entwickelt: von einer ersten Version mit fiktiven Teams über die Pixel-Halle, die Ligen 2026/27 und den Manager-Modus bis zur Touch-Steuerung. Den Verlauf mit allen Wünschen, Entscheidungen und Tests beschreibt [docs/ENTWICKLUNG.md](docs/ENTWICKLUNG.md), die Versionen stehen in [CHANGELOG.md](CHANGELOG.md).

### Lizenz und Namensnennung

Open Source unter der [MIT-Lizenz](LICENSE), © 2026 [tobwil](https://github.com/tobwil).

Du darfst das Spiel frei nutzen, verändern, weitergeben und auch in eigene Projekte übernehmen. **Bedingung:** Der Urheberhinweis „Copyright (c) 2026 tobwil“ und der Lizenztext müssen in allen Kopien und abgeleiteten Versionen erhalten bleiben. Bei einer Veröffentlichung (z. B. als Website oder Fork) freue ich mich über einen sichtbaren Hinweis wie *„Basiert auf Hallen-Legenden von tobwil“* mit Link auf dieses Repository.

---

<a id="english"></a>

## English

Retro handball in pixel style, inspired by *Legend Bowl*. A complete browser game in a single HTML file: no server, no installation, no external dependencies apart from two Google Fonts.

**▶ Play: [tobwil.github.io/HallenLegenden](https://tobwil.github.io/HallenLegenden/)**

Runs on desktop with keyboard or gamepad and on phones with touch controls (landscape recommended). Works offline too: download `index.html` and open it in your browser.

The game itself is in **German** (menus, commentary, newspaper). The controls below are all you need to get started.

> Unofficial fan project. Club and player names are fictional. There are no logos and no affiliation with any league or club. All names and colours can be changed locally in your own browser using the built-in editor.

### Features

#### Gameplay
- **7 vs 7** with real handball rules: 6 m goal area, jump shots over the line, free throw at the 9 m line, 7 m penalties, 2-minute suspensions, passive play, throw-ins, corners, goalkeeper throws and team timeouts
- **Actions:** pass with preview (shows who receives the ball), shot with aiming reticle and charge-up, lob, Kempa trick, feint, stealing the ball and block jump
- **Goalkeeper:** saves as "starfish" or in the splits. On a 7 m penalty you guess the corner as the keeper
- **AI:** 6-0, 5-1 and 3-2-1 defence systems, back-court crossings, wing cut-ins, fast breaks, its own timeouts
- **Stamina and substitutions:** players tire over the course of the match (stamina slows the decline). Substitute via menu (Q) or automatically through the assistant coach. Injuries after fouls
- **Quick throw-off** after goals, **slow motion** on scoring chances, **replay** after every goal
- **Cup knockout matches** with a penalty shoot-out on a draw (5 shooters, then sudden death)

#### Presentation
- Pixel arena with perspective: wooden floor with reflections, stands with away section and banners, Mexican wave, camera flashes, LED boards, spotlights, team benches and referees
- Procedurally drawn player sprites with around 20 poses, shirt numbers, hairstyles and portraits
- TV-style presentation: intro with line-up cards, scoreboard, radar, goal overlay with scorer card, half-time and full-time stats, player of the match
- Fully synthesised sound (Web Audio): arena acoustics, crowd made of synthetic voices, drums, whistle, goal horn, chiptune music. Optional stadium announcer via the browser's speech synthesis (off by default)

#### Leagues and career
- **36 clubs** in two leagues, league membership based on the 2026/27 season (fictional names made of city and nickname)
- **Quick match** with kit choice (home, away, alternate) and a warning for similar colours
- **Career** over as many seasons as you like:
  - 6, 17 or 34 matchdays, promotion and relegation between both leagues
  - 14-player squad with ratings for shooting, passing, defence, pace, goalkeeping and stamina, plus age, potential, form and fitness
  - Training with six focus areas, player development and retirement, youth players move up
  - Transfer market, salaries, contracts with length and extensions, offers from other clubs
  - CPU transfers (can be switched off), injuries, board with a season target
  - Assistant coach for line-up and training (optional)
  - Cup with 32 teams and a Final Four
  - Play every match yourself or simulate it
  - "Handball-Kurier" newspaper with headlines, table, top scorers and news
- **Editor** for club names, abbreviations, kit colours, player names and numbers
- **Saving:** ongoing matches automatically and via "Save & Quit", careers persist in the browser (`localStorage`)

### Controls

| Key | Attack | Defence |
|---|---|---|
| Arrows / WASD | Move | Move |
| Shift | Sprint | Sprint |
| J | Pass (direction = movement direction) | Switch to the player closest to the ball |
| Shift + J | Kempa trick | – |
| K / Space | Shoot (tap = quick, hold = more power, up/down = corner) | Block jump |
| L | Feint, while charging: lob | Steal the ball |
| T | Team timeout (change defence) | |
| Q | Substitution menu | |
| Esc / P | Pause, in menus: back | |
| M | Sound on/off | |

**Menus:** arrow keys to select, Enter to confirm, Esc or Backspace to go back.

**Gamepad:** A pass, X shoot, B feint/steal, RB sprint, Start pause. In menus: D-pad to select, A to confirm, B to go back.

**Touch (phone):**
- The stick appears wherever your left thumb touches down. Full deflection makes the player sprint
- Tap a teammate to pass, tap the goal to shoot
- Buttons change with the situation: PASS/WURF/FINTE (pass/shoot/feint) or WECHSEL/BLOCK/KLAU (switch/block/steal). Long-press PASS for a Kempa
- Pause (II) top right, back bar in all menus

### Project structure

```
index.html            playable file, served by GitHub Pages
spielen.html          copy of index.html
hallen-legenden.html  same page without the <html> wrapper (for publishing as a Claude Artifact)
src/                  modular source code, assembled by build.sh
docs/ARCHITEKTUR.md   code architecture, data model, storage keys (German)
docs/ENTWICKLUNG.md   development history: requests, decisions, tests (German)
CHANGELOG.md          versions (German)
LICENSE               MIT license
```

#### Building

The modules in `src/` are concatenated in a fixed order into one HTML file:

```sh
sh src/build.sh
```

This generates `index.html`, `spielen.html` and `hallen-legenden.html`. There is no bundler and there are no package dependencies. For a syntax check, `node --check` on the concatenated JS is enough.

#### Publishing as a website

GitHub Pages serves the `main` branch, folder `/` (root). Because `index.html` sits in the root folder, the game runs directly at [tobwil.github.io/HallenLegenden](https://tobwil.github.io/HallenLegenden/). The empty `.nojekyll` file makes GitHub serve the files unchanged.

### Background

**tobwil** developed the game in conversation with Claude (Anthropic) in Claude Code: from a first version with fictional teams, through the pixel arena, the 2026/27 leagues and the manager mode, to touch controls. The full history with all requests, decisions and tests is in [docs/ENTWICKLUNG.md](docs/ENTWICKLUNG.md), the versions are listed in [CHANGELOG.md](CHANGELOG.md).

### License and attribution

Open source under the [MIT License](LICENSE), © 2026 [tobwil](https://github.com/tobwil).

You are free to use, modify, share and include the game in your own projects. **Condition:** the copyright notice "Copyright (c) 2026 tobwil" and the license text must be kept in all copies and derived versions. If you publish it (e.g. as a website or fork), I'd appreciate a visible note such as *"Based on Hallen-Legenden by tobwil"* with a link to this repository.
