#!/usr/bin/env python3
"""
SHOT LINT -- enforces the user's visual rules mechanically, not by taste.
1. no shot may exceed 3000 ms
2. no two shots may share a fingerprint (anti-repetition)
3. only one hero shot in the film
Exit code 1 = build fails.
"""
import json, re, sys, pathlib

MAX_MS = 3000
ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = (ROOT / "src" / "lib" / "shots.ts").read_text()

rows = re.findall(
    r"\{id:\s*'([^']+)'.*?place:\s*'([^']+)'.*?zoom:\s*(\d+).*?layers:\s*\[([^\]]*)\].*?motion:\s*'([^']+)'.*?durMs:\s*(\d+)(.*?)\}",
    SRC, re.S,
)

shots = []
for sid, place, zoom, layers, motion, dur, tail in rows:
    layers_l = sorted(x.strip().strip("'") for x in layers.split(",") if x.strip())
    shots.append({
        "id": sid, "place": place, "zoom": int(zoom),
        "layers": layers_l, "motion": motion, "durMs": int(dur),
        "hero": "hero: true" in tail,
        "fp": f"{place}|z{zoom}|{'+'.join(layers_l)}|{motion}",
    })

errs = []
if not shots:
    errs.append("could not parse any shot from src/lib/shots.ts")

for s in shots:
    if s["durMs"] > MAX_MS:
        errs.append(f"[3s RULE] {s['id']} = {s['durMs']}ms > {MAX_MS}ms")

seen = {}
for s in shots:
    if s["fp"] in seen:
        errs.append(f"[REPEAT] {s['id']} duplicates fingerprint of {seen[s['fp']]} :: {s['fp']}")
    seen.setdefault(s["fp"], s["id"])

heroes = [s["id"] for s in shots if s["hero"]]
if len(heroes) > 1:
    errs.append(f"[HERO] more than one hero shot: {heroes}")

total = sum(s["durMs"] for s in shots)
print(f"shots parsed: {len(shots)}  total: {total/1000:.1f}s  max shot: {max(s['durMs'] for s in shots)}ms")
print(f"unique fingerprints: {len(seen)}/{len(shots)}")

if errs:
    print("\nFAIL")
    for e in errs:
        print(" -", e)
    sys.exit(1)
print("\nPASS: 3s budget + no repeated shot + single hero")
