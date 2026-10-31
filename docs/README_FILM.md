# The Locked Countries — 1080 × 1920, 66.6 s, English

A vertical documentary short on the **44 countries with no sea coast**: every
one of them named on its own map, every one of them carrying its own flag,
borders shown throughout, one continuous camera move per shot, and a 3D-tilted
satellite plate underneath it all.

| | |
|---|---|
| File | `out/The_Locked_Countries_1080x1920.mp4` |
| Frame | 1080 × 1920 (9:16), 30 fps, h264 yuv420p |
| Length | **66.60 s** (1998 frames) |
| Audio | AAC 192 kbps, 44.1 kHz stereo, mastered **−14 LUFS / −1 dBTP** |
| Narration | 8 lines, US English, 59.06 s of speech |
| Topic | the 44 landlocked states (`src/data/landlocked.json`) |

## Structure

| scene | time | what it does |
|---|---|---|
| V01 hook | 0:00–0:08 | the whole Earth, 44 states fill red in one west-to-east wave, the count lands |
| V02 continents | 0:08–0:16 | four cameras — Africa 16, Europe 14, Asia 12, South America 2 — each country's flag drops onto its own country |
| V03 share | 0:16–0:23 | one country in five: the four continents as proportion bars |
| V04 doubly landlocked | 0:23–0:31 | two map cards, Uzbekistan and Liechtenstein, each showing **every neighbour**, with a flag on every neighbour, all of them landlocked |
| V05 Kazakhstan | 0:31–0:39 | the largest: 2.72 M km², 0 m of coastline |
| V06 Ethiopia | 0:40–0:48 | the most populous: 120 M+, one road corridor to Djibouti |
| V07 Bolivia | 0:48–0:56 | the one that lost it in 1884, and keeps a navy on a lake |
| V08 close | 0:57–1:06 | all 44 flags pinned at once, then the line |

## How it is made

```
scripts/build_timeline.py   real VO durations -> scene boundaries + every flag-drop frame
scripts/fetch_plate.py      NASA GIBS -> nine mercator-exact plates in public/basemap/
scripts/build_audio.py      music + sfx + VO -> one mastered track (public/audio/master.wav)
src/lib/plate.ts            one camera model, memoised projections, anchor table
src/components/v2/Stage.tsx the tilted satellite slab: plates, borders, fills, flags, pins
src/scenes/v/*.tsx          the eight scenes
src/scenes/Vertical.tsx     the film, assembled from timeline.json
scripts/check_film.py       QA: 20+ assertions against the delivered file
```

Every timing in the picture comes from `src/data/timeline.json`. Nothing is
hand-timed, so a flag can never land on a country after the narrator has stopped
talking about it.

## Render

```bash
npm ci
python3 scripts/build_timeline.py
python3 scripts/build_audio.py
npx remotion render src/index.ts Vertical out/The_Locked_Countries_1080x1920.mp4 \
  --gl=swangle --concurrency=2 --crf=17 --audio-bitrate=192k
python3 scripts/check_film.py
```

`.github/workflows/render-vertical.yml` runs exactly this on GitHub Actions
(workflow_dispatch, 4 cores), so the film can be rebuilt anywhere.

## Documentation
- `NARRATION.md` — the script, the measured durations, what is measured vs estimated
- `SOURCES.md` — every dataset, licence and on-screen claim
- `ART_NOTES.md` — the coordinate model, the coverage maths, and the 10 defects found and fixed
- `QA.md` — the QA run against the delivered file, with numbers
