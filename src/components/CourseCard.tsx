/**
 * CourseCard — the big index-card style: course-color spine down the
 * left edge, amber code with the level on the baseline, full title,
 * then a hairline rule and the papers themselves INLINE (year rows,
 * tap to open) — Papers and Courses are one page now.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { papers, unlockedPaperIds } from '../data/papers';
import type { CatalogCourse } from '../data/catalog/types';
import { colors, fonts } from '../theme';

const SPINE_COLORS = ['#2E4470', '#4A2A5F', '#1F5F4A', '#5F3A1F', '#5F1F2E', '#3A3A5F', '#33565C'];
function spineColor(code: string) {
  let h = 0;
  for (const ch of code.slice(0, 3)) h = h * 31 + ch.charCodeAt(0);
  return SPINE_COLORS[h % SPINE_COLORS.length];
}

export function CourseCard({ course, index = 0 }: { course: CatalogCourse; index?: number }) {
  const router = useRouter();
  const coursePapers = papers
    .filter((p) => p.courseCode === course.code)
    .sort((a, b) => b.year - a.year);

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45).duration(240)}>
      <View style={styles.card}>
        <View style={[styles.spine, { backgroundColor: spineColor(course.code) }]} />
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={styles.code}>{course.code}</Text>
            <Text style={styles.level}>{course.level}</Text>
          </View>

          {/* Code-first when the official title is unpublished; never invent one. */}
          {course.title ? (
            <Text style={styles.title} numberOfLines={2}>
              {course.title}
            </Text>
          ) : (
            <>
              <Text style={styles.title}>Course {course.code}</Text>
              <Text style={styles.pending}>Know this course? Confirm its title, earn credits.</Text>
            </>
          )}

          <View style={styles.rule} />

          {/* Papers live inside the course card now — one page, no Papers tab. */}
          {coursePapers.length > 0 ? (
            coursePapers.map((p, i) => {
              const unlocked = unlockedPaperIds.has(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(unlocked ? `/paper/${p.id}` : (`/unlock/${p.id}` as never))}
                  style={({ pressed }) => [styles.paperRow, i > 0 && styles.paperRowDivider, pressed && { opacity: 0.7 }]}>
                  <Text style={styles.paperYear}>{p.year}</Text>
                  <Text style={styles.paperMeta} numberOfLines={1}>
                    {p.session}
                    {p.questions.length > 0 ? ` · ${p.questions.length} questions` : ''}
                  </Text>
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

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    overflow: 'hidden',
    marginBottom: 12,
  },
  spine: { width: 5 },
  body: { flex: 1, padding: 16, paddingBottom: 8 },
  topRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  code: { fontFamily: fonts.bold, fontSize: 13.5, letterSpacing: 0.8, color: colors.accent },
  level: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary },
  title: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 24, color: colors.text, marginTop: 7 },
  pending: { fontFamily: fonts.regular, fontSize: 12, fontStyle: 'italic', color: colors.textTertiary, marginTop: 4 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: 13 },
  paperRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  paperRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  paperYear: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'] },
  paperMeta: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  paperAction: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.accent },
});
