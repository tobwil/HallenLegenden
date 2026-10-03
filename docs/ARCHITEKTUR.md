# Architektur

Das Spiel ist reines HTML, CSS und JavaScript ohne Framework und ohne Bundler. Die Module in `src/` werden von `src/build.sh` in fester Reihenfolge zu **einem** `<script>`-Block zusammengefügt. Alle Module teilen sich deshalb einen globalen Gültigkeitsbereich. Funktionsdeklarationen sind überall verfügbar, `const`/`let` erst nach ihrer Definition.

## Module (in Build-Reihenfolge)

| Datei | Inhalt |
|---|---|
| `head.html` | Titel, Schriften, gesamtes CSS (inkl. Responsive/Touch), DOM für Canvas, Menü, Touch-Pad |
| `p01_core.js` | Maße und Projektion (Perspektive), Helfer, Speicher-Wrapper, Vereinsdaten (`TEAM_BASE`), Kadergenerator `roster()` |
| `p02_audio.js` | Web-Audio-Engine: Busse, Hall, Kompressor, synthetische Publikumsstimmen (`renderVoices`), Effekte, Musik-Sequencer, Hallensprecher |
| `p03_sprites.js` | Prozedurale Spieler-Sprites (Posen als Gelenkkoordinaten, Kontur-Pass, Cache), Porträts, Trikot-Symbole |
| `p04_arena.js` | Hallenboden-Textur mit Perspektiv-Rendering zeilenweise, Tribünen, LED-Banden, Lichtkegel, Vordergrund |
| `p05_match.js` | Spielzustand `G`, Trikots, Aufstellungen und Abwehrsysteme, Spielfortsetzungen, Eingabe (Tastatur, Gamepad, Touch-Impulse), Bank und Auswechseln |
| `p06_actions.js` | Pass, Kempa, Wurf, Finte, Ballklau, Fouls, Timeout |
| `p07_ai.js` | KI (Angriff, 6:0/5:1/3:2:1-Abwehr, Torwart), Steuerung des Menschen, Bewegung, Kraftverlust, Posen-Auswahl |
| `p08_rules.js` | Ballphysik, Tore, Paraden, Spielphasen, Halbzeit, 7-Meter-Werfen |
| `p09_fx.js` | Partikel, Netz, Pfosten, Ball, Spieler zeichnen (mit Spiegelung), Bänke, Schiedsrichter |
| `p10_render.js` | Szene, Kamera, TV-Grafik (Anzeigetafel, Radar, Einblendungen, Karten, Intro, Halbzeit, Wiederholung) |
| `p11_menus.js` | Menüs, Menünavigation (räumlich, Esc), Editor, Optionen, Vor-dem-Spiel, Spielende, Speichern/Laden |
| `p13_career.js` | Karriere: Kader, Stärke, Simulation, Spieltag, Training, Transfers, Saisonende, CPU-Transfers, Vorstand, Schlagzeilen, Co-Trainer |
| `p15_cup.js` | Pokal (Auslosung, Runden, Prämien), Vertragsverlängerung |
| `p17_euro.js` | Europapokal: Qualifikation, Auslosung (Lostöpfe, deutsche Vereine getrennt), Gruppen, Viertelfinale, Final Four, Termine zwischen den Ligaspieltagen, Prämien |
| `p16_finance.js` | Finanzen: Zuschauer, Sponsoren, Gehälter pro Saison, KI-Haushalte, Transfersperre für Neuzugänge, Schulden und Notverkauf, Vorstand (Bonus, Warnung, Entlassung, Jobangebote) |
| `p14_career_ui.js` | Karriere-Bildschirme: Zeitung, Kader, Spieler-Detail, Training, Transfers, Tabelle, Pokal, Statistik, Historie, Saisonabschluss |
| `p12_main.js` | Touch-Pad (mitwandernder Stick, Antippen, Knöpfe), Gamepad im Menü, Hauptschleife, Start |

## Koordinaten

- **Spielfeld:** 40 × 20 m. Welt-x läuft von 0 bis 40 (Torlinien), Welt-y von 0 bis 20 (hintere bis vordere Seitenlinie), z ist die Höhe.
- **Bildschirm:** `sx(x, y)` und `sy(y, z)` projizieren auf die 640 × 360 Pixel große Leinwand. Die horizontale Skalierung nimmt nach hinten ab (`kOf`).
- **Tore:** bei x = 0 und x = 40, von y = 8,5 bis 11,5, 2 m hoch. Der Torraum ist der Abstand ≤ 6 m zur Torstrecke (`goalDist`).

## Spielablauf

`step(dt)` (in `p08`) steuert die Phasen:

```
intro → kickoff → play ⇄ (whistle → restart | penalty) → goal → replay → kickoff …
                       → halftime → kickoff (2. HZ) → fulltime [→ 7-Meter-Werfen im Pokal]
```

Pro Frame laufen: Eingabe lesen, `step` (Spieler, Kollisionen, Ball), Wiederholung aufzeichnen, `render`.

**Spielerobjekte** in `G.players` behalten ihre Position. Beim Auswechseln werden nur die Spielerdaten getauscht (`DATA_KEYS`) mit einem Eintrag in `G.bench[team]`.

## Karriere-Datenmodell (`CAREER`)

```
year, team, len, half, diff, money, training, coach{lineup,training}, aiTransfers
lgOf{teamId: 1|2}          Ligazugehörigkeit (ändert sich durch Auf-/Abstieg)
squads{teamId: [Spieler]}  Kader aller 52 Vereine (36 deutsche, 16 internationale)
season{lg, round, fixtures, table, last, scorers, done}
cup{round, sched, ties, results, winner, myOut, myBest}
market, free, offers, transferLog, news, history, goal, streak, lastMatch, summary
```

**Spieler:**

```
pid, name, num, role, age, att, pas, def, gk, spd, sta, pot, form, fit, inj, vt, sal,
start, sg, ss, apps, tg, star, trait, skin, hair, style, beard, band, tall
```

## Browser-Speicher (`localStorage`)

| Schlüssel | Inhalt |
|---|---|
| `hl3_karriere` | Karriere-Spielstand |
| `hl3_spielstand` | laufendes Spiel (Speichern & Beenden, Auto-Speichern beim Verlassen) |
| `hl3_kader` | Spielernamen und -nummern aus dem Editor |
| `hl2_vereine` | Vereinsnamen, Kürzel und Farben aus dem Editor |
| `hl4_audio` | Lautstärken und Hallensprecher |
| `hl4_settings` | Spieltempo |
| `hl2_sound` | Ton an/aus |

Alle Zugriffe laufen über `store` mit `try/catch`, damit das Spiel auch ohne Speicher (z. B. im privaten Modus) funktioniert.
