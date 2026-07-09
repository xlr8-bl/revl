/**
 * QuestionAnchor — the referenced exam question rendered inside a post.
 *
 * Deliberately the SAME card the student sees in the paper reader —
 * same surface, same Q-number header, same type — so tapping it and
 * landing on the real question feels continuous. What makes it
 * distinctive in the feed is the amber frame and the "Open in paper"
 * affordance: a highlighted excerpt of the reader, not a foreign object.
 * The raise-hand demand row sits below, on the feed surface.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { findQuestion } from '../lib/selectors';
import { handsFor, raiseHand, useCommunity, type QuestionRef } from '../lib/communityStore';
import { colors, fonts, radius } from '../theme';
import { MathRichText } from './MathRichText';

export function QuestionAnchor({ refr, courseCode }: { refr: QuestionRef; courseCode: string }) {
  const router = useRouter();
  useCommunity(); // re-render when hands change
  const found = findQuestion(refr.questionId);
  if (!found) return null;
  const { question, paperId } = found;
  const wanted = handsFor(refr.questionId);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => router.push(`/paper/${paperId}?q=${refr.questionId}` as never)}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
        {/* Header row — same grammar as the reader's question card */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.number}>Q{question.number}</Text>
            <Text style={styles.course}>{courseCode}</Text>
          </View>
          <Text style={styles.marks}>{question.marks} marks</Text>
        </View>

        <MathRichText style={{ fontSize: 16, lineHeight: 25 }}>
          {question.text.length > 160 ? question.text.slice(0, 157) + '…' : question.text}
        </MathRichText>

        <Text style={styles.open}>Open in paper ›</Text>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(242,169,59,0.38)',
    padding: 16,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  number: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  course: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  marks: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  open: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.accent, textAlign: 'right', marginTop: 12 },
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
