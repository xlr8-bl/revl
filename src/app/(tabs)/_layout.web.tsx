/**
 * Web tab layout — native tabs have no system bar on web, so the browser
 * keeps the custom floating glass dock. Mobile uses _layout.tsx (the real
 * system tab bar, Liquid Glass on iOS 26).
 */
import { Tabs } from 'expo-router';
import React from 'react';
import { FloatingTabBar } from '../../components/FloatingTabBar';
import { colors, useThemeVersion } from '../../theme';

export default function TabLayout() {
  useThemeVersion();
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="courses" />
      <Tabs.Screen name="community" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="you" />
    </Tabs>
  );
}
