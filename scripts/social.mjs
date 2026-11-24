// Robot di Cilento Meteo per Instagram.
//
//   node scripts/social.mjs decidi    → scrive in social/compiti.json cosa pubblicare adesso
//   node scripts/social.mjs genera    → crea le immagini con social.html (Playwright)
//   node scripts/social.mjs pubblica  → pubblica su Instagram e aggiorna social/stato.json
//   node scripts/social.mjs rinnova   → rinnova il token di Instagram (stampa il nuovo token)
//
// Variabili d'ambiente:
//   IG_TOKEN   token di Instagram (segreto del repository)
//   PROVA=1    non pubblica davvero: stampa soltanto
//   FORZA=storia,weekend,allerta   pubblica questi contenuti anche fuori orario
//   URL_BASE   indirizzo pubblico delle immagini (predefinito: raw.githubusercontent.com al commit attuale)

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CARTELLA = path.join(RADICE, "social");
const IMMAGINI = path.join(CARTELLA, "immagini");
const STATO = path.join(CARTELLA, "stato.json");
const COMPITI = path.join(CARTELLA, "compiti.json");
// Token «Instagram Login» (IGAA…) → graph.instagram.com, con rinnovo ogni 60 giorni.
// Token «utente di sistema» / accesso unificato (EAA…) → graph.facebook.com, non scade.
const TOKEN_FACEBOOK = (process.env.IG_TOKEN || "").startsWith("EAA");
const API = process.env.IG_API || (TOKEN_FACEBOOK ? "https://graph.facebook.com/v23.0" : "https://graph.instagram.com/v23.0");
// ID dell'account Instagram @cilentometeo (pubblico, si vede nella dashboard di Meta)
const ID_INSTAGRAM = process.env.IG_UTENTE || "17841456978976858";
const ORDINE_ALLERTA = ["verde", "gialla", "arancione", "rossa"];

// Post che mostrano l'app: a rotazione, il martedì e il sabato
const PROMO = [
  { id:"paesi", paese:"santa-maria-di-castellabate", sez:"meteo",
    titolo:"Il meteo di tutti i 118 paesi del Cilento",
    sotto:"Dal mare alla montagna, con la foto del paese che cambia con il tempo",
    testo:"Da Agropoli a Sapri, dagli Alburni al Vallo di Diano: su Cilento Meteo trovi le previsioni di ogni paese e località di mare del Cilento, con la foto che cambia insieme al tempo ☀️🌧️❄️" },
  { id:"radar", paese:"agropoli", sez:"radar", attesa:18000, scorri:"#sezione-radar",
    titolo:"Il radar della Protezione Civile, in diretta",
    sotto:"Guarda dove piove adesso, aggiornato ogni 5 minuti",
    testo:"Sta per piovere? 🌧️ Guardalo sul radar ufficiale della Protezione Civile: vedi dove piove adesso e dove sta andando la pioggia, aggiornato ogni 5 minuti." },
  { id:"mare", paese:"palinuro", sez:"mare",
    titolo:"Dove andare al mare oggi?",
    sotto:"Onde, vento e temperatura dell'acqua di tutte le spiagge",
    testo:"🌊 Qual è il mare più calmo oggi? Cilento Meteo te lo dice: onde, vento e temperatura dell'acqua di tutte le spiagge del Cilento, e d'estate anche i divieti di balneazione ufficiali." },
  { id:"ore", paese:"acciaroli", sez:"meteo", scorri:'[data-tendina="ore24"]',
    titolo:"Il meteo ora per ora",
    sotto:"Pioggia, vento e temperatura di ogni ora, per 7 giorni",
    testo:"⏱️ Previsioni ora per ora per i prossimi 7 giorni: temperatura, pioggia e vento di ogni ora, per programmare la giornata senza sorprese." },
  { id:"allerte", paese:"vallo-della-lucania", sez:"allerte",
    titolo:"Le allerte ufficiali, subito",
    sotto:"Il bollettino della Protezione Civile per la tua zona",
    testo:"⚠️ Allerta gialla, arancione o rossa? Su Cilento Meteo trovi il bollettino ufficiale della Protezione Civile per la tua zona, spiegato in modo semplice, con i numeri utili." },
  { id:"montagna", paese:"piaggine", sez:"montagna",
    titolo:"Anche in montagna",
    sotto:"Meteo in vetta, vento e zero termico per le escursioni",
    testo:"⛰️ Monte Cervati, Alburni, Gelbison: il meteo calcolato alla quota della vetta, con vento in cima, zero termico e un giudizio per salire oggi e nei prossimi giorni." },
  { id:"installa", paese:"marina-di-camerota", sez:"meteo",
    titolo:"Installala gratis sul telefono",
    sotto:"cilentometeo.it → Condividi → «Aggiungi alla schermata Home»",
    testo:"📲 Cilento Meteo si installa come un'app, gratis e senza registrazione: apri cilentometeo.it, tocca Condividi e poi «Aggiungi alla schermata Home». Su Android tocca «Installa»." },
  { id:"ore-migliori", paese:"marina-di-ascea", sez:"meteo", scorri:'[data-tendina="ore-migliori"]',
    titolo:"Le ore migliori di oggi",
    sotto:"Per il mare, una passeggiata o un giro in bici",
    testo:"🕐 Quando conviene uscire oggi? Cilento Meteo ti indica le ore migliori della giornata per il mare, una passeggiata o un giro in bici." }
];
// Paesi per i Reel (slug come nei link dell'app)
const PAESI_REEL = [
  ["Agropoli", "agropoli", 40.3492, 14.9907],
  ["Castellabate", "castellabate", 40.2821, 14.9574],
  ["Acciaroli", "acciaroli", 40.181, 15.0272],
  ["Palinuro", "palinuro", 40.0368, 15.2881],
  ["Marina di Camerota", "marina-di-camerota", 40.0036, 15.3672],
  ["Sapri", "sapri", 40.0746, 15.6321],
  ["Vallo della Lucania", "vallo-della-lucania", 40.2279, 15.2663],
  ["Sala Consilina", "sala-consilina", 40.4013, 15.5914]
];
// Luogo dei post: «Cilento Coast» (instagram.com/explore/locations/681518622)
const LUOGO = process.env.IG_LUOGO || "681518622";
// I video li scarica Instagram dal sito (GitHub Pages li serve come video/mp4)
const SITO = process.env.SITO || "https://cilentometeo.it";

const HASHTAG_PROMO = "#cilento #meteocilento #cilentocoast #cilentomeraviglie #cilentolandia #cilentolovers #cilentogram #cilentoemenevanto #salerno";

const leggi = (f, base) => { try{ return JSON.parse(fs.readFileSync(f, "utf8")); }catch(e){ return base; } };
const scrivi = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive:true }); fs.writeFileSync(f, JSON.stringify(v, null, 2) + "\n"); };
const attendi = ms => new Promise(ok => setTimeout(ok, ms));

// Data e ora in Italia
function adessoRoma(){
  const parti = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone:"Europe/Rome", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", weekday:"short", hourCycle:"h23"
  }).formatToParts(new Date()).map(p => [p.type, p.value]));
  return { data:`${parti.year}-${parti.month}-${parti.day}`, ora:Number(parti.hour), giorno:parti.weekday };
}

// La stessa regola di social.html: l'allerta peggiore da oggi in poi
function allertaAttuale(oggi){
  const a = leggi(path.join(RADICE, "allerta.json"), null);
  if(!a || !a.giorni) return null;
  for(const [data, zone] of Object.entries(a.giorni).sort()){
    if(data < oggi) continue;
    let peggiore = 0;
    for(const v of Object.values(zone)) peggiore = Math.max(peggiore, ORDINE_ALLERTA.indexOf(v.livello));
    if(peggiore > 0) return { chiave:`${a.id}:${data}:${ORDINE_ALLERTA[peggiore]}`, data, livello:ORDINE_ALLERTA[peggiore] };
  }
  return null;
}

/* ---------------- decidi ---------------- */

/* ---------------- Post «notizia» con la mappa ---------------- */

