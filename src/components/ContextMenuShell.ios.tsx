/**
 * ContextMenuShell (iOS) — wraps children in @expo/ui's SwiftUI
 * ContextMenu: UIKit's own long-press interaction (lift, system blur,
 * native menu with SF Symbols). `matchContents` lets the Host adopt the
 * content's natural height for dynamic cards; overflow stays visible so
 * the in-place grow beat of the animation never clips.
 */
import { Button, ContextMenu, Host } from '@expo/ui/swift-ui';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ShellMenuItem } from './ContextMenuShell';

export type { ShellMenuItem } from './ContextMenuShell';

export function ContextMenuShell({
  items,
  style,
  matchContents,
  children,
}: {
  items: ShellMenuItem[];
  style?: StyleProp<ViewStyle>;
  matchContents?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Host style={[{ overflow: 'visible' }, style]} matchContents={matchContents}>
      <ContextMenu>
        <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
        <ContextMenu.Items>
          {items.map((item) => (
            <Button
              key={item.label}
              label={item.label}
              systemImage={item.systemImage as never}
              role={item.destructive ? 'destructive' : undefined}
              onPress={item.onPress}
            />
          ))}
        </ContextMenu.Items>
      </ContextMenu>
    </Host>
  );
}
