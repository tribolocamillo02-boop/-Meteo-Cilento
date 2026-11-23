#!/usr/bin/env python3
"""Aggiorna balneazione.json: divieti di balneazione in corso vicino alle località di mare.

Fonte: Portale Acque del Ministero della Salute (aree di balneazione e aree
interdette della Campania). Per ogni località di mare dell'app cerca l'area di
balneazione più vicina e controlla se c'è un'area interdetta (divieto) a meno di
1 km. Usa solo la libreria standard di Python.
"""
import http.cookiejar, json, math, os, ssl, sys, urllib.request
from datetime import datetime, timezone

BASE = "https://www.portaleacque.salute.gov.it/PortaleAcquePubblico"
COMUNE_CAMPANIA = "065028"   # un comune campano qualsiasi: il servizio restituisce tutta la regione
USCITA = sys.argv[1] if len(sys.argv) > 1 else "balneazione.json"
LOCALITA = {
    "Marina di Casal Velino": (40.1767, 15.1222), "Acciaroli": (40.1810, 15.0272), "Pioppi": (40.1744, 15.0887),
    "Palinuro": (40.0368, 15.2881), "Marina di Camerota": (40.0036, 15.3672), "Marina di Ascea": (40.1426, 15.1837),
    "Marina di Pisciotta": (40.1016, 15.2317), "Santa Maria di Castellabate": (40.2978, 14.9521),
    "San Marco di Castellabate": (40.2674, 14.9390), "Ogliastro Marina": (40.2337, 14.9395),
    "Agnone Cilento": (40.2163, 14.9974), "Paestum": (40.4223, 15.0073), "Scario": (40.0621, 15.4742)
}

# Il server del Portale Acque accetta solo cifrature vecchie, rifiutate dalle impostazioni
# predefinite di OpenSSL 3: si abbassa il livello minimo solo per questo server
# (i dati sono pubblici, nessuna informazione riservata viene inviata).
contesto = ssl.create_default_context()
contesto.set_ciphers("DEFAULT@SECLEVEL=0")
contesto.options |= getattr(ssl, "OP_LEGACY_SERVER_CONNECT", 0x4)

jar = http.cookiejar.CookieJar()
apri = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar), urllib.request.HTTPSHandler(context=contesto))
apri.addheaders = [("User-Agent", "MeteoCilento-balneazione/1.0"), ("Accept", "")]


def scarica(percorso):
    with apri.open(f"{BASE}/{percorso}", timeout=90) as r:
        return r.read()


def punti(geom):
    if geom["type"] == "Polygon":
        return [p for anello in geom["coordinates"] for p in anello]
    if geom["type"] == "MultiPolygon":
        return [p for poli in geom["coordinates"] for anello in poli for p in anello]
    if geom["type"] == "Point":
        return [geom["coordinates"]]
    return [p for linea in geom.get("coordinates", []) for p in (linea if isinstance(linea[0], list) else [linea])]


def km(lat1, lon1, lat2, lon2):
    r = math.pi / 180
    a = math.sin((lat2 - lat1) * r / 2) ** 2 + math.cos(lat1 * r) * math.cos(lat2 * r) * math.sin((lon2 - lon1) * r / 2) ** 2
    return 12742 * math.asin(math.sqrt(a))


def distanza(lat, lon, feature):
    return min(km(lat, lon, p[1], p[0]) for p in punti(feature["geometry"]))


def main():
    scarica("mappa")   # apre la sessione come fa il sito
    aree = json.loads(scarica(f"rest/layer/AB/{COMUNE_CAMPANIA}"))["features"]
    interdette = json.loads(scarica(f"rest/layer/AI/{COMUNE_CAMPANIA}"))["features"]
    if not aree:
        raise SystemExit("Nessuna area di balneazione ricevuta")

    risultato = {}
    for nome, (lat, lon) in LOCALITA.items():
        vicina = min(aree, key=lambda f: distanza(lat, lon, f))
        d_area = distanza(lat, lon, vicina)
        divieti = [f for f in interdette if distanza(lat, lon, f) <= 1.0]
        risultato[nome] = {
            "stato": "divieto" if divieti else ("ok" if d_area <= 2.0 else "nessun_dato"),
            "area": vicina["properties"].get("CODICE"),
            "distanza_area_km": round(d_area, 2),
            "divieti": [f["properties"].get("CODICE") for f in divieti]
        }

    nuovo = {
        "fonte": "Ministero della Salute · Portale Acque (aree di balneazione e divieti)",
        "localita": risultato
    }
    vecchio = None
    if os.path.exists(USCITA):
        try:
            vecchio = json.load(open(USCITA, encoding="utf-8"))
        except ValueError:
            pass
    if vecchio and vecchio.get("localita") == risultato:
        print("Nessun cambiamento")
        return
    nuovo["aggiornato"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
    with open(USCITA, "w", encoding="utf-8") as f:
        json.dump(nuovo, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"Scritto {USCITA}: {sum(v['stato'] == 'divieto' for v in risultato.values())} località con divieto")


if __name__ == "__main__":
    main()
