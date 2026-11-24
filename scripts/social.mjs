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
const LUOGO = process.env.IG_LUOGO || "";   // l'ID del luogo Instagram (681518622) non è accettato dalle API: disattivato
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
  ["Agropoli", 40.3492, 14.9907], ["Acciaroli", 40.181, 15.0272],
  ["Ascea", 40.1426, 15.1837, "dx"], ["Palinuro", 40.0368, 15.2881], ["Sapri", 40.0746, 15.6321],
  ["Vallo della Lucania", 40.2279, 15.2663], ["Sala Consilina", 40.4013, 15.5914],
  ["Roccadaspide", 40.4255, 15.1918], ["Piaggine", 40.345, 15.3778]
];
const ZONE_NOTIZIA = {
  "Costa nord": ["Agropoli", "Acciaroli"],
  "Costa sud": ["Ascea", "Palinuro", "Sapri"],
  "Entroterra": ["Vallo della Lucania", "Piaggine", "Roccadaspide"],
  "Vallo di Diano": ["Sala Consilina"]
};

async function meteoGriglia(){
  const R = JSON.parse(fs.readFileSync(path.join(CARTELLA, "mappa.json"), "utf8"));
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
  // Ogni contenuto è indipendente: se uno non riesce, gli altri escono lo stesso
  const saltati = [];
  const salta = (tipo, e) => { console.warn(`Salto ${tipo}:`, e && e.message || e); saltati.push(tipo); };
  try{
    let esito = { testi:{} };
    const DA_PAGINA = ["storia", "weekend", "allerta"];
    if(compiti.some(c => DA_PAGINA.includes(c))){
      try{
        const pagina = await browser.newPage({ locale:"it-IT", timezoneId:"Europe/Rome" });
        pagina.on("console", m => console.log("[pagina]", m.text()));
        await pagina.goto(`http://127.0.0.1:${s.address().port}/social.html`);
        await pagina.waitForFunction(() => {
          const t = document.getElementById("stato").textContent;
          return /aggiornate|Non riesco/.test(t);
        }, null, { timeout:240000 });
        const e = await pagina.evaluate(() => {
          if(!dati) return null;
          const jpg = c => c ? c.toDataURL("image/jpeg", .92).split(",")[1] : null;
          return {
            storia: jpg(tele.storia), weekend: jpg(tele.weekend), allerta: jpg(tele.allerta),
            testi: { storia: testi.storia, weekend: testi.weekend, allerta: testi.allerta }
          };
        });
        if(!e) throw new Error("la pagina non ha caricato le previsioni");
        esito = e;
        await pagina.close();
      }catch(e){
        compiti.filter(c => DA_PAGINA.includes(c)).forEach(c => salta(c, e));
      }
    }

    fs.mkdirSync(IMMAGINI, { recursive:true });
    // Tiene solo le immagini degli ultimi 7 giorni
    const limite = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    for(const f of fs.readdirSync(IMMAGINI)) if(f.slice(0, 10) < limite) fs.unlinkSync(path.join(IMMAGINI, f));

    const file = {};
    if(compiti.includes("promo")) try{
      const stato = leggi(STATO, {});
      const indice = (stato.promoIndice || 0) % PROMO.length;
      const p = PROMO[indice];
      const nome = `${data}-promo-${p.id}.jpg`;
      fs.writeFileSync(path.join(IMMAGINI, nome), await creaPromo(browser, s.address().port, p));
      file.promo = nome;
      esito.testi.promo = `${p.titolo} ✨\n\n${p.testo}\n\n📲 Gratis su 👉 cilentometeo.it (link in bio)\n\n${HASHTAG_PROMO}`;
      console.log("Creata", nome);
    }catch(e){ salta("promo", e); }
    const cc = leggi(COMPITI, {});
    if(compiti.includes("reel-radar")) try{
      const nome = `${data}-reel-radar.mp4`;
      await creaReelRadar(browser, s.address().port, cc.reelPaese || "agropoli", path.join(IMMAGINI, nome));
      file["reel-radar"] = nome;
      esito.testi["reel-radar"] = `🌧️ Piove nel Cilento: ecco il radar della Protezione Civile in diretta.\n\nGuarda dove piove adesso e dove sta andando la pioggia, paese per paese, aggiornato ogni 5 minuti.\n\n📲 Gratis su 👉 cilentometeo.it (link in bio)\n\n#cilento #meteocilento #cilentonotizie #pioggia #radarmeteo #maltempo #cilentolovers #salerno #protezionecivile`;
      console.log("Creato", nome);
    }catch(e){ salta("reel-radar", e); }
    if(compiti.includes("reel-weekend")) try{
      const nome = `${data}-reel-weekend.mp4`;
      await creaReelWeekend(browser, s.address().port, path.join(IMMAGINI, nome));
      file["reel-weekend"] = nome;
      esito.testi["reel-weekend"] = `☀️ Che tempo farà nel weekend nel Cilento?\n\nDal mare alla montagna: previsioni ora per ora per tutti i 118 paesi, mare, radar e allerte.\n\n📲 Gratis su 👉 cilentometeo.it (link in bio)\n\n#cilento #meteocilento #weekend #cilentocoast #cilentomeraviglie #cilentolovers #cilentogram #palinuro #agropoli #sapri`;
      console.log("Creato", nome);
    }catch(e){ salta("reel-weekend", e); }
    if(compiti.includes("notizia")) try{
      const nome = `${data}-notizia.jpg`;
      fs.writeFileSync(path.join(IMMAGINI, nome), await creaNotizia(browser, cc.notizia));
      file.notizia = nome;
      esito.testi.notizia = cc.notizia.scelta.didascalia;
      console.log("Creata", nome);
    }catch(e){ salta("notizia", e); }
    if(compiti.includes("reel-guida")) try{
      const nome = `${data}-reel-guida.mp4`;
      await creaReelGuida(browser, s.address().port, path.join(IMMAGINI, nome));
      file["reel-guida"] = nome;
      esito.testi["reel-guida"] = `Come si usa Cilento Meteo in 20 secondi ⏱️\n\n1️⃣ Scegli il tuo paese (o usa la posizione)\n2️⃣ Guarda il meteo ora per ora\n3️⃣ Scopri dove il mare è più calmo\n4️⃣ Segui la pioggia sul radar in diretta\n5️⃣ Controlla le allerte ufficiali\n\n📲 Gratis, senza registrazione: 👉 cilentometeo.it (link in bio)\n\n${HASHTAG_PROMO}`;
      console.log("Creato", nome);
    }catch(e){ salta("reel-guida", e); }
    if(compiti.includes("carosello")) try{
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
    }catch(e){ salta("carosello", e); }
    for(const tipo of compiti){
      if(tipo === "promo" || tipo === "carosello" || tipo === "notizia" || tipo.startsWith("reel-") || saltati.includes(tipo)) continue;
      if(!esito[tipo]){ salta(tipo, "immagine non disponibile"); continue; }
      const nome = `${data}-${tipo}.jpg`;
      fs.writeFileSync(path.join(IMMAGINI, nome), Buffer.from(esito[tipo], "base64"));
      file[tipo] = nome;
      console.log("Creata", nome);
    }
    const c = leggi(COMPITI, {});
    // I contenuti saltati non si pubblicano: il robot li riprova all'ora successiva
    scrivi(COMPITI, { ...c, compiti:compiti.filter(x => !saltati.includes(x)), file, testi: esito.testi });
    if(saltati.length) console.log("Rimandati all'ora successiva:", saltati.join(", "));
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
      "-shortest", "-vf", "scale=1080:1920:flags=lanczos:in_range=full:out_range=tv,format=yuv420p",
      "-c:v", "libx264", "-profile:v", "high", "-level", "4.1", "-preset", "medium", "-crf", "20", "-r", "30",
      "-g", "30", "-keyint_min", "30", "-sc_threshold", "0", "-maxrate", "8M", "-bufsize", "16M",
      "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
      "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", uscita]);
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
  const M = JSON.parse(fs.readFileSync(path.join(CARTELLA, "mappa.json"), "utf8"));
  const b64 = f => fs.readFileSync(path.join(f.startsWith("icone") ? RADICE : CARTELLA, f)).toString("base64");
  const base = b64("mappa-base.png"), terra = b64("mappa-terra.png"), logo = b64("icone/icona-192.png");
  const codiceIcone = fs.readFileSync(path.join(CARTELLA, "icone-meteo.js"), "utf8");
  const g = scelta.indice;
  const valori = meteo.griglia.map(d => scelta.var === "pioggia" ? d.precipitation_sum[g] : scelta.var === "neve" ? d.snowfall_sum[g]
    : scelta.var === "vento" ? d.wind_gusts_10m_max[g] : scelta.var === "min" ? d.temperature_2m_min[g] : d.temperature_2m_max[g]);
  const paesi = meteo.paesi.map(p => ({ nome:p.nome, lat:p.lat, lon:p.lon, lato:p.lato, codice:p.d.weather_code[g],
    t:Math.round(scelta.var === "min" ? p.d.temperature_2m_min[g] : p.d.temperature_2m_max[g]) }));
  const etichetta = { pioggia:"Pioggia prevista (mm)", neve:"Neve prevista (cm)", vento:"Raffiche di vento (km/h)", min:"Temperatura minima (°C)", max:"Temperatura massima (°C)" }[scelta.var];
  const allarme = ["temporali", "neve", "vento", "pioggia"].includes(scelta.tipo) && scelta.importante;
  const coloreTag = allarme ? "#ff3b3b" : scelta.tipo === "caldo" ? "#ff7a1a" : scelta.tipo === "freddo" ? "#3d8bff" : "#ffd400";
  const testoTag = allarme ? "#fff" : scelta.tipo === "freddo" ? "#fff" : "#111";
  const dataLunga = new Date(meteo.paesi[0].d.time[g] + "T12:00:00").toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" });
  const dati = JSON.stringify({ M, G:meteo.G, valori, var:scelta.var, paesi });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
  const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@600;700;800;900&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;overflow:hidden;background:#030712;font-family:Inter,Arial,sans-serif;color:#fff;position:relative}
