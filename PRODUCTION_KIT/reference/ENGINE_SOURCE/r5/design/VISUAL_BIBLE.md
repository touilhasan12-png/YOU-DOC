# R5 — full-film visual rebuild

## Status and scope

This is an enforceable production brief, **not a finished film, a visual PASS, or a request for the user to approve intermediate work**. R4 was rejected. Technical checks did not establish artistic quality. R5 replaces the picture of all 93 shots and never downloads previous encoded picture units into assembly. Original narration, spoken outro, shot timings, 1,730-word script, and the previously accepted balanced action timing remain fixed. Previously approved opening/reference identity guides vessel color, crew placement, and the opening camera relationship—not permission to reuse an unchanged opening clip.

`DIRECTOR_PLAN_93.json` specifies a different framing, concrete action, environment and information design for each shot. Its implementation and review flags intentionally remain false until backed by actual evidence.

## Visual language

A deliberately coherent cinematic illustrated documentary, not low-poly placeholders masquerading as a finished scene. Three complementary modes have explicit purposes:

1. **Lived reconstruction:** anatomically finished authored characters and animals; modeled vessels and habitat; perspective optics; scene-specific blocking; soft directional light; actual sea-surface/horizon/depth cues. Most narration is carried by action, not captions.
2. **Evidence illustration:** warm off-white scientific composition, deep navy structure, restrained orange/cyan measurement accents. Used only for taxonomy, quantitative comparisons, maps, and anatomy—not to hide missing environments or characters. Diagrams clearly disclose what is schematic or estimated.
3. **Licensed real footage:** only after full original-source download, license verification and remote interior review. New R5 editorial selection and framing are required; no old encoded picture unit is a shortcut. Regional/event limitations remain explicit.

The transitions between these modes must be motivated by the narration. Avoid an arbitrary gallery of unrelated looks. Use common palette, stable black/white orca markings, matched eye lines, restrained grain/contrast and consistent typography. No repetitive title box at the top of every shot, no constant explanatory paragraph, no next-video layout.

## People: unacceptable and acceptable

**Reject:** stacked spheres or cylinders, sphere hands, unformed wrists, a faceless head on a painted superhero body, clothing painted as a pixel mask on an otherwise naked form, missing hips/feet, the same deformed small body for every age, stick-figure divers, invisible fins, or characters visible only as tiny deck markers.

Snow v4 from Blender Studio is acquired and license-verified, but not yet approved for this production. Its body coverage, shirt/pants/shoes, visible render geometry, UVs, facial and limb rigs, drivers, and export behavior must be inspected on GitHub before conversion. Embedded UI code is not authorized for automatic execution. Any missing clothing or unsuitable age/proportions are a blocker, not something to cover with a label.

Clothes must have actual readable silhouettes, hems, sleeves, seams or controlled fabric shading. Faces require visible eyes, lids, nose, mouth, ears and neck transitions. Hands require a coherent palm, thumb and articulated fingers in hero views. The cast should belong to one design system; changing hair/clothes/age presentation is preferable to swapping in an incompatible primitive model.

The freediver uses mask, snorkel, weight belt and long fins, **no scuba cylinder**. A full continuous body must connect shoulders to hips to feet. Paddle movement is the previously accepted balanced stroke, retargeted to real joints: recovery outside and above the board, underwater pull beside its rail. Do not solve intersection by hiding the entire arm or cutting away before the contact.

## Vessels and human contact

Opening/reference yacht: maintain the recognizable hull/cabin/crew identity. Rebuild the hull with longitudinal stations, a curved sheer, actual transom, deck camber, cockpit opening, attached helm, wheel column, cabin glazing, rails, stanchions, rigging and the submerged hull. Show near and far edges in perspective. The boat must sit at a physical waterline with wake and occlusion; it cannot float in a featureless blue field.

The whaleboat is a different historical craft, not a recolored modern yacht. It needs hull thickness, curved bow, visible gunwale, thwarts, oarlocks and properly held oars. The five-survivor rescue boat needs five separate supported positions. The helm needs an attached column, visible supporting deck and a plausible relationship to the captain's body.

Human and prop attachment is evaluated in the final deformed scene, not by wrist-target distance alone. Inspect palm/finger contact, elbow/wrist shape, feet/sole support, clothing collisions and whether a grip remains readable at final framing. An almost-zero numerical contact error does not excuse a visually broken pose.

## Sea and underwater space

The surface must read as a sea: perspective horizon, directional sky reflection, small and large wave scales, changing highlights, a visible vessel waterline, wake and localized foam. No flat cyan plane with a thin decorative stripe. No gray infinite floor. No oversized water rectangle behind an otherwise unlit model.

