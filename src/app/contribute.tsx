/**
 * Upload-to-earn — contribution flow stub. Students upload past papers
 * they own; once approved by moderation + the extraction pipeline,
 * credits land in their wallet. Flow is stubbed end-to-end.
 */
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, fonts, spacing } from '../theme';

export default function ContributeScreen() {
  const [courseCode, setCourseCode] = useState('');
  const [year, setYear] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!result.canceled && result.assets[0]) setFileName(result.assets[0].name);
  };

  if (submitted) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Contribute" />
        <View style={styles.doneWrap}>
          <Ionicons name="checkmark-circle" size={54} color={colors.success} />
          <Text style={styles.doneTitle}>Paper submitted</Text>
          <Text style={styles.doneBody}>
            We'll structure it, verify it's a real past paper, and credit your wallet, usually within 48 hours.
          </Text>
          <View style={styles.rewardPill}>
            <Text style={styles.rewardText}>+3 credits on approval</Text>
          </View>
        </View>
      </View>
    );
  }

  const canSubmit = courseCode.trim() && year.trim() && fileName;

  return (
    <View style={styles.root}>
      <ScreenHeader title="Contribute" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.gutter, paddingBottom: 60 }}>
        <Text style={styles.title}>Upload a paper, earn credits</Text>
        <Text style={styles.body}>
          Own a past paper Revl doesn't have? Upload photos or a PDF. Approved papers earn credits you can spend on
          unlocks.
        </Text>

        <Text style={styles.fieldLabel}>COURSE CODE</Text>
        <TextInput
          value={courseCode}
          onChangeText={setCourseCode}
          placeholder="e.g. CEC408"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="characters"
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>EXAM YEAR</Text>
        <TextInput
          value={year}
          onChangeText={setYear}
          placeholder="e.g. 2022"
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>PAPER FILE</Text>
        <Pressable onPress={pick} style={styles.dropzone}>
          <Ionicons name={fileName ? 'document-attach' : 'cloud-upload-outline'} size={30} color={colors.textSecondary} />
          <Text style={styles.dropText}>{fileName ?? 'Tap to pick a PDF or photos'}</Text>
        </Pressable>

        <Pressable
          disabled={!canSubmit}
          onPress={() => setSubmitted(true)}
          style={[styles.submitBtn, !canSubmit && styles.submitDisabled]}>
          <Text style={[styles.submitText, !canSubmit && { color: colors.textTertiary }]}>Submit for review</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginTop: 8, marginBottom: 10 },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginTop: 22,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  dropzone: {
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3A3A3C',
    borderRadius: 18,
    paddingVertical: 34,
  },
  dropText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  submitBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 30,
  },
  submitDisabled: { backgroundColor: colors.surface },
  submitText: { fontFamily: fonts.medium, fontSize: 16, color: '#111111' },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  doneTitle: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  doneBody: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, textAlign: 'center' },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginTop: 8,
  },
  rewardText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
});
