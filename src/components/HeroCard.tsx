/**
 * HeroCard — the "Question of the Day" (mirrors the reference's
 * Verse of the Day card): small grey label, bold source line, large
 * serif display text over a dark image-like gradient, then an
 * engagement row (reveal / comments / share / more) with counts.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { questionOfTheDay } from '../data/home';
import { colors, fonts, radius, spacing, type } from '../theme';
import { MathRichText } from './MathRichText';

export function HeroCard() {
  const router = useRouter();
  const { label, sourceLine, question, stats } = questionOfTheDay;

  return (
    <Pressable onPress={() => router.push('/paper/cec420-2023')} style={styles.card}>
      {/* Dark botanical-feel backdrop, built from layered gradients so no
          remote image is needed. Swap for an <ImageBackground/> later. */}
      <LinearGradient colors={['#0E1F17', '#0A1410', '#050807']} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(38,84,58,0.55)', 'transparent']}
        start={{ x: 1, y: 1 }}
        end={{ x: 0.2, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Legibility scrim behind the type, like the reference photo treatment. */}
      <LinearGradient colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.45)']} style={StyleSheet.absoluteFill} />

      <View style={styles.inner}>
        <Text style={type.label}>{label}</Text>
        <Text style={styles.source}>{sourceLine}</Text>

        <View style={styles.heroTextWrap}>
          <MathRichText style={{ fontFamily: fonts.serif, fontSize: 27, lineHeight: 40, color: colors.text }}>
            {question.text}
          </MathRichText>
        </View>

        {/* Engagement row — reveal / comments / share / more (reference: ♥ 💬 ↑ ⋯). */}
        <View style={styles.engageRow}>
          <Engage icon="eye-outline" value={stats.reveals} />
          <Engage icon="chatbubble-outline" value={stats.comments} />
          <Engage icon="share-outline" value={stats.shares} />
          <Engage icon="ellipsis-horizontal" value="More" />
        </View>
      </View>
    </Pressable>
  );
}

function Engage({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View style={styles.engageItem}>
      <Ionicons name={icon} size={24} color={colors.text} />
      <Text style={styles.engageText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.gutter,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  inner: { padding: spacing.cardPad, paddingBottom: 24 },
  source: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, marginTop: 4 },
  heroTextWrap: { marginTop: 34, marginBottom: 38 },
  engageRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18 },
  engageItem: { alignItems: 'center', gap: 8 },
  engageText: { fontFamily: fonts.regular, fontSize: 14, color: colors.text },
});
