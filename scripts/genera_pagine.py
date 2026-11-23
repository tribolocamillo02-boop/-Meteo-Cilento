#!/usr/bin/env python3
"""Genera una pagina per ogni paese del Cilento (paesi/<nome>/index.html),
l'elenco di tutti i paesi (paesi/index.html), sitemap.xml e robots.txt.

Le pagine servono a farsi trovare su Google ("meteo Palinuro", "meteo Sapri"...):
hanno titolo, descrizione e testo propri, le previsioni dal vivo e un pulsante
che apre il paese nell'app (?paese=nome).

I paesi sono letti da index.html (array COMUNI). Le altitudini vengono chieste una
volta sola a Open-Meteo e salvate in scripts/altitudini.json.

Uso: python3 scripts/genera_pagine.py
"""
import html, json, math, os, re, sys, unicodedata, urllib.request
from datetime import date

SITO = "https://cilentometeo.it/"
RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZONE_ALLERTA = {"S": "Piana Sele e Alto Cilento", "B": "Basso Cilento", "T": "Tanagro"}
DESCRIZIONE_ZONA = {
    "Località di mare": "una località di mare del Cilento",
    "Alto Cilento": "un comune dell'Alto Cilento",
    "Basso Cilento": "un comune del Basso Cilento",
    "Alburni": "un comune dei Monti Alburni",
    "Vallo di Diano": "un comune del Vallo di Diano",
    "Piana del Sele": "un comune della Piana del Sele",
    "Monti Eremita-Marzano": "un comune dei Monti Eremita-Marzano",
}
ORDINE_ZONE = list(DESCRIZIONE_ZONA)


