/**
 * Wallet — real money, not credits. The balance is held in Franc CFA
 * (the actual currency students pay in); its label is a display choice
 * ('FRS' colloquially or 'XAF' the ISO code — see prefs.currency). Top up
 * with Mobile Money, spend the balance to unlock papers, earn money back
 * when a contributed paper is approved.
 *
 * Persisted to AsyncStorage; same module-store pattern as the rest of the
 * app. The balance is always the sum of the ledger, so they can't drift.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type MoneyEntry = {
  id: string;
  /** + earned/topped-up, − spent, in FCFA. */
  amount: number;
  reason: string;
  timestamp: number;
};

const KEY = 'revl.wallet.v1';

// Seeded so the wallet isn't empty on first run; the balance is the sum.
let ledger: MoneyEntry[] = [
  { id: 'm1', amount: 2000, reason: 'Mobile Money top-up', timestamp: Date.parse('2026-05-25') },
  { id: 'm2', amount: 1000, reason: 'Uploaded CEC406 · 2022 paper (approved)', timestamp: Date.parse('2026-06-02') },
  { id: 'm3', amount: 500, reason: 'Prediction resolved: Q3 appeared in CEC412', timestamp: Date.parse('2026-06-20') },
  { id: 'm4', amount: -500, reason: 'Unlocked CEC420 · 2021 paper', timestamp: Date.parse('2026-06-28') },
];

const sum = () => ledger.reduce((n, e) => n + e.amount, 0);
let balance = sum();

const listeners = new Set<() => void>();
const emit = () => {
  ledger = [...ledger];
  balance = sum();
  listeners.forEach((l) => l());
};
const persist = () => AsyncStorage.setItem(KEY, JSON.stringify(ledger)).catch(() => {});

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) {
      ledger = JSON.parse(raw);
      balance = sum();
      emit();
    }
  })
  .catch(() => {});

export type Wallet = { balance: number; ledger: MoneyEntry[] };

export function useWallet(): Wallet {
  const snap = useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => ledger,
    () => ledger
  );
  return { balance: snap.reduce((n, e) => n + e.amount, 0), ledger: snap };
}

/** Current balance, non-reactive (for guards). */
export function walletBalance(): number {
  return balance;
}

function add(amount: number, reason: string) {
  ledger = [{ id: `m-${Date.now()}`, amount, reason, timestamp: Date.now() }, ...ledger];
  persist();
  emit();
}

export function topUp(amount: number, reason = 'Mobile Money top-up') {
  add(Math.abs(amount), reason);
}

export function earn(amount: number, reason: string) {
  add(Math.abs(amount), reason);
}

/** Spend from balance. Returns false (no-op) when funds are insufficient. */
export function spend(amount: number, reason: string): boolean {
  if (balance < amount) return false;
  add(-Math.abs(amount), reason);
  return true;
}

/* ------------------------------------------------------------------ */
/* Formatting — currency label is a user preference (FRS vs XAF).      */
/* ------------------------------------------------------------------ */

/** Group thousands with a space (Hermes Intl is unreliable): 1500 → "1 500". */
function group(n: number): string {
  return Math.round(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatMoney(amount: number, currency: 'XAF' | 'FRS' = 'FRS'): string {
  return `${group(amount)} ${currency}`;
}
