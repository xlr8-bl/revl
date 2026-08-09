/**
 * Discover tab — search / explore stub, same visual system.
 * Full search + trending content lands with the backend.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, TAB_BAR_CLEARANCE, themedStyleSheet, useThemeVersion } from '../../theme';

const TRENDING = ['information gain', 'apriori', 'k-means', 'entropy', 'CEC420 2023', 'precision & recall'];

export default function DiscoverScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE }}>
      <Text style={styles.title}>Discover</Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          placeholder="Courses, topics, past questions…"
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
        />
      </View>

      <Text style={styles.sectionLabel}>TRENDING THIS WEEK</Text>
      <View style={styles.chipsWrap}>
        {TRENDING.map((t) => (
          <Pressable key={t} style={styles.chip}>
            <Text style={styles.chipText}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => router.push('/predicted/CEC420' as never)} style={styles.predictCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.predictTitle}>Predicted paper. CEC420</Text>
          <Text style={styles.predictMeta}>The most likely exam this session, question by question</Text>
        </View>
        <Text style={styles.predictChevron}>›</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.bold, fontSize: 40, color: colors.text, paddingHorizontal: spacing.gutter },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.card,
    borderRadius: 14,
    marginHorizontal: spacing.gutter,
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 16, paddingVertical: 12 },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    paddingHorizontal: spacing.gutter,
    marginTop: 32,
    marginBottom: 12,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.gutter },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: { fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  predictCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    marginHorizontal: spacing.gutter,
    marginTop: 32,
    padding: 18,
  },
  predictTitle: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  predictMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  predictChevron: { fontFamily: fonts.regular, fontSize: 19, color: colors.textTertiary },
});
const styles = themedStyleSheet(makeStyles);
