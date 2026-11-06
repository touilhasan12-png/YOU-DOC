# Sources, licenses and attribution — Something That Plans

## Actual moving-image footage

### REAL_001 — New Zealand wild orcas
- Title: *Killer whales swimming in the wild*
- Author: **Fair Projects**; additional footage **Steve Hathaway**.
- Actual shooting context: New Zealand; source dated 2 February 2012. Not the Bremer Canyon 2021 hunt, Antarctic ice-washing, an Iberian boat incident or a historic human injury.
- Source / license record: https://commons.wikimedia.org/wiki/File:Killer_whales_swimming_in_the_wild.webm
- Original linked source: https://vimeo.com/36070966
- License: **Creative Commons Attribution 3.0 Unported** — https://creativecommons.org/licenses/by/3.0/
- Modifications: excerpts trimmed and transcoded; original audio omitted; editorial headings/location/credits added. No endorsement is implied.
- Full original file: 27,674,122 bytes; MD5 `2d2385f1ac2d185b0675fc17cfaff166`.
- Verified Drive backup: https://drive.google.com/file/d/1_2FJYW8re7QK_hnzAWXkvHeus2C9Wasa/view
- Individual source in/out points are in `research/FOOTAGE_REGISTRY.json`. Actual frames were inspected at 2, 9, 18, 27, 36, 45, 54, 63 and 70 seconds before selecting excerpts.

Suggested reusable credit: “Killer whales swimming in the wild — Fair Projects; additional footage Steve Hathaway. CC BY 3.0 (creativecommons.org/licenses/by/3.0/). Edited excerpts; original audio omitted.” This credit appears in the film and in its final CTA credit block.

### REAL_002 — NOAA Fisheries Alaska B-roll
- Actual context: killer whales in Alaskan waters near St. Paul Island / Bering Sea and the Aleutian Chain; source package includes general swimming and feeding.
- Source: https://videos.fisheries.noaa.gov/detail/videos/b-roll-packages---all/video/1092315332001/b-roll:-killer-whales-in-alaska
- Original download: https://download.gallery.brightcove.com/api/gallery/account/659677166001/site/site-600408/video/1092315332001/download
- Opening slate inspected: all footage courtesy of the National Oceanic and Atmospheric Administration (NOAA), a federal agency of the U.S. Department of Commerce; credit NOAA Fisheries. U.S. federal-government footage; attribution retained on use.
- Original file: 113,818,665 bytes; MD5 `34bababbd4b696cb508c92c616c9242b`.
- As this original exceeds the 100MB per-file upload-tool cap, its unmodified bytes are backed up in **two binary parts**:
  - Part 01: https://drive.google.com/file/d/1-KMfzQjOAO3A53_tmGAvnHUC_WAS8BSB/view — 62,914,560 bytes, MD5 `98e52518b15fa1c80596e3d0c3ec8ac2`.
  - Part 02: https://drive.google.com/file/d/19ZTyyfagNC_Zlu5mmQgdCTjf9zkbFKEo/view — 50,904,105 bytes, MD5 `63becfc570f7b1aba85dc501ccaf70b9`.
- Download both parts, name them as in `research/NOAA_ALASKA_JOIN.json`, and concatenate **binary bytes** in order, not by video re-encoding. On a POSIX shell: `cat NOAA_ALASKA_FULL_SOURCE.mp4.part01 NOAA_ALASKA_FULL_SOURCE.mp4.part02 > NOAA_ALASKA_FULL_SOURCE.mp4`. Verify the full MD5 above. These are not independent playable clips.
- Selected clips are included separately and playable in the editable project. No source audio was used.

### REAL_003 — Southern residents / NOAA research B-roll
- Actual context: southern resident killer whales in Puget Sound, Washington. Selected clips are only the wildlife portion, not unidentified third-party research scenes.
- Source: https://videos.fisheries.noaa.gov/detail/video/3629965805001/b-roll:-southern-resident-killer-whales-noaa-research
- Original download: https://download.gallery.brightcove.com/api/gallery/account/659677166001/site/site-600408/video/3629965805001/download
- Opening attribution slate inspected: **Paul B. Hillman, NOAA Fisheries; filmed under NMFS ESA/MMPA Permit #16163**. The required credit is retained on the footage and in the final film credit block.
- Original: 83,585,668 bytes; MD5 `3dec6496bdb179dc1fdf1ac11300284d`.
- Verified Drive backup: https://drive.google.com/file/d/1UXzZahYiQHL7M70zEEHnVUEt5KREqrIo/view
- Modifications: trimmed, transcoded to H.264/24fps, original audio omitted, titles/location/credits overlaid. Not labeled as the exact tagged Alaskan animals, a particular matriarch or the Australian predation event.

## Cartography
- **Natural Earth**, public-domain land geometry: https://www.naturalearthdata.com/about/terms-of-use/
- Regional source: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_land.geojson
- Wide/world source: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson
- Regional geometries clipped and topology-preserving simplified (0.007–0.014 degrees), retaining real coastlines. See `research/MAP_PROVENANCE.json`. Geographic illustrations only; not navigation charts, precise event tracks or bathymetric survey data.

## Text, voice and explicit artwork
- Canonical spoken text: the user's supplied `orca_narration.txt`, saved without character changes as `script_original.txt`.
- Narrator: previously user-selected `voice-00`, American English; ten originals plus one exact-text sentence clarity retake with that same narrator, not a replacement voice. Source WAV checksums and speech-recognition coverage review are included.
- Illustrations: explicit original SVG / Bezier drawing and programmatic joint animation, retaining approved earlier vessel/crew identity. No image-generation tool or previously rejected generated image was used.
- DejaVu Sans / DejaVu Sans Bold: font copyright/license included in `fonts/LICENSE.txt`.
- Water texture / restrained breath-contact sound effects: deterministic procedural audio, no third-party music or source-video audio.

## Research and editorial caveats
The supplied spoken script remains unchanged. This production is not a claim that every historical detail or estimate was comprehensively verified. Keep historical statistics distinct from current counts, and research hypotheses distinct from established causes. The historical incidents and hunting mechanisms are illustrated, not fabricated photographic evidence.

The first three documented blue-whale kills are described in Totterdell et al., *Marine Mammal Science*, DOI **10.1111/mms.12906**. Secondary accounts differ about the March 2021 juvenile's length and participating group size; the narration's sixteen-meter estimate is retained, with an estimate/reconstruction note rather than a silent edit:
- https://www.birdguides.com/articles/orcas-successfully-hunt-worlds-largest-animal/
- https://www.theguardian.com/environment/2022/jan/27/new-footage-reveals-killer-whales-hunting-and-feeding-on-blue-whales-in-brutal-attacks-aoe
- https://www.snexplores.org/article/orca-pod-blue-whale-kill-eat-gory-video

Wildlife distance and local-rules guidance is reinforced visually. The film does not recommend approaching or entering the water with wild orcas, nor treating the absence of confirmed fatal wild attacks as a guarantee of safety.
