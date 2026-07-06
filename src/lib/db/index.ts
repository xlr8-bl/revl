/**
 * Web/default database entry — no SQLite on web (expo-sqlite's wasm
 * worker needs extra Metro setup), so the RevealLog store falls back to
 * its in-memory array. Native platforms resolve ./index.native.ts
 * instead, which opens the real expo-sqlite database.
 */
import type { RevlDatabase } from './types';

export function openRevlDb(): RevlDatabase | null {
  return null;
}
