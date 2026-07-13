/**
 * CreditMark — the Revl coin, drawn as an object instead of a glyph: a
 * slightly tilted disc with real thickness (the darker edge is the coin's
 * side, derived from the accent so both themes work), a thin inset ring on
 * the face, and a small R struck in the centre. No dashes, no shine arcs.
 */
import React from 'react';
import Svg, { Ellipse, G, Rect, Text as SvgText } from 'react-native-svg';
import { colors, mixColor } from '../theme';

export function CreditMark({ size = 16, color = colors.accent }: { size?: number; color?: string }) {
  // The side wall of the coin — accent pulled toward black.
  const edge = mixColor('#000000', color, 0.34);
  const ring = mixColor('#FFFFFF', color, 0.38);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G transform="rotate(-9 12 12)">
        {/* thickness: lower ellipse + the wall between the two equators */}
        <Ellipse cx={12} cy={13.4} rx={10} ry={7.6} fill={edge} />
        <Rect x={2} y={10.6} width={20} height={2.8} fill={edge} />
        {/* face */}
        <Ellipse cx={12} cy={10.6} rx={10} ry={7.6} fill={color} />
        {/* inset ring on the face */}
        <Ellipse cx={12} cy={10.6} rx={7.4} ry={5.5} stroke={ring} strokeWidth={0.9} fill="none" />
        {/* struck monogram */}
        <SvgText
          x={12}
          y={13.9}
          textAnchor="middle"
          fontSize={9.2}
          fontWeight="800"
          fill={colors.onAccent}>
          R
        </SvgText>
      </G>
    </Svg>
  );
}
