/**
 * HeroCard — "Tonight's Question". Rendered as an exam-paper artifact:
 * hairline-bordered ink card, course chip + amber marks pill, the
 * question set in serif (the paper's voice), a faint amber lamp-glow in
 * the corner, and a stats line + Reveal CTA instead of any social row.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
      {/* Faint amber desk-lamp glow, top corner — Revl's signature. */}
      <LinearGradient
        colors={['rgba(242,169,59,0.14)', 'rgba(242,169,59,0.03)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.25, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.inner}>
        <Text style={type.kicker}>Tonight’s question</Text>

        {/* Paper header row: source + marks pill */}
        <View style={styles.headerRow}>
          <Text style={styles.source}>{sourceLine}</Text>
          <View style={styles.marksPill}>
            <Text style={styles.marksText}>{question.marks} MARKS</Text>
          </View>
        </View>

        {/* The question — serif, the voice of the paper. */}
        <View style={styles.questionWrap}>
          <MathRichText style={{ ...type.question }}>{question.text}</MathRichText>
        </View>

        <View style={styles.rule} />

        {/* Attempt stats + Reveal CTA — study data, not social counts. */}
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
            style={({ pressed }) => [styles.revealBtn, pressed && { transform: [{ scale: 0.96 }] }]}>
            <Ionicons name="flash" size={15} color={colors.onAccent} />
            <Text style={styles.revealText}>Attempt</Text>
          </Pressable>
        </View>
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
    overflow: 'hidden',
  },
  inner: { padding: spacing.cardPad, paddingTop: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  source: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, flex: 1, paddingRight: 10 },
  marksPill: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  marksText: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1, color: colors.accent },
  questionWrap: { marginTop: 20, marginBottom: 22 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 14 },
  statLine: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  statStrong: { fontFamily: fonts.medium, color: colors.text },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  revealText: { fontFamily: fonts.medium, fontSize: 14, color: colors.onAccent },
});
