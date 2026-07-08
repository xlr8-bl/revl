/**
 * Welcome — first screen. Flat ink, type does the work. No gradients,
 * no decorative icons; the only marks are the two provider brand logos
 * and the mobile-money coin dots.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RevlLogo } from '../../components/RevlLogo';
import { signIn } from '../../lib/session';
import { colors, fonts, spacing, type } from '../../theme';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 22 }]}>
      <View>
        <View style={styles.brandRow}>
          <RevlLogo size={46} />
          <Text style={styles.wordmark}>revl</Text>
        </View>
        <View style={styles.rule} />
        <Text style={styles.tagline}>
          The past papers your exam will be set from, worked and explained.
        </Text>
        <Text style={styles.sub}>
          Real questions from your own faculty. Reveal the answer, judge yourself honestly, and let the explanations
          build on the notes you already wrote.
        </Text>
      </View>

      <View style={styles.buttons}>
        {Platform.OS !== 'android' && (
          <Pressable
            onPress={() => signIn('apple')}
            style={({ pressed }) => [styles.btn, styles.btnApple, pressed && styles.pressed]}>
            <Ionicons name="logo-apple" size={18} color="#000" />
            <Text style={[styles.btnText, { color: '#000' }]}>Continue with Apple</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => signIn('google')}
          style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.pressed]}>
          <Ionicons name="logo-google" size={16} color={colors.text} />
          <Text style={styles.btnText}>Continue with Google</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/momo' as never)}
          style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.pressed]}>
          <View style={styles.momoDots}>
            <View style={[styles.momoDot, { backgroundColor: colors.mtn }]} />
            <View style={[styles.momoDot, { backgroundColor: colors.orange, marginLeft: -5 }]} />
          </View>
          <Text style={styles.btnText}>Continue with Mobile Money</Text>
        </Pressable>
        <Text style={styles.momoHint}>
          MTN MoMo or Orange Money. The same number you will use to unlock papers.
        </Text>
        <Text style={styles.terms}>By continuing you agree to Revl's Terms and Privacy Policy.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.gutter + 6,
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 34 },
  wordmark: { fontFamily: fonts.bold, fontSize: 32, color: colors.text, letterSpacing: -0.5 },
  rule: { width: 34, height: 3, backgroundColor: colors.accent, marginTop: 14, marginBottom: 30 },
  tagline: { fontFamily: fonts.serif, fontSize: 31, lineHeight: 42, color: colors.text },
  sub: { ...type.body, color: colors.textSecondary, marginTop: 18, maxWidth: 330 },
  buttons: { gap: 10 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 10,
    paddingVertical: 15,
  },
  pressed: { opacity: 0.85 },
  btnApple: { backgroundColor: '#FFFFFF' },
  btnOutline: {
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  btnText: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  momoDots: { flexDirection: 'row', alignItems: 'center' },
  momoDot: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.5, borderColor: colors.card },
  momoHint: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textTertiary, textAlign: 'center', marginTop: 2 },
  terms: { fontFamily: fonts.regular, fontSize: 11, color: colors.textTertiary, textAlign: 'center', marginTop: 8 },
});
