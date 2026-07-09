/**
 * Composer — bottom-sheet post creator. Ask or Solve; Solve can tag a
 * question (picker over the user's papers) and snap/attach a photo of
 * handwritten work (expo-image-picker). Posts land in the local store.
 */
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { papers } from '../data/papers';
import { addPost, type QuestionRef } from '../lib/communityStore';
import type { StudentProfile } from '../lib/session';
import type { Question } from '../types';
import { colors, fonts } from '../theme';
import { BottomSheet } from './BottomSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  profile: StudentProfile;
  /** Pre-tag a question (e.g. "Solve this" from Most Wanted). */
  initialRef?: (QuestionRef & { courseCode: string }) | null;
};

export function Composer({ visible, onClose, profile, initialRef }: Props) {
  const [kind, setKind] = useState<'ask' | 'solve'>(initialRef ? 'solve' : 'ask');
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [tagged, setTagged] = useState<(QuestionRef & { courseCode: string }) | null>(initialRef ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Flatten taggable questions from unlocked papers.
  const taggable: { q: Question; paperId: string; courseCode: string }[] = [];
  papers.forEach((p) => {
    const walk = (qs: Question[]) =>
      qs.forEach((q) => {
        if (q.subQuestions.length === 0) taggable.push({ q, paperId: p.id, courseCode: p.courseCode });
        walk(q.subQuestions);
      });
    walk(p.questions);
  });

  const snap = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled && res.assets[0]) setImageUri(res.assets[0].uri);
  };

  const post = () => {
    if (!text.trim()) return;
    addPost({
      kind,
      author: { name: profile.name.split(' ')[0], initial: profile.name[0].toUpperCase(), color: profile.avatarColor, level: profile.level },
      text: text.trim(),
      imageUri: imageUri ?? undefined,
      questionRef: tagged ? { paperId: tagged.paperId, questionId: tagged.questionId } : undefined,
      courseCode: tagged?.courseCode,
      level: profile.level,
    });
    setText('');
    setImageUri(null);
    setTagged(null);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>New post</Text>

      {/* Ask | Solve */}
      <View style={styles.kindRow}>
        {(['ask', 'solve'] as const).map((k) => (
          <Pressable key={k} onPress={() => setKind(k)} style={[styles.kindBtn, kind === k && styles.kindBtnActive]}>
            <Text style={[styles.kindText, kind === k && { color: colors.onAccent }]}>
              {k === 'ask' ? 'Ask the class' : 'Post a solution'}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={kind === 'ask' ? 'What are you stuck on?' : 'Explain your working…'}
        placeholderTextColor={colors.textTertiary}
        multiline
        style={styles.input}
      />

      {/* Tag a question */}
      <Pressable onPress={() => setPickerOpen((v) => !v)} style={styles.attachRow}>
        <Text style={styles.attachText}>
          {tagged ? `Tagged: ${tagged.courseCode} · Q${taggable.find((t) => t.q.id === tagged.questionId)?.q.number ?? ''}` : 'Tag a question'}
        </Text>
        <Text style={styles.attachChevron}>{pickerOpen ? '▴' : '▾'}</Text>
      </Pressable>
      {pickerOpen && (
        <ScrollView style={styles.picker} nestedScrollEnabled>
          {taggable.slice(0, 12).map((t) => (
            <Pressable
              key={t.q.id}
              onPress={() => {
                setTagged({ paperId: t.paperId, questionId: t.q.id, courseCode: t.courseCode });
                setPickerOpen(false);
              }}
              style={styles.pickerRow}>
              <Text style={styles.pickerCode}>
                {t.courseCode} · Q{t.q.number}
              </Text>
              <Text style={styles.pickerText} numberOfLines={1}>
                {t.q.text.replace(/[$*`#]/g, '')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Snap your work */}
      <Pressable onPress={snap} style={styles.attachRow}>
        <Text style={styles.attachText}>{imageUri ? 'Photo attached' : 'Snap your work (photo)'}</Text>
        <Text style={styles.attachChevron}>{imageUri ? '✓' : '+'}</Text>
      </Pressable>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

      <Pressable
        disabled={!text.trim()}
        onPress={post}
        style={({ pressed }) => [styles.cta, !text.trim() && styles.ctaDisabled, pressed && { opacity: 0.85 }]}>
        <Text style={[styles.ctaText, !text.trim() && { color: colors.textTertiary }]}>
          {kind === 'solve' && tagged ? 'Post solution (+3 credits if verified)' : 'Post'}
        </Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, marginBottom: 14 },
  kindRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  kindBtn: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingVertical: 11,
    backgroundColor: colors.card,
  },
  kindBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  kindText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  input: {
    minHeight: 90,
    maxHeight: 160,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  attachText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  attachChevron: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary },
  picker: { maxHeight: 180 },
  pickerRow: { paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pickerCode: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.accent },
  pickerText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  preview: { width: '100%', height: 130, borderRadius: 10, marginTop: 10, backgroundColor: colors.surface },
  cta: { backgroundColor: colors.accent, borderRadius: 10, alignItems: 'center', paddingVertical: 14, marginTop: 16 },
  ctaDisabled: { backgroundColor: colors.surface },
  ctaText: { fontFamily: fonts.medium, fontSize: 15, color: colors.onAccent },
});
