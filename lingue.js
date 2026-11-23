/* Cilento Meteo — lingue (italiano, English, Deutsch)
   L'app è scritta in italiano. In inglese e tedesco ogni testo mostrato passa da
   questo dizionario: prima le frasi fisse, poi le regole per le frasi con numeri,
   orari e nomi. Date e giorni della settimana li traduce il browser (LOCALE). */

const LINGUE = { it:"Italiano", en:"English", de:"Deutsch" };
const LINGUA = (() => {
  try{
    const s = localStorage.getItem("meteoCilento.lingua");
    if(s && LINGUE[s]) return s;
  }catch(e){}
  const n = (navigator.language || "it").slice(0, 2).toLowerCase();
  return LINGUE[n] ? n : "it";
})();
const LOCALE = { it:"it-IT", en:"en-GB", de:"de-DE" }[LINGUA];
document.documentElement.lang = LINGUA;

const CARDINALI = {
  en:{ N:"N", NE:"NE", E:"E", SE:"SE", S:"S", SO:"SW", O:"W", NO:"NW" },
  de:{ N:"N", NE:"NO", E:"O", SE:"SO", S:"S", SO:"SW", O:"W", NO:"NW" }
};
const MESI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];

const DIZIONARIO = {
  en:{
    // navigazione e titoli
    "Meteo":"Weather", "Mare":"Sea", "Montagna":"Mountains", "Radar":"Radar", "Allerte":"Alerts",
    "Oggi in breve":"Today at a glance", "Pioggia nelle prossime 2 ore":"Rain in the next 2 hours",
    "Condizioni attuali":"Current conditions", "Prossime 24 ore":"Next 24 hours", "Prossimi 7 giorni":"Next 7 days",
    "Tocca un giorno per vederlo ora per ora.":"Tap a day to see it hour by hour.",
    "Sole e luna":"Sun and moon", "Aria e pollini":"Air and pollen",
    "Installa Cilento Meteo":"Install Cilento Meteo", "Installa":"Install",
    "Aprila come un'app, a schermo intero, anche senza connessione.":"Open it like an app, full screen, even offline.",
    "Tocca Condividi ⬆︎ in Safari e poi «Aggiungi alla schermata Home».":"Tap Share ⬆︎ in Safari, then “Add to Home Screen”.",
    "Dove andare al mare oggi":"Where to go to the sea today",
    "Le località di mare in ordine: prima il mare più calmo e il vento da terra, che lascia l'acqua liscia sotto riva. Tocca per aprirne il meteo.":"Seaside spots in order: calmest sea and offshore wind first, which keeps the water smooth near the shore. Tap one to open its weather.",
    "Mare nei prossimi 7 giorni":"Sea in the next 7 days", "Caricamento dati marini…":"Loading sea data…",
    "Montagna ed escursioni":"Mountains and hiking",
    "Meteo calcolato alla quota della vetta: temperatura, vento in cima, quota dello zero termico e un giudizio per salire oggi e nei prossimi due giorni.":"Weather calculated at summit altitude: temperature, wind at the top, freezing level and a rating for climbing today and over the next two days.",
    "Il giudizio è indicativo: in montagna il tempo cambia in fretta. Informati sui sentieri e non partire con allerte in corso.":"The rating is only a guide: mountain weather changes quickly. Check the trails and don't set out while an alert is in force.",
    "Radar precipitazioni":"Precipitation radar", "Debole":"Light", "Forte":"Heavy", "Caricamento radar…":"Loading radar…",
    "Come leggere il radar":"How to read the radar",
    "I colori indicano quanto è intensa la pioggia vista dai radar. Le immagini arrivano ogni 5 minuti con circa 10 minuti di ritardo; il pulsante ▶ mostra come si è mossa nell'ultima ora.":"The colours show how heavy the rain seen by the radars is. Images arrive every 5 minutes with about a 10-minute delay; the ▶ button shows how it moved over the last hour.",
    "Livello di allerta":"Alert level", "Notifiche":"Notifications",
    "Ricevi un avviso sul telefono quando c'è un'allerta per il tuo paese o quando sta per piovere.":"Get a notification on your phone when there is an alert for your town or when rain is about to start.",
    "Allerte gialle, arancioni e rosse":"Yellow, orange and red alerts", "Pioggia in arrivo entro un'ora":"Rain coming within an hour",
    "Attiva le notifiche":"Turn on notifications", "Disattiva le notifiche":"Turn off notifications", "Notifiche attivate.":"Notifications turned on.",
    "Non è stato possibile cambiare le notifiche. Riprova tra poco.":"Couldn't change notifications. Please try again shortly.",
    "Le notifiche sono bloccate per questo sito: puoi riattivarle nelle impostazioni del browser.":"Notifications are blocked for this site: you can allow them again in your browser settings.",
    "Su iPhone le notifiche funzionano con l'app installata: tocca Condividi e «Aggiungi alla schermata Home», poi apri Cilento Meteo dall'icona e attivale da qui.":"On iPhone, notifications work with the installed app: tap Share and “Add to Home Screen”, then open Cilento Meteo from its icon and turn them on here.",
    "Questo browser non supporta le notifiche.":"This browser does not support notifications.",
    "Cambiando paese si aggiornano da sole.":"They update automatically when you change town.",
    "Allerte meteo":"Weather alerts",
    "Gli avvisi ufficiali per il Cilento sono emessi dalla Protezione Civile della Regione Campania. Controllali prima di uscire quando è previsto maltempo.":"Official warnings for Cilento are issued by the Civil Protection of the Campania Region. Check them before going out when bad weather is forecast.",
    "Consulta le allerte ufficiali":"See the official alerts",
    "Rischio idrogeologico":"Landslides and flooding", "Temporali":"Thunderstorms", "Vento forte":"Strong wind", "Mareggiate":"Storm surges",
    "Frane e allagamenti dopo piogge forti o prolungate.":"Landslides and flooding after heavy or prolonged rain.",
    "Non attraversare sottopassi, guadi e strade allagate.":"Don't drive or walk through underpasses, fords or flooded roads.",
    "Evita le zone vicino a fiumi, torrenti e versanti instabili.":"Keep away from rivers, streams and unstable slopes.",
    "Non scendere in cantine e piani interrati durante le piogge intense.":"Don't go down to cellars or basements during heavy rain.",
    "Pioggia molto intensa, fulmini, grandine e raffiche improvvise.":"Very heavy rain, lightning, hail and sudden gusts.",
    "Ripara in un edificio; evita alberi isolati, tralicci e spiagge.":"Shelter in a building; avoid isolated trees, pylons and beaches.",
    "Esci dall'acqua e allontanati da moli e scogli.":"Get out of the water and move away from piers and rocks.",
    "Non ripararti sotto i ponti di corsi d'acqua.":"Don't shelter under bridges over rivers or streams.",
    "Raffiche che possono far cadere rami, tegole e impalcature.":"Gusts that can bring down branches, roof tiles and scaffolding.",
    "Fissa o ritira gli oggetti su balconi e terrazzi.":"Secure or bring in objects on balconies and terraces.",
    "Evita di sostare sotto alberi, cartelloni e strutture provvisorie.":"Avoid standing under trees, billboards and temporary structures.",
    "Guida con prudenza, soprattutto con mezzi alti o telonati.":"Drive carefully, especially with tall or canvas-sided vehicles.",
    "Onde alte che possono invadere spiagge, porti e strade costiere.":"High waves that can sweep over beaches, harbours and coastal roads.",
    "Non avvicinarti a moli, frangiflutti e scogliere.":"Keep away from piers, breakwaters and cliffs.",
    "Non fermarti sul lungomare durante le mareggiate.":"Don't stop on the seafront during storm surges.",
    "Non fare il bagno e non uscire in barca.":"Don't swim or go out by boat.",
    "Numeri utili":"Useful numbers", "Numero unico di emergenza":"European emergency number", "Vigili del Fuoco":"Fire brigade",
    "Emergenze in mare (Guardia Costiera)":"Emergencies at sea (Coast Guard)",
    "Cilento Meteo · Dati Open-Meteo · Radar Protezione Civile · Wikimedia Commons":"Cilento Meteo · Data: Open-Meteo · Radar: Italian Civil Protection · Wikimedia Commons",
    "Usa la mia posizione esatta":"Use my exact location", "Caricamento…":"Loading…",
    "Cambia paese":"Change town", "Cerca tra i paesi del Cilento":"Search Cilento towns", "Condividi il meteo":"Share the weather",
    "Momento del radar":"Radar time", "Non ora":"Not now", "Pausa":"Pause", "Riproduci":"Play", "Scegli il comune":"Choose a town",
    "Sezioni":"Sections", "Lingua":"Language", "Scegli la lingua":"Choose language",
    // meteo
    "Sereno":"Clear", "Poco nuvoloso":"Partly cloudy", "Coperto":"Overcast", "Nebbia":"Fog", "Pioviggine":"Drizzle",
    "Pioggia":"Rain", "Neve":"Snow", "Rovesci":"Showers", "Rovesci di neve":"Snow showers", "Temporale":"Thunderstorm",
    "Dati non disponibili":"Data unavailable", "Percepita":"Feels like", "Umidità":"Humidity", "Vento":"Wind", "Raffiche":"Gusts",
    "Nuvole":"Clouds", "Pressione":"Pressure", "Indice UV":"UV index", "Onde":"Waves", "Acqua":"Water", "Direzione":"Direction",
    "Periodo":"Period", "In vetta ora":"At the summit now", "Zero termico":"Freezing level", "Oggi":"Today", "Domani":"Tomorrow",
    "Ora":"Now", "ora":"now", "Alba":"Sunrise", "Ore di luce":"Daylight", "Tramonto":"Sunset", "max oggi":"today's max",
    "Basso":"Low", "Moderato":"Moderate", "Alto":"High", "Molto alto":"Very high", "Estremo":"Extreme",
    "Medio":"Medium", "Assente":"None", "Assenti":"None", "Pollini":"Pollen",
    "Luna nuova":"New moon", "Luna crescente":"Waxing crescent", "Primo quarto":"First quarter", "Gibbosa crescente":"Waxing gibbous",
    "Luna piena":"Full moon", "Gibbosa calante":"Waning gibbous", "Ultimo quarto":"Last quarter", "Luna calante":"Waning crescent",
    "Nessun dato orario.":"No hourly data.", "Settimana senza pioggia prevista":"No rain expected this week",
    "Niente pioggia prevista":"No rain expected", "LIVE":"LIVE", "dati salvati":"saved data",
    // posizione e luoghi
    "La mia posizione":"My location", "fuori dal Cilento":"outside Cilento", "la tua zona":"your area", "Sei qui":"You are here",
    "Località di mare":"Seaside spots", "Nessun paese trovato.":"No town found.", "Cerco la tua posizione…":"Finding your location…",
    "Questo dispositivo non permette di trovare la posizione.":"This device can't determine your location.",
    "Permesso di posizione negato. Puoi attivarlo nelle impostazioni del browser per questo sito.":"Location permission denied. You can allow it in your browser settings for this site.",
    "Non riesco a trovare la tua posizione in questo momento. Riprova all'aperto.":"I can't find your location right now. Try again outdoors.",
    "Meteo della tua posizione esatta. Sei fuori dal Cilento: la foto è generica.":"Weather for your exact location. You are outside Cilento: the photo is generic.",
    // mare
    "calmo":"calm", "poco mosso":"slight", "mosso":"moderate", "molto mosso":"rough", "agitato":"very rough", "molto agitato":"high",
    "Il posto migliore":"Best spot", "Il mare più calmo":"Calmest sea", "Confronto non disponibile in questo momento.":"Comparison not available right now.",
    "Dati del mare temporaneamente non disponibili.":"Sea data temporarily unavailable.", "Previsioni del mare non disponibili.":"Sea forecast unavailable.",
    // radar
    "Radar Protezione Civile":"Italian Civil Protection radar", "aggiornato ogni 5 minuti":"updated every 5 minutes",
    "Radar RainViewer (il radar della Protezione Civile non risponde)":"RainViewer radar (the Civil Protection radar is not responding)",
    "Mappa non disponibile.":"Map unavailable.", "Radar momentaneamente non disponibile.":"Radar temporarily unavailable.",
    "Pioggia debole":"Light rain", "Pioggia moderata":"Moderate rain", "Pioggia forte":"Heavy rain",
    "Molto forte, possibili temporali":"Very heavy, thunderstorms possible", "Grandine possibile":"Hail possible",
    // aria
    "Indice europeo della qualità dell'aria":"European Air Quality Index", "OZONO":"OZONE",
    "Graminacee":"Grasses", "Olivo":"Olive", "Betulla":"Birch", "Ontano":"Alder", "Artemisia":"Mugwort", "Ambrosia":"Ragweed",
    "Valori in µg/m³ e previsione dei pollini per oggi (modello europeo CAMS). Livelli dei pollini indicativi.":"Values in µg/m³ and today's pollen forecast (European CAMS model). Pollen levels are indicative.",
    "Dati sulla qualità dell'aria non disponibili.":"Air quality data unavailable.",
    // allerta
    "Nessuna allerta":"No alert", "Allerta gialla":"Yellow alert", "Allerta arancione":"Orange alert", "Allerta rossa":"Red alert",
    "Idrogeologico":"Landslides", "Idraulico":"Flooding", "verde":"green", "giallo":"yellow", "arancione":"orange", "rosso":"red",
    "Il bollettino esce verso le 16":"The bulletin comes out around 4 pm",
    "In attesa del nuovo bollettino di oggi (di solito esce verso le 16).":"Waiting for today's new bulletin (usually out around 4 pm).",
    "Il livello di allerta è disponibile per i paesi del Cilento.":"The alert level is available for Cilento towns.",
    "Il bollettino non è ancora disponibile: viene aggiornato automaticamente ogni ora.":"The bulletin isn't available yet: it updates automatically every hour.",
    "Dipartimento della Protezione Civile":"Italian Civil Protection Department",
    "Bollettino di criticità nazionale (CC BY 4.0). Per gli avvisi ufficiali fa fede la Protezione Civile della Regione Campania.":"National risk bulletin (CC BY 4.0). Official warnings are those of the Campania Region Civil Protection.",
    "Tocca per i dettagli e i consigli.":"Tap for details and advice.",
    // montagna
    "Buono per salire":"Good for climbing", "Con attenzione":"Take care", "Sconsigliato":"Not advised",
    "La vetta più alta della Campania.":"The highest peak in Campania.", "La cima più alta degli Alburni.":"The highest summit of the Alburni.",
    "Santuario di Novi Velia.":"Sanctuary of Novi Velia.", "Sopra Piaggine.":"Above Piaggine.",
    "Tra Rofrano e San Mauro la Bruca.":"Between Rofrano and San Mauro la Bruca.", "Vista sul golfo di Policastro.":"View over the Gulf of Policastro.",
    "Sotto la vetta: gelo in cima":"Below the summit: frost at the top", "Sopra la vetta":"Above the summit",
    "Meteo in montagna non disponibile in questo momento.":"Mountain weather not available right now.",
    // condividi e varie
    "Immagine del meteo salvata: puoi condividerla dalla galleria.":"Weather image saved: you can share it from your gallery.",
    "Non è stato possibile creare l'immagine.":"Couldn't create the image.",
    "consigliato in Cilento":"recommended in Cilento",
    "Modalità leggera":"Light mode",
    "Meno effetti, più veloce":"Fewer effects, faster",
    "Tutti i paesi":"All towns",
    "Sponsor":"Sponsor",
    "consigliato in Cilento":"recommended in Cilento",
    "Il tuo locale qui":"Your business here",
    "Pubblicizza la tua attività su Cilento Meteo":"Advertise your business on Cilento Meteo",
    "Chiama":"Call",
    "Pubblicità":"Advertising",
    "Le ore migliori di oggi":"Today's best hours",
    "Rispetto al solito":"Compared with normal",
    "Confronto con la media degli ultimi 30 anni":"Compared with the average of the last 30 years",
    "Barca e pesca":"Boating and fishing",
    "Rischio incendi (stima)":"Wildfire risk (estimate)",
    "Privacy":"Privacy",
    "Chiedi":"Ask",
    "Chiedi all'assistente":"Ask the assistant",
    "Assistente meteo":"Weather assistant",
    "Assistente Cilento Meteo":"Cilento Meteo assistant",
    "Chiudi":"Close",
    "Ciao! Chiedimi del meteo, del mare, della montagna o delle allerte nel Cilento: rispondo con i dati aggiornati dell'app.":"Hi! Ask me about the weather, the sea, the mountains or alerts in Cilento: I answer with the app's up-to-date data.",
    "Domani posso andare al mare?":"Can I go to the beach tomorrow?",
    "Cosa mi metto oggi?":"What should I wear today?",
    "Posso uscire in barca oggi?":"Can I go out by boat today?",
    "Conviene salire sul Cervati domani?":"Is it a good idea to climb Cervati tomorrow?",
    "Stendo i panni oggi?":"Can I hang the washing out today?",
    "Scrivi una domanda…":"Type a question…",
    "Invia":"Send",
    "Risponde con i dati dell'app e può sbagliare: per la sicurezza segui sempre gli avvisi ufficiali.":"It answers with the app's data and can make mistakes: for safety, always follow official warnings.",
    "Togli dai preferiti":"Remove from favourites",
    "Aggiungi ai preferiti":"Add to favourites",
    "Preferiti":"Favourites",
    "Tocca la stella accanto a un paese per aggiungerlo ai preferiti.":"Tap the star next to a town to add it to your favourites.",
    "Passeggiata e attività all'aperto":"Walks and outdoor activities",
    "Oggi poche ore adatte: pioggia, vento o temperature scomode":"Few suitable hours today: rain, wind or uncomfortable temperatures",
    "Corsa o bici":"Running or cycling",
    "Oggi condizioni poco adatte":"Poor conditions today",
    "Spiaggia":"Beach",
    "Oggi poco adatta: nuvole, vento o pioggia":"Not great today: clouds, wind or rain",
    "Stendere i panni":"Hanging out the washing",
    "Oggi meglio stendere in casa":"Better to dry indoors today",
    "Per oggi il sole è tramontato":"The sun has set for today",
    "Giornata poco adatta alle attività all'aperto":"Not a great day for outdoor activities",
    "Tramonto coperto: nuvole basse o pioggia":"Overcast sunset: low clouds or rain",
    "Tramonto promettente: nuvole alte che si colorano":"Promising sunset: high clouds that light up",
    "Tramonto limpido, cielo sereno":"Clear sunset, cloudless sky",
    "Tramonto discreto":"Decent sunset",
    "Bevi spesso, evita il sole tra le 12 e le 17 e controlla anziani, bambini e animali.":"Drink often, avoid the sun between 12 and 5 pm and check on the elderly, children and pets.",
    "Stima dell'app: caldo, aria secca e vento. Niente fuochi all'aperto. Tocca per i consigli.":"App estimate: heat, dry air and wind. No outdoor fires. Tap for advice.",
    "Massima":"High",
    "Umidità minima":"Lowest humidity",
    "Vento massimo":"Strongest wind",
    "Senza pioggia":"Without rain",
    "giorni":"days",
    "Non accendere fuochi e non bruciare sterpaglie: d'estate è vietato.":"Don't light fires or burn brushwood: it is forbidden in summer.",
    "Non gettare mozziconi e non parcheggiare l'auto sull'erba secca.":"Don't throw cigarette butts and don't park on dry grass.",
    "Se vedi fumo o fiamme chiama subito il 115 o il 112.":"If you see smoke or flames, call 115 or 112 immediately.",
    "Stima dell'app calcolata da temperatura, umidità, vento e giorni senza pioggia: non è il bollettino ufficiale. In Campania fanno fede gli avvisi della Regione e della Protezione Civile.":"App estimate based on temperature, humidity, wind and days without rain: it is not the official bulletin. In Campania, the warnings of the Region and the Civil Protection apply.",
    "Temperatura media rispetto al normale degli stessi giorni.":"Average temperature compared with normal for the same days.",
    "Di solito in questi giorni piove pochissimo.":"Usually very little rain falls in these days.",
    "Media 1991–2020 calcolata dall'archivio storico di Open-Meteo (ERA5) per questo luogo.":"1991–2020 average calculated from the Open-Meteo historical archive (ERA5) for this place.",
    "Confronto con il clima non disponibile in questo momento.":"Climate comparison not available right now.",
    "Uscita tranquilla":"Calm outing",
    "Solo sotto costa, con prudenza":"Only close to shore, with care",
    "Resta in porto":"Stay in port",
    "Tranquilla":"Calm",
    "Sotto costa":"Near shore",
    "In porto":"In port",
    "Nelle prossime ore non ci sono finestre tranquille.":"No calm windows in the next few hours.",
    "+12 h":"+12 h",
    "Limiti pensati per barche piccole (gozzi, gommoni). Prima di uscire controlla sempre il bollettino del mare e le ordinanze della Capitaneria di porto. In emergenza in mare: 1530.":"Limits designed for small boats (dinghies, small fishing boats). Before going out always check the marine forecast and the Coast Guard orders. Emergencies at sea: 1530.",
    "Dati per barca e pesca non disponibili in questo momento.":"Boating and fishing data not available right now.",
    "Nessun divieto di balneazione":"No bathing ban",
    "Divieto di balneazione in corso":"Bathing ban in force",
    "divieto di balneazione":"bathing ban",
    "stagione balneare chiusa, i controlli riprendono a maggio (Portale Acque).":"bathing season closed, checks resume in May (Portale Acque).",
    "Sto guardando i dati…":"Looking at the data…",
    "Hai fatto molte domande oggi: riprova domani.":"You've asked a lot of questions today: try again tomorrow.",
    "Non riesco a rispondere in questo momento. Riprova tra poco.":"I can't answer right now. Please try again shortly.",
    "Buona":"Good",
    "Discreta":"Fair",
    "Scarsa":"Poor"
  },
  de:{
    "Meteo":"Wetter", "Mare":"Meer", "Montagna":"Berge", "Radar":"Radar", "Allerte":"Warnungen",
    "Oggi in breve":"Heute auf einen Blick", "Pioggia nelle prossime 2 ore":"Regen in den nächsten 2 Stunden",
    "Condizioni attuali":"Aktuelle Bedingungen", "Prossime 24 ore":"Nächste 24 Stunden", "Prossimi 7 giorni":"Nächste 7 Tage",
    "Tocca un giorno per vederlo ora per ora.":"Tippe auf einen Tag für die stündliche Ansicht.",
    "Sole e luna":"Sonne und Mond", "Aria e pollini":"Luft und Pollen",
    "Installa Cilento Meteo":"Cilento Meteo installieren", "Installa":"Installieren",
    "Aprila come un'app, a schermo intero, anche senza connessione.":"Öffne sie wie eine App, im Vollbild, auch offline.",
    "Tocca Condividi ⬆︎ in Safari e poi «Aggiungi alla schermata Home».":"Tippe in Safari auf Teilen ⬆︎ und dann auf „Zum Home-Bildschirm“.",
    "Dove andare al mare oggi":"Wohin heute ans Meer",
    "Le località di mare in ordine: prima il mare più calmo e il vento da terra, che lascia l'acqua liscia sotto riva. Tocca per aprirne il meteo.":"Badeorte der Reihe nach: zuerst das ruhigste Meer und ablandiger Wind, der das Wasser am Ufer glatt hält. Tippe auf einen Ort für sein Wetter.",
    "Mare nei prossimi 7 giorni":"Meer in den nächsten 7 Tagen", "Caricamento dati marini…":"Meeresdaten werden geladen…",
    "Montagna ed escursioni":"Berge und Wandern",
    "Meteo calcolato alla quota della vetta: temperatura, vento in cima, quota dello zero termico e un giudizio per salire oggi e nei prossimi due giorni.":"Wetter auf Gipfelhöhe berechnet: Temperatur, Wind am Gipfel, Nullgradgrenze und eine Bewertung für den Aufstieg heute und in den nächsten zwei Tagen.",
    "Il giudizio è indicativo: in montagna il tempo cambia in fretta. Informati sui sentieri e non partire con allerte in corso.":"Die Bewertung ist nur ein Richtwert: In den Bergen ändert sich das Wetter schnell. Informiere dich über die Wege und brich bei laufenden Warnungen nicht auf.",
    "Radar precipitazioni":"Niederschlagsradar", "Debole":"Schwach", "Forte":"Stark", "Caricamento radar…":"Radar wird geladen…",
    "Come leggere il radar":"So liest du das Radar",
    "I colori indicano quanto è intensa la pioggia vista dai radar. Le immagini arrivano ogni 5 minuti con circa 10 minuti di ritardo; il pulsante ▶ mostra come si è mossa nell'ultima ora.":"Die Farben zeigen, wie stark der vom Radar erfasste Regen ist. Die Bilder kommen alle 5 Minuten mit etwa 10 Minuten Verzögerung; die Taste ▶ zeigt die Bewegung der letzten Stunde.",
    "Livello di allerta":"Warnstufe", "Notifiche":"Benachrichtigungen",
    "Ricevi un avviso sul telefono quando c'è un'allerta per il tuo paese o quando sta per piovere.":"Erhalte eine Benachrichtigung aufs Handy, wenn es eine Warnung für deinen Ort gibt oder gleich Regen kommt.",
    "Allerte gialle, arancioni e rosse":"Gelbe, orange und rote Warnungen", "Pioggia in arrivo entro un'ora":"Regen innerhalb einer Stunde",
    "Attiva le notifiche":"Benachrichtigungen aktivieren", "Disattiva le notifiche":"Benachrichtigungen deaktivieren", "Notifiche attivate.":"Benachrichtigungen aktiviert.",
    "Non è stato possibile cambiare le notifiche. Riprova tra poco.":"Die Benachrichtigungen konnten nicht geändert werden. Bitte versuche es gleich noch einmal.",
    "Le notifiche sono bloccate per questo sito: puoi riattivarle nelle impostazioni del browser.":"Benachrichtigungen sind für diese Seite blockiert: Du kannst sie in den Browser-Einstellungen wieder erlauben.",
    "Su iPhone le notifiche funzionano con l'app installata: tocca Condividi e «Aggiungi alla schermata Home», poi apri Cilento Meteo dall'icona e attivale da qui.":"Auf dem iPhone funktionieren Benachrichtigungen mit der installierten App: Tippe auf Teilen und „Zum Home-Bildschirm“, öffne Cilento Meteo über das Symbol und aktiviere sie hier.",
    "Questo browser non supporta le notifiche.":"Dieser Browser unterstützt keine Benachrichtigungen.",
    "Cambiando paese si aggiornano da sole.":"Sie passen sich beim Ortswechsel automatisch an.",
    "Allerte meteo":"Wetterwarnungen",
    "Gli avvisi ufficiali per il Cilento sono emessi dalla Protezione Civile della Regione Campania. Controllali prima di uscire quando è previsto maltempo.":"Offizielle Warnungen für das Cilento gibt der Zivilschutz der Region Kampanien heraus. Prüfe sie vor dem Ausgehen, wenn Unwetter vorhergesagt ist.",
    "Consulta le allerte ufficiali":"Offizielle Warnungen ansehen",
    "Rischio idrogeologico":"Erdrutsche und Überschwemmungen", "Temporali":"Gewitter", "Vento forte":"Starker Wind", "Mareggiate":"Sturmfluten",
    "Frane e allagamenti dopo piogge forti o prolungate.":"Erdrutsche und Überschwemmungen nach starkem oder anhaltendem Regen.",
    "Non attraversare sottopassi, guadi e strade allagate.":"Durchquere keine Unterführungen, Furten oder überfluteten Straßen.",
    "Evita le zone vicino a fiumi, torrenti e versanti instabili.":"Meide Flüsse, Bäche und instabile Hänge.",
    "Non scendere in cantine e piani interrati durante le piogge intense.":"Geh bei starkem Regen nicht in Keller und Untergeschosse.",
    "Pioggia molto intensa, fulmini, grandine e raffiche improvvise.":"Sehr starker Regen, Blitze, Hagel und plötzliche Böen.",
    "Ripara in un edificio; evita alberi isolati, tralicci e spiagge.":"Such Schutz in einem Gebäude; meide einzelne Bäume, Strommasten und Strände.",
    "Esci dall'acqua e allontanati da moli e scogli.":"Verlass das Wasser und entferne dich von Molen und Felsen.",
    "Non ripararti sotto i ponti di corsi d'acqua.":"Such keinen Schutz unter Brücken über Flüssen oder Bächen.",
    "Raffiche che possono far cadere rami, tegole e impalcature.":"Böen, die Äste, Dachziegel und Gerüste umwerfen können.",
    "Fissa o ritira gli oggetti su balconi e terrazzi.":"Sichere oder räume Gegenstände auf Balkonen und Terrassen weg.",
    "Evita di sostare sotto alberi, cartelloni e strutture provvisorie.":"Halte dich nicht unter Bäumen, Werbetafeln und provisorischen Bauten auf.",
    "Guida con prudenza, soprattutto con mezzi alti o telonati.":"Fahre vorsichtig, besonders mit hohen oder Planenfahrzeugen.",
    "Onde alte che possono invadere spiagge, porti e strade costiere.":"Hohe Wellen, die Strände, Häfen und Küstenstraßen überspülen können.",
    "Non avvicinarti a moli, frangiflutti e scogliere.":"Halte Abstand zu Molen, Wellenbrechern und Klippen.",
    "Non fermarti sul lungomare durante le mareggiate.":"Halte dich bei Sturmflut nicht an der Strandpromenade auf.",
    "Non fare il bagno e non uscire in barca.":"Nicht baden und nicht mit dem Boot hinausfahren.",
    "Numeri utili":"Nützliche Nummern", "Numero unico di emergenza":"Europäische Notrufnummer", "Vigili del Fuoco":"Feuerwehr",
    "Emergenze in mare (Guardia Costiera)":"Notfälle auf See (Küstenwache)",
    "Cilento Meteo · Dati Open-Meteo · Radar Protezione Civile · Wikimedia Commons":"Cilento Meteo · Daten: Open-Meteo · Radar: Italienischer Zivilschutz · Wikimedia Commons",
    "Usa la mia posizione esatta":"Meinen genauen Standort verwenden", "Caricamento…":"Wird geladen…",
    "Cambia paese":"Ort wechseln", "Cerca tra i paesi del Cilento":"Orte im Cilento suchen", "Condividi il meteo":"Wetter teilen",
    "Momento del radar":"Radarzeitpunkt", "Non ora":"Nicht jetzt", "Pausa":"Pause", "Riproduci":"Abspielen", "Scegli il comune":"Ort wählen",
    "Sezioni":"Bereiche", "Lingua":"Sprache", "Scegli la lingua":"Sprache wählen",
    "Sereno":"Klar", "Poco nuvoloso":"Leicht bewölkt", "Coperto":"Bedeckt", "Nebbia":"Nebel", "Pioviggine":"Nieselregen",
    "Pioggia":"Regen", "Neve":"Schnee", "Rovesci":"Schauer", "Rovesci di neve":"Schneeschauer", "Temporale":"Gewitter",
    "Dati non disponibili":"Daten nicht verfügbar", "Percepita":"Gefühlt", "Umidità":"Luftfeuchte", "Vento":"Wind", "Raffiche":"Böen",
    "Nuvole":"Wolken", "Pressione":"Luftdruck", "Indice UV":"UV-Index", "Onde":"Wellen", "Acqua":"Wasser", "Direzione":"Richtung",
    "Periodo":"Periode", "In vetta ora":"Am Gipfel jetzt", "Zero termico":"Nullgradgrenze", "Oggi":"Heute", "Domani":"Morgen",
    "Ora":"Jetzt", "ora":"jetzt", "Alba":"Sonnenaufgang", "Ore di luce":"Tageslicht", "Tramonto":"Sonnenuntergang", "max oggi":"Tageshöchstwert",
    "Basso":"Niedrig", "Moderato":"Mäßig", "Alto":"Hoch", "Molto alto":"Sehr hoch", "Estremo":"Extrem",
    "Medio":"Mittel", "Assente":"Keine", "Assenti":"Keine", "Pollini":"Pollen",
    "Luna nuova":"Neumond", "Luna crescente":"Zunehmende Sichel", "Primo quarto":"Erstes Viertel", "Gibbosa crescente":"Zunehmender Mond",
    "Luna piena":"Vollmond", "Gibbosa calante":"Abnehmender Mond", "Ultimo quarto":"Letztes Viertel", "Luna calante":"Abnehmende Sichel",
    "Nessun dato orario.":"Keine Stundendaten.", "Settimana senza pioggia prevista":"Diese Woche kein Regen erwartet",
    "Niente pioggia prevista":"Kein Regen erwartet", "LIVE":"LIVE", "dati salvati":"gespeicherte Daten",
    "La mia posizione":"Mein Standort", "fuori dal Cilento":"außerhalb des Cilento", "la tua zona":"deine Gegend", "Sei qui":"Du bist hier",
    "Località di mare":"Badeorte", "Nessun paese trovato.":"Kein Ort gefunden.", "Cerco la tua posizione…":"Standort wird gesucht…",
    "Questo dispositivo non permette di trovare la posizione.":"Dieses Gerät kann den Standort nicht bestimmen.",
    "Permesso di posizione negato. Puoi attivarlo nelle impostazioni del browser per questo sito.":"Standortzugriff verweigert. Du kannst ihn in den Browser-Einstellungen für diese Seite erlauben.",
    "Non riesco a trovare la tua posizione in questo momento. Riprova all'aperto.":"Dein Standort kann gerade nicht ermittelt werden. Versuche es im Freien noch einmal.",
    "Meteo della tua posizione esatta. Sei fuori dal Cilento: la foto è generica.":"Wetter für deinen genauen Standort. Du bist außerhalb des Cilento: Das Foto ist allgemein.",
    "calmo":"ruhig", "poco mosso":"leicht bewegt", "mosso":"mäßig bewegt", "molto mosso":"bewegt", "agitato":"rau", "molto agitato":"sehr rau",
    "Il posto migliore":"Bester Ort", "Il mare più calmo":"Ruhigstes Meer", "Confronto non disponibile in questo momento.":"Vergleich gerade nicht verfügbar.",
    "Dati del mare temporaneamente non disponibili.":"Meeresdaten vorübergehend nicht verfügbar.", "Previsioni del mare non disponibili.":"Meeresvorhersage nicht verfügbar.",
    "Radar Protezione Civile":"Radar des Italienischen Zivilschutzes", "aggiornato ogni 5 minuti":"alle 5 Minuten aktualisiert",
    "Radar RainViewer (il radar della Protezione Civile non risponde)":"RainViewer-Radar (das Radar des Zivilschutzes antwortet nicht)",
    "Mappa non disponibile.":"Karte nicht verfügbar.", "Radar momentaneamente non disponibile.":"Radar vorübergehend nicht verfügbar.",
    "Pioggia debole":"Leichter Regen", "Pioggia moderata":"Mäßiger Regen", "Pioggia forte":"Starker Regen",
    "Molto forte, possibili temporali":"Sehr stark, Gewitter möglich", "Grandine possibile":"Hagel möglich",
    "Indice europeo della qualità dell'aria":"Europäischer Luftqualitätsindex", "OZONO":"OZON",
    "Graminacee":"Gräser", "Olivo":"Olive", "Betulla":"Birke", "Ontano":"Erle", "Artemisia":"Beifuß", "Ambrosia":"Ambrosia",
    "Valori in µg/m³ e previsione dei pollini per oggi (modello europeo CAMS). Livelli dei pollini indicativi.":"Werte in µg/m³ und Pollenvorhersage für heute (europäisches CAMS-Modell). Pollenstufen sind Richtwerte.",
    "Dati sulla qualità dell'aria non disponibili.":"Luftqualitätsdaten nicht verfügbar.",
    "Nessuna allerta":"Keine Warnung", "Allerta gialla":"Gelbe Warnung", "Allerta arancione":"Orange Warnung", "Allerta rossa":"Rote Warnung",
    "Idrogeologico":"Erdrutsche", "Idraulico":"Hochwasser", "verde":"grün", "giallo":"gelb", "arancione":"orange", "rosso":"rot",
    "Il bollettino esce verso le 16":"Der Lagebericht erscheint gegen 16 Uhr",
    "In attesa del nuovo bollettino di oggi (di solito esce verso le 16).":"Warten auf den neuen Lagebericht von heute (erscheint meist gegen 16 Uhr).",
    "Il livello di allerta è disponibile per i paesi del Cilento.":"Die Warnstufe ist für die Orte im Cilento verfügbar.",
    "Il bollettino non è ancora disponibile: viene aggiornato automaticamente ogni ora.":"Der Lagebericht ist noch nicht verfügbar: Er wird stündlich automatisch aktualisiert.",
    "Dipartimento della Protezione Civile":"Italienischer Zivilschutz",
    "Bollettino di criticità nazionale (CC BY 4.0). Per gli avvisi ufficiali fa fede la Protezione Civile della Regione Campania.":"Nationaler Gefahrenlagebericht (CC BY 4.0). Maßgeblich sind die Warnungen des Zivilschutzes der Region Kampanien.",
    "Tocca per i dettagli e i consigli.":"Tippe für Details und Tipps.",
    "Buono per salire":"Gut für den Aufstieg", "Con attenzione":"Mit Vorsicht", "Sconsigliato":"Nicht empfohlen",
    "La vetta più alta della Campania.":"Der höchste Gipfel Kampaniens.", "La cima più alta degli Alburni.":"Der höchste Gipfel der Alburni.",
    "Santuario di Novi Velia.":"Wallfahrtsort von Novi Velia.", "Sopra Piaggine.":"Oberhalb von Piaggine.",
    "Tra Rofrano e San Mauro la Bruca.":"Zwischen Rofrano und San Mauro la Bruca.", "Vista sul golfo di Policastro.":"Blick auf den Golf von Policastro.",
    "Sotto la vetta: gelo in cima":"Unter dem Gipfel: Frost oben", "Sopra la vetta":"Über dem Gipfel",
    "Meteo in montagna non disponibile in questo momento.":"Bergwetter gerade nicht verfügbar.",
    "Immagine del meteo salvata: puoi condividerla dalla galleria.":"Wetterbild gespeichert: Du kannst es aus der Galerie teilen.",
    "Non è stato possibile creare l'immagine.":"Das Bild konnte nicht erstellt werden.",
    "consigliato in Cilento":"Empfehlung im Cilento",
    "Modalità leggera":"Leichter Modus",
    "Meno effetti, più veloce":"Weniger Effekte, schneller",
    "Tutti i paesi":"Alle Orte",
    "Sponsor":"Sponsor",
    "consigliato in Cilento":"empfohlen im Cilento",
    "Il tuo locale qui":"Dein Betrieb hier",
    "Pubblicizza la tua attività su Cilento Meteo":"Wirb für deinen Betrieb auf Cilento Meteo",
    "Chiama":"Anrufen",
    "Pubblicità":"Werbung",
    "Le ore migliori di oggi":"Die besten Stunden heute",
    "Rispetto al solito":"Im Vergleich zum Normalen",
    "Confronto con la media degli ultimi 30 anni":"Vergleich mit dem Mittel der letzten 30 Jahre",
    "Barca e pesca":"Boot und Angeln",
    "Rischio incendi (stima)":"Waldbrandgefahr (Schätzung)",
    "Privacy":"Datenschutz",
    "Chiedi":"Fragen",
    "Chiedi all'assistente":"Den Assistenten fragen",
    "Assistente meteo":"Wetterassistent",
    "Assistente Cilento Meteo":"Assistent von Cilento Meteo",
    "Chiudi":"Schließen",
    "Ciao! Chiedimi del meteo, del mare, della montagna o delle allerte nel Cilento: rispondo con i dati aggiornati dell'app.":"Hallo! Frag mich nach Wetter, Meer, Bergen oder Warnungen im Cilento: Ich antworte mit den aktuellen Daten der App.",
    "Domani posso andare al mare?":"Kann ich morgen ans Meer?",
    "Cosa mi metto oggi?":"Was ziehe ich heute an?",
    "Posso uscire in barca oggi?":"Kann ich heute mit dem Boot hinaus?",
    "Conviene salire sul Cervati domani?":"Lohnt es sich, morgen auf den Cervati zu steigen?",
    "Stendo i panni oggi?":"Kann ich heute Wäsche draußen aufhängen?",
    "Scrivi una domanda…":"Schreib eine Frage…",
    "Invia":"Senden",
    "Risponde con i dati dell'app e può sbagliare: per la sicurezza segui sempre gli avvisi ufficiali.":"Er antwortet mit den Daten der App und kann sich irren: Folge zu deiner Sicherheit immer den offiziellen Warnungen.",
    "Togli dai preferiti":"Aus Favoriten entfernen",
    "Aggiungi ai preferiti":"Zu Favoriten hinzufügen",
    "Preferiti":"Favoriten",
    "Tocca la stella accanto a un paese per aggiungerlo ai preferiti.":"Tippe auf den Stern neben einem Ort, um ihn zu deinen Favoriten hinzuzufügen.",
    "Passeggiata e attività all'aperto":"Spaziergang und Aktivitäten im Freien",
    "Oggi poche ore adatte: pioggia, vento o temperature scomode":"Heute wenige geeignete Stunden: Regen, Wind oder unangenehme Temperaturen",
    "Corsa o bici":"Laufen oder Radfahren",
    "Oggi condizioni poco adatte":"Heute ungünstige Bedingungen",
    "Spiaggia":"Strand",
    "Oggi poco adatta: nuvole, vento o pioggia":"Heute wenig geeignet: Wolken, Wind oder Regen",
    "Stendere i panni":"Wäsche aufhängen",
    "Oggi meglio stendere in casa":"Heute besser drinnen trocknen",
    "Per oggi il sole è tramontato":"Die Sonne ist für heute untergegangen",
    "Giornata poco adatta alle attività all'aperto":"Kein guter Tag für Aktivitäten im Freien",
    "Tramonto coperto: nuvole basse o pioggia":"Bedeckter Sonnenuntergang: tiefe Wolken oder Regen",
    "Tramonto promettente: nuvole alte che si colorano":"Vielversprechender Sonnenuntergang: hohe Wolken, die sich färben",
    "Tramonto limpido, cielo sereno":"Klarer Sonnenuntergang, wolkenloser Himmel",
    "Tramonto discreto":"Ordentlicher Sonnenuntergang",
    "Bevi spesso, evita il sole tra le 12 e le 17 e controlla anziani, bambini e animali.":"Trink oft, meide die Sonne zwischen 12 und 17 Uhr und achte auf ältere Menschen, Kinder und Tiere.",
    "Stima dell'app: caldo, aria secca e vento. Niente fuochi all'aperto. Tocca per i consigli.":"Schätzung der App: Hitze, trockene Luft und Wind. Kein offenes Feuer. Tippe für Tipps.",
    "Massima":"Höchstwert",
    "Umidità minima":"Niedrigste Feuchte",
    "Vento massimo":"Stärkster Wind",
    "Senza pioggia":"Ohne Regen",
    "giorni":"Tage",
    "Non accendere fuochi e non bruciare sterpaglie: d'estate è vietato.":"Kein Feuer machen und kein Gestrüpp verbrennen: Im Sommer ist es verboten.",
    "Non gettare mozziconi e non parcheggiare l'auto sull'erba secca.":"Keine Zigarettenkippen wegwerfen und nicht auf trockenem Gras parken.",
    "Se vedi fumo o fiamme chiama subito il 115 o il 112.":"Wenn du Rauch oder Flammen siehst, ruf sofort 115 oder 112 an.",
    "Stima dell'app calcolata da temperatura, umidità, vento e giorni senza pioggia: non è il bollettino ufficiale. In Campania fanno fede gli avvisi della Regione e della Protezione Civile.":"Schätzung der App aus Temperatur, Luftfeuchte, Wind und Tagen ohne Regen: kein offizieller Lagebericht. In Kampanien gelten die Warnungen der Region und des Zivilschutzes.",
    "Temperatura media rispetto al normale degli stessi giorni.":"Durchschnittstemperatur im Vergleich zum Normalwert derselben Tage.",
    "Di solito in questi giorni piove pochissimo.":"Normalerweise regnet es an diesen Tagen sehr wenig.",
    "Media 1991–2020 calcolata dall'archivio storico di Open-Meteo (ERA5) per questo luogo.":"Mittel 1991–2020, berechnet aus dem historischen Archiv von Open-Meteo (ERA5) für diesen Ort.",
    "Confronto con il clima non disponibile in questo momento.":"Klimavergleich gerade nicht verfügbar.",
    "Uscita tranquilla":"Ruhige Ausfahrt",
    "Solo sotto costa, con prudenza":"Nur in Küstennähe, mit Vorsicht",
    "Resta in porto":"Im Hafen bleiben",
    "Tranquilla":"Ruhig",
    "Sotto costa":"Küstennah",
    "In porto":"Im Hafen",
    "Nelle prossime ore non ci sono finestre tranquille.":"In den nächsten Stunden gibt es keine ruhigen Zeitfenster.",
    "+12 h":"+12 Std.",
    "Limiti pensati per barche piccole (gozzi, gommoni). Prima di uscire controlla sempre il bollettino del mare e le ordinanze della Capitaneria di porto. In emergenza in mare: 1530.":"Grenzwerte für kleine Boote (Schlauch- und Fischerboote). Prüfe vor dem Auslaufen immer den Seewetterbericht und die Anordnungen der Küstenwache. Notfälle auf See: 1530.",
    "Dati per barca e pesca non disponibili in questo momento.":"Daten für Boot und Angeln gerade nicht verfügbar.",
    "Nessun divieto di balneazione":"Kein Badeverbot",
    "Divieto di balneazione in corso":"Badeverbot in Kraft",
    "divieto di balneazione":"Badeverbot",
    "stagione balneare chiusa, i controlli riprendono a maggio (Portale Acque).":"Badesaison beendet, die Kontrollen beginnen wieder im Mai (Portale Acque).",
    "Sto guardando i dati…":"Ich sehe mir die Daten an…",
    "Hai fatto molte domande oggi: riprova domani.":"Du hast heute viele Fragen gestellt: Versuche es morgen wieder.",
    "Non riesco a rispondere in questo momento. Riprova tra poco.":"Ich kann gerade nicht antworten. Bitte versuche es gleich noch einmal.",
    "Buona":"Gut",
    "Discreta":"Mittel",
    "Scarsa":"Schlecht"
  }
};

