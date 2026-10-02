# Landingpage

`index.html` im Hauptordner ist die Startseite, das Spiel liegt unter `game/`. Es gibt keinen Build-Schritt für die Landingpage: HTML, CSS und JavaScript stehen in der Datei selbst, Bilder kommen aus `docs/screenshots/`, Schriften aus `fonts/`.

## Aufbau

| Bereich | Inhalt |
|---|---|
| Story-Film | Abschnitt `#film`: Beim Scrollen bleibt ein Pixel-Canvas stehen (`position: sticky`), eine Figur läuft von links nach rechts durch sieben Szenen. Code in `assets/story.js`. |
| Wunsch-Formular | `#wunsch`, schreibt in die Google-Tabelle |
| Fuß | Hinweis Fan-Projekt, Lizenz, Impressum, Datenschutz |

### Story-Film

Die Figur nutzt die Sprites aus dem Spiel (`src/p03_sprites.js`, nach `assets/story.js` kopiert) und hat zusätzlich einen Anzug und die Posen `walk`, `read`, `lift`, `point`, `jubel`, `bounce`.

| Szene | Was passiert |
|---|---|
| `halle` | Intro mit Logo, dann dribbelt die Figur durch die volle Halle |
| `tor` | Sprungwurf, Ball ins Netz, Torwart fliegt, „TOR!“, Konfetti |
| `tv` | Wohnzimmer, Röhrenfernseher zeigt die echte Spielszene, beim Tor jubelt die Figur |
| `zeitung` | Küche, die Figur liest den Handball-Kurier, die Uhr läuft, draußen geht die Sonne auf |
| `buero` | Tafel mit wachsender Tabellenkurve, Monitor mit der Statistik-Seite, Pokal stemmen |
| `kabine` | Vorhang zu, Trikot und Schuhe fliegen raus, Vorhang auf: Anzug |
| `finale` | Halle am Abend, Ersatzbank jubelt, der Manager zeigt aufs Feld |

Alles ist im gleichen Maßstab gezeichnet: Die Figur ist rund 50 px groß (≈ 1,9 m), also `M = 26` Pixel pro Meter. Tor 2 m hoch auf der Torlinie am Ende des Torraums, Fernseher 1,45 m, Tisch 0,76 m, Spinde 1,8 m usw. Neue Möbel bitte in diesem Maßstab anlegen.

Die Zeitachse ergibt sich aus `SCENES` (Breite `w`, Haltepunkt `at`, Länge der Aktion `act`). Lauf-Abschnitte sind 1:1 an den Scroll gekoppelt, in Aktionen bleibt die Figur stehen und der Scroll treibt die Animation. Die Texte (`[data-scene]` in `index.html`) gleiten pro Szene von rechts herein und nach links hinaus. Mit `window.__story` lässt sich die Zeitachse im Browser untersuchen.

Ohne JavaScript werden die Texte als normale Liste untereinander gezeigt.

## Wunsch-Formular an die Google-Tabelle anbinden

Einmalig, dauert etwa fünf Minuten:

1. Die Tabelle „Feature Requests HallenLegenden“ öffnen, dann **Erweiterungen → Apps Script**.
2. Den Inhalt von `tools/feature-requests.gs` einfügen und speichern.
3. **Bereitstellen → Neue Bereitstellung**, Typ **Web-App**.
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**
4. Den Zugriff auf die Tabelle erlauben (Google fragt beim ersten Mal nach).
5. Die Web-App-URL kopieren (endet auf `/exec`) und in `index.html` bei `FEATURE_ENDPOINT` eintragen.

Test: Die URL im Browser öffnen, sie antwortet mit `{"ok":true,...}`. Bei späteren Änderungen am Script unter **Bereitstellungen verwalten** eine neue Version derselben Bereitstellung anlegen, dann bleibt die URL gleich.

Solange `FEATURE_ENDPOINT` leer ist, meldet das Formular, dass die Wunschliste gerade angeschlossen wird.

Warum ein Script nötig ist: Auch eine für alle bearbeitbare Tabelle lässt sich über die Google-Schnittstelle nur mit Anmeldung beschreiben. Das Script läuft mit deinem Konto und schreibt stellvertretend. Die Tabelle selbst muss dafür nicht öffentlich sein, „Eingeschränkt“ reicht.

### Spam-Schutz

- Schalter „Ich bin ein Mensch“: reagiert nur auf echte Klicks oder Tastendrücke
- unsichtbares Feld `website`: wird es ausgefüllt, wird nichts gespeichert
- Mindestzeit: Abschicken in unter 4 Sekunden nach dem Laden wird verworfen
- Prüfwert `h` aus Ladezeitpunkt und Wunschlänge, den das Apps Script nachrechnet. Direkte Anfragen ohne gültigen Prüfwert landen nicht in der Tabelle.
- höchstens 60 Einträge pro 10 Minuten
- Texte, die mit `=`, `+`, `-` oder `@` beginnen, werden mit `'` entschärft, damit sie nicht als Formel laufen

