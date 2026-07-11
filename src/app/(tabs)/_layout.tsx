/**
 * Tab layout — the NATIVE system tab bar (expo-router native tabs), so on
 * iOS 26 the bar is Apple's own Liquid Glass, applied automatically by the
 * system — not our BlurView imitation. Android gets the platform Material
 * bar; web keeps the custom floating dock via _layout.web.tsx.
 *
 * Courses is the index route (the system always lands on `index`), and the
 * Home tab reads the clock: sun + "Today" by day, moon + "Tonight" by night.
 */
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { DynamicColorIOS, Platform } from 'react-native';
import { isDaytime } from '../../lib/greeting';
import { colors, palettes, useResolvedScheme, useThemeVersion } from '../../theme';

export default function TabLayout() {
  useThemeVersion();
  const scheme = useResolvedScheme();
  const daytime = isDaytime();
  // Liquid glass flips light/dark from what's BEHIND the bar (no callback),
  // so the tint must be dynamic — the system picks the right variant live.
  const tint =
    Platform.OS === 'ios'
      ? DynamicColorIOS({ light: palettes.light.accent, dark: palettes.dark.accent })
      : colors.accent;
  // Native containers default to the LIGHT theme during tab transitions,
  // which flashes white in dark mode (documented iOS 26 liquid-glass issue).
  // Providing a matched theme right at the tabs level fixes the artifact.
  const base = scheme === 'light' ? DefaultTheme : DarkTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: colors.bg, card: colors.bg, text: colors.text, primary: colors.accent, border: colors.border },
  };

  return (
    <ThemeProvider value={navTheme}>
    <NativeTabs tintColor={tint} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'books.vertical', selected: 'books.vertical.fill' }} md="menu_book" />
        <NativeTabs.Trigger.Label>Courses</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="today">
        <NativeTabs.Trigger.Icon
          sf={
            daytime
              ? { default: 'sun.max', selected: 'sun.max.fill' }
              : { default: 'moon', selected: 'moon.fill' }
          }
          md={daytime ? 'sunny' : 'dark_mode'}
        />
        <NativeTabs.Trigger.Label>{daytime ? 'Today' : 'Tonight'}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="community">
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
        <NativeTabs.Trigger.Label>Class</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="you">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label>You</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
    </ThemeProvider>
  );
}
