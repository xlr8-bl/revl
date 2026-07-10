/** Rating as plain text: "4.8" with a single star mark. No icon rows. */
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts, themedStyleSheet } from '../theme';

export function Stars({ rating }: { rating: number; size?: number }) {
  return (
    <Text style={styles.text}>
      {rating.toFixed(1)} <Text style={styles.star}>★</Text>
    </Text>
  );
}

const makeStyles = () => StyleSheet.create({
  text: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  star: { color: colors.accent, fontSize: 12 },
});
const styles = themedStyleSheet(makeStyles);
