#!/usr/bin/env python3
"""
Builds:
  1. /home/user/project/assets/audio/master_audio.wav  (48kHz stereo, -14.0 LUFS, 26.000s = 780 frames @ 30fps)
  2. /home/user/project/assets/audio/master_audio.mp3  (preview/web fallback)
  3. /home/user/project/src/data/timeline.json         (exact word & card timings + beat markers)
  4. /home/user/project/public/captions.srt            (standard SRT file)
"""
import json
import math
import os
import subprocess
import numpy as np
from scipy import signal
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SR = 48000
DURATION = 26.000  # Exact 780 frames at 30.000 fps
FPS = 30
TOTAL_FRAMES = int(round(DURATION * FPS))
VOICE_OFFSET = 0.250

os.makedirs("/home/user/project/assets/audio", exist_ok=True)
os.makedirs("/home/user/project/src/data", exist_ok=True)
os.makedirs("/home/user/project/public", exist_ok=True)

# 1. Load raw Whisper words and clean trailing silence hallucinations (index >= 58)
with open("/home/user/project/assets/audio/words_raw.json") as f:
    raw_data = json.load(f)

raw_words = raw_data["words"][:58]

# Merge split tokens like "35" + ",000" -> "35,000" and "90" + "degree" -> "90-degree"
merged_words = []
i = 0
while i < len(raw_words):
    w = raw_words[i]
    txt = w["word"]
    start = round(w["start"] + VOICE_OFFSET, 3)
    end = round(w["end"] + VOICE_OFFSET, 3)
    if txt == "35" and i + 1 < len(raw_words) and raw_words[i + 1]["word"].startswith(",000"):
        txt = "35,000"
        end = round(raw_words[i + 1]["end"] + VOICE_OFFSET, 3)
        i += 2
    elif txt == "90" and i + 1 < len(raw_words) and raw_words[i + 1]["word"] == "degree":
        txt = "90-degree"
        end = round(raw_words[i + 1]["end"] + VOICE_OFFSET, 3)
        i += 2
    else:
        # Add clean punctuation matching our script
        if txt == "huge":
            txt = "huge,"
        elif txt == "view":
            txt = "view,"
        elif txt == "ovals":
            txt = "ovals,"
        i += 1
    merged_words.append({"word": txt, "start": start, "end": end})

# Tag semantic accent colors for key engineering words
GOLD_WORDS = {"1952,", "first", "luxury", "35,000", "feet,"}
DANGER_WORDS = {"square", "sharp", "90-degree", "corner", "four", "times", "stress,", "snapping", "glass."}
SAFE_WORDS = {"Round", "smooth", "ovals,", "flows", "harmlessly", "around."}

for w in merged_words:
    tok = w["word"]
    if tok in DANGER_WORDS:
        w["accent"] = "danger"
    elif tok in SAFE_WORDS:
        w["accent"] = "safe"
    elif tok in GOLD_WORDS:
        w["accent"] = "gold"
    else:
        w["accent"] = "normal"

# Group into crisp 2-4 word caption cards without crossing sentence/pause boundaries
cards = []
current = []
for idx, w in enumerate(merged_words):
    current.append(w)
    next_gap = (merged_words[idx + 1]["start"] - w["end"]) if idx + 1 < len(merged_words) else 9.9
    ends_punct = w["word"].endswith((".", ",", "—"))
    if len(current) >= 4 or (len(current) >= 2 and ends_punct) or next_gap > 0.28 or idx == len(merged_words) - 1:
        pad = min(0.18, max(0.0, next_gap - 0.03))
        cards.append({
            "id": len(cards),
            "start": current[0]["start"],
            "end": round(current[-1]["end"] + pad, 3),
            "text": " ".join(x["word"] for x in current),
            "words": current,
        })
        current = []

print(f"Built {len(cards)} caption cards across {len(merged_words)} words.")
for c in cards:
    print(f"  Card {c['id']:02d}: {c['start']:6.3f} - {c['end']:6.3f} | {c['text']}")

