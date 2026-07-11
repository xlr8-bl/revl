/**
 * useCourseMenuItems — builds the context-menu actions for a course
 * (featured card or index card): optional View papers, a live-state
 * download row, and Share. Platform-agnostic (no @expo/ui imports), so
 * both the native iOS menu and the JS fallback can consume it.
 */
import { useRouter } from 'expo-router';
import { Share } from 'react-native';
import { papers } from '../data/papers';
import type { ShellMenuItem } from '../components/ContextMenuShell';
import { downloadCourse, usePaperDownloads } from './courseDownloads';
import { sentenceCase } from './format';

export function useCourseMenuItems(
  code: string,
  title: string,
  meta: string,
  opts?: { onViewPapers?: () => void }
): ShellMenuItem[] {
  const router = useRouter();
  const paperStates = usePaperDownloads();
  const coursePapers = papers.filter((p) => p.courseCode === code);
  const doneCount = coursePapers.filter((p) => paperStates[p.id]?.status === 'done').length;
  const inFlight = coursePapers.some((p) => paperStates[p.id]?.status === 'downloading');
  const allDone = coursePapers.length > 0 && doneCount === coursePapers.length;

  const items: ShellMenuItem[] = [];
  if (opts?.onViewPapers) items.push({ label: 'View papers', systemImage: 'doc.text', onPress: opts.onViewPapers });

  if (allDone) {
    items.push({
      label: 'Downloaded',
      systemImage: 'arrow.down.circle.fill',
      onPress: () => router.push('/downloads' as never),
    });
  } else if (inFlight) {
    items.push({ label: 'Downloading…', systemImage: 'arrow.down.circle', onPress: () => {} });
  } else if (coursePapers.length > 0) {
    items.push({
      label: doneCount > 0 ? `Download ${coursePapers.length - doneCount} more` : 'Download all',
      systemImage: 'arrow.down.circle',
      onPress: () => downloadCourse(code),
    });
  }

  items.push({
    label: 'Share course',
    systemImage: 'square.and.arrow.up',
    onPress: async () => {
      try {
        await Share.share({
          message: `${code} · ${sentenceCase(title)} — past papers with verified answers on Revl. ${meta}.`,
        });
      } catch {}
    },
  });
  return items;
}
