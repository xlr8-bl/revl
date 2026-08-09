/**
 * Welcome — the first screen.
 *
 * Everything is centred on one axis: wordmark, the line the nib writes, the
 * promise, then the sign-in block. Behind them a warm horizon rises from below
 * the fold (GlowHorizon), and it is the only atmosphere on the page — the rest
 * is deliberately flat so the light and the writing carry it.
 *
 * No feature list. Three icon chips reciting "real past papers, worked answers,
 * your exact courses" is the furniture every app of this kind ships, and it was
 * competing with the one thing here worth looking at.
 *
 * Mobile Money is the elevated option — it's how Cameroonian students actually
 * pay, and the same number unlocks papers.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlowHorizon } from '../../components/GlowHorizon';
import { LetsReveal } from '../../components/LetsReveal';
import { RevlLogo } from '../../components/RevlLogo';
import { MtnCircle, OrangeCircle } from '../../components/BrandLogos';
import { appleAvailable, signInWithApple, useGoogleSignIn } from '../../lib/auth';
import { useBannerLift } from '../../lib/connectivity';
import { signIn, signInWithIdentity } from '../../lib/session';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../../theme';

const GUTTER = spacing.gutter + 6;

export default function WelcomeScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [page, setPage] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);

  // Real provider sign in when a Supabase project is attached, the mock
  // identity when it is not, so the app is usable before credentials exist.
  const google = useGoogleSignIn();
  const [appleReady, setAppleReady] = useState(false);
  useEffect(() => {
    appleAvailable().then(setAppleReady);
  }, []);

  const withProvider = async (which: 'google' | 'apple') => {
    if (busy) return;
    setBusy(which);
    try {
      const identity =
        which === 'apple'
          ? appleReady
            ? await signInWithApple()
            : null
          : google.ready
            ? await google.exchange()
            : null;
      if (identity) signInWithIdentity(identity);
      else signIn(which);
    } catch {
      // A cancelled sheet is the common case and is not an error worth a dialog.
      setBusy(null);
      return;
    }
    setBusy(null);
  };
  const [footY, setFootY] = useState(0);

  const onFoot = (e: LayoutChangeEvent) => setFootY(e.nativeEvent.layout.y);

  // The sign-in block reaches far higher than a tab bar, so the offline pill is
  // told to float above it rather than landing on a button.
  useBannerLift(footY ? Math.max(0, page.h - footY) : 0);

  return (
    <View
      style={styles.root}
      onLayout={(e) => setPage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {/* The light sits low, so its crown breaks just above the buttons. */}
      <GlowHorizon width={page.w} height={page.h} horizon={0.54} />

      <View
        style={[
          styles.page,
          { paddingTop: insets.top + 22, paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.brandRow}>
          <RevlLogo size={30} />
          <Text style={styles.wordmark}>revl</Text>
        </Animated.View>

        <View style={styles.upper} />

        <View style={styles.hero}>
          <LetsReveal />
          <Animated.Text entering={FadeInDown.delay(200).duration(560)} style={styles.promise}>
            Walk into the exam having{'\n'}already seen the paper.
          </Animated.Text>
        </View>

        <View style={styles.lower} />

        <Animated.View entering={FadeInDown.delay(420).duration(520)} onLayout={onFoot} style={styles.foot}>
          {Platform.OS !== 'android' && (
            <Pressable
              onPress={() => withProvider('apple')}
              style={({ pressed }) => [styles.btn, styles.btnApple, pressed && styles.pressed]}>
              <Ionicons name="logo-apple" size={18} color={colors.bg} />
              <Text style={[styles.btnText, { color: colors.bg }]}>Continue with Apple</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => withProvider('google')}
            style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.pressed]}>
            <Ionicons name="logo-google" size={16} color={colors.text} />
            <Text style={styles.btnText}>Continue with Google</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/momo' as never)}
            style={({ pressed }) => [styles.btn, styles.btnMomo, pressed && styles.pressed]}>
            <View style={styles.momoMarks}>
              <MtnCircle size={16} />
              <View style={{ marginLeft: -4 }}>
                <OrangeCircle size={16} />
              </View>
            </View>
            <Text style={styles.btnText}>Continue with Mobile Money</Text>
          </Pressable>

          <Text style={styles.fine}>MTN MoMo or Orange Money. The same number unlocks papers.</Text>
          {/* Both stores require these to be reachable at sign-up, and it is a
              poor look to claim agreement to documents nobody can open. */}
          <Text style={styles.terms}>
            By continuing you accept Revl's{' '}
            <Text style={styles.termsLink} onPress={() => Linking.openURL('https://revl.app/terms')}>
              Terms
            </Text>{' '}
            and{' '}
            <Text style={styles.termsLink} onPress={() => Linking.openURL('https://revl.app/privacy')}>
              Privacy Policy
            </Text>
            .
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    page: { flex: 1, paddingHorizontal: GUTTER, alignItems: 'center' },

    hero: { alignSelf: 'stretch' },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    wordmark: { fontFamily: fonts.bold, fontSize: 26, color: colors.text, letterSpacing: -0.6 },

    // The writing line sits above the horizon; the light rises into the gap
    // beneath it, which is why the lower share is the larger one.
    upper: { flex: 2 },
    lower: { flex: 3 },

    promise: {
      fontFamily: fonts.regular,
      fontSize: 16.5,
      lineHeight: 24,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 6,
    },

    foot: { alignSelf: 'stretch', gap: 10 },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      borderRadius: 14,
      paddingVertical: 16,
    },
    pressed: { opacity: 0.85 },
    // Inverts with the theme: white on the dark page, black on the light one.
    // A white button on a near-white page all but disappears, and black-on-light
    // is Apple's own guidance for the mark anyway.
    btnApple: { backgroundColor: colors.text },
    btnOutline: {
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
    },
    btnMomo: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.accent },
    btnText: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
    momoMarks: { flexDirection: 'row', alignItems: 'center' },

    fine: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 17,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 6,
    },
    terms: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      lineHeight: 16,
      color: colors.textTertiary,
      textAlign: 'center',
    },
    termsLink: { color: colors.accent },
  });
const styles = themedStyleSheet(makeStyles);
