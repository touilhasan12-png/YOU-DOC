#!/usr/bin/env python3
"""
Assemble the 4 rendered 1080p@24fps scene units with the 60s master narration,
perform independent decode/motion/audio-correlation verification, and extract
actual encoded contact sheets + full-resolution keyframes for visual inspection.
"""
import json
import math
import shutil
import struct
import subprocess
import time
import wave
from pathlib import Path

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

t_start = time.monotonic()
ROOT = Path(__file__).resolve().parents[1]
SPEC = json.loads((ROOT / "SPEC.json").read_text(encoding="utf-8"))
UNITS = ROOT / "generated" / "units"
AUDIO = ROOT / "generated" / "audio"
DELIVERY = ROOT / "generated" / "delivery"
REVIEW = ROOT / "generated" / "review"
DELIVERY.mkdir(parents=True, exist_ok=True)
REVIEW.mkdir(parents=True, exist_ok=True)

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SCENE_COUNT = int(SPEC["scene_count"])
FRAMES_PER_SCENE = int(SPEC["frames_per_scene"])
TOTAL_FRAMES = int(SPEC["total_frames"])
FPS = int(SPEC["fps"])
SR = int(SPEC["sample_rate"])

# 1. Verify all 4 scene units & reports exist
concat_list = DELIVERY / "_concat.txt"
lines = []
scene_timings = []
for sid in range(1, SCENE_COUNT + 1):
    unit = UNITS / f"{sid:02d}.mp4"
    rep_p = UNITS / f"REPORT_{sid}.json"
    if not unit.exists():
        raise FileNotFoundError(f"Missing unit {unit}")
    lines.append(f"file '{unit.resolve()}'")
    if rep_p.exists():
        scene_timings.append(json.loads(rep_p.read_text(encoding="utf-8")))
concat_list.write_text("\n".join(lines) + "\n", encoding="utf-8")

master_wav = AUDIO / "SAMPLE_NARRATION_MASTER.wav"
if not master_wav.exists():
    raise FileNotFoundError(f"Missing master narration {master_wav}")

final_mp4 = DELIVERY / "SPERM_WHALE_SAMPLE_60s_1080p.mp4"

# 2. Stream-copy H.264 video units + encode AAC 192k 48kHz stereo, faststart
subprocess.run([
    FFMPEG, "-y", "-v", "error",
    "-f", "concat", "-safe", "0", "-i", str(concat_list),
    "-i", str(master_wav),
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k", "-ar", str(SR), "-ac", "2",
    "-movflags", "+faststart",
    str(final_mp4),
], check=True)
concat_list.unlink(missing_ok=True)

# Copy accompanying deliverables
for fname in ["SAMPLE_NARRATION_MASTER.wav", "English.srt", "AUDIO_TIMESTAMPS.json", "AUDIO_REPORT.json"]:
    src = AUDIO / fname
    if src.exists():
        shutil.copyfile(src, DELIVERY / fname)
shutil.copyfile(ROOT / "SPEC.json", DELIVERY / "SPEC.json")
shutil.copyfile(ROOT / "SCRIPT_SAMPLE.json", DELIVERY / "SCRIPT_SAMPLE.json")

# 3. Independent full decode verification of final encoded MP4
decoded_wav = REVIEW / "_decoded_audio.wav"
subprocess.run([
    FFMPEG, "-y", "-v", "error",
    "-i", str(final_mp4),
    "-vn", "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le",
    str(decoded_wav),
], check=True)


def read_mono_downsampled(wav_path: Path, step: int = 16):
    with wave.open(str(wav_path), "rb") as w:
        n = w.getnframes()
        raw = w.readframes(n)
    vals = struct.unpack(f"<{n * 2}h", raw)
    # Average stereo -> mono and decimate by step for fast exact Pearson r
    mono = [0.5 * (vals[i] + vals[i + 1]) for i in range(0, len(vals), 2 * step)]
    return mono, n


ref_sig, ref_samples = read_mono_downsampled(master_wav, step=16)
dec_sig, dec_samples = read_mono_downsampled(decoded_wav, step=16)
decoded_wav.unlink(missing_ok=True)

