/**
 * FilterChips — horizontal pill row (reference: My Plans / Find Plans /
 * Saved / Completed). Selected chip = filled white with dark text;
 * the rest are dark fills (or outline variant for secondary rows).
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing } from '../theme';

type Props = {
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
  /** "filled" = reference primary row; "outline" = secondary row (New / Popular…). */
  variant?: 'filled' | 'outline';
};

export function FilterChips({ options, selected, onSelect, variant = 'filled' }: Props) {
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

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.gutter, gap: 8 },
  chip: {
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  text: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
  textActive: { color: colors.onAccent },
});
