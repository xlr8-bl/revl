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
import { CreditMark } from '../../components/CreditMark';
import { DailyBriefing } from '../../components/DailyBriefing';
import { HeroCard } from '../../components/HeroCard';
import { SessionCard } from '../../components/SessionCard';
import { communityFeed, todaySession } from '../../data/home';
import { currentUser } from '../../data/user';
import { getGreeting } from '../../lib/greeting';
import { useSession } from '../../lib/session';
import { isWrappedLive } from '../../lib/wrappedGate';
import { colors, fonts, spacing, TAB_BAR_CLEARANCE, type } from '../../theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useSession();
  const firstName = profile?.name.split(' ')[0] || currentUser.name;
  const examDays = profile?.examDate
    ? Math.max(0, Math.ceil((new Date(profile.examDate).getTime() - Date.now()) / 86400000))
    : null;
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
          <Text style={styles.dateLine}>{dateLine}</Text>
          {examDays !== null && <Text style={styles.countdownText}>Exams in {examDays} days</Text>}
        </View>
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>
            {getGreeting()}, {firstName}
          </Text>
          <View style={styles.headerIcons}>
            <Pressable onPress={() => router.push('/wallet')} style={styles.creditChip} hitSlop={8}>
              <CreditMark size={15} />
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
        <SectionTitle title="Your plan tonight" />
        <DailyBriefing />
        <View style={styles.queueCard}>
          {todaySession.map((s, i) => (
            <SessionCard key={s.id} data={s} index={i} last={i === todaySession.length - 1} />
          ))}
          <Pressable onPress={() => router.push('/dna')} style={styles.queueFooter}>
            <Text style={styles.queueFooterText}>Built from your Study DNA</Text>
            <Text style={styles.queueChevron}>›</Text>
          </Pressable>
        </View>

        {/* Wrapped entry — ONLY inside the end-of-semester window. */}
        {isWrappedLive() && (
          <Pressable onPress={() => router.push('/wrapped')} style={styles.wrappedBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.wrappedTitle}>Your semester, wrapped</Text>
              <Text style={styles.wrappedMeta}>See what your revision really looked like</Text>
            </View>
            <Text style={[styles.queueChevron, { color: colors.ai }]}>›</Text>
          </Pressable>
        )}

        {/* Class activity — the department room (community scoped to your class) */}
        <Pressable onPress={() => router.push('/community' as never)}>
          <SectionTitle title={profile ? `${profile.departmentName} room` : 'Class activity'} />
        </Pressable>
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

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTick} />
      <Text style={styles.sectionTitleText}>{title}</Text>
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
  dateLine: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  countdownText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.accent },
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
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 8,
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
  sectionTitleRow: { marginTop: 32, marginBottom: 12, paddingHorizontal: spacing.gutter + 2 },
  sectionTick: { width: 18, height: 3, borderRadius: 1.5, backgroundColor: colors.accent, marginBottom: 8 },
  sectionTitleText: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  queueChevron: { fontFamily: fonts.regular, fontSize: 19, color: colors.textTertiary, marginTop: -2 },
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
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  beginBtnText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.onAccent },
});
