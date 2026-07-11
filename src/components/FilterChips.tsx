/**
 * FilterChips — horizontal pill row (reference: My Plans / Find Plans /
 * Saved / Completed). Selected chip = filled white with dark text;
 * the rest are dark fills (or outline variant for secondary rows).
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../theme';

type Props = {
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
  /** "filled" = reference primary row; "outline" = secondary row (New / Popular…). */
  variant?: 'filled' | 'outline';
};

export function FilterChips({ options, selected, onSelect, variant = 'filled' }: Props) {
  useThemeVersion();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {options.map((opt) => {
        const active = opt === selected;
        return (
          <Pressable
            key={opt}
            onPress={() => onSelect(opt)}
            style={[
              styles.chip,
              variant === 'outline' && styles.chipOutline,
              active && styles.chipActive,
            ]}>
            <Text style={[styles.text, active && styles.textActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = () => StyleSheet.create({
  // Fixed heights: the row must never re-measure taller when a chip is
  // pressed or the list re-renders (that reads as the header "growing").
  row: { paddingHorizontal: spacing.gutter, gap: 8, height: 40, alignItems: 'center' },
  chip: {
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 40,
    justifyContent: 'center',
  },
  chipOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  text: { fontFamily: fonts.medium, fontSize: 14.5, lineHeight: 18, color: colors.text },
  textActive: { color: colors.onAccent },
});
const styles = themedStyleSheet(makeStyles);
