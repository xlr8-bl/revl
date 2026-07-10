/**
 * DailyBriefing — one small AI call turns the raw Study DNA tallies into
 * a human line above the daily session. Shows the honest early state
 * ("Still learning how you think…") until there's enough data.
 * Text is mocked in data/ai.ts until the API is wired.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getDailyBriefing } from '../data/ai';
import { useRevealLogs } from '../lib/selectors';
import { colors, fonts, spacing, themedStyleSheet } from '../theme';

/** Below this many logged reveals we show the honest "still learning" state. */
const MIN_DATA = 8;

export function DailyBriefing() {
  const logs = useRevealLogs();
  const text = getDailyBriefing(logs.length >= MIN_DATA);

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
