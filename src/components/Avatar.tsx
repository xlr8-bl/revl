/**
 * Avatar — the one place profile pictures are drawn. Priority:
 *   1. an uploaded / provider photo (`uri`)
 *   2. the bundled default (`useDefault`) — a Creative-Commons photo
 *      (Cristiano Ronaldo, Wikimedia Commons, CC BY-SA 3.0, © Anna Nessi)
 *   3. a colour disc with the name's initial (other people in mock feeds)
 * A single component so every surface stays consistent when a user sets a
 * photo.
 */
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../theme';

const DEFAULT_AVATAR = require('../../assets/default-avatar.jpg');

export function Avatar({
  uri,
  color,
  initial,
  size = 40,
  useDefault,
  ring,
}: {
  uri?: string;
  color?: string;
  initial?: string;
  size?: number;
  /** Fall back to the bundled default photo instead of a colour initial. */
  useDefault?: boolean;
  ring?: boolean;
}) {
  const radius = size / 2;
  const ringStyle = ring ? { borderWidth: 2, borderColor: '#FFFFFF' } : null;
  const box = { width: size, height: size, borderRadius: radius };

  if (uri) return <Image source={{ uri }} style={[box, ringStyle]} />;
  if (useDefault) return <Image source={DEFAULT_AVATAR} style={[box, ringStyle]} />;
  return (
    <View style={[box, styles.fallback, { backgroundColor: color ?? '#D8D2C6' }, ringStyle]}>
      <Text style={{ fontFamily: fonts.bold, fontSize: size * 0.42, color: '#141414' }}>
        {(initial ?? 'R').toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