// Paesi scritti sulla mappa
const PAESI_MAPPA = [
  ["Agropoli", 40.3492, 14.9907], ["Castellabate", 40.2821, 14.9574, "dx"], ["Acciaroli", 40.181, 15.0272],
  ["Ascea", 40.1426, 15.1837, "sx"], ["Palinuro", 40.0368, 15.2881], ["Sapri", 40.0746, 15.6321],
  ["Vallo della Lucania", 40.2279, 15.2663], ["Sala Consilina", 40.4013, 15.5914],
  ["Roccadaspide", 40.4255, 15.1918], ["Piaggine", 40.345, 15.3778]
];
const ZONE_NOTIZIA = {
  "Costa nord": ["Agropoli", "Castellabate", "Acciaroli"],
  "Costa sud": ["Ascea", "Palinuro", "Sapri"],
  "Entroterra": ["Vallo della Lucania", "Piaggine", "Roccadaspide"],
  "Vallo di Diano": ["Sala Consilina"]
};

async function meteoGriglia(){
  const R = JSON.parse(fs.readFileSync(path.join(CARTELLA, "rilievo.json"), "utf8"));
  const G = 10, punti = [];
  for(let i = 0; i < G; i++) for(let j = 0; j < G; j++)
    punti.push([R.nord + (R.sud - R.nord) * i / (G - 1), R.ovest + (R.est - R.ovest) * j / (G - 1)]);
  const tutti = punti.concat(PAESI_MAPPA.map(p => [p[1], p[2]]));
  const url = "https://api.open-meteo.com/v1/forecast?latitude=" + tutti.map(p => p[0].toFixed(3)).join(",")
    + "&longitude=" + tutti.map(p => p[1].toFixed(3)).join(",")
    + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_gusts_10m_max&timezone=Europe%2FRome&forecast_days=3";
  const r = await fetch(url);
  if(!r.ok) throw new Error("Open-Meteo " + r.status);
  const j = await r.json();
  const lista = Array.isArray(j) ? j : [j];
  return { G, griglia:lista.slice(0, G * G).map(x => x.daily), paesi:lista.slice(G * G).map((x, k) => ({ nome:PAESI_MAPPA[k][0], lat:PAESI_MAPPA[k][1], lon:PAESI_MAPPA[k][2], lato:PAESI_MAPPA[k][3], d:x.daily })) };
}

// Sceglie il titolo più importante per il giorno indicato (1 = domani). Solo fatti veri, presi dai dati.
function scegliNotizia(m, g){
  const P = m.paesi.map(p => ({ nome:p.nome, codice:p.d.weather_code[g], max:p.d.temperature_2m_max[g], min:p.d.temperature_2m_min[g],
    pioggia:p.d.precipitation_sum[g] || 0, neve:p.d.snowfall_sum[g] || 0, raffica:p.d.wind_gusts_10m_max[g] || 0 }));
  const top = (k, dir = 1) => P.slice().sort((a, b) => dir * (b[k] - a[k]))[0];
  const giorno = g === 0 ? "OGGI" : g === 1 ? "DOMANI" : comeGiorno(m.paesi[0].d.time[g]).toUpperCase();
  const gm = g === 0 ? "oggi" : g === 1 ? "domani" : comeGiorno(m.paesi[0].d.time[g]);
  const piove = top("pioggia"), caldo = top("max"), freddo = top("min", -1), vento = top("raffica"), neve = top("neve");
  const temporali = P.filter(p => p.codice >= 95).map(p => p.nome);
  let n;
  if(neve.neve >= 0.5) n = { tipo:"neve", var:"neve", titolo:`NEVE ${giorno} SUI MONTI DEL CILENTO: FINO A ${Math.round(neve.neve)} CM`, gancio:`❄️ ${gm.charAt(0).toUpperCase() + gm.slice(1)} arriva la neve sulle montagne del Cilento. Ecco dove.` };
  else if(temporali.length >= 2 || (temporali.length && piove.pioggia >= 15)) n = { tipo:"temporali", var:"pioggia", titolo:`TEMPORALI ${giorno} NEL CILENTO: ECCO LE ZONE PIÙ COLPITE`, gancio:`⛈️ ${gm.charAt(0).toUpperCase() + gm.slice(1)} temporali sul Cilento: fino a ${Math.round(piove.pioggia)} mm di pioggia a ${piove.nome}. Ecco dove e quanto pioverà.` };
  else if(piove.pioggia >= 15) n = { tipo:"pioggia", var:"pioggia", titolo:`PIOGGIA FORTE ${giorno}: FINO A ${Math.round(piove.pioggia)} MM A ${piove.nome.toUpperCase()}`, gancio:`🌧️ ${gm.charAt(0).toUpperCase() + gm.slice(1)} giornata di pioggia intensa nel Cilento. Ecco le zone più colpite.` };
  else if(vento.raffica >= 55) n = { tipo:"vento", var:"vento", titolo:`VENTO FORTE ${giorno} NEL CILENTO: RAFFICHE FINO A ${Math.round(vento.raffica)} KM/H`, gancio:`💨 ${gm.charAt(0).toUpperCase() + gm.slice(1)} vento forte sul Cilento, attenzione in mare e in montagna.` };
  else if(caldo.max >= 32) n = { tipo:"caldo", var:"max", titolo:`CALDO ${giorno} NEL CILENTO: FINO A ${Math.round(caldo.max)}° A ${caldo.nome.toUpperCase()}`, gancio:`🔥 ${gm.charAt(0).toUpperCase() + gm.slice(1)} picco di caldo nel Cilento. Ecco dove farà più caldo.` };
  else if(freddo.min <= 1) n = { tipo:"freddo", var:"min", titolo:`FREDDO ${giorno} NEL CILENTO: MINIME FINO A ${Math.round(freddo.min)}° A ${freddo.nome.toUpperCase()}`, gancio:`🥶 ${gm.charAt(0).toUpperCase() + gm.slice(1)} mattina gelida nel Cilento. Ecco dove farà più freddo.` };
  else if(piove.pioggia >= 2) n = { tipo:"pioggia", var:"pioggia", titolo:`PIOGGIA ${giorno} NEL CILENTO: ECCO DOVE E QUANTO`, gancio:`🌦️ ${gm.charAt(0).toUpperCase() + gm.slice(1)} torna la pioggia nel Cilento. Ecco le zone interessate.` };
  else n = { tipo:"sole", var:"max", titolo:`SOLE ${giorno} SU TUTTO IL CILENTO: MASSIME FINO A ${Math.round(caldo.max)}°`, gancio:`☀️ ${gm.charAt(0).toUpperCase() + gm.slice(1)} bel tempo su tutto il Cilento. Ecco le temperature paese per paese.` };
  // Importanza: serve a decidere se pubblicare anche fuori dai giorni fissi
  n.importante = ["neve", "temporali", "vento", "caldo", "freddo"].includes(n.tipo) || (n.tipo === "pioggia" && piove.pioggia >= 15);
  n.giorno = giorno; n.indice = g;
  // Riassunto per zone, per la didascalia
  const righe = Object.entries(ZONE_NOTIZIA).map(([zona, nomi]) => {
    const q = P.filter(p => nomi.includes(p.nome));
    const mx = Math.round(Math.max(...q.map(p => p.max))), mn = Math.round(Math.min(...q.map(p => p.min)));
    const mm = Math.max(...q.map(p => p.pioggia));
    const em = mm >= 10 ? "🌧️" : mm >= 1 ? "🌦️" : q.some(p => p.codice >= 3) ? "⛅" : "☀️";
    return `${em} ${zona}: ${mn}°/${mx}°${mm >= 1 ? ` · ${Math.round(mm)} mm` : ""}`;
  });
  n.didascalia = `${n.gancio}\n\n${righe.join("\n")}\n\n👉 Le previsioni ora per ora del tuo paese su cilentometeo.it (link in bio)\n💾 Salva il post e condividilo con chi deve venire nel Cilento\n\n#cilento #meteocilento #meteo #cilentonotizie #cilentolovers #cilentocoast #salerno #campania #previsionimeteo`;
  return n;
}
const comeGiorno = s => new Date(s + "T12:00:00").toLocaleDateString("it-IT", { weekday:"long", day:"numeric" });

