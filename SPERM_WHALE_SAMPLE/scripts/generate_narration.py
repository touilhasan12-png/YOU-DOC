#!/usr/bin/env python3
"""
Generate English documentary narration for all 4 scenes on GitHub Actions.
Uses Microsoft Neural TTS (edge-tts) with exact WordBoundary timestamps,
broadcast-normalized to 48kHz stereo PCM16, padded cleanly to exact 15.0s
(720,000 samples) per scene -> 60.0s (2,880,000 samples) master WAV + English.srt.
"""
import asyncio
import json
import os
import re
import subprocess
import time
import wave
from pathlib import Path

import edge_tts
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
SPEC = json.loads((ROOT / "SPEC.json").read_text(encoding="utf-8"))
SCRIPT = json.loads((ROOT / "SCRIPT_SAMPLE.json").read_text(encoding="utf-8"))
OUT = ROOT / "generated" / "audio"
OUT.mkdir(parents=True, exist_ok=True)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

SR = int(SPEC["sample_rate"])
CHANNELS = int(SPEC["audio_channels"])
SCENE_DUR = float(SPEC["scene_duration_seconds"])
SCENE_SAMPLES = int(round(SCENE_DUR * SR))


def fmt_srt_time(sec: float) -> str:
    ms = int(round(max(0.0, sec) * 1000))
    h = ms // 3600000
    ms %= 3600000
    m = ms // 60000
    ms %= 60000
    s = ms // 1000
    ms %= 1000
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


async def synth_scene_edge(text: str, voice: str, rate: str, pitch: str, mp3_path: Path):
    try:
        communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    except TypeError:
        communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate, pitch=pitch)
    words = []
    audio_chunks = bytearray()
    async for chunk in communicate.stream():
        ctype = chunk.get("type")
        if ctype == "audio":
            audio_chunks.extend(chunk["data"])
        elif ctype == "WordBoundary":
            start_s = chunk["offset"] / 1e7
            dur_s = chunk["duration"] / 1e7
            words.append({
                "word": chunk["text"],
                "start": round(start_s, 4),
                "end": round(start_s + dur_s, 4),
            })
    if not audio_chunks:
        raise RuntimeError(f"Empty audio from edge-tts for voice={voice}")
    mp3_path.write_bytes(bytes(audio_chunks))
    return words


def convert_and_pad_wav(mp3_path: Path, raw_wav: Path, padded_wav: Path, lead_in_s: float = 0.25):
    # Decode & broadcast-normalize to 48kHz stereo PCM16
    cmd = [
        FFMPEG, "-y", "-v", "error",
        "-i", str(mp3_path),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-ar", str(SR),
        "-ac", str(CHANNELS),
        "-c:a", "pcm_s16le",
        str(raw_wav),
    ]
    subprocess.run(cmd, check=True)

    with wave.open(str(raw_wav), "rb") as w:
        assert w.getframerate() == SR
        assert w.getnchannels() == CHANNELS
        assert w.getsampwidth() == 2
        raw_bytes = w.readframes(w.getnframes())
        n_frames = w.getnframes()

    spoken_s = n_frames / SR
    if spoken_s > SCENE_DUR - 0.15:
        raise RuntimeError(f"Spoken clip too long ({spoken_s:.3f}s > {SCENE_DUR - 0.15:.2f}s) — refusing to clip words!")
    bytes_per_frame = CHANNELS * 2
    lead_frames = int(round(lead_in_s * SR))
    if lead_frames + n_frames > SCENE_SAMPLES:
        lead_frames = max(0, SCENE_SAMPLES - n_frames)

    tail_frames = SCENE_SAMPLES - lead_frames - n_frames
    lead_bytes = b"\x00" * (lead_frames * bytes_per_frame)
    tail_bytes = b"\x00" * (tail_frames * bytes_per_frame)
    full_bytes = lead_bytes + raw_bytes + tail_bytes
    assert len(full_bytes) == SCENE_SAMPLES * bytes_per_frame

    with wave.open(str(padded_wav), "wb") as out_w:
        out_w.setnchannels(CHANNELS)
        out_w.setsampwidth(2)
        out_w.setframerate(SR)
        out_w.writeframes(full_bytes)

    return {
        "lead_in_s": round(lead_frames / SR, 4),
        "spoken_s": round(spoken_s, 4),
        "tail_silence_s": round(tail_frames / SR, 4),
        "samples": SCENE_SAMPLES,
    }


def build_srt_entries(scene_id: int, scene_offset_s: float, lead_in_s: float, words: list, fallback_text: str, spoken_s: float):
    entries = []
    if not words:
        entries.append((scene_offset_s + lead_in_s, scene_offset_s + lead_in_s + spoken_s, fallback_text))
        return entries

    # Group words into clean documentary subtitle lines (~8-11 words or sentence punctuation)
    buf = []
    seg_start = None
    for idx, w in enumerate(words):
        if seg_start is None:
            seg_start = w["start"]
        buf.append(w["word"])
        is_end_punct = bool(re.search(r"[.!?]$", w["word"]))
        if is_end_punct or len(buf) >= 10 or idx == len(words) - 1:
            t0 = scene_offset_s + lead_in_s + seg_start
            t1 = scene_offset_s + lead_in_s + w["end"] + 0.08
            entries.append((t0, min(scene_offset_s + SCENE_DUR - 0.05, t1), " ".join(buf)))
            buf = []
            seg_start = None
    return entries


