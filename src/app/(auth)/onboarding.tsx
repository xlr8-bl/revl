/**
 * Onboarding wizard — runs once after first sign-in.
 *
 *   1 identity      name, @username (mock availability), avatar color
 *   2 school        University of Buea | HND
 *   3 placement     faculty/domain → department/specialty → level
 *   4 courses       auto-derived list, pre-checked; HND general papers locked
 *   5 personalize   next exam date + preferred study time
 *   6 done          "your library is ready" → lands on Courses
 *
 * Progressive profiling: one decision per screen, progress bar, back
 * support. Everything writes into the persisted profile at the end.
 */
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { coursesFor, departmentsFor, facultiesFor, schools } from '../../data/catalog';
import type { SchoolId } from '../../data/catalog/types';
import { AVATAR_COLORS, isUsernameAvailable, setProfile, useSession } from '../../lib/session';
import { colors, fonts, spacing } from '../../theme';

const STEPS = ['identity', 'school', 'placement', 'courses', 'personalize', 'done'] as const;
type Step = (typeof STEPS)[number];

/** Upcoming exam-sitting choices (config-worthy; fine hardcoded for launch). */
const EXAM_DATES = [
  { label: 'First semester exams (February)', iso: '2027-02-15' },
  { label: 'Second semester exams (June)', iso: '2027-06-14' },
  { label: 'HND national exam (June)', iso: '2027-06-21' },
  { label: 'Resits (September)', iso: '2026-09-07' },
];