const T = DIZIONARIO[LINGUA] || {};
const parola = p => T[p] || p;
const card = c => (CARDINALI[LINGUA] || {})[c] || c;
const STATI_MARE = "molto agitato|molto mosso|poco mosso|agitato|mosso|calmo";
const ORA = "(\\d{1,2}[:.]\\d{2}(?:\\s?[ap]m)?)";

// Regole per le frasi con numeri e nomi: [espressione, inglese, tedesco]
const REGOLE = [
  // riassunto della giornata
  [`Sta piovendo: dovrebbe smettere verso le ${ORA}\\.`, "It's raining: it should stop around $1.", "Es regnet: es sollte gegen $1 aufhören."],
  ["Sta piovendo e continuerà per diverse ore: tieni l'ombrello a portata di mano\\.", "It's raining and will keep going for several hours: keep your umbrella handy.", "Es regnet und hält noch einige Stunden an: Halte den Schirm bereit."],
  [`Pioggia probabile dalle ${ORA}: porta l'ombrello\\.`, "Rain likely from $1: take an umbrella.", "Regen wahrscheinlich ab $1: Nimm einen Schirm mit."],
  ["Qualche goccia possibile nelle prossime ore \\(fino al (\\d+)%\\)\\.", "A few drops possible in the next few hours (up to $1%).", "Ein paar Tropfen in den nächsten Stunden möglich (bis $1 %)."],
  ["Notte serena e asciutta\\.", "Clear, dry night.", "Klare, trockene Nacht."],
  ["Bella giornata, niente pioggia in vista\\.", "Lovely day, no rain in sight.", "Schöner Tag, kein Regen in Sicht."],
  ["Niente pioggia nelle prossime ore\\.", "No rain in the next few hours.", "Kein Regen in den nächsten Stunden."],
  ["Raffiche forti fino a (\\d+) km/h\\.", "Strong gusts up to $1 km/h.", "Starke Böen bis $1 km/h."],
  ["Vento sostenuto da (N|NE|E|SE|S|SO|O|NO)\\.", m => `Brisk wind from ${card(m[1])}.`, m => `Kräftiger Wind aus ${card(m[1])}.`],
  ["Ne percepirai (-?\\d+)°\\.", "It will feel like $1°.", "Gefühlt $1°."],
  ["Indice UV (\\d+): proteggiti dal sole nelle ore centrali\\.", "UV index $1: protect yourself from the sun around midday.", "UV-Index $1: Schütze dich in der Mittagszeit vor der Sonne."],
  ["Domani più caldo di (\\d+)°\\.", "Tomorrow $1° warmer.", "Morgen $1° wärmer."],
  ["Domani più fresco di (\\d+)°\\.", "Tomorrow $1° cooler.", "Morgen $1° kühler."],
  ["Domani temperature simili\\.", "Similar temperatures tomorrow.", "Morgen ähnliche Temperaturen."],
  // pioggia nelle prossime 2 ore
  [`Piove ora, dovrebbe smettere verso le ${ORA}`, "Raining now, should stop around $1", "Regnet jetzt, sollte gegen $1 aufhören"],
  ["Pioggia per tutte le prossime 2 ore", "Rain for the whole of the next 2 hours", "Regen in den ganzen nächsten 2 Stunden"],
  [`Pioggia in arrivo verso le ${ORA}`, "Rain arriving around $1", "Regen gegen $1"],
  ["Possibile pioggia \\(fino al (\\d+)%\\)", "Rain possible (up to $1%)", "Regen möglich (bis $1 %)"],
  ["Niente pioggia nelle prossime 2 ore", "No rain in the next 2 hours", "Kein Regen in den nächsten 2 Stunden"],
  // radar vicino
  [`Il radar vede pioggia (debole|moderata|forte) proprio qui \\(${ORA}\\)\\.`,
    m => `The radar sees ${{ debole:"light", moderata:"moderate", forte:"heavy" }[m[1]]} rain right here (${m[2]}).`,
    m => `Das Radar sieht ${{ debole:"schwachen", moderata:"mäßigen", forte:"starken" }[m[1]]} Regen genau hier (${m[2]}).`],
  [`Il radar vede pioggia a circa (\\d+) km(, in avvicinamento|, in allontanamento)? \\(${ORA}\\)\\.`,
    m => `The radar sees rain about ${m[1]} km away${{ ", in avvicinamento":", approaching", ", in allontanamento":", moving away" }[m[2]] || ""} (${m[3]}).`,
    m => `Das Radar sieht Regen in etwa ${m[1]} km Entfernung${{ ", in avvicinamento":", näher kommend", ", in allontanamento":", sich entfernend" }[m[2]] || ""} (${m[3]}).`],
  [`Il radar non vede pioggia entro (\\d+) km \\(${ORA}\\)\\.`, "The radar sees no rain within $1 km ($2).", "Das Radar sieht keinen Regen im Umkreis von $1 km ($2)."],
  // condizioni e previsioni
  ["^vento (\\d+) km/h da (N|NE|E|SE|S|SO|O|NO)$", m => `wind ${m[1]} km/h from ${card(m[2])}`, m => `Wind ${m[1]} km/h aus ${card(m[2])}`],
  ["^umidità (\\d+)%$", "humidity $1%", "Luftfeuchte $1 %"],
  ["PERCEPITA", "FEELS LIKE", "GEFÜHLT"],
  ["^Probabilità oggi (\\d+)%$", "Chance today $1%", "Wahrscheinlichkeit heute $1 %"],
  [`^Pioggia probabile dalle ${ORA} \\((\\d+)%\\)$`, "Rain likely from $1 ($2%)", "Regen wahrscheinlich ab $1 ($2 %)"],
  ["^Possibile qualche goccia \\(fino al (\\d+)%\\)$", "A few drops possible (up to $1%)", "Ein paar Tropfen möglich (bis $1 %)"],
  [`^max (-?\\d+)° alle ${ORA}$`, "max $1° at $2", "max. $1° um $2"],
  ["^Pioggia probabile: (.+)$", m => "Rain likely: " + m[1].replace(/\boggi\b/, "today"), m => "Regen wahrscheinlich: " + m[1].replace(/\boggi\b/, "heute")],
  ["^da (-?\\d+)° a (-?\\d+)°$", "from $1° to $2°", "von $1° bis $2°"],
  [`^Alba ${ORA}$`, "Sunrise $1", "Sonnenaufgang $1"],
  [`^Tramonto ${ORA}$`, "Sunset $1", "Sonnenuntergang $1"],
  [`^tramonto ${ORA}$`, "sunset $1", "Sonnenuntergang $1"],
  [`^Tramonto alle ${ORA}$`, "Sunset at $1", "Sonnenuntergang um $1"],
  ["^Illuminata al (\\d+)%$", "$1% illuminated", "Zu $1 % beleuchtet"],
  ["^luna piena oggi$", "full moon today", "Vollmond heute"],
  ["^luna piena domani$", "full moon tomorrow", "Vollmond morgen"],
  ["^luna piena tra (\\d+) giorni$", "full moon in $1 days", "Vollmond in $1 Tagen"],
  [`^AGG\\. ${ORA}$`, "UPD. $1", "AKT. $1"],
  ["^Percepita (-?\\d+)°$", "Feels like $1°", "Gefühlt $1°"],
  ["^Raffiche (\\d+) km/h$", "Gusts $1 km/h", "Böen $1 km/h"],
  ["^raffiche (\\d+) km/h$", "gusts $1 km/h", "Böen $1 km/h"],
  ["^pioggia (\\d+)%$", "rain $1%", "Regen $1 %"],
  // posizione
  ["^vicino a (.+)$", "near $1", "bei $1"],
  ["^Meteo della tua posizione esatta, vicino a (.+) \\(precisione (.+)\\)\\.$", "Weather for your exact location, near $1 (accuracy $2).", "Wetter für deinen genauen Standort, bei $1 (Genauigkeit $2)."],
  ["^Notifiche attive per ([^.]+)\\.$", "Notifications on for $1.", "Benachrichtigungen aktiv für $1."],
  // mare
  [`^Mare (${STATI_MARE})$`, m => `${cap(parola(m[1]))} sea`, m => `Meer ${parola(m[1])}`],
  [`^mare (${STATI_MARE})$`, m => `${parola(m[1])} sea`, m => `Meer ${parola(m[1])}`],
  ["^onde (\\d+\\.\\d) m da (N|NE|E|SE|S|SO|O|NO)$", m => `waves ${m[1]} m from ${card(m[2])}`, m => `Wellen ${m[1]} m aus ${card(m[2])}`],
  ["^onde (\\d+\\.\\d) m$", "waves $1 m", "Wellen $1 m"],
  ["^acqua (\\d+\\.\\d)°$", "water $1°", "Wasser $1°"],
  ["^Ultimo dato: (.+)$", "Latest data: $1", "Letzte Daten: $1"],
  [`^Onde più alte (.+): (\\d+\\.\\d) m \\((${STATI_MARE})\\)$`,
    m => `Highest waves ${m[1] === "oggi" ? "today" : m[1]}: ${m[2]} m (${parola(m[3])})`,
    m => `Höchste Wellen ${m[1] === "oggi" ? "heute" : m[1]}: ${m[2]} m (${parola(m[3])})`],
  [`^Il posto migliore: (.+) \\(mare (${STATI_MARE})(, vento da terra|, senza vento)?\\)$`,
    m => `Best spot: ${m[1]} (${parola(m[2])} sea${{ ", vento da terra":", offshore wind", ", senza vento":", no wind" }[m[3]] || ""})`,
    m => `Bester Ort: ${m[1]} (Meer ${parola(m[2])}${{ ", vento da terra":", ablandiger Wind", ", senza vento":", windstill" }[m[3]] || ""})`],
  ["^vento da terra (\\d+) km/h$", "offshore wind $1 km/h", "ablandiger Wind $1 km/h"],
  ["^vento dal mare (\\d+) km/h$", "onshore wind $1 km/h", "auflandiger Wind $1 km/h"],
  ["^vento laterale (\\d+) km/h$", "cross wind $1 km/h", "Seitenwind $1 km/h"],
  ["^quasi senza vento$", "almost no wind", "fast windstill"],
  ["^ ?da (N|NE|E|SE|S|SO|O|NO)$", m => m[0].replace(/da .+/, "from " + card(m[1])), m => m[0].replace(/da .+/, "aus " + card(m[1]))],
  ["^(N|NE|E|SE|S|SO|O|NO)$", m => card(m[1]), m => card(m[1])],
  // radar
  [`^dalle ${ORA} alle ${ORA}\\.$`, "from $1 to $2.", "von $1 bis $2."],
  ["^circa (.+)$", "about $1", "etwa $1"],
  // aria
  ["^Aria (buona|discreta|moderata|scadente|molto scadente|estremamente scadente)(.*)$",
    m => `Air quality ${{ "buona":"good", "discreta":"fair", "moderata":"moderate", "scadente":"poor", "molto scadente":"very poor", "estremamente scadente":"extremely poor" }[m[1]]}${m[2].replace("indice", "index")}`,
    m => `Luftqualität ${{ "buona":"gut", "discreta":"mittel", "moderata":"mäßig", "scadente":"schlecht", "molto scadente":"sehr schlecht", "estremamente scadente":"extrem schlecht" }[m[1]]}${m[2].replace("indice", "Index")}`],
  ["^niente pollini$", "no pollen", "keine Pollen"],
  ["^pollini: (.+)$",
    m => "pollen: " + m[1].replace(/graminacee|olivo|betulla|ontano|artemisia|ambrosia|basso|medio|alto/g, w => ({ graminacee:"grasses", olivo:"olive", betulla:"birch", ontano:"alder", artemisia:"mugwort", ambrosia:"ragweed", basso:"low", medio:"medium", alto:"high" })[w]),
    m => "Pollen: " + m[1].replace(/graminacee|olivo|betulla|ontano|artemisia|ambrosia|basso|medio|alto/g, w => ({ graminacee:"Gräser", olivo:"Olive", betulla:"Birke", ontano:"Erle", artemisia:"Beifuß", ambrosia:"Ambrosia", basso:"niedrig", medio:"mittel", alto:"hoch" })[w])],
  ["^(\\d+) granuli/m³$", "$1 grains/m³", "$1 Körner/m³"],
  // allerta
  ["^(Nessuna allerta|Allerta gialla|Allerta arancione|Allerta rossa) (oggi|domani)$",
    m => `${parola(m[1])} ${m[2] === "oggi" ? "today" : "tomorrow"}`, m => `${parola(m[1])} ${m[2] === "oggi" ? "heute" : "morgen"}`],
  ["^Rischio ((?:temporali|idrogeologico|idraulico)(?:, (?:temporali|idrogeologico|idraulico))*)$",
    m => "Risk: " + m[1].replace(/temporali|idrogeologico|idraulico/g, w => ({ temporali:"thunderstorms", idrogeologico:"landslides", idraulico:"flooding" })[w]),
    m => "Gefahr: " + m[1].replace(/temporali|idrogeologico|idraulico/g, w => ({ temporali:"Gewitter", idrogeologico:"Erdrutsche", idraulico:"Hochwasser" })[w])],
  ["^(.+)\\. Tocca per i dettagli e i consigli\\.$", m => `${m[1]}. ${parola("Tocca per i dettagli e i consigli.")}`, m => `${m[1]}. ${parola("Tocca per i dettagli e i consigli.")}`],
  [`^Bollettino del (\\d+) (${MESI.join("|")}) (\\d{4}) ore ${ORA}$`,
    m => `Bulletin of ${m[1]} ${new Date(2000, MESI.indexOf(m[2]), 1).toLocaleDateString(LOCALE, { month:"long" })} ${m[3]}, ${m[4]}`,
    m => `Lagebericht vom ${m[1]}. ${new Date(2000, MESI.indexOf(m[2]), 1).toLocaleDateString(LOCALE, { month:"long" })} ${m[3]}, ${m[4]} Uhr`],
  ["^Livello di allerta$", "Alert level", "Warnstufe"],
  // montagna
  ["^Oggi: (buono per salire|con attenzione|sconsigliato)$",
    m => "Today: " + parola(cap(m[1])).toLowerCase(), m => "Heute: " + parola(cap(m[1]))],
  ["^(-?\\d+)° in vetta$", "$1° at the summit", "$1° am Gipfel"],
  // ore migliori
  ["^Meglio tra le (\\d\\d:\\d\\d) e le (\\d\\d:\\d\\d)$", "Best between $1 and $2", "Am besten zwischen $1 und $2"],
  ["^Condizioni ideali tra le (\\d\\d:\\d\\d) e le (\\d\\d:\\d\\d)$", "Ideal conditions between $1 and $2", "Ideale Bedingungen zwischen $1 und $2"],
  ["^Le ore migliori: (\\d\\d:\\d\\d)–(\\d\\d:\\d\\d)( \\(crema solare: UV alto\\))?$", m => `Best hours: ${m[1]}–${m[2]}${m[3] ? " (sunscreen: high UV)" : ""}`, m => `Beste Stunden: ${m[1]}–${m[2]}${m[3] ? " (Sonnencreme: hoher UV-Wert)" : ""}`],
  ["^Fuori tra le (\\d\\d:\\d\\d) e le (\\d\\d:\\d\\d)$", "Outside between $1 and $2", "Draußen zwischen $1 und $2"],
  ["^Per oggi il sole è tramontato: domani dalle (\\d\\d:\\d\\d)\\.$", "The sun has set for today: tomorrow from $1.", "Die Sonne ist für heute untergegangen: morgen ab $1."],
  ["^(Passeggiata e attività all'aperto|Corsa o bici|Spiaggia|Stendere i panni): (\\d\\d:\\d\\d–\\d\\d:\\d\\d)$", m => `${parola(m[1])}: ${m[2]}`, m => `${parola(m[1])}: ${m[2]}`],
  // tramonto
  ["^(Tramonto coperto: nuvole basse o pioggia|Tramonto promettente: nuvole alte che si colorano|Tramonto limpido, cielo sereno|Tramonto discreto) \\((\\d\\d:\\d\\d)\\)\\.$", m => `${parola(m[1])} (${m[2]}).`, m => `${parola(m[1])} (${m[2]}).`],
  // caldo e incendi
  ["^Caldo (afoso|intenso|estremo) (oggi|domani): percepita fino a (\\d+)°$",
    m => `${{ afoso:"Muggy heat", intenso:"Intense heat", estremo:"Extreme heat" }[m[1]]} ${m[2] === "oggi" ? "today" : "tomorrow"}: feels like up to ${m[3]}°`,
    m => `${{ afoso:"Schwüle Hitze", intenso:"Starke Hitze", estremo:"Extreme Hitze" }[m[1]]} ${m[2] === "oggi" ? "heute" : "morgen"}: gefühlt bis ${m[3]}°`],
  ["^Rischio incendi (basso|medio|alto|molto alto) oggi$", m => `${cap(parola(cap(m[1])).toLowerCase())} wildfire risk today`, m => `Waldbrandgefahr heute ${parola(cap(m[1])).toLowerCase()}`],
  ["^Rischio (basso|medio|alto|molto alto)$", m => `${cap(parola(cap(m[1])).toLowerCase())} risk`, m => `Gefahr ${parola(cap(m[1])).toLowerCase()}`],
  ["^(Basso|Medio|Alto|Molto alto)$", m => parola(m[1]), m => parola(m[1])],
  ["^(\\d+) giorni senza pioggia$", "$1 days without rain", "$1 Tage ohne Regen"],
  ["^fuori stagione$", "off season", "außerhalb der Saison"],
  // clima
  ["^Oggi (-?\\d+)° di massima$", "Today's high: $1°", "Heutiges Maximum: $1°"],
  ["^(\\d+)° (sopra|sotto) la media del periodo \\((-?\\d+)°\\)\\.$", m => `${m[1]}° ${m[2] === "sopra" ? "above" : "below"} the seasonal average (${m[3]}°).`, m => `${m[1]}° ${m[2] === "sopra" ? "über" : "unter"} dem Mittel der Jahreszeit (${m[3]}°).`],
  ["^nella media del periodo \\((-?\\d+)°\\)\\.$", "in line with the seasonal average ($1°).", "im Mittel der Jahreszeit ($1°)."],
  ["^(\\S+) finora: ([+-]?\\d+\\.\\d)°$", m => `${m[1]} so far: ${m[2]}°`, m => `${m[1]} bisher: ${m[2]}°`],
  ["^Pioggia del mese: (\\d+) mm$", "Rain this month: $1 mm", "Regen in diesem Monat: $1 mm"],
  ["^In media fino a oggi ne cadono (\\d+) mm: (più del solito|meno del solito|come al solito)\\.$",
    m => `On average ${m[1]} mm fall up to today: ${{ "più del solito":"more than usual", "meno del solito":"less than usual", "come al solito":"about as usual" }[m[2]]}.`,
    m => `Im Mittel fallen bis heute ${m[1]} mm: ${{ "più del solito":"mehr als üblich", "meno del solito":"weniger als üblich", "come al solito":"etwa wie üblich" }[m[2]]}.`],
  ["^Oggi (\\d+° sopra|\\d+° sotto|nella media)(?: la media)? del periodo$",
    m => "Today " + (m[1] === "nella media" ? "in line with the seasonal average" : m[1].replace("sopra", "above").replace("sotto", "below") + " the seasonal average"),
    m => "Heute " + (m[1] === "nella media" ? "im jahreszeitlichen Mittel" : m[1].replace("sopra", "über").replace("sotto", "unter") + " dem Mittel")],
  ["^(\\S+) (più del solito|meno del solito|come al solito|nella media) di pioggia$",
    m => `${m[1]}: ${{ "più del solito":"more rain than usual", "meno del solito":"less rain than usual", "come al solito":"usual rainfall", "nella media":"usual rainfall" }[m[2]]}`,
    m => `${m[1]}: ${{ "più del solito":"mehr Regen als üblich", "meno del solito":"weniger Regen als üblich", "come al solito":"übliche Regenmenge", "nella media":"übliche Regenmenge" }[m[2]]}`],
  // barca e pesca
  ["^Barca: (uscita tranquilla|solo sotto costa, con prudenza|resta in porto)$", m => "Boat: " + parola(cap(m[1])).toLowerCase(), m => "Boot: " + parola(cap(m[1]))],
  ["^pesca (buona|discreta|scarsa)$", m => "fishing " + parola(cap(m[1])).toLowerCase(), m => "Angeln " + parola(cap(m[1])).toLowerCase()],
  ["^Pesca: (buona|discreta|scarsa)$", m => "Fishing: " + parola(cap(m[1])).toLowerCase(), m => "Angeln: " + parola(cap(m[1])).toLowerCase()],
  ["^Onda lunga (\\d+\\.\\d) m$", "Swell $1 m", "Dünung $1 m"],
  ["^(\\d+) s$", "$1 s", "$1 s"],
  ["^raffiche (\\d+)$", "gusts $1", "Böen $1"],
  ["^Finestra migliore: (\\d\\d:\\d\\d)–(\\d\\d:\\d\\d)\\.$", "Best window: $1–$2.", "Bestes Zeitfenster: $1–$2."],
  ["^Ore migliori secondo la tradizione: tramonto \\((\\d\\d:\\d\\d)\\) e alba \\((\\d\\d:\\d\\d)\\)\\.$", "Best times according to tradition: sunset ($1) and sunrise ($2).", "Beste Zeiten laut Tradition: Sonnenuntergang ($1) und Sonnenaufgang ($2)."],
  ["^((?:Pressione|Poco|Vento|Mare|Luna)[^.]*)\\.$",
    m => cap(m[1].replace(/pressione stabile/i, "stable pressure").replace(/pressione in lieve calo/i, "pressure falling slowly").replace(/pressione in forte aumento/i, "pressure rising fast").replace(/pressione in forte calo/i, "pressure falling fast").replace(/poco vento/i, "light wind").replace(/vento forte/i, "strong wind").replace(/mare leggermente mosso/i, "slightly rough sea").replace(/mare troppo agitato/i, "sea too rough").replace(/luna nuova/i, "new moon").replace(/luna piena/i, "full moon")) + ".",
    m => cap(m[1].replace(/pressione stabile/i, "stabiler Luftdruck").replace(/pressione in lieve calo/i, "leicht fallender Luftdruck").replace(/pressione in forte aumento/i, "stark steigender Luftdruck").replace(/pressione in forte calo/i, "stark fallender Luftdruck").replace(/poco vento/i, "wenig Wind").replace(/vento forte/i, "starker Wind").replace(/mare leggermente mosso/i, "leicht bewegtes Meer").replace(/mare troppo agitato/i, "Meer zu rau").replace(/luna nuova/i, "Neumond").replace(/luna piena/i, "Vollmond")) + "."],
  // balneazione
  ["^a (.+) \\(Portale Acque\\)\\.$", "in $1 (Portale Acque).", "in $1 (Portale Acque)."],
  ["^a ([A-Z].+)$", "in $1", "in $1"],
  ["^vicino a (.+) \\(Portale Acque, Ministero della Salute\\)\\.$", "near $1 (Portale Acque, Italian Ministry of Health).", "bei $1 (Portale Acque, italienisches Gesundheitsministerium)."],
  ["^(Temporali|Raffiche fino a \\d+ km/h|Vento forte in vetta \\(\\d+ km/h\\)|Pioggia molto probabile|Possibile pioggia \\(\\d+%\\)|Neve|Gelo \\(minima -?\\d+°\\))(, .+)?$",
    m => traduciMotivi(m[0], "en"), m => traduciMotivi(m[0], "de")]
];

