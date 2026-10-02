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

## Eigene Domain (z. B. hallenhelden.de)

Mit GitHub Pages:

1. Im Repository unter **Settings → Pages → Custom domain** die Domain eintragen. GitHub legt dabei eine Datei `CNAME` an.
2. Beim Domain-Anbieter DNS-Einträge setzen:
   - `A`-Einträge für die Hauptdomain auf `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` für `www` auf `tobwil.github.io`
3. Wenn das Zertifikat bereit ist: **Enforce HTTPS** aktivieren.

Danach ist die Landingpage unter `https://hallenhelden.de/` und das Spiel unter `https://hallenhelden.de/game/` erreichbar. Alle Links auf der Seite sind relativ und funktionieren ohne Änderung. Nur die `canonical`-URL in `src/build.sh` (`URL=...`) sollte dann auf die neue Domain zeigen.

Achtung: Spielstände liegen im Browser pro Domain. Wer bisher unter `tobwil.github.io` gespielt hat, sieht seine Karriere unter der neuen Domain nicht.

## Netlify (Testumgebung)

Test-Adresse: https://hallenlegenden.netlify.app. `netlify.toml` veröffentlicht den Hauptordner ohne Build-Schritt und leitet `/spielen` auf `/game/` weiter.

## Impressum und Datenschutz

`impressum.html` und `datenschutz.html` nutzen `assets/legal.css`. Name, Adresse und E-Mail stehen kodiert in `assets/kontakt.js` und werden erst nach Klick auf „Kontakt anzeigen“ lesbar. Ändern: neue Daten als JSON kodieren (Base64, dann Zeichenfolge umdrehen) und in `D` eintragen.
