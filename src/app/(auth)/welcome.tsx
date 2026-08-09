/**
 * Welcome — the first screen, composed as a single page from an answer
 * booklet. The wordmark is written at the head of it, the nib writes the
 * invitation on a ruled line a third of the way down (LetsReveal), and the
 * sign-in block sits at the foot below where the ruling stops.
 *
 * There is deliberately no feature list. Three icon chips reciting "real past
 * papers, worked answers, your exact courses" is the furniture every app of
 * this kind ships, and it was competing with the one thing here worth looking
 * at. The promise is a single line; the rest of the page is paper.
 *
 * Mobile Money is the elevated option — it's how Cameroonian students actually
 * pay, and the same number unlocks papers.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookletPaper } from '../../components/BookletPaper';
import { LetsReveal } from '../../components/LetsReveal';
import { RevlLogo } from '../../components/RevlLogo';
import { MtnCircle, OrangeCircle } from '../../components/BrandLogos';
import { signIn } from '../../lib/session';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../../theme';

const GUTTER = spacing.gutter + 6;

export default function WelcomeScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Measured so the ruling can be phased to the writing line and stopped above
  // the sign-in block, rather than guessed at from fixed offsets.
  const [pageH, setPageH] = useState(0);
  const [heroY, setHeroY] = useState(0);
  const [footY, setFootY] = useState(0);
  const [headY, setHeadY] = useState(0);

  const onHero = (e: LayoutChangeEvent) => setHeroY(e.nativeEvent.layout.y);
  const onFoot = (e: LayoutChangeEvent) => setFootY(e.nativeEvent.layout.y);
  const onHead = (e: LayoutChangeEvent) =>
    setHeadY(e.nativeEvent.layout.y + e.nativeEvent.layout.height);

  return (
    <View style={styles.root} onLayout={(e) => setPageH(e.nativeEvent.layout.height)}>
      <BookletPaper height={pageH} rulesFrom={headY + 18} rulesTo={footY || pageH} offset={heroY} />

      <View style={[styles.page, { paddingTop: insets.top + 26, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Animated.View entering={FadeIn.duration(400)} onLayout={onHead} style={styles.brandRow}>
          <RevlLogo size={30} />
          <Text style={styles.wordmark}>revl</Text>
        </Animated.View>

        <View style={styles.upper} />

        {/* The one thing on this screen worth looking at. */}
        <View onLayout={onHero}>
          <LetsReveal />
          <Animated.Text entering={FadeInDown.delay(200).duration(560)} style={styles.promise}>
            Walk into the exam having already seen the paper.
          </Animated.Text>
        </View>

        <View style={styles.lower} />

        <Animated.View entering={FadeInDown.delay(420).duration(520)} onLayout={onFoot} style={styles.foot}>
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
            style={({ pressed }) => [styles.btn, styles.btnMomo, pressed && styles.pressed]}>
            <View style={styles.momoMarks}>
              <MtnCircle size={16} />
              <View style={{ marginLeft: -4 }}>
                <OrangeCircle size={16} />
              </View>
            </View>
            <Text style={styles.btnText}>Continue with Mobile Money</Text>
          </Pressable>

          <Text style={styles.fine}>
            MTN MoMo or Orange Money — the same number you use to unlock papers.
          </Text>
          <Text style={styles.terms}>By continuing you agree to Revl's Terms and Privacy Policy.</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    page: { flex: 1, paddingHorizontal: GUTTER },

    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    wordmark: { fontFamily: fonts.bold, fontSize: 24, color: colors.text, letterSpacing: -0.5 },

    // The writing line sits midway between the head of the page and the
    // sign-in block, so the ruled page reads evenly above and below it. An
    // uneven split left a void under the promise roughly twice the depth of
    // the space over it.
    upper: { flex: 1 },
    lower: { flex: 1 },

    // 27 is half the rule spacing, so a two-line promise closes exactly on the
    // next rule instead of drifting off the grid.
    promise: {
      fontFamily: fonts.regular,
      fontSize: 17,
      lineHeight: 27,
      color: colors.textSecondary,
      marginTop: 9,
      maxWidth: 320,
    },

    foot: { gap: 10 },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      borderRadius: 12,
      paddingVertical: 15,
    },
    pressed: { opacity: 0.85 },
    btnApple: { backgroundColor: '#FFFFFF' },
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
      marginTop: 4,
    },
    terms: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.textTertiary,
      textAlign: 'center',
    },
  });
const styles = themedStyleSheet(makeStyles);
