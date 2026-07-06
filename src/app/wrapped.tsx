/**
 * Revl Wrapped — Spotify-Wrapped-style end-of-semester recap.
 *
 * Time-gated: hidden all semester; this route shows a locked state
 * outside the window (see lib/wrappedGate). When live: full-screen
 * swipeable cards read from the Study DNA table (mocked in
 * data/wrapped.ts for now), each exportable as a branded share image
 * via react-native-view-shot + expo-sharing.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import { wrappedStats } from '../data/wrapped';
import { daysUntilWrapped, isWrappedLive } from '../lib/wrappedGate';
import { colors, fonts } from '../theme';

type CardSpec = {
  id: string;
  gradient: [string, string];
  label: string;
  render: () => React.ReactNode;
};

const s = wrappedStats;

/** The swipeable card deck. Every card is share-exportable. */
const CARDS: CardSpec[] = [
  {
    id: 'conquered',
    gradient: ['#1E3A8A', '#0B1026'],
    label: 'THE NUMBERS',
    render: () => (
      <>
        <Text style={styles.bigNumber}>{s.questionsRevealed}</Text>
        <Text style={styles.cardTitle}>questions revealed</Text>
        <Text style={styles.cardBody}>
          across {s.papersConquered} past papers conquered this semester.
        </Text>
      </>
    ),
  },
  {
    id: 'nemesis',
    gradient: ['#5A1626', '#160408'],
    label: 'YOUR NEMESIS',
    render: () => (
      <>
        <Ionicons name="skull-outline" size={54} color="#FF8FA3" />
        <Text style={styles.cardTitle}>
          {s.nemesis.courseCode} · Q{s.nemesis.questionNumber}
        </Text>
        <Text style={styles.cardSerif}>“{s.nemesis.excerpt}”</Text>
        <Text style={styles.cardBody}>
          It took you down {s.nemesis.notYetCount} times.{' '}
          {s.nemesis.beaten ? 'Then you beat it. ⚔️' : 'It still stands. Next semester.'}
        </Text>
      </>
    ),
  },
  {
    id: 'turnaround',
    gradient: ['#173F2E', '#04120B'],
    label: 'THE TURNAROUND',
    render: () => (
      <>
        <Text style={styles.cardSerif}>{s.turnaround.topic}</Text>
        <Text style={styles.cardBody}>
          Your weakest topic in September — {Math.round(s.turnaround.septemberWeakness * 100)}% miss rate.
        </Text>
        <Ionicons name="arrow-down" size={30} color="#7CE3AE" style={{ marginVertical: 12 }} />
        <Text style={styles.cardTitle}>{Math.round(s.turnaround.nowWeakness * 100)}% now</Text>
      </>
    ),
  },
  {
    id: 'prereq',
    gradient: ['#33245C', '#0D0820'],
    label: 'THE PLOT TWIST',
    render: () => (
      <>
        <Text style={styles.cardBody}>
          Your <Text style={styles.cardStrong}>{s.prerequisiteStory.struggled}</Text> struggle was never about{' '}
          {s.prerequisiteStory.struggled}.
        </Text>
        <Text style={styles.cardSerif}>It traced back to {s.prerequisiteStory.tracedTo}.</Text>
        <Text style={styles.cardBody}>
          When that clicked in week {s.prerequisiteStory.clickedWeek},{' '}
          {s.prerequisiteStory.unlockedTopics.length} topics above it lit up.
        </Text>
      </>
    ),
  },
  {
    id: 'hours',
    gradient: ['#4A3413', '#140D03'],
    label: 'THE GRIND',
    render: () => (
      <>
        <Text style={styles.bigNumber}>{s.hoursStudied}h</Text>
        <Text style={styles.cardTitle}>of focused revision</Text>
        <Text style={styles.cardBody}>Most alive at {s.mostActiveHour}. Night owl confirmed. 🌙</Text>
      </>
    ),
  },
  {
    id: 'falseconf',
    gradient: ['#134A44', '#031412'],
    label: 'THE REALITY CHECK',
    render: () => (
      <>
        <Text style={styles.cardBody}>Times you said “I know this” — and didn’t:</Text>
        <Text style={styles.bigNumber}>
          {s.falseConfidenceStart} → {s.falseConfidenceEnd}
        </Text>
        <Text style={styles.cardBody}>False confidence, mostly gone. That’s the real win.</Text>
      </>
    ),
  },
  ...(s.predictedAccuracy != null
    ? [
        {
          id: 'predicted',
          gradient: ['#3D1D4E', '#100517'] as [string, string],
          label: 'THE CRYSTAL BALL',
          render: () => (
            <>
              <Text style={styles.bigNumber}>{Math.round((s.predictedAccuracy ?? 0) * 100)}%</Text>
              <Text style={styles.cardTitle}>prediction accuracy</Text>
              <Text style={styles.cardBody}>of predicted questions actually appeared in your exams.</Text>
            </>
          ),
        } satisfies CardSpec,
      ]
    : []),
];

