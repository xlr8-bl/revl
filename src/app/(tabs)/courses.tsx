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
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CourseCard, courseColor, wash } from '../../components/CourseCard';
import { CoursePapersSheet } from '../../components/CoursePapersSheet';
import { FilterChips } from '../../components/FilterChips';
import { TopFade, useScrollFade } from '../../components/ScrollFadeHeader';
import { courseByCode, coursesFor, departmentsFor, facultiesFor, searchCatalog } from '../../data/catalog';
import type { CatalogCourse } from '../../data/catalog/types';
import { papers, unlockedPaperIds } from '../../data/papers';
import { useAccessCounts } from '../../lib/courseAccess';
import { sentenceCase } from '../../lib/format';
import { useSavedCourses } from '../../lib/savedCourses';
import { useRevealLogs } from '../../lib/selectors';
import { useSession } from '../../lib/session';
import { activeScheme, colors, fonts, spacing, TAB_BAR_CLEARANCE, themedStyleSheet, useThemeVersion, withAlpha } from '../../theme';

// Primary scope (which set of courses) and secondary refinement — every one
// backed by real data, no dead chips.
const FILTERS = ['My courses', 'Browse', 'Saved', 'Studied'];
const SUB_CHIPS = ['Has papers', 'Verified', 'Most papers'];

