# Changelog

Alle Versionen bis v7.8 entstanden am 1. Oktober 2026 in einer durchgehenden Entwicklungssitzung.

## v8.32: Die Legenden-Familie
- **Startseite: neuer Abschnitt „Noch mehr Legenden“** über dem Fuß, wie auf korblegenden.de. Zwei Karten empfehlen die Geschwister **Padel-Legenden** (padellegenden.de) und **Korb-Legenden** (korblegenden.de). Jede Karte ist als Ganzes ein Link, mit Emoji statt Bild, damit keine fremden Server dazukommen. Auf dem Handy stehen die Karten untereinander. In der Kopfleiste gibt es den Eintrag „Mehr Legenden“, im Fuß „Auch von mir: Padel-Legenden und Korb-Legenden“.
- **Suchmaschinen:** Die strukturierten Daten nennen beide Spiele als `isRelatedTo`.
- **Umami:** Klicks auf Karten und Fuß-Links zählen als `legenden-klick` mit `ziel` (padellegenden, korblegenden) und `ort` (familie, fuss). Die Datenschutzerklärung nennt die Klicks auf die Geschwister-Links und den App-Store-Link. `docs/LANDINGPAGE.md` führt `legenden-klick` und `appstore-klick` in der Ereignis-Tabelle.
- **Behoben: STATISTIK ABSCHALTEN deckte den Kontakt auf.** Auf der Datenschutz-Seite hängte `assets/kontakt.js` das Aufdecken an alle Knöpfe mit der Klasse `.reveal`, also auch an den Statistik-Knopf. Ein Klick darauf zeigte die Kontaktdaten und entfernte den Knopf, sodass sich die Statistik nicht wieder einschalten ließ. Jetzt reagiert nur der Knopf in der Kontaktkarte.
- 1 neuer Test, insgesamt 53. Er prüft:
  - Karten, Fuß-Links, Kopfleiste, `isRelatedTo` und die Lage über dem Fuß
  - keine Anfragen an neue fremde Server
  - kein seitliches Scrollen bei 1440, 390 und 320 px, Karten auf dem Handy untereinander
  - den Statistik-Knopf: ab- und wieder einschalten, Kontakt bleibt verdeckt

## v8.31: Schwierigkeit mit Biss
- **Behoben: Gegen die CPU war es zu leicht.** Ein einfacher Spieler-Bot (geradeaus zum Tor, aus 8,5 m in die freie Ecke, in der Abwehr vor den Ballführer stellen) gewann bei gleich starken Vereinen auf Profi 12 von 12 Spielen mit rund 19:8, auf Legende 11 von 12. Die CPU verlor dabei fast jeden zweiten Angriff durch einen abgefangenen Pass oder Ballverlust. Dich störte sie kaum, und misslungene Klau-Versuche der CPU endeten oft im Foul, mit 5 bis 7 Siebenmetern pro Spiel für dich.
- **Pass am engen Gegenspieler vorbei:** Stand ein Verteidiger direkt am Werfer (unter 1,3 m), lag er dicht an jedem Passweg und durfte schon beim Abwurf abfangen. Jeder vierte Pass unter Druck ging so verloren, und eine freie Alternative gab es praktisch nie. Jetzt fängt er dort nur noch mit gut einem Drittel der Chance ab. Pässe weiter im Passweg bleiben abfangbar. Das gilt für alle, auch für deine Pässe. Die CPU verliert gegen dich etwa 6 bis 8 statt 10 bis 13 Bälle durch Abfangen und kommt auf 25 bis 27 statt 18 bis 22 Würfe pro Spiel.
- **Neu je Stufe** (wirkt nur gegen dich): Abfang-Bonus des gesteuerten Spielers, Klau-Chance, wie oft die CPU deinem Ballführer den Ball wegspitzeln will und wie oft sie dabei foult.
  - **Amateur:** bleibt wie bisher.
  - **Profi:** Abfangen +20 % statt +25 %, die CPU stört deinen Ballführer 1,3-mal so oft und foult dabei seltener.
  - **Legende:** Abfangen +5 %, Klauen schwerer, die CPU stört 2,2-mal so oft. Der Stärkebonus bleibt +6.
- **Wirkung bei gleich starken Vereinen (Bot, Siege):**
  - **Profi:** guter Spieler etwa 90 % (vorher 100 %, aber knapper), mittlerer etwa 70 % (vorher 90 %), Anfänger etwa ein Drittel.
  - **Legende:** guter Spieler etwa die Hälfte, mittlerer etwa ein Viertel.
  - **Amateur:** alle gewinnen weiter fast immer.
- **Ungleiche Vereine:** Als Zweitligist gegen Magdeburg gewinnt ein guter Spieler weiter etwa die Hälfte, als Favorit gewinnt man weiter fast immer.
- **Tore:** CPU gegen CPU rund 1 bis 1,5 Tore mehr pro Spiel (16,1 statt 14,6 bzw. 16,9 statt 15,7), weil weniger Pässe verloren gehen. Der Favorit gewinnt gleich oft (66 % gegen 64 %). Mit Zufallseingaben gegen die CPU 27,4 statt 28,0 Tore. Simulierte Karriere-Spiele bleiben unverändert.
- **Neu: „Zu leicht?“ und „Zu schwer?“** Nach einem Sieg mit mindestens 6 Toren im schnellen Spiel schlägt der Abpfiff die nächste Stufe vor, nach einer Niederlage mit mindestens 6 Toren die vorige. Dazu gibt es jeweils einen Knopf REVANCHE AUF …: gleiche Vereine, nur die Stufe ändert sich, die normale REVANCHE bleibt daneben. In der Karriere erscheint der Hinweis nicht, dort ist die Stufe beim Anlegen fest gewählt. Umami zählt die Wahl als `stufe-hoch` bzw. `stufe-runter`.
- **Tests:** 1 neuer Regressionstest, insgesamt 52. Er prüft:
  - Stufen durchgehend schwerer
  - Bot auf Amateur und Legende
  - Abfangen am Werfer gegen 3 m weiter im Passweg
  - CPU gegen CPU unabhängig von den Stufen-Werten
  - beide Hinweise, Revanche und Statistik-Ereignis

  Der Spielerkarten-Test prüft den Saisonwechsel jetzt an einem gesunden Stammspieler statt am ersten Spieler mit Einsätzen, der zufällig verletzt sein konnte.

