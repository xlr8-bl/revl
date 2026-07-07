/**
 * Bottom dock — text only. Five labels on an ink bar with a hairline
 * top rule; the active label is bold white with a short amber tick
 * above it. No icons: type is the interface.
 */
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

const LABELS: Record<string, string> = {
  index: 'Tonight',
  papers: 'Papers',
  courses: 'Courses',
  discover: 'Search',
  you: 'You',
};

/** Minimal slice of react-navigation's tab-bar props (expo-router vendors the lib). */
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

export function FloatingTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const label = LABELS[route.name];
        if (!label) return null;
        const focused = state.index === index;

        const onPress = () => {
          if (Platform.OS !== 'web') Haptics.selectionAsync();
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab} hitSlop={8}>
            <View style={[styles.tick, focused && styles.tickActive]} />
            <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
    backgroundColor: 'rgba(8,8,11,0.97)',
  },
  tab: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 6 },
  tick: { width: 18, height: 3, borderRadius: 1.5, backgroundColor: 'transparent' },
  tickActive: { backgroundColor: colors.accent },
  label: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  labelActive: { color: colors.text, fontFamily: fonts.bold },
});
