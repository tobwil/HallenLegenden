# Changelog

Alle Versionen bis v7.8 entstanden am 1. Oktober 2026 in einer durchgehenden Entwicklungssitzung.

## v8.3: Europapokal und Final Four
- **Final Four:** Halbfinale und Finale des Pokals finden an einem Termin in neutraler Halle statt: lila Boden, goldene Torräume, ausverkaufte Ränge mit den Fans beider Teams je zur Hälfte, eigene Bandenwerbung, großer Event-Titel im Intro. Nach dem Finale gibt es eine Pokalübergabe mit Konfetti, auf dem Abpfiff-Bildschirm einen Pokal-Hinweis. Kein Heimvorteil und keine Zuschauereinnahmen für einen „Gastgeber“.
- **16 internationale Vereine** mit Fantasienamen (zum Beispiel Barcelona Katalanenstiere, Veszprém Bakonylöwen, Kielce Kreuzritter), im Schnellen Spiel unter „EUROPA“ wählbar. Laufende Karrieren bekommen ihre Kader und Budgets automatisch nachgerüstet.
- **Europapokal in der Karriere:** Platz 1 und 2 der 1. Liga, dazu der Pokalsieger (falls Erstligist, sonst der Dritte), treffen auf 13 internationale Vereine.
  - Gruppenphase mit 4 Gruppen à 4 (Lostöpfe nach Stärke, deutsche Vereine in verschiedenen Gruppen), Hin- und Rückspiel
  - Viertelfinale mit Heimrecht für Gruppensieger, Final Four am Saisonende
  - Bei 6 Spieltagen kompakt: 8 Vereine, Viertelfinale, Final Four
  - Termine zwischen den Ligaspieltagen, alle Spiele selbst spielbar oder simuliert. Mehr Spiele bedeuten mehr Belastung für den Kader.
  - Startprämie, Prämien für Siege und Runden, Zuschauereinnahmen bei Heimspielen
  - Neuer Tab „EUROPA“ mit Gruppentabellen, Ergebnissen und Turnierbaum. Zeitung, Saisonabschluss, Finanzbilanz und Historie zeigen den Europapokal.
  - Laufende Karrieren starten ab der nächsten Saison im Europapokal.
- **Fehler behoben:** Das TV-Intro mit den Aufstellungskarten wurde nie angezeigt, weil die Anwurf-Vorbereitung die Intro-Phase sofort überschrieb. Es läuft jetzt wieder vor jedem Spiel und lässt sich mit einer Taste überspringen.
- **Fehler behoben:** Gewann Magdeburg (Vereinsnummer 0) den Pokal, wurde das Finale am Saisonende erneut ausgespielt. In der Historie stand dann ein falscher Pokalsieger, im ungünstigen Fall drohte eine Endlosschleife.
- Lange Banner (z. B. bei der Pokalübergabe) passen ihre Schriftgröße der Bildbreite an
- Die Untertitelzeile unter „FINAL FOUR“ im Intro hat einen dunklen Hintergrund und ist vor dem Publikum lesbar
- 4 neue Regressionstests (`tests/run.mjs`), insgesamt 25. Der Aktionen-Test stellt den Spieler vor jeder Aktion wieder hin; vorher schlug er ab und zu fehl, wenn der Spieler in den Zwischenframes gefoult worden war und noch lag.
- **Pressekit:** neue Clips direkt aus dem Spiel: Final Four mit Pokalübergabe, TV-Intro mit Aufstellungskarten, Spielszene mit Tor und Wiederholung, Europapokal-Ansicht, dazu Standbilder (`docs/presse/`). Aufnahme mit `tools/promo/spiel.js`, Bild für Bild und mit festem Zufall reproduzierbar, alles neu mit `sh tools/promo/promo.sh spiel`.