/** Bright tile palette (the look from the original Courses page). */
// Featured-set / faculty cards carry WHITE text, so they stay mid-to-deep in
// both themes — the same warm-leaning jewel family as the course tints, one
// hue per index. Dark is a touch brighter to lift off the ink; light goes
// deeper to read as a rich premium surface on the paper. Terracotta · teal ·
// plum · gold · forest · wine · slate · violet — no bright primary blue.
const TILE_COLORS_DARK = ['#C56A45', '#2E8E82', '#9A5E86', '#B58A38', '#4E9E72', '#B8586A', '#5E72B0', '#8A72B0'];
const TILE_COLORS_LIGHT = ['#A8492B', '#256E64', '#6E3A5C', '#8A6A2C', '#3B6E4E', '#9A4351', '#465C86', '#5E4E86'];

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
  /** Featured card tapped → show its papers in a sheet. */
  const [papersSheet, setPapersSheet] = useState<{ code: string; title: string } | null>(null);
  const accessCounts = useAccessCounts();
  /** Height of the fixed part of the header (placement + title + sticky line). */
  const [baseH, setBaseH] = useState(118);
  const { scrollY, onScroll } = useScrollFade();
  const listRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  /** Search open progress (0…1) — drives the expand, content shift and icon morph. */
  const open = useSharedValue(0);
  /** Y of the first section title in the scroll content, for the sticky subtitle. */
  const sectionY = useSharedValue(600);
  const SEARCH_H = 54;

  // The section title slides up and sticks under "Courses" as you scroll into
  // it — the fade completes right as the real title reaches the header base so
  // the hand-off is seamless (no double heading, no bleed-through).
  const stickyStyle = useAnimatedStyle(() => {
    const end = sectionY.value - baseH - 4;
    return {
      opacity: interpolate(scrollY.value, [end - 34, end], [0, 1], 'clamp') * (1 - open.value),
      transform: [{ translateY: interpolate(scrollY.value, [end - 34, end], [7, 0], 'clamp') }],
    };
  });
  // The search bar grows out of the header; the content spacer grows with it so
  // everything below shifts down together, then back.
  const searchWrapStyle = useAnimatedStyle(() => ({ height: open.value * SEARCH_H, opacity: open.value }));
  const spacerStyle = useAnimatedStyle(() => ({ height: baseH + open.value * SEARCH_H + 8 }));
  // Search icon morphs to X and back (crossfade + quarter-turn).
  const searchIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - open.value,
    transform: [{ rotate: `${open.value * 90}deg` }, { scale: 1 - open.value * 0.2 }],
  }));
  const closeIconStyle = useAnimatedStyle(() => ({
    opacity: open.value,
    transform: [{ rotate: `${(open.value - 1) * 90}deg` }, { scale: 0.8 + open.value * 0.2 }],
  }));

  const featuredWidth = width - spacing.gutter * 2 - 36;
  const TILE = activeScheme() === 'light' ? TILE_COLORS_LIGHT : TILE_COLORS_DARK;

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

  const savedCodes = useSavedCourses();
  const logs = useRevealLogs();
  // Resolve a course code to a catalogue entry, falling back to paper metadata
  // for codes that only exist as papers (e.g. the extracted CEC420 set).
  const resolveCourse = (code: string): CatalogCourse | undefined => {
    const cat = courseByCode(code);
    if (cat) return cat;
    const p = papers.find((pp) => pp.courseCode === code);
    if (p) return { code, title: p.title, level: p.level, departmentId: '', verified: true, source: 'paper' };
    return undefined;
  };
  const savedCourses = useMemo(
    () => savedCodes.map(resolveCourse).filter((c): c is CatalogCourse => !!c),
    [savedCodes]
  );
  const studiedCourses = useMemo(() => {
    const codes = [...new Set(logs.map((l) => l.courseCode))];
    return codes.map(resolveCourse).filter((c): c is CatalogCourse => !!c);
  }, [logs]);

  if (!profile) return null;

  const faculties = facultiesFor(profile.school);
  const enrolledSet = new Set(profile.enrolledCourseCodes);
  const paperCount = (c: CatalogCourse) => papers.filter((p) => p.courseCode === c.code).length;
  const withPapers = (list: CatalogCourse[]) => list.filter((c) => paperCount(c) > 0);

  /**
   * Featured carousel: course sets with extracted papers, ordered by how much
   * you use them (most-accessed first) so your go-to courses are one tap away.
   */
  const featured = useMemo(() => {
    const byCourse = new Map<string, { code: string; title: string; years: number[]; newestId: string }>();
    papers.forEach((p) => {
      const e = byCourse.get(p.courseCode) ?? { code: p.courseCode, title: p.title, years: [], newestId: p.id };
      e.years.push(p.year);
      if (p.year >= Math.max(...e.years)) e.newestId = p.id;
      byCourse.set(p.courseCode, e);
    });
    return [...byCourse.values()]
      .filter((f) => f.years.length > 0)
      .sort((a, b) => (accessCounts[b.code] ?? 0) - (accessCounts[a.code] ?? 0))
      .slice(0, 6);
  }, [accessCounts]);

  const searchResults = query.trim() ? searchCatalog(profile.school, profile.departmentId, query) : [];

  // Sub-chip refinement applied to section lists.
  const refine = (list: CatalogCourse[]) => {
    if (subFilter === 'Verified') return list.filter((c) => c.verified && c.title);
    if (subFilter === 'Has papers') return withPapers(list);
    if (subFilter === 'Most papers') return [...list].sort((a, b) => paperCount(b) - paperCount(a));
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
        : filter === 'Saved'
          ? [{ title: 'Saved courses', data: refine(savedCourses) }]
          : filter === 'Studied'
            ? [{ title: 'Courses you have studied', data: refine(studiedCourses) }]
            : [{ title: filter, data: [] }];

  const stickyTitle = sections[0]?.title ?? '';
  const toggleSearch = () => {
    const next = !searchOpen;
    setSearchOpen(next);
    open.value = withTiming(next ? 1 : 0, { duration: 280, easing: Easing.out(Easing.cubic) });
    if (next) {
      listRef.current?.scrollTo({ y: 0, animated: true });
      setTimeout(() => inputRef.current?.focus(), 180);
    } else {
      setQuery('');
      inputRef.current?.blur();
    }
  };

  return (
    <View style={styles.root}>
      {/* Same clean scroll-blend as the Tonight page. */}
      <TopFade scrollY={scrollY} height={baseH + (searchOpen ? SEARCH_H : 0) + 80} />

      {/* Pinned header */}
      <View style={styles.header}>
        {/* Fixed part: placement · title + search button · sticky section title */}
        <View style={[styles.headerBase, { paddingTop: insets.top + 8 }]} onLayout={(e) => setBaseH(e.nativeEvent.layout.height)}>
          <Text style={styles.placement}>
            {profile.school === 'hnd'
              ? `${profile.departmentName} · HND`
              : `${profile.departmentName} · ${profile.level} · UB`}
          </Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Courses</Text>
            <Pressable onPress={toggleSearch} style={styles.searchBtn} hitSlop={8}>
              <Animated.View style={[styles.iconLayer, searchIconStyle]}>
                <Ionicons name="search" size={20} color={colors.text} />
              </Animated.View>
              <Animated.View style={[styles.iconLayer, closeIconStyle]}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Animated.View>
            </Pressable>
          </View>
          <Animated.Text numberOfLines={1} style={[styles.stickyTitle, stickyStyle]}>
            {stickyTitle}
          </Animated.Text>
        </View>

        {/* Search bar grows out of the header */}
        <Animated.View style={[styles.searchWrap, searchWrapStyle]}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={colors.textTertiary} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search code or title, e.g. BCH301"
              placeholderTextColor={colors.textTertiary}
              style={styles.searchInput}
              autoCapitalize="characters"
              returnKeyType="search"
            />
          </View>
        </Animated.View>
      </View>

      <Animated.ScrollView
        ref={listRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}>
      {/* Animated spacer clears the header and grows with the search bar so
          everything below shifts down together. */}
      <Animated.View style={spacerStyle} />
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
              const years = [...new Set(f.years)].sort((a, b) => a - b);
              // Gap-aware: a clean range only when the years are actually
              // contiguous; otherwise list the years so 2019 · 2021 · 2023
              // never reads as an unbroken 2019–2023.
              const contiguous = years[years.length - 1] - years[0] + 1 === years.length;
              const yearLabel = years.length === 1 ? `${years[0]}` : contiguous ? `${years[0]}–${years[years.length - 1]}` : years.join(' · ');
              const mostUsed = i === 0 && (accessCounts[f.code] ?? 0) > 0;
              return (
                <Pressable
                  key={f.code}
                  onPress={() => setPapersSheet({ code: f.code, title: f.title })}
                  style={({ pressed }) => [
                    styles.featureCard,
                    { width: featuredWidth, backgroundColor: TILE[(i + 3) % TILE.length] },
                    pressed && { opacity: 0.92 },
                  ]}>
                  {/* Oversized ghost year — background typography, not decoration */}
                  <Text style={styles.featureGhost}>{years[years.length - 1]}</Text>

                  <View style={styles.featureTop}>
                    <Text style={styles.featureCode}>{f.code}</Text>
                    <Text style={styles.featureKicker}>{mostUsed ? 'Most used' : 'Featured set'}</Text>
                  </View>

                  <View>
                    <Text style={styles.featureTitle} numberOfLines={2}>
                      {sentenceCase(f.title)}
                    </Text>
                    <View style={styles.featureRule} />
                    <View style={styles.featureMetaRow}>
                      <Text style={styles.featureMeta} numberOfLines={1}>
                        {f.years.length} paper{f.years.length > 1 ? 's' : ''} · {yearLabel}
                      </Text>
                      <Text style={styles.featureOpen}>View papers ›</Text>
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
                              {
                                backgroundColor: withAlpha(tint, activeScheme() === 'light' ? 0.14 : 0.16),
                                borderColor: active ? tint : withAlpha(tint, 0.4),
                              },
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
                              { backgroundColor: TILE[idx % TILE.length] },
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

      {sections.map((section, si) => (
        <View
          key={section.title}
          style={{ marginTop: 30 }}
          onLayout={si === 0 ? (e) => (sectionY.value = e.nativeEvent.layout.y) : undefined}>
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
                {filter === 'Saved'
                  ? 'No saved courses yet. Tap the bookmark on any course to save it here.'
                  : filter === 'Studied'
                    ? 'No study history yet. Reveal answers in a paper and those courses collect here.'
                    : subFilter
                      ? `No courses match “${subFilter}”.`
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
      </Animated.ScrollView>

      {papersSheet && (
        <CoursePapersSheet
          code={papersSheet.code}
          title={papersSheet.title}
          visible={!!papersSheet}
          onClose={() => setPapersSheet(null)}
        />
      )}
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerBase: { paddingHorizontal: spacing.gutter, paddingBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  placement: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 38, color: colors.text },
  stickyTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.textSecondary, marginTop: 6, height: 20 },
  searchWrap: { overflow: 'hidden', paddingHorizontal: spacing.gutter, justifyContent: 'flex-start' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontFamily: fonts.regular, fontSize: 15, color: colors.text },
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
