# Narration — «The Locked Countries»

English (US), male documentary read. One line per scene. Each line is a separate
TTS render, and every scene boundary in the film is derived from the **measured
duration of its own audio file** (`scripts/build_timeline.py` → `src/data/timeline.json`).
No line is hand-timed, so the picture cannot drift from the voice.

| # | scene | line | measured | starts at |
|---|-------|------|----------|-----------|
| 1 | V01 hook | Forty-four countries on Earth have no coastline at all. No port, no navy, and no direct line to the sea. | 7.288 s | 0.40 s |
| 2 | V02 continents | Africa has sixteen of them. Europe, fourteen. Asia, twelve. And South America, two. | 7.419 s | 8.50 s |
| 3 | V03 share | Line them up, and it is one country in five on the planet — locked out of the ocean by pure geography. | 6.635 s | 16.73 s |
| 4 | V04 doubly landlocked | Two of them are doubly landlocked: Uzbekistan, and Liechtenstein. Every neighbour they have is landlocked as well. | 6.949 s | 24.17 s |
| 5 | V05 Kazakhstan | Kazakhstan is the largest. Two point seven million square kilometres, and not one metre of coast. | 7.419 s | 31.90 s |
| 6 | V06 Ethiopia | Ethiopia is the most populous: more than a hundred and twenty million people, importing nearly everything by road. | 7.889 s | 40.13 s |
| 7 | V07 Bolivia | Bolivia lost its coastline to Chile in eighteen eighty-four. It still keeps a navy. It sails it on a lake. | 7.497 s | 48.83 s |
| 8 | V08 close | Forty-four countries. Zero ports. Every single shipment in or out has to cross another country's border. | 7.967 s | 57.13 s |

Total narration: **59.06 s**. Film length: **66.60 s** (1998 frames @ 30 fps).
The extra time is lead-in, a 0.6 s breath after each line, and a 1.5 s end card.

### Word timing

There is **no forced alignment** in this film: the script has no word-level
timings, and none are claimed. Timing is locked at the *line* level (exact, from
the audio files). Inside V02 the four continent clauses are split in proportion
to their character counts minus a fixed 0.35 s pause — an **estimate**, stated as
such, not a measurement.

### Captions

No burned-in captions. Every scene carries its own typographic statement, and
each claim has a source line at the bottom of the frame.