Underwater: blue-green near water, depth-dependent blue attenuation, a physical surface ceiling above the camera when visible, limited suspended particles, distant forms lost to depth, motivated key/rim lighting. Avoid obvious rectangular light beams and excessive bubbles. A stern reverse is filmed **from below the actual water surface**, never with a broad horizontal sheet placed beneath the rudder that reads as a floor. Surface scenes contain real sky; underwater scenes do not borrow a surface-blue background and call it depth.

Waves in the ice and stranding sequences are causal moving volumes: wave approaches, contacts the floe/beach, moves the supported subject, then recedes. The whale/ice cannot simply translate over a colored strip. Ice has above/below-water thickness. Wet sand has a slope, wash zone and a real route back to water.

## Animals, anatomy and behavior

The newly acquired Junskie Pastilan/pasilan orca source is an authored continuous, UV-mapped and skinned animal, not a dorsal fin attached to a primitive ellipsoid. It is not approved merely because it loads. Hero views must expose a clear eye/mouth region, continuous head/body, real pectorals, attached dorsal and horizontal tail flukes. Texture layout, UV orientation, normals, relative fin proportions and actual swimming deformation must pass review.

Male, female, calf, old male and named historical representations need intentional differences. A calf is not merely an adult multiplied by 0.45. Blue whales are not stretched or recolored orcas. Hammerhead, great white, bronze whaler, salmon, seal and sea-lion pup require distinguishable silhouettes and age/species-appropriate geometry. Unacquired or unreviewed assets remain explicit blockers. No model is substituted with a sphere when a source fails.

Preserve accepted roll/approach/grip/withdraw/unroll timing, paired lanes, blade descent and 14 versus 2.5 m/s comparison over the same 0.80-second interval (11.2 versus 2 m), with the honest quarter-speed clock. Improvements are to anatomy, scene space and readability, not to the approved timing. Contact must align actual jaw space, blade and receiving anatomical region. Bodies must remain separated in rest and approach lanes.

Non-graphic hunting and historical reconstruction: physical approach and consequence are legible, but no need for exposed gore or fabricated injury close-ups. Eye/head orientation is behavior, not a claim to know an animal's intention.

## Cinematography and editorial variation

A shot needs a point of view and a visible action. Generic slow zooms on the same side-profile composition do not constitute 93 new designs. Use opening over-shoulder/eyeline, underwater travelling profiles, wide geography before close contact, true overhead formation, low shoreline views, supported macro details, historical eye-height boat views, and clearly differentiated evidence illustrations as specified in the plan.

Blocking must survive the intended 1920×1080 frame: show faces/hands large enough to read in their hero shots, preserve full action silhouettes, avoid the frame edge cutting off a subject's head/limbs, and reserve genuinely empty space before adding a measurement. Do not insert a new camera cut during the critical grip/withdraw phase to hide an error. A scene may use multiple motivated sub-views without changing its exact original timeline allocation.

Typography is a hierarchy, not wallpaper: one readable factual anchor when useful, coherent case/spacing, few lines and quiet placement. Protect the subject, horizon and action. Counts and dates are tied to the narration's reporting period rather than deceptively updated to 2026.

## Review gates — internal, not repeated user troubleshooting

1. **Source gate:** verify complete obtained sources, rights and hashes; inspect human rig/materials with autoexecution disabled; inspect animal mesh/skin/UV/material hierarchy. All media/3D work runs on GitHub Actions only.
2. **Asset gate:** inspect newly converted source in front/three-quarter/profile and relevant physical poses. Review body coverage, clothes, face, wrists, hands, feet, species and proportions. Render success is not a visual PASS.
3. **Visual-system gate:** inspect full-size newly authored opening/sea, a real underwater animal, helm contact, complete paddle cycle, freediver equipment, historical boat, ice/wave action and one evidence illustration. These are internal evaluations of a system destined for all 93 shots—not a limited patch scope or a user approval loop.
4. **Full-film gate:** only after the implementation and internal visual system are credible, render all 93 new picture units on GitHub. Require current-source unit receipts and reject all previous encoded picture units. Do not launch five full shards merely to discover that an asset cannot export.
5. **Final gate:** independently review every shot for composition and context, inspect complete critical motion segments and transitions, verify narration/audio payload and exact duration, then separately record what was actually watched/listened to. No continuous whole-film subjective review claim unless it actually happened.

No automatic retry of a failed expensive job. First read its logs, identify the cause and decide a bounded correction. Preserve all previous editions and shares. A new finished R5 must have a fresh delivery identity; no old resumable upload session is reusable.
