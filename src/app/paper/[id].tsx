/**
 * PaperReader — renders a structured paper JSON as native components:
 * header with course/session metadata, instructions card, then one
 * QuestionBlock per question (each owning its own reveal loop).
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MathRichText } from '../../components/MathRichText';
import { QuestionBlock } from '../../components/QuestionBlock';
import { noteUploads } from '../../data/notes';
import { getPaper } from '../../data/papers';
import type { Question } from '../../types';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../../theme';

/** Is `target` this question or anywhere in its subtree? */
function containsQuestion(q: Question, target: string): boolean {
  return q.id === target || q.subQuestions.some((s) => containsQuestion(s, target));
}

export default function PaperReaderScreen() {
  useThemeVersion();
  // `q` deep-links to a question (e.g. from a Class post) — the reader
  // scrolls to it and frames it, so the feed card and the paper connect.
  const { id, q: targetQuestionId } = useLocalSearchParams<{ id: string; q?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const paper = getPaper(id);
  const scrollRef = useRef<ScrollView>(null);
  const scrolledToTarget = useRef(false);

  const targetTop =
    targetQuestionId && paper
      ? paper.questions.find((qq) => containsQuestion(qq, targetQuestionId))
      : undefined;

  if (!paper) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.metaText}>Paper not found.</Text>
      </View>
    );
  }

  // Notes grounding: does this student have indexed material for this course?
  const hasNotes = noteUploads.some((n) => n.courseCode === paper.courseCode && n.indexed);

  return (
    <View style={styles.root}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>
          {paper.courseCode} · {paper.year}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: spacing.gutter }}>
        {/* Paper header */}
        <Text style={styles.paperTitle}>{paper.title}</Text>
        <Text style={styles.metaText}>
          {paper.session} · {paper.semester} · {paper.level}
        </Text>
        <View style={styles.metaRow}>
          <MetaChip icon="time-outline" label={paper.duration} />
          <MetaChip icon="ribbon-outline" label={`${paper.totalMarks} marks`} />
          <MetaChip icon="school-outline" label={paper.department} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsLabel}>INSTRUCTIONS</Text>
          <MathRichText style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary }}>
            {paper.instructions}
          </MathRichText>
        </View>

        {!hasNotes && (
          <Pressable onPress={() => router.push('/notes')} style={styles.notesNudge}>
            <Ionicons name="document-attach-outline" size={16} color={colors.accent} />
            <Text style={styles.notesNudgeText}>
              Upload your {paper.courseCode} notes so explanations can reference them
            </Text>
          </Pressable>
        )}

        {/* Questions */}
        {paper.questions.length === 0 ? (
          <View style={styles.processing}>
            <Ionicons name="hourglass-outline" size={26} color={colors.textSecondary} />
            <Text style={styles.metaText}>This paper is still being structured. Check back soon.</Text>
          </View>
        ) : (
          paper.questions.map((q) => (
            <View
              key={q.id}
              onLayout={(e) => {
                if (scrolledToTarget.current || targetTop?.id !== q.id) return;
                scrolledToTarget.current = true;
                const y = e.nativeEvent.layout.y;
                setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true }), 300);
              }}>
              <QuestionBlock
                question={q}
                courseCode={paper.courseCode}
                hasNotes={hasNotes}
                highlightId={targetQuestionId}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function MetaChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={13} color={colors.textSecondary} />
      <Text style={styles.metaChipText}>{label}</Text>
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  backBtn: { width: 40, alignItems: 'center' },
  topTitle: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  paperTitle: { fontFamily: fonts.bold, fontSize: 30, color: colors.text, marginTop: 10 },
  metaText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, marginTop: 5 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  metaChipText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  instructions: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  instructionsLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  notesNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accentSoft,
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
  },
  notesNudgeText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.accent },
  processing: { alignItems: 'center', gap: 10, paddingVertical: 60 },
});
const styles = themedStyleSheet(makeStyles);
