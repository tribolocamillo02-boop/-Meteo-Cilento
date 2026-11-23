#!/usr/bin/env python3
"""Aggiorna allerta.json con i livelli di allerta delle zone del Cilento.

Fonte: Bollettino di criticità nazionale del Dipartimento della Protezione
Civile (dati aperti CC BY 4.0, repository pcm-dpc su GitHub). Lo script trova
l'ultimo bollettino pubblicato, legge le zone di allerta della Campania che
coprono il Cilento e scrive un file piccolo che l'app legge.

Uso: python3 scripts/aggiorna_allerta.py [percorso di uscita]
Usa solo la libreria standard di Python e il comando git.
"""
import json, os, re, subprocess, sys, tempfile, urllib.request

REPO = "https://github.com/pcm-dpc/DPC-Bollettini-Criticita-Idrogeologica-Idraulica.git"
RAW = "https://raw.githubusercontent.com/pcm-dpc/DPC-Bollettini-Criticita-Idrogeologica-Idraulica/master/"
ZONE = {"S": "Piana Sele e Alto Cilento", "B": "Basso Cilento", "T": "Tanagro"}
USCITA = sys.argv[1] if len(sys.argv) > 1 else "allerta.json"


def scarica(url):
    req = urllib.request.Request(url, headers={"User-Agent": "MeteoCilento-allerta/1.0"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read()


def ultimo_bollettino():
    """Nome (es. 20261122_1447) dell'ultimo bollettino, letto dall'elenco dei file del repository."""
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["git", "clone", "--quiet", "--depth", "1", "--filter=blob:none", "--no-checkout", REPO, tmp],
                       check=True)
        nomi = subprocess.run(["git", "-C", tmp, "ls-tree", "--name-only", "HEAD", "files/"],
                              check=True, capture_output=True, text=True).stdout.split()
    ids = sorted(m.group(1) for n in nomi if (m := re.fullmatch(r"files/(\d{8}_\d{4})\.json", n)))
    if not ids:
        raise SystemExit("Nessun bollettino trovato")
    return ids[-1]


def livello(testo):
    t = (testo or "").upper()
    if "ROSSA" in t:
        return "rosso"
    if "ARANCIONE" in t:
        return "arancione"
    if "GIALLA" in t:
        return "giallo"
    return "verde"


def leggi_giorno(id_, giorno):
    dati = json.loads(scarica(f"{RAW}files/geojson/{id_}_{giorno}.json"))
    risultato = {}
    for f in dati["features"]:
        p = f["properties"]
        for codice, nome in ZONE.items():
            if p.get("Nome zona") == nome:
                risultato[codice] = {
                    "livello": livello(p.get("Rappresentata nella mappa")),
                    "idrogeologico": livello(p.get("Per rischio idrogeologico")),
                    "idraulico": livello(p.get("Per rischio idraulico")),
                    "temporali": livello(p.get("Per rischio temporali")),
                }
    mancanti = set(ZONE) - set(risultato)
    if mancanti:
        raise SystemExit(f"Zone non trovate nel bollettino: {mancanti}")
    return risultato


def main():
    id_ = ultimo_bollettino()
    if os.path.exists(USCITA):
        try:
            if json.load(open(USCITA, encoding="utf-8")).get("id") == id_:
                print(f"Già aggiornato al bollettino {id_}")
                return
        except (ValueError, OSError):
            pass

    info = json.loads(scarica(f"{RAW}files/{id_}.json"))
    data = f"{id_[0:4]}-{id_[4:6]}-{id_[6:8]}"
    oggi, domani = leggi_giorno(id_, "today"), leggi_giorno(id_, "tomorrow")
    from datetime import date, timedelta
    data_domani = (date.fromisoformat(data) + timedelta(days=1)).isoformat()

    uscita = {
        "id": id_,
        "bollettino": info.get("name", ""),
        "fonte": "Dipartimento della Protezione Civile · Bollettino di criticità nazionale (CC BY 4.0)",
        "giorni": {data: {k: oggi[k] for k in ZONE}, data_domani: {k: domani[k] for k in ZONE}},
        "zone": ZONE,
    }
    with open(USCITA, "w", encoding="utf-8") as f:
        json.dump(uscita, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"Scritto {USCITA} dal bollettino {id_}")


if __name__ == "__main__":
    main()
