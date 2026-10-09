/* Kontaktdaten für Impressum und Datenschutz.
   Kodiert statt im Klartext, damit Adress-Sammler sie nicht einfach auslesen. Sichtbar nach Klick auf „Anzeigen“. */
(() => {
  const D = '9JCbhRXanlGZu0GblhGbpdHQzFWai9GdiAiOiwWah1mIgwiInJXdi92QgATN0YTOiAiOikHdpNmIgwiI5IDIlN3chd2ckVWath2YTJCI6ICdlVmc0NnIgwiItxWZoxWaXBychlmYvRlIgojIl1WYuJye';
  const decode = () => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(D.split('').reverse().join('')), c => c.charCodeAt(0))));
  function reveal() {
    const k = decode();
    document.querySelectorAll('[data-k]').forEach(el => {
      const v = k[el.dataset.k];
      if (el.dataset.k === 'mail') {
        const a = document.createElement('a'); a.href = 'mailto:' + v; a.textContent = v; el.replaceChildren(a);
      } else el.textContent = v;
      el.classList.add('shown');
    });
    document.querySelectorAll('.card .reveal').forEach(b => b.remove());
  }
  document.querySelectorAll('.card .reveal').forEach(b => b.addEventListener('click', reveal));   // nur in der Kontaktkarte, nicht der Statistik-Knopf
})();
