/**
 * Unlock / paywall — mobile-money first (Cameroon): MTN MoMo or
 * Orange Money, phone number, then a push-to-approve prompt. The
 * payment call is stubbed; the UI models the real flow exactly.
 * Students can also spend earned ⚡ credits instead of paying.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { getPaper, unlockedPaperIds } from '../../data/papers';
import { currentUser } from '../../data/user';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../../theme';

type Provider = 'mtn' | 'orange';
type Stage = 'choose' | 'confirming' | 'done';

const PRICE_XAF = 500;
const PRICE_CREDITS = 3;

export default function UnlockScreen() {
  useThemeVersion();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const paper = getPaper(id);

  const [provider, setProvider] = useState<Provider | null>(null);
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<Stage>('choose');

  if (!paper) return null;

  /** Stub payment: real version calls the MoMo/OM collection API and polls. */
  const pay = () => {
    setStage('confirming');
    setTimeout(() => {
      unlockedPaperIds.add(paper.id); // mock unlock
      setStage('done');
    }, 2200);
  };

  const unlockWithCredits = () => {
    unlockedPaperIds.add(paper.id);
    setStage('done');
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Unlock paper" />
      <ScrollView contentContainerStyle={{ padding: spacing.gutter, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>
          {paper.courseCode} · {paper.title} · {paper.year}
        </Text>
        <Text style={styles.meta}>
          Structured questions, verified answers, AI explanations, offline download.
        </Text>

        {stage === 'done' ? (
          <View style={styles.doneWrap}>
            <Ionicons name="lock-open" size={48} color={colors.success} />
            <Text style={styles.doneTitle}>Unlocked</Text>
            <Pressable onPress={() => router.replace(`/paper/${paper.id}`)} style={styles.primaryBtn}>
              <Text style={styles.primaryText}>Open paper</Text>
            </Pressable>
          </View>
        ) : stage === 'confirming' ? (
          <View style={styles.doneWrap}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.doneTitle}>Check your phone</Text>
            <Text style={styles.meta}>
              Approve the {provider === 'mtn' ? 'MTN MoMo' : 'Orange Money'} prompt on {phone} to complete payment of{' '}
              {PRICE_XAF} FCFA.
            </Text>
          </View>
        ) : (
          <>
            {/* Pay with credits */}
            <Pressable
              onPress={currentUser.credits >= PRICE_CREDITS ? unlockWithCredits : undefined}
              style={[styles.creditCard, currentUser.credits < PRICE_CREDITS && { opacity: 0.5 }]}>
              <Ionicons name="flash" size={22} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.creditTitle}>Use {PRICE_CREDITS} credits</Text>
                <Text style={styles.creditMeta}>You have {currentUser.credits} credits</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>

            <Text style={styles.orLabel}>OR PAY {PRICE_XAF} FCFA WITH MOBILE MONEY</Text>

            {/* Provider selection */}
            <View style={styles.providerRow}>
              <ProviderCard
                label="MTN MoMo"
                color={colors.mtn}
                selected={provider === 'mtn'}
                onPress={() => setProvider('mtn')}
              />
              <ProviderCard
                label="Orange Money"
                color={colors.orange}
                selected={provider === 'orange'}
                onPress={() => setProvider('orange')}
              />
            </View>

            <Text style={styles.fieldLabel}>MOBILE MONEY NUMBER</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="6XX XX XX XX"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Pressable
              disabled={!provider || phone.trim().length < 9}
              onPress={pay}
              style={[styles.primaryBtn, (!provider || phone.trim().length < 9) && styles.btnDisabled]}>
              <Text style={[styles.primaryText, (!provider || phone.trim().length < 9) && { color: colors.textTertiary }]}>
                Request payment
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ProviderCard({ label, color, selected, onPress }: { label: string; color: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.provider, selected && { borderColor: color }]}>
      <View style={[styles.providerDot, { backgroundColor: color }]} />
      <Text style={styles.providerText}>{label}</Text>
      {selected && <Ionicons name="checkmark-circle" size={17} color={color} />}
    </Pressable>
  );
}

const makeStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.bold, fontSize: 23, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginTop: 8, textAlign: 'left' },
  creditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginTop: 24,
  },
  creditTitle: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  creditMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  orLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginTop: 28,
    marginBottom: 12,
  },
  providerRow: { flexDirection: 'row', gap: 10 },
  provider: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },
  providerDot: { width: 14, height: 14, borderRadius: 7 },
  providerText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginTop: 22,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 17,
  },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 26,
    alignSelf: 'stretch',
  },
  btnDisabled: { backgroundColor: colors.surface },
  primaryText: { fontFamily: fonts.medium, fontSize: 16, color: '#111111' },
  doneWrap: { alignItems: 'center', gap: 12, paddingVertical: 60 },
  doneTitle: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
});
const styles = themedStyleSheet(makeStyles);