def slug(nome):
    s = unicodedata.normalize("NFD", nome.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def km(a, b):
    r = math.pi / 180
    x = math.sin((b[0] - a[0]) * r / 2) ** 2 + math.cos(a[0] * r) * math.cos(b[0] * r) * math.sin((b[1] - a[1]) * r / 2) ** 2
    return 12742 * math.asin(math.sqrt(x))


def leggi_paesi():
    testo = open(os.path.join(RADICE, "index.html"), encoding="utf-8").read()
    voci = re.findall(r'^\s+\[("[^"]+"), "([^"]+)", ([\d.]+), ([\d.]+), "([SBT])"\]', testo, re.M)
    paesi = [{"nome": json.loads(n), "zona": z, "lat": float(la), "lon": float(lo), "allerta": a} for n, z, la, lo, a in voci]
    if len(paesi) < 100:
        sys.exit(f"Trovati solo {len(paesi)} paesi in index.html: controlla l'array COMUNI")
    return paesi


def altitudini(paesi):
    percorso = os.path.join(RADICE, "scripts", "altitudini.json")
    cache = json.load(open(percorso, encoding="utf-8")) if os.path.exists(percorso) else {}
    mancanti = [p for p in paesi if p["nome"] not in cache]
    for i in range(0, len(mancanti), 100):
        gruppo = mancanti[i:i + 100]
        url = ("https://api.open-meteo.com/v1/elevation?latitude=" + ",".join(str(p["lat"]) for p in gruppo)
               + "&longitude=" + ",".join(str(p["lon"]) for p in gruppo))
        req = urllib.request.Request(url, headers={"User-Agent": "MeteoCilento-pagine/1.0"})
        quote = json.load(urllib.request.urlopen(req, timeout=60))["elevation"]
        for p, q in zip(gruppo, quote):
            cache[p["nome"]] = round(q)
    if mancanti:
        with open(percorso, "w", encoding="utf-8") as f:
            json.dump(dict(sorted(cache.items())), f, ensure_ascii=False, indent=1)
            f.write("\n")
    for p in paesi:
        p["quota"] = cache[p["nome"]]


STILE = """
:root{--nero:#02040a;--blu:#2f7dff;--blu-chiaro:#8cc4ff;--bianco:#f4f8ff;--testo-2:rgba(228,238,255,.7);--testo-3:rgba(228,238,255,.45);--bordo:rgba(255,255,255,.1);}
*{box-sizing:border-box;}
body{margin:0;background:radial-gradient(ellipse 90% 45% at 50% 0%,rgba(47,125,255,.28),transparent 70%),var(--nero);color:var(--bianco);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Arial,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased;}
main{max-width:760px;margin:0 auto;padding:calc(20px + env(safe-area-inset-top)) 16px 48px;}
a{color:var(--blu-chiaro);}
.marchio{display:inline-flex;align-items:center;gap:10px;font-weight:700;letter-spacing:.3em;font-size:12px;text-decoration:none;color:var(--bianco);}
.marchio img{width:30px;height:30px;border-radius:8px;}
nav.briciole{margin:18px 0 6px;font-size:13px;color:var(--testo-3);}
nav.briciole a{color:var(--testo-2);text-decoration:none;}
h1{font-size:clamp(30px,8vw,44px);line-height:1.1;margin:6px 0 10px;letter-spacing:-.02em;}
h2{font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:var(--testo-2);margin:30px 0 12px;}
p{color:var(--testo-2);}
.card{padding:18px;border-radius:22px;background:rgba(255,255,255,.055);border:1px solid var(--bordo);}
.adesso{display:flex;align-items:center;gap:18px;}
.adesso .t{font-size:64px;font-weight:200;letter-spacing:-.05em;line-height:1;}
.adesso b{display:block;font-size:19px;}
.adesso span{color:var(--testo-2);font-size:14px;}
.giorni{display:grid;gap:2px;margin-top:14px;}
.giorni div{display:grid;grid-template-columns:90px 1fr 54px 54px;gap:8px;align-items:center;padding:9px 0;border-top:1px solid rgba(255,255,255,.06);font-size:14px;}
.giorni .min{color:var(--testo-2);text-align:right;}
.giorni .max{font-weight:600;text-align:right;}
.giorni .p{color:var(--blu-chiaro);font-size:12px;}
.apri{display:block;margin:18px 0 0;padding:16px;border-radius:18px;text-align:center;font-weight:700;color:#fff;text-decoration:none;background:linear-gradient(180deg,#3d8bff,#1f5fd6);box-shadow:0 12px 30px rgba(47,125,255,.35);}
dl{display:grid;grid-template-columns:auto 1fr;gap:8px 16px;margin:0;font-size:15px;}
dt{color:var(--testo-3);}
dd{margin:0;}
ul.link{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:8px;}
ul.link a{display:inline-block;padding:9px 13px;border-radius:999px;border:1px solid var(--bordo);background:rgba(255,255,255,.05);text-decoration:none;color:var(--bianco);font-size:14px;}
footer{margin-top:36px;font-size:12px;color:var(--testo-3);text-align:center;}
"""

WIDGET = """
<script>
(function(){
  var C = document.getElementById("previsioni");
  var lat = C.dataset.lat, lon = C.dataset.lon;
  function testo(c){ if(c===0)return "Sereno"; if(c<=2)return "Poco nuvoloso"; if(c===3)return "Coperto"; if(c<=48)return "Nebbia";
    if(c<=57)return "Pioviggine"; if(c<=67)return "Pioggia"; if(c<=77)return "Neve"; if(c<=82)return "Rovesci"; if(c<=86)return "Rovesci di neve"; return "Temporale"; }
  fetch("https://api.open-meteo.com/v1/forecast?latitude="+lat+"&longitude="+lon+"&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=Europe%2FRome")
    .then(function(r){ return r.json(); })
    .then(function(d){
      var c = d.current, g = d.daily, righe = "";
      for(var i = 0; i < g.time.length; i++){
        var nome = i === 0 ? "Oggi" : new Date(g.time[i] + "T12:00:00").toLocaleDateString("it-IT", { weekday:"short", day:"numeric" });
        righe += "<div><span>" + nome + "</span><span>" + testo(g.weather_code[i]) + (g.precipitation_probability_max[i] > 0 ? " <span class=p>" + g.precipitation_probability_max[i] + "%</span>" : "") + "</span><span class=min>" + Math.round(g.temperature_2m_min[i]) + "°</span><span class=max>" + Math.round(g.temperature_2m_max[i]) + "°</span></div>";
      }
      C.innerHTML = "<div class=adesso><div class=t>" + Math.round(c.temperature_2m) + "°</div><div><b>" + testo(c.weather_code) + "</b><span>Percepita " + Math.round(c.apparent_temperature) + "° · vento " + Math.round(c.wind_speed_10m) + " km/h · umidità " + c.relative_humidity_2m + "%</span></div></div><div class=giorni>" + righe + "</div>";
    })
    .catch(function(){ C.innerHTML = "<p>Previsioni non disponibili in questo momento: aprile nell'app.</p>"; });
})();
</script>"""


def pagina(p, paesi, mare):
    nome = p["nome"]
    s = slug(nome)
    vicini = sorted((q for q in paesi if q is not p), key=lambda q: km((p["lat"], p["lon"]), (q["lat"], q["lon"])))[:8]
    spiaggia = min(mare, key=lambda q: km((p["lat"], p["lon"]), (q["lat"], q["lon"])))
    dist_mare = km((p["lat"], p["lon"]), (spiaggia["lat"], spiaggia["lon"]))
    sul_mare = p["zona"] == "Località di mare"
    allerta = ZONE_ALLERTA[p["allerta"]]
    frase_mare = ("sul mare" if sul_mare else
                  f"a circa {round(dist_mare)} km dal mare di {spiaggia['nome']}" if dist_mare < 40 else "nell'entroterra")
    titolo = f"Meteo {nome}: previsioni, mare e radar | Cilento Meteo"
    descr = (f"Meteo {nome} oggi, domani e per 7 giorni: previsioni ora per ora, "
             + ("mare e onde, " if sul_mare or dist_mare < 15 else "")
             + f"radar della Protezione Civile e allerte. {DESCRIZIONE_ZONA[p['zona']][0].upper() + DESCRIZIONE_ZONA[p['zona']][1:]}, {p['quota']} m.")
    url = f"{SITO}paesi/{s}/"
    app = f"../../?paese={s}"
    jsonld = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": titolo,
        "url": url,
        "inLanguage": "it",
        "about": {
            "@type": "Place", "name": nome,
            "geo": {"@type": "GeoCoordinates", "latitude": p["lat"], "longitude": p["lon"], "elevation": p["quota"]},
            "containedInPlace": {"@type": "AdministrativeArea", "name": "Cilento, provincia di Salerno, Campania"}
        },
        "breadcrumb": {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Cilento Meteo", "item": SITO},
            {"@type": "ListItem", "position": 2, "name": "Paesi", "item": SITO + "paesi/"},
            {"@type": "ListItem", "position": 3, "name": nome, "item": url}]}
    }
    e = html.escape
    vicini_html = "".join(f'<li><a href="../{slug(q["nome"])}/">Meteo {e(q["nome"])}</a></li>' for q in vicini)
    return f"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#02040a">
