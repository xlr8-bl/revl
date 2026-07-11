/**
 * Bottom dock — a floating "liquid glass" bar: a rounded, translucent,
 * blurred capsule that lets content pass under it, with a hairline glass
 * edge. The active tab gets the amber tick above an amber icon. The Home
 * tab reads the clock (sun + "Today" by day, moon + "Tonight" by night).
 */
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isDaytime } from '../lib/greeting';
import { colors, fonts, themedStyleSheet, useResolvedScheme, useThemeVersion, withAlpha } from '../theme';

const TABS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }> = {
  index: { label: 'Courses', icon: 'library-outline', iconActive: 'library' },
  community: { label: 'Class', icon: 'people-outline', iconActive: 'people' },
  discover: { label: 'Search', icon: 'search-outline', iconActive: 'search' },
  you: { label: 'You', icon: 'person-outline', iconActive: 'person' },
};

/** The Home tab reads the clock: sun + "Today" by day, moon + "Tonight" by night. */
const daytime = isDaytime();
const homeTab = daytime
  ? { label: 'Today', icon: 'sunny-outline' as const, iconActive: 'sunny' as const }
  : { label: 'Tonight', icon: 'moon-outline' as const, iconActive: 'moon' as const };

/** Minimal slice of react-navigation's tab-bar props (expo-router vendors the lib). */
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

export function FloatingTabBar({ state, navigation }: TabBarProps) {
  useThemeVersion(); // the navigator renders this, so subscribe to re-render on theme change
  const scheme = useResolvedScheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={styles.dock}>
        <BlurView
          intensity={scheme === 'light' ? 40 : 30}
          tint={scheme === 'light' ? 'light' : 'dark'}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        {/* Glass wash — light enough that content clearly passes beneath. */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(colors.card, scheme === 'light' ? 0.4 : 0.35) }]} />

        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const tab = route.name === 'today' ? homeTab : TABS[route.name];
            if (!tab) return null;
            const focused = state.index === index;

            const onPress = () => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            return (
              <Pressable key={route.key} onPress={onPress} style={styles.tab} hitSlop={8}>
                <View style={[styles.tick, focused && styles.tickActive]} />
                <Ionicons name={focused ? tab.iconActive : tab.icon} size={21} color={focused ? colors.accent : colors.textSecondary} />
                <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  dock: {
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    // Soft lift so the glass reads as floating.
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  row: { flexDirection: 'row', paddingTop: 9, paddingBottom: 11 },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 },
  tick: { width: 18, height: 3, borderRadius: 1.5, backgroundColor: 'transparent' },
  tickActive: { backgroundColor: colors.accent },
  label: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.textSecondary },
  labelActive: { color: colors.text, fontFamily: fonts.bold },
});
const styles = themedStyleSheet(makeStyles);
