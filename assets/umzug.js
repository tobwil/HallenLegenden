/* Umzug von tobwil.github.io/HallenLegenden nach hallenlegenden.de
   - Auf github.io: sofort weiterleiten und die Spielstände (localStorage, Schlüssel hl…_) im URL-Anker mitnehmen.
     Der Anker wird nie an einen Server geschickt.
   - Auf der neuen Adresse: Spielstände aus dem Anker übernehmen (vorhandene werden nicht überschrieben)
     und zur eigentlichen Seite weiter. */
(() => {
  const ZIEL = 'https://hallenlegenden.de';
  const KEY = /^hl\d+_/;
  const b64url = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

  // ---------- alte Adresse: weiterleiten ----------
  if (/\.github\.io$/.test(location.hostname)) {
    document.documentElement.style.visibility = 'hidden';
    let path = location.pathname.replace(/^\/HallenLegenden/i, '') || '/';
    if (/^\/spielen(\.html)?$/.test(path)) path = '/game/';
    const data = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (KEY.test(k)) data[k] = localStorage.getItem(k); } } catch (e) { }
    const has = Object.keys(data).length > 0;
    // Früher lag das Spiel direkt auf der Startseite: Wer schon gespielt hat, landet wieder im Spiel
    if (has && (path === '/' || path === '/index.html')) path = '/game/';
    const go = hash => location.replace(ZIEL + (hash ? '/' + hash : path));
    if (!has) return go('');
    (async () => {
      try {
        const raw = new TextEncoder().encode(JSON.stringify(data));
        const packed = 'CompressionStream' in window ? 'z' + b64url(await pipe(raw, new CompressionStream('deflate-raw'))) : 'j' + b64url(raw);
        if (packed.length > 1900000) return go(''); // zu groß für eine Adresse: ohne Spielstand weiter
        go('#umzug=' + packed + '&ziel=' + encodeURIComponent(path));
      } catch (e) { go(''); }
    })();
    return;
  }

  // ---------- neue Adresse: Spielstände übernehmen ----------
  if (!location.hash.startsWith('#umzug=')) return;
  document.documentElement.style.visibility = 'hidden';
  const params = new URLSearchParams(location.hash.slice(1));
  const packed = params.get('umzug') || '', ziel = params.get('ziel') || '/';
  // nur Pfade auf dieser Seite, keine fremden Adressen (auch nicht //andere-seite)
  const weiter = () => location.replace(/^\/(?!\/)[\w./-]*$/.test(ziel) ? ziel : '/');
  // nur übernehmen, wenn wir wirklich von der alten Adresse kommen (kein Unterschieben per präpariertem Link)
  const vonAlt = document.referrer.startsWith('https://tobwil.github.io/');
  (async () => {
    try {
      if (!vonAlt) throw 0;
      let bytes = unb64url(packed.slice(1));
      if (packed[0] === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
      const data = JSON.parse(new TextDecoder().decode(bytes));
      Object.keys(data).forEach(k => { if (KEY.test(k) && localStorage.getItem(k) === null) localStorage.setItem(k, data[k]); });
    } catch (e) { }
    weiter();
  })();
})();