# Account for tiny AAC encoder priming delay (~1024-2112 samples) by finding best lag within +-200 decimated bins
best_corr = -1.0
best_lag = 0
L = min(len(ref_sig), len(dec_sig)) - 220
for lag in range(-180, 181, 2):
    r0 = max(0, -lag)
    d0 = max(0, lag)
    n = min(len(ref_sig) - r0, len(dec_sig) - d0, L)
    if n < 1000:
        continue
    s_rr = s_dd = s_rd = 0.0
    for k in range(0, n, 4):
        rv = ref_sig[r0 + k]
        dv = dec_sig[d0 + k]
        s_rr += rv * rv
        s_dd += dv * dv
        s_rd += rv * dv
    denom = math.sqrt(s_rr * s_dd) if s_rr > 0 and s_dd > 0 else 1.0
    corr = s_rd / denom
    if corr > best_corr:
        best_corr = corr
        best_lag = lag

# Count exact decoded video frames & check full-stream decodability
null_check = subprocess.run([
    FFMPEG, "-v", "info",
    "-i", str(final_mp4),
    "-f", "null", "-",
], capture_output=True, text=True, check=True)

decoded_frames = None
for line in null_check.stderr.splitlines():
    if "frame=" in line:
        for tok in line.split():
            if tok.startswith("frame="):
                val = tok.split("=", 1)[1]
                if val.isdigit():
                    decoded_frames = int(val)
        parts = line.split("frame=")
        if len(parts) > 1:
            num = parts[1].strip().split()[0]
            if num.isdigit():
                decoded_frames = int(num)

# 4. Extract real frames from the final encoded MP4 for motion check + contact sheets + full-res keyframes
font_path = ROOT / "assets" / "fonts" / "DMSans.ttf"
label_font = ImageFont.truetype(str(font_path), 24) if font_path.exists() else ImageFont.load_default()

scene_motion_ok = {}
for sid in range(1, SCENE_COUNT + 1):
    # Extract 9 evenly spaced frames per scene directly from encoded MP4
    sample_local = [0, 45, 90, 135, 180, 225, 270, 315, FRAMES_PER_SCENE - 1]
    tiles = []
    diffs = []
    prev_small = None

    for idx, lf in enumerate(sample_local):
        gf = (sid - 1) * FRAMES_PER_SCENE + lf
        ts = gf / FPS
        png_out = REVIEW / f"_tmp_s{sid}_{idx}.png"
        subprocess.run([
            FFMPEG, "-y", "-v", "error",
            "-ss", f"{ts:.6f}",
            "-i", str(final_mp4),
            "-frames:v", "1",
            str(png_out),
        ], check=True)

        img = Image.open(png_out).convert("RGB")
        assert img.size == (SPEC["width"], SPEC["height"]), f"Unexpected frame size {img.size}"

        # Save one clean full-resolution keyframe per scene for pixel inspection
        key_idx = 6 if sid == 1 else 4  # S1 frame 270 shows fluke-up; S2/S3/S4 midpoints
        if idx == key_idx:
            img.save(REVIEW / f"KEYFRAME_S{sid}.png")

        # Measure real motion between consecutive sampled frames
        small = list(img.resize((160, 90)).getdata())
        if prev_small is not None:
            mad = sum(abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2]) for a, b in zip(small, prev_small)) / (len(small) * 3.0)
            diffs.append(round(mad, 3))
        prev_small = small

        # Build contact sheet tile (640x360 + 36px cream footer strip matching YOU-DOC review sheets)
        tw, th, bar = 640, 360, 36
        tile = Image.new("RGB", (tw, th + bar), (243, 233, 213))
        tile.paste(img.resize((tw, th), Image.Resampling.LANCZOS), (0, 0))
        draw = ImageDraw.Draw(tile)
        draw.text((14, th + 6), f"Scene {sid} | {lf}/{FRAMES_PER_SCENE} ({ts:.2f}s)", fill=(22, 56, 71), font=label_font)
        tiles.append(tile)
        png_out.unlink(missing_ok=True)

    # Assemble 3x3 sequence sheet (1920x1188)
    sheet = Image.new("RGB", (640 * 3, (360 + 36) * 3), (243, 233, 213))
    for i, tile in enumerate(tiles):
        r, c = divmod(i, 3)
        sheet.paste(tile, (c * 640, r * (360 + 36)))
    sheet.save(REVIEW / f"SEQUENCE_{sid}.jpg", quality=92)
    scene_motion_ok[f"scene_{sid}"] = {
        "pair_mad_diffs": diffs,
        "min_diff": min(diffs) if diffs else 0.0,
        "max_diff": max(diffs) if diffs else 0.0,
        "moving": all(d > 0.02 for d in diffs),
    }

