/**
 * Profile setup — runs once after sign-in. University, faculty,
 * department, level. This is what scopes the catalogue: a computer
 * engineering student never sees pharmacology papers.
 */
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { departmentsByFaculty, universities } from '../../data/universities';
import { faculties } from '../../data/courses';
import { setProfile } from '../../lib/session';
import { colors, fonts, spacing } from '../../theme';

const LEVELS = ['L100', 'L200', 'L300', 'L400', 'L500'];

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [university, setUniversity] = useState<string | null>(null);
  const [faculty, setFaculty] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);

  const departments = faculty ? departmentsByFaculty[faculty] ?? [] : [];
  const ready = university && faculty && department && level;

  const finish = () => {
    if (!ready) return;
    setProfile({ university: university!, faculty: faculty!, department: department!, level: level! });
    router.replace('/');
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 28, paddingBottom: insets.bottom + 30, paddingHorizontal: spacing.gutter + 6 }}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Set up your course list</Text>
      <Text style={styles.sub}>
        Revl only shows papers from your own department. You can browse the rest of campus anytime.
      </Text>

      <Field label="University">
        {universities.map((u) => (
          <Choice key={u} label={u} selected={university === u} onPress={() => setUniversity(u)} />
        ))}
      </Field>

      <Field label="Faculty">
        {faculties.map((f) => (
          <Choice
            key={f.id}
            label={f.name}
            selected={faculty === f.name}
            onPress={() => {
              setFaculty(f.name);
              setDepartment(null);
            }}
          />
        ))}
      </Field>

      {faculty && (
        <Field label="Department">
          {departments.map((d) => (
            <Choice key={d} label={d} selected={department === d} onPress={() => setDepartment(d)} />
          ))}
        </Field>
      )}

      <Field label="Level">
        {LEVELS.map((l) => (
          <Choice key={l} label={l} selected={level === l} onPress={() => setLevel(l)} />
        ))}
      </Field>

      <Pressable
        disabled={!ready}
        onPress={finish}
        style={({ pressed }) => [styles.cta, !ready && styles.ctaDisabled, pressed && { opacity: 0.85 }]}>
        <Text style={[styles.ctaText, !ready && { color: colors.textTertiary }]}>Start revising</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choices}>{children}</View>
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginTop: 10 },
  field: { marginTop: 28 },
  fieldLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, marginBottom: 12 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.card,
  },
  choiceSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  choiceText: { fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  choiceTextSelected: { fontFamily: fonts.medium, color: colors.accent },
  cta: {
    marginTop: 36,
    backgroundColor: colors.accent,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 15,
  },
  ctaDisabled: { backgroundColor: colors.surface },
  ctaText: { fontFamily: fonts.medium, fontSize: 16, color: colors.onAccent },
});
