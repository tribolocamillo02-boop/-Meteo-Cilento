// Prova dell'assistente senza rete: richiesta a Claude, lingua, limite giornaliero, errori.
// Uso: node test-assistente.mjs
import worker from "./worker.js";
const assert = (c, m) => { if(!c){ console.error("FALLITO:", m); process.exit(1); } console.log("ok -", m); };

const kv = new Map();
const env = {
  ISCRITTI: { get: async k => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); }, delete: async k => { kv.delete(k); } },
  SITO: "https://esempio.github.io/-Meteo-Cilento/", ANTHROPIC_API_KEY: "sk-ant-prova", LIMITE_AI: "3"
};

let ultima = null, risposta = null;
globalThis.fetch = async (url, opz = {}) => {
  url = String(url);
  if(!url.startsWith("https://api.anthropic.com/v1/messages")) throw new Error("fetch inatteso " + url);
  const h = new Headers(opz.headers);
  ultima = { url, headers: h, body: JSON.parse(opz.body) };
  const r = risposta || { status: 200, json: { id:"msg_1", type:"message", role:"assistant", model:"claude-opus-5-5",
    content:[{ type:"thinking", thinking:"", signature:"x" }, { type:"text", text:"Sì: domani mare poco mosso e poco vento. Vai la mattina." }],
    stop_reason:"end_turn", stop_sequence:null, usage:{ input_tokens:900, output_tokens:60 } } };
  return new Response(JSON.stringify(r.json), { status: r.status, headers:{ "content-type":"application/json", "request-id":"req_1" } });
};

const chiedi = (corpo, ip = "1.2.3.4") => worker.fetch(new Request("https://worker.esempio/assistente", {
  method:"POST", body: JSON.stringify(corpo), headers:{ "Content-Type":"application/json", "CF-Connecting-IP": ip } }), env);
const contesto = { adesso:"23/11/2026, 10:00:00", luogo:{ tipo:"paese", nome:"Palinuro" }, mare_qui:{ onde_m:0.4 } };

let r = await chiedi({ domanda:"Domani posso andare al mare?", contesto, lingua:"it",
  storia:[{ ruolo:"utente", testo:"Ciao" }, { ruolo:"assistente", testo:"Ciao! Come posso aiutarti?" }] });
let j = await r.json();
assert(r.status === 200 && j.risposta.startsWith("Sì: domani"), "risposta del modello restituita (solo il testo, non il ragionamento)");
const b = ultima.body;
assert(b.model === "claude-opus-5-5", "modello predefinito claude-opus-5-5");
assert(b.system[0].cache_control?.type === "ephemeral" && b.system[0].text.includes("Meteo Cilento"), "istruzioni di sistema fisse e messe in cache");
assert(b.output_config?.effort === "low" && b.max_tokens === 4000, "sforzo basso e limite di token");
assert(b.fallbacks === "default" && (ultima.headers.get("anthropic-beta") || "").includes("server-side-fallback-2026-07-01"), "fallback lato server sui rifiuti attivo");
assert(ultima.headers.get("x-api-key") === "sk-ant-prova" || ultima.headers.get("authorization") === "Bearer sk-ant-prova", "chiave dell'API inviata dal server");
assert(b.messages.length === 3 && b.messages[0].role === "user" && b.messages[1].role === "assistant", "conversazione precedente inclusa");
const ultimo = b.messages[2].content;
assert(ultimo.includes("Lingua della risposta: italiano") && ultimo.includes('"Palinuro"') && ultimo.endsWith("Domanda: Domani posso andare al mare?"), "dati dell'app e domanda nell'ultimo messaggio");

r = await chiedi({ domanda:"Can I go hiking tomorrow?", contesto, lingua:"en" });
assert(r.status === 200 && ultima.body.messages.at(-1).content.includes("Lingua della risposta: English"), "lingua inglese richiesta al modello");

risposta = { status: 200, json: { id:"msg_2", type:"message", role:"assistant", model:"claude-opus-5-5", content:[], stop_reason:"refusal",
  stop_details:{ type:"refusal", category:null, explanation:null }, stop_sequence:null, usage:{ input_tokens:10, output_tokens:0 } } };
r = await chiedi({ domanda:"Domanda fuori tema", contesto, lingua:"de" }); j = await r.json();
assert(r.status === 200 && j.risposta.startsWith("Dabei kann ich nicht helfen"), "rifiuto gestito con un messaggio nella lingua giusta");

risposta = null;
r = await chiedi({ domanda:"Quarta domanda", contesto });
assert(r.status === 429, "limite giornaliero per telefono rispettato (3 nella prova)");
r = await chiedi({ domanda:"Da un altro telefono", contesto }, "5.6.7.8");
assert(r.status === 200, "il limite vale per ogni telefono separatamente");

risposta = { status: 429, json: { type:"error", error:{ type:"rate_limit_error", message:"slow down" } } };
r = await chiedi({ domanda:"Ancora", contesto }, "9.9.9.9"); j = await r.json();
assert(r.status === 503 && /occupato/.test(j.errore), "API sovraccarica: messaggio di riprova");
risposta = null;

r = await chiedi({ domanda:"", contesto }, "8.8.8.8");
assert(r.status === 400, "domanda vuota rifiutata");
r = await chiedi({ domanda:"x", contesto:{ grande:"a".repeat(50000) } }, "8.8.8.8");
assert(r.status === 413, "contesto troppo grande rifiutato");
const senzaChiave = await worker.fetch(new Request("https://worker.esempio/assistente", { method:"POST", body:"{}" }), { ...env, ANTHROPIC_API_KEY: undefined });
assert(senzaChiave.status === 503, "senza chiave l'assistente risulta non configurato");
console.log("Tutti i test dell'assistente superati.");
