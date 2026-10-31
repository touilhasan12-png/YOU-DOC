#!/usr/bin/env python3
"""
AUDIO BUILDER -- music bed + SFX + voice-over, mixed and mastered to ONE track.

Why one track: the mix is finished here, so the loudness target (-14 LUFS /
-1 dBTP) is guaranteed before a single frame is rendered, and Remotion only has
to play a file back.

Everything is deterministic and derived from src/data/timeline.json:
  - flag ticks land on the exact frame of each flag (no drift possible)
  - scene whooshes land on the exact cut
  - the music ducks -6 dB under every voice-over line, with a 200 ms ramp

Music is synthesised (no samples, no external licences): a slow A-minor pad
progression, a soft sub pulse, an air bed and a high shimmer. Nothing has a
sharp attack, and the whole bed sits ~19 dB under the narration.
"""
import json
import math
import pathlib
import subprocess
import wave

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
SR = 44100
T = json.loads((ROOT / "src/data/timeline.json").read_text())
FPS = T["fps"]
N = int(round(T["totalFrames"] / FPS * SR))
t = np.arange(N) / SR

VO_DIR = ROOT / "audio" / "vo"
TMP = ROOT / "audio" / "_tmp"
TMP.mkdir(parents=True, exist_ok=True)
OUT = ROOT / "public" / "audio"
OUT.mkdir(parents=True, exist_ok=True)


def db(x: float) -> float:
    return 10 ** (x / 20.0)


# ---------------------------------------------------------------- voice-over
def load_vo(i: int) -> np.ndarray:
    """decode mp3 -> mono float32 via ffmpeg (no python mp3 dependency)"""
    src = VO_DIR / f"vo{i + 1:02d}.mp3"
    dst = TMP / f"vo{i + 1:02d}.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-ac", "1", "-ar", str(SR), str(dst)], check=True)
    with wave.open(str(dst)) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    return a


vo_bus = np.zeros(N, dtype=np.float32)
vo_env = np.zeros(N, dtype=np.float32)  # for ducking
for i, v in enumerate(T["vo"]):
    a = load_vo(i)
    start = int(round(v["start"] / FPS * SR))
    end = min(N, start + len(a))
    vo_bus[start:end] += a[: end - start]
    vo_env[start:end] = 1.0

# smooth the duck envelope: 200 ms attack, 400 ms release
ramp_a = int(0.2 * SR)
ramp_r = int(0.4 * SR)
kern = np.concatenate([np.linspace(0, 1, ramp_a), np.ones(1), np.linspace(1, 0, ramp_r)])
duck = np.convolve(vo_env, kern / kern.sum() * 3.0, mode="same")
duck = np.clip(np.convolve(duck, np.ones(2048) / 2048, mode="same") * 3.0, 0, 1)

# ------------------------------------------------------------------- music
def env_adsr(n: int, a: float, r: float) -> np.ndarray:
    e = np.ones(n, dtype=np.float32)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na) ** 1.5
    if nr:
        e[-nr:] = np.linspace(1, 0, nr) ** 1.5
    return e


def tone(freq: float, n: int, detune_cents: float = 0.0, harm=(1.0, 0.32, 0.14)) -> np.ndarray:
    f = freq * 2 ** (detune_cents / 1200.0)
    ph = 2 * np.pi * f * np.arange(n) / SR
    out = np.zeros(n, dtype=np.float32)
    for k, amp in enumerate(harm, start=1):
        out += amp * np.sin(ph * k).astype(np.float32)
    return out / sum(harm)


CHORDS = [
    (0.0, [110.00, 164.81, 220.00, 261.63, 55.00]),      # Am
    (16.4, [87.31, 130.81, 174.61, 220.00, 329.63, 43.65]),  # Fmaj7
    (32.9, [130.81, 196.00, 261.63, 329.63, 65.41]),     # Cmaj7
    (49.3, [98.00, 146.83, 196.00, 246.94, 49.00]),      # G
    (62.0, [110.00, 164.81, 220.00, 261.63, 55.00]),     # back to Am
]

music = np.zeros(N, dtype=np.float32)
for i, (t0, freqs) in enumerate(CHORDS):
    s = int(t0 * SR)
    if s >= N:
        break
    e = CHORDS[i + 1][0] if i + 1 < len(CHORDS) else T["totalFrames"] / FPS
    n = min(N - s, int((e - t0 + 1.6) * SR))
    seg = np.zeros(n, dtype=np.float32)
    for j, f in enumerate(freqs):
        seg += tone(f, n, detune_cents=(-4 if j % 2 else 4)) * (0.55 if j < 4 else 0.9)
    seg *= env_adsr(n, 3.2, 3.0)
    # gentle one-pole lowpass: the bed must never sit on top of the narration
    alpha = 0.055
    seg = np.copy(seg)
    for _ in range(2):
        seg = np.concatenate([[seg[0]], seg[:-1]]) * (1 - alpha) + seg * alpha
    music[s : s + n] += seg.astype(np.float32)

# sub pulse: one soft heartbeat every 2 bars
beat = 60.0 / 84.0
pulse_iv = beat * 8
pos = 4.0
while pos < N / SR - 1:
    s = int(pos * SR)
    n = int(0.9 * SR)
    if s + n < N:
        ph = 2 * np.pi * 62.0 * np.arange(n) / SR
        body = (np.sin(ph) * np.exp(-np.arange(n) / (0.28 * SR))).astype(np.float32)
        music[s : s + n] += body * 0.5
    pos += pulse_iv

