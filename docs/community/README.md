# Community: r/HallenLegenden

Alles, um das Subreddit **r/HallenLegenden** zu sichern, einzurichten und mit Leben zu füllen. Die Texte sind zum Kopieren gedacht, die Zeichengrenzen von Reddit sind eingehalten.

| Datei | Wofür |
|---|---|
| [reddit-icon.png](reddit-icon.png) | Community-Icon, 256 × 256 |
| [reddit-banner.png](reddit-banner.png) | Banner, 1920 × 384 |
| [automoderator.yaml](automoderator.yaml) | AutoModerator-Regeln |

Icon und Banner neu erzeugen: `node tools/community/reddit.js` (braucht Playwright wie `tools/promo`).

---

## 1. Heute: Namen sichern

Einen Subreddit-Namen kann man nicht reservieren, nur anlegen. Wer ihn zuerst anlegt, hat ihn. Also zuerst anlegen, einrichten geht danach in Ruhe.

1. **Projektkonto anlegen** (empfohlen): `u/HallenLegenden` als offizielles Konto, getrennt vom Privatkonto. Gleich danach **Zwei-Faktor-Anmeldung** einschalten (Einstellungen → Konto/Sicherheit) und die Backup-Codes sicher ablegen.
   - Reddit verlangt zum Erstellen einer Community ein gewisses Kontoalter und etwas Karma. Klappt es mit dem neuen Konto nicht, die Community mit dem **älteren Privatkonto** anlegen und das Projektkonto anschließend als Mod einladen.
2. **Community erstellen:** reddit.com → „Community erstellen“ (bzw. reddit.com/subreddits/create).
   - Name genau so eintippen: **`HallenLegenden`**. Name und Groß-/Kleinschreibung lassen sich **später nicht mehr ändern**.
   - Typ: **Öffentlich**. Nicht „18+“.
   - Themen: Gaming → Indie / Sports Games (was angeboten wird).
