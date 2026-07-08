/**
 * Bottom dock — icon + label on an ink bar with a hairline top rule.
 * The active tab gets the amber tick above an amber icon.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

const TABS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }> = {
  index: { label: 'Tonight', icon: 'moon-outline', iconActive: 'moon' },
  papers: { label: 'Papers', icon: 'reader-outline', iconActive: 'reader' },
  courses: { label: 'Courses', icon: 'library-outline', iconActive: 'library' },
  discover: { label: 'Search', icon: 'search-outline', iconActive: 'search' },
  you: { label: 'You', icon: 'person-outline', iconActive: 'person' },
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
        const tab = TABS[route.name];
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
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  tick: { width: 18, height: 3, borderRadius: 1.5, backgroundColor: 'transparent' },
  tickActive: { backgroundColor: colors.accent },
  label: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.textSecondary },
  labelActive: { color: colors.text, fontFamily: fonts.bold },
});