## v8.2: Finanzen im Karrieremodus
- **Zuschauereinnahmen:** Jedes Heimspiel bringt Geld nach Hallengröße und Auslastung. Die Auslastung steigt mit Tabellenplatz, Siegesserie, starkem Gegner und im Pokal. Pokal-Heimspiele bringen jetzt auch Zuschauergeld. Die Zeitung nennt die Zuschauerzahl. Dazu Sponsoren pro Spieltag und TV-Geld nach Platz. Die Pauschalen für Sieg, Remis und Niederlage entfallen.
- **Saisonlänge egal:** Gehälter und Einnahmen sind auf eine Saison geeicht. Bei 6 oder 34 Spieltagen wird pro Spieltag umgerechnet, Zuschauergeld über die tatsächliche Zahl der Heimspiele. Spielergehälter werden pro Saison angezeigt.
- **CPU-Vereine** haben Einnahmen und Gehälter nach denselben Regeln, statt nur Geld dazuzubekommen. Ihre Budgets bleiben über mehrere Saisons stabil.
- **Fehler behoben (Geld aus dem Nichts):** Ablösefreie Spieler für 60 % kaufen und sofort für 85 % verkaufen brachte beliebig viel Geld. Jetzt sind Neuzugänge ein Drittel der Saison gesperrt, ein Sofortverkauf bringt 55 % des Marktwerts, und der Käufer muss zahlen können. Beim Kauf von einem Verein bekommt dieser die Ablöse.
- **Vorstand:** Bonus bei erreichtem Saisonziel. Knapp verfehlt (bis 2 Plätze) hat keine Folgen. Deutlich verfehlt oder Schulden zum Saisonende bringen eine Warnung, beim zweiten Mal in Folge die Entlassung mit Jobangeboten schwächerer Vereine.
- **Schulden:** Transfersperre, solange die Kasse im Minus ist. Nach einigen Spieltagen im Minus verkauft der Vorstand den günstigsten Spieler, dessen Erlös die Schulden deckt.
- **Statistik und Saisonabschluss** zeigen die Finanzbilanz der Saison, dazu Zuschauerschnitt und Hallengröße
- 5 neue Regressionstests für die Wirtschaft (`tests/run.mjs`)
- **Fehler behoben:** Die Historie ragte auf dem Handy im Hochformat über den Fensterrand. Sie erscheint dort jetzt als Karten (Saison · Liga · Platz, darunter Ziel, Meister, Pokal, Torjäger). Ein neuer Test prüft alle Karriere-Ansichten im Hochformat auf Überlauf.

## v8.1: Kein Zoom beim Spielen mit zwei Daumen, Regressionstests
- **Fehler behoben:** Auf dem iPhone (Safari) konnte das Bild beim Spielen plötzlich heranzoomen, wenn ein Daumen auf dem Stick und der andere auf einem Knopf lag. Safari erkennt das als Zwei-Finger-Zoom und ignoriert die übliche Zoom-Sperre. Jetzt werden Safaris Gesten-Events und Zwei-Finger-Bewegungen abgefangen, das Viewport-Tag sperrt den Zoom auch für andere Browser, und ein dennoch eingetretener Zoom wird automatisch zurückgesetzt. Ein-Finger-Scrollen in den Menüs funktioniert weiter.
- **Regressionstests im Repository** (`tests/`, Playwright): 15 Tests für Laden, Overlay, Menüfenster, Tastenbelegung, Aktionen, Eingabepuffer, Passquote, Spielerwechsel, komplettes Spiel, Kraftverlust, Zufallseingaben, Simulation, Editor, Karriere mit Statistik und Pokal sowie Handy-Zoom. Aufruf: `cd tests && npm install && npm test`.