## v8.30: Auszeichnungen und Meilensteine
- **Neu: Auszeichnungen der Saison.** Am Saisonende werden in deiner Liga der **Spieler der Saison**, der **Torwart der Saison** und das **Talent der Saison** (bis 21 Jahre) gewählt. Wer mindestens 40 % der Spieltage gespielt hat, kommt in Frage. Feldspieler zählen mit Toren, Vorlagen, Ballgewinnen und „Spieler des Spiels“, Torhüter mit der Fangquote, dazu jeweils ein kleiner Bonus nach Tabellenplatz. Die Gewinner stehen in der Saisonbilanz, in der Zeitung und im Tab ERFOLGE. Eigene Spieler sind dort golden markiert und bekommen in der Ehrenhalle den Vermerk „AUSGEZEICHNET“.
- **Neu: 18 Meilensteine** im Tab ERFOLGE, jeweils mit Saison: erster Sieg, Kantersieg, 5 und 10 Ligasiege in Folge, ausverkaufte Halle, selbst erzielte Dreher- und Kempa-Tore, gewonnenes 7-Meter-Werfen, Aufstieg, Final Four, Pokal, Meisterschaft, Europapokal, Double, Spieler der Saison, Hallen-Legende, 10 Saisons als Trainer und 1 Million Euro auf dem Konto. Ein neuer Meilenstein meldet sich in der Zeitung.
- **Ältere Karrieren** bekommen Meilensteine beim ersten Laden aus Titeln, Rekorden, Historie und Ehrenhalle nachgetragen, ohne Zeitungsmeldung.
- **Plattform:** Jeder Meilenstein geht als Ereignis `meilenstein` mit `{ id }` an die Plattform-Schnittstelle (und an Umami), nachgetragene mit `{ id, nachtrag: true }`. So kann die iOS-App sie zum Beispiel als Game-Center-Erfolge melden.
- **Spieler des Spiels** steht jetzt auch in der Spieltagsmeldung der Zeitung. Gezählt wurde er schon vorher, auf der Spielerkarte.
- **Behoben: Zeitung schrieb bei jedem Sieg „ARBEITSSIEG“.** Die Schlagzeile nach dem Spieltag wählte bei 1 bis 7 Toren Vorsprung aus demselben Topf, und die Auswahl war praktisch fest: Der einfache Zufall aus Jahr und Spieltag ergab für benachbarte Spieltage immer dieselbe Zeile (Siege „ARBEITSSIEG“, Remis „REMIS-KRIMI“, Niederlagen „… VERLIERT“). Jetzt gestuft nach Tordifferenz (1 Tor knapp, 2–3 normal, 4–7 deutlich, ab 8 Gala bzw. Debakel) und gestreut über Saison, Spieltag, Gegner und Ergebnis. 1 neuer Regressionstest, insgesamt 51.
- **README-Screenshots aktualisiert:** Titelbildschirm (zeigte noch „© 2026 tobwil · Open Source (MIT)“), Spielszene (aktuelle Namen) und Tab ERFOLGE mit Meilensteinen. `tools/promo/bilder.js` nimmt jetzt auch Titelbildschirm und Spielszene auf und wiederholt das Handy-Bild, falls gerade ein Pfiff läuft. Die übrigen Bilder sind inhaltlich aktuell.
- Spielablauf, Balance und Simulation bleiben unverändert. 1 neuer Regressionstest (Auszeichnungen gegen Liga, Einsätze und Alter geprüft, Zeitung, Saisonbilanz, Meilenstein mit Saison und genau einmal, Plattform-Ereignis, Dreher-Tor im Karriere-Spiel, stiller Nachtrag, Anzeige), insgesamt 50. Zwei Erfolge-Tests zählen nur noch Trophäenschrank und Rekorde.

## v8.29: App Store und Copyright
- **Startseite:** Die Plattform-Leiste zeigt BROWSER, APP STORE (Link zur kostenlosen App für iPhone und iPad) und KONSOLE COMING SOON. Der Schlusstext, der Abschnitt „Auf jedem Gerät“ und zwei FAQ-Antworten nennen die App mit Link. Auch die strukturierten Daten für Suchmaschinen nennen sie (Plattformen iOS und iPadOS, App-Store-Link). Klicks auf den App-Store-Link zählt Umami als `appstore-klick` mit Ort.
- **Copyright:** © 2026 Tobias Wilhelm statt tobwil auf dem Titelbildschirm, im Footer der Startseite, in LICENSE und README. Der GitHub-Name tobwil bleibt in Links.
- README (deutsch und englisch) nennt die App. Der Plattform-Test prüft die neue Copyright-Zeile.

## v8.28: Platzieren lohnt sich
- **Behoben: Würfe ließen sich kaum platzieren.** Der Torwart kam aus der Mitte an beide Pfosten: Er lief mit 7,5 m/s in die Ecke, und seine Reichweite bei der Parade (rund 1,6 m) war größer als die halbe Torbreite (1,5 m). Auf Profi und Legende traf ein Wurf in die Ecke kaum öfter als einer auf den Torwart. Jetzt ist der Torwart beim Abwehren etwas langsamer (6 m/s), und seine Reichweite deckt nicht mehr beide Pfosten. Eine gut platzierte Ecke erreicht er sichtbar nicht mehr. Die volle Ecke ist dafür riskanter, sie geht öfter knapp daneben.
- **Zielen mit Pfeilen und Stick:**
  - Hoch/runter wählt die Ecke, schräge Pfeiltasten (→ + ↑) jetzt ganz statt nur zu 71 %. Am Handy- und Gamepad-Stick reichen 30 % Auslenkung für die volle Ecke, ein leichter Druck gibt ein Stück in diese Richtung.
  - Ohne hoch/runter, etwa wenn man nur Richtung Tor läuft, geht der Wurf ein Stück in die Ecke weg vom Torwart statt genau auf ihn.
  - Das Zielkreuz zeigt immer genau, wohin der Wurf geht. Gilt auch beim 7-Meter.
- **Touch:** Beim Aufladen erinnert „TOR ANTIPPEN = ECKE“ daran, dass Antippen des Tors genau in diese Ecke wirft, auch während WURF gehalten wird.
- **Wirkung (Profi, aufgeladener Wurf aus dem Rückraum):** nur Richtung Tor 44 % (vorher 37 %), schräg in eine Ecke 50–52 % (vorher 43–48 %), auf Legende 41 % gegen 51 %. Gegenüber einem Wurf genau auf den Torwart (39–43 %) bringt die volle Ecke im Schnitt rund 15 Prozentpunkte, von der Seite vor allem die kurze Ecke. Die lange Ecke von der Seite geht öfter daneben.
- **Balance:** Die CPU zielt etwas weniger extrem in die Ecken. CPU gegen CPU bleiben es etwa 15 Tore pro Spiel (15,2, vorher 15,6), der Dreher-Abstand bleibt (Dreher-Künstler 74 %, andere 48 %). 7-Meter: CPU 61 % (vorher 55 %), in die Ecke 70 %, auf den Torwart 38 %. Simulierte Karriere-Spiele ändern sich nicht.
- 1 neuer Regressionstest (Pfeile, schräge Pfeile, Touch-Stick, Zielkreuz gleich Wurf, Ecke mindestens 10 Prozentpunkte besser als Mitte), insgesamt 49. Der Pass-Test wertet Pässe, die an Pfosten oder Torlinie abprallen, nicht mehr als Kurve.

