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
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CourseCard } from '../../components/CourseCard';
import { CourseCardMenu } from '../../components/CourseCardMenu';
import { CoursePapersSheet } from '../../components/CoursePapersSheet';
import { FeaturedCardShell } from '../../components/FeaturedCardShell';
import { GlassCircleButton } from '../../components/GlassCircleButton';
import { FilterChips } from '../../components/FilterChips';
import { TopFade, useScrollFade } from '../../components/ScrollFadeHeader';
import { courseByCode, coursesFor, searchCatalog } from '../../data/catalog';
import type { CatalogCourse } from '../../data/catalog/types';
import { papers, unlockedPaperIds } from '../../data/papers';
import { useOnline } from '../../lib/connectivity';
import { useAccessCounts } from '../../lib/courseAccess';
import { usePaperDownloads } from '../../lib/courseDownloads';
import { sentenceCase } from '../../lib/format';
import { useRevealLogs } from '../../lib/selectors';
import { useSession } from '../../lib/session';
import { activeScheme, colors, fonts, spacing, TAB_BAR_CLEARANCE, themedStyleSheet, useThemeVersion, withAlpha } from '../../theme';

// Primary scope (which set of courses) and secondary refinement — every one
// backed by real data, no dead chips. When the student's enrolled set covers
// the whole department list (most students), My/All collapse into one chip.
const FILTERS = ['My courses', 'All courses', 'Studied'];
const SUB_CHIPS = ['Has papers', 'Verified', 'Most papers'];

// Resolve a course code to a catalogue entry, falling back to paper metadata
// for codes that only exist as papers (e.g. the extracted CEC420 set).
/**
 * One dot of the carousel indicator. Driven directly by the scroll offset:
 * a gaussian "bump" travels through the row as you swipe (each dot lifts
 * and brightens as the motion passes through it), and the dot whose card
 * is at rest stretches into an accent pill.
 */
function CarouselDot({
  i,
  scrollX,
  interval,
  on,
  off,
}: {
  i: number;
  scrollX: SharedValue<number>;
  interval: number;
  on: string;
  off: string;
}) {
  const style = useAnimatedStyle(() => {
    const d = Math.abs(i - scrollX.value / interval);
    const focus = Math.max(0, 1 - Math.min(d, 1));
    return {
      width: 6 + 16 * focus,
      opacity: 0.45 + 0.55 * focus,
      backgroundColor: interpolateColor(focus, [0, 1], [off, on]),
      transform: [{ translateY: -5 * Math.exp(-d * d * 3) }],
    };
  });
  return <Animated.View style={[{ height: 6, borderRadius: 3 }, style]} />;
}

