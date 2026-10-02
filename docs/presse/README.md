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
| [hallenlegenden-abschlusstafel.png](hallenlegenden-abschlusstafel.png) | Logo mit Adresse | 1280 × 720 |
| [../screenshots/](../screenshots/) | echte Aufnahmen aus dem Spiel: Partie, Titel, Teamauswahl, Zeitung, Statistik, Pokal | 1280 × 720 |

Der Anzug-Wechsel stammt aus dem Story-Film der Landingpage. Im Spiel selbst spielst du die Partien und führst im Karriere-Modus gleichzeitig den Verein.

## Kurzbeschreibung

**Deutsch:** Hallen-Legenden ist ein Handballspiel im Retro-Pixel-Look, das direkt im Browser läuft, am Computer und am Smartphone. 7 gegen 7 mit echten Regeln, Sprungwurf, Kempa-Trick und 7-Meter-Duell. Dazu eine Karriere über viele Saisons mit zwei Ligen, Transfermarkt, Pokal mit Final Four und einer Zeitung nach jedem Spieltag. Kostenlos, ohne Download und ohne Anmeldung. Ein privates Fan-Projekt mit Fantasie-Vereinsnamen.

**English:** Hallen-Legenden is a retro pixel-art handball game that runs right in the browser, on desktop and mobile. 7 vs 7 with real rules, jump shots, Kempa tricks and 7 m penalty duels, plus a multi-season career with two leagues, a transfer market, a cup with a Final Four and a newspaper after every matchday. Free, no download, no sign-up. A private fan project with fictional club names. The UI is German for now.

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

Das braucht `ffmpeg` und `python3`. Die Zeitpläne für Teaser und Anzug-Clip stehen in `tools/promo/aufnahme.js`, die Abschlusstafel in `tools/promo/abschlusstafel.html`.