canvas{position:absolute;left:0;top:0}
.marchio{position:absolute;top:30px;left:30px;display:flex;align-items:center;gap:14px;padding:10px 22px 10px 10px;border-radius:22px;
background:rgba(3,10,28,.72);backdrop-filter:blur(10px);border:2px solid rgba(255,255,255,.22);box-shadow:0 10px 30px rgba(0,0,0,.35);font:700 25px "Space Grotesk",Inter,sans-serif;letter-spacing:5px}
.marchio img{width:54px;height:54px;border-radius:14px}
.legenda{position:absolute;top:30px;right:30px;padding:14px 18px 12px;border-radius:20px;background:rgba(3,10,28,.72);border:2px solid rgba(255,255,255,.22);box-shadow:0 10px 30px rgba(0,0,0,.35);font-weight:800;font-size:18px;text-align:left;min-width:330px}
.legenda .barra{height:16px;border-radius:8px;margin:10px 0 6px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)}
.legenda .num{display:flex;justify-content:space-between;font-size:17px;font-weight:700;color:#dbe9ff}
.fondo{display:none}
.testo{position:absolute;left:46px;right:46px;bottom:100px;display:flex;flex-direction:column;align-items:flex-start;gap:14px}
.riga{display:flex;align-items:center;gap:18px}
.data{font-weight:800;font-size:28px;color:#cfe0ff;letter-spacing:.5px}
.tag{display:flex;align-items:center;gap:10px;padding:8px 18px 4px;border-radius:6px;background:${coloreTag};color:${testoTag};font:400 44px Anton,Impact,sans-serif;letter-spacing:1.5px;box-shadow:0 8px 30px ${coloreTag}66}
h1{font:400 84px/1.02 Anton,Impact,sans-serif;text-transform:uppercase;letter-spacing:.5px;text-shadow:0 6px 24px rgba(0,0,0,.55)}
.sito{position:absolute;left:46px;right:46px;bottom:34px;display:flex;justify-content:space-between;align-items:center}
.sito b{font-weight:900;font-size:30px;color:#8cc4ff}
.sito small{font-size:14px;color:rgba(220,230,255,.45);font-weight:600;text-align:right;line-height:1.3}
</style></head><body>
<canvas id="c" width="1080" height="1350"></canvas>
<div class="marchio"><img src="data:image/png;base64,${logo}">CILENTO METEO</div>
<div class="legenda">${esc(etichetta)}<div class="barra" id="barra"></div><div class="num" id="num"></div></div>
<div class="fondo"></div>
<div class="testo">
  <div class="riga"><div class="tag">${allarme ? "⚠️ " : ""}PREVISIONI ${esc(scelta.giorno)}</div><div class="data">${esc(dataLunga.charAt(0).toUpperCase() + dataLunga.slice(1))}</div></div>
  <h1 id="titolo">${esc(scelta.titolo)}</h1>
</div>
<div class="sito"><b>Il meteo del tuo paese su cilentometeo.it</b><small>Dati: Open-Meteo<br>Rilievo: Mapzen / AWS Terrain Tiles</small></div>
<img id="base" src="data:image/png;base64,${base}" hidden>
<img id="terra" src="data:image/png;base64,${terra}" hidden>
<script>${codiceIcone}</script>
<script>
const D = ${dati}, M = D.M;
const c = document.getElementById("c"), x = c.getContext("2d");
const W = M.larghezza, H = M.altezza, SU = 100;     // la mappa sale di 100 px: la costa sud resta sopra il titolo
const aPx = (lat, lon) => [(lon - M.ovest) / (M.est - M.ovest) * W, (lat - M.nord) / (M.sud - M.nord) * H - SU];
const carica = id => new Promise(ok => { const i = document.getElementById(id); i.complete ? ok(i) : i.onload = () => ok(i); });

const SCALE = {
  pioggia:{ min:0, max:40, alfa:.82, stop:[[0,"#00000000"],[.04,"#2f8cff00"],[.1,"#2f8cff"],[.25,"#14d1ff"],[.38,"#1fe07a"],[.52,"#f4ee2a"],[.68,"#ff9a1a"],[.84,"#ff2b3a"],[1,"#d23cff"]] },
  neve:{ min:0, max:30, alfa:.85, stop:[[0,"#00000000"],[.05,"#bfe3ff00"],[.12,"#bfe3ff"],[.45,"#b49bff"],[1,"#ffffff"]] },
  vento:{ min:20, max:90, alfa:.7, stop:[[0,"#00000000"],[.12,"#2f8cff00"],[.25,"#2f8cff"],[.45,"#14d1c8"],[.65,"#f4ee2a"],[.82,"#ff9a1a"],[1,"#ff2b3a"]] },
  max:{ min:0, max:38, alfa:.62, stop:[[0,"#5b3cff"],[.2,"#2f6bff"],[.36,"#14c2ff"],[.5,"#1fe07a"],[.62,"#d7f52a"],[.72,"#ffd21a"],[.84,"#ff8a1a"],[1,"#ff2b3a"]] },
  min:{ min:-6, max:20, alfa:.62, stop:[[0,"#d9b8ff"],[.15,"#8a5cff"],[.32,"#2f6bff"],[.5,"#14c2ff"],[.68,"#1fe07a"],[.84,"#ffd21a"],[1,"#ff8a1a"]] }
}[D.var];
const tav = document.createElement("canvas"); tav.width = 256; tav.height = 1;
const tc = tav.getContext("2d"), gr = tc.createLinearGradient(0, 0, 256, 0);
SCALE.stop.forEach(([p, col]) => gr.addColorStop(p, col)); tc.fillStyle = gr; tc.fillRect(0, 0, 256, 1);
const PAL = tc.getImageData(0, 0, 256, 1).data;
document.getElementById("barra").style.background = "linear-gradient(90deg," + SCALE.stop.filter(s => !s[1].endsWith("00") || s[0] === 0 && !["pioggia","neve","vento"].includes(D.var)).map(s => s[1] + " " + Math.round(s[0] * 100) + "%").join(",") + ")";
document.getElementById("num").innerHTML = "<span>" + SCALE.min + "</span><span>" + Math.round((SCALE.min + SCALE.max) / 2) + "</span><span>" + SCALE.max + "+</span>";

// Campo del meteo: interpolazione morbida (bicubica) della griglia
function cub(p0, p1, p2, p3, t){ return p1 + .5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0))); }
function campo(u, v){
  const G = D.G, fx = u * (G - 1), fy = v * (G - 1), ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
  const V = (i, j) => D.valori[Math.min(G - 1, Math.max(0, j)) * G + Math.min(G - 1, Math.max(0, i))];
  const r = [-1, 0, 1, 2].map(d => cub(V(ix - 1, iy + d), V(ix, iy + d), V(ix + 1, iy + d), V(ix + 2, iy + d), tx));
  return cub(r[0], r[1], r[2], r[3], ty);
}

