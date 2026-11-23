// Test della cifratura e della firma: decifra come farebbe il browser (RFC 8291)
// e verifica la firma VAPID con la chiave pubblica. Uso: node notifiche/test-webpush.mjs
import { cifra, intestazioneVapid, b64uCodifica, b64uDecodifica } from "./webpush.js";
const te = new TextEncoder(), td = new TextDecoder();
const assert = (c, m) => { if(!c){ console.error("FALLITO:", m); process.exit(1); } console.log("ok -", m); };

async function hkdf(sale, chiave, info, n){
  const k = await crypto.subtle.importKey("raw", chiave, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name:"HKDF", hash:"SHA-256", salt:sale, info }, k, n * 8));
}
const unisci = (...p) => { const o = new Uint8Array(p.reduce((n, x) => n + x.length, 0)); let i = 0; for(const x of p){ o.set(x, i); i += x.length; } return o; };

// 1) un "browser" finto: chiavi dell'abbonamento
const ua = await crypto.subtle.generateKey({ name:"ECDH", namedCurve:"P-256" }, true, ["deriveBits"]);
const uaPub = new Uint8Array(await crypto.subtle.exportKey("raw", ua.publicKey));
const auth = crypto.getRandomValues(new Uint8Array(16));
const messaggio = JSON.stringify({ titolo:"Allerta arancione domani", testo:"Rischio temporali · Basso Cilento", url:"./#allerte" });

const corpo = await cifra(messaggio, b64uCodifica(uaPub), b64uCodifica(auth));

// 2) decifratura lato browser
const sale = corpo.slice(0, 16);
const rs = new DataView(corpo.buffer, corpo.byteOffset + 16, 4).getUint32(0);
const idlen = corpo[20];
const asPub = corpo.slice(21, 21 + idlen);
const cifrato = corpo.slice(21 + idlen);
assert(rs === 4096 && idlen === 65, "intestazione aes128gcm corretta");
const asKey = await crypto.subtle.importKey("raw", asPub, { name:"ECDH", namedCurve:"P-256" }, false, []);
const condiviso = new Uint8Array(await crypto.subtle.deriveBits({ name:"ECDH", public:asKey }, ua.privateKey, 256));
const prk = await hkdf(auth, condiviso, unisci(te.encode("WebPush: info\0"), uaPub, asPub), 32);
const cek = await hkdf(sale, prk, te.encode("Content-Encoding: aes128gcm\0"), 16);
const nonce = await hkdf(sale, prk, te.encode("Content-Encoding: nonce\0"), 12);
const k = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]);
const chiaro = new Uint8Array(await crypto.subtle.decrypt({ name:"AES-GCM", iv:nonce }, k, cifrato));
assert(chiaro[chiaro.length - 1] === 2, "delimitatore di ultimo record presente");
assert(td.decode(chiaro.slice(0, -1)) === messaggio, "il browser decifra esattamente il messaggio");

// 3) firma VAPID verificabile con la chiave pubblica
const v = await crypto.subtle.generateKey({ name:"ECDSA", namedCurve:"P-256" }, true, ["sign", "verify"]);
const pub = b64uCodifica(await crypto.subtle.exportKey("raw", v.publicKey));
const d = (await crypto.subtle.exportKey("jwk", v.privateKey)).d;
const h = await intestazioneVapid("https://fcm.googleapis.com/fcm/send/abc", pub, d, "mailto:esempio@example.com");
const jwt = h.match(/t=([^,]+)/)[1], [a, b, f] = jwt.split(".");
const ok = await crypto.subtle.verify({ name:"ECDSA", hash:"SHA-256" }, v.publicKey, b64uDecodifica(f), te.encode(`${a}.${b}`));
const claims = JSON.parse(td.decode(b64uDecodifica(b)));
assert(ok, "firma VAPID valida");
assert(claims.aud === "https://fcm.googleapis.com" && claims.exp > Date.now() / 1000, "destinatario e scadenza VAPID corretti");
assert(h.includes(`k=${pub}`), "chiave pubblica nell'intestazione");
console.log("Tutti i test superati.");
