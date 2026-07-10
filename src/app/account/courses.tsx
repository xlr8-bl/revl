/**
 * Manage my courses — fix what you're enrolled in after onboarding:
 * remove a course you don't take, add ones you missed. Backed by the
 * department catalogue at your level; writes straight to the session.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { courseByCode, coursesFor } from '../../data/catalog';
import type { CatalogCourse } from '../../data/catalog/types';
import { updateProfile, useSession } from '../../lib/session';
import { sentenceCase } from '../../lib/format';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../../theme';

export default function ManageCoursesScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useSession();
  const [query, setQuery] = useState('');

  const enrolled = useMemo(() => new Set(profile?.enrolledCourseCodes ?? []), [profile]);

  const catalogue = useMemo(
    () => (profile ? coursesFor(profile.school, profile.departmentId, profile.level) : []),
    [profile]
  );

  if (!profile) return null;

  const enrolledCourses = [...enrolled]
    .map((c) => courseByCode(c))
    .filter((c): c is CatalogCourse => !!c);

  const q = query.trim().toLowerCase();
  const available = catalogue.filter(
    (c) => !enrolled.has(c.code) && (!q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q))
  );

  const toggle = (code: string) => {
    const next = new Set(enrolled);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    updateProfile({ enrolledCourseCodes: [...next] });
  };

  const label = (c: CatalogCourse) => (c.title ? sentenceCase(c.title) : `Course ${c.code}`);

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>My courses</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: spacing.gutter }}>
        <Text style={styles.deptLine}>
          {profile.departmentName} · {profile.school === 'ub' ? profile.level : 'HND'}
        </Text>

        {/* Enrolled */}
        <Text style={styles.sectionLabel}>Enrolled ({enrolledCourses.length})</Text>
        {enrolledCourses.length === 0 ? (
          <Text style={styles.empty}>No courses yet. Add some below.</Text>
        ) : (
          <View style={styles.card}>
            {enrolledCourses.map((c, i) => (
              <View key={c.code} style={[styles.row, i > 0 && styles.rowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.code}>{c.code}</Text>
                  <Text style={styles.title} numberOfLines={1}>{label(c)}</Text>
                </View>
                <Pressable onPress={() => toggle(c.code)} hitSlop={8} style={styles.removeBtn}>
                  <Ionicons name="remove-circle" size={22} color={colors.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Add */}
        <Text style={styles.sectionLabel}>Add a course</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search your department"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            autoCapitalize="characters"
          />
        </View>
        <View style={styles.card}>
          {available.length === 0 ? (
            <Text style={styles.empty}>{q ? 'No matches.' : 'You are enrolled in everything listed.'}</Text>
          ) : (
            available.slice(0, 40).map((c, i) => (
              <Pressable key={c.code} onPress={() => toggle(c.code)} style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && { opacity: 0.6 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.code}>{c.code}</Text>
                  <Text style={styles.title} numberOfLines={1}>{label(c)}</Text>
                </View>
                <Ionicons name="add-circle" size={22} color={colors.accent} />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
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
    topTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
    deptLine: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.textSecondary, marginTop: 6 },
    sectionLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.textSecondary, marginTop: 24, marginBottom: 10 },
    empty: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.textTertiary, paddingVertical: 6 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    code: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.text, letterSpacing: 0.4 },
    title: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    removeBtn: {},
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      borderRadius: 12,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    searchInput: { flex: 1, paddingVertical: 12, fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  });
const styles = themedStyleSheet(makeStyles);
