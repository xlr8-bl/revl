/**
 * ContextMenuShell — platform-split wrapper for the REAL system context
 * menu. This default file (Android/web) renders children untouched; the
 * caller provides its own long-press fallback (the JS blur overlay).
 * iOS gets ContextMenuShell.ios.tsx: @expo/ui's SwiftUI ContextMenu.
 */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

export type ShellMenuItem = {
  label: string;
  /** SF Symbol name (iOS only). */
  systemImage?: string;
  destructive?: boolean;
  onPress: () => void;
};

export function ContextMenuShell({
  style,
  children,
}: {
  items: ShellMenuItem[];
  style?: StyleProp<ViewStyle>;
  /** Host adopts the content's own height (dynamic-height cards). */
  matchContents?: boolean;
  /** Custom lifted preview (iOS only). */
  preview?: React.ReactNode;
  children: React.ReactNode;
}) {
  return <View style={style}>{children}</View>;
}
