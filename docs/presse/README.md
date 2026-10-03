# Hallenlegenden · Pressekit

Retro-Handball im Pixel-Look, kostenlos im Browser: **[hallenlegenden.de](https://hallenlegenden.de)**

Alle Dateien hier dürfen für Berichte, Posts und Vorstellungen des Spiels frei verwendet werden, gern mit Link auf hallenlegenden.de.

## Material

| Datei | Inhalt | Format |
|---|---|---|
| [hallenlegenden-teaser.mp4](hallenlegenden-teaser.mp4) | Story-Film der Startseite, 20 s, mit Abschlusstafel | 1280 × 720, H.264 |
| [hallenlegenden-teaser.gif](hallenlegenden-teaser.gif) | dasselbe als GIF | 640 × 360 |
| [hallenlegenden-anzug.gif](hallenlegenden-anzug.gif) | Szene aus dem Story-Film: Trikot aus, Anzug an | 540 × 345, pixelgenau |
| [hallenlegenden-anzug.mp4](hallenlegenden-anzug.mp4) | dasselbe als Video | 1080 × 690 |
| [hallenlegenden-final-four.mp4](hallenlegenden-final-four.mp4) | Europapokal-Finale beim Final Four: Event-Titel, Spiel in der neutralen Halle, Schlusssekunden und Pokalübergabe, 26 s | 1280 × 720, H.264 |
| [hallenlegenden-final-four.gif](hallenlegenden-final-four.gif) | die letzten 10 Sekunden: Schlussphase und „KIEL HOLT DEN EUROPAPOKAL!“ | 640 × 360 |
| [hallenlegenden-aufstellung.mp4](hallenlegenden-aufstellung.mp4) | TV-Intro vor dem Anpfiff: Teamnamen, dann die Aufstellungskarten beider Mannschaften, 11 s | 1280 × 720, H.264 |
| [hallenlegenden-aufstellung.gif](hallenlegenden-aufstellung.gif) | dasselbe als GIF | 640 × 360 |
| [hallenlegenden-spielszene.mp4](hallenlegenden-spielszene.mp4) | Spielzug bis zum Tor, dann die Zeitlupen-Wiederholung, 21 s | 1280 × 720, H.264 |
| [hallenlegenden-spielszene.gif](hallenlegenden-spielszene.gif) | dasselbe als GIF | 640 × 360 |
| [hallenlegenden-europapokal.mp4](hallenlegenden-europapokal.mp4) | Karriere-Modus, Tab „EUROPA“: Gruppentabellen, Ergebnisse, Turnierbaum bis zum Sieger, 9 s | 1280 × 720, H.264 |
| [hallenlegenden-final-four-titel.png](hallenlegenden-final-four-titel.png) · [-pokal.png](hallenlegenden-final-four-pokal.png) | Standbilder: Final-Four-Intro und Pokalübergabe | 1280 × 720 |
| [hallenlegenden-aufstellung.png](hallenlegenden-aufstellung.png) | Standbild: Aufstellungskarten | 1280 × 720 |
| [hallenlegenden-europapokal-gruppen.png](hallenlegenden-europapokal-gruppen.png) · [-turnierbaum.png](hallenlegenden-europapokal-turnierbaum.png) | Standbilder: Europapokal mit Gruppen und mit Turnierbaum | 1280 × 720 |
| [hallenlegenden-abschlusstafel.png](hallenlegenden-abschlusstafel.png) | Logo mit Adresse | 1280 × 720 |
| [../screenshots/](../screenshots/) | echte Aufnahmen aus dem Spiel: Partie, Titel, Teamauswahl, Zeitung, Statistik, Pokal | 1280 × 720 |

Teaser und Anzug-Wechsel stammen aus dem Story-Film der Landingpage, alle anderen Clips sind echte Aufnahmen aus dem Spiel (Originalgrafik 640 × 360, fürs Video pixelgenau verdoppelt, ohne Ton). Im Spiel selbst spielst du die Partien und führst im Karriere-Modus gleichzeitig den Verein.

## Kurzbeschreibung

**Deutsch:** Hallen-Legenden ist ein Handballspiel im Retro-Pixel-Look, das direkt im Browser läuft, am Computer und am Smartphone. 7 gegen 7 mit echten Regeln, Sprungwurf, Kempa-Trick und 7-Meter-Duell. Dazu eine Karriere über viele Saisons mit zwei Ligen, Transfermarkt, Vereinsfinanzen, Pokal und Europapokal mit Final Four und einer Zeitung nach jedem Spieltag. Kostenlos, ohne Download und ohne Anmeldung. Ein privates Fan-Projekt mit Fantasie-Vereinsnamen.

**English:** Hallen-Legenden is a retro pixel-art handball game that runs right in the browser, on desktop and mobile. 7 vs 7 with real rules, jump shots, Kempa tricks and 7 m penalty duels, plus a multi-season career with two leagues, a transfer market, club finances, a national cup and a European cup with Final Four events and a newspaper after every matchday. Free, no download, no sign-up. A private fan project with fictional club names. The UI is German for now.

## Fakten

- **Plattform:** Browser (Computer mit Tastatur oder Gamepad, Smartphone mit Touch)
- **Preis:** kostenlos
- **Sprache:** Deutsch
- **Entwicklung:** tobwil, privates Projekt, entstanden mit KI-Programmierassistenten
- **Quellcode:** [github.com/tobwil/HallenLegenden](https://github.com/tobwil/HallenLegenden) (MIT-Lizenz)
- **Kontakt:** über das [Impressum](https://hallenlegenden.de/impressum.html)

## Neu erzeugen

Ändert sich das Spiel oder der Story-Film, entsteht das Material mit einem Befehl neu:

```sh
cd tools/promo && npm i playwright && sh promo.sh
```

Nur die Clips aus dem Spiel: `sh promo.sh spiel`, nur Teaser und Anzug-Clip: `sh promo.sh film`.

Das braucht `ffmpeg` und `python3`. Die Zeitpläne für Teaser und Anzug-Clip stehen in `tools/promo/aufnahme.js`, die Abschlusstafel in `tools/promo/abschlusstafel.html`. Die Spielclips nimmt `tools/promo/spiel.js` auf: Das Spiel läuft dabei Bild für Bild mit festem Zufall, jede Aufnahme fällt also gleich aus. Szenen, Vereine und Längen stehen dort pro Clip.
