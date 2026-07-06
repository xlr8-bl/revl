/**
 * SessionCard — mirrors the reference's "Guided Scripture / Guided
 * Prayer" cards: optional tiny stat pill top-left, small grey label,
 * bold title, meta row with a ▶ triangle, and a rounded thumbnail on
 * the right (gradient + icon stands in for the reference's photo).
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SessionCardData } from '../data/home';
import { colors, fonts, radius, spacing, type } from '../theme';

export function SessionCard({ data }: { data: SessionCardData }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(data.route as never)} style={styles.card}>
      <View style={styles.left}>
        {data.pill && (
          <View style={styles.pill}>
            <Ionicons name={data.pill.icon as never} size={13} color={colors.text} />
            <Text style={styles.pillText}>{data.pill.value}</Text>
          </View>
        )}
        <Text style={type.label}>{data.label}</Text>
        <Text style={styles.title}>{data.title}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="play" size={13} color={colors.text} />
          <Text style={styles.metaText}>{data.meta}</Text>
        </View>
      </View>

      {/* Right thumbnail — gradient placeholder with a big glyph. */}
      <View style={styles.thumb}>
        <LinearGradient colors={data.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.thumbIconCircle}>
          <Ionicons name={data.icon as never} size={22} color="#1C1C1E" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.cardPad,
    marginHorizontal: spacing.gutter,
    alignItems: 'center',
  },
  left: { flex: 1, paddingRight: 14 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    gap: 5,
    marginBottom: 14,
  },
  pillText: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  title: { fontFamily: fonts.bold, fontSize: 21, lineHeight: 26, color: colors.text, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  metaText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  thumb: {
    width: 104,
    height: 104,
    borderRadius: radius.thumb,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
