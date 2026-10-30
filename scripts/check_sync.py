#!/usr/bin/env python3
"""
SYNC GUARD -- prevents audio drift and fake captions.
- If captions.json exists: asserts monotonic, non-overlapping cues, and that
  the last cue ends inside the composition length.
- If narration.wav exists: asserts the composition is long enough to hold it
  (frame count = ceil(duration_ms/1000*fps)), which kills drift by construction.
"""
import json, sys, pathlib, wave, math
ROOT = pathlib.Path(__file__).resolve().parents[1]
FPS = 30
MASTER = (ROOT / "src" / "Master.tsx").read_text()
m = __import__("re").search(r"MASTER_FRAMES\s*=\s*([0-9.*+()FPS\s]+);", MASTER)
frames = None
if m:
    expr = m.group(1).replace("FPS", str(FPS))
    frames = eval(expr)  # noqa: S307 - build-time constant
wav = ROOT / "public" / "audio" / "narration.wav"
cap = ROOT / "src" / "data" / "captions.json"

errs = []
if wav.exists():
    with wave.open(str(wav)) as w:
        dur = w.getnframes() / w.getframerate()
    need = math.ceil(dur * FPS)
    print(f"narration: {dur:.2f}s -> needs {need} frames; master has {int(frames or 0)}")
    if frames and need > frames:
        errs.append(f"[DRIFT] master too short: {int(frames)} < {need}")

if cap.exists():
    cues = json.loads(cap.read_text())
    prev = -1
    for i, c in enumerate(cues):
        if c["startMs"] < prev:
            errs.append(f"[SYNC] cue {i} overlaps previous")
        if c["endMs"] <= c["startMs"]:
            errs.append(f"[SYNC] cue {i} has non-positive duration")
        if frames and c["endMs"] > (frames / FPS) * 1000 + 1:
            errs.append(f"[SYNC] cue {i} ends past composition end")
        prev = c["endMs"]
    print(f"captions: {len(cues)} cues ok-checked")
else:
    print("captions: not generated yet (audio stage pending) -- skipping")

if errs:
    print("FAIL"); [print(" -", e) for e in errs]; sys.exit(1)
print("PASS: sync guards clear")