function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

function traduciMotivi(testo, l){
  const voci = testo.split(", ").map(v => {
    let r;
    const x = v.toLowerCase();
    if(x === "temporali") r = { en:"thunderstorms", de:"Gewitter" }[l];
    else if((r = x.match(/^raffiche fino a (\d+) km\/h$/))) r = { en:`gusts up to ${r[1]} km/h`, de:`Böen bis ${r[1]} km/h` }[l];
    else if((r = x.match(/^vento forte in vetta \((\d+) km\/h\)$/))) r = { en:`strong wind at the summit (${r[1]} km/h)`, de:`starker Wind am Gipfel (${r[1]} km/h)` }[l];
    else if(x === "pioggia molto probabile") r = { en:"rain very likely", de:"Regen sehr wahrscheinlich" }[l];
    else if((r = x.match(/^possibile pioggia \((\d+)%\)$/))) r = { en:`rain possible (${r[1]}%)`, de:`Regen möglich (${r[1]} %)` }[l];
    else if(x === "neve") r = { en:"snow", de:"Schnee" }[l];
    else if((r = x.match(/^gelo \(minima (-?\d+)°\)$/))) r = { en:`frost (low ${r[1]}°)`, de:`Frost (Tiefstwert ${r[1]}°)` }[l];
    else r = v;
    return r;
  });
  return cap(voci.join(", "));
}

