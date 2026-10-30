# YOU-DOC — Map-Based Geography & Geopolitical Analysis engine

Deterministic video engine for the niche **Map-Based Geography & Geopolitical Analysis**.
Prototype subject: *The 7 Chokepoints That Control the World* (5:30, EN, 1080p30).

## Status
- [x] Stage 1 — `ENGINE_SOURCE`: theme tokens, motion law, geo layer, shot ledger, 2 scenes
- [x] Stage 1.5 — real satellite basemap + 16-shot continuous-camera film (35.3s)
- [ ] Stage 2 — full shot list (≈125 visual states) + cut-out asset system
- [ ] Stage 3 — audio (Kokoro narration + WhisperX alignment) **← GATED: stops and asks**
- [ ] Stage 4 — music/SFX, loudness, SRT
- [ ] Stage 5 — master render 1080p on Actions + Drive delivery

## Basemap
Real satellite imagery from **NASA GIBS** (`BlueMarble_ShadedRelief_Bathymetry`),
public domain, commercial use permitted, fetched once and cached:

```bash
python3 scripts/fetch_basemap.py            # -> public/basemap/*.jpg (1920x1080)
```
The effective bbox after the 16:9 crop is recorded in `src/data/basemap.json`
and used by the engine for marker projection.

## Commands
```bash
npm ci
npm run dev          # remotion studio
npm run qa           # typecheck + shot lint + sync guards
npm run render:test  # TestShot -> out/test_shot.mp4
```
Render in CI: **Actions → render → Run workflow**.

## Hard rules (see docs/motion-law.md)
3s max per visual state · no pulsing/shake · no repeated shot · every number sourced ·
deterministic frames · basemap = Natural Earth (public domain), never OSM tile scraping.

## Licences
Remotion (free ≤3 people) · d3-geo ISC · world-atlas/Natural Earth public domain ·
fonts OFL · Kokoro Apache-2.0.
