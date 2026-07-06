/**
 * Papers tab — the library (reference's "Bible" slot). Every paper the
 * catalogue knows about, with lock state, a per-paper download
 * affordance and an "Available offline" state. Downloads are mock-local
 * for now; the real version caches the paper JSON + AI answers.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { courses } from '../../data/courses';
import { initiallyDownloadedPaperIds, papers, unlockedPaperIds } from '../../data/papers';
import type { Paper } from '../../types';
import { colors, fonts, spacing, TAB_BAR_CLEARANCE } from '../../theme';

export default function PapersScreen() {
  const insets = useSafeAreaInsets();
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set(initiallyDownloadedPaperIds));

  const toggleDownload = (id: string) =>
    setDownloaded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE }}>
      <Text style={styles.title}>Papers</Text>
      <Text style={styles.subtitle}>Structured past papers — rendered natively, never PDFs.</Text>

      {courses.map((course) => {
        const coursePapers = papers.filter((p) => p.courseCode === course.code);
        if (coursePapers.length === 0) return null;
        return (
          <View key={course.code} style={{ marginTop: 26 }}>
            <Text style={styles.groupTitle}>
              {course.code} — {course.title}
            </Text>
            {coursePapers.map((paper) => (
              <PaperRow
                key={paper.id}
                paper={paper}
                gradient={course.gradient}
                downloaded={downloaded.has(paper.id)}
                onToggleDownload={() => toggleDownload(paper.id)}
              />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

function PaperRow({
  paper,
  gradient,
  downloaded,
  onToggleDownload,
}: {
  paper: Paper;
  gradient: [string, string];
  downloaded: boolean;
  onToggleDownload: () => void;
}) {
  const router = useRouter();
  const unlocked = unlockedPaperIds.has(paper.id);

  return (
    <Pressable
      onPress={() => router.push(unlocked ? `/paper/${paper.id}` : (`/unlock/${paper.id}` as never))}
      style={styles.row}>
      <View style={styles.thumb}>
        <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
        <Text style={styles.thumbYear}>{paper.year}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>
          {paper.title} · {paper.year}
        </Text>
        <Text style={styles.rowMeta}>
          {paper.session} · {paper.questions.length > 0 ? `${paper.questions.length} questions` : 'Processing'}
        </Text>
        {downloaded && (
          <View style={styles.offlineTag}>
            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
            <Text style={styles.offlineText}>Available offline</Text>
          </View>
        )}
      </View>
      {unlocked ? (
        <Pressable onPress={onToggleDownload} hitSlop={10} style={styles.dlBtn}>
          <Ionicons
            name={downloaded ? 'cloud-done' : 'cloud-download-outline'}
            size={21}
            color={downloaded ? colors.success : colors.textSecondary}
          />
        </Pressable>
      ) : (
        <View style={styles.lockWrap}>
          <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.bold, fontSize: 40, color: colors.text, paddingHorizontal: spacing.gutter },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: spacing.gutter,
    marginTop: 6,
  },
  groupTitle: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.text,
    paddingHorizontal: spacing.gutter,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.gutter,
    paddingVertical: 11,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbYear: { fontFamily: fonts.bold, fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  rowTitle: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  rowMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  offlineTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  offlineText: { fontFamily: fonts.regular, fontSize: 12, color: colors.success },
  dlBtn: { padding: 6 },
  lockWrap: { padding: 6 },
});
