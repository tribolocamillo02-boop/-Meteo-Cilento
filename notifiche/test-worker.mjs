// Prova completa del Worker senza rete: iscrizione, allerta, pioggia, abbonamento scaduto.
// Uso: node notifiche/test-worker.mjs
import worker from "./worker.js";
import { b64uCodifica } from "./webpush.js";
const td = new TextDecoder(), te = new TextEncoder();
const assert = (c, m) => { if(!c){ console.error("FALLITO:", m); process.exit(1); } console.log("ok -", m); };

// KV finto
const kv = new Map();
const KV = {
  get: async k => kv.get(k) ?? null,
  put: async (k, v) => { kv.set(k, v); },
  delete: async k => { kv.delete(k); },
  list: async ({ prefix }) => ({ keys: [...kv.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true })
};
const v = await crypto.subtle.generateKey({ name:"ECDSA", namedCurve:"P-256" }, true, ["sign", "verify"]);
const env = {
  ISCRITTI: KV, SITO: "https://esempio.it/",
  VAPID_PUBBLICA: b64uCodifica(await crypto.subtle.exportKey("raw", v.publicKey)),
  VAPID_PRIVATA: (await crypto.subtle.exportKey("jwk", v.privateKey)).d,
  VAPID_SOGGETTO: "https://esempio.github.io/"
};

// due telefoni finti
async function telefono(){
  const k = await crypto.subtle.generateKey({ name:"ECDH", namedCurve:"P-256" }, true, ["deriveBits"]);
  const pub = new Uint8Array(await crypto.subtle.exportKey("raw", k.publicKey));
  const auth = crypto.getRandomValues(new Uint8Array(16));
  return { k, pub, auth };
}
const A = await telefono(), B = await telefono();

const roma = d => new Intl.DateTimeFormat("sv-SE", { timeZone:"Europe/Rome" }).format(d);
const oggi = roma(new Date()), domani = roma(new Date(Date.now() + 86400000));
const ricevute = [];
let piove = false;

async function decifra(tel, corpo){
  const u = new Uint8Array(corpo);
  const sale = u.slice(0, 16), asPub = u.slice(21, 86), c = u.slice(86);
  const as = await crypto.subtle.importKey("raw", asPub, { name:"ECDH", namedCurve:"P-256" }, false, []);
  const sh = new Uint8Array(await crypto.subtle.deriveBits({ name:"ECDH", public:as }, tel.k.privateKey, 256));
  const H = async (s, k, i, n) => new Uint8Array(await crypto.subtle.deriveBits({ name:"HKDF", hash:"SHA-256", salt:s, info:i }, await crypto.subtle.importKey("raw", k, "HKDF", false, ["deriveBits"]), n * 8));
  const cat = (...p) => { const o = new Uint8Array(p.reduce((n, x) => n + x.length, 0)); let i = 0; for(const x of p){ o.set(x, i); i += x.length; } return o; };
  const prk = await H(tel.auth, sh, cat(te.encode("WebPush: info\0"), tel.pub, asPub), 32);
  const cek = await H(sale, prk, te.encode("Content-Encoding: aes128gcm\0"), 16), iv = await H(sale, prk, te.encode("Content-Encoding: nonce\0"), 12);
  const p = new Uint8Array(await crypto.subtle.decrypt({ name:"AES-GCM", iv }, await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]), c));
  return JSON.parse(td.decode(p.slice(0, -1)));
}

