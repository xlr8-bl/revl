/**
 * FeaturedCardShell (iOS) — the real system context menu around a featured
 * carousel card, via the shared ContextMenuShell (@expo/ui SwiftUI).
 *
 * The shell attaches one frame AFTER the card first paints: mounting the
 * SwiftUI Host together with an unmeasured RN child let SwiftUI propose a
 * smaller height and squash the card (the intermittent shrink glitch).
 * Bare card first, menu wrap second — the card can never render squashed.
 */
import React, { useEffect, useState } from 'react';
import { InteractionManager, View } from 'react-native';
import { ContextMenuShell } from './ContextMenuShell';
import { useCourseMenuItems } from '../lib/useCourseMenu';
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
  const items = useCourseMenuItems(code, title, meta, { onViewPapers });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => task.cancel();
  }, []);

  if (!ready) return <View style={{ width, height }}>{children}</View>;
  return (
    <ContextMenuShell items={items} header={`${code} · ${sentenceCase(title)}`} style={{ width, height }}>
      {children}
    </ContextMenuShell>
  );
}
