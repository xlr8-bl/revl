/**
 * Revl Wrapped — the end-of-semester recap, choreographed.
 *
 * Everything animates on the GPU thread via Reanimated 4:
 *  - 3D cube page transitions: each card rotates in perspective as you
 *    swipe, driven directly by scroll position.
 *  - A three-layer parallax starfield that drifts with your finger
 *    (deeper layers move slower) and twinkles on its own clock.
 *  - Per-letter staggered display type on the intro.
 *  - Live count-up numerals (tabular figures, no layout shift).
 *  - SVG progress arcs that draw themselves when their card arrives.
 *  - A nemesis card that glitch-shakes until it tells you how it ended.
 *
 * Cards replay their entrance each time they become active (remount by
 * key). All data still comes from data/wrapped.ts; the real version
 * derives it from the RevealLog table. Share export stays ViewShot.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { wrappedStats } from '../data/wrapped';
import { daysUntilWrapped, isWrappedLive } from '../lib/wrappedGate';
import { colors, fonts } from '../theme';

const s = wrappedStats;
const AnimatedText = Animated.createAnimatedComponent(TextInput);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

/** Number that counts up when its card becomes active. Tabular figures. */
function CountUp({ to, suffix = '', duration = 1500, delay = 350, style }: { to: number; suffix?: string; duration?: number; delay?: number; style?: object }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withTiming(to, { duration, easing: Easing.out(Easing.cubic) }));
  }, [to, delay, duration, v]);
  const props = useAnimatedProps(() => ({ text: `${Math.round(v.value)}${suffix}` }) as never);
  return (
    <AnimatedText
      editable={false}
      defaultValue={`0${suffix}`}
      animatedProps={props}
      style={[styles.bigNumber, { fontVariant: ['tabular-nums'] }, style]}
    />
  );
}

/** Display title revealed letter by letter, springing up from below. */
function LetterReveal({ text, delay = 0, style }: { text: string; delay?: number; style?: object }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {[...text].map((ch, i) => (
        <Animated.Text
          key={`${i}-${ch}`}
          entering={FadeInUp.delay(delay + i * 55)
            .springify()
            .damping(13)
            .mass(0.7)}
          style={[styles.displayTitle, style]}>
          {ch === ' ' ? ' ' : ch}
        </Animated.Text>
      ))}
    </View>
  );
}

/** SVG arc that draws itself from 0 to `pct` on mount. */
function Arc({ pct, color, size = 150 }: { pct: number; color: string; size?: number }) {
  const r = size / 2 - 10;
  const circumference = 2 * Math.PI * r;
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(500, withTiming(pct, { duration: 1600, easing: Easing.out(Easing.cubic) }));
  }, [pct, v]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - v.value) }));
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.12)" strokeWidth={7} fill="none" />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={7}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        animatedProps={props}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

/** Deterministic pseudo-random in [0,1) from a seed. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Parallax starfield: three depth layers. Each layer tracks the swipe
 * (deeper = slower, so the sky has real depth) and breathes on its own
 * twinkle clock.
 */
function Starfield({ scrollX, pages }: { scrollX: SharedValue<number>; pages: number }) {
  const { width, height } = useWindowDimensions();
  const twinkle = useSharedValue(0.5);
  useEffect(() => {
    twinkle.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [twinkle]);

  const layers = useMemo(
    () =>
      [0.12, 0.28, 0.5].map((depth, li) => ({
        depth,
        stars: Array.from({ length: 26 }, (_, i) => ({
          x: rand(li * 100 + i) * width * (1 + depth * pages),
          y: rand(li * 100 + i + 57) * height,
          r: 0.8 + rand(li * 100 + i + 91) * (1.2 + depth * 2.2),
          bright: 0.25 + rand(li * 100 + i + 13) * 0.6,
        })),
      })),
    [width, height, pages]
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {layers.map((layer, li) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const style = useAnimatedStyle(() => ({
          transform: [{ translateX: -scrollX.value * layer.depth }],
          opacity: interpolate(twinkle.value, [0, 1], [0.55 + li * 0.1, 1]),
        }));
        return (
          <Animated.View key={li} style={[StyleSheet.absoluteFill, style]}>
            <Svg width={width * (1 + layer.depth * pages)} height={height}>
              {layer.stars.map((st, i) => (
                <Circle key={i} cx={st.x} cy={st.y} r={st.r} fill={`rgba(245,244,240,${st.bright})`} />
              ))}
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
}

/** Amber comet that sweeps the intro card. */
function Comet() {
  const { width } = useWindowDimensions();
  const t = useSharedValue(-0.3);
  useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 2400, easing: Easing.inOut(Easing.cubic) }),
        withDelay(2600, withTiming(-0.3, { duration: 0 }))
      ),
      -1,
      false
    );
  }, [t]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: t.value * width },
      { translateY: t.value * -90 },
      { rotate: '-8deg' },
    ],
    opacity: interpolate(t.value, [-0.3, 0.1, 0.9, 1.3], [0, 1, 1, 0]),
  }));
  return <Animated.View pointerEvents="none" style={[styles.comet, style]} />;
}

