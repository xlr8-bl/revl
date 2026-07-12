/**
 * CoursePreviewCard — the lifted preview inside the context menu, and the
 * thing that makes Revl's menu its own: an editorial exam-ticket card.
 * Oversized ghost code as background typography, a perforated ticket rule,
 * the course set out like a paper header, and a REVL wordmark stamp —
 * unmistakably this app, while the interaction stays 100% system.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { sentenceCase } from '../lib/format';
import {
  activeScheme,
  colors,
  fonts,
  mixColor,
  themedStyleSheet,
  useThemeVersion,
  withAlpha,
} from '../theme';

export function CoursePreviewCard({
  code,
  title,
  meta,
}: {
  code: string;
  title: string;
  meta: string;
}) {
  useThemeVersion();
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.card, { width: Math.min(width - 64, 340) }]}>
      {/* Ghost code — background typography, the card's signature */}
      <Text style={styles.ghost} numberOfLines={1}>
        {code}
      </Text>

      <View style={styles.top}>
        <View style={styles.codeChip}>
          <Text style={styles.codeChipText}>{code}</Text>
        </View>
        <View style={styles.stamp}>
          <Ionicons name="school" size={10} color={colors.accent} />
          <Text style={styles.stampText}>REVL</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {sentenceCase(title)}
      </Text>

      {/* Perforated ticket rule */}
      <View style={styles.perforation}>
        {Array.from({ length: 18 }).map((_, i) => (
          <View key={i} style={styles.perfDot} />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.meta}>{meta}</Text>
        <Text style={styles.footerHint}>Past papers · verified answers</Text>
      </View>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    card: {
      borderRadius: 24,
      padding: 20,
      paddingTop: 18,
      overflow: 'hidden',
      backgroundColor: mixColor(colors.accent, colors.bg, activeScheme() === 'light' ? 0.08 : 0.14),
      borderWidth: 1,
      borderColor: withAlpha(colors.accent, 0.35),
    },
    ghost: {
      position: 'absolute',
      right: -10,
      bottom: -18,
      fontFamily: fonts.bold,
      fontSize: 88,
      letterSpacing: -2,
      color: withAlpha(colors.accent, 0.09),
    },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    codeChip: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    codeChipText: { fontFamily: fonts.bold, fontSize: 12.5, letterSpacing: 1, color: colors.onAccent },
    stamp: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: withAlpha(colors.accent, 0.5),
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
      transform: [{ rotate: '3deg' }],
    },
    stampText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.6, color: colors.accent },
    title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 29, color: colors.text, marginTop: 14 },
    perforation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      marginBottom: 12,
    },
    perfDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: withAlpha(colors.accent, 0.25) },
    footer: { gap: 3 },
    meta: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.text },
    footerHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  });
const styles = themedStyleSheet(makeStyles);
