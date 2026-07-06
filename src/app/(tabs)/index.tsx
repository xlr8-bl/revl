/**
 * Home ("Today") — the flagship screen, mirroring reference shots 1 & 3:
 *
 * - Pinned header: "Today | Community" switcher with animated accent
 *   underline, then the greeting row (⚡ credits + bell with badge).
 * - As you scroll, the hero card slides UP AND UNDER the greeting and
 *   dissolves into a black→transparent gradient pinned to the top —
 *   the reference's signature scroll treatment.
 * - Hero = Question of the Day (serif), then the Daily Session cards,
 *   then "More for you". Wrapped entry appears only inside its window.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DailyBriefing } from '../../components/DailyBriefing';
import { HeroCard } from '../../components/HeroCard';
import { SessionCard } from '../../components/SessionCard';
import { communityFeed, todaySession } from '../../data/home';
import { currentUser } from '../../data/user';
import { getGreeting } from '../../lib/greeting';
import { isWrappedLive } from '../../lib/wrappedGate';
import { colors, fonts, spacing, TAB_BAR_CLEARANCE } from '../../theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<'Today' | 'Community'>('Today');
  const [headerHeight, setHeaderHeight] = useState(140);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // The top fade only matters once content actually slides under the
  // header — fade it in over the first ~70px of scroll.
  const gradientStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 70], [0, 1], 'clamp'),
  }));

  // Underline slides between the two switcher labels: each label reports
  // its layout once; switching tabs animates the bar to the stored frame.
  const labelFrames = useRef<Record<string, { x: number; w: number }>>({});
  const underline = useSharedValue({ x: 0, w: 58 });
  useEffect(() => {
    const frame = labelFrames.current[tab];
    if (frame) underline.value = frame;
  }, [tab, underline]);
  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(underline.value.x, { duration: 220 }) }],
    width: withTiming(underline.value.w, { duration: 220 }),
  }));

  return (
    <View style={styles.root}>
      {/* Scroll-linked top fade: black → transparent, pinned above content
          but underneath the header text, so the hero dissolves under the
          greeting instead of hard-cutting. (Gradient lives inside an
          Animated.View — animating the gradient component directly does
          not reliably apply opacity on all platforms.) */}
      <Animated.View
        pointerEvents="none"
        style={[styles.topFade, { height: headerHeight + 84 }, gradientStyle]}>
        <LinearGradient
          colors={['#000000', '#000000', 'rgba(0,0,0,0.72)', 'rgba(0,0,0,0)']}
          locations={[0, 0.45, 0.72, 1]}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Pinned header */}
      <View
        style={[styles.header, { paddingTop: insets.top + 4 }]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        {/* Today | Community switcher (solid black strip, like the reference) */}
        <View style={styles.switcherRow}>
          {(['Today', 'Community'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                labelFrames.current[t] = { x, w: width };
                if (t === tab) underline.value = { x, w: width };
              }}>
              <Text style={[styles.switcherText, tab === t && styles.switcherTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.underlineTrack}>
          <Animated.View style={[styles.underline, underlineStyle]} />
        </View>

        {/* Greeting row — content scrolls under this */}
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>
            {getGreeting()}, {currentUser.name}
          </Text>
          <View style={styles.headerIcons}>
            <Pressable onPress={() => router.push('/wallet')} style={styles.creditWrap} hitSlop={8}>
              <Ionicons name="flash-outline" size={23} color={colors.text} />
              <Text style={styles.creditCount}>{currentUser.credits}</Text>
            </Pressable>
            <Pressable hitSlop={8}>
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
              {currentUser.notifications > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{currentUser.notifications}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight + 10, paddingBottom: TAB_BAR_CLEARANCE }}>
        {tab === 'Today' ? <TodayContent /> : <CommunityContent />}
      </Animated.ScrollView>
    </View>
  );
}

