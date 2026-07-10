/**
 * Onboarding wizard — one decision per screen, no layout shift.
 *
 *   identity → school → faculty → department → level (UB only)
 *            → courses → personalize → done
 *
 * Design rules applied here:
 *  - Calm 220ms fades between steps. No springs: springs overshoot and
 *    read as "shaking".
 *  - Every dynamic text (username hint) has RESERVED height so typing
 *    never shifts the layout.
 *  - KeyboardAvoidingView + return-key chaining + delayed focus (focus
 *    after the step transition, not during) keep inputs visible and the
 *    screen still while the keyboard appears.
 *  - Placement is tappable full-width ROWS (not chip clouds); tapping
 *    advances automatically; a breadcrumb shows where you are and each
 *    crumb jumps back.
 *  - HND has a single level: the level step is skipped and set to 'HND'.
 */
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { coursesFor, departmentsFor, facultiesFor, schools } from '../../data/catalog';
import type { SchoolId } from '../../data/catalog/types';
import { AVATAR_COLORS, isUsernameAvailable, setProfile, useSession } from '../../lib/session';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../../theme';

type Step = 'identity' | 'school' | 'faculty' | 'department' | 'level' | 'courses' | 'personalize' | 'done';

const EXAM_DATES = [
  { label: 'First semester exams (February)', iso: '2027-02-15' },
  { label: 'Second semester exams (June)', iso: '2027-06-14' },
  { label: 'HND national exam (June)', iso: '2027-06-21' },
  { label: 'Resits (September)', iso: '2026-09-07' },
];

