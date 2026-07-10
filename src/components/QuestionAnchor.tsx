/**
 * QuestionAnchor — the referenced exam question rendered inside a post.
 *
 * It is the SAME card the student sees in the paper reader — square
 * amber frame, Q-number header, marks, serif text. The card body is
 * NOT tappable, so a double-tap over it still likes the post; only the
 * explicit "Go to question" link navigates into the paper.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { findQuestion } from '../lib/selectors';
import { type QuestionRef } from '../lib/communityStore';
import { colors, fonts } from '../theme';
import { MathRichText } from './MathRichText';

export function QuestionAnchor({ refr, courseCode }: { refr: QuestionRef; courseCode: string }) {
  const router = useRouter();
  const found = findQuestion(refr.questionId);
  if (!found) return null;
  const { question, paperId } = found;

  return (
    <View style={styles.card}>
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

      {/* The ONLY tap target that navigates. */}
      <Pressable
        onPress={() => router.push({ pathname: '/paper/[id]', params: { id: paperId, q: refr.questionId } })}
        hitSlop={8}
        style={({ pressed }) => [styles.goRow, pressed && { opacity: 0.6 }]}>
        <Text style={styles.goText}>Go to question ›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    // Square corners: reads as a sheet of paper pinned into the post.
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(242,169,59,0.38)',
    padding: 16,
    marginTop: 12,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  number: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  course: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  marks: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  goRow: { alignSelf: 'flex-end', marginTop: 12, paddingVertical: 4, paddingLeft: 20 },
  goText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.accent },
});
