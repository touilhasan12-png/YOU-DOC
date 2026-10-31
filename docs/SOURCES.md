# Sources & licences

Everything in the film is either computed from a public-domain dataset or
synthesised. Nothing is scraped at render time.

## Geography — borders and country shapes
- **Natural Earth 1:50m** cultural vectors, via `world-atlas@2.0.2` (`countries-50m.json`), converted with `topojson-client`.
- Licence: **public domain** (Natural Earth asks for no attribution but it is credited on screen anyway).
- Used for: every country outline, every land border, every centroid the flags are pinned to.

## Imagery — satellite plates
- **NASA GIBS**, layer `BlueMarble_ShadedRelief_Bathymetry`, level `GoogleMapsCompatible_Level8`, Web-Mercator tiles.
- Licence: **NASA open data, public domain**; commercial use permitted; no API key.
- Fetched **once** by `scripts/fetch_plate.py` into `public/basemap/*.jpg` (tiles cached under `~/.cache/gibs`). Nine plates, each cropped to an exact mercator rectangle so the vectors and the imagery align by construction.
- Credit on screen: «IMAGERY: NASA GIBS».

## Flags
- **flag-icons 7.2.3** (`node_modules/flag-icons/flags/4x3/<iso2>.svg`), 44 files, one per country.
- Licence: **MIT**.
- Cards are exact 4:3 boxes, so no flag is ever stretched (`object-fit: cover` is never used).

## Facts asserted on screen
| claim | basis |
|---|---|
| 44 states with no coastline | the standard count of UN-recognised sovereign states with no sea coast; the list is `src/data/landlocked.json` and is printed in full in the film |
| Africa 16 · Europe 14 · Asia 12 · South America 2 | counted from that same file (`scripts/check_film.py` re-derives and asserts it) |
| ≈1 country in five | 44 / 195 ≈ 22.6 % |
| Uzbekistan and Liechtenstein are the only doubly-landlocked states | their complete neighbourhoods are shown: KZ, KG, TJ, TM, AF (all landlocked) and CH, AT (both landlocked) |
| Kazakhstan is the largest landlocked country, 2,724,900 km² | standard figure; it is the largest by area |
| Kazakhstan has five neighbours, no coast | Russia, China, Kyrgyzstan, Uzbekistan, Turkmenistan |
| Ethiopia is the most populous landlocked country, 120 M+ | UN World Population Prospects; >100 M since 2016 |
| Ethiopia's trade moves by road through Djibouti | the Addis Ababa–Djibouti corridor carries the overwhelming majority of Ethiopian trade |
| Bolivia lost its coast to Chile in 1884 | War of the Pacific; Treaty of Ancón 1883, Pact of Bogotá 1904 (both credited on screen) |
| Bolivia still keeps a navy | the Bolivian Naval Force exists and patrols Lake Titicaca |

## Sound
- Narration: TTS, one file per line, at `audio/vo/vo01..08.mp3`.
- Music bed and SFX: **synthesised from scratch** in `scripts/build_audio.py` (numpy, no samples, no third-party audio). A-minor pad progression at 84 bpm, sub pulse, air bed, shimmer; flag ticks, cut whooshes, two low booms.
- The whole mix is finished offline and mastered to **−14 LUFS / −1 dBTP** before any frame is rendered.
