/**
 * ExplainSheet — the NotebookLM-style AI explanation, in layers:
 *
 *   1. The answer   — direct, worked.
 *   2. The why      — the concept the question sits inside.
 *   3. The bridge   — explicit link into the student's own notes,
 *                     with a tappable reference chip. If the student
 *                     has no relevant notes this layer is simply
 *                     absent (never an error state).
 *
 * Below the layers: a free-form "Ask about this question" chat scoped
 * to this single question + the student's notes (per-question RAG).
 * All responses are mocked in data/ai.ts until the backend is wired.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { askAboutQuestion, explainQuestion } from '../data/ai';
import type { ChatMessage, ExplainResponse, Question } from '../types';
import { colors, fonts } from '../theme';
import { BottomSheet } from './BottomSheet';
import { MathRichText } from './MathRichText';

type Props = {
  question: Question;
  visible: boolean;
  onClose: () => void;
  /** Structured tail → logged as lighter-weight prerequisite gaps. */
  onPrerequisites?: (tags: string[]) => void;
};

export function ExplainSheet({ question, visible, onClose, onPrerequisites }: Props) {
  const [explain, setExplain] = useState<ExplainResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    setExplain(null);
    explainQuestion(question).then((res) => {
      setExplain(res);
      onPrerequisites?.(res.prerequisiteTags);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, question.id]);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text }]);
    setThinking(true);
    const reply = await askAboutQuestion(question, text);
    setMessages((m) => [...m, reply]);
    setThinking(false);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.sheetTitle}>Explain · Q{question.number}</Text>

        {!explain ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.ai} />
            <Text style={styles.loadingText}>Reading your notes…</Text>
          </View>
        ) : (
          <>
            <Layer label="THE ANSWER">
              <MathRichText>{explain.answer}</MathRichText>
            </Layer>

            <Layer label="THE WHY">
              <MathRichText>{explain.why}</MathRichText>
            </Layer>

            {/* Bridge renders only when the student has relevant notes. */}
            {explain.notesBridge && (
              <Layer label="FROM YOUR NOTES" accent>
                <MathRichText>{explain.notesBridge.text}</MathRichText>
                <Pressable style={styles.refChip}>
                  <Ionicons name="document-text-outline" size={14} color={colors.ai} />
                  <Text style={styles.refChipText}>{explain.notesBridge.reference.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.ai} />
                </Pressable>
              </Layer>
            )}

            <View style={styles.prereqRow}>
              <Text style={styles.prereqLabel}>Builds on</Text>
              {explain.prerequisiteTags.map((t) => (
                <View key={t} style={styles.prereqTag}>
                  <Text style={styles.prereqTagText}>{t}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Per-question chat */}
        <View style={styles.chatDivider} />
        {messages.map((m) => (
          <View key={m.id} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
            <Text style={styles.bubbleText}>{m.text}</Text>
          </View>
        ))}
        {thinking && <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 8 }} />}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about this question…"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable onPress={send} style={styles.sendBtn} hitSlop={6}>
          <Ionicons name="arrow-up" size={18} color="#111" />
        </Pressable>
      </View>
    </BottomSheet>
  );
}

function Layer({ label, accent, children }: { label: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.layer, accent && styles.layerAccent]}>
      <Text style={[styles.layerLabel, accent && { color: colors.ai }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sheetTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, marginBottom: 14 },
  loading: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  layer: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 10 },
  layerAccent: { borderWidth: 1, borderColor: 'rgba(157,151,245,0.35)', backgroundColor: 'rgba(157,151,245,0.06)' },
  layerLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.1,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  refChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 12,
    backgroundColor: colors.aiSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  refChipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.ai },
  prereqRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4, marginBottom: 8 },
  prereqLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary, marginRight: 2 },
  prereqTag: { backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  prereqTagText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  chatDivider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  bubble: { borderRadius: 16, padding: 12, marginBottom: 8, maxWidth: '88%' },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.surface },
  bubbleAi: { alignSelf: 'flex-start', backgroundColor: colors.card },
  bubbleText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.text },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10 },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
