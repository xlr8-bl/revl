/**
 * My Notes — upload study material per course. This is what grounds the
 * NotebookLM-style AI: uploads get chunked + embedded by the (future)
 * pipeline, then explanations can cite "your notes, p.12". Upload is
 * stubbed with expo-document-picker; nothing leaves the device yet.
 */
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { noteUploads as initialNotes } from '../data/notes';
import { currentUser } from '../data/user';
import type { NoteUpload } from '../types';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../theme';

const KIND_ICON: Record<NoteUpload['kind'], keyof typeof Ionicons.glyphMap> = {
  pdf: 'document-text-outline',
  image: 'image-outline',
  text: 'reader-outline',
};

export default function NotesScreen() {
  useThemeVersion();
  const [notes, setNotes] = useState<NoteUpload[]>(initialNotes);

  /** Stubbed upload: picks a file and adds it as "processing". */
  const pickAndAdd = async (courseCode: string) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'text/*'],
      copyToCacheDirectory: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setNotes((prev) => [
      ...prev,
      {
        id: `n-${Date.now()}`,
        courseCode,
        fileName: asset.name,
        kind: asset.mimeType?.startsWith('image') ? 'image' : asset.mimeType?.includes('pdf') ? 'pdf' : 'text',
        uploadedAt: Date.now(),
        indexed: false, // real pipeline flips this once chunked + embedded
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="My Notes" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <Text style={styles.intro}>
          Upload your own notes per course. When you ask “Explain”, Revl reads them and connects answers back to what
          you already wrote.
        </Text>

        {currentUser.enrolledCourseCodes.map((code) => {
          const courseNotes = notes.filter((n) => n.courseCode === code);
          return (
            <View key={code} style={styles.courseBlock}>
              <View style={styles.courseHeader}>
                <Text style={styles.courseTitle}>{code}</Text>
                <Pressable onPress={() => pickAndAdd(code)} style={styles.addBtn} hitSlop={6}>
                  <Ionicons name="add" size={16} color="#111" />
                  <Text style={styles.addBtnText}>Upload</Text>
                </Pressable>
              </View>
              {courseNotes.length === 0 ? (
                <Text style={styles.empty}>No notes yet. Explanations will use general knowledge.</Text>
              ) : (
                courseNotes.map((n) => (
                  <View key={n.id} style={styles.noteRow}>
                    <Ionicons name={KIND_ICON[n.kind]} size={19} color={colors.textSecondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.noteName} numberOfLines={1}>
                        {n.fileName}
                      </Text>
                      <Text style={styles.noteMeta}>
                        {n.pages ? `${n.pages} pages · ` : ''}
                        {new Date(n.uploadedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    {n.indexed ? (
                      <View style={styles.indexedTag}>
                        <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                        <Text style={styles.indexedText}>Ready</Text>
                      </View>
                    ) : (
                      <Text style={styles.processingText}>Processing…</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  intro: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    paddingHorizontal: spacing.gutter,
    marginTop: 6,
  },
  courseBlock: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginHorizontal: spacing.gutter,
    marginTop: 18,
    padding: 16,
  },
  courseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  courseTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  addBtnText: { fontFamily: fonts.medium, fontSize: 13, color: '#111111' },
  empty: { fontFamily: fonts.regular, fontSize: 13, color: colors.textTertiary, paddingVertical: 8 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 },
  noteName: { fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  noteMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  indexedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  indexedText: { fontFamily: fonts.regular, fontSize: 12, color: colors.success },
  processingText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
});
const styles = themedStyleSheet(makeStyles);