# Write SRT
def fmt_srt_time(t: float) -> str:
    ms = int(round(t * 1000))
    h = ms // 3600000
    ms %= 3600000
    m = ms // 60000
    ms %= 60000
    s = ms // 1000
    ms %= 1000
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

srt_lines = []
for idx, c in enumerate(cards, 1):
    srt_lines.append(f"{idx}\n{fmt_srt_time(c['start'])} --> {fmt_srt_time(c['end'])}\n{c['text']}\n")
with open("/home/user/project/public/captions.srt", "w") as f:
    f.write("\n".join(srt_lines))

# Write timeline.json for Three.js deterministic engine
timeline = {
    "title": "Why Airplane Windows Are Never Square",
    "fps": FPS,
    "duration": DURATION,
    "totalFrames": TOTAL_FRAMES,
    "beats": [
        {"id": "sky_hook", "start": 0.0, "end": 5.65, "label": "1952 Jet Airliner — Square Windows"},
        {"id": "hangar_tank", "start": 5.65, "end": 11.75, "label": "Farnborough Water-Pressure Tank"},
        {"id": "macro_stress", "start": 11.75, "end": 19.95, "label": "90° Corner Stress Concentration & Crack"},
        {"id": "oval_payoff", "start": 19.95, "end": 26.00, "label": "Smooth Oval Flow & Sunset Payoff"},
    ],
    "events": {
        "cloudWipeStart": 5.32,
        "cloudWipePeak": 5.65,
        "cloudWipeEnd": 6.02,
        "caneTap1": 6.45,
        "caneTap2": 6.75,
        "leverPull": 8.65,
        "submergeStart": 8.80,
        "macroPushStart": 11.55,
        "stressRampStart": 13.50,
        "stressPeak": 17.00,
        "crackSnap": 17.88,
        "hatPop": 18.25,
        "ovalDissolveStart": 19.75,
        "ovalDissolveEnd": 20.15,
        "outroBadgeStart": 24.35,
    },
    "cards": cards,
}
with open("/home/user/project/src/data/timeline.json", "w") as f:
    json.dump(timeline, f, indent=2)

# -------------------------------------------------------------------------
# 2. Synthesize Broadcast Stereo Score + Diegetic SFX + Voiceover Mix
# -------------------------------------------------------------------------
N = int(round(DURATION * SR))
t = np.arange(N, dtype=np.float64) / SR
rng = np.random.default_rng(19520502)

# Load voiceover at 48kHz mono and place at VOICE_OFFSET
vo_raw = subprocess.run(
    [FFMPEG, "-i", "/home/user/project/assets/audio/voiceover.wav",
     "-af", "highpass=f=80,equalizer=f=3200:t=q:w=1.2:g=1.8",
     "-f", "f32le", "-acodec", "pcm_f32le", "-ac", "1", "-ar", str(SR), "-"],
    capture_output=True, check=True
).stdout
vo_mono = np.frombuffer(vo_raw, dtype=np.float32).astype(np.float64)
# Trim clean end at 24.18s raw (before silence) with smooth 80ms fadeout
trim_n = min(len(vo_mono), int(24.18 * SR))
vo_mono = vo_mono[:trim_n].copy()
fade_vo = int(0.08 * SR)
vo_mono[-fade_vo:] *= np.linspace(1.0, 0.0, fade_vo)

vo_track = np.zeros(N, dtype=np.float64)
start_idx = int(round(VOICE_OFFSET * SR))
vo_track[start_idx:start_idx + len(vo_mono)] = vo_mono

# Normalize VO RMS gently before mixing
vo_peak = np.max(np.abs(vo_track)) + 1e-9
vo_track = vo_track / vo_peak * 0.82

# Compute smooth voice envelope for musical ducking
env_win = int(0.035 * SR)
vo_abs = np.abs(vo_track)
b_lp, a_lp = signal.butter(2, 6.0 / (SR * 0.5), btype="low")
vo_env = signal.filtfilt(b_lp, a_lp, vo_abs)
vo_env = np.clip(vo_env / (np.percentile(vo_env[vo_env > 0.01], 85) + 1e-6), 0.0, 1.0)
duck_gain = 1.0 - 0.56 * vo_env  # Ducks music smoothly ~7.1 dB when narrator speaks

