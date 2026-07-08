/**
 * Mobile-money sign-in, PIN-prompt flow:
 *
 *   1. Pick provider, enter wallet number.
 *   2. Backend fires the provider's authorization request (MTN MoMo
 *      bc-authorize). The provider pushes a USSD prompt to the phone.
 *   3. The student proves it's their wallet by entering their Mobile
 *      Money PIN on that prompt, on their own phone. The PIN never
 *      touches Revl; the provider just tells us "approved".
 *   4. We read the wallet's registered name (basicuserinfo) and create
 *      the account. See docs/AUTH_MOBILE_MONEY.md.
 *
 * The provider call is mocked with a timer for now.
 */
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signIn } from '../../lib/session';
import { colors, fonts, spacing, type } from '../../theme';

type Provider = 'momo' | 'orange';
type Step = 'number' | 'prompt';

export default function MomoSignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>('momo');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<Step>('number');

  // Mock: the real backend polls the provider until the user approves
  // the USSD prompt with their PIN, then returns a session.
  useEffect(() => {
    if (step !== 'prompt') return;
    const t = setTimeout(() => signIn(provider, phone), 3500);
    return () => clearTimeout(t);
  }, [step, provider, phone]);

  const providerName = provider === 'momo' ? 'MTN MoMo' : 'Orange Money';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={styles.back}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Sign in with{'\n'}Mobile Money</Text>
      <Text style={styles.sub}>
        Your wallet number becomes your Revl account, with your registered name and payments already attached.
      </Text>

      {step === 'number' ? (
        <>
          <View style={styles.providerRow}>
            <ProviderCard label="MTN MoMo" color={colors.mtn} selected={provider === 'momo'} onPress={() => setProvider('momo')} />
            <ProviderCard label="Orange Money" color={colors.orange} selected={provider === 'orange'} onPress={() => setProvider('orange')} />
          </View>

          <Text style={styles.fieldLabel}>Wallet number</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.prefix}>+237</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="6XX XX XX XX"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              autoFocus
              style={styles.phoneInput}
            />
          </View>

          <Pressable
            disabled={phone.trim().length < 9}
            onPress={() => setStep('prompt')}
            style={({ pressed }) => [
              styles.primaryBtn,
              phone.trim().length < 9 && styles.btnDisabled,
              pressed && { opacity: 0.85 },
            ]}>
            <Text style={[styles.primaryText, phone.trim().length < 9 && { color: colors.textTertiary }]}>
              Send approval prompt
            </Text>
          </Pressable>
          <Text style={styles.hint}>
            {providerName} will ask for your Mobile Money PIN on your phone. That proves the wallet is yours. Revl
            never sees your PIN.
          </Text>
        </>
      ) : (
        <View style={styles.promptWrap}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.promptTitle}>Check your phone</Text>
          <Text style={styles.promptBody}>
            {providerName} sent a prompt to +237 {phone}. Enter your Mobile Money PIN on that prompt to confirm it is
            you. This screen continues by itself once you approve.
          </Text>
          <Pressable onPress={() => setStep('number')} hitSlop={8}>
            <Text style={styles.changeNumber}>Wrong number? Go back</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function ProviderCard({ label, color, selected, onPress }: { label: string; color: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.provider, selected && { borderColor: color }]}>
      <View style={[styles.providerDot, { backgroundColor: color }]} />
      <Text style={styles.providerText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.gutter + 6 },
  back: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, paddingVertical: 6 },
  title: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, color: colors.text, marginTop: 14 },
  sub: { ...type.body, color: colors.textSecondary, marginTop: 10, marginBottom: 26 },
  providerRow: { flexDirection: 'row', gap: 10 },
  provider: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: colors.card,
  },
  providerDot: { width: 12, height: 12, borderRadius: 6 },
  providerText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  fieldLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, marginTop: 24, marginBottom: 10 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  prefix: { fontFamily: fonts.medium, fontSize: 17, color: colors.textSecondary, marginRight: 10 },
  phoneInput: { flex: 1, paddingVertical: 15, fontFamily: fonts.regular, fontSize: 17, color: colors.text },
  primaryBtn: { backgroundColor: colors.accent, borderRadius: 10, alignItems: 'center', paddingVertical: 15, marginTop: 22 },
  btnDisabled: { backgroundColor: colors.surface },
  primaryText: { fontFamily: fonts.medium, fontSize: 16, color: colors.onAccent },
  hint: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: colors.textTertiary, marginTop: 14 },
  promptWrap: { alignItems: 'center', gap: 14, marginTop: 50, paddingHorizontal: 10 },
  promptTitle: { fontFamily: fonts.bold, fontSize: 21, color: colors.text },
  promptBody: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
  changeNumber: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.textSecondary, marginTop: 12, textDecorationLine: 'underline' },
});
