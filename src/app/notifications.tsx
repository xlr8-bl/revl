/**
 * Notifications — everything that concerns you, in the app's own voice:
 * circle back button, kicker, big bold title, then Today / Earlier groups
 * of rows (kind icon tile, title, detail, time, unread accent dot).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { markAllRead, useNotifications, type NotificationKind } from '../data/notifications';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion, withAlpha } from '../theme';

const KIND_ICON: Record<NotificationKind, keyof typeof Ionicons.glyphMap> = {
  paper: 'document-text',
  class: 'people',
  credits: 'server',
  reminder: 'alarm',
};

export default function NotificationsScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const all = useNotifications();
  const unread = all.filter((n) => n.unread).length;
  const groups: { label: string; key: 'today' | 'earlier' }[] = [
    { label: 'Today', key: 'today' },
    { label: 'Earlier', key: 'earlier' },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 60 }}>
        <View style={styles.header}>
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            {unread > 0 && (
              <Pressable onPress={markAllRead} hitSlop={8}>
                <Text style={styles.markRead}>Mark all read</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.kicker}>
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </Text>
          <Text style={styles.title}>Notifications</Text>
        </View>

        {groups.map((g) => {
          const rows = all.filter((n) => n.group === g.key);
          if (rows.length === 0) return null;
          return (
            <View key={g.key} style={styles.group}>
              <Text style={styles.groupLabel}>{g.label}</Text>
              <View style={styles.card}>
                {rows.map((n, i) => (
                  <View key={n.id} style={[styles.row, i > 0 && styles.rowDivider]}>
                    <View style={[styles.iconTile, n.kind === 'credits' && { backgroundColor: withAlpha(colors.accent, 0.16) }]}>
                      <Ionicons
                        name={KIND_ICON[n.kind]}
                        size={16}
                        color={n.kind === 'credits' ? colors.accent : colors.textSecondary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, n.unread && { fontFamily: fonts.bold }]} numberOfLines={1}>
                        {n.title}
                      </Text>
                      <Text style={styles.rowDetail} numberOfLines={2}>
                        {n.detail}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={styles.time}>{n.time}</Text>
                      {n.unread && <View style={styles.unreadDot} />}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <Text style={styles.footnote}>
          Paper drops, class-room activity and credit earnings for your courses land here.
        </Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: spacing.gutter, marginBottom: 4 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    markRead: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.accent },
    kicker: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 16 },
    title: { fontFamily: fonts.bold, fontSize: 38, color: colors.text, marginTop: 2 },
    group: { marginTop: 20 },
    groupLabel: {
      fontFamily: fonts.medium,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      paddingHorizontal: spacing.gutter,
      marginBottom: 8,
    },
    card: {
      marginHorizontal: spacing.gutter,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      backgroundColor: colors.card,
      overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    iconTile: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    rowTitle: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
    rowDetail: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary, marginTop: 2 },
    rowRight: { alignItems: 'flex-end', gap: 6, marginTop: 2 },
    time: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
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
