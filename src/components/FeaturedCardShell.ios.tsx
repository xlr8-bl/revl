/**
 * FeaturedCardShell (iOS) — wraps a featured card in the REAL system
 * context menu: @expo/ui's SwiftUI ContextMenu (UIKit's own long-press
 * interaction — the card lifts, the rest of the screen gets Apple's blur,
 * and a native menu drops in). Items are true SwiftUI buttons with SF
 * Symbols; the download row reflects live paper state.
 */
import { Button, ContextMenu, Host } from '@expo/ui/swift-ui';
import { useRouter } from 'expo-router';
import React from 'react';
import { Share } from 'react-native';
import { papers } from '../data/papers';
import { downloadCourse, usePaperDownloads } from '../lib/courseDownloads';
import { sentenceCase } from '../lib/format';

export function FeaturedCardShell({
  width,
  height,
  code,
  title,
  meta,
  onViewPapers,
  children,
}: {
  width: number;
  height: number;
  code: string;
  title: string;
  meta: string;
  onViewPapers: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const paperStates = usePaperDownloads();
  const coursePapers = papers.filter((p) => p.courseCode === code);
  const doneCount = coursePapers.filter((p) => paperStates[p.id]?.status === 'done').length;
  const inFlight = coursePapers.some((p) => paperStates[p.id]?.status === 'downloading');
  const allDone = coursePapers.length > 0 && doneCount === coursePapers.length;

  const share = async () => {
    try {
      await Share.share({
        message: `${code} · ${sentenceCase(title)} — past papers with verified answers on Revl. ${meta}.`,
      });
    } catch {}
  };

  return (
    <Host style={{ width, height }}>
      <ContextMenu>
        <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
        <ContextMenu.Items>
          <Button label="View papers" systemImage="doc.text" onPress={onViewPapers} />
          {allDone ? (
            <Button
              label="Downloaded — view"
              systemImage="arrow.down.circle.fill"
              onPress={() => router.push('/downloads' as never)}
            />
          ) : inFlight ? (
            <Button label="Downloading…" systemImage="arrow.down.circle" onPress={() => {}} />
          ) : (
            <Button
              label={doneCount > 0 ? `Download remaining (${coursePapers.length - doneCount})` : 'Download all papers'}
              systemImage="arrow.down.circle"
              onPress={() => downloadCourse(code)}
            />
          )}
          <Button label="Share course" systemImage="square.and.arrow.up" onPress={share} />
        </ContextMenu.Items>
      </ContextMenu>
    </Host>
  );
}
