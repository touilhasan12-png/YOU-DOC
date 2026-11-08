# Something That Plans — R13 credits and provenance

## Current R13 edition
- Nineteen new Three.js scenes replace the opening, whale comparison, selected sharks, shore capture and vessel contexts. Twelve additional passages are restored directly from the preferred R9 master. Original protected human/3D and authentic-media passages remain intact; the other existing R12 passages are retained. Exact selection and frame intervals are in REQUEST.json and delivered PROVENANCE.json.
- Native R9 AAC is stream-copied without synthesis, filters, trimming, padding or ending stretch. The original picture/audio end relationship is retained.
- New whale and shark bodies, fins and swimming are authored programmatic 3D surfaces. These are explanatory models, not scans or scientific measurements of individuals.
- The approved brown sea lion is ONE whole cutout. A rear-quarter image anchor is carried at the orca jaw; the image has no independently animated limbs. No new AI images are generated.
- Detailed yacht and sea stage reuse the supplied authored Three.js engine; the principal orca uses the credited original textured source model, not a generated PNG.
- Reconstructions are illustrative, not authentic event footage. No blanket commercial-clearance, exclusivity or copyright-eligibility guarantee is made.

## Orca model used in R13 and retained 3D
**Junskie Pastilan / pasilan — Orca**. CC BY 3.0.
- Original: https://blendswap.com/blend/7791
- License: https://creativecommons.org/licenses/by/3.0/
- Source/receipt and five-file model bundle: ENGINE_SOURCE/r5/assets/orca_pasilan/.
- Adaptation: glTF material/runtime conversion, UV-preserving mandibular split and authored swimming/contact animation. The bundled license text has an inconsistent title; the author and original source ID were reconciled in the included receipt. That caveat is retained, not silently relabeled.
- Three.js r170, MIT; pinned dependency manifests included. New source and reproducible GitHub workflows: ENGINE_SOURCE/r13/ and .github/workflows/r13_repair_*.yml.

## Retained R12/R9 credits (historical wording retained below)
The following edition-specific counts and runtime descriptions refer to R12, not to all R13 scenes. R13 actual routing is recorded above and in PROVENANCE.json.

# Something That Plans — R12 credits and provenance

## This edition
- Complete original R9 audio is copied unchanged, including its natural outro and original spoken CTA. No ElevenLabs audio or new speech synthesis is used in R12. The native AAC payload is checked against R9.
- Seventy newly authored programmatic 2D scenes; seventeen corrected R9 3D passages and six original observational-footage passages remain full-frame, without newly added opaque panels, masks or crops.
- Main orca, blue whale, sharks and other principal marine-animal drawings are editable programmatic geometry, not AI image puppets. The grey seal and brown sea lion are the two user-authorized AI-generated secondary cutouts retained from R11, each as one cohesive image. No independent limb rigging is applied to them. No claim of exclusivity, copyright eligibility or blanket commercial clearance is made for AI-generated imagery.
- Reconstructed hunts, vessel interactions and historical scenes are illustrative, not authentic event footage or measured telemetry. Scientific diagrams and illustrative body sizes are not exact reconstructions of individual animals.

## Actual footage
**Wild orcas, New Zealand:** Fair Projects / FairProjects; additional footage credited to Steve Hathaway. Creative Commons Attribution 3.0.
- https://commons.wikimedia.org/wiki/File:Killer_whales_swimming_in_the_wild.webm
- https://creativecommons.org/licenses/by/3.0/
- Observational footage only, not footage of Iberian interactions, historical blue-whale kills or the narrated human encounters. Existing extracts, resizing, source attribution and ending fade are retained from R9.

**Wild southern resident killer whales:** Paul B. Hillman / NOAA Fisheries; NMFS ESA/MMPA Permit 16163.
- https://videos.fisheries.noaa.gov/detail/video/3629965805001/b-roll:-southern-resident-killer-whales-noaa-research
- NOAA-produced U.S. government observational b-roll, not Iberian event footage. Existing source/permit attribution and original observational context apply.

## Retained authored 3D material
- Corrected R9 rendered footage retains its supported board rider, slow legs, steering grip, boat/orca/rudder mechanics and authored human appearances.
- Quaternius Universal Base Characters, CC0-1.0: https://quaternius.com/packs/universalbasecharacters.html
- **Snow Rig (CC) Blender Foundation | studio.blender.org** — Blender Studio / Demeter Dzadik, Snow v4: https://studio.blender.org/characters/snow/v4/ ; CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ . Production adaptation includes a cleaned/exported mesh, fixed skin/body appearance, clothing retained, volume-preserving baked supported poses, corrected hands and slow board-leg motion. Original rights/adaptation records are in `ENGINE_SOURCE/r5/rights/` and the original R9 credits supplied alongside this edition. The archived adapted source is available from the existing `r5-authored-source-archive-20261106` repository release.
- Historical R9 documents describe earlier editions; statements there about imagery, narration or earlier processing are historical, not descriptions of newly produced R12 material.

## Programmatic animation dependencies
Pinned upstream repository-tree SHAs and license texts are in `ENGINE_SOURCE/r12/vendor/`.
- **Rev2D**, MIT — https://github.com/RevStudio/Rev2D . Actual `ModelSchema`, `Rig`, body lattice warping, fin bone, swim keyframes and posed path geometry are used for the main animal models.
- **anidoodle**, Apache-2.0 — https://github.com/alexgreensh/anidoodle . Actual deterministic RNG, text fitting, minimum reading time and geometry probe helpers are imported.
- **lemo-opuscar**, MIT — https://github.com/lemomo-ai/lemo-opuscar . Actual plane, pressure-line ink, arrow and animation-clock helpers are imported; registration jitter is disabled for stable anatomy and text.
- **reelmimic**, MIT — https://github.com/edenfunf/reelmimic . Its composition/motion and clean-zone guidance informed layout. No reelmimic runtime code is claimed as executed.
- Modified/application code and authored rigs are editable in the included source snapshot. Vendored third-party source remains under its own included licenses; this file does not relicense it.

