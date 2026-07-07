/**
 * HeroCard — "Tonight's question" as a set exam paper: flat ink card,
 * hairline border, course line with a marks tag, the question in serif,
 * a rule, then attempt stats and a plain amber Attempt button.
 * No gradients, no icons.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { questionOfTheDay } from '../data/home';
import { colors, fonts, radius, spacing, type } from '../theme';
import { MathRichText } from './MathRichText';

export function HeroCard() {
  const router = useRouter();
  const { sourceLine, question, stats } = questionOfTheDay;

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Tonight's question</Text>

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
          <Text style={styles.statLine}>
            <Text style={styles.statStrong}>{stats.reveals}</Text> attempts tonight
          </Text>
          <Text style={styles.statLine}>
            <Text style={styles.statStrong}>38%</Text> got it before revealing
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/paper/cec420-2023')}
          style={({ pressed }) => [styles.attemptBtn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.attemptText}>Attempt</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  statLine: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  statStrong: { fontFamily: fonts.medium, color: colors.text },
  attemptBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  attemptText: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.onAccent },
});
