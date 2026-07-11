/**
 * ConnectivityBanner — the quiet Spotify-style status pill. Going offline
 * shows a persistent "You're offline" pill under the status bar; coming
 * back shows "You're online" in green for a moment, then it slips away.
 * Nothing renders while the state is undetermined or steadily online.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBannerSuppressed, useOnline } from '../lib/connectivity';
import { colors, fonts, themedStyleSheet, useThemeVersion } from '../theme';

export function ConnectivityBanner() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const online = useOnline();
  // USSD approval prompts cut data for a few seconds — screens waiting on
  // one suppress the banner so we never flash a false "You're offline".
  const suppressed = useBannerSuppressed();
  const prev = useRef<boolean | null>(null);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    // "You're online" only when RECOVERING from offline — not on cold start.
    if (online === true && prev.current === false) {
      setShowBack(true);
      const t = setTimeout(() => setShowBack(false), 2600);
      prev.current = online;
      return () => clearTimeout(t);
    }
    prev.current = online;
  }, [online]);

  const offline = online === false;
  if (suppressed || (!offline && !showBack)) return null;

  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 6 }]}>
      <Animated.View
        key={offline ? 'off' : 'on'}
        entering={FadeInUp.duration(220)}
        exiting={FadeOutUp.duration(220)}
        style={[styles.pill, !offline && styles.pillOnline]}>
        <Ionicons
          name={offline ? 'cloud-offline-outline' : 'cloud-done-outline'}
          size={13}
          color={offline ? colors.text : '#FFFFFF'}
        />
        <Text style={[styles.text, !offline && { color: '#FFFFFF' }]}>
          {offline ? "You're offline" : "You're online"}
        </Text>
      </Animated.View>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    wrap: { position: 'absolute', left: 0, right: 0, zIndex: 100, alignItems: 'center' },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    pillOnline: { backgroundColor: colors.verified, borderColor: colors.verified },
    text: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.text },
  });
const styles = themedStyleSheet(makeStyles);
