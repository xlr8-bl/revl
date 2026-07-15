/**
 * DailyBriefing — the "AI insight" line above the plan. The facts come
 * from a real reduction over the reveal log (lib/studyBriefing); it is not
 * a mock and not a live model call. See docs/AI_INSIGHT.md for where the
 * engine sits and what an LLM would (and wouldn't) do here.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRevealLogs } from '../lib/selectors';
import { buildBriefing } from '../lib/studyBriefing';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../theme';

export function DailyBriefing() {
  useThemeVersion();
  const logs = useRevealLogs();
  const text = buildBriefing(logs);

  return (
    <View style={styles.wrap}>
      <Ionicons name="sparkles" size={14} color={colors.ai} style={styles.icon} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: spacing.gutter,
    gap: 9,
    paddingHorizontal: 4,
  },
  icon: { marginTop: 3 },
  text: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textSecondary },
});
const styles = themedStyleSheet(makeStyles);
