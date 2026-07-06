/**
 * CategoryTile — the bright colored tiles from the reference's Plans
 * screen (LOVE / HEALING / ANXIETY…). For Revl these are faculties.
 */
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { Faculty } from '../types';
import { fonts, radius } from '../theme';

export function CategoryTile({ faculty, onPress }: { faculty: Faculty; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, { backgroundColor: faculty.color }]}>
      <Text style={styles.text} numberOfLines={1}>
        {faculty.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 168,
    height: 76,
    borderRadius: radius.tile,
    justifyContent: 'flex-end',
    padding: 14,
  },
  text: { fontFamily: fonts.bold, fontSize: 17, letterSpacing: 0.4, color: '#FFFFFF' },
});
