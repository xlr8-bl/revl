/**
 * Class — the department room, question-anchored (Revl's Reddit):
 *
 * - For You feed ranked by your courses → demand → recency
 * - Most Wanted: questions ranked by raised hands, "Solve this" pays credits
 * - Level filters (year cohorts), top-solvers strip
 * - Composer: Ask or Solve (tag a question, snap handwritten work)
 *
 * Solve posts that cross the community threshold become the paper's
 * "verified by top student" answer — the room feeds the reader.
 */
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Composer } from '../../components/Composer';
import { PostCard } from '../../components/PostCard';
import { QuestionAnchor } from '../../components/QuestionAnchor';
import { findQuestion } from '../../lib/selectors';
import { useCommunity, type QuestionRef } from '../../lib/communityStore';
import { useSession } from '../../lib/session';
import { colors, fonts, spacing, TAB_BAR_CLEARANCE, themedStyleSheet, useThemeVersion } from '../../theme';

const TOP_SOLVERS = [
  { name: 'Brandon', initial: 'B', color: '#7EA8FF', solved: 9 },
  { name: 'Grace', initial: 'G', color: '#F2A93B', solved: 6 },
  { name: 'Melissa', initial: 'M', color: '#FF8FA3', solved: 4 },
];

export default function ClassScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const { posts, wanted } = useCommunity();
  const [view, setView] = useState<'foryou' | 'wanted'>('foryou');
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [solveRef, setSolveRef] = useState<(QuestionRef & { courseCode: string }) | null>(null);

  const feed = useMemo(() => {
    let list = posts;
    if (levelFilter) list = list.filter((p) => p.level === levelFilter);
    // For You: enrolled-course posts first, then demand-weighted (mock rank).
    const enrolled = new Set(profile?.enrolledCourseCodes ?? []);
    return [...list].sort((a, b) => {
      const ea = a.courseCode && [...enrolled].some((c) => c.startsWith(a.courseCode!.slice(0, 3))) ? 1 : 0;
      const eb = b.courseCode && [...enrolled].some((c) => c.startsWith(b.courseCode!.slice(0, 3))) ? 1 : 0;
      return eb - ea || b.likes - a.likes;
    });
  }, [posts, levelFilter, profile]);

  const mostWanted = useMemo(() => [...wanted].sort((a, b) => b.hands - a.hands), [wanted]);

  if (!profile) return null;
  const levels = profile.school === 'hnd' ? ['HND'] : ['L200', 'L300', 'L400', 'L500'];

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 70 }}>
        {/* Room header */}
        <Text style={styles.roomKicker}>{profile.school === 'ub' ? 'University of Buea' : 'HND'} · 128 classmates</Text>
        <Text style={styles.roomTitle}>{profile.departmentName}</Text>

        {/* Top solvers strip — status for the people doing the work */}
        <View style={styles.solversRow}>
          <Text style={styles.solversLabel}>Top solvers this week</Text>
          {TOP_SOLVERS.map((s) => (
            <View key={s.name} style={styles.solver}>
              <View style={[styles.solverAvatar, { backgroundColor: s.color }]}>
                <Text style={styles.solverInitial}>{s.initial}</Text>
              </View>
              <Text style={styles.solverCount}>{s.solved}</Text>
            </View>
          ))}
        </View>

        {/* View + level filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Filter label="For you" active={view === 'foryou' && !levelFilter} onPress={() => { setView('foryou'); setLevelFilter(null); }} />
          <Filter label={`Most wanted (${mostWanted.length})`} active={view === 'wanted'} onPress={() => setView('wanted')} />
          {levels.map((l) => (
            <Filter key={l} label={l} active={levelFilter === l && view === 'foryou'} onPress={() => { setView('foryou'); setLevelFilter(levelFilter === l ? null : l); }} />
          ))}
        </ScrollView>

        {view === 'foryou' ? (
          <View style={styles.feed}>
            {feed.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.gutter, marginTop: 14 }}>
            <Text style={styles.wantedIntro}>
              Questions your class most wants a human solution for. Solve one, get verified, earn credits.
            </Text>
            {mostWanted.map((w, i) => {
              const found = findQuestion(w.ref.questionId);
              if (!found) return null;
              return (
                <View key={w.ref.questionId} style={styles.wantedCard}>
                  <View style={styles.wantedRank}>
                    <Text style={styles.wantedRankText}>{i + 1}</Text>
                    <Text style={styles.wantedHands}>✋ {w.hands}</Text>
                  </View>
                  <QuestionAnchor refr={w.ref} courseCode={w.courseCode} />
                  <Pressable
                    onPress={() => {
                      setSolveRef({ ...w.ref, courseCode: w.courseCode });
                      setComposerOpen(true);
                    }}
                    style={({ pressed }) => [styles.solveBtn, pressed && { opacity: 0.85 }]}>
                    <Text style={styles.solveText}>Solve this (+3 credits if verified)</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Composer FAB */}
      <Pressable
        onPress={() => {
          setSolveRef(null);
          setComposerOpen(true);
        }}
        style={({ pressed }) => [styles.fab, { bottom: Math.max(insets.bottom, 10) + 80 }, pressed && { opacity: 0.9 }]}>
        <Text style={styles.fabText}>+ Post</Text>
      </Pressable>

      {composerOpen && (
        <Composer visible={composerOpen} onClose={() => setComposerOpen(false)} profile={profile} initialRef={solveRef} />
      )}
    </View>
  );
}

function Filter({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filter, active && styles.filterActive]}>
      <Text style={[styles.filterText, active && { color: colors.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  roomKicker: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, paddingHorizontal: spacing.gutter },
  roomTitle: { fontFamily: fonts.bold, fontSize: 30, color: colors.text, paddingHorizontal: spacing.gutter, marginTop: 3 },
  solversRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.gutter,
    marginTop: 14,
  },
  solversLabel: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  solver: { alignItems: 'center', gap: 2 },
  solverAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  solverInitial: { fontFamily: fonts.bold, fontSize: 13, color: '#141414' },
  solverCount: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.textSecondary },
  filters: { paddingHorizontal: spacing.gutter, gap: 8, marginTop: 18 },
  filter: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 9,
    backgroundColor: colors.card,
  },
  filterActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.text },
  feed: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  wantedIntro: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary, marginBottom: 14 },
  wantedCard: { marginBottom: 18 },
  wantedRank: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  wantedRankText: { fontFamily: fonts.bold, fontSize: 22, color: colors.text, fontVariant: ['tabular-nums'] },
  wantedHands: { fontFamily: fonts.medium, fontSize: 14, color: colors.accent },
  solveBtn: { backgroundColor: colors.accent, borderRadius: 10, alignItems: 'center', paddingVertical: 12, marginTop: 10 },
  solveText: { fontFamily: fonts.medium, fontSize: 14, color: colors.onAccent },
  fab: {
    position: 'absolute',
    right: spacing.gutter,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 13,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onAccent },
});
const styles = themedStyleSheet(makeStyles);