## v8.27: Der Dreher
- **Neu: Dreher vom Flügel.** Wurf aufladen und dabei Pass drücken: Tastatur Leertaste halten + S, Gamepad X halten + A, Touch WURF halten + PASS tippen. Der Ball fliegt erst auf den Torwart zu, springt knapp vor ihm auf und dreht dann zur Seite weg. Der Torwart muss den Ball nach dem Aufsprung neu lesen, und den Drall bekommt er schwer zu fassen.
- **Nur aus spitzem Winkel:** Auf dem Flügel geht der Dreher, aber nicht aus der Ecke an der Torauslinie. Dort passt er nicht ins Tor. Beim Aufladen zeigt der Hinweis über dem Spieler „S=DREHER“ (bzw. A bzw. PASS) nur, wo er möglich ist. An allen anderen Stellen tut Pass beim Aufladen nichts, wie bisher.
- **Die Eigenschaft „Dreher-Künstler“ wirkt jetzt.** Bisher hatte sie keine Wirkung. Dreher-Künstler werfen den Dreher genauer und mit mehr Drall. Aus denselben Flügelpositionen treffen sie in CPU-Spielen mit dem Dreher 69 % (normaler Wurf 51 %). Andere Spieler treffen mit dem Dreher 45 % (normaler Wurf 48 %), für sie ist er also eher eine Stilfrage. Die CPU wirft ihn auch: Dreher-Künstler bei 40 % ihrer Würfe aus diesen Positionen, andere bei 8 %.
- Torjubel „DREHER!“, eigener Kommentar und „DREHER“ in der Wiederholung, rosa Funken beim Aufsprung, Ballspur im Flug
- **Balance:** Im Mittel 15,6 Tore pro CPU-Spiel (vorher 15,1, die Streuung zwischen Läufen liegt bei etwa ±0,5). Simulierte Spiele in der Karriere ändern sich nicht.
- Steuerungshilfe, README und Startseite erklären den Dreher. 1 neuer Regressionstest (Tastatur-Eingabe auf dem Flügel, Aufsprung zwischen Werfer und Torwart, kein Dreher aus dem Rückraum oder aus der Ecke, Dreher-Künstler treffen klar öfter, Torjubel und Wiederholung), insgesamt 48

## v8.26: Mehr Namen, keine fremden Sonderzeichen
- **Gut 400 Nachnamen statt 105.** Vorher trug jeder Name im Schnitt fast 7 der rund 730 Spieler, und 12 von 17 Ligagegnern von Kiel hatten einen Spieler mit gleichem Namen wie Kiel. Jetzt teilen sich im Schnitt 2 Spieler einen Namen, und nur noch 1 Gegner hat einen Namensvetter. Dazu kommen deutsche Namen und Namen aus Österreich, Skandinavien, Island, vom Balkan, aus Polen, Tschechien, Ungarn, den Niederlanden, Belgien, Frankreich, Spanien, Portugal und Italien. Drei sehr markante Namen echter Handballer sind nicht mehr dabei.
- **Keine fremden Sonderzeichen mehr:** nur noch A–Z und deutsche Umlaute (Gislason statt Gíslason, Dvorak statt Dvořák).
- **Laufende Karrieren** werden beim ersten Laden einmalig umgeschrieben, überall im Spielstand (Kader, Zeitung, Torjäger, Rekorde, Ehrenhalle, Historie, auch ein unterbrochenes Spiel). Die Spieler bleiben dieselben, ihre Namen behalten sie bis auf die Schreibweise. Neue Spieler (Nachwuchs, Vereinslose) bekommen Namen aus der neuen Liste.
- **Schnelles Spiel und neue Karrieren:** Die Spieler der festen Kader heißen anders, Werte, Rückennummern und Aussehen bleiben aber genau wie bisher. Die alte Liste bestimmt dafür weiter die Zufallsfolge. Mit festem Zufall verläuft eine neue Karriere wie in v8.25, nur mit anderen Namen. Die Hallen-Legenden bleiben, und ihre Nachrüstung in alten Karrieren findet den Stammspieler auch unter dem alten Namen.
- README-Screenshots neu (gleiche Szenen, neue Namen). 1 neuer Regressionstest (Namensliste, Prüfsumme der festen Kader wie in v8.25, Doppelungen, Umschreiben alter Spielstände), insgesamt 47. Der Update-Test im Tiefentest berücksichtigt die umgeschriebenen Namen.