globalThis.fetch = async (url, opz = {}) => {
  url = String(url);
  if(url.endsWith("allerta.json")) return new Response(JSON.stringify({
    zone:{ S:"Piana Sele e Alto Cilento", B:"Basso Cilento", T:"Tanagro" },
    giorni:{ [oggi]:{ S:{livello:"verde",temporali:"verde",idrogeologico:"verde",idraulico:"verde"}, B:{livello:"verde",temporali:"verde",idrogeologico:"verde",idraulico:"verde"} },
             [domani]:{ S:{livello:"verde",temporali:"verde",idrogeologico:"verde",idraulico:"verde"}, B:{livello:"arancione",temporali:"arancione",idrogeologico:"giallo",idraulico:"verde"} } }
  }));
  if(url.includes("api.open-meteo.com")){
    const n = new URL(url).searchParams.get("latitude").split(",").length;
    const uno = { minutely_15:{ time:["2026-11-23T15:00","2026-11-23T15:15","2026-11-23T15:30","2026-11-23T15:45","2026-11-23T16:00"], precipitation: piove ? [0,0,0.6,1.2,0.8] : [0,0,0,0,0] } };
    return new Response(JSON.stringify(n > 1 ? Array(n).fill(uno) : uno));
  }
  if(url.startsWith("https://push.esempio/")){
    const chi = url.endsWith("/A") ? A : B;
    assert(opz.headers["Content-Encoding"] === "aes128gcm" && opz.headers.Authorization.startsWith("vapid t="), "intestazioni push corrette");
    ricevute.push({ chi: url.endsWith("/A") ? "A" : "B", dati: await decifra(chi, opz.body) });
    return new Response(null, { status: url.endsWith("/B") && globalThis.scadutoB ? 410 : 201 });
  }
  throw new Error("fetch inatteso " + url);
};

const post = (p, corpo) => worker.fetch(new Request("https://worker.esempio" + p, { method:"POST", body: JSON.stringify(corpo), headers:{ "Content-Type":"application/json" } }), env);
const abb = (tel, id) => ({ endpoint:"https://push.esempio/" + id, keys:{ p256dh:b64uCodifica(tel.pub), auth:b64uCodifica(tel.auth) } });
const ctx = { waitUntil: p => (ctx.p = p) };
const giro = async () => { await worker.scheduled({}, env, ctx); await ctx.p; };

// iscrizioni: A a Sapri (Basso Cilento, inglese), B a Casal Velino (Alto Cilento)
let r = await post("/iscrivi", { abbonamento: abb(A, "A"), luogo:{ nome:"Sapri", lat:40.0746, lon:15.6321, zona:"B" }, tipi:{ allerte:true, pioggia:true }, lingua:"en" });
assert(r.status === 200, "iscrizione A accettata");
r = await post("/iscrivi", { abbonamento: abb(B, "B"), luogo:{ nome:"Casal Velino", lat:40.1903, lon:15.1114, zona:"S" }, tipi:{ allerte:true, pioggia:true }, lingua:"it" });
assert(r.status === 200 && kv.size === 2, "iscrizione B accettata");
r = await post("/iscrivi", { abbonamento:{ endpoint:"http://x" }, luogo:{} });
assert(r.status === 400, "iscrizione non valida rifiutata");

await giro();
assert(ricevute.length === 1 && ricevute[0].chi === "A", "solo A riceve l'allerta della sua zona");
assert(ricevute[0].dati.titolo === "Orange alert tomorrow · Basso Cilento", "titolo dell'allerta in inglese: " + ricevute[0].dati.titolo);
await giro();
assert(ricevute.length === 1, "la stessa allerta non viene rimandata");

piove = true;
await giro();
const pioggia = ricevute.slice(1);
assert(pioggia.length === 2 && pioggia.every(x => x.dati.titolo.startsWith("Rain") || x.dati.titolo.startsWith("Pioggia")), "avviso di pioggia a entrambi");
assert(pioggia.find(x => x.chi === "B").dati.testo === "Verso le 15:30 a Casal Velino. Meglio avere l'ombrello.", "testo della pioggia corretto");
await giro();
assert(ricevute.length === 3, "niente secondo avviso di pioggia entro 3 ore");

globalThis.scadutoB = true;
const chiaveB = [...kv.keys()].find(k => JSON.parse(kv.get(k)).luogo.nome === "Casal Velino");
const vb = JSON.parse(kv.get(chiaveB)); vb.ultimaPioggia = 0; kv.set(chiaveB, JSON.stringify(vb));
await giro();
assert(!kv.has(chiaveB), "abbonamento scaduto (410) cancellato");

r = await post("/disiscrivi", { endpoint:"https://push.esempio/A" });
assert(r.status === 200 && kv.size === 0, "disiscrizione");
console.log("Tutti i test del Worker superati.");
