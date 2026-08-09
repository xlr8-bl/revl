/**
 * GlowHorizon — the warm light rising from behind the page.
 *
 * A body far wider than the screen sits just below the fold with its crown
 * showing, lit along that crown and falling away into the background. Above it
 * the light blooms out into open space. It is the app's one piece of
 * atmosphere, and everything else stays flat so this can carry the mood.
 *
 * Both themes run the same construction, at different strengths: dark takes a
 * crisp bright rim over near-black, light takes a soft bloom and only a whisper
 * of an edge, because a hard line on white reads as a border rather than light.
 * Strengths come from the palette (`glow`, `glowRim`), so a theme change moves
 * the atmosphere with it.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

export function GlowHorizon({
  width,
  height,
  /** Where the crown sits, as a fraction of height. */
  horizon = 0.52,
}: {
  width: number;
  height: number;
  horizon?: number;
}) {
  if (width <= 0 || height <= 0) return null;

  const cx = width / 2;
  const y = height * horizon;
  const r = width * 1.25; // wide enough that the curve reads as a horizon
  const cy = y + r;

  return (
    <View pointerEvents="none" style={styles.fill}>
      <Svg width={width} height={height}>
        <Defs>
          {/* Open-space bloom, centred on the crown. */}
          <RadialGradient id="halo" cx={cx} cy={y} r={width * 0.66} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.glow} stopOpacity={0.5} />
            <Stop offset="0.42" stopColor={colors.glow} stopOpacity={0.16} />
            <Stop offset="1" stopColor={colors.glow} stopOpacity={0} />
          </RadialGradient>
          {/* Inside the body: hot at the crown, gone a third of the way down. */}
          <RadialGradient id="body" cx={cx} cy={y} r={r * 0.30} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.glow} stopOpacity={0.9} />
            <Stop offset="0.3" stopColor={colors.glow} stopOpacity={0.28} />
            <Stop offset="1" stopColor={colors.glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Circle cx={cx} cy={y} r={width * 0.66} fill="url(#halo)" />
        <Circle cx={cx} cy={cy} r={r} fill="url(#body)" />
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.glowRim} strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
