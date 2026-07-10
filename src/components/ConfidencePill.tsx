/**
 * ConfidencePill — the pre-reveal one-tap confidence check:
 * "Could you answer this? — Yes / Sort of / No".
 * The choice is logged as `confidence_before` in the RevealLog.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RevealLog } from '../types';
import { colors, fonts, themedStyleSheet, useThemeVersion } from '../theme';

type Confidence = RevealLog['confidenceBefore'];

const OPTIONS: { value: Confidence; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'sort-of', label: 'Sort of' },
  { value: 'no', label: 'No' },
];

type Props = {
  value: Confidence | null;
  onSelect: (v: Confidence) => void;
};

export function ConfidencePill({ value, onSelect }: Props) {
  useThemeVersion();
  return (
    <View style={styles.wrap}>
      <Text style={styles.prompt}>Could you answer this?</Text>
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              style={[styles.pill, active && styles.pillActive]}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 6,
    paddingLeft: 16,
    paddingRight: 6,
  },
  prompt: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, flexShrink: 1 },
  row: { flexDirection: 'row', gap: 4 },
  pill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  pillActive: { backgroundColor: colors.accent },
  pillText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  pillTextActive: { color: colors.onAccent },
});
const styles = themedStyleSheet(makeStyles);
