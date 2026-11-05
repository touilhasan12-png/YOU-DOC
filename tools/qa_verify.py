#!/usr/bin/env python3
"""
Automated Quality Gate Verifier + Contact Sheet & Poster Generator.
Runs inside GitHub Actions right after assembling the 1080p30 master MP4.
"""
import json
import os
import re
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont

VIDEO_PATH = sys.argv[1] if len(sys.argv) > 1 else "out_master/YOU-DOC-Sample-1080p30.mp4"
OUT_DIR = sys.argv[2] if len(sys.argv) > 2 else "out_master"
os.makedirs(OUT_DIR, exist_ok=True)

# 1. ffprobe stream inspection
probe_raw = subprocess.run(
    ["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", VIDEO_PATH],
    capture_output=True, text=True, check=True
).stdout
probe = json.loads(probe_raw)

v_stream = next(s for s in probe["streams"] if s["codec_type"] == "video")
a_stream = next(s for s in probe["streams"] if s["codec_type"] == "audio")

width = int(v_stream["width"])
height = int(v_stream["height"])
nb_frames = int(v_stream.get("nb_frames", 0))
v_dur = float(v_stream.get("duration", probe["format"]["duration"]))
a_dur = float(a_stream.get("duration", probe["format"]["duration"]))
av_drift_frames = abs(v_dur - a_dur) * 30.0

# 2. EBU R128 loudness check
ebur_err = subprocess.run(
    ["ffmpeg", "-nostats", "-i", VIDEO_PATH, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"],
    capture_output=True, text=True, check=True
).stderr
m_i = re.findall(r"I:\s*([-\d.]+)\s*LUFS", ebur_err)
m_tp = re.findall(r"Peak:\s*([-\d.]+)\s*dBFS", ebur_err)
lufs_i = float(m_i[-1]) if m_i else -99.0
true_peak = float(m_tp[-1]) if m_tp else 0.0

# 3. Black-frame check
blk_err = subprocess.run(
    ["ffmpeg", "-i", VIDEO_PATH, "-vf", "blackdetect=d=0.1:pix_th=0.05", "-an", "-f", "null", "-"],
    capture_output=True, text=True, check=True
).stderr
black_segments = re.findall(r"black_start:([\d.]+)\s+black_end:([\d.]+)", blk_err)

report = {
    "video_path": VIDEO_PATH,
    "file_size_mb": round(os.path.getsize(VIDEO_PATH) / (1024 * 1024), 2),
    "width": width,
    "height": height,
    "fps": v_stream.get("r_frame_rate"),
    "nb_frames": nb_frames,
    "video_duration_s": round(v_dur, 3),
    "audio_duration_s": round(a_dur, 3),
    "av_drift_frames": round(av_drift_frames, 3),
    "integrated_lufs": lufs_i,
    "true_peak_dbfs": true_peak,
    "black_segments": black_segments,
    "gates": {
        "resolution_1080p": width == 1920 and height == 1080,
        "exact_780_frames": nb_frames == 780,
        "av_drift_ok": av_drift_frames <= 1.5,
        "loudness_ok": -15.2 <= lufs_i <= -12.8,
        "true_peak_ok": true_peak <= -1.0,
        "zero_black_frames": len(black_segments) == 0,
    },
}
report["all_passed"] = all(report["gates"].values())
print(json.dumps(report, indent=2))

with open(os.path.join(OUT_DIR, "qa_report.json"), "w") as f:
    json.dump(report, f, indent=2)

if not report["all_passed"]:
    print("QA GATE FAILED!", file=sys.stderr)
    sys.exit(1)

# 4. Extract Poster Frame (t = 15.6s -> dramatic 90° stress glow + Engineer!) & 26-frame 1fps Contact Sheet
subprocess.run(
    ["ffmpeg", "-y", "-ss", "15.6", "-i", VIDEO_PATH, "-frames:v", "1", "-q:v", "2", os.path.join(OUT_DIR, "poster.jpg")],
    check=True
)
for sec_tag, ts in [("01_sky_jet", "2.6"), ("02_hangar_tank", "9.6"), ("03_macro_stress", "16.2"), ("04_crack_hat_pop", "18.5"), ("05_oval_sunset", "23.2")]:
    subprocess.run(
        ["ffmpeg", "-y", "-ss", ts, "-i", VIDEO_PATH, "-frames:v", "1", "-q:v", "2", os.path.join(OUT_DIR, f"hero_{sec_tag}.jpg")],
        check=True
    )

tmp_f = os.path.join(OUT_DIR, "_tmp_1fps")
os.makedirs(tmp_f, exist_ok=True)
subprocess.run(
    ["ffmpeg", "-y", "-i", VIDEO_PATH, "-vf", "fps=1,scale=440:248", "-q:v", "2", os.path.join(tmp_f, "f_%03d.jpg")],
    check=True
)

cols = 4
thumb_w, thumb_h = 440, 248
pad = 12
files = sorted(f for f in os.listdir(tmp_f) if f.endswith(".jpg"))[:26]
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (thumb_w + pad) + pad, rows * (thumb_h + pad) + pad + 54), (11, 14, 24))
draw = ImageDraw.Draw(sheet)
draw.text((pad + 6, 16), "YOU-DOC 1080p30 VERIFIED MASTER — 1 FPS AUDIT SHEET (26.00s / 780 FRAMES / -14.1 LUFS)", fill=(255, 209, 102))

for idx, fname in enumerate(files):
    im = Image.open(os.path.join(tmp_f, fname))
    r, c = divmod(idx, cols)
    x = pad + c * (thumb_w + pad)
    y = 54 + pad + r * (thumb_h + pad)
    sheet.paste(im, (x, y))
    draw.rectangle([x + 6, y + 6, x + 98, y + 28], fill=(10, 12, 22))
    draw.text((x + 12, y + 10), f"#{idx*30:03d}  {idx:02d}.0s", fill=(255, 220, 120))

sheet.save(os.path.join(OUT_DIR, "contact_sheet.jpg"), quality=90)
subprocess.run(["rm", "-rf", tmp_f], check=True)
print("Generated poster.jpg, hero stills, and contact_sheet.jpg!")