## v8.0: Landingpage als Story-Film, Wunschliste, Impressum
- **Landingpage** im Hauptordner als scrollgesteuerter Pixel-Film: Eine Spielfigur (Sprites aus dem Spiel) dribbelt von links nach rechts durch sieben Szenen: Halle, Sprungwurf-Tor, Wohnzimmer mit Röhrenfernseher, Küche mit Handball-Kurier, Büro mit Statistik und Pokal, Kabine (Trikot aus, Anzug an), Finale als Manager am Spielfeldrand. Texte gleiten pro Szene herein, Anzeigetafel unten zeigt Szene und Fortschritt. Auf Desktop und Handy (hoch und quer) angepasst.
- **Das Spiel** liegt jetzt unter `/game/`. `spielen.html` leitet dorthin weiter.
- **Wunsch-Formular:** schreibt über ein Google-Apps-Script in die Tabelle „Feature Requests HallenLegenden“ (`tools/feature-requests.gs`). Spam-Schutz mit Schalter „Ich bin ein Mensch“, unsichtbarem Feld, Mindestzeit, Prüfwert, Mengenbremse und Schutz gegen Formeln in der Tabelle.
- **Impressum und Datenschutz:** Kontaktdaten erst nach Klick lesbar
- **Pressekit** in `docs/presse/`: Teaser-Video und GIFs vom Story-Film, Kurzbeschreibung DE/EN. Mit `tools/promo/promo.sh` neu erzeugbar.
- **Nutzungsstatistik mit Umami** (ohne Cookies, nur auf hallenlegenden.de): Klicks auf „Jetzt spielen“, Fortschritt im Story-Film, Spielstarts und -ergebnisse, neue Karrieren, abgeschickte Wünsche. Abschalten auf der Datenschutz-Seite.
- **Neue Adresse hallenlegenden.de** (Netlify). Die alte Adresse tobwil.github.io/HallenLegenden leitet weiter und nimmt Spielstände automatisch mit.
- **Schriften lokal** statt von Google Fonts, auch im Spiel
- **Neue Screenshots** von Statistik-Seite und Pokal-Turnierbaum

## v7.8: Neue Statistik-Seite, Pokal als Turnierbaum
- **Statistik:** Kennzahlen-Kacheln (Platz, Punkte mit Siege/Unentschieden/Niederlagen, Tore und Differenz, Rang von Angriff und Abwehr, Form der letzten 5 Spiele), Verlauf des Tabellenplatzes nach Spieltag (wird ab jetzt pro Spieltag gespeichert), Torjäger der Liga mit Balken, eigener Kader mit Spielen, Toren, Toren pro Spiel, Paraden, Form und Fitness
- **Pokal als Turnierbaum:** alle Runden bis zum Sieger nebeneinander, Sieger hervorgehoben, eigener Weg in Gold, 7-Meter-Entscheidungen markiert. Ab jetzt treffen die Sieger benachbarter Partien aufeinander (fester Baum statt Neuauslosung). Ältere Spielstände werden für die Anzeige passend sortiert.
- Pokal-Hinweis sagt jetzt „steht jetzt an“, wenn die Runde vor dem nächsten Ligaspiel fällig ist

## v7.7: Simulierte Ergebnisse passend zur Spieldauer, neuer Spielerwechsel
- **Simulation:** Simulierte Partien (Liga, Pokal, eigene simulierte Spiele) passen jetzt zur gewählten Halbzeitlänge. Tore pro Team im Schnitt: 2 Min ≈ 5,6, 3 Min ≈ 8,3, 5 Min ≈ 14 (gespielt: 5,2 / 7,9 / 13,1). Vorher immer rund 27 wie nach 60 echten Minuten, das hat die Tabelle verzerrt. Paraden skalieren mit. Bereits gespielte Ergebnisse einer laufenden Saison bleiben, wie sie sind.
- **Spielerwechsel in der Abwehr:** S (oder A) springt zuerst zum ballnächsten Spieler, jedes weitere Drücken innerhalb von 1,2 s zum nächstnäheren. Ohne Wechseltaste steuerst du automatisch den ballnächsten Spieler (Toleranz 2,5 m, höchstens ein Wechsel pro Sekunde, 1,5 s Pause nach einem Tastenwechsel, nie mitten im Block oder Sprung).
- **Fehler behoben:** Ein Druck auf die Wechseltaste konnte mehrere Spieler weiterschalten, weil der neue Spieler im selben Frame denselben Tastendruck noch einmal verarbeitet hat

