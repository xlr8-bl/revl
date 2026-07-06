/**
 * FloatingTabBar — the reference's floating, rounded, translucent pill
 * tab bar. Not edge-to-edge: it floats above content with side margins,
 * dark blur behind it, icon + label per tab, and the last tab is a
 * circular avatar with the user's initial. The active tab sits on a
 * subtle lighter pill.
 */
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { currentUser } from '../data/user';
import { colors, fonts } from '../theme';

type TabSpec = { icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap; label: string };

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

/** Route name → icon/label (mirrors reference order: Home Bible Plans Discover You). */
const TABS: Record<string, TabSpec> = {
  index: { icon: 'home-outline', iconActive: 'home', label: 'Home' },
  papers: { icon: 'reader-outline', iconActive: 'reader', label: 'Papers' },
  courses: { icon: 'checkbox-outline', iconActive: 'checkbox', label: 'Courses' },
  discover: { icon: 'search-outline', iconActive: 'search', label: 'Discover' },
  you: { icon: 'person-outline', iconActive: 'person', label: 'You' },
};

export function FloatingTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}>
      <BlurView intensity={40} tint="dark" style={styles.bar}>
        {/* Extra dark tint so content scrolling underneath stays legible. */}
        <View style={styles.tintOverlay} pointerEvents="none" />
        {state.routes.map((route, index) => {
          const spec = TABS[route.name];
          if (!spec) return null;
          const focused = state.index === index;
          const isYou = route.name === 'you';

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tab} hitSlop={6}>
              <View style={[styles.tabInner, focused && styles.tabInnerActive]}>
                {isYou ? (
                  <View style={[styles.avatar, focused && styles.avatarActive]}>
                    <Text style={styles.avatarText}>{currentUser.initial}</Text>
                  </View>
                ) : (
                  <Ionicons
                    name={focused ? spec.iconActive : spec.icon}
                    size={23}
                    color={focused ? colors.text : colors.textSecondary}
                  />
                )}
                <Text style={[styles.label, focused && styles.labelActive]}>{spec.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    marginHorizontal: 36,
    borderRadius: 36,
    overflow: 'hidden',
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignSelf: 'stretch',
    // Android has no real blur behind BlurView in Expo Go — the tint overlay carries it.
    backgroundColor: Platform.OS === 'android' ? 'rgba(24,24,26,0.94)' : 'transparent',
  },
  tintOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.tabBarTint },
  tab: { flex: 1, alignItems: 'center' },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    paddingVertical: 7,
    paddingHorizontal: 10,
    minWidth: 58,
  },
  tabInnerActive: { backgroundColor: colors.tabActivePill },
  label: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, marginTop: 3 },
  labelActive: { color: colors.text, fontFamily: fonts.medium },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: { backgroundColor: '#FFFFFF' },
  avatarText: { fontFamily: fonts.bold, fontSize: 13, color: '#1C1C1E' },
});
