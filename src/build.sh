#!/bin/sh
# Baut das Spiel aus den Quelldateien (Reihenfolge ist wichtig, alle Module teilen sich einen Script-Block)
cd "$(dirname "$0")"
JS="p01_core.js p02_audio.js p03_sprites.js p04_arena.js p05_match.js p06_actions.js p07_ai.js p08_rules.js p09_fx.js p10_render.js p11_menus.js p13_career.js p15_cup.js p16_finance.js p17_euro.js p18_erfolge.js p19_training.js p14_career_ui.js p12_main.js"

# Artifact-Fassung: ohne <html>-Gerüst
{ cat head.html; echo '<script>'; cat $JS; echo '</script>'; } > ../hallen-legenden.html

# Website-Fassung (game/index.html): Titel, Schriften und Styles im <head>, Spielfläche und Script im <body>
# Die Startseite index.html im Hauptordner ist die Landingpage und wird hier nicht erzeugt.
mkdir -p ../game
URL='https://hallenlegenden.de/game/'
DESC='Jetzt Handball spielen: 7 gegen 7 im Retro-Pixel-Look und Karriere als Handball-Manager mit zwei Ligen, Pokal, Europapokal mit Final Four und Transfermarkt. Kostenlos im Browser, am Computer und am Handy.'
TITLE='Hallen-Legenden spielen – Handball-Spiel &amp; Handball-Manager im Browser'
IMG='https://hallenlegenden.de/docs/screenshots/gameplay.jpg'
TITLE_SED=$(printf '%s' "$TITLE" | sed 's/&/\\&/g')   # & ist in sed-Ersetzungen ein Sonderzeichen
{
  echo '<!doctype html>'
  echo '<html lang="de"><head><meta charset="utf-8"><script src="../assets/umzug.js"></script><meta name="viewport" id="vp" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">'
  echo "<meta name=\"description\" content=\"$DESC\">"
  echo '<meta name="author" content="tobwil"><meta name="theme-color" content="#07060b">'
  # Nutzungsstatistik (Umami, ohne Cookies), zählt nur auf hallenlegenden.de
  echo '<script defer src="https://cloud.umami.is/script.js" data-website-id="961ff3e5-3c46-4605-9ed8-604d267f78cc" data-domains="hallenlegenden.de,www.hallenlegenden.de" data-do-not-track="true"></script>'
  echo "<meta property=\"og:type\" content=\"website\"><meta property=\"og:site_name\" content=\"Hallen-Legenden\"><meta property=\"og:locale\" content=\"de_DE\"><meta property=\"og:title\" content=\"$TITLE\"><meta property=\"og:description\" content=\"$DESC\"><meta property=\"og:url\" content=\"$URL\">"
  echo "<meta property=\"og:image\" content=\"$IMG\"><meta property=\"og:image:width\" content=\"1280\"><meta property=\"og:image:height\" content=\"720\"><meta name=\"twitter:card\" content=\"summary_large_image\"><meta name=\"twitter:image\" content=\"$IMG\">"
  echo "<link rel=\"canonical\" href=\"$URL\">"
  echo "<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤾</text></svg>\">"
  echo '<style>html,body{margin:0}</style>'
  # Schriften lokal statt von Google (Datenschutz): fonts/fonts.css liegt eine Ebene höher
  sed -n '1,/^<\/style>/p' head.html | sed -e '/fonts.googleapis.com\|fonts.gstatic.com/d' -e "s#^<title>.*#<title>$TITLE_SED</title>\\n<link rel=\"stylesheet\" href=\"../fonts/fonts.css\">#"
  echo '</head><body>'
  sed '1,/^<\/style>/d' head.html
  echo '<script>'; cat $JS; echo '</script>'
  echo '</body></html>'
} > ../game/index.html
echo "fertig: game/index.html (im Browser öffnen), hallen-legenden.html (Artifact-Fassung)"
