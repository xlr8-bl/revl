/**
 * You tab — profile hub: avatar with initial, quick stats, and entry
 * points into Study DNA, credits wallet, notes, contributions, and
 * Wrapped (which only shows inside its end-of-semester window).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { currentUser } from '../../data/user';
import { useRevealLogs, weakTopics } from '../../lib/selectors';
import { isWrappedLive } from '../../lib/wrappedGate';
import { colors, fonts, spacing, TAB_BAR_CLEARANCE } from '../../theme';

export default function YouScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logs = useRevealLogs();
  const weakest = weakTopics(logs)[0];

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; detail?: string; route: string }[] = [
    { icon: 'planet-outline', label: 'Study DNA', detail: weakest ? `weakest: ${weakest.tag}` : undefined, route: '/dna' },
    { icon: 'flash-outline', label: 'Credits & wallet', detail: `⚡ ${currentUser.credits}`, route: '/wallet' },
    { icon: 'document-text-outline', label: 'My Notes', detail: 'grounds your AI answers', route: '/notes' },
    { icon: 'cloud-upload-outline', label: 'Upload a paper, earn credits', route: '/contribute' },
  ];

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: TAB_BAR_CLEARANCE }}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{currentUser.initial}</Text>
        </View>
        <Text style={styles.name}>{currentUser.name}</Text>
        <Text style={styles.meta}>Computer Engineering · L400</Text>
      </View>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <Stat value={String(logs.length)} label="reveals" />
        <Stat value={String(logs.filter((l) => l.resolution === 'got-it').length)} label="got it" />
        <Stat value={String(currentUser.enrolledCourseCodes.length)} label="courses" />
      </View>

      {isWrappedLive() && (
        <Pressable onPress={() => router.push('/wrapped')} style={[styles.row, styles.wrappedRow]}>
          <Ionicons name="sparkles" size={20} color="#9F8FFF" />
          <Text style={[styles.rowLabel, { color: '#CFC6FF' }]}>Your semester, wrapped ✨</Text>
          <Ionicons name="chevron-forward" size={18} color="#9F8FFF" />
        </Pressable>
      )}

      <View style={styles.card}>
        {rows.map((row, i) => (
          <Pressable
            key={row.label}
            onPress={() => router.push(row.route as never)}
            style={[styles.row, i > 0 && styles.rowBorder]}>
            <Ionicons name={row.icon} size={20} color={colors.text} />
            <Text style={styles.rowLabel}>{row.label}</Text>
            {row.detail && <Text style={styles.rowDetail}>{row.detail}</Text>}
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        {['Notifications', 'Appearance', 'Help & feedback'].map((label, i) => (
          <View key={label} style={[styles.row, i > 0 && styles.rowBorder]}>
            <Ionicons
              name={label === 'Notifications' ? 'notifications-outline' : label === 'Appearance' ? 'contrast-outline' : 'help-circle-outline'}
              size={20}
              color={colors.text}
            />
            <Text style={styles.rowLabel}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </View>
        ))}
      </View>
    </ScrollView>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  profile: { alignItems: 'center', gap: 8 },
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
  meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 24,
    marginBottom: 10,
  },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  statLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginHorizontal: spacing.gutter,
    marginTop: 18,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  rowDetail: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  wrappedRow: {
    backgroundColor: 'rgba(94,80,220,0.14)',
    borderRadius: 20,
    marginHorizontal: spacing.gutter,
    marginTop: 18,
  },
});
