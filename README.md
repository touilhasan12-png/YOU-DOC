# YOU-DOC — Deterministic 2D-in-3D Three.js Cinema Engine

**Sample Episode:** *Why Airplane Windows Are Never Square* (`1920×1080` Landscape · `30.00 fps` · `26.00s` / `780 Frames` · `-14.1 LUFS`)

## Architecture
- **3D World (`src/world/`)**: Three.js WebGL2 with ACES Filmic tone mapping, HDR HalfFloat `EffectComposer` (`BloomEffect`, `SMAAEffect`, custom split-tone cinema color grade + film grain), 2048×2048 PCF soft shadows, custom GLSL atmospheric sky & rim-lit volumetric clouds, and a custom **GLSL Kirsch/Superellipse Stress-Concentration & Streamline Shader** (`src/shaders/stressPanelShader.ts`).
- **2D Paper-Puppet Rig (`src/characters/Puppet2D.ts`)**: High-DPI vector-drawn characters (`Passenger`, `AirlineBoss`, `ChiefEngineer`) with variable-weight ink outlines, fabric/paper grain, 10 facial expressions, damped-spring squash & stretch, detachable 3D flying hat, and `MeshDepthMaterial` silhouette shadow casting.
- **Temporal Shutter Accumulation (`src/renderHarness.ts`)**: Deterministic `render(frame)` with multi-sample 180° shutter motion blur & Halton sub-pixel jittered AA.
- **Audio & Kinetic Captions (`tools/build_audio_and_captions.py`, `src/overlays/OverlayCompositor.ts`)**: Studio English narration aligned word-by-word via Whisper, procedural synth-orchestral score + diegetic SFX with voice-triggered sidechain ducking, normalized to `-14.1 LUFS / -1.5 dBTP`.
- **Parallel Cloud Render (`.github/workflows/render.yml`)**: 10-shard GitHub Actions matrix (`78 frames/shard`) → lossless chunk concat + AAC 256k mux → automated `ffprobe`/`ebur128`/`blackdetect` QA → GitHub Release + GitHub Pages showcase with 1-click MP4 download button.
