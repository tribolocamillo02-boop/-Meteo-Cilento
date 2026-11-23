/* Meteo Cilento — service worker
   - L'app si apre anche senza connessione (ultima versione salvata).
   - I dati meteo e mare vengono presi dalla rete; senza rete si usano
     gli ultimi scaricati.
   - Librerie, font e icone vengono salvati alla prima visita. */

const VERSIONE = "meteo-cilento-v4";
const GUSCIO = ["./", "index.html", "lingue.js", "manifest.webmanifest", "sponsor.json", "notifiche.json", "allerta.json", "balneazione.json", "privacy.html",
  "icone/icona-192.png", "icone/icona-512.png", "icone/apple-touch-icon.png", "icone/favicon-32.png"];

self.addEventListener("install", e => {
  // ogni file è salvato da solo: se uno manca, gli altri vengono comunque salvati
  e.waitUntil(caches.open(VERSIONE)
    .then(c => Promise.all(GUSCIO.map(f => c.add(f).catch(() => null))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(chiavi => Promise.all(chiavi.filter(k => k !== VERSIONE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Rete prima, poi copia salvata
async function retePrima(richiesta){
  const cache = await caches.open(VERSIONE);
  try{
    const risposta = await fetch(richiesta);
    if(risposta.ok) cache.put(richiesta, risposta.clone());
    return risposta;
  }catch(err){
    const salvata = await cache.match(richiesta, { ignoreSearch: richiesta.mode === "navigate" });
    if(salvata) return salvata;
    throw err;
  }
}

// Dati meteo: rete prima; la copia salvata porta l'ora del salvataggio
// e, se usata senza connessione, il segno "x-dalla-cache"
async function datiMeteo(richiesta){
  const cache = await caches.open(VERSIONE);
  try{
    const risposta = await fetch(richiesta);
    if(risposta.ok){
      const corpo = await risposta.clone().blob();
      const intestazioni = new Headers(risposta.headers);
      intestazioni.set("x-salvato", String(Date.now()));
      cache.put(richiesta, new Response(corpo, { status: 200, headers: intestazioni }));
    }
    return risposta;
  }catch(err){
    const salvata = await cache.match(richiesta);
    if(!salvata) throw err;
    const intestazioni = new Headers(salvata.headers);
    intestazioni.set("x-dalla-cache", "1");
    return new Response(await salvata.blob(), { status: 200, headers: intestazioni });
  }
}

// Copia salvata subito, aggiornata in sottofondo
async function salvataPrima(richiesta){
  const cache = await caches.open(VERSIONE);
  const salvata = await cache.match(richiesta);
  const dallaRete = fetch(richiesta).then(r => {
    if(r.ok || r.type === "opaque") cache.put(richiesta, r.clone());
    return r;
  }).catch(() => salvata);
  return salvata || dallaRete;
}

self.addEventListener("fetch", e => {
  const r = e.request;
  if(r.method !== "GET") return;
  const url = new URL(r.url);

  // Pagina dell'app e file del sito
  if(r.mode === "navigate" || url.origin === location.origin){
    e.respondWith(retePrima(r));
    return;
  }
  // Dati meteo e mare
  if(url.hostname.endsWith("open-meteo.com")){
    e.respondWith(datiMeteo(r));
    return;
  }
  // Librerie e font
  if(url.hostname === "unpkg.com" || url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")){
    e.respondWith(salvataPrima(r));
  }
  // Tutto il resto (radar, mappe, foto) va direttamente in rete
});

// Notifiche push (allerte e pioggia in arrivo)
self.addEventListener("push", e => {
  let dati = {};
  try{ dati = e.data ? e.data.json() : {}; }catch(err){ dati = { testo: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(dati.titolo || "Meteo Cilento", {
    body: dati.testo || "",
    icon: "icone/icona-192.png",
    badge: "icone/favicon-32.png",
    tag: dati.tag || undefined,
    renotify: !!dati.tag,
    data: { url: dati.url || "./" }
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const destinazione = new URL(e.notification.data?.url || "./", self.registration.scope).href;
  e.waitUntil((async () => {
    const finestre = await self.clients.matchAll({ type:"window", includeUncontrolled:true });
    for(const f of finestre){
      if(f.url.startsWith(self.registration.scope)){ await f.focus(); f.navigate(destinazione); return; }
    }
    await self.clients.openWindow(destinazione);
  })());
});
