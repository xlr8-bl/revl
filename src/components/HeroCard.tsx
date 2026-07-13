/**
 * HeroCard — "Tonight's question" as a set exam paper: flat ink card,
 * hairline border, course line with a marks tag, the question in serif,
 * a rule, then the honest reason it was picked and a plain amber Attempt
 * button. The pick comes from the real per-student selector
 * (lib/questionOfTheDay) — enrolled courses, weighted by weak topics,
 * rotating daily. No gradients, no icons, no invented stats.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { planWord } from '../lib/greeting';
import { useQuestionOfTheDay } from '../lib/questionOfTheDay';
import { useRevealLogs } from '../lib/selectors';
import { useSession } from '../lib/session';
import { colors, fonts, radius, spacing, type, themedStyleSheet, useThemeVersion } from '../theme';
import { MathRichText } from './MathRichText';

export function HeroCard() {
  useThemeVersion();
  const router = useRouter();
  const { profile } = useSession();
  const logs = useRevealLogs();
  const pick = useQuestionOfTheDay(profile?.enrolledCourseCodes ?? [], logs);
  const when = planWord();

  if (!pick) return null;
  const { question, paper, sourceLine, reason } = pick;

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>{when === 'today' ? "Today's question" : "Tonight's question"}</Text>

      <View style={styles.headerRow}>
        <Text style={styles.source}>{sourceLine}</Text>
        <Text style={styles.marks}>{question.marks} marks</Text>
      </View>

      <View style={styles.questionWrap}>
        <MathRichText style={{ ...type.question }}>{question.text}</MathRichText>
      </View>

      <View style={styles.rule} />

      <View style={styles.footerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.statLine}>{reason}</Text>
          <Text style={styles.statSub}>Attempt it before you peek at the answer</Text>
        </View>
        <Pressable
          onPress={() => router.push(`/paper/${paper.id}`)}
          style={({ pressed }) => [styles.attemptBtn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.attemptText}>Attempt</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  card: {
    marginHorizontal: spacing.gutter,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    padding: spacing.cardPad,
  },
  kicker: { fontFamily: fonts.medium, fontSize: 13, color: colors.accent },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  source: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, flex: 1, paddingRight: 10 },
  marks: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  questionWrap: { marginTop: 18, marginBottom: 20 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 14 },
  statLine: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.text },
  statSub: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary, marginTop: 2 },
  attemptBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  attemptText: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.onAccent },
});
const styles = themedStyleSheet(makeStyles);
