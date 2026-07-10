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
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CourseCard, courseColor, wash } from '../../components/CourseCard';
import { FilterChips } from '../../components/FilterChips';
import { courseByCode, coursesFor, departmentsFor, facultiesFor, searchCatalog } from '../../data/catalog';
import type { CatalogCourse } from '../../data/catalog/types';
import { papers, unlockedPaperIds } from '../../data/papers';
import { sentenceCase } from '../../lib/format';
import { useSession } from '../../lib/session';
import { colors, fonts, spacing, TAB_BAR_CLEARANCE, themedStyleSheet, useThemeVersion } from '../../theme';

const FILTERS = ['My courses', 'Browse', 'Saved', 'Completed'];
const SUB_CHIPS = ['New', 'Popular', 'Exam season', 'Verified titles'];

/** Bright tile palette (the look from the original Courses page). */
const TILE_COLORS = ['#9D2450', '#4A3D63', '#E04B2F', '#3C6FE8', '#357F84', '#4D6FB5', '#8A6D2F', '#3E7A44', '#7A3A8A', '#A0522D'];

export default function CoursesScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { profile } = useSession();
  const [filter, setFilter] = useState('My courses');
  const [subFilter, setSubFilter] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tileFacultyId, setTileFacultyId] = useState<string | null>(null);
  /** One of my courses, focused from the quick tiles — narrows the list below. */
  const [focusedCode, setFocusedCode] = useState<string | null>(null);

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
    const byCourse = new Map<string, { code: string; title: string; years: number[]; newestId: string }>();
    papers.forEach((p) => {
      const e = byCourse.get(p.courseCode) ?? { code: p.courseCode, title: p.title, years: [], newestId: p.id };
      e.years.push(p.year);
      if (p.year >= Math.max(...e.years)) e.newestId = p.id;
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
      ? [
          {
            title: focusedCode ?? `${profile.departmentName} ${profile.school === 'ub' ? profile.level : ''}`.trim(),
            data: refine(enrolled).filter((c) => !focusedCode || c.code === focusedCode),
          },
        ]
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
          <FilterChips
            options={FILTERS}
            selected={filter}
            onSelect={(v) => {
              setFilter(v);
              setFocusedCode(null);
            }}
          />

          {/* Featured carousel — paper sets that are live today */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={featuredWidth + 12}
            decelerationRate="fast"
            contentContainerStyle={styles.carousel}>
            {featured.map((f, i) => {
              const years = [...new Set(f.years)].sort();
              const unlocked = unlockedPaperIds.has(f.newestId);
              return (
                <Pressable
                  key={f.code}
                  onPress={() => router.push(unlocked ? `/paper/${f.newestId}` : (`/unlock/${f.newestId}` as never))}
                  style={({ pressed }) => [
                    styles.featureCard,
                    { width: featuredWidth, backgroundColor: TILE_COLORS[(i + 3) % TILE_COLORS.length] },
                    pressed && { opacity: 0.92 },
                  ]}>
                  {/* Oversized ghost year — background typography, not decoration */}
                  <Text style={styles.featureGhost}>{years[years.length - 1]}</Text>

                  <View style={styles.featureTop}>
                    <Text style={styles.featureCode}>{f.code}</Text>
                    <Text style={styles.featureKicker}>Featured set</Text>
                  </View>

                  <View>
                    <Text style={styles.featureTitle} numberOfLines={2}>
                      {sentenceCase(f.title)}
                    </Text>
                    <View style={styles.featureRule} />
                    <View style={styles.featureMetaRow}>
                      <Text style={styles.featureMeta}>
                        {f.years.length} paper{f.years.length > 1 ? 's' : ''} · {years[0]}–{years[years.length - 1]}
                      </Text>
                      <Text style={styles.featureOpen}>{unlocked ? 'Open ›' : 'Unlock ›'}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Quick tiles: my courses at a glance (tap to focus one) — or
              faculty tiles when browsing the wider catalogue. */}
          {filter === 'My courses' && enrolled.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tileScroll}>
              <View style={styles.tileGrid}>
                {[0, 1].map((row) => (
                  <View key={row} style={styles.tileRow}>
                    {enrolled
                      .filter((_, i) => i % 2 === row)
                      .map((c) => {
                        const tint = courseColor(c.code);
                        const active = focusedCode === c.code;
                        const count = papers.filter((p) => p.courseCode === c.code).length;
                        return (
                          <Pressable
                            key={c.code}
                            onPress={() => setFocusedCode(active ? null : c.code)}
                            style={({ pressed }) => [
                              styles.myTile,
                              { backgroundColor: wash(tint), borderColor: active ? tint : 'transparent' },
                              pressed && { opacity: 0.85 },
                            ]}>
                            <Text style={[styles.myTileCode, { color: tint }]}>{c.code}</Text>
                            <Text style={styles.myTileTitle} numberOfLines={2}>
                              {c.title ? sentenceCase(c.title) : 'Title pending'}
                            </Text>
                            <Text style={[styles.myTileMeta, count > 0 && { color: colors.textSecondary }]}>
                              {count > 0 ? `${count} paper${count > 1 ? 's' : ''}` : 'No papers yet'}
                            </Text>
                          </Pressable>
                        );
                      })}
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : filter === 'Browse' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tileScroll}>
              <View style={styles.tileGrid}>
                {[0, 1].map((row) => (
                  <View key={row} style={styles.tileRow}>
                    {faculties
                      .filter((_, i) => i % 2 === row)
                      .map((f) => {
                        const idx = faculties.indexOf(f);
                        const active = tileFacultyId === f.id;
                        return (
                          <Pressable
                            key={f.id}
                            onPress={() => setTileFacultyId(active ? null : f.id)}
                            style={({ pressed }) => [
                              styles.tile,
                              { backgroundColor: TILE_COLORS[idx % TILE_COLORS.length] },
                              active && styles.tileActive,
                              pressed && { opacity: 0.85 },
                            ]}>
                            <Text style={styles.tileText} numberOfLines={2}>
                              {f.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : null}

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

const makeStyles = () => StyleSheet.create({
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
    justifyContent: 'space-between',
  },
  featureGhost: {
    position: 'absolute',
    right: -8,
    bottom: -26,
    fontFamily: fonts.bold,
    fontSize: 110,
    color: 'rgba(255,255,255,0.10)',
    fontVariant: ['tabular-nums'],
  },
  featureTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  featureCode: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 1, color: '#FFFFFF' },
  featureKicker: { fontFamily: fonts.regular, fontSize: 12.5, color: 'rgba(255,255,255,0.75)' },
  featureTitle: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 33, color: '#FFFFFF', paddingRight: 40 },
  featureRule: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.35)', marginTop: 12 },
  featureMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  featureMeta: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  featureOpen: { fontFamily: fonts.medium, fontSize: 13.5, color: '#FFFFFF' },
  tileScroll: { paddingHorizontal: spacing.gutter, marginTop: 24 },
  tileGrid: { gap: 10 },
  tileRow: { flexDirection: 'row', gap: 10 },
  tile: { width: 168, height: 74, borderRadius: 13, justifyContent: 'flex-end', padding: 13 },
  tileActive: { borderWidth: 2, borderColor: '#FFFFFF' },
  tileText: { fontFamily: fonts.bold, fontSize: 14.5, letterSpacing: 0.4, color: '#FFFFFF' },
  myTile: {
    width: 158,
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    justifyContent: 'space-between',
  },
  myTileCode: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.8 },
  myTileTitle: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17, color: colors.text, marginTop: 5 },
  myTileMeta: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textTertiary, marginTop: 7 },
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
const styles = themedStyleSheet(makeStyles);
