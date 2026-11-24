/* Icone meteo in stile 3D (nuvole morbide, sole luminoso, gocce lucide)
   per le immagini del robot Instagram. Ogni icona è un SVG 128×128.
   Uso: iconaMeteo(codiceWMO) → testo SVG;  tipoIcona(codice) → nome del tipo. */
(function(){
  const NUVOLA = `
    <circle cx="44" cy="68" r="21"/>
    <circle cx="68" cy="54" r="28"/>
    <circle cx="92" cy="70" r="19"/>
    <rect x="24" y="64" width="86" height="27" rx="13.5"/>`;

  const def = (id, chiara) => `
    <linearGradient id="nuv${id}" gradientUnits="userSpaceOnUse" x1="0" y1="26" x2="0" y2="94">
      ${chiara
        ? '<stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eef3fa"/><stop offset="1" stop-color="#b9c8dc"/>'
        : '<stop offset="0" stop-color="#d3dbe6"/><stop offset=".5" stop-color="#9aa7ba"/><stop offset="1" stop-color="#5f6c82"/>'}
    </linearGradient>
    <radialGradient id="lucenuv${id}" cx="58" cy="38" r="34" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ombranuv${id}" gradientUnits="userSpaceOnUse" x1="0" y1="70" x2="0" y2="92">
      <stop offset="0" stop-color="#3a4a66" stop-opacity="0"/><stop offset="1" stop-color="#3a4a66" stop-opacity="${chiara ? .22 : .35}"/>
    </linearGradient>`;

  const nuvola = (id, chiara, t = "") => `
    <g transform="${t}" filter="url(#ombra)">
      <g fill="url(#nuv${id})">${NUVOLA}</g>
      <rect x="0" y="0" width="128" height="128" fill="url(#ombranuv${id})" mask="url(#forma)"/>
      <ellipse cx="60" cy="42" rx="22" ry="12" fill="url(#lucenuv${id})"/>
    </g>`;

  const sole = (cx, cy, r) => `
    <circle cx="${cx}" cy="${cy}" r="${r * 1.55}" fill="url(#alone)"/>
    <g filter="url(#ombra)"><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sole)"/>
    <ellipse cx="${cx - r * .3}" cy="${cy - r * .38}" rx="${r * .45}" ry="${r * .28}" fill="#fff" opacity=".55"/></g>`;

  const goccia = (x, y, s = 1) => `
    <path transform="translate(${x} ${y}) rotate(12) scale(${s})" d="M0 -11 C5 -4 8 1 8 5 A8 8 0 0 1 -8 5 C-8 1 -5 -4 0 -11 Z"
      fill="url(#goccia)" stroke="#1a5fd1" stroke-opacity=".35" stroke-width="1"/>
    <ellipse transform="translate(${x} ${y}) rotate(12) scale(${s})" cx="-3" cy="3" rx="2" ry="3.2" fill="#fff" opacity=".7"/>`;

  const fiocco = (x, y, s = 1) => {
    let r = "";
    for(let k = 0; k < 3; k++){
      const a = k * 60;
      r += `<line x1="0" y1="-9" x2="0" y2="9" transform="rotate(${a})"/>`;
    }
    return `<g transform="translate(${x} ${y}) scale(${s})" stroke-linecap="round">
      <g stroke="#7fb6ff" stroke-width="6">${r}</g><g stroke="#fff" stroke-width="3">${r}</g></g>`;
  };

  const fulmine = `<path filter="url(#ombra)" d="M68 76 L52 104 L64 104 L57 126 L84 94 L71 94 L79 76 Z"
      fill="url(#fulmine)" stroke="#e08600" stroke-width="2" stroke-linejoin="round"/>`;

  const nebbia = `<g filter="url(#ombra)" fill="url(#barra)">
      <rect x="26" y="94" width="74" height="8" rx="4"/><rect x="34" y="106" width="68" height="8" rx="4"/><rect x="30" y="118" width="60" height="7" rx="3.5"/></g>`;

  const DEF = `<defs>
    <filter id="ombra" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="5" stdDeviation="4.5" flood-color="#0b1a33" flood-opacity=".38"/></filter>
    <radialGradient id="sole" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#fffbe2"/><stop offset=".35" stop-color="#ffe066"/><stop offset=".75" stop-color="#ffb21c"/><stop offset="1" stop-color="#ff8a00"/></radialGradient>
    <radialGradient id="alone"><stop offset=".55" stop-color="#ffd23a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb000" stop-opacity="0"/></radialGradient>
    <linearGradient id="goccia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8ecff"/><stop offset=".5" stop-color="#4fb4ff"/><stop offset="1" stop-color="#1e6dff"/></linearGradient>
    <linearGradient id="fulmine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7a6"/><stop offset=".55" stop-color="#ffd21a"/><stop offset="1" stop-color="#ff9a00"/></linearGradient>
    <linearGradient id="barra" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c3d0e2"/></linearGradient>
    <mask id="forma"><g fill="#fff">${NUVOLA}</g></mask>
    ${def("C", true)}${def("S", false)}
  </defs>`;

  const TIPI = {
    sereno:      () => sole(64, 64, 32),
    poconuvoloso:() => sole(46, 44, 25) + nuvola("C", true, "translate(10 14) scale(.9)"),
    nuvoloso:    () => nuvola("S", false, "translate(-14 -10) scale(.72)") + nuvola("C", true, "translate(6 10) scale(.92)"),
    nebbia:      () => nuvola("C", true, "translate(4 -12) scale(.9)") + nebbia,
    pioviggine:  () => nuvola("C", true, "translate(0 -12)") + goccia(52, 104, .95) + goccia(78, 108, .95),
    pioggia:     () => nuvola("S", false, "translate(0 -14)") + goccia(42, 102, 1.2) + goccia(65, 112, 1.2) + goccia(88, 102, 1.2),
    rovesci:     () => sole(42, 36, 24) + nuvola("C", true, "translate(10 -2) scale(.86)") + goccia(56, 110, 1.15) + goccia(82, 114, 1.15),
    neve:        () => nuvola("C", true, "translate(0 -14)") + fiocco(42, 102) + fiocco(66, 114) + fiocco(88, 100),
    temporale:   () => nuvola("S", false, "translate(0 -16)") + goccia(38, 98, .85) + goccia(94, 98, .85) + fulmine
  };

  function tipoIcona(c){
    if(c === 0) return "sereno";
    if(c <= 2) return "poconuvoloso";
    if(c === 3) return "nuvoloso";
    if(c <= 48) return "nebbia";
    if(c <= 57) return "pioviggine";
    if(c <= 67) return "pioggia";
    if(c <= 77) return "neve";
    if(c <= 82) return "rovesci";
    if(c <= 86) return "neve";
    return "temporale";
  }

  function iconaMeteo(c){
    const tipo = typeof c === "string" ? c : tipoIcona(c);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="256" height="256">${DEF}${TIPI[tipo]()}</svg>`;
  }

  // Precarica tutte le icone come immagini (per disegnarle su un canvas)
  async function caricaIcone(){
    const out = {};
    await Promise.all(Object.keys(TIPI).map(t => new Promise(ok => {
      const img = new Image();
      img.onload = () => { out[t] = img; ok(); };
      img.onerror = () => ok();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(iconaMeteo(t));
    })));
    return out;
  }

  const g = typeof window !== "undefined" ? window : globalThis;
  g.iconaMeteo = iconaMeteo; g.tipoIcona = tipoIcona; g.caricaIcone = caricaIcone; g.TIPI_ICONA = Object.keys(TIPI);
})();
