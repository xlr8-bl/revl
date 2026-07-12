/**
 * FeaturedCardShell — Android/web fallback. iOS gets the REAL system
 * context menu via FeaturedCardShell.ios.tsx (@expo/ui SwiftUI
 * ContextMenu); other platforms long-press into the custom blur overlay,
 * which the parent renders (onFallbackMenu).
 */
import React from 'react';
import { View } from 'react-native';

export function FeaturedCardShell({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  code: string;
  title: string;
  meta: string;
  onViewPapers: () => void;
  /** Lift preview (iOS only). */
  preview?: React.ReactNode;
  children: React.ReactNode;
}) {
  return <View style={{ width, height }}>{children}</View>;
}