<title>{e(titolo)}</title>
<meta name="description" content="{e(descr)}">
<link rel="canonical" href="{url}">
<link rel="icon" type="image/png" sizes="32x32" href="../../icone/favicon-32.png">
<link rel="apple-touch-icon" href="../../icone/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:title" content="{e(titolo)}">
<meta property="og:description" content="{e(descr)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITO}icone/icona-512.png">
<meta property="og:locale" content="it_IT">
<script type="application/ld+json">{json.dumps(jsonld, ensure_ascii=False)}</script>
<style>{STILE}</style>
</head>
<body>
<main>
  <a class="marchio" href="../../"><img src="../../icone/icona-192.png" alt="">CILENTO METEO</a>
  <nav class="briciole"><a href="../../">Cilento Meteo</a> › <a href="../">Paesi</a> › {e(nome)}</nav>
  <h1>Meteo {e(nome)}</h1>
  <p>{e(nome)} è {DESCRIZIONE_ZONA[p['zona']]}, a {p['quota']} metri di altitudine, {e(frase_mare)}. Qui trovi le previsioni del tempo aggiornate: com'è il meteo adesso e per i prossimi 7 giorni. Nell'app ci sono anche le previsioni ora per ora, la pioggia nelle prossime 2 ore, il radar della Protezione Civile e le allerte per la zona.</p>

  <div class="card" id="previsioni" data-lat="{p['lat']}" data-lon="{p['lon']}">
    <p>Caricamento delle previsioni di {e(nome)}…</p>
    <noscript><p>Per vedere le previsioni attiva JavaScript, oppure apri l'app.</p></noscript>
  </div>
  <a class="apri" href="{app}">Apri {e(nome)} nell'app Cilento Meteo</a>

  <h2>{e(nome)} in breve</h2>
  <div class="card">
    <dl>
      <dt>Zona</dt><dd>{e(p['zona'])}</dd>
      <dt>Altitudine</dt><dd>{p['quota']} m</dd>
      <dt>Mare più vicino</dt><dd>{e(spiaggia['nome']) if not sul_mare else e(nome)}{'' if sul_mare else f' · circa {round(dist_mare)} km'}</dd>
      <dt>Zona di allerta</dt><dd>{e(allerta)} (Protezione Civile Campania)</dd>
      <dt>Coordinate</dt><dd>{p['lat']:.4f} N, {p['lon']:.4f} E</dd>
    </dl>
  </div>

  <h2>Meteo nei paesi vicini</h2>
  <ul class="link">{vicini_html}</ul>

  <footer>
    <p><a href="../">Tutti i paesi del Cilento</a> · <a href="../../privacy.html">Privacy</a></p>
    <p>Dati meteo: Open-Meteo · Radar: Dipartimento della Protezione Civile</p>
  </footer>