# Helper: warm analog pad chord in stereo
def warm_chord(freqs, t0, t1, amp=0.12, brightness=1100.0, attack=0.45, release=0.65):
    i0 = max(0, int(t0 * SR))
    i1 = min(N, int(t1 * SR))
    if i1 <= i0:
        return np.zeros((2, N))
    lt = np.arange(i1 - i0, dtype=np.float64) / SR
    dur_c = (i1 - i0) / SR
    env = np.ones_like(lt)
    na = min(len(lt), max(1, int(attack * SR)))
    nr = min(len(lt), max(1, int(release * SR)))
    env[:na] *= 0.5 - 0.5 * np.cos(np.pi * np.linspace(0, 1, na))
    env[-nr:] *= 0.5 + 0.5 * np.cos(np.pi * np.linspace(0, 1, nr))
    sig_l = np.zeros_like(lt)
    sig_r = np.zeros_like(lt)
    for k, f0 in enumerate(freqs):
        # Unison detuned warm oscillators (fundamental + octave + soft 2nd/3rd harmonics)
        for det, pan_l, pan_r in [(-0.0022, 0.85, 0.35), (0.0, 0.65, 0.65), (0.0024, 0.35, 0.85)]:
            f = f0 * (1.0 + det)
            ph = rng.uniform(0, 2 * np.pi)
            vib = 0.0012 * np.sin(2 * np.pi * (4.1 + 0.3 * k) * lt + ph)
            phase = 2 * np.pi * f * (lt + vib / (2 * np.pi * 4.2)) + ph
            osc = (
                0.68 * np.sin(phase)
                + 0.22 * np.sin(2 * phase + 0.4)
                + 0.08 * np.sin(3 * phase + 1.1)
                + 0.04 * np.sin(4 * phase)
            )
            sig_l += osc * pan_l
            sig_r += osc * pan_r
    norm = max(1, len(freqs) * 2.0)
    sig_l = sig_l / norm * env * amp
    sig_r = sig_r / norm * env * amp
    b, a = signal.butter(2, min(0.45, brightness / (SR * 0.5)), btype="low")
    out = np.zeros((2, N), dtype=np.float64)
    out[0, i0:i1] = signal.lfilter(b, a, sig_l)
    out[1, i0:i1] = signal.lfilter(b, a, sig_r)
    return out

music = np.zeros((2, N), dtype=np.float64)
# Beat 1: Golden-hour aerial wonder (Fmaj9 -> Cmaj7/E)
music += warm_chord([87.31, 174.61, 220.00, 261.63, 329.63, 392.00], 0.00, 3.20, amp=0.17, brightness=1500, attack=0.22, release=0.8)
music += warm_chord([82.41, 164.81, 196.00, 246.94, 329.63, 392.00], 2.70, 5.85, amp=0.16, brightness=1450, attack=0.65, release=0.7)
# Beat 2: Hangar investigation (Dm9 -> Am11)
music += warm_chord([73.42, 146.83, 220.00, 261.63, 329.63], 5.55, 8.95, amp=0.15, brightness=1150, attack=0.45, release=0.7)
music += warm_chord([110.00, 164.81, 220.00, 261.63, 293.66], 8.45, 12.10, amp=0.15, brightness=1100, attack=0.55, release=0.7)
# Beat 3: Rising pressure tension (BbMaj7#11 -> A7sus4 -> Dmin/Ab tension -> silence at snap!)
music += warm_chord([58.27, 116.54, 174.61, 220.00, 293.66, 369.99], 11.75, 15.10, amp=0.17, brightness=1350, attack=0.5, release=0.6)
music += warm_chord([55.00, 110.00, 164.81, 220.00, 277.18, 349.23], 14.70, 17.86, amp=0.20, brightness=1850, attack=0.45, release=0.06)
# Beat 4: Smooth Oval Resolution (Bbmaj9 -> C6 -> Fadd9 warm sunset swell)
music += warm_chord([116.54, 174.61, 220.00, 261.63, 293.66, 440.00], 20.05, 22.60, amp=0.17, brightness=1650, attack=0.35, release=0.6)
music += warm_chord([87.31, 174.61, 220.00, 261.63, 349.23, 392.00, 523.25], 22.20, 25.95, amp=0.22, brightness=1950, attack=0.55, release=1.15)

