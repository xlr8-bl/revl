/**
 * Onboarding wizard — one decision per screen, modelled on how the academic
 * year actually works (see docs/AUTH.md + lib/academic).
 *
 *   identity → school → faculty → department → level (UB only) → courses → done
 *
 * Key rules:
 *  - PREFILL from the sign-in provider: Google/Apple already gave us name +
 *    email (+ Google a photo), so we confirm rather than re-ask. Username
 *    (which no provider gives) is suggested from the email/name.
 *  - The semester and exam are ONE fact, derived from today's date and shown
 *    with a confirmable "switch" — not two questions that can disagree. Only
 *    the active semester's courses are pre-selected.
 *  - Carry-over (retake) courses are an explicit add that reaches across
 *    levels/semesters — the one reason to pull in another semester's course.
 *  - Calm 220ms fades; reserved-height hints so typing never shifts layout;
 *    HND has one level so that step is skipped.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
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
import { Avatar } from '../../components/Avatar';
import { coursesFor, coursesInDepartment, departmentsFor, facultiesFor, schools } from '../../data/catalog';
import type { SchoolId } from '../../data/catalog/types';
import {
  academicYear,
  currentSemester,
  nextExamSitting,
  semesterName,
  type Semester,
} from '../../lib/academic';
import { AVATAR_COLORS, isUsernameAvailable, setProfile, useSession } from '../../lib/session';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../../theme';

type Step = 'identity' | 'school' | 'faculty' | 'department' | 'level' | 'courses' | 'done';

const toUsername = (s: string) => s.toLowerCase().replace(/[^a-z0-9_]/g, '');

export default function OnboardingScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { method, identity } = useSession();

  // Prefill from the provider. Google gives a name+email; Apple gives them
  // only on first auth (else undefined → we ask). Username: suggested from
  // the email local-part, or the name when the email is an Apple relay.
  const suggestedUsername = useMemo(() => {
    if (!identity) return '';
    if (identity.email && !identity.emailIsPrivateRelay) return toUsername(identity.email.split('@')[0]);
    return toUsername((identity.fullName ?? '').replace(/\s+/g, ''));
  }, [identity]);

  const [step, setStep] = useState<Step>('identity');
  const [name, setName] = useState(identity?.fullName ?? '');
  const [username, setUsername] = useState(suggestedUsername);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(identity?.avatarUrl);
  const [avatarColor] = useState(AVATAR_COLORS[0]);
  const [school, setSchool] = useState<SchoolId | null>(null);
  const [facultyId, setFacultyId] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState('');
  const [activeSemester, setActiveSemester] = useState<Semester>(currentSemester());
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [carryover, setCarryover] = useState<Set<string>>(new Set());
  const [carryQuery, setCarryQuery] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');

  const isMomo = method === 'momo' || method === 'orange';
  const providerLabel =
    method === 'google' ? 'Google' : method === 'apple' ? 'Apple' : method ? 'Mobile Money' : 'your account';

  const usernameRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  useEffect(() => {
    if (step === 'identity' && !name) {
      const t = setTimeout(() => nameRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [step, name]);

  const cleanUsername = toUsername(username.trim());
  const usernameOk = cleanUsername.length >= 3 && isUsernameAvailable(cleanUsername);
  const usernameHint =
    cleanUsername.length >= 3 ? (usernameOk ? `@${cleanUsername} is available` : `@${cleanUsername} is taken`) : ' ';

  const stepOrder: Step[] = useMemo(
    () =>
      school === 'hnd'
        ? ['identity', 'school', 'faculty', 'department', 'courses', 'done']
        : ['identity', 'school', 'faculty', 'department', 'level', 'courses', 'done'],
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
  // Only the ACTIVE semester's courses (plus any without a semester tag).
  const activeCourses = useMemo(
    () => derivedCourses.filter((c) => school === 'hnd' || c.semester === activeSemester || !c.semester),
    [derivedCourses, activeSemester, school]
  );
  // Reset the tick set whenever the level or semester changes — switching
  // semester loads THAT semester's set; unticks within a semester persist.
  useEffect(() => {
    setSelectedCodes(new Set(activeCourses.map((c) => c.code)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, activeSemester]);

  const deptAllCourses = useMemo(
    () => (school && departmentId ? coursesInDepartment(school, departmentId) : []),
    [school, departmentId]
  );
  const carryResults = useMemo(() => {
    const q = carryQuery.trim().toLowerCase();
    if (!q) return [];
    return deptAllCourses
      .filter(
        (c) =>
          (c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)) &&
          // A carry-over is re-sat in the SAME semester it's taught — a failed
          // first-semester course is written next year's first semester, never
          // this second-semester sitting. So only same-semester courses qualify.
          c.semester === activeSemester &&
          !activeCourses.some((a) => a.code === c.code) &&
          !carryover.has(c.code)
      )
      .slice(0, 10);
  }, [carryQuery, deptAllCourses, activeCourses, carryover, activeSemester]);

  const totalSelected = selectedCodes.size + carryover.size;

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    }).catch(() => null);
    if (res && !res.canceled && res.assets?.[0]) setAvatarUri(res.assets[0].uri);
  };

  const back = () => (stepIndex > 0 ? setStep(stepOrder[stepIndex - 1]) : router.back());

  const pickDepartment = (id: string) => {
    setDepartmentId(id);
    if (school === 'hnd') {
      setLevel('HND');
      setStep('courses');
    } else {
      setStep('level');
    }
  };

  const derivedExam = useMemo(
    () => nextExamSitting(new Date(), school === 'hnd' ? 'S2' : activeSemester),
    [activeSemester, school]
  );
  const examDays = Math.max(0, Math.ceil((new Date(derivedExam.iso).getTime() - Date.now()) / 86400000));

  const finish = () => {
    const faculty = faculties.find((f) => f.id === facultyId)!;
    const dept = departments.find((d) => d.id === departmentId)!;
    setProfile({
      name: name.trim(),
      username: cleanUsername,
      avatarColor,
      avatarUri,
      school: school!,
      facultyId: faculty.id,
      facultyName: faculty.name,
      departmentId: dept.id,
      departmentName: dept.name,
      level: level!,
      academicYear: academicYear(),
      enrolledCourseCodes: [...new Set([...selectedCodes, ...carryover])],
      carryoverCourseCodes: [...carryover],
      examDate: derivedExam.iso,
      authProvider: method ?? undefined,
      email: identity?.email,
      emailIsPrivateRelay: identity?.emailIsPrivateRelay,
      recoveryEmail: recoveryEmail.trim() || undefined,
      recoveryPhone: recoveryPhone.trim() || undefined,
    });
    router.replace('/');
  };

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
              <Text style={styles.title}>{identity?.fullName ? 'Confirm your details' : 'First, who are you?'}</Text>
              <Text style={styles.sub}>
                Signed in with {providerLabel}.
                {identity?.fullName ? ' We filled in what we could — check it over.' : ' This is how classmates see you.'}
              </Text>

              {/* Photo — provider photo / default Ronaldo / uploaded */}
              <View style={styles.photoWrap}>
                <Pressable onPress={pickPhoto}>
                  <Avatar uri={avatarUri} useDefault color={avatarColor} initial={name.trim()[0]} size={92} />
                  <View style={styles.photoBadge}>
                    <Ionicons name="camera" size={15} color="#FFFFFF" />
                  </View>
                </Pressable>
                <View style={{ gap: 6 }}>
                  <Pressable onPress={pickPhoto}>
                    <Text style={styles.photoBtn}>Change photo</Text>
                  </Pressable>
                  {avatarUri && (
                    <Pressable onPress={() => setAvatarUri(undefined)}>
                      <Text style={styles.photoRemove}>Use default</Text>
                    </Pressable>
                  )}
                </View>
              </View>

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
              <Text style={[styles.hintLine, { color: usernameOk ? colors.verified : colors.danger }]}>{usernameHint}</Text>

              {identity?.email && (
                <Text style={styles.emailNote}>
                  {identity.emailIsPrivateRelay ? 'Apple private-relay email' : 'Email'}: {identity.email}
                </Text>
              )}
            </ScrollView>
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
                      {sc.id === 'ub' ? '12 faculties · 95 departments' : '7 domains · 53 specialties · one national exam'}
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
            <Text style={styles.sub}>We'll move you up automatically each academic year — you confirm it.</Text>
            <View style={{ marginTop: 16 }}>
              {levels.map((l) => (
                <Pressable
                  key={l}
                  onPress={() => {
                    setLevel(l);
                    setStep('courses');
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

            {/* Derived-semester disclaimer the user can confirm/switch */}
            {school !== 'hnd' && (
              <View style={styles.semesterBar}>
                <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.semesterBarText}>
                  Set from today's date: <Text style={{ fontFamily: fonts.bold, color: colors.text }}>{semesterName(activeSemester)}</Text>
                </Text>
                <Pressable onPress={() => setActiveSemester(activeSemester === 'S1' ? 'S2' : 'S1')} hitSlop={8}>
                  <Text style={styles.semesterSwitch}>Switch</Text>
                </Pressable>
              </View>
            )}
            <Text style={[styles.sub, { marginTop: 10 }]}>
              {school === 'hnd'
                ? 'Your final-exam papers. General papers are written by everyone, so they stay on.'
                : `Your ${semesterName(activeSemester).toLowerCase()} courses. Untick what you are not taking.`}
            </Text>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8, paddingBottom: 12 }}>
              {activeCourses.map((c) => {
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

              {/* Carry-over — retakes reach across levels/semesters */}
              {school !== 'hnd' && (
                <View style={styles.carrySection}>
                  <Text style={styles.carryLabel}>
                    Retaking a {semesterName(activeSemester).toLowerCase()} course from a past year?
                  </Text>
                  {[...carryover].map((code) => {
                    const c = deptAllCourses.find((x) => x.code === code);
                    return (
                      <View key={code} style={[styles.courseRow, styles.carryRow]}>
                        <View style={styles.retakeBadge}>
                          <Text style={styles.retakeBadgeText}>RETAKE</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.courseTitle}>{c?.title || code}</Text>
                          <Text style={styles.courseMeta}>{code}{c?.level ? ` · ${c.level}` : ''}{c?.semester ? ` · ${c.semester === 'S1' ? 'First sem' : 'Second sem'}` : ''}</Text>
                        </View>
                        <Pressable
                          hitSlop={8}
                          onPress={() => setCarryover((p) => { const n = new Set(p); n.delete(code); return n; })}>
                          <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
                        </Pressable>
                      </View>
                    );
                  })}
                  <View style={styles.carrySearch}>
                    <Ionicons name="search" size={16} color={colors.textTertiary} />
                    <TextInput
                      value={carryQuery}
                      onChangeText={setCarryQuery}
                      placeholder={`Search a ${semesterName(activeSemester).toLowerCase()} course`}
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="characters"
                      style={styles.carrySearchInput}
                    />
                  </View>
                  {carryResults.map((c) => (
                    <Pressable
                      key={c.code}
                      onPress={() => {
                        setCarryover((p) => new Set(p).add(c.code));
                        setCarryQuery('');
                      }}
                      style={({ pressed }) => [styles.carryResult, pressed && { opacity: 0.6 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.courseTitle}>{c.title || c.code}</Text>
                        <Text style={styles.courseMeta}>{c.code}{c.level ? ` · ${c.level}` : ''}</Text>
                      </View>
                      <Ionicons name="add-circle" size={22} color={colors.accent} />
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
            <Cta label={`Continue with ${totalSelected} course${totalSelected === 1 ? '' : 's'}`} enabled={totalSelected > 0} onPress={() => setStep('done')} bottomInset={insets.bottom} />
          </Animated.View>
        )}

        {step === 'done' && (
          <Animated.View key="done" entering={FadeIn.duration(300)} style={{ flex: 1 }}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 12 }}>
              <View style={{ alignItems: 'center' }}>
                <Avatar uri={avatarUri} useDefault color={avatarColor} initial={name.trim()[0]} size={72} />
                <Text style={[styles.title, { textAlign: 'center', marginTop: 16 }]}>Your library is ready</Text>
                <Text style={[styles.sub, { textAlign: 'center' }]}>
                  @{cleanUsername} · {departments.find((d) => d.id === departmentId)?.name} · {level}
                  {'\n'}
                  {totalSelected} courses set up{carryover.size ? ` (${carryover.size} carry-over)` : ''}.
                </Text>
                <View style={styles.examChip}>
                  <Ionicons name="alarm-outline" size={15} color={colors.accent} />
                  <Text style={styles.examChipText}>
                    {derivedExam.label} — in {examDays} days
                  </Text>
                </View>
              </View>

              {/* Mobile-money accounts have no email/phone to recover with */}
              {isMomo && (
                <View style={{ marginTop: 28 }}>
                  <Text style={styles.fieldLabel}>Recover your account (optional)</Text>
                  <Text style={[styles.sub, { marginTop: 0, marginBottom: 12 }]}>
                    You signed in with Mobile Money. Add an email or backup number so a lost SIM never loses your
                    account.
                  </Text>
                  <TextInput
                    value={recoveryEmail}
                    onChangeText={setRecoveryEmail}
                    placeholder="Email (optional)"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                  <TextInput
                    value={recoveryPhone}
                    onChangeText={setRecoveryPhone}
                    placeholder="Backup phone (optional)"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                    style={[styles.input, { marginTop: 10 }]}
                  />
                </View>
              )}
            </ScrollView>
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
  hintLine: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textTertiary, height: 18, marginTop: 8 },
  emailNote: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textTertiary, marginTop: 16 },
  photoWrap: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 20 },
  photoBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  photoBtn: { fontFamily: fonts.medium, fontSize: 15, color: colors.accent },
  photoRemove: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
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
  rowPressed: { opacity: 0.75 },
  rowTitle: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.text },
  rowMeta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 3 },
  rowChevron: { fontFamily: fonts.regular, fontSize: 20, color: colors.textTertiary },
  semesterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  semesterBarText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  semesterSwitch: { fontFamily: fonts.bold, fontSize: 13, color: colors.accent },
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
  carrySection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  carryLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginBottom: 8 },
  carryRow: { paddingVertical: 8 },
  retakeBadge: { backgroundColor: colors.accentSoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  retakeBadgeText: { fontFamily: fonts.bold, fontSize: 9.5, letterSpacing: 0.6, color: colors.accent },
  carrySearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 13,
    marginTop: 6,
  },
  carrySearchInput: { flex: 1, paddingVertical: 11, fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  carryResult: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  examChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 18,
  },
  examChipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.accent },
  cta: { backgroundColor: colors.accent, borderRadius: 10, alignItems: 'center', paddingVertical: 15 },
  ctaDisabled: { backgroundColor: colors.surface },
  ctaText: { fontFamily: fonts.medium, fontSize: 16, color: colors.onAccent },
});
const styles = themedStyleSheet(makeStyles);
