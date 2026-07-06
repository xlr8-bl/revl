/**
 * QuestionBlock — one self-contained question card, recursive for
 * sub-questions (2a, 2b, 2(b)(i)…). Owns the atomic reveal loop:
 *
 *   read → confidence pill (Yes / Sort of / No)
 *        → Reveal (worked answer, verified ✓ or AI tag)
 *        → self-assess (Got it / Not yet)
 *        → Explain (AI, grounded in the student's notes)
 *
 * Each resolution writes exactly one row to the local RevealLog —
 * that single table powers all of Study DNA.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { logReveal } from '../lib/revealLog';
import type { Question, RevealLog } from '../types';
import { colors, fonts, radius } from '../theme';
import { ConfidencePill } from './ConfidencePill';
import { DiagramView } from './DiagramView';
import { ExplainSheet } from './ExplainSheet';
import { MathRichText } from './MathRichText';

const DIFFICULTY_COLOR: Record<Question['difficulty'], string> = {
  easy: colors.success,
  medium: colors.warning,
  hard: colors.danger,
};

type Props = {
  question: Question;
  courseCode: string;
  /** Whether the student has uploaded notes for this course (grounds the AI). */
  hasNotes: boolean;
  depth?: number;
};

export function QuestionBlock({ question, courseCode, hasNotes, depth = 0 }: Props) {
  const hasAnswer = !!(question.answers.verified || question.answers.aiGeneral);
  const isLeaf = question.subQuestions.length === 0;

  const [confidence, setConfidence] = useState<RevealLog['confidenceBefore'] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [resolution, setResolution] = useState<RevealLog['resolution'] | null>(null);
  const [explainOpen, setExplainOpen] = useState(false);
  // Prerequisite tags from the AI tail; attached to the log row if known in time.
  const prereqTags = useRef<string[] | undefined>(undefined);

  const resolve = (r: RevealLog['resolution']) => {
    if (resolution) return; // one row per reveal
    setResolution(r);
    logReveal({
      questionId: question.id,
      courseCode,
      tags: question.topics,
      confidenceBefore: confidence ?? 'sort-of',
      resolution: r,
      prerequisiteTags: prereqTags.current,
      hadNotes: hasNotes,
    });
    if (r === 'not-yet') setExplainOpen(true); // "Not yet" fires the AI
  };

  const answerText = question.answers.verified ?? question.answers.aiGeneral ?? '';
  const isVerified = !!question.answers.verified;

  return (
    <View style={[styles.card, depth > 0 && styles.nested]}>
      {/* Header row: number + marks + difficulty dot */}
      <View style={styles.headerRow}>
        <Text style={styles.number}>Q{question.number}</Text>
        <View style={styles.headerRight}>
          <View style={[styles.diffDot, { backgroundColor: DIFFICULTY_COLOR[question.difficulty] }]} />
          <Text style={styles.marks}>{question.marks} marks</Text>
        </View>
      </View>

      <MathRichText style={{ fontSize: 16, lineHeight: 25 }}>{question.text}</MathRichText>

      {question.diagrams.map((d) => (
        <DiagramView key={d.id} diagram={d} />
      ))}

      {/* Topic tags (these are what Study DNA tallies against) */}
      {question.topics.length > 0 && (
        <View style={styles.tagRow}>
          {question.topics.map((t) => (
            <Text key={t} style={styles.tag}>
              {t}
            </Text>
          ))}
        </View>
      )}

      {/* ---- The reveal loop (leaf questions with an answer) ---- */}
      {isLeaf && hasAnswer && (
        <View style={styles.loop}>
          {!revealed ? (
            <>
              <ConfidencePill value={confidence} onSelect={setConfidence} />
              <Pressable
                onPress={() => confidence && setRevealed(true)}
                style={[styles.revealBtn, !confidence && styles.revealBtnDisabled]}>
                <Ionicons name="eye-outline" size={17} color={confidence ? '#111' : colors.textTertiary} />
                <Text style={[styles.revealText, !confidence && { color: colors.textTertiary }]}>Reveal answer</Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* The worked answer, with trust signal */}
              <View style={styles.answerBox}>
                <View style={styles.answerHeader}>
                  {isVerified ? (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.verified} />
                      <Text style={styles.verifiedText}>Verified by top student</Text>
                    </View>
                  ) : (
                    <View style={styles.aiTag}>
                      <Ionicons name="sparkles-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.aiTagText}>AI answer</Text>
                    </View>
                  )}
                </View>
                <MathRichText>{answerText}</MathRichText>
                {question.answers.references?.map((ref) => (
                  <View key={ref.location} style={styles.refRow}>
                    <Ionicons
                      name={ref.source === 'notes' ? 'document-text-outline' : 'book-outline'}
                      size={13}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.refText}>{ref.label}</Text>
                  </View>
                ))}
              </View>

              {/* Self-assessment → one RevealLog row */}
              {!resolution ? (
                <View style={styles.assessRow}>
                  <Pressable onPress={() => resolve('got-it')} style={[styles.assessBtn, styles.gotItBtn]}>
                    <Ionicons name="checkmark" size={17} color={colors.success} />
                    <Text style={[styles.assessText, { color: colors.success }]}>Got it</Text>
                  </Pressable>
                  <Pressable onPress={() => resolve('not-yet')} style={[styles.assessBtn, styles.notYetBtn]}>
                    <Ionicons name="refresh" size={17} color={colors.warning} />
                    <Text style={[styles.assessText, { color: colors.warning }]}>Not yet</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.resolvedRow}>
                  <Text style={styles.resolvedText}>
                    {resolution === 'got-it' ? 'Logged — nice.' : 'Logged — this topic will resurface.'}
                  </Text>
                  <Pressable onPress={() => setExplainOpen(true)} style={styles.explainBtn} hitSlop={6}>
                    <Ionicons name="sparkles" size={14} color={colors.accent} />
                    <Text style={styles.explainText}>Explain</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Recursive sub-questions, indented */}
      {question.subQuestions.map((sub) => (
        <QuestionBlock key={sub.id} question={sub} courseCode={courseCode} hasNotes={hasNotes} depth={depth + 1} />
      ))}

      <ExplainSheet
        question={question}
        visible={explainOpen}
        onClose={() => setExplainOpen(false)}
        onPrerequisites={(tags) => (prereqTags.current = tags)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 18,
    marginBottom: 12,
  },
  nested: {
    backgroundColor: 'transparent',
    borderLeftWidth: 2,
    borderLeftColor: colors.surface,
    borderRadius: 0,
    paddingVertical: 6,
    paddingRight: 0,
    marginTop: 14,
    marginBottom: 0,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  number: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  diffDot: { width: 7, height: 7, borderRadius: 4 },
  marks: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  loop: { marginTop: 14, gap: 10 },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 13,
  },
  revealBtnDisabled: { backgroundColor: colors.surface },
  revealText: { fontFamily: fonts.medium, fontSize: 15, color: '#111111' },
  answerBox: { backgroundColor: '#111113', borderRadius: 14, padding: 14 },
  answerHeader: { marginBottom: 10 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  verifiedText: { fontFamily: fonts.medium, fontSize: 12, color: colors.verified },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiTagText: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  refText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  assessRow: { flexDirection: 'row', gap: 10 },
  assessBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 999,
    paddingVertical: 12,
    borderWidth: 1,
  },
  gotItBtn: { borderColor: 'rgba(48,209,88,0.4)', backgroundColor: 'rgba(48,209,88,0.08)' },
  notYetBtn: { borderColor: 'rgba(255,214,10,0.4)', backgroundColor: 'rgba(255,214,10,0.08)' },
  assessText: { fontFamily: fonts.medium, fontSize: 14 },
  resolvedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resolvedText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  explainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  explainText: { fontFamily: fonts.medium, fontSize: 13, color: colors.accent },
});