const REGOLE_COMPILATE = REGOLE.map(([e, en, de]) => [new RegExp(e), LINGUA === "en" ? en : de]);
const REGOLE_INTERE = REGOLE_COMPILATE.filter(([re]) => re.source.startsWith("^") && re.source.endsWith("$") && !re.source.includes(" · "));

function traduciPezzo(pezzo){
  const p = pezzo.trim();
  if(!p) return pezzo;
  if(T[p] !== undefined) return pezzo.replace(p, T[p]);
  for(const [re, sost] of REGOLE_COMPILATE){
    const m = p.match(re);
    if(m){
      const fuori = typeof sost === "function" ? p.replace(re, () => sost(m)) : p.replace(re, sost);
      return pezzo.replace(p, fuori);
    }
  }
  return pezzo;
}

// Traduce un testo: frase intera, poi pezzi separati da " · ", poi frase per frase.
function tr(testo){
  if(LINGUA === "it" || !testo || !/[A-Za-zàèéìòù]/.test(testo)) return testo;
  const p = testo.trim();
  if(T[p] !== undefined) return testo.replace(p, T[p]);
  if(testo.includes(" · ")) return testo.split(" · ").map(tr).join(" · ");
  // le regole che descrivono un testo intero (^…$) hanno la precedenza sulla divisione in frasi
  for(const [re, sost] of REGOLE_INTERE){
    const m = p.match(re);
    if(m) return testo.replace(p, typeof sost === "function" ? sost(m) : p.replace(re, sost));
  }
  if(/[.!?] \S/.test(p)){
    const frasi = p.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
    if(frasi && frasi.length > 1){
      const fuori = frasi.map(f => { const spazio = f.match(/\s*$/)[0]; return tr(f.trim()) + spazio; }).join("");
      return testo.replace(p, fuori.trim());
    }
  }
  return traduciPezzo(testo);
}

