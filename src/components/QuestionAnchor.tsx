/**
 * QuestionAnchor — the referenced exam question rendered inside a post:
 * course code · Qn · marks, the real question text in serif, the
 * raise-hand demand line, and a jump into the paper. This is what makes
 * the community question-anchored instead of a loose forum.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { findQuestion } from '../lib/selectors';
import { handsFor, raiseHand, useCommunity, type QuestionRef } from '../lib/communityStore';
import { colors, fonts } from '../theme';
import { MathRichText } from './MathRichText';

export function QuestionAnchor({ refr, courseCode }: { refr: QuestionRef; courseCode: string }) {
  const router = useRouter();
  useCommunity(); // re-render when hands change
  const found = findQuestion(refr.questionId);
  if (!found) return null;
  const { question } = found;
  const wanted = handsFor(refr.questionId);

  return (
    <View style={styles.anchor}>
      <View style={styles.headRow}>
        <Text style={styles.headText}>
          {courseCode} · Q{question.number} · {question.marks} marks
        </Text>
        <Pressable onPress={() => router.push(`/paper/${refr.paperId}`)} hitSlop={8}>
          <Text style={styles.open}>Open paper ›</Text>
        </Pressable>
      </View>
      <MathRichText style={{ fontFamily: fonts.serif, fontSize: 15.5, lineHeight: 23, color: colors.text }}>
        {question.text.length > 160 ? question.text.slice(0, 157) + '…' : question.text}
      </MathRichText>
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
  anchor: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 14,
    marginTop: 12,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headText: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.accent, letterSpacing: 0.4 },
  open: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textSecondary },
  handsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
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
