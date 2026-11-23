// Meteo Cilento — server di notifiche e assistente (Cloudflare Worker, piano gratuito)
//
// - POST /iscrivi     salva l'abbonamento del telefono con il paese e i tipi di avviso
// - POST /disiscrivi  lo cancella
// - POST /assistente  risponde alle domande con l'intelligenza artificiale (Claude)
// - ogni 15 minuti    controlla allerte e pioggia in arrivo e manda le notifiche
//
// Configurazione (vedi notifiche/LEGGIMI.md):
//   KV:        ISCRITTI
//   variabili: SITO (indirizzo dell'app), VAPID_PUBBLICA, VAPID_SOGGETTO, MODELLO_AI, LIMITE_AI
//   segreti:   VAPID_PRIVATA, ANTHROPIC_API_KEY (solo per l'assistente)

import Anthropic from "@anthropic-ai/sdk";
import { inviaNotifica } from "./webpush.js";

const PAUSA_PIOGGIA_MS = 3 * 3600 * 1000;      // al massimo un avviso di pioggia ogni 3 ore
const NOMI_ALLERTA = { giallo:"Allerta gialla", arancione:"Allerta arancione", rosso:"Allerta rossa" };
const TESTI = {
  it:{ oggi:"oggi", domani:"domani", rischio:"Rischio", consigli:"Tocca per i dettagli e i consigli.",
       pioggia:"Pioggia in arrivo", verso:(o, n) => `Verso le ${o} a ${n}. Meglio avere l'ombrello.` },
  en:{ oggi:"today", domani:"tomorrow", rischio:"Risk", consigli:"Tap for details and advice.",
       pioggia:"Rain on the way", verso:(o, n) => `Around ${o} in ${n}. Better take an umbrella.` },
  de:{ oggi:"heute", domani:"morgen", rischio:"Gefahr", consigli:"Tippe für Details und Tipps.",
       pioggia:"Regen im Anmarsch", verso:(o, n) => `Gegen ${o} in ${n}. Besser einen Schirm mitnehmen.` }
};
const NOMI_ALLERTA_LINGUA = {
  en:{ giallo:"Yellow alert", arancione:"Orange alert", rosso:"Red alert" },
  de:{ giallo:"Gelbe Warnung", arancione:"Orange Warnung", rosso:"Rote Warnung" }
};
const RISCHI_LINGUA = {
  it:{ temporali:"temporali", idrogeologico:"idrogeologico", idraulico:"idraulico" },
  en:{ temporali:"thunderstorms", idrogeologico:"landslides and flooding", idraulico:"river flooding" },
  de:{ temporali:"Gewitter", idrogeologico:"Erdrutsche und Überschwemmungen", idraulico:"Hochwasser" }
};

