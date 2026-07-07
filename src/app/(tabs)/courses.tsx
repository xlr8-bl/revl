/**
 * Courses ("Plans" in the reference, screenshot 2):
 * big title + search, filter chips, featured carousel, bright faculty
 * tiles (2-row horizontal grid), outline chips, then course sections
 * with thumbnail / meta / title / stars / Start rows.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryTile } from '../../components/CategoryTile';
import { FilterChips } from '../../components/FilterChips';
import { SectionHeader } from '../../components/SectionHeader';
import { Stars } from '../../components/Stars';
import { browseChips, courses, faculties, featuredCourses } from '../../data/courses';
import { unlockedPaperIds } from '../../data/papers';
import { currentUser } from '../../data/user';
import { useSession } from '../../lib/session';
import type { Course } from '../../types';
import { colors, fonts, radius, spacing, TAB_BAR_CLEARANCE } from '../../theme';

const FILTERS = ['My Courses', 'Browse', 'Saved', 'Completed'];

export default function CoursesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState('Browse');
  const [subFilter, setSubFilter] = useState<string | null>(null);

  const featuredWidth = width - spacing.gutter * 2 - 36;

  // The catalogue is scoped to the student's own department (set at
  // onboarding). Other faculties stay reachable through the tiles above.
  const profile = useSession().profile;
  const dept = profile?.department ?? 'Computer Engineering';
  const level = profile?.level ?? 'L400';
  const myCourses = courses.filter((c) => currentUser.enrolledCourseCodes.includes(c.code));
  const deptCourses = courses.filter((c) => c.department === dept);
  const shownSections =
    filter === 'My Courses'
      ? [{ title: 'My Courses', data: myCourses }]
      : [{ title: `${dept} ${level}`, data: deptCourses.length ? deptCourses : myCourses }];

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: TAB_BAR_CLEARANCE }}>
      {/* Search — floated top right like the reference */}
      <View style={styles.searchRow}>
        <Pressable onPress={() => router.push('/discover')} style={styles.searchBtn} hitSlop={6}>
          <Ionicons name="search" size={21} color={colors.text} />
        </Pressable>
      </View>

      <Text style={styles.title}>Courses</Text>

      <FilterChips options={FILTERS} selected={filter} onSelect={setFilter} />

      {/* Featured carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={featuredWidth + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.carousel}>
        {featuredCourses.map((f) => (
          <View key={f.id} style={{ width: featuredWidth }}>
            <View style={[styles.featureCard, { width: featuredWidth, backgroundColor: f.gradient[0] }]}>
              <View style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>{f.badge}</Text>
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
            </View>
            <Text style={styles.featureCaption} numberOfLines={1}>
              {f.subtitle}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Faculty tiles — 2-row horizontal grid, reference LOVE/HEALING style */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tileScroll}>
        <View style={styles.tileGrid}>
          {[0, 1].map((row) => (
            <View key={row} style={styles.tileRow}>
              {faculties.filter((_, i) => i % 2 === row).map((f) => (
                <CategoryTile key={f.id} faculty={f} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ marginTop: 22 }}>
        <FilterChips options={browseChips} selected={subFilter} onSelect={(v) => setSubFilter(v === subFilter ? null : v)} variant="outline" />
      </View>

      {shownSections.map((section) => (
        <View key={section.title} style={{ marginTop: 34 }}>
          <SectionHeader title={section.title} onSeeAll={() => {}} />
          <View style={styles.sectionList}>
            {section.data.map((course) => (
              <CourseRow key={course.code} course={course} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

/**
 * CourseCard — an index card, not a list row. Course-color spine on the
 * left, code set against it, title with the rating on the baseline,
 * then a hairline footer: paper count and years on one side, the
 * Start/Unlock action on the other.
 */
function CourseRow({ course }: { course: Course }) {
  const router = useRouter();
  const paperId = course.paperIds[0];
  const unlocked = paperId && unlockedPaperIds.has(paperId);
  const years = course.paperIds
    .map((id) => parseInt(id.slice(-4), 10))
    .filter((y) => !isNaN(y))
    .sort((a, b) => a - b);
  const yearsLabel =
    years.length > 1 ? `${years[0]}\u2013${years[years.length - 1]}` : String(years[0] ?? '');

  const open = () => {
    if (!paperId) return;
    router.push(unlocked ? `/paper/${paperId}` : (`/unlock/${paperId}` as never));
  };

  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.courseCard, pressed && { opacity: 0.85 }]}>
      <View style={[styles.courseSpine, { backgroundColor: course.gradient[0] }]} />
      <View style={styles.courseBody}>
        <View style={styles.courseTopRow}>
          <Text style={styles.courseCode}>{course.code}</Text>
          <Stars rating={course.rating} />
        </View>
        <Text style={styles.courseTitle} numberOfLines={1}>
          {course.title}
        </Text>
        <Text style={styles.courseMeta}>
          {course.department} · {course.level}
        </Text>
        <View style={styles.courseRule} />
        <View style={styles.courseFooter}>
          <Text style={styles.courseMeta}>
            {course.paperIds.length} {course.paperIds.length === 1 ? 'paper' : 'papers'}
            {yearsLabel ? ` · ${yearsLabel}` : ''}
          </Text>
          <Text style={[styles.courseAction, !unlocked && { color: colors.textSecondary }]}>
            {unlocked ? 'Start ›' : 'Unlock ›'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  searchRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.gutter },
  searchBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 40,
    color: colors.text,
    paddingHorizontal: spacing.gutter,
    marginTop: 14,
    marginBottom: 20,
  },
  carousel: { paddingHorizontal: spacing.gutter, gap: 12, marginTop: 22 },
  featureCard: {
    height: 200,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    padding: 18,
    justifyContent: 'center',
  },
  featureBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  featureBadgeText: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1.2, color: colors.text },
  featureTitle: {
    fontFamily: fonts.bold,
    fontSize: 34,
    letterSpacing: 1,
    color: colors.text,
    textAlign: 'center',
  },
  featureCaption: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, marginTop: 10 },
  tileScroll: { paddingHorizontal: spacing.gutter, marginTop: 26 },
  tileGrid: { gap: 10 },
  tileRow: { flexDirection: 'row', gap: 10 },
  sectionList: { marginTop: 12, gap: 10, paddingHorizontal: spacing.gutter },
  courseCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  courseSpine: { width: 5 },
  courseBody: { flex: 1, padding: 16, paddingBottom: 13 },
  courseTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  courseCode: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 0.8, color: colors.accent },
  courseTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginTop: 6 },
  courseMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  courseRule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: 12, marginBottom: 10 },
  courseFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  courseAction: { fontFamily: fonts.medium, fontSize: 14, color: colors.accent },
});
