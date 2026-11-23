// Invio di notifiche Web Push secondo gli standard RFC 8291 (cifratura aes128gcm)
// e RFC 8292 (identificazione VAPID). Usa solo WebCrypto: funziona su Cloudflare
// Workers e su Node.js 20+.

const te = new TextEncoder();

export function b64uDecodifica(s){
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while(s.length % 4) s += "=";
  const bin = atob(s);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

export function b64uCodifica(buf){
  const b = new Uint8Array(buf);
  let s = "";
  for(const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unisci(...parti){
  const tot = parti.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(tot);
  let o = 0;
  for(const p of parti){ out.set(p, o); o += p.length; }
  return out;
}

async function hkdf(sale, chiave, info, lunghezza){
  const k = await crypto.subtle.importKey("raw", chiave, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name:"HKDF", hash:"SHA-256", salt: sale, info }, k, lunghezza * 8);
  return new Uint8Array(bits);
}

// Cifra il contenuto per un abbonamento (keys.p256dh e keys.auth del browser)
export async function cifra(contenuto, p256dh, auth){
  const uaPubblica = b64uDecodifica(p256dh);
  const segretoAuth = b64uDecodifica(auth);
  const effimera = await crypto.subtle.generateKey({ name:"ECDH", namedCurve:"P-256" }, true, ["deriveBits"]);
  const asPubblica = new Uint8Array(await crypto.subtle.exportKey("raw", effimera.publicKey));
  const uaChiave = await crypto.subtle.importKey("raw", uaPubblica, { name:"ECDH", namedCurve:"P-256" }, false, []);
  const condiviso = new Uint8Array(await crypto.subtle.deriveBits({ name:"ECDH", public: uaChiave }, effimera.privateKey, 256));

  const prk = await hkdf(segretoAuth, condiviso, unisci(te.encode("WebPush: info\0"), uaPubblica, asPubblica), 32);
  const sale = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(sale, prk, te.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(sale, prk, te.encode("Content-Encoding: nonce\0"), 12);

  const testo = unisci(te.encode(contenuto), new Uint8Array([2]));   // 0x02 = ultimo record
  const chiaveAes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cifrato = new Uint8Array(await crypto.subtle.encrypt({ name:"AES-GCM", iv: nonce }, chiaveAes, testo));

  const rs = new Uint8Array([0, 0, 16, 0]);                           // dimensione record 4096
  return unisci(sale, rs, new Uint8Array([asPubblica.length]), asPubblica, cifrato);
}

// Firma VAPID (JWT ES256) per il servizio push dell'abbonamento
export async function intestazioneVapid(endpoint, pubblica, privataD, soggetto){
  const pub = b64uDecodifica(pubblica);
  const jwk = { kty:"EC", crv:"P-256", x: b64uCodifica(pub.slice(1, 33)), y: b64uCodifica(pub.slice(33, 65)), d: privataD, ext:true };
  const chiave = await crypto.subtle.importKey("jwk", jwk, { name:"ECDSA", namedCurve:"P-256" }, false, ["sign"]);
  const testa = b64uCodifica(te.encode(JSON.stringify({ typ:"JWT", alg:"ES256" })));
  const corpo = b64uCodifica(te.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: soggetto
  })));
  const firma = await crypto.subtle.sign({ name:"ECDSA", hash:"SHA-256" }, chiave, te.encode(`${testa}.${corpo}`));
  return `vapid t=${testa}.${corpo}.${b64uCodifica(firma)}, k=${pubblica}`;
}

// Invia una notifica. Restituisce lo stato HTTP del servizio push (201 = inviata,
// 404/410 = abbonamento scaduto, da cancellare).
export async function inviaNotifica(abbonamento, dati, vapid){
  const corpo = await cifra(JSON.stringify(dati), abbonamento.keys.p256dh, abbonamento.keys.auth);
  const r = await fetch(abbonamento.endpoint, {
    method:"POST",
    headers:{
      "Authorization": await intestazioneVapid(abbonamento.endpoint, vapid.pubblica, vapid.privata, vapid.soggetto),
      "Content-Encoding":"aes128gcm",
      "Content-Type":"application/octet-stream",
      "TTL":"43200",
      "Urgency":"high"
    },
    body: corpo
  });
  return r.status;
}
