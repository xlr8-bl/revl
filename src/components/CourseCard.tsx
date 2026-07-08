/**
 * CourseCard — a catalogue course as a crafted card: serif monogram
 * tile carrying the code prefix, code + level line, full title, then a
 * hairline footer with paper availability. Courses without extracted
 * papers show "Papers coming soon" so the full catalogue feels alive.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { papers, unlockedPaperIds } from '../data/papers';
import type { CatalogCourse } from '../data/catalog/types';
import { colors, fonts } from '../theme';

/** Stable tile color per code prefix. */
const TILE_COLORS = ['#22314E', '#3D2A52', '#173F2E', '#4A3413', '#4E2231', '#1F3A5F', '#33245C'];
function tileColor(code: string) {
  let h = 0;
  for (const ch of code.slice(0, 3)) h = h * 31 + ch.charCodeAt(0);
  return TILE_COLORS[h % TILE_COLORS.length];
}

export function CourseCard({ course, index = 0 }: { course: CatalogCourse; index?: number }) {
  const router = useRouter();
  const coursePapers = papers.filter((p) => p.courseCode === course.code);
  const hasPapers = coursePapers.length > 0;
  const firstPaper = coursePapers[0];
  const prefix = course.code.replace(/[^A-Z]/g, '').slice(0, 3);

  const open = () => {
    if (!firstPaper) return;
    const unlocked = unlockedPaperIds.has(firstPaper.id);
    router.push(unlocked ? `/paper/${firstPaper.id}` : (`/unlock/${firstPaper.id}` as never));
  };

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).springify().damping(16)}>
      <Pressable onPress={open} disabled={!hasPapers} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
        <View style={[styles.tile, { backgroundColor: tileColor(course.code) }]}>
          <Text style={styles.tileText}>{prefix}</Text>
        </View>
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={styles.code}>{course.code}</Text>
            <Text style={styles.level}>{course.level}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {course.title}
          </Text>
          {!course.verified && <Text style={styles.pending}>title pending registry check</Text>}
          <View style={styles.rule} />
          <View style={styles.footer}>
            {hasPapers ? (
              <>
                <Text style={styles.footerMeta}>
                  {coursePapers.length} past {coursePapers.length === 1 ? 'paper' : 'papers'}
                </Text>
                <Text style={styles.action}>Start ›</Text>
              </>
            ) : (
              <>
                <Text style={styles.footerMeta}>Papers coming soon</Text>
                <Text style={styles.actionMuted}>Notify me</Text>
              </>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    overflow: 'hidden',
    marginBottom: 10,
  },
  tile: { width: 64, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontFamily: fonts.serif, fontSize: 22, color: 'rgba(255,255,255,0.92)' },
  body: { flex: 1, padding: 14, paddingBottom: 11 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 0.6, color: colors.accent },
  level: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  title: { fontFamily: fonts.bold, fontSize: 16.5, lineHeight: 21, color: colors.text, marginTop: 5 },
  pending: { fontFamily: fonts.regular, fontSize: 11, fontStyle: 'italic', color: colors.textTertiary, marginTop: 3 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: 10, marginBottom: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerMeta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary },
  action: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.accent },
  actionMuted: { fontFamily: fonts.medium, fontSize: 13, color: colors.textTertiary },
});
