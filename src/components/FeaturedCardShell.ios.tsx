/**
 * FeaturedCardShell (iOS) — the real system context menu around a featured
 * carousel card, via the shared ContextMenuShell (@expo/ui SwiftUI).
 */
import React from 'react';
import { ContextMenuShell } from './ContextMenuShell';
import { useCourseMenuItems } from '../lib/useCourseMenu';

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
  const items = useCourseMenuItems(code, title, meta, { onViewPapers });
  return (
    <ContextMenuShell items={items} style={{ width, height }}>
      {children}
    </ContextMenuShell>
  );
}
