#!/bin/sh
# Erzeugt das Presse-Material neu nach docs/presse/.
#   sh promo.sh          alles
#   sh promo.sh film     Story-Film und Anzug-Clip von der Landingpage
#   sh promo.sh spiel    Clips aus dem Spiel (Final Four, Aufstellungen, Spielszene, Kempa, Europapokal) und daraus der Teaser
#   sh promo.sh profil   Profilbild und Banner für Social Media (X, Bluesky …) nach docs/presse/
#   sh promo.sh bilder   Standbilder für README und Landingpage nach docs/screenshots/ (Titel, Spielszene, Vor dem Spiel, Erfolge, Kader, Teilen, Handy)
# Braucht: node mit playwright (npm i playwright im Ordner tools/promo), ffmpeg, python3.
# Optional: CHROMIUM=/pfad/zu/chromium, falls Playwright seinen Browser nicht findet.
set -e
cd "$(dirname "$0")"
ROOT=../..
OUT=$ROOT/docs/presse
TMP=$(mktemp -d)
python3 -m http.server 8765 --directory "$ROOT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1
TEIL=${1:-alle}
if [ "$TEIL" = alle ] || [ "$TEIL" = bilder ]; then
  node bilder.js "$TMP/bilder"
  for f in "$TMP"/bilder/*.png; do ffmpeg -y -loglevel error -i "$f" -q:v 3 "$ROOT/docs/screenshots/$(basename "$f" .png).jpg"; done
  [ "$TEIL" = bilder ] && { echo "fertig: $ROOT/docs/screenshots"; exit 0; }
fi
if [ "$TEIL" = alle ] || [ "$TEIL" = profil ]; then
  node profil.js "$TMP/profil"
  for f in profilbild profilbild-400 banner; do cp "$TMP/profil/$f.png" "$OUT/hallenlegenden-$f.png"; done
  [ "$TEIL" = profil ] && { echo "fertig: $OUT"; exit 0; }
fi
node aufnahme.js tafel "$TMP"   # Abschlusstafel, für Story-Film und Teaser

if [ "$TEIL" != spiel ]; then
node aufnahme.js story "$TMP/story"
node aufnahme.js anzug "$TMP/anzug"

# Story-Film der Landingpage + englische Abschlusstafel mit Überblendung
ffmpeg -y -loglevel error -framerate 15 -i "$TMP/story/f%04d.png" -loop 1 -framerate 15 -t 3 -i "$TMP/tafel.png" \
  -filter_complex "[0:v]fps=30,format=yuv420p[a];[1:v]fps=30,format=yuv420p[b];[a][b]xfade=transition=fade:duration=0.5:offset=16.7[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 20 -movflags +faststart "$OUT/hallenlegenden-story.mp4"
ffmpeg -y -loglevel error -framerate 15 -i "$TMP/story/f%04d.png" -loop 1 -framerate 15 -t 3 -i "$TMP/tafel.png" \
  -filter_complex "[0:v][1:v]concat=n=2:v=1[c];[c]fps=12,scale=640:-1:flags=neighbor,split[x][y];[x]palettegen=max_colors=128[p];[y][p]paletteuse=dither=none" \
  -gifflags -transdiff "$OUT/hallenlegenden-story.gif"

# Anzug-Wechsel: Ausschnitt um Vorhang und Figur, pixelgenau vergrößert
ffmpeg -y -loglevel error -framerate 12 -i "$TMP/anzug/f%04d.png" \
  -vf "crop=180:115:10:50,scale=iw*3:ih*3:flags=neighbor,split[x][y];[x]palettegen=max_colors=96[p];[y][p]paletteuse=dither=none" \
  -gifflags -transdiff -loop 0 "$OUT/hallenlegenden-anzug.gif"
ffmpeg -y -loglevel error -framerate 12 -i "$TMP/anzug/f%04d.png" \
  -vf "crop=180:115:10:50,scale=iw*6:ih*6:flags=neighbor,format=yuv420p" -c:v libx264 -crf 18 -movflags +faststart "$OUT/hallenlegenden-anzug.mp4"
cp "$TMP/tafel.png" "$OUT/hallenlegenden-abschlusstafel.png"
fi

if [ "$TEIL" != film ]; then
# Spielgrafik hat 640 × 360 Pixel: fürs Video pixelgenau verdoppeln, das GIF bleibt in Originalgröße
clip() {   # clip <name> <gif: ja | nein | Sekunden vom Ende> [Bildnummer fürs Standbild]
  node spiel.js "$1" "$TMP/$1"
  ffmpeg -y -loglevel error -framerate 30 -i "$TMP/$1/f%04d.png" -vf "scale=1280:720:flags=neighbor,format=yuv420p" \
    -c:v libx264 -preset slow -crf 20 -movflags +faststart "$OUT/hallenlegenden-$1.mp4"
  START=0; [ "$2" != ja ] && [ "$2" != nein ] && START=$(( $(ls "$TMP/$1" | grep -c '^f.*png$') - $2 * 30 ))
  [ "$2" != nein ] && ffmpeg -y -loglevel error -framerate 30 -start_number $START -i "$TMP/$1/f%04d.png" \
    -vf "fps=12,scale=640:-1:flags=neighbor,split[x][y];[x]palettegen=max_colors=128:stats_mode=diff[p];[y][p]paletteuse=dither=none:diff_mode=rectangle" \
    -loop 0 "$OUT/hallenlegenden-$1.gif"
  [ -n "$3" ] && ffmpeg -y -loglevel error -i "$TMP/$1/f$3.png" -vf "scale=1280:720:flags=neighbor" -frames:v 1 -update 1 "$OUT/hallenlegenden-$1.png"
  return 0
}
clip aufstellung ja 0210
clip final-four 10
clip spielszene ja
clip kempa ja
clip europapokal nein
node spiel.js titel "$TMP/titel"
# Teaser: Zusammenschnitt der Spielclips mit Abschlusstafel (Szenen in schnitt.js)
node schnitt.js "$TMP" "$OUT"
# Standbilder: Final-Four-Titel, Pokalübergabe, Europapokal mit Gruppen und mit Turnierbaum
ffmpeg -y -loglevel error -i "$TMP/final-four/f0060.png" -vf "scale=1280:720:flags=neighbor" -frames:v 1 -update 1 "$OUT/hallenlegenden-final-four-titel.png"
LAST=$(ls "$TMP/final-four" | grep '^f.*png$' | tail -n 30 | head -n 1)
ffmpeg -y -loglevel error -i "$TMP/final-four/$LAST" -vf "scale=1280:720:flags=neighbor" -frames:v 1 -update 1 "$OUT/hallenlegenden-final-four-pokal.png"
cp "$TMP/europapokal/f0000.png" "$OUT/hallenlegenden-europapokal-gruppen.png"
cp "$TMP/europapokal/$(ls "$TMP/europapokal" | grep '^f.*png$' | tail -n 1)" "$OUT/hallenlegenden-europapokal-turnierbaum.png"
fi
echo "fertig: $OUT"
