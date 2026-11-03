# London Beer Flood — render benchmark

New English-language short concept using the MIT-licensed `mromidev/claude-animated-shorts` visual engine.
This branch contains a **2-second silent visual benchmark**, not the final narrated film.

## Subject

London, 17 October 1814: a great wooden vat at the Horse Shoe Brewery fails and a flood of porter escapes into the surrounding streets. The benchmark shows the hook only: an iron hoop slips, the staves creak, and brewery workers look up. The final film will treat the disaster respectfully; it was fatal, not a comedy.

## What is reused from upstream

- `toon.ts`: flat cartoon characters, ink-weighted outlines, painted crescents.
- `paint.ts`: painted HD textures.
- `build.ts` / `shade.ts`: merged painted 3D geometry and two-tone world lighting.
- `cardshade.ts`: lit character cards.
- `ink.ts`, `lensblur.ts`, `grade.ts`, `lights.ts`: original post-processing and lighting presets.

The new scene is a brewery courtyard with a giant wooden vat, brick frontage, barrels, crates, chimney smoke and workers. No reference imagery from the upstream style-study folder is included.

## Benchmark specification

- 1080 × 1920, 30 fps, 60 frames, H.264, silent.
- Full upstream post chain: ink, thin-lens blur, bloom, Neutral tone mapping, golden grade, MSAA 4.
- 4096 px shadow map.
- GitHub-hosted `ubuntu-latest`, software WebGL (`swangle`), concurrency 2 by default.
- Job timeout: 20 minutes. The script logs measured seconds/frame and a linear estimate for a 60-second film.

## Run

GitHub Actions → **Render beer-flood benchmark** → Run workflow. The first push to this branch also starts one benchmark run so the branch can be tested before the workflow is registered on the default branch.

Artifacts: `beer-flood-benchmark.mp4`, `poster.jpg`, `timings.json`.

## Local development

```bash
npm ci
npm run typecheck
npm run studio
```

Do not run the benchmark locally for this task; rendering is intentionally delegated to GitHub Actions.

## Provenance

Upstream engine: https://github.com/mromidev/claude-animated-shorts (MIT, see `LICENSE`).
Historical anchor: London Museum, “A pint-sized guide to London’s historic breweries”, Horseshoe Brewery section.
