/**
 * ContextMenuShell (iOS) — wraps children in @expo/ui's SwiftUI
 * ContextMenu: UIKit's own long-press interaction (lift, system blur,
 * native menu with SF Symbols). `matchContents` lets the Host adopt the
 * content's natural height for dynamic cards; overflow stays visible so
 * the in-place grow beat of the animation never clips.
 */
import { Button, ContextMenu, Divider, Host, Section } from '@expo/ui/swift-ui';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ShellMenuItem } from './ContextMenuShell';

export type { ShellMenuItem } from './ContextMenuShell';

export function ContextMenuShell({
  items,
  header,
  style,
  matchContents,
  preview,
  children,
}: {
  items: ShellMenuItem[];
  /** Section header line above the options (e.g. "CEC420 · Data Mining") —
      the system renders it as the menu's small caption title. */
  header?: string;
  style?: StyleProp<ViewStyle>;
  matchContents?: boolean;
  /** Custom lifted preview shown above the menu instead of a snapshot. */
  preview?: React.ReactNode;
  children: React.ReactNode;
}) {
  const buttons = items.map((item, i) => (
    <React.Fragment key={item.label}>
      {item.divider ? <Divider /> : null}
      <Button
        label={item.label}
        systemImage={item.systemImage as never}
        role={item.destructive ? 'destructive' : undefined}
        onPress={item.onPress}
      />
    </React.Fragment>
  ));
  return (
    <Host style={[{ overflow: 'visible' }, style]} matchContents={matchContents}>
      <ContextMenu>
        <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
        {preview ? <ContextMenu.Preview>{preview}</ContextMenu.Preview> : null}
        <ContextMenu.Items>
          {header ? <Section title={header}>{buttons}</Section> : buttons}
        </ContextMenu.Items>
      </ContextMenu>
    </Host>
  );
}