function TodayContent() {
  const router = useRouter();
  return (
    <View style={styles.content}>
      <HeroCard />

      <View style={{ height: 22 }} />
      <DailyBriefing />
      <View style={{ height: 12 }} />

      {/* Daily Session cards — later derived from Study DNA (lib/selectors). */}
      <View style={{ gap: 12 }}>
        {todaySession.map((s) => (
          <SessionCard key={s.id} data={s} />
        ))}
      </View>

      {/* Wrapped entry — ONLY visible inside the end-of-semester window. */}
      {isWrappedLive() && (
        <Pressable onPress={() => router.push('/wrapped')} style={styles.wrappedBanner}>
          <LinearGradient
            colors={['#2B2358', '#151032']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.wrappedLabel}>REVL WRAPPED</Text>
            <Text style={styles.wrappedTitle}>Your semester, wrapped ✨</Text>
            <Text style={styles.wrappedMeta}>See what your revision really looked like</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>More for you</Text>

      {/* "Need a place to begin?" → Revl onboarding card */}
      <View style={styles.beginCard}>
        <View style={styles.beginLeft}>
          <Text style={styles.beginTitle}>New to Revl?</Text>
          <Text style={styles.beginBody}>Pick your course and start revising with real past papers</Text>
          <Pressable onPress={() => router.push('/courses')} style={styles.beginBtn}>
            <Text style={styles.beginBtnText}>Find Courses</Text>
          </Pressable>
        </View>
        <View style={styles.beginThumb}>
          <LinearGradient colors={['#2E4470', '#16233F']} style={StyleSheet.absoluteFill} />
          <Ionicons name="school-outline" size={34} color="rgba(255,255,255,0.9)" />
        </View>
      </View>
    </View>
  );
}

function CommunityContent() {
  return (
    <View style={[styles.content, { paddingHorizontal: spacing.gutter, gap: 12 }]}>
      {communityFeed.map((item) => (
        <View key={item.id} style={styles.feedCard}>
          <View style={[styles.feedAvatar, { backgroundColor: item.color }]}>
            <Text style={styles.feedAvatarText}>{item.initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.feedLine}>
              <Text style={{ fontFamily: fonts.bold }}>{item.user}</Text> {item.action}
            </Text>
            <Text style={styles.feedDetail}>{item.detail}</Text>
          </View>
          <Text style={styles.feedTime}>{item.time}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'transparent' },
  switcherRow: {
    flexDirection: 'row',
    gap: 26,
    paddingHorizontal: spacing.gutter,
    backgroundColor: colors.bg, // solid strip: hero never shows through the switcher
    paddingBottom: 8,
  },
  switcherText: { fontFamily: fonts.bold, fontSize: 24, color: colors.textTertiary },
  switcherTextActive: { color: colors.text },
  underlineTrack: { height: 3, marginHorizontal: spacing.gutter, backgroundColor: colors.bg },
  underline: { height: 3, borderRadius: 2, backgroundColor: colors.accent },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    paddingTop: 16,
    paddingBottom: 10,
  },
  greeting: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  creditWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  creditCount: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.badge,
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: { fontFamily: fonts.medium, fontSize: 11, color: '#FFF' },
  content: { paddingTop: 4 },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 25,
    color: colors.text,
    marginTop: 34,
    marginBottom: 14,
    paddingHorizontal: spacing.gutter,
  },
  wrappedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.gutter,
    marginTop: 12,
    borderRadius: 22,
    overflow: 'hidden',
    padding: spacing.cardPad,
  },
  wrappedLabel: { fontFamily: fonts.medium, fontSize: 11, letterSpacing: 1.2, color: '#9F8FFF' },
  wrappedTitle: { fontFamily: fonts.bold, fontSize: 19, color: colors.text, marginTop: 5 },
  wrappedMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  beginCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: spacing.cardPad,
    marginHorizontal: spacing.gutter,
    alignItems: 'center',
  },
  beginLeft: { flex: 1, paddingRight: 14 },
  beginTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  beginBody: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.textSecondary, marginTop: 6 },
  beginBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 14,
  },
  beginBtnText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  beginThumb: {
    width: 104,
    height: 104,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  feedAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  feedAvatarText: { fontFamily: fonts.bold, fontSize: 16, color: '#FFF' },
  feedLine: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  feedDetail: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  feedTime: { fontFamily: fonts.regular, fontSize: 13, color: colors.textTertiary },
});
