# Server di Meteo Cilento: notifiche e assistente

Il server è un piccolo programma che gira su **Cloudflare Workers** (piano gratuito) e fa due cose:

- **Notifiche**: ogni 15 minuti controlla il bollettino di allerta e la pioggia in arrivo e
  manda gli avvisi ai telefoni iscritti.
- **Assistente**: risponde alle domande delle persone usando il modello di intelligenza
  artificiale **Claude** di Anthropic e i dati meteo che l'app gli manda.

Finché il server non è attivo, nell'app la scheda «Notifiche» e il pulsante «Chiedi» restano nascosti.

## Cosa serve

- Un account gratuito su [cloudflare.com](https://dash.cloudflare.com/sign-up).
- Un computer con [Node.js](https://nodejs.org) (versione 20 o più recente).

## Passi (circa 15 minuti, da fare una volta sola)

Apri un terminale nella cartella `notifiche` del repository, poi:

0. **Installa le librerie**
   ```
   npm install
   ```
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
   { "server": "https://meteo-cilento-notifiche.TUONOME.workers.dev", "chiavePubblica": "LA_CHIAVE_PUBBLICA", "assistente": false }
   ```
   Da quel momento, nella sezione **Allerte** dell'app compare la scheda «Notifiche».

## Attivare l'assistente (facoltativo, a pagamento)

L'assistente usa l'API di Anthropic, che si paga in base all'uso.

1. Crea un account su [console.anthropic.com](https://console.anthropic.com), aggiungi un metodo
   di pagamento e crea una **chiave API**. Conviene impostare anche un limite di spesa mensile.
2. Salva la chiave come segreto del server (non scriverla in nessun file):
   ```
   npx wrangler secret put ANTHROPIC_API_KEY
   ```
3. In `notifiche.json` metti `"assistente": true`. Nell'app compare il pulsante «Chiedi».

**Costi indicativi** con il modello predefinito, Claude Opus 5.5 ($4 per milione di token in
ingresso, $20 in uscita): ogni domanda manda circa 3.000 token di dati meteo e riceve una
risposta breve, quindi costa **circa 2 centesimi di dollaro**. Ogni telefono può fare al massimo
30 domande al giorno (`LIMITE_AI` in `wrangler.toml`). Il modello si cambia con `MODELLO_AI`
(per esempio `claude-haiku-5-5`, molto più economico ma meno accurato).

## Prove

- `node test-webpush.mjs` verifica cifratura e firma delle notifiche.
- `node test-worker.mjs` prova le notifiche senza rete (iscrizione, allerta, pioggia, disiscrizione).
- `node test-assistente.mjs` prova l'assistente senza rete (richiesta a Claude, lingua, limite giornaliero, errori).

## Limiti del piano gratuito

Cloudflare Workers gratuito basta per centinaia di iscritti: 100.000 richieste e
100.000 letture al giorno. Ogni controllo legge una volta ogni iscritto. Ogni domanda
all'assistente usa una scrittura per il conteggio giornaliero (il piano gratuito ne ha 1.000 al giorno).

## Note

- Su **iPhone** le notifiche funzionano solo con l'app installata dalla schermata Home
  (iOS 16.4 o successivo).
- Il server conserva solo l'indirizzo tecnico di notifica del telefono, il paese scelto,
  i tipi di avviso e la lingua. Chi disattiva le notifiche viene cancellato subito.
- Le domande all'assistente e i dati meteo del luogo vengono inviati ad Anthropic solo per
  generare la risposta; il server non le conserva. Vedi anche `privacy.html`.
