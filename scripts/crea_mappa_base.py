#!/usr/bin/env python3
"""Disegna la mappa di base del Cilento per i post «notizia» del robot Instagram.

Usa il rilievo di AWS Terrain Tiles (formato Terrarium, dati SRTM e altri,
attribuzione: Mapzen / AWS Open Data) e crea:
  social/mappa-base.png   1080×1050, mare con profondità, terra colorata per quota
                          con ombre in rilievo, costa luminosa
  social/mappa-terra.png  maschera della terraferma (bianco = terra)
  social/mappa.json       confini della mappa (nord, sud, ovest, est, larghezza, altezza)

Si lancia una volta sola (la mappa non cambia): python3 scripts/crea_mappa_base.py
"""
import io, json, math, os, urllib.request
import numpy as np
from PIL import Image, ImageFilter

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARTELLA = os.path.join(RADICE, "social")
NORD, SUD, OVEST, EST = 40.72, 39.93, 14.82, 15.88
W, H = 1080, 1050
SCALA = 2                     # si disegna al doppio e poi si riduce, per bordi nitidi
Z = 11                        # livello delle tessere (~75 m per pixel)

def sfoca(a, r):
    """Sfocatura morbida (tre passate di media mobile) su un array numpy."""
    r = max(1, int(round(r)))
    for _ in range(3):
        for asse in (0, 1):
            p = np.pad(a, [(r + 1, r) if k == asse else (0, 0) for k in (0, 1)], mode="edge")
            c = np.cumsum(p, axis=asse, dtype=np.float64)
            if asse == 0: a = ((c[2 * r + 1:] - c[:-2 * r - 1]) / (2 * r + 1)).astype(np.float32)
            else: a = ((c[:, 2 * r + 1:] - c[:, :-2 * r - 1]) / (2 * r + 1)).astype(np.float32)
    return a

