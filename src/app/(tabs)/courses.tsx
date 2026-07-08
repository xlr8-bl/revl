/**
 * Courses — landing tab, in the original page architecture:
 *
 *   search circle · big title · filter chips · featured carousel ·
 *   bright faculty tiles · secondary chips · "Section · See All" lists
 *
 * ...but everything is driven by the student's profile + the UB/HND
 * catalogue, and course rows use the big index cards with the course's
 * past papers inline (Papers and Courses are one page).
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CourseCard } from '../../components/CourseCard';
import { FilterChips } from '../../components/FilterChips';
import { courseByCode, coursesFor, departmentsFor, facultiesFor, searchCatalog } from '../../data/catalog';
import type { CatalogCourse } from '../../data/catalog/types';
import { papers } from '../../data/papers';
import { useSession } from '../../lib/session';
import { colors, fonts, spacing, TAB_BAR_CLEARANCE } from '../../theme';

const FILTERS = ['My courses', 'Browse', 'Saved', 'Completed'];
const SUB_CHIPS = ['New', 'Popular', 'Exam season', 'Verified titles'];

/** Bright tile palette (the look from the original Courses page). */
const TILE_COLORS = ['#9D2450', '#4A3D63', '#E04B2F', '#3C6FE8', '#357F84', '#4D6FB5', '#8A6D2F', '#3E7A44', '#7A3A8A', '#A0522D'];

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile } = useSession();
  const [filter, setFilter] = useState('My courses');
  const [subFilter, setSubFilter] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tileFacultyId, setTileFacultyId] = useState<string | null>(null);

  const featuredWidth = width - spacing.gutter * 2 - 36;

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

  if (!profile) return null;

  const faculties = facultiesFor(profile.school);
  const enrolledSet = new Set(profile.enrolledCourseCodes);
  const withPapers = (list: CatalogCourse[]) => list.filter((c) => papers.some((p) => p.courseCode === c.code));

  /** Featured carousel: course sets that actually have extracted papers. */
  const featured = useMemo(() => {
    const byCourse = new Map<string, { code: string; title: string; years: number[] }>();
    papers.forEach((p) => {
      const e = byCourse.get(p.courseCode) ?? { code: p.courseCode, title: p.title, years: [] };
      e.years.push(p.year);
      byCourse.set(p.courseCode, e);
    });
    return [...byCourse.values()].filter((f) => f.years.length > 0).slice(0, 4);
  }, []);

  const searchResults = query.trim() ? searchCatalog(profile.school, profile.departmentId, query) : [];

  // Sub-chip refinement applied to section lists.
  const refine = (list: CatalogCourse[]) => {
    if (subFilter === 'Verified titles') return list.filter((c) => c.verified && c.title);
    if (subFilter === 'Exam season') return withPapers(list);
    return list;
  };

  const tileFaculty = tileFacultyId ? faculties.find((f) => f.id === tileFacultyId) : null;
  const tileCourses = tileFaculty
    ? departmentsFor(tileFaculty.id).flatMap((d) => coursesFor(profile.school, d.id, profile.level)).slice(0, 8)
    : [];

  const sections: { title: string; data: CatalogCourse[] }[] = query.trim()
    ? [{ title: `Results for "${query.trim()}"`, data: searchResults }]
    : filter === 'My courses'
      ? [{ title: `${profile.departmentName} ${profile.school === 'ub' ? profile.level : ''}`.trim(), data: refine(enrolled) }]
      : filter === 'Browse'
        ? [
            { title: `${profile.departmentName} ${profile.school === 'ub' ? profile.level : ''}`.trim(), data: refine(departmentCourses) },
            ...(tileFaculty ? [{ title: tileFaculty.name, data: refine(tileCourses) }] : []),
          ]
        : [{ title: filter, data: [] }];

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: TAB_BAR_CLEARANCE }}>
      {/* Search circle, floated top right */}
      <View style={styles.searchRow}>
        <Pressable
          onPress={() => {
            setSearchOpen((v) => !v);
            if (searchOpen) setQuery('');
          }}
          style={styles.searchBtn}
          hitSlop={6}>
          <Ionicons name={searchOpen ? 'close' : 'search'} size={20} color={colors.text} />
        </Pressable>
      </View>

      <Text style={styles.placement}>
        {profile.school === 'hnd'
          ? `${profile.departmentName} · HND`
          : `${profile.departmentName} · ${profile.level} · UB`}
      </Text>
      <Text style={styles.title}>Courses</Text>

      {searchOpen && (
        <View style={styles.searchBox}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search code or title, e.g. BCH301"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            autoFocus
            autoCapitalize="characters"
          />
        </View>
      )}

      {!query.trim() && (
        <>
          <FilterChips options={FILTERS} selected={filter} onSelect={setFilter} />

          {/* Featured carousel — paper sets that are live today */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={featuredWidth + 12}
            decelerationRate="fast"
            contentContainerStyle={styles.carousel}>
            {featured.map((f, i) => {
              const years = [...new Set(f.years)].sort();
              return (
                <View key={f.code} style={{ width: featuredWidth }}>
                  <View style={[styles.featureCard, { width: featuredWidth, backgroundColor: TILE_COLORS[(i + 3) % TILE_COLORS.length] }]}>
                    <View style={styles.featureBadge}>
                      <Text style={styles.featureBadgeText}>FEATURED SET</Text>
                    </View>
                    <Text style={styles.featureTitle}>{f.title.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.featureCaption} numberOfLines={1}>
                    {f.code} · Complete past-paper set · {years[0]}–{years[years.length - 1]}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Bright faculty tiles — 2-row horizontal grid */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tileScroll}>
            <View style={styles.tileGrid}>
              {[0, 1].map((row) => (
                <View key={row} style={styles.tileRow}>
                  {faculties
                    .filter((_, i) => i % 2 === row)
                    .map((f, i) => {
                      const idx = faculties.indexOf(f);
                      const active = tileFacultyId === f.id;
                      return (
                        <Pressable
                          key={f.id}
                          onPress={() => {
                            setTileFacultyId(active ? null : f.id);
                            setFilter('Browse');
                          }}
                          style={({ pressed }) => [
                            styles.tile,
                            { backgroundColor: TILE_COLORS[idx % TILE_COLORS.length] },
                            active && styles.tileActive,
                            pressed && { opacity: 0.85 },
                          ]}>
                          <Text style={styles.tileText} numberOfLines={2}>
                            {f.name.toUpperCase()}
                          </Text>
                        </Pressable>
                      );
                    })}
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={{ marginTop: 22 }}>
            <FilterChips
              options={SUB_CHIPS}
              selected={subFilter}
              onSelect={(v) => setSubFilter(v === subFilter ? null : v)}
              variant="outline"
            />
          </View>
        </>
      )}

      {sections.map((section) => (
        <View key={section.title} style={{ marginTop: 30 }}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.data.length > 4 && (
              <Pressable hitSlop={8} style={styles.seeAll}>
                <Text style={styles.seeAllText}>See All</Text>
                <Text style={styles.seeAllChevron}>›</Text>
              </Pressable>
            )}
          </View>
          <View style={{ paddingHorizontal: spacing.gutter }}>
            {section.data.length === 0 ? (
              <Text style={styles.empty}>
                {section.title === 'Saved' || section.title === 'Completed'
                  ? 'Nothing here yet. Papers you save or finish will collect here.'
                  : 'Nothing here yet.'}
              </Text>
            ) : (
              section.data.map((c, i) => <CourseCard key={`${section.title}-${c.code}`} course={c} index={i} />)
            )}
          </View>
        </View>
      ))}

      <Text style={styles.footnote}>
        Catalogue from the official UB 2023/24 teaching timetable and the current national HND program.
      </Text>
    </ScrollView>
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
  placement: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, paddingHorizontal: spacing.gutter, marginTop: 2 },
  title: {
    fontFamily: fonts.bold,
    fontSize: 38,
    color: colors.text,
    paddingHorizontal: spacing.gutter,
    marginTop: 4,
    marginBottom: 18,
  },
  searchBox: {
    marginHorizontal: spacing.gutter,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  searchInput: { paddingVertical: 12, fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  carousel: { paddingHorizontal: spacing.gutter, gap: 12, marginTop: 22 },
  featureCard: {
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 18,
    justifyContent: 'center',
  },
  featureBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  featureBadgeText: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1.2, color: colors.text },
  featureTitle: { fontFamily: fonts.bold, fontSize: 30, letterSpacing: 0.5, color: '#FFFFFF', textAlign: 'center' },
  featureCaption: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.text, marginTop: 10 },
  tileScroll: { paddingHorizontal: spacing.gutter, marginTop: 24 },
  tileGrid: { gap: 10 },
  tileRow: { flexDirection: 'row', gap: 10 },
  tile: { width: 168, height: 74, borderRadius: 13, justifyContent: 'flex-end', padding: 13 },
  tileActive: { borderWidth: 2, borderColor: '#FFFFFF' },
  tileText: { fontFamily: fonts.bold, fontSize: 14.5, letterSpacing: 0.4, color: '#FFFFFF' },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    marginBottom: 12,
  },
  sectionTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 21, color: colors.text, paddingRight: 10 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  seeAllChevron: { fontFamily: fonts.regular, fontSize: 17, color: colors.textSecondary },
  empty: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.textTertiary, paddingVertical: 8 },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.textTertiary,
    paddingHorizontal: spacing.gutter,
    marginTop: 22,
  },
});
