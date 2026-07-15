/**
 * Today/Tonight (Home) — the LANDING tab (index route): the daily plan is
 * the front door, Courses is the library one tab over.
 *
 * - Editorial header: date kicker + exam countdown, big greeting, badged bell.
 * - "Tonight's Question" exam-paper hero — real per-student pick, Attempt
 *   deep-links to the exact question.
 * - AI briefing above the study queue, both real queries over the reveal
 *   log (lib/studySessions); honest starter state for brand-new accounts.
 * - "Class activity" strip — public acts only (see docs/FRIENDS_PRIVACY.md).
 * - Wrapped entry appears only inside its end-of-semester window.
 *
 * Keeps the scroll-linked top fade: content dissolves under the pinned
 * header as you scroll.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCircleButton } from '../../components/GlassCircleButton';
import { TopFade } from '../../components/ScrollFadeHeader';
import { DailyBriefing } from '../../components/DailyBriefing';
import { HeroCard } from '../../components/HeroCard';
import { SessionCard } from '../../components/SessionCard';
import { seedDemoNotifications } from '../../lib/notificationSeeds';
import { useNotifications } from '../../lib/notificationsStore';
import { useRevealLogs } from '../../lib/selectors';
import { buildTodayPlan } from '../../lib/studySessions';
import { currentUser } from '../../data/user';
import { getGreeting, planWord } from '../../lib/greeting';
import { useSession } from '../../lib/session';
import { isWrappedLive } from '../../lib/wrappedGate';
import { colors, fonts, spacing, TAB_BAR_CLEARANCE, type, themedStyleSheet, useThemeVersion, withAlpha } from '../../theme';

export default function HomeScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useSession();
  const firstName = profile?.name.split(' ')[0] || currentUser.name;
  const examDays = profile?.examDate
    ? Math.max(0, Math.ceil((new Date(profile.examDate).getTime() - Date.now()) / 86400000))
    : null;
  const [headerHeight, setHeaderHeight] = useState(120);
  const unread = useNotifications().filter((n) => n.unread).length;

  // The plan is a real query over your reveal log — not mock cards. A brand
  // new account gets an honest starter session instead of fake sessions.
  const logs = useRevealLogs();
  const plan = buildTodayPlan(logs, profile?.enrolledCourseCodes ?? []);

  // Demo event pipeline — idempotent; the server phase pushes for real.
  useEffect(() => {
    seedDemoNotifications({
      enrolledCourseCodes: profile?.enrolledCourseCodes,
      examDateISO: profile?.examDate,
    });
  }, [profile]);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const today = new Date();
  const dateLine = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={styles.root}>
      {/* Same progressive-blur blend as Courses: content properly blurs as
          it slides under the greeting, ending just below the header. */}
      <TopFade scrollY={scrollY} solid={headerHeight} fade={26} />

      {/* Pinned header */}
      <View
        style={[styles.header, { paddingTop: insets.top + 8 }]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        {/* One quiet kicker line — date and countdown as a single sentence,
            no icon (the tab bar already carries the daypart). */}
        <Text style={styles.dateLine}>
          {dateLine}
          {examDays !== null && (
            <Text style={styles.countdownText}> · Exams in {examDays} days</Text>
          )}
        </Text>
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>
            {getGreeting()}, {firstName}
          </Text>
          {/* ONE control. Credits live on You → wallet and the unlock sheet. */}
          <GlassCircleButton onPress={() => router.push('/notifications' as never)}>
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            {unread > 0 && <View style={styles.bellDot} />}
          </GlassCircleButton>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        // Native tabs auto-inset scroll content on iOS — stacked on our own
        // header padding it reads as a dead gap (same fix as Courses).
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={{ paddingTop: headerHeight + 8, paddingBottom: TAB_BAR_CLEARANCE }}>
        <HeroCard />

        {/* Tonight's plan — AI briefing + numbered study queue */}
        <SectionTitle title={`Your plan ${planWord(today)}`} />
        <DailyBriefing />
        <View style={styles.queueCard}>
          {plan.map((s, i) => (
            <SessionCard key={s.id} data={s} index={i} last={i === plan.length - 1} />
          ))}
          <Pressable onPress={() => router.push('/dna')} style={styles.queueFooter}>
            <Text style={styles.queueFooterText}>
              {logs.length > 0
                ? 'Built from your Study DNA'
                : 'Gets personal as you attempt and reveal'}
            </Text>
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

        {/* The department room lives in the Class tab — Today just carries a
            slim doorway to it, not a second copy of the feed. */}
        <Pressable
          onPress={() => router.push('/community' as never)}
          style={({ pressed }) => [styles.roomLink, pressed && { opacity: 0.7 }]}>
          <Ionicons name="people-outline" size={19} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.roomLinkTitle}>{profile ? `${profile.departmentName} room` : 'Your class room'}</Text>
            <Text style={styles.roomLinkSub}>Ask, solve and see what the class is working on</Text>
          </View>
          <Text style={styles.queueChevron}>›</Text>
        </Pressable>

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

const makeStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
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
  dateLine: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  countdownText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.accent },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  greeting: { fontFamily: fonts.bold, fontSize: 27, color: colors.text },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
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
    backgroundColor: withAlpha(colors.text, 0.02),
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
    borderColor: withAlpha(colors.ai, 0.35),
    padding: 16,
    overflow: 'hidden',
  },
  wrappedTitle: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.text },
  wrappedMeta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  roomLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: spacing.gutter,
    marginTop: 24,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  roomLinkTitle: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.text },
  roomLinkSub: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
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
const styles = themedStyleSheet(makeStyles);
