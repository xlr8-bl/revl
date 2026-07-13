/**
 * GlassCircleButton — the header circle control used across pages: real
 * Liquid Glass where iOS 26 provides it, the regular card circle
 * everywhere else. Children are centered (icons, badges).
 */
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, themedStyleSheet, useThemeVersion } from '../theme';

const GLASS = isLiquidGlassAvailable();

export function GlassCircleButton({
  onPress,
  size = 44,
  pill = false,
  children,
}: {
  onPress?: () => void;
  size?: number;
  /** Pill mode: auto width with horizontal padding (icon + label rows). */
  pill?: boolean;
  children: React.ReactNode;
}) {
  useThemeVersion();
  const shape = pill
    ? { height: size, borderRadius: size / 2, paddingHorizontal: 14, flexDirection: 'row' as const, gap: 7 }
    : { width: size, height: size, borderRadius: size / 2 };
  if (GLASS) {
    return (
      <Pressable onPress={onPress} hitSlop={8}>
        <GlassView isInteractive style={[styles.center, shape]}>
          {children}
        </GlassView>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={[styles.fallback, styles.center, shape]} hitSlop={8}>
      {children}
    </Pressable>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    center: { alignItems: 'center', justifyContent: 'center' },
    fallback: {
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
    },
  });
const styles = themedStyleSheet(makeStyles);
