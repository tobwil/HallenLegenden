#!/bin/sh
# Erzeugt Teaser und Anzug-Clip neu (MP4 + GIF) nach docs/presse/.
# Braucht: node mit playwright (npm i playwright im Ordner tools/promo), ffmpeg, python3.
# Optional: CHROMIUM=/pfad/zu/chromium, falls Playwright seinen Browser nicht findet.
set -e
cd "$(dirname "$0")"
ROOT=../..
OUT=$ROOT/docs/presse
TMP=$(mktemp -d)
python3 -m http.server 8765 --directory "$ROOT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1

node aufnahme.js teaser "$TMP/teaser"
node aufnahme.js anzug "$TMP/anzug"
node aufnahme.js tafel "$TMP"

# Teaser: Film + englische Abschlusstafel mit Überblendung
ffmpeg -y -loglevel error -framerate 15 -i "$TMP/teaser/f%04d.png" -loop 1 -framerate 15 -t 3 -i "$TMP/tafel.png" \
  -filter_complex "[0:v]fps=30,format=yuv420p[a];[1:v]fps=30,format=yuv420p[b];[a][b]xfade=transition=fade:duration=0.5:offset=16.7[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 20 -movflags +faststart "$OUT/hallenlegenden-teaser.mp4"
ffmpeg -y -loglevel error -framerate 15 -i "$TMP/teaser/f%04d.png" -loop 1 -framerate 15 -t 3 -i "$TMP/tafel.png" \
  -filter_complex "[0:v][1:v]concat=n=2:v=1[c];[c]fps=12,scale=640:-1:flags=neighbor,split[x][y];[x]palettegen=max_colors=128[p];[y][p]paletteuse=dither=none" \
  -gifflags -transdiff "$OUT/hallenlegenden-teaser.gif"

# Anzug-Wechsel: Ausschnitt um Vorhang und Figur, pixelgenau vergrößert
ffmpeg -y -loglevel error -framerate 12 -i "$TMP/anzug/f%04d.png" \
  -vf "crop=180:115:10:50,scale=iw*3:ih*3:flags=neighbor,split[x][y];[x]palettegen=max_colors=96[p];[y][p]paletteuse=dither=none" \
  -gifflags -transdiff -loop 0 "$OUT/hallenlegenden-anzug.gif"
ffmpeg -y -loglevel error -framerate 12 -i "$TMP/anzug/f%04d.png" \
  -vf "crop=180:115:10:50,scale=iw*6:ih*6:flags=neighbor,format=yuv420p" -c:v libx264 -crf 18 -movflags +faststart "$OUT/hallenlegenden-anzug.mp4"
cp "$TMP/tafel.png" "$OUT/hallenlegenden-abschlusstafel.png"
echo "fertig: $OUT"
