#!/usr/bin/env python3
"""
PLATE BASEMAP BUILDER (vertical film, 1080x1920).

Difference from fetch_basemap.py: NO 16:9 forcing. Each plate is cropped to the
EXACT Web-Mercator rectangle of its bbox, then resized to a target pixel width
with the height derived from the mercator span. Consequence:
    plate pixel (u,v) <-> mercator (x,y) is a pure linear map,
so the engine (src/lib/plate.ts) can place the image in plate coordinates with
zero drift -- borders and satellite imagery align by construction, at any zoom.

Source: NASA GIBS BlueMarble_ShadedRelief_Bathymetry (public domain).
Tiles are cached in ~/.cache/gibs (fetch once, never scraped at render time).

Usage: python3 scripts/fetch_plate.py [id ...]
"""
import json
import math
import pathlib
import sys
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "basemap"
CACHE = pathlib.Path.home() / ".cache" / "gibs"
LAYER = "BlueMarble_ShadedRelief_Bathymetry"
LEVEL = "GoogleMapsCompatible_Level8"
MAXZ = 8
BASE = f"https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{LAYER}/default/{LEVEL}"

# id: (minLng, minLat, maxLng, maxLat, target_width_px)
PLATES = {
    # whole world, exact mercator; lat top 84 to keep the North intact
    "p_world":    (-180.0, -56.0, 180.0, 71.0, 4096),
    # continent bands (whole-frame vertical crops)
    "p_africa":   (-34.0, -39.0, 74.0, 40.0, 2800),
    "p_europe":   (-12.0, 36.0, 38.0, 59.5, 2600),
    "p_asia":     (30.0, 4.0, 126.0, 58.0, 2800),
    "p_samerica": (-84.0, -27.0, -30.0, 15.0, 1600),
    # close-ups for the story beats
    "p_casia":    (40.0, 27.0, 104.0, 57.0, 2800),
    "p_ethiopia": (22.0, -2.0, 60.0, 18.0, 2600),
    "p_bolivia":  (-78.0, -27.0, -50.0, -6.0, 2600),
    "p_alps":     (2.0, 42.0, 18.0, 54.0, 2400),
}


def merc(lat: float) -> float:
    """Web-Mercator y in radians (d3 mercator raw is identical)."""
    lat = max(-85.0, min(85.0, lat))
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


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
    req = urllib.request.Request(url, headers={"User-Agent": "you-doc-engine/0.2 (plate builder)"})
    p.write_bytes(urllib.request.urlopen(req, timeout=90).read())
    return p


def choose_z(bbox, width_px):
    minLng, minLat, maxLng, maxLat = bbox
    px_per_deg = width_px / max(0.001, (maxLng - minLng))
    z = math.ceil(math.log2(px_per_deg * 360.0 / 256.0)) + 1   # +1 = crisp headroom
    return max(3, min(MAXZ, z))


def build(rid, bbox, width):
    minLng, minLat, maxLng, maxLat = bbox
    z = choose_z(bbox, width)
    n2 = 2 ** z
    world_px = 256.0 * n2

    def abs_px(lat, lng):
        x = (lng + 180.0) / 360.0 * world_px
        y = (1.0 - merc(lat) / math.pi) / 2.0 * world_px
        return x, y

    ax0, ay0 = abs_px(maxLat, minLng)
    ax1, ay1 = abs_px(minLat, maxLng)
    x0, y0 = int(ax0 // 256), int(ay0 // 256)
    x1, y1 = int(ax1 // 256), int(ay1 // 256)
    cols, rows = x1 - x0 + 1, y1 - y0 + 1
    print(f"  {rid}: z{z} bbox={bbox} tiles {cols}x{rows} = {cols*rows}", flush=True)
    canvas = Image.new("RGB", (cols * 256, rows * 256))
    for r in range(rows):
        for c in range(cols):
            try:
                canvas.paste(Image.open(fetch(z, y0 + r, x0 + c)).convert("RGB"), (c * 256, r * 256))
            except Exception as e:  # keep going, report clearly
                print(f"   tile fail z{z} {y0+r}/{x0+c}: {e}", flush=True)
    crop = (int(round(ax0 - x0 * 256)), int(round(ay0 - y0 * 256)),
            int(round(ax1 - x0 * 256)), int(round(ay1 - y0 * 256)))
    canvas = canvas.crop(crop)
    h = max(2, int(round(width * canvas.size[1] / canvas.size[0])))
    canvas = canvas.resize((width, h), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{rid}.jpg"
    canvas.save(path, quality=86, optimize=True, progressive=True)
    print(f"  {rid}: {canvas.size[0]}x{canvas.size[1]}  {path.stat().st_size/1024:.0f} KB", flush=True)
    return [list(bbox), [canvas.size[0], canvas.size[1]]]


if __name__ == "__main__":
    print(f"PLATE builder -- {LAYER} (public domain), max z{MAXZ}")
    man_path = ROOT / "src" / "data" / "plates.json"
    man = json.loads(man_path.read_text()) if man_path.exists() else {}
    only = sys.argv[1:] or list(PLATES)
    for rid in only:
        bbox, w = PLATES[rid][0:4], PLATES[rid][4]
        man[rid] = build(rid, bbox, w)
    man_path.parent.mkdir(parents=True, exist_ok=True)
    man_path.write_text(json.dumps(man, indent=2, sort_keys=True) + "\n")
    print("manifest ->", man_path)
    print("done")
