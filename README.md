# Meteo Cilento

Previsioni meteo per i comuni del Cilento: condizioni attuali, prossime 24 ore,
7 giorni ora per ora, mare, radar delle precipitazioni e allerte.

Dati: [Open-Meteo](https://open-meteo.com) (meteo e mare), [RainViewer](https://www.rainviewer.com) (radar),
[Wikimedia Commons](https://commons.wikimedia.org) (foto), © OpenStreetMap © CARTO (mappa).

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

| Comune | Cartella |
|---|---|
| Casal Velino | `foto/casal-velino/` |
| Agropoli | `foto/agropoli/` |
| Ascea | `foto/ascea/` |
| Pisciotta | `foto/pisciotta/` |
| Centola - Palinuro | `foto/centola-palinuro/` |
| Camerota - Marina | `foto/camerota-marina/` |
| Ceraso | `foto/ceraso/` |
| Cuccaro Vetere | `foto/cuccaro-vetere/` |
| San Mauro la Bruca | `foto/san-mauro-la-bruca/` |
| Futani | `foto/futani/` |
| Vallo della Lucania | `foto/vallo-della-lucania/` |
| Omignano | `foto/omignano/` |
| Salento | `foto/salento/` |
| Perito | `foto/perito/` |
| Orria | `foto/orria/` |
| Gioi | `foto/gioi/` |
| Moio della Civitella | `foto/moio-della-civitella/` |
| Cannalonga | `foto/cannalonga/` |
| Stio | `foto/stio/` |
| Magliano Vetere | `foto/magliano-vetere/` |
| Monteforte Cilento | `foto/monteforte-cilento/` |
| Trentinara | `foto/trentinara/` |
| Giungano | `foto/giungano/` |
| Laureana Cilento | `foto/laureana-cilento/` |
| Torchiara | `foto/torchiara/` |
| Prignano Cilento | `foto/prignano-cilento/` |
| Rutino | `foto/rutino/` |
| Lustra | `foto/lustra/` |
| San Mauro Cilento | `foto/san-mauro-cilento/` |
| Pollica - Acciaroli | `foto/pollica-acciaroli/` |
| Montecorice | `foto/montecorice/` |
| Castellabate | `foto/castellabate/` |