// Dove piove adesso? (precipitazione degli ultimi 15 minuti, Open-Meteo)
async function pioggiaAdesso(){
  try{
    const lat = PAESI_REEL.map(p => p[2]).join(","), lon = PAESI_REEL.map(p => p[3]).join(",");
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=precipitation,rain,showers&timezone=Europe%2FRome`);
    if(!r.ok) return null;
    const j = await r.json();
    const lista = (Array.isArray(j) ? j : [j]).map((x, k) => ({ paese:PAESI_REEL[k], mm:(x.current && x.current.precipitation) || 0 }));
    lista.sort((a, b) => b.mm - a.mm);
    return lista[0];
  }catch(e){ return null; }
}

async function decidi(){
  const stato = leggi(STATO, {});
  const { data, ora, giorno } = adessoRoma();
  const forza = (process.env.FORZA || "").split(",").map(s => s.trim()).filter(Boolean);
  const compiti = [];

  // Ogni sera dalle 19: la storia con il meteo di domani
  if(forza.includes("storia") || (ora >= 19 && ora <= 22 && stato.storia !== data)) compiti.push("storia");

  // Il giovedì dalle 17: il post del weekend
  if(forza.includes("weekend") || (giorno === "Thu" && ora >= 17 && ora <= 22 && stato.weekend !== data)) compiti.push("weekend");

  // Martedì e sabato tra le 12 e le 15: un post che mostra l'app
  if(forza.includes("promo") || ((giorno === "Tue" || giorno === "Sat") && ora >= 12 && ora <= 15 && stato.promo !== data)) compiti.push("promo");

  // Kit di benvenuto (una volta sola, da fissare in cima al profilo):
  // un Reel «Come si usa» e un carosello «Cos'è Cilento Meteo», tra le 9 e le 21
  if(forza.includes("reel-guida") || (!stato["reel-guida"] && ora >= 9 && ora <= 21)) compiti.push("reel-guida");
  if(forza.includes("carosello") || (!stato.carosello && ora >= 9 && ora <= 21)) compiti.push("carosello");

  // Post «notizia» con la mappa: lunedì e mercoledì tra le 13 e le 15,
  // e ogni altro giorno se domani c'è qualcosa di importante (temporali, neve, vento, caldo, freddo)
  let notizia = null;
  if(forza.includes("notizia") || (ora >= 13 && ora <= 15 && stato.notizia !== data)){
    try{
      const m = await meteoGriglia();
      const n = scegliNotizia(m, 1);
      if(forza.includes("notizia") || giorno === "Mon" || giorno === "Wed" || n.importante){
        compiti.push("notizia");
        notizia = { meteo:m, scelta:n };
        console.log("Notizia:", n.titolo);
      }
    }catch(e){ console.warn("Notizia saltata:", e.message); }
  }

  // Reel del weekend: il venerdì tra le 12 e le 15
  if(forza.includes("reel-weekend") || (giorno === "Fri" && ora >= 12 && ora <= 15 && stato["reel-weekend"] !== data)) compiti.push("reel-weekend");

  // Reel del radar: quando piove nel Cilento, al massimo uno al giorno, tra le 8 e le 20
  let reelPaese = null;
  if(forza.includes("reel-radar") || (ora >= 8 && ora <= 20 && stato["reel-radar"] !== data)){
    const p = await pioggiaAdesso();
    if(p && (p.mm >= 0.3 || forza.includes("reel-radar"))){
      compiti.push("reel-radar");
      reelPaese = p.paese[1];
      console.log(`Pioggia adesso: ${p.paese[0]} ${p.mm} mm`);
    }
  }

  // Allerta gialla, arancione o rossa: una volta per bollettino, tra le 7 e le 23
  const allerta = allertaAttuale(data);
  if(allerta && (forza.includes("allerta") || (ora >= 7 && ora <= 23 && stato.allerta !== allerta.chiave))) compiti.push("allerta");

  // Il token dura 60 giorni: lo rinnoviamo ogni 7
  let rinnovo = !TOKEN_FACEBOOK && (!stato.rinnovo || (Date.now() - Date.parse(stato.rinnovo)) > 7 * 864e5);

  // Finché Instagram non è collegato non si fa niente (tranne in prova)
  if(!process.env.IG_TOKEN && process.env.PROVA !== "1"){
    console.log("Instagram non è ancora collegato (manca il segreto IG_TOKEN)");
    compiti.length = 0;
    rinnovo = false;
  }

  scrivi(COMPITI, { data, compiti, allerta, rinnovo, reelPaese, notizia });
  console.log(`Italia: ${data} ore ${ora} (${giorno}). Da pubblicare: ${compiti.join(", ") || "niente"}. Rinnovo token: ${rinnovo ? "sì" : "no"}`);
  if(process.env.GITHUB_OUTPUT){
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `compiti=${compiti.join(",")}\nrinnovo=${rinnovo ? "1" : ""}\n`);
  }
}

/* ---------------- genera ---------------- */

function servitore(){
  const tipi = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".json":"application/json", ".png":"image/png", ".jpg":"image/jpeg", ".webmanifest":"application/manifest+json" };
  const s = http.createServer((req, res) => {
    const p = path.join(RADICE, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if(!p.startsWith(RADICE) || !fs.existsSync(p) || fs.statSync(p).isDirectory()){ res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": tipi[path.extname(p)] || "application/octet-stream" });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise(ok => s.listen(0, "127.0.0.1", () => ok(s)));
}

async function genera(){
  const { data, compiti } = leggi(COMPITI, { compiti:[] });
  if(!compiti.length){ console.log("Niente da generare"); return; }
  const { chromium } = await import("playwright");
  const s = await servitore();
  const browser = await chromium.launch();
  try{
    const pagina = await browser.newPage({ locale:"it-IT", timezoneId:"Europe/Rome" });
    pagina.on("console", m => console.log("[pagina]", m.text()));
    await pagina.goto(`http://127.0.0.1:${s.address().port}/social.html`);
    await pagina.waitForFunction(() => {
      const t = document.getElementById("stato").textContent;
      return /aggiornate|Non riesco/.test(t);
    }, null, { timeout:60000 });
    const esito = await pagina.evaluate(() => {
      if(!dati) return null;
      const jpg = c => c ? c.toDataURL("image/jpeg", .92).split(",")[1] : null;
      return {
        storia: jpg(tele.storia), weekend: jpg(tele.weekend), allerta: jpg(tele.allerta),
        testi: { storia: testi.storia, weekend: testi.weekend, allerta: testi.allerta }
      };
    });
    if(!esito) throw new Error("La pagina non ha caricato le previsioni");

    fs.mkdirSync(IMMAGINI, { recursive:true });
    // Tiene solo le immagini degli ultimi 7 giorni
    const limite = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    for(const f of fs.readdirSync(IMMAGINI)) if(f.slice(0, 10) < limite) fs.unlinkSync(path.join(IMMAGINI, f));

    const file = {};
    if(compiti.includes("promo")){
      const stato = leggi(STATO, {});
      const indice = (stato.promoIndice || 0) % PROMO.length;
      const p = PROMO[indice];
      const nome = `${data}-promo-${p.id}.jpg`;
      fs.writeFileSync(path.join(IMMAGINI, nome), await creaPromo(browser, s.address().port, p));
      file.promo = nome;
      esito.testi.promo = `${p.titolo} ✨\n\n${p.testo}\n\n📲 Gratis su 👉 cilentometeo.it (link in bio)\n\n${HASHTAG_PROMO}`;
      console.log("Creata", nome);
    }
    const cc = leggi(COMPITI, {});
    if(compiti.includes("reel-radar")){
      const nome = `${data}-reel-radar.mp4`;
      await creaReelRadar(browser, s.address().port, cc.reelPaese || "agropoli", path.join(IMMAGINI, nome));
      file["reel-radar"] = nome;
      esito.testi["reel-radar"] = `🌧️ Piove nel Cilento: ecco il radar della Protezione Civile in diretta.\n\nGuarda dove piove adesso e dove sta andando la pioggia, paese per paese, aggiornato ogni 5 minuti.\n\n📲 Gratis su 👉 cilentometeo.it (link in bio)\n\n#cilento #meteocilento #cilentonotizie #pioggia #radarmeteo #maltempo #cilentolovers #salerno #protezionecivile`;
      console.log("Creato", nome);
    }
    if(compiti.includes("reel-weekend")){
      const nome = `${data}-reel-weekend.mp4`;
      await creaReelWeekend(browser, s.address().port, path.join(IMMAGINI, nome));
      file["reel-weekend"] = nome;
      esito.testi["reel-weekend"] = `☀️ Che tempo farà nel weekend nel Cilento?\n\nDal mare alla montagna: previsioni ora per ora per tutti i 118 paesi, mare, radar e allerte.\n\n📲 Gratis su 👉 cilentometeo.it (link in bio)\n\n#cilento #meteocilento #weekend #cilentocoast #cilentomeraviglie #cilentolovers #cilentogram #palinuro #agropoli #sapri`;
      console.log("Creato", nome);
    }
    if(compiti.includes("notizia")){
      const nome = `${data}-notizia.jpg`;
      fs.writeFileSync(path.join(IMMAGINI, nome), await creaNotizia(browser, cc.notizia));
      file.notizia = nome;
      esito.testi.notizia = cc.notizia.scelta.didascalia;
      console.log("Creata", nome);
    }
    if(compiti.includes("reel-guida")){
      const nome = `${data}-reel-guida.mp4`;
      await creaReelGuida(browser, s.address().port, path.join(IMMAGINI, nome));
      file["reel-guida"] = nome;
      esito.testi["reel-guida"] = `Come si usa Cilento Meteo in 20 secondi ⏱️\n\n1️⃣ Scegli il tuo paese (o usa la posizione)\n2️⃣ Guarda il meteo ora per ora\n3️⃣ Scopri dove il mare è più calmo\n4️⃣ Segui la pioggia sul radar in diretta\n5️⃣ Controlla le allerte ufficiali\n\n📲 Gratis, senza registrazione: 👉 cilentometeo.it (link in bio)\n\n${HASHTAG_PROMO}`;
      console.log("Creato", nome);
    }
    if(compiti.includes("carosello")){
      const nomi = [];
      const copertina = `${data}-carosello-0.jpg`;
      fs.writeFileSync(path.join(IMMAGINI, copertina), await creaCopertina(browser));
      nomi.push(copertina);
      for(const id of ["paesi", "ore", "mare", "radar", "allerte", "montagna", "installa"]){
        const p = PROMO.find(x => x.id === id);
        const nome = `${data}-carosello-${nomi.length}.jpg`;
        fs.writeFileSync(path.join(IMMAGINI, nome), await creaPromo(browser, s.address().port, p));
        nomi.push(nome);
      }
      file.carosello = nomi;
      esito.testi.carosello = `Benvenuto su Cilento Meteo 👋\n\nIl meteo di tutti i 118 paesi del Cilento, dal mare alla montagna, in un'unica app gratuita. Scorri 👉 per vedere cosa puoi fare:\n\n☀️ Previsioni ora per ora per 7 giorni\n🌊 Il mare più calmo di oggi\n📡 Il radar della Protezione Civile in diretta\n⚠️ Le allerte ufficiali\n⛰️ Il meteo in vetta per le escursioni\n\n📲 Si installa sul telefono come un'app: 👉 cilentometeo.it (link in bio)\n\n${HASHTAG_PROMO}`;
      console.log("Creato il carosello:", nomi.length, "immagini");
    }
    for(const tipo of compiti){
      if(tipo === "promo" || tipo === "carosello" || tipo === "notizia" || tipo.startsWith("reel-")) continue;
      if(!esito[tipo]) throw new Error(`Immagine ${tipo} non disponibile`);
      const nome = `${data}-${tipo}.jpg`;
      fs.writeFileSync(path.join(IMMAGINI, nome), Buffer.from(esito[tipo], "base64"));
      file[tipo] = nome;
      console.log("Creata", nome);
    }
    const c = leggi(COMPITI, {});
    scrivi(COMPITI, { ...c, file, testi: esito.testi });
  }finally{
    await browser.close();
    s.close();
  }
}

