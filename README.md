# Meteo Cilento

Previsioni meteo per tutti i paesi del Cilento (118 tra comuni e località di mare, compresi Vallo di Diano, Alburni e Piana del Sele): condizioni attuali, prossime 24 ore,
7 giorni ora per ora, mare, radar delle precipitazioni e allerte.

Dati: [Open-Meteo](https://open-meteo.com) (meteo e mare), [radar della Protezione Civile](https://radar.protezionecivile.gov.it) (CC BY-SA 4.0, con [RainViewer](https://www.rainviewer.com) di riserva),
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

