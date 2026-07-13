/**
 * CreditMark — the Revl coin. A minted piece, not an icon-font glyph:
 * solid accent body, milled edge (the dashed ring just inside the rim),
 * a bold R monogram struck in the centre, and a shine arc catching the
 * top-left — reads as currency at any size.
 */
import React from 'react';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { colors, withAlpha } from '../theme';

export function CreditMark({ size = 16, color = colors.accent }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* coin body */}
      <Circle cx={12} cy={12} r={11} fill={color} />
      {/* milled edge */}
      <Circle
        cx={12}
        cy={12}
        r={9.4}
        stroke={withAlpha('#FFFFFF', 0.45)}
        strokeWidth={1.1}
        strokeDasharray="1.5 2.1"
        fill="none"
      />
      {/* struck monogram */}
      <SvgText
        x={12}
        y={16.4}
        textAnchor="middle"
        fontSize={12.5}
        fontWeight="800"
        fill={colors.onAccent}>
        R
      </SvgText>
      {/* shine */}
      <Path
        d="M4.8 8.6 A9.6 9.6 0 0 1 8.4 4.9"
        stroke={withAlpha('#FFFFFF', 0.6)}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