# Subtle felt marimba/arp pulse during hangar & stress investigation (6.0s -> 17.5s) and payoff (20.3s -> 24.5s)
def add_plucks(t_start, t_end, notes, step=0.27, amp=0.055):
    k = 0
    ct = t_start
    while ct < t_end:
        f0 = notes[k % len(notes)]
        i0 = int(ct * SR)
        ln = min(int(0.32 * SR), N - i0)
        if ln > 10:
            lt = np.arange(ln) / SR
            env = np.exp(-lt * 11.5) * (1.0 - np.exp(-lt * 180.0))
            tone = (0.75 * np.sin(2 * np.pi * f0 * lt) + 0.25 * np.sin(4 * np.pi * f0 * lt)) * env * amp
            pan = 0.5 + 0.28 * math.sin(k * 1.3)
            music[0, i0:i0 + ln] += tone * pan
            music[1, i0:i0 + ln] += tone * (1.0 - pan)
        ct += step
        k += 1

add_plucks(6.10, 11.60, [293.66, 349.23, 440.00, 523.25, 440.00, 349.23], step=0.26, amp=0.05)
add_plucks(12.10, 17.55, [293.66, 329.63, 440.00, 466.16, 587.33, 466.16], step=0.22, amp=0.06)
add_plucks(20.30, 24.80, [349.23, 440.00, 523.25, 659.25, 587.33, 523.25], step=0.25, amp=0.055)

# Stereo reverb tail on music
for delay_s, fb in [(0.037, 0.24), (0.061, 0.18), (0.089, 0.13)]:
    d = int(delay_s * SR)
    music[0, d:] += fb * music[1, :-d]
    music[1, d:] += fb * music[0, :-d]

# -------------------------------------------------------------------------
# 3. Diegetic Sound Effects Layer (SFX)
# -------------------------------------------------------------------------
sfx = np.zeros((2, N), dtype=np.float64)

# (a) 0.0 - 5.9s: High-altitude 1952 jetliner exterior air rush + subtle turbine hum
i_jet = int(5.95 * SR)
lt_jet = np.arange(i_jet) / SR
noise_jet = rng.standard_normal(i_jet)
b_j, a_j = signal.butter(2, [140 / (SR * 0.5), 950 / (SR * 0.5)], btype="band")
jet_air = signal.lfilter(b_j, a_j, noise_jet)
turbine = 0.35 * np.sin(2 * np.pi * 388.0 * lt_jet) + 0.20 * np.sin(2 * np.pi * 582.0 * lt_jet)
jet_env = np.ones(i_jet)
jet_env[:int(0.3 * SR)] *= np.linspace(0.2, 1.0, int(0.3 * SR))
jet_env[-int(0.6 * SR):] *= np.linspace(1.0, 0.0, int(0.6 * SR))
sfx[0, :i_jet] += (0.035 * jet_air + 0.012 * turbine) * jet_env
sfx[1, :i_jet] += (0.032 * np.roll(jet_air, 23) + 0.012 * turbine) * jet_env

# (b) 5.30 - 6.05s: Silky Cloud Wipe Whoosh (stereo sweep L->R)
w0, w1 = int(5.30 * SR), int(6.05 * SR)
lw = w1 - w0
lt_w = np.arange(lw) / SR
wn = rng.standard_normal(lw)
b_w, a_w = signal.butter(2, [220 / (SR * 0.5), 2600 / (SR * 0.5)], btype="band")
whoosh = signal.lfilter(b_w, a_w, wn) * np.sin(np.pi * np.linspace(0, 1, lw)) ** 1.6
pan_w = np.linspace(0.15, 0.85, lw)
sfx[0, w0:w1] += 0.16 * whoosh * (1.0 - pan_w)
sfx[1, w0:w1] += 0.16 * whoosh * pan_w

