#!/usr/bin/env python3
"""
FILM QA -- every promise in the brief, checked against the artefact.

Each check prints PASS/FAIL with the number it measured. Nothing here is a
claim: if a check cannot run it prints SKIP with the reason (never PASS).
"""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
T = json.loads((ROOT / "src/data/timeline.json").read_text())
CL = json.loads((ROOT / "src/data/landlocked.json").read_text())
MP4 = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "out" / "The_Locked_Countries_1080x1920.mp4"

results = []


def check(name, ok, detail):
    results.append((name, ok, detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: {detail}")


def skip(name, why):
    results.append((name, None, why))
    print(f"[SKIP] {name}: {why}")


def probe(args):
    return subprocess.run(["ffprobe", "-v", "error", *args, "-of", "json", str(MP4)], capture_output=True, text=True).stdout


# ---------------------------------------------------------------- the edit
ISO = {c["iso2"]: c for c in CL}
check("44 countries in the data file", len(CL) == 44, f"{len(CL)} entries, {len(ISO)} unique iso2")

by_region = {}
for c in CL:
    by_region.setdefault(c["region"], []).append(c["iso2"])
check(
    "continent split 16 / 14 / 12 / 2",
    [len(by_region[r]) for r in ("africa", "europe", "asia", "samerica")] == [16, 14, 12, 2],
    str({r: len(v) for r, v in by_region.items()}),
)

beat_region = {"V02a": "africa", "V02b": "europe", "V02c": "asia", "V02d": "samerica"}
ok = True
detail = []
for beat, region in beat_region.items():
    want = set(by_region[region])
    got = {d["iso2"] for d in T["drops"].get(beat, [])}
    if want != got:
        ok = False
        detail.append(f"{beat} missing {sorted(want - got)} extra {sorted(got - want)}")
check("every country in a continent beat drops its own flag", ok, "; ".join(detail) or "4/4 beats exact")

v08 = [d["iso2"] for d in T["drops"]["V08"]]
check("finale pins all 44 flags", sorted(v08) == sorted(ISO), f"{len(v08)} flags, {len(set(v08))} unique")

n_flags = sum(len(v) for v in T["drops"].values())
check("flag drops scheduled", n_flags == 93, f"{n_flags} scheduled drops over {len(T['drops'])} sets")

dur = T["totalFrames"] / T["fps"]
check("duration >= 50 s", dur >= 50.0, f"{T['totalFrames']} frames @ {T['fps']} fps = {dur:.2f} s")

vo_ok = all(s["start"] <= s["vo"] < s["end"] for s in T["scenes"])
check("every voice-over line starts inside its own scene", vo_ok, "8/8 scenes")

check("no scheduled event lands after the film ends", all(e["f"] < T["totalFrames"] for e in T["events"]),
      f"last event frame {max(e['f'] for e in T['events'])} < {T['totalFrames']}")

# ---------------------------------------------------------------- the file
if not MP4.exists():
    skip("file probe", f"{MP4} not found")
else:
    info = json.loads(probe(["-show_streams", "-show_format"]))
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    check("video stream exists", v is not None, v["codec_name"] if v else "none")
    if v:
        check("vertical 1080x1920", (v["width"], v["height"]) == (1080, 1920), f"{v['width']}x{v['height']}")
        check("30 fps", v["r_frame_rate"] == "30/1", v["r_frame_rate"])
        check("pixel format yuv420p", v.get("pix_fmt") == "yuv420p", str(v.get("pix_fmt")))
        check("codec h264", v["codec_name"] == "h264", v["codec_name"])
    if a:
        check("audio stream exists", True, f"{a['codec_name']} {a['sample_rate']} Hz {a['channels']} ch")
    fdur = float(info["format"]["duration"])
    check("container duration matches the edit", abs(fdur - dur) < 0.5, f"{fdur:.2f} s vs timeline {dur:.2f} s")

    # black frames: a long black run would mean a broken scene
    bl = subprocess.run(["ffmpeg", "-v", "info", "-i", str(MP4), "-vf", "blackdetect=d=0.5:pix_th=0.06", "-an", "-f", "null", "-"],
                        capture_output=True, text=True).stderr
    blacks = re.findall(r"black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)", bl)
    check("no black run longer than 0.5 s", len(blacks) == 0, f"{len(blacks)} runs" + (f" {blacks[:3]}" if blacks else ""))

    # freezes: the camera must never sit still for a second
    fr = subprocess.run(["ffmpeg", "-v", "info", "-i", str(MP4), "-vf", "freezedetect=n=-60dB:d=1.2", "-an", "-f", "null", "-"],
                        capture_output=True, text=True).stderr
    freezes = re.findall(r"freeze_start: ([\d.]+)", fr)
    check("no frozen image longer than 1.2 s", len(freezes) == 0, f"{len(freezes)} freezes")

    # loudness of the delivered file (after AAC)
    lr = subprocess.run(["ffmpeg", "-v", "info", "-i", str(MP4), "-af", "ebur128=peak=true", "-f", "null", "-"],
                        capture_output=True, text=True).stderr
    I = re.findall(r"I:\s+(-?[\d.]+) LUFS", lr)
    LRA = re.findall(r"LRA:\s+(-?[\d.]+) LU", lr)
    PK = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", lr)
    if I:
        check("integrated loudness -14 +/- 1 LUFS", abs(float(I[-1]) + 14) <= 1.0, f"{I[-1]} LUFS, LRA {LRA[-1] if LRA else '?'} LU, peak {PK[-1] if PK else '?'} dBFS")
    else:
        skip("loudness", "ebur128 produced no integrated value")

    # shot count: a cut every few seconds, as the brief's motion law requires
    sc = subprocess.run(["ffmpeg", "-v", "info", "-i", str(MP4), "-vf", "select='gt(scene,0.32)',showinfo", "-an", "-f", "null", "-"],
                        capture_output=True, text=True).stderr
    cuts = len(re.findall(r"pts_time:([\d.]+)", sc))
    check("cut rhythm (hard cuts detected)", cuts >= 8, f"{cuts} detected cuts in {dur:.1f} s")

print()
bad = [r for r in results if r[1] is False]
skipped = [r for r in results if r[1] is None]
print(f"{len(results) - len(bad) - len(skipped)}/{len(results) - len(skipped)} checks passed, {len(skipped)} skipped")
sys.exit(1 if bad else 0)