# air bed (pink-ish noise) + high shimmer, both very low
rng = np.random.default_rng(20261031)
white = rng.standard_normal(N).astype(np.float32)
pink = np.copy(white)
for _ in range(3):
    pink = np.convolve(pink, np.ones(7) / 7, mode="same").astype(np.float32)
air = pink * 0.05
shimmer = (np.sin(2 * np.pi * 880 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t))).astype(np.float32) * 0.012
music = music + air + shimmer

# slow stereo width: tiny delay on the right channel
d = int(0.011 * SR)
right = np.concatenate([np.zeros(d, dtype=np.float32), music[:-d]]) * 0.92 + music * 0.18

# duck under the voice, then set the bed level
music_st = np.stack([music, right], axis=1)
music_st *= (1.0 - 0.5 * duck)[:, None]          # -6 dB while the VO speaks
music_st *= db(-19.0)                            # sits ~19 dB under the narration

# --------------------------------------------------------------------- sfx
sfx = np.zeros((N, 2), dtype=np.float32)


def add(buf, s, mono, gain):
    if s < 0:                      # an event that starts before the film begins
        mono = mono[-s:]
        s = 0
    n = min(len(mono), N - s)
    if n <= 0:
        return
    buf[s : s + n, 0] += mono[:n] * gain
    buf[s : s + n, 1] += mono[:n] * gain * 0.96


def tick(seed: int) -> np.ndarray:
    r = np.random.default_rng(seed)
    n = int(0.075 * SR)
    a = np.arange(n) / SR
    body = np.sin(2 * np.pi * 190.0 * a) * np.exp(-a / 0.018)
    trans = r.standard_normal(n) * np.exp(-a / 0.004) * 0.55
    bp = np.convolve(trans, np.ones(5) / 5, mode="same")
    return (body * 0.7 + bp * 0.6).astype(np.float32)


def whoosh(seed: int, dur=0.7) -> np.ndarray:
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    x = r.standard_normal(n).astype(np.float32)
    # moving average whose width shrinks: cheap band-pass sweep
    out = np.zeros(n, dtype=np.float32)
    win = 24
    for i in range(0, n, 64):
        seg = x[i : i + 64 + win]
        k = np.ones(win) / win
        out[i : i + 64] = np.convolve(seg, k, mode="same")[: min(64, n - i)] * 3.2
        win = max(4, int(win * 0.985))
    a = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(a / dur, 0, 1)) ** 2
    return (out * env).astype(np.float32)


def boom() -> np.ndarray:
    n = int(1.6 * SR)
    a = np.arange(n) / SR
    return ((np.sin(2 * np.pi * 52 * a) + 0.4 * np.sin(2 * np.pi * 78 * a)) * np.exp(-a / 0.55)).astype(np.float32)


flags = [e for e in T["events"] if e["kind"] == "flag"]
cuts = [e for e in T["events"] if e["kind"] == "cut"]
for i, e in enumerate(flags):
    add(sfx, int(round(e["f"] / FPS * SR)), tick(1000 + i), db(-27.0))
for i, e in enumerate(cuts):
    add(sfx, int(round((e["f"] - 3) / FPS * SR)), whoosh(2000 + i), db(-28.0))
for fr in (96, T["scenes"][7]["start"] + 8):
    add(sfx, int(round(fr / FPS * SR)), boom(), db(-21.0))

# ------------------------------------------------------------------- master
vo_st = np.stack([vo_bus, vo_bus], axis=1)
mix = vo_st * db(0.0) + music_st + sfx

# soft-knee limiter
peak = np.max(np.abs(mix)) + 1e-9
mix = mix / peak
mix = np.tanh(mix * 1.25) / np.tanh(1.25)

# normalise integrated loudness to -14 LUFS, then guarantee <= -1 dBTP
def write_wav(path: pathlib.Path, data: np.ndarray):
    d = np.clip(data, -1.0, 1.0)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((d * 32767).astype(np.int16).tobytes())


# stems, for measurement only (never shipped in the film)
write_wav(OUT / "stem_vo.wav", vo_st)
write_wav(OUT / "stem_music.wav", music_st * db(0.0))
write_wav(OUT / "stem_sfx.wav", sfx)
write_wav(OUT / "master_raw.wav", mix)
meas = subprocess.run(
    ["ffmpeg", "-v", "info", "-i", str(OUT / "master_raw.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"],
    capture_output=True, text=True,
).stderr
I = None
TP = None
for line in meas.splitlines():
    s = line.strip()
    if s.startswith("I:"):
        I = float(s.split()[1])
    if s.startswith("Peak:") and TP is None:
        TP = float(s.split()[1])
gain = -14.0 - (I or -20.0)
mix = mix * db(gain)
peak_after = 20 * math.log10(np.max(np.abs(mix)) + 1e-9)
if peak_after > -1.0:
    mix = mix * db(-1.0 - peak_after)
write_wav(OUT / "master.wav", mix)

print(f"samples            {N}  ({N/SR:.2f} s)")
print(f"vo up to           {sum(v['durSec'] for v in T['vo']):.2f} s of narration")
print(f"pre-master I       {I} LUFS, true peak {TP} dBTP -> gain {gain:+.2f} dB")
print(f"post gain peak     {peak_after:+.2f} dBFS")
print(f"flags/sfx events   {len(flags)} ticks, {len(cuts)} whooshes")
print(f"-> {OUT/'master.wav'}")