def tessera_xy(lat, lon, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y

def scarica(z, x, y):
    url = f"https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png"
    dati = urllib.request.urlopen(url, timeout=60).read()
    a = np.asarray(Image.open(io.BytesIO(dati)).convert("RGB"), dtype=np.float32)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768

def main():
    x0, y0 = tessera_xy(NORD, OVEST, Z)
    x1, y1 = tessera_xy(SUD, EST, Z)
    tx0, ty0, tx1, ty1 = int(x0), int(y0), int(x1), int(y1)
    cache = os.environ.get("CACHE_RILIEVO")
    if cache and os.path.exists(cache):
        mosaico = np.load(cache)
    else:
        mosaico = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256), np.float32)
        for ty in range(ty0, ty1 + 1):
            for tx in range(tx0, tx1 + 1):
                mosaico[(ty - ty0) * 256:(ty - ty0 + 1) * 256, (tx - tx0) * 256:(tx - tx0 + 1) * 256] = scarica(Z, tx, ty)
        if cache: np.save(cache, mosaico)
    print("tessere:", (tx1 - tx0 + 1) * (ty1 - ty0 + 1))

    # Ricampiona su una griglia regolare in lat/lon (come usa il robot)
    w, h = W * SCALA, H * SCALA
    lon = OVEST + (EST - OVEST) * (np.arange(w) + .5) / w
    lat = NORD + (SUD - NORD) * (np.arange(h) + .5) / h
    n = 2 ** Z
    px = ((lon + 180) / 360 * n - tx0) * 256
    py = ((1 - np.arcsinh(np.tan(np.radians(lat))) / np.pi) / 2 * n - ty0) * 256
    PX, PY = np.meshgrid(px, py)
    ix, iy = np.floor(PX).astype(int), np.floor(PY).astype(int)
    fx, fy = PX - ix, PY - iy
    ix = np.clip(ix, 0, mosaico.shape[1] - 2); iy = np.clip(iy, 0, mosaico.shape[0] - 2)
    q = (mosaico[iy, ix] * (1 - fx) * (1 - fy) + mosaico[iy, ix + 1] * fx * (1 - fy)
         + mosaico[iy + 1, ix] * (1 - fx) * fy + mosaico[iy + 1, ix + 1] * fx * fy)

    terra = sfoca((q > 0.5).astype(np.float32), 2) > 0.5      # niente puntini isolati
    # Ombre in rilievo da più direzioni (effetto 3D morbido)
    metri = 2 * math.pi * 6371000 * math.cos(math.radians(40.3)) * (EST - OVEST) / 360 / w
    qs = sfoca(np.maximum(q, 0).astype(np.float32), 1)
    gy, gx = np.gradient(qs, metri)
    pend = np.arctan(np.hypot(gx, gy) * 2.2)
    asp = np.arctan2(-gx, gy)
    luce = np.zeros_like(q)
    for az, peso in ((315, .55), (270, .2), (0, .25)):
        a = math.radians(360 - az + 90)
        alt = math.radians(42)
        luce += peso * (math.sin(alt) * np.cos(pend) + math.cos(alt) * np.sin(pend) * np.cos(a - asp))
    luce = np.clip(luce, 0, 1)

    # Colori per quota: verdi vivi in pianura, ocra e marroni in collina, rocce e cime chiare
    tappe = np.array([0, 60, 200, 450, 800, 1200, 1600, 2000], np.float32)
    colori = np.array([
        [46, 160, 88], [92, 182, 82], [150, 190, 86], [196, 184, 102],
        [178, 140, 92], [150, 112, 86], [196, 184, 176], [245, 245, 250]], np.float32)
    qq = np.clip(q, 0, 2000)
    rgb = np.stack([np.interp(qq, tappe, colori[:, k]) for k in range(3)], -1)
    ombra = (.35 + .95 * luce)[..., None]
    terra_rgb = np.clip(rgb * ombra, 0, 255)

    # Mare: turchese vicino alla costa, blu profondo al largo (dalla distanza dalla costa)
    vic = sfoca(terra.astype(np.float32), 26 * SCALA)            # 1 sulla costa, 0 al largo
    t = np.clip(1 - vic * 2.2, 0, 1)[..., None]
    t = t ** .8
    vicino = np.array([22, 196, 214], np.float32); medio = np.array([10, 98, 178], np.float32); largo = np.array([6, 30, 96], np.float32)
    mare_rgb = np.where(t < .45, vicino * (1 - t / .45) + medio * (t / .45), medio * (1 - (t - .45) / .55) + largo * ((t - .45) / .55))
    # leggera luce dall'alto a sinistra
    yy, xx = np.mgrid[0:h, 0:w]
    mare_rgb = np.clip(mare_rgb * (1.08 - .18 * (xx / w * .4 + yy / h * .6))[..., None], 0, 255)
    img = np.where(terra[..., None], terra_rgb, mare_rgb).astype(np.uint8)
    base = Image.fromarray(img, "RGB")

    # Costa luminosa
    maschera = Image.fromarray((terra * 255).astype(np.uint8))
    bordo = maschera.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(1.6))
    bordo_np = np.asarray(bordo, np.float32)[..., None] / 255
    alone = np.asarray(maschera.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(7)), np.float32)[..., None] / 255
    finale = np.asarray(base, np.float32)
    finale = finale + alone * 3.2 * np.array([120, 220, 255]) * (1 - terra[..., None] * .6)
    finale = finale * (1 - np.clip(bordo_np * 2.4, 0, 1)) + np.clip(bordo_np * 2.4, 0, 1) * np.array([235, 250, 255])
    base = Image.fromarray(np.clip(finale, 0, 255).astype(np.uint8), "RGB").resize((W, H), Image.LANCZOS)
    os.makedirs(CARTELLA, exist_ok=True)
    base.save(os.path.join(CARTELLA, "mappa-base.png"), optimize=True)
    maschera.filter(ImageFilter.GaussianBlur(1.5)).resize((W, H), Image.LANCZOS).save(os.path.join(CARTELLA, "mappa-terra.png"), optimize=True)
    json.dump({"nord": NORD, "sud": SUD, "ovest": OVEST, "est": EST, "larghezza": W, "altezza": H,
               "fonte": "Rilievo: Mapzen / AWS Terrain Tiles (SRTM e altri)"},
              open(os.path.join(CARTELLA, "mappa.json"), "w"), ensure_ascii=False, indent=1)
    print("Creata social/mappa-base.png")

if __name__ == "__main__":
    main()
