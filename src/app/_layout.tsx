/**
 * Root layout — loads the bundled SF Pro Display faces, seeds the demo
 * Study DNA data, and hosts the navigation stack on a pure-black theme.
 */
import { useFonts } from 'expo-font';
// expo-router v7 vendors react-navigation, so themes come from expo-router itself.
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { seedDemoDataIfEmpty } from '../lib/revealLog';
import { useSession } from '../lib/session';
import { colors } from '../theme';

SplashScreen.preventAutoHideAsync();

/** Pure black everywhere — matches the reference exactly. */
const RevlTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    primary: colors.accent,
    border: colors.border,
  },
};

export default function RootLayout() {
  const { signedIn } = useSession();
  const [fontsLoaded] = useFonts({
    'SFProDisplay-Regular': require('../../assets/fonts/SFProDisplay-Regular.otf'),
    'SFProDisplay-Medium': require('../../assets/fonts/SFProDisplay-Medium.otf'),
    'SFProDisplay-Bold': require('../../assets/fonts/SFProDisplay-Bold.otf'),
  });

  useEffect(() => {
    // Demo Study DNA rows so personalization screens are alive on first run.
    seedDemoDataIfEmpty();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={RevlTheme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}>
          {/* Signed-out: onboarding/auth only. Signed-in: the app. */}
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="(auth)/welcome" />
            <Stack.Screen name="(auth)/momo" />
          </Stack.Protected>
          <Stack.Protected guard={signedIn}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="wrapped" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="unlock/[id]" options={{ presentation: 'modal' }} />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