3. **Sofort einen ersten Beitrag posten** (Willkommens-Post unten) und anpinnen. Eine leere Community wirkt verwaist.
4. **Zweiten Mod eintragen:** eine Person, der du vertraust, oder das Projektkonto. Fällt ein Konto aus (gesperrt, Passwort weg), bleibt die Community in deiner Hand.
5. **Verwandte Namen** bei Bedarf gleich mit anlegen und auf r/HallenLegenden verweisen lassen (Beschreibung „Hier geht's lang: r/HallenLegenden“, Typ „Eingeschränkt“): z. B. `Hallen_Legenden`, `HallenLegendenGame`. Optional, nur wenn Verwechslungsgefahr besteht.

### Dauerhaft sichern: aktiv bleiben

Reddit kann Communities, deren Mods lange nichts tun, über **r/redditrequest** an andere Nutzer übergeben. Dagegen hilft nur Regelmäßigkeit:

- mindestens **einmal pro Woche** einloggen, Mod-Warteschlange ansehen, etwas posten oder kommentieren
- jedes Spiel-Update als Beitrag ankündigen (Vorlage unten), das passiert ohnehin regelmäßig
- beide Mod-Konten gelegentlich benutzen, nicht nur eins

---

## 2. Einrichten

Alles unter **Mod-Tools** (reddit.com/mod/HallenLegenden).

### Aussehen

- Icon: `reddit-icon.png` hochladen
- Banner: `reddit-banner.png` hochladen. Reddit schneidet je nach Gerät etwas ab, Schrift und Adresse sitzen deshalb mittig.
- Farbe für Akzente/Buttons: `#FFC83A` (Gold aus dem Logo), Hintergrund dunkel `#07060B`

### Beschreibung (max. 500 Zeichen)

```
Die Community zu Hallen-Legenden: Retro-Handball im Pixel-Look, kostenlos im Browser auf PC und Handy. Teile deine Karriere, Rekorde und Tore, melde Bugs, wünsch dir Funktionen und diskutiere Taktik. Jetzt spielen: hallenlegenden.de · Inoffizielles Fan-Projekt mit Fantasie-Vereinen, ohne Verbindung zu einer Liga.
```

### Links in der Seitenleiste (Widget „Links“ / Lesezeichen)

| Titel | Adresse |
|---|---|
| ▶ Jetzt spielen | https://hallenlegenden.de |
| Wunsch-Formular | https://hallenlegenden.de/#wunsch |
| Quellcode (GitHub) | https://github.com/tobwil/HallenLegenden |
| Änderungen / Changelog | https://github.com/tobwil/HallenLegenden/blob/main/CHANGELOG.md |
| Pressekit | https://github.com/tobwil/HallenLegenden/tree/main/docs/presse |

### Sicherheit und Spam

- **Beitragsflair verpflichtend** (Beitragsflair-Einstellungen → „Flair erforderlich“)
- **Ban-Evasion-Filter** an, **Reputations-/Spamfilter** auf mittel, **Belästigungsfilter** an
- **Crowd Control** erst einschalten, wenn ein Beitrag mal aus dem Ruder läuft
- **AutoModerator:** Inhalt von `automoderator.yaml` unter reddit.com/r/HallenLegenden/wiki/config/automoderator einfügen und speichern

### Regeln (Titel max. 100, Text max. 500 Zeichen)

1. **Sei fair, wie in der Halle**
   Kritik am Spiel ist willkommen, Angriffe auf Menschen nicht. Keine Beleidigungen, kein Hass, keine Diskriminierung.
2. **Beim Thema bleiben**
   Hier geht es um Hallen-Legenden: Karrieren, Taktik, Bugs, Wünsche, Fan-Art, Updates. Allgemeine Handball-Diskussionen sind okay, wenn sie einen Bezug zum Spiel haben.
3. **Passenden Flair wählen**
   Jeder Beitrag braucht einen Flair. Bugs bitte mit Gerät, Browser und kurzer Beschreibung, was passiert ist.
4. **Fan-Projekt bleibt Fan-Projekt**
   Das Spiel nutzt Fantasie-Vereine. Bitte keine offiziellen Vereins- oder Ligalogos hochladen und keine Editor-Stände mit echten Namen als „offiziell“ verbreiten.
5. **Keine Werbung, kein Spam**
   Keine Eigenwerbung für andere Spiele, Kanäle oder Shops. Eigene Videos und Streams vom Spiel sind willkommen.
6. **Keine Cheats, Exploits nur als Bug**
   Gefundene Lücken (z. B. unendlich Geld) bitte als Bug melden statt als Anleitung zu verbreiten.

### Entfernungsgründe (Removal Reasons)

Für jede Regel einen Eintrag mit demselben Titel anlegen. Text-Vorlage:

```
Hallo u/{{author}}, dein Beitrag wurde entfernt, weil er gegen Regel „…“ verstößt. Bei Fragen schreib uns per Modmail. Danke fürs Verständnis!
```

### Beitragsflairs

| Flair | Farbe | Wofür |
|---|---|---|
| Karriere | `#FFC83A` | Saisons, Titel, Teilen-Bilder aus dem Spiel |
| Tor des Tages | `#FF4F3A` | Clips und GIFs von Toren, Paraden, Kempa |
| Taktik | `#7CF2FF` | Aufstellung, Abwehrsysteme, Transfers, Training |
| Bug | `#D9842F` | Fehler im Spiel (AutoMod fragt nach Details) |
| Wunsch | `#3DDC84` | Ideen für neue Funktionen |
| Frage | `#B3A9C4` | Hilfe und Fragen |
| Fan-Art | `#C96A12` | Pixel-Art, Trikots, eigene Vereine |
| Update | `#07060B` (Mod-only) | Neue Versionen, Changelog |
| Ankündigung | `#7A2C0C` (Mod-only) | Wettbewerbe, Regeln, Wochen-Threads |

### Benutzerflairs: Lieblingsverein

Nutzer wählen ihren Fantasie-Verein aus dem Spiel, in den Vereinsfarben (Text/Hintergrund). Für den Anfang reicht die 1. Liga, Nutzer dürfen ihren Flair zusätzlich frei bearbeiten.

| Flair | Hintergrund | Text |
|---|---|---|
| Magdeburg Domstürmer | `#0A8A3E` | hell |
| Flensburg Fördeblitz | `#0B3D91` | hell |
| Kiel Leuchttürme | `#F4F4F0` | dunkel |
| Berlin Hauptstadtbären | `#0F8A4A` | hell |
| Hannover Leineritter | `#D0021B` | hell |
| Melsungen Fuldataler | `#C8102E` | hell |
| Gummersbach Oberbergler | `#0057A8` | hell |
| Erlangen Regnitzer | `#1B2F6B` | hell |
| Rhein-Neckar Kurpfälzer | `#FFD200` | dunkel |
| Stuttgart Neckarwilde | `#B0122C` | hell |
| Balingen Zollernalb | `#F07D00` | dunkel |
| Lemgo Lippe-Hanse | `#0050A0` | hell |
| Hamburg Hafenriesen | `#1D1D24` | hell |
| Eisenach Wartburgritter | `#1356A8` | hell |
| Bietigheim Enzwölfe | `#E30613` | hell |
| Wetzlar Lahnadler | `#008D4C` | hell |
| Wuppertal Bergwölfe | `#6AA82F` | dunkel |
| Zweitliga-Fan | `#FFC83A` | dunkel |
| Neutral / Manager | `#B3A9C4` | dunkel |

Die übrigen Vereine (2. Liga, Europa) stehen in `src/p01_core.js` und lassen sich jederzeit ergänzen.

---

## 3. Erste Beiträge (vor dem Teilen der Community posten)

Eine neue Community braucht 5–8 Beiträge, bevor die ersten Besucher kommen. Sonst gehen sie gleich wieder. Die Medien liegen in `docs/presse/` und `docs/screenshots/`.

### Willkommen (anpinnen, Flair „Ankündigung“)

> **Titel:** Willkommen bei r/HallenLegenden – Retro-Handball im Browser 🤾
>
> Hallen-Legenden ist ein Handballspiel im Pixel-Look, das direkt im Browser läuft, am PC und am Handy: 7 gegen 7 mit echten Regeln, Sprungwurf, Kempa-Trick und 7-Meter-Duell, dazu eine Karriere mit zwei Ligen, Transfermarkt, Finanzen, Pokal und Europapokal mit Final Four.
>
> **▶ Spielen:** https://hallenlegenden.de (kostenlos, ohne Download, ohne Anmeldung)
>
> **Was hier rein darf:**
> - deine Karriere (im Spiel unter *Erfolge → Karriere als Bild teilen*)
> - Tore, Paraden und Kempa-Tricks als Clip
> - Taktik, Transfers, Abwehrsysteme
> - Bugs (mit Gerät und Browser) und Wünsche
>
> Ich bin der Entwickler und lese hier mit. Jedes Update kündige ich hier an. Erzähl gern in den Kommentaren, mit welchem Verein du startest!
>
> *Inoffizielles Fan-Projekt mit Fantasie-Vereinen.*

Video dazu: `docs/presse/hallenlegenden-teaser.mp4`.

### Weitere Startbeiträge

| # | Flair | Titel | Medium |
|---|---|---|---|
| 1 | Update | Was zuletzt neu kam: Vor-dem-Spiel-Vergleich, Erfolge und Teilen-Bilder | Auszug aus `CHANGELOG.md`, `docs/screenshots/prematch.jpg` |
| 2 | Tor des Tages | Kempa-Trick mit Zeitlupe | `docs/presse/hallenlegenden-kempa.mp4` |
| 3 | Karriere | Meine Test-Karriere: drei Titel in fünf Saisons | `docs/screenshots/share-card.jpg` |
| 4 | Ankündigung | Wunsch-Thread: Was soll als Nächstes ins Spiel? | Umfrage mit 4 Optionen (z. B. Online-Liga, Frauen-Ligen, Englisch, Gamepad-Feinschliff) |
| 5 | Taktik | 6:0, 5:1 oder 3:2:1 – welche Abwehr spielt ihr? | `docs/screenshots/team-selection.jpg` |
| 6 | Frage | Bekannte Bugs und Tipps (Sammelthread) | Text |
| 7 | Tor des Tages | Final Four: Pokalübergabe in der Event-Halle | `docs/presse/hallenlegenden-final-four.mp4` |

Nicht alles an einem Tag posten: zwei am ersten Tag, dann einer pro Tag. So sieht die Community lebendig aus.

### Vorlage für Update-Beiträge

> **Titel:** Update: [das Wichtigste in fünf Wörtern]
>
> Neu im Spiel:
> - …
> - …
>
> Danke an u/… für die Idee / den Bug-Report!
>
> Spielen: https://hallenlegenden.de · Alle Änderungen: [Changelog](https://github.com/tobwil/HallenLegenden/blob/main/CHANGELOG.md)

Leute, deren Wunsch oder Bug-Meldung umgesetzt wurde, namentlich nennen. Das ist der stärkste Grund, wiederzukommen.

---

## 4. Wiederkehrende Formate

| Wann | Format | Idee |
|---|---|---|
| jeden Montag | **Spieltag-Thread** | „Wie lief eure Woche?“ Karrierestand, Transfers, Frust |
| jeden Freitag | **Tor der Woche** | Clips sammeln, am Sonntag Umfrage, Sieger bekommt Flair „Tor des Monats“ |
| einmal im Monat | **Challenge** | z. B. „Mit Ferndorf aus der 2. Liga in drei Saisons Meister“, Beweis per Teilen-Bild, Gewinner in die Ehrenhalle (Wiki-Seite) |
| nach jedem Update | **Update-Post** | Vorlage oben |

Wochen-Threads lassen sich unter Mod-Tools → **Geplante Beiträge** automatisch anlegen.

---

## 5. Leute hinholen

### Eigene Kanäle zuerst

Sobald die Community steht, auf r/HallenLegenden verlinken:

- Landingpage (Fußzeile und nach dem Absenden des Wunsch-Formulars)
- im Spiel: Titelmenü oder Credits, evtl. als Zeile auf dem Teilen-Bild
- README und Pressekit
- bei jeder Antwort auf eine Mail oder einen Kommentar zum Spiel

### Andere Subreddits

Vor jedem Post **die Regeln der jeweiligen Community lesen**: Viele erlauben Eigenwerbung nur an bestimmten Tagen, in Sammelthreads oder gar nicht. Ehrlich schreiben, dass du der Entwickler bist, und in den Kommentaren antworten. Nicht alle am selben Tag posten, ein Sub pro Woche reicht.

| Community | Passt, weil | Beitrag |
|---|---|---|
| r/handball | Kernpublikum | Clip (Kempa oder Final Four) + „Ich habe ein Handballspiel gebaut“ |
| r/WebGames | läuft ohne Download im Browser | direkter Link, kurzer Text |
| r/playmygame | sucht ausdrücklich Feedback | Link + konkrete Frage |
| r/IndieGaming, r/indiegames | Indie-Spiel mit eigenem Look | Teaser-GIF |
| r/IndieDev, r/SideProject | Entstehungsgeschichte | „Ein Handballspiel in einer HTML-Datei“ |
| r/de | deutsches Publikum | nur wenn die Regeln es zulassen, eher als Frage/Erfahrungsbericht |
| Communitys zu KI-Programmierung | Spiel entstand mit KI-Assistenten | Werkstattbericht, wie es gebaut wurde |

In jedem Post ein Satz am Ende: „Für Updates und Karriere-Bilder gibt es r/HallenLegenden.“ Das holt die Leute, die bleiben wollen.

### Außerhalb von Reddit

- Handball-Foren und Fan-Gruppen von Vereinen (Fantasie-Namen machen es unverfänglich)
- Handball-Podcasts und -Blogs: Pressekit schicken
- kurze Clips (Kempa, Final Four) auf TikTok/Instagram/YouTube Shorts mit Verweis auf die Community

---

## 6. Wachstum im Blick behalten

Unter Mod-Tools → **Insights** stehen Besucher, Beiträge und Beitritte. Die Startseite misst Besuche, die von Reddit kommen (siehe `datenschutz.html`), so lässt sich sehen, welcher Post Spieler gebracht hat.

Grobe Ziele für den Anfang:

| Zeitraum | Ziel |
|---|---|
| Woche 1 | Name gesichert, eingerichtet, 7 Startbeiträge |
| Monat 1 | 50 Mitglieder, erster Post in r/handball und r/WebGames |
| Monat 3 | 200 Mitglieder, Wochen-Threads laufen, erste Challenge |
| ab 500 Mitglieder | weitere Mods aus der Community dazuholen |
