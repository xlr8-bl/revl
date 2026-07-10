/**
 * Mobile Money — manage the number that unlocks papers. Shows the linked
 * number and preferred network, and lets the student link or change it.
 * Linking mirrors the sign-in flow: you enter the number, we "send a
 * prompt" to the phone, and confirming on the USSD prompt links it — the
 * PIN never touches Revl.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setPref, usePrefs } from '../../lib/prefs';
import { linkMobileMoney, useSession } from '../../lib/session';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../../theme';

const NETWORKS = [
  { id: 'mtn' as const, label: 'MTN MoMo', color: '#FFCC08' },
  { id: 'orange' as const, label: 'Orange Money', color: '#FF7900' },
];

export default function MobileMoneyScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { phone } = useSession();
  const prefs = usePrefs();

  const [number, setNumber] = useState(phone ?? '');
  const [pending, setPending] = useState(false);
  const digits = number.replace(/\D/g, '');
  const valid = digits.length >= 9;

  const masked = phone ? phone.replace(/(\d{3})\d+(\d{2})/, '$1••••$2') : null;

  const link = () => {
    if (!valid) return;
    setPending(true);
    // Simulate the USSD confirmation prompt (the real flow uses CIBA / a
    // bc-authorize prompt; the PIN is entered on the phone, never here).
    setTimeout(() => {
      linkMobileMoney(digits);
      setPending(false);
      router.back();
    }, 2600);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Mobile Money</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: spacing.gutter }}>
        {/* Linked status */}
        <View style={styles.statusCard}>
          <View style={styles.momoDots}>
            <View style={[styles.momoDot, { backgroundColor: colors.mtn }]} />
            <View style={[styles.momoDot, { backgroundColor: colors.orange, marginLeft: -6 }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusLabel}>{masked ? 'Linked number' : 'No number linked yet'}</Text>
            <Text style={styles.statusValue}>{masked ?? 'Link a number to unlock papers instantly'}</Text>
          </View>
          {masked && <Ionicons name="checkmark-circle" size={20} color={colors.verified} />}
        </View>

        {/* Preferred network */}
        <Text style={styles.sectionLabel}>Preferred network</Text>
        <View style={styles.networkRow}>
          {NETWORKS.map((n) => {
            const active = prefs.preferredNetwork === n.id;
            return (
              <Pressable
                key={n.id}
                onPress={() => setPref('preferredNetwork', n.id)}
                style={[styles.network, active && { borderColor: n.color, backgroundColor: colors.card }]}>
                <View style={[styles.networkDot, { backgroundColor: n.color }]} />
                <Text style={[styles.networkText, active && { color: colors.text }]}>{n.label}</Text>
                {active && <Ionicons name="checkmark" size={16} color={n.color} />}
              </Pressable>
            );
          })}
        </View>

        {/* Number */}
        <Text style={styles.sectionLabel}>{masked ? 'Change number' : 'Link a number'}</Text>
        <View style={styles.inputRow}>
          <Text style={styles.prefix}>+237</Text>
          <TextInput
            value={number}
            onChangeText={setNumber}
            placeholder="6 XX XX XX XX"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
            style={styles.input}
            editable={!pending}
          />
        </View>

        <Pressable
          onPress={link}
          disabled={!valid || pending}
          style={({ pressed }) => [styles.cta, (!valid || pending) && styles.ctaDisabled, pressed && { opacity: 0.9 }]}>
          {pending ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={[styles.ctaText, !valid && { color: colors.textTertiary }]}>
              {masked ? 'Update number' : 'Link Mobile Money'}
            </Text>
          )}
        </Pressable>

        <Text style={styles.note}>
          {pending
            ? 'Check your phone — approve the prompt and enter your Mobile Money PIN there. Your PIN never touches Revl.'
            : 'We send a confirmation prompt to your phone. You approve it with your PIN on your own device — we never see or store it.'}
        </Text>
      </ScrollView>
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
    statusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: 16,
      marginTop: 8,
    },
    momoDots: { flexDirection: 'row', alignItems: 'center' },
    momoDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.card },
    statusLabel: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary },
    statusValue: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.text, marginTop: 2 },
    sectionLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.textSecondary, marginTop: 26, marginBottom: 10 },
    networkRow: { flexDirection: 'row', gap: 10 },
    network: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 13,
    },
    networkDot: { width: 14, height: 14, borderRadius: 7 },
    networkText: { flex: 1, fontFamily: fonts.medium, fontSize: 13.5, color: colors.textSecondary },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      borderRadius: 12,
      paddingHorizontal: 14,
    },
    prefix: { fontFamily: fonts.medium, fontSize: 16, color: colors.textSecondary },
    input: { flex: 1, paddingVertical: 14, fontFamily: fonts.medium, fontSize: 16, color: colors.text, letterSpacing: 1 },
    cta: { backgroundColor: colors.accent, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 15, marginTop: 18, minHeight: 52 },
    ctaDisabled: { backgroundColor: colors.surface },
    ctaText: { fontFamily: fonts.bold, fontSize: 16, color: colors.onAccent },
    note: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: colors.textTertiary, marginTop: 14, textAlign: 'center' },
  });
const styles = themedStyleSheet(makeStyles);