(async () => {
  await document.fonts.ready;
  // il titolo resta su due righe al massimo
  const h1 = document.getElementById("titolo");
  // due righe se possibile, altrimenti tre, senza scendere sotto i 64 px
  for(let s = 86; s >= 72 && h1.getBoundingClientRect().height > (s + 2) * 1.02 * 2 + 4; s -= 2) h1.style.fontSize = s + "px";
  for(let s = 72; s > 64 && h1.getBoundingClientRect().height > (s + 2) * 1.02 * 3 + 4; s -= 2) h1.style.fontSize = s + "px";
  const base = await carica("base"), terraImg = await carica("terra");
  const ICONE = await caricaIcone();
  const radar = ["pioggia", "neve", "vento"].includes(D.var);

  // 1. Mappa di base (un po' più scura quando c'è il radar, così i colori risaltano)
  x.filter = radar ? "brightness(.78) saturate(.85)" : "brightness(.92)";
  x.drawImage(base, 0, -SU, W, H);
  x.filter = "none";

  // 2. Strato del meteo, calcolato a bassa risoluzione e ingrandito morbido
  const lw = 270, lh = Math.round(270 * H / W);
  const strato = document.createElement("canvas"); strato.width = lw; strato.height = lh;
  const sx = strato.getContext("2d"), im = sx.createImageData(lw, lh);
  for(let j = 0; j < lh; j++) for(let i = 0; i < lw; i++){
    const val = campo(i / (lw - 1), j / (lh - 1));
    const t = Math.max(0, Math.min(1, (val - SCALE.min) / (SCALE.max - SCALE.min)));
    const p = Math.round(t * 255) * 4, k = (j * lw + i) * 4;
    im.data[k] = PAL[p]; im.data[k + 1] = PAL[p + 1]; im.data[k + 2] = PAL[p + 2]; im.data[k + 3] = PAL[p + 3] * SCALE.alfa;
  }
  sx.putImageData(im, 0, 0);
  const grande = document.createElement("canvas"); grande.width = W; grande.height = H;
  const gx = grande.getContext("2d");
  gx.imageSmoothingQuality = "high"; gx.filter = "blur(6px)";
  gx.drawImage(strato, 0, 0, W, H);
  gx.filter = "none";
  if(!radar){
    // le temperature solo sulla terraferma
    gx.globalCompositeOperation = "destination-in";
    gx.drawImage(terraImg, 0, 0, W, H);
    gx.globalCompositeOperation = "source-over";
    x.globalCompositeOperation = "color"; x.globalAlpha = .9; x.drawImage(grande, 0, -SU);
    x.globalCompositeOperation = "soft-light"; x.globalAlpha = .55; x.drawImage(grande, 0, -SU);
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  }else{
    x.save(); x.filter = "blur(14px)"; x.globalAlpha = .55; x.drawImage(grande, 0, -SU); x.restore();   // alone
    x.drawImage(grande, 0, -SU);
  }

  // 3. La mappa sfuma nel fondo scuro sotto
  const altoTesto = document.querySelector(".testo").getBoundingClientRect().top;
  const fineMappa = Math.min(H - SU, altoTesto + 20);
  const sf = x.createLinearGradient(0, fineMappa - 210, 0, fineMappa);
  sf.addColorStop(0, "rgba(3,7,18,0)"); sf.addColorStop(.6, "rgba(3,7,18,.75)"); sf.addColorStop(1, "rgba(3,7,18,1)");
  x.fillStyle = sf; x.fillRect(0, fineMappa - 210, W, 210);
  x.fillStyle = "#030712"; x.fillRect(0, fineMappa, W, 1350);
  // Vignetta leggera
  const vg = x.createRadialGradient(W / 2, H * .45, H * .35, W / 2, H * .45, H * .85);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.35)");
  x.fillStyle = vg; x.fillRect(0, 0, W, H);

  // 4. Paesi: icona grande con ombra, etichetta in vetro con la temperatura colorata
  const ICONA = c => c === 0 ? "☀️" : c <= 2 ? "🌤️" : c === 3 ? "☁️" : c <= 48 ? "🌫️" : c <= 67 ? "🌧️" : c <= 77 ? "❄️" : c <= 82 ? "🌦️" : c <= 86 ? "🌨️" : "⛈️";
  const coloreT = t => t >= 32 ? "#ff3b3b" : t >= 26 ? "#ff8a1a" : t >= 20 ? "#ffc61a" : t >= 14 ? "#3fe08a" : t >= 8 ? "#2fb8ff" : t >= 2 ? "#5a8cff" : "#b89bff";
  const pos = D.paesi.map(p => { const [X, Y] = aPx(p.lat, p.lon); return { p, X, Y }; }).filter(o => o.Y > 120 && o.Y < document.querySelector(".testo").getBoundingClientRect().top - 40);
  x.textBaseline = "middle";
  pos.forEach(o => {
    x.font = '800 26px Inter, Arial, sans-serif';
    o.wn = x.measureText(o.p.nome).width; o.w = o.wn + 30 + 74;
  });
  pos.forEach(o => {
    // puntino del paese
    x.beginPath(); x.arc(o.X, o.Y, 7, 0, Math.PI * 2); x.fillStyle = "#fff"; x.fill();
    x.lineWidth = 3; x.strokeStyle = "rgba(0,0,0,.45)"; x.stroke();
    const ix = o.p.lato === "sx" ? o.X - o.w / 2 - 40 : o.p.lato === "dx" ? o.X + o.w / 2 + 40 : o.X;
    const iy = o.p.lato ? o.Y + 30 : o.Y - 40;
    const img = ICONE[tipoIcona(o.p.codice)], dim = 104;
    if(img) x.drawImage(img, ix - dim / 2, iy - dim / 2 - 4, dim, dim);
  });
  pos.forEach(o => {
    const y = o.Y + 12, h = 42, l = o.X - o.w / 2;
    x.save(); x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 16; x.shadowOffsetY = 6;
    x.fillStyle = "rgba(6,14,34,.86)"; x.beginPath(); x.roundRect(l, y, o.w, h, 21); x.fill(); x.restore();
    x.strokeStyle = "rgba(255,255,255,.28)"; x.lineWidth = 1.5; x.beginPath(); x.roundRect(l, y, o.w, h, 21); x.stroke();
    x.font = '800 26px Inter, Arial, sans-serif'; x.textAlign = "left"; x.fillStyle = "#fff";
    x.fillText(o.p.nome, l + 16, y + h / 2 + 1);
    const bx = l + o.w - 70, bw = 64;
    x.fillStyle = coloreT(o.p.t); x.beginPath(); x.roundRect(bx, y + 4, bw, h - 8, 17); x.fill();
    x.font = '900 24px Inter, Arial, sans-serif'; x.textAlign = "center"; x.fillStyle = o.p.t >= 14 && o.p.t < 26 ? "#08210f" : "#fff";
    x.fillText(o.p.t + "°", bx + bw / 2, y + h / 2 + 1);
  });
  window.pronto = true;
})();
</script></body></html>`;
  const pagina = await browser.newPage({ viewport:{ width:1080, height:1350 } });
  await pagina.setContent(html, { waitUntil:"networkidle" });
  await pagina.waitForFunction(() => window.pronto === true, null, { timeout:60000 });
  const jpg = await pagina.screenshot({ type:"jpeg", quality:93 });
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

async function pubblicaUna(utente, url, { didascalia, storia, reel }, tentativo = 1){
  const param = reel ? { media_type:"REELS", video_url:url, share_to_feed:"true" } : { image_url:url };
  if(storia) param.media_type = "STORIES";
  if(didascalia && !storia) param.caption = didascalia;
  let id;
  if(!storia && LUOGO){
    // Con il luogo; se Instagram non lo accetta, si pubblica senza
    try{ ({ id } = await chiamata("POST", `/${utente}/media`, { ...param, location_id:LUOGO })); }
    catch(e){ console.warn("Luogo non accettato, pubblico senza"); }
  }
  if(!id) ({ id } = await chiamata("POST", `/${utente}/media`, param));
  for(let k = 0; k < (reel ? 120 : 30); k++){
    const st = await chiamata("GET", `/${id}`, { fields:"status_code,status" });
    if(st.status_code === "FINISHED") break;
    if(st.status_code === "ERROR" || st.status_code === "EXPIRED"){
      const motivo = `Contenitore ${id}: ${st.status_code} ${st.status || ""}`;
      // I video a volte falliscono all'elaborazione: un secondo tentativo dopo un minuto
      if(tentativo < 2){
        console.warn(motivo, "→ riprovo tra un minuto");
        await attendi(60000);
        return pubblicaUna(utente, url, { didascalia, storia, reel }, tentativo + 1);
      }
      throw new Error(motivo);
    }
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
