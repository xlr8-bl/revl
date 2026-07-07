/**
 * Welcome — the first screen. Brand moment (amber lamp-glow on ink),
 * then the sign-in options:
 *   - Apple + Google (required primary methods; mocked until wired)
 *   - Mobile Money (MTN MoMo / Orange Money) — Revl's distinctive,
 *     Cameroon-first identity: your wallet number IS your account.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signIn } from '../../lib/session';
import { colors, fonts, spacing, type } from '../../theme';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 22 }]}>
      {/* Ambient lamp-glow */}
      <LinearGradient
        colors={['rgba(242,169,59,0.16)', 'rgba(242,169,59,0.03)', 'transparent']}
        start={{ x: 0.8, y: 0 }}
        end={{ x: 0.2, y: 0.7 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.brandBlock}>
        <Text style={styles.wordmark}>revl</Text>
        <Text style={styles.tagline}>
          Every past paper.{'\n'}Every answer, explained.{'\n'}
          <Text style={{ color: colors.accent, fontStyle: 'italic' }}>Yours.</Text>
        </Text>
        <Text style={styles.sub}>
          Real exam questions from your faculty, revealed step by step — with AI grounded in your own notes.
        </Text>
      </View>

      <View style={styles.buttons}>
        {Platform.OS !== 'android' && (
          <Pressable
            onPress={() => signIn('apple')}
            style={({ pressed }) => [styles.btn, styles.btnApple, pressed && styles.pressed]}>
            <Ionicons name="logo-apple" size={19} color="#000" />
            <Text style={[styles.btnText, { color: '#000' }]}>Continue with Apple</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => signIn('google')}
          style={({ pressed }) => [styles.btn, styles.btnGoogle, pressed && styles.pressed]}>
          <Ionicons name="logo-google" size={17} color="#FFF" />
          <Text style={styles.btnText}>Continue with Google</Text>
        </Pressable>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        {/* The Cameroon-first option: wallet number = identity */}
        <Pressable
          onPress={() => router.push('/momo' as never)}
          style={({ pressed }) => [styles.btn, styles.btnMomo, pressed && styles.pressed]}>
          <View style={styles.momoDots}>
            <View style={[styles.momoDot, { backgroundColor: colors.mtn }]} />
            <View style={[styles.momoDot, { backgroundColor: colors.orange, marginLeft: -5 }]} />
          </View>
          <Text style={styles.btnText}>Continue with Mobile Money</Text>
        </Pressable>
        <Text style={styles.momoHint}>
          MTN MoMo or Orange Money — the same number you’ll use to unlock papers.
        </Text>

        <Text style={styles.terms}>
          By continuing you agree to Revl’s Terms and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.gutter + 6, justifyContent: 'space-between' },
  brandBlock: { marginTop: 40 },
  wordmark: { fontFamily: fonts.bold, fontSize: 34, color: colors.text, letterSpacing: -0.5 },
  tagline: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 46, color: colors.text, marginTop: 26 },
  sub: { ...type.body, color: colors.textSecondary, marginTop: 18, maxWidth: 320 },
  buttons: { gap: 10 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 999,
    paddingVertical: 15,
  },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  btnApple: { backgroundColor: '#FFFFFF' },
  btnGoogle: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
  btnMomo: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong },
  btnText: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  momoDots: { flexDirection: 'row', alignItems: 'center' },
  momoDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: colors.card },
  momoHint: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textTertiary, textAlign: 'center' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
  orText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary },
  terms: { fontFamily: fonts.regular, fontSize: 11, color: colors.textTertiary, textAlign: 'center', marginTop: 10 },
});