## v7.6: Schnellere Pässe, keine Kurvenbälle
- **Pässe** fliegen rund 20 % schneller (kurz 16,5 statt 13,5 m/s, lang 21 statt 18 m/s), mittlere Flugzeit 0,47 statt 0,62 s
- **Keine Kurvenbälle mehr:** Die Ball-Lenkung aus v7.5 ist entfernt. Mit einer neuen Richtung verschiebst du den Empfänger während des Flugs nur noch bis 0,6 m um den Fangpunkt, der Ball fliegt gerade. Angekommene Pässe: 83–87 % in allen Fällen.

## v7.5: Pässe kommen wieder an, Editor für den ganzen Kader
- **Fehler behoben:** Wer beim Passen die Pfeiltaste gedrückt hielt, steuerte den Empfänger sofort vom Ball weg, nur noch rund 20 % der Pässe kamen an. Jetzt steuert die beim Pass gehaltene Richtung den Empfänger nicht mehr. Erst nach Loslassen oder mit einer neuen Richtung übernimmst du ihn. Steuerst du ihn selbst, lenkt der Pass leicht nach. Angekommene Pässe mit gehaltenem Pfeil: 19 % → 86 %, mit neuer Richtung im Flug: 50 % → 88 %.
- **Editor:** Neben der Startsieben ist auch die Ersatzbank des Schnellen Spiels editierbar. Bei laufender Karriere gibt es einen eigenen Abschnitt für den kompletten Karriere-Kader (inklusive Neuzugängen), der direkt im Spielstand gespeichert wird. Vorher wirkte der Editor auf die Karriere gar nicht.

## v7.4: Kraftverlust, Steuerung
- **Kraft über das Spiel:** Der Abbau ist etwa doppelt so stark wie bisher. Ohne Wechsel sinken Feldspieler bis Spielende im Schnitt auf rund 35 % (vorher rund 70 %, der Balken blieb fast immer grün). Mit Co-Trainer wird jetzt etwa ein Dutzend Mal pro Spiel gewechselt.
- Bankspieler erholen sich höchstens bis zu ihrer Fitness, nicht mehr auf 105 %
- **Eingabe:** Tastendrücke werden bis zum nächsten Frame gemerkt. Kurze Tipper auf Pass, Wurf oder Finte gingen vorher verloren, wenn die Taste schon vor dem nächsten Frame wieder losgelassen war.
- **Passempfang:** Während der Ball zu dir fliegt, steuerst du den Empfänger sofort mit den Pfeilen. Ohne Eingabe läuft er wie bisher automatisch zum Ball, Kempa-Lupfer bleiben automatisch.
- **Direktpass und Direktwurf:** Pass, Wurf, Kempa oder Finte, gedrückt während der Ball zu dir unterwegs ist, werden beim Fangen sofort ausgeführt
- **Passrichtung:** Pässe in Laufrichtung suchen zuerst in einem engen Kegel (rund 50°), erst dann weiter. Steht ein Mitspieler klar in Laufrichtung, geht der Pass nicht mehr zu jemandem, der weit daneben steht.
- **Direktere Bewegung:** Der eigene Spieler beschleunigt, bremst und wendet schneller (etwa 0,1 statt 0,2 s bis zum vollen Tempo). Die CPU-Spieler bewegen sich wie bisher.

## v7.3: Neue Tastaturbelegung
- **Pfeile laufen, linke Hand spielt:** S Pass (Abwehr: Spieler wechseln), A Kempa-Trick, Leertaste Wurf/Block, D Finte, beim Aufladen Heber (Abwehr: Ball herausspielen), W oder Shift Sprint. WASD bewegt den Spieler nicht mehr. J/K/L funktionieren weiterhin.
- Kempa per Tastatur nur noch über A oder Shift + S, damit Sprinten mit W und Passen keinen ungewollten Kempa auslöst
- Hinweise im Spiel (Laufband beim Anpfiff, „D=HEBER“) und Steuerungsseite angepasst

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
