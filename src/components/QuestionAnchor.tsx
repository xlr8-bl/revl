/**
 * QuestionAnchor — the referenced exam question rendered inside a post.
 *
 * It is the SAME card the student sees in the paper reader — same
 * surface, Q-number header, marks, and type — distinguished only by a
 * square amber frame and the "Open in paper" affordance, so tapping it
 * and landing on the real question feels continuous. Demand is shown
 * read-only here: raising a hand is now done by liking the post (♥).
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { findQuestion } from '../lib/selectors';
import { handsFor, useCommunity, type QuestionRef } from '../lib/communityStore';
import { colors, fonts } from '../theme';
import { MathRichText } from './MathRichText';

export function QuestionAnchor({
  refr,
  courseCode,
  postKind,
}: {
  refr: QuestionRef;
  courseCode: string;
  /** Tailors the demand hint: asks say "♥ to add your hand". */
  postKind?: 'ask' | 'solve';
}) {
  const router = useRouter();
  useCommunity(); // re-render when hands change
  const found = findQuestion(refr.questionId);
  if (!found) return null;
  const { question, paperId } = found;
  const wanted = handsFor(refr.questionId);

  const openInPaper = () =>
    router.push({ pathname: '/paper/[id]', params: { id: paperId, q: refr.questionId } });

  return (
    <View style={styles.wrap}>
      <Pressable onPress={openInPaper} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
        {/* Header — same grammar as the reader's question card */}
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

      {/* Read-only demand line */}
      <View style={styles.demandRow}>
        <Text style={styles.demandText}>
          {wanted && wanted.hands > 0
            ? `✋ ${wanted.hands} want this solved`
            : 'No hands raised yet'}
        </Text>
        {postKind === 'ask' && <Text style={styles.demandHint}>Tap ♥ to add your hand</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  card: {
    backgroundColor: colors.card,
    // Square corners: reads as a sheet of paper pinned into the post.
    borderRadius: 0,
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
  demandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  demandText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.accent },
  demandHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary },
});
