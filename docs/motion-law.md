# Motion Law (enforced in code, not by taste)

| Rule | Where it lives | Enforced by |
|---|---|---|
| No shot longer than 3000 ms | `MOTION.MAX_SHOT_MS` | `scripts/shot_lint.py` (fails CI) |
| No repeated shot | `fingerprint()` in `src/lib/shots.ts` | `scripts/shot_lint.py` |
| One hero shot only | `hero: true` | `scripts/shot_lint.py` |
| No pulsing / looping | `MOTION.ALLOW_LOOPS = false` | code review + no CSS animations |
| No shake / handheld | `MOTION.ALLOW_SHAKE = false` | no noise functions used |
| Scale overshoot ≤ 1.03 | `MOTION.MAX_SCALE_OVERSHOOT` | `Cutout.tsx` clamps it |
| Pan speed cap | `MOTION.MAX_PAN_PX_PER_FRAME` | camera helper |
| ≤3 flashes/second | `MOTION.MAX_FLASHES_PER_SEC` | no full-screen strobes exist |
| Determinism | no `Math.random`/`Date.now`/CSS anims | `src/lib/anim.ts` (seeded only) |

## Revision 2 — after user review (2026-10-30)

| Complaint | Fix |
|---|---|
| "bad transitions" | Cuts were unmotivated. Now **every shot carries a continuous camera move**; a cut happens only where the camera cannot travel further. Enforced: `[STATIC]` check in `shot_lint.py`. |
| "you said fast, 3s max" | Easing changed to a single decelerating move over the whole shot; pan travel capped (`PAN_LIMIT_PX`) so speed never spikes above 6%/s (`[PAN SPEED]` check). |
| "I want real maps" | Basemap replaced with **NASA GIBS Blue Marble Shaded Relief + Bathymetry** (real satellite imagery, public domain). |
| marker drift off the real strait | 16:9 crop is now **anchor-aware** and the effective bbox is written to `src/data/basemap.json`; the engine projects with the cropped bbox, so geology and markers agree. |
