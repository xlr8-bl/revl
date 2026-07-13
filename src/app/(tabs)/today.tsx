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
import { GlassCircleButton } from '../../components/GlassCircleButton';
import { TopFade } from '../../components/ScrollFadeHeader';
import { DailyBriefing } from '../../components/DailyBriefing';
import { HeroCard } from '../../components/HeroCard';
import { SessionCard } from '../../components/SessionCard';
import { communityFeed, todaySession } from '../../data/home';
import { useNotifications } from '../../data/notifications';
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
          <View style={styles.headerControls}>
            {/* Coin balance — a comfortable pill, not a squeezed circle */}
            <GlassCircleButton pill onPress={() => router.push('/wallet')}>
              <CreditMark size={19} />
              <Text style={styles.creditCount}>{currentUser.credits}</Text>
            </GlassCircleButton>
            <GlassCircleButton onPress={() => router.push('/notifications' as never)}>
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              {unread > 0 && <View style={styles.bellDot} />}
            </GlassCircleButton>
          </View>
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
            onPress={() => router.push('/')}
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
  headerControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  creditCount: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
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
const styles = themedStyleSheet(makeStyles);
