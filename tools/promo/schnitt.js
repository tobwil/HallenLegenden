/* Schneidet den Teaser aus den Spielclips (Einzelbilder und marken.json von spiel.js) und der Abschlusstafel.
   Aufruf: node schnitt.js <Ordner mit den Clip-Unterordnern> <Ausgabeordner>
   Braucht ffmpeg. Abschnitte und Reihenfolge stehen unten in SZENEN. */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const [TMP, OUT] = process.argv.slice(2);
if (!TMP || !OUT) { console.error('Aufruf: node schnitt.js <clip-ordner> <ausgabe>'); process.exit(1); }
const FPS = 30, FADE = 0.25;
const M = c => JSON.parse(fs.readFileSync(path.join(TMP, c, 'marken.json'), 'utf8'));
// [Clip, erstes Bild, Anzahl Bilder]
const SZENEN = [
  ['titel', 0, 75],                                          // Startbildschirm
  ['aufstellung', 110, 90],                                  // Aufstellungskarten fliegen herein
  ['spielszene', M('spielszene').goal - 105, 150],          // Angriff und Tor
  ['kempa', M('kempa').goal - 90, 130],                      // Kempa-Trick
  ['europapokal', M('europapokal').scroll + 10, 100],       // Gruppen, dann Turnierbaum
  ['final-four', 15, 70],                                    // Final-Four-Titel
  ['final-four', M('final-four').pokal - 45, 155],          // Schlusssekunden und Pokalübergabe
];
const args = ['-y', '-loglevel', 'error'], parts = [];
SZENEN.forEach(([c, start, n], i) => {
  args.push('-framerate', String(FPS), '-start_number', String(start), '-i', path.join(TMP, c, 'f%04d.png'));
  parts.push(`[${i}:v]trim=end_frame=${n},setpts=PTS-STARTPTS,scale=1280:720:flags=neighbor,fps=${FPS},format=yuv420p,setsar=1[s${i}]`);
});
const tafel = SZENEN.length;
args.push('-loop', '1', '-framerate', String(FPS), '-t', '3', '-i', path.join(TMP, 'tafel.png'));
parts.push(`[${tafel}:v]fps=${FPS},format=yuv420p,setsar=1[s${tafel}]`);
// Überblendungen: jede Szene beginnt FADE Sekunden vor dem Ende der vorigen
let prev = 's0', len = SZENEN[0][2] / FPS;
for (let i = 1; i <= tafel; i++) {
  const fade = i === tafel ? 0.5 : FADE, out = i === tafel ? 'v' : `x${i}`;
  parts.push(`[${prev}][s${i}]xfade=transition=fade:duration=${fade}:offset=${(len - fade).toFixed(3)}[${out}]`);
  len += (i === tafel ? 3 : SZENEN[i][2] / FPS) - fade; prev = out;
}
const mp4 = path.join(OUT, 'hallenlegenden-teaser.mp4');
execFileSync('ffmpeg', [...args, '-filter_complex', parts.join(';'), '-map', '[v]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-vf', 'fps=10,scale=640:360:flags=neighbor,split[x][y];[x]palettegen=max_colors=96:stats_mode=diff[p];[y][p]paletteuse=dither=none:diff_mode=rectangle', '-loop', '0', path.join(OUT, 'hallenlegenden-teaser.gif')], { stdio: 'inherit' });
console.log('Teaser:', len.toFixed(1), 's');