// Traduce automaticamente tutto quello che l'app mostra
(function avviaTraduzione(){
  if(LINGUA === "it") return;
  const tradotti = new WeakMap();
  const ATTRIBUTI = ["placeholder", "aria-label", "title"];
  const saltare = el => el && el.closest && el.closest("script, style, svg, .leaflet-control-attribution, #fotoCredito, .nome-paese");

  function nodoTesto(n){
    if(saltare(n.parentElement)) return;
    if(tradotti.get(n) === n.nodeValue) return;
    const nuovo = tr(n.nodeValue);
    if(nuovo !== n.nodeValue) n.nodeValue = nuovo;
    tradotti.set(n, n.nodeValue);
  }
  function elemento(el){
    if(el.nodeType === 3) return nodoTesto(el);
    if(el.nodeType !== 1 || saltare(el)) return;
    for(const a of ATTRIBUTI) if(el.hasAttribute(a)){ const v = el.getAttribute(a), t = tr(v); if(t !== v) el.setAttribute(a, t); }
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while((n = w.nextNode())){
      if(n.nodeType === 3) nodoTesto(n);
      else for(const a of ATTRIBUTI) if(n.hasAttribute(a)){ const v = n.getAttribute(a), t = tr(v); if(t !== v) n.setAttribute(a, t); }
    }
  }
  const osserva = () => {
    elemento(document.body);
    document.title = "CILENTO METEO";
    new MutationObserver(lista => {
      for(const m of lista){
        if(m.type === "characterData") nodoTesto(m.target);
        else if(m.type === "attributes"){ const v = m.target.getAttribute(m.attributeName), t = v && tr(v); if(t && t !== v) m.target.setAttribute(m.attributeName, t); }
        else m.addedNodes.forEach(elemento);
      }
    }).observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:ATTRIBUTI });
  };
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", osserva);
  else osserva();
})();
