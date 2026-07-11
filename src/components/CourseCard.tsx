/**
 * CourseCard — premium index card. A tinted course-color header band
 * carries the code and level; the title is set in serif (the catalogue
 * voice); the course's past papers sit inline below a hairline as
 * tappable year rows. No gradients, no icons: color, type, and rules.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { papers, unlockedPaperIds } from '../data/papers';
import type { CatalogCourse } from '../data/catalog/types';
import { recordAccess } from '../lib/courseAccess';
import { sentenceCase } from '../lib/format';
import { CourseDownloadButton, PaperDownloadBadge } from './DownloadBadge';
import { activeScheme, colors, fonts, themedStyleSheet, useThemeVersion, withAlpha } from '../theme';

// Monochrome-orange identity: one accent does all the work across the whole
// Courses page (no per-course jewel tints). Kept as a function so existing
// call sites stay unchanged.
export function courseColor(_code?: string) {
  return colors.accent;
}
/** Soft tint wash of the accent for header bands / tiles. */
export const wash = (hex: string) => withAlpha(hex, activeScheme() === 'light' ? 0.1 : 0.14);


export function CourseCard({ course, index = 0 }: { course: CatalogCourse; index?: number }) {
  useThemeVersion();
  const router = useRouter();
  const tint = courseColor(course.code);
  const coursePapers = papers
    .filter((p) => p.courseCode === course.code)
    .sort((a, b) => b.year - a.year);

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45).duration(240)}>
      <View style={styles.card}>
        {/* Tinted header band: code + level + save */}
        <View style={[styles.band, { backgroundColor: wash(tint) }]}>
          <Text style={[styles.code, { color: tint }]}>{course.code}</Text>
          <View style={styles.bandRight}>
            <Text style={styles.level}>{course.level}</Text>
            {coursePapers.length > 0 && <CourseDownloadButton code={course.code} />}
          </View>
        </View>

        <View style={styles.body}>
          {/* Serif title — the catalogue voice. Code-first when unpublished. */}
          {course.title ? (
            <Text style={styles.title} numberOfLines={2}>
              {sentenceCase(course.title)}
            </Text>
          ) : (
            <>
              <Text style={styles.title}>Course {course.code}</Text>
              <Text style={styles.pending}>Know this course? Confirm its title, earn credits.</Text>
            </>
          )}

          <View style={styles.rule} />

          {/* Papers inline — Courses and Papers are one page. */}
          {coursePapers.length > 0 ? (
            coursePapers.map((p, i) => {
              const unlocked = unlockedPaperIds.has(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    recordAccess(course.code);
                    router.push(unlocked ? `/paper/${p.id}` : (`/unlock/${p.id}` as never));
                  }}
                  style={({ pressed }) => [styles.paperRow, i > 0 && styles.paperRowDivider, pressed && { opacity: 0.7 }]}>
                  <Text style={styles.paperYear}>{p.year}</Text>
                  <Text style={styles.paperMeta} numberOfLines={1}>
                    {p.questions.length > 0 ? `${p.questions.length} questions · ${p.session}` : p.session}
                  </Text>
                  <PaperDownloadBadge paper={p} />
                  <Text style={[styles.paperAction, !unlocked && { color: colors.textSecondary }]}>
                    {unlocked ? 'Open ›' : 'Unlock ›'}
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.paperRow}>
              <Text style={styles.paperMeta}>Papers coming soon</Text>
              <Text style={[styles.paperAction, { color: colors.textTertiary }]}>Notify me</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const makeStyles = () => StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    overflow: 'hidden',
    marginBottom: 12,
  },
  band: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  code: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 1 },
  bandRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  level: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
  body: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  title: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 25, color: colors.text },
  pending: { fontFamily: fonts.regular, fontSize: 12, fontStyle: 'italic', color: colors.textTertiary, marginTop: 5 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: 14 },
  paperRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  paperRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  paperYear: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.text, fontVariant: ['tabular-nums'] },
  paperMeta: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  // Fixed width keeps the download column aligned whether the row says
  // "Open ›" or "Unlock ›".
  paperAction: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.accent, width: 60, textAlign: 'right' },
});
const styles = themedStyleSheet(makeStyles);
