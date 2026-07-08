/**
 * Courses — the landing tab. Fully dynamic: everything on this screen
 * derives from the student's profile (school → faculty → department →
 * level) and the UB/HND catalogue. Working search over the scoped
 * catalogue, enrolled courses first, then the rest of the department.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CourseCard } from '../../components/CourseCard';
import { FilterChips } from '../../components/FilterChips';
import { courseByCode, coursesFor, searchCatalog } from '../../data/catalog';
import type { CatalogCourse } from '../../data/catalog/types';
import { papers } from '../../data/papers';
import { useSession } from '../../lib/session';
import { colors, fonts, spacing, TAB_BAR_CLEARANCE } from '../../theme';

const FILTERS = ['My courses', 'Department', 'With papers'];

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [filter, setFilter] = useState('My courses');
  const [query, setQuery] = useState('');

  const enrolled = useMemo(
    () =>
      (profile?.enrolledCourseCodes ?? [])
        .map((code) => courseByCode(code))
        .filter((c): c is CatalogCourse => !!c),
    [profile]
  );

  const departmentCourses = useMemo(
    () => (profile ? coursesFor(profile.school, profile.departmentId, profile.level) : []),
    [profile]
  );

  const searchResults = useMemo(
    () => (profile && query.trim() ? searchCatalog(profile.school, profile.departmentId, query) : []),
    [profile, query]
  );

  if (!profile) return null;

  const enrolledSet = new Set(profile.enrolledCourseCodes);
  const rest = departmentCourses.filter((c) => !enrolledSet.has(c.code));
  const withPapers = [...enrolled, ...rest].filter((c) => papers.some((p) => p.courseCode === c.code));

  const list: { title: string; data: CatalogCourse[] }[] = query.trim()
    ? [{ title: `Results for "${query.trim()}"`, data: searchResults }]
    : filter === 'My courses'
      ? [
          { title: 'Your courses', data: enrolled },
          ...(rest.length ? [{ title: 'Also in your department', data: rest }] : []),
        ]
      : filter === 'Department'
        ? [{ title: profile.departmentName, data: departmentCourses }]
        : [{ title: 'Courses with past papers', data: withPapers }];

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE }}>
      {/* Placement header — this screen is scoped to who you are */}
      <Text style={styles.placement}>
        {profile.school === 'hnd'
          ? `${profile.departmentName} · HND`
          : `${profile.departmentName} · ${profile.level} · UB`}
      </Text>
      <Text style={styles.title}>Courses</Text>

      {/* Working search over the scoped catalogue */}
      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search code or title, e.g. BCH301"
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
          autoCapitalize="characters"
        />
        {query.length > 0 && (
          <Text onPress={() => setQuery('')} style={styles.clear}>
            Clear
          </Text>
        )}
      </View>

      {!query.trim() && (
        <View style={{ marginTop: 4, marginBottom: 8 }}>
          <FilterChips options={FILTERS} selected={filter} onSelect={setFilter} />
        </View>
      )}

      {list.map((section) => (
        <View key={section.title} style={{ marginTop: 18 }}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionTick} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
          <View style={{ paddingHorizontal: spacing.gutter }}>
            {section.data.length === 0 ? (
              <Text style={styles.empty}>Nothing here yet.</Text>
            ) : (
              section.data.map((c, i) => <CourseCard key={`${section.title}-${c.code}`} course={c} index={i} />)
            )}
          </View>
        </View>
      ))}

      <Text style={styles.footnote}>
        Catalogue built from the official UB 2023/24 teaching timetable and the current national HND program.
        Spot an error? Long-press a course to report it (coming soon).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  placement: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, paddingHorizontal: spacing.gutter },
  title: { fontFamily: fonts.bold, fontSize: 36, color: colors.text, paddingHorizontal: spacing.gutter, marginTop: 4, marginBottom: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.gutter,
    marginBottom: 14,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  clear: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary, paddingLeft: 10 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingHorizontal: spacing.gutter + 2,
    marginBottom: 10,
  },
  sectionTick: { width: 16, height: 3, borderRadius: 1.5, backgroundColor: colors.accent, alignSelf: 'center' },
  sectionTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  sectionCount: { fontFamily: fonts.regular, fontSize: 13, color: colors.textTertiary },
  empty: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.textTertiary, paddingVertical: 8 },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.textTertiary,
    paddingHorizontal: spacing.gutter,
    marginTop: 20,
  },
});
