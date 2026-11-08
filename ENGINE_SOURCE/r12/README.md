# R12 editable production source

## Scope
1920×1080 / 24 fps / 15,969 frames / 665.375 seconds. Seventy newly directed programmatic scenes, seventeen corrected R9 3D passages, six original real-footage passages. Complete original R9 AAC is copied unchanged; no ElevenLabs, new speech or timing filters.

`REQUEST.json` is authoritative for exact frame boundaries and six-worker distribution. `app.ts` contains scene direction, composition, typography and measured label placement. `animals.ts` contains authored programmatic geometry and actual Rev2D rigs. `models/*.r2d.json` are editable initial rig exports (the runtime builds the same models from `animals.ts`). `art/` contains only the two approved cohesive secondary seal/sea-lion cutouts. Font and vendored upstream licenses accompany their sources.

## Rebuild on GitHub Actions
1. Push this source to the repository branch `r12-reviewed-animation-original-audio`.
2. Run `npm ci --ignore-scripts` inside `ENGINE_SOURCE/r12`; the workflows install pinned Playwright/Chromium and bundle via esbuild.
3. Change `PROOF_REQUEST.json` to trigger `.github/workflows/r12_review.yml`. This renders three scene samples for each new scene, extracts retained R9 samples, and creates conservative layout reports and internal contact sheets. Review is explicitly authorized by the user. A successful workflow is not artistic acceptance.
4. After actual inspection/corrections, change `PRODUCTION_REQUEST.json` to trigger `.github/workflows/r12_full_film.yml`: six renderer workers, exact frame-count verification, full-frame retained-picture extraction, assembly and original AAC stream copy, followed by fidelity and final-frame samples.
5. All rendering/editing scripts require `GITHUB_ACTIONS=true`; do not render the film locally. Static source/schema/geometry tests and downloads are separate from media production.

## Restoring the original baseline later
The initial workflow downloads repository artifact **13577875516**, member `Something_That_Plans_R9_NATURAL_GRIP_AND_SLOW_LEGS_2026-11-07.mp4`. Artifacts can expire. The same R9 master is permanently retained in the user's existing Drive delivery:
https://drive.google.com/file/d/1R6i6mlIqVlIo_x-N027dczxBtf6eHKzL/view
If the artifact expires, restore that unchanged master into a private repository release and point the baseline download in `assemble.py` / `review_frames.py` to it. The source archive intentionally does not duplicate the 217 MB baseline movie or licensed character archives, already preserved remotely. Native R9 audio and all retained inserts are recoverable from that master. Original scene sources and licensed-source receipts remain in the full included repository snapshot; character archives can be restored from the existing `r4-licensed-character-source-20261106` and `r5-authored-source-archive-20261106` releases.

## Verification boundaries
`TECHNICAL_VERIFICATION.json` compares complete native AAC payload hashes, checks exact frame counts and sampled retained-picture SSIM. Final contact sheets and selected full-resolution frames are inspected separately. Bounding-box checks are conservative and sampled. These checks are not a claim of continuous human playback, perfect anatomy or artistic approval. Original R9 delivered subtitles are retained, not retimed to a regenerated voice.

See `CREDITS_AND_LICENSES.md` for authentic footage, fonts, source code, AI-secondary-image and reconstruction disclosures. Earlier versions and sharing settings are not changed.
