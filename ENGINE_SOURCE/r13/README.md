# R13 editable repair source

All production rendering, encoding and assembly run in GitHub Actions, not locally.

- `REQUEST.json`: exact 93-shot native-frame timeline, mode and worker routing.
- `app.js`, `scene.js`, `species.js`, `orca_jaw.js`: new Three.js stage, species and direction. Original source/poses remain unchanged elsewhere.
- `render.mjs`: pinned runtime from `../three_engine`; frame-exact rendering on six Actions workers.
- `assemble.py`: retrieves immutable R9 and R12 master artifacts, splices selected whole frames, copies the original R9 AAC, verifies frame counts and audio payload, produces temporal sheets and source archive.
- `.github/workflows/r13_repair_proof.yml`: change PROOF_REQUEST.json to obtain sampled actual 3D render proofs.
- `.github/workflows/r13_repair_full.yml`: change PRODUCTION_REQUEST.json to render full scenes and assemble.
- Fixed references are recorded in REQUEST.json and provenance. Authenticated access to the original repository artifacts is needed to rerun assembly; old masters remain preserved on Drive. Archived media omitted from this compact source ZIP are enumerated in OMITTED_ARCHIVED_MEDIA.json; no credential is included.
- Approval is not asserted by technical checks: temporal sheets are sampled views; grip-origin equality is not universal collision detection.

The full approved seal is depth-tested as one image, anchored at rear-quarter UV(.85,.62), not dismembered or separately rigged. Shore state is evaluated on continuous original film time across cuts. Principal animals are programmatic/mesh assets, not generated-image puppets. Native R9 picture is 15949 frames at 24 fps; the original AAC runs slightly longer, and that native relationship is preserved.
