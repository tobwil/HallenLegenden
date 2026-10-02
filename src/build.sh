#!/bin/sh
# Baut das Spiel aus den Quelldateien (Reihenfolge ist wichtig, alle Module teilen sich einen Script-Block)
cd "$(dirname "$0")"
JS="p01_core.js p02_audio.js p03_sprites.js p04_arena.js p05_match.js p06_actions.js p07_ai.js p08_rules.js p09_fx.js p10_render.js p11_menus.js p13_career.js p15_cup.js p14_career_ui.js p12_main.js"

# Artifact-Fassung: ohne <html>-Gerüst
{ cat head.html; echo '<script>'; cat $JS; echo '</script>'; } > ../hallen-legenden.html

# Website-Fassung (game/index.html): Titel, Schriften und Styles im <head>, Spielfläche und Script im <body>
# Die Startseite index.html im Hauptordner ist die Landingpage und wird hier nicht erzeugt.
mkdir -p ../game
URL='https://hallenlegenden.de/game/'
DESC='Retro-Handball im Pixel-Look: 7 gegen 7, Karriere mit zwei Ligen, Pokal und Transfermarkt. Läuft direkt im Browser, am Desktop und auf dem Handy.'
{
  echo '<!doctype html>'
  echo '<html lang="de"><head><meta charset="utf-8"><script src="../assets/umzug.js"></script><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  echo "<meta name=\"description\" content=\"$DESC\">"
  echo '<meta name="author" content="tobwil"><meta name="theme-color" content="#07060b">'
  echo "<meta property=\"og:type\" content=\"website\"><meta property=\"og:title\" content=\"Hallen-Legenden\"><meta property=\"og:description\" content=\"$DESC\"><meta property=\"og:url\" content=\"$URL\">"
  echo "<link rel=\"canonical\" href=\"$URL\">"
  echo "<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤾</text></svg>\">"
  echo '<style>html,body{margin:0}</style>'
  # Schriften lokal statt von Google (Datenschutz): fonts/fonts.css liegt eine Ebene höher
  sed -n '1,/^<\/style>/p' head.html | sed -e '/fonts.googleapis.com\|fonts.gstatic.com/d' -e 's#^<title>.*#&\n<link rel="stylesheet" href="../fonts/fonts.css">#'
  echo '</head><body>'
  sed '1,/^<\/style>/d' head.html
  echo '<script>'; cat $JS; echo '</script>'
  echo '</body></html>'
} > ../game/index.html
echo "fertig: game/index.html (im Browser öffnen), hallen-legenden.html (Artifact-Fassung)"
