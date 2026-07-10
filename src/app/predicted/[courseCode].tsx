/**
 * Predicted paper — later-phase placeholder. Per course: the most-likely
 * exam this session, with a confidence score per question. The route and
 * layout exist now; the prediction engine plugs in behind this screen.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { appConfig } from '../../data/config';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../../theme';

/** Mock predicted questions with per-question confidence. */
const MOCK_PREDICTIONS = [
  { id: 'p1', text: 'Compute information gain for a categorical split', confidence: 0.86 },
  { id: 'p2', text: 'Apriori: frequent itemsets + one rule confidence', confidence: 0.78 },
  { id: 'p3', text: 'Precision / recall / F1 from a confusion matrix', confidence: 0.71 },
  { id: 'p4', text: 'Compare single vs complete linkage clustering', confidence: 0.55 },
  { id: 'p5', text: 'k-means limitations and choice of k', confidence: 0.43 },
];

export default function PredictedPaperScreen() {
  useThemeVersion();
  const { courseCode } = useLocalSearchParams<{ courseCode: string }>();

  return (
    <View style={styles.root}>
      <ScreenHeader title="Predicted paper" />
      <ScrollView contentContainerStyle={{ padding: spacing.gutter, paddingBottom: 60 }}>
        <View style={styles.badge}>
          <Ionicons name="telescope-outline" size={13} color={colors.accent} />
          <Text style={styles.badgeText}>EXPERIMENTAL · COMING SOON</Text>
        </View>
        <Text style={styles.title}>{courseCode} — most likely this session</Text>
        <Text style={styles.body}>
          Built from {new Date(appConfig.semesterEndDate).getFullYear() - 2018}+ years of past papers: topic cycles,
          examiner patterns, and what hasn’t appeared recently. Each line carries its own confidence.
        </Text>

        {MOCK_PREDICTIONS.map((p, i) => (
          <View key={p.id} style={styles.row}>
            <Text style={styles.rowNum}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>{p.text}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${p.confidence * 100}%` }]} />
              </View>
            </View>
            <Text style={styles.rowPct}>{Math.round(p.confidence * 100)}%</Text>
          </View>
        ))}

        <Text style={styles.disclaimer}>
          Predictions resolve after the exam — correct calls earn contributors ⚡ credits.
        </Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1, color: colors.accent },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.text, marginTop: 14 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginTop: 8, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 },
  rowNum: { fontFamily: fonts.bold, fontSize: 15, color: colors.textSecondary, width: 18 },
  rowText: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  barTrack: { height: 4, borderRadius: 2, backgroundColor: colors.surface, marginTop: 8, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
  rowPct: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary, width: 42, textAlign: 'right' },
  disclaimer: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.textTertiary, marginTop: 20 },
});
const styles = themedStyleSheet(makeStyles);
