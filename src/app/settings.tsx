/**
 * Settings — the full set of things a student can actually manipulate,
 * in the app's card/row language: account, payments (Mobile Money),
 * study, appearance, notifications, privacy, data, support, sign out.
 * Selectors and toggles are compact and inline; nothing bespoke.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setPref, usePrefs } from '../lib/prefs';
import { signOut, updateProfile, useSession } from '../lib/session';
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

export default function SettingsScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mode = useThemeMode();
  const prefs = usePrefs();
  const { profile, phone } = useSession();

  const go = (path: string) => router.push(path as never);
  const momoLinked = !!phone;
  const studyTimes: { id: NonNullable<typeof profile>['studyTime']; label: string }[] = [
    { id: 'morning', label: 'Morning' },
    { id: 'evening', label: 'Evening' },
    { id: 'night', label: 'Night' },
  ];

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
        {/* Account */}
        <Section title="Account">
          <LinkRow icon="person-outline" label="Edit profile" detail={profile ? `@${profile.username}` : undefined} onPress={() => go('/account/edit')} />
          <LinkRow icon="school-outline" label="My courses" detail={`${profile?.enrolledCourseCodes.length ?? 0} enrolled`} onPress={() => go('/account/courses')} bordered />
        </Section>

        {/* Payments */}
        <Section title="Payments">
          <LinkRow
            icon="phone-portrait-outline"
            label="Mobile Money"
            detail={momoLinked ? 'Linked' : 'Not linked'}
            onPress={() => go('/account/mobile-money')}
          />
          <LinkRow icon="wallet-outline" label="Credits & wallet" onPress={() => go('/wallet')} bordered />
        </Section>

        {/* Study */}
        {profile && (
          <Section title="Study">
            <SegmentRow
              icon="time-outline"
              label="Study time"
              options={studyTimes.map((s) => ({ id: s.id, label: s.label }))}
              value={profile.studyTime}
              onSelect={(v) => updateProfile({ studyTime: v as NonNullable<typeof profile>['studyTime'] })}
            />
          </Section>
        )}

        {/* Appearance */}
        <Section title="Appearance">
          <SegmentRow
            icon="contrast-outline"
            label="Theme"
            options={[
              { id: 'system', label: 'System' },
              { id: 'light', label: 'Light' },
              { id: 'dark', label: 'Dark' },
            ]}
            value={mode}
            onSelect={(v) => setThemeMode(v as ThemeMode)}
          />
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <ToggleRow icon="notifications-outline" label="Push notifications" detail="Master switch" value={prefs.notifications} onChange={(v) => setPref('notifications', v)} />
          <ToggleRow icon="alarm-outline" label="Exam reminders" detail="Countdown nudges before your papers" value={prefs.notifyExams} onChange={(v) => setPref('notifyExams', v)} bordered disabled={!prefs.notifications} />
          <ToggleRow icon="chatbubbles-outline" label="Class replies" detail="When classmates answer or react" value={prefs.notifyClass} onChange={(v) => setPref('notifyClass', v)} bordered disabled={!prefs.notifications} />
        </Section>

        {/* Privacy */}
        <Section title="Privacy">
          <ToggleRow icon="lock-closed-outline" label="Private profile" detail="Only classmates see your posts" value={prefs.privateProfile} onChange={(v) => setPref('privateProfile', v)} />
          <LinkRow icon="shield-checkmark-outline" label="Privacy policy" onPress={() => Linking.openURL('https://revl.app/privacy')} bordered />
          <LinkRow icon="document-lock-outline" label="Terms of use" onPress={() => Linking.openURL('https://revl.app/terms')} bordered />
        </Section>

        {/* Data */}
        <Section title="Data & storage">
          <ToggleRow icon="cloud-download-outline" label="Offline downloads" detail="Keep unlocked papers on device" value={prefs.offlineDownloads} onChange={(v) => setPref('offlineDownloads', v)} />
          <ToggleRow icon="contract-outline" label="Reduce motion" detail="Calmer transitions and effects" value={prefs.reduceMotion} onChange={(v) => setPref('reduceMotion', v)} bordered />
        </Section>

        {/* Support */}
        <Section title="Support">
          <LinkRow icon="help-circle-outline" label="Help & feedback" onPress={() => Linking.openURL('mailto:hello@revl.app?subject=Revl%20feedback')} />
          <View style={[styles.row, styles.rowBorder]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.text} />
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowDetail}>1.0.0</Text>
          </View>
        </Section>

        <Pressable onPress={signOut} style={styles.signOut}>
          <Ionicons name="log-out-outline" size={19} color={colors.danger} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </>
  );
}

function ToggleRow({
  icon,
  label,
  detail,
  value,
  onChange,
  bordered,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  bordered?: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.row, bordered && styles.rowBorder, disabled && { opacity: 0.45 }]}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail && <Text style={styles.rowDetail}>{detail}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.surface, true: colors.accent }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

function LinkRow({
  icon,
  label,
  detail,
  onPress,
  bordered,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  onPress: () => void;
  bordered?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, bordered && styles.rowBorder, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={styles.rowLabel}>{label}</Text>
      {detail && <Text style={styles.rowDetail}>{detail}</Text>}
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

function SegmentRow({
  icon,
  label,
  options,
  value,
  onSelect,
  bordered,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onSelect: (id: string) => void;
  bordered?: boolean;
}) {
  return (
    <View style={[styles.row, bordered && styles.rowBorder]}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.segment}>
        {options.map((o) => {
          const active = value === o.id;
          return (
            <Pressable key={o.id} onPress={() => onSelect(o.id)} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
              <Text style={[styles.segmentText, active && { color: colors.onAccent }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
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
    topTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
    sectionLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.textSecondary, marginTop: 24, marginBottom: 10 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    rowLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 15.5, color: colors.text },
    rowDetail: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
    segment: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 9, padding: 3 },
    segmentBtn: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 7 },
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
