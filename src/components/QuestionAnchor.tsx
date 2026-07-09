/**
 * QuestionAnchor — the referenced exam question rendered inside a post.
 *
 * It renders as a piece of exam paper: cream stationery, dark serif
 * ink, a ruled header with code · Qn · marks. In a dark feed it reads
 * instantly as "the picture of the question", never as more post text.
 * The raise-hand demand row sits below the paper, back on the feed
 * surface, so the sheet stays pure exam content.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { findQuestion } from '../lib/selectors';
import { handsFor, raiseHand, useCommunity, type QuestionRef } from '../lib/communityStore';
import { colors, fonts } from '../theme';
import { MathRichText } from './MathRichText';

/** Exam-stationery palette: warm ivory paper, near-black ink. */
const PAPER = '#F2ECDF';
const INK = '#241E12';
const INK_SOFT = 'rgba(36,30,18,0.65)';
const INK_RULE = 'rgba(36,30,18,0.18)';

export function QuestionAnchor({ refr, courseCode }: { refr: QuestionRef; courseCode: string }) {
  const router = useRouter();
  useCommunity(); // re-render when hands change
  const found = findQuestion(refr.questionId);
  if (!found) return null;
  const { question } = found;
  const wanted = handsFor(refr.questionId);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => router.push(`/paper/${refr.paperId}`)}
        style={({ pressed }) => [styles.paper, pressed && { opacity: 0.92 }]}>
        <View style={styles.headRow}>
          <Text style={styles.headText}>
            {courseCode} · Q{question.number} · {question.marks} marks
          </Text>
          <Text style={styles.open}>Open paper ›</Text>
        </View>
        <View style={styles.headRule} />
        <MathRichText style={{ fontFamily: fonts.serif, fontSize: 15.5, lineHeight: 24, color: INK }}>
          {question.text.length > 160 ? question.text.slice(0, 157) + '…' : question.text}
        </MathRichText>
      </Pressable>

      <View style={styles.handsRow}>
        <Pressable
          onPress={() => raiseHand(refr, courseCode)}
          style={({ pressed }) => [styles.handBtn, wanted?.raisedByMe && styles.handBtnRaised, pressed && { opacity: 0.8 }]}>
          <Text style={[styles.handText, wanted?.raisedByMe && { color: colors.onAccent }]}>
            ✋ {wanted?.raisedByMe ? 'Hand raised' : 'Raise hand'}
          </Text>
        </Pressable>
        <Text style={styles.handsCount}>
          {wanted ? `${wanted.hands} want this solved` : 'Be the first to ask for a solution'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  paper: {
    backgroundColor: PAPER,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headText: { fontFamily: fonts.bold, fontSize: 12, color: INK_SOFT, letterSpacing: 0.6 },
  open: { fontFamily: fonts.medium, fontSize: 12.5, color: INK_SOFT },
  headRule: { height: StyleSheet.hairlineWidth, backgroundColor: INK_RULE, marginTop: 9, marginBottom: 11 },
  handsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  handBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  handBtnRaised: { backgroundColor: colors.accent },
  handText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.accent },
  handsCount: { flex: 1, fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary },
});
