/**
 * Settings — designed to the night-study / exam-stationery system, not
 * a stack of plain rows:
 *
 *  - A profile plate grounds the top.
 *  - Appearance is chosen from three live THEME-PREVIEW cards (each a
 *    tiny mock of the app rendered in that theme's real colors), so the
 *    choice is visual, not a word next to a radio.
 *  - Preferences sit in a grouped card with tinted icon chips and real
 *    persisted switches. Account actions and sign-out below.
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
  palettes,
  setThemeMode,
  spacing,
  themedStyleSheet,
  useThemeMode,
  useThemeVersion,
  type Palette,
  type ThemeMode,
} from '../theme';

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
        {/* Profile plate */}
        {profile && (
          <View style={styles.plate}>
            <View style={[styles.plateAvatar, { backgroundColor: profile.avatarColor }]}>
              <Text style={styles.plateInitial}>{profile.name[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.plateName}>{profile.name}</Text>
              <Text style={styles.plateMeta}>
                {profile.departmentName} · {profile.school === 'ub' ? profile.level + ' · UB' : 'HND'}
              </Text>
            </View>
          </View>
        )}

        {/* Appearance — live theme-preview cards */}
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.themeRow}>
          <ThemeCard mode="system" label="System" active={mode === 'system'} onPress={() => setThemeMode('system')} />
          <ThemeCard mode="light" label="Light" active={mode === 'light'} onPress={() => setThemeMode('light')} />
          <ThemeCard mode="dark" label="Dark" active={mode === 'dark'} onPress={() => setThemeMode('dark')} />
        </View>
        <Text style={styles.hint}>
          {mode === 'system' ? 'Following your phone’s light or dark setting.' : `Always ${mode}.`}
        </Text>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.card}>
          <ToggleRow
            icon="notifications"
            tint={colors.accent}
            label="Notifications"
            detail="Exam reminders and class replies"
            value={prefs.notifications}
            onChange={(v) => setPref('notifications', v)}
          />
          <ToggleRow
            icon="cloud-download"
            tint={colors.ai}
            label="Offline downloads"
            detail="Keep unlocked papers on device"
            value={prefs.offlineDownloads}
            onChange={(v) => setPref('offlineDownloads', v)}
            bordered
          />
          <ToggleRow
            icon="contract"
            tint={colors.verified}
            label="Reduce motion"
            detail="Calmer transitions and effects"
            value={prefs.reduceMotion}
            onChange={(v) => setPref('reduceMotion', v)}
            bordered
          />
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <LinkRow icon="document-text" tint={colors.accent} label="My notes" onPress={() => router.push('/notes')} />
          <LinkRow icon="wallet" tint={colors.accent} label="Credits & wallet" onPress={() => router.push('/wallet')} bordered />
          <LinkRow icon="cloud-upload" tint={colors.accent} label="Upload a paper, earn credits" onPress={() => router.push('/contribute')} bordered />
        </View>

        <Pressable onPress={signOut} style={styles.signOut}>
          <Ionicons name="log-out-outline" size={19} color={colors.danger} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.version}>Revl · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

/** A miniature of the app rendered in a theme's real colors. */
function ThemePreview({ palette }: { palette: Palette }) {
  return (
    <View style={[styles.preview, { backgroundColor: palette.bg }]}>
      <View style={[styles.previewBar, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={[styles.previewDot, { backgroundColor: palette.accent }]} />
        <View style={[styles.previewBarLine, { backgroundColor: palette.textSecondary }]} />
      </View>
      <View style={[styles.previewLine, { backgroundColor: palette.text, width: '70%' }]} />
      <View style={[styles.previewLine, { backgroundColor: palette.textTertiary, width: '52%' }]} />
      <View style={[styles.previewPill, { backgroundColor: palette.accent }]} />
    </View>
  );
}

function ThemeCard({ mode, label, active, onPress }: { mode: ThemeMode; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.themeCard, active && styles.themeCardActive]}>
      <View style={styles.previewClip}>
        {mode === 'system' ? (
          <View style={styles.systemSplit}>
            <View style={styles.systemHalf}>
              <ThemePreview palette={palettes.light} />
            </View>
            <View style={[styles.systemHalf, styles.systemHalfRight]}>
              <ThemePreview palette={palettes.dark} />
            </View>
          </View>
        ) : (
          <ThemePreview palette={mode === 'light' ? palettes.light : palettes.dark} />
        )}
      </View>
      <View style={styles.themeCardFoot}>
        <Text style={[styles.themeCardLabel, active && { color: colors.accent }]}>{label}</Text>
        <Ionicons
          name={active ? 'radio-button-on' : 'radio-button-off'}
          size={16}
          color={active ? colors.accent : colors.textTertiary}
        />
      </View>
    </Pressable>
  );
}

function ToggleRow({
  icon,
  tint,
  label,
  detail,
  value,
  onChange,
  bordered,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  detail: string;
  value: boolean;
  onChange: (v: boolean) => void;
  bordered?: boolean;
}) {
  return (
    <View style={[styles.row, bordered && styles.rowBorder]}>
      <View style={[styles.iconChip, { backgroundColor: tint + '22' }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
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
  tint,
  label,
  onPress,
  bordered,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  onPress: () => void;
  bordered?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, bordered && styles.rowBorder, pressed && { opacity: 0.6 }]}>
      <View style={[styles.iconChip, { backgroundColor: tint + '22' }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
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

    plate: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: 16,
      marginTop: 8,
    },
    plateAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    plateInitial: { fontFamily: fonts.bold, fontSize: 22, color: '#141414' },
    plateName: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
    plateMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },

    sectionLabel: {
      fontFamily: fonts.bold,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 26,
      marginBottom: 12,
    },

    themeRow: { flexDirection: 'row', gap: 10 },
    themeCard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 7,
    },
    themeCardActive: { borderColor: colors.accent },
    previewClip: { borderRadius: 10, overflow: 'hidden', height: 104 },
    preview: { flex: 1, padding: 8, gap: 6, justifyContent: 'flex-start' },
    previewBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 5,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 5,
      paddingVertical: 5,
    },
    previewDot: { width: 8, height: 8, borderRadius: 4 },
    previewBarLine: { flex: 1, height: 3, borderRadius: 2, opacity: 0.5 },
    previewLine: { height: 5, borderRadius: 2.5, marginTop: 1, opacity: 0.85 },
    previewPill: { width: 34, height: 10, borderRadius: 5, marginTop: 4 },
    systemSplit: { flex: 1, flexDirection: 'row' },
    systemHalf: { width: '50%', overflow: 'hidden' },
    systemHalfRight: { marginLeft: -8 },
    themeCardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 9, paddingBottom: 2 },
    themeCardLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
    hint: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textTertiary, marginTop: 10, paddingHorizontal: 2 },

    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 15, paddingVertical: 14 },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    iconChip: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 15.5, color: colors.text },
    rowDetail: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },

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
      marginTop: 18,
    },
    signOutText: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.danger },
    version: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary, textAlign: 'center', marginTop: 22 },
  });
const styles = themedStyleSheet(makeStyles);
