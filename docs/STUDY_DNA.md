# Study DNA — the calibration concept

## The problem with the old version

The first Study DNA was a "constellation" star map. It looked unique, but
nobody — not even us — could read it. A pretty scatter of stars doesn't
tell a student what to *do* tonight. Complexity we don't understand is
worse than simplicity we do.

## The idea (one sentence)

**Study DNA shows the gap between what you FEEL you know and what you
ACTUALLY know, per topic — and the gap is the whole point.**

Two strands, like DNA:

- **Feel** — how confident you were *before* you revealed each answer.
- **Know** — whether you *actually* got it right.

Both already come from Revl's core loop (you say "could I answer this?"
before revealing, then "got it / not yet" after). No new input, no model,
no black box — just counting.

## Why it's genuinely novel

Every exam-prep app shows you scores: percentages, streaks, mastery bars.
None shows you your **calibration** — whether your self-belief matches
reality. That gap is exactly what blindsides students in the exam hall
("I was *sure* I knew that one"). Surfacing metacognitive calibration as
the headline feature is, as far as we can find, not done anywhere in this
space. And it's dead simple to read.

## How a row works

Each topic is a track from 0→100% with two markers:

- a hollow ring = **feel ready**
- a filled dot = **actually ready**
- a coloured bar spanning the distance = **the gap**

Rows are sorted by biggest gap first, so your worst blind spot is at the
top. Each row is banded:

| Band | Condition | Meaning |
|---|---|---|
| **Blind spot** | feel − know > 0.15 | Dangerous: confident but wrong. Fix first. |
| **Underrated** | know − feel > 0.15 | You're better than you think — trust it, save time. |
| **Solid** | aligned, know ≥ 60% | Calibrated and strong. |
| **Working on it** | aligned, know < 60% | Honestly weak, and you know it — no surprise waiting. |

The headline counts your blind spots and names the worst one. Below the
strands, one concrete thing to beat: your nemesis question, deep-linked.

## Implementation

- `src/lib/selectors.ts` → `calibrationByTopic(logs)`: felt (confidence,
  yes=1/sort-of=0.5/no=0, averaged) vs actual (got-it share), per tag.
- `src/app/dna.tsx`: renders the strands as plain Views with
  percentage-positioned markers — **no SVG, no GL**, so it's effectively
  free on entry-level Android (iTel/Tecno). Honest cold state until ~4
  reveals exist.

## On 3D (kept for the record)

We considered a true-3D Study DNA (Three.js via react-three-fiber +
expo-gl) and rejected it for this audience: the native GL path has a hard
version conflict that crashes on real devices while working on web, and
ExpoGL performance is poor on the entry-level Mali/PowerVR GPUs most
students carry. If we ever want richer depth, the path is **Skia**
(`@shopify/react-native-skia`), profiled on a real iTel/Tecno first — never
WebGL. The calibration design needs none of that: it's stronger *because*
it's legible, not because it's flashy.
