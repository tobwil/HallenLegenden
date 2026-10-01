#!/bin/sh
# Baut das Spiel aus den Quelldateien (Reihenfolge ist wichtig, alle Module teilen sich einen Script-Block)
cd "$(dirname "$0")"
{ cat head.html; echo '<script>'; cat p01_core.js p02_audio.js p03_sprites.js p04_arena.js p05_match.js p06_actions.js p07_ai.js p08_rules.js p09_fx.js p10_render.js p11_menus.js p13_career.js p15_cup.js p14_career_ui.js p12_main.js; echo '</script>'; } > ../hallen-legenden.html
{ echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html,body{margin:0}</style></head><body>'; cat ../hallen-legenden.html; echo '</body></html>'; } > ../spielen.html
cp ../spielen.html ../index.html
echo "fertig: index.html und spielen.html (im Browser öffnen), hallen-legenden.html (Artifact-Fassung)"
