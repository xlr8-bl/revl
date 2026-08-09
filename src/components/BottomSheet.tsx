/**
 * BottomSheet — a bottom-anchored sheet you can drag down to dismiss. It
 * hugs its content (no dead space at the foot — the card ends just above the
 * home indicator), slides up on open, and as you drag it down the backdrop
 * tint fades away with it so the dismissal feels physical. Used by
 * ExplainSheet, CoursePapersSheet, the composer and the unlock flow.
 */
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, themedStyleSheet, useThemeVersion } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** 0–1 share of screen height the sheet may grow to (it hugs content below this). */
  maxHeightPct?: number;
  /** Fixed floor: the sheet is at least this tall (content can still grow it). */
  minHeight?: number;
  /** When false, the sheet appears already in place (used when RESTORING a
      suspended sheet after returning from a paper. No re-slide). */
  animateIn?: boolean;
  /** Render as an in-screen overlay instead of a Modal. An inline sheet
      stays mounted UNDER a pushed screen, so navigating away and back
      never re-animates it. It is simply still there. */
  inline?: boolean;
};

export function BottomSheet({
  visible,
  onClose,
  children,
  maxHeightPct = 0.88,
  minHeight,
  animateIn = true,
  inline = false,
}: Props) {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const { height: SCREEN_H } = useWindowDimensions();
  // Keep the sheet mounted through its exit animation.
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(SCREEN_H);
  // Measured sheet height — drives the drag threshold and the tint interpolation.
  const sheetH = useSharedValue(SCREEN_H);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (animateIn) {
        translateY.value = SCREEN_H;
        translateY.value = withTiming(0, { duration: 340, easing: Easing.out(Easing.cubic) });
      } else {
        // Restore: appear already slid up, exactly as it was left.
        translateY.value = 0;
      }
    } else if (mounted) {
      translateY.value = withTiming(SCREEN_H, { duration: 240, easing: Easing.in(Easing.cubic) }, (fin) => {
        if (fin) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Drag down to dismiss: only downward drag moves the sheet; release past a
  // third of its height (or with a flick) closes, otherwise it springs back.
  const pan = Gesture.Pan()
    .activeOffsetY(14)
    .failOffsetY(-14)
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > sheetH.value * 0.32 || e.velocityY > 850) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 240, mass: 0.7 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, sheetH.value], [1, 0], 'clamp'),
  }));

  if (!mounted) return null;

  const body = (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
        pointerEvents="box-none">
        <GestureDetector gesture={pan}>
          <Animated.View
            onLayout={(e) => (sheetH.value = e.nativeEvent.layout.height)}
            style={[
              styles.sheet,
              { maxHeight: `${Math.round(maxHeightPct * 100)}%` as never, paddingBottom: insets.bottom + 12 },
              minHeight != null && { minHeight },
              sheetStyle,
            ]}>
            <View style={styles.grabber} />
            {children}
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </>
  );

  if (inline) {
    // In-screen overlay: survives navigation on top of it (no Modal layer).
    return <View style={[StyleSheet.absoluteFill, { zIndex: 60 }]}>{body}</View>;
  }
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>{body}</GestureHandlerRootView>
    </Modal>
  );
}

const makeStyles = () => StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
});
const styles = themedStyleSheet(makeStyles);
