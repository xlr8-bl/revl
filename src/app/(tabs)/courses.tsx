/**
 * Courses ("Plans" in the reference, screenshot 2):
 * big title + search, filter chips, featured carousel, bright faculty
 * tiles (2-row horizontal grid), outline chips, then course sections
 * with thumbnail / meta / title / stars / Start rows.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import type { Course } from '../../types';
import { colors, fonts, radius, spacing, TAB_BAR_CLEARANCE } from '../../theme';

const FILTERS = ['My Courses', 'Browse', 'Saved', 'Completed'];

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState('Browse');
  const [subFilter, setSubFilter] = useState<string | null>(null);

  const featuredWidth = width - spacing.gutter * 2 - 36;

  const myCourses = courses.filter((c) => currentUser.enrolledCourseCodes.includes(c.code));
  const shownSections =
    filter === 'My Courses'
      ? [{ title: 'My Courses', data: myCourses }]
      : [
          { title: 'Computer Engineering L400', data: courses.filter((c) => c.department === 'Computer Engineering') },
          { title: 'Across campus', data: courses.filter((c) => c.department !== 'Computer Engineering') },
        ];

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: TAB_BAR_CLEARANCE }}>
      {/* Search — floated top right like the reference */}
      <View style={styles.searchRow}>
        <Pressable style={styles.searchBtn} hitSlop={6}>
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
            <View style={[styles.featureCard, { width: featuredWidth }]}>
              <LinearGradient colors={f.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
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

/** One course row: thumbnail · meta line · title · stars · Start button. */
function CourseRow({ course }: { course: Course }) {
  const router = useRouter();
  const paperId = course.paperIds[0];
  const unlocked = paperId && unlockedPaperIds.has(paperId);

  const open = () => {
    if (!paperId) return;
    router.push(unlocked ? `/paper/${paperId}` : (`/unlock/${paperId}` as never));
  };

  return (
    <View style={styles.courseRow}>
      <View style={styles.courseThumb}>
        <LinearGradient colors={course.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Text style={styles.courseThumbText}>{course.code.slice(0, 3)}</Text>
      </View>
      <View style={styles.courseInfo}>
        <Text style={styles.courseMeta}>
          {course.paperIds.length} {course.paperIds.length === 1 ? 'Paper' : 'Papers'} · {course.level}
        </Text>
        <Text style={styles.courseTitle} numberOfLines={1}>
          {course.code} — {course.title}
        </Text>
        <Stars rating={course.rating} />
      </View>
      <Pressable onPress={open} style={styles.startBtn}>
        <Text style={styles.startText}>{unlocked ? 'Start' : 'Unlock'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  searchRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.gutter },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
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
    height: 210,
    borderRadius: radius.tile,
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
  sectionList: { marginTop: 6 },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.gutter,
    paddingVertical: 12,
    gap: 14,
  },
  courseThumb: {
    width: 62,
    height: 62,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseThumbText: { fontFamily: fonts.bold, fontSize: 15, color: 'rgba(255,255,255,0.85)' },
  courseInfo: { flex: 1, gap: 4 },
  courseMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  courseTitle: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  startBtn: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  startText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
});
