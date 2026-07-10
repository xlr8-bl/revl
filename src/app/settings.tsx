/**
 * Settings — the app's settings, in the same card/row language as the
 * rest of Revl (no bespoke widgets). Appearance is just one modest
 * control near the top, not the headline. Preferences, privacy, support,
 * and sign-out follow.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setPref, usePrefs } from '../lib/prefs';
import { signOut } from '../lib/session';
import {
  colors,
  fonts,
  spacing,
  themedStyleSheet,
  useThemeMode,
  useThemeVersion,
  setThemeMode,
  type ThemeMode,
} from '../theme';

const MODES: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'System' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mode = useThemeMode();
  const prefs = usePrefs();

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
        {/* Appearance — one compact control */}
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.appearanceRow}>
            <Ionicons name="contrast-outline" size={20} color={colors.text} />
            <Text style={styles.rowLabel}>Theme</Text>
            <View style={styles.segment}>
              {MODES.map((m) => {
                const active = mode === m.mode;
                return (
                  <Pressable
                    key={m.mode}
                    onPress={() => setThemeMode(m.mode)}
                    style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
                    <Text style={[styles.segmentText, active && { color: colors.onAccent }]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Notifications & data */}
        <Text style={styles.sectionLabel}>Preferences</Text>
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

        {/* Privacy */}
        <Text style={styles.sectionLabel}>Privacy</Text>
        <View style={styles.card}>
          <ToggleRow
            icon="lock-closed-outline"
            label="Private profile"
            detail="Only classmates see your posts"
            value={prefs.privateProfile}
            onChange={(v) => setPref('privateProfile', v)}
          />
          <LinkRow
            icon="shield-checkmark-outline"
            label="Privacy policy"
            onPress={() => Linking.openURL('https://revl.app/privacy')}
            bordered
          />
          <LinkRow
            icon="document-lock-outline"
            label="Terms of use"
            onPress={() => Linking.openURL('https://revl.app/terms')}
            bordered
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.card}>
          <LinkRow
            icon="help-circle-outline"
            label="Help & feedback"
            onPress={() => Linking.openURL('mailto:hello@revl.app?subject=Revl%20feedback')}
          />
          <View style={[styles.row, styles.rowBorder]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.text} />
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowDetail}>1.0.0</Text>
          </View>
        </View>

        <Pressable onPress={signOut} style={styles.signOut}>
          <Ionicons name="log-out-outline" size={19} color={colors.danger} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
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

function LinkRow({
  icon,
  label,
  onPress,
  bordered,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  bordered?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, bordered && styles.rowBorder, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
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
    topTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
    sectionLabel: {
      fontFamily: fonts.bold,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 24,
      marginBottom: 10,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 15 },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    rowLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.text },
    rowDetail: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },

    appearanceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13 },
    segment: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 9,
      padding: 3,
    },
    segmentBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7 },
    segmentBtnActive: { backgroundColor: colors.accent },
    segmentText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.text },

    signOut: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: 15,
      marginTop: 24,
    },
    signOutText: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.danger },
  });
const styles = themedStyleSheet(makeStyles);