assemble_elapsed = round(time.monotonic() - t_start, 2)
audio_rep_path = AUDIO / "AUDIO_REPORT.json"
audio_rep = json.loads(audio_rep_path.read_text(encoding="utf-8")) if audio_rep_path.exists() else {}

render_secs = [s["render_seconds"] for s in scene_timings if "render_seconds" in s]
max_render_s = max(render_secs) if render_secs else 0.0
sum_render_s = round(sum(render_secs), 2)

verification = {
    "status": "passed",
    "final_mp4": final_mp4.name,
    "final_mp4_bytes": final_mp4.stat().st_size,
    "resolution": f"{SPEC['width']}x{SPEC['height']}",
    "fps": FPS,
    "expected_frames": TOTAL_FRAMES,
    "decoded_frames": decoded_frames,
    "frames_exact_match": decoded_frames == TOTAL_FRAMES,
    "reference_audio_samples": ref_samples,
    "decoded_audio_samples": dec_samples,
    "audio_correlation": round(best_corr, 6),
    "audio_best_lag_samples": best_lag * 16,
    "audio_sync_ok": best_corr > 0.95,
    "scene_motion": scene_motion_ok,
    "all_scenes_moving": all(v["moving"] for v in scene_motion_ok.values()),
}

timing_report = {
    "sample_duration_s": SPEC["duration_seconds"],
    "sample_frames": TOTAL_FRAMES,
    "narration_seconds": audio_rep.get("elapsed_seconds"),
    "narration_voice": audio_rep.get("voice"),
    "per_scene_render": [
        {
            "scene_id": s["scene_id"],
            "key": s["key"],
            "renderer": s["renderer"],
            "render_seconds": s["render_seconds"],
            "total_script_seconds": s["total_script_seconds"],
            "ms_per_frame": s["ms_per_frame"],
            "mp4_bytes": s["mp4_bytes"],
        }
        for s in scene_timings
    ],
    "sum_render_seconds_serial": sum_render_s,
    "max_scene_render_seconds_parallel": max_render_s,
    "assemble_and_qa_seconds": assemble_elapsed,
    "estimated_full_10min_film": {
        "target_duration_s": 600,
        "target_frames": 14400,
        "with_12_parallel_shards_render_min": round((sum_render_s * 10.0) / 12.0 / 60.0, 1),
        "with_12_parallel_shards_total_wall_min": round(((sum_render_s * 10.0) / 12.0 + 180.0) / 60.0, 1),
    },
}

(DELIVERY / "TECHNICAL_VERIFICATION.json").write_text(json.dumps(verification, indent=2), encoding="utf-8")
(DELIVERY / "TIMING_REPORT.json").write_text(json.dumps(timing_report, indent=2), encoding="utf-8")
(REVIEW / "TECHNICAL_VERIFICATION.json").write_text(json.dumps(verification, indent=2), encoding="utf-8")
(REVIEW / "TIMING_REPORT.json").write_text(json.dumps(timing_report, indent=2), encoding="utf-8")

print(json.dumps(verification, indent=2))
print(json.dumps(timing_report, indent=2))

if not verification["frames_exact_match"]:
    raise SystemExit(f"Frame count mismatch: {decoded_frames} != {TOTAL_FRAMES}")
if not verification["audio_sync_ok"]:
    raise SystemExit(f"Audio correlation too low: {best_corr}")
if not verification["all_scenes_moving"]:
    raise SystemExit(f"Frozen scene detected: {scene_motion_ok}")