export default function OnboardingScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { method } = useSession();

  const [step, setStep] = useState<Step>('identity');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [school, setSchool] = useState<SchoolId | null>(null);
  const [facultyId, setFacultyId] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [examDate, setExamDate] = useState<string | null>(null);
  const [studyTime, setStudyTime] = useState<'morning' | 'evening' | 'night' | null>(null);

  const usernameRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  // Focus AFTER the step transition settles — focusing mid-animation is
  // what makes the screen jump.
  useEffect(() => {
    if (step === 'identity') {
      const t = setTimeout(() => nameRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [step]);

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const usernameOk = cleanUsername.length >= 3 && isUsernameAvailable(cleanUsername);
  const usernameHint =
    cleanUsername.length >= 3 ? (usernameOk ? `@${cleanUsername} is available` : `@${cleanUsername} is taken`) : ' ';

  // Step order depends on school (HND skips level).
  const stepOrder: Step[] = useMemo(
    () =>
      school === 'hnd'
        ? ['identity', 'school', 'faculty', 'department', 'courses', 'personalize', 'done']
        : ['identity', 'school', 'faculty', 'department', 'level', 'courses', 'personalize', 'done'],
    [school]
  );
  const stepIndex = stepOrder.indexOf(step);

  const faculties = school ? facultiesFor(school) : [];
  const departments = facultyId ? departmentsFor(facultyId) : [];
  const filteredDepartments = deptFilter.trim()
    ? departments.filter((d) => d.name.toLowerCase().includes(deptFilter.trim().toLowerCase()))
    : departments;
  const levels = school ? schools.find((sc) => sc.id === school)!.levels : [];
  const derivedCourses = useMemo(
    () => (school && departmentId && level ? coursesFor(school, departmentId, level) : []),
    [school, departmentId, level]
  );

  const back = () => (stepIndex > 0 ? setStep(stepOrder[stepIndex - 1]) : router.back());

  const pickDepartment = (id: string) => {
    setDepartmentId(id);
    if (school === 'hnd') {
      setLevel('HND'); // single level: skip the step entirely
      openCourses(id, 'HND');
    } else {
      setStep('level');
    }
  };

  const openCourses = (deptId: string, lvl: string) => {
    const list = coursesFor(school!, deptId, lvl);
    setSelectedCodes(new Set(list.map((c) => c.code)));
    setStep('courses');
  };

  const finish = () => {
    const faculty = faculties.find((f) => f.id === facultyId)!;
    const dept = departments.find((d) => d.id === departmentId)!;
    setProfile({
      name: name.trim(),
      username: cleanUsername,
      avatarColor,
      school: school!,
      facultyId: faculty.id,
      facultyName: faculty.name,
      departmentId: dept.id,
      departmentName: dept.name,
      level: level!,
      enrolledCourseCodes: [...selectedCodes],
      examDate: examDate!,
      studyTime: studyTime!,
    });
    router.replace('/courses');
  };

  /** Breadcrumb of confirmed choices; tap a crumb to change it. */
  const crumbs: { label: string; goto: Step }[] = [];
  if (school) crumbs.push({ label: school === 'ub' ? 'UB' : 'HND', goto: 'school' });
  if (facultyId) crumbs.push({ label: faculties.find((f) => f.id === facultyId)?.name ?? '', goto: 'faculty' });
  if (departmentId && (step === 'level' || step === 'courses'))
    crumbs.push({ label: departments.find((d) => d.id === departmentId)?.name ?? '', goto: 'department' });

  const showCrumbs = ['faculty', 'department', 'level', 'courses'].includes(step) && crumbs.length > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topBar}>
        <Pressable onPress={back} hitSlop={10}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((stepIndex + 1) / stepOrder.length) * 100}%` }]} />
        </View>
        <Text style={styles.stepCount}>
          {stepIndex + 1}/{stepOrder.length}
        </Text>
      </View>

      {showCrumbs && (
        <View style={styles.crumbs}>
          {crumbs.map((c, i) => (
            <React.Fragment key={c.goto}>
              {i > 0 && <Text style={styles.crumbSep}>›</Text>}
              <Pressable onPress={() => setStep(c.goto)} hitSlop={6}>
                <Text style={styles.crumb} numberOfLines={1}>
                  {c.label}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step === 'identity' && (
          <Animated.View key="identity" entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={{ flex: 1 }}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
              <Text style={styles.title}>First, who are you?</Text>
              <Text style={styles.sub}>Signed in with {method ?? 'your account'}. This is how classmates see you.</Text>

              <Text style={styles.fieldLabel}>Full name</Text>
              <TextInput
                ref={nameRef}
                value={name}
                onChangeText={setName}
                placeholder="Ashley Mbah"
                placeholderTextColor={colors.textTertiary}
                style={styles.input}
                returnKeyType="next"
                autoComplete="name"
                textContentType="name"
                onSubmitEditing={() => usernameRef.current?.focus()}
              />

              <Text style={styles.fieldLabel}>Username</Text>
              <View style={styles.handleRow}>
                <Text style={styles.at}>@</Text>
                <TextInput
                  ref={usernameRef}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="ashleym"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  style={[styles.input, { flex: 1 }]}
                />
              </View>
              {/* Reserved height: this line ALWAYS renders, so typing never shifts the layout. */}
              <Text style={[styles.hintLine, { color: usernameOk ? colors.verified : colors.danger }]}>{usernameHint}</Text>

              <Text style={styles.fieldLabel}>Avatar</Text>
              <View style={styles.avatarRow}>
                <View style={[styles.avatarPreview, { backgroundColor: avatarColor }]}>
                  <Text style={styles.avatarInitial}>{(name.trim()[0] ?? 'R').toUpperCase()}</Text>
                </View>
                <View style={styles.swatches}>
                  {AVATAR_COLORS.map((c) => (
                    <Pressable key={c} onPress={() => setAvatarColor(c)} style={[styles.swatch, { backgroundColor: c }, avatarColor === c && styles.swatchActive]} />
                  ))}
                </View>
              </View>
            </ScrollView>
            {/* CTA pinned above the keyboard, always reachable */}
            <Cta label="Continue" enabled={!!name.trim() && usernameOk} onPress={() => setStep('school')} bottomInset={insets.bottom} />
          </Animated.View>
        )}

        {step === 'school' && (
          <Animated.View key="school" entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={{ flex: 1 }}>
            <Text style={styles.title}>Where do you study?</Text>
            <Text style={styles.sub}>Revl launches with these two. Tap one to continue.</Text>
            <View style={{ marginTop: 16 }}>
              {schools.map((sc) => (
                <Pressable
                  key={sc.id}
                  onPress={() => {
                    setSchool(sc.id);
                    setFacultyId(null);
                    setDepartmentId(null);
                    setLevel(null);
                    setStep('faculty');
                  }}
                  style={({ pressed }) => [styles.bigRow, pressed && styles.rowPressed]}>
                  <Text style={styles.bigRowBadge}>{sc.shortName}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{sc.name}</Text>
                    <Text style={styles.rowMeta}>
                      {sc.id === 'ub' ? '10 faculties · 53 departments' : '7 domains · 53 specialties · one national exam'}
                    </Text>
                  </View>
                  <Text style={styles.rowChevron}>›</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 'faculty' && (
          <Animated.View key="faculty" entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={{ flex: 1 }}>
            <Text style={styles.title}>{school === 'hnd' ? 'Your domain' : 'Your faculty'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 14, paddingBottom: 30 }}>
              {faculties.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => {
                    setFacultyId(f.id);
                    setDeptFilter('');
                    setStep('department');
                  }}
                  style={({ pressed }) => [styles.listRow, pressed && styles.rowPressed]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{f.name}</Text>
                    <Text style={styles.rowMeta}>
                      {departmentsFor(f.id).length} {school === 'hnd' ? 'specialties' : 'departments'}
                    </Text>
                  </View>
                  <Text style={styles.rowChevron}>›</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {step === 'department' && (
          <Animated.View key="department" entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={{ flex: 1 }}>
            <Text style={styles.title}>{school === 'hnd' ? 'Your specialty' : 'Your department'}</Text>
            {departments.length > 8 && (
              <TextInput
                value={deptFilter}
                onChangeText={setDeptFilter}
                placeholder="Type to filter…"
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, { marginTop: 12 }]}
              />
            )}
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 30 }}>
              {filteredDepartments.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => pickDepartment(d.id)}
                  style={({ pressed }) => [styles.listRow, pressed && styles.rowPressed]}>
                  <Text style={[styles.rowTitle, { flex: 1 }]}>{d.name}</Text>
                  <Text style={styles.rowChevron}>›</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {step === 'level' && (
          <Animated.View key="level" entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={{ flex: 1 }}>
            <Text style={styles.title}>Your level</Text>
            <View style={{ marginTop: 16 }}>
              {levels.map((l) => (
                <Pressable
                  key={l}
                  onPress={() => {
                    setLevel(l);
                    openCourses(departmentId!, l);
                  }}
                  style={({ pressed }) => [styles.listRow, pressed && styles.rowPressed]}>
                  <Text style={[styles.rowTitle, { flex: 1 }]}>{l}</Text>
                  <Text style={styles.rowChevron}>›</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 'courses' && (
          <Animated.View key="courses" entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={{ flex: 1 }}>
            <Text style={styles.title}>Your courses</Text>
            <Text style={styles.sub}>
              {school === 'hnd'
                ? 'Your final-exam papers. General papers are written by everyone, so they stay on.'
                : 'Taught in your department at your level. Untick what you are not taking.'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 12 }}>
              {derivedCourses.map((c) => {
                const locked = school === 'hnd' && c.general;
                const on = selectedCodes.has(c.code);
                return (
                  <Pressable
                    key={c.code}
                    disabled={locked}
                    onPress={() =>
                      setSelectedCodes((prev) => {
                        const next = new Set(prev);
                        on ? next.delete(c.code) : next.add(c.code);
                        return next;
                      })
                    }
                    style={[styles.courseRow, !on && { opacity: 0.45 }]}>
                    <View style={[styles.checkbox, on && styles.checkboxOn]}>{on && <Text style={styles.checkMark}>✓</Text>}</View>
                    <View style={{ flex: 1 }}>
                      {/* Code-first when the official title is unpublished — never show an invented title. */}
                      <Text style={styles.courseTitle}>{c.title || c.code}</Text>
                      <Text style={styles.courseMeta}>
                        {c.title ? c.code : 'title pending confirmation'}
                        {c.general ? ' · general paper' : ''}
                        {locked ? ' · required' : ''}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Cta label={`Continue with ${selectedCodes.size} courses`} enabled={selectedCodes.size > 0} onPress={() => setStep('personalize')} bottomInset={insets.bottom} />
          </Animated.View>
        )}

        {step === 'personalize' && (
          <Animated.View key="personalize" entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>Make it yours</Text>

              <Text style={styles.fieldLabel}>When is your next exam sitting?</Text>
              {EXAM_DATES.map((d) => (
                <Pressable
                  key={d.iso}
                  onPress={() => setExamDate(d.iso)}
                  style={({ pressed }) => [styles.listRow, examDate === d.iso && styles.listRowActive, pressed && styles.rowPressed]}>
                  <Text style={[styles.rowTitle, { flex: 1 }, examDate === d.iso && { color: colors.accent }]}>{d.label}</Text>
                  {examDate === d.iso && <Text style={{ color: colors.accent }}>✓</Text>}
                </Pressable>
              ))}

              <Text style={styles.fieldLabel}>When do you actually study?</Text>
              <View style={styles.timeRow}>
                {(['morning', 'evening', 'night'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setStudyTime(t)}
                    style={[styles.timeChip, studyTime === t && styles.timeChipActive]}>
                    <Text style={[styles.rowTitle, studyTime === t && { color: colors.accent }]}>
                      {t[0].toUpperCase() + t.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.hintLine}>Reminders and your daily plan follow this. Change anytime.</Text>
            </ScrollView>
            <Cta label="Continue" enabled={!!(examDate && studyTime)} onPress={() => setStep('done')} bottomInset={insets.bottom} />
          </Animated.View>
        )}

        {step === 'done' && (
          <Animated.View key="done" entering={FadeIn.duration(300)} style={{ flex: 1 }}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={[styles.avatarPreview, { backgroundColor: avatarColor, alignSelf: 'center' }]}>
                <Text style={styles.avatarInitial}>{(name.trim()[0] ?? 'R').toUpperCase()}</Text>
              </View>
              <Text style={[styles.title, { textAlign: 'center', marginTop: 18 }]}>Your library is ready</Text>
              <Text style={[styles.sub, { textAlign: 'center' }]}>
                @{cleanUsername} · {departments.find((d) => d.id === departmentId)?.name} · {level}
                {'\n'}
                {selectedCodes.size} courses set up. Past papers appear as they are structured.
              </Text>
            </View>
            <Cta label="Start revising" enabled onPress={finish} bottomInset={insets.bottom} />
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function Cta({ label, enabled, onPress, bottomInset }: { label: string; enabled: boolean; onPress: () => void; bottomInset: number }) {
  return (
    <View style={{ paddingBottom: Math.max(bottomInset, 12), paddingTop: 8 }}>
      <Pressable
        disabled={!enabled}
        onPress={onPress}
        style={({ pressed }) => [styles.cta, !enabled && styles.ctaDisabled, pressed && { opacity: 0.85 }]}>
        <Text style={[styles.ctaText, !enabled && { color: colors.textTertiary }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.gutter + 6 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  back: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, paddingVertical: 4 },
  progressTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.surface },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: colors.accent },
  stepCount: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary },
  crumbs: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  crumb: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.accent, maxWidth: 150 },
  crumbSep: { fontFamily: fonts.regular, fontSize: 13, color: colors.textTertiary },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, marginTop: 8 },
  fieldLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, marginTop: 22, marginBottom: 10 },
  input: {
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  handleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  at: { fontFamily: fonts.medium, fontSize: 18, color: colors.textSecondary },
  /** Always-rendered hint line: fixed height, no layout shift. */
  hintLine: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textTertiary, height: 18, marginTop: 8 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarPreview: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: fonts.bold, fontSize: 24, color: '#141414' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
  swatch: { width: 26, height: 26, borderRadius: 13 },
  swatchActive: { borderWidth: 2.5, borderColor: colors.text },
  bigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    backgroundColor: colors.card,
    padding: 18,
    marginBottom: 10,
  },
  bigRowBadge: { fontFamily: fonts.bold, fontSize: 17, color: colors.accent, width: 46 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 58,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  listRowActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  rowPressed: { opacity: 0.75 },
  rowTitle: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.text },
  rowMeta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 3 },
  rowChevron: { fontFamily: fonts.regular, fontSize: 20, color: colors.textTertiary },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkMark: { fontFamily: fonts.bold, fontSize: 13, color: colors.onAccent },
  courseTitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  courseMeta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  timeRow: { flexDirection: 'row', gap: 8 },
  timeChip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingVertical: 13,
    backgroundColor: colors.card,
  },
  timeChipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  cta: { backgroundColor: colors.accent, borderRadius: 10, alignItems: 'center', paddingVertical: 15 },
  ctaDisabled: { backgroundColor: colors.surface },
  ctaText: { fontFamily: fonts.medium, fontSize: 16, color: colors.onAccent },
});
const styles = themedStyleSheet(makeStyles);
