/**
 * CourseBandMenu (iOS) — the system context menu attached to a course
 * card's HEADER BAND only. The visible card is pure React Native (immune
 * to SwiftUI sizing races that caused uneven gaps and overlaps); this
 * transparent layer covers just the band, leaving the download button and
 * every paper row fully interactive. The lift shows a compact duplicate
 * of the card's header as the preview.
 */
import { Button, ContextMenu, Divider, Group, Host, Section } from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCourseMenuItems } from '../lib/useCourseMenu';
import { sentenceCase } from '../lib/format';
import { activeScheme, colors, fonts, themedStyleSheet, useThemeVersion, withAlpha } from '../theme';

/** Height of the band strip the menu listens on (matches CourseCard band). */
const BAND_H = 42;
/** Right inset so the band's download button stays tappable. */
const RIGHT_INSET = 64;

export function CourseBandMenu({
  code,
  title,
  meta,
  width,
}: {
  code: string;
  title: string;
  meta: string;
  width: number;
}) {
  useThemeVersion();
  const items = useCourseMenuItems(code, title, meta);
  const triggerW = Math.max(0, width - RIGHT_INSET);
  if (triggerW === 0) return null;

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
    <Host style={{ position: 'absolute', top: 0, left: 0, width: triggerW, height: BAND_H }}>
      <ContextMenu>
        <ContextMenu.Trigger>
          <View style={{ width: triggerW, height: BAND_H }} />
        </ContextMenu.Trigger>
        <ContextMenu.Preview>
          {/* frame pins the preview plate to this exact size — without it
              SwiftUI stretches the card into a giant empty slab. */}
          <Group modifiers={[frame({ width: Math.min(width, 330), height: 124 })]}>
            <View style={[styles.preview, { width: Math.min(width, 330), height: 124 }]}>
              <View style={styles.previewBand}>
                <Text style={styles.previewCode}>{code}</Text>
              </View>
              <View style={styles.previewBody}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {sentenceCase(title)}
                </Text>
                <Text style={styles.previewMeta} numberOfLines={1}>
                  {meta}
                </Text>
              </View>
            </View>
          </Group>
        </ContextMenu.Preview>
        <ContextMenu.Items>
          <Section title={`${code} · ${sentenceCase(title)}`}>{buttons}</Section>
        </ContextMenu.Items>
      </ContextMenu>
    </Host>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    preview: {
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
    },
    previewBand: {
      paddingHorizontal: 18,
      paddingVertical: 11,
      backgroundColor: withAlpha(colors.accent, activeScheme() === 'light' ? 0.1 : 0.14),
    },
    previewCode: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 1, color: colors.accent },
    previewBody: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 16 },
    previewTitle: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 25, color: colors.text },
    previewMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 6 },
  });
const styles = themedStyleSheet(makeStyles);
