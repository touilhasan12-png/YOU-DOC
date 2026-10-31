#!/usr/bin/env python3
"""
TIMELINE BUILDER -- one source of truth for picture AND sound.

Reads the real durations of the rendered voice-over MP3s (ffprobe), then derives:
  * scene boundaries           (VO length + a fixed breath before the next cut)
  * the exact frame of every flag drop
  * sub-shot boundaries inside the four-continent sequence

Writes src/data/timeline.json. The Remotion scenes read it, and
scripts/build_audio.py reads the SAME file to place music/SFX events
sample-accurately -- so a flag tick can never drift from the flag.

Method notes (recorded so the numbers are auditable, not magic):
  * FPS = 30. Every boundary is an integer frame.
  * BREATH = 18 frames (0.6 s) of silence-ish tail after each VO line.
  * The four-continent line is split proportionally to the CHARACTER count of
    each phrase (speech duration tracks character count closely) minus a fixed
    0.35 s pause between phrases. This is an ESTIMATE of word timing, stated as
    such; it is not a forced alignment.
"""
import json
import math
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
VO = ROOT / "audio" / "vo"
FPS = 30
BREATH = 18          # frames after a VO line ends, before the next scene
LEAD_IN = 12         # frames of picture before the first word (0.4 s)
VO_OFFSET = 6        # every later line starts 6 frames inside its scene
TAIL = 45            # frames of end-card after the last word


def dur(p: pathlib.Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
        capture_output=True, text=True, check=True).stdout.strip()
    return float(out)


countries = json.loads((ROOT / "src" / "data" / "landlocked.json").read_text())
by_region = {}
for c in countries:
    by_region.setdefault(c["region"], []).append(c["iso2"])
assert len(countries) == 44
assert sum(len(v) for v in by_region.values()) == 44

lines = [VO / f"vo{i:02d}.mp3" for i in range(1, 9)]
durs = [dur(p) for p in lines]
assert all(d > 1.0 for d in durs), durs

# ---- scene boundaries -------------------------------------------------------
vo_start = []
scene_start = []
cur = 0
for i, d in enumerate(durs):
    if i == 0:
        vo_start.append(LEAD_IN)
        scene_start.append(0)
        cur = LEAD_IN + round(d * FPS)
    else:
        vo_start.append(cur + VO_OFFSET)
        scene_start.append(cur)
        cur = vo_start[-1] + round(d * FPS)
    cur += BREATH
total = scene_start[-1] + (vo_start[-1] + round(durs[-1] * FPS) - scene_start[-1]) + TAIL
scene_end = scene_start[1:] + [total]

IDS = ["V01", "V02", "V03", "V04", "V05", "V06", "V07", "V08"]
scenes = []
for i in range(8):
    scenes.append({"id": IDS[i], "start": scene_start[i], "end": scene_end[i],
                   "vo": vo_start[i], "frames": scene_end[i] - scene_start[i]})

# ---- the four-continent sequence inside V02 --------------------------------
# phrase -> character counts of the four clauses of VO 2
PHRASES = {"africa": 26, "europe": 17, "asia": 13, "samerica": 22}
PAUSE = round(0.35 * FPS)          # 10 frames of air between the four clauses
pad = 5
first = scene_start[1] + 4
avail = scene_end[1] - first - 3 * PAUSE
unit = (avail - 4 * pad * 2) / sum(PHRASES.values())
subs = []
f = first
for k, (rid, chars) in enumerate(PHRASES.items()):
    span = round(chars * unit) + pad * 2
    subs.append({"id": f"V02{chr(97 + k)}", "region": rid,
                 "start": f, "end": f + span})
    f += span + PAUSE
assert f <= scene_end[1] + 12, (f, scene_end[1])
# let the last sub-shot absorb the remaining frames
subs[-1]["end"] = scene_end[1]

# ---- flag drop schedule ----------------------------------------------------
def schedule(flags, start, span, intro=8, tail=6, stagger=None):
    """evenly spread `flags` drops across (span - intro - tail) frames"""
    n = len(flags)
    if n == 0:
        return []
    room = max(4, span - intro - tail)
    if stagger is None:
        stagger = room / n
    return [{"iso2": iso, "f": start + intro + round(i * stagger)} for i, iso in enumerate(flags)]

drops = {}
drops["V02a"] = schedule(by_region["africa"], subs[0]["start"], subs[0]["end"] - subs[0]["start"], intro=10, tail=10)
drops["V02b"] = schedule(by_region["europe"], subs[1]["start"], subs[1]["end"] - subs[1]["start"], intro=8, tail=10)
drops["V02c"] = schedule(by_region["asia"], subs[2]["start"], subs[2]["end"] - subs[2]["start"], intro=6, tail=8)
drops["V02d"] = schedule(by_region["samerica"], subs[3]["start"], subs[3]["end"] - subs[3]["start"], intro=14, stagger=22)

# V04: two doubly-landlocked states, named in that order by the VO
drops["V04"] = [{"iso2": "uz", "f": scenes[3]["vo"] + 16}, {"iso2": "li", "f": scenes[3]["vo"] + round(3.6 * FPS)}]
drops["V05"] = [{"iso2": "kz", "f": scenes[4]["vo"] + 8}]
drops["V06"] = [{"iso2": "et", "f": scenes[5]["vo"] + 8}]
drops["V07"] = [{"iso2": "bo", "f": scenes[6]["vo"] + 8}]
# V08: the whole set re-lands on the world map, fast wave, row by row (N->S)
south_to_north = sorted(countries, key=lambda c: -(c.get("lat") or 0))
drops["V08"] = schedule(by_region["samerica"] + by_region["africa"] + by_region["europe"] + by_region["asia"],
                        scenes[7]["start"] + 18, 96, intro=0, tail=0, stagger=None)

# ---- camera / plate plan is authored in TS; here we only record what sound
#      and picture must agree on.
events = []
for key, ds in drops.items():
    for d in ds:
        events.append({"kind": "flag", "set": key, "iso2": d["iso2"], "f": d["f"]})
for s in scenes:
    events.append({"kind": "cut", "scene": s["id"], "f": s["start"]})
for s in subs:
    events.append({"kind": "cut", "scene": s["id"], "f": s["start"]})

data = {
    "fps": FPS,
    "totalFrames": total,
    "durationSec": round(total / FPS, 3),
    "vo": [{"src": f"vo{i+1:02d}.mp3", "start": vo_start[i], "durSec": round(durs[i], 4)} for i in range(8)],
    "scenes": scenes,
    "subshots": subs,
    "drops": drops,
    "events": sorted(events, key=lambda e: e["f"]),
    "accounting": {"leadIn": LEAD_IN, "breath": BREATH, "voOffset": VO_OFFSET, "tail": TAIL,
                   "voTotalSec": round(sum(durs), 3)},
}
out = ROOT / "src" / "data" / "timeline.json"
out.write_text(json.dumps(data, indent=1) + "\n")

print(f"VO total          {sum(durs):.2f} s")
print(f"film              {total} frames = {total / FPS:.2f} s")
for s in scenes:
    print(f"  {s['id']} {s['start']:>5}-{s['end']:<5} ({s['frames']:>3}f {s['frames']/FPS:5.2f}s) vo@{s['vo']}")
for s in subs:
    print(f"  {s['id']} {s['start']:>5}-{s['end']:<5} ({s['end']-s['start']:>3}f) {s['region']}")
print("drops:", {k: len(v) for k, v in drops.items()}, "total", sum(len(v) for v in drops.values()))
print("->", out)
