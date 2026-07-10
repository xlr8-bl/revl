/**
 * CategoryTile — faculty tile, Revl style: dark ink tile with a colored
 * accent stripe and a small colored glow dot. (Deliberately not the
 * solid color-block tiles of feed apps — color is an accent here,
 * not the surface.)
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Faculty } from '../types';
import { colors, fonts, radius, themedStyleSheet, useThemeVersion } from '../theme';

export function CategoryTile({ faculty, onPress }: { faculty: Faculty; onPress?: () => void }) {
  useThemeVersion();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.97 }] }]}>
      <View style={[styles.stripe, { backgroundColor: faculty.color }]} />
      <View style={styles.body}>
        <View style={[styles.dot, { backgroundColor: faculty.color }]} />
        <Text style={styles.text} numberOfLines={1}>
          {faculty.name}
        </Text>
      </View>
    </Pressable>
  );
}

const makeStyles = () => StyleSheet.create({
  tile: {
    width: 158,
    height: 64,
    borderRadius: radius.tile,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  stripe: { width: 4 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: 13.5, letterSpacing: 0.6, color: colors.text },
});
const styles = themedStyleSheet(makeStyles);