export default function WrappedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const shotRefs = useRef<Record<string, React.ComponentRef<typeof ViewShot> | null>>({});

  /** Export the current card as a branded image and open the share sheet. */
  const shareCard = async (id: string) => {
    try {
      const shot = shotRefs.current[id];
      const uri = await shot?.capture?.();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri.startsWith('file') ? uri : `file://${uri}`, {
          mimeType: 'image/png',
          dialogTitle: 'Share your Revl Wrapped',
        });
      }
    } catch {
      // Sharing unavailable (e.g. simulator/web) — silently ignore in the shell.
    }
  };

  // ---- Locked state outside the end-of-semester window ----
  if (!isWrappedLive()) {
    return (
      <View style={[styles.root, styles.lockedWrap]}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.textSecondary} />
        <Text style={styles.lockedTitle}>Wrapped isn’t ready yet</Text>
        <Text style={styles.lockedBody}>
          Your semester recap unlocks at the end of term — {daysUntilWrapped()} days to go. Keep revising; it’s all
          being counted.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.lockedBtn}>
          <Text style={styles.lockedBtnText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={CARDS}
        keyExtractor={(c) => c.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, height }}>
            <ViewShot
              ref={(r) => {
                shotRefs.current[item.id] = r;
              }}
              options={{ format: 'png', quality: 1 }}
              style={styles.card}>
              <LinearGradient colors={item.gradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
              <Text style={styles.cardLabel}>{item.label}</Text>
              <View style={styles.cardCenter}>{item.render()}</View>
              <Text style={styles.brand}>revl · semester wrapped</Text>
            </ViewShot>

            <Pressable onPress={() => shareCard(item.id)} style={[styles.shareBtn, { bottom: insets.bottom + 28 }]}>
              <Ionicons name="share-outline" size={17} color="#111" />
              <Text style={styles.shareText}>Share</Text>
            </Pressable>
          </View>
        )}
      />

      {/* Page dots + close */}
      <View style={[styles.dots, { top: insets.top + 14 }]}>
        {CARDS.map((c, i) => (
          <View key={c.id} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>
      <Pressable onPress={() => router.back()} style={[styles.closeBtn, { top: insets.top + 8 }]} hitSlop={10}>
        <Ionicons name="close" size={24} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  card: { flex: 1, paddingHorizontal: 36, paddingVertical: 110, justifyContent: 'space-between' },
  cardLabel: { fontFamily: fonts.medium, fontSize: 12, letterSpacing: 2, color: 'rgba(255,255,255,0.65)' },
  cardCenter: { gap: 14, alignItems: 'flex-start' },
  bigNumber: { fontFamily: fonts.bold, fontSize: 76, color: colors.text, letterSpacing: -1 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 26, color: colors.text },
  cardSerif: { fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 26, lineHeight: 36, color: colors.text },
  cardBody: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: 'rgba(255,255,255,0.8)' },
  cardStrong: { fontFamily: fonts.bold, color: colors.text },
  brand: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  shareBtn: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  shareText: { fontFamily: fonts.medium, fontSize: 15, color: '#111111' },
  dots: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: '#FFFFFF' },
  closeBtn: { position: 'absolute', right: 18 },
  lockedWrap: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14 },
  lockedTitle: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  lockedBody: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, textAlign: 'center' },
  lockedBtn: { backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 26, paddingVertical: 12, marginTop: 10 },
  lockedBtnText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
});