async def main():
    t_start = time.monotonic()
    voices_to_try = [
        SCRIPT.get("voice_primary", "en-US-AndrewMultilingualNeural"),
        "en-US-ChristopherNeural",
        "en-GB-RyanNeural",
    ]
    rate = SCRIPT.get("voice_rate", "-4%")
    pitch = SCRIPT.get("voice_pitch", "-2Hz")

    selected_voice = None
    scene_reports = []
    timestamps_out = {"scenes": {}}
    srt_entries = []
    master_pcm = bytearray()

    for scene in SCRIPT["scenes"]:
        sid = int(scene["id"])
        mp3_path = OUT / f"scene_{sid:02d}_raw.mp3"
        raw_wav = OUT / f"scene_{sid:02d}_norm.wav"
        padded_wav = OUT / f"scene_{sid:02d}_padded.wav"

        words = None
        last_err = None
        candidates = [selected_voice] if selected_voice else voices_to_try
        for v in candidates:
            try:
                words = await synth_scene_edge(scene["narration"], v, rate, pitch, mp3_path)
                selected_voice = v
                break
            except Exception as e:
                last_err = e
        if words is None:
            raise RuntimeError(f"All edge-tts voices failed on scene {sid}: {last_err}")

        pad_info = convert_and_pad_wav(mp3_path, raw_wav, padded_wav, lead_in_s=0.30)

        # Find trigger word timestamp for exact visual headline cue
        trigger = scene.get("cue_trigger_word", "").lower()
        cue_s = float(scene.get("default_cue_s", 8.0))
        if trigger and words:
            for w in words:
                clean = re.sub(r"[^a-z0-9]", "", w["word"].lower())
                if clean == trigger or trigger in clean:
                    cue_s = round(pad_info["lead_in_s"] + w["start"], 3)
                    break

        # Shift words by lead_in_s for local scene time
        shifted_words = [
            {
                "word": w["word"],
                "start": round(pad_info["lead_in_s"] + w["start"], 3),
                "end": round(pad_info["lead_in_s"] + w["end"], 3),
            }
            for w in words
        ]
        timestamps_out["scenes"][str(sid)] = {
            "id": sid,
            "key": scene["key"],
            "cue_s": cue_s,
            "lead_in_s": pad_info["lead_in_s"],
            "spoken_s": pad_info["spoken_s"],
            "tail_silence_s": pad_info["tail_silence_s"],
            "word_count": len(shifted_words),
            "words": shifted_words,
        }

        scene_offset_s = (sid - 1) * SCENE_DUR
        srt_entries.extend(
            build_srt_entries(sid, scene_offset_s, pad_info["lead_in_s"], words, scene["narration"], pad_info["spoken_s"])
        )

        with wave.open(str(padded_wav), "rb") as pw:
            master_pcm.extend(pw.readframes(pw.getnframes()))

        scene_reports.append({
            "scene_id": sid,
            "key": scene["key"],
            "voice": selected_voice,
            "cue_s": cue_s,
            **pad_info,
        })
        print(f"Scene {sid} ({scene['key']}): spoken={pad_info['spoken_s']}s, tail={pad_info['tail_silence_s']}s, cue_s={cue_s}s, words={len(words)}")

    master_wav = OUT / "SAMPLE_NARRATION_MASTER.wav"
    total_samples = len(master_pcm) // (CHANNELS * 2)
    assert total_samples == SCENE_SAMPLES * len(SCRIPT["scenes"]), f"Unexpected total samples {total_samples}"
    with wave.open(str(master_wav), "wb") as mw:
        mw.setnchannels(CHANNELS)
        mw.setsampwidth(2)
        mw.setframerate(SR)
        mw.writeframes(bytes(master_pcm))

    # Write English.srt
    srt_lines = []
    for idx, (t0, t1, txt) in enumerate(srt_entries, start=1):
        srt_lines.append(f"{idx}\n{fmt_srt_time(t0)} --> {fmt_srt_time(t1)}\n{txt}\n")
    (OUT / "English.srt").write_text("\n".join(srt_lines), encoding="utf-8")

    # Write AUDIO_TIMESTAMPS.json & AUDIO_REPORT.json
    (OUT / "AUDIO_TIMESTAMPS.json").write_text(json.dumps(timestamps_out, indent=2), encoding="utf-8")
    elapsed = round(time.monotonic() - t_start, 2)
    report = {
        "status": "ok",
        "engine": "edge-tts",
        "voice": selected_voice,
        "rate": rate,
        "pitch": pitch,
        "sample_rate": SR,
        "channels": CHANNELS,
        "total_samples": total_samples,
        "total_duration_s": round(total_samples / SR, 6),
        "elapsed_seconds": elapsed,
        "scenes": scene_reports,
    }
    (OUT / "AUDIO_REPORT.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Master narration ready: {master_wav} ({report['total_duration_s']}s) in {elapsed}s")


if __name__ == "__main__":
    asyncio.run(main())
