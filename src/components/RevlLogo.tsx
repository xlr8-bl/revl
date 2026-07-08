/**
 * RevlLogo — the brand mark. An exam sheet with a folded corner and the
 * amber tick stamped across it: "the paper, marked". Pure SVG.
 */
import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

export function RevlLogo({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      {/* sheet */}
      <Path
        d="M14 6 h20 l10 10 v34 a2.5 2.5 0 0 1 -2.5 2.5 h-27.5 a2.5 2.5 0 0 1 -2.5 -2.5 v-41.5 a2.5 2.5 0 0 1 2.5 -2.5 z"
        stroke={colors.text}
        strokeWidth={2.4}
        fill="none"
        strokeLinejoin="round"
      />
      {/* folded corner */}
      <Path d="M34 6 v10 h10" stroke={colors.text} strokeWidth={2.4} fill="none" strokeLinejoin="round" />
      {/* faint rule lines */}
      <Rect x={19} y={24} width={18} height={2} rx={1} fill={colors.textTertiary} />
      <Rect x={19} y={31} width={12} height={2} rx={1} fill={colors.textTertiary} />
      {/* the amber tick, stamped across the sheet */}
      <Path
        d="M17 41 l6 6 l16 -16"
        stroke={colors.accent}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