/* ---------------- Post che mostrano l'app ---------------- */

async function creaPromo(browser, porta, p){
  // 1. Screenshot vero dell'app, come su un iPhone
  const telefono = await browser.newContext({
    viewport:{ width:390, height:844 }, deviceScaleFactor:3, isMobile:true, hasTouch:true,
    locale:"it-IT", timezoneId:"Europe/Rome", serviceWorkers:"block"
  });
  await telefono.addInitScript(() => {
    try{
      localStorage.setItem("meteoCilento.leggera", "no");
      localStorage.setItem("meteoCilento.installaNo", String(Date.now()));
      localStorage.setItem("meteoCilento.lingua", "it");
    }catch(e){}
  });
  const app = await telefono.newPage();
  await app.goto(`http://127.0.0.1:${porta}/index.html?paese=${p.paese}#${p.sez}`, { waitUntil:"load" });
  await app.waitForTimeout(p.attesa || 10000);
  if(p.scorri){
    await app.evaluate(sel => {
      const el = document.querySelector(sel);
      if(el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70);
    }, p.scorri);
    await app.waitForTimeout(1500);
  }else{
    await app.evaluate(() => window.scrollTo(0, 0));
  }
  const schermata = (await app.screenshot({ type:"jpeg", quality:92 })).toString("base64");
  await telefono.close();

  // 2. Grafica del post (1080×1350)
  const logo = fs.readFileSync(path.join(RADICE, "icone/icona-192.png")).toString("base64");
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
  const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;overflow:hidden;font-family:Inter,Arial,sans-serif;color:#f4f8ff;
background:radial-gradient(ellipse 80% 45% at 50% 0%,rgba(47,125,255,.55),transparent 70%),radial-gradient(ellipse 60% 40% at 100% 100%,rgba(47,125,255,.22),transparent 70%),linear-gradient(#061433,#030a1c 50%,#02040a);}
.marchio{position:absolute;top:62px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:20px;font:700 32px "Space Grotesk",Inter,sans-serif;letter-spacing:8px}
.marchio img{width:60px;height:60px;border-radius:15px}
.testa{position:absolute;top:150px;left:70px;right:70px;height:300px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:18px;text-align:center}
h1{font-weight:800;font-size:66px;line-height:1.08;letter-spacing:-1px}
p{font-weight:500;font-size:31px;line-height:1.3;color:#8cc4ff;max-width:880px}
.telefono{position:absolute;top:478px;left:50%;width:600px;height:1300px;margin-left:-300px;border-radius:84px;padding:16px;
background:linear-gradient(145deg,#2a3552,#0b1222 40%,#1a2540);box-shadow:0 0 0 2px rgba(140,196,255,.35),0 40px 120px rgba(47,125,255,.45)}
.telefono img{display:block;width:100%;border-radius:68px}
.sito{position:absolute;right:44px;bottom:44px;padding:14px 30px;border-radius:999px;font-weight:800;font-size:28px;
background:rgba(5,14,36,.78);border:2px solid rgba(140,196,255,.5);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 10px 40px rgba(0,0,0,.5)}
</style></head><body>
<div class="marchio"><img src="data:image/png;base64,${logo}">CILENTO METEO</div>
<div class="testa"><h1>${esc(p.titolo)}</h1><p>${esc(p.sotto)}</p></div>
<div class="telefono"><img src="data:image/jpeg;base64,${schermata}"></div>
<div class="sito">cilentometeo.it</div>
</body></html>`;
  const grafica = await browser.newPage({ viewport:{ width:1080, height:1350 } });
  await grafica.setContent(html, { waitUntil:"networkidle" });
  await grafica.evaluate(() => document.fonts.ready);
  const jpg = await grafica.screenshot({ type:"jpeg", quality:92 });
  await grafica.close();
  return jpg;
}

/* ---------------- Reel (video 1080×1920) ---------------- */

import { execFileSync } from "node:child_process";

async function telefonoReel(browser){
  const ctx = await browser.newContext({
    viewport:{ width:360, height:640 }, deviceScaleFactor:3, isMobile:true, hasTouch:true,
    locale:"it-IT", timezoneId:"Europe/Rome", serviceWorkers:"block"
  });
  await ctx.addInitScript(() => {
    try{
      localStorage.setItem("meteoCilento.leggera", "no");
      localStorage.setItem("meteoCilento.installaNo", String(Date.now()));
      localStorage.setItem("meteoCilento.lingua", "it");
    }catch(e){}
  });
  return ctx;
}

// Titolo in alto, indirizzo in basso e cartello finale, sopra l'app
async function sovrapponi(pagina, titolo, sotto){
  await pagina.evaluate(([titolo, sotto]) => {
    const st = document.createElement("style");
    st.textContent = `
.topbar{visibility:hidden}
#reelTesta{position:fixed;z-index:99999;top:0;left:0;right:0;padding:26px 18px 34px;text-align:center;pointer-events:none;
background:linear-gradient(rgba(2,4,10,.92) 0%,rgba(2,4,10,.75) 60%,rgba(2,4,10,0));font-family:Inter,system-ui,sans-serif;color:#f4f8ff}
#reelTesta .m{font:700 10px/1 "Space Grotesk",Inter,sans-serif;letter-spacing:.32em;color:#8cc4ff;margin-bottom:8px}
#reelTesta .t{font-weight:800;font-size:25px;line-height:1.1;letter-spacing:-.3px}
#reelTesta .s{margin-top:6px;font-weight:600;font-size:13px;color:#cfe3ff}
#reelSito{position:fixed;z-index:99999;left:50%;bottom:92px;transform:translateX(-50%);padding:9px 20px;border-radius:999px;font:800 15px Inter,system-ui,sans-serif;color:#fff;
background:rgba(5,14,36,.8);border:1px solid rgba(140,196,255,.55);box-shadow:0 6px 24px rgba(0,0,0,.5);pointer-events:none}
#reelFine{position:fixed;z-index:100000;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:30px;
background:radial-gradient(ellipse 90% 50% at 50% 30%,rgba(47,125,255,.55),transparent 70%),linear-gradient(#061433,#02040a);font-family:Inter,system-ui,sans-serif;color:#f4f8ff}
#reelFine img{width:84px;height:84px;border-radius:22px;box-shadow:0 10px 40px rgba(47,125,255,.5)}
#reelFine .t{font-weight:800;font-size:30px;line-height:1.1}
#reelFine .s{font-size:16px;color:#8cc4ff;font-weight:600}
#reelFine .u{margin-top:8px;padding:12px 26px;border-radius:999px;font-weight:800;font-size:22px;background:linear-gradient(135deg,#2f7dff,#5aa2ff);box-shadow:0 10px 30px rgba(47,125,255,.45)}`;
    document.head.appendChild(st);
    const testa = document.createElement("div");
    testa.id = "reelTesta";
    testa.innerHTML = `<div class="m">CILENTO METEO</div><div class="t"></div><div class="s"></div>`;
    testa.querySelector(".t").textContent = titolo;
    testa.querySelector(".s").textContent = sotto || "";
    document.body.appendChild(testa);
    const sito = document.createElement("div");
    sito.id = "reelSito"; sito.textContent = "cilentometeo.it";
    document.body.appendChild(sito);
    const fine = document.createElement("div");
    fine.id = "reelFine";
    fine.innerHTML = `<img src="icone/icona-192.png" alt=""><div class="t">Il meteo di tutto il Cilento</div><div class="s">118 paesi · mare · radar · allerte</div><div class="u">cilentometeo.it</div><div class="s">Gratis, senza registrazione</div>`;
    document.body.appendChild(fine);
  }, [titolo, sotto]);
}

class Fotogrammi{
  constructor(cartella){ this.cartella = cartella; this.n = 0; fs.rmSync(cartella, { recursive:true, force:true }); fs.mkdirSync(cartella, { recursive:true }); }
  nome(k){ return path.join(this.cartella, `f${String(k).padStart(5, "0")}.jpg`); }
  async scatta(pagina, ripeti = 1){
    const f = this.nome(this.n++);
    await pagina.screenshot({ path:f, type:"jpeg", quality:90 });
    for(let k = 1; k < ripeti; k++) fs.copyFileSync(f, this.nome(this.n++));
  }
  video(uscita){
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", "30", "-i", path.join(this.cartella, "f%05d.jpg"),
      "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
      "-shortest", "-vf", "scale=1080:1920:flags=lanczos,format=yuv420p",
      "-c:v", "libx264", "-profile:v", "high", "-preset", "medium", "-crf", "19", "-r", "30",
      "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", uscita]);
    fs.rmSync(this.cartella, { recursive:true, force:true });
  }
}