const resolveCourse = (code: string): CatalogCourse | undefined => {
  const cat = courseByCode(code);
  if (cat) return cat;
  const p = papers.find((pp) => pp.courseCode === code);
  if (p) return { code, title: p.title, level: p.level, departmentId: '', verified: true, source: 'paper' };
  return undefined;
};

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
  /** Raw carousel scroll offset — drives the dot wave. Re-synced at drag
      start and momentum end because the native context menu can swallow a
      stretch of scroll events, leaving the first post-menu scroll stale. */
  const carouselX = useSharedValue(0);
  const onCarouselScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      carouselX.value = e.contentOffset.x;
    },
    onBeginDrag: (e) => {
      carouselX.value = e.contentOffset.x;
    },
    onMomentumEnd: (e) => {
      carouselX.value = e.contentOffset.x;
    },
  });
  /** Featured card tapped → show its papers in a sheet. `sheetData` sticks
      around after close so the sheet can play its exit animation instead of
      unmounting mid-drag. */
  const [sheetData, setSheetData] = useState<{ code: string; title: string } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openPapers = (code: string, title: string) => {
    setSheetData({ code, title });
    setSheetOpen(true);
  };
  /** Press-and-hold fallback menu (Android/web JS overlay). iOS relies on
      the system menu alone — its own dimming plus the branded preview; an
      extra JS blur has no dismiss signal and gets stuck. */
  const [cardMenu, setCardMenu] = useState<{ code: string; title: string; meta: string } | null>(null);
  const onCardHold = (code: string, title: string, meta: string) => {
    if (Platform.OS !== 'ios') setCardMenu({ code, title, meta });
  };
  /** Press start time — only QUICK taps open papers, so a hold aimed at the
      context menu can never accidentally open the sheet on release. */
  const pressStart = useRef(0);
  const accessCounts = useAccessCounts();
  /** Height of the fixed part of the header — seeded close to the measured
      value (inset + placement + title row) so the first layout doesn't jump. */
  const [baseH, setBaseH] = useState(insets.top + 82);
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
  // the hand-off is seamless (no double heading, no bleed-through). At the
  // same moment the placement kicker ("Accountancy · HND") animates OUT and
  // the title block lifts to rebalance — no redundant "Accountancy" stack.
  /** Measured kicker height (+margin) — the lift travels exactly this far,
      so the title row and buttons take over the kicker's space completely. */
  const [kickerH, setKickerH] = useState(22);
  // The handoff runs as a TIMED glide (not scroll-mapped): crossing the
  // threshold retargets a 280ms ease-in-out, so even a violent flick plays
  // the same smooth exchange instead of snapping through it.
  const dedupP = useDerivedValue(() => {
    const end = sectionY.value - baseH - 4;
    const active = scrollY.value > end - 40;
    return withTiming(active ? 1 : 0, { duration: 280, easing: Easing.inOut(Easing.cubic) });
  });
  // Lift = kicker height + 6 of the top padding: the title block ends up
  // nearly flush under the status bar, just a sliver of air above it.
  const stickyStyle = useAnimatedStyle(() => {
    const p = dedupP.value;
    return {
      opacity: p * (1 - open.value),
      transform: [{ translateY: 9 * (1 - p) - (kickerH + 6) * p }],
    };
  });
  const kickerStyle = useAnimatedStyle(() => {
    const p = dedupP.value;
    return { opacity: 1 - p, transform: [{ translateY: -8 * p }] };
  });
  const liftStyle = useAnimatedStyle(() => {
    const p = dedupP.value;
    return { transform: [{ translateY: -(kickerH + 6) * p }] };
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

  const enrolled = useMemo(
    () =>
      (profile?.enrolledCourseCodes ?? [])
        .map(resolveCourse)
        .filter((c): c is CatalogCourse => !!c),
    [profile]
  );
  const departmentCourses = useMemo(
    () => (profile ? coursesFor(profile.school, profile.departmentId, profile.level) : []),
    [profile]
  );

  const online = useOnline();
  const paperStates = usePaperDownloads();
  const logs = useRevealLogs();
  const studiedCourses = useMemo(() => {
    const codes = [...new Set(logs.map((l) => l.courseCode))];
    return codes.map(resolveCourse).filter((c): c is CatalogCourse => !!c);
  }, [logs]);

  if (!profile) return null;

  // If everything you're enrolled in IS the department list (true for HND and
  // most UB levels), "My courses" and "All courses" would show the same list —
  // collapse them into a single chip instead of offering a dead distinction.
  const myIsAll =
    enrolled.length === 0 ||
    (enrolled.length === departmentCourses.length &&
      enrolled.every((c) => departmentCourses.some((d) => d.code === c.code)));
  const filterOptions = myIsAll ? ['All courses', 'Studied'] : FILTERS;
  // The selected scope, mapped onto the visible chips (state defaults to
  // 'My courses', which doesn't exist when the sets are merged).
  const scope = myIsAll && filter === 'My courses' ? 'All courses' : filter;

  const paperCount = (c: CatalogCourse) => papers.filter((p) => p.courseCode === c.code).length;
  const withPapers = (list: CatalogCourse[]) => list.filter((c) => paperCount(c) > 0);

  /**
   * Featured carousel: course sets with extracted papers, scoped by the
   * active filter (your courses / downloaded / studied) and always ranked
   * by how much you use them — your go-to sets ride first.
   */
  const scopeCodes =
    scope === 'My courses'
      ? new Set(enrolled.map((c) => c.code))
      : scope === 'Studied'
        ? new Set(studiedCourses.map((c) => c.code))
        : null; // All courses — every paper set qualifies
  const byCourse = new Map<string, { code: string; title: string; years: number[] }>();
  papers.forEach((p) => {
    const e = byCourse.get(p.courseCode) ?? { code: p.courseCode, title: p.title, years: [] };
    e.years.push(p.year);
    byCourse.set(p.courseCode, e);
  });
  // Hard cap of THREE: featured means featured — your top sets, nothing more.
  const featured = [...byCourse.values()]
    .filter((f) => f.years.length > 0 && (!scopeCodes || scopeCodes.has(f.code)))
    .sort((a, b) => (accessCounts[b.code] ?? 0) - (accessCounts[a.code] ?? 0))
    .slice(0, 3);

  // Context-aware search: online searches the full index (the "database");
  // offline searches only what's on this phone — courses whose papers are
  // downloaded — so results are always genuinely openable.
  const searchingOffline = online === false;
  const searchResults = query.trim()
    ? (() => {
        const q = query.trim().toLowerCase();
        const all = searchCatalog(profile.school, profile.departmentId, query);
        // Index paper metadata too — courses that only exist as extracted
        // paper sets (e.g. CEC420) must be findable by code or title.
        const paperMatches = [
          ...new Set(
            papers
              .filter((p) => p.courseCode.toLowerCase().includes(q) || p.title.toLowerCase().includes(q))
              .map((p) => p.courseCode)
          ),
        ]
          .filter((code) => !all.some((c) => c.code === code))
          .map(resolveCourse)
          .filter((c): c is CatalogCourse => !!c);
        const combined = [...paperMatches, ...all];
        if (!searchingOffline) return combined;
        const local = new Set(
          papers.filter((p) => paperStates[p.id]?.status === 'done').map((p) => p.courseCode)
        );
        return combined.filter((c) => local.has(c.code));
      })()
    : [];

  // Sub-chip refinement applied to section lists.
  const refine = (list: CatalogCourse[]) => {
    if (subFilter === 'Verified') return list.filter((c) => c.verified && c.title);
    if (subFilter === 'Has papers') return withPapers(list);
    if (subFilter === 'Most papers') return [...list].sort((a, b) => paperCount(b) - paperCount(a));
    return list;
  };

  const deptTitle = `${profile.departmentName} ${profile.school === 'ub' ? profile.level : ''}`.trim();
  const sections: { title: string; data: CatalogCourse[] }[] = query.trim()
    ? [
        {
          title: searchingOffline ? `On this phone for "${query.trim()}"` : `Results for "${query.trim()}"`,
          data: searchResults,
        },
      ]
    : scope === 'My courses'
      ? [{ title: deptTitle, data: refine(enrolled) }]
      : scope === 'All courses'
        ? [{ title: deptTitle, data: refine(departmentCourses) }]
        : scope === 'Studied'
          ? [{ title: 'Courses you have studied', data: refine(studiedCourses) }]
          : [{ title: scope, data: [] }];

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
      {/* Same seamless blend as Tonight: a transparent header sits over a
          scroll-linked gradient that dissolves from the page bg to clear, so
          content fades under the title instead of hitting a hard edge. */}
      <TopFade scrollY={scrollY} solid={baseH + (searchOpen ? SEARCH_H : 0)} fade={26} />

      {/* Pinned header */}
      <View style={styles.header}>
        {/* Fixed part: placement · title + search button */}
        <View style={[styles.headerBase, { paddingTop: insets.top + 8 }]} onLayout={(e) => setBaseH(e.nativeEvent.layout.height)}>
          <Animated.Text
            style={[styles.placement, kickerStyle]}
            onLayout={(e) => setKickerH(Math.round(e.nativeEvent.layout.height + 2))}>
            {profile.school === 'hnd'
              ? `${profile.departmentName} · HND`
              : `${profile.departmentName} · ${profile.level} · UB`}
          </Animated.Text>
          <Animated.View style={[styles.titleRow, liftStyle]}>
            <Text style={styles.title}>Courses</Text>
            <GlassCircleButton onPress={() => router.push('/downloads' as never)}>
              <Ionicons name="arrow-down-circle-outline" size={21} color={colors.text} />
            </GlassCircleButton>
            <GlassCircleButton onPress={toggleSearch}>
              <Animated.View style={[styles.iconLayer, searchIconStyle]}>
                <Ionicons name="search" size={20} color={colors.text} />
              </Animated.View>
              <Animated.View style={[styles.iconLayer, closeIconStyle]}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Animated.View>
            </GlassCircleButton>
          </Animated.View>
        </View>

        {/* Section title floats just under the header base and sticks there as
            you scroll into a section — absolute so it never reserves an empty
            gap under "Courses" when hidden. */}
        <Animated.Text numberOfLines={1} style={[styles.stickyTitle, { top: baseH - 2 }, stickyStyle]}>
          {stickyTitle}
        </Animated.Text>

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
        // Native tabs make UIKit auto-inset scroll content by the safe area —
        // stacked on our own header spacer that read as a dead gap between
        // the heading and the filters. We manage the offset ourselves.
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}>
      {/* Animated spacer clears the header and grows with the search bar so
          everything below shifts down together. */}
      <Animated.View style={spacerStyle} />
      {!query.trim() && (
        <>
          <FilterChips options={filterOptions} selected={scope} onSelect={setFilter} />

          {/* Featured carousel — paper sets that are live today */}
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={featuredWidth + 12}
            decelerationRate="fast"
            onScroll={onCarouselScroll}
            scrollEventThrottle={16}
            // Never clip the native menu Hosts — clipped-out cards were
            // occasionally failing to re-render (the vanishing third card).
            removeClippedSubviews={false}
            contentContainerStyle={styles.carousel}>
            {featured.map((f, i) => {
              const years = [...new Set(f.years)].sort((a, b) => a - b);
              // Gap-aware: a clean range only when the years are actually
              // contiguous; otherwise list the years so 2019 · 2021 · 2023
              // never reads as an unbroken 2019–2023.
              const contiguous = years[years.length - 1] - years[0] + 1 === years.length;
              const yearLabel = years.length === 1 ? `${years[0]}` : contiguous ? `${years[0]}–${years[years.length - 1]}` : years.join(' · ');
              const mostUsed = i === 0 && (accessCounts[f.code] ?? 0) > 0;
              const cardMeta = `${f.years.length} paper${f.years.length > 1 ? 's' : ''} · ${yearLabel}`;
              // Shared body: rendered once as the visible card and once as
              // the context-menu lift preview (pixel-identical duplicate).
              const cardBody = (
                <>
                  {/* Oversized ghost year — background typography, not decoration */}
                  <Text style={styles.featureGhost}>{years[years.length - 1]}</Text>

                  <View style={styles.featureTop}>
                    <Text style={styles.featureCode}>{f.code}</Text>
                    {mostUsed ? (
                      <View style={styles.featurePill}>
                        <Ionicons name="star" size={12} color={colors.accent} />
                        <Text style={styles.featurePillText}>Most used</Text>
                      </View>
                    ) : (
                      <Text style={styles.featureKicker}>Featured set</Text>
                    )}
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
                </>
              );
              return (
                <View key={f.code} style={{ width: featuredWidth, height: 190 }}>
                {/* iOS: the visible card stays pure RN (no SwiftUI layout can
                    squash it); a transparent native-menu layer handles tap and
                    hold, and the lift shows a duplicate. Others: the card's
                    own handlers + the JS blur overlay. */}
                <FeaturedCardShell
                  width={featuredWidth}
                  height={190}
                  code={f.code}
                  title={f.title}
                  meta={cardMeta}
                  onViewPapers={() => openPapers(f.code, f.title)}
                  preview={<View style={[styles.featureCard, { width: featuredWidth }]}>{cardBody}</View>}>
                <Pressable
                  onPressIn={() => (pressStart.current = Date.now())}
                  onPress={() => {
                    if (Date.now() - pressStart.current < 250) openPapers(f.code, f.title);
                  }}
                  onLongPress={() => onCardHold(f.code, f.title, cardMeta)}
                  delayLongPress={280}
                  style={({ pressed }) => [
                    styles.featureCard,
                    { width: featuredWidth },
                    pressed && { opacity: 0.92 },
                  ]}>
                  {cardBody}
                </Pressable>
                </FeaturedCardShell>
                </View>
              );
            })}
          </Animated.ScrollView>

          {/* Position dots — a wave: as you swipe, the "energy" travels
              through the row (dots lift and tint as the scroll passes),
              and the resting card's dot stretches into a pill. */}
          {featured.length > 1 && (
            <View style={styles.dotsRow}>
              {featured.map((f, i) => (
                <CarouselDot
                  key={f.code}
                  i={i}
                  scrollX={carouselX}
                  interval={featuredWidth + 12}
                  on={colors.accent}
                  off={colors.borderStrong}
                />
              ))}
            </View>
          )}

          <View style={{ marginTop: 18 }}>
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
          {/* Sections list every course already — a "See All" would have
              nothing more to show, so the row is just the title. */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <View style={{ paddingHorizontal: spacing.gutter }}>
            {section.data.length === 0 ? (
              <Text style={styles.empty}>
                {query.trim() && searchingOffline
                  ? "You're offline — only downloaded courses can be searched. Connect to search everything."
                  : scope === 'Studied'
                    ? 'No study history yet. Reveal answers in a paper and those courses collect here.'
                    : subFilter
                      ? `No courses match “${subFilter}”.`
                      : 'Nothing here yet.'}
              </Text>
            ) : (
              section.data.map((c, i) => (
                <CourseCard key={`${section.title}-${c.code}`} course={c} index={i} onHold={onCardHold} />
              ))
            )}
          </View>
        </View>
      ))}

        <Text style={styles.footnote}>
          Catalogue from the official UB 2023/24 teaching timetable and the current national HND program.
        </Text>
      </Animated.ScrollView>

      {sheetData && (
        <CoursePapersSheet
          code={sheetData.code}
          title={sheetData.title}
          visible={sheetOpen}
          onClose={() => setSheetOpen(false)}
        />
      )}

      {cardMenu && (
        <CourseCardMenu
          code={cardMenu.code}
          title={cardMenu.title}
          meta={cardMenu.meta}
          onClose={() => setCardMenu(null)}
          onViewPapers={() => openPapers(cardMenu.code, cardMenu.title)}
        />
      )}

    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerBase: { paddingHorizontal: spacing.gutter, paddingBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 },
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
  // Balanced against the 38pt "Courses" above it: real ink, bold, sized as
  // a proper subtitle rather than a grey caption.
  stickyTitle: {
    position: 'absolute',
    left: spacing.gutter,
    right: spacing.gutter,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
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
  // Vertical padding gives the iOS context-menu "grow" its headroom — the
  // card scales up in place before lifting, and without this the bottom
  // edge clips against the scroll bounds.
  carousel: { paddingHorizontal: spacing.gutter, gap: 12, marginTop: 12, paddingVertical: 10 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 6, marginTop: 4, height: 14 },
  // Same calm surface as the Question-of-the-Day hero: a flat card on the
  // page, hairline border, accent used only as small accents (the code, the
  // action) — not a full orange wash, which read harsh. OPAQUE (colors.card
  // is a solid hex) so the iOS context-menu lift never shows the neighbour
  // through the preview.
  featureCard: {
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 18,
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  // The oversized year is now the card's one warm signature — a faint accent
  // watermark, low enough to sit under the text without shouting.
  featureGhost: {
    position: 'absolute',
    right: -8,
    bottom: -26,
    fontFamily: fonts.bold,
    fontSize: 110,
    color: withAlpha(colors.accent, activeScheme() === 'light' ? 0.09 : 0.12),
    fontVariant: ['tabular-nums'],
  },
  featureTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featureCode: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 1, color: colors.accent },
  featureKicker: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textTertiary },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.card,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featurePillText: { fontFamily: fonts.medium, fontSize: 12, color: colors.accent },
  featureTitle: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 31, color: colors.text, paddingRight: 40 },
  featureRule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: 12 },
  featureMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  featureMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  featureOpen: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.accent },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    marginBottom: 12,
  },
  sectionTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 21, color: colors.text, paddingRight: 10 },
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
