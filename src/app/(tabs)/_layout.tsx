/**
 * Tab layout — five tabs behind the custom floating pill tab bar
 * (Home · Papers · Courses · Discover · You, mirroring the reference's
 * Home · Bible · Plans · Discover · You).
 */
import { Tabs } from 'expo-router';
import React from 'react';
import { FloatingTabBar } from '../../components/FloatingTabBar';
import { colors } from '../../theme';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="courses"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="courses" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="community" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="you" />
    </Tabs>
  );
}
