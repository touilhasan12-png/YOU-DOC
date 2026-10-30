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
