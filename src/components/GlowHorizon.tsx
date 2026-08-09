/**
 * GlowHorizon — the warm light rising from behind the page.
 *
 * Four things separate this from a coloured blob, all of them learned the hard
 * way on this screen:
 *
 *  1. FALLOFF. Real light dies fast — close to inverse-square — so the stops
 *     step down hard (1 → .62 → .3 → .12 → .04 → 0) rather than evenly. An even
 *     ramp is exactly what fog looks like, and it was the main reason this read
 *     as cheap.
 *
 *  2. HUE RAMP. Light runs hot to cold: blown-out white core, hot yellow, then
 *     orange, then deep amber, then nothing. One hue at falling alpha is a
 *     tint, not a light source.
 *
 *  3. SMALL AND BRIGHT, NOT BIG AND FAINT. Low-opacity orange spread across
 *     half the screen does not glow, it turns the page brown and every button
 *     ends up on mud. The light is confined to a tight band at the crown and
 *     driven hard; the inner light is CLIPPED to the body so it stops dead at
 *     the rim instead of bleeding down the page. That clip is what keeps the
 *     background properly black and gives the contrast.
 *
 *  4. THE RIM IS TWO STROKES. A single hairline reads as a drawn line. A wide
 *     soft stroke under a thin bright one reads as an edge that is emitting.
 *     Both are graded vertically, because a lit edge is brightest where the
 *     light is behind it and gone once the curve turns away.
 *
 * The radius is deliberate: at width × 0.7 the crown domes and the arc visibly
 * falls to the screen edges. Flatter than that and it stops being a body and
 * becomes a slack line across the page.
 */
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { colors, useResolvedScheme } from '../theme';

/** Rim passes: widest and faintest first, ending on a thin bright core. */
const RIM = [
  { w: 34, o: 0.05 },
  { w: 22, o: 0.08 },
  { w: 13, o: 0.13 },
  { w: 7, o: 0.22 },
  { w: 3.4, o: 0.42 },
  { w: 1.4, o: 0.92 },
];

