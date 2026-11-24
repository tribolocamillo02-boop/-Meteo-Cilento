# Cilento Meteo

Previsioni meteo per tutti i paesi del Cilento (118 tra comuni e località di mare, compresi Vallo di Diano, Alburni e Piana del Sele): condizioni attuali, prossime 24 ore,
7 giorni ora per ora, mare, radar delle precipitazioni e allerte.

Dati: [Open-Meteo](https://open-meteo.com) (meteo e mare), [radar della Protezione Civile](https://radar.protezionecivile.gov.it) (CC BY-SA 4.0, con [RainViewer](https://www.rainviewer.com) di riserva),
[Wikimedia Commons](https://commons.wikimedia.org) (foto), © OpenStreetMap © CARTO (mappa).

## Funzioni

- **Meteo** di 118 paesi o della posizione esatta (GPS), con riassunto della giornata,
  pioggia nelle prossime 2 ore (ogni 15 minuti) e pioggia vista dal radar intorno a te.
- **Previsioni** ora per ora per 7 giorni, grafico delle temperature, sole, luna, aria e pollini.
- **Mare**: dove andare oggi (mare più calmo e vento da terra), stato del mare e 7 giorni.
- **Montagna**: meteo in vetta su Cervati, Panormo, Gelbison, Motola, Centaurino e Bulgheria,
  con giudizio per salire.
- **Radar** della Protezione Civile, animato, aggiornato ogni 5 minuti.
- **Allerte**: livello ufficiale per la zona del paese, consigli e numeri utili.
- **Condividi**: crea un'immagine del meteo da mandare su WhatsApp e social.
- **Lingue**: italiano, inglese e tedesco (scelta in alto, oppure automatica dal telefono).
- **Preferiti**: i paesi con la stella compaiono in cima alla lista e in una riga con la temperatura.
- **Le ore migliori di oggi**: passeggiata, corsa o bici, spiaggia, stendere i panni.
- **Barca e pesca**: giudizio per uscire in barca ora per ora e condizioni per la pesca.
- **Rischio incendi** (stima dell'app), **caldo e afa**, **tramonto** bello o no.
- **Rispetto al solito**: confronto con la media 1991–2020.
- **Balneabilità**: divieti di balneazione dal Portale Acque del Ministero della Salute
  (`balneazione.json`, aggiornato ogni 6 ore da `.github/workflows/balneazione.yml`).
- **Assistente** con intelligenza artificiale (Claude): risponde alle domande usando i dati
  dell'app. Richiede il server in `notifiche/` (vedi sotto).
- **Scorciatoie**: tenendo premuta l'icona dell'app installata si aprono Radar, Mare,
  Montagna e Allerte.
- **Privacy**: `privacy.html`, in tre lingue.

## Livello di allerta automatico

Il file `allerta.json` viene aggiornato ogni ora da **GitHub Actions**
(`.github/workflows/allerta.yml`, script `scripts/aggiorna_allerta.py`) leggendo il
bollettino di criticità nazionale della Protezione Civile (dati aperti CC BY 4.0).
Crea un commit solo quando esce un bollettino nuovo, di solito una volta al giorno.
Per avviarlo subito: scheda *Actions* del repository → *Aggiorna allerta* → *Run workflow*.

## Notifiche e assistente

Allerte e pioggia in arrivo possono arrivare come notifiche sul telefono, e l'assistente
risponde alle domande con l'intelligenza artificiale. Serve un piccolo server su Cloudflare
(gratuito; l'assistente usa l'API di Anthropic, a pagamento): istruzioni in
[`notifiche/LEGGIMI.md`](notifiche/LEGGIMI.md). Finché non è attivo, nell'app la scheda
«Notifiche» e il pulsante «Chiedi» restano nascosti.

## Pagine dei paesi per Google

Ogni paese ha la sua pagina (`paesi/<nome>/`), con titolo, descrizione, quota, zona,
paesi vicini e previsioni dal vivo, più l'elenco di tutti i paesi (`paesi/`),
`sitemap.xml` e `robots.txt`. Servono a farsi trovare cercando «meteo Palinuro» e simili.

- Si generano con `python3 scripts/genera_pagine.py` (da rifare solo se cambia l'elenco
  dei paesi in `index.html`; le quote sono salvate in `scripts/altitudini.json`).
- Per farle conoscere subito a Google: [Google Search Console](https://search.google.com/search-console)
  → aggiungi la proprietà con l'indirizzo del sito → *Sitemap* → invia `sitemap.xml`.

## Link diretti

`…/?paese=palinuro` apre l'app su quel paese (il nome è quello delle cartelle in `paesi/`).
L'indirizzo nella barra del browser segue il paese mostrato, e il pulsante Condividi usa lo stesso link.

## Modalità leggera

Sui telefoni lenti, con il risparmio dati attivo o la batteria sotto il 20% l'app toglie
sfocature e animazioni e riduce gli effetti meteo. Si attiva da sola (anche se l'animazione
non è fluida) oppure dal menu in alto (pulsante della lingua → *Modalità leggera*).

## Installare l'app sul telefono

Cilento Meteo si installa come un'app, senza store:

- **iPhone (Safari):** tocca *Condividi* e poi *Aggiungi alla schermata Home*.
- **Android (Chrome):** tocca *Installa* nel riquadro che compare in fondo alla pagina Meteo,
  oppure menu ⋮ → *Installa app*.

Si apre a schermo intero con la sua icona e funziona anche senza connessione,
mostrando gli ultimi dati scaricati (in alto compare «OFFLINE» con l'ora).

## Sponsor locali

Gli sponsor si gestiscono nel file `sponsor.json`. Finché è vuoto (`[]`), nella
pagina Meteo compare l'invito «Il tuo locale qui», che porta alla pagina
`pubblicita.html` con i pacchetti e i contatti (da inserire in `CONTATTO`, in
fondo a quella pagina).

```json
[
  {
    "nome": "Lido Esempio",
    "descrizione": "Ombrelloni e cucina di mare",
    "link": "https://www.esempio.it",
    "immagine": "sponsor/lido-esempio.jpg",
    "telefono": "+39 333 1234567",
    "paesi": ["Palinuro"],
    "sezioni": ["mare"],
    "dal": "2027-06-01",
    "al": "2027-09-30"
  }
]
```

- `nome`, `descrizione` e `link` sono obbligatori; tutto il resto è facoltativo.
- `immagine`: quadrata, circa 200×200 pixel, nella cartella `sponsor/`.
- `telefono`: aggiunge il pulsante «Chiama».
- Dove appare: `paesi` (nomi esatti dei paesi), `zone` (es. `"Vallo di Diano"`)
  oppure `centro` + `km` (es. `"centro": "Palinuro", "km": 20`). Senza nessuno
  di questi appare in tutto il Cilento. Gli sponsor del paese hanno la
  precedenza su quelli di zona e di tutto il Cilento.
- `sezioni`: `["meteo"]`, `["mare"]` o entrambe (predefinito).
- `dal` / `al`: periodo in cui è visibile (date AAAA-MM-GG).
- Al link vengono aggiunti `utm_source=cilentometeo`, `utm_medium=app` e
  `utm_campaign=<paese>`, così lo sponsor vede nelle sue statistiche le visite
  arrivate dall'app.
- Con più sponsor nello stesso posto, vengono mostrati a turno ogni 9 secondi.

## Le foto dei paesi

In alto il sito mostra una foto del comune scelto e ci disegna sopra il meteo reale
(pioggia, neve, nebbia, nuvole, lampi, sole, stelle di notte).

Se non trova foto proprie, ne prende una da Wikimedia Commons scattata vicino al paese.

### Usare le proprie foto

Si possono caricare foto vere di ogni paese con ogni tempo. Basta metterle nella
cartella del comune con il nome della condizione:

| File | Quando viene mostrato |
|---|---|
| `sole.jpg` | sereno o poco nuvoloso, di giorno |
| `nuvoloso.jpg` | cielo coperto |
| `nebbia.jpg` | nebbia |
| `pioggia.jpg` | pioggia, pioviggine o rovesci |
| `neve.jpg` | neve |
| `temporale.jpg` | temporale |
| `notte.jpg` | di notte con cielo sereno o nuvoloso |
| `pioggia-notte.jpg`, `temporale-notte.jpg`, … | una condizione, solo di notte |
| `default.jpg` | quando manca la foto della condizione (il sito la colora in base al meteo) |

Esempio: `foto/casal-velino/pioggia.jpg` viene mostrata quando piove a Casal Velino.

Consigli: formato **.jpg**, orizzontale, larga circa 1600 pixel, meno di 500 KB.
Non serve caricarle tutte: quelle che mancano vengono sostituite automaticamente.

**Come caricarle:** dal computer apri il repository su GitHub → *Add file* → *Upload files*
e trascina la cartella `foto` con dentro le cartelle dei comuni: GitHub mantiene la struttura.
In alternativa si possono mandare le foto a Claude, che le mette nella cartella giusta.

### Nomi delle cartelle

**Località di mare**

| Paese | Cartella |
|---|---|
| Acciaroli | `foto/acciaroli/` |
| Agnone Cilento | `foto/agnone-cilento/` |
| Licusati | `foto/licusati/` |
| Marina di Ascea | `foto/marina-di-ascea/` |
| Marina di Camerota | `foto/marina-di-camerota/` |
| Marina di Casal Velino | `foto/marina-di-casal-velino/` |
| Marina di Pisciotta | `foto/marina-di-pisciotta/` |
| Ogliastro Marina | `foto/ogliastro-marina/` |
| Paestum | `foto/paestum/` |
| Palinuro | `foto/palinuro/` |
| Pioppi | `foto/pioppi/` |
| San Marco di Castellabate | `foto/san-marco-di-castellabate/` |
| Santa Maria di Castellabate | `foto/santa-maria-di-castellabate/` |
| Scario | `foto/scario/` |

**Alto Cilento**

| Paese | Cartella |
|---|---|
| Agropoli | `foto/agropoli/` |
| Aquara | `foto/aquara/` |
| Ascea | `foto/ascea/` |
| Bellosguardo | `foto/bellosguardo/` |
| Campora | `foto/campora/` |
| Cannalonga | `foto/cannalonga/` |
| Capaccio Paestum | `foto/capaccio-paestum/` |
| Casal Velino | `foto/casal-velino/` |
| Castel San Lorenzo | `foto/castel-san-lorenzo/` |
| Castellabate | `foto/castellabate/` |
| Castelnuovo Cilento | `foto/castelnuovo-cilento/` |
| Ceraso | `foto/ceraso/` |
| Cicerale | `foto/cicerale/` |
| Felitto | `foto/felitto/` |
| Gioi | `foto/gioi/` |
| Giungano | `foto/giungano/` |
| Laureana Cilento | `foto/laureana-cilento/` |
| Laurino | `foto/laurino/` |
| Lustra | `foto/lustra/` |
| Magliano Vetere | `foto/magliano-vetere/` |
| Moio della Civitella | `foto/moio-della-civitella/` |
| Montecorice | `foto/montecorice/` |
| Monteforte Cilento | `foto/monteforte-cilento/` |
| Novi Velia | `foto/novi-velia/` |
| Ogliastro Cilento | `foto/ogliastro-cilento/` |
| Omignano | `foto/omignano/` |
| Orria | `foto/orria/` |
| Perdifumo | `foto/perdifumo/` |
| Perito | `foto/perito/` |
| Piaggine | `foto/piaggine/` |
| Pollica | `foto/pollica/` |
| Prignano Cilento | `foto/prignano-cilento/` |
| Roccadaspide | `foto/roccadaspide/` |
| Roscigno | `foto/roscigno/` |
| Rutino | `foto/rutino/` |
| Sacco | `foto/sacco/` |
| Salento | `foto/salento/` |
| San Mauro Cilento | `foto/san-mauro-cilento/` |
| Serramezzana | `foto/serramezzana/` |
| Sessa Cilento | `foto/sessa-cilento/` |
| Stella Cilento | `foto/stella-cilento/` |
| Stio | `foto/stio/` |
| Torchiara | `foto/torchiara/` |
| Trentinara | `foto/trentinara/` |
| Valle dell'Angelo | `foto/valle-dell-angelo/` |
| Vallo della Lucania | `foto/vallo-della-lucania/` |

**Basso Cilento**

| Paese | Cartella |
|---|---|
| Alfano | `foto/alfano/` |
| Camerota | `foto/camerota/` |
| Casaletto Spartano | `foto/casaletto-spartano/` |
| Caselle in Pittari | `foto/caselle-in-pittari/` |
| Celle di Bulgheria | `foto/celle-di-bulgheria/` |
| Centola | `foto/centola/` |
| Cuccaro Vetere | `foto/cuccaro-vetere/` |
| Futani | `foto/futani/` |
| Ispani | `foto/ispani/` |
| Laurito | `foto/laurito/` |
| Montano Antilia | `foto/montano-antilia/` |
| Morigerati | `foto/morigerati/` |
| Pisciotta | `foto/pisciotta/` |
| Policastro Bussentino | `foto/policastro-bussentino/` |
| Roccagloriosa | `foto/roccagloriosa/` |
| Rofrano | `foto/rofrano/` |
| San Giovanni a Piro | `foto/san-giovanni-a-piro/` |
| San Mauro la Bruca | `foto/san-mauro-la-bruca/` |
| Santa Marina | `foto/santa-marina/` |
| Sanza | `foto/sanza/` |
| Sapri | `foto/sapri/` |
| Torraca | `foto/torraca/` |
| Torre Orsaia | `foto/torre-orsaia/` |
| Tortorella | `foto/tortorella/` |
| Vibonati | `foto/vibonati/` |

**Alburni**

| Paese | Cartella |
|---|---|
| Castelcivita | `foto/castelcivita/` |
| Controne | `foto/controne/` |
| Corleto Monforte | `foto/corleto-monforte/` |
| Ottati | `foto/ottati/` |
| Petina | `foto/petina/` |
| Postiglione | `foto/postiglione/` |
| Sant'Angelo a Fasanella | `foto/sant-angelo-a-fasanella/` |
| Sicignano degli Alburni | `foto/sicignano-degli-alburni/` |

**Vallo di Diano**

| Paese | Cartella |
|---|---|
| Atena Lucana | `foto/atena-lucana/` |
| Auletta | `foto/auletta/` |
| Buonabitacolo | `foto/buonabitacolo/` |
| Caggiano | `foto/caggiano/` |
| Casalbuono | `foto/casalbuono/` |
| Monte San Giacomo | `foto/monte-san-giacomo/` |
| Montesano sulla Marcellana | `foto/montesano-sulla-marcellana/` |
| Padula | `foto/padula/` |
| Pertosa | `foto/pertosa/` |
| Polla | `foto/polla/` |
| Sala Consilina | `foto/sala-consilina/` |
| San Pietro al Tanagro | `foto/san-pietro-al-tanagro/` |
| San Rufo | `foto/san-rufo/` |
| Sant'Arsenio | `foto/sant-arsenio/` |
| Sassano | `foto/sassano/` |
| Teggiano | `foto/teggiano/` |

**Piana del Sele**

| Paese | Cartella |
|---|---|
| Albanella | `foto/albanella/` |
| Altavilla Silentina | `foto/altavilla-silentina/` |
| Serre | `foto/serre/` |

**Monti Eremita-Marzano**

| Paese | Cartella |
|---|---|
| Buccino | `foto/buccino/` |
| Palomonte | `foto/palomonte/` |
| Ricigliano | `foto/ricigliano/` |
| Romagnano al Monte | `foto/romagnano-al-monte/` |
| Salvitelle | `foto/salvitelle/` |
| San Gregorio Magno | `foto/san-gregorio-magno/` |


## Instagram automatico (@cilentometeo)

Il workflow `.github/workflows/instagram.yml` gira ogni ora e pubblica da solo:

| Quando | Cosa |
|---|---|
| ogni sera dalle 19 | storia «Domani nel Cilento» |
| il giovedì dalle 17 | post + storia «Il weekend nel Cilento» con didascalia e hashtag |
| allerta gialla, arancione o rossa | post + storia dell'allerta (una volta per bollettino, tra le 7 e le 23) |
| martedì e sabato dalle 12 | post + storia che mostra l'app (screenshot veri, 8 temi a rotazione: paesi, radar, mare, ora per ora, allerte, montagna, installazione, ore migliori) |
| venerdì dalle 12 | Reel «Il weekend nel Cilento» (video dall'app: Palinuro, Agropoli, Sapri) |
| quando piove (8–20, max uno al giorno) | Reel del radar della Protezione Civile |
| lunedì e mercoledì dalle 13, e ogni giorno se domani c'è un evento importante (temporali, neve, vento, caldo, freddo) | post «notizia» stile telegiornale: mappa del Cilento con pioggia o temperature di domani, titolo grande e didascalia per zone |
| domenica, e ogni giorno in cui arriva il maltempo (dalle 12) | Reel «la giornata ora per ora»: mappa satellitare del Cilento con nuvole che si muovono, pioggia come un radar, giorno e notte, paesi con icone 3D e temperature, dalle 6 alle 23 della giornata più interessante (16 s, ~28 fotogrammi per ora) |
| una volta sola (9–21) | kit di benvenuto da fissare in cima al profilo: Reel «Come si usa» e carosello «Cos'è Cilento Meteo» (8 immagini) |

Le immagini sono quelle di `social.html`, create con Playwright da `scripts/social.mjs`
e salvate in `social/immagini/` (restano solo gli ultimi 7 giorni). Lo stato delle
pubblicazioni è in `social/stato.json`.

Segreti del repository (Settings → Secrets and variables → Actions):

- `IG_TOKEN`: token di Instagram (API con accesso Instagram, permesso
  `instagram_business_content_publish`; l'account deve essere professionale di tipo
  **Azienda** per pubblicare le storie). Senza questo segreto il workflow non fa niente.
  Funzionano due tipi di token: quello «utente di sistema» dell'accesso unificato
  (inizia con `EAA`, usa graph.facebook.com e **non scade**) e quello «Instagram Login»
  (inizia con `IGAA`, usa graph.instagram.com e scade dopo 60 giorni). L'ID dell'account
  Instagram si può cambiare con la variabile `IG_UTENTE`.
- `GH_PAT` (solo per i token `IGAA`): token GitHub «fine-grained» limitato a questo
  repository con permesso **Secrets: Read and write**. Serve a rinnovare da solo
  `IG_TOKEN` ogni settimana.

Accorgimenti per far girare i Reel: grande scritta nei primi 1,2 secondi, nessuna pausa iniziale, durata 12–15 s con finale breve (si riguardano), suono di pioggia o sottofondo morbido, copertina sul momento più interessante, pubblicazione la sera (18–21), didascalie che invitano a commentare e condividere.

Se una pubblicazione fallisce non viene segnata in `social/stato.json` e il robot riprova all'ora successiva.

Per una prova: Actions → Instagram → Run workflow, con «Solo prova» o con
«Pubblica subito» = `storia`.
