# Something That Plans — R11

## Edition and picture provenance
R9 is the user-approved reference. Earlier Drive editions remain untouched. This revision uses 70 newly directed programmatic vector scenes, 17 retained R9 3D passages, and the six existing licensed observational-footage passages. R10 movie pixels are not used. Procedural drawing utilities are reused as source components, not as a claim that R10 is the approved picture.

Orcas, blue whales, sharks and other main marine animals in the new illustrated scenes are drawn from procedural paths with body deformation and attached moving fins/tails; they are NOT generated-image sprites. The opening uses an illustrated canyon cross-section and deliberately close foreground passage, not an image of a historical event.

**Only two secondary generated assets are used:** a grey Weddell seal and a brown sea lion pup. Their backgrounds are removed; each remains one cohesive whole image. No body-part separation, limb rigging or independent part animation is used for these two assets. Generated principal-animal experiments were rejected by the user and excluded from production and this source package.

The R9 board rider retains supported hands and upper body plus slow leg-only movement. Corrected wheel grips and all other retained R9 actor poses are retained as pictured. Their imagery is re-encoded and picture timing is conformed to the new narration; this is not a pixel-identical or packet-identical copy. New typography overlays replace earlier 3D-scene title/note zones. The precise old/new frame ranges are supplied in PICTURE_PROVENANCE.json. Retained 3D passages include board/diver/helm/rudder interactions and historical rowing/rope scenes.

## Narration and timing
Will / ElevenLabs, model eleven_v3, using the user-authorized account and performance tags. All 32 original script paragraphs, including the spoken CTA, are retained without lexical rewriting. The canonical script SHA256 is af5f03682a9d6fe4c53393a806e2dbb35e51ae2818de102efc42ef242be70eb9. Fresh speech is used at native speed, with no atempo, time stretch, pitch change or old narrator mixed beneath it. Paragraph boundaries are padded to the 24fps picture clock. Character timestamps returned by the synthesis provider drive shot anchors and English subtitles; no listening or artistic audio evaluation is claimed.

An original low-level filtered-noise ocean texture is synthesized during GitHub production. It is not captured location audio. ElevenLabs reported the account tier as free at the time of synthesis. Publication, attribution and commercial-use rights for its output depend on the applicable ElevenLabs plan and terms; this delivery does not grant commercial voice rights. Provider: https://elevenlabs.io/ .

## Licensed observational footage (preserved from R9)
**Wild orcas, New Zealand** — Fair Projects / FairProjects; additional footage credited to Steve Hathaway. Creative Commons Attribution 3.0.
- https://commons.wikimedia.org/wiki/File:Killer_whales_swimming_in_the_wild.webm
- https://creativecommons.org/licenses/by/3.0/
- The R9 source windows and their embedded attribution are retained. Observational footage, NOT footage of the narrated historical kills or vessel incidents.

**Wild southern resident killer whales** — Paul B. Hillman / NOAA Fisheries. NMFS ESA/MMPA Permit 16163.
- https://videos.fisheries.noaa.gov/detail/video/3629965805001/b-roll:-southern-resident-killer-whales-noaa-research
- NOAA-produced U.S. government b-roll used as wild-family context, not as Iberian orcas or human-encounter footage. Original media remain in the repository archive.

The final two semantic units retain the quiet observational ending and spoken CTA, without graphical next-video boxes, arrows, thumbnails, placeholders or end-screen UI.

## Retained human/3D source
R9's source and attribution are preserved in the source archive. Retained pictures inherit the Quaternius Universal Base Characters Kit, CC0-1.0, and the licensed authored character/source provenance documented in the original R9 credits.
- https://quaternius.com/packs/universalbasecharacters.html
- https://creativecommons.org/publicdomain/zero/1.0/
- Original source archive: https://github.com/touilhasan12-png/YOU-DOC/releases/tag/r4-licensed-character-source-20261106

## Maps and typography
Natural Earth public-domain geographic land geometry; schematic pins and formations are not individual animal telemetry or exact historical incident tracks.
- https://www.naturalearthdata.com/about/terms-of-use/

New typography: Sora, DM Sans, Instrument Serif. Font files and SIL Open Font License notices are included in fonts/. Titles, supporting text and notes occupy separate reserved zones; type is fitted to bounded widths. Large number sequences have dedicated side-by-side data and illustration zones.
- https://github.com/google/fonts/tree/main/ofl/sora
- https://github.com/google/fonts/tree/main/ofl/dmsans
- https://github.com/google/fonts/tree/main/ofl/instrumentserif

## Evidence and safety
Historical dates and reported population/encounter counts retain their narrated-period meaning and are not presented as live counts. Reconstructions, age classes and anatomical diagrams are explanatory, not captured event footage or exact specimen measurements. Scientific references remain in ENGINE_SOURCE/SOURCES.md.

Spanish vessel guidance, May 2025, is distinguished from general wildlife-viewing advice: do not stop the vessel; if safe, head toward shallower coastal waters; contact rescue on VHF 16. No spoken words were silently changed.
- https://www.transportes.gob.es/marina-mercante/marco-referencia-sector/interacciones-con-orcas
- https://transportes.gob.es/el-ministerio/sala-de-prensa/noticias/jue-15052025-1137

## Production record
Movie rendering, baking, editing and encoding occur on GitHub Actions only, at native 1920×1080, 24fps. Local work is limited to source authoring, external asset/speech requests, static background removal and file/network management. No local movie rendering, playback, audio listening, contact sheets or media analysis is performed. Technical completion is not a claim of artistic acceptance or absence of every possible error.
