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
import React from 'react';
import { StyleSheet, View } from 'react-native';
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
  if (width <= 0 || height <= 0) return null;

  const cx = width / 2;
  const crown = height * horizon;
  const r = width * 0.7;
  const cy = crown + r;
  const a = (v: number) => Math.max(0, Math.min(1, v * intensity));

  if (scheme === 'light') {
    return (
      <View pointerEvents="none" style={styles.fill}>
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
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={styles.fill}>
      <Svg width={width} height={height}>
        <Defs>
          <ClipPath id="gh-body">
            <Circle cx={cx} cy={cy} r={r} />
          </ClipPath>

          {/* Open sky. Hot core, fast decay, hue walking white to yellow to
              amber. More stops than look necessary: the extra ones are what
              stop the falloff banding into visible steps. */}
          <RadialGradient id="gh-bloom" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={a(0.8)} />
            <Stop offset="0.07" stopColor="#FFF2D2" stopOpacity={a(0.66)} />
            <Stop offset="0.15" stopColor={colors.glowCore} stopOpacity={a(0.46)} />
            <Stop offset="0.26" stopColor="#FF9A2E" stopOpacity={a(0.28)} />
            <Stop offset="0.42" stopColor={colors.glow} stopOpacity={a(0.14)} />
            <Stop offset="0.6" stopColor={colors.glow} stopOpacity={a(0.06)} />
            <Stop offset="0.8" stopColor={colors.glow} stopOpacity={a(0.02)} />
            <Stop offset="1" stopColor={colors.glow} stopOpacity={0} />
          </RadialGradient>

          {/* Inside the body. Deliberately the SAME intensity as the bloom at
              the crown: the inner light is clipped at the rim and the bloom is
              not, so any mismatch shows up as a seam running along the arc. */}
          <RadialGradient id="gh-inner" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={a(0.8)} />
            <Stop offset="0.08" stopColor={colors.glowCore} stopOpacity={a(0.5)} />
            <Stop offset="0.2" stopColor="#FF9A2E" stopOpacity={a(0.3)} />
            <Stop offset="0.4" stopColor={colors.glow} stopOpacity={a(0.13)} />
            <Stop offset="0.62" stopColor={colors.glow} stopOpacity={a(0.05)} />
            <Stop offset="0.85" stopColor={colors.glow} stopOpacity={a(0.01)} />
            <Stop offset="1" stopColor={colors.glow} stopOpacity={0} />
          </RadialGradient>

          {/* Blown out at the very centre. Small, or it stops being a highlight. */}
          <RadialGradient id="gh-core" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={a(0.95)} />
            <Stop offset="0.18" stopColor="#FFF1D6" stopOpacity={a(0.7)} />
            <Stop offset="0.45" stopColor={colors.glowCore} stopOpacity={a(0.28)} />
            <Stop offset="1" stopColor={colors.glow} stopOpacity={0} />
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
            <Stop offset="0.06" stopColor="#FFF0CC" stopOpacity={0.9} />
            <Stop offset="0.16" stopColor={colors.glowRim} stopOpacity={0.62} />
            <Stop offset="0.34" stopColor="#FF8A1F" stopOpacity={0.3} />
            <Stop offset="0.58" stopColor={colors.glow} stopOpacity={0.1} />
            <Stop offset="1" stopColor={colors.glow} stopOpacity={0} />
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

        <Ellipse cx={cx} cy={crown} rx={width * 0.19} ry={height * 0.032} fill="url(#gh-core)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