function cors(env){
  return {
    "Access-Control-Allow-Origin": env.SITO ? new URL(env.SITO).origin : "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

const risposta = (env, corpo, stato = 200) =>
  new Response(JSON.stringify(corpo), { status: stato, headers: { "Content-Type":"application/json", ...cors(env) } });

async function chiaveDi(endpoint){
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return "sub:" + [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function valida(dati){
  const s = dati?.abbonamento;
  if(!s || typeof s.endpoint !== "string" || !s.endpoint.startsWith("https://") || !s.keys?.p256dh || !s.keys?.auth) return "abbonamento non valido";
  const l = dati.luogo;
  if(!l || !isFinite(l.lat) || !isFinite(l.lon) || Math.abs(l.lat) > 90 || Math.abs(l.lon) > 180) return "luogo non valido";
  return null;
}

export default {
  async fetch(req, env){
    if(req.method === "OPTIONS") return new Response(null, { headers: cors(env) });
    const url = new URL(req.url);

    if(req.method === "POST" && url.pathname === "/iscrivi"){
      let dati;
      try{ dati = await req.json(); }catch(e){ return risposta(env, { errore:"JSON non valido" }, 400); }
      const errore = valida(dati);
      if(errore) return risposta(env, { errore }, 400);
      const chiave = await chiaveDi(dati.abbonamento.endpoint);
      const precedente = JSON.parse(await env.ISCRITTI.get(chiave) || "null");
      const voce = {
        abbonamento: { endpoint: dati.abbonamento.endpoint, keys: { p256dh: dati.abbonamento.keys.p256dh, auth: dati.abbonamento.keys.auth } },
        luogo: { nome: String(dati.luogo.nome || "").slice(0, 60), lat: +dati.luogo.lat, lon: +dati.luogo.lon, zona: ["S", "B", "T"].includes(dati.luogo.zona) ? dati.luogo.zona : null },
        tipi: { allerte: dati.tipi?.allerte !== false, pioggia: dati.tipi?.pioggia !== false },
        lingua: ["it", "en", "de"].includes(dati.lingua) ? dati.lingua : "it",
        ultimaPioggia: precedente?.ultimaPioggia || 0,
        allerteInviate: precedente?.allerteInviate || []
      };
      await env.ISCRITTI.put(chiave, JSON.stringify(voce));
      return risposta(env, { ok:true });
    }

    if(req.method === "POST" && url.pathname === "/disiscrivi"){
      let dati;
      try{ dati = await req.json(); }catch(e){ return risposta(env, { errore:"JSON non valido" }, 400); }
      if(typeof dati?.endpoint !== "string") return risposta(env, { errore:"endpoint mancante" }, 400);
      await env.ISCRITTI.delete(await chiaveDi(dati.endpoint));
      return risposta(env, { ok:true });
    }

    if(req.method === "POST" && url.pathname === "/assistente") return assistente(req, env);

    if(url.pathname === "/") return risposta(env, { servizio:"Meteo Cilento notifiche e assistente", ok:true });
    return risposta(env, { errore:"non trovato" }, 404);
  },

  async scheduled(evento, env, ctx){
    ctx.waitUntil(controlla(env));
  }
};

async function tuttiGliIscritti(env){
  const voci = [];
  let cursore;
  do{
    const pagina = await env.ISCRITTI.list({ prefix:"sub:", cursor: cursore });
    for(const k of pagina.keys){
      const v = await env.ISCRITTI.get(k.name);
      if(v) voci.push([k.name, JSON.parse(v)]);
    }
    cursore = pagina.list_complete ? null : pagina.cursor;
  }while(cursore);
  return voci;
}

function isoRoma(data){
  return new Intl.DateTimeFormat("sv-SE", { timeZone:"Europe/Rome" }).format(data);   // AAAA-MM-GG
}

async function controlla(env){
  const iscritti = await tuttiGliIscritti(env);
  if(!iscritti.length) return;
  const vapid = { pubblica: env.VAPID_PUBBLICA, privata: env.VAPID_PRIVATA, soggetto: env.VAPID_SOGGETTO };

  // Bollettino di allerta pubblicato dall'app (allerta.json)
  let allerta = null;
  try{
    const r = await fetch(new URL("allerta.json", env.SITO.endsWith("/") ? env.SITO : env.SITO + "/"), { cf:{ cacheTtl:300 } });
    if(r.ok) allerta = await r.json();
  }catch(e){}

  // Pioggia nei prossimi 60 minuti, una richiesta per ogni luogo diverso
  const previsioni = new Map();
  const luoghi = [...new Set(iscritti.filter(([, v]) => v.tipi.pioggia).map(([, v]) => `${v.luogo.lat.toFixed(2)},${v.luogo.lon.toFixed(2)}`))];
  for(let i = 0; i < luoghi.length; i += 50){
    const gruppo = luoghi.slice(i, i + 50);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${gruppo.map(g => g.split(",")[0]).join(",")}`
      + `&longitude=${gruppo.map(g => g.split(",")[1]).join(",")}`
      + `&minutely_15=precipitation&forecast_minutely_15=5&timezone=Europe%2FRome`;
    try{
      const r = await fetch(url);
      let dati = await r.json();
      if(!Array.isArray(dati)) dati = [dati];
      gruppo.forEach((g, k) => previsioni.set(g, dati[k]?.minutely_15));
    }catch(e){}
  }

  const oggi = isoRoma(new Date()), domani = isoRoma(new Date(Date.now() + 86400000));
  const adesso = Date.now();

  for(const [chiave, v] of iscritti){
    const t = TESTI[v.lingua] || TESTI.it;
    let modificato = false;
    const invia = async dati => {
      const stato = await inviaNotifica(v.abbonamento, dati, vapid);
      if(stato === 404 || stato === 410){ await env.ISCRITTI.delete(chiave); return false; }
      return stato >= 200 && stato < 300;
    };

    // Allerte gialle, arancioni e rosse per la zona del paese
    if(v.tipi.allerte && allerta && v.luogo.zona){
      for(const [data, etichetta] of [[oggi, t.oggi], [domani, t.domani]]){
        const z = allerta.giorni?.[data]?.[v.luogo.zona];
        if(!z || z.livello === "verde") continue;
        const firma = `${data}:${z.livello}`;
        if(v.allerteInviate.includes(firma)) continue;
        const rischi = ["temporali", "idrogeologico", "idraulico"].filter(k => z[k] !== "verde").map(k => (RISCHI_LINGUA[v.lingua] || RISCHI_LINGUA.it)[k]);
        const nome = (NOMI_ALLERTA_LINGUA[v.lingua] || NOMI_ALLERTA)[z.livello];
        const ok = await invia({
          titolo: `${nome} ${etichetta} · ${allerta.zone?.[v.luogo.zona] || ""}`.trim(),
          testo: `${t.rischio}: ${rischi.join(", ")}. ${t.consigli}`,
          url: "./#allerte",
          tag: "allerta-" + data
        });
        if(ok === false && !(await env.ISCRITTI.get(chiave))) break;
        v.allerteInviate = [...v.allerteInviate, firma].slice(-10);
        modificato = true;
      }
    }

    // Pioggia in arrivo entro un'ora (solo se adesso non piove)
    if(v.tipi.pioggia && adesso - v.ultimaPioggia > PAUSA_PIOGGIA_MS){
      const m = previsioni.get(`${v.luogo.lat.toFixed(2)},${v.luogo.lon.toFixed(2)}`);
      if(m && m.precipitation){
        const mm = m.precipitation.map(x => x || 0);
        const inizio = mm.findIndex((x, i) => i > 0 && x >= 0.2);
        if(mm[0] < 0.1 && inizio > 0){
          const ok = await invia({
            titolo: t.pioggia,
            testo: t.verso(m.time[inizio].slice(11, 16), v.luogo.nome || "Cilento"),
            url: "./",
            tag: "pioggia"
          });
          if(ok){ v.ultimaPioggia = adesso; modificato = true; }
        }
      }
    }

    if(modificato && await env.ISCRITTI.get(chiave)) await env.ISCRITTI.put(chiave, JSON.stringify(v));
  }
}

// ---------------------------------------------------------------------------
// Assistente: risponde con i dati che l'app gli manda (meteo, mare, allerte...)
// ---------------------------------------------------------------------------

const SISTEMA = `Sei l'assistente di Meteo Cilento, un'app meteo per i paesi del Cilento (provincia di Salerno, Campania).
Rispondi alle domande delle persone su meteo, mare, spiaggia, barca e pesca, montagna ed escursioni, allerte, caldo, incendi, aria e pollini, e su cosa conviene fare o indossare.

Come rispondere:
- Usa solo i dati che l'app ti manda nel messaggio (JSON). Non inventare numeri, orari o previsioni che non ci sono. Se un dato manca, dillo con semplicità e suggerisci la sezione dell'app dove guardare.
- Le date e le ore nei dati sono in ora italiana. "Oggi" e "domani" si riferiscono al campo "adesso".
- Dai una risposta concreta e utile: un sì, un no o un "dipende" chiaro, con il perché in poche parole (per esempio vento, onde, probabilità di pioggia, temperatura percepita).
- Scrivi in modo semplice e cordiale, come una persona del posto che conosce il meteo. Frasi brevi, al massimo 120 parole. Niente titoli, tabelle o elenchi lunghi; al massimo un breve elenco se serve davvero.
- Rispondi nella lingua indicata nel messaggio.
- Sicurezza prima di tutto: con allerte arancioni o rosse, temporali, raffiche forti in vetta o mare agitato, sconsiglia chiaramente l'attività rischiosa. Ricorda che per la sicurezza fanno fede gli avvisi ufficiali della Protezione Civile e, in mare, della Capitaneria di porto. Il rischio incendi nei dati è una stima dell'app, non il bollettino ufficiale.
- In caso di emergenza indica il 112 (in mare il 1530, per gli incendi il 115).
- Se la domanda non riguarda il meteo o le attività all'aperto nel Cilento, rispondi gentilmente che puoi aiutare solo su questi temi.`;

const NOMI_LINGUA = { it:"italiano", en:"English", de:"Deutsch" };
const RISPOSTE_FISSE = {
  rifiuto:{ it:"Su questa domanda non posso aiutarti. Chiedimi del meteo o delle attività all'aperto nel Cilento.", en:"I can't help with that. Ask me about the weather or outdoor activities in Cilento.", de:"Dabei kann ich nicht helfen. Frag mich nach dem Wetter oder nach Aktivitäten im Freien im Cilento." },
  vuota:{ it:"Non sono riuscito a formulare una risposta. Prova a riformulare la domanda.", en:"I couldn't put together an answer. Try rephrasing the question.", de:"Ich konnte keine Antwort formulieren. Versuche, die Frage anders zu stellen." }
};

// Il fallback lato server sui rifiuti è disponibile per questi modelli
const conFallback = modello => /^claude-(opus-5|fable-5|sonnet-5-5)/.test(modello);

async function contaDomanda(req, env){
  const limite = Number(env.LIMITE_AI || 30);
  const ip = req.headers.get("CF-Connecting-IP") || "sconosciuto";
  const giorno = new Date().toISOString().slice(0, 10);
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip + giorno));
  const chiave = "ai:" + giorno + ":" + [...new Uint8Array(h)].slice(0, 12).map(b => b.toString(16).padStart(2, "0")).join("");
  const usate = Number(await env.ISCRITTI.get(chiave) || 0);
  if(usate >= limite) return false;
  await env.ISCRITTI.put(chiave, String(usate + 1), { expirationTtl: 2 * 86400 });
  return true;
}

async function assistente(req, env){
  if(!env.ANTHROPIC_API_KEY) return risposta(env, { errore:"assistente non configurato" }, 503);
  let dati;
  try{ dati = await req.json(); }catch(e){ return risposta(env, { errore:"JSON non valido" }, 400); }

  const lingua = NOMI_LINGUA[dati?.lingua] ? dati.lingua : "it";
  const domanda = typeof dati?.domanda === "string" ? dati.domanda.trim().slice(0, 400) : "";
  if(!domanda) return risposta(env, { errore:"domanda mancante" }, 400);
  const contesto = JSON.stringify(dati.contesto ?? {});
  if(contesto.length > 40000) return risposta(env, { errore:"contesto troppo grande" }, 413);

  // conversazione precedente: solo coppie domanda/risposta, testo breve
  const storia = [];
  for(const v of (Array.isArray(dati.storia) ? dati.storia.slice(-6) : [])){
    const ruolo = v?.ruolo === "assistente" ? "assistant" : v?.ruolo === "utente" ? "user" : null;
    if(!ruolo || typeof v.testo !== "string") continue;
    if(storia.length ? storia[storia.length - 1].role === ruolo : ruolo !== "user") continue;
    storia.push({ role: ruolo, content: v.testo.slice(0, 1500) });
  }
  if(storia.length && storia[storia.length - 1].role === "user") storia.pop();

  if(!(await contaDomanda(req, env))) return risposta(env, { errore:"troppe domande per oggi" }, 429);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 });
  const modello = env.MODELLO_AI || "claude-opus-5-5";
  try{
    const msg = await client.beta.messages.create({
      model: modello,
      max_tokens: 4000,
      system: [{ type:"text", text: SISTEMA, cache_control:{ type:"ephemeral" } }],
      output_config: { effort: "low" },
      ...(conFallback(modello) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } : {}),
      messages: [
        ...storia,
        { role:"user", content: `Lingua della risposta: ${NOMI_LINGUA[lingua]}\n\nDati dell'app (JSON):\n${contesto}\n\nDomanda: ${domanda}` }
      ]
    });
    if(msg.stop_reason === "refusal") return risposta(env, { risposta: RISPOSTE_FISSE.rifiuto[lingua] });
    const testo = msg.content.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    return risposta(env, { risposta: testo || RISPOSTE_FISSE.vuota[lingua] });
  }catch(e){
    if(e instanceof Anthropic.RateLimitError) return risposta(env, { errore:"assistente occupato, riprova tra poco" }, 503);
    if(e instanceof Anthropic.AuthenticationError) return risposta(env, { errore:"chiave dell'assistente non valida" }, 503);
    if(e instanceof Anthropic.APIError) return risposta(env, { errore:"assistente non disponibile" }, 502);
    return risposta(env, { errore:"assistente non disponibile" }, 502);
  }
}
