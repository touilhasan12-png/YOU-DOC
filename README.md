# YOU-DOC — Sperm Whale 60-Second Opening Sample ("230 Decibels in the Dark")

Isolated branch `sperm-whale-sample-v1` on `touilhasan12-png/YOU-DOC`.
Does not modify `main`, `leopard-seal-v1`, or `production-kit-opening-v1`.

## Specification
- **Topic:** *Physeter macrocephalus* (Sperm Whale) — English documentary sample in the `YOU-DOC` visual DNA
- **Format:** 4 scenes × 15s = 60s total (`1,440` frames), `1920×1080 @ 24fps`, H.264 High CRF 17 `yuv420p`, AAC 192k 48kHz stereo
- **Scenes:**
  1. `surface_dive` (3D Ocean Water shader): Bull sperm whale logging off Dominica, forward-left angled blow spout, deep-dive fluke-up
  2. `abyss_scale` (3D Underwater): Shared-world scale comparison — 18m bull sperm whale, 1.8m freediver, 8m giant squid
  3. `click_230db` (3D Abyssal Underwater): Front-3/4 spermaceti head firing crisp geometric 230 dB echolocation wavefronts illuminating a distant giant squid
  4. `depth_evidence` (Canvas 2D): Animated 0m → 2,000m dive profile, spermaceti acoustic cutaway schematic, Natural Earth Dominica map, and matrilineal coda dialect strip
- **Execution:** All TTS narration, WebGL/Canvas rendering, FFmpeg encoding, decode QA, and visual review sheet extraction run exclusively on GitHub Actions.
