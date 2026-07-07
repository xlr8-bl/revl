/**
 * Bottom dock — Revl's tab bar. A full-width translucent dock with a
 * hairline top border; the active tab is marked by an amber icon and a
 * small amber tick above it. (Deliberately NOT a floating pill with an
 * avatar — that pattern belongs to another app.)
 */
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

type TabSpec = { icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap; label: string };

const TABS: Record<string, TabSpec> = {
  index: { icon: 'moon-outline', iconActive: 'moon', label: 'Tonight' },
  papers: { icon: 'reader-outline', iconActive: 'reader', label: 'Papers' },
  courses: { icon: 'library-outline', iconActive: 'library', label: 'Courses' },
  discover: { icon: 'search-outline', iconActive: 'search', label: 'Discover' },
  you: { icon: 'person-outline', iconActive: 'person', label: 'You' },
};

/**
 * Minimal slice of react-navigation's BottomTabBarProps that we use —
 * declared locally because expo-router v7 vendors react-navigation and
 * doesn't re-export the type from its public entry.
 */
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
    <View pointerEvents="box-none" style={styles.wrap}>
      <BlurView intensity={36} tint="dark" style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.tintOverlay} pointerEvents="none" />
        {state.routes.map((route, index) => {
          const spec = TABS[route.name];
          if (!spec) return null;
          const focused = state.index === index;

          const onPress = () => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tab} hitSlop={6}>
              {/* Amber tick marks the active tab. */}
              <View style={[styles.tick, focused && styles.tickActive]} />
              <Ionicons
                name={focused ? spec.iconActive : spec.icon}
                size={22}
                color={focused ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>{spec.label}</Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  dock: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
    // Android has no real blur behind BlurView in Expo Go — tint carries it.
    backgroundColor: Platform.OS === 'android' ? 'rgba(8,8,11,0.96)' : 'transparent',
    overflow: 'hidden',
  },
  tintOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.dockTint },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  tick: { width: 16, height: 3, borderRadius: 2, backgroundColor: 'transparent', marginBottom: 2 },
  tickActive: { backgroundColor: colors.accent },
  label: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.textSecondary },
  labelActive: { color: colors.text, fontFamily: fonts.medium },
});
