/**
 * Wallet — real money (Franc CFA), not credits. Balance you top up with
 * Mobile Money and spend to unlock papers; you also earn money back when a
 * contributed paper is approved. The amount label (FRS / XAF) follows the
 * currency preference in Settings.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatMoney, useWallet } from '../lib/money';
import { usePrefs } from '../lib/prefs';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../theme';

export default function WalletScreen() {
  useThemeVersion();
  const router = useRouter();
  const { balance, ledger } = useWallet();
  const { currency } = usePrefs();

  return (
    <View style={styles.root}>
      <ScreenHeader title="Wallet" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balance}>{formatMoney(balance, currency)}</Text>
          <View style={styles.actions}>
            <Pressable onPress={() => router.push('/account/mobile-money')} style={styles.topUpBtn}>
              <Ionicons name="add" size={17} color={colors.onAccent} />
              <Text style={styles.topUpText}>Top up</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/contribute')} style={styles.earnBtn}>
              <Text style={styles.earnBtnText}>Earn: upload a paper</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionLabel}>ACTIVITY</Text>
        {ledger.map((entry) => (
          <View key={entry.id} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: entry.amount > 0 ? 'rgba(48,209,88,0.12)' : 'rgba(255,69,58,0.12)' }]}>
              <Ionicons
                name={entry.amount > 0 ? 'arrow-down' : 'arrow-up'}
                size={16}
                color={entry.amount > 0 ? colors.success : colors.danger}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowReason}>{entry.reason}</Text>
              <Text style={styles.rowDate}>{new Date(entry.timestamp).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.rowAmount, { color: entry.amount > 0 ? colors.success : colors.danger }]}>
              {entry.amount > 0 ? '+' : '−'}
              {formatMoney(entry.amount, currency)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  balanceCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 24,
    margin: spacing.gutter,
    paddingVertical: 30,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  balanceLabel: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.textSecondary },
  balance: { fontFamily: fonts.bold, fontSize: 44, color: colors.text },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  topUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  topUpText: { fontFamily: fonts.medium, fontSize: 14, color: colors.onAccent },
  earnBtn: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    justifyContent: 'center',
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
  rowAmount: { fontFamily: fonts.bold, fontSize: 15.5, fontVariant: ['tabular-nums'] },
});
const styles = themedStyleSheet(makeStyles);
