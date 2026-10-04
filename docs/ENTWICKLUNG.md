# Entwicklungsgeschichte

Hallen-Legenden entstand an einem Tag im Dialog zwischen tobwil (Idee, Feedback, Spieltests) und Claude (Umsetzung in Claude Code). Diese Seite fasst den Verlauf zusammen: was gewünscht wurde, was daraus gebaut wurde, welche Entscheidungen fielen und wie getestet wurde.

## 1. Der Auftrag

> „Ich möchte ein Handballspiel im Stil von Legend Bowl.“

Daraus wurde eine erste spielbare Version:
- Pixel-Handball 7 gegen 7 mit Grundregeln (Torraum, Fouls, 7-Meter, Zeitstrafen)
- KI-Teams, Freundschaftsspiel und eine kurze Saison mit acht fiktiven Vereinen
- Wiederholung nach Toren und einfache Touch-Steuerung

Zur Abstimmung liefen mehrere Spiele zwischen zwei Computer-Teams. Bis die Trefferquote bei realistischen rund 45 % lag, wurden Ballgewinne, Abfangen und Wurfgenauigkeit nachjustiert.

## 2. „Make it WOW“

> „Pixelgrafik zu wenig, Gameplay noch nicht perfekt, vor allem der Spielauftritt. Ich will auch aktuelle Mannschaften aus der 1. und 2. HBL.“

Was daraufhin entstand:
- **Recherche:** die Teilnehmer beider Ligen 2026/27, inklusive der Auf- und Absteiger
- **Neuaufbau in 12 Modulen:**
  - Halle mit Perspektive
  - prozedurale Sprites mit Umriss, Schattierung, Nummern und Porträts
  - LED-Banden, Fanblöcke, Videowürfel und Lichtkegel
- **TV-Auftritt:** Intro mit Aufstellungskarten, große Tor-Einblendung und Statistiken
- **Neue Aktionen:** Kempa-Trick, Heber, Fallwurf, Torwart-Duell beim 7-Meter, schnelle Mitte und Abwehrsysteme
- **Tests:** Bildschirmfotos aller Ansichten und mehrere komplette Spiele zwischen zwei Computer-Teams

## 3. Erste Spieltests und die Namensfrage

Gemeldet wurden: Gegenspieler laufen nach Gegentoren frei aufs Tor, Texte ragen aus Boxen, Spieler wirken „wie laufende Würste“, Pässe aus der eigenen Hälfte werden zu Toren. Gewünscht waren außerdem Speichern und Trikotwahl.

Die Ursachen:
- **Schnelle Mitte:** Die Mannschaft, die getroffen hatte, blieb nach dem Jubel vor dem gegnerischen Tor stehen.
- **Pässe als Tore:** Sie landeten im Torraum, wo kein Feldspieler sie fangen darf, und rollten ins Tor.

Gefragt war außerdem, ob echte Vereinsnamen verwendet werden dürfen. Die Antwort (ausdrücklich keine Rechtsberatung): Vereinsnamen sind oft als Marke geschützt, Vereine haben zusätzlich ein Namensrecht. Für eine Veröffentlichung sind Fantasienamen deutlich sicherer.
- **Entscheidung:** Fantasienamen aus Stadt und Spitzname. Ligastruktur und Stärken bleiben, alles ist im Editor umbenennbar.

## 4. Karriere und Manager

> „Steuerung noch hakelig. Funktioniert der Ligamodus auch saisonübergreifend? Spielerstärken, Formentwicklung, Managermodus?“

**Steuerung:** Pass sofort beim Drücken, kurz tippen für schnelle Würfe, Passempfänger laufen automatisch zum Ball.

**Karriere-Modus:**
- mehrere Saisons mit Auf- und Abstieg
- Kader mit Werten, Form und Fitness, Training und Spielerentwicklung
- Transfers und Gehälter

**Getestet:** drei komplett simulierte Saisons am Stück, mit Konsistenzprüfung der Tabellen und Prüfung des Speicherns.

