# Benchmark result — 2026-11-03

Run: https://github.com/touilhasan12-png/YOU-DOC/actions/runs/41595607477
Branch: `render/beer-flood-benchmark`
Conclusion: `success`

## Measured

| Item | Value |
|---|---:|
| Output | 1080 × 1920, 30 fps, 60 frames, 2.0 s, silent H.264 |
| Runner | GitHub-hosted `ubuntu-latest`, 4 vCPU AMD EPYC 7763, 15.61 GiB RAM |
| WebGL | software `swangle`, concurrency 2 |
| Bundle | 12.44 s |
| Browser open + composition select | 0.76 s |
| Render | 508.69 s (8 min 29 s) |
| Render script total | 521.89 s (8 min 42 s) |
| Whole Actions run wall time | 575 s (9 min 35 s) |
| Average render cost | 8.478 s / frame |

## Linear extrapolation

A 60-second film at 30 fps has 1,800 frames. At the measured average:

- single-job render: about **254 minutes (4 h 14 min)**, before narration, mixing, assembly and upload.
- This is why the full-quality single-job path is not acceptable without a warning.

## Practical full-quality path: shard across public runners

The repository is public, so standard GitHub-hosted runner usage is free. GitHub Free allows 20 concurrent standard jobs (docs: https://docs.github.com/en/actions/reference/limits). Split a 60-second film into 20 shards of 3 seconds / 90 frames:

- per-shard render: about 12.7 minutes at the measured rate;
- expected wall time: roughly 15–20 minutes including setup, queueing and assembly, assuming all 20 shards start promptly;
- total compute is still about 4+ runner-hours, but it is parallel and public-standard usage is free;
- quality stays identical to this benchmark because each shard uses the same composition and post chain.

This needs a sharded workflow and an explicit go-ahead before the full English export.