export default function OnboardingScreen() {
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
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [examDate, setExamDate] = useState<string | null>(null);
  const [studyTime, setStudyTime] = useState<'morning' | 'evening' | 'night' | null>(null);

  const stepIndex = STEPS.indexOf(step);
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const usernameOk = cleanUsername.length >= 3 && isUsernameAvailable(cleanUsername);

  const faculties = school ? facultiesFor(school) : [];
  const departments = facultyId ? departmentsFor(facultyId) : [];
  const levels = school ? schools.find((sc) => sc.id === school)!.levels : [];
  const derivedCourses = useMemo(
    () => (school && departmentId && level ? coursesFor(school, departmentId, level) : []),
    [school, departmentId, level]
  );

  const goTo = (s: Step) => setStep(s);
  const back = () => (stepIndex > 0 ? goTo(STEPS[stepIndex - 1]) : router.back());

  const enterCourses = () => {
    // Pre-check everything; HND general papers stay locked on.
    setSelectedCodes(new Set(derivedCourses.map((c) => c.code)));
    goTo('courses');
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

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      {/* Progress + back */}
      <View style={styles.topBar}>
        <Pressable onPress={back} hitSlop={10}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((stepIndex + 1) / STEPS.length) * 100}%` }]} />
        </View>
        <Text style={styles.stepCount}>
          {stepIndex + 1}/{STEPS.length}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        {step === 'identity' && (
          <Animated.View entering={FadeInDown.springify().damping(15)}>
            <Text style={styles.title}>First, who are you?</Text>
            <Text style={styles.sub}>Signed in with {method ?? 'your account'}. This is how classmates will see you.</Text>

            <Text style={styles.fieldLabel}>Full name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Ashley Mbah" placeholderTextColor={colors.textTertiary} style={styles.input} autoFocus />

            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.handleRow}>
              <Text style={styles.at}>@</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="ashleym"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                style={[styles.input, { flex: 1, marginTop: 0 }]}
              />
            </View>
            {cleanUsername.length >= 3 && (
              <Text style={[styles.hint, { color: usernameOk ? colors.verified : colors.danger }]}>
                {usernameOk ? `@${cleanUsername} is available` : `@${cleanUsername} is taken`}
              </Text>
            )}

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

            <Cta label="Continue" enabled={!!name.trim() && usernameOk} onPress={() => goTo('school')} />
          </Animated.View>
        )}

        {step === 'school' && (
          <Animated.View entering={FadeInDown.springify().damping(15)}>
            <Text style={styles.title}>Where do you study?</Text>
            <Text style={styles.sub}>Revl launches with these two. More schools are coming.</Text>
            {schools.map((sc) => (
              <Pressable
                key={sc.id}
                onPress={() => {
                  setSchool(sc.id);
                  setFacultyId(null);
                  setDepartmentId(null);
                  setLevel(null);
                }}
                style={[styles.schoolCard, school === sc.id && styles.schoolCardActive]}>
                <Text style={styles.schoolShort}>{sc.shortName}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.schoolName}>{sc.name}</Text>
                  <Text style={styles.schoolMeta}>
                    {sc.id === 'ub' ? '10 faculties · 53 departments' : '7 domains · 53 specialties · national final exam'}
                  </Text>
                </View>
              </Pressable>
            ))}
            <Cta label="Continue" enabled={!!school} onPress={() => goTo('placement')} />
          </Animated.View>
        )}

        {step === 'placement' && (
          <Animated.View entering={FadeInDown.springify().damping(15)}>
            <Text style={styles.title}>{school === 'hnd' ? 'Your specialty' : 'Your department'}</Text>
            <Text style={styles.sub}>You will only see papers and courses that belong to you.</Text>

            <Text style={styles.fieldLabel}>{school === 'hnd' ? 'Domain' : 'Faculty / school'}</Text>
            <View style={styles.chips}>
              {faculties.map((f) => (
                <Chip key={f.id} label={f.name} selected={facultyId === f.id} onPress={() => { setFacultyId(f.id); setDepartmentId(null); }} />
              ))}
            </View>

            {facultyId && (
              <>
                <Text style={styles.fieldLabel}>{school === 'hnd' ? 'Specialty' : 'Department'}</Text>
                <View style={styles.chips}>
                  {departments.map((d) => (
                    <Chip key={d.id} label={d.name} selected={departmentId === d.id} onPress={() => setDepartmentId(d.id)} />
                  ))}
                </View>
              </>
            )}

            {departmentId && (
              <>
                <Text style={styles.fieldLabel}>Level</Text>
                <View style={styles.chips}>
                  {levels.map((l) => (
                    <Chip key={l} label={l} selected={level === l} onPress={() => setLevel(l)} />
                  ))}
                </View>
              </>
            )}

            <Cta label="Continue" enabled={!!(facultyId && departmentId && level)} onPress={enterCourses} />
          </Animated.View>
        )}

        {step === 'courses' && (
          <Animated.View entering={FadeInDown.springify().damping(15)}>
            <Text style={styles.title}>Your courses</Text>
            <Text style={styles.sub}>
              {school === 'hnd'
                ? 'These are your final-exam papers. General papers are written by everyone, so they stay on.'
                : 'Everything taught in your department at your level. Untick anything you are not taking.'}
            </Text>
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
                    <Text style={styles.courseTitle}>{c.title}</Text>
                    <Text style={styles.courseMeta}>
                      {c.code}
                      {c.general ? ' · general paper' : ''}
                      {locked ? ' · required' : ''}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            <Cta label={`Continue with ${selectedCodes.size} courses`} enabled={selectedCodes.size > 0} onPress={() => goTo('personalize')} />
          </Animated.View>
        )}

        {step === 'personalize' && (
          <Animated.View entering={FadeInDown.springify().damping(15)}>
            <Text style={styles.title}>Make it yours</Text>

            <Text style={styles.fieldLabel}>When is your next exam sitting?</Text>
            <View style={styles.chips}>
              {EXAM_DATES.map((d) => (
                <Chip key={d.iso} label={d.label} selected={examDate === d.iso} onPress={() => setExamDate(d.iso)} />
              ))}
            </View>

            <Text style={styles.fieldLabel}>When do you actually study?</Text>
            <View style={styles.chips}>
              {(['morning', 'evening', 'night'] as const).map((t) => (
                <Chip key={t} label={t[0].toUpperCase() + t.slice(1)} selected={studyTime === t} onPress={() => setStudyTime(t)} />
              ))}
            </View>

            <Text style={styles.hint}>
              Revl will time reminders and your daily plan around this. You can change everything later.
            </Text>
            <Cta label="Continue" enabled={!!(examDate && studyTime)} onPress={() => goTo('done')} />
          </Animated.View>
        )}

        {step === 'done' && (
          <Animated.View entering={FadeInDown.springify().damping(15)}>
            <View style={[styles.avatarPreview, { backgroundColor: avatarColor, alignSelf: 'center', marginTop: 30 }]}>
              <Text style={styles.avatarInitial}>{(name.trim()[0] ?? 'R').toUpperCase()}</Text>
            </View>
            <Text style={[styles.title, { textAlign: 'center', marginTop: 18 }]}>Your library is ready</Text>
            <Text style={[styles.sub, { textAlign: 'center' }]}>
              @{cleanUsername} · {departments.find((d) => d.id === departmentId)?.name} · {level}
              {'\n'}
              {selectedCodes.size} courses set up. Past papers appear as they are structured.
            </Text>
            <Cta label="Start revising" enabled onPress={finish} />
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipActive]}>
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Cta({ label, enabled, onPress }: { label: string; enabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      disabled={!enabled}
      onPress={onPress}
      style={({ pressed }) => [styles.cta, !enabled && styles.ctaDisabled, pressed && { opacity: 0.85 }]}>
      <Text style={[styles.ctaText, !enabled && { color: colors.textTertiary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.gutter + 6 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  back: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  progressTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.surface },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: colors.accent },
  stepCount: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary },
  title: { fontFamily: fonts.bold, fontSize: 27, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, marginTop: 8 },
  fieldLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, marginTop: 24, marginBottom: 10 },
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
  hint: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textTertiary, marginTop: 10 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarPreview: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: fonts.bold, fontSize: 24, color: '#141414' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
  swatch: { width: 26, height: 26, borderRadius: 13 },
  swatchActive: { borderWidth: 2.5, borderColor: colors.text },
  schoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    backgroundColor: colors.card,
    padding: 16,
    marginTop: 12,
  },
  schoolCardActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  schoolShort: { fontFamily: fonts.bold, fontSize: 18, color: colors.accent, width: 48 },
  schoolName: { fontFamily: fonts.bold, fontSize: 16.5, color: colors.text },
  schoolMeta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: colors.card,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipText: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.text },
  chipTextActive: { fontFamily: fonts.medium, color: colors.accent },
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
  cta: { marginTop: 30, backgroundColor: colors.accent, borderRadius: 10, alignItems: 'center', paddingVertical: 15 },
  ctaDisabled: { backgroundColor: colors.surface },
  ctaText: { fontFamily: fonts.medium, fontSize: 16, color: colors.onAccent },
});
