/**
 * Study DNA — rebuilt around ONE idea anyone gets at a glance:
 * calibration. Two strands per topic — what you FEEL you know, and what
 * you ACTUALLY know — on a shared 0→100% track. The distance between the
 * two markers is the gap. A big gap where feel is ahead of know is a blind
 * spot: the exam trap of "I was sure I knew that." Nothing here is a mock
 * or a black box — every number is counted from your reveal flow
 * (confidence before → got-it/not-yet after) in lib/selectors.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calibrationByTopic, findNemesis, findQuestion, useRevealLogs, type Calibration } from '../lib/selectors';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion, withAlpha } from '../theme';

/** Below this we don't have two honest strands to draw yet. */
const MIN_DATA = 4;
const BLIND = 0.15; // gap above which "feel" is dangerously ahead of "know"

type Band = { key: 'blindspot' | 'underrated' | 'solid' | 'weak'; label: string; color: string };
function bandFor(c: Calibration, colorsRef: typeof colors): Band {
  if (c.gap > BLIND) return { key: 'blindspot', label: 'Blind spot', color: colorsRef.danger };
  if (c.gap < -BLIND) return { key: 'underrated', label: 'Underrated', color: '#3E8E7E' };
  if (c.actual >= 0.6) return { key: 'solid', label: 'Solid', color: '#4C8DB8' };
  return { key: 'weak', label: 'Working on it', color: colorsRef.accent };
}

