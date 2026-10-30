#!/usr/bin/env python3
"""
SHOT LINT -- enforces the visual rules mechanically.
1. no shot may exceed 3000 ms
2. no two shots may share a fingerprint (anti-repetition)
3. exactly one hero shot
4. every shot must carry a real camera move (z0 != z1) -- "no static cards"
5. pan speed must stay under the dizziness ceiling
"""
import re, sys, pathlib

MAX_MS = 3000
ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = (ROOT / "src" / "lib" / "shots.ts").read_text()

pat = re.compile(
    r"\{id:\s*'([^']+)'.*?scene:\s*'([^']+)'.*?region:\s*'([^']+)'.*?durMs:\s*(\d+)"
    r".*?cam:\s*\{z0:\s*([\d.]+),\s*z1:\s*([\d.]+),\s*f0:\s*\[([\d.]+),\s*([\d.]+)\],\s*f1:\s*\[([\d.]+),\s*([\d.]+)\]\}"
    r".*?layers:\s*\[([^\]]*)\]([^\n]*)",
    re.S,
)
shots = []
for m in pat.finditer(SRC):
    sid, scene, region, dur, z0, z1, f0x, f0y, f1x, f1y, layers, tail = m.groups()
    layers_l = sorted(x.strip().strip("'") for x in layers.split(",") if x.strip())
    shots.append(dict(id=sid, scene=scene, region=region, durMs=int(dur),
                      z0=float(z0), z1=float(z1),
                      f0=(float(f0x), float(f0y)), f1=(float(f1x), float(f1y)),
                      layers=layers_l, hero="hero: true" in tail,
                      fp=f"{region}|{z0}>{z1}|{f0x},{f0y}>{f1x},{f1y}|{'+'.join(layers_l)}"))

errs = []
if not shots:
    errs.append("could not parse any shot from src/lib/shots.ts")

for s in shots:
    if s["durMs"] > MAX_MS:
        errs.append(f"[3s RULE] {s['id']} = {s['durMs']}ms > {MAX_MS}ms")
    if abs(s["z0"] - s["z1"]) < 0.01:
        errs.append(f"[STATIC] {s['id']} has no camera move (z0={s['z0']} z1={s['z1']})")
    pan = (abs(s["f1"][0] - s["f0"][0]) + abs(s["f1"][1] - s["f0"][1])) * 100
    speed = pan / (s["durMs"] / 1000)
    if speed > 6.0:
        errs.append(f"[PAN SPEED] {s['id']} = {speed:.1f}%/s > 6.0%/s")

seen = {}
for s in shots:
    if s["fp"] in seen:
        errs.append(f"[REPEAT] {s['id']} duplicates {seen[s['fp']]}")
    seen.setdefault(s["fp"], s["id"])

heroes = [s["id"] for s in shots if s["hero"]]
if len(heroes) != 1:
    errs.append(f"[HERO] expected exactly 1 hero shot, got {heroes}")

print(f"shots: {len(shots)} | total: {sum(s['durMs'] for s in shots)/1000:.1f}s | "
      f"longest: {max(s['durMs'] for s in shots)}ms | unique: {len(seen)}")

if errs:
    print("\nFAIL")
    for e in errs:
        print(" -", e)
    sys.exit(1)
print("\nPASS: 3s cap + continuous camera on every shot + pan ceiling + no repeats + 1 hero")
