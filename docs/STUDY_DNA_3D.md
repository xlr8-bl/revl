# Study DNA in 3D — why not Three.js, and what we do instead

The Study DNA constellation is the app's signature visual, and 3D is
tempting. The question was whether to run Three.js (via
react-three-fiber + expo-gl) inside Expo. The answer, for THIS audience,
is no. This is the decision record.

## Who actually uses the app

Most University of Buea and HND students are on entry-level Android —
iTel, Tecno, Infinix — commonly 1–3 GB RAM with Mali-G52/G57-class or
older GPUs. The app has to be smooth and safe on *those* phones, not on a
developer's iPhone. That constraint decides everything here.

## Why Three.js / expo-gl was rejected

1. **It breaks on real devices while working on web.** react-three-fiber's
   native renderer runs on `expo-gl`, and there is a hard version conflict
   — recent Expo SDKs ship a newer `expo-gl` than r3f's native path pins,
   and the mismatch surfaces as crashes on physical devices even though
   the web build looks fine. That's the worst possible failure mode: it
   passes our testing and dies on a student's Tecno.
2. **ExpoGL performance is a known problem**, and the r3f team is steering
   new work toward WebGPU — which entry-level Mali/PowerVR GPUs on these
   phones don't support. We'd be building on a path that's being
   deprecated for exactly our hardware.
3. **A live GL context is heavy**: real memory, real battery, real heat on
   a 2 GB phone. For a mostly-static star map, that cost buys almost
   nothing.

## What we do instead (shipped)

Depth without a 3D engine, using tools already in the app
(`react-native-svg` + `react-native-reanimated`):

- **Two parallax layers.** A faint far starfield and the near
  constellation are separate SVG layers that drift at different rates on a
  single looping shared value. Different-rate motion between layers is
  what the eye reads as depth — the core parallax trick, at a fraction of
  the cost.
- **UI-thread transform only.** The drift is one Reanimated shared value
  animating a container `translate`; there is no per-frame JavaScript and
  no per-star work. This is GPU-composited and stays smooth on low-end
  Android.
- **Stars keep data-driven depth.** Size scales with how often you've
  engaged a topic and brightness with mastery, so "closer/brighter" is
  meaningful, not decorative.
- **Correctness preserved.** Stars and their prerequisite edges live in the
  same layer, so they always stay aligned as the sky drifts.

## If we ever do want true 3D

The upgrade path is **Skia** (`@shopify/react-native-skia`), not GL:
Skia is hardware-accelerated 2D/2.5D that performs well on low-end
Android, can do the constellation with real glow, blur and depth-of-field,
and degrades gracefully. It would be a considered addition with on-device
profiling on an actual iTel/Tecno before shipping — never a dependency we
turn on blind. Full WebGL/Three.js stays off the table for this user base.