</main>
{WIDGET}
</body>
</html>
"""


def elenco(paesi):
    gruppi = ""
    for z in ORDINE_ZONE:
        nomi = sorted((p for p in paesi if p["zona"] == z), key=lambda p: p["nome"])
        if not nomi:
            continue
        voci = "".join(f'<li><a href="{slug(p["nome"])}/">{html.escape(p["nome"])}</a></li>' for p in nomi)
        gruppi += f"<h2>{html.escape(z)} · {len(nomi)}</h2>\n<ul class=\"link\">{voci}</ul>\n"
    titolo = "Meteo di tutti i paesi del Cilento | Cilento Meteo"
    descr = f"Previsioni meteo per {len(paesi)} paesi e località di mare del Cilento, del Vallo di Diano e degli Alburni: mare, radar e allerte."
    return f"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#02040a">
<title>{titolo}</title>
<meta name="description" content="{html.escape(descr)}">
<link rel="canonical" href="{SITO}paesi/">
<link rel="icon" type="image/png" sizes="32x32" href="../icone/favicon-32.png">
<meta property="og:title" content="{titolo}">
<meta property="og:description" content="{html.escape(descr)}">
<meta property="og:image" content="{SITO}icone/icona-512.png">
<style>{STILE}</style>
</head>
<body>
<main>
  <a class="marchio" href="../"><img src="../icone/icona-192.png" alt="">CILENTO METEO</a>
  <nav class="briciole"><a href="../">Cilento Meteo</a> › Paesi</nav>
  <h1>Il meteo di tutti i paesi del Cilento</h1>
  <p>{html.escape(descr)} Scegli un paese per le previsioni, oppure <a href="../">apri l'app</a>.</p>
{gruppi}
  <footer><p><a href="../">Cilento Meteo</a> · <a href="../privacy.html">Privacy</a></p></footer>
</main>
</body>
</html>
"""


def main():
    paesi = leggi_paesi()
    altitudini(paesi)
    mare = [p for p in paesi if p["zona"] == "Località di mare"]
    cartella = os.path.join(RADICE, "paesi")
    os.makedirs(cartella, exist_ok=True)
    attesi = {slug(p["nome"]) for p in paesi}
    for p in paesi:
        d = os.path.join(cartella, slug(p["nome"]))
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
            f.write(pagina(p, paesi, mare))
    # pagine di paesi tolti dall'elenco
    for nome in os.listdir(cartella):
        if os.path.isdir(os.path.join(cartella, nome)) and nome not in attesi:
            print("Attenzione: pagina di un paese non più in elenco:", nome)
    with open(os.path.join(cartella, "index.html"), "w", encoding="utf-8") as f:
        f.write(elenco(paesi))

    oggi = date.today().isoformat()
    url = [SITO, SITO + "paesi/", SITO + "privacy.html"] + [f"{SITO}paesi/{slug(p['nome'])}/" for p in paesi]
    with open(os.path.join(RADICE, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for u in url:
            f.write(f"  <url><loc>{u}</loc><lastmod>{oggi}</lastmod></url>\n")
        f.write("</urlset>\n")
    with open(os.path.join(RADICE, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(f"User-agent: *\nAllow: /\n\nSitemap: {SITO}sitemap.xml\n")
    print(f"Generate {len(paesi)} pagine, elenco, sitemap.xml e robots.txt")


if __name__ == "__main__":
    main()
