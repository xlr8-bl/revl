/**
 * Notifications — a flat, feed-style stream (no boxed cards): avatar or
 * glyph disc left, inline bold lead + regular body, relative time right,
 * unread marked by a thin accent rail on the left edge. Day sections are
 * small uppercase labels. Content comes from the working engine
 * (lib/notificationsStore): real app events + your friends' activity —
 * never strangers.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  markAllRead,
  relativeTime,
  useNotifications,
  type AppNotification,
  type NotificationKind,
} from '../lib/notificationsStore';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion, withAlpha } from '../theme';

const KIND_ICON: Record<Exclude<NotificationKind, 'friend'>, keyof typeof Ionicons.glyphMap> = {
  paper: 'document-text',
  credits: 'server',
  reminder: 'alarm',
  download: 'arrow-down',
};

function sectionOf(ts: number): 'today' | 'week' | 'earlier' {
  const d = new Date(ts);
  const now = new Date();
  if (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
    return 'today';
  return now.getTime() - ts < 7 * 86400000 ? 'week' : 'earlier';
}

export default function NotificationsScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const all = useNotifications();
  const unread = all.filter((n) => n.unread).length;

  // Leaving the screen counts as having seen everything.
  useEffect(() => () => markAllRead(), []);

  const sections = useMemo(() => {
    const buckets: { key: string; label: string; rows: AppNotification[] }[] = [
      { key: 'today', label: 'Today', rows: [] },
      { key: 'week', label: 'This week', rows: [] },
      { key: 'earlier', label: 'Earlier', rows: [] },
    ];
    for (const n of all) buckets.find((b) => b.key === sectionOf(n.createdAt))!.rows.push(n);
    return buckets.filter((b) => b.rows.length > 0);
  }, [all]);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 60 }}>
        <View style={styles.header}>
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.circleBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/friends' as never)}
              hitSlop={10}
              style={styles.circleBtn}>
              <Ionicons name="person-add-outline" size={19} color={colors.text} />
            </Pressable>
          </View>
          <Text style={styles.kicker}>{unread > 0 ? `${unread} unread` : 'All caught up'}</Text>
          <Text style={styles.title}>Notifications</Text>
        </View>

        {sections.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={26} color={colors.textTertiary} />
            <Text style={styles.emptyText}>
              Nothing yet. Paper drops, your friends' activity and credit earnings land here.
            </Text>
          </View>
        )}

        {sections.map((s) => (
          <View key={s.key} style={styles.section}>
            <Text style={styles.sectionLabel}>{s.label}</Text>
            {s.rows.map((n, i) => (
              <View key={n.id} style={[styles.row, i > 0 && styles.rowDivider]}>
                {/* Unread rail — a quiet accent edge, not a badge */}
                <View style={[styles.rail, n.unread && styles.railUnread]} />
                {n.kind === 'friend' && n.avatar ? (
                  <View style={[styles.disc, { backgroundColor: n.avatar.color }]}>
                    <Text style={styles.discInitial}>{n.avatar.initial}</Text>
                  </View>
                ) : (
                  <View style={styles.glyphDisc}>
                    <Ionicons
                      name={KIND_ICON[n.kind as Exclude<NotificationKind, 'friend'>] ?? 'ellipse'}
                      size={15}
                      color={n.kind === 'credits' ? colors.accent : colors.textSecondary}
                    />
                  </View>
                )}
                <Text style={[styles.line, n.unread && styles.lineUnread]}>
                  <Text style={styles.lead}>{n.lead}</Text> {n.body}
                </Text>
                <Text style={styles.time}>{relativeTime(n.createdAt)}</Text>
              </View>
            ))}
          </View>
        ))}

        {sections.length > 0 && (
          <Text style={styles.footnote}>
            Only your courses and your friends show up here — add people from the person icon
            above.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: spacing.gutter, marginBottom: 4 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    circleBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kicker: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 16 },
    title: { fontFamily: fonts.bold, fontSize: 38, color: colors.text, marginTop: 2 },
    section: { marginTop: 18 },
    sectionLabel: {
      fontFamily: fonts.medium,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.textTertiary,
      paddingHorizontal: spacing.gutter,
      marginBottom: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 13,
      paddingRight: spacing.gutter,
      paddingLeft: spacing.gutter - 3,
    },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    rail: { width: 3, height: '72%', borderRadius: 1.5, backgroundColor: 'transparent' },
    railUnread: { backgroundColor: colors.accent },
    disc: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    discInitial: { fontFamily: fonts.bold, fontSize: 15, color: '#FFF' },
    glyphDisc: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: withAlpha(colors.text, 0.05),
      alignItems: 'center',
      justifyContent: 'center',
    },
    line: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 13.5,
      lineHeight: 19,
      color: colors.textSecondary,
    },
    lineUnread: { color: colors.text },
    lead: { fontFamily: fonts.bold, color: colors.text },
    time: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary },
    empty: { alignItems: 'center', gap: 12, paddingHorizontal: 44, marginTop: 70 },
    emptyText: {
      fontFamily: fonts.regular,
      fontSize: 13.5,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    footnote: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      lineHeight: 17,
      color: colors.textTertiary,
      paddingHorizontal: spacing.gutter,
      marginTop: 26,
    },
  });
const styles = themedStyleSheet(makeStyles);