## v8.25: Kamera erreicht den Anschlag immer
- **Behoben (#51): In der Abwehr verdeckten die Knöpfe weiter das Tor.** Die Kamera fährt 3 m voraus in Angriffsrichtung des Ballbesitzers. Baute eine Mannschaft vor dem eigenen Tor auf, etwa nach einer Parade oder einem Fehlwurf, zeigte der Vorlauf vom Tor weg. Die Kamera blieb bis zu 3 m vor dem Anschlag stehen, auf dem iPhone SE lag KLAU schon mit normalen Knöpfen über dem Tor. Auf Touch-Geräten zeigt der Vorlauf jetzt nahe einem Tor immer zu diesem Tor, mit fließendem Übergang zwischen 4 und 10 m von der Mitte. Am Desktop bleibt die Kamera wie bisher.
- **Behoben (#52): Falscher Anschlag nach dem Drehen beim Anpfiff.** Die iOS-App dreht beim Anpfiff ins Querformat. In diesen Bildern lagen die Knöpfe noch nicht an ihrem Platz, und der dort gemessene Anschlag blieb bis zum Neustart gemerkt. Jetzt wird er bei jedem Drehen bzw. jeder Größenänderung verworfen und spätestens nach einer Sekunde neu gemessen.
- Der Kamera-Test prüft jetzt jede Ballposition 1 und 6 m vor beiden Toren mit Ballbesitz bei beiden Mannschaften, dazu einen beim Umbau gemessenen Anschlag, der nach dem Drehen bzw. nach einer Sekunde verschwunden sein muss

## v8.24: Touch-Tipp mit Gamepad und Tastatur
- **Behoben (#49): Der Touch-Tipp „Einfach antippen“ ließ sich mit dem Gamepad nicht schließen.** Auf Touch-Geräten mit Controller (Steam Deck, Tablet) hielt er beim Anwurf das Spiel an. A und B taten nichts, Start ließ das Spiel weiterlaufen, der Tipp blieb aber stehen. Weg ging er nur durch Antippen. Jetzt gilt:
  - Wer zuletzt mit Gamepad oder Tastatur bedient hat oder ein Gamepad angeschlossen hat, bekommt den Tipp gar nicht. Er erklärt nur Touch-Bedienung. Der Zähler läuft dann nicht hoch, der Tipp kommt später bei echter Touch-Bedienung.
  - Ist er offen, schließen ihn A, B, Start, Enter, Leertaste und Esc wie VERSTANDEN. Der Druck, der ihn schließt, löst im Spiel nichts aus, also keinen Anwurf-Pass.
- 1 neuer Regressionstest (Touch-Modus mit Gamepad bzw. Tastatur ohne Tipp; Schließen mit A, B, Start, Enter und Esc ohne Pause und ohne Pass), insgesamt 46

## v8.23: iPad, Plattform-Texte, Datenschutz für die iOS-App
- **Neu (#47): Menüs auf Tablets über den ganzen Bildschirm.** Auf dem iPad steckten die Menüs im 16:9-Bereich der Spielfläche: hochkant nutzten sie nur 28 bis 35 % des Bildschirms, darüber und darunter blieb alles leer, und die Schrift war klein. Auf Touch-Geräten, die größer als ein Handy sind, liegen die Menüs jetzt wie am Handy über dem ganzen Bildschirm (83 bis 95 %), und der Inhalt wächst mit dem Bildschirm, bis zum 1,5-Fachen (iPad Pro 13 quer). Die Grenze ist so gesetzt, dass nirgends seitlich gescrollt werden muss. Die ZURÜCK-Leiste deckt den Sicherheitsbereich oben ab. Desktop und Handy bleiben unverändert.
- **Behoben (#46): Texte „im Browser“ in App und Desktop-Version.** Optionen („Sprachausgabe deines Geräts“) und Editor („Gespeichert wird nur auf diesem Gerät“) sagen außerhalb des Browsers „Gerät“, der Teilen-Text lässt „im Browser“ weg. Neu in der Plattform-Schnittstelle: `shareUrl` für eine eigene Adresse im Teilen-Text, zum Beispiel einen App-Store-Link. Im Browser bleibt alles wortgleich.
- **Neu (#45): Datenschutzerklärung mit Abschnitt für die iOS-App** (`datenschutz.html#ios`): keine Datenerfassung durch uns, Spielstände auf dem Gerät, Game Center, App Store, Teilen, Links nach außen. Die Kurzfassung oben verweist darauf.
- 2 neue Regressionstests (Plattform-Texte im Browser, in der iOS- und der Desktop-Version samt Datenschutz-Anker; Tablets hochkant und quer mit Flächenanteil, Vergrößerung, ohne Querscrollen, Desktop und Handy unverändert), insgesamt 45

## v8.22: Tor auch in der Abwehr frei
- **Geändert (#41):** Der Kamera-Anschlag aus v8.20 gilt jetzt für beide Tore, im Angriff wie in der Abwehr. Bisher fuhr die Kamera nur beim eigenen Angriff weiter, vor dem eigenen Tor verdeckten Knöpfe bzw. Stick weiter Torwart und Torraum. Am Spielfeldende liegt das Tor jetzt immer neben Knöpfen und Stick. Am Desktop und mit Gamepad (Touch-Knöpfe aus) bleibt die Kamera wie bisher.
- Regressionstest prüft beide Tore im Angriff und in der Abwehr auf fünf Handy-Größen in allen Knopfgrößen

## v8.21: Landingpage: Titel mit Abstand zur Kopfzeile
- **Behoben:** Auf Handys und in schmalen Fenstern klebte der Titel „HALLEN-LEGENDEN“ fast an der Kopfzeile (6 px, quer 2 px). Die Regel für die Story-Karten (10 px unter der Kopfzeile) galt aus Versehen auch für den Titelblock und überschrieb dessen eigenen Abstand. Jetzt hat er auf dem Handy 26 bis 34 px Luft, so viel wie am Desktop, quer 10 px. Nach unten bleibt genug Platz bis zum Spielfeld.

## v8.20: Gefunden vom Rundgang der iOS-App
- **Behoben (#41): Touch-Knöpfe verdeckten beim Angriff das Tor.** Auf Handys im Querformat lagen PASS, WURF und FINTE über dem rechten Tor, nach dem Seitenwechsel der Stick über dem linken. Betroffen waren iPhone SE und iPhone 17 Pro (Safari und App) sowie Android-Handys mit 16:9. Der Kamera-Anschlag hing nur von der Bildbreite ab. Jetzt misst das Spiel, wo Knöpfe und Stick auf Torhöhe wirklich liegen, und lässt die Kamera beim eigenen Angriff gerade so weit fahren, dass das angegriffene Tor samt Netz daneben frei bleibt. Das berücksichtigt Notch und Sicherheitsabstände und alle drei Knopfgrößen. In der Abwehr bleibt die Kamera wie bisher.
- **Behoben (#38, #40): Leisten im iOS-Sicherheitsbereich.** Reicht die Seite bis unter die Dynamic Island (iOS-App, Vollbild), lag der ZURÜCK-Knopf darunter, und zwischen ZURÜCK-Leiste und Karriere-Kopfzeile scrollte der Inhalt durch eine Lücke von bis zu 60 pt. Die Leiste reicht jetzt bis an den Rand und deckt den Bereich ab, Knopf und Titel liegen darunter, die Kopfzeile schließt ohne Lücke an. Im normalen Browser-Tab war das nicht zu sehen (dort ist der Sicherheitsabstand 0), dort ist nur eine Überlappung von 2 px zwischen den Leisten weg.
- **Neu (#39): Hinweis auf weitere Reiter.** Auf dem Handy passen die zehn Karriere-Reiter nicht in eine Zeile, die Leiste scrollt seitlich. Ein goldener Pfeil mit Verlauf zeigt jetzt an, auf welcher Seite noch Reiter liegen, und verschwindet am Ende.
- 2 neue Regressionstests mit nachgestellten iOS-Sicherheitsabständen (Leisten und Reiter-Hinweis auf iPhone 17 Pro und SE; Tor beim Angriff frei auf fünf Handy-Größen in allen Knopfgrößen, Abwehr unverändert), insgesamt 43

## v8.19: Scouting-Karte für Transfers
- **Scouting-Karte:** Jeder Name auf der Transferliste öffnet dieselbe Karte wie im Kader, zugeschnitten auf die Kaufentscheidung. Sie zeigt Sterne für Stärke und Potenzial, Zustand und Form, den Vertrag beim jetzigen Verein (oder „vereinslos, sofort zu haben“), Marktwert, Ablöse und das Gehalt, das der Spieler bei dir bekäme. Der Vergleich mit deinem besten Spieler auf der Position endet mit einem Urteil („Wäre dein bester Linksaußen.“, „Talent: kann … überholen.“, „Ergänzung für die Bank.“). Die Werte stehen mit Abstand zu deinem Stammspieler da (+10 grün, −5 rot), STATISTIK zeigt seine Zahlen aus Liga, Pokal und Europapokal. Der Porträtspieler trägt das Trikot seines Vereins, Vereinslose tragen Grau. KAUFEN direkt von der Karte; geht der Kauf nicht, steht der Grund da (Budget, voller Kader, Transfersperre).
- **Angebote auf der Spielerkarte:** Bietet ein Verein für einen deiner Spieler, führt der Name unter Transfers zu seiner Karte. Dort stehen das Angebot sowie ANNEHMEN und ABLEHNEN. So siehst du, wen du gerade abgeben würdest.
- **Behoben: Tor für den Falschen nach einem Wechsel.** Wurde ein Spieler ausgewechselt, während sein Wurf oder Pass noch unterwegs war, bekam der Eingewechselte das Tor oder die Vorlage (das gab es schon länger; seit v8.18 fiel es als „Tor ohne Wurf“ in der Statistik auf). Werfer und Passgeber bleiben jetzt auf dem Feld, bis der Ball angekommen ist. Betroffene Spielstände werden beim Laden repariert.
- **Behoben: Kopfzeile über dem Inhalt** in schmalen Fenstern ohne Touch. Sie ließ Platz für die ZURÜCK-Leiste, die es nur bei Touch gibt, und lag dadurch über dem Kopf der Spielerkarte.
- 2 neue Regressionstests (Scouting-Karte mit Kauf, vereinslosem Spieler, Angebot und schmalem Fenster; Wechsel während Wurf und Pass, Reparatur alter Spielstände), insgesamt 41. Der Test „Vor dem Spiel“ läuft jetzt mit festem Zufall, vorher war das letzte Duell je nach Timing gelegentlich ein Pokalspiel. Screenshot der Scouting-Karte im README

## v8.18: Spielerkarte und Handball-Statistik
- **Neue Spielerkarte im Karriere-Kader** (Idee aus Retro Bowl, auf Handball zugeschnitten): Porträt, ausgeschriebene Position, Sterne für Stärke und Potenzial, Zustand (frisch bis erschöpft), Form, Vertrag, Marktwert und Aufgaben (Startsieben, Kapitän, 7-Meter-Schütze). Rechts die Werte mit kurzer Erklärung oder per STATISTIK die Zahlen. Knopfleiste: AUFSTELLEN / AUF DIE BANK, STATISTIK, 7-METER-SCHÜTZE, KAPITÄN, SOFORTVERKAUF.
- **Handball-Statistik je Spieler**, für die Saison und die ganze Karriere (Liga, Pokal und Europapokal zusammen): Spiele, Spielminuten, Tore und Würfe mit Wurfquote, Tore pro Spiel, 7-Meter, Tempogegenstoß-Tore, Torvorlagen, Ballgewinne, Zeitstrafen, Spieler des Spiels. Torhüter: Paraden, Gegentore, Fangquote, gehaltene 7-Meter.
  - Selbst gespielte Spiele zählen genau mit (Würfe, 7-Meter, Tempogegenstöße nach Ballgewinn, Vorlage durch den letzten Pass, Zeitstrafen, Gegentore des Torhüters).
  - Simulierte Spiele erzeugen dieselben Zahlen passend zu Position und Werten (ligaweit etwa 60 % Wurfquote, drei von vier 7-Metern verwandelt, Vorlage bei jedem zweiten Tor). Dafür gibt es einen eigenen Zufall: Ergebnisse und Tabelle bleiben dieselben wie ohne Statistik.
- **7-Meter-Schütze wählbar:** Er wirft die 7-Meter in selbst gespielten und simulierten Spielen (in der Simulation bekommt er die verwandelten 7-Meter-Tore). Ohne Wahl wirft wie bisher der beste Werfer auf dem Feld.
- **Kapitän** wählbar, mit Abzeichen „C“ in Kader und Spielerkarte (die Wirkung auf die Stimmung kommt mit der nächsten Stufe).
- **AUF DIE BANK:** Der beste gesunde Ersatz auf derselben Position rückt in die Startsieben.
- Laufende Karrieren: Die Statistik zählt ab dem Update, die Karte zeigt, ab wann.
- Verlässt der Kapitän den Verein (Verkauf, Vertragsende, Karriereende), wird die Binde frei, und die Zeitung erinnert daran. Geht der 7-Meter-Schütze, wirft wieder der beste Werfer auf dem Feld.
- Mit Gamepad und Tastatur bleibt der Fokus auf dem gedrückten Kartenknopf (STATISTIK, 7-METER, KAPITÄN, BANK), statt nach oben zu den Reitern zu springen. Die Form steht mit Wort da („normal“, „in Topform“ …).
- README mit Screenshot der Spielerkarte. 1 neuer Regressionstest (simulierte und gespielte Partie stimmig, ligaweite Quoten plausibel, 7-Meter-Schütze wirkt, Karte, Bank, Saisonwechsel, Fokus, Verkauf), insgesamt 39; der Dauerlauf prüft die Statistik jedes Spielers nach jedem Spieltag

## v8.17: Editor sicher verlassen, jedes Menüfeld mit dem Gamepad erreichbar
- **Behoben (#32): ESC, Rücktaste und B im Editor setzten den Verein zurück.** Statt ZURÜCK wurde ZURÜCKSETZEN ausgelöst, alle gespeicherten Änderungen am gerade gewählten Verein waren ohne Nachfrage weg. Das gab es seit der ersten Version. Jetzt verlassen ESC, Rücktaste und B den Editor. ZURÜCKSETZEN fragt beim ersten Druck nach („WIRKLICH ZURÜCKSETZEN?“).
- **Behoben (#33): Trikotfarben per Gamepad erreichbar.** Die Menüsteuerung misst jetzt von Rand zu Rand statt von Mitte zu Mitte: Ein schmales Feld direkt unter einem breiten liegt „darunter“, und „rechts“ ist nur, was wirklich rechts beginnt (vorher führte rechts vom Vereinsnamen auf die Vereinsliste darüber, wo rechts dann den Verein wechselte). Trikotfarben werden wie in Konsolen-Menüs mit A bearbeitet: links/rechts wechseln das Feld, nach A ändern sie die Farbe (gelber Rahmen), A oder B beenden. Mit der Tastatur wechseln die Pfeile auf Farbfeldern ebenfalls das Feld, Enter öffnet den Farbwähler.
- 2 neue Regressionstests: Breitensuche nur mit dem Steuerkreuz über alle Menüs in drei Auflösungen (jedes Element erreichbar, im Editor zusätzlich natürliche Wege: rechts vom Namen das Kürzel, Farbreihe der Reihe nach), Editor mit ESC, Rücktaste und Gamepad-B. Insgesamt 38

## v8.16: Komplett mit dem Gamepad (Steam Deck)
- **Regler, Vereinsliste und Trikotfarben per Gamepad:** Links/rechts ändern den Wert statt zum nächsten Feld zu springen. Lautstärke in 5er-Schritten, Vereine einzeln, gehalten wiederholt es sich. A auf einer Auswahlliste oder Farbe schaltet weiter. Gefunden beim Steam-Deck-Test (#30).
- **Trikotfarben ohne System-Farbwähler:** Gamepad und Pfeiltasten schalten durch 22 Trikotfarben (alle Vereinsfarben des Spiels und ein paar weitere). Mit Maus oder Touch bleibt der freie Farbwähler. Die Trikot-Vorschau im Editor zeigt jede Änderung sofort.
- **Hinweise passend zur Eingabe:** Wer zuletzt das Gamepad benutzt hat, sieht „STEUERKREUZ wählen · A bestätigen · B zurück“ im Menü und im Spiel „A = WEITER“, „B=HEBER“ und die Gamepad-Belegung in der Laufschrift beim Anwurf. Mit Tastatur oder Touch bleibt alles wie bisher.
- Mit Gamepad gespielt blendet das Spiel die Touch-Knöpfe aus (Geräte mit Touchscreen wie das Steam Deck).
- Ein im Spiel gehaltener Knopf löst im gerade geöffneten Menü nichts mehr aus (zum Beispiel A beim Abpfiff).
- Mit der Tastatur schalten Pfeil links/rechts auf der Vereinsliste und den Trikotfarben im Editor ebenfalls weiter.
- 1 neuer Regressionstest mit simuliertem Gamepad (und Pfeiltasten auf Liste und Farbe), insgesamt 36
- **Neuer tiefer Test „Update von der Vorversion“:** Spielstände aus der bisherigen Version (aus git oder `ALT=…`) werden in der neuen weitergespielt: laufendes Spiel, inzwischen simuliertes Pokalspiel, Karriere mit Rekorden und Titeln, Einstellungen. Ersetzt die Prüfskripte, die bisher bei jedem Preview-Test nebenher liefen. Tiefe Suite jetzt 9 Tests

## v8.15: Datenschutzerklärung vollständig
- Die Liste der anonym gezählten Ereignisse nennt jetzt alle: zusätzlich Klicks auf „Feature wünschen“, simulierte Spiele, gewonnene Titel (nur die Art, neu seit v8.14) und geteilte Bilder.

## v8.14: Plattform-Schnittstelle
- **Vorbereitung für eine Desktop-Version:** Eine Hülle kann vor dem Spiel `window.HL_PLATFORM` setzen und damit den Speicher ersetzen (zum Beispiel Dateien statt `localStorage`), Ereignisse aus dem Spiel empfangen (Spielende, Titel), einen Knopf BEENDEN ins Hauptmenü bringen und die Copyright-Zeile ändern. Im Browser ändert sich nichts.
- Gewonnene Titel (Meister, Pokal, Europapokal, Meister 2. Liga, Aufstieg) sind jetzt ein eigenes Ereignis `titel`.
- 1 neuer Regressionstest (Plattform-Schnittstelle mit eigenem Speicher), insgesamt 35

## v8.13: Tiefe Tests und drei Fehler weniger
- **Neue tiefe Testsuite** (`cd tests && npm run tief`, etwa zweieinhalb Minuten): Dauerlauf über 18 Saisons mit Prüfung des ganzen Spielstands nach jedem Spieltag, Speichern und Laden (Karriere und laufendes Spiel), Zufallsklicks durch alle Menüs und Spiele, eine Saison wirklich gespielt, 11 Bildschirmgrößen, beschädigte Spielstände, Tempo pro Bild.
- **Behoben: Ergebnis zählte doppelt.** Wer ein Pokal- oder Europapokalspiel mittendrin speicherte, es dann in der Karriere simulierte und später den alten Spielstand lud, bekam das Ergebnis ein zweites Mal angerechnet. Ein gespeichertes Karriere-Spiel zählt jetzt nur, wenn genau diese Partie noch ansteht, sonst läuft es als Freundschaftsspiel.
- **Behoben: beschädigte Spielstände** (zum Beispiel nach einem abgebrochenen Speichern) ließen das Hauptmenü oder die Karriere abstürzen. Eine beschädigte Karriere wird jetzt beiseitegelegt (bleibt unter `hl3_karriere_defekt` erhalten), ein unvollständig gespeichertes Spiel wird verworfen.
- **Behoben: sehr kleine Handys** (320 px breit): Die Kader-Tabelle in der Statistik ragte über den Rand.
- Spieler des Spiels wird auch in einem Sonderfall ohne Einsatzminuten gefunden.
- Gemessen: ein Bild braucht inklusive Zeichnen etwa 3 bis 4 ms (Budget 16,7 ms bei 60 Bildern pro Sekunde), Spielstand nach 6 Saisons rund 230 KB.

## v8.12: Neue Lizenz, nicht kommerziell
- **Lizenz:** Ab dieser Version steht das Spiel unter der **PolyForm Noncommercial License 1.0.0** statt unter MIT. Der Quellcode bleibt offen: Spielen, Lesen, Verändern und kostenloses Weitergeben sind erlaubt, kommerzielle Nutzung (zum Beispiel Verkauf, App-Store, Werbung) braucht eine eigene Lizenz von tobwil.
- Versionen bis einschließlich v8.11 bleiben MIT-lizenziert. Das steht in `LICENSE` und in der README.
- Angepasst: `LICENSE`, README (deutsch und englisch, Badge), Hinweis auf dem Titelbildschirm, Impressum, Fußzeile und strukturierte Daten der Landingpage, Pressekit

## v8.11: Name und Logo geschützt
- README (deutsch und englisch): Die MIT-Lizenz gilt für den Code. Der Name „Hallen-Legenden“, verwechselbare Abwandlungen (zum Beispiel „Hallenlegenden“, „Legenden der Halle“, „Hall Legends“), das Logo und die Domain sind ausgenommen. Veränderte Versionen brauchen einen eigenen Namen und dürfen nicht wie das offizielle Spiel auftreten. Ein Hinweis „Basiert auf Hallen-Legenden von tobwil“ bleibt erwünscht, Forks zum Mitentwickeln dürfen den Repository-Namen behalten.

## v8.10: Hebbe heißt jetzt Schülein
- Die Hallen-Legende in Coburg heißt jetzt **Schülein** (Aussehen und Werte bleiben: Star-Spielmacher, lange braunrötliche Haare).
- Laufende Karrieren werden beim Laden umgestellt: Kader, Torjägerliste, Ehrenhalle, Rekorde, Zeitung und Historie zeigen überall den neuen Namen.
- Der Legenden-Test prüft zusätzlich die Umbenennung in einem alten Spielstand.

## v8.9: CPU-Vereine schonen müde Stars
- **CPU-Vereine rotieren jetzt.** Bisher stellte die CPU immer den stärksten Spieler auf, auch wenn er völlig erschöpft war. Ein Star mit Fitness 20 war immer noch „besser“ als ein frischer Ersatz, also spielte er durch. Im Schnitt hatte der beste Feldspieler jedes CPU-Vereins zur Saisonmitte nur 28 % Fitness, fast ein Drittel der aufgestellten CPU-Spieler lag bei 20 bis 30 %.
- Jetzt wird ein Spieler unter 60 % Fitness zunehmend geschont, der frische Ersatz kommt rein. Die aufgestellten CPU-Spieler haben zur Saisonmitte im Schnitt rund 72 % Fitness, nur noch etwa 4 % liegen bei 20 bis 30 %.
- Spürbar vor allem in selbst gespielten Karriere-Spielen: Die Fitness bestimmt die Kraft zu Spielbeginn. Die Stars des Gegners starten nicht mehr fast leer.
- Die Spielstärke bleibt im Saisonmittel fast gleich (gemessen über 14 Saisons mit Kiel, Melsungen und Wetzlar, mit und ohne Co-Trainer: im Schnitt etwa einen halben Tabellenplatz schwerer). Eine zusätzliche Erholung für CPU-Vereine wurde verworfen, sie hätte die CPU um zwei bis drei Plätze stärker gemacht.
- 1 neuer Regressionstest (Fitness der CPU-Aufstellungen nach 12 Spieltagen), insgesamt 34

## v8.8: Vor dem Spiel
- **Stärkevergleich vor jedem Spiel** (Idee aus Retro Bowl): Der Bildschirm „Vor dem Spiel“ zeigt beide Teams nebeneinander:
  - Starspieler als großer Pixel-Spieler im gewählten Trikot (wechselt beim Trikotwechsel mit)
  - Sterne von 1 bis 5 für Angriff, Abwehr und Tor, gemessen an den Vereinen der beteiligten Ligen. In der Karriere zählen Aufstellung, Form und Fitness mit
  - Topwerfer: in der Karriere der beste Torschütze der Saison, sonst der stärkste Werfer
  - Nur Karriere: Tabellenplatz mit Bilanz (Siege-Unentschieden-Niederlagen), Form der letzten fünf Spiele aus Liga, Pokal und Europapokal (grün, grau, rot), Ergebnis des Hinspiels oder des letzten Duells der Saison
- **SIMULIEREN direkt in der Vorschau:** Wer den Gegner gesehen hat, kann das Spiel von dort aus simulieren lassen.
- Am Handy im Hochformat steht das Hinspiel zwischen den beiden Teamkarten.
- **Namen mit Ć, Š, Ž, Ł und Co.** (zum Beispiel Petrović, Kovač) erscheinen jetzt auch im Spielfeld, in den Aufstellungen und auf dem Teilen-Bild richtig. Die Pixelschrift lud ihren erweiterten Zeichensatz bisher nicht, stattdessen erschienen falsche Zeichen wie „PETROVI(“.
- **README-Screenshots:** neu sind Vor dem Spiel, Erfolge, Kader mit Potenzial, Teilen-Bild und Handy im Querformat. Teamauswahl, Zeitung, Statistik, Pokal und Europapokal sind neu aufgenommen (vorher fehlten die Tabs EUROPA und ERFOLGE). Die Landingpage nutzt dieselben Bilder. `sh tools/promo/promo.sh bilder` nimmt alle jederzeit neu auf, mit festem Zufall (die Menübilder sind bei jedem Lauf pixelgleich).
- 1 neuer Regressionstest (Sterne, Form, Bilanz, Topwerfer, Hinspiel, SIMULIEREN aus der Vorschau, Freundschaftsspiel ohne Form), insgesamt 33. Der Ladetest prüft jetzt auch, dass beide Zeichensätze der Pixelschrift geladen sind

## v8.7: Erfolge und Teilen
- **Neuer Tab ERFOLGE im Karriere-Modus:**
  - Trophäenschrank: Deutscher Meister, Pokal, Europapokal, Meister 2. Liga, Aufstieg, jeweils mit Anzahl und Saisons. Noch nicht gewonnene Titel stehen grau im Regal.
  - Rekorde deiner Karriere: höchster Sieg, höchste Niederlage, torreichstes Spiel, längste Siegesserie, meiste Tore eines Spielers in einem Spiel, Torjäger einer Saison, beste Saison, Zuschauerrekord. Erfasst nach jedem eigenen Spiel in Liga, Pokal und Europapokal.
  - Ehrenhalle: die Spieler deiner Vereine mit Saisons, Einsätzen, Toren und Titeln. Ab 5 Saisons, 150 Toren oder 3 Titeln gibt es den Titel LEGENDE.
  - Laufende Karrieren bekommen ihre Titel aus der Historie nachgetragen, Rekorde zählen ab dieser Version.
- **Als Bild teilen:** Im Saisonabschluss „SAISON ALS BILD TEILEN“, im Tab ERFOLGE „KARRIERE ALS BILD TEILEN“.
  - Die Pixel-Karte (1080 × 1350) zeigt Wappen, Ergebnis (zum Beispiel DOUBLE!), Punkte, Bilanz, Pokal, Europapokal, Torjäger, Zuschauer und hallenlegenden.de.
  - Am Handy öffnet sich das Teilen-Menü (WhatsApp und Co.) mit Bild und Text, sonst eine Vorschau zum Speichern und Text kopieren.
- Der Saisonabschluss zeigt gewonnene Titel als Pokale.
- **Entlassung:** Die Jobangebote stehen jetzt direkt unter der Vorstandsmeldung in einem auffälligen Kasten („ENTLASSEN · DEINE JOBANGEBOTE“). Vorher standen sie ganz unten im langen Saisonabschluss, ohne Weiter-Knopf war nicht klar, wie es weitergeht.
- Der Entlassungs-Test klickt jetzt alles über die Oberfläche: Saisonabschluss, Jobangebot (muss ohne Scrollen sichtbar sein), Neuladen, mit dem neuen Verein selbst spielen bis Abpfiff, Saison zu Ende, Historie.
- Die Historie merkt sich den Verein jeder Saison (wichtig nach einem Trainerwechsel).
- 2 neue Regressionstests (Rekorde nachgerechnet aus allen eigenen Spielen, Titel, Ehrenhalle, Teilen-Karte; Nachtragen aus alter Historie), insgesamt 32

## v8.6: Dezente Touch-Steuerung, zwei neue Hallen-Legenden
- **Touch-Knöpfe durchscheinend:** Im Ruhezustand sieht man durch PASS, WURF und FINTE aufs Spielfeld. Beim Drücken leuchten sie voll auf.
- **Stick:** Der Ring ist nur noch ganz dezent zu sehen (Hinweis, wo der Daumen hingehört). Bei Berührung erscheint er voll unter dem Daumen.
- **Knopfgröße** klein, normal oder groß unter Optionen (nur auf Touch-Geräten), wird gespeichert.
- **Tipp „Einfach antippen“** in den ersten beiden Spielen auf dem Handy: Mitspieler antippen = Pass, Tor antippen = Wurf in diese Ecke, in der Abwehr Spieler antippen = wechseln. Das Spiel wartet, bis man VERSTANDEN tippt. Beim Anwurf zeigt die Laufschrift auf dem Handy dieselben Hinweise statt der Tastenbelegung.
- **Hinweise im Spiel:** „TIPPEN = WEITER“ statt „TASTE = …“ und „FINTE=HEBER“ statt „D=HEBER“ auf Touch-Geräten. Der Touch-Abschnitt der Steuerungshilfe ist korrigiert (es gibt keinen SPRINT-Knopf mehr, Kempa geht per langem Druck auf PASS).
- **Zwei neue Spieler:**
  - Richardson (Berlin): Kreisläufer und „Supertalent“, schwarze Haare, muskulös. In der Karriere 19 Jahre alt, mit sehr hohem Potenzial.
  - Schörner (Erlangen): Kreisläufer und „Kreis-Turm“, sehr groß, braune Haare.
  - Beide haben die Werte des Spielers, den sie ersetzen. Laufende Karrieren bekommen sie beim Laden nachgerüstet.
- Neue Figurenmerkmale: muskulös (breitere Schultern, kräftigere Arme und Nacken) und sehr groß (zweite Größenstufe)
- 1 neuer Regressionstest (Knopfgröße), Handy- und Legenden-Test erweitert, insgesamt 30

## v8.5: Potenzial und volles Bild auf breiten Handys
- **Potenzial im Karriere-Modus:**
  - Kader und Transferliste zeigen für alle Spieler die Spalte POT: cyan mit ↗ = wächst noch, ↘ = baut altersbedingt ab.
  - Das Spielerprofil nennt Potenzial und Entwicklung, bei jungen Spielern auch, wie viel noch geht.
  - Regeln wie in der Entwicklung: Bis 29 wächst ein Spieler bis zu seinem Potenzial, ab 30 ist der aktuelle Wert der Höchstwert.
- **Breite Bildschirme:** Das Spielfeld passt seine Breite an das Seitenverhältnis an (640 bis 800 Pixel bei gleicher Höhe). Auf heutigen Handys im Querformat (etwa 19,5:9) füllt das Spiel jetzt den ganzen Bildschirm statt etwa 72 %, ohne Verzerrung und ohne abgeschnittene Teile. Auch breite Browserfenster am Computer zeigen mehr Halle.
  - Auf Touch-Geräten fährt die Kamera am Spielfeldende so weit hinaus, dass das Tor vor den Wurf- und Pass-Knöpfen bzw. neben dem Stick liegt.
  - Mini-Karte und HUD oben rechts weichen dem Pause-Knopf aus, die Aufstellungskarten im Intro stehen mittig.
  - Auf dem Handy reicht das Spielfeld ohne Rahmen bis an den Rand, Notch und Home-Leiste bleiben frei.
  - Desktop mit 16:10 oder 16:9 und Hochformat bleiben wie bisher.
- Weidenhammer und Hebbe starten neue Karrieren mit 27 Jahren, in ihren besten Jahren.
- 2 neue Regressionstests (Potenzial, breites Spielfeld inklusive Drehen des Handys), insgesamt 29

## v8.4: Hallen-Legenden aus dem echten Leben, Landingpage
- **Zwei neue Spieler mit festem Aussehen:** Weidenhammer (Kiel, Star-Linksaußen, kurze braune Haare, Vollbart) und Hebbe (Coburg, Star-Spielmacher, lange braunrötliche Haare). Sie übernehmen den Star-Platz ihres Vereins mit unveränderten Werten. Laufende Karrieren bekommen sie beim Laden nachgerüstet, sofern der bisherige Star noch im Verein ist.
- Neue Frisur: lange offene Haare (Spielfigur und Porträt)
- **Landingpage:** Kapitel „POKAL & EUROPA“ mit Final Four, 52 Vereine, Finanzen im Manager-Kapitel
- **Suchmaschinen:**
  - Neuer Abschnitt „Das Spiel“ mit Trailer, vier Feature-Kacheln und häufigen Fragen (auch als strukturierte Daten: VideoGame mit Trailer, FAQ, WebSite)
  - Titel und Beschreibungen auf „Handball-Spiel“ und „Handball-Manager“ ausgerichtet, Vorschaubilder für soziale Netzwerke
  - `robots.txt` und `sitemap.xml` (mit Bildern und Trailer), Doppel-Fassung `hallen-legenden.html` und Entwicklerordner auf `noindex`
- Doppelte CSS-Blöcke der Landingpage entfernt
- Neuer Regressionstest für die beiden Spieler, insgesamt 27

## v8.3: Europapokal und Final Four
- **Final Four:** Halbfinale und Finale des Pokals finden an einem Termin in neutraler Halle statt: lila Boden, goldene Torräume, ausverkaufte Ränge mit den Fans beider Teams je zur Hälfte, eigene Bandenwerbung, großer Event-Titel im Intro. Nach dem Finale gibt es eine Pokalübergabe mit Konfetti, auf dem Abpfiff-Bildschirm einen Pokal-Hinweis. Kein Heimvorteil und keine Zuschauereinnahmen für einen „Gastgeber“.
- **16 internationale Vereine** mit Fantasienamen (zum Beispiel Barcelona Katalanenstiere, Veszprém Bakonylöwen, Kielce Kreuzritter), im Schnellen Spiel unter „EUROPA“ wählbar. Laufende Karrieren bekommen ihre Kader und Budgets automatisch nachgerüstet.
- **Europapokal in der Karriere:** Platz 1 und 2 der 1. Liga, dazu der Pokalsieger (falls Erstligist, sonst der Dritte), treffen auf 13 internationale Vereine.
  - Gruppenphase mit 4 Gruppen à 4 (Lostöpfe nach Stärke, deutsche Vereine in verschiedenen Gruppen), Hin- und Rückspiel
  - Viertelfinale mit Heimrecht für Gruppensieger, Final Four am Saisonende
  - Bei 6 Spieltagen kompakt: 8 Vereine, Viertelfinale, Final Four
  - Termine zwischen den Ligaspieltagen, alle Spiele selbst spielbar oder simuliert. Mehr Spiele bedeuten mehr Belastung für den Kader.
  - Startprämie, Prämien für Siege und Runden, Zuschauereinnahmen bei Heimspielen (Beträge siehe unten)
  - Neuer Tab „EUROPA“ mit Gruppentabellen, Ergebnissen und Turnierbaum. Zeitung, Saisonabschluss, Finanzbilanz und Historie zeigen den Europapokal.
  - Laufende Karrieren starten ab der nächsten Saison im Europapokal.
- **Fehler behoben:** Das TV-Intro mit den Aufstellungskarten wurde nie angezeigt, weil die Anwurf-Vorbereitung die Intro-Phase sofort überschrieb. Es läuft jetzt wieder vor jedem Spiel und lässt sich mit einer Taste überspringen.
- **Fehler behoben:** Gewann Magdeburg (Vereinsnummer 0) den Pokal, wurde das Finale am Saisonende erneut ausgespielt. In der Historie stand dann ein falscher Pokalsieger, im ungünstigen Fall drohte eine Endlosschleife.
- **Fehler behoben (beim Test der Deploy Preview gefunden):** Schied der eigene Verein im Halbfinale eines Final Four aus, blieb das Finale am selben Termin liegen. Im Europapokal wurde es erst beim Saisonabschluss nachgeholt, im Pokal erst mit dem nächsten Ligaspieltag. Bis dahin fehlten Sieger und Zeitungsmeldung. Jetzt wird das Finale sofort simuliert.
- **Europapokal-Finanzen nachjustiert (beim Test der Deploy Preview gefunden):** Ein Teilnehmer verdiente im Schnitt rund 400.000 € pro Saison, fast das Siebenfache dessen, was eine Ligasaison einem Erstligisten einbringt. Die Budgets der internationalen Vereine verdoppelten sich so binnen drei Saisons. Jetzt: Startprämie 25.000 €, Sieg 10.000 €, Remis 5.000 €, Viertelfinale/Final Four/Finale 20.000/40.000/60.000 €, Titel 120.000 €, beim Gastgeber bleiben 60 % der Zuschauereinnahmen. Im Schnitt sind das etwa 225.000 € pro Teilnehmer, für den Sieger rund 450.000 €. Die Heimatliga-Prämie der internationalen Vereine sinkt auf 25.000 €. Der Budget-Test prüft 1. Liga und internationale Vereine jetzt einzeln.
- Lange Banner (z. B. bei der Pokalübergabe) passen ihre Schriftgröße der Bildbreite an
- Die Untertitelzeile unter „FINAL FOUR“ im Intro hat einen dunklen Hintergrund und ist vor dem Publikum lesbar
- 5 neue Regressionstests (`tests/run.mjs`), insgesamt 26. Der Aktionen-Test stellt den Spieler vor jeder Aktion wieder hin; vorher schlug er ab und zu fehl, wenn der Spieler in den Zwischenframes gefoult worden war und noch lag.
- **Pressekit:** neue Clips direkt aus dem Spiel: Final Four mit Pokalübergabe, TV-Intro mit Aufstellungskarten, Spielszene mit Tor und Wiederholung, Kempa-Tor, Europapokal-Ansicht, dazu Standbilder (`docs/presse/`). Aufnahme mit `tools/promo/spiel.js`, Bild für Bild und mit festem Zufall reproduzierbar, alles neu mit `sh tools/promo/promo.sh spiel`.
- **Neuer Teaser** aus echten Spielszenen (27 s, `tools/promo/schnitt.js`), auch oben in der README. Der bisherige Teaser heißt jetzt `hallenlegenden-story` (Story-Film der Landingpage).

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
