#!/usr/bin/env python3
"""
Real satellite basemap builder -- NASA GIBS (public domain, commercial use OK).

Downloads Web Mercator tiles for a bbox ONCE, caches them on disk, and stitches a
single mosaic per region into public/basemap/<id>.jpg.

Why this is legal/correct:
  - NASA GIBS is NASA open data: free to use, no API key, attribution requested.
  - Tiles are fetched once and cached (not a rendering-time scrape of a shared
    community server like OSM's, whose usage policy forbids bulk downloading).

Usage: python3 scripts/fetch_basemap.py
"""
import math, os, pathlib, sys, urllib.request
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "basemap"
CACHE = pathlib.Path.home() / ".cache" / "gibs"
LAYER = "BlueMarble_ShadedRelief_Bathymetry"
LEVEL = "GoogleMapsCompatible_Level8"
MAXZ = 8
BASE = f"https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{LAYER}/default/{LEVEL}"

# id: (minLng, minLat, maxLng, maxLat, zoom, (anchorLng, anchorLat))
# The anchor is the subject of the shot: the 16:9 trim is shifted (never centred
# blindly) so the subject always survives the crop at the intended screen spot.
REGIONS = {
    "world":      (-180.0, -60.0, 180.0, 78.0, 3, (0.0, 20.0)),
    "hormuz":     (47.0, 21.5, 63.0, 31.0, 8, (56.5, 26.6)),
    "malacca":    (94.0, -2.0, 108.0, 8.0, 8, (100.6, 2.5)),
    "babalmandeb":(31.0, 8.0, 50.0, 24.0, 8, (43.4, 12.6)),
    "panama":     (-92.0, 1.0, -67.0, 17.0, 8, (-79.6, 9.1)),
    "gibraltar":  (-14.0, 31.0, 4.0, 41.0, 8, (-5.6, 35.95)),
    "bosporus":   (19.0, 36.0, 38.0, 46.0, 8, (29.05, 41.1)),
    "danish":     (3.0, 52.0, 19.0, 59.0, 8, (11.0, 55.3)),
}

def tile_xy(lat, lng, z):
    n = 2 ** z
    col = int((lng + 180.0) / 360.0 * n)
    r = math.radians(lat)
    row = int((1.0 - math.log(math.tan(r) + 1.0 / math.cos(r)) / math.pi) / 2.0 * n)
    return max(0, min(n - 1, col)), max(0, min(n - 1, row))

def fetch(z, row, col):
    CACHE.mkdir(parents=True, exist_ok=True)
    p = CACHE / f"{LAYER}_{z}_{row}_{col}.jpg"
    if p.exists() and p.stat().st_size > 1000:
        return p
    url = f"{BASE}/{z}/{row}/{col}.jpeg"
    req = urllib.request.Request(url, headers={"User-Agent": "you-doc-engine/0.1 (basemap builder)"})
    d = urllib.request.urlopen(req, timeout=60).read()
    p.write_bytes(d)
    return p

def build(rid, bbox, z, anchor=None):
    minLng, minLat, maxLng, maxLat = bbox
    z = min(z, MAXZ)
    x0, y1 = tile_xy(minLat, minLng, z)   # bottom-left
    x1, y0 = tile_xy(maxLat, maxLng, z)   # top-right
    cols = x1 - x0 + 1
    rows = y1 - y0 + 1
    n = cols * rows
    print(f"  {rid}: z{z} {cols}x{rows} = {n} tiles", flush=True)
    canvas = Image.new("RGB", (cols * 256, rows * 256))
    for r in range(rows):
        for c in range(cols):
            try:
                t = Image.open(fetch(z, y0 + r, x0 + c)).convert("RGB")
                canvas.paste(t, (c * 256, r * 256))
            except Exception as e:
                print("   tile fail", z, y0 + r, x0 + c, e, flush=True)
    # crop exactly to bbox in mercator pixel space
    def px(lat, lng):
        n2 = 2 ** z
        fx = (lng + 180.0) / 360.0 * n2 * 256
        rr = math.radians(lat)
        fy = (1.0 - math.log(math.tan(rr) + 1.0 / math.cos(rr)) / math.pi) / 2.0 * n2 * 256
        return fx - x0 * 256, fy - y0 * 256
    left, top = px(maxLat, minLng)
    right, bottom = px(minLat, maxLng)
    crop = (int(left), int(top), int(right), int(bottom))
    canvas = canvas.crop(crop)
    # force 16:9 so the engine maps geo -> pixels 1:1 (no objectFit surprises),
    # and RECORD the effective bbox after the trim: the engine must project with
    # the cropped bbox, not the requested one, or markers drift off the strait.
    w, h = canvas.size
    dx = dy = 0
    if int(round(w * 9 / 16)) <= h:
        target_h = int(round(w * 9 / 16))
        dy = (h - target_h) // 2
        if anchor is not None:
            # keep the subject inside the trim: no blind centring
            ax, ay = px(anchor[1], anchor[0])
            ax -= x0 * 256
            ay -= y0 * 256
            dy = int(round(ay - 0.46 * target_h))
            dy = max(0, min(h - target_h, dy))
        canvas = canvas.crop((0, dy, w, dy + target_h))
    else:
        target_w = int(round(h * 16 / 9))
        dx = (w - target_w) // 2
        if anchor is not None:
            ax, ay = px(anchor[1], anchor[0])
            ax -= x0 * 256
            dx = int(round(ax - 0.55 * target_w))
            dx = max(0, min(w - target_w, dx))
        canvas = canvas.crop((dx, 0, dx + target_w, h))
    canvas = canvas.resize((1920, 1080), Image.LANCZOS)

    # absolute mercator pixel rect -> lng/lat
    def inv_px(ax, ay):
        lng = (ax / (256.0 * (2 ** z))) * 360.0 - 180.0
        n = math.pi - 2.0 * math.pi * ay / (256.0 * (2 ** z))
        lat = math.degrees(math.atan(math.sinh(n)))
        return lng, lat
    ax0 = x0 * 256 + left + dx
    ay0 = y0 * 256 + top + dy
    ax1 = ax0 + canvas.size[0] * ( (x1 - x0 + 1) * 256 / canvas.size[0] ) if False else x0 * 256 + right - dx
    ay1 = y0 * 256 + bottom - dy
    lngA, latA = inv_px(ax0, ay0)
    lngB, latB = inv_px(ax1, ay1)
    EFF[rid] = [round(lngA, 4), round(latB, 4), round(lngB, 4), round(latA, 4)]
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{rid}.jpg"
    canvas.save(path, quality=88, optimize=True)
    print(f"  {rid}: {canvas.size[0]}x{canvas.size[1]} -> {path.name} "
          f"({path.stat().st_size/1024:.0f} KB)", flush=True)
    return canvas.size

EFF = {}

if __name__ == "__main__":
    print(f"NASA GIBS basemap builder -- layer {LAYER} (max z{MAXZ})")
    only = sys.argv[1:] or list(REGIONS)
    for rid in only:
        r = REGIONS[rid]
        build(rid, r[:4], r[4], r[5] if len(r) > 5 else None)
    # merge with any previous manifest so partial runs do not lose entries
    man = ROOT / "src" / "data" / "basemap.json"
    prev = {}
    if man.exists():
        import json as _j
        prev = _j.loads(man.read_text())
    prev.update(EFF)
    import json as _j
    man.parent.mkdir(parents=True, exist_ok=True)
    man.write_text(_j.dumps(prev, indent=2, sort_keys=True) + "\n")
    print("manifest ->", man)
    print("done")
