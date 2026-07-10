/**
 * DiagramView — renders a question diagram (a cropped image from the
 * extraction pipeline) inline where it belongs, with optional caption.
 * Supports pinch-to-zoom + pan via a gesture-driven overlay.
 * Falls back to a styled placeholder if the image URL can't load
 * (e.g. offline), so the reader never shows a broken image.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { Diagram } from '../types';
import { colors, fonts, radius, themedStyleSheet, useThemeVersion } from '../theme';

export function DiagramView({ diagram }: { diagram: Diagram }) {
  useThemeVersion();
  const [failed, setFailed] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => !failed && setZoomOpen(true)}>
        <View style={styles.imageBox}>
          {failed ? (
            <View style={styles.fallback}>
              <Ionicons name="analytics-outline" size={34} color={colors.textSecondary} />
              <Text style={styles.fallbackText}>Diagram unavailable offline</Text>
            </View>
          ) : (
            <>
              <Image
                source={{ uri: diagram.imageUrl }}
                style={styles.image}
                resizeMode="cover"
                onError={() => setFailed(true)}
              />
              <View style={styles.zoomHint}>
                <Ionicons name="expand-outline" size={14} color={colors.text} />
              </View>
            </>
          )}
        </View>
      </Pressable>
      {diagram.caption && <Text style={styles.caption}>{diagram.caption}</Text>}

      {zoomOpen && <ZoomModal uri={diagram.imageUrl} onClose={() => setZoomOpen(false)} />}
    </View>
  );
}

/** Full-screen pinch-to-zoom viewer. */
function ZoomModal({ uri, onClose }: { uri: string; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const saved = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(6, Math.max(1, saved.value * e.scale));
    })
    .onEnd(() => {
      saved.value = scale.value;
      if (scale.value <= 1.02) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        saved.value = 1;
        savedTx.value = 0;
        savedTy.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.zoomBackdrop}>
        <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
          <Animated.Image source={{ uri }} style={[{ width, height: height * 0.7 }, style]} resizeMode="contain" />
        </GestureDetector>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

const makeStyles = () => StyleSheet.create({
  wrap: { marginTop: 14 },
  imageBox: { borderRadius: radius.thumb, overflow: 'hidden', backgroundColor: colors.surface },
  image: { width: '100%', height: 180 },
  zoomHint: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    padding: 6,
  },
  fallback: { height: 140, alignItems: 'center', justifyContent: 'center', gap: 8 },
  fallbackText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  caption: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 8 },
  zoomBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    backgroundColor: 'rgba(44,44,46,0.8)',
    borderRadius: 20,
    padding: 8,
  },
});
const styles = themedStyleSheet(makeStyles);