## Maps and typography
- Natural Earth 110m land geometry, public domain: https://www.naturalearthdata.com/about/terms-of-use/
- R12 display/body: Bricolage Grotesque and DM Sans, SIL Open Font License 1.1; corresponding license files are included.
- Retained R9 imagery may contain Barlow Condensed, Source Sans 3 or DejaVu Sans; original font licenses remain in source.

## Interpretation and safety
Reported dates/counts follow the original narration's historical period; they are not advertised as live totals. Reconstructions do not establish disputed causes for vessel interactions. General wildlife-distance advice is not a substitute for current local navigation/rescue instructions. Original sources/research and prior-edit credits remain archived separately; no earlier Drive version or sharing setting was replaced.


# R14 additions and actual runtime

R14 is a selective derivative of approved R13. New 2D pictures are authored Canvas 2D vector illustration, not generated-image orca/shark PNG puppets. New shark surfaces and fins are original procedural Three.js geometry. Unchanged R13 pictures retain their original repositories, attributions and licenses below/above. No new AI-generated image, narration or substitute real footage is added.

## Exactly four added real archival photographs

### alaska — shot 20
- Creator/source: Robert Pittman / NOAA
- Source record: https://commons.wikimedia.org/wiki/File:Killerwhales_jumping.jpg
- Download URL: https://upload.wikimedia.org/wikipedia/commons/3/37/Killerwhales_jumping.jpg
- Rights statement on source record: PD-USGov-NOAA
- Context: Unimak Island, Alaska; mammal-eating transient orcas. Context, not the specific tagging study.
- In/out (seconds at 24 fps): 136.916667–143.791667
- Local original: archive/alaska.jpg; 2186×1453; SHA256 `b1d3c5236a828522371cc38240a6712d6b426713ff7f3c2dcf7c7589f5e773c6`
- Treatment: full original composition fitted without invented detail; no AI upscaling/restoration. On-picture author and contextual caption.

### farallon — shot 41
- Creator/source: Matt McIntosh / NOAA National Marine Sanctuaries
- Source record: https://commons.wikimedia.org/wiki/File:GFNMS_-_Farallon_Islands_(26820988890).jpg
- Download URL: https://upload.wikimedia.org/wikipedia/commons/9/91/GFNMS_-_Farallon_Islands_%2826820988890%29.jpg
- Rights statement on source record: PD-USGov-NOAA
- Context: Farallon Islands, 23 October 2014. Site context, not the 2009 event.
- In/out (seconds at 24 fps): 275.041667–282.000000
- Local original: archive/farallon.jpg; 5616×3744; SHA256 `5a3521712605d5963565b00c18d6b20ba7ca092b014da52e69a7a69d59555a5e`
- Treatment: full original composition fitted without invented detail; no AI upscaling/restoration. On-picture author and contextual caption.

### blue — shot 47
- Creator/source: Lisa Conger / NOAA Fisheries
- Source record: https://commons.wikimedia.org/wiki/File:Blue-whale.jpg
- Download URL: https://upload.wikimedia.org/wikipedia/commons/1/16/Blue-whale.jpg
- Rights statement on source record: PD-USGov-NOAA
- Context: Blue whale near the surface after feeding, 2018. Species context, not Australian kill footage.
- In/out (seconds at 24 fps): 316.125000–327.833333
- Local original: archive/blue.jpg; 1000×667; SHA256 `75046286d1074f30ace678e51b8996cf65d07c817f9a6218d7798808ece4818e`
- Treatment: full original composition fitted without invented detail; no AI upscaling/restoration. On-picture author and contextual caption.

### eden — shot 52
- Creator/source: Charles Eden Wellings (1881–1952); National Library of Australia
- Source record: https://commons.wikimedia.org/wiki/File:Killer_whale_(Old_Tom)_and_whalers_-_original.jpeg
- Download URL: https://upload.wikimedia.org/wikipedia/commons/c/c5/Killer_whale_%28Old_Tom%29_and_whalers_-_original.jpeg
- Rights statement on source record: PD-Australia; PD-US-expired
- Context: Historical documentary still produced 1910; first shown publicly 1912. Old Tom and Eden whalers. Low-resolution original, no invented detail.
- In/out (seconds at 24 fps): 355.958333–368.041667
- Local original: archive/eden.jpg; 600×480; SHA256 `5286940f7394ff405bbf5e4b02867083536af6586f9b309c4e6b7605ba0f5b85`
- Treatment: full original composition fitted without invented detail; no AI upscaling/restoration. On-picture author and contextual caption.

The Old Tom record identifies a film made in 1910 and publicly displayed in 1912, establishing pre-1931 publication for the US expired-copyright status; the photograph is also pre-1956 Australian public domain. NOAA records identify official employee photographs (US government public domain). Rights status is jurisdiction-specific, not a blanket worldwide commercial-clearance guarantee. Existing generated secondary seal/sea-lion images and historical footage credits remain as disclosed in R13.


# R15 limited corrective derivative

Only shots 3, 4 and 84 change relative to R14. New original procedural Three.js blue-whale geometry and one rescaled/reframed existing Canvas 2D composition; no new AI image or archive photograph. All other R14 pictures, footage, repaired sharks, source-license obligations and four original archival stills retained. Archive source originals remain under ENGINE_SOURCE/r14/archive/ in the editable source. R15 production uses Three.js r170, pinned Playwright/esbuild and the existing fonts. No new speech generation; original R9 AAC is copied byte-identically.
