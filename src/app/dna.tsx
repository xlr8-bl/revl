/**
 * Study DNA — the constellation. Every topic the student has touched is
 * a star on a dark sky: bright = mastered, dim = weak, ringed = false
 * confidence. Prerequisite edges draw faint lines between related
 * stars. All of it is derived live from the local RevealLog tallies.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import {
  falseConfidenceTopics,
  findNemesis,
  findQuestion,
  prerequisiteEdges,
  useRevealLogs,
  weakTopics,
} from '../lib/selectors';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../theme';

/** Deterministic star position from the tag name (stable across renders). */
function starPosition(tag: string, width: number, height: number) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  const pad = 44;
  const x = pad + (h % 1000) / 1000 * (width - pad * 2);
  const y = pad + ((h >> 10) % 1000) / 1000 * (height - pad * 2);
  return { x, y };
}

export default function StudyDnaScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const logs = useRevealLogs();

  const stats = weakTopics(logs);
  const falseConf = falseConfidenceTopics(logs);
  const nemesis = findNemesis(logs);
  const edges = prerequisiteEdges(logs);

  const skyW = Math.max(200, width - spacing.gutter * 2);
  const skyH = 320;
  const positions = new Map(stats.map((s) => [s.tag, starPosition(s.tag, skyW, skyH)]));
  const nemesisQ = nemesis ? findQuestion(nemesis.questionId) : null;

  // Depth without a 3D engine: two SVG layers (a far starfield, the near
  // constellation) drift at different rates on a single looping shared
  // value. The transform runs on the UI thread, so it stays smooth on
  // entry-level Android — no OpenGL/WebGL, no per-frame JS. (See
  // docs/STUDY_DNA_3D.md for why Three.js was rejected for these devices.)
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [drift]);
  const nearStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-9, 9]) },
      { translateY: interpolate(drift.value, [0, 1], [5, -5]) },
    ],
  }));
  const farStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [3, -3]) },
      { translateY: interpolate(drift.value, [0, 1], [-1.5, 1.5]) },
    ],
  }));

  // Faint background starfield — deterministic, oversized so the drift
  // never uncovers an empty corner. Pure decoration, no data.
  const backdrop = useMemo(() => {
    return Array.from({ length: 46 }, (_, i) => {
      let h = ((i + 1) * 2654435761) >>> 0;
      const x = (h % 1000) / 1000 * (skyW + 40);
      const y = ((h >> 10) % 1000) / 1000 * (skyH + 40);
      const r = 0.6 + ((h >> 20) % 100) / 100 * 1.1;
      const o = 0.05 + ((h >> 5) % 100) / 100 * 0.13;
      return { x, y, r, o };
    });
  }, [skyW, skyH]);

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Study DNA</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <Text style={styles.subtitle}>
          Your course as a star map — bright stars are mastered, dim ones need work. It drifts
          gently so the sky feels alive.
        </Text>

        {/* Constellation — two drifting layers for depth (see note above) */}
        <View style={styles.sky}>
          <View style={{ width: skyW, height: skyH }}>
            {/* Far starfield — drifts slowly behind the constellation */}
            <Animated.View style={[StyleSheet.absoluteFill, farStyle]} pointerEvents="none">
              <Svg width={skyW + 40} height={skyH + 40} style={{ marginLeft: -20, marginTop: -20 }}>
                {backdrop.map((d, i) => (
                  <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={`rgba(255,255,255,${d.o.toFixed(2)})`} />
                ))}
              </Svg>
            </Animated.View>

            {/* Near constellation — stars + edges together so they always align */}
            <Animated.View entering={FadeIn.duration(650)} style={[StyleSheet.absoluteFill, nearStyle]}>
              <Svg width={skyW} height={skyH}>
                {/* Prerequisite edges — faint lines between related stars */}
                {edges.map((e) => {
                  const a = positions.get(e.from);
                  const b = positions.get(e.to);
                  if (!a || !b) return null;
                  return (
                    <Line
                      key={`${e.from}-${e.to}`}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="rgba(94,107,255,0.25)"
                      strokeWidth={1}
                      strokeDasharray="3 4"
                    />
                  );
                })}
                {stats.map((s) => {
                  const p = positions.get(s.tag)!;
                  const r = 5 + Math.min(6, s.seen * 1.2);
                  const brightness = 1 - s.weakness; // mastered → bright
                  const fill = `rgba(255,255,255,${(0.2 + brightness * 0.8).toFixed(2)})`;
                  return (
                    <React.Fragment key={s.tag}>
                      {/* glow for mastered stars */}
                      {brightness > 0.6 && <Circle cx={p.x} cy={p.y} r={r + 6} fill="rgba(255,255,255,0.08)" />}
                      {/* accent ring = false confidence lives here */}
                      {s.falseConfidence > 0 && (
                        <Circle cx={p.x} cy={p.y} r={r + 4} stroke={colors.accent} strokeWidth={1.5} fill="none" />
                      )}
                      <Circle cx={p.x} cy={p.y} r={r} fill={fill} />
                      <SvgText
                        x={p.x}
                        y={p.y + r + 15}
                        fontSize={10}
                        fill={s.weakness > 0.5 ? colors.textSecondary : colors.textTertiary}
                        textAnchor="middle">
                        {s.tag}
                      </SvgText>
                    </React.Fragment>
                  );
                })}
              </Svg>
            </Animated.View>
          </View>
          <View style={styles.legend}>
            <LegendDot color="rgba(255,255,255,0.95)" label="mastered" />
            <LegendDot color="rgba(255,255,255,0.3)" label="weak" />
            <LegendDot color={colors.accent} label="false confidence" ring />
          </View>
        </View>

        {/* False confidence — the highest-value pre-exam insight */}
        {falseConf.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Topics you think you know</Text>
            <Text style={styles.sectionSub}>
              You said “Yes, I could answer this” — then tapped “Not yet”. Fix these first.
            </Text>
            {falseConf.map((s) => (
              <View key={s.tag} style={styles.fcRow}>
                <Ionicons name="alert-circle" size={17} color={colors.accent} />
                <Text style={styles.fcTag}>{s.tag}</Text>
                <Text style={styles.fcCount}>
                  {s.falseConfidence}× overconfident
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Nemesis */}
        {nemesis && nemesisQ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your nemesis</Text>
            <Pressable onPress={() => router.push(`/paper/${nemesisQ.paperId}`)} style={styles.nemesisCard}>
              <View style={styles.nemesisHeader}>
                <Ionicons name="skull-outline" size={18} color={colors.danger} />
                <Text style={styles.nemesisTitle}>
                  {nemesis.courseCode} · Q{nemesisQ.question.number}
                </Text>
                <Text style={styles.nemesisCount}>{nemesis.notYet}× not yet</Text>
              </View>
              <Text style={styles.nemesisExcerpt} numberOfLines={2}>
                {nemesisQ.question.text.replace(/[$*`]/g, '')}
              </Text>
              <Text style={styles.nemesisCta}>
                {nemesis.beaten ? 'Beaten — keep it down ✓' : 'It resurfaces until you beat it →'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Prerequisite trace */}
        {edges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where it traces back</Text>
            {edges.slice(0, 4).map((e) => (
              <View key={`${e.from}-${e.to}`} style={styles.edgeRow}>
                <Text style={styles.edgeText}>
                  Your <Text style={styles.edgeStrong}>{e.from}</Text> misses trace back to{' '}
                  <Text style={styles.edgeStrong}>{e.to}</Text> — revise that first.
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function LegendDot({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          ring ? { borderWidth: 1.5, borderColor: color, backgroundColor: 'transparent' } : { backgroundColor: color },
        ]}
      />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  backBtn: { width: 40, alignItems: 'center' },
  topTitle: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    paddingHorizontal: spacing.gutter,
    marginTop: 8,
  },
  sky: {
    marginHorizontal: spacing.gutter,
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: colors.bgDeep,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  legend: { flexDirection: 'row', gap: 16, padding: 14, paddingTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  section: { marginTop: 32, paddingHorizontal: spacing.gutter },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 21, color: colors.text },
  sectionSub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textSecondary, marginTop: 5, marginBottom: 8 },
  fcRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  fcTag: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  fcCount: { fontFamily: fonts.regular, fontSize: 13, color: colors.accent },
  nemesisCard: { backgroundColor: colors.card, borderRadius: 18, padding: 16, marginTop: 12 },
  nemesisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nemesisTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  nemesisCount: { fontFamily: fonts.regular, fontSize: 12, color: colors.danger },
  nemesisExcerpt: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 10 },
  nemesisCta: { fontFamily: fonts.medium, fontSize: 13, color: colors.accent, marginTop: 12 },
  edgeRow: { paddingVertical: 8 },
  edgeText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  edgeStrong: { fontFamily: fonts.medium, color: colors.text },
});
const styles = themedStyleSheet(makeStyles);
