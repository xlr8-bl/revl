/**
 * CreditMark — Revl's own credit symbol. A stamped coin: hairline
 * circle, the amber tick through its center, and a notch at twelve
 * o'clock. Drawn as SVG; no icon font, no emoji.
 */
import React from 'react';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { colors } from '../theme';

export function CreditMark({ size = 16, color = colors.accent }: { size?: number; color?: string }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Circle cx={10} cy={10} r={8.5} stroke={color} strokeWidth={1.4} fill="none" />
      {/* the tick, Revl's recurring mark */}
      <Rect x={5.5} y={9} width={9} height={2} rx={1} fill={color} />
      {/* minting notch */}
      <Line x1={10} y1={1.5} x2={10} y2={4} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}
