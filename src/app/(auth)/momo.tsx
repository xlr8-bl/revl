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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { suppressOfflineBanner } from '../../lib/connectivity';
import { signIn } from '../../lib/session';
import { MtnCircle, OrangeCircle } from '../../components/BrandLogos';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../../theme';

type Provider = 'momo' | 'orange';
type Step = 'number' | 'prompt';

export default function MomoSignInScreen() {
  useThemeVersion();
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

  // Receiving a USSD prompt cuts mobile data for a few seconds — hold the
  // "You're offline" banner down for the whole approval step so the drop
  // never reads as a problem.
  useEffect(() => {
    if (step !== 'prompt') return;
    suppressOfflineBanner(true);
    return () => suppressOfflineBanner(false);
  }, [step]);

  const providerName = provider === 'momo' ? 'MTN MoMo' : 'Orange Money';
  const valid = phone.trim().length >= 9;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>

      {step === 'number' ? (
        <>
          <Text style={styles.title}>Sign in with{'\n'}Mobile Money</Text>
          <Text style={styles.sub}>
            Your wallet number becomes your Revl account — registered name and payments already attached.
          </Text>

          {/* Provider tiles — big, logo-led, one glance to tell them apart */}
          <View style={styles.providerRow}>
            <ProviderTile
              logo={<MtnCircle size={38} />}
              name="MTN MoMo"
              selected={provider === 'momo'}
              onPress={() => setProvider('momo')}
            />
            <ProviderTile
              logo={<OrangeCircle size={38} />}
              name="Orange Money"
              selected={provider === 'orange'}
              onPress={() => setProvider('orange')}
            />
          </View>

          <Text style={styles.fieldLabel}>WALLET NUMBER</Text>
          <View style={styles.phoneCard}>
            <View style={styles.prefixChip}>
              <Text style={styles.prefixText}>+237</Text>
            </View>
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
            disabled={!valid}
            onPress={() => setStep('prompt')}
            style={({ pressed }) => [styles.primaryBtn, !valid && styles.btnDisabled, pressed && { opacity: 0.88 }]}>
            <Text style={[styles.primaryText, !valid && { color: colors.textTertiary }]}>Confirm PIN</Text>
          </Pressable>

          <View style={styles.trustRow}>
            <Ionicons name="lock-closed" size={13} color={colors.textTertiary} style={{ marginTop: 2 }} />
            <Text style={styles.hint}>
              {providerName} asks for your PIN on your phone — that proves the wallet is yours. Revl never sees your
              PIN.
            </Text>
          </View>

          {/* Verification-cost disclaimer — full transparency, per provider:
              MTN exposes a free active-wallet check; Orange has no identity
              API, so a 1 FCFA charge is the proof the wallet is live. */}
          <View style={styles.feeCard}>
            <Ionicons name="information-circle-outline" size={15} color={colors.textSecondary} style={{ marginTop: 1 }} />
            <Text style={styles.feeText}>
              {provider === 'momo'
                ? 'No charge — MTN confirms your wallet is active for free.'
                : 'Orange deducts 1 FCFA once to confirm your wallet is active. Nothing else is charged.'}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.promptWrap}>
          <View style={styles.promptLogo}>{provider === 'momo' ? <MtnCircle size={56} /> : <OrangeCircle size={56} />}</View>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.promptTitle}>Approve on your phone</Text>
          <Text style={styles.promptBody}>
            {providerName} sent a prompt to{'\n'}
            <Text style={styles.promptNumber}>+237 {phone}</Text>
          </Text>
          <Text style={styles.promptMeta}>
            Enter your Mobile Money PIN on that prompt to confirm it is you. This screen continues by itself once you
            approve.
          </Text>
          <Text style={styles.promptFee}>
            {provider === 'momo'
              ? 'No money is deducted — this only confirms your wallet.'
              : 'Only 1 FCFA is deducted to confirm your wallet is active.'}
          </Text>
          <Pressable onPress={() => setStep('number')} hitSlop={8}>
            <Text style={styles.changeNumber}>Wrong number? Go back</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function ProviderTile({
  logo,
  name,
  selected,
  onPress,
}: {
  logo: React.ReactNode;
  name: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, selected && styles.tileSelected, pressed && { opacity: 0.9 }]}>
      {selected && (
        <View style={styles.tileCheck}>
          <Ionicons name="checkmark" size={12} color={colors.onAccent} />
        </View>
      )}
      {logo}
      <View>
        <Text style={[styles.tileName, selected && { color: colors.text }]}>{name}</Text>
        <Text style={styles.tileMeta}>Wallet</Text>
      </View>
    </Pressable>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.gutter + 6 },
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
    title: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, color: colors.text, marginTop: 18 },
    sub: {
      fontFamily: fonts.regular,
      fontSize: 14.5,
      lineHeight: 21,
      color: colors.textSecondary,
      marginTop: 10,
      marginBottom: 26,
    },
    providerRow: { flexDirection: 'row', gap: 12 },
    tile: {
      flex: 1,
      alignItems: 'flex-start',
      gap: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      backgroundColor: colors.card,
    },
    tileSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
    tileCheck: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileName: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.textSecondary },
    tileMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary, marginTop: 2 },
    fieldLabel: {
      fontFamily: fonts.medium,
      fontSize: 11,
      letterSpacing: 1.2,
      color: colors.textSecondary,
      marginTop: 28,
      marginBottom: 10,
    },
    phoneCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    prefixChip: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    prefixText: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.textSecondary },
    phoneInput: {
      flex: 1,
      paddingVertical: 12,
      fontFamily: fonts.medium,
      fontSize: 18,
      letterSpacing: 0.5,
      color: colors.text,
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      alignItems: 'center',
      paddingVertical: 16,
      marginTop: 24,
    },
    btnDisabled: { backgroundColor: colors.surface },
    primaryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.onAccent },
    trustRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 16, paddingHorizontal: 4 },
    hint: { flex: 1, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: colors.textTertiary },
    feeCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
    },
    feeText: { flex: 1, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary },
    promptFee: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
    promptWrap: { alignItems: 'center', gap: 14, marginTop: 64, paddingHorizontal: 10 },
    promptLogo: { marginBottom: 6 },
    promptTitle: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
    promptBody: {
      fontFamily: fonts.regular,
      fontSize: 15,
      lineHeight: 23,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    promptNumber: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
    promptMeta: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 19,
      color: colors.textTertiary,
      textAlign: 'center',
      paddingHorizontal: 14,
    },
    changeNumber: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.accent, marginTop: 14 },
  });
const styles = themedStyleSheet(makeStyles);
