/**
 * Mobile-money sign-in — Revl's custom identity flow:
 *
 *   1. Pick provider (MTN MoMo / Orange Money) + enter wallet number.
 *   2. We send an SMS OTP to prove possession of the number.
 *   3. (When wired) the backend calls the provider's KYC endpoint
 *      (MTN MoMo `GET /accountholder/.../basicuserinfo`, Orange Money
 *      equivalent) to fetch the registered wallet name — the account is
 *      created with a verified real name and a payment method already
 *      attached. See docs/AUTH_MOBILE_MONEY.md for the API details.
 *
 * Everything past the UI is mocked for now.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signIn } from '../../lib/session';
import { colors, fonts, spacing, type } from '../../theme';

type Provider = 'momo' | 'orange';
type Step = 'number' | 'otp' | 'verifying';

export default function MomoSignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>('momo');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<Step>('number');
  const [otp, setOtp] = useState('');
  const otpRef = useRef<TextInput>(null);

  const requestOtp = () => {
    // Real flow: POST /auth/momo/start { provider, phone } → sends SMS OTP.
    setStep('otp');
    setTimeout(() => otpRef.current?.focus(), 350);
  };

  const verifyOtp = () => {
    // Real flow: POST /auth/momo/verify { phone, otp } → session token +
    // wallet-name lookup via the provider KYC API.
    setStep('verifying');
    setTimeout(() => signIn(provider, phone), 1400);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>

      <Text style={styles.title}>Sign in with{'\n'}Mobile Money</Text>
      <Text style={styles.sub}>
        Your wallet number becomes your Revl account — verified name, payments ready.
      </Text>

      {step === 'number' && (
        <>
          <View style={styles.providerRow}>
            <ProviderCard
              label="MTN MoMo"
              color={colors.mtn}
              selected={provider === 'momo'}
              onPress={() => setProvider('momo')}
            />
            <ProviderCard
              label="Orange Money"
              color={colors.orange}
              selected={provider === 'orange'}
              onPress={() => setProvider('orange')}
            />
          </View>

          <Text style={styles.fieldLabel}>WALLET NUMBER</Text>
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
            onPress={requestOtp}
            style={({ pressed }) => [
              styles.primaryBtn,
              phone.trim().length < 9 && styles.btnDisabled,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}>
            <Text style={[styles.primaryText, phone.trim().length < 9 && { color: colors.textTertiary }]}>
              Send code
            </Text>
          </Pressable>
        </>
      )}

      {step === 'otp' && (
        <>
          <Text style={styles.fieldLabel}>ENTER THE 6-DIGIT CODE SENT TO +237 {phone}</Text>
          <TextInput
            ref={otpRef}
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            style={styles.otpInput}
            placeholder="••••••"
            placeholderTextColor={colors.textTertiary}
          />
          <Pressable
            disabled={otp.length !== 6}
            onPress={verifyOtp}
            style={({ pressed }) => [
              styles.primaryBtn,
              otp.length !== 6 && styles.btnDisabled,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}>
            <Text style={[styles.primaryText, otp.length !== 6 && { color: colors.textTertiary }]}>
              Verify
            </Text>
          </Pressable>
          <Pressable onPress={() => setStep('number')} hitSlop={8}>
            <Text style={styles.resend}>Wrong number? Go back</Text>
          </Pressable>
        </>
      )}

      {step === 'verifying' && (
        <View style={styles.verifying}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.verifyingText}>
            Confirming your {provider === 'momo' ? 'MTN MoMo' : 'Orange Money'} wallet…
          </Text>
        </View>
      )}
    </View>
  );
}

function ProviderCard({ label, color, selected, onPress }: { label: string; color: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.provider, selected && { borderColor: color }]}>
      <View style={[styles.providerDot, { backgroundColor: color }]} />
      <Text style={styles.providerText}>{label}</Text>
      {selected && <Ionicons name="checkmark-circle" size={16} color={color} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.gutter + 6 },
  back: { width: 40, marginLeft: -10 },
  title: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, color: colors.text, marginTop: 18 },
  sub: { ...type.body, color: colors.textSecondary, marginTop: 10, marginBottom: 28 },
  providerRow: { flexDirection: 'row', gap: 10 },
  provider: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.card,
  },
  providerDot: { width: 13, height: 13, borderRadius: 7 },
  providerText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  fieldLabel: { ...type.kicker, marginTop: 24, marginBottom: 10 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  prefix: { fontFamily: fonts.medium, fontSize: 17, color: colors.textSecondary, marginRight: 10 },
  phoneInput: { flex: 1, paddingVertical: 15, fontFamily: fonts.regular, fontSize: 17, color: colors.text },
  otpInput: {
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingVertical: 15,
    textAlign: 'center',
    letterSpacing: 10,
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 22,
  },
  btnDisabled: { backgroundColor: colors.surface },
  primaryText: { fontFamily: fonts.medium, fontSize: 16, color: colors.onAccent },
  resend: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 18 },
  verifying: { alignItems: 'center', gap: 14, marginTop: 60 },
  verifyingText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
});
