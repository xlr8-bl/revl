/**
 * Settings — real, working preferences. Appearance (System / Light /
 * Dark) switches the theme app-wide instantly; the toggles persist to
 * AsyncStorage. Also the account actions (edit profile, sign out).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setPref, usePrefs } from '../lib/prefs';
import { signOut, useSession } from '../lib/session';
import {
  colors,
  fonts,
  spacing,
  themedStyleSheet,
  useThemeMode,
  useThemeVersion,
  type ThemeMode,
  setThemeMode,
} from '../theme';

const APPEARANCE: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mode = useThemeMode();
  const prefs = usePrefs();
  const { profile } = useSession();

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: spacing.gutter }}>
        {/* Appearance */}
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.segment}>
          {APPEARANCE.map((opt) => {
            const active = mode === opt.mode;
            return (
              <Pressable
                key={opt.mode}
                onPress={() => setThemeMode(opt.mode)}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
                <Ionicons name={opt.icon} size={18} color={active ? colors.onAccent : colors.text} />
                <Text style={[styles.segmentText, active && { color: colors.onAccent }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>
          {mode === 'system' ? 'Following your phone’s light or dark setting.' : `Always ${mode}.`}
        </Text>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          <ToggleRow
            icon="notifications-outline"
            label="Notifications"
            detail="Exam reminders and class replies"
            value={prefs.notifications}
            onChange={(v) => setPref('notifications', v)}
          />
          <ToggleRow
            icon="cloud-download-outline"
            label="Offline downloads"
            detail="Keep unlocked papers on device"
            value={prefs.offlineDownloads}
            onChange={(v) => setPref('offlineDownloads', v)}
            bordered
          />
          <ToggleRow
            icon="contract-outline"
            label="Reduce motion"
            detail="Calmer transitions and effects"
            value={prefs.reduceMotion}
            onChange={(v) => setPref('reduceMotion', v)}
            bordered
          />
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <Pressable onPress={() => router.push('/notes')} style={styles.row}>
            <Ionicons name="document-text-outline" size={20} color={colors.text} />
            <Text style={styles.rowLabel}>My notes</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
          <Pressable onPress={() => router.push('/wallet')} style={[styles.row, styles.rowBorder]}>
            <Ionicons name="wallet-outline" size={20} color={colors.text} />
            <Text style={styles.rowLabel}>Credits & wallet</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>

        <Pressable onPress={signOut} style={[styles.card, styles.row]}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.rowLabel, { color: colors.danger }]}>Sign out</Text>
        </Pressable>

        <Text style={styles.version}>
          Revl · {profile?.school === 'ub' ? 'University of Buea' : 'HND'} · v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  detail,
  value,
  onChange,
  bordered,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
  value: boolean;
  onChange: (v: boolean) => void;
  bordered?: boolean;
}) {
  return (
    <View style={[styles.row, bordered && styles.rowBorder]}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surface, true: colors.accent }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    backBtn: { width: 40, alignItems: 'center' },
    topTitle: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
    sectionLabel: {
      fontFamily: fonts.medium,
      fontSize: 11,
      letterSpacing: 1.4,
      color: colors.textSecondary,
      marginTop: 24,
      marginBottom: 10,
    },
    segment: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingVertical: 11,
      borderRadius: 10,
    },
    segmentBtnActive: { backgroundColor: colors.accent },
    segmentText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
    hint: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textTertiary, marginTop: 8, paddingHorizontal: 2 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 15 },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    rowLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 15.5, color: colors.text },
    rowDetail: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
    version: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary, textAlign: 'center', marginTop: 28 },
  });
const styles = themedStyleSheet(makeStyles);
