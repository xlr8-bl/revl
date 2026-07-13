/**
 * Profile (You tab) — your account, not app settings. The header carries
 * a settings gear that opens the Settings page; the body is about you:
 * your identity, editing your account, managing the courses you're
 * enrolled in (fixing a registration mistake), and your study things
 * (DNA, wallet, notes, contributions). App-level settings and sign-out
 * live in Settings.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { currentUser } from '../../data/user';
import { useFriends } from '../../lib/friendsStore';
import { useRevealLogs, weakTopics } from '../../lib/selectors';
import { useSession } from '../../lib/session';
import { isWrappedLive } from '../../lib/wrappedGate';
import { colors, fonts, spacing, TAB_BAR_CLEARANCE, themedStyleSheet, useThemeVersion } from '../../theme';

export default function YouScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logs = useRevealLogs();
  const weakest = weakTopics(logs)[0];
  const { profile } = useSession();
  const { friends, incoming } = useFriends();

  const account: Row[] = [
    { icon: 'person-outline', label: 'Edit profile', detail: 'name, username, photo', route: '/account/edit' },
    {
      icon: 'people-outline',
      label: 'Friends',
      detail: incoming.length > 0 ? `${friends.length} · ${incoming.length} request${incoming.length === 1 ? '' : 's'}` : `${friends.length} friends`,
      route: '/friends',
    },
    {
      icon: 'school-outline',
      label: 'My courses',
      detail: `${profile?.enrolledCourseCodes.length ?? 0} enrolled`,
      route: '/account/courses',
    },
  ];
  const study: Row[] = [
    { icon: 'planet-outline', label: 'Study DNA', detail: weakest ? `weakest: ${weakest.tag}` : undefined, route: '/dna' },
    { icon: 'arrow-down-circle-outline', label: 'Downloads', detail: 'papers on this phone', route: '/downloads' },
    { icon: 'wallet-outline', label: 'Credits & wallet', detail: `${currentUser.credits} credits`, route: '/wallet' },
    { icon: 'document-text-outline', label: 'My notes', detail: 'grounds your AI answers', route: '/notes' },
    { icon: 'cloud-upload-outline', label: 'Upload a paper, earn credits', route: '/contribute' },
  ];

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: TAB_BAR_CLEARANCE }}>
      {/* Top row: title + settings gear */}
      <View style={styles.topRow}>
        <Text style={styles.topTitle}>Profile</Text>
        <Pressable onPress={() => router.push('/settings' as never)} hitSlop={10} style={styles.gear}>
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Identity */}
      <View style={styles.profile}>
        <View style={[styles.avatar, profile && { backgroundColor: profile.avatarColor }]}>
          <Text style={styles.avatarText}>{(profile?.name[0] ?? currentUser.initial).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{profile?.name ?? currentUser.name}</Text>
        {profile && <Text style={styles.username}>@{profile.username}</Text>}
        <Text style={styles.meta}>
          {profile ? `${profile.departmentName} · ${profile.school === 'ub' ? profile.level + ' · UB' : 'HND'}` : ''}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat value={String(logs.length)} label="reveals" />
        <Stat value={String(logs.filter((l) => l.resolution === 'got-it').length)} label="got it" />
        <Stat value={String(profile?.enrolledCourseCodes.length ?? 0)} label="courses" />
      </View>

      {isWrappedLive() && (
        <Pressable onPress={() => router.push('/wrapped')} style={styles.wrappedRow}>
          <Ionicons name="sparkles" size={20} color={colors.ai} />
          <Text style={[styles.rowLabel, { color: colors.ai }]}>Your semester, wrapped</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.ai} />
        </Pressable>
      )}

      <Section title="Account" rows={account} />
      <Section title="Your study" rows={study} />
    </ScrollView>
  );
}

type Row = { icon: keyof typeof Ionicons.glyphMap; label: string; detail?: string; route: string };

function Section({ title, rows }: { title: string; rows: Row[] }) {
  const router = useRouter();
  return (
    <>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.card}>
        {rows.map((row, i) => (
          <Pressable
            key={row.label}
            onPress={() => router.push(row.route as never)}
            style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && { opacity: 0.6 }]}>
            <Ionicons name={row.icon} size={20} color={colors.text} />
            <Text style={styles.rowLabel}>{row.label}</Text>
            {row.detail && <Text style={styles.rowDetail}>{row.detail}</Text>}
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        ))}
      </View>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.gutter,
      marginBottom: 8,
    },
    topTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
    gear: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    profile: { alignItems: 'center', gap: 6, marginTop: 8 },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: '#E5E5EA',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontFamily: fonts.bold, fontSize: 36, color: '#1C1C1E' },
    name: { fontFamily: fonts.bold, fontSize: 26, color: colors.text, marginTop: 6 },
    username: { fontFamily: fonts.regular, fontSize: 14, color: colors.accent },
    meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
    statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginTop: 22, marginBottom: 8 },
    stat: { alignItems: 'center' },
    statValue: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
    statLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    sectionLabel: {
      fontFamily: fonts.bold,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 24,
      marginBottom: 10,
      paddingHorizontal: spacing.gutter,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      marginHorizontal: spacing.gutter,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 15 },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    rowLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.text },
    rowDetail: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
    wrappedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.aiSoft,
      borderRadius: 18,
      marginHorizontal: spacing.gutter,
      marginTop: 20,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
  });
const styles = themedStyleSheet(makeStyles);