export default function StudyDnaScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logs = useRevealLogs();

  const cal = calibrationByTopic(logs).filter((c) => c.seen >= 1);
  const blindSpots = cal.filter((c) => c.gap > BLIND && c.seen >= 2);
  const nemesis = findNemesis(logs);
  const nemesisQ = nemesis ? findQuestion(nemesis.questionId) : null;

  const enough = logs.length >= MIN_DATA && cal.length > 0;

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
        <Text style={styles.lede}>
          Two strands: what you <Text style={styles.feelWord}>feel</Text> you know, and what you{' '}
          <Text style={styles.knowWord}>actually</Text> know. Where they pull apart is where exams
          catch you out.
        </Text>

        {!enough ? (
          <View style={styles.empty}>
            <View style={styles.emptyStrands}>
              <View style={[styles.emptyDot, styles.emptyFeel]} />
              <View style={styles.emptyLine} />
              <View style={[styles.emptyDot, styles.emptyKnow]} />
            </View>
            <Text style={styles.emptyText}>
              Attempt and reveal a few questions. As you say whether you could answer — then whether
              you actually got it — your two strands take shape here.
            </Text>
            <Pressable onPress={() => router.back()} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Start a session</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* The headline — the single most useful sentence on the page */}
            <View style={styles.headline}>
              {blindSpots.length > 0 ? (
                <>
                  <Text style={styles.headlineNum}>{blindSpots.length}</Text>
                  <Text style={styles.headlineText}>
                    blind {blindSpots.length === 1 ? 'spot' : 'spots'} — topics you feel ready for
                    but keep missing. Biggest:{' '}
                    <Text style={styles.headlineStrong}>{blindSpots[0].tag}</Text>.
                  </Text>
                </>
              ) : (
                <Text style={styles.headlineText}>
                  Your instincts match your marks — you're well calibrated. Keep the weak topics
                  warm.
                </Text>
              )}
            </View>

            {/* Legend for the two markers */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.mFeel, styles.legendMarker]} />
                <Text style={styles.legendText}>feel ready</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.mKnow, styles.legendMarker]} />
                <Text style={styles.legendText}>actually ready</Text>
              </View>
              <Text style={styles.legendHint}>sorted by biggest gap</Text>
            </View>

            {/* The strands — one calibration row per topic */}
            <View style={styles.list}>
              {cal.map((c) => (
                <StrandRow key={c.tag} c={c} />
              ))}
            </View>

            {/* One concrete thing to beat — the nemesis question */}
            {nemesis && nemesisQ && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>The one to beat</Text>
                <Pressable
                  onPress={() => router.push(`/paper/${nemesisQ.paperId}?q=${nemesis.questionId}`)}
                  style={({ pressed }) => [styles.nemesisCard, pressed && { opacity: 0.85 }]}>
                  <View style={styles.nemesisHeader}>
                    <Text style={styles.nemesisTitle}>
                      {nemesis.courseCode} · Q{nemesisQ.question.number}
                    </Text>
                    <Text style={styles.nemesisCount}>{nemesis.notYet}× not yet</Text>
                  </View>
                  <Text style={styles.nemesisExcerpt} numberOfLines={2}>
                    {nemesisQ.question.text.replace(/[$*`]/g, '')}
                  </Text>
                  <Text style={styles.nemesisCta}>
                    {nemesis.beaten ? 'Beaten — keep it down ✓' : 'Re-attempt it →'}
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/** One topic: a 0→100% track with a "feel" ring and a "know" dot, the gap
 *  between them drawn as a coloured bar. Percentage lefts keep it exact at
 *  any width, and it's all plain Views — no SVG, trivial on low-end. */
function StrandRow({ c }: { c: Calibration }) {
  const band = bandFor(c, colors);
  const lo = Math.min(c.felt, c.actual);
  const hi = Math.max(c.felt, c.actual);
  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <Text style={styles.rowTag} numberOfLines={1}>
          {c.tag}
        </Text>
        <View style={[styles.badge, { backgroundColor: withAlpha(band.color, 0.14) }]}>
          <Text style={[styles.badgeText, { color: band.color }]}>{band.label}</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={styles.trackInner}>
          {/* baseline */}
          <View style={styles.baseline} />
          {/* gap bar between feel and know */}
          <View
            style={[
              styles.gapBar,
              { left: `${lo * 100}%`, width: `${Math.max(0, hi - lo) * 100}%`, backgroundColor: band.color },
            ]}
          />
          {/* actually-ready (filled) */}
          <View style={[styles.marker, styles.mKnow, { left: `${c.actual * 100}%` }]} />
          {/* feel-ready (hollow ring) */}
          <View style={[styles.marker, styles.mFeel, { left: `${c.felt * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
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
    lede: {
      fontFamily: fonts.regular,
      fontSize: 14.5,
      lineHeight: 22,
      color: colors.textSecondary,
      paddingHorizontal: spacing.gutter,
      marginTop: 8,
    },
    feelWord: { fontFamily: fonts.bold, color: colors.text },
    knowWord: { fontFamily: fonts.bold, color: colors.accent },

    // Headline
    headline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginHorizontal: spacing.gutter,
      marginTop: 22,
      padding: 18,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      backgroundColor: colors.card,
    },
    headlineNum: { fontFamily: fonts.bold, fontSize: 44, color: colors.danger, lineHeight: 46 },
    headlineText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.text },
    headlineStrong: { fontFamily: fonts.bold, color: colors.danger },

    // Legend
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: spacing.gutter,
      marginTop: 22,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendMarker: { position: 'relative', left: 0 },
    legendText: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary },
    legendHint: { flex: 1, textAlign: 'right', fontFamily: fonts.regular, fontSize: 11.5, color: colors.textTertiary },

    // Rows
    list: { marginTop: 14, paddingHorizontal: spacing.gutter },
    row: { paddingVertical: 13, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    rowHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    rowTag: { flex: 1, fontFamily: fonts.medium, fontSize: 15.5, color: colors.text },
    badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
    badgeText: { fontFamily: fonts.medium, fontSize: 11.5 },
    track: { height: 16, justifyContent: 'center' },
    // Inset by the marker radius so 0% and 100% markers never clip.
    trackInner: { position: 'absolute', left: 8, right: 8, height: 16, justifyContent: 'center' },
    baseline: { height: 3, borderRadius: 1.5, backgroundColor: withAlpha(colors.text, 0.08) },
    gapBar: { position: 'absolute', height: 3, borderRadius: 1.5 },
    marker: { position: 'absolute', width: 15, height: 15, borderRadius: 8, marginLeft: -7.5 },
    mKnow: { backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.bg },
    mFeel: { backgroundColor: colors.bg, borderWidth: 2.5, borderColor: colors.textSecondary },

    // Empty state
    empty: { alignItems: 'center', paddingHorizontal: 36, marginTop: 48, gap: 18 },
    emptyStrands: { flexDirection: 'row', alignItems: 'center', width: 160 },
    emptyDot: { width: 15, height: 15, borderRadius: 8 },
    emptyFeel: { backgroundColor: colors.bg, borderWidth: 2.5, borderColor: colors.textSecondary },
    emptyKnow: { backgroundColor: colors.accent },
    emptyLine: { flex: 1, height: 3, borderRadius: 1.5, backgroundColor: withAlpha(colors.text, 0.12), marginHorizontal: 4 },
    emptyText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
    emptyBtn: { backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
    emptyBtnText: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.onAccent },

    // Nemesis
    section: { marginTop: 34, paddingHorizontal: spacing.gutter },
    sectionTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, marginBottom: 12 },
    nemesisCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
    },
    nemesisHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    nemesisTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
    nemesisCount: { fontFamily: fonts.regular, fontSize: 12, color: colors.danger },
    nemesisExcerpt: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 10 },
    nemesisCta: { fontFamily: fonts.medium, fontSize: 13, color: colors.accent, marginTop: 12 },
  });
const styles = themedStyleSheet(makeStyles);