# (c) 6.45s & 6.75s: Wooden pointer cane double-tap on luxury display board
for tap_t, gain_t in [(6.45, 0.16), (6.75, 0.13)]:
    it = int(tap_t * SR)
    ln = int(0.06 * SR)
    lt_t = np.arange(ln) / SR
    click = (np.sin(2 * np.pi * 920 * lt_t) * np.exp(-lt_t * 95) + 0.6 * rng.standard_normal(ln) * np.exp(-lt_t * 140)) * gain_t
    sfx[0, it:it + ln] += click * 0.7
    sfx[1, it:it + ln] += click * 0.5

# (d) 8.65s: Heavy brass hydraulic lever clunk + 8.80-11.50s underwater bubbles
il = int(8.65 * SR)
ln_l = int(0.18 * SR)
lt_l = np.arange(ln_l) / SR
clunk = (0.8 * np.sin(2 * np.pi * 145 * lt_l) * np.exp(-lt_l * 34) + 0.5 * np.sin(2 * np.pi * 410 * lt_l) * np.exp(-lt_l * 65)) * 0.22
sfx[0, il:il + ln_l] += clunk * 0.55
sfx[1, il:il + ln_l] += clunk * 0.75

for kb in range(28):
    bt = 8.82 + kb * 0.095 + rng.uniform(-0.02, 0.02)
    ib = int(bt * SR)
    ln_b = int(0.075 * SR)
    if ib + ln_b < N:
        lt_b = np.arange(ln_b) / SR
        f_start = rng.uniform(380, 780)
        f_sweep = f_start * (1.0 + 0.9 * (lt_b / 0.075))
        bub = np.sin(2 * np.pi * np.cumsum(f_sweep) / SR) * np.sin(np.pi * np.linspace(0, 1, ln_b)) * 0.032
        sfx[0, ib:ib + ln_b] += bub * 0.5
        sfx[1, ib:ib + ln_b] += bub * 0.65

# (e) 13.50 - 17.85s: Pressurized aluminum hull tension groan & rising stress harmonic
g0, g1 = int(13.50 * SR), int(17.86 * SR)
lg = g1 - g0
lt_g = np.arange(lg) / SR
prog = np.linspace(0.0, 1.0, lg)
groan_f = 92.0 + 68.0 * (prog ** 2.1)
groan = (
    0.55 * np.sin(2 * np.pi * np.cumsum(groan_f) / SR)
    + 0.30 * np.sin(2 * np.pi * np.cumsum(groan_f * 2.02) / SR)
    + 0.15 * np.sin(2 * np.pi * np.cumsum(groan_f * 3.98) / SR)
) * (prog ** 1.7) * 0.085
sfx[0, g0:g1] += groan
sfx[1, g0:g1] += groan * 0.95

# (f) 17.88s: THE SNAP! Sharp structural aluminum fracture + crystalline glass ring + rivet pings!
isnap = int(17.88 * SR)
ln_s = int(0.65 * SR)
lt_s = np.arange(ln_s) / SR
burst = rng.standard_normal(ln_s)
b_hi, a_hi = signal.butter(2, [1400 / (SR * 0.5), 7500 / (SR * 0.5)], btype="band")
crack_hi = signal.lfilter(b_hi, a_hi, burst) * np.exp(-lt_s * 28.0)
thump = np.sin(2 * np.pi * (125 * np.exp(-lt_s * 14.0) + 42) * lt_s) * np.exp(-lt_s * 12.0)
metal_ring = (
    0.45 * np.sin(2 * np.pi * 2180 * lt_s) * np.exp(-lt_s * 9.5)
    + 0.35 * np.sin(2 * np.pi * 3410 * lt_s) * np.exp(-lt_s * 12.0)
    + 0.25 * np.sin(2 * np.pi * 4890 * lt_s) * np.exp(-lt_s * 15.0)
)
snap_wave = 0.42 * crack_hi + 0.34 * thump + 0.22 * metal_ring
sfx[0, isnap:isnap + ln_s] += snap_wave * 0.85
sfx[1, isnap:isnap + ln_s] += snap_wave * 0.80