const morbido = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

async function finale(pagina, ft){
  await pagina.evaluate(() => { document.getElementById("reelFine").style.display = "flex"; });
  await pagina.waitForTimeout(400);
  await ft.scatta(pagina, 75);   // 2,5 secondi
}

async function creaReelRadar(browser, porta, paese, uscita){
  const ctx = await telefonoReel(browser);
  const pagina = await ctx.newPage();
  await pagina.goto(`http://127.0.0.1:${porta}/index.html?paese=${paese}#radar`, { waitUntil:"load" });
  await pagina.waitForTimeout(15000);
  await sovrapponi(pagina, "Piove nel Cilento", "Il radar della Protezione Civile, in diretta");
  // Mappa più grande e ferma: i fotogrammi li scorriamo noi
  await pagina.evaluate(() => {
    const st = document.createElement("style");
    st.textContent = "#map{height:400px !important}";
    document.head.appendChild(st);
    window.dispatchEvent(new Event("resize"));
    const play = document.getElementById("radarPlay");
    if(play && play.getAttribute("aria-label") === "Pausa") play.click();
    const carta = document.querySelector("#sezione-radar .card");
    if(carta) window.scrollTo(0, carta.getBoundingClientRect().top + window.scrollY - 100);
  });
  await pagina.waitForTimeout(2500);
  const ft = new Fotogrammi(uscita + ".fotogrammi");
  const max = await pagina.evaluate(() => Number(document.getElementById("radarCursore").max) || 0);
  const inizio = Math.max(0, max - 17);     // circa l'ultima ora e mezza
  for(let giro = 0; giro < 2; giro++){
    for(let i = inizio; i <= max; i++){
      await pagina.evaluate(v => {
        const c = document.getElementById("radarCursore");
        c.value = v; c.dispatchEvent(new Event("input", { bubbles:true })); c.dispatchEvent(new Event("change", { bubbles:true }));
      }, i);
      await pagina.waitForTimeout(giro === 0 ? 900 : 250);
      await ft.scatta(pagina, i === max ? 24 : 9);
    }
  }
  await finale(pagina, ft);
  await ctx.close();
  ft.video(uscita);
}

