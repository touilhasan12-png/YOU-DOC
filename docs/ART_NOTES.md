# Art & engineering notes — how the picture is built, and what broke on the way

This file exists because the brief forbids silent changes. Every number that
decides how the map looks is written down here, with the reason it has that
value, and every defect found during the build is listed with its fix.

## 1. The coordinate model (the one thing that must never drift)

A single camera model drives every scene:

```
Cam = { lng, lat, across }     across = degrees of longitude visible across the FRAME
k   = w / (ov * across * rad)  design px per radian
```

* **Design space** is `ov` times the frame (0..w·ov, 0..h·ov), origin top-left,
  camera centre exactly at the plane's centre, which is exactly the frame centre.
* **Screen space**: `1 design px = plane.s screen px`. Nothing else scales anything.
* `plane.s == ov` means the camera window `across` fills the frame exactly;
  `plane.s > ov` is a push-in, `plane.s < ov` a pull-back.

This is the only relationship between "degrees" and "pixels" in the film. A
projection is built **once per shot** (`carto()`, memoised); the per-frame camera
move is a CSS transform on the plane. That is why a 1998-frame render is cheap,
and why the motion is smooth rather than a series of re-projections.

## 2. Why the plate overscans: 1.26, and why the lens is 2600 px

Tilting a rectangle about its horizontal axis pulls its top edge away from the
camera. With a plane half-height `d` (design px), scale `s`, tilt `θ` and
perspective `P`, the top edge lands at

```
y_screen = d·s·cosθ · P / (P + d·s·sinθ)
```

and it must stay ≥ half the frame height, or the void appears at the top of the
frame. With `ov = 1.26`, `θ = 31°`, `P = 2600 px`:

```
d·s = 960·1.26² = 1524  →  1524 · cos31 · 2600/(2600 + 1524·sin31) = 1043 px  ≥ 960 ✓
```

A **long lens** was chosen on purpose: 2600 px at a 31° tilt gives a visible
convergence (the map recedes) without the fisheye look that a short lens gives at
the same angle. The first build used `ov = 1.45, P = 2000` and the tilt was
invisible (too much perspective, most of the map off-frame).

## 3. Why each plate has its own mercator rectangle

`scripts/fetch_plate.py` crops every NASA plate to the **exact** mercator
rectangle of its bounding box, then resizes with the height derived from the
mercator span. So plate pixel (u,v) ↔ mercator (x,y) is a pure linear map, and
`carto()` can place an image with `rects[id]` and be pixel-exact at any zoom.
The borders and the satellite imagery therefore cannot disagree.

Constraint that set each plate's bbox: **plate longitude span ≥ across × 1.26**
(so the plate still covers the frame at full overscan). Kazakhstan needs
`across = 42`, so its plate must span ≥ 53°; it spans 64°.

## 4. The 3D tilt and the flags

Flags are **billboards inside the tilted plane**. Each card is a child of the
plane (so it tracks the projection and the camera exactly) with
`rotateX(−θ)`, which turns it back to face the camera. A flag pinned to a
country on a plane that is lying back 31° therefore stays upright and readable
while the map under it is foreshortened. This is the only reason the 44-flag
beat works at all.

Cards are exact 4:3 boxes and the flag SVGs are 4:3, so nothing is stretched —
`object-fit: cover` is never used (it distorts a flag).

Micro-states would be covered by their own flag, so a table of offsets in
`src/lib/plate.ts` (`ANCHOR_NUDGE`) displaces them **in degrees** (zoom-
independent), and the film draws a hairline leader line back to the true
centroid whenever a card is more than 13 px off its country.

## 5. Motion law
- Every shot has a continuous camera move (push or pull); nothing sits still.
- Entrances are ease-out only. No overshoot, no bounce, no looping pulse.
- The only rings in the film are **one-shot landing rings** on a flag, and one
  expanding ring on the Djibouti port marker. Nothing oscillates.
- A hard cut happens only between scenes, never inside a camera move.

## 6. Defects found during the build, and their fixes

| # | defect | how it was found | fix |
|---|---|---|---|
| 1 | grey Arctic ice filling the top third of every world shot | first still, `out/v01_f180.png` | re-cropped the world plate at lat 71 instead of 74/84; masked the plate edges so the slab fades into the void |
| 2 | the tilt was invisible (map read as flat) | second still | overscan 1.45→1.26, lens 2000→2600 px, tilt to 31→27° over the shot |
| 3 | `across` was off by ~1.5× — the world shot cut Bolivia and Laos | comparing the rendered span with the camera value | rewrote the stage so one factor (`plane.s`) relates design px to screen px; `k = w/(ov·across·rad)` |
| 4 | **every shared type component was invisible** (kickers, headlines, stats, source tags) | stills at 1105 and 1350 showed captions but no headline | the components read the *local* frame while cues are *absolute*; added `FrameOffset` context (`src/components/v2/frame.tsx`) |
| 5 | V04's two circular insets sat on top of the headline | still at 905 | rebuilt V04 as two map cards, each showing the state **and its whole neighbourhood** with a flag on every one |
| 6 | flags for Rwanda/Burundi stacked | Africa still | offsets widened to ±3° |
| 7 | Kazakhstan's flag fell outside its card | V04 card still | card camera widened 27°→46° so the neighbourhood fits |
| 8 | Liechtenstein's card was zoomed to 6.6° and its flags fell off | card still | widened to 16° |
| 9 | the "44" numeral was clipped by its line box | V01 still | line-height 0.82→1.0 |
| 10 | a stray word was wrong in a source line («UN-RECOGNISED SOVEREIGN STATES») | reading the still | corrected to «SOVEREIGN STATES» |

## 7. What is deliberately *not* here
- No MapLibre/WebGL: the whole film is SVG + one `<img>` per plate. Deterministic, and it renders on two CPU cores.
- No burned-in captions (see `NARRATION.md`).
- No stock music or SFX (see `SOURCES.md`).
