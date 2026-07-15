/**
 * FeaturedCardShell (iOS) — the system context menu WITHOUT putting the
 * visible card inside SwiftUI. The card renders as pure React Native (so
 * no SwiftUI layout race can ever squash it); a transparent native menu
 * layer sits on top handling tap + long-press, and the lift shows a
 * pixel-identical duplicate of the card via ContextMenu.Preview.
 */
import { Button, ContextMenu, Divider, Group, Host, Section } from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import React, { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useCourseMenuItems } from '../lib/useCourseMenu';
import { sentenceCase } from '../lib/format';

export function FeaturedCardShell({
  width,
  height,
  code,
  title,
  meta,
  onViewPapers,
  preview,
  children,
}: {
  width: number;
  height: number;
  code: string;
  title: string;
  meta: string;
  onViewPapers: () => void;
  /** Pixel-identical duplicate of the card, lifted by the system. */
  preview?: React.ReactNode;
  children: React.ReactNode;
}) {
  const items = useCourseMenuItems(code, title, meta, { onViewPapers });
  /** Quick-tap guard lives here on iOS — the card itself is inert. */
  const pressStart = useRef(0);

  const buttons = items.map((item) => (
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
    <View style={{ width, height }}>
      {/* The real card: pure RN, never touched by SwiftUI layout. Inert on
          iOS — the interaction layer above owns tap and hold. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {children}
      </View>

      <Host style={StyleSheet.absoluteFill}>
        <ContextMenu>
          <ContextMenu.Trigger>
            <Pressable
              onPressIn={() => (pressStart.current = Date.now())}
              onPress={() => {
                if (Date.now() - pressStart.current < 250) onViewPapers();
              }}
              style={{ width, height }}
            />
          </ContextMenu.Trigger>
          {preview ? (
            <ContextMenu.Preview>
              {/* Exactly card-sized: iOS keeps the ORIGINAL visible under a
                  custom preview, so the duplicate must land precisely on it
                  to cover it completely — an oversized plate gets nudged by
                  the system to fit the menu and exposes the original's edge.
                  UIKit adds its own scale-up during the lift animation. */}
              <Group modifiers={[frame({ width, height })]}>{preview}</Group>
            </ContextMenu.Preview>
          ) : null}
          <ContextMenu.Items>
            <Section title={`${code} · ${sentenceCase(title)}`}>{buttons}</Section>
          </ContextMenu.Items>
        </ContextMenu>
      </Host>
    </View>
  );
}
