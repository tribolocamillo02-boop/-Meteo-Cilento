# Notifiche di Meteo Cilento

Il server delle notifiche è un piccolo programma che gira gratis su **Cloudflare Workers**.
Ogni 15 minuti controlla il bollettino di allerta e la pioggia in arrivo e manda gli avvisi
ai telefoni iscritti. Finché non è attivo, nell'app la scheda «Notifiche» resta nascosta.

## Cosa serve

- Un account gratuito su [cloudflare.com](https://dash.cloudflare.com/sign-up).
- Un computer con [Node.js](https://nodejs.org) (versione 20 o più recente).

## Passi (circa 15 minuti, da fare una volta sola)

Apri un terminale nella cartella `notifiche` del repository, poi:

1. **Accedi a Cloudflare**
   ```
   npx wrangler login
   ```
2. **Crea l'archivio degli iscritti**
   ```
   npx wrangler kv namespace create ISCRITTI
   ```
   Copia l'`id` che compare e incollalo in `wrangler.toml` al posto di `INCOLLA_QUI_L_ID_DEL_KV`.
3. **Genera le chiavi**
   ```
   node genera-chiavi.mjs
   ```
   - La chiave **pubblica** va in `wrangler.toml` al posto di `INCOLLA_QUI_LA_CHIAVE_PUBBLICA`.
   - La chiave **privata** va salvata come segreto (non scriverla in nessun file):
     ```
     npx wrangler secret put VAPID_PRIVATA
     ```
4. **Pubblica il server**
   ```
   npx wrangler deploy
   ```
   Alla fine compare l'indirizzo del server, simile a
   `https://meteo-cilento-notifiche.TUONOME.workers.dev`.
5. **Collega l'app**: nel file `notifiche.json` (nella cartella principale del sito) scrivi
   ```json
   { "server": "https://meteo-cilento-notifiche.TUONOME.workers.dev", "chiavePubblica": "LA_CHIAVE_PUBBLICA" }
   ```
   Da quel momento, nella sezione **Allerte** dell'app compare la scheda «Notifiche».

## Prove

- `node test-webpush.mjs` verifica cifratura e firma delle notifiche.
- `node test-worker.mjs` prova tutto il server senza rete (iscrizione, allerta, pioggia, disiscrizione).

## Limiti del piano gratuito

Cloudflare Workers gratuito basta per centinaia di iscritti: 100.000 richieste e
100.000 letture al giorno. Ogni controllo legge una volta ogni iscritto.

## Note

- Su **iPhone** le notifiche funzionano solo con l'app installata dalla schermata Home
  (iOS 16.4 o successivo).
- Il server conserva solo l'indirizzo tecnico di notifica del telefono, il paese scelto,
  i tipi di avviso e la lingua. Chi disattiva le notifiche viene cancellato subito.
