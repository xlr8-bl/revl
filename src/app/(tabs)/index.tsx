/**
 * Tonight (Home) — Revl's own layout, not a feed clone:
 *
 * - Editorial header: date kicker + exam countdown chip, big greeting,
 *   amber credits bolt + badged bell.
 * - "Tonight's Question" exam-paper hero (serif, marks pill, Attempt CTA).
 * - AI briefing (violet voice) above a numbered study queue.
 * - "Class activity" strip (community lives here now, not a top tab).
 * - Wrapped entry appears only inside its end-of-semester window.
 *
 * Keeps the scroll-linked top fade: content dissolves under the pinned
 * header as you scroll.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DailyBriefing } from '../../components/DailyBriefing';
import { HeroCard } from '../../components/HeroCard';
import { SessionCard } from '../../components/SessionCard';
import { communityFeed, todaySession } from '../../data/home';
import { currentUser } from '../../data/user';
import { getGreeting } from '../../lib/greeting';
import { isWrappedLive } from '../../lib/wrappedGate';
import { colors, fonts, spacing, TAB_BAR_CLEARANCE, type } from '../../theme';

/** Days until the next exam — drives the header countdown chip. */
const EXAM_IN_DAYS = 21;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState(120);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const gradientStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 70], [0, 1], 'clamp'),
  }));

  const today = new Date();
  const dateLine = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={styles.root}>
      {/* Scroll-linked top fade: content dissolves under the header. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.topFade, { height: headerHeight + 80 }, gradientStyle]}>
        <LinearGradient
          colors={[colors.bg, colors.bg, 'rgba(6,6,8,0.7)', 'rgba(6,6,8,0)']}
          locations={[0, 0.5, 0.75, 1]}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Pinned header */}
      <View
        style={[styles.header, { paddingTop: insets.top + 8 }]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <View style={styles.kickerRow}>
          <Text style={type.kicker}>{dateLine}</Text>
          <View style={styles.countdownChip}>
            <View style={styles.countdownDot} />
            <Text style={styles.countdownText}>EXAMS IN {EXAM_IN_DAYS} DAYS</Text>
          </View>
        </View>
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>
            {getGreeting()}, {currentUser.name}
          </Text>
          <View style={styles.headerIcons}>
            <Pressable onPress={() => router.push('/wallet')} style={styles.creditChip} hitSlop={8}>
              <Ionicons name="flash" size={14} color={colors.accent} />
              <Text style={styles.creditCount}>{currentUser.credits}</Text>
            </Pressable>
            <Pressable hitSlop={8}>
              <Ionicons name="notifications-outline" size={23} color={colors.text} />
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
        contentContainerStyle={{ paddingTop: headerHeight + 8, paddingBottom: TAB_BAR_CLEARANCE }}>
        <HeroCard />

        {/* Tonight's plan — AI briefing + numbered study queue */}
        <Text style={styles.sectionKicker}>YOUR PLAN TONIGHT</Text>
        <DailyBriefing />
        <View style={styles.queueCard}>
          {todaySession.map((s, i) => (
            <SessionCard key={s.id} data={s} index={i} last={i === todaySession.length - 1} />
          ))}
          <Pressable onPress={() => router.push('/dna')} style={styles.queueFooter}>
            <Ionicons name="planet-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.queueFooterText}>Built from your Study DNA</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* Wrapped entry — ONLY inside the end-of-semester window. */}
        {isWrappedLive() && (
          <Pressable onPress={() => router.push('/wrapped')} style={styles.wrappedBanner}>
            <LinearGradient
              colors={['rgba(157,151,245,0.16)', 'rgba(157,151,245,0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="sparkles" size={18} color={colors.ai} />
            <View style={{ flex: 1 }}>
              <Text style={styles.wrappedTitle}>Your semester, wrapped</Text>
              <Text style={styles.wrappedMeta}>See what your revision really looked like</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.ai} />
          </Pressable>
        )}

        {/* Class activity — community as a strip, not a tab */}
        <Text style={styles.sectionKicker}>CLASS ACTIVITY</Text>
        <View style={styles.feedCard}>
          {communityFeed.slice(0, 3).map((item, i) => (
            <View key={item.id} style={[styles.feedRow, i > 0 && styles.feedRowDivider]}>
              <View style={[styles.feedAvatar, { backgroundColor: item.color }]}>
                <Text style={styles.feedAvatarText}>{item.initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.feedLine}>
                  <Text style={{ fontFamily: fonts.medium }}>{item.user}</Text> {item.action}
                </Text>
                <Text style={styles.feedDetail}>{item.detail}</Text>
              </View>
              <Text style={styles.feedTime}>{item.time}</Text>
            </View>
          ))}
        </View>

        {/* Start here */}
        <View style={styles.beginCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.beginTitle}>New to Revl?</Text>
            <Text style={styles.beginBody}>Pick your course and revise with real past papers.</Text>
          </View>
          <Pressable
            onPress={() => router.push('/courses')}
            style={({ pressed }) => [styles.beginBtn, pressed && { transform: [{ scale: 0.96 }] }]}>
            <Text style={styles.beginBtnText}>Find courses</Text>
          </Pressable>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing.gutter,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  kickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countdownChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  countdownDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  countdownText: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1.2, color: colors.accent },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  greeting: { fontFamily: fonts.bold, fontSize: 27, color: colors.text },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  creditChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  creditCount: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.badge,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: { fontFamily: fonts.medium, fontSize: 10, color: '#FFF' },
  sectionKicker: {
    ...type.kicker,
    marginTop: 30,
    marginBottom: 12,
    paddingHorizontal: spacing.gutter + 4,
  },
  queueCard: {
    marginHorizontal: spacing.gutter,
    marginTop: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  queueFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  queueFooterText: { flex: 1, fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary },
  wrappedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: spacing.gutter,
    marginTop: 24,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(157,151,245,0.35)',
    padding: 16,
    overflow: 'hidden',
  },
  wrappedTitle: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.text },
  wrappedMeta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  feedCard: {
    marginHorizontal: spacing.gutter,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  feedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  feedRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  feedAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  feedAvatarText: { fontFamily: fonts.bold, fontSize: 14, color: '#FFF' },
  feedLine: { fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  feedDetail: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  feedTime: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary },
  beginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: spacing.gutter,
    marginTop: 26,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 18,
  },
  beginTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  beginBody: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary, marginTop: 4 },
  beginBtn: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  beginBtnText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.onAccent },
});