# Hat pop comedic whoosh at 18.25s
ih = int(18.25 * SR)
ln_h = int(0.28 * SR)
lt_h = np.arange(ln_h) / SR
f_hat = 320.0 + 640.0 * (lt_h / 0.28)
hat_pop = np.sin(2 * np.pi * np.cumsum(f_hat) / SR) * np.exp(-lt_h * 11.0) * 0.08
sfx[0, ih:ih + ln_h] += hat_pop * 0.65
sfx[1, ih:ih + ln_h] += hat_pop * 0.45

# (g) 20.15s: Smooth laminar oval shimmer
io = int(20.15 * SR)
ln_o = int(0.85 * SR)
lt_o = np.arange(ln_o) / SR
shim = (
    0.5 * np.sin(2 * np.pi * 1046.5 * lt_o)
    + 0.35 * np.sin(2 * np.pi * 1318.5 * lt_o)
    + 0.25 * np.sin(2 * np.pi * 1567.98 * lt_o)
) * np.sin(np.pi * np.linspace(0, 1, ln_o)) * np.exp(-lt_o * 2.8) * 0.055
sfx[0, io:io + ln_o] += shim * 0.6
sfx[1, io:io + ln_o] += shim * 0.75

# Combine ducked music + SFX + centered VO
bed_l = music[0] * duck_gain + sfx[0] * (0.55 + 0.45 * duck_gain)
bed_r = music[1] * duck_gain + sfx[1] * (0.55 + 0.45 * duck_gain)

mix_l = vo_track + bed_l
mix_r = vo_track + bed_r

# Fade master last 120ms cleanly to zero
fade_end = int(0.12 * SR)
fade_curve = np.linspace(1.0, 0.0, fade_end)
mix_l[-fade_end:] *= fade_curve
mix_r[-fade_end:] *= fade_curve

# Peak-safe pre-master float32 WAV
peak = max(np.max(np.abs(mix_l)), np.max(np.abs(mix_r)), 1e-6)
stereo = np.stack([mix_l, mix_r], axis=1) / peak * 0.85
pre_wav = "/home/user/project/assets/audio/pre_master.wav"
master_wav = "/home/user/project/assets/audio/master_audio.wav"
master_mp3 = "/home/user/project/assets/audio/master_audio.mp3"

from scipy.io import wavfile
wavfile.write(pre_wav, SR, (stereo * 32767.0).astype(np.int16))

# Two-pass EBU R128 loudness normalization to exact -14.0 LUFS / -1.5 dBTP
p1 = subprocess.run(
    [FFMPEG, "-y", "-i", pre_wav, "-af", "loudnorm=I=-14.0:TP=-1.5:LRA=7.0:print_format=json", "-f", "null", "-"],
    capture_output=True, text=True, check=True
).stderr
j_start = p1.rfind("{")
j_end = p1.rfind("}") + 1
ln_stats = json.loads(p1[j_start:j_end])

af_pass2 = (
    f"loudnorm=I=-14.0:TP=-1.5:LRA=7.0:"
    f"measured_I={ln_stats['input_i']}:"
    f"measured_TP={ln_stats['input_tp']}:"
    f"measured_LRA={ln_stats['input_lra']}:"
    f"measured_thresh={ln_stats['input_thresh']}:"
    f"offset={ln_stats['target_offset']}:linear=true:print_format=summary,"
    f"apad=whole_dur={DURATION:.3f},atrim=0:{DURATION:.3f}"
)
subprocess.run(
    [FFMPEG, "-y", "-i", pre_wav, "-af", af_pass2, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", master_wav],
    capture_output=True, text=True, check=True
)
subprocess.run(
    [FFMPEG, "-y", "-i", master_wav, "-c:a", "libmp3lame", "-b:a", "256k", master_mp3],
    capture_output=True, text=True, check=True
)
os.remove(pre_wav)

# Verify final LUFS & duration
ebur = subprocess.run(
    [FFMPEG, "-nostats", "-i", master_wav, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"],
    capture_output=True, text=True, check=True
).stderr
for line in ebur.splitlines():
    if any(k in line for k in ["I:", "LRA:", "Peak:", "Duration:"]):
        print("VERIFY:", line.strip())
