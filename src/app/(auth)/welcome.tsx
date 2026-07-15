/**
 * Welcome — the first screen. Shows the product, not just words: a small
 * stack of exam-paper cards (the app's core artifact) sits above a bold
 * serif promise and three concrete value lines, then the sign-in
 * options. Everything eases in on a short stagger so it feels alive.
 * Mobile Money is elevated — it's how Cameroonian students actually pay
 * and the same number unlocks papers.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RevlLogo } from '../../components/RevlLogo';
import { IntroSequence } from '../../components/IntroSequence';
import { signIn } from '../../lib/session';
import { markIntroSeen, useIntroState } from '../../lib/intro';
import { MtnCircle, OrangeCircle } from '../../components/BrandLogos';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../../theme';

const PAPER = '#F2ECDF';
const INK = '#241E12';
const INK_SOFT = 'rgba(36,30,18,0.6)';

const VALUE = [
  { icon: 'documents-outline', text: 'Real past papers from your own faculty' },
  { icon: 'sparkles-outline', text: 'Every question worked, verified and explained' },
  { icon: 'school-outline', text: 'Built around the exact courses you take' },
] as const;

export default function WelcomeScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const intro = useIntroState();

  // Wait for the intro flag to hydrate so we never flash welcome first.
  if (intro === 'loading') return <View style={styles.root} />;
  // First launch: play the animated opening, then fall through to welcome.
  if (intro === 'unseen') return <IntroSequence onDone={markIntroSeen} />;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 },
        ]}>
        {/* Brand */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.brandRow}>
          <RevlLogo size={34} />
          <Text style={styles.wordmark}>revl</Text>
        </Animated.View>

        {/* Product hero — a little stack of exam papers */}
        <Animated.View entering={FadeInDown.delay(80).duration(520)} style={styles.hero}>
          <View style={[styles.paper, styles.paperBack]} />
          <View style={[styles.paper, styles.paperMid]} />
          <View style={[styles.paper, styles.paperFront]}>
            <View style={styles.paperHead}>
              <Text style={styles.paperCode}>PHY401 · 2023</Text>
              <Text style={styles.paperMarks}>12 marks</Text>
            </View>
            <View style={styles.paperRule} />
            <Text style={styles.paperQ}>
              Derive the moment of inertia of a uniform disc about its central axis.
            </Text>
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={14} color="#1B8A47" />
              <Text style={styles.verifiedText}>Worked answer verified by a top student</Text>
            </View>
          </View>
        </Animated.View>

        {/* Promise */}
        <Animated.Text entering={FadeInDown.delay(160).duration(520)} style={styles.headline}>
          Walk into the exam having already seen the paper.
        </Animated.Text>

        {/* Value lines */}
        <View style={styles.values}>
          {VALUE.map((v, i) => (
            <Animated.View key={v.text} entering={FadeInDown.delay(240 + i * 70).duration(460)} style={styles.valueRow}>
              <View style={styles.valueChip}>
                <Ionicons name={v.icon} size={15} color={colors.accent} />
              </View>
              <Text style={styles.valueText}>{v.text}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Sign in */}
        <Animated.View entering={FadeInDown.delay(480).duration(500)} style={styles.buttons}>
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

          {/* Mobile Money — the local hero option */}
          <Pressable
            onPress={() => router.push('/momo' as never)}
            style={({ pressed }) => [styles.btn, styles.btnMomo, pressed && styles.pressed]}>
            <View style={styles.momoDots}>
              <MtnCircle size={16} />
              <View style={{ marginLeft: -4 }}>
                <OrangeCircle size={16} />
              </View>
            </View>
            <Text style={styles.btnText}>Continue with Mobile Money</Text>
            <View style={styles.momoTag}>
              <Text style={styles.momoTagText}>Cameroon</Text>
            </View>
          </Pressable>
          <Text style={styles.momoHint}>
            MTN MoMo or Orange Money — the same number you use to unlock papers.
          </Text>
          <Text style={styles.terms}>By continuing you agree to Revl's Terms and Privacy Policy.</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.gutter + 6, flexGrow: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  wordmark: { fontFamily: fonts.bold, fontSize: 26, color: colors.text, letterSpacing: -0.5 },

  hero: { height: 210, marginTop: 26, alignItems: 'center', justifyContent: 'center' },
  paper: {
    position: 'absolute',
    width: 260,
    borderRadius: 12,
    backgroundColor: PAPER,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  paperBack: { height: 150, transform: [{ rotate: '-7deg' }], opacity: 0.55, top: 26 },
  paperMid: { height: 160, transform: [{ rotate: '4deg' }], opacity: 0.8, top: 22 },
  paperFront: { height: 178, padding: 18, transform: [{ rotate: '-1.5deg' }] },
  paperHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paperCode: { fontFamily: fonts.bold, fontSize: 12.5, color: INK_SOFT, letterSpacing: 0.5 },
  paperMarks: { fontFamily: fonts.medium, fontSize: 12.5, color: INK_SOFT },
  paperRule: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(36,30,18,0.2)', marginTop: 11, marginBottom: 12 },
  paperQ: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 27, color: INK },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  verifiedText: { fontFamily: fonts.medium, fontSize: 12, color: '#1B8A47' },

  headline: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 34, color: colors.text, marginTop: 30 },
  values: { marginTop: 22, gap: 13 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  valueChip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: { flex: 1, fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 20, color: colors.textSecondary },

  buttons: { gap: 10, marginTop: 34 },
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
  btnMomo: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  btnText: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  momoDots: { flexDirection: 'row', alignItems: 'center' },
  momoDot: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.5, borderColor: colors.card },
  momoTag: {
    backgroundColor: colors.accentSoft,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginLeft: 2,
  },
  momoTagText: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.accent, letterSpacing: 0.3 },
  momoHint: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textTertiary, textAlign: 'center', marginTop: 4 },
  terms: { fontFamily: fonts.regular, fontSize: 11, color: colors.textTertiary, textAlign: 'center', marginTop: 6 },
});
const styles = themedStyleSheet(makeStyles);
