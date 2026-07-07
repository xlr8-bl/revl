/**
 * Wallet — earned-credit economy stub. The credit count on Home lives here:
 * credits earned by contributing papers / resolving predictions, spent
 * on unlocking papers. Ledger is mocked in data/user.ts.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CreditMark } from '../components/CreditMark';
import { ScreenHeader } from '../components/ScreenHeader';
import { currentUser, ledger } from '../data/user';
import { colors, fonts, spacing } from '../theme';

export default function WalletScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <ScreenHeader title="Credits" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.balanceCard}>
          <CreditMark size={30} />
          <Text style={styles.balance}>{currentUser.credits}</Text>
          <Text style={styles.balanceLabel}>credits available</Text>
          <Pressable onPress={() => router.push('/contribute')} style={styles.earnBtn}>
            <Text style={styles.earnBtnText}>Earn more: upload a paper</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>ACTIVITY</Text>
        {ledger.map((entry) => (
          <View key={entry.id} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: entry.amount > 0 ? 'rgba(48,209,88,0.12)' : 'rgba(255,69,58,0.12)' }]}>
              <Ionicons
                name={entry.amount > 0 ? 'add' : 'remove'}
                size={16}
                color={entry.amount > 0 ? colors.success : colors.danger}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowReason}>{entry.reason}</Text>
              <Text style={styles.rowDate}>{new Date(entry.timestamp).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.rowAmount, { color: entry.amount > 0 ? colors.success : colors.danger }]}>
              {entry.amount > 0 ? '+' : ''}
              {entry.amount}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  balanceCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 24,
    margin: spacing.gutter,
    paddingVertical: 30,
    gap: 4,
  },
  balance: { fontFamily: fonts.bold, fontSize: 54, color: colors.text },
  balanceLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  earnBtn: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 16,
  },
  earnBtnText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    paddingHorizontal: spacing.gutter,
    marginTop: 14,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.gutter,
    paddingVertical: 12,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowReason: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  rowDate: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  rowAmount: { fontFamily: fonts.bold, fontSize: 17 },
});
