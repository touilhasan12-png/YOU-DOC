# YOU-DOC — Something That Plans / revision 2

The user-authorized engine lives in `ENGINE_SOURCE`. All image, audio and video generation runs **only on GitHub Actions**. The original accepted film and narrator master are preserved elsewhere; this is a separate revision.

## Corrections
- Both complete arms, distinct elbow silhouettes and two-hand oar grips.
- One dimensioned rudder stock/blade model: stock enters hull through bearings. Attached before fracture; visible stub and blade separation during fracture. No unexplained floating rudder.
- Conservative solid-ice clearance for wave washing, tail blocking and seal capture, including complete motion samples.
- Non-crossing orca lanes and separate interaction turns; a hull is shown above the rudder in underwater interaction shots.
- A mounted cockpit wheel, pedestal, compass, fixed base, coherent hands and visible boat context.
- A more detailed **free diver**, with shaped limbs, mask/snorkel, weight belt and two long fins, without inventing scuba equipment.
- Whole-film composition review, three-quarter rather than cropped egg-like frontal portraits, a countable 700-report graphic and 1-in-5 fleet, meaningful acoustics/learning/anatomy/history/geography graphics instead of arbitrary decoration.
- Ending rebuilt from the original narrator using two moderate **time-domain WSOLA** stages. The rejected long-window spectral/phase-vocoder file is an explicitly named reference only and cannot be selected by the candidate mux. All spoken words and the CTA remain.

## Remote test plan
1. Source/script/93-scene coverage tests; 61-frame solid-ice geometry samples, 240 orca separation samples, 32 crew poses, rudder attachment calibration.
2. GitHub proof run: actual frames spanning **all 93 scenes**, plus motion clips for the reported defects and original/rejected/repaired ending audio for comparison.
3. Inspect the remote output; fix source if necessary. Numeric signal/decode tests alone are not artistic or listening approval.
4. GitHub full run: 12 native 1080p/24fps shards, exact packet-clock mux and full decode. Produce a clearly labeled complete **candidate**, plus actual encoded-native review sheets.
5. Promote only after source-specific real review; never create a fake final art-review receipt.

The agent dispatches and monitors workflows via GitHub's HTTPS API. No token is committed or passed to the public workflow. Source footage and credits: `ENGINE_SOURCE/FINAL_CREDITS.md`; font and Natural Earth license files accompany source assets. GitHub's built-in Actions token has read-only content/action permissions; no PAT is needed on runners.
