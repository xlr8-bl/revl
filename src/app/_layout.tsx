/**
 * Root layout — loads the bundled SF Pro Display faces, seeds the demo
 * Study DNA data, and hosts the navigation stack on a pure-black theme.
 */
import { useFonts } from 'expo-font';
// expo-router v7 vendors react-navigation, so themes come from expo-router itself.
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableFreeze } from 'react-native-screens';
import { ConnectivityBanner } from '../components/ConnectivityBanner';
import { seedDemoDataIfEmpty } from '../lib/revealLog';
import { useSession } from '../lib/session';
import { colors, useResolvedScheme } from '../theme';

SplashScreen.preventAutoHideAsync();
// Don't freeze inactive screens: a theme switch must repaint every mounted
// screen at once, not one-by-one as you navigate back to them.
enableFreeze(false);

export default function RootLayout() {
  const scheme = useResolvedScheme();
  const { hydrated, signedIn, profile } = useSession();

  const base = scheme === 'light' ? DefaultTheme : DarkTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.bg,
      card: colors.bg,
      text: colors.text,
      primary: colors.accent,
      border: colors.border,
    },
  };
  const [fontsLoaded] = useFonts({
    'SFProDisplay-Regular': require('../../assets/fonts/SFProDisplay-Regular.otf'),
    'SFProDisplay-Medium': require('../../assets/fonts/SFProDisplay-Medium.otf'),
    'SFProDisplay-Bold': require('../../assets/fonts/SFProDisplay-Bold.otf'),
  });

  useEffect(() => {
    // Demo Study DNA rows keep personalization screens alive while
    // DEVELOPING — production first-runs stay honest: a new student sees
    // the real cold-start (starter session, "still learning you" briefing)
    // instead of fake weak topics. Devices that already seeded keep their
    // rows; this only stops NEW production installs from being seeded.
    if (__DEV__ && !process.env.EXPO_PUBLIC_COLD_START) seedDemoDataIfEmpty();
  }, []);

  useEffect(() => {
    if (fontsLoaded && hydrated) SplashScreen.hideAsync();
  }, [fontsLoaded, hydrated]);

  if (!fontsLoaded || !hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Keyed on the resolved scheme: a light↔dark flip remounts the whole
          tree, so every screen rebuilds fresh in the new theme (a full
          in-app refresh). expo-router re-derives the current route from the
          URL, so you stay where you are. The Animated.View fades the new
          theme in over its own background, so the switch feels alive. */}
      <ThemeProvider key={scheme} value={navTheme}>
        <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
        <Animated.View key={scheme} entering={FadeIn.duration(320)} style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}>
          {/* Signed-out: auth. Signed-in without a profile: setup. Then the app. */}
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="(auth)/welcome" />
            <Stack.Screen name="(auth)/momo" />
          </Stack.Protected>
          <Stack.Protected guard={signedIn && !profile}>
            <Stack.Screen name="(auth)/onboarding" />
          </Stack.Protected>
          <Stack.Protected guard={signedIn && !!profile}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="account/edit" />
            <Stack.Screen name="account/courses" />
            <Stack.Screen name="account/mobile-money" />
            <Stack.Screen name="downloads" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="friends" />
            <Stack.Screen name="wrapped" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="unlock/[id]" options={{ presentation: 'modal' }} />
          </Stack.Protected>
        </Stack>
        <ConnectivityBanner />
        </Animated.View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
