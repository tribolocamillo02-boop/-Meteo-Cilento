// Genera la coppia di chiavi VAPID per le notifiche.
// Uso: node notifiche/genera-chiavi.mjs
// La chiave PUBBLICA va in wrangler.toml e in notifiche.json (sito);
// la chiave PRIVATA va SOLO nel segreto del Worker (npx wrangler secret put VAPID_PRIVATA).
import { b64uCodifica } from "./webpush.js";
const k = await crypto.subtle.generateKey({ name:"ECDSA", namedCurve:"P-256" }, true, ["sign", "verify"]);
const pubblica = b64uCodifica(await crypto.subtle.exportKey("raw", k.publicKey));
const privata = (await crypto.subtle.exportKey("jwk", k.privateKey)).d;
console.log("Chiave PUBBLICA (va bene condividerla):\n" + pubblica + "\n");
console.log("Chiave PRIVATA (tienila segreta, non metterla nel repository):\n" + privata);