/** Glitch-shaking block for the nemesis question number. */
function Glitch({ children }: { children: React.ReactNode }) {
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withDelay(1400, withTiming(3, { duration: 40 })),
        withTiming(-3, { duration: 40 }),
        withTiming(2, { duration: 40 }),
        withTiming(0, { duration: 60 })
      ),
      -1,
      false
    );
  }, [x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** 3D cube face: rotates in perspective as the deck scrolls under it. */
function CubePage({ index, scrollX, width, children }: { index: number; scrollX: SharedValue<number>; width: number; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => {
    const pos = (scrollX.value - index * width) / width; // -1 … 1 through the viewport
    return {
      transform: [
        { perspective: 1200 },
        { translateX: pos * width * 0.08 },
        { rotateY: `${pos * -38}deg` },
        { scale: interpolate(Math.abs(pos), [0, 1], [1, 0.82], 'clamp') },
      ],
      opacity: interpolate(Math.abs(pos), [0, 0.85, 1], [1, 0.45, 0.2], 'clamp'),
    };
  });
  return <Animated.View style={[{ width, flex: 1 }, style]}>{children}</Animated.View>;
}

/* ------------------------------------------------------------------ */
/* The deck                                                            */
/* ------------------------------------------------------------------ */

type Card = { id: string; bg: string; hue: string; render: (active: boolean) => React.ReactNode };

const CARDS: Card[] = [
  {
    id: 'intro',
    bg: '#0B0B10',
    hue: colors.accent,
    render: () => (
      <>
        <Comet />
        <View style={styles.centerBlock}>
          <Animated.Text entering={FadeIn.duration(700)} style={styles.eyebrow}>
            Semester one · 2025/26
          </Animated.Text>
          <LetterReveal text="Your" delay={250} />
          <LetterReveal text="semester," delay={550} />
          <LetterReveal text="wrapped." delay={900} style={{ color: colors.accent }} />
          <Animated.Text entering={FadeInUp.delay(1750).springify()} style={styles.introHint}>
            Swipe. It's all been counted.
          </Animated.Text>
        </View>
      </>
    ),
  },
  {
    id: 'numbers',
    bg: '#0B1026',
    hue: '#7EA8FF',
    render: () => (
      <View style={styles.centerBlock}>
        <Animated.Text entering={FadeInDown.delay(150)} style={styles.eyebrow}>
          The volume
        </Animated.Text>
        <CountUp to={s.questionsRevealed} />
        <Animated.Text entering={FadeInUp.delay(900).springify()} style={styles.cardTitle}>
          questions revealed
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(1200).springify()} style={styles.cardBody}>
          across <Text style={styles.strong}>{s.papersConquered} past papers</Text> conquered this semester.
        </Animated.Text>
      </View>
    ),
  },
  {
    id: 'nemesis',
    bg: '#160408',
    hue: '#FF8FA3',
    render: () => (
      <View style={styles.centerBlock}>
        <Animated.Text entering={FadeInDown.delay(150)} style={styles.eyebrow}>
          Your nemesis
        </Animated.Text>
        <Glitch>
          <Animated.Text entering={FadeInUp.delay(350).springify().damping(9)} style={[styles.hugeMark, { color: '#FF8FA3' }]}>
            Q{s.nemesis.questionNumber}
          </Animated.Text>
        </Glitch>
        <Animated.Text entering={FadeInUp.delay(800).springify()} style={styles.serifQuote}>
          "{s.nemesis.excerpt}"
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(1250).springify()} style={styles.cardBody}>
          {s.nemesis.courseCode}. It took you down <Text style={styles.strong}>{s.nemesis.notYetCount} times</Text>.
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(1900).springify()} style={[styles.cardTitle, { color: '#FF8FA3' }]}>
          {s.nemesis.beaten ? 'Then you beat it.' : 'It still stands.'}
        </Animated.Text>
      </View>
    ),
  },
  {
    id: 'turnaround',
    bg: '#04120B',
    hue: '#7CE3AE',
    render: () => (
      <View style={styles.centerBlock}>
        <Animated.Text entering={FadeInDown.delay(150)} style={styles.eyebrow}>
          The turnaround
        </Animated.Text>
        <Animated.View entering={FadeIn.delay(400)} style={styles.arcWrap}>
          <Arc pct={1 - s.turnaround.nowWeakness} color="#7CE3AE" />
          <View style={styles.arcCenter}>
            <CountUp to={Math.round((1 - s.turnaround.nowWeakness) * 100)} suffix="%" duration={1600} delay={600} style={styles.arcNumber} />
            <Text style={styles.arcLabel}>mastered</Text>
          </View>
        </Animated.View>
        <Animated.Text entering={FadeInUp.delay(1100).springify()} style={styles.serifQuote}>
          {s.turnaround.topic}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(1400).springify()} style={styles.cardBody}>
          Your weakest topic in September: a {Math.round(s.turnaround.septemberWeakness * 100)}% miss rate. Look at it
          now.
        </Animated.Text>
      </View>
    ),
  },
  {
    id: 'prereq',
    bg: '#0D0820',
    hue: colors.ai,
    render: () => (
      <View style={styles.centerBlock}>
        <Animated.Text entering={FadeInDown.delay(150)} style={styles.eyebrow}>
          The plot twist
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(400).springify()} style={styles.cardBody}>
          Your <Text style={styles.strong}>{s.prerequisiteStory.struggled}</Text> struggle was never about{' '}
          {s.prerequisiteStory.struggled}.
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(1000).springify()} style={[styles.serifQuote, { color: colors.ai }]}>
          It traced back to {s.prerequisiteStory.tracedTo}.
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(1700).springify()} style={styles.cardBody}>
          When that clicked in week {s.prerequisiteStory.clickedWeek},{' '}
          <Text style={styles.strong}>{s.prerequisiteStory.unlockedTopics.length} topics above it</Text> lit up at
          once.
        </Animated.Text>
      </View>
    ),
  },
  {
    id: 'grind',
    bg: '#140D03',
    hue: colors.accent,
    render: () => (
      <View style={styles.centerBlock}>
        <Animated.Text entering={FadeInDown.delay(150)} style={styles.eyebrow}>
          The grind
        </Animated.Text>
        <CountUp to={s.hoursStudied} suffix="h" />
        <Animated.Text entering={FadeInUp.delay(900).springify()} style={styles.cardTitle}>
          of focused revision
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(1200).springify()} style={styles.cardBody}>
          Most alive at <Text style={styles.strong}>{s.mostActiveHour}</Text>. Night student, certified.
        </Animated.Text>
      </View>
    ),
  },
  {
    id: 'honesty',
    bg: '#031412',
    hue: '#5EEAD4',
    render: () => (
      <View style={styles.centerBlock}>
        <Animated.Text entering={FadeInDown.delay(150)} style={styles.eyebrow}>
          The reality check
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(350).springify()} style={styles.cardBody}>
          Times you said "I know this" and didn't:
        </Animated.Text>
        <View style={styles.honestyRow}>
          <Animated.Text entering={FadeInUp.delay(700).springify().damping(9)} style={[styles.hugeMark, styles.struck]}>
            {s.falseConfidenceStart}
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(1200)} style={styles.honestyArrow}>
            →
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(1500).springify().damping(9)} style={[styles.hugeMark, { color: '#5EEAD4' }]}>
            {s.falseConfidenceEnd}
          </Animated.Text>
        </View>
        <Animated.Text entering={FadeInUp.delay(2000).springify()} style={styles.cardBody}>
          False confidence, almost gone. That's the real win.
        </Animated.Text>
      </View>
    ),
  },
  {
    id: 'outro',
    bg: '#0B0B10',
    hue: colors.accent,
    render: () => (
      <View style={styles.centerBlock}>
        <Animated.Text entering={FadeInDown.delay(150)} style={styles.eyebrow}>
          Signed and dated
        </Animated.Text>
        <LetterReveal text="See you in" delay={300} style={styles.outroTitle} />
        <LetterReveal text="semester two." delay={800} style={[styles.outroTitle, { color: colors.accent }]} />
        <Animated.Text entering={FadeInUp.delay(1800).springify()} style={styles.cardBody}>
          Share a card. Make your classmates sweat.
        </Animated.Text>
      </View>
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function WrappedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scrollX = useSharedValue(0);
  const shotRefs = useRef<Record<string, React.ComponentRef<typeof ViewShot> | null>>({});

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const shareCard = async (id: string) => {
    try {
      const uri = await shotRefs.current[id]?.capture?.();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri.startsWith('file') ? uri : `file://${uri}`, {
          mimeType: 'image/png',
          dialogTitle: 'Share your Revl Wrapped',
        });
      }
    } catch {
      // Sharing unavailable (simulator/web); ignore in the shell.
    }
  };

  if (!isWrappedLive()) {
    return (
      <View style={[styles.root, styles.lockedWrap]}>
        <Text style={styles.lockedTitle}>Wrapped isn't ready yet</Text>
        <Text style={styles.lockedBody}>
          Your semester recap unlocks at the end of term, {daysUntilWrapped()} days from now. Keep revising; it's all
          being counted.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.lockedBtn}>
          <Text style={styles.lockedBtnText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  // Background crossfades between card hues as you swipe.
  const activeBg = CARDS[Math.min(page, CARDS.length - 1)].bg;

  return (
    <View style={[styles.root, { backgroundColor: activeBg }]}>
      <Starfield scrollX={scrollX} pages={CARDS.length} />

      <Animated.FlatList
        data={CARDS}
        keyExtractor={(c) => c.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index }) => (
          <CubePage index={index} scrollX={scrollX} width={width}>
            <ViewShot
              ref={(r) => {
                shotRefs.current[item.id] = r;
              }}
              options={{ format: 'png', quality: 1 }}
              style={[styles.card, { height, backgroundColor: item.bg }]}>
              {/* Remount on activation so the choreography replays. */}
              <View key={page === index ? `${item.id}-live` : item.id} style={{ flex: 1 }}>
                {item.render(page === index)}
              </View>
              <Text style={styles.brand}>revl · semester wrapped</Text>
            </ViewShot>
          </CubePage>
        )}
      />

      {/* Progress ticks, the Revl mark */}
      <View style={[styles.ticks, { top: insets.top + 16 }]}>
        {CARDS.map((c, i) => (
          <View key={c.id} style={[styles.tick, i === page && { backgroundColor: CARDS[page].hue, width: 22 }]} />
        ))}
      </View>

      <Pressable onPress={() => router.back()} style={[styles.closeBtn, { top: insets.top + 8 }]} hitSlop={10}>
        <Ionicons name="close" size={24} color={colors.text} />
      </Pressable>

      <Pressable
        onPress={() => shareCard(CARDS[page].id)}
        style={({ pressed }) => [styles.shareBtn, { bottom: insets.bottom + 26 }, pressed && { opacity: 0.85 }]}>
        <Text style={styles.shareText}>Share this card</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B10' },
  card: { flex: 1, paddingHorizontal: 34, paddingTop: 130, paddingBottom: 120, justifyContent: 'space-between' },
  centerBlock: { flex: 1, justifyContent: 'center', gap: 6 },
  eyebrow: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(245,244,240,0.55)', marginBottom: 18 },
  displayTitle: { fontFamily: fonts.serif, fontSize: 52, lineHeight: 60, color: colors.text },
  outroTitle: { fontFamily: fonts.serif, fontSize: 42, lineHeight: 50 },
  introHint: { fontFamily: fonts.regular, fontSize: 15, color: 'rgba(245,244,240,0.6)', marginTop: 26 },
  bigNumber: {
    fontFamily: fonts.bold,
    fontSize: 104,
    lineHeight: 110,
    color: colors.text,
    letterSpacing: -3,
    padding: 0,
  },
  hugeMark: { fontFamily: fonts.bold, fontSize: 88, lineHeight: 94, color: colors.text, letterSpacing: -2 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 25, color: colors.text, marginTop: 4 },
  cardBody: { fontFamily: fonts.regular, fontSize: 16.5, lineHeight: 25, color: 'rgba(245,244,240,0.78)', marginTop: 12 },
  serifQuote: { fontFamily: fonts.serif, fontSize: 25, lineHeight: 35, color: colors.text, marginTop: 14 },
  strong: { fontFamily: fonts.bold, color: colors.text },
  arcWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  arcCenter: { position: 'absolute', alignItems: 'center' },
  arcNumber: { fontFamily: fonts.bold, fontSize: 34, color: colors.text, padding: 0, textAlign: 'center' },
  arcLabel: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(245,244,240,0.55)' },
  honestyRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginVertical: 6 },
  struck: { color: 'rgba(245,244,240,0.4)', textDecorationLine: 'line-through' },
  honestyArrow: { fontFamily: fonts.regular, fontSize: 40, color: 'rgba(245,244,240,0.5)' },
  comet: {
    position: 'absolute',
    top: '30%',
    left: -80,
    width: 140,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  brand: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(245,244,240,0.45)' },
  ticks: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', gap: 6, alignItems: 'center' },
  tick: { width: 10, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.25)' },
  closeBtn: { position: 'absolute', right: 18 },
  shareBtn: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 26,
    paddingVertical: 13,
  },
  shareText: { fontFamily: fonts.medium, fontSize: 15, color: '#111111' },
  lockedWrap: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14 },
  lockedTitle: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  lockedBody: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, textAlign: 'center' },
  lockedBtn: { backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 26, paddingVertical: 12, marginTop: 10 },
  lockedBtnText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
});