export function GlowHorizon({
  width,
  height,
  /** Where the crown sits, as a fraction of height. */
  horizon = 0.56,
  /** Overall strength, for screens that want a whisper of the same light. */
  intensity = 1,
}: {
  width: number;
  height: number;
  horizon?: number;
  intensity?: number;
}) {
  const scheme = useResolvedScheme();

  /**
   * A slow breathe. Only the wrapper's opacity moves, so no geometry shifts and
   * the rim never appears to wobble.
   *
   * This is a ping-pong on a 0..1 driver rather than a sequence of two timings.
   * The sequence version dimmed smoothly and then SNAPPED back to full at the
   * repeat boundary, measured as a jump from 141 to 156 in a single frame,
   * which is the mechanical flicker the effect is meant to avoid. Reversing a
   * single timing has no boundary to snap at.
   */
  const breath = useSharedValue(0);
  const [still, setStill] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => alive && setStill(on))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setStill);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (still) {
      breath.value = 0;
      return;
    }
    breath.value = withRepeat(
      withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [breath, still]);

  // A tenth of the range: enough to feel alive, not enough to notice as motion.
  const breathing = useAnimatedStyle(() => ({ opacity: 1 - breath.value * 0.1 }));

  if (width <= 0 || height <= 0) return null;

  const cx = width / 2;
  const crown = height * horizon;
  const r = width * 0.7;
  const cy = crown + r;
  const a = (v: number) => Math.max(0, Math.min(1, v * intensity));

  if (scheme === 'light') {
    return (
      <Animated.View pointerEvents="none" style={[styles.fill, breathing]}>
        <Svg width={width} height={height}>
          <Defs>
            {/* Pigment, not light. You cannot get brighter than white, which
                is why a glow dies on a pale page. So this is a body catching
                the sun: strongest right at the crown and falling away down the
                curve, gone by the sign-in block so the buttons and the fine
                print stay on clean paper. A pale even wash had no value range
                and read as a stain. */}
            <LinearGradient
              id="gh-l-body"
              x1={0}
              y1={crown}
              x2={0}
              y2={crown + height * 0.42}
              gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#F97008" stopOpacity={a(0.95)} />
              <Stop offset="0.07" stopColor="#FF8A24" stopOpacity={a(0.82)} />
              <Stop offset="0.2" stopColor="#FFA24C" stopOpacity={a(0.55)} />
              <Stop offset="0.42" stopColor="#FFBA7A" stopOpacity={a(0.26)} />
              <Stop offset="0.72" stopColor="#FFCFA0" stopOpacity={a(0.07)} />
              <Stop offset="1" stopColor="#FFCFA0" stopOpacity={0} />
            </LinearGradient>

            {/* The crisp edge is what makes it deliberate. Without it the wash
                is a stain; with it, it is a body sitting behind the page. */}
            <LinearGradient
              id="gh-l-rim"
              x1={0}
              y1={crown}
              x2={0}
              y2={crown + r * 0.55}
              gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#E2670A" stopOpacity={a(0.85)} />
              <Stop offset="0.35" stopColor="#E2670A" stopOpacity={a(0.32)} />
              <Stop offset="1" stopColor="#E2670A" stopOpacity={0} />
            </LinearGradient>

            {/* A breath of warmth on the paper above, so the edge is not pasted on. */}
            <RadialGradient id="gh-l-sky" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFAE5E" stopOpacity={a(0.3)} />
              <Stop offset="0.4" stopColor="#FFAE5E" stopOpacity={a(0.1)} />
              <Stop offset="1" stopColor="#FFAE5E" stopOpacity={0} />
            </RadialGradient>
          </Defs>

          <Ellipse cx={cx} cy={crown} rx={width * 0.78} ry={height * 0.15} fill="url(#gh-l-sky)" />
          <Circle cx={cx} cy={cy} r={r} fill="url(#gh-l-body)" />
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#gh-l-rim)" strokeWidth={1.5} />
        </Svg>
      </Animated.View>
    );
  }

  return (
    <Animated.View pointerEvents="none" style={[styles.fill, breathing]}>
      <Svg width={width} height={height}>
        <Defs>
          <ClipPath id="gh-body">
            <Circle cx={cx} cy={cy} r={r} />
          </ClipPath>

          {/* Open sky. Hot core, fast decay, hue walking white to yellow to
              amber. More stops than look necessary: the extra ones are what
              stop the falloff banding into visible steps. */}
          <RadialGradient id="gh-bloom" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={a(0.95)} />
            <Stop offset="0.04" stopColor="#FFD489" stopOpacity={a(0.9)} />
            <Stop offset="0.1" stopColor="#FFA22A" stopOpacity={a(0.82)} />
            <Stop offset="0.2" stopColor="#FF7A05" stopOpacity={a(0.6)} />
            <Stop offset="0.34" stopColor="#F55E00" stopOpacity={a(0.36)} />
            <Stop offset="0.52" stopColor="#D94400" stopOpacity={a(0.18)} />
            <Stop offset="0.72" stopColor="#B03200" stopOpacity={a(0.07)} />
            <Stop offset="1" stopColor="#8A2400" stopOpacity={0} />
          </RadialGradient>

          {/* Inside the body. Deliberately the SAME intensity as the bloom at
              the crown: the inner light is clipped at the rim and the bloom is
              not, so any mismatch shows up as a seam running along the arc. */}
          <RadialGradient id="gh-inner" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={a(0.95)} />
            <Stop offset="0.05" stopColor="#FFC46A" stopOpacity={a(0.86)} />
            <Stop offset="0.13" stopColor="#FF8E12" stopOpacity={a(0.66)} />
            <Stop offset="0.26" stopColor="#FF6A00" stopOpacity={a(0.42)} />
            <Stop offset="0.44" stopColor="#E24C00" stopOpacity={a(0.2)} />
            <Stop offset="0.66" stopColor="#B83400" stopOpacity={a(0.07)} />
            <Stop offset="1" stopColor="#8A2400" stopOpacity={0} />
          </RadialGradient>

          {/* Blown out at the very centre, and SMALL. Measured on the previous
              build, saturation across the whole bright band sat between 0.08
              and 0.34 and only passed 0.8 where value had fallen to 0.2: all
              the brightness was white and all the colour was dark, which is
              exactly what reads as flat. The white is now a highlight rather
              than the subject, and the ramp reaches saturated orange within a
              tenth of the radius. */}
          <RadialGradient id="gh-core" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={a(1)} />
            <Stop offset="0.22" stopColor="#FFE0A6" stopOpacity={a(0.62)} />
            <Stop offset="0.5" stopColor="#FFA630" stopOpacity={a(0.3)} />
            <Stop offset="1" stopColor="#FF7A05" stopOpacity={0} />
          </RadialGradient>

          {/* The span is set against the geometry, not by eye: at r = width
              x 0.7 the arc has dropped about 82px by the time it reaches the
              screen edge, so fading over ~82px is what makes the limb go out
              at the edges instead of running off as a bright line. */}
          <LinearGradient
            id="gh-rim"
            x1={0}
            y1={crown}
            x2={0}
            y2={crown + r * 0.3}
            gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="0.05" stopColor="#FFCE7A" stopOpacity={0.95} />
            <Stop offset="0.14" stopColor="#FF9316" stopOpacity={0.8} />
            <Stop offset="0.3" stopColor="#FF6A00" stopOpacity={0.5} />
            <Stop offset="0.55" stopColor="#DC4600" stopOpacity={0.2} />
            <Stop offset="1" stopColor="#A82C00" stopOpacity={0} />
          </LinearGradient>

        </Defs>

        <Ellipse cx={cx} cy={crown} rx={width * 0.72} ry={height * 0.2} fill="url(#gh-bloom)" />

        <G clipPath="url(#gh-body)">
          <Ellipse cx={cx} cy={crown} rx={width * 0.7} ry={height * 0.15} fill="url(#gh-inner)" />
        </G>

        {/* The rim as a STACK, widest and faintest first. Each pass shares one
            gradient and only differs in width and opacity, which builds a
            falloff perpendicular to the arc. That perpendicular softness is
            what a blur would give and what a single stroke cannot: one crisp
            line always reads as drawn, however well it is graded along its
            length. */}
        {RIM.map(({ w, o }) => (
          <Circle
            key={w}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="url(#gh-rim)"
            strokeWidth={w}
            strokeOpacity={a(o)}
          />
        ))}

        <Ellipse cx={cx} cy={crown} rx={width * 0.13} ry={height * 0.02} fill="url(#gh-core)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