Gegen gezielte Angriffe hilft das nur begrenzt, weil der Prüfwert im Browser berechnet wird. Wird das ein Problem, lässt sich Cloudflare Turnstile ergänzen (Token im Formular, Prüfung im Apps Script per `UrlFetchApp`).

## Hosting und Domain

**hallenlegenden.de** liegt bei Netlify (Projekt `hallenlegenden`, Ausweich-Adresse https://hallenlegenden.netlify.app). `netlify.toml` veröffentlicht den Hauptordner ohne Build-Schritt und leitet `/spielen` auf `/game/` weiter.

Damit Änderungen auf `main` automatisch online gehen, muss das Netlify-Projekt mit dem Repository verbunden sein: in Netlify unter **Project configuration → Build & deploy → Continuous deployment → Link repository** `tobwil/HallenLegenden` wählen, Branch `main`, Build-Befehl leer, Veröffentlichungsordner `.`. Pull Requests bekommen dann eigene Vorschau-Adressen.

## Umzug von GitHub Pages

Die frühere Adresse `tobwil.github.io/HallenLegenden` wird weiter von GitHub Pages aus `main` ausgeliefert. Jede Seite lädt `assets/umzug.js` (im Spiel `../assets/umzug.js`, eingefügt von `src/build.sh`):

- **Auf github.io** leitet das Skript sofort auf hallenlegenden.de weiter, mit dem gleichen Pfad (`/spielen.html` → `/game/`). Gibt es Spielstände (`localStorage`, Schlüssel `hl…_`), werden sie komprimiert (`deflate-raw`, Base64) in den URL-Anker gepackt: `https://hallenlegenden.de/#umzug=…&ziel=/game/`. Wer schon gespielt hat und die alte Startseite aufruft, landet direkt im Spiel.
- **Auf hallenlegenden.de** übernimmt das Skript die Spielstände aus dem Anker, überschreibt aber keine vorhandenen, und leitet zum Ziel weiter. Übernommen wird nur, wenn die Seite wirklich von `https://tobwil.github.io/` kommt (Referrer), und nur Pfade auf der eigenen Seite sind als Ziel erlaubt. So kann niemand per präpariertem Link Spielstände unterschieben oder auf fremde Seiten umleiten.

Eine Karriere nach einer vollen Saison ist rund 220 KB groß, komprimiert etwa 45 KB im Link. Über 1,9 MB wird ohne Spielstand weitergeleitet. Browser, die keinen Referrer senden, werden ebenfalls ohne Spielstand weitergeleitet.

GitHub Pages bleibt dafür in den Repository-Einstellungen eingeschaltet (Branch `main`, Ordner `/`).

## Nutzungsstatistik (Umami Cloud)

Landingpage und Spiel (`game/index.html`, eingefügt von `src/build.sh`) laden das Umami-Skript mit `data-domains="hallenlegenden.de,www.hallenlegenden.de"`. Auf anderen Adressen (localhost, netlify.app, github.io) wird nichts gezählt. Keine Cookies, „Do Not Track“ wird beachtet. Auswertung im Umami-Dashboard.

| Ereignis | Wo | Daten |
|---|---|---|
| `spielen-klick` | Knöpfe „Spielen“ / „Jetzt spielen“ | `ort`: kopf, start, finale |
| `wunsch-klick` | Knöpfe „Feature wünschen“ / „Was fehlt dir?“ | `ort` |
| `story-szene` | jede Szene im Story-Film, einmal pro Besuch | `szene`, `nr` (1–7) |
| `wunsch-gesendet` | Formular erfolgreich abgeschickt | `kategorie` |
| `spiel-start` | Partie beginnt | `modus`: schnelles-spiel, karriere |
| `spiel-ende` | Abpfiff | `modus`, `ergebnis` (sieg, niederlage, unentschieden, weiter, ausgeschieden) |
| `karriere-neu` | neue Karriere angelegt | |
| `karriere-simuliert` | eigener Spieltag simuliert | |

Im Spiel läuft das über `track()` in `src/p01_core.js`, ohne Umami ist der Aufruf wirkungslos. Eigene Besuche ausschließen: auf der Datenschutz-Seite „Statistik abschalten“ klicken (setzt `umami.disabled` im Browser).

## Impressum und Datenschutz

`impressum.html` und `datenschutz.html` nutzen `assets/legal.css`. Name, Adresse und E-Mail stehen kodiert in `assets/kontakt.js` und werden erst nach Klick auf „Kontakt anzeigen“ lesbar. Ändern: neue Daten als JSON kodieren (Base64, dann Zeichenfolge umdrehen) und in `D` eintragen.
