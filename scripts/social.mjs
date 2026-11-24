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
const HASHTAG_PROMO = "#cilento #meteocilento #cilentocoast #salerno #campania #parconazionaledelcilento #meteo #app";

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

function decidi(){
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

  scrivi(COMPITI, { data, compiti, allerta, rinnovo });
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
    for(const tipo of compiti){
      if(tipo === "promo") continue;
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

async function pubblicaUna(utente, url, { didascalia, storia }){
  const param = { image_url:url };
  if(storia) param.media_type = "STORIES";
  else if(didascalia) param.caption = didascalia;
  const { id } = await chiamata("POST", `/${utente}/media`, param);
  for(let k = 0; k < 30; k++){
    const { status_code } = await chiamata("GET", `/${id}`, { fields:"status_code" });
    if(status_code === "FINISHED") break;
    if(status_code === "ERROR" || status_code === "EXPIRED") throw new Error(`Contenitore ${id}: ${status_code}`);
    await attendi(5000);
  }
  const pubblicato = await chiamata("POST", `/${utente}/media_publish`, { creation_id:id });
  return pubblicato.id;
}

async function urlRaggiungibile(url){
  for(let k = 0; k < 30; k++){
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
    const url = `${base.replace(/\/$/, "")}/social/immagini/${c.file[tipo]}`;
    try{
      if(prova){
        console.log(`[PROVA] ${tipo}: ${url}\n${c.testi[tipo] || ""}\n`);
      }else{
        if(!await urlRaggiungibile(url)) throw new Error("Immagine non raggiungibile: " + url);
        if(tipo === "storia"){
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