async function creaNotizia(browser, { meteo, scelta }){
  const rilievo = JSON.parse(fs.readFileSync(path.join(CARTELLA, "rilievo.json"), "utf8"));
  const logo = fs.readFileSync(path.join(RADICE, "icone/icona-192.png")).toString("base64");
  const g = scelta.indice;
  const valori = meteo.griglia.map(d => scelta.var === "pioggia" ? d.precipitation_sum[g] : scelta.var === "neve" ? d.snowfall_sum[g]
    : scelta.var === "vento" ? d.wind_gusts_10m_max[g] : scelta.var === "min" ? d.temperature_2m_min[g] : d.temperature_2m_max[g]);
  const paesi = meteo.paesi.map(p => ({ nome:p.nome, lat:p.lat, lon:p.lon, lato:p.lato, codice:p.d.weather_code[g],
    t:Math.round(scelta.var === "min" ? p.d.temperature_2m_min[g] : p.d.temperature_2m_max[g]) }));
  const etichetta = { pioggia:"PIOGGIA (mm)", neve:"NEVE (cm)", vento:"RAFFICHE (km/h)", min:"TEMPERATURA MINIMA", max:"TEMPERATURA MASSIMA" }[scelta.var];
  const dati = JSON.stringify({ rilievo, G:meteo.G, valori, var:scelta.var, paesi });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
  const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@600;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;overflow:hidden;background:#02040a;font-family:Inter,Arial,sans-serif;color:#fff;position:relative}
canvas{position:absolute;left:0;top:0}
.marchio{position:absolute;top:34px;left:34px;display:flex;align-items:center;gap:14px;padding:12px 22px 12px 12px;border-radius:20px;background:rgba(2,6,18,.78);border:2px solid rgba(140,196,255,.35);font:700 26px "Space Grotesk",Inter,sans-serif;letter-spacing:5px}
.marchio img{width:52px;height:52px;border-radius:13px}
.legenda{position:absolute;top:44px;right:34px;padding:12px 18px;border-radius:16px;background:rgba(2,6,18,.78);border:2px solid rgba(255,255,255,.15);font-weight:800;font-size:19px;letter-spacing:1px;text-align:right}
.legenda .barra{width:300px;height:14px;border-radius:7px;margin:9px 0 5px}
.legenda .num{display:flex;justify-content:space-between;font-size:17px;font-weight:600;color:#cfe3ff}
.fondo{position:absolute;left:0;right:0;bottom:0;height:520px;background:linear-gradient(rgba(2,4,10,0),rgba(2,4,10,.7) 30%,#02040a 55%)}
.tag{position:absolute;left:44px;bottom:330px;padding:6px 14px 2px;background:#ffd400;color:#000;font:400 44px Anton,Impact,sans-serif;letter-spacing:1px}
h1{position:absolute;left:44px;right:44px;bottom:96px;font:400 72px/1.04 Anton,Impact,sans-serif;text-transform:uppercase;letter-spacing:.5px;text-shadow:0 4px 18px rgba(0,0,0,.6)}
.sito{position:absolute;left:0;right:0;bottom:32px;text-align:center;font-weight:800;font-size:30px;color:#8cc4ff}
</style></head><body>
<canvas id="c" width="1080" height="1350"></canvas>
<div class="marchio"><img src="data:image/png;base64,${logo}">CILENTO METEO</div>
<div class="legenda">${esc(etichetta)}<div class="barra" id="barra"></div><div class="num" id="num"></div></div>
<div class="fondo"></div>
<div class="tag">PREVISIONI ${esc(scelta.giorno)}</div>
<h1>${esc(scelta.titolo)}</h1>
<div class="sito">Il meteo del tuo paese su cilentometeo.it</div>
<script>
const D = ${dati};
const c = document.getElementById("c"), x = c.getContext("2d");
const W = 1080, H = 1350, R = D.rilievo;
// Area della mappa: tutta la larghezza, dall'alto fino a sotto il titolo
const MX = 0, MY = 0, MW = W, MH = 980;
const aPx = (lat, lon) => [MX + (lon - R.ovest) / (R.est - R.ovest) * MW, MY + (lat - R.nord) / (R.sud - R.nord) * MH];
function bilin(arr, righe, col, u, v){
  const fx = u * (col - 1), fy = v * (righe - 1), x0 = Math.floor(fx), y0 = Math.floor(fy);
  const x1 = Math.min(col - 1, x0 + 1), y1 = Math.min(righe - 1, y0 + 1), tx = fx - x0, ty = fy - y0;
  const a = arr[y0 * col + x0], b = arr[y0 * col + x1], cc = arr[y1 * col + x0], d = arr[y1 * col + x1];
  return (a * (1 - tx) + b * tx) * (1 - ty) + (cc * (1 - tx) + d * tx) * ty;
}
// Scale di colore
const SCALE = {
  pioggia:{ min:0, max:40, stop:[[0,"rgba(0,0,0,0)"],[.03,"rgba(70,140,255,.0)"],[.08,"#3c8cff"],[.22,"#20d080"],[.4,"#e8e23a"],[.6,"#ff8a1e"],[.8,"#ff2d2d"],[1,"#c63cff"]] },
  neve:{ min:0, max:30, stop:[[0,"rgba(0,0,0,0)"],[.05,"#9fd0ff"],[.4,"#c9a0ff"],[1,"#ffffff"]] },
  vento:{ min:20, max:90, stop:[[0,"rgba(0,0,0,0)"],[.15,"#3c8cff"],[.45,"#20d0c0"],[.7,"#ffd23f"],[1,"#ff3d3d"]] },
  max:{ min:0, max:38, stop:[[0,"#3b5bdb"],[.3,"#3c9cff"],[.5,"#20c997"],[.65,"#ffd23f"],[.82,"#ff8a1e"],[1,"#e8253c"]] },
  min:{ min:-6, max:20, stop:[[0,"#c9a0ff"],[.25,"#3b5bdb"],[.45,"#3c9cff"],[.65,"#20c997"],[.85,"#ffd23f"],[1,"#ff8a1e"]] }
}[D.var];
// Tavolozza da gradiente
const tav = document.createElement("canvas"); tav.width = 256; tav.height = 1;
const tx2 = tav.getContext("2d"); const gr = tx2.createLinearGradient(0, 0, 256, 0);
SCALE.stop.forEach(([p, col]) => gr.addColorStop(p, col)); tx2.fillStyle = gr; tx2.fillRect(0, 0, 256, 1);
const PAL = tx2.getImageData(0, 0, 256, 1).data;
document.getElementById("barra").style.background = "linear-gradient(90deg," + SCALE.stop.filter(s => s[0] >= .05).map(s => s[1] + " " + Math.round(s[0] * 100) + "%").join(",") + ")";
document.getElementById("num").innerHTML = "<span>" + SCALE.min + "</span><span>" + Math.round((SCALE.min + SCALE.max) / 2) + "</span><span>" + SCALE.max + "+</span>";

// 1. Rilievo: mare blu notte, terra ombreggiata come un satellite di notte
const img = x.createImageData(W, H), px = img.data;
const quota = (u, v) => bilin(R.quota, R.righe, R.colonne, Math.min(1, Math.max(0, u)), Math.min(1, Math.max(0, v)));
function sfoca(a, w, h, r){
  const t = new Float32Array(a.length);
  for(let pass = 0; pass < 2; pass++){
    for(let j = 0; j < h; j++){ let s = 0; for(let i = -r; i <= r; i++) s += a[j * w + Math.min(w - 1, Math.max(0, i))];
      for(let i = 0; i < w; i++){ t[j * w + i] = s / (2 * r + 1); s += a[j * w + Math.min(w - 1, i + r + 1)] - a[j * w + Math.max(0, i - r)]; } }
    for(let i = 0; i < w; i++){ let s = 0; for(let j = -r; j <= r; j++) s += t[Math.min(h - 1, Math.max(0, j)) * w + i];
      for(let j = 0; j < h; j++){ a[j * w + i] = s / (2 * r + 1); s += t[Math.min(h - 1, j + r + 1) * w + i] - t[Math.max(0, j - r) * w + i]; } }
  }
}
const Q = new Float32Array(W * H), TERRA = new Float32Array(W * H);
for(let j = 0; j < H; j++) for(let i = 0; i < W; i++){
  const q = j < MH ? quota(i / MW, j / MH) : 0;
  Q[j * W + i] = q;
  TERRA[j * W + i] = Math.min(1, Math.max(0, (q - 8) / 50));
}
sfoca(Q, W, H, 12); sfoca(TERRA, W, H, 3);
for(let j = 0; j < H; j++){
  for(let i = 0; i < W; i++){
    const k = j * W + i, m = TERRA[k];
    const prof = 1 - Math.min(1, j / H) * .35;
    let r = 6 * prof, g = 22 * prof, b = 48 * prof + 6;
    if(m > 0){
      const dzx = Q[k + (i < W - 1 ? 1 : 0)] - Q[k - (i > 0 ? 1 : 0)], dzy = Q[k + (j < H - 1 ? W : 0)] - Q[k - (j > 0 ? W : 0)];
      const ombra = Math.max(.45, Math.min(1.25, .88 - (dzx - dzy) * .06));
      const h = Math.min(1, Q[k] / 1500);
      const rr = (30 + 66 * h) * ombra, gg = (50 + 44 * h) * ombra, bb = (38 + 36 * h) * ombra;
      r = r * (1 - m) + rr * m; g = g * (1 - m) + gg * m; b = b * (1 - m) + bb * m;
    }
    // la mappa sfuma nel nero sotto, dove c'è il titolo
    const sf = j < 780 ? 1 : Math.max(0, 1 - (j - 780) / 230);
    px[k * 4] = r * sf + 2 * (1 - sf); px[k * 4 + 1] = g * sf + 4 * (1 - sf); px[k * 4 + 2] = b * sf + 10 * (1 - sf); px[k * 4 + 3] = 255;
  }
}
// 2. Colori del meteo sopra il rilievo
for(let j = 0; j < MH; j++){
  for(let i = 0; i < MW; i++){
    const val = bilin(D.valori, D.G, D.G, i / MW, j / MH);
    const t = Math.max(0, Math.min(1, (val - SCALE.min) / (SCALE.max - SCALE.min)));
    const sf = j < 780 ? 1 : Math.max(0, 1 - (j - 780) / 210);
    const p = Math.round(t * 255) * 4, a = PAL[p + 3] / 255 * (D.var === "max" || D.var === "min" ? .5 : .62) * sf;
    if(a <= 0) continue;
    const k = (j * W + i) * 4;
    px[k] = px[k] * (1 - a) + PAL[p] * a; px[k + 1] = px[k + 1] * (1 - a) + PAL[p + 1] * a; px[k + 2] = px[k + 2] * (1 - a) + PAL[p + 2] * a;
  }
}
x.putImageData(img, 0, 0);
// 3. Costa luminosa
x.save(); x.globalCompositeOperation = "lighter"; x.fillStyle = "rgba(140,196,255,.5)";
for(let j = 1; j < MH - 1; j++) for(let i = 1; i < W - 1; i++){
  const a = TERRA[j * W + i] >= .5;
  if(a !== (TERRA[j * W + i + 1] >= .5) || a !== (TERRA[(j + 1) * W + i] >= .5)) x.fillRect(i - 1, j - 1, 2.5, 2.5);
}
x.restore();
// 4. Paesi con icona e temperatura (dopo il caricamento dei caratteri)
document.fonts.ready.then(() => {
const ICONA = c => c === 0 ? "☀️" : c <= 2 ? "🌤️" : c === 3 ? "☁️" : c <= 48 ? "🌫️" : c <= 67 ? "🌧️" : c <= 77 ? "❄️" : c <= 82 ? "🌦️" : c <= 86 ? "🌨️" : "⛈️";
x.textBaseline = "middle";
// prima tutte le icone, poi tutte le etichette (sopra le icone)
const pos = D.paesi.map(p => { const [X, Y] = aPx(p.lat, p.lon); return { p, X, Y }; }).filter(o => o.Y < MH - 40);
x.font = '800 25px Inter, Arial, sans-serif';
pos.forEach(o => { o.testo = o.p.nome + "  " + o.p.t + "°"; o.w = x.measureText(o.testo).width + 26; });
pos.forEach(o => {
  x.font = '54px "Apple Color Emoji","Noto Color Emoji",sans-serif'; x.textAlign = "center";
  if(o.p.lato === "sx") x.fillText(ICONA(o.p.codice), o.X - o.w / 2 - 34, o.Y + 24);
  else if(o.p.lato === "dx") x.fillText(ICONA(o.p.codice), o.X + o.w / 2 + 34, o.Y + 24);
  else x.fillText(ICONA(o.p.codice), o.X, o.Y - 30);
});
pos.forEach(o => {
  x.font = '800 25px Inter, Arial, sans-serif'; x.textAlign = "center";
  x.fillStyle = "rgba(2,6,18,.82)"; x.beginPath(); x.roundRect(o.X - o.w / 2, o.Y + 6, o.w, 40, 20); x.fill();
  x.strokeStyle = "rgba(140,196,255,.4)"; x.lineWidth = 2; x.stroke();
  x.fillStyle = "#fff"; x.fillText(o.testo, o.X, o.Y + 27);
});
window.pronto = true;
});
</script></body></html>`;
  const pagina = await browser.newPage({ viewport:{ width:1080, height:1350 } });
  await pagina.setContent(html, { waitUntil:"networkidle" });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForFunction(() => window.pronto === true, null, { timeout:60000 });
  const jpg = await pagina.screenshot({ type:"jpeg", quality:92 });
  await pagina.close();
  return jpg;
}

async function creaCopertina(browser){
  const logo = fs.readFileSync(path.join(RADICE, "icone/icona-512.png")).toString("base64");
  const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;overflow:hidden;font-family:Inter,Arial,sans-serif;color:#f4f8ff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;text-align:center;
background:radial-gradient(ellipse 80% 50% at 50% 28%,rgba(47,125,255,.6),transparent 70%),radial-gradient(ellipse 60% 40% at 100% 100%,rgba(47,125,255,.22),transparent 70%),linear-gradient(#061433,#030a1c 55%,#02040a)}
img{width:250px;height:250px;border-radius:62px;box-shadow:0 30px 90px rgba(47,125,255,.55)}
.m{font:700 34px "Space Grotesk",Inter,sans-serif;letter-spacing:12px;color:#8cc4ff}
h1{font-weight:800;font-size:84px;line-height:1.05;letter-spacing:-1.5px;max-width:900px}
.v{display:flex;flex-wrap:wrap;justify-content:center;gap:14px;max-width:900px}
.v span{padding:14px 26px;border-radius:999px;font-weight:600;font-size:30px;background:rgba(255,255,255,.07);border:2px solid rgba(140,196,255,.3)}
.s{font-weight:800;font-size:36px;color:#8cc4ff}
</style></head><body>
<img src="data:image/png;base64,${logo}">
<div class="m">CILENTO METEO</div>
<h1>Il meteo di tutto il Cilento</h1>
<div class="v"><span>☀️ 118 paesi</span><span>⏱️ Ora per ora</span><span>🌊 Mare</span><span>📡 Radar</span><span>⚠️ Allerte</span><span>⛰️ Montagna</span></div>
<div class="s">Scorri 👉</div>
</body></html>`;
  const pagina = await browser.newPage({ viewport:{ width:1080, height:1350 } });
  await pagina.setContent(html, { waitUntil:"networkidle" });
  await pagina.evaluate(() => document.fonts.ready);
  const jpg = await pagina.screenshot({ type:"jpeg", quality:92 });
  await pagina.close();
  return jpg;
}

// Reel «Come si usa»: un giro dell'app in 5 passi
async function creaReelGuida(browser, porta, uscita){
  const ctx = await telefonoReel(browser);
  const pagina = await ctx.newPage();
  await pagina.goto(`http://127.0.0.1:${porta}/index.html?paese=palinuro#meteo`, { waitUntil:"load" });
  await pagina.waitForTimeout(12000);
  await sovrapponi(pagina, "Come si usa Cilento Meteo", "");
  const ft = new Fotogrammi(uscita + ".fotogrammi");
  const titolo = (t, s) => pagina.evaluate(([t, s]) => {
    document.querySelector("#reelTesta .t").textContent = t;
    document.querySelector("#reelTesta .s").textContent = s;
  }, [t, s]);
  const scorriA = async (sel, durata = 30) => {
    const da = await pagina.evaluate(() => window.scrollY);
    const a = await pagina.evaluate(sel => {
      const el = sel && document.querySelector(sel);
      return el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - 110) : 0;
    }, sel);
    for(let k = 1; k <= durata; k++){
      await pagina.evaluate(y => window.scrollTo(0, y), Math.round(da + (a - da) * morbido(k / durata)));
      await ft.scatta(pagina);
    }
  };
  const sezione = async (nome) => {
    await pagina.evaluate(n => { location.hash = n; window.scrollTo(0, 0); }, nome);
    await pagina.waitForTimeout(nome === "radar" ? 9000 : 3500);
    await pagina.evaluate(n => {
      const s = document.getElementById("sezione-" + n);
      if(s) window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY - 110);
    }, nome);
    await pagina.waitForTimeout(600);
  };

  await pagina.evaluate(() => window.scrollTo(0, 0));
  await titolo("Come si usa Cilento Meteo", "1 · Scegli il tuo paese");
  for(let k = 0; k < 60; k++) await ft.scatta(pagina);                // 2 s
  await titolo("Come si usa Cilento Meteo", "2 · Il meteo ora per ora");
  await scorriA('[data-tendina="ore24"]');
  await ft.scatta(pagina, 45);
  await sezione("mare");
  await titolo("Come si usa Cilento Meteo", "3 · Dove il mare è più calmo");
  await ft.scatta(pagina, 60);
  await sezione("radar");
  await pagina.evaluate(() => {
    const carta = document.querySelector("#sezione-radar .card");
    if(carta) window.scrollTo(0, carta.getBoundingClientRect().top + window.scrollY - 100);
  });
  await titolo("Come si usa Cilento Meteo", "4 · La pioggia sul radar, in diretta");
  for(let k = 0; k < 20; k++){ await pagina.waitForTimeout(120); await ft.scatta(pagina, 4); }   // il radar si muove da solo
  await sezione("allerte");
  await titolo("Come si usa Cilento Meteo", "5 · Le allerte ufficiali");
  await ft.scatta(pagina, 60);
  await finale(pagina, ft);
  await ctx.close();
  ft.video(uscita);
}

async function creaReelWeekend(browser, porta, uscita){
  const ctx = await telefonoReel(browser);
  const ft = new Fotogrammi(uscita + ".fotogrammi");
  for(const [nome, slug] of [["Palinuro", "palinuro"], ["Agropoli", "agropoli"], ["Sapri", "sapri"]]){
    const pagina = await ctx.newPage();
    await pagina.goto(`http://127.0.0.1:${porta}/index.html?paese=${slug}#meteo`, { waitUntil:"load" });
    await pagina.waitForTimeout(10000);
    await sovrapponi(pagina, "Il weekend nel Cilento", nome);
    await pagina.evaluate(() => window.scrollTo(0, 0));
    await pagina.waitForTimeout(800);
    for(let k = 0; k < 36; k++) await ft.scatta(pagina);          // 1,2 s con la pioggia o il sole animati
    const meta = await pagina.evaluate(() => {
      const el = document.querySelector('[data-tendina="settimana"]');
      return el ? el.getBoundingClientRect().top + window.scrollY - 80 : 600;
    });
    for(let k = 1; k <= 30; k++){                                   // 1 s di scorrimento morbido
      await pagina.evaluate(y => window.scrollTo(0, y), Math.round(meta * morbido(k / 30)));
      await ft.scatta(pagina);
    }
    await pagina.waitForTimeout(300);
    await ft.scatta(pagina, 54);                                     // 1,8 s fermo sui 7 giorni
    if(slug === "sapri") await finale(pagina, ft);
    await pagina.close();
  }
  await ctx.close();
  ft.video(uscita);
}

/* ---------------- Instagram ---------------- */

async function chiamata(metodo, percorso, parametri = {}){
  const token = process.env.IG_TOKEN;
  if(!token) throw new Error("Manca il segreto IG_TOKEN");
  const url = new URL(percorso.startsWith("http") ? percorso : API + percorso);
  const opzioni = { method:metodo, headers:{ Authorization:`Bearer ${token}` } };
  if(metodo === "GET") for(const [k, v] of Object.entries(parametri)) url.searchParams.set(k, v);
  else opzioni.body = new URLSearchParams(parametri);
  const r = await fetch(url, opzioni);
  const j = await r.json().catch(() => ({}));
  if(!r.ok || j.error) throw new Error(`Instagram ${percorso}: ${r.status} ${JSON.stringify(j.error || j)}`);
  return j;
}

async function pubblicaUna(utente, url, { didascalia, storia, reel }){
  const param = reel ? { media_type:"REELS", video_url:url, share_to_feed:"true" } : { image_url:url };
  if(storia) param.media_type = "STORIES";
  if(didascalia && !storia) param.caption = didascalia;
  let id;
  if(!storia && LUOGO){
    // Con il luogo; se Instagram non lo accetta, si pubblica senza
    try{ ({ id } = await chiamata("POST", `/${utente}/media`, { ...param, location_id:LUOGO })); }
    catch(e){ console.warn("Luogo non accettato, pubblico senza:", e.message); }
  }
  if(!id) ({ id } = await chiamata("POST", `/${utente}/media`, param));
  for(let k = 0; k < (reel ? 120 : 30); k++){
    const { status_code } = await chiamata("GET", `/${id}`, { fields:"status_code" });
    if(status_code === "FINISHED") break;
    if(status_code === "ERROR" || status_code === "EXPIRED") throw new Error(`Contenitore ${id}: ${status_code}`);
    await attendi(5000);
  }
  const pubblicato = await chiamata("POST", `/${utente}/media_publish`, { creation_id:id });
  return pubblicato.id;
}

async function pubblicaCarosello(utente, urls, didascalia){
  const figli = [];
  for(const u of urls){
    if(!await urlRaggiungibile(u)) throw new Error("Immagine non raggiungibile: " + u);
    const { id } = await chiamata("POST", `/${utente}/media`, { image_url:u, is_carousel_item:"true" });
    figli.push(id);
  }
  for(const id of figli){
    for(let k = 0; k < 30; k++){
      const { status_code } = await chiamata("GET", `/${id}`, { fields:"status_code" });
      if(status_code === "FINISHED") break;
      if(status_code === "ERROR" || status_code === "EXPIRED") throw new Error(`Immagine del carosello ${id}: ${status_code}`);
      await attendi(3000);
    }
  }
  const { id } = await chiamata("POST", `/${utente}/media`, { media_type:"CAROUSEL", children:figli.join(","), caption:didascalia });
  for(let k = 0; k < 30; k++){
    const { status_code } = await chiamata("GET", `/${id}`, { fields:"status_code" });
    if(status_code === "FINISHED") break;
    if(status_code === "ERROR" || status_code === "EXPIRED") throw new Error(`Carosello ${id}: ${status_code}`);
    await attendi(5000);
  }
  const pubblicato = await chiamata("POST", `/${utente}/media_publish`, { creation_id:id });
  return pubblicato.id;
}

async function urlRaggiungibile(url){
  // Per i video si aspetta che GitHub Pages pubblichi il file (1–3 minuti)
  for(let k = 0; k < 48; k++){
    try{
      const r = await fetch(url, { method:"HEAD" });
      if(r.ok) return true;
    }catch(e){}
    await attendi(10000);
  }
  return false;
}

async function pubblica(){
  const c = leggi(COMPITI, { compiti:[] });
  if(!c.compiti.length){ console.log("Niente da pubblicare"); return; }
  const stato = leggi(STATO, {});
  const prova = process.env.PROVA === "1";
  const base = process.env.URL_BASE;
  if(!base) throw new Error("Manca URL_BASE");

  let utente = null;
  if(!prova){
    if(TOKEN_FACEBOOK){
      utente = ID_INSTAGRAM;
      const io = await chiamata("GET", `/${utente}`, { fields:"username" });
      console.log("Account Instagram:", io.username);
    }else{
      const io = await chiamata("GET", "/me", { fields:"user_id,username" });
      utente = io.user_id || io.id;
      console.log("Account Instagram:", io.username);
    }
  }

  const errori = [];
  for(const tipo of c.compiti){
    const reel = tipo.startsWith("reel-");
    const url = `${(reel ? SITO : base).replace(/\/$/, "")}/social/immagini/${c.file[tipo]}`;
    try{
      if(tipo === "carosello"){
        const urls = c.file.carosello.map(n => `${base.replace(/\/$/, "")}/social/immagini/${n}`);
        if(prova) console.log(`[PROVA] carosello:\n${urls.join("\n")}\n${c.testi.carosello}\n`);
        else console.log("Carosello pubblicato:", await pubblicaCarosello(utente, urls, c.testi.carosello));
        stato.carosello = c.data;
        continue;
      }
      if(prova){
        console.log(`[PROVA] ${tipo}: ${url}\n${c.testi[tipo] || ""}\n`);
      }else{
        if(!await urlRaggiungibile(url)) throw new Error("Immagine non raggiungibile: " + url);
        if(reel){
          console.log(`Reel ${tipo} pubblicato:`, await pubblicaUna(utente, url, { didascalia:c.testi[tipo], reel:true }));
        }else if(tipo === "storia"){
          console.log("Storia pubblicata:", await pubblicaUna(utente, url, { storia:true }));
        }else{
          console.log(`Post ${tipo} pubblicato:`, await pubblicaUna(utente, url, { didascalia:c.testi[tipo] }));
          // Weekend e allerta vanno anche nelle storie
          await attendi(5000);
          console.log(`Storia ${tipo} pubblicata:`, await pubblicaUna(utente, url, { storia:true }));
        }
      }
      if(tipo === "allerta") stato.allerta = c.allerta.chiave;
      else stato[tipo] = c.data;
      if(tipo === "promo") stato.promoIndice = ((stato.promoIndice || 0) + 1) % PROMO.length;
    }catch(e){
      console.error(`Errore con ${tipo}:`, e.message);
      errori.push(tipo);
    }
  }
  if(!prova) scrivi(STATO, stato);
  if(errori.length) process.exitCode = 1;
}

async function rinnova(){
  let j = {};
  try{
    j = await chiamata("GET", "https://graph.instagram.com/refresh_access_token", { grant_type:"ig_refresh_token", access_token:process.env.IG_TOKEN });
  }catch(e){
    // Succede per esempio se il token ha meno di 24 ore: si riprova all'ora successiva
    console.warn("Rinnovo del token rimandato:", e.message);
    return;
  }
  if(!j.access_token){ console.warn("Rinnovo del token rimandato: risposta senza token"); return; }
  // Il token esce solo verso il file indicato, mai nel registro
  fs.writeFileSync(process.env.FILE_TOKEN || path.join(RADICE, ".token-nuovo"), j.access_token);
  console.log(`Token rinnovato: scade tra ${Math.round((j.expires_in || 0) / 86400)} giorni`);
}

// Da chiamare solo dopo aver salvato il nuovo token nei segreti
function rinnovato(){
  const stato = leggi(STATO, {});
  stato.rinnovo = new Date().toISOString();
  scrivi(STATO, stato);
}

const comandi = { decidi, genera, pubblica, rinnova, rinnovato };
const cmd = process.argv[2];
if(!comandi[cmd]){ console.error("Uso: node scripts/social.mjs decidi|genera|pubblica|rinnova|rinnovato"); process.exit(2); }
await comandi[cmd]();