**Nachjustiert**, weil die Tests unrealistische Werte zeigten:
- Torschützenkönige hatten 166 Tore in 17 Spielen.
- Das Budget wuchs zu schnell.

## 5. Zeitung, CPU-Transfers, Audio

> „Ist es gewollt, dass ich 6 von 6 simulierten Spielen gewonnen habe?“

Nur teilweise. Die Untersuchung fand drei Fehler:
- **Unausgewogener Spielplan:** Ein Team hatte 5 Heimspiele aus 6 gegen fast nur schwache Gegner.
- **Zu wenig Zufall:** Stärkeunterschiede waren zu stark gewichtet.
- **Form-Spirale:** Jeder Sieg machte den nächsten leichter.

Danach gab es perfekte 6-Spiele-Saisons nur noch in 5 bis 8 % der Fälle. Über eine volle Saison gewinnt das stärkste Team 72 % seiner Spiele, das schwächste 25 %.

Dazu kamen:
- **Karriere-Center:** die Zeitung „Handball-Kurier“, Vorstand mit Saisonziel, abschaltbare CPU-Transfers
- **Ausdauer und Co-Trainer:** Ausdauer als Spielerwert, ein Co-Trainer für Aufstellung und Training
- **Audio:** eine neue Engine mit Hallenhall

## 6. Mobile, Menüs, Publikum

> „Bitte responsive und an Mobile denken. Das Publikum hört sich an wie Meeresrauschen und ist viel zu laut.“

Was sich änderte:
- **Publikum:** statt gefiltertem Rauschen Stimmengewirr aus synthetischen Stimmen mit Formant-Filtern, die einzelne Vokale nachbilden
- **Menüsteuerung:** Pfeiltasten springen räumlich zum nächsten Knopf, Esc geht überall zurück, Gamepad im Menü
- **Responsive:** Vollbild-Menüs und Karten-Layouts auf dem Handy

**Getestet** in der Handy-Emulation (375 × 812 hochkant, 844 × 390 quer).

## 7. Touch-Steuerung und Manager-Tiefe

> „Auch die Steuerung der Spieler bzw. die Aktionen sind schwer.“

Gewählt wurden: Auswechseln, Pokal, Verletzungen und Verträge.

Abgelehnt wurden: Grafik-Stufen für schwache Handys und zwei Spieler an einem Gerät.

Was gebaut wurde:
- **Touch:** mitwandernder Stick, Antippen statt Knöpfe suchen, kontextabhängige Knöpfe, Pass-Vorschau
- **Spieltempo** als Option
- **Kraft und Auswechseln:** Kraftverlust über das Spiel mit Wechselmenü und Auto-Wechsel
- **Pokal** mit 7-Meter-Werfen
- **Verletzungen und Verträge** mit Verlängerung

**Getestet:**
- drei Saisons mit Pokal, Verletzungen und Verträgen
- ein gespieltes Pokalspiel mit Unentschieden bis zur Entscheidung im 7-Meter-Werfen
- die Touch-Aktionen in der Emulation

**Gefunden und behoben:**
- Ohne Vertragsverlängerungen schrumpfte der Kader auf 8 Spieler. Jetzt rückt die Jugend nach.
- Absturz durch eine verzögerte Tor-Durchsage nach Spielende

## Wie getestet wurde

- **Automatisierte Durchläufe im Browser:** komplette Spiele zwischen zwei Computer-Teams, Spiele mit zufälligen Tasteneingaben und mehrere Karriere-Saisons am Stück, mit Prüfung auf Fehler, Tabellenkonsistenz und Kadergrößen
- **Statistische Prüfung** der Simulation: Siegquoten nach Teamstärke, Torschützenzahlen und Budgetverlauf
- **Bildschirmfotos** von Desktop, Hochformat und Querformat
- **Grenzen:** Wie sich Steuerung und Sound anfühlen, lässt sich so nicht prüfen. Dafür waren die Spieltests von tobwil entscheidend.

## Offene Ideen

- Übungsmodus mit kurzen Lektionen (Passen, Werfen, Abwehr, Kempa, 7-Meter)
